import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useSupabase } from "../hooks/useSupabase";
import { MonthlySummarySkeleton } from "./SkeletonLoaders";

interface MonthlySummaryProps {
  companyId: string;
}

interface MonthData {
  year: number;
  month: number;
  total_reviews: number;
}

interface SummaryData {
  id: string;
  month_year: string;
  total_reviews: number;
  average_rating: string | number;
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  summary: string | null;
}

export const MonthlySummary = ({ companyId }: MonthlySummaryProps) => {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Track available months (months with reviews)
  const [availableMonths, setAvailableMonths] = useState<MonthData[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // Track current summary data
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  // Fetch available months on mount
  useEffect(() => {
    fetchAvailableMonths();
  }, [companyId]);

  // Fetch summary when month/year changes
  useEffect(() => {
    if (availableMonths.length > 0) {
      fetchSummary();
    }
  }, [currentYear, currentMonth, availableMonths.length]);

  const fetchAvailableMonths = async () => {
    try {
      // Get all platform connections for this company
      const { data: locations } = await supabase
        .from("locations")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (!locations || locations.length === 0) {
        setAvailableMonths([]);
        setLoading(false);
        return;
      }

      const locationIds = locations.map((loc) => loc.id);

      const { data: platformConnections } = await supabase
        .from("platform_connections")
        .select("id")
        .in("location_id", locationIds)
        .eq("is_active", true);

      if (!platformConnections || platformConnections.length === 0) {
        setAvailableMonths([]);
        setLoading(false);
        return;
      }

      const platformConnectionIds = platformConnections.map((pc) => pc.id);

      // Get all reviews for this company, grouped by month
      const { data: reviews } = await supabase
        .from("reviews")
        .select("published_at")
        .in("platform_connection_id", platformConnectionIds);

      if (!reviews || reviews.length === 0) {
        setAvailableMonths([]);
        setLoading(false);
        return;
      }

      // Group reviews by month/year
      const monthMap = new Map<string, number>();
      reviews.forEach((review) => {
        const date = new Date(review.published_at);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${String(month).padStart(2, "0")}`;
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      });

      // Convert to array and sort
      const months = Array.from(monthMap.entries())
        .map(([key, count]) => {
          const [year, month] = key.split("-").map(Number);
          return { year, month, total_reviews: count };
        })
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });

      setAvailableMonths(months);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching available months:", err);
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const monthYear = `${currentYear}-${String(currentMonth).padStart(
        2,
        "0"
      )}`;

      const { data, error } = await supabase
        .from("monthly_summaries")
        .select("*")
        .eq("company_id", companyId)
        .eq("month_year", monthYear)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setSummaryData(data || null);
    } catch (err) {
      console.error("Error fetching summary:", err);
      setSummaryData(null);
    }
  };

  const handleGenerateSummary = async () => {
    setGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("Missing Supabase URL configuration");
      }

      const payload = {
        company_id: companyId,
        year: currentYear,
        month: currentMonth,
      };

      console.log("Calling edge function with payload:", payload);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-monthly-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response result:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate summary");
      }

      setSuccessMessage("Summary generated successfully!");
      await fetchSummary(); // Refresh summary data
    } catch (err) {
      console.error("Error generating summary:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate summary"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const currentDate = new Date(currentYear, currentMonth, 1);

    // Don't allow navigating to future months
    if (currentDate >= new Date(now.getFullYear(), now.getMonth() + 1, 1)) {
      return;
    }

    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[month - 1];
  };

  const canNavigateNext = () => {
    const now = new Date();
    const currentDate = new Date(currentYear, currentMonth, 1);
    return currentDate < new Date(now.getFullYear(), now.getMonth() + 1, 1);
  };

  const canNavigatePrevious = () => {
    return (
      availableMonths.some(
        (m) => m.year === currentYear && m.month === currentMonth
      ) ||
      currentYear < availableMonths[0]?.year ||
      (currentYear === availableMonths[0]?.year &&
        currentMonth > availableMonths[0]?.month)
    );
  };

  if (loading) {
    return (
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <MonthlySummarySkeleton />
      </Paper>
    );
  }

  if (availableMonths.length === 0) {
    return null;
  }

  const hasReviews = availableMonths.some(
    (m) => m.year === currentYear && m.month === currentMonth
  );

  const monthYear = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const summaryExists = summaryData !== null;

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        {/* Title */}
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Monthly Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-generated insights from customer reviews
          </Typography>
        </Box>

        {/* Navigation */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <IconButton
            onClick={handlePreviousMonth}
            disabled={!canNavigatePrevious()}
            size="large"
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h6" fontWeight={500}>
            {getMonthName(currentMonth)} {currentYear}
          </Typography>

          <IconButton
            onClick={handleNextMonth}
            disabled={!canNavigateNext()}
            size="large"
          >
            <ArrowForwardIcon />
          </IconButton>
        </Stack>

        {/* Messages */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Content */}
        {!hasReviews ? (
          <Card variant="outlined">
            <CardContent>
              <Typography
                variant="body1"
                color="text.secondary"
                align="center"
                sx={{ py: 4 }}
              >
                No reviews for this month
              </Typography>
            </CardContent>
          </Card>
        ) : summaryExists && summaryData ? (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={3}>
                {/* Summary text */}
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {summaryData.summary}
                  </Typography>
                </Box>

                {/* Stats */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "3fr" },
                    gap: 2,
                    pt: 2,
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Reviews
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {summaryData.total_reviews}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Average Rating
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {Number(summaryData.average_rating).toFixed(1)} / 5.0
                    </Typography>
                  </Box>

                  {summaryData.sentiment_breakdown && (
                    <>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Positive
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          color="success.main"
                        >
                          {summaryData.sentiment_breakdown.positive}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Neutral
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {summaryData.sentiment_breakdown.neutral}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Negative
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          color="error.main"
                        >
                          {summaryData.sentiment_breakdown.negative}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={3} alignItems="center">
                <Typography
                  variant="body1"
                  color="text.secondary"
                  align="center"
                >
                  No summary generated yet for this month
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleGenerateSummary}
                  disabled={generating || summaryExists}
                  sx={{ borderRadius: 980, minWidth: 200 }}
                >
                  {generating ? "Generating..." : "Generate Summary"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Paper>
  );
};
