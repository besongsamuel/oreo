import {
  ContentCopy as ContentCopyIcon,
  Lightbulb as LightbulbIcon,
  SentimentDissatisfied as NegativeIcon,
  SentimentNeutral as NeutralIcon,
  SentimentSatisfiedAlt as PositiveIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { PieChart } from "@mui/x-charts/PieChart";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSupabase } from "../hooks/useSupabase";

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
  emotions?: {
    emoji: string;
    count: number;
    percentage: number;
  }[];
}

interface SentimentAnalysisProps {
  sentimentData: SentimentData;
  companyId?: string;
  filterLocation?: string;
  filterStartDate?: string;
  filterEndDate?: string;
  selectedKeyword?: string;
  selectedRating?: string;
  selectedTopic?: string;
}

export const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({
  sentimentData,
  companyId,
  filterLocation,
  filterStartDate,
  filterEndDate,
  selectedKeyword,
  selectedRating,
  selectedTopic,
}) => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const [actionPlanOpen, setActionPlanOpen] = useState(false);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unprocessedCount, setUnprocessedCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshSuccess, setRefreshSuccess] = useState<string | null>(null);
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const [processingSummary, setProcessingSummary] = useState<{
    processed: number;
    skipped: number;
    errors: number;
    total: number;
  } | null>(null);

  // Fetch count of reviews without sentiment analysis
  useEffect(() => {
    const fetchUnprocessedCount = async () => {
      if (!companyId) return;

      try {
        // Use RPC function to get count (avoids URL length issues with large IN clauses)
        const { data, error } = await supabase.rpc(
          "get_unprocessed_reviews_count",
          {
            company_uuid: companyId,
          }
        );

        if (error) {
          console.error("Error fetching unprocessed count:", error);
          setUnprocessedCount(0);
          return;
        }

        setUnprocessedCount(data || 0);
      } catch (error) {
        console.error("Error fetching unprocessed count:", error);
        setUnprocessedCount(0);
      }
    };

    fetchUnprocessedCount();
  }, [companyId, supabase, sentimentData]);

  const handleGenerateActionPlan = async () => {
    if (!companyId) return;

    setLoadingPlan(true);
    setActionPlanOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "sentiment-analysis-action-plan",
        {
          body: {
            companyId,
            filterLocation,
            filterStartDate,
            filterEndDate,
            selectedKeyword,
            selectedRating,
            selectedTopic,
          },
        }
      );

      if (error) throw error;

      if (data?.success && data?.actionPlan) {
        setActionPlan(data.actionPlan);
      } else {
        setActionPlan(t("sentimentAnalysis.failedGenerate"));
      }
    } catch (error) {
      console.error("Error generating action plan:", error);
      setActionPlan(t("sentimentAnalysis.errorGenerating"));
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleRefreshSentiments = async () => {
    if (!companyId) return;

    setIsRefreshing(true);
    setRefreshError(null);
    setRefreshSuccess(null);
    setProcessingSummary(null);
    setProcessingModalOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "refresh-sentiments",
        {
          body: { company_id: companyId },
        }
      );

      if (error) throw error;

      if (data?.success) {
        // Set processing summary
        setProcessingSummary({
          processed: data.processed || 0,
          skipped: data.skipped || 0,
          errors: data.errors || 0,
          total: data.total || 0,
        });

        const message =
          data.message ||
          `Successfully processed ${data.processed} reviews. ${
            data.skipped > 0
              ? `${data.skipped} skipped due to rate limits. `
              : ""
          }${data.errors > 0 ? `${data.errors} errors occurred.` : ""}`;

        setRefreshSuccess(message);

        // Update the unprocessed count with remaining reviews
        if (data.remaining !== undefined) {
          setUnprocessedCount(data.remaining);
        } else {
          // Fallback: Refresh the unprocessed count from server
          try {
            const { data: countData } = await supabase.rpc(
              "get_unprocessed_reviews_count",
              {
                company_uuid: companyId,
              }
            );
            setUnprocessedCount(countData || 0);
          } catch (error) {
            console.error("Error refreshing count:", error);
            setUnprocessedCount(0);
          }
        }
      } else {
        setRefreshError(data?.error || "Failed to refresh sentiments");
      }
    } catch (error) {
      console.error("Error refreshing sentiments:", error);
      setRefreshError(
        error instanceof Error ? error.message : "Failed to refresh sentiments"
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCloseProcessingModal = () => {
    setProcessingModalOpen(false);
    setProcessingSummary(null);
  };

  const handleCloseActionPlan = () => {
    setActionPlanOpen(false);
    setActionPlan(null);
    setCopied(false);
  };

  const handleCopyActionPlan = async () => {
    if (actionPlan) {
      try {
        await navigator.clipboard.writeText(actionPlan);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        // Fallback: try using deprecated clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = actionPlan;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error("Fallback copy also failed:", err);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  const getActiveFilters = () => {
    const filters = [];
    if (filterLocation && filterLocation !== "all") {
      filters.push(
        `${t("sentimentAnalysis.filterLabels.location")} ${filterLocation}`
      );
    }
    if (filterStartDate) {
      filters.push(
        `${t("sentimentAnalysis.filterLabels.from")} ${new Date(
          filterStartDate
        ).toLocaleDateString()}`
      );
    }
    if (filterEndDate) {
      filters.push(
        `${t("sentimentAnalysis.filterLabels.to")} ${new Date(
          filterEndDate
        ).toLocaleDateString()}`
      );
    }
    if (selectedKeyword && selectedKeyword !== "all") {
      filters.push(
        `${t("sentimentAnalysis.filterLabels.keyword")} ${selectedKeyword}`
      );
    }
    if (selectedRating && selectedRating !== "all") {
      filters.push(
        `${t("sentimentAnalysis.filterLabels.rating")} ${selectedRating} ${t(
          "sentimentAnalysis.filterLabels.stars"
        )}`
      );
    }
    if (selectedTopic && selectedTopic !== "all") {
      filters.push(
        `${t("sentimentAnalysis.filterLabels.topic")} ${selectedTopic}`
      );
    }
    return filters;
  };

  const formatActionPlan = (plan: string) => {
    // Convert markdown-style formatting to HTML
    return plan
      .replace(
        /^## (.+)$/gm,
        '<h3 style="margin-top: 1.5em; margin-bottom: 0.5em; font-size: 1.1em; font-weight: 600;">$1</h3>'
      )
      .replace(
        /^#### (.+)$/gm,
        '<h4 style="margin-top: 1em; margin-bottom: 0.3em; font-size: 1em; font-weight: 600;">$1</h4>'
      )
      .replace(/^\d+\. (.+)$/gm, '<div style="margin: 0.5em 0;">$1</div>')
      .replace(
        /^- (.+)$/gm,
        '<div style="margin: 0.3em 0; padding-left: 1em;">• $1</div>'
      )
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "<br /><br />")
      .replace(/\n/g, " ");
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return <PositiveIcon sx={{ color: "success.main" }} />;
      case "negative":
        return <NegativeIcon sx={{ color: "error.main" }} />;
      default:
        return <NeutralIcon sx={{ color: "warning.main" }} />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "success";
      case "negative":
        return "error";
      default:
        return "warning";
    }
  };

  // Convert score from -1 to 1 range to 0 to 100 for gauge
  const gaugeValue = ((sentimentData.overallScore + 1) / 2) * 100;

  // Sentiment distribution data for pie chart
  const sentimentDistribution = [
    {
      id: 0,
      value: sentimentData.positiveCount,
      label: t("monthlySummary.positive"),
      color: "#4caf50",
    },
    {
      id: 1,
      value: sentimentData.neutralCount,
      label: t("monthlySummary.neutral"),
      color: "#ff9800",
    },
    {
      id: 2,
      value: sentimentData.negativeCount,
      label: t("monthlySummary.negative"),
      color: "#f44336",
    },
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h5" fontWeight={600}>
              {t("sentimentAnalysis.title")}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t("sentimentAnalysis.description", {
              count: sentimentData.totalReviews,
            })}
          </Typography>
        </Box>

        {/* Overall Sentiment Score */}
        <Card variant="outlined" sx={{ bgcolor: "background.default" }}>
          <CardContent>
            <Stack
              direction="row"
              spacing={4}
              alignItems="center"
              flexWrap="wrap"
            >
              {/* Gauge Chart */}
              <Box sx={{ position: "relative", pb: 4 }}>
                <Gauge
                  width={200}
                  height={200}
                  value={gaugeValue}
                  startAngle={-110}
                  endAngle={110}
                  sx={{
                    [`& .${gaugeClasses.valueText}`]: {
                      fontSize: 28,
                      fontWeight: "bold",
                    },
                    [`& .${gaugeClasses.valueArc}`]: {
                      fill:
                        gaugeValue >= 66
                          ? "#4caf50"
                          : gaugeValue >= 33
                          ? "#ff9800"
                          : "#f44336",
                    },
                  }}
                  text={({ value }) => `${Math.round(value || 0)}%`}
                />
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "text.secondary",
                    mt: 1,
                    textAlign: "center",
                  }}
                >
                  {t("sentimentAnalysis.sentimentScore")}
                </Typography>
              </Box>

              {/* Sentiment Details */}
              <Stack spacing={2} sx={{ flexGrow: 1 }}>
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {t("sentimentAnalysis.overallSentiment")}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {getSentimentIcon(sentimentData.overallSentiment)}
                    <Chip
                      label={sentimentData.overallSentiment.toUpperCase()}
                      color={
                        getSentimentColor(sentimentData.overallSentiment) as any
                      }
                      size="medium"
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Sentiment Breakdown */}
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {t("sentimentAnalysis.sentimentDistribution")}
                  </Typography>
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PositiveIcon
                          sx={{ color: "success.main", fontSize: 18 }}
                        />
                        <Typography variant="body2">Positive</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {sentimentData.positiveCount} (
                        {(
                          (sentimentData.positiveCount /
                            sentimentData.totalReviews) *
                          100
                        ).toFixed(0)}
                        %)
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <NeutralIcon
                          sx={{ color: "warning.main", fontSize: 18 }}
                        />
                        <Typography variant="body2">
                          {t("monthlySummary.neutral")}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {sentimentData.neutralCount} (
                        {(
                          (sentimentData.neutralCount /
                            sentimentData.totalReviews) *
                          100
                        ).toFixed(0)}
                        %)
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <NegativeIcon
                          sx={{ color: "error.main", fontSize: 18 }}
                        />
                        <Typography variant="body2">
                          {t("monthlySummary.negative")}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {sentimentData.negativeCount} (
                        {(
                          (sentimentData.negativeCount /
                            sentimentData.totalReviews) *
                          100
                        ).toFixed(0)}
                        %)
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>

              {/* Pie Chart */}
              <Box sx={{ minWidth: 250 }}>
                <PieChart
                  series={[
                    {
                      data: sentimentDistribution,
                      highlightScope: { fade: "global", highlight: "item" },
                    },
                  ]}
                  height={200}
                  margin={{ right: 5 }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Action Plan Button */}
        {companyId && (
          <Box>
            <Button
              variant="outlined"
              startIcon={<LightbulbIcon />}
              onClick={handleGenerateActionPlan}
              fullWidth
            >
              {t("sentimentAnalysis.proposeActionPlan")}
            </Button>
          </Box>
        )}

        {/* Refresh Sentiments Button */}
        {companyId && unprocessedCount > 0 && (
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={
                isRefreshing ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <RefreshIcon />
                )
              }
              onClick={handleRefreshSentiments}
              disabled={isRefreshing}
              fullWidth
            >
              {isRefreshing
                ? "Processing..."
                : unprocessedCount > 25
                ? `Process 25 of ${unprocessedCount} unprocessed reviews`
                : `Process ${unprocessedCount} unprocessed review${
                    unprocessedCount > 1 ? "s" : ""
                  }`}
            </Button>
          </Box>
        )}

        {/* Success/Error Messages */}
        {refreshSuccess && (
          <Alert severity="success" onClose={() => setRefreshSuccess(null)}>
            {refreshSuccess}
          </Alert>
        )}
        {refreshError && (
          <Alert severity="error" onClose={() => setRefreshError(null)}>
            {refreshError}
          </Alert>
        )}
      </Stack>

      {/* Action Plan Dialog */}
      <Dialog
        open={actionPlanOpen}
        onClose={handleCloseActionPlan}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Proposed Action Plan</Typography>
            {actionPlan && (
              <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                <IconButton size="small" onClick={handleCopyActionPlan}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </DialogTitle>
        <DialogContent>
          {loadingPlan ? (
            <Stack spacing={2} sx={{ py: 2 }}>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="70%" />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("sentimentAnalysis.generatingActionPlan")}
                </Typography>
              </Box>
            </Stack>
          ) : actionPlan ? (
            <Stack spacing={2}>
              {/* Active Filters */}
              {getActiveFilters().length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="caption" fontWeight={600} gutterBottom>
                    {t("sentimentAnalysis.filtersApplied")}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    flexWrap="wrap"
                    gap={0.5}
                    sx={{ mt: 0.5 }}
                  >
                    {getActiveFilters().map((filter, index) => (
                      <Chip
                        key={index}
                        label={filter}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Alert>
              )}

              {/* Action Plan Content */}
              <Box
                sx={{
                  maxHeight: "60vh",
                  overflow: "auto",
                  "& h3": {
                    mt: 3,
                    mb: 1,
                    fontSize: "1.1em",
                    fontWeight: 600,
                    color: "primary.main",
                  },
                  "& h4": {
                    mt: 2,
                    mb: 0.5,
                    fontSize: "1em",
                    fontWeight: 600,
                  },
                  "& strong": {
                    fontWeight: 600,
                  },
                  "& ul, & ol": {
                    pl: 2,
                    mb: 1,
                  },
                  "& li": {
                    mb: 0.5,
                  },
                }}
                dangerouslySetInnerHTML={{
                  __html: formatActionPlan(actionPlan),
                }}
              />
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("sentimentAnalysis.noActionPlan")}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActionPlan}>
            {t("sentimentAnalysis.close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Processing Modal */}
      <Dialog
        open={processingModalOpen}
        onClose={isRefreshing ? undefined : handleCloseProcessingModal}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={isRefreshing}
      >
        <DialogTitle>
          {isRefreshing ? "Processing Reviews..." : "Processing Complete"}
        </DialogTitle>
        <DialogContent>
          {isRefreshing ? (
            <Stack spacing={3} sx={{ py: 2, alignItems: "center" }}>
              <CircularProgress size={60} />
              <Stack spacing={1} alignItems="center">
                <Typography variant="body1" fontWeight={600}>
                  Analyzing reviews with AI...
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  This may take a few minutes depending on the number of
                  reviews. Please don't close this window.
                </Typography>
              </Stack>
            </Stack>
          ) : processingSummary ? (
            <Stack spacing={2} sx={{ py: 2 }}>
              <Alert
                severity={
                  processingSummary.errors > 0
                    ? "warning"
                    : processingSummary.processed > 0
                    ? "success"
                    : "info"
                }
              >
                {refreshSuccess || "Processing completed"}
              </Alert>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Processing Summary
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2" color="text.secondary">
                      Total Processed:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {processingSummary.total}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2" color="success.main">
                      Successfully Processed:
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="success.main"
                    >
                      {processingSummary.processed}
                    </Typography>
                  </Stack>
                  {processingSummary.skipped > 0 && (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" color="warning.main">
                        Skipped (Rate Limit):
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="warning.main"
                      >
                        {processingSummary.skipped}
                      </Typography>
                    </Stack>
                  )}
                  {processingSummary.errors > 0 && (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" color="error.main">
                        Failed:
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="error.main"
                      >
                        {processingSummary.errors}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Paper>

              {unprocessedCount > 0 && (
                <Alert severity="info">
                  {unprocessedCount} reviews remaining. Click the button again
                  to process more.
                </Alert>
              )}
            </Stack>
          ) : refreshError ? (
            <Alert severity="error">{refreshError}</Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProcessingModal} disabled={isRefreshing}>
            {isRefreshing ? "Processing..." : "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
