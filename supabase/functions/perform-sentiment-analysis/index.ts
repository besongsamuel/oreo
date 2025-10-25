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
    // Find reviews that don't have corresponding sentiment_analysis entries
    const { data: reviews, error: reviewsError } = await supabaseClient
      .from("reviews")
      .select(`
                id, 
                content, 
                rating,
                platform_connection_id,
                sentiment_analysis!left(review_id)
            `)
      .is("sentiment_analysis.review_id", null)
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
      keywordsExtracted: 0,
      topicsIdentified: 0,
      errors: [],
    };

    // Process each review
    for (const review of reviews) {
      // Extract the review data (ignore the sentiment_analysis relation)
      const reviewData = {
        id: review.id,
        content: review.content,
        rating: review.rating,
        platform_connection_id: review.platform_connection_id,
      };
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
                  content: `Analyze this review and return a JSON object with:

1. sentiment: one of "positive", "negative", "neutral", or "mixed"
2. score: number from 1-100 (1=very negative, 50=neutral, 100=very positive)
3. emotions: array of emoticons representing emotions (optional)
4. keywords: array of objects with:
   - text: the keyword/phrase
   - category: one of "service", "food", "ambiance", "price", "quality", "cleanliness", "staff", "other"
   - relevance: number from 0-1 indicating importance
5. topics: array of objects with:
   - name: brief topic name (e.g., "Coffee Quality", "Wait Times")
   - category: one of "satisfaction", "dissatisfaction", "neutral"
   - description: brief description of what customers are saying
   - relevance: number from 0-1

Example response:
{
  "sentiment": "positive",
  "score": 85,
  "emotions": ["😊", "👍"],
  "keywords": [
    {"text": "great coffee", "category": "food", "relevance": 0.95},
    {"text": "friendly staff", "category": "staff", "relevance": 0.88}
  ],
  "topics": [
    {"name": "Coffee Quality", "category": "satisfaction", "description": "Customer praises coffee quality", "relevance": 0.92}
  ]
}`,
                },
                {
                  role: "user",
                  content: `Review text: "${reviewData.content}"`,
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
        const analysisText = openaiData.choices?.[0]?.message?.content;

        if (!analysisText) {
          throw new Error("No analysis returned from OpenAI");
        }

        // Parse the JSON response
        let analysisResult: EnhancedAnalysisResult;
        try {
          // Extract JSON from the response (in case there's extra text)
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in OpenAI response");
          }
          analysisResult = JSON.parse(jsonMatch[0]);
        } catch (parseError: unknown) {
          const errorMessage = parseError instanceof Error
            ? parseError.message
            : "Unknown parse error";
          throw new Error(
            `Failed to parse OpenAI response: ${errorMessage}`,
          );
        }

        // Validate the response
        if (!analysisResult.sentiment || !analysisResult.score) {
          throw new Error(
            "Invalid analysis result: missing sentiment or score",
          );
        }

        // Ensure keywords and topics arrays exist
        if (!analysisResult.keywords) analysisResult.keywords = [];
        if (!analysisResult.topics) analysisResult.topics = [];

        // Convert score from 1-100 to -1.0 to 1.0
        const sentimentScore = (analysisResult.score - 50) / 50;

        // Insert into sentiment_analysis table
        const { error: insertError } = await supabaseClient
          .from("sentiment_analysis")
          .insert({
            review_id: reviewData.id,
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

        // Process keywords
        for (const kw of analysisResult.keywords) {
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
              review_id: reviewData.id,
              keyword_id: keywordId,
              frequency: 1,
              relevance_score: kw.relevance,
            });
        }

        // Get company_id for the review
        const { data: connectionData } = await supabaseClient
          .from("platform_connections")
          .select("location_id, locations!inner(company_id)")
          .eq("id", reviewData.platform_connection_id)
          .single();

        if (!connectionData) {
          throw new Error("Platform connection not found");
        }

        const companyId =
          (connectionData.locations as unknown as LocationData).company_id;

        // Process topics
        for (const topic of analysisResult.topics) {
          // Check if topic exists for this company
          const { data: existingTopic } = await supabaseClient
            .from("topics")
            .select("id, occurrence_count, sentiment_distribution, keywords")
            .eq("company_id", companyId)
            .eq("name", topic.name)
            .maybeSingle();

          let topicId;
          if (existingTopic) {
            // Update existing topic
            const newCount = existingTopic.occurrence_count + 1;
            const sentDist = existingTopic.sentiment_distribution || {};
            sentDist[analysisResult.sentiment] =
              (sentDist[analysisResult.sentiment] || 0) + 1;

            // Merge keywords
            const topicKeywords = new Set([
              ...(existingTopic.keywords || []),
              ...analysisResult.keywords.map((k) => k.text),
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
                keywords: analysisResult.keywords.map((k) => k.text),
                occurrence_count: 1,
                sentiment_distribution: { [analysisResult.sentiment]: 1 },
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
              review_id: reviewData.id,
              topic_id: topicId,
              relevance_score: topic.relevance,
            });
        }

        result.processed++;
        result.keywordsExtracted += analysisResult.keywords.length;
        result.topicsIdentified += analysisResult.topics.length;
        console.log(
          `Processed review ${reviewData.id}: ${analysisResult.sentiment} (${analysisResult.score}), ${analysisResult.keywords.length} keywords, ${analysisResult.topics.length} topics`,
        );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error
          ? error.message
          : "Unknown error";
        result.failed++;
        const reviewErrorMessage = `Review ${reviewData.id}: ${errorMessage}`;
        result.errors.push(reviewErrorMessage);
        console.error(reviewErrorMessage);
        // Continue processing other reviews
      }
    }

    console.log(
      `Sentiment analysis complete: ${result.processed} processed, ${result.failed} failed, ${result.keywordsExtracted} keywords extracted, ${result.topicsIdentified} topics identified`,
    );

    return new Response(
      JSON.stringify({
        message: "Sentiment analysis processing complete",
        ...result,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error";
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
