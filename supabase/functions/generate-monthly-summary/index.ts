import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface RequestPayload {
    company_id: string;
    year: number;
    month: number;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Check request method
        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Method not allowed",
                    message: "Only POST requests are supported",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 405,
                },
            );
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Get OpenAI API key
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiApiKey) {
            throw new Error("OPENAI_API_KEY environment variable is not set");
        }

        // Parse request payload
        let payload: RequestPayload;
        try {
            payload = await req.json();
        } catch (parseError) {
            console.error("Error parsing request body:", parseError);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Invalid request body",
                    message: "Request body must be valid JSON",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 400,
                },
            );
        }

        console.log("Payload:", payload);

        const { company_id, year, month } = payload;

        if (!company_id || !year || !month) {
            throw new Error(
                "Missing required parameters: company_id, year, month",
            );
        }

        // Validate month
        if (month < 1 || month > 12) {
            throw new Error("Invalid month. Must be between 1 and 12");
        }

        console.log(
            `Generating summary for company ${company_id}, ${year}-${month}`,
        );

        // Check if we should allow generation based on new conditions
        const now = new Date();
        const targetMonth = month - 1; // JavaScript months are 0-indexed

        const isCurrentMonth = now.getMonth() === targetMonth &&
            now.getFullYear() === year;
        const isPastTargetMonth = now.getFullYear() > year ||
            (now.getFullYear() === year && now.getMonth() > targetMonth);

        // New conditions: allow if past the 15th OR on/after the 28th of current month, OR past month
        const currentDay = now.getDate();
        const allowCurrentMonthGeneration = isCurrentMonth &&
            (currentDay > 15 || currentDay >= 28);

        if (!allowCurrentMonthGeneration && !isPastTargetMonth) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Cannot generate summary - month not eligible",
                    message:
                        "You can only generate summaries for months that have ended, or for the current month after the 15th or on/after the 28th.",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 400,
                },
            );
        }

        // Get all reviews for this company in the specified month/year
        const startDate = new Date(year, targetMonth, 1).toISOString();
        const endDate = new Date(year, targetMonth + 1, 0, 23, 59, 59, 999)
            .toISOString();

        console.log(`Fetching reviews between ${startDate} and ${endDate}`);

        // Get platform connections for this company
        const { data: locations, error: locationsError } = await supabaseClient
            .from("locations")
            .select("id")
            .eq("company_id", company_id)
            .eq("is_active", true);

        if (locationsError) {
            throw new Error(
                `Error fetching locations: ${locationsError.message}`,
            );
        }

        if (!locations || locations.length === 0) {
            throw new Error("No active locations found for this company");
        }

        const locationIds = locations.map((loc) => loc.id);

        // Get platform connections for these locations
        const { data: platformConnections, error: pcError } =
            await supabaseClient
                .from("platform_connections")
                .select("id")
                .in("location_id", locationIds)
                .eq("is_active", true);

        if (pcError) {
            throw new Error(
                `Error fetching platform connections: ${pcError.message}`,
            );
        }

        if (!platformConnections || platformConnections.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No reviews found",
                    message:
                        "No platform connections found for this company. Connect a platform first.",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 404,
                },
            );
        }

        const platformConnectionIds = platformConnections.map((pc) => pc.id);

        // Get reviews for the specified month
        const { data: reviews, error: reviewsError } = await supabaseClient
            .from("reviews")
            .select("id, content, rating, published_at")
            .in("platform_connection_id", platformConnectionIds)
            .gte("published_at", startDate)
            .lte("published_at", endDate)
            .order("published_at", { ascending: false });

        if (reviewsError) {
            throw new Error(`Error fetching reviews: ${reviewsError.message}`);
        }

        if (!reviews || reviews.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No reviews found",
                    message: `No reviews found for ${year}-${
                        String(month).padStart(2, "0")
                    }`,
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 404,
                },
            );
        }

        console.log(`Found ${reviews.length} reviews for ${year}-${month}`);

        // Check if summary already exists and when it was last generated
        const monthYear = `${year}-${String(month).padStart(2, "0")}`;
        const { data: existingSummary } = await supabaseClient
            .from("monthly_summaries")
            .select("*")
            .eq("company_id", company_id)
            .eq("month_year", monthYear)
            .single();

        if (existingSummary) {
            // Check if it's been at least 10 days since last generation
            const lastGenerated = new Date(
                existingSummary.updated_at || existingSummary.created_at,
            );
            const daysSinceGeneration = Math.floor(
                (now.getTime() - lastGenerated.getTime()) /
                    (1000 * 60 * 60 * 24),
            );

            if (daysSinceGeneration < 10) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Summary already exists",
                        message:
                            "A summary for this month was generated recently. Please wait at least 10 days before regenerating.",
                        existing_summary: existingSummary,
                    }),
                    {
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                        status: 409,
                    },
                );
            }
        }

        // Fetch previous month's summary for comparison
        let previousMonthSummary = null;
        const previousMonth = month === 1 ? 12 : month - 1;
        const previousYear = month === 1 ? year - 1 : year;
        const previousMonthYear = `${previousYear}-${
            String(previousMonth).padStart(2, "0")
        }`;

        const { data: prevSummary } = await supabaseClient
            .from("monthly_summaries")
            .select(
                "summary, total_reviews, average_rating, sentiment_breakdown",
            )
            .eq("company_id", company_id)
            .eq("month_year", previousMonthYear)
            .single();

        if (prevSummary) {
            previousMonthSummary = {
                month_year: previousMonthYear,
                total_reviews: prevSummary.total_reviews,
                average_rating: prevSummary.average_rating,
                sentiment_breakdown: prevSummary.sentiment_breakdown,
                summary: prevSummary.summary,
            };
        }

        // Call OpenAI to generate summary
        const reviewTexts = reviews
            .filter((r) => r.content && r.content.trim().length > 0)
            .map((r) => r.content)
            .join("\n\n");

        const summary = await callOpenAIForSummary(
            reviewTexts,
            openaiApiKey,
            previousMonthSummary,
        );

        // Calculate statistics
        const totalReviews = reviews.length;
        const ratings = reviews.map((r) => r.rating);
        const averageRating = ratings.reduce((sum, r) => sum + Number(r), 0) /
            totalReviews;

        // Calculate sentiment breakdown (simplified - we'll use positive/negative based on rating)
        const positiveCount = ratings.filter((r) => Number(r) >= 4).length;
        const neutralCount = ratings.filter((r) => Number(r) === 3).length;
        const negativeCount = ratings.filter((r) => Number(r) <= 2).length;

        const sentimentBreakdown = {
            positive: positiveCount,
            neutral: neutralCount,
            negative: negativeCount,
        };

        // Insert or update monthly summary
        const summaryData = {
            company_id,
            month_year: monthYear,
            total_reviews: totalReviews,
            average_rating: averageRating.toFixed(2),
            sentiment_breakdown: sentimentBreakdown,
            summary,
            updated_at: new Date().toISOString(),
        };

        let insertError;
        if (existingSummary) {
            // Update existing summary
            const { error } = await supabaseClient
                .from("monthly_summaries")
                .update(summaryData)
                .eq("id", existingSummary.id);
            insertError = error;
        } else {
            // Insert new summary
            const { error } = await supabaseClient
                .from("monthly_summaries")
                .insert({
                    ...summaryData,
                    created_at: new Date().toISOString(),
                });
            insertError = error;
        }

        if (insertError) {
            throw new Error(`Error inserting summary: ${insertError.message}`);
        }

        console.log(
            `Successfully generated summary for ${company_id}, ${monthYear}`,
        );

        return new Response(
            JSON.stringify({
                success: true,
                message: "Summary generated successfully",
                data: {
                    month_year: monthYear,
                    total_reviews: totalReviews,
                    average_rating: averageRating.toFixed(2),
                    summary,
                },
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error in generate-monthly-summary:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error";

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});

interface PreviousMonthSummary {
    month_year: string;
    total_reviews: number;
    average_rating: string | number;
    sentiment_breakdown: {
        positive: number;
        neutral: number;
        negative: number;
    };
    summary: string | null;
}

async function callOpenAIForSummary(
    reviewTexts: string,
    apiKey: string,
    previousMonthSummary?: PreviousMonthSummary | null,
): Promise<string> {
    let prompt =
        `Based on the following customer reviews, generate a concise 4-6 line summary of customer sentiment for this month. Focus on key themes, common feedback, and overall customer experience. Be objective and professional.`;

    if (previousMonthSummary) {
        prompt +=
            `\n\nPrevious Month Summary (${previousMonthSummary.month_year}):
Total Reviews: ${previousMonthSummary.total_reviews}
Average Rating: ${previousMonthSummary.average_rating}/5.0
Positive: ${previousMonthSummary.sentiment_breakdown.positive}, Neutral: ${previousMonthSummary.sentiment_breakdown.neutral}, Negative: ${previousMonthSummary.sentiment_breakdown.negative}
Summary: ${previousMonthSummary.summary}

Compare this month's reviews with the previous month and highlight any notable changes, trends, or improvements.`;
    }

    prompt += `\n\nCurrent Month Reviews:
${reviewTexts}

Summary:`;

    const fullPrompt = prompt;

    const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a helpful assistant that analyzes customer reviews and provides concise, professional summaries.",
                    },
                    {
                        role: "user",
                        content: fullPrompt,
                    },
                ],
                temperature: 0.3,
                max_tokens: 500,
            }),
        },
    );

    if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        throw new Error(
            `OpenAI API error: ${openaiResponse.status} ${errorText}`,
        );
    }

    const openaiData = await openaiResponse.json();
    const summaryText = openaiData.choices?.[0]?.message?.content;

    if (!summaryText) {
        throw new Error("No summary returned from OpenAI");
    }

    return summaryText.trim();
}
