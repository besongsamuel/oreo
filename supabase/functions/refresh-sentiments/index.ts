import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface KeywordResult {
    text: string;
    category: string;
    relevance: number;
}

interface TopicResult {
    name: string;
    category: "satisfaction" | "dissatisfaction" | "neutral";
    description: string;
    relevance: number;
}

interface EnhancedAnalysisResult {
    sentiment: "positive" | "negative" | "neutral" | "mixed";
    score: number;
    emotions?: string[];
    keywords: KeywordResult[];
    topics: TopicResult[];
}

interface ProcessedReview {
    id: string;
    content: string;
    rating: number;
    platform_connection_id: string;
}

interface LocationData {
    company_id: string;
}

/**
 * Wait for rate limit before making OpenAI API call
 * Uses database to track requests across function invocations
 */
async function waitForRateLimit(
    supabaseClient: SupabaseClient,
    maxRequestsPerMinute: number = 200,
): Promise<void> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const { data: recentRequests, error } = await supabaseClient
        .from("openai_rate_limit_log")
        .select("created_at")
        .gte("created_at", oneMinuteAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(maxRequestsPerMinute);

    if (error) {
        console.warn(
            `Error checking rate limit: ${error.message}, continuing anyway`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return;
    }

    const requestCount = recentRequests?.length || 0;

    if (requestCount >= maxRequestsPerMinute) {
        const oldestRequest = recentRequests?.[recentRequests.length - 1];
        if (oldestRequest) {
            const oldestTime = new Date(oldestRequest.created_at).getTime();
            const elapsed = now.getTime() - oldestTime;
            const waitTime = Math.max(0, 61000 - elapsed);

            if (waitTime > 0) {
                console.log(
                    `Rate limit: ${requestCount}/${maxRequestsPerMinute} requests. Waiting ${
                        Math.round(waitTime / 1000)
                    }s`,
                );
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
        }
    } else {
        const jitter = Math.random() * 2000;
        await new Promise((resolve) => setTimeout(resolve, jitter));
    }

    await supabaseClient
        .from("openai_rate_limit_log")
        .insert({ created_at: now.toISOString() });

    if (Math.random() < 0.01) {
        try {
            await supabaseClient.rpc("cleanup_openai_rate_limit_log");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error
                ? err.message
                : "Unknown error";
            console.warn("Cleanup failed (non-critical):", errorMessage);
        }
    }
}

async function callOpenAIForAnalysis(
    content: string,
    apiKey: string,
    language: string = "fr",
    supabaseClient?: SupabaseClient,
): Promise<EnhancedAnalysisResult> {
    if (supabaseClient) {
        await waitForRateLimit(supabaseClient, 200);
    }

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
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content:
                            `Analyze this review and return a JSON object with:

1. sentiment: one of "positive", "negative", "neutral", or "mixed"
2. score: number from 1-100 (1=very negative, 50=neutral, 100=very positive)
3. emotions: array of emoticons representing emotions (optional)
4. keywords: array of objects with:
   - text: the keyword/phrase (MUST be 1-2 words maximum, generate in ${languageName})
   - category: one of "service", "food", "ambiance", "price", "quality", "cleanliness", "staff", "other"
   - relevance: number from 0-1 indicating importance
5. topics: array of objects with:
   - name: brief topic name (MUST be 1-2 words maximum, generate in ${languageName})
   - category: one of "satisfaction", "dissatisfaction", "neutral"
   - description: brief description (generate in ${languageName})
   - relevance: number from 0-1

IMPORTANT: All keywords, topics, and descriptions MUST be in ${languageName}`,
                    },
                    {
                        role: "user",
                        content: `Review text: "${content}"`,
                    },
                ],
                temperature: 0.3,
                max_tokens: 500,
            }),
        },
    );

    if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        const error: any = new Error(
            `OpenAI API error: ${openaiResponse.status} ${errorText}`,
        );
        error.statusCode = openaiResponse.status;
        throw error;
    }

    const openaiData = await openaiResponse.json();
    const analysisText = openaiData.choices?.[0]?.message?.content;

    if (!analysisText) {
        throw new Error("No analysis returned from OpenAI");
    }

    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("No JSON found in OpenAI response");
    }

    const analysisResult: EnhancedAnalysisResult = JSON.parse(jsonMatch[0]);

    if (!analysisResult.sentiment || !analysisResult.score) {
        throw new Error("Invalid analysis result: missing sentiment or score");
    }

    if (!analysisResult.keywords) analysisResult.keywords = [];
    if (!analysisResult.topics) analysisResult.topics = [];

    return analysisResult;
}

async function processKeywords(
    supabaseClient: SupabaseClient,
    reviewId: string,
    platformConnectionId: string,
    keywords: KeywordResult[],
): Promise<number> {
    let processed = 0;

    for (const kw of keywords) {
        const normalizedText = kw.text.toUpperCase().trim();

        const { data: existingKeyword } = await supabaseClient
            .from("keywords")
            .select("id")
            .eq("normalized_text", normalizedText)
            .maybeSingle();

        let keywordId;
        if (existingKeyword) {
            keywordId = existingKeyword.id;
        } else {
            const { data: newKeyword, error } = await supabaseClient
                .from("keywords")
                .insert({
                    text: kw.text || "unknown",
                    normalized_text: normalizedText,
                    category: kw.category || "other",
                    language: "en",
                })
                .select("id")
                .single();

            if (error) throw error;
            keywordId = newKeyword.id;
        }

        await supabaseClient
            .from("review_keywords")
            .insert({
                review_id: reviewId,
                keyword_id: keywordId,
                platform_connection_id: platformConnectionId,
                frequency: 1,
                relevance_score: kw.relevance || 0.5,
            });

        processed++;
    }

    return processed;
}

async function processTopics(
    supabaseClient: SupabaseClient,
    platformConnectionId: string,
    reviewId: string,
    topics: TopicResult[],
): Promise<number> {
    let processed = 0;

    const { data: connectionData } = await supabaseClient
        .from("platform_connections")
        .select("location_id, locations!inner(company_id)")
        .eq("id", platformConnectionId)
        .single();

    if (!connectionData) {
        throw new Error("Platform connection not found");
    }

    const companyId =
        (connectionData.locations as unknown as LocationData).company_id;

    for (const topic of topics) {
        const { data: existingTopic } = await supabaseClient
            .from("topics")
            .select("id, occurrence_count, sentiment_distribution, keywords")
            .eq("company_id", companyId)
            .eq("name", topic.name)
            .maybeSingle();

        let topicId;
        if (existingTopic) {
            const newCount = existingTopic.occurrence_count + 1;
            const sentDist = existingTopic.sentiment_distribution || {};
            sentDist["positive"] = (sentDist["positive"] || 0) + 1;

            const topicKeywords = new Set([
                ...(existingTopic.keywords || []),
                ...topics.map((t) => t.name),
            ]);

            await supabaseClient
                .from("topics")
                .update({
                    occurrence_count: newCount,
                    sentiment_distribution: sentDist,
                    keywords: Array.from(topicKeywords),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existingTopic.id);

            topicId = existingTopic.id;
        } else {
            const { data: newTopic, error } = await supabaseClient
                .from("topics")
                .insert({
                    company_id: companyId,
                    name: topic.name || "Unknown Topic",
                    category: topic.category || "neutral",
                    description: topic.description || "",
                    keywords: topics.map((t) => t.name || "unknown"),
                    occurrence_count: 1,
                    sentiment_distribution: { positive: 1 },
                    is_active: true,
                })
                .select("id")
                .single();

            if (error) throw error;
            topicId = newTopic.id;
        }

        await supabaseClient
            .from("review_topics")
            .insert({
                review_id: reviewId,
                topic_id: topicId,
                platform_connection_id: platformConnectionId,
                relevance_score: topic.relevance || 0.5,
            });

        processed++;
    }

    return processed;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get auth token from request
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Missing authorization",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 401,
                },
            );
        }

        // Initialize Supabase client for auth verification (with user context)
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAuthClient = createClient(
            supabaseUrl,
            supabaseServiceKey,
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            },
        );

        // Initialize separate Supabase client for data operations (service role only)
        // This bypasses RLS policies for background processing
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Verify user is authenticated
        const {
            data: { user },
            error: authError,
        } = await supabaseAuthClient.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized" }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 401,
                },
            );
        }

        // Get OpenAI API key
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiApiKey) {
            throw new Error("OPENAI_API_KEY environment variable is not set");
        }

        // Parse request body
        const { company_id } = await req.json();
        if (!company_id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "company_id is required",
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

        // Verify user owns the company
        const { data: company, error: companyError } = await supabaseClient
            .from("companies")
            .select("owner_id")
            .eq("id", company_id)
            .single();

        if (companyError || !company || company.owner_id !== user.id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Company not found or access denied",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 403,
                },
            );
        }

        // Get user's preferred language
        let preferredLanguage = "fr";
        const { data: ownerProfile } = await supabaseClient
            .from("profiles")
            .select("preferred_language")
            .eq("id", user.id)
            .single();

        if (ownerProfile?.preferred_language) {
            preferredLanguage = ownerProfile.preferred_language;
        }

        // Get total count of unprocessed reviews
        const { data: totalUnprocessedCount } = await supabaseClient.rpc(
            "get_unprocessed_reviews_count",
            {
                company_uuid: company_id,
            },
        );

        // Get up to 100 reviews without sentiment analysis using RPC function
        // This avoids URL length issues and processes in batches
        const { data: unprocessedReviews, error: reviewsError } =
            await supabaseClient.rpc("get_unprocessed_reviews", {
                company_uuid: company_id,
            });

        if (reviewsError) {
            throw new Error(`Error fetching reviews: ${reviewsError.message}`);
        }

        if (!unprocessedReviews || unprocessedReviews.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "No unprocessed reviews found",
                    processed: 0,
                    skipped: 0,
                    errors: 0,
                    total: 0,
                    remaining: 0,
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 200,
                },
            );
        }

        const totalCount = totalUnprocessedCount || 0;
        console.log(
            `Processing ${unprocessedReviews.length} of ${totalCount} unprocessed reviews for company ${company_id}`,
        );

        // Process each review
        let processed = 0;
        let skipped = 0;
        let errors = 0;

        for (const review of unprocessedReviews) {
            try {
                console.log(`Processing review ${review.id}...`);

                // Call OpenAI for analysis
                const analysisResult = await callOpenAIForAnalysis(
                    review.content,
                    openaiApiKey,
                    preferredLanguage,
                    supabaseClient,
                );

                // Insert sentiment analysis with default values for nullable fields
                const { error: sentimentError } = await supabaseClient
                    .from("sentiment_analysis")
                    .insert({
                        review_id: review.id,
                        sentiment: analysisResult.sentiment || "neutral",
                        sentiment_score: analysisResult.score
                            ? (analysisResult.score - 50) / 50
                            : 0,
                        emotions: analysisResult.emotions
                            ? { emoticons: analysisResult.emotions }
                            : {},
                        confidence: 0.85,
                    });

                if (sentimentError) {
                    console.error(
                        `Error inserting sentiment for review ${review.id} ${
                            JSON.stringify(analysisResult, null, 2)
                        }:`,
                        JSON.stringify(sentimentError, null, 2),
                    );
                    errors++;
                    continue;
                }

                // Process keywords
                await processKeywords(
                    supabaseClient,
                    review.id,
                    review.platform_connection_id,
                    analysisResult.keywords,
                );

                // Process topics
                await processTopics(
                    supabaseClient,
                    review.platform_connection_id,
                    review.id,
                    analysisResult.topics,
                );

                processed++;
                console.log(`Successfully processed review ${review.id}`);
            } catch (error: any) {
                // Handle 429 rate limit errors
                if (error.statusCode === 429) {
                    console.warn(
                        `Rate limit hit for review ${review.id}, skipping...`,
                    );
                    skipped++;
                    continue;
                }

                // Handle other errors
                console.error(`Error processing review ${review.id}:`, error);
                errors++;
            }
        }

        const total = unprocessedReviews.length;
        const remaining = Math.max(0, totalCount - processed);

        console.log(
            `Completed: ${processed} processed, ${skipped} skipped, ${errors} errors out of ${total} in this batch. ${remaining} reviews remaining.`,
        );

        return new Response(
            JSON.stringify({
                success: true,
                processed,
                skipped,
                errors,
                total,
                remaining,
                totalUnprocessed: totalCount,
                message: remaining > 0
                    ? `Processed ${processed} reviews successfully. ${remaining} reviews remaining - click again to process more.`
                    : `Processed ${processed} reviews successfully. All reviews processed!`,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error in refresh-sentiments:", error);
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
