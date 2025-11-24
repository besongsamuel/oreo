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
    action_plan_id?: string;
    actionPlan?: string;
    error?: string;
}

interface StructuredActionPlan {
    name: string;
    description: string;
    markdown: string;
    topics: Array<{
        topic: string;
        items: Array<{
            title: string;
            description: string;
        }>;
    }>;
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

        // Generate input hash for duplicate detection
        const hashInput = `${companyId}|${filterStartDate}|${filterEndDate}|${selectedSentiment}`;
        const inputHash = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(hashInput)
        );
        const inputHashHex = Array.from(new Uint8Array(inputHash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        // Check if action plan already exists by hash
        const { data: existingPlan } = await supabaseClient
            .from("action_plans")
            .select("id")
            .eq("input_hash", inputHashHex)
            .single();

        if (existingPlan) {
            // Fetch the markdown for the response
            const { data: planData } = await supabaseClient
                .from("action_plans")
                .select("plan_markdown")
                .eq("id", existingPlan.id)
                .single();

            return new Response(
                JSON.stringify({
                    success: true,
                    action_plan_id: existingPlan.id,
                    actionPlan: planData?.plan_markdown || "",
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

        const actionPlanData = await generateActionPlan(
            reviewsText,
            openaiApiKey,
            filteredReviews.length,
            preferredLanguage,
        );

        // Save action plan to database
        const { data: savedPlan, error: saveError } = await supabaseClient
            .from("action_plans")
            .insert({
                company_id: companyId,
                source_type: "sentiment",
                source_id: null,
                name: actionPlanData.name,
                description: actionPlanData.description,
                plan_markdown: actionPlanData.markdown,
                input_hash: inputHashHex,
                metadata: {
                    filterStartDate,
                    filterEndDate,
                    selectedSentiment,
                },
            })
            .select("id")
            .single();

        if (saveError || !savedPlan) {
            throw new Error(
                `Failed to save action plan: ${saveError?.message || "Unknown error"}`,
            );
        }

        // Save action plan items
        let orderIndex = 0;
        for (const topicData of actionPlanData.topics) {
            for (const item of topicData.items) {
                const { error: itemError } = await supabaseClient
                    .from("action_plan_items")
                    .insert({
                        action_plan_id: savedPlan.id,
                        topic: topicData.topic,
                        title: item.title,
                        description: item.description,
                        order_index: orderIndex++,
                    });

                if (itemError) {
                    console.error("Error saving action plan item:", itemError);
                    // Continue with other items even if one fails
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                action_plan_id: savedPlan.id,
                actionPlan: actionPlanData.markdown,
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
): Promise<StructuredActionPlan> {
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
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content:
                            `You are a business consultant specializing in customer experience analysis. 
Based on customer reviews, generate actionable recommendations for business improvement.

You must respond with a valid JSON object containing:
- "name": A concise name for this action plan (max 100 characters)
- "description": A brief description of what this action plan addresses (max 200 characters)
- "markdown": A full markdown-formatted action plan structured as follows:
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
- "topics": An array of topic groups, each containing:
  - "topic": The topic/theme name (e.g., "Customer Service", "Product Quality", "Response Time")
  - "items": An array of actionable items, each with:
    - "title": A short, actionable title (max 80 characters)
    - "description": A detailed description of the action item (2-4 sentences)

Group related actionable items under meaningful topics. Aim for 2-4 topics with 2-5 items per topic.
Focus on specific, implementable recommendations based on the reviews provided.
Keep the tone professional and actionable. Be specific with recommendations.
IMPORTANT: Generate everything in ${languageName}.`,
                    },
                    {
                        role: "user",
                        content:
                            `Analyze these ${reviewCount} customer reviews and generate a structured action plan:

${reviewsText}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
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
    const responseContent = openaiData.choices?.[0]?.message?.content;

    if (!responseContent) {
        throw new Error("No action plan generated by OpenAI");
    }

    try {
        const parsed = JSON.parse(responseContent) as StructuredActionPlan;
        
        // Validate structure
        if (!parsed.name || !parsed.description || !parsed.markdown || !Array.isArray(parsed.topics)) {
            throw new Error("Invalid action plan structure from OpenAI");
        }

        return parsed;
    } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        throw new Error("Failed to parse action plan JSON from OpenAI");
    }
}
