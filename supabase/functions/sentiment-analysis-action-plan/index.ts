import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface ActionPlanRequest {
    companyId: string;
    filterStartDate?: string;
    filterEndDate?: string;
    selectedSentiment?: string;
}

interface ActionPlanResponse {
    success: boolean;
    actionPlan?: string;
    error?: string;
}

interface Location {
    id: string;
    name: string;
}

interface PlatformConnection {
    id: string;
}

interface Review {
    id: string;
    content: string;
    rating: number;
    title: string;
    published_at: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers":
                    "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Get OpenAI API key
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiApiKey) {
            throw new Error("OPENAI_API_KEY environment variable is not set");
        }

        // Parse request body
        const requestBody: ActionPlanRequest = await req.json();
        const {
            companyId,
            filterStartDate,
            filterEndDate,
            selectedSentiment,
        } = requestBody;

        // Validate date range (max 3 months)
        if (filterStartDate && filterEndDate) {
            const start = new Date(filterStartDate);
            const end = new Date(filterEndDate);
            const diffMonths =
                (end.getFullYear() - start.getFullYear()) * 12 +
                (end.getMonth() - start.getMonth());
            if (diffMonths > 3) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Date range cannot exceed 3 months",
                    } as ActionPlanResponse),
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Methods": "POST, OPTIONS",
                            "Access-Control-Allow-Headers":
                                "authorization, x-client-info, apikey, content-type",
                        },
                        status: 400,
                    },
                );
            }
        }

        // Validate required filters
        if (!filterStartDate || !filterEndDate || !selectedSentiment) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "filterStartDate, filterEndDate, and selectedSentiment are required",
                } as ActionPlanResponse),
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "POST, OPTIONS",
                        "Access-Control-Allow-Headers":
                            "authorization, x-client-info, apikey, content-type",
                    },
                    status: 400,
                },
            );
        }

        // Fetch locations for the company
        const { data: locationsData, error: locationsError } =
            await supabaseClient
                .from("locations")
                .select("id, name")
                .eq("company_id", companyId);

        if (locationsError) {
            throw new Error(
                `Failed to fetch locations: ${locationsError.message}`,
            );
        }

        if (!locationsData || locationsData.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No locations found for this company",
                } as ActionPlanResponse),
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "POST, OPTIONS",
                        "Access-Control-Allow-Headers":
                            "authorization, x-client-info, apikey, content-type",
                    },
                    status: 400,
                },
            );
        }

        // Get all location IDs (no location filtering for action plan)
        const locationIds = locationsData.map((loc) => loc.id);

        // Get platform connections for these locations
        const { data: platformConnections, error: pcError } =
            await supabaseClient
                .from("platform_connections")
                .select("id")
                .in("location_id", locationIds);

        if (pcError) {
            throw new Error(
                `Failed to fetch platform connections: ${pcError.message}`,
            );
        }

        const platformConnectionIds = platformConnections?.map((pc) => pc.id) ||
            [];

        if (platformConnectionIds.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No platform connections found",
                } as ActionPlanResponse),
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "POST, OPTIONS",
                        "Access-Control-Allow-Headers":
                            "authorization, x-client-info, apikey, content-type",
                    },
                    status: 400,
                },
            );
        }

        // First, get review IDs that match the date range and platform connections
        const { data: reviewsData, error: reviewsError } = await supabaseClient
            .from("reviews")
            .select("id, content, rating, title, published_at")
            .in("platform_connection_id", platformConnectionIds)
            .gte("published_at", filterStartDate!)
            .lte("published_at", filterEndDate!)
            .limit(1000);

        if (reviewsError) {
            throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
        }

        if (!reviewsData || reviewsData.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No reviews found matching the date range",
                } as ActionPlanResponse),
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "POST, OPTIONS",
                        "Access-Control-Allow-Headers":
                            "authorization, x-client-info, apikey, content-type",
                    },
                    status: 400,
                },
            );
        }

        // Get sentiment analysis for these reviews
        const reviewIds = reviewsData.map((r) => r.id);
        const { data: sentimentData, error: sentimentError } =
            await supabaseClient
                .from("sentiment_analysis")
                .select("review_id, sentiment")
                .in("review_id", reviewIds)
                .eq("sentiment", selectedSentiment!);

        if (sentimentError) {
            throw new Error(
                `Failed to fetch sentiment analysis: ${sentimentError.message}`,
            );
        }

        // Filter reviews by sentiment
        const sentimentReviewIds = new Set(
            sentimentData?.map((s) => s.review_id) || [],
        );
        const filteredReviews = reviewsData.filter((r) =>
            sentimentReviewIds.has(r.id),
        ) as Review[];

        if (filteredReviews.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No reviews match the selected filters",
                } as ActionPlanResponse),
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "POST, OPTIONS",
                        "Access-Control-Allow-Headers":
                            "authorization, x-client-info, apikey, content-type",
                    },
                    status: 400,
                },
            );
        }

        // Get company owner's preferred language
        let preferredLanguage = "fr"; // default to French
        const { data: company } = await supabaseClient
            .from("companies")
            .select("owner_id")
            .eq("id", companyId)
            .single();

        if (company?.owner_id) {
            const { data: ownerProfile } = await supabaseClient
                .from("profiles")
                .select("preferred_language")
                .eq("id", company.owner_id)
                .single();

            if (ownerProfile?.preferred_language) {
                preferredLanguage = ownerProfile.preferred_language;
            }
        }

        // Generate action plan using OpenAI
        const reviewsText = filteredReviews
            .map((r) => `${r.title || ""}: ${r.content}`)
            .join("\n\n");

        const actionPlan = await generateActionPlan(
            reviewsText,
            openaiApiKey,
            filteredReviews.length,
            preferredLanguage,
        );

        return new Response(
            JSON.stringify({
                success: true,
                actionPlan,
            } as ActionPlanResponse),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers":
                        "authorization, x-client-info, apikey, content-type",
                },
            },
        );
    } catch (error) {
        console.error("Error generating action plan:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error";

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
            } as ActionPlanResponse),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers":
                        "authorization, x-client-info, apikey, content-type",
                },
                status: 500,
            },
        );
    }
});

async function generateActionPlan(
    reviewsText: string,
    apiKey: string,
    reviewCount: number,
    language: string = "fr",
): Promise<string> {
    const languageNames: Record<string, string> = {
        "en": "English",
        "fr": "French",
    };
    const languageName = languageNames[language] || "French";
    const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            `You are a business consultant specializing in customer experience analysis. 
Based on customer reviews, generate actionable recommendations for business improvement.

Your response should be structured as follows:

## Overall Assessment
Brief summary of overall customer sentiment based on ${reviewCount} reviews.

## Strengths
List 3-5 key positive points mentioned by customers.

## Areas for Improvement
List 3-5 areas where customers express concerns or dissatisfaction.

## Priority Action Items
Ranked list of the most important issues to address, with specific recommendations.

## Quick Wins
Easy, low-cost improvements that can be implemented immediately.

Keep the tone professional and actionable. Be specific with recommendations.
Format the response using clear markdown headings and bullet points.
IMPORTANT: Generate the entire action plan in ${languageName}.`,
                    },
                    {
                        role: "user",
                        content:
                            `Analyze these ${reviewCount} customer reviews and generate an action plan:

${reviewsText}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1500,
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
    const actionPlan = openaiData.choices?.[0]?.message?.content;

    if (!actionPlan) {
        throw new Error("No action plan generated by OpenAI");
    }

    return actionPlan;
}
