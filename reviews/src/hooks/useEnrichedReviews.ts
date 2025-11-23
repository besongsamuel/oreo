import { useEffect, useState, useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useSupabase } from "./useSupabase";

interface EnrichedReview {
  id: string;
  rating: number;
  keywords: Array<{
    id: string;
    text: string;
    category: string;
  }>;
  topics: Array<{
    id: string;
    name: string;
    category: string;
    description?: string;
  }>;
  published_at: string;
}

interface UseEnrichedReviewsOptions {
  companyId: string | undefined;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

// Paginated fetch utility function
const fetchAllPaginated = async <T,>(queryBuilder: any): Promise<T[]> => {
  let all: T[] = [];
  let from = 0;
  const size = 1000;

  while (true) {
    const { data, error } = await queryBuilder.range(from, from + size - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all = all.concat(data);
    from += size;
  }

  return all;
};

export const useEnrichedReviews = ({
  companyId,
  startDate,
  endDate,
  enabled = true,
}: UseEnrichedReviewsOptions) => {
  const supabase = useSupabase();
  const [enrichedReviews, setEnrichedReviews] = useState<EnrichedReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEnrichedReviews = useCallback(async () => {
    if (!companyId || !enabled) {
      setEnrichedReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get locations for this company
      const { data: locationsData } = await supabase
        .from("locations")
        .select("id, name")
        .eq("company_id", companyId);

      if (!locationsData || locationsData.length === 0) {
        setEnrichedReviews([]);
        setLoading(false);
        return;
      }

      const locationIds = locationsData.map((loc) => loc.id);

      // Get platform connection IDs
      const { data: platformConnections } = await supabase
        .from("platform_connections")
        .select("id, location_id, platform_id")
        .in("location_id", locationIds);

      if (!platformConnections || platformConnections.length === 0) {
        setEnrichedReviews([]);
        setLoading(false);
        return;
      }

      const platformConnectionIds = platformConnections.map((pc) => pc.id);

      // Build reviews query with date filters
      let reviewsQuery = supabase
        .from("reviews")
        .select(
          `
          *,
          platform_connections!inner(
            locations!inner(name),
            platforms(display_name)
          )
        `
        )
        .in("platform_connection_id", platformConnectionIds);

      if (startDate) {
        reviewsQuery = reviewsQuery.gte("published_at", startDate);
      }
      if (endDate) {
        reviewsQuery = reviewsQuery.lte("published_at", endDate);
      }

      // Fetch all data in parallel
      const [reviewsData, keywordsData, topicsData, sentimentData] =
        await Promise.all([
          // Reviews
          fetchAllPaginated<any>(
            reviewsQuery.order("published_at", { ascending: false })
          ),
          // Keywords
          fetchAllPaginated<any>(
            supabase
              .from("review_keywords")
              .select(
                `
                review_id,
                keywords(id, text, category)
              `
              )
              .in("platform_connection_id", platformConnectionIds)
          ),
          // Topics
          fetchAllPaginated<any>(
            supabase
              .from("review_topics")
              .select(
                `
                review_id,
                topics(id, name, category, description)
              `
              )
              .in("platform_connection_id", platformConnectionIds)
          ),
          // Sentiment - get platform_location_ids from platform_connections
          (async () => {
            const { data: platformConnectionsData } = await supabase
              .from("platform_connections")
              .select("platform_location_id")
              .in("id", platformConnectionIds);
            const platformLocationIds =
              platformConnectionsData
                ?.map((pc) => pc.platform_location_id)
                .filter(Boolean) || [];
            if (platformLocationIds.length === 0) return [];
            return fetchAllPaginated<any>(
              supabase
                .from("sentiment_analysis")
                .select("*")
                .in("platform_location_id", platformLocationIds)
            );
          })(),
        ]);

      // Aggregate data into enriched reviews
      const enrichedReviewsMap = new Map<string, EnrichedReview>();

      // Process reviews
      reviewsData.forEach((review: any) => {
        enrichedReviewsMap.set(review.id, {
          id: review.id,
          rating: review.rating,
          keywords: [],
          topics: [],
          published_at: review.published_at,
        });
      });

      // Add keywords
      keywordsData.forEach((rk: any) => {
        const review = enrichedReviewsMap.get(rk.review_id);
        if (review && rk.keywords) {
          review.keywords.push({
            id: rk.keywords.id,
            text: rk.keywords.text,
            category: rk.keywords.category || "other",
          });
        }
      });

      // Add topics
      topicsData.forEach((rt: any) => {
        const review = enrichedReviewsMap.get(rt.review_id);
        if (review && rt.topics) {
          review.topics.push({
            id: rt.topics.id,
            name: rt.topics.name,
            category: rt.topics.category || "neutral",
            description: rt.topics.description,
          });
        }
      });

      // Convert to array and sort by published_at
      const enrichedReviewsArray = Array.from(enrichedReviewsMap.values()).sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
      );

      setEnrichedReviews(enrichedReviewsArray);
    } catch (err) {
      console.error("Error loading enriched reviews:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setEnrichedReviews([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, startDate, endDate, enabled, supabase]);

  useEffect(() => {
    fetchEnrichedReviews();
  }, [fetchEnrichedReviews]);

  return {
    enrichedReviews,
    loading,
    error,
    refetch: fetchEnrichedReviews,
  };
};

