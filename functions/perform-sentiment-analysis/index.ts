import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface SentimentAnalysisResult {
    sentiment: "positive" | "negative" | "neutral" | "mixed";
    score: number; // 1-100
    emotions?: string[]; // emoticons
}

interface ProcessedReview {
    id: string;
    content: string;
    rating: number;
}

interface ProcessingResult {
    processed: number;
    failed: number;
    errors: string[];
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
            return new Response(
                JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Query for unanalyzed reviews (batch of 50)
        const { data: reviews, error: reviewsError } = await supabaseClient
            .from("reviews")
            .select("id, content, rating")
            .is("sentiment_analysis", null)
            .limit(50);

        if (reviewsError) {
            console.error("Error fetching reviews:", reviewsError);
            return new Response(
                JSON.stringify({
                    error: "Failed to fetch reviews",
                    details: reviewsError,
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        if (!reviews || reviews.length === 0) {
            return new Response(
                JSON.stringify({
                    message: "No reviews need sentiment analysis",
                    processed: 0,
                    failed: 0,
                    errors: [],
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        console.log(
            `Processing ${reviews.length} reviews for sentiment analysis`,
        );

        const result: ProcessingResult = {
            processed: 0,
            failed: 0,
            errors: [],
        };

        // Process each review
        for (const review of reviews as ProcessedReview[]) {
            try {
                // Call OpenAI API for sentiment analysis
                const openaiResponse = await fetch(
                    "https://api.openai.com/v1/chat/completions",
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${openaiApiKey}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            model: "gpt-3.5-turbo",
                            messages: [
                                {
                                    role: "system",
                                    content:
                                        `Analyze the sentiment of this review text. Return a JSON object with:
- sentiment: one of "positive", "negative", "neutral", or "mixed"
- score: a number from 1-100 where 1 is very negative, 50 is neutral, and 100 is very positive
- emotions: an optional array of emoticons that represent the emotions expressed

Example response: {"sentiment": "positive", "score": 85, "emotions": ["😊", "👍"]}`,
                                },
                                {
                                    role: "user",
                                    content: `Review text: "${review.content}"`,
                                },
                            ],
                            temperature: 0.3,
                            max_tokens: 150,
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
                const analysisText = openaiData.choices?.[0]?.message?.content;

                if (!analysisText) {
                    throw new Error("No analysis returned from OpenAI");
                }

                // Parse the JSON response
                let analysisResult: SentimentAnalysisResult;
                try {
                    // Extract JSON from the response (in case there's extra text)
                    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        throw new Error("No JSON found in OpenAI response");
                    }
                    analysisResult = JSON.parse(jsonMatch[0]);
                } catch (parseError) {
                    throw new Error(
                        `Failed to parse OpenAI response: ${parseError.message}`,
                    );
                }

                // Validate the response
                if (!analysisResult.sentiment || !analysisResult.score) {
                    throw new Error(
                        "Invalid analysis result: missing sentiment or score",
                    );
                }

                // Convert score from 1-100 to -1.0 to 1.0
                const sentimentScore = (analysisResult.score - 50) / 50;

                // Insert into sentiment_analysis table
                const { error: insertError } = await supabaseClient
                    .from("sentiment_analysis")
                    .insert({
                        review_id: review.id,
                        sentiment: analysisResult.sentiment,
                        sentiment_score: sentimentScore,
                        emotions: analysisResult.emotions
                            ? { emoticons: analysisResult.emotions }
                            : null,
                        confidence: 0.85, // Default confidence for gpt-3.5-turbo
                        created_at: new Date().toISOString(),
                    });

                if (insertError) {
                    throw new Error(
                        `Database insert error: ${insertError.message}`,
                    );
                }

                result.processed++;
                console.log(
                    `Processed review ${review.id}: ${analysisResult.sentiment} (${analysisResult.score})`,
                );
            } catch (error) {
                result.failed++;
                const errorMessage = `Review ${review.id}: ${error.message}`;
                result.errors.push(errorMessage);
                console.error(errorMessage);
                // Continue processing other reviews
            }
        }

        console.log(
            `Sentiment analysis complete: ${result.processed} processed, ${result.failed} failed`,
        );

        return new Response(
            JSON.stringify({
                message: "Sentiment analysis processing complete",
                ...result,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("Edge function error:", error);
        return new Response(
            JSON.stringify({
                error: "Internal server error",
                details: error.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
});
