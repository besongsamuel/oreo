import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

interface ProcessingResult {
    processed: number;
    failed: number;
    keywordsExtracted: number;
    topicsIdentified: number;
    errors: string[];
}

interface LocationData {
    company_id: string;
}

Deno.serve(async (_req: Request) => {
    try {
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Mock analysis result for testing
        const mockAnalysisResult: EnhancedAnalysisResult = {
            sentiment: "positive",
            score: 85,
            emotions: ["😊", "👍"],
            keywords: [
                { text: "great coffee", category: "food", relevance: 0.95 },
                { text: "friendly staff", category: "staff", relevance: 0.88 },
                { text: "fast service", category: "service", relevance: 0.82 },
            ],
            topics: [
                {
                    name: "Coffee Quality",
                    category: "satisfaction",
                    description: "Customer praises coffee quality",
                    relevance: 0.92,
                },
                {
                    name: "Service Speed",
                    category: "satisfaction",
                    description: "Customer appreciates fast service",
                    relevance: 0.85,
                },
            ],
        };

        // Mock review data for testing
        const mockReviewData: ProcessedReview = {
            id: "test-review-123",
            content:
                "Great coffee and friendly staff! The service was fast and efficient.",
            rating: 5,
            platform_connection_id: "test-connection-456",
        };

        const result: ProcessingResult = {
            processed: 0,
            failed: 0,
            keywordsExtracted: 0,
            topicsIdentified: 0,
            errors: [],
        };

        try {
            // Convert score from 1-100 to -1.0 to 1.0
            const sentimentScore = (mockAnalysisResult.score - 50) / 50;

            // Insert into sentiment_analysis table
            const { error: insertError } = await supabaseClient
                .from("sentiment_analysis")
                .insert({
                    review_id: mockReviewData.id,
                    sentiment: mockAnalysisResult.sentiment,
                    sentiment_score: sentimentScore,
                    emotions: mockAnalysisResult.emotions
                        ? { emoticons: mockAnalysisResult.emotions }
                        : null,
                    confidence: 0.85,
                    created_at: new Date().toISOString(),
                });

            if (insertError) {
                throw new Error(
                    `Database insert error: ${insertError.message}`,
                );
            }

            // Process keywords
            for (const kw of mockAnalysisResult.keywords) {
                // Normalize keyword text
                const normalizedText = kw.text.toUpperCase().trim();

                // Check if keyword exists
                const { data: existingKeyword } = await supabaseClient
                    .from("keywords")
                    .select("id")
                    .eq("normalized_text", normalizedText)
                    .maybeSingle();

                let keywordId;
                if (existingKeyword) {
                    keywordId = existingKeyword.id;
                } else {
                    // Insert new keyword
                    const { data: newKeyword, error } = await supabaseClient
                        .from("keywords")
                        .insert({
                            text: kw.text,
                            normalized_text: normalizedText,
                            category: kw.category,
                            language: "en",
                        })
                        .select("id")
                        .single();

                    if (error) throw error;
                    keywordId = newKeyword.id;
                }

                // Link keyword to review
                await supabaseClient
                    .from("review_keywords")
                    .insert({
                        review_id: mockReviewData.id,
                        keyword_id: keywordId,
                        frequency: 1,
                        relevance_score: kw.relevance,
                    });
            }

            // Mock company_id for testing
            const companyId = "test-company-789";

            // Process topics
            for (const topic of mockAnalysisResult.topics) {
                // Check if topic exists for this company
                const { data: existingTopic } = await supabaseClient
                    .from("topics")
                    .select(
                        "id, occurrence_count, sentiment_distribution, keywords",
                    )
                    .eq("company_id", companyId)
                    .eq("name", topic.name)
                    .maybeSingle();

                let topicId;
                if (existingTopic) {
                    // Update existing topic
                    const newCount = existingTopic.occurrence_count + 1;
                    const sentDist = existingTopic.sentiment_distribution || {};
                    sentDist[mockAnalysisResult.sentiment] =
                        (sentDist[mockAnalysisResult.sentiment] || 0) + 1;

                    // Merge keywords
                    const topicKeywords = new Set([
                        ...(existingTopic.keywords || []),
                        ...mockAnalysisResult.keywords.map((k) => k.text),
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
                    // Create new topic
                    const { data: newTopic, error } = await supabaseClient
                        .from("topics")
                        .insert({
                            company_id: companyId,
                            name: topic.name,
                            category: topic.category,
                            description: topic.description,
                            keywords: mockAnalysisResult.keywords.map((k) =>
                                k.text
                            ),
                            occurrence_count: 1,
                            sentiment_distribution: {
                                [mockAnalysisResult.sentiment]: 1,
                            },
                            is_active: true,
                        })
                        .select("id")
                        .single();

                    if (error) throw error;
                    topicId = newTopic.id;
                }

                // Link review to topic
                await supabaseClient
                    .from("review_topics")
                    .insert({
                        review_id: mockReviewData.id,
                        topic_id: topicId,
                        relevance_score: topic.relevance,
                    });
            }

            result.processed++;
            result.keywordsExtracted += mockAnalysisResult.keywords.length;
            result.topicsIdentified += mockAnalysisResult.topics.length;

            console.log(
                `Test processed: ${mockAnalysisResult.sentiment} (${mockAnalysisResult.score}), ${mockAnalysisResult.keywords.length} keywords, ${mockAnalysisResult.topics.length} topics`,
            );
        } catch (error: unknown) {
            const errorMessage = error instanceof Error
                ? error.message
                : "Unknown error";
            result.failed++;
            const reviewErrorMessage = `Test review: ${errorMessage}`;
            result.errors.push(reviewErrorMessage);
            console.error(reviewErrorMessage);
        }

        console.log(
            `Test complete: ${result.processed} processed, ${result.failed} failed, ${result.keywordsExtracted} keywords extracted, ${result.topicsIdentified} topics identified`,
        );

        return new Response(
            JSON.stringify({
                message: "Test processing complete",
                ...result,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error";
        console.error("Test function error:", error);
        return new Response(
            JSON.stringify({
                error: "Internal server error",
                details: errorMessage,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
});
