import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface GenerateActionPlanRequest {
    objective_id: string;
    year: number;
    timespan: "q1" | "q2" | "q3" | "q4" | "all";
    rating_review_ids?: string[];
    sentiment_review_ids?: string[];
    keyword_review_ids?: Record<string, string[]>;
    topic_review_ids?: Record<string, string[]>;
}

interface GenerateActionPlanResponse {
    success: boolean;
    action_plan_id?: string;
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

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: corsHeaders,
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
        const requestBody: GenerateActionPlanRequest = await req.json();
        const {
            objective_id,
            year,
            timespan,
            rating_review_ids = [],
            sentiment_review_ids = [],
            keyword_review_ids = {},
            topic_review_ids = {},
        } = requestBody;

        // Validate required fields
        if (!objective_id || !year || !timespan) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "objective_id, year, and timespan are required",
                } as GenerateActionPlanResponse),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 400,
                },
            );
        }

        // Fetch objective to get company_id
        const { data: objective, error: objectiveError } = await supabaseClient
            .from("company_objectives")
            .select(
                "id, company_id, name, target_rating, target_sentiment_score",
            )
            .eq("id", objective_id)
            .single();

        if (objectiveError || !objective) {
            throw new Error(
                `Failed to fetch objective: ${
                    objectiveError?.message || "Objective not found"
                }`,
            );
        }

        // Fetch company name and industry
        const { data: company, error: companyError } = await supabaseClient
            .from("companies")
            .select("name, industry")
            .eq("id", objective.company_id)
            .single();

        if (companyError || !company) {
            throw new Error(
                `Failed to fetch company: ${
                    companyError?.message || "Company not found"
                }`,
            );
        }

        // Collect all unique review IDs
        const allReviewIds = new Set<string>();
        rating_review_ids.forEach((id) => allReviewIds.add(id));
        sentiment_review_ids.forEach((id) => allReviewIds.add(id));
        Object.values(keyword_review_ids).flat().forEach((id) =>
            allReviewIds.add(id)
        );
        Object.values(topic_review_ids).flat().forEach((id) =>
            allReviewIds.add(id)
        );

        if (allReviewIds.size === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No review IDs provided",
                } as GenerateActionPlanResponse),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 400,
                },
            );
        }

        // Fetch review contents
        const { data: reviews, error: reviewsError } = await supabaseClient
            .from("reviews")
            .select("id, content, rating, title, published_at")
            .in("id", Array.from(allReviewIds));

        if (reviewsError) {
            throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
        }

        if (!reviews || reviews.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No reviews found for the provided review IDs",
                } as GenerateActionPlanResponse),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 400,
                },
            );
        }

        // Generate input hash for duplicate detection
        const sortedReviewIds = Array.from(allReviewIds).sort();
        const hashInput = `${objective_id}|${year}|${timespan}|${
            sortedReviewIds.join(",")
        }`;
        const inputHash = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(hashInput),
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
            return new Response(
                JSON.stringify({
                    success: true,
                    action_plan_id: existingPlan.id,
                } as GenerateActionPlanResponse),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Get company owner's preferred language
        let preferredLanguage = "fr"; // default to French
        const { data: companyWithOwner } = await supabaseClient
            .from("companies")
            .select("owner_id")
            .eq("id", objective.company_id)
            .single();

        if (companyWithOwner?.owner_id) {
            const { data: ownerProfile } = await supabaseClient
                .from("profiles")
                .select("preferred_language")
                .eq("id", companyWithOwner.owner_id)
                .single();

            if (ownerProfile?.preferred_language) {
                preferredLanguage = ownerProfile.preferred_language;
            }
        }

        // Build failed targets description
        const failedTargets: string[] = [];
        if (rating_review_ids.length > 0 && objective.target_rating) {
            failedTargets.push(
                `Overall rating target (${objective.target_rating}) - ${rating_review_ids.length} reviews below target`,
            );
        }
        if (
            sentiment_review_ids.length > 0 &&
            objective.target_sentiment_score !== null &&
            objective.target_sentiment_score !== undefined
        ) {
            failedTargets.push(
                `Sentiment score target (${objective.target_sentiment_score}) - ${sentiment_review_ids.length} reviews below target`,
            );
        }
        if (Object.keys(keyword_review_ids).length > 0) {
            failedTargets.push(
                `Keyword targets - ${
                    Object.keys(keyword_review_ids).length
                } keywords with reviews below target`,
            );
        }
        if (Object.keys(topic_review_ids).length > 0) {
            failedTargets.push(
                `Topic targets - ${
                    Object.keys(topic_review_ids).length
                } topics with reviews below target`,
            );
        }

        // Generate action plan using OpenAI
        const reviewsText = reviews
            .map((r) => `${r.title || ""}: ${r.content}`)
            .join("\n\n");

        const actionPlanData = await generateActionPlan(
            reviewsText,
            openaiApiKey,
            reviews.length,
            preferredLanguage,
            company.name,
            company.industry || "Unknown",
            objective.name,
            failedTargets,
        );

        // Save action plan to database
        const { data: savedPlan, error: saveError } = await supabaseClient
            .from("action_plans")
            .insert({
                company_id: objective.company_id,
                source_type: "objective",
                source_id: objective_id,
                name: actionPlanData.name,
                description: actionPlanData.description,
                plan_markdown: actionPlanData.markdown,
                input_hash: inputHashHex,
                metadata: {
                    year,
                    timespan,
                },
            })
            .select("id")
            .single();

        if (saveError || !savedPlan) {
            throw new Error(
                `Failed to save action plan: ${
                    saveError?.message || "Unknown error"
                }`,
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
            } as GenerateActionPlanResponse),
            {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
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
            } as GenerateActionPlanResponse),
            {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
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
    companyName: string,
    industry: string,
    objectiveName: string,
    failedTargets: string[],
): Promise<StructuredActionPlan> {
    const languageNames: Record<string, string> = {
        "en": "English",
        "fr": "French",
    };
    const languageName = languageNames[language] || "French";

    const failedTargetsText = failedTargets.length > 0
        ? `\n\nFailed Targets:\n${
            failedTargets.map((t) => `- ${t}`).join("\n")
        }`
        : "";

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
Based on customer reviews for a company that failed to meet their objective targets, generate a structured, actionable action plan.

Company: ${companyName}
Industry: ${industry}
Objective: ${objectiveName}${failedTargetsText}

You must respond with a valid JSON object containing:
- "name": A concise name for this action plan (max 100 characters)
- "description": A brief description of what this action plan addresses (max 200 characters)
- "markdown": A full markdown-formatted action plan with clear headings and bullet points (similar to your previous format)
- "topics": An array of topic groups, each containing:
  - "topic": The topic/theme name (e.g., "Customer Service", "Product Quality")
  - "items": An array of actionable items, each with:
    - "title": A short, actionable title (max 80 characters)
    - "description": A detailed description of the action item (2-4 sentences)

Group related actionable items under meaningful topics. Aim for 2-4 topics with 2-5 items per topic.
Focus on specific, implementable recommendations based on the reviews provided.
IMPORTANT: Generate everything in ${languageName}.`,
                    },
                    {
                        role: "user",
                        content:
                            `Analyze these ${reviewCount} customer reviews that did not meet the objective targets and generate a structured action plan:

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
        if (
            !parsed.name || !parsed.description || !parsed.markdown ||
            !Array.isArray(parsed.topics)
        ) {
            throw new Error("Invalid action plan structure from OpenAI");
        }

        return parsed;
    } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        throw new Error("Failed to parse action plan JSON from OpenAI");
    }
}
