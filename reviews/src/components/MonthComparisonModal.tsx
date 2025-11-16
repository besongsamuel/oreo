import {
  Close as CloseIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  CompareArrows as CompareArrowsIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSupabase } from "../hooks/useSupabase";

interface MonthComparisonModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
}

interface MonthData {
  year: number;
  month: number;
  total_reviews: number;
}

interface MonthComparisonData {
  month1: {
    year: number;
    month: number;
    totalReviews: number;
    positiveReviews: number;
    negativeReviews: number;
    neutralReviews: number;
    averageRating: number;
    averageSentiment: number;
    topTopics: Array<{ name: string; count: number }>;
    topKeywords: Array<{ text: string; count: number }>;
  };
  month2: {
    year: number;
    month: number;
    totalReviews: number;
    positiveReviews: number;
    negativeReviews: number;
    neutralReviews: number;
    averageRating: number;
    averageSentiment: number;
    topTopics: Array<{ name: string; count: number }>;
    topKeywords: Array<{ text: string; count: number }>;
  };
}

export const MonthComparisonModal = ({
  open,
  onClose,
  companyId,
}: MonthComparisonModalProps) => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<MonthData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [comparisonData, setComparisonData] =
    useState<MonthComparisonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available months on mount
  useEffect(() => {
    if (open && companyId) {
      fetchAvailableMonths();
    }
  }, [open, companyId]);

  // Fetch comparison data when month/year changes
  useEffect(() => {
    if (open && companyId && availableMonths.length > 0) {
      fetchComparisonData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companyId, selectedYear, selectedMonth, availableMonths.length]);

  const fetchAvailableMonths = async () => {
    try {
      const { data: locations } = await supabase
        .from("locations")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (!locations || locations.length === 0) {
        setAvailableMonths([]);
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
        return;
      }

      const platformConnectionIds = platformConnections.map((pc) => pc.id);

      const { data: reviews } = await supabase
        .from("reviews")
        .select("published_at")
        .in("platform_connection_id", platformConnectionIds);

      if (!reviews || reviews.length === 0) {
        setAvailableMonths([]);
        return;
      }

      const monthMap = new Map<string, number>();
      reviews.forEach((review) => {
        const date = new Date(review.published_at);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${String(month).padStart(2, "0")}`;
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      });

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

      // Set default to most recent month with a previous month available
      if (months.length > 1) {
        const mostRecent = months[0];
        // Check if previous month exists
        let prevMonth = mostRecent.month - 1;
        let prevYear = mostRecent.year;
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear = prevYear - 1;
        }
        const hasPreviousMonth = months.some(
          (m) => m.year === prevYear && m.month === prevMonth
        );
        if (hasPreviousMonth) {
          setSelectedYear(prevYear);
          setSelectedMonth(prevMonth);
        } else {
          // Use the second most recent month
          if (months.length > 1) {
            setSelectedYear(months[1].year);
            setSelectedMonth(months[1].month);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching available months:", err);
      setAvailableMonths([]);
    }
  };

  const fetchComparisonData = async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      // Calculate month 2 (next month)
      let month2Month = selectedMonth + 1;
      let month2Year = selectedYear;
      if (month2Month > 12) {
        month2Month = 1;
        month2Year = month2Year + 1;
      }

      // Check if both months have data
      const month1Exists = availableMonths.some(
        (m) => m.year === selectedYear && m.month === selectedMonth
      );
      const month2Exists = availableMonths.some(
        (m) => m.year === month2Year && m.month === month2Month
      );

      if (!month1Exists || !month2Exists) {
        setError(
          t(
            "monthComparison.bothMonthsRequired",
            "Both months must have review data to compare"
          )
        );
        setComparisonData(null);
        setLoading(false);
        return;
      }

      // Get locations and platform connections
      const { data: locations } = await supabase
        .from("locations")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (!locations || locations.length === 0) {
        setError(t("monthComparison.noLocations", "No locations found"));
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
        setError(
          t("monthComparison.noPlatformConnections", "No platform connections found")
        );
        setLoading(false);
        return;
      }

      const platformConnectionIds = platformConnections.map((pc) => pc.id);

      // Fetch data for both months
      const [month1Data, month2Data] = await Promise.all([
        fetchMonthData(selectedYear, selectedMonth, platformConnectionIds),
        fetchMonthData(month2Year, month2Month, platformConnectionIds),
      ]);

      setComparisonData({
        month1: month1Data,
        month2: month2Data,
      });
    } catch (err) {
      console.error("Error fetching comparison data:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("monthComparison.fetchError", "Failed to fetch comparison data")
      );
      setComparisonData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthData = async (
    year: number,
    month: number,
    platformConnectionIds: string[]
  ) => {
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch reviews for this month
    const { data: reviews } = await supabase
      .from("reviews")
      .select(
        `
        id,
        rating,
        published_at,
        sentiment_analysis (
          sentiment,
          sentiment_score
        )
      `
      )
      .in("platform_connection_id", platformConnectionIds)
      .gte("published_at", startDate.toISOString())
      .lte("published_at", endDate.toISOString());

    const reviewsList = reviews || [];

    // Calculate basic stats
    const totalReviews = reviewsList.length;
    const averageRating =
      totalReviews > 0
        ? reviewsList.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
          totalReviews
        : 0;

    // Calculate sentiment breakdown
    let positiveReviews = 0;
    let negativeReviews = 0;
    let neutralReviews = 0;
    let sentimentScores: number[] = [];

    reviewsList.forEach((review: any) => {
      const sentiment = review.sentiment_analysis;
      if (sentiment) {
        if (sentiment.sentiment === "positive") positiveReviews++;
        else if (sentiment.sentiment === "negative") negativeReviews++;
        else neutralReviews++;

        if (sentiment.sentiment_score !== null && sentiment.sentiment_score !== 0) {
          sentimentScores.push(Number(sentiment.sentiment_score));
        }
      }
    });

    const averageSentiment =
      sentimentScores.length > 0
        ? sentimentScores.reduce((sum, score) => sum + score, 0) /
          sentimentScores.length
        : 0;

    // Fetch top topics for this month
    const reviewIds = reviewsList.map((r: any) => r.id);
    let topTopics: Array<{ name: string; count: number }> = [];

    if (reviewIds.length > 0) {
      const { data: reviewTopics } = await supabase
        .from("review_topics")
        .select(
          `
          review_id,
          topics (
            name
          )
        `
        )
        .in("review_id", reviewIds);

      if (reviewTopics) {
        const topicCountMap = new Map<string, number>();
        reviewTopics.forEach((rt: any) => {
          if (rt.topics) {
            const topicName = rt.topics.name;
            topicCountMap.set(topicName, (topicCountMap.get(topicName) || 0) + 1);
          }
        });

        topTopics = Array.from(topicCountMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
      }
    }

    // Fetch top keywords for this month
    let topKeywords: Array<{ text: string; count: number }> = [];

    if (reviewIds.length > 0) {
      const { data: reviewKeywords } = await supabase
        .from("review_keywords")
        .select(
          `
          review_id,
          keywords (
            text
          )
        `
        )
        .in("review_id", reviewIds);

      if (reviewKeywords) {
        const keywordCountMap = new Map<string, number>();
        reviewKeywords.forEach((rk: any) => {
          if (rk.keywords) {
            const keywordText = rk.keywords.text;
            keywordCountMap.set(
              keywordText,
              (keywordCountMap.get(keywordText) || 0) + 1
            );
          }
        });

        topKeywords = Array.from(keywordCountMap.entries())
          .map(([text, count]) => ({ text, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
      }
    }

    return {
      year,
      month,
      totalReviews,
      positiveReviews,
      negativeReviews,
      neutralReviews,
      averageRating,
      averageSentiment,
      topTopics,
      topKeywords,
    };
  };

  const getMonthName = (month: number) => {
    const months = [
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
    return t(`monthlySummary.${months[month - 1].toLowerCase()}` as any);
  };

  const getChangeIcon = (value1: number, value2: number) => {
    if (value2 > value1) {
      return <TrendingUpIcon sx={{ color: "success.main" }} />;
    } else if (value2 < value1) {
      return <TrendingDownIcon sx={{ color: "error.main" }} />;
    }
    return null;
  };

  const getChangePercentage = (value1: number, value2: number) => {
    if (value1 === 0) return value2 > 0 ? 100 : 0;
    return ((value2 - value1) / value1) * 100;
  };

  const formatSentiment = (score: number) => {
    if (score >= 0.3) return t("monthComparison.positive", "Positive");
    if (score <= -0.3) return t("monthComparison.negative", "Negative");
    return t("monthComparison.neutral", "Neutral");
  };

  // Get available months for selector (only months that have a next month available)
  const selectableMonths = availableMonths.filter((m) => {
    let nextMonth = m.month + 1;
    let nextYear = m.year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = nextYear + 1;
    }
    return availableMonths.some(
      (m2) => m2.year === nextYear && m2.month === nextMonth
    );
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CompareArrowsIcon />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {t("monthComparison.title", "Month Comparison")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(
                  "monthComparison.subtitle",
                  "Compare reviews between two consecutive months"
                )}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Month Selector */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" fontWeight={600}>
              {t("monthComparison.selectMonth", "Select First Month")}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {[
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
                  ].map((month, index) => (
                    <MenuItem key={index + 1} value={index + 1}>
                      {t(`monthlySummary.${month.toLowerCase()}` as any)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="body2" color="text.secondary">
                {t("monthComparison.vs", "vs")}
              </Typography>

              <Typography variant="body1" fontWeight={600}>
                {(() => {
                  let month2Month = selectedMonth + 1;
                  let month2Year = selectedYear;
                  if (month2Month > 12) {
                    month2Month = 1;
                    month2Year = month2Year + 1;
                  }
                  return `${getMonthName(month2Month)} ${month2Year}`;
                })()}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {loading ? (
          <Stack spacing={2}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" align="center">
              {t("monthComparison.loading", "Loading comparison data...")}
            </Typography>
          </Stack>
        ) : comparisonData ? (
          <Stack spacing={4}>
            {/* Total Reviews Comparison */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {t("monthComparison.totalReviews", "Total Reviews")}
                </Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="caption" color="text.secondary">
                        {getMonthName(comparisonData.month1.month)}{" "}
                        {comparisonData.month1.year}
                      </Typography>
                      <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                        {comparisonData.month1.totalReviews}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {getMonthName(comparisonData.month2.month)}{" "}
                            {comparisonData.month2.year}
                          </Typography>
                          <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                            {comparisonData.month2.totalReviews}
                          </Typography>
                        </Box>
                        <Box>
                          {getChangeIcon(
                            comparisonData.month1.totalReviews,
                            comparisonData.month2.totalReviews
                          )}
                        </Box>
                      </Stack>
                      <Typography
                        variant="body2"
                        color={
                          comparisonData.month2.totalReviews >
                          comparisonData.month1.totalReviews
                            ? "success.main"
                            : comparisonData.month2.totalReviews <
                              comparisonData.month1.totalReviews
                            ? "error.main"
                            : "text.secondary"
                        }
                        sx={{ mt: 1 }}
                      >
                        {getChangePercentage(
                          comparisonData.month1.totalReviews,
                          comparisonData.month2.totalReviews
                        ).toFixed(1)}
                        %{" "}
                        {comparisonData.month2.totalReviews >
                        comparisonData.month1.totalReviews
                          ? t("monthComparison.increase", "increase")
                          : comparisonData.month2.totalReviews <
                            comparisonData.month1.totalReviews
                          ? t("monthComparison.decrease", "decrease")
                          : t("monthComparison.noChange", "no change")}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Positive vs Negative Reviews */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {t("monthComparison.sentimentBreakdown", "Sentiment Breakdown")}
                </Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {getMonthName(comparisonData.month1.month)}{" "}
                        {comparisonData.month1.year}
                      </Typography>
                      <Stack spacing={1.5} sx={{ mt: 2 }}>
                        <Box>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="body2" color="success.main">
                              {t("monthComparison.positive", "Positive")}
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {comparisonData.month1.positiveReviews}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="body2" color="error.main">
                              {t("monthComparison.negative", "Negative")}
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {comparisonData.month1.negativeReviews}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="subtitle2" fontWeight={600}>
                          {getMonthName(comparisonData.month2.month)}{" "}
                          {comparisonData.month2.year}
                        </Typography>
                        {getChangeIcon(
                          comparisonData.month1.positiveReviews -
                            comparisonData.month1.negativeReviews,
                          comparisonData.month2.positiveReviews -
                            comparisonData.month2.negativeReviews
                        )}
                      </Stack>
                      <Stack spacing={1.5}>
                        <Box>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="body2" color="success.main">
                              {t("monthComparison.positive", "Positive")}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body1" fontWeight={600}>
                                {comparisonData.month2.positiveReviews}
                              </Typography>
                              {getChangeIcon(
                                comparisonData.month1.positiveReviews,
                                comparisonData.month2.positiveReviews
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                        <Box>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="body2" color="error.main">
                              {t("monthComparison.negative", "Negative")}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body1" fontWeight={600}>
                                {comparisonData.month2.negativeReviews}
                              </Typography>
                              {getChangeIcon(
                                comparisonData.month1.negativeReviews,
                                comparisonData.month2.negativeReviews
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Average Sentiment */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {t("monthComparison.averageSentiment", "Average Sentiment")}
                </Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="caption" color="text.secondary">
                        {getMonthName(comparisonData.month1.month)}{" "}
                        {comparisonData.month1.year}
                      </Typography>
                      <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                        {formatSentiment(comparisonData.month1.averageSentiment)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {comparisonData.month1.averageSentiment.toFixed(3)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {getMonthName(comparisonData.month2.month)}{" "}
                            {comparisonData.month2.year}
                          </Typography>
                          <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                            {formatSentiment(comparisonData.month2.averageSentiment)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {comparisonData.month2.averageSentiment.toFixed(3)}
                          </Typography>
                        </Box>
                        {getChangeIcon(
                          comparisonData.month1.averageSentiment,
                          comparisonData.month2.averageSentiment
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Top Topics */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {t("monthComparison.topTopics", "Top 3 Topics")}
                </Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {getMonthName(comparisonData.month1.month)}{" "}
                        {comparisonData.month1.year}
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 2 }}>
                        {comparisonData.month1.topTopics.length > 0 ? (
                          comparisonData.month1.topTopics.map((topic, index) => (
                            <Chip
                              key={index}
                              label={`${topic.name} (${topic.count})`}
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t("monthComparison.noTopics", "No topics found")}
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {getMonthName(comparisonData.month2.month)}{" "}
                        {comparisonData.month2.year}
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 2 }}>
                        {comparisonData.month2.topTopics.length > 0 ? (
                          comparisonData.month2.topTopics.map((topic, index) => (
                            <Chip
                              key={index}
                              label={`${topic.name} (${topic.count})`}
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t("monthComparison.noTopics", "No topics found")}
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Top Keywords */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {t("monthComparison.topKeywords", "Top 3 Keywords")}
                </Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {getMonthName(comparisonData.month1.month)}{" "}
                        {comparisonData.month1.year}
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 2 }}>
                        {comparisonData.month1.topKeywords.length > 0 ? (
                          comparisonData.month1.topKeywords.map((keyword, index) => (
                            <Chip
                              key={index}
                              label={`${keyword.text} (${keyword.count})`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t("monthComparison.noKeywords", "No keywords found")}
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {getMonthName(comparisonData.month2.month)}{" "}
                        {comparisonData.month2.year}
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 2 }}>
                        {comparisonData.month2.topKeywords.length > 0 ? (
                          comparisonData.month2.topKeywords.map((keyword, index) => (
                            <Chip
                              key={index}
                              label={`${keyword.text} (${keyword.count})`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t("monthComparison.noKeywords", "No keywords found")}
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        ) : (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              {t(
                "monthComparison.noData",
                "Select a month to compare with the next month"
              )}
            </Typography>
          </Paper>
        )}
      </DialogContent>
    </Dialog>
  );
};

