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

interface LocationData {
  company_id: string;
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

    // Parse webhook payload
    const payload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload, null, 2));

    // Extract review data from webhook payload
    const reviewRecord = payload.record;
    if (!reviewRecord) {
      throw new Error("No record found in webhook payload");
    }

    const review: ProcessedReview = {
      id: reviewRecord.id,
      content: reviewRecord.content,
      rating: reviewRecord.rating,
      platform_connection_id: reviewRecord.platform_connection_id,
    };

    console.log(`Processing review ${review.id} from webhook...`);

    // Check if review already has sentiment analysis
    const { data: existingAnalysis, error: checkError } = await supabaseClient
      .from("sentiment_analysis")
      .select("review_id")
      .eq("review_id", review.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 = no rows returned
      throw new Error(
        `Error checking existing analysis: ${checkError.message}`,
      );
    }

    if (existingAnalysis) {
      console.log(
        `Review ${review.id} already has sentiment analysis, skipping`,
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: "Review already analyzed",
          reviewId: review.id,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Call OpenAI API for enhanced analysis
    const analysisResult = await callOpenAIForAnalysis(
      review.content,
      openaiApiKey,
    );

    // Insert sentiment analysis
    const { error: sentimentError } = await supabaseClient
      .from("sentiment_analysis")
      .insert({
        review_id: review.id,
        sentiment: analysisResult.sentiment,
        sentiment_score: (analysisResult.score - 50) / 50, // Convert to -1.0 to 1.0
        emotions: analysisResult.emotions
          ? { emoticons: analysisResult.emotions }
          : null,
        confidence: 0.85, // Default confidence for gpt-3.5-turbo
        created_at: new Date().toISOString(),
      });

    if (sentimentError) {
      throw new Error(
        `Sentiment analysis insert error: ${sentimentError.message}`,
      );
    }

    // Process keywords
    const keywordsProcessed = await processKeywords(
      supabaseClient,
      review.id,
      analysisResult.keywords,
    );

    // Process topics
    const topicsProcessed = await processTopics(
      supabaseClient,
      review.platform_connection_id,
      review.id,
      analysisResult.topics,
    );

    console.log(
      `Successfully processed review ${review.id}: ${keywordsProcessed} keywords, ${topicsProcessed} topics`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Review analysis completed",
        reviewId: review.id,
        keywordsExtracted: keywordsProcessed,
        topicsIdentified: topicsProcessed,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in perform-sentiment-analysis webhook:", error);
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

async function callOpenAIForAnalysis(
  content: string,
  apiKey: string,
): Promise<EnhancedAnalysisResult> {
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

  return analysisResult;
}

async function processKeywords(
  supabaseClient: any,
  reviewId: string,
  keywords: KeywordResult[],
): Promise<number> {
  let processed = 0;

  for (const kw of keywords) {
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
        review_id: reviewId,
        keyword_id: keywordId,
        frequency: 1,
        relevance_score: kw.relevance,
      });

    processed++;
  }

  return processed;
}

async function processTopics(
  supabaseClient: any,
  platformConnectionId: string,
  reviewId: string,
  topics: TopicResult[],
): Promise<number> {
  let processed = 0;

  // Get company_id for the review
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
      sentDist["positive"] = (sentDist["positive"] || 0) + 1; // Simplified for now

      // Merge keywords
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
      // Create new topic
      const { data: newTopic, error } = await supabaseClient
        .from("topics")
        .insert({
          company_id: companyId,
          name: topic.name,
          category: topic.category,
          description: topic.description,
          keywords: topics.map((t) => t.name),
          occurrence_count: 1,
          sentiment_distribution: { positive: 1 },
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
        review_id: reviewId,
        topic_id: topicId,
        relevance_score: topic.relevance,
      });

    processed++;
  }

  return processed;
}
