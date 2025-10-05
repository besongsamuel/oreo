import {
  RateReview as ReviewIcon,
  SentimentSatisfied as SentimentIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  KeywordChipSkeleton,
  ReviewCardSkeleton,
  StatCardSkeleton,
} from "../components/SkeletonLoaders";
import { useUser } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";

interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
  neutralReviews: number;
}

interface RecentReview {
  id: string;
  rating: number;
  title: string;
  content: string;
  author_name: string;
  published_at: string;
  sentiment: string;
  location_name: string;
  platform_name: string;
}

interface TopKeyword {
  keyword_text: string;
  category: string;
  occurrence_count: number;
}

export const Dashboard = () => {
  const supabase = useSupabase();
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [topKeywords, setTopKeywords] = useState<TopKeyword[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;

      try {
        // Fetch company stats for the user
        const { data: companyStats, error: statsError } = await supabase
          .from("company_stats")
          .select("*")
          .eq("owner_id", profile.id)
          .single();

        if (statsError) {
          console.error("Error fetching stats:", statsError);
        } else if (companyStats) {
          setStats({
            totalReviews: companyStats.total_reviews || 0,
            averageRating: companyStats.average_rating || 0,
            positiveReviews: companyStats.positive_reviews || 0,
            negativeReviews: companyStats.negative_reviews || 0,
            neutralReviews: companyStats.neutral_reviews || 0,
          });
        }

        // Fetch recent reviews
        const { data: reviews, error: reviewsError } = await supabase
          .from("recent_reviews")
          .select("*")
          .eq("owner_id", profile.id)
          .limit(5);

        if (reviewsError) {
          console.error("Error fetching recent reviews:", reviewsError);
        } else {
          setRecentReviews(reviews || []);
        }

        // Fetch top keywords
        const { data: keywords, error: keywordsError } = await supabase
          .from("top_keywords")
          .select("keyword_text, category, occurrence_count")
          .order("occurrence_count", { ascending: false })
          .limit(10);

        if (keywordsError) {
          console.error("Error fetching keywords:", keywordsError);
        } else {
          setTopKeywords(keywords || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, profile]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Header Skeleton */}
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Loading your data...
            </Typography>
          </Box>

          {/* Stats Cards Skeleton */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </Box>

          {/* Recent Reviews Skeleton */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Reviews
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {[1, 2, 3].map((i) => (
                <ReviewCardSkeleton key={i} />
              ))}
            </Stack>
          </Paper>

          {/* Top Keywords Skeleton */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Keywords
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <KeywordChipSkeleton key={i} />
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "success";
      case "negative":
        return "error";
      case "neutral":
        return "default";
      default:
        return "default";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<
      string,
      "primary" | "secondary" | "info" | "warning" | "success" | "error"
    > = {
      service: "primary",
      food: "secondary",
      ambiance: "info",
      price: "warning",
      quality: "success",
      cleanliness: "info",
      staff: "primary",
    };
    return colors[category] || "default";
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {profile?.full_name || profile?.email}!
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 3,
          }}
        >
          <Box>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <ReviewIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">
                      {stats?.totalReviews || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Reviews
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "warning.main" }}>
                    <StarIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">
                      {stats?.averageRating?.toFixed(1) || "0.0"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Rating
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "success.main" }}>
                    <SentimentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">
                      {stats?.positiveReviews || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Positive Reviews
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "error.main" }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">
                      {stats?.negativeReviews || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Negative Reviews
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Recent Reviews */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Reviews
          </Typography>
          {recentReviews.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No reviews yet. Connect your platforms to start collecting
              reviews.
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {recentReviews.map((review) => (
                <Card key={review.id} variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Box>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography variant="subtitle1" fontWeight="bold">
                              {review.author_name || "Anonymous"}
                            </Typography>
                            <Chip
                              label={review.platform_name}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {review.location_name} •{" "}
                            {new Date(review.published_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" fontWeight="bold">
                            {review.rating.toFixed(1)}
                          </Typography>
                          <StarIcon
                            fontSize="small"
                            sx={{ color: "warning.main" }}
                          />
                          {review.sentiment && (
                            <Chip
                              label={review.sentiment}
                              size="small"
                              color={getSentimentColor(review.sentiment)}
                            />
                          )}
                        </Stack>
                      </Stack>
                      {review.title && (
                        <Typography variant="subtitle2">
                          {review.title}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {review.content?.substring(0, 200)}
                        {review.content && review.content.length > 200
                          ? "..."
                          : ""}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Paper>

        {/* Top Keywords */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top Keywords
          </Typography>
          {topKeywords.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No keywords analyzed yet.
            </Typography>
          ) : (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
              {topKeywords.map((keyword, index) => (
                <Chip
                  key={index}
                  label={`${keyword.keyword_text} (${keyword.occurrence_count})`}
                  color={getCategoryColor(keyword.category || "other")}
                  variant="outlined"
                />
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>
    </Container>
  );
};
