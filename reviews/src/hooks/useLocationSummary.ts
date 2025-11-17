import { useEffect, useState } from "react";
import { useSupabase } from "./useSupabase";

interface LocationSummary {
  totalReviews: number;
  averageRating: number;
  loading: boolean;
  error: Error | null;
}

interface LocationRatingStats {
  average_rating: number | null;
}

/**
 * Custom hook to fetch location summary statistics (total reviews count and average rating)
 * Uses separate queries with count and aggregation to handle locations with more than 1000 reviews
 *
 * @param locationId - The ID of the location to get summary for
 * @returns Location summary with totalReviews, averageRating, loading state, and error
 *
 * @example
 * ```tsx
 * const { totalReviews, averageRating, loading } = useLocationSummary(locationId);
 * ```
 */
export const useLocationSummary = (
  locationId: string | null
): LocationSummary => {
  const supabase = useSupabase();
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!locationId) {
      setTotalReviews(0);
      setAverageRating(0);
      setLoading(false);
      return;
    }

    const fetchLocationSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, get all platform_connections for this location
        const { data: platformConnections, error: connectionsError } =
          await supabase
            .from("platform_connections")
            .select("id")
            .eq("location_id", locationId);

        if (connectionsError) {
          throw new Error(
            `Failed to fetch platform connections: ${connectionsError.message}`
          );
        }

        const platformConnectionIds =
          platformConnections?.map((pc) => pc.id) || [];

        if (platformConnectionIds.length === 0) {
          setTotalReviews(0);
          setAverageRating(0);
          setLoading(false);
          return;
        }

        // Query 1: Count total reviews for this location (handles > 1000 reviews)
        // Uses count with head: true to get the count without fetching data
        const { count, error: countError } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .in("platform_connection_id", platformConnectionIds);

        if (countError) {
          throw new Error(`Failed to count reviews: ${countError.message}`);
        }

        // Query 2: Get average rating using RPC function (handles > 1000 reviews)
        // This calculates the average directly in the database
        const { data: ratingStats, error: ratingError } = await supabase
          .rpc("get_location_rating_stats", {
            location_uuid: locationId,
          })
          .single();

        if (ratingError) {
          // Fallback: Use location_stats view if RPC fails
          const { data: statsData, error: statsError } = await supabase
            .from("location_stats")
            .select("average_rating")
            .eq("location_id", locationId)
            .single();

          if (statsError) {
            console.warn(
              "Failed to fetch average rating, using 0:",
              statsError.message
            );
            setTotalReviews(count || 0);
            setAverageRating(0);
          } else {
            setTotalReviews(count || 0);
            setAverageRating(
              statsData?.average_rating
                ? Number(statsData.average_rating)
                : 0
            );
          }
        } else {
          // Type assertion for RPC result
          const stats = ratingStats as LocationRatingStats | null;
          setTotalReviews(count || 0);
          setAverageRating(
            stats?.average_rating ? Number(stats.average_rating) : 0
          );
        }
      } catch (err) {
        console.error("Error fetching location summary:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setTotalReviews(0);
        setAverageRating(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationSummary();
  }, [locationId, supabase]);

  return {
    totalReviews,
    averageRating,
    loading,
    error,
  };
};

