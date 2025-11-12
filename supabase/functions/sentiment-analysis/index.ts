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

interface BatchAnalysisResult {
    reviewId: string;
    analysis: EnhancedAnalysisResult;
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

async function callOpenAIForBatchAnalysis(
    reviews: ProcessedReview[],
    apiKey: string,
    language: string = "fr",
    supabaseClient?: SupabaseClient,
): Promise<BatchAnalysisResult[]> {
    // Separate reviews with and without content
    const reviewsWithContent = reviews.filter((r) =>
        r.content && r.content.trim().length > 0
    );
    const reviewsWithoutContent = reviews.filter((r) =>
        !r.content || r.content.trim().length === 0
    );

    console.log(
        `Processing ${reviewsWithContent.length} reviews with content and ${reviewsWithoutContent.length} reviews without content`,
    );

    // Generate rating-based sentiment for reviews without content
    const ratingBasedResults: BatchAnalysisResult[] = reviewsWithoutContent
        .map((review) => {
            const score = review.rating * 2; // Convert 1-5 rating to 1-10 score
            let sentiment: "positive" | "negative" | "neutral" | "mixed";

            if (score < 4) {
                sentiment = "negative";
            } else if (score === 4 || score === 6) {
                sentiment = "mixed";
            } else if (score === 5) {
                sentiment = "neutral";
            } else { // score > 6
                sentiment = "positive";
            }

            console.log(
                `Review ${review.id}: No content, using rating-based sentiment: ${sentiment} (score: ${score} from rating: ${review.rating})`,
            );

            return {
                reviewId: review.id,
                analysis: {
                    sentiment,
                    score: score * 10, // Convert to 1-100 scale for consistency
                    keywords: [],
                    topics: [],
                },
            };
        });

    // If no reviews have content, return only rating-based results
    if (reviewsWithContent.length === 0) {
        console.log(
            "No reviews with content, returning rating-based results only",
        );
        return ratingBasedResults;
    }

    // Process reviews with content through OpenAI
    if (supabaseClient) {
        await waitForRateLimit(supabaseClient, 200);
    }

    const languageNames: Record<string, string> = {
        "en": "English",
        "fr": "French",
    };
    const languageName = languageNames[language] || "French";

    // Prepare reviews for batch processing (only those with content)
    const reviewsFormatted = reviewsWithContent.map((review, index) =>
        `Review ${index + 1} (ID: ${review.id}): "${review.content}"`
    ).join("\n\n");

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
                            `Analyze these ${reviewsWithContent.length} reviews and return a JSON array where each element corresponds to a review analysis. 
                            
Each analysis object MUST include:
1. reviewId: the ID from the review (CRITICAL - must match exactly)
2. sentiment: one of "positive", "negative", "neutral", or "mixed"
3. score: number from 1-100 (1=very negative, 50=neutral, 100=very positive)
4. emotions: array of emoticons representing emotions (optional)
5. keywords: array of objects with:
   - text: the keyword/phrase (MUST be 1-2 words maximum, generate in ${languageName})
   - category: one of "service", "food", "ambiance", "price", "quality", "cleanliness", "staff", "other"
   - relevance: number from 0-1 indicating importance
6. topics: array of objects with:
   - name: brief topic name (MUST be 1-2 words maximum, generate in ${languageName})
   - category: one of "satisfaction", "dissatisfaction", "neutral"
   - description: brief description (generate in ${languageName})
   - relevance: number from 0-1

IMPORTANT: 
- Return ONLY a JSON array with exactly ${reviewsWithContent.length} objects
- Each object MUST have the reviewId field matching the ID from the input
- All keywords, topics, and descriptions MUST be in ${languageName}
- Format: [{"reviewId": "xxx", "sentiment": "positive", ...}, ...]`,
                    },
                    {
                        role: "user",
                        content: reviewsFormatted,
                    },
                ],
                temperature: 0.3,
                max_tokens: Math.min(
                    4000,
                    800 + (reviewsWithContent.length * 60),
                ), // More conservative token calculation
            }),
        },
    );

    if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        const error = new Error(
            `OpenAI API error: ${openaiResponse.status} ${errorText}`,
        ) as Error & { statusCode: number };
        error.statusCode = openaiResponse.status;
        throw error;
    }

    const openaiData = await openaiResponse.json();
    const analysisText = openaiData.choices?.[0]?.message?.content;

    if (!analysisText) {
        throw new Error("No analysis returned from OpenAI");
    }

    console.log(`OpenAI response length: ${analysisText.length} characters`);

    // Try to find JSON array in the response
    const jsonMatch = analysisText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        console.error(
            "OpenAI response (first 500 chars):",
            analysisText.substring(0, 500),
        );
        throw new Error("No JSON array found in OpenAI response");
    }

    let analysisResults;
    try {
        analysisResults = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("JSON string length:", jsonMatch[0].length);
        console.error(
            "JSON string (first 1000 chars):",
            jsonMatch[0].substring(0, 1000),
        );
        console.error(
            "JSON string (last 500 chars):",
            jsonMatch[0].substring(jsonMatch[0].length - 500),
        );

        // Try to fix common JSON issues
        try {
            // Attempt to fix truncated JSON by closing arrays/objects
            let fixedJson = jsonMatch[0];

            // Count opening and closing brackets
            const openBrackets = (fixedJson.match(/\[/g) || []).length;
            const closeBrackets = (fixedJson.match(/\]/g) || []).length;
            const openBraces = (fixedJson.match(/\{/g) || []).length;
            const closeBraces = (fixedJson.match(/\}/g) || []).length;

            // Close any unclosed braces first
            for (let i = 0; i < (openBraces - closeBraces); i++) {
                fixedJson += "}";
            }

            // Then close unclosed brackets
            for (let i = 0; i < (openBrackets - closeBrackets); i++) {
                fixedJson += "]";
            }

            console.log("Attempting to parse fixed JSON...");
            analysisResults = JSON.parse(fixedJson);
            console.log("Successfully parsed fixed JSON");
        } catch (fixError) {
            console.error("Failed to fix and parse JSON:", fixError);
            throw new Error(
                `Failed to parse OpenAI response as JSON: ${parseError}`,
            );
        }
    }

    if (!Array.isArray(analysisResults)) {
        throw new Error("OpenAI response is not an array");
    }

    console.log(
        `Parsed ${analysisResults.length} results from OpenAI response`,
    );

    // Map results back to reviews
    const batchResults: BatchAnalysisResult[] = [];

    for (const result of analysisResults) {
        if (!result.reviewId) {
            console.warn("Skipping result without reviewId:", result);
            continue;
        }

        console.log("result", result);

        const analysis: EnhancedAnalysisResult = {
            sentiment: result.sentiment || "neutral",
            score: result.score || 50,
            emotions: result.emotions || [],
            keywords: result.keywords || [],
            topics: result.topics || [],
        };

        batchResults.push({
            reviewId: result.reviewId,
            analysis,
        });
    }

    // Combine rating-based results with OpenAI results
    const allResults = [...ratingBasedResults, ...batchResults];
    console.log(
        `Returning ${allResults.length} total results (${ratingBasedResults.length} rating-based + ${batchResults.length} OpenAI-based)`,
    );

    return allResults;
}

async function processKeywords(
    supabaseClient: SupabaseClient,
    reviewId: string,
    platformConnectionId: string,
    keywords: KeywordResult[],
): Promise<number> {
    if (keywords.length === 0) return 0;

    const reviewKeywordRecords = [];

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

        reviewKeywordRecords.push({
            review_id: reviewId,
            keyword_id: keywordId,
            platform_connection_id: platformConnectionId,
            frequency: 1,
            relevance_score: kw.relevance || 0.5,
        });
    }

    // Batch insert all review_keywords
    if (reviewKeywordRecords.length > 0) {
        const { error } = await supabaseClient
            .from("review_keywords")
            .insert(reviewKeywordRecords);

        if (error) throw error;
    }

    return reviewKeywordRecords.length;
}

async function processTopics(
    supabaseClient: SupabaseClient,
    platformConnectionId: string,
    reviewId: string,
    topics: TopicResult[],
): Promise<number> {
    if (topics.length === 0) return 0;

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

    const reviewTopicRecords = [];

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

        reviewTopicRecords.push({
            review_id: reviewId,
            topic_id: topicId,
            platform_connection_id: platformConnectionId,
            relevance_score: topic.relevance || 0.5,
        });
    }

    // Batch insert all review_topics
    if (reviewTopicRecords.length > 0) {
        const { error } = await supabaseClient
            .from("review_topics")
            .insert(reviewTopicRecords);

        if (error) throw error;
    }

    return reviewTopicRecords.length;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Verify internal function authentication using custom header
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const internalKey = req.headers.get("X-Internal-Key");

        if (!internalKey || internalKey !== supabaseServiceKey) {
            console.warn(
                "Unauthorized access attempt to sentiment-analysis function",
            );
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Unauthorized - internal access only",
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

        // Initialize Supabase client with service role key
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Get OpenAI API key
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiApiKey) {
            throw new Error("OPENAI_API_KEY environment variable is not set");
        }

        // Parse request body
        const { company_id, retry_count = 0 } = await req.json();
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

        console.log(
            `Starting sentiment analysis for company ${company_id} (retry ${retry_count}/50)`,
        );

        // Verify company exists
        const { data: company, error: companyError } = await supabaseClient
            .from("companies")
            .select("id, owner_id")
            .eq("id", company_id)
            .single();

        if (companyError || !company) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Company not found",
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

        // Get company owner's preferred language
        let preferredLanguage = "fr";
        const { data: ownerProfile } = await supabaseClient
            .from("profiles")
            .select("preferred_language")
            .eq("id", company.owner_id)
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
        const { data: unprocessedReviews, error: reviewsError } =
            await supabaseClient.rpc("get_unprocessed_reviews", {
                company_uuid: company_id,
            });

        if (reviewsError) {
            throw new Error(`Error fetching reviews: ${reviewsError.message}`);
        }

        if (!unprocessedReviews || unprocessedReviews.length === 0) {
            console.log("No unprocessed reviews found");
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "No unprocessed reviews found",
                    processed: 0,
                    skipped: 0,
                    errors: 0,
                    total: 0,
                    remaining: 0,
                    retry_count,
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

        // Process reviews in batches of 10
        let processed = 0;
        let skipped = 0;
        let errors = 0;
        const batchSize = 5;

        for (let i = 0; i < unprocessedReviews.length; i += batchSize) {
            const batch = unprocessedReviews.slice(i, i + batchSize);
            console.log(
                `Processing batch ${
                    Math.floor(i / batchSize) + 1
                } (${batch.length} reviews)...`,
            );

            try {
                // Call OpenAI for batch analysis
                const batchResults = await callOpenAIForBatchAnalysis(
                    batch,
                    openaiApiKey,
                    preferredLanguage,
                    supabaseClient,
                );

                console.log(
                    `Received ${batchResults.length} analysis results`,
                );

                // Prepare all sentiment records for batch insert
                const sentimentRecords = [];
                const validResults: Array<{
                    review: ProcessedReview;
                    analysis: EnhancedAnalysisResult;
                }> = [];

                for (const batchResult of batchResults) {
                    // Find the corresponding review
                    const review = batch.find((r: ProcessedReview) =>
                        r.id === batchResult.reviewId
                    );

                    if (!review) {
                        console.warn(
                            `Review not found for ID: ${batchResult.reviewId}`,
                        );
                        errors++;
                        continue;
                    }

                    const analysisResult = batchResult.analysis;

                    sentimentRecords.push({
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

                    validResults.push({ review, analysis: analysisResult });
                }

                // Batch insert all sentiment analysis records
                if (sentimentRecords.length > 0) {
                    const { error: sentimentError } = await supabaseClient
                        .from("sentiment_analysis")
                        .upsert(sentimentRecords, {
                            onConflict: "review_id",
                        });

                    if (sentimentError) {
                        console.error(
                            `Error batch inserting sentiments:`,
                            JSON.stringify(sentimentError, null, 2),
                        );
                        errors += sentimentRecords.length;
                        continue;
                    }

                    console.log(
                        `Successfully inserted ${sentimentRecords.length} sentiment records`,
                    );
                }

                // Process keywords and topics for each review
                for (const { review, analysis } of validResults) {
                    try {
                        await processKeywords(
                            supabaseClient,
                            review.id,
                            review.platform_connection_id,
                            analysis.keywords,
                        );

                        await processTopics(
                            supabaseClient,
                            review.platform_connection_id,
                            review.id,
                            analysis.topics,
                        );

                        processed++;
                        console.log(
                            `Successfully processed review ${review.id}`,
                        );
                    } catch (innerError) {
                        console.error(
                            `Error processing keywords/topics for review ${review.id}:`,
                            innerError,
                        );
                        errors++;
                    }
                }
            } catch (error) {
                // Handle 429 rate limit errors for the entire batch
                const errorWithStatus = error as { statusCode?: number };
                if (errorWithStatus.statusCode === 429) {
                    console.warn(
                        `Rate limit hit for batch ${
                            Math.floor(i / batchSize) + 1
                        }, skipping remaining reviews...`,
                    );
                    skipped += batch.length;
                    break;
                }

                // Handle other batch-level errors
                console.error(
                    `Error processing batch ${Math.floor(i / batchSize) + 1}:`,
                    error,
                );
                errors += batch.length;
            }
        }

        const total = unprocessedReviews.length;
        const remaining = Math.max(0, totalCount - processed);

        console.log(
            `Completed: ${processed} processed, ${skipped} skipped, ${errors} errors out of ${total}. ${remaining} reviews remaining.`,
        );

        // Check if there are still unprocessed reviews and retry if needed
        if (remaining > 0 && retry_count < 50) {
            console.log(
                `Still ${remaining} reviews remaining. Waiting 10s before retry ${
                    retry_count + 1
                }/50...`,
            );

            // Wait 10 seconds before recursive call
            await new Promise((resolve) => setTimeout(resolve, 10000));

            // Make recursive call to process remaining reviews
            try {
                const retryResponse = await fetch(
                    `${supabaseUrl}/functions/v1/sentiment-analysis`,
                    {
                        method: "POST",
                        headers: {
                            "X-Internal-Key": supabaseServiceKey,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            company_id,
                            retry_count: retry_count + 1,
                        }),
                    },
                );

                const retryData = await retryResponse.json();
                console.log(
                    `Retry ${retry_count + 1} completed:`,
                    retryData,
                );

                // Return aggregated results
                return new Response(
                    JSON.stringify({
                        success: true,
                        processed: processed + (retryData.processed || 0),
                        skipped: skipped + (retryData.skipped || 0),
                        errors: errors + (retryData.errors || 0),
                        total: total + (retryData.total || 0),
                        remaining: retryData.remaining || 0,
                        totalUnprocessed: totalCount,
                        retry_count: retry_count + 1,
                        message: retryData.remaining === 0
                            ? `All reviews processed after ${
                                retry_count + 1
                            } retries!`
                            : `Processed reviews with ${
                                retry_count + 1
                            } retries. ${retryData.remaining} still remaining.`,
                    }),
                    {
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                        status: 200,
                    },
                );
            } catch (retryError) {
                console.error("Error in recursive retry:", retryError);
                // Return current results even if retry fails
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                processed,
                skipped,
                errors,
                total,
                remaining,
                totalUnprocessed: totalCount,
                retry_count,
                message: remaining > 0
                    ? `Processed ${processed} reviews. ${remaining} reviews remaining (max retries reached).`
                    : `Processed ${processed} reviews successfully. All reviews processed!`,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error in sentiment-analysis:", error);
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
