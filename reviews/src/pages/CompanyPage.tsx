import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  SwapHoriz as SwapHorizIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
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
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  CompanyHeader,
  LocationComponent,
  MonthlySummary,
  RatingDistributionChart,
  ReviewsList,
  ReviewsTimelineChart,
  StatCardWithTrend,
} from "../components";
import { PlatformConnectionDialog } from "../components/PlatformConnectionDialog";
import { SEO } from "../components/SEO";
import { SentimentAnalysis } from "../components/SentimentAnalysis";
import {
  KeywordChipSkeleton,
  ReviewCardSkeleton,
  StatCardSkeleton,
} from "../components/SkeletonLoaders";
import { UserContext } from "../context/UserContext";
import { usePlatformIntegration } from "../hooks/usePlatformIntegration";
import { useSupabase } from "../hooks/useSupabase";
import { ReviewsService } from "../services/reviewsService";

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
  logo_url?: string;
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
  emotions: {
    emoji: string;
    count: number;
    percentage: number;
  }[];
}

interface Topic {
  id: string;
  name: string;
  category: string;
  description: string;
  occurrence_count: number;
}

export const CompanyPage = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { t } = useTranslation();
  const supabase = useSupabase();
  const context = useContext(UserContext);
  const profile = context?.profile;
  const navigate = useNavigate();
  const {
    connectPlatformUnified,
    error: platformError,
    success: platformSuccess,
  } = usePlatformIntegration();

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [companyOwnerId, setCompanyOwnerId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]); // All reviews for charts
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(
    null
  );
  const [topics, setTopics] = useState<Topic[]>([]);
  const [reviewKeywordsMap, setReviewKeywordsMap] = useState<
    Record<string, string[]>
  >({});
  const [reviewTopicsMap, setReviewTopicsMap] = useState<
    Record<string, string[]>
  >({});
  const [locationConnections, setLocationConnections] = useState<
    Record<
      string,
      Array<{
        id: string;
        platform_id: string;
        platform_location_id: string;
        platform_url?: string;
        is_active: boolean;
        last_sync_at?: string;
        platform: {
          name: string;
          display_name: string;
          icon_url?: string;
        };
      }>
    >
  >({});
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");

  // Platform integration state
  const [platformDialogOpen, setPlatformDialogOpen] = useState(false);
  const [companyLocations, setCompanyLocations] = useState<
    Array<{ id: string; name: string; address: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Page-level filters (apply to all data)
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // Review-specific filters
  const [selectedKeyword, setSelectedKeyword] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  // Pagination for reviews
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 50;
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);

  // Toggle for showing all topics and keywords
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [showAllKeywords, setShowAllKeywords] = useState(false);

  // Chart data state
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });
  const [timelineData, setTimelineData] = useState<
    Array<{
      date: string;
      count: number;
      avgRating: number;
      positive: number;
      negative: number;
    }>
  >([]);

  // Refresh function
  const refreshPageData = async () => {
    if (!profile || !companyId) return;

    setRefreshing(true);
    try {
      // Fetch company details
      // For admins, don't filter by owner_id (they can see all companies)
      // For regular users, filter by owner_id
      let companyQuery = supabase
        .from("companies")
        .select("*")
        .eq("id", companyId);

      if (profile.role !== "admin") {
        companyQuery = companyQuery.eq("owner_id", profile.id);
      }

      const { data: companyData, error: companyError } =
        await companyQuery.single();

      if (companyError) {
        console.error("Error fetching company:", companyError);
        return;
      }

      // Store owner_id for transfer button check
      setCompanyOwnerId(companyData.owner_id);

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
        setLocations([]);
      } else {
        // For each location, get review stats through platform_connections
        const locationsWithStats = await Promise.all(
          (locationsData || []).map(async (location) => {
            const { data: platformConnections } = await supabase
              .from("platform_connections")
              .select("id")
              .eq("location_id", location.id);

            const platformConnectionIds =
              platformConnections?.map((pc) => pc.id) || [];

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

        // Fetch platform connections for each location
        const reviewsService = new ReviewsService(supabase);
        const connectionsMap: Record<string, any[]> = {};

        for (const location of locationsWithStats) {
          try {
            const connections =
              await reviewsService.getLocationPlatformConnections(location.id);
            connectionsMap[location.id] = connections;
          } catch (err) {
            console.error(
              `Error fetching connections for location ${location.id}:`,
              err
            );
            connectionsMap[location.id] = [];
          }
        }

        setLocationConnections(connectionsMap);
      }
    } catch (error) {
      console.error("Error refreshing company data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial data loading - only runs once
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!profile || !companyId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch company details
        // For admins, don't filter by owner_id (they can see all companies)
        // For regular users, filter by owner_id
        let companyQuery = supabase
          .from("companies")
          .select("*")
          .eq("id", companyId);

        if (profile.role !== "admin") {
          companyQuery = companyQuery.eq("owner_id", profile.id);
        }

        const { data: companyData, error: companyError } =
          await companyQuery.single();

        if (companyError) {
          console.error("Error fetching company:", companyError);
          navigate("/companies");
          return;
        }

        // Store owner_id for transfer button check
        setCompanyOwnerId(companyData.owner_id);

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
          setLocations([]);
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

          // Fetch platform connections for each location
          const reviewsService = new ReviewsService(supabase);
          const connectionsMap: Record<string, any[]> = {};

          for (const location of locationsWithStats) {
            try {
              const connections =
                await reviewsService.getLocationPlatformConnections(
                  location.id
                );
              connectionsMap[location.id] = connections;
            } catch (err) {
              console.error(
                `Error fetching connections for location ${location.id}:`,
                err
              );
              connectionsMap[location.id] = [];
            }
          }

          setLocationConnections(connectionsMap);
        }
      } catch (error) {
        console.error("Error fetching initial company data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [supabase, profile, companyId, navigate]);

  // Filtered data loading - runs when filters change
  useEffect(() => {
    const fetchFilteredData = async () => {
      if (!companyId || loading) return;

      setFilterLoading(true);
      try {
        // Build base query for reviews
        let reviewsQuery = supabase
          .from("recent_reviews")
          .select("*")
          .eq("company_id", companyId);

        let countQuery = supabase
          .from("recent_reviews")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId);

        // Apply location filter
        if (filterLocation !== "all") {
          reviewsQuery = reviewsQuery.eq("location_name", filterLocation);
          countQuery = countQuery.eq("location_name", filterLocation);
        }

        // Apply date range filters
        if (filterStartDate) {
          reviewsQuery = reviewsQuery.gte("published_at", filterStartDate);
          countQuery = countQuery.gte("published_at", filterStartDate);
        }
        if (filterEndDate) {
          reviewsQuery = reviewsQuery.lte("published_at", filterEndDate);
          countQuery = countQuery.lte("published_at", filterEndDate);
        }

        // Apply rating filter
        if (selectedRating !== "all") {
          const ratingNum = parseInt(selectedRating);
          reviewsQuery = reviewsQuery
            .gte("rating", ratingNum)
            .lt("rating", ratingNum + 1);
          countQuery = countQuery
            .gte("rating", ratingNum)
            .lt("rating", ratingNum + 1);
        }

        // Apply keyword filter - requires fetching review IDs that have the keyword
        if (selectedKeyword !== "all") {
          // First, get all review IDs that match this keyword
          const { data: keywordReviews } = await supabase
            .from("review_keywords")
            .select("review_id, keywords!inner(text)")
            .ilike("keywords.text", selectedKeyword);

          const reviewIds =
            keywordReviews?.map((rk: any) => rk.review_id) || [];

          if (reviewIds.length > 0) {
            reviewsQuery = reviewsQuery.in("id", reviewIds);
            countQuery = countQuery.in("id", reviewIds);
          } else {
            // No reviews match this keyword, return empty results
            setReviews([]);
            setTotalReviewsCount(0);
            setAllReviews([]);
            return;
          }
        }

        // Get total count for pagination
        const { count, error: countError } = await countQuery;

        if (countError) {
          console.error("Error counting reviews:", countError);
          setTotalReviewsCount(0);
        } else {
          setTotalReviewsCount(count || 0);
        }

        // Calculate pagination offset
        const offset = (currentPage - 1) * reviewsPerPage;

        // Apply server-side pagination
        reviewsQuery = reviewsQuery
          .order("published_at", { ascending: false })
          .range(offset, offset + reviewsPerPage - 1);

        const { data: reviewsData, error: reviewsError } = await reviewsQuery;

        if (reviewsError) {
          console.error("Error fetching reviews:", reviewsError);
          setReviews([]);
        } else {
          setReviews(reviewsData || []);
        }

        // Fetch all reviews for charts (ignore recent filter)
        const { data: allReviewsData } = await supabase
          .from("recent_reviews")
          .select("*")
          .eq("company_id", companyId);

        if (allReviewsData) {
          setAllReviews(allReviewsData);
        }

        // Fetch sentiment analysis data with filters
        const { data: locationsData } = await supabase
          .from("locations")
          .select("id, name")
          .eq("company_id", companyId);

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
                sentiment_score,
                emotions
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
              // Apply additional filters (keyword, rating, topic) to sentiment results
              let filteredSentimentResults = sentimentResults;

              // Filter by keyword
              if (selectedKeyword !== "all") {
                filteredSentimentResults = filteredSentimentResults.filter(
                  (r: any) => {
                    const reviewKeywords = reviewKeywordsMap[r.id] || [];
                    const selectedKeywordLower = selectedKeyword.toLowerCase();
                    return reviewKeywords.some(
                      (k) => k.toLowerCase() === selectedKeywordLower
                    );
                  }
                );
              }

              // Filter by rating
              if (selectedRating !== "all") {
                filteredSentimentResults = filteredSentimentResults.filter(
                  (r: any) => {
                    const rating = r.rating;
                    switch (selectedRating) {
                      case "5":
                        return rating >= 5;
                      case "4":
                        return rating >= 4 && rating < 5;
                      case "3":
                        return rating >= 3 && rating < 4;
                      case "2":
                        return rating >= 2 && rating < 3;
                      case "1":
                        return rating >= 1 && rating < 2;
                      default:
                        return true;
                    }
                  }
                );
              }

              // Filter by topic
              if (selectedTopic !== "all") {
                filteredSentimentResults = filteredSentimentResults.filter(
                  (r: any) => {
                    const reviewTopics = reviewTopicsMap[r.id] || [];
                    const selectedTopicLower = selectedTopic.toLowerCase();
                    return reviewTopics.some(
                      (t) => t.toLowerCase() === selectedTopicLower
                    );
                  }
                );
              }

              // Calculate overall sentiment
              const sentiments = filteredSentimentResults
                .filter(
                  (r: any) =>
                    r.sentiment_analysis &&
                    typeof r.sentiment_analysis === "object"
                )
                .map((r: any) => ({
                  sentiment: r.sentiment_analysis.sentiment,
                  score: r.sentiment_analysis.sentiment_score,
                  emotions: r.sentiment_analysis.emotions || {},
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

                // Aggregate emotions from emoticons
                const emotionCounts = new Map<string, number>();
                sentiments.forEach((s: any) => {
                  // Handle emotions as JSONB object
                  if (s.emotions) {
                    try {
                      // Parse emotions if it's a string, otherwise use as object
                      let emotionsData = s.emotions;
                      if (typeof s.emotions === "string") {
                        emotionsData = JSON.parse(s.emotions);
                      }

                      // Check if emoticons array exists
                      if (
                        emotionsData &&
                        Array.isArray(emotionsData.emoticons)
                      ) {
                        emotionsData.emoticons.forEach((emoji: string) => {
                          emotionCounts.set(
                            emoji,
                            (emotionCounts.get(emoji) || 0) + 1
                          );
                        });
                      }
                    } catch (error) {
                      console.error("Error parsing emotions:", error);
                    }
                  }
                });

                const emotionAggregate = Array.from(emotionCounts.entries())
                  .map(([emoji, count]) => ({
                    emoji,
                    count,
                    percentage: (count / totalReviewsWithSentiment) * 100,
                  }))
                  .sort((a, b) => b.count - a.count);

                setSentimentData({
                  overallScore: avgScore,
                  overallSentiment,
                  totalReviews: totalReviewsWithSentiment,
                  positiveCount,
                  neutralCount,
                  negativeCount,
                  byAgeGroup,
                  byGender,
                  emotions: emotionAggregate,
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

        // Fetch keywords for this company's reviews using platform_connection_id
        let keywordLocationIds = (locationsData || []).map(
          (loc: any) => loc.id
        );
        if (filterLocation !== "all") {
          const filteredLocs = (locationsData || []).filter(
            (loc: any) => loc.name === filterLocation
          );
          keywordLocationIds = filteredLocs.map((loc: any) => loc.id);
        }

        // Get platform_connection IDs directly (much more efficient than getting all review IDs)
        const platformConnectionIds: string[] = [];
        if (keywordLocationIds.length > 0) {
          const { data: pcData } = await supabase
            .from("platform_connections")
            .select("id")
            .in("location_id", keywordLocationIds);

          platformConnectionIds.push(...(pcData?.map((pc) => pc.id) || []));
        }

        if (platformConnectionIds.length > 0) {
          // Query review_keywords directly by platform_connection_id (avoids URL length limits)
          const { data: reviewKeywordsData } = await supabase
            .from("review_keywords")
            .select(
              `
              review_id,
              keywords (
                text,
                category
              )
            `
            )
            .in("platform_connection_id", platformConnectionIds);

          if (reviewKeywordsData && reviewKeywordsData.length > 0) {
            // Build review keywords map and count occurrences
            const keywordsMap: Record<string, string[]> = {};
            const keywordCountMap = new Map<
              string,
              { keyword_text: string; category: string; count: number }
            >();

            // Group by review_id to build the map
            const reviewKeywordsGrouped: Record<string, any[]> = {};
            reviewKeywordsData.forEach((rk: any) => {
              if (!reviewKeywordsGrouped[rk.review_id]) {
                reviewKeywordsGrouped[rk.review_id] = [];
              }
              reviewKeywordsGrouped[rk.review_id].push(rk);
            });

            // Build keywords map and count
            Object.entries(reviewKeywordsGrouped).forEach(
              ([reviewId, reviewKeywords]) => {
                keywordsMap[reviewId] = reviewKeywords
                  .filter((rk: any) => rk.keywords)
                  .map((rk: any) => rk.keywords.text.toLowerCase());

                // Count keyword occurrences
                reviewKeywords.forEach((rk: any) => {
                  if (rk.keywords) {
                    const key = rk.keywords.text;
                    const existing = keywordCountMap.get(key);
                    if (existing) {
                      existing.count++;
                    } else {
                      keywordCountMap.set(key, {
                        keyword_text: rk.keywords.text,
                        category: rk.keywords.category || "other",
                        count: 1,
                      });
                    }
                  }
                });
              }
            );

            setReviewKeywordsMap(keywordsMap);

            // Convert to array and sort by count
            const keywordsArray = Array.from(keywordCountMap.values())
              .map((k) => ({
                keyword_text: k.keyword_text,
                category: k.category,
                occurrence_count: k.count,
              }))
              .sort((a, b) => b.occurrence_count - a.occurrence_count)
              .slice(0, 10);

            setKeywords(keywordsArray);
            analyzeKeywords(keywordsArray);
          } else {
            setKeywords([]);
            setReviewKeywordsMap({});
          }

          // Query review_topics directly by platform_connection_id (avoids URL length limits)
          const { data: reviewTopicsData } = await supabase
            .from("review_topics")
            .select(
              `
              review_id,
              topics (
                id,
                name,
                category,
                description
              )
            `
            )
            .in("platform_connection_id", platformConnectionIds);

          if (reviewTopicsData && reviewTopicsData.length > 0) {
            // Build review topics map and count occurrences
            const topicsMap: Record<string, string[]> = {};
            const topicCountMap = new Map<
              string,
              {
                id: string;
                name: string;
                category: string;
                description: string;
                count: number;
              }
            >();

            // Group by review_id to build the map
            const reviewTopicsGrouped: Record<string, any[]> = {};
            reviewTopicsData.forEach((rt: any) => {
              if (!reviewTopicsGrouped[rt.review_id]) {
                reviewTopicsGrouped[rt.review_id] = [];
              }
              reviewTopicsGrouped[rt.review_id].push(rt);
            });

            // Build topics map and count
            Object.entries(reviewTopicsGrouped).forEach(
              ([reviewId, reviewTopics]) => {
                topicsMap[reviewId] = reviewTopics
                  .filter((rt: any) => rt.topics)
                  .map((rt: any) => rt.topics.name.toLowerCase());

                // Count topic occurrences
                reviewTopics.forEach((rt: any) => {
                  if (rt.topics) {
                    const topicId = rt.topics.id;
                    const topicName = rt.topics.name;
                    const existing = topicCountMap.get(topicName);
                    if (existing) {
                      existing.count++;
                    } else {
                      topicCountMap.set(topicName, {
                        id: topicId,
                        name: rt.topics.name,
                        category: rt.topics.category || "neutral",
                        description: rt.topics.description || "",
                        count: 1,
                      });
                    }
                  }
                });
              }
            );

            setReviewTopicsMap(topicsMap);

            // Convert to array and sort by count
            const topicsArray = Array.from(topicCountMap.values())
              .map((t) => ({
                id: t.id,
                name: t.name,
                category: t.category,
                description: t.description,
                occurrence_count: t.count,
              }))
              .sort((a, b) => b.occurrence_count - a.occurrence_count)
              .slice(0, 6);

            setTopics(topicsArray);
          } else {
            setTopics([]);
            setReviewTopicsMap({});
          }
        } else {
          // No reviews found, set empty keywords
          setKeywords([]);
        }
      } catch (error) {
        console.error("Error fetching filtered data:", error);
      } finally {
        setFilterLoading(false);
      }
    };

    fetchFilteredData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    companyId,
    filterLocation,
    filterStartDate,
    filterEndDate,
    selectedKeyword,
    selectedRating,
    selectedTopic,
    loading,
    currentPage,
  ]);

  // Calculate chart data from reviews
  useEffect(() => {
    const calculateChartData = async () => {
      // Filter reviews based on ALL active filters for charts (location, date, keyword, rating, topic)
      let filteredForCharts = allReviews.length > 0 ? allReviews : reviews;

      // Apply location filter
      if (filterLocation !== "all") {
        filteredForCharts = filteredForCharts.filter(
          (review: any) => review.location_name === filterLocation
        );
      }

      // Apply date range filters
      if (filterStartDate) {
        filteredForCharts = filteredForCharts.filter(
          (review: any) =>
            new Date(review.published_at) >= new Date(filterStartDate)
        );
      }
      if (filterEndDate) {
        filteredForCharts = filteredForCharts.filter(
          (review: any) =>
            new Date(review.published_at) <= new Date(filterEndDate)
        );
      }

      // Apply keyword filter
      if (selectedKeyword !== "all") {
        filteredForCharts = filteredForCharts.filter((review: any) => {
          const reviewKeywords = reviewKeywordsMap[review.id] || [];
          const selectedKeywordLower = selectedKeyword.toLowerCase();
          return reviewKeywords.some(
            (k) => k.toLowerCase() === selectedKeywordLower
          );
        });
      }

      // Apply rating filter
      if (selectedRating !== "all") {
        filteredForCharts = filteredForCharts.filter((review: any) => {
          const rating = review.rating;
          switch (selectedRating) {
            case "5":
              return rating >= 5;
            case "4":
              return rating >= 4 && rating < 5;
            case "3":
              return rating >= 3 && rating < 4;
            case "2":
              return rating >= 2 && rating < 3;
            case "1":
              return rating >= 1 && rating < 2;
            default:
              return true;
          }
        });
      }

      // Apply topic filter
      if (selectedTopic !== "all") {
        filteredForCharts = filteredForCharts.filter((review: any) => {
          const reviewTopics = reviewTopicsMap[review.id] || [];
          const selectedTopicLower = selectedTopic.toLowerCase();
          return reviewTopics.some(
            (t) => t.toLowerCase() === selectedTopicLower
          );
        });
      }

      if (filteredForCharts.length === 0) {
        setRatingDistribution({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        setTimelineData([]);
        return;
      }

      // Calculate rating distribution from filtered reviews
      const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      filteredForCharts.forEach((review) => {
        const rating = Math.floor(review.rating);
        if (rating >= 1 && rating <= 5) {
          ratingCounts[rating as keyof typeof ratingCounts]++;
        }
      });
      setRatingDistribution(ratingCounts);

      // Calculate timeline data (group by week) from all reviews
      const timelineMap = new Map<
        string,
        { count: number; sumRating: number; positive: number; negative: number }
      >();

      filteredForCharts.forEach((review) => {
        const date = new Date(review.published_at);
        // Get start of week (Monday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1);
        const weekKey = weekStart.toISOString().split("T")[0];

        const existing = timelineMap.get(weekKey) || {
          count: 0,
          sumRating: 0,
          positive: 0,
          negative: 0,
        };
        existing.count++;
        existing.sumRating += review.rating;
        if (review.sentiment === "positive") existing.positive++;
        if (review.sentiment === "negative") existing.negative++;
        timelineMap.set(weekKey, existing);
      });

      const timeline = Array.from(timelineMap.entries())
        .map(([date, data]) => ({
          date,
          count: Math.floor(data.count), // Remove decimals
          avgRating: data.sumRating / data.count,
          positive: data.positive,
          negative: data.negative,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setTimelineData(timeline);
    };

    calculateChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    reviews,
    allReviews,
    filterLocation,
    filterStartDate,
    filterEndDate,
    selectedKeyword,
    selectedRating,
    selectedTopic,
  ]);

  // Check for fetch_reviews_platform query parameter and trigger platform connection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const platform = params.get("fetch_reviews_platform");

    if (platform && !loading && company) {
      // Remove the query parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Trigger platform connection
      handleFetchReviews(platform);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, company]); // Only run when component is loaded and company data is available

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

  const handleFetchReviews = async (platform: string) => {
    setSelectedPlatform(platform);

    // All platforms use the same unified flow now
    try {
      // Get company locations
      const { data: locations, error } = await supabase
        .from("locations")
        .select("id, name, address, city")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (error) throw error;

      if (!locations || locations.length === 0) {
        setError(
          "Please add at least one location to this company before connecting platforms."
        );
        return;
      }

      setCompanyLocations(locations);
      setPlatformDialogOpen(true);
    } catch (err: any) {
      setError(err.message || "Failed to load company locations");
    }
  };

  // Selective refresh function for after platform connection
  const refreshDataAfterConnection = async (
    platformName: string,
    locationId: string
  ) => {
    try {
      // Refresh company stats
      const { data: statsData, error: statsError } = await supabase
        .from("company_stats")
        .select("*")
        .eq("company_id", companyId)
        .single();

      if (!statsError && statsData && company) {
        setCompany({
          ...company,
          total_reviews: statsData.total_reviews || 0,
          average_rating: statsData.average_rating || 0,
          positive_reviews: statsData.positive_reviews || 0,
          negative_reviews: statsData.negative_reviews || 0,
          neutral_reviews: statsData.neutral_reviews || 0,
          total_locations: statsData.total_locations || 0,
        });
      }

      // Refresh location stats for the specific location
      const { data: locationData } = await supabase
        .from("locations")
        .select("*")
        .eq("id", locationId)
        .single();

      if (locationData) {
        // Get updated review stats for this location
        const { data: platformConnections } = await supabase
          .from("platform_connections")
          .select("id")
          .eq("location_id", locationId);

        const platformConnectionIds =
          platformConnections?.map((pc) => pc.id) || [];
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
            ? reviewStats.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

        // Update the specific location in the locations array
        setLocations((prevLocations) =>
          prevLocations.map((loc) =>
            loc.id === locationId
              ? {
                  ...loc,
                  total_reviews: totalReviews,
                  average_rating: averageRating,
                }
              : loc
          )
        );
      }

      // Refresh platform connections for this location
      const reviewsService = new ReviewsService(supabase);
      try {
        const connections = await reviewsService.getLocationPlatformConnections(
          locationId
        );
        setLocationConnections((prevConnections) => ({
          ...prevConnections,
          [locationId]: connections,
        }));
      } catch (err) {
        console.error(
          `Error refreshing connections for location ${locationId}:`,
          err
        );
      }

      // Refresh reviews data
      try {
        // Fetch reviews for this company with current filters
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
          console.error("Error refreshing reviews:", reviewsError);
        } else {
          setReviews(reviewsData || []);
        }
      } catch (err) {
        console.error("Error refreshing reviews data:", err);
      }
    } catch (error) {
      console.error("Error refreshing data after platform connection:", error);
    }
  };

  const handlePlatformConnect = async (
    platformLocationId: string,
    locationId: string,
    platformName: string,
    verifiedListing?: any
  ) => {
    if (!companyId) return;

    try {
      await connectPlatformUnified(
        platformName.toLowerCase(),
        platformLocationId,
        locationId,
        verifiedListing
      );

      // Refresh only the necessary data after successful connection
      await refreshDataAfterConnection(platformName.toLowerCase(), locationId);

      // Show success message
      setSuccessMessage(
        `Reviews from ${platformName} will be available shortly. Use the refresh button in the top right to check for new reviews.`
      );

      // Close the dialog
      setPlatformDialogOpen(false);
      setCompanyLocations([]);
      setSelectedPlatform("");
    } catch (err: any) {
      setError(err.message || "Failed to connect platform");
    }
  };

  const handlePlatformDialogClose = () => {
    setPlatformDialogOpen(false);
    setCompanyLocations([]);
    setSelectedPlatform("");
  };

  const handleCloseComingSoon = () => {
    setComingSoonOpen(false);
    setSelectedPlatform("");
  };

  // Calculate total pages from server-side count
  const totalPages = Math.ceil(totalReviewsCount / reviewsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedKeyword, selectedRating, selectedTopic]);

  // Get unique locations from all locations (not just filtered reviews)
  const uniqueLocations = locations.map((loc) => loc.name).sort();

  // Get top keywords for filter dropdown (limit to top 20)
  const topKeywordsForFilter = keywords.slice(0, 20);

  const handleClearFilters = () => {
    setSelectedKeyword("all");
    setSelectedRating("all");
    setSelectedTopic("all");
  };

  const handleClearAllFilters = () => {
    setFilterLocation("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setSelectedKeyword("all");
    setSelectedRating("all");
    setSelectedTopic("all");
  };

  const handleDeleteCompany = async () => {
    if (!companyId || !company) return;

    try {
      setDeleting(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyId);

      if (deleteError) throw deleteError;

      // Navigate to companies page after successful deletion
      navigate("/companies");
    } catch (err: any) {
      console.error("Error deleting company:", err);
      setError(
        err.message ||
          t("companyPage.deleteCompanyError", "Failed to delete company")
      );
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Container
        maxWidth="xl"
        sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
        <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/dashboard")}
            >
              {t("companyPage.backToDashboard")}
            </Button>
          </Box>

          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {t("companyPage.loadingCompanyData")}
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

          <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
            <Typography variant="h6" gutterBottom>
              {t("companyPage.recentReviews")}
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
      <Container
        maxWidth="xl"
        sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
        <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/dashboard")}
          >
            {t("companyPage.backToDashboard")}
          </Button>
          <Typography variant="h5">
            {t("companyPage.companyNotFound")}
          </Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <>
      <SEO
        title={t("companyPage.seoTitle", { company: company.name })}
        description={t("companyPage.seoDescription", { company: company.name })}
        keywords={t("companyPage.seoKeywords", {
          company: company.name,
          industry: company.industry || "business",
        })}
      />
      <Container
        maxWidth="xl"
        sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
        <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Back Button and Actions */}
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/dashboard")}
              sx={{
                alignSelf: "flex-start",
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("companyPage.backToDashboard")}
              </Box>
              <Box
                component="span"
                sx={{ display: { xs: "inline", sm: "none" } }}
              >
                {t("companyPage.back")}
              </Box>
            </Button>

            <Stack direction="row" spacing={2}>
              {/* Transfer Ownership Button - Show only if admin and owns company */}
              {profile?.role === "admin" &&
                companyOwnerId === profile.id &&
                companyId && (
                  <Button
                    startIcon={<SwapHorizIcon />}
                    onClick={() =>
                      navigate(`/companies/${companyId}/transfer-ownership`)
                    }
                    variant="outlined"
                    color="primary"
                  >
                    {t("companyPage.transferOwnership", "Transfer Ownership")}
                  </Button>
                )}

              <Button
                startIcon={<RefreshIcon />}
                onClick={refreshPageData}
                disabled={refreshing}
                variant="outlined"
              >
                {t("companyPage.refresh")}
              </Button>
            </Stack>
          </Stack>

          {/* Company Header */}
          <CompanyHeader
            company={company}
            onLogoUpdate={(logoUrl) => {
              setCompany({ ...company, logo_url: logoUrl });
            }}
          />

          {/* Monthly Summary */}
          {companyId && <MonthlySummary companyId={companyId} />}

          {/* Locations */}
          {companyId && (
            <LocationComponent
              locations={locations}
              locationConnections={locationConnections}
              companyId={companyId}
              companyName={company?.name || ""}
              onReviewsFetched={() => {
                // Refresh reviews data after fetching
                const refreshReviews = async () => {
                  try {
                    let reviewsQuery = supabase
                      .from("recent_reviews")
                      .select("*")
                      .eq("company_id", companyId);

                    // Apply location filter
                    if (filterLocation !== "all") {
                      reviewsQuery = reviewsQuery.eq(
                        "location_name",
                        filterLocation
                      );
                    }

                    // Apply date range filters
                    if (filterStartDate) {
                      reviewsQuery = reviewsQuery.gte(
                        "published_at",
                        filterStartDate
                      );
                    }
                    if (filterEndDate) {
                      reviewsQuery = reviewsQuery.lte(
                        "published_at",
                        filterEndDate
                      );
                    }

                    const { data: reviewsData, error: reviewsError } =
                      await reviewsQuery
                        .order("published_at", { ascending: false })
                        .limit(50);

                    if (reviewsError) {
                      console.error("Error refreshing reviews:", reviewsError);
                    } else {
                      setReviews(reviewsData || []);
                    }
                  } catch (err) {
                    console.error("Error refreshing reviews data:", err);
                  }
                };
                refreshReviews();
              }}
              onConnectionCreated={async () => {
                // Refresh location connections after platform connection
                try {
                  const reviewsService = new ReviewsService(supabase);
                  const connectionsMap: Record<string, any[]> = {};

                  for (const location of locations) {
                    const connections = await reviewsService
                      .getLocationPlatformConnections(location.id)
                      .catch(() => []);
                    connectionsMap[location.id] = connections || [];
                  }

                  setLocationConnections(connectionsMap);
                } catch (err) {
                  console.error("Error refreshing location connections:", err);
                }
              }}
            />
          )}

          {/* Unified Filters */}
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
                    {t("companyPage.dataFilters")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("companyPage.dataFiltersDescription")}
                  </Typography>
                </Box>
                {(filterLocation !== "all" ||
                  filterStartDate ||
                  filterEndDate ||
                  selectedKeyword !== "all" ||
                  selectedRating !== "all" ||
                  selectedTopic !== "all") && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleClearAllFilters}
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                    }}
                  >
                    {t("companyPage.clearAll")}
                  </Button>
                )}
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {/* Location Filter */}
                <FormControl fullWidth size="small">
                  <InputLabel id="page-location-filter-label">
                    {t("companyPage.allLocations")}
                  </InputLabel>
                  <Select
                    labelId="page-location-filter-label"
                    value={filterLocation}
                    label={t("companyPage.allLocations")}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    sx={{ bgcolor: "background.paper" }}
                  >
                    <MenuItem value="all">
                      {t("companyPage.allLocations")}
                    </MenuItem>
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
                  label={t("companyPage.fromDate")}
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
                  label={t("companyPage.toDate")}
                  type="date"
                  size="small"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ bgcolor: "background.paper" }}
                />

                {/* Keyword Filter */}
                <FormControl fullWidth size="small">
                  <InputLabel id="keyword-filter-label">
                    {t("companyPage.keyword")}
                  </InputLabel>
                  <Select
                    labelId="keyword-filter-label"
                    value={selectedKeyword}
                    label={t("companyPage.keyword")}
                    onChange={(e) => setSelectedKeyword(e.target.value)}
                    sx={{ bgcolor: "background.paper" }}
                  >
                    <MenuItem value="all">
                      {t("companyPage.allKeywords")}
                    </MenuItem>
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
                  <InputLabel id="rating-filter-label">
                    {t("companyPage.rating")}
                  </InputLabel>
                  <Select
                    labelId="rating-filter-label"
                    value={selectedRating}
                    label={t("companyPage.rating")}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    sx={{ bgcolor: "background.paper" }}
                  >
                    <MenuItem value="all">
                      {t("companyPage.allRatings")}
                    </MenuItem>
                    <MenuItem value="5">5 {t("companyPage.stars")}</MenuItem>
                    <MenuItem value="4">4 {t("companyPage.stars")}</MenuItem>
                    <MenuItem value="3">3 {t("companyPage.stars")}</MenuItem>
                    <MenuItem value="2">2 {t("companyPage.stars")}</MenuItem>
                    <MenuItem value="1">1 {t("companyPage.star")}</MenuItem>
                  </Select>
                </FormControl>

                {/* Topic Filter */}
                <FormControl fullWidth size="small">
                  <InputLabel id="topic-filter-label">
                    {t("companyPage.topic")}
                  </InputLabel>
                  <Select
                    labelId="topic-filter-label"
                    value={selectedTopic}
                    label={t("companyPage.topic")}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    sx={{ bgcolor: "background.paper" }}
                  >
                    <MenuItem value="all">
                      {t("companyPage.allTopics")}
                    </MenuItem>
                    {topics.map((topic) => (
                      <MenuItem key={topic.id} value={topic.name}>
                        {topic.name} ({topic.occurrence_count})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Active Filters Display */}
              {(filterLocation !== "all" ||
                filterStartDate ||
                filterEndDate ||
                selectedKeyword !== "all" ||
                selectedRating !== "all" ||
                selectedTopic !== "all") && (
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
                    {t("companyPage.active")}
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
                  {selectedKeyword !== "all" && (
                    <Chip
                      label={t("companyPage.keywordLabel", {
                        keyword: selectedKeyword,
                      })}
                      size="small"
                      variant="outlined"
                      onDelete={() => setSelectedKeyword("all")}
                    />
                  )}
                  {selectedRating !== "all" && (
                    <Chip
                      label={t("companyPage.starsLabel", {
                        rating: selectedRating,
                        stars: t("companyPage.stars"),
                      })}
                      size="small"
                      variant="outlined"
                      onDelete={() => setSelectedRating("all")}
                    />
                  )}
                  {selectedTopic !== "all" && (
                    <Chip
                      label={t("companyPage.topicLabel", {
                        topic: selectedTopic,
                      })}
                      size="small"
                      variant="outlined"
                      onDelete={() => setSelectedTopic("all")}
                    />
                  )}
                </Stack>
              )}
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
              gap: { xs: 2, sm: 3 },
            }}
          >
            <StatCardWithTrend
              title={t("companyPage.totalReviews")}
              value={company.total_reviews}
              color="primary.main"
            />
            <StatCardWithTrend
              title={t("companyPage.averageRating")}
              value={`${company.average_rating.toFixed(1)}`}
              icon={<StarIcon />}
              color="warning.main"
            />
            <StatCardWithTrend
              title={t("companyPage.positiveReviews")}
              value={company.positive_reviews}
              color="success.main"
            />
            <StatCardWithTrend
              title={t("companyPage.negativeReviews")}
              value={company.negative_reviews}
              color="error.main"
            />
          </Box>

          {/* Sentiment Analysis */}
          {sentimentData && companyId && (
            <Box sx={{ mt: { xs: 2, sm: 0 } }}>
              <SentimentAnalysis
                sentimentData={sentimentData}
                companyId={companyId}
                filterLocation={filterLocation}
                filterStartDate={filterStartDate}
                filterEndDate={filterEndDate}
                selectedKeyword={selectedKeyword}
                selectedRating={selectedRating}
                selectedTopic={selectedTopic}
              />
            </Box>
          )}

          {/* Rating Distribution and Timeline Charts */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
              },
              gap: { xs: 2, sm: 3 },
            }}
          >
            {/* Rating Distribution Chart */}
            {company.total_reviews > 0 && (
              <RatingDistributionChart
                ratings={ratingDistribution}
                totalReviews={company.total_reviews}
                onRatingClick={(rating) => setSelectedRating(rating.toString())}
              />
            )}

            {/* Timeline Chart */}
            {timelineData.length > 0 && (
              <ReviewsTimelineChart data={timelineData} />
            )}
          </Box>

          {/* Topics Section */}
          {topics.length > 0 && (
            <Accordion defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  "& .MuiAccordionSummary-content": {
                    alignItems: "center",
                  },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ width: "100%", pr: 2 }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {t("companyPage.topics")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("companyPage.topicsDescription")}
                    </Typography>
                  </Box>
                  {topics.length > 6 && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllTopics(!showAllTopics);
                      }}
                      sx={{
                        textTransform: "none",
                        fontWeight: 500,
                      }}
                    >
                      {showAllTopics
                        ? t("companyPage.showLess")
                        : t("companyPage.showAll", { count: topics.length })}
                    </Button>
                  )}
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  {(showAllTopics ? topics : topics.slice(0, 6)).map(
                    (topic) => {
                      const isSelected = selectedTopic === topic.name;
                      return (
                        <Card
                          key={topic.id}
                          variant="outlined"
                          onClick={() =>
                            setSelectedTopic(isSelected ? "all" : topic.name)
                          }
                          sx={{
                            transition: "all 0.2s ease-in-out",
                            cursor: "pointer",
                            border: isSelected ? 2 : 1,
                            borderColor: isSelected
                              ? "primary.main"
                              : "divider",
                            "&:hover": {
                              boxShadow: 2,
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          <CardContent>
                            <Stack spacing={1}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-start"
                              >
                                <Box>
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                  >
                                    {topic.name}
                                  </Typography>
                                  <Chip
                                    label={topic.category}
                                    size="small"
                                    color={
                                      topic.category === "satisfaction"
                                        ? "success"
                                        : topic.category === "dissatisfaction"
                                        ? "error"
                                        : "default"
                                    }
                                    sx={{ mt: 0.5 }}
                                  />
                                </Box>
                              </Stack>
                              {topic.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {topic.description}
                                </Typography>
                              )}
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {t("companyPage.mentionedIn")}
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {topic.occurrence_count}{" "}
                                  {topic.occurrence_count === 1
                                    ? t("companyPage.review")
                                    : t("companyPage.reviews")}
                                </Typography>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    }
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Keyword Analysis */}
          {keywordAnalysis.length > 0 && (
            <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Typography variant="h6" gutterBottom>
                {t("companyPage.keywordAnalysisByCategory")}
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
                        {analysis.count} {t("companyPage.mentions")} (
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
                          backgroundColor: "primary.main",
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Trending Keywords */}
          {(filterLoading || keywords.length > 0) && (
            <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t("companyPage.trendingKeywords")}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {t("companyPage.trendingKeywordsDescription")}
                  </Typography>
                </Box>
                {!filterLoading && keywords.length > 10 && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowAllKeywords(!showAllKeywords)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                    }}
                  >
                    {showAllKeywords
                      ? t("companyPage.showLess")
                      : t("companyPage.showAll", { count: keywords.length })}
                  </Button>
                )}
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 3 }}>
                {filterLoading ? (
                  <>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <KeywordChipSkeleton key={i} />
                    ))}
                  </>
                ) : (
                  (showAllKeywords ? keywords : keywords.slice(0, 10)).map(
                    (keyword, index) => {
                      const isSelected =
                        selectedKeyword === keyword.keyword_text;
                      return (
                        <Chip
                          key={index}
                          label={`${keyword.keyword_text} (${keyword.occurrence_count})`}
                          color={getCategoryColor(keyword.category || "other")}
                          variant={isSelected ? "filled" : "outlined"}
                          onClick={() =>
                            setSelectedKeyword(
                              isSelected ? "all" : keyword.keyword_text
                            )
                          }
                          sx={{
                            fontWeight: 500,
                            fontSize: "0.95rem",
                            cursor: "pointer",
                            transition: "all 0.2s ease-in-out",
                          }}
                        />
                      );
                    }
                  )
                )}
              </Stack>
            </Paper>
          )}

          {/* Reviews */}
          <ReviewsList
            reviews={reviews}
            totalCount={totalReviewsCount}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            loading={filterLoading}
            selectedKeyword={selectedKeyword}
            selectedRating={selectedRating}
            onClearFilters={handleClearFilters}
            getSentimentColor={getSentimentColor}
          />

          {/* Delete Company Section - Admin Only */}
          {profile?.role === "admin" && (
            <Box
              sx={{
                mt: 4,
                pt: 4,
                borderTop: "1px solid",
                borderColor: "divider",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Stack
                spacing={2}
                sx={{
                  alignItems: "center",
                  textAlign: "center",
                  maxWidth: 600,
                }}
              >
                <Typography
                  variant="h6"
                  color="error"
                  fontWeight={600}
                  sx={{ mb: 1 }}
                >
                  {t("companyPage.deleteCompany", "Delete Company")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(
                    "companyPage.deleteCompanyWarning",
                    "Permanently delete this company and all associated data. This action cannot be undone."
                  )}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{
                    borderRadius: "980px",
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                  }}
                >
                  {t("companyPage.deleteCompany", "Delete Company")}
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>

        {/* Delete Company Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => !deleting && setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={2} alignItems="center">
              <DeleteIcon color="error" />
              <Typography variant="h6" fontWeight={600}>
                {t("companyPage.deleteCompanyConfirmTitle", "Delete Company?")}
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {t(
                "companyPage.deleteCompanyConfirmMessage",
                "Are you sure you want to delete {{companyName}}? This will permanently delete all company data including locations, reviews, and platform connections. This action cannot be undone.",
                { companyName: company?.name }
              )}
            </Typography>
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                {t(
                  "companyPage.deleteCompanyPermanentWarning",
                  "This action is permanent and cannot be undone."
                )}
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleDeleteCompany}
              variant="contained"
              color="error"
              disabled={deleting}
              startIcon={<DeleteIcon />}
            >
              {deleting
                ? t("companyPage.deleteCompanyDeleting", "Deleting...")
                : t("companyPage.deleteCompanyButton", "Delete")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Coming Soon Modal */}
        <Dialog
          open={comingSoonOpen}
          onClose={handleCloseComingSoon}
          maxWidth="sm"
          fullWidth
          fullScreen={false}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              m: { xs: 0, sm: 2 },
            },
          }}
        >
          <DialogTitle sx={{ m: 0, p: { xs: 2, sm: 3 } }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="h5"
                component="div"
                sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
              >
                {selectedPlatform} {t("platform.title")}
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
          <DialogContent
            dividers
            sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
          >
            <Stack
              spacing={{ xs: 2, sm: 3 }}
              alignItems="center"
              sx={{ textAlign: "center" }}
            >
              <Box
                sx={{
                  width: { xs: 60, sm: 80 },
                  height: { xs: 60, sm: 80 },
                  borderRadius: "50%",
                  bgcolor: "primary.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StarIcon
                  sx={{ fontSize: { xs: 32, sm: 40 }, color: "primary.main" }}
                />
              </Box>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t("companyPage.comingSoon")}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t("companyPage.integrationComingSoon", {
                    platform: selectedPlatform,
                  })}
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
                  {t("companyPage.stayTuned")}
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
            <Button
              onClick={handleCloseComingSoon}
              variant="contained"
              size="large"
              fullWidth
              sx={{ borderRadius: 980, py: { xs: 1.25, sm: 1.5 } }}
            >
              {t("companyPage.gotIt")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Platform Connection Dialog - Legacy support for query parameter flow */}
        {selectedPlatform && company && (
          <PlatformConnectionDialog
            open={platformDialogOpen}
            onClose={handlePlatformDialogClose}
            onConnect={(
              platformLocationId,
              locationId,
              platformName,
              verifiedListing
            ) =>
              handlePlatformConnect(
                platformLocationId,
                locationId,
                platformName,
                verifiedListing
              )
            }
            platformName={selectedPlatform.toLowerCase()}
            companyName={company.name}
            locations={companyLocations}
          />
        )}

        {/* Platform Integration Messages */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}
          >
            {error}
          </Alert>
        )}
        {platformError && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}
          >
            {platformError}
          </Alert>
        )}
        {platformSuccess && (
          <Alert
            severity="success"
            onClose={() => setError(null)}
            sx={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}
          >
            {platformSuccess}
          </Alert>
        )}
        {successMessage && (
          <Alert
            severity="success"
            onClose={() => setSuccessMessage(null)}
            sx={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}
          >
            {successMessage}
          </Alert>
        )}
      </Container>
    </>
  );
};
