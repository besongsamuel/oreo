import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface ActionPlanRequest {
    companyId: string;
    filterLocation?: string;
    filterStartDate?: string;
    filterEndDate?: string;
    selectedKeyword?: string;
    selectedRating?: string;
    selectedTopic?: string;
}

interface ActionPlanResponse {
    success: boolean;
    actionPlan?: string;
    error?: string;
}

Deno.serve(async (req: Request) => {
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
            filterLocation,
            filterStartDate,
            filterEndDate,
            selectedKeyword,
            selectedRating,
            selectedTopic,
        } = requestBody;

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
                    headers: { "Content-Type": "application/json" },
                    status: 400,
                },
            );
        }

        // Filter locations if needed
        let locationIds = locationsData.map((loc: any) => loc.id);
        if (filterLocation && filterLocation !== "all") {
            const filteredLocs = locationsData.filter(
                (loc: any) => loc.name === filterLocation,
            );
            locationIds = filteredLocs.map((loc: any) => loc.id);
        }

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

        const platformConnectionIds = platformConnections?.map((pc: any) =>
            pc.id
        ) || [];

        if (platformConnectionIds.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No platform connections found",
                } as ActionPlanResponse),
                {
                    headers: { "Content-Type": "application/json" },
                    status: 400,
                },
            );
        }

        // Fetch reviews
        let reviewsQuery = supabaseClient
            .from("reviews")
            .select(
                `
        id,
        content,
        rating,
        title,
        published_at
      `,
            )
            .in("platform_connection_id", platformConnectionIds)
            .limit(100);

        // Apply date filters
        if (filterStartDate) {
            reviewsQuery = reviewsQuery.gte("published_at", filterStartDate);
        }
        if (filterEndDate) {
            reviewsQuery = reviewsQuery.lte("published_at", filterEndDate);
        }

        const { data: reviewsData, error: reviewsError } = await reviewsQuery;

        if (reviewsError) {
            throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
        }

        if (!reviewsData || reviewsData.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No reviews found matching the filters",
                } as ActionPlanResponse),
                {
                    headers: { "Content-Type": "application/json" },
                    status: 400,
                },
            );
        }

        // Filter reviews by keyword and topic (client-side filtering)
        let filteredReviews = reviewsData;
        if (selectedKeyword && selectedKeyword !== "all") {
            filteredReviews = filteredReviews.filter((review: any) => {
                const content = `${review.content || ""} ${review.title || ""}`
                    .toLowerCase();
                return content.includes(selectedKeyword.toLowerCase());
            });
        }

        if (selectedTopic && selectedTopic !== "all") {
            filteredReviews = filteredReviews.filter((review: any) => {
                const content = `${review.content || ""} ${review.title || ""}`
                    .toLowerCase();
                return content.includes(selectedTopic.toLowerCase());
            });
        }

        if (selectedRating && selectedRating !== "all") {
            filteredReviews = filteredReviews.filter((review: any) => {
                return Math.floor(review.rating) === Number(selectedRating);
            });
        }

        if (filteredReviews.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No reviews match the selected filters",
                } as ActionPlanResponse),
                {
                    headers: { "Content-Type": "application/json" },
                    status: 400,
                },
            );
        }

        // Generate action plan using OpenAI
        const reviewsText = filteredReviews
            .map((r: any) => `${r.title || ""}: ${r.content}`)
            .join("\n\n");

        const actionPlan = await generateActionPlan(
            reviewsText,
            openaiApiKey,
            filteredReviews.length,
        );

        return new Response(
            JSON.stringify({
                success: true,
                actionPlan,
            } as ActionPlanResponse),
            { headers: { "Content-Type": "application/json" } },
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
                headers: { "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});

async function generateActionPlan(
    reviewsText: string,
    apiKey: string,
    reviewCount: number,
): Promise<string> {
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
Format the response using clear markdown headings and bullet points.`,
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
