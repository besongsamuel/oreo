import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Close as CloseIcon,
  Facebook as FacebookIcon,
  FilterList as FilterListIcon,
  Google as GoogleIcon,
  RateReview as ReviewIcon,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SentimentAnalysis } from "../components/SentimentAnalysis";
import {
  ReviewCardSkeleton,
  StatCardSkeleton,
} from "../components/SkeletonLoaders";
import { useProfile } from "../hooks/useProfile";
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

interface SentimentData {
  overallScore: number;
  overallSentiment: string;
  totalReviews: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  byAgeGroup: {
    ageRange: string;
    avgScore: number;
    count: number;
  }[];
  byGender: {
    gender: string;
    avgScore: number;
    count: number;
  }[];
}

export const CompanyStats = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const supabase = useSupabase();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(
    null
  );
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");

  // Page-level filters (apply to all data)
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // Review-specific filters
  const [selectedKeyword, setSelectedKeyword] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!profile || !companyId) {
        setLoading(false);
        return;
      }

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
          // For each location, get review stats through platform_connections
          const locationsWithStats = await Promise.all(
            (locationsData || []).map(async (location) => {
              // First get platform_connections for this location
              const { data: platformConnections } = await supabase
                .from("platform_connections")
                .select("id")
                .eq("location_id", location.id);

              const platformConnectionIds =
                platformConnections?.map((pc) => pc.id) || [];

              // Then get reviews for these platform_connections
              let reviewStats: { rating: number }[] = [];
              if (platformConnectionIds.length > 0) {
                const { data } = await supabase
                .from("reviews")
                .select("rating")
                  .in("platform_connection_id", platformConnectionIds);
                reviewStats = data || [];
              }

              const totalReviews = reviewStats.length;
              const averageRating =
                totalReviews > 0
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

        // Fetch reviews for this company with filters
        let reviewsQuery = supabase
          .from("recent_reviews")
          .select("*")
          .eq("company_id", companyId);

        // Apply location filter
        if (filterLocation !== "all") {
          reviewsQuery = reviewsQuery.eq("location_name", filterLocation);
        }

        // Apply date range filters
        if (filterStartDate) {
          reviewsQuery = reviewsQuery.gte("published_at", filterStartDate);
        }
        if (filterEndDate) {
          reviewsQuery = reviewsQuery.lte("published_at", filterEndDate);
        }

        const { data: reviewsData, error: reviewsError } = await reviewsQuery
          .order("published_at", { ascending: false })
          .limit(50);

        if (reviewsError) {
          console.error("Error fetching reviews:", reviewsError);
        } else {
          setReviews(reviewsData || []);
        }

        // Fetch sentiment analysis data with filters
        // First, get platform connection IDs for this company's locations
        let filteredLocationIds = (locationsData || []).map(
          (loc: any) => loc.id
        );

        // Apply location filter
        if (filterLocation !== "all") {
          const filteredLocs = (locationsData || []).filter(
            (loc: any) => loc.name === filterLocation
          );
          filteredLocationIds = filteredLocs.map((loc: any) => loc.id);
        }

        if (filteredLocationIds.length === 0) {
          setSentimentData(null);
        } else {
          const { data: platformConnections } = await supabase
            .from("platform_connections")
            .select("id")
            .in("location_id", filteredLocationIds);

          const platformConnectionIds =
            platformConnections?.map((pc) => pc.id) || [];

          if (platformConnectionIds.length > 0) {
            // Build sentiment query with filters
            let sentimentQuery = supabase
              .from("reviews")
              .select(
                `
              id,
              rating,
              reviewer_gender,
              reviewer_age_range,
              platform_connection_id,
              published_at,
              sentiment_analysis (
                sentiment,
                sentiment_score
              )
            `
              )
              .in("platform_connection_id", platformConnectionIds);

            // Apply date filters
            if (filterStartDate) {
              sentimentQuery = sentimentQuery.gte(
                "published_at",
                filterStartDate
              );
            }
            if (filterEndDate) {
              sentimentQuery = sentimentQuery.lte(
                "published_at",
                filterEndDate
              );
            }

            const { data: sentimentResults, error: sentimentError } =
              await sentimentQuery;

            if (!sentimentError && sentimentResults) {
              // Calculate overall sentiment
              const sentiments = sentimentResults
                .filter(
                  (r: any) =>
                    r.sentiment_analysis &&
                    typeof r.sentiment_analysis === "object"
                )
                .map((r: any) => ({
                  sentiment: r.sentiment_analysis.sentiment,
                  score: r.sentiment_analysis.sentiment_score,
                  gender: r.reviewer_gender,
                  ageRange: r.reviewer_age_range,
                }));

              const totalReviewsWithSentiment = sentiments.length;

              if (totalReviewsWithSentiment > 0) {
                const positiveCount = sentiments.filter(
                  (s: any) => s.sentiment === "positive"
                ).length;
                const neutralCount = sentiments.filter(
                  (s: any) => s.sentiment === "neutral"
                ).length;
                const negativeCount = sentiments.filter(
                  (s: any) => s.sentiment === "negative"
                ).length;

                const avgScore =
                  sentiments.reduce(
                    (sum: number, s: any) => sum + (s.score || 0),
                    0
                  ) / totalReviewsWithSentiment;

                const overallSentiment =
                  avgScore >= 0.3
                    ? "positive"
                    : avgScore <= -0.3
                    ? "negative"
                    : "neutral";

                // Group by age range
                const ageGroupMap = new Map<
                  string,
                  { scores: number[]; count: number }
                >();
                sentiments.forEach((s: any) => {
                  if (s.ageRange && s.ageRange !== "unknown") {
                    const current = ageGroupMap.get(s.ageRange) || {
                      scores: [],
                      count: 0,
                    };
                    current.scores.push(s.score || 0);
                    current.count++;
                    ageGroupMap.set(s.ageRange, current);
                  }
                });

                const byAgeGroup = Array.from(ageGroupMap.entries())
                  .map(([ageRange, data]) => ({
                    ageRange,
                    avgScore:
                      data.scores.reduce((a, b) => a + b, 0) /
                      data.scores.length,
                    count: data.count,
                  }))
                  .sort((a, b) => {
                    const order = [
                      "18-24",
                      "25-34",
                      "35-44",
                      "45-54",
                      "55-64",
                      "65+",
                    ];
                    return (
                      order.indexOf(a.ageRange) - order.indexOf(b.ageRange)
                    );
                  });

                // Group by gender
                const genderMap = new Map<
                  string,
                  { scores: number[]; count: number }
                >();
                sentiments.forEach((s: any) => {
                  if (s.gender && s.gender !== "unknown") {
                    const current = genderMap.get(s.gender) || {
                      scores: [],
                      count: 0,
                    };
                    current.scores.push(s.score || 0);
                    current.count++;
                    genderMap.set(s.gender, current);
                  }
                });

                const byGender = Array.from(genderMap.entries()).map(
                  ([gender, data]) => ({
                    gender,
                    avgScore:
                      data.scores.reduce((a, b) => a + b, 0) /
                      data.scores.length,
                    count: data.count,
                  })
                );

                setSentimentData({
                  overallScore: avgScore,
                  overallSentiment,
                  totalReviews: totalReviewsWithSentiment,
                  positiveCount,
                  neutralCount,
                  negativeCount,
                  byAgeGroup,
                  byGender,
                });
              } else {
                setSentimentData(null);
              }
            } else {
              console.error("Error fetching sentiment data:", sentimentError);
            }
          } else {
            setSentimentData(null);
          }
        }

        // Fetch keywords for this company's reviews
        // Get location IDs (apply filter if needed)
        let keywordLocationIds = (locationsData || []).map(
          (loc: any) => loc.id
        );
        if (filterLocation !== "all") {
          const filteredLocs = (locationsData || []).filter(
            (loc: any) => loc.name === filterLocation
          );
          keywordLocationIds = filteredLocs.map((loc: any) => loc.id);
        }

        // Get review IDs for this company through platform_connections
        const reviewIds: string[] = [];
        if (keywordLocationIds.length > 0) {
          const { data: pcData } = await supabase
            .from("platform_connections")
            .select("id")
            .in("location_id", keywordLocationIds);

          const pcIds = pcData?.map((pc) => pc.id) || [];

          if (pcIds.length > 0) {
            // Build query with date filters if applicable
            let reviewQuery = supabase
              .from("reviews")
              .select("id")
              .in("platform_connection_id", pcIds);

            // Apply date filters
            if (filterStartDate) {
              reviewQuery = reviewQuery.gte("published_at", filterStartDate);
            }
            if (filterEndDate) {
              reviewQuery = reviewQuery.lte("published_at", filterEndDate);
            }

            const { data: reviewData } = await reviewQuery;
            reviewIds.push(...(reviewData?.map((r) => r.id) || []));
          }
        }

        if (reviewIds.length > 0) {
          // Get keywords for these reviews
          const { data: reviewKeywordsData } = await supabase
            .from("review_keywords")
            .select(
              `
              keyword_id,
              keywords (
                text,
                category
              )
            `
            )
            .in("review_id", reviewIds);

          if (reviewKeywordsData) {
            // Count occurrences of each keyword
            const keywordMap = new Map<
              string,
              { keyword_text: string; category: string; count: number }
            >();

            reviewKeywordsData.forEach((rk: any) => {
              if (rk.keywords) {
                const key = rk.keywords.text;
                const existing = keywordMap.get(key);
                if (existing) {
                  existing.count++;
        } else {
                  keywordMap.set(key, {
                    keyword_text: rk.keywords.text,
                    category: rk.keywords.category || "other",
                    count: 1,
                  });
                }
              }
            });

            // Convert to array and sort by count
            const keywordsArray = Array.from(keywordMap.values())
              .map((k) => ({
                keyword_text: k.keyword_text,
                category: k.category,
                occurrence_count: k.count,
              }))
              .sort((a, b) => b.occurrence_count - a.occurrence_count)
              .slice(0, 20);

            setKeywords(keywordsArray);
            analyzeKeywords(keywordsArray);
          } else {
            setKeywords([]);
          }
        } else {
          // No reviews found, set empty keywords
          setKeywords([]);
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [
    supabase,
    profile,
    companyId,
    navigate,
    filterLocation,
    filterStartDate,
    filterEndDate,
  ]);

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

  const handleFetchReviews = (platform: string) => {
    setSelectedPlatform(platform);
    setComingSoonOpen(true);
  };

  const handleCloseComingSoon = () => {
    setComingSoonOpen(false);
    setSelectedPlatform("");
  };

  const platforms = [
    { name: "Google", icon: <GoogleIcon />, color: "#4285F4" },
    { name: "Yelp", icon: <ReviewIcon />, color: "#D32323" },
    { name: "Facebook", icon: <FacebookIcon />, color: "#1877F2" },
    { name: "Trustpilot", icon: <StarIcon />, color: "#00B67A" },
    { name: "TripAdvisor", icon: <ReviewIcon />, color: "#34E0A1" },
  ];

  // Filter reviews based on review-specific filters (keyword and rating)
  // Location and date filters are already applied at the query level
  const filteredReviews = reviews.filter((review) => {
    // Filter by keyword (check if review content contains the keyword)
    if (selectedKeyword !== "all") {
      const contentLower = (review.content + " " + review.title).toLowerCase();
      if (!contentLower.includes(selectedKeyword.toLowerCase())) {
        return false;
      }
    }

    // Filter by rating
    if (selectedRating !== "all") {
      const rating = review.rating;
      switch (selectedRating) {
        case "5":
          if (rating < 5) return false;
          break;
        case "4":
          if (rating < 4 || rating >= 5) return false;
          break;
        case "3":
          if (rating < 3 || rating >= 4) return false;
          break;
        case "2":
          if (rating < 2 || rating >= 3) return false;
          break;
        case "1":
          if (rating < 1 || rating >= 2) return false;
          break;
      }
    }

    return true;
  });

  // Get unique locations from all locations (not just filtered reviews)
  const uniqueLocations = locations.map((loc) => loc.name).sort();

  // Get top keywords for filter dropdown (limit to top 20)
  const topKeywordsForFilter = keywords.slice(0, 20);

  const handleClearFilters = () => {
    setSelectedKeyword("all");
    setSelectedRating("all");
  };

  const handleClearAllFilters = () => {
    setFilterLocation("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setSelectedKeyword("all");
    setSelectedRating("all");
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

        {/* Page-level Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            bgcolor: "grey.50",
            border: 1,
            borderColor: "divider",
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={500}>
                  Data Filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Filter all data on this page by location and date range
                </Typography>
              </Box>
              {(filterLocation !== "all" ||
                filterStartDate ||
                filterEndDate) && (
                <Button
                  variant="text"
                  size="small"
                  onClick={handleClearAllFilters}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                  }}
                >
                  Clear all
                </Button>
              )}
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(3, 1fr)",
                },
                gap: 2,
              }}
            >
              {/* Location Filter */}
              <FormControl fullWidth size="small">
                <InputLabel id="page-location-filter-label">
                  Location
                </InputLabel>
                <Select
                  labelId="page-location-filter-label"
                  value={filterLocation}
                  label="Location"
                  onChange={(e) => setFilterLocation(e.target.value)}
                  sx={{ bgcolor: "background.paper" }}
                >
                  <MenuItem value="all">All Locations</MenuItem>
                  <Divider />
                  {uniqueLocations.map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Start Date Filter */}
              <TextField
                label="From Date"
                type="date"
                size="small"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ bgcolor: "background.paper" }}
              />

              {/* End Date Filter */}
              <TextField
                label="To Date"
                type="date"
                size="small"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ bgcolor: "background.paper" }}
              />
            </Box>

            {/* Active Filters Display */}
            {(filterLocation !== "all" || filterStartDate || filterEndDate) && (
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                alignItems="center"
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mr: 0.5 }}
                >
                  Active:
                </Typography>
                {filterLocation !== "all" && (
                  <Chip
                    label={filterLocation}
                    size="small"
                    variant="outlined"
                    onDelete={() => setFilterLocation("all")}
                  />
                )}
                {filterStartDate && (
                  <Chip
                    label={new Date(filterStartDate).toLocaleDateString()}
                    size="small"
                    variant="outlined"
                    onDelete={() => setFilterStartDate("")}
                  />
                )}
                {filterEndDate && (
                  <Chip
                    label={new Date(filterEndDate).toLocaleDateString()}
                    size="small"
                    variant="outlined"
                    onDelete={() => setFilterEndDate("")}
                  />
                )}
              </Stack>
            )}
          </Stack>
        </Paper>

        {/* Fetch Reviews Section */}
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Fetch Reviews from Platforms
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Connect to review platforms to import and analyze customer feedback
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(5, 1fr)",
              },
              gap: 2,
            }}
          >
            {platforms.map((platform) => (
              <Button
                key={platform.name}
                variant="outlined"
                size="large"
                startIcon={platform.icon}
                onClick={() => handleFetchReviews(platform.name)}
                sx={{
                  py: 2,
                  borderRadius: 3,
                  borderColor: "divider",
                  color: "text.primary",
                  "&:hover": {
                    borderColor: platform.color,
                    bgcolor: `${platform.color}08`,
                    "& .MuiSvgIcon-root": {
                      color: platform.color,
                    },
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: "1.5rem",
                  },
                }}
              >
                {platform.name}
              </Button>
            ))}
          </Box>
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

        {/* Sentiment Analysis */}
        {sentimentData && <SentimentAnalysis sentimentData={sentimentData} />}

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
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 3 }}
          >
            <Box>
          <Typography variant="h6" gutterBottom>
            Recent Reviews
          </Typography>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredReviews.length} of {reviews.length} reviews
            </Typography>
            </Box>
            {(selectedKeyword !== "all" || selectedRating !== "all") && (
              <Button
                variant="text"
                size="small"
                onClick={handleClearFilters}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                }}
              >
                Clear filters
              </Button>
            )}
          </Stack>

          {/* Review-specific Filters */}
          {reviews.length > 0 && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                bgcolor: "background.default",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1.5, display: "block" }}
              >
                Additional filters:
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {/* Keyword Filter */}
                <FormControl fullWidth size="small">
                  <InputLabel id="keyword-filter-label">Keyword</InputLabel>
                  <Select
                    labelId="keyword-filter-label"
                    value={selectedKeyword}
                    label="Keyword"
                    onChange={(e) => setSelectedKeyword(e.target.value)}
                  >
                    <MenuItem value="all">All Keywords</MenuItem>
                    {topKeywordsForFilter.map((keyword) => (
                      <MenuItem
                        key={keyword.keyword_text}
                        value={keyword.keyword_text}
                      >
                        {keyword.keyword_text} ({keyword.occurrence_count})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Rating Filter */}
                <FormControl fullWidth size="small">
                  <InputLabel id="rating-filter-label">Rating</InputLabel>
                  <Select
                    labelId="rating-filter-label"
                    value={selectedRating}
                    label="Rating"
                    onChange={(e) => setSelectedRating(e.target.value)}
                  >
                    <MenuItem value="all">All Ratings</MenuItem>
                    <MenuItem value="5">5 stars</MenuItem>
                    <MenuItem value="4">4 stars</MenuItem>
                    <MenuItem value="3">3 stars</MenuItem>
                    <MenuItem value="2">2 stars</MenuItem>
                    <MenuItem value="1">1 star</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}

          {filteredReviews.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <FilterListIcon
                sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No reviews match your filters
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Try adjusting your filters to see more results
              </Typography>
              <Button
                variant="contained"
                onClick={handleClearFilters}
                sx={{ borderRadius: 980 }}
              >
                Clear All Filters
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {filteredReviews.map((review) => (
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

      {/* Coming Soon Modal */}
      <Dialog
        open={comingSoonOpen}
        onClose={handleCloseComingSoon}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5" component="div">
              {selectedPlatform} Integration
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseComingSoon}
              sx={{
                color: "text.secondary",
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 4 }}>
          <Stack spacing={3} alignItems="center" sx={{ textAlign: "center" }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "primary.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StarIcon sx={{ fontSize: 40, color: "primary.main" }} />
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom>
                Coming Soon!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {selectedPlatform} integration is currently under development.
                We're working hard to bring you seamless review imports from all
                major platforms.
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: "background.default",
                p: 2,
                borderRadius: 2,
                width: "100%",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Stay tuned for updates! We'll notify you as soon as this feature
                becomes available.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseComingSoon}
            variant="contained"
            size="large"
            fullWidth
            sx={{ borderRadius: 980, py: 1.5 }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
