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
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  ActionPlansCard,
  AverageRatingCard,
  CompanyHeader,
  CompanyPageSection,
  CompanyPageSidebar,
  ImprovementsCard,
  LocationComponent,
  MonthComparisonModal,
  MonthlySummary,
  ObjectivesCard,
  RatingDistributionChart,
  ReviewsList,
  ReviewsTimelineChart,
  StatCardWithTrend,
} from "../components";
import type { Recommendation } from "../components/ImprovementsCard";
import { PlatformConnectionDialog } from "../components/PlatformConnectionDialog";
import { SEO } from "../components/SEO";
import { SentimentAnalysis } from "../components/SentimentAnalysis";
import {
  ChartSkeleton,
  ContentSkeleton,
  ImprovementsCardSkeleton,
  KeywordChipSkeleton,
  ReviewCardSkeleton,
  StatCardSkeleton,
} from "../components/SkeletonLoaders";
import { UserContext } from "../context/UserContext";
import { useObjectives } from "../hooks/useObjectives";
import { usePlatformIntegration } from "../hooks/usePlatformIntegration";
import { useSupabase } from "../hooks/useSupabase";
import { CreateObjectiveInput } from "../services/objectivesService";
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

interface EnrichedReview {
  id: string;
  rating: number;
  title: string;
  content: string;
  author_name: string;
  author_avatar_url?: string;
  published_at: string;
  sentiment: string;
  location_name: string;
  platform_name: string;
  raw_data?: {
    replies?: Array<{
      id: string;
      text: string;
      timestamp: string;
      author: {
        id: string;
        name: string;
        photo?: string;
        url?: string;
      };
    }>;
  };
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
  sentiment_analysis: {
    sentiment: string;
    sentiment_score: number;
    emotions?: any;
  } | null;
  has_comments: boolean;
  reviewer_gender?: string;
  reviewer_age_range?: string;
}

interface Keyword {
  id: string;
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
  description?: string;
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

  // Objectives hook
  const {
    objectives,
    loading: objectivesLoading,
    createObjective,
    updateObjective,
    deleteObjective,
  } = useObjectives(companyId);

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [companyOwnerId, setCompanyOwnerId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [enrichedReviews, setEnrichedReviews] = useState<EnrichedReview[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(
    null
  );
  const [topics, setTopics] = useState<Topic[]>([]);
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
  const [monthComparisonOpen, setMonthComparisonOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<CompanyPageSection>("overview");

  // Calculate default date filter preset based on current month
  const getDefaultDatePreset = (): "ytd" | "3months" => {
    const currentMonth = new Date().getMonth(); // 0-11 (0 = January, 11 = December)
    // If after April (month > 3), use YTD, otherwise use 3 months
    return currentMonth > 3 ? "ytd" : "3months";
  };

  // Page-level filters (apply to all data)
  // filterLocation: empty array = all locations, array with location names = specific locations
  const [filterLocation, setFilterLocation] = useState<string[]>([]);
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [dateFilterPreset, setDateFilterPreset] = useState<
    "ytd" | "3months" | "6months" | "12months" | "custom" | null
  >(getDefaultDatePreset());
  const [customDateModalOpen, setCustomDateModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Review-specific filters (client-side)
  const [selectedKeyword, setSelectedKeyword] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedCommentsFilter, setSelectedCommentsFilter] = useState<
    "all" | "with" | "without"
  >("all");
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Pagination for reviews (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 30;

  const lastTriggeredRef = useRef<number>(0);
  const triggerInProgressRef = useRef(false);

  // Helper function to get start of month N months ago
  const getStartOfMonthMonthsAgo = (monthsAgo: number): string => {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().split("T")[0];
  };

  // Helper function to apply date filter preset
  const applyDateFilterPreset = (
    preset: "ytd" | "3months" | "6months" | "12months" | "custom" | null
  ) => {
    const today = new Date().toISOString().split("T")[0];
    let startDate = "";

    switch (preset) {
      case "ytd":
        startDate = `${new Date().getFullYear()}-01-01`;
        break;
      case "3months":
        startDate = getStartOfMonthMonthsAgo(3);
        break;
      case "6months":
        startDate = getStartOfMonthMonthsAgo(6);
        break;
      case "12months":
        startDate = getStartOfMonthMonthsAgo(12);
        break;
      case "custom":
        // Initialize custom dates with current filter dates or empty
        setCustomStartDate(filterStartDate || "");
        setCustomEndDate(filterEndDate || "");
        setCustomDateModalOpen(true);
        return;
      case null:
        setFilterStartDate("");
        setFilterEndDate("");
        setDateFilterPreset(null);
        return;
    }

    setFilterStartDate(startDate);
    setFilterEndDate(today);
    setDateFilterPreset(preset);
  };

  // Initialize default date filter on mount
  useEffect(() => {
    const defaultPreset = getDefaultDatePreset();
    if (dateFilterPreset === defaultPreset && !filterStartDate) {
      applyDateFilterPreset(defaultPreset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const triggerReviewsRefresh = async () => {
    if (!companyId) return;

    if (triggerInProgressRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastTriggeredRef.current < 60_000) {
      return;
    }

    triggerInProgressRef.current = true;

    try {
      const { error: triggerError } = await supabase.functions.invoke(
        "trigger-reviews-fetch",
        {
          body: { company_id: companyId },
        }
      );

      if (triggerError) {
        console.warn("trigger-reviews-fetch error:", triggerError);
        lastTriggeredRef.current = 0;
      } else {
        lastTriggeredRef.current = Date.now();
      }
    } catch (err) {
      console.error("Failed to trigger reviews refresh:", err);
      lastTriggeredRef.current = 0;
    } finally {
      triggerInProgressRef.current = false;
    }
  };

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

  // Load all review data in parallel with pagination
  const loadAllReviewData = async () => {
    if (!companyId) return;

    setDataLoading(true);
    try {
      // Get locations for this company
      const { data: locationsData } = await supabase
        .from("locations")
        .select("id, name")
        .eq("company_id", companyId);

      if (!locationsData || locationsData.length === 0) {
        setEnrichedReviews([]);
        setDataLoading(false);
        return;
      }

      // Apply location filter
      let filteredLocationIds = locationsData.map((loc) => loc.id);
      if (filterLocation.length > 0) {
        const filteredLocs = locationsData.filter((loc) =>
          filterLocation.includes(loc.name)
        );
        filteredLocationIds = filteredLocs.map((loc) => loc.id);
      }

      if (filteredLocationIds.length === 0) {
        setEnrichedReviews([]);
        setDataLoading(false);
        return;
      }

      // Get platform connection IDs
      const { data: platformConnections } = await supabase
        .from("platform_connections")
        .select(
          "id, location_id, platform_id, locations!inner(name), platforms!inner(display_name)"
        )
        .in("location_id", filteredLocationIds);

      if (!platformConnections || platformConnections.length === 0) {
        setEnrichedReviews([]);
        setDataLoading(false);
        return;
      }

      const platformConnectionIds = platformConnections.map((pc) => pc.id);

      // Build queries with server-side filters (location and date)
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

      if (filterStartDate) {
        reviewsQuery = reviewsQuery.gte("published_at", filterStartDate);
      }
      if (filterEndDate) {
        reviewsQuery = reviewsQuery.lte("published_at", filterEndDate);
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
        const locationName = review.platform_connections?.locations?.name || "";
        const platformName =
          review.platform_connections?.platforms?.display_name || "";

        enrichedReviewsMap.set(review.id, {
          id: review.id,
          rating: review.rating,
          title: review.title || "",
          content: review.content || "",
          author_name: review.author_name || "",
          author_avatar_url: review.author_avatar_url,
          published_at: review.published_at,
          sentiment: "",
          location_name: locationName,
          platform_name: platformName,
          raw_data: review.raw_data,
          keywords: [],
          topics: [],
          sentiment_analysis: null,
          has_comments:
            review.raw_data?.replies && review.raw_data.replies.length > 0,
          reviewer_gender: review.reviewer_gender,
          reviewer_age_range: review.reviewer_age_range,
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

      // Add sentiment analysis
      sentimentData.forEach((sa: any) => {
        const review = enrichedReviewsMap.get(sa.review_id);
        if (review) {
          review.sentiment_analysis = {
            sentiment: sa.sentiment,
            sentiment_score: sa.sentiment_score,
            emotions: sa.emotions,
          };
          review.sentiment = sa.sentiment;
        }
      });

      // Convert to array and sort by published_at
      const enrichedReviewsArray = Array.from(enrichedReviewsMap.values()).sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
      );

      setEnrichedReviews(enrichedReviewsArray);
    } catch (error) {
      console.error("Error loading review data:", error);
      setEnrichedReviews([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Refresh function
  const refreshPageData = async () => {
    if (!profile || !companyId) return;

    setRefreshing(true);
    try {
      await triggerReviewsRefresh();

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
        await triggerReviewsRefresh();

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

        // Load all review data
        await loadAllReviewData();
      } catch (error) {
        console.error("Error fetching initial company data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, profile, companyId, navigate]);

  // Load review data when server-side filters change (location, date)
  useEffect(() => {
    if (!loading && companyId) {
      loadAllReviewData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLocation, filterStartDate, filterEndDate, companyId, loading]);

  // Client-side filtering
  const filteredReviews = useMemo(() => {
    let filtered = enrichedReviews;

    // Apply client-side filters
    if (selectedKeyword !== "all") {
      const selectedKeywordLower = selectedKeyword.toLowerCase();
      filtered = filtered.filter((review) =>
        review.keywords.some(
          (k) => k.text.toLowerCase() === selectedKeywordLower
        )
      );
    }

    if (selectedRating !== "all") {
      filtered = filtered.filter((review) => {
        const ratingValue = parseFloat(selectedRating);
        // Show all ratings at or below the selected rating
        // e.g., if 3 is selected, show ratings 3, 2, and 1
        return review.rating <= ratingValue && review.rating >= 1;
      });
    }

    if (selectedTopic !== "all") {
      const selectedTopicLower = selectedTopic.toLowerCase();
      filtered = filtered.filter((review) =>
        review.topics.some((t) => t.name.toLowerCase() === selectedTopicLower)
      );
    }

    if (selectedCommentsFilter === "with") {
      filtered = filtered.filter((review) => review.has_comments);
    } else if (selectedCommentsFilter === "without") {
      filtered = filtered.filter((review) => !review.has_comments);
    }

    return filtered;
  }, [
    enrichedReviews,
    selectedKeyword,
    selectedRating,
    selectedTopic,
    selectedCommentsFilter,
  ]);

  // Calculate stats from filtered reviews
  const filteredStats = useMemo(() => {
    if (filteredReviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        positiveReviews: 0,
        negativeReviews: 0,
      };
    }

    const totalReviews = filteredReviews.length;
    const averageRating =
      filteredReviews.reduce((sum, review) => sum + review.rating, 0) /
      totalReviews;
    const positiveReviews = filteredReviews.filter(
      (review) => review.sentiment === "positive"
    ).length;
    const negativeReviews = filteredReviews.filter(
      (review) => review.sentiment === "negative" || review.rating <= 2
    ).length;

    return {
      totalReviews,
      averageRating,
      positiveReviews,
      negativeReviews,
    };
  }, [filteredReviews]);

  // Analyze negative reviews and generate recommendations
  const negativeReviewRecommendations = useMemo(() => {
    const negativeReviews = filteredReviews.filter(
      (review) => review.sentiment === "negative" || review.rating <= 2
    );

    if (negativeReviews.length === 0) {
      return [];
    }

    // Extract keywords from negative reviews
    const negativeKeywordMap = new Map<
      string,
      { count: number; category: string }
    >();
    negativeReviews.forEach((review) => {
      review.keywords.forEach((keyword) => {
        const existing = negativeKeywordMap.get(keyword.text.toLowerCase());
        if (existing) {
          existing.count++;
        } else {
          negativeKeywordMap.set(keyword.text.toLowerCase(), {
            count: 1,
            category: keyword.category || "other",
          });
        }
      });
    });

    // Extract topics from negative reviews
    const negativeTopicMap = new Map<
      string,
      { count: number; category: string; description?: string }
    >();
    negativeReviews.forEach((review) => {
      review.topics.forEach((topic) => {
        const existing = negativeTopicMap.get(topic.name.toLowerCase());
        if (existing) {
          existing.count++;
        } else {
          negativeTopicMap.set(topic.name.toLowerCase(), {
            count: 1,
            category: topic.category || "neutral",
            description: topic.description,
          });
        }
      });
    });

    // Generate recommendations from keywords
    const keywordRecommendations: Recommendation[] = Array.from(
      negativeKeywordMap.entries()
    )
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([keywordText, data], index) => {
        const category = data.category;
        const priority: "high" | "medium" | "low" =
          data.count >= 5 ? "high" : data.count >= 2 ? "medium" : "low";

        // Generate actionable description based on category
        let description = t(
          "improvementsCard.recommendations.keywordMentioned",
          {
            keyword: keywordText,
            defaultValue: `"${keywordText}" is mentioned frequently in negative reviews.`,
          }
        );

        const categoryDescriptionKey = `improvementsCard.recommendations.categoryDescriptions.${category}`;
        const categoryDescription = t(categoryDescriptionKey, {
          defaultValue: "",
        });

        if (categoryDescription) {
          description += ` ${categoryDescription}`;
        }

        return {
          id: `keyword-${index}`,
          title: t("improvementsCard.recommendations.addressKeywordConcerns", {
            keyword: keywordText,
            defaultValue: `Address "${keywordText}" concerns`,
          }),
          description,
          category,
          priority,
          keywordCount: data.count,
        };
      });

    // Generate recommendations from topics
    const topicRecommendations: Recommendation[] = Array.from(
      negativeTopicMap.entries()
    )
      .filter(([_, data]) => data.category === "dissatisfaction")
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([topicName, data], index) => {
        const priority: "high" | "medium" | "low" =
          data.count >= 3 ? "high" : data.count >= 2 ? "medium" : "low";

        return {
          id: `topic-${index}`,
          title: t("improvementsCard.recommendations.improveTopic", {
            topic: topicName,
            defaultValue: `Improve "${topicName}"`,
          }),
          description:
            data.description ||
            t("improvementsCard.recommendations.topicFrequentlyMentioned", {
              topic: topicName,
              defaultValue: `This topic is frequently mentioned in negative reviews. Take action to address customer concerns about ${topicName}.`,
            }),
          category: "other",
          priority,
          topicCount: data.count,
        };
      });

    // Combine and deduplicate recommendations
    const allRecommendations = [
      ...keywordRecommendations,
      ...topicRecommendations,
    ];
    const uniqueRecommendations = new Map<string, Recommendation>();

    allRecommendations.forEach((rec) => {
      const key = `${rec.category}-${rec.title}`;
      if (!uniqueRecommendations.has(key)) {
        uniqueRecommendations.set(key, rec);
      } else {
        const existing = uniqueRecommendations.get(key)!;
        // Merge counts if same recommendation
        existing.keywordCount =
          (existing.keywordCount || 0) + (rec.keywordCount || 0);
        existing.topicCount =
          (existing.topicCount || 0) + (rec.topicCount || 0);
        // Upgrade priority if needed
        if (
          (existing.keywordCount || 0) + (existing.topicCount || 0) >= 5 &&
          existing.priority !== "high"
        ) {
          existing.priority = "high";
        }
      }
    });

    // Sort by priority and count
    return Array.from(uniqueRecommendations.values())
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        const aCount = (a.keywordCount || 0) + (a.topicCount || 0);
        const bCount = (b.keywordCount || 0) + (b.topicCount || 0);
        return bCount - aCount;
      })
      .slice(0, 15);
  }, [filteredReviews, t]);

  // Client-side calculations - runs when filtered reviews change
  useEffect(() => {
    if (filteredReviews.length === 0) {
      setKeywords([]);
      setTopics([]);
      setSentimentData(null);
      setRatingDistribution({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      setTimelineData([]);
      return;
    }

    // Calculate keywords from filtered reviews
    const keywordCountMap = new Map<
      string,
      {
        id: string;
        keyword_text: string;
        category: string;
        occurrence_count: number;
      }
    >();
    filteredReviews.forEach((review) => {
      review.keywords.forEach((keyword) => {
        const existing = keywordCountMap.get(keyword.id);
        if (existing) {
          existing.occurrence_count++;
        } else {
          keywordCountMap.set(keyword.id, {
            id: keyword.id,
            keyword_text: keyword.text,
            category: keyword.category || "other",
            occurrence_count: 1,
          });
        }
      });
    });

    const keywordsArray = Array.from(keywordCountMap.values())
      .sort((a, b) => b.occurrence_count - a.occurrence_count)
      .slice(0, 20);
    setKeywords(keywordsArray);
    analyzeKeywords(keywordsArray);

    // Calculate topics from filtered reviews
    const topicCountMap = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        description?: string;
        occurrence_count: number;
      }
    >();
    filteredReviews.forEach((review) => {
      review.topics.forEach((topic) => {
        const existing = topicCountMap.get(topic.name);
        if (existing) {
          existing.occurrence_count++;
        } else {
          topicCountMap.set(topic.name, {
            id: topic.id,
            name: topic.name,
            category: topic.category,
            description: topic.description || "",
            occurrence_count: 1,
          });
        }
      });
    });

    const topicsArray = Array.from(topicCountMap.values())
      .sort((a, b) => b.occurrence_count - a.occurrence_count)
      .slice(0, 6);
    setTopics(topicsArray);

    // Calculate sentiment data from filtered reviews
    const reviewsWithSentiment = filteredReviews.filter(
      (r) => r.sentiment_analysis && r.sentiment_analysis.sentiment_score !== 0
    );

    if (reviewsWithSentiment.length > 0) {
      const sentiments = reviewsWithSentiment.map((r) => ({
        sentiment: r.sentiment_analysis!.sentiment,
        score: r.sentiment_analysis!.sentiment_score,
        emotions: r.sentiment_analysis!.emotions || {},
        gender: r.reviewer_gender,
        ageRange: r.reviewer_age_range,
      }));

      const positiveCount = sentiments.filter(
        (s) => s.sentiment === "positive"
      ).length;
      const neutralCount = sentiments.filter(
        (s) => s.sentiment === "neutral"
      ).length;
      const negativeCount = sentiments.filter(
        (s) => s.sentiment === "negative"
      ).length;

      const avgScore =
        sentiments.reduce((sum, s) => sum + (s.score || 0), 0) /
        sentiments.length;

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
      sentiments.forEach((s) => {
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
          avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
          count: data.count,
        }))
        .sort((a, b) => {
          const order = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
          return order.indexOf(a.ageRange) - order.indexOf(b.ageRange);
        });

      // Group by gender
      const genderMap = new Map<string, { scores: number[]; count: number }>();
      sentiments.forEach((s) => {
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
          avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
          count: data.count,
        })
      );

      // Aggregate emotions
      const emotionCounts = new Map<string, number>();
      sentiments.forEach((s) => {
        if (s.emotions) {
          try {
            let emotionsData = s.emotions;
            if (typeof s.emotions === "string") {
              emotionsData = JSON.parse(s.emotions);
            }

            if (emotionsData && Array.isArray(emotionsData.emoticons)) {
              emotionsData.emoticons.forEach((emoji: string) => {
                emotionCounts.set(emoji, (emotionCounts.get(emoji) || 0) + 1);
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
          percentage: (count / sentiments.length) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      setSentimentData({
        overallScore: avgScore,
        overallSentiment,
        totalReviews: sentiments.length,
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

    // Calculate chart data
    if (filteredReviews.length === 0) {
      setRatingDistribution({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      setTimelineData([]);
      return;
    }

    // Rating distribution
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    filteredReviews.forEach((review) => {
      const rating = Math.floor(review.rating);
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating as keyof typeof ratingCounts]++;
      }
    });
    setRatingDistribution(ratingCounts);

    // Timeline data
    const timelineMap = new Map<
      string,
      { count: number; sumRating: number; positive: number; negative: number }
    >();

    filteredReviews.forEach((review) => {
      const date = new Date(review.published_at);
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
        count: Math.floor(data.count),
        avgRating: data.sumRating / data.count,
        positive: data.positive,
        negative: data.negative,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setTimelineData(timeline);
  }, [filteredReviews]);

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

      // Refresh all review data
      await loadAllReviewData();
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

  // Paginated reviews
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    return filteredReviews.slice(startIndex, endIndex);
  }, [filteredReviews, currentPage, reviewsPerPage]);

  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedKeyword, selectedRating, selectedTopic, selectedCommentsFilter]);

  // Get unique locations from all locations (not just filtered reviews)
  const uniqueLocations = locations.map((loc) => loc.name).sort();

  // Initialize location filter: if only one location, select it by default
  useEffect(() => {
    if (uniqueLocations.length === 1 && filterLocation.length === 0) {
      setFilterLocation([uniqueLocations[0]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueLocations.length]);

  // Get top keywords for filter dropdown (limit to top 20)
  const topKeywordsForFilter = keywords.slice(0, 20);

  const handleClearFilters = () => {
    setSelectedKeyword("all");
    setSelectedRating("all");
    setSelectedTopic("all");
    setSelectedCommentsFilter("all");
  };

  const handleClearAllFilters = () => {
    setFilterLocation([]);
    setFilterStartDate("");
    setFilterEndDate("");
    setDateFilterPreset(null);
    setSelectedKeyword("all");
    setSelectedRating("all");
    setSelectedTopic("all");
    setSelectedCommentsFilter("all");
  };

  const handleFilterNegativeReviews = () => {
    // Set rating filter to show 2 stars and below (configurable in the future)
    // This will show all reviews with rating <= 2 (i.e., ratings 2 and 1)
    setSelectedRating("2");
    // Switch to reviews section
    setActiveSection("reviews");
    // Scroll to reviews section (smooth scroll)
    setTimeout(() => {
      const reviewsSection = document.getElementById("reviews-section");
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Helper function to format date range for display
  const getDateRangeDisplay = (): string => {
    if (!dateFilterPreset && !filterStartDate && !filterEndDate) {
      return t("companyPage.allTime", "All Time");
    }

    if (dateFilterPreset === "ytd") {
      return t("companyPage.ytd", "YTD");
    } else if (dateFilterPreset === "3months") {
      return t("companyPage.last3Months", "Last 3 Months");
    } else if (dateFilterPreset === "6months") {
      return t("companyPage.last6Months", "Last 6 Months");
    } else if (dateFilterPreset === "12months") {
      return t("companyPage.last12Months", "Last 12 Months");
    } else if (
      dateFilterPreset === "custom" &&
      filterStartDate &&
      filterEndDate
    ) {
      const startDate = new Date(filterStartDate);
      const endDate = new Date(filterEndDate);
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    } else if (filterStartDate && filterEndDate) {
      const startDate = new Date(filterStartDate);
      const endDate = new Date(filterEndDate);
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }

    return t("companyPage.allTime", "All Time");
  };

  const handleLocationToggle = (locationName: string | "all") => {
    if (locationName === "all") {
      // Select "All Locations" - clear all specific location selections
      setFilterLocation([]);
    } else {
      setFilterLocation((prev) => {
        if (prev.includes(locationName)) {
          // Deselecting a location - if it's the last one, select "all" instead
          const newSelection = prev.filter((loc) => loc !== locationName);
          return newSelection.length === 0 ? [] : newSelection;
        } else {
          // Selecting a location - add it to the selection
          return [...prev, locationName];
        }
      });
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      setFilterStartDate(customStartDate);
      setFilterEndDate(customEndDate);
      setDateFilterPreset("custom");
      setCustomDateModalOpen(false);
    }
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

            <Button
              startIcon={<RefreshIcon />}
              onClick={refreshPageData}
              disabled={refreshing}
              variant="outlined"
            >
              {t("companyPage.refresh")}
            </Button>
          </Stack>

          {/* Company Header */}
          <CompanyHeader
            company={company}
            onLogoUpdate={(logoUrl) => {
              setCompany({ ...company, logo_url: logoUrl });
            }}
          />

          {/* Average Rating - Full Width */}
          <AverageRatingCard
            averageRating={filteredStats.averageRating}
            totalReviews={filteredStats.totalReviews}
            dateRange={getDateRangeDisplay()}
          />

          {/* Stats Overview */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: { xs: 2, sm: 3 },
            }}
          >
            <StatCardWithTrend
              title={t("companyPage.totalReviews")}
              value={filteredStats.totalReviews}
              color="primary.main"
            />
            <StatCardWithTrend
              title={t("companyPage.positiveReviews")}
              value={filteredStats.positiveReviews}
              color="success.main"
            />
            <StatCardWithTrend
              title={t("companyPage.negativeReviews")}
              value={filteredStats.negativeReviews}
              color="error.main"
            />
          </Box>

          {/* Unified Filters */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: "grey.50",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Accordion
              defaultExpanded={false}
              sx={{
                boxShadow: "none",
                bgcolor: "transparent",
                "&:before": {
                  display: "none",
                },
                "&.Mui-expanded": {
                  margin: 0,
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 3,
                  py: 2,
                  "& .MuiAccordionSummary-content": {
                    margin: 0,
                    alignItems: "center",
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ width: "100%", pr: 2 }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={500}>
                      {t("companyPage.dataFilters")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("companyPage.dataFiltersDescription")}
                    </Typography>
                  </Box>
                  {/* Show applied filters when collapsed */}
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    gap={1}
                    sx={{ flex: 1, justifyContent: "flex-end" }}
                  >
                    {filterLocation.length > 0 &&
                      filterLocation.map((location) => (
                        <Chip
                          key={location}
                          label={location}
                          size="small"
                          color="primary"
                          variant="outlined"
                          onDelete={(e) => {
                            e.stopPropagation();
                            handleLocationToggle(location);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ))}
                    {dateFilterPreset && (
                      <Chip
                        label={
                          dateFilterPreset === "ytd"
                            ? t("companyPage.ytd", "YTD")
                            : dateFilterPreset === "3months"
                            ? t("companyPage.last3Months", "Last 3 Months")
                            : dateFilterPreset === "6months"
                            ? t("companyPage.last6Months", "Last 6 Months")
                            : dateFilterPreset === "12months"
                            ? t("companyPage.last12Months", "Last 12 Months")
                            : dateFilterPreset === "custom"
                            ? `${new Date(
                                filterStartDate
                              ).toLocaleDateString()} - ${new Date(
                                filterEndDate
                              ).toLocaleDateString()}`
                            : ""
                        }
                        size="small"
                        color="primary"
                        variant="outlined"
                        onDelete={(e) => {
                          e.stopPropagation();
                          setDateFilterPreset(null);
                          setFilterStartDate("");
                          setFilterEndDate("");
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {selectedKeyword !== "all" && (
                      <Chip
                        label={t("companyPage.keywordLabel", {
                          keyword: selectedKeyword,
                        })}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onDelete={(e) => {
                          e.stopPropagation();
                          setSelectedKeyword("all");
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {selectedRating !== "all" && (
                      <Chip
                        label={t("companyPage.starsLabel", {
                          rating: selectedRating,
                          stars: t("companyPage.stars"),
                        })}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onDelete={(e) => {
                          e.stopPropagation();
                          setSelectedRating("all");
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {selectedTopic !== "all" && (
                      <Chip
                        label={t("companyPage.topicLabel", {
                          topic: selectedTopic,
                        })}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onDelete={(e) => {
                          e.stopPropagation();
                          setSelectedTopic("all");
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {selectedCommentsFilter !== "all" && (
                      <Chip
                        label={
                          selectedCommentsFilter === "with"
                            ? t("companyPage.withReplies", "With Replies")
                            : t("companyPage.withoutReplies", "Without Replies")
                        }
                        size="small"
                        color="primary"
                        variant="outlined"
                        onDelete={(e) => {
                          e.stopPropagation();
                          setSelectedCommentsFilter("all");
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </Stack>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                <Stack spacing={2}>
                  {/* Date Range Filters - Full Width at Top */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {t("companyPage.dateRange", "Date Range")}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={t("companyPage.ytd", "YTD")}
                        color="primary"
                        variant={
                          dateFilterPreset === "ytd" ? "filled" : "outlined"
                        }
                        onClick={() => applyDateFilterPreset("ytd")}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      />
                      <Chip
                        label={t("companyPage.last3Months", "Last 3 Months")}
                        color="primary"
                        variant={
                          dateFilterPreset === "3months" ? "filled" : "outlined"
                        }
                        onClick={() => applyDateFilterPreset("3months")}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      />
                      <Chip
                        label={t("companyPage.last6Months", "Last 6 Months")}
                        color="primary"
                        variant={
                          dateFilterPreset === "6months" ? "filled" : "outlined"
                        }
                        onClick={() => applyDateFilterPreset("6months")}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      />
                      <Chip
                        label={t("companyPage.last12Months", "Last 12 Months")}
                        color="primary"
                        variant={
                          dateFilterPreset === "12months"
                            ? "filled"
                            : "outlined"
                        }
                        onClick={() => applyDateFilterPreset("12months")}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      />
                      <Chip
                        label={t("companyPage.custom", "Custom")}
                        color="primary"
                        variant={
                          dateFilterPreset === "custom" ? "filled" : "outlined"
                        }
                        onClick={() => applyDateFilterPreset("custom")}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      />
                    </Stack>
                  </Box>

                  {/* Location Filter - Chips on own line */}
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {t("companyPage.locations", "Locations")}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {/* Show "All Locations" chip only if there are multiple locations */}
                      {uniqueLocations.length > 1 && (
                        <Chip
                          label={t("companyPage.allLocations", "All Locations")}
                          onClick={() => handleLocationToggle("all")}
                          color={
                            filterLocation.length === 0 ? "primary" : "default"
                          }
                          variant={
                            filterLocation.length === 0 ? "filled" : "outlined"
                          }
                          sx={{
                            cursor: "pointer",
                            transition: "all 0.2s ease-in-out",
                            fontWeight: 500,
                          }}
                        />
                      )}
                      {uniqueLocations.map((location) => {
                        const isSelected = filterLocation.includes(location);
                        return (
                          <Chip
                            key={location}
                            label={location}
                            onClick={() => handleLocationToggle(location)}
                            color={isSelected ? "primary" : "default"}
                            variant={isSelected ? "filled" : "outlined"}
                            sx={{
                              cursor: "pointer",
                              transition: "all 0.2s ease-in-out",
                              fontWeight: 500,
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>

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
                        <MenuItem value="5">
                          5 {t("companyPage.stars")}
                        </MenuItem>
                        <MenuItem value="4">
                          4 {t("companyPage.stars")}
                        </MenuItem>
                        <MenuItem value="3">
                          3 {t("companyPage.stars")}
                        </MenuItem>
                        <MenuItem value="2">
                          2 {t("companyPage.stars")}
                        </MenuItem>
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

                  {/* Comments Filter Section */}
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {t("companyPage.filterByReplies", "Filter by Replies")}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={t("companyPage.allReviews", "All Reviews")}
                        color="primary"
                        variant={
                          selectedCommentsFilter === "all"
                            ? "filled"
                            : "outlined"
                        }
                        onClick={() => setSelectedCommentsFilter("all")}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      />
                      <Chip
                        label={t("companyPage.withReplies", "With Replies")}
                        color="primary"
                        variant={
                          selectedCommentsFilter === "with"
                            ? "filled"
                            : "outlined"
                        }
                        onClick={() => setSelectedCommentsFilter("with")}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      />
                      <Chip
                        label={t(
                          "companyPage.withoutReplies",
                          "Without Replies"
                        )}
                        color="primary"
                        variant={
                          selectedCommentsFilter === "without"
                            ? "filled"
                            : "outlined"
                        }
                        onClick={() => setSelectedCommentsFilter("without")}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      />
                    </Stack>
                  </Box>

                  {/* Clear All Button - Bottom Right */}
                  {(filterLocation.length > 0 ||
                    dateFilterPreset ||
                    selectedKeyword !== "all" ||
                    selectedRating !== "all" ||
                    selectedTopic !== "all" ||
                    selectedCommentsFilter !== "all") && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mt: 2,
                      }}
                    >
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
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Paper>

          {/* Sidebar and Content Area */}
          <Box
            sx={{
              display: "flex",
              gap: { xs: 0, md: 3 },
              alignItems: "flex-start",
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            {/* Sidebar Navigation */}
            <CompanyPageSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              isAdmin={profile?.role === "admin"}
            />

            {/* Main Content Area */}
            <Box
              sx={{
                flex: 1,
                width: "100%",
                minWidth: 0,
                pb: { xs: 10, md: 0 }, // Space for mobile bottom nav
              }}
            >
              {activeSection === "overview" && (
                <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
                  {/* Monthly Summary */}
                  {companyId && (
                    <MonthlySummary
                      companyId={companyId}
                      onCompareMonths={() => setMonthComparisonOpen(true)}
                    />
                  )}

                  {/* Improvements Card */}
                  {dataLoading ? (
                    <ImprovementsCardSkeleton />
                  ) : (
                    filteredStats.negativeReviews > 0 && (
                      <ImprovementsCard
                        negativeReviewsCount={filteredStats.negativeReviews}
                        negativeReviewsPercentage={
                          filteredStats.totalReviews > 0
                            ? (filteredStats.negativeReviews /
                                filteredStats.totalReviews) *
                              100
                            : 0
                        }
                        totalReviews={filteredStats.totalReviews}
                        recommendations={negativeReviewRecommendations}
                        onFilterNegativeReviews={handleFilterNegativeReviews}
                        dateRange={getDateRangeDisplay()}
                      />
                    )
                  )}

                  {/* Rating Distribution Chart */}
                  {dataLoading ? (
                    <ChartSkeleton />
                  ) : (
                    company.total_reviews > 0 && (
                      <RatingDistributionChart
                        ratings={ratingDistribution}
                        totalReviews={company.total_reviews}
                        onRatingClick={(rating) =>
                          setSelectedRating(rating.toString())
                        }
                      />
                    )
                  )}

                  {/* Timeline Chart */}
                  {dataLoading ? (
                    <ChartSkeleton />
                  ) : (
                    timelineData.length > 0 && (
                      <ReviewsTimelineChart data={timelineData} />
                    )
                  )}
                </Stack>
              )}

              {activeSection === "reviews" && (
                <Stack spacing={{ xs: 2, sm: 3, md: 4 }} id="reviews-section">
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
                                : t("companyPage.showAll", {
                                    count: topics.length,
                                  })}
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
                                    setSelectedTopic(
                                      isSelected ? "all" : topic.name
                                    )
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
                                                : topic.category ===
                                                  "dissatisfaction"
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
                                        <Typography
                                          variant="body2"
                                          fontWeight={600}
                                        >
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

                  {/* Trending Keywords */}
                  {(dataLoading || keywords.length > 0) && (
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
                        {!dataLoading && keywords.length > 10 && (
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
                              : t("companyPage.showAll", {
                                  count: keywords.length,
                                })}
                          </Button>
                        )}
                      </Stack>
                      <Stack
                        direction="row"
                        flexWrap="wrap"
                        gap={1.5}
                        sx={{ mt: 3 }}
                      >
                        {dataLoading ? (
                          <>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                              <KeywordChipSkeleton key={i} />
                            ))}
                          </>
                        ) : (
                          (showAllKeywords
                            ? keywords
                            : keywords.slice(0, 10)
                          ).map((keyword, index) => {
                            const isSelected =
                              selectedKeyword === keyword.keyword_text;
                            return (
                              <Chip
                                key={index}
                                label={`${keyword.keyword_text} (${keyword.occurrence_count})`}
                                color="primary"
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
                          })
                        )}
                      </Stack>
                    </Paper>
                  )}

                  {/* Reviews */}
                  <ReviewsList
                    reviews={paginatedReviews}
                    totalCount={filteredReviews.length}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    loading={dataLoading}
                    selectedKeyword={selectedKeyword}
                    selectedRating={selectedRating}
                    onClearFilters={handleClearFilters}
                    getSentimentColor={getSentimentColor}
                  />
                </Stack>
              )}

              {activeSection === "analytics" && (
                <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
                  {/* Sentiment Analysis */}
                  {dataLoading ? (
                    <ContentSkeleton />
                  ) : (
                    sentimentData &&
                    companyId && (
                      <Box>
                        <SentimentAnalysis
                          sentimentData={sentimentData}
                          companyId={companyId}
                          filterLocation={
                            filterLocation.length > 0
                              ? filterLocation.join(", ")
                              : undefined
                          }
                          filterStartDate={filterStartDate}
                          filterEndDate={filterEndDate}
                          selectedKeyword={selectedKeyword}
                          selectedRating={selectedRating}
                          selectedTopic={selectedTopic}
                        />
                      </Box>
                    )
                  )}

                  {/* Keyword Analysis */}
                  {dataLoading ? (
                    <ContentSkeleton />
                  ) : (
                    keywordAnalysis.length > 0 && (
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
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
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
                    )
                  )}

                  {/* Topics Section (detailed view) */}
                  {dataLoading ? (
                    <ContentSkeleton />
                  ) : (
                    topics.length > 0 && (
                      <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                        <Typography variant="h6" gutterBottom>
                          {t("companyPage.topics")}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 3 }}
                        >
                          {t("companyPage.topicsDescription")}
                        </Typography>
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
                          {topics.map((topic) => {
                            const isSelected = selectedTopic === topic.name;
                            return (
                              <Card
                                key={topic.id}
                                variant="outlined"
                                onClick={() =>
                                  setSelectedTopic(
                                    isSelected ? "all" : topic.name
                                  )
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
                                              : topic.category ===
                                                "dissatisfaction"
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
                                      <Typography
                                        variant="body2"
                                        fontWeight={600}
                                      >
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
                          })}
                        </Box>
                      </Paper>
                    )
                  )}
                </Stack>
              )}

              {activeSection === "objectives" && companyId && (
                <ObjectivesCard
                  objectives={objectives}
                  loading={objectivesLoading}
                  companyId={companyId}
                  onCreateObjective={async (input: CreateObjectiveInput) => {
                    await createObjective(input);
                  }}
                  onUpdateObjective={async (
                    objectiveId: string,
                    input: CreateObjectiveInput
                  ) => {
                    await updateObjective(objectiveId, input);
                  }}
                  onDeleteObjective={async (objectiveId: string) => {
                    await deleteObjective(objectiveId);
                  }}
                />
              )}

              {activeSection === "actionPlans" && companyId && (
                <ActionPlansCard companyId={companyId} />
              )}

              {activeSection === "locations" && companyId && (
                <LocationComponent
                  locations={locations}
                  locationConnections={locationConnections}
                  companyId={companyId}
                  companyName={company?.name || ""}
                  onReviewsFetched={() => {
                    // Refresh all review data after fetching
                    loadAllReviewData();
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
                      console.error(
                        "Error refreshing location connections:",
                        err
                      );
                    }
                  }}
                />
              )}

              {activeSection === "settings" && profile?.role === "admin" && (
                <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
                  {/* Transfer Ownership Button */}
                  {companyOwnerId === profile.id && companyId && (
                    <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                      <Stack spacing={2}>
                        <Typography variant="h6">
                          {t(
                            "companyPage.transferOwnership",
                            "Transfer Ownership"
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Transfer ownership of this company to another user.
                        </Typography>
                        <Button
                          startIcon={<SwapHorizIcon />}
                          onClick={() =>
                            navigate(
                              `/companies/${companyId}/transfer-ownership`
                            )
                          }
                          variant="outlined"
                          color="primary"
                          sx={{
                            alignSelf: "flex-start",
                            borderRadius: "980px",
                            textTransform: "none",
                          }}
                        >
                          {t(
                            "companyPage.transferOwnership",
                            "Transfer Ownership"
                          )}
                        </Button>
                      </Stack>
                    </Paper>
                  )}

                  {/* Delete Company Section */}
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
                </Stack>
              )}
            </Box>
          </Box>
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

        {/* Custom Date Picker Modal */}
        <Dialog
          open={customDateModalOpen}
          onClose={() => setCustomDateModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {t("companyPage.customDateRange", "Custom Date Range")}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label={t("companyPage.fromDate")}
                type="date"
                fullWidth
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label={t("companyPage.toDate")}
                type="date"
                fullWidth
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setCustomDateModalOpen(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleCustomDateApply}
              variant="contained"
              disabled={!customStartDate || !customEndDate}
            >
              {t("common.apply", "Apply")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Month Comparison Modal */}
        {companyId && (
          <MonthComparisonModal
            open={monthComparisonOpen}
            onClose={() => setMonthComparisonOpen(false)}
            companyId={companyId}
          />
        )}
      </Container>
    </>
  );
};
