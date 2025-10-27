import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface RequestPayload {
    company_id: string;
    year: number;
    month: number;
}

Deno.serve(async (req: Request) => {
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
                    headers: { "Content-Type": "application/json" },
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
                    headers: { "Content-Type": "application/json" },
                    status: 400,
                },
            );
        }

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

        // Check if current date is the last day of the specified month
        const now = new Date();
        const targetMonth = month - 1; // JavaScript months are 0-indexed
        const targetDate = new Date(year, targetMonth);
        const lastDayOfMonth = new Date(year, targetMonth + 1, 0);

        // Check if we're at the end of the target month
        const isLastDayOfTargetMonth = now.getMonth() === targetMonth &&
            now.getFullYear() === year &&
            now.getDate() === lastDayOfMonth.getDate();

        const isPastTargetMonth = now.getFullYear() > year ||
            (now.getFullYear() === year && now.getMonth() > targetMonth);

        if (!isLastDayOfTargetMonth && !isPastTargetMonth) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Cannot generate summary - month not complete",
                    message:
                        "You can only generate summaries for months that have ended or on the last day of the current month.",
                }),
                {
                    headers: { "Content-Type": "application/json" },
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
                    headers: { "Content-Type": "application/json" },
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
                    headers: { "Content-Type": "application/json" },
                    status: 404,
                },
            );
        }

        console.log(`Found ${reviews.length} reviews for ${year}-${month}`);

        // Check if summary already exists
        const monthYear = `${year}-${String(month).padStart(2, "0")}`;
        const { data: existingSummary } = await supabaseClient
            .from("monthly_summaries")
            .select("*")
            .eq("company_id", company_id)
            .eq("month_year", monthYear)
            .single();

        if (existingSummary) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Summary already exists",
                    message:
                        "A summary for this month has already been generated.",
                }),
                {
                    headers: { "Content-Type": "application/json" },
                    status: 409,
                },
            );
        }

        // Call OpenAI to generate summary
        const reviewTexts = reviews
            .filter((r) => r.content && r.content.trim().length > 0)
            .map((r) => r.content)
            .join("\n\n");

        const summary = await callOpenAIForSummary(reviewTexts, openaiApiKey);

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

        // Insert monthly summary
        const { error: insertError } = await supabaseClient
            .from("monthly_summaries")
            .insert({
                company_id,
                month_year: monthYear,
                total_reviews: totalReviews,
                average_rating: averageRating.toFixed(2),
                sentiment_breakdown,
                summary,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

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
                headers: { "Content-Type": "application/json" },
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
                headers: { "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});

async function callOpenAIForSummary(
    reviewTexts: string,
    apiKey: string,
): Promise<string> {
    const prompt =
        `Based on the following customer reviews, generate a concise 4-6 line summary of customer sentiment for this month. Focus on key themes, common feedback, and overall customer experience. Be objective and professional.

Reviews:
${reviewTexts}

Summary:`;

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
                        content: prompt,
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
