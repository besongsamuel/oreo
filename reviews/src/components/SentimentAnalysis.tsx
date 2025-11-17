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
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";
import { ActionPlanFilterModal } from "./ActionPlanFilterModal";

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

type SentimentRunStatus = "pending" | "in_progress" | "completed" | "failed";

interface SentimentAnalysisRun {
  id: string;
  status: SentimentRunStatus;
  processed_reviews: number;
  skipped_reviews: number;
  failed_reviews: number;
  total_reviews: number;
  error_details: string | null;
  started_at: string | null;
  completed_at: string | null;
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
  const context = useContext(UserContext);
  const profile = context?.profile;
  const session = context?.session;
  const [actionPlanOpen, setActionPlanOpen] = useState(false);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeActionPlanFilters, setActiveActionPlanFilters] = useState<{
    filterStartDate?: string;
    filterEndDate?: string;
    selectedSentiment?: string;
  } | null>(null);
  const [unprocessedCount, setUnprocessedCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshSuccess, setRefreshSuccess] = useState<string | null>(null);
  const [latestRun, setLatestRun] = useState<SentimentAnalysisRun | null>(null);
  const [runStatusLoading, setRunStatusLoading] = useState(false);
  const lastRunStatusRef = useRef<SentimentRunStatus | null>(null);

  const loadUnprocessedCount = useCallback(async () => {
    if (!companyId) {
      setUnprocessedCount(0);
      return;
    }

    try {
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
  }, [companyId, supabase]);

  useEffect(() => {
    loadUnprocessedCount();
  }, [loadUnprocessedCount, sentimentData]);

  const fetchLatestRun = useCallback(
    async (withLoader = false) => {
      if (!companyId) {
        setLatestRun(null);
        lastRunStatusRef.current = null;
        return;
      }

      if (withLoader) {
        setRunStatusLoading(true);
      }

      try {
        const { data, error } = await supabase
          .from("sentiment_analysis_runs")
          .select(
            "id, status, processed_reviews, skipped_reviews, failed_reviews, total_reviews, error_details, started_at, completed_at"
          )
          .eq("company_id", companyId)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setLatestRun(data ?? null);
      } catch (error) {
        console.error("Error fetching sentiment analysis run:", error);
        setLatestRun(null);
      } finally {
        if (withLoader) {
          setRunStatusLoading(false);
        }
      }
    },
    [companyId, supabase]
  );

  useEffect(() => {
    fetchLatestRun(true);
  }, [fetchLatestRun]);

  useEffect(() => {
    if (!companyId) return;

    if (
      !latestRun ||
      (latestRun.status !== "pending" && latestRun.status !== "in_progress")
    ) {
      return;
    }

    const interval = setInterval(() => {
      fetchLatestRun();
    }, 5000);

    return () => clearInterval(interval);
  }, [companyId, latestRun?.status, fetchLatestRun]);

  useEffect(() => {
    const currentStatus = latestRun?.status ?? null;
    const previousStatus = lastRunStatusRef.current;

    if (currentStatus === previousStatus) {
      return;
    }

    lastRunStatusRef.current = currentStatus;

    if (currentStatus === "completed") {
      const processedMessage =
        totalRunCount > 0
          ? t("sentimentAnalysis.processingCompleteWithCounts", {
              defaultValue:
                "Processed {{processed}} of {{total}} reviews successfully.",
              processed: processedCount,
              total: totalRunCount,
            })
          : t("sentimentAnalysis.processingComplete", {
              defaultValue: "Sentiment analysis completed successfully.",
            });

      setRefreshSuccess(processedMessage);
      setRefreshError(null);
      loadUnprocessedCount();
    } else if (currentStatus === "failed") {
      setRefreshError(
        latestRun?.error_details ||
          t(
            "sentimentAnalysis.processingFailed",
            "Sentiment analysis failed. Please try again."
          )
      );
      setRefreshSuccess(null);
      loadUnprocessedCount();
    } else if (currentStatus === "pending" || currentStatus === "in_progress") {
      setRefreshSuccess(null);
      setRefreshError(null);
    } else if (currentStatus === null) {
      setRefreshSuccess(null);
    }
  }, [latestRun, loadUnprocessedCount, t]);

  const handleGenerateActionPlan = () => {
    if (!companyId) return;
    setFilterModalOpen(true);
  };

  const handleFilterConfirm = async (filters: {
    filterStartDate: string;
    filterEndDate: string;
    selectedSentiment: string;
  }) => {
    if (!companyId) return;

    setActiveActionPlanFilters(filters);
    setFilterModalOpen(false);
    setLoadingPlan(true);
    setActionPlanOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "sentiment-analysis-action-plan",
        {
          body: {
            companyId,
            filterStartDate: filters.filterStartDate,
            filterEndDate: filters.filterEndDate,
            selectedSentiment: filters.selectedSentiment,
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

    if (!session?.access_token) {
      setRefreshError(
        t(
          "sentimentAnalysis.sessionRequired",
          "You must be signed in to perform sentiment analysis."
        )
      );
      return;
    }

    setIsRefreshing(true);
    setRefreshError(null);
    setRefreshSuccess(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "refresh-sentiments",
        {
          body: { company_id: companyId },
        }
      );

      if (error) throw error;

      if (data?.success) {
        if (data.run_id) {
          setLatestRun((current) =>
            current && current.id === data.run_id
              ? current
              : {
                  id: data.run_id,
                  status: "pending",
                  processed_reviews: 0,
                  skipped_reviews: 0,
                  failed_reviews: 0,
                  total_reviews: data.total_reviews ?? 0,
                  error_details: null,
                  started_at: new Date().toISOString(),
                  completed_at: null,
                }
          );
          lastRunStatusRef.current = "pending";
        }

        await fetchLatestRun();
      } else {
        setRefreshError(
          data?.error ||
            t(
              "sentimentAnalysis.failedStart",
              "Failed to start sentiment analysis."
            )
        );
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

  const handleCloseActionPlan = () => {
    setActionPlanOpen(false);
    setActionPlan(null);
    setCopied(false);
    setActiveActionPlanFilters(null);
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
    if (activeActionPlanFilters) {
      if (activeActionPlanFilters.filterStartDate) {
        filters.push(
          `${t("sentimentAnalysis.filterLabels.from")} ${new Date(
            activeActionPlanFilters.filterStartDate
          ).toLocaleDateString()}`
        );
      }
      if (activeActionPlanFilters.filterEndDate) {
        filters.push(
          `${t("sentimentAnalysis.filterLabels.to")} ${new Date(
            activeActionPlanFilters.filterEndDate
          ).toLocaleDateString()}`
        );
      }
      if (activeActionPlanFilters.selectedSentiment) {
        const sentimentLabel =
          activeActionPlanFilters.selectedSentiment === "positive"
            ? t("actionPlanFilter.positive")
            : activeActionPlanFilters.selectedSentiment === "negative"
            ? t("actionPlanFilter.negative")
            : t("actionPlanFilter.neutral");
        filters.push(`${t("actionPlanFilter.sentiment")}: ${sentimentLabel}`);
      }
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

  const isRunActive =
    latestRun?.status === "pending" || latestRun?.status === "in_progress";

  const processedCount = latestRun?.processed_reviews ?? 0;
  const totalRunCount = latestRun?.total_reviews ?? 0;

  const runStatusMessage = isRunActive
    ? totalRunCount > 0
      ? t("sentimentAnalysis.runInProgressWithCounts", {
          defaultValue:
            "Performing Sentiment Analysis on reviews ({{processed}} / {{total}})",
          processed: processedCount,
          total: totalRunCount,
        })
      : t("sentimentAnalysis.runInProgress", {
          defaultValue: "Performing Sentiment Analysis on reviews",
        })
    : null;

  const showRefreshButton =
    Boolean(companyId) &&
    profile?.role === "admin" &&
    unprocessedCount > 0 &&
    !isRunActive;

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

        {/* Refresh Sentiments */}
        {companyId && profile?.role === "admin" && (
          <Box>
            {runStatusLoading && !latestRun && (
              <Skeleton variant="text" width="70%" sx={{ mb: 2 }} />
            )}

            {runStatusMessage && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {runStatusMessage}
              </Alert>
            )}

            {showRefreshButton && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshSentiments}
                disabled={isRefreshing}
                fullWidth
              >
                {isRefreshing
                  ? t(
                      "sentimentAnalysis.startingAnalysis",
                      "Starting sentiment analysis..."
                    )
                  : t(
                      "sentimentAnalysis.performAnalysis",
                      "Perform Sentiment Analysis"
                    )}
              </Button>
            )}

            {!showRefreshButton &&
              !runStatusMessage &&
              unprocessedCount === 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {t(
                    "sentimentAnalysis.noUnprocessedReviews",
                    "Sentiment analysis completed."
                  )}
                </Alert>
              )}
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

      {/* Action Plan Filter Modal */}
      <ActionPlanFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onGenerate={handleFilterConfirm}
        loading={loadingPlan}
      />
    </Paper>
  );
};
