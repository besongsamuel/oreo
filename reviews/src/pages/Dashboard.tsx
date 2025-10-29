import { Star as StarIcon } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CompanyCard } from "../components/CompanyCard";
import { SEO } from "../components/SEO";
import {
  KeywordChipSkeleton,
  ReviewCardSkeleton,
  StatCardSkeleton,
} from "../components/SkeletonLoaders";
import { UserContext } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";

interface CompanyStat {
  company_id: string;
  company_name: string;
  total_reviews: number;
  average_rating: number;
  positive_reviews: number;
  negative_reviews: number;
  neutral_reviews: number;
  total_locations: number;
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
  company_name: string;
}

interface TopKeyword {
  keyword_text: string;
  category: string;
  occurrence_count: number;
}

interface KeywordAnalysis {
  category: string;
  count: number;
  percentage: number;
}

export const Dashboard = () => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const context = useContext(UserContext);
  const profile = context?.profile;
  const [loading, setLoading] = useState(true);
  const [companyStats, setCompanyStats] = useState<CompanyStat[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [topKeywords, setTopKeywords] = useState<TopKeyword[]>([]);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      try {
        // Fetch company stats for all user's companies
        const { data: stats, error: statsError } = await supabase
          .from("company_stats")
          .select("*")
          .eq("owner_id", profile.id)
          .order("total_reviews", { ascending: false });

        if (statsError) {
          console.error("Error fetching stats:", statsError);
        } else {
          setCompanyStats(stats || []);
        }

        // Fetch recent reviews
        const { data: reviews, error: reviewsError } = await supabase
          .from("recent_reviews")
          .select("*")
          .eq("owner_id", profile.id)
          .order("published_at", { ascending: false })
          .limit(10);

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
          .limit(15);

        if (keywordsError) {
          console.error("Error fetching keywords:", keywordsError);
        } else {
          setTopKeywords(keywords || []);

          // Analyze keywords by category
          const categoryMap = new Map<string, number>();
          let total = 0;

          keywords?.forEach((kw) => {
            const category = kw.category || "other";
            categoryMap.set(
              category,
              (categoryMap.get(category) || 0) + kw.occurrence_count
            );
            total += kw.occurrence_count;
          });

          const analysis = Array.from(categoryMap.entries())
            .map(([category, count]) => ({
              category,
              count,
              percentage: total > 0 ? (count / total) * 100 : 0,
            }))
            .sort((a, b) => b.count - a.count);

          setKeywordAnalysis(analysis);
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
              {t("dashboard.title")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("dashboard.loading")}
            </Typography>
          </Box>

          {/* Companies Overview Skeleton */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("dashboard.companiesOverview")}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
                mt: 1,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <StatCardSkeleton key={i} />
              ))}
            </Box>
          </Paper>

          {/* Keyword Analysis Skeleton */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("dashboard.keywordAnalysisByCategory")}
            </Typography>
            <Stack spacing={3} sx={{ mt: 3 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i}>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <KeywordChipSkeleton />
                    <KeywordChipSkeleton />
                  </Stack>
                  <LinearProgress variant="determinate" value={0} />
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* Recent Reviews Skeleton */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("dashboard.recentReviews")}
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
              {t("dashboard.trendingKeywords")}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("dashboard.loadingKeywordData")}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 3 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
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
    <>
      <SEO
        title={t("dashboard.seoTitle")}
        description={t("dashboard.seoDescription")}
        keywords={t("dashboard.seoKeywords")}
      />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Header */}
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {t("dashboard.title")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("dashboard.welcomeBack", {
                name: profile?.full_name || profile?.email,
              })}
            </Typography>
          </Box>

          {/* Companies Performance */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("dashboard.companiesOverview")}
            </Typography>
            {companyStats.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t("dashboard.noCompanies")}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 3,
                  mt: 1,
                }}
              >
                {companyStats.slice(0, 6).map((company) => (
                  <CompanyCard
                    key={company.company_id}
                    companyId={company.company_id}
                    companyName={company.company_name}
                    totalLocations={company.total_locations}
                    totalReviews={company.total_reviews}
                    averageRating={company.average_rating}
                    positiveReviews={company.positive_reviews}
                    negativeReviews={company.negative_reviews}
                  />
                ))}
              </Box>
            )}
          </Paper>

          {/* Keyword Analysis */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("dashboard.keywordAnalysisByCategory")}
            </Typography>
            {keywordAnalysis.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t("dashboard.noKeywordData")}
              </Typography>
            ) : (
              <Stack spacing={3} sx={{ mt: 3 }}>
                {keywordAnalysis.map((analysis) => (
                  <Box key={analysis.category}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        textTransform="capitalize"
                      >
                        {analysis.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {analysis.count} {t("dashboard.mentions")} (
                        {analysis.percentage.toFixed(1)}%)
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={analysis.percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "rgba(0, 0, 0, 0.08)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          backgroundColor: "secondary.main",
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Recent Reviews */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("dashboard.recentReviews")}
            </Typography>
            {recentReviews.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t("dashboard.noReviews")}
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
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                            >
                              <Typography variant="subtitle1" fontWeight="bold">
                                {review.author_name || t("dashboard.anonymous")}
                              </Typography>
                              <Chip
                                label={review.platform_name}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {review.company_name} • {review.location_name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(
                                review.published_at
                              ).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
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
                          <Typography variant="subtitle2" fontWeight={600}>
                            {review.title}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {review.content?.substring(0, 150)}
                          {review.content && review.content.length > 150
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
              {t("dashboard.trendingKeywords")}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("dashboard.mostFrequentlyMentioned")}
            </Typography>
            {topKeywords.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t("dashboard.noKeywordsAnalyzed")}
              </Typography>
            ) : (
              <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 3 }}>
                {topKeywords.map((keyword, index) => (
                  <Chip
                    key={index}
                    label={`${keyword.keyword_text} (${keyword.occurrence_count})`}
                    color={getCategoryColor(keyword.category || "other")}
                    variant="outlined"
                    sx={{
                      fontWeight: 500,
                      fontSize: index < 5 ? "0.95rem" : "0.875rem",
                    }}
                  />
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Container>
    </>
  );
};
