import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ReviewCardSkeleton,
  StatCardSkeleton,
} from "../components/SkeletonLoaders";
import { useUser } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";

interface CompanyDetails {
  id: string;
  name: string;
  industry: string;
  created_at: string;
  total_reviews: number;
  average_rating: number;
  positive_reviews: number;
  negative_reviews: number;
  neutral_reviews: number;
  total_locations: number;
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  total_reviews: number;
  average_rating: number;
}

interface Review {
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

interface Keyword {
  keyword_text: string;
  category: string;
  occurrence_count: number;
}

interface KeywordAnalysis {
  category: string;
  count: number;
  percentage: number;
}

export const CompanyStats = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const supabase = useSupabase();
  const { profile } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis[]>([]);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!profile || !companyId) return;

      try {
        // Fetch company details
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .eq("owner_id", profile.id)
          .single();

        if (companyError) {
          console.error("Error fetching company:", companyError);
          navigate("/companies");
          return;
        }

        // Fetch company stats
        const { data: statsData, error: statsError } = await supabase
          .from("company_stats")
          .select("*")
          .eq("company_id", companyId)
          .single();

        if (!statsError && statsData) {
          setCompany({
            ...companyData,
            total_reviews: statsData.total_reviews || 0,
            average_rating: statsData.average_rating || 0,
            positive_reviews: statsData.positive_reviews || 0,
            negative_reviews: statsData.negative_reviews || 0,
            neutral_reviews: statsData.neutral_reviews || 0,
            total_locations: statsData.total_locations || 0,
          });
        } else {
          setCompany({
            ...companyData,
            total_reviews: 0,
            average_rating: 0,
            positive_reviews: 0,
            negative_reviews: 0,
            neutral_reviews: 0,
            total_locations: 0,
          });
        }

        // Fetch locations
        const { data: locationsData, error: locationsError } = await supabase
          .from("locations")
          .select("*")
          .eq("company_id", companyId);

        if (locationsError) {
          console.error("Error fetching locations:", locationsError);
        } else {
          // For each location, get review stats
          const locationsWithStats = await Promise.all(
            (locationsData || []).map(async (location) => {
              const { data: reviewStats } = await supabase
                .from("reviews")
                .select("rating")
                .eq("location_id", location.id);

              const totalReviews = reviewStats?.length || 0;
              const averageRating =
                totalReviews > 0 && reviewStats
                  ? reviewStats.reduce((sum, r) => sum + r.rating, 0) /
                    totalReviews
                  : 0;

              return {
                ...location,
                total_reviews: totalReviews,
                average_rating: averageRating,
              };
            })
          );
          setLocations(locationsWithStats);
        }

        // Fetch reviews for this company
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("recent_reviews")
          .select("*")
          .eq("company_id", companyId)
          .order("published_at", { ascending: false })
          .limit(15);

        if (reviewsError) {
          console.error("Error fetching reviews:", reviewsError);
        } else {
          setReviews(reviewsData || []);
        }

        // Fetch keywords for this company
        const { data: keywordsData, error: keywordsError } = await supabase
          .rpc("get_company_keywords", {
            p_company_id: companyId,
          })
          .limit(20);

        if (keywordsError) {
          console.error("Error fetching keywords:", keywordsError);
          // Fallback: try to get keywords directly
          const { data: fallbackKeywords } = await supabase
            .from("top_keywords")
            .select("keyword_text, category, occurrence_count")
            .order("occurrence_count", { ascending: false })
            .limit(20);

          if (fallbackKeywords) {
            setKeywords(fallbackKeywords);
            analyzeKeywords(fallbackKeywords);
          }
        } else {
          setKeywords(keywordsData || []);
          analyzeKeywords(keywordsData || []);
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [supabase, profile, companyId, navigate]);

  const analyzeKeywords = (keywordsData: Keyword[]) => {
    const categoryMap = new Map<string, number>();
    let total = 0;

    keywordsData.forEach((kw) => {
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
  };

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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </Box>

          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Loading company data...
            </Typography>
          </Box>

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
        </Stack>
      </Container>
    );
  }

  if (!company) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h5">Company not found</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Dashboard
        </Button>

        {/* Company Header */}
        <Paper sx={{ p: 4 }}>
          <Stack direction="row" spacing={3} alignItems="flex-start">
            <Avatar sx={{ bgcolor: "secondary.main", width: 72, height: 72 }}>
              <BusinessIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h3" component="h1" gutterBottom>
                {company.name}
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
              >
                <Chip label={company.industry} variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  {company.total_locations} location
                  {company.total_locations !== 1 ? "s" : ""}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Member since{" "}
                  {new Date(company.created_at).toLocaleDateString()}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Stats Overview */}
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
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h4" fontWeight={700}>
                  {company.total_reviews}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Reviews
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h4" fontWeight={700}>
                    {company.average_rating.toFixed(1)}
                  </Typography>
                  <StarIcon sx={{ color: "warning.main", fontSize: "2rem" }} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Average Rating
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {company.positive_reviews}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Positive Reviews
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h4" fontWeight={700} color="error.main">
                  {company.negative_reviews}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Negative Reviews
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Locations */}
        {locations.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Locations
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                },
                gap: 2,
                mt: 2,
              }}
            >
              {locations.map((location) => (
                <Card key={location.id} variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {location.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {location.address}, {location.city}, {location.state}
                      </Typography>
                      <Divider />
                      <Stack direction="row" spacing={3}>
                        <Box>
                          <Typography variant="h6" fontWeight={600}>
                            {location.total_reviews}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Reviews
                          </Typography>
                        </Box>
                        <Box>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <Typography variant="h6" fontWeight={600}>
                              {location.average_rating.toFixed(1)}
                            </Typography>
                            <StarIcon
                              sx={{ color: "warning.main", fontSize: "1rem" }}
                            />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Avg Rating
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        )}

        {/* Keyword Analysis */}
        {keywordAnalysis.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Keyword Analysis by Category
            </Typography>
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
                      {analysis.count} mentions (
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
          </Paper>
        )}

        {/* Trending Keywords */}
        {keywords.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trending Keywords
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Most frequently mentioned terms in reviews
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 3 }}>
              {keywords.map((keyword, index) => (
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
          </Paper>
        )}

        {/* Recent Reviews */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Reviews
          </Typography>
          {reviews.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No reviews yet for this company.
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {reviews.map((review) => (
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
                              {review.author_name || "Anonymous"}
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
                            {review.location_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
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
                        <Typography variant="subtitle2" fontWeight={600}>
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
      </Stack>
    </Container>
  );
};
