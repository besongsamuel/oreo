import { Lightbulb as LightbulbIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSupabase } from "../hooks/useSupabase";
import { Objective, ObjectivesService } from "../services/objectivesService";
import {
  Timespan,
  formatTimespanDisplay,
  getTimespanDates,
} from "../utils/objectivesUtils";
import { NoReviewsIllustration } from "./illustrations/ObjectiveIllustrations";
import { ObjectiveActionPlanModal } from "./ObjectiveActionPlanModal";
import { ObjectiveStatusIndicator } from "./ObjectiveStatusIndicator";

interface EnrichedReview {
  id: string;
  rating: number;
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
  published_at: string;
  sentiment_analysis?: {
    sentiment: string;
    sentiment_score: number;
    emotions?: any;
  } | null;
}

interface ObjectiveProgressChartProps {
  objectives: Objective[];
  enrichedReviews: EnrichedReview[];
  loading?: boolean;
  year: number;
  timespan: Timespan;
}

export const ObjectiveProgressChart = ({
  objectives,
  enrichedReviews,
  loading = false,
  year,
  timespan,
}: ObjectiveProgressChartProps) => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const objectivesService = useMemo(
    () => new ObjectivesService(supabase),
    [supabase]
  );

  // State for action plans
  const [actionPlans, setActionPlans] = useState<
    Record<
      string,
      {
        id: string;
        plan: string;
        created_at: string;
      } | null
    >
  >({});
  const [loadingActionPlans, setLoadingActionPlans] = useState(false);
  const [actionPlanModalOpen, setActionPlanModalOpen] = useState(false);
  const [selectedObjectiveForPlan, setSelectedObjectiveForPlan] =
    useState<Objective | null>(null);

  // Get date range from year and timespan
  const { startDate, endDate } = useMemo(() => {
    return getTimespanDates(year, timespan);
  }, [year, timespan]);

  // Fetch action plans for all objectives
  useEffect(() => {
    const fetchActionPlans = async () => {
      if (objectives.length === 0) return;

      setLoadingActionPlans(true);
      try {
        const plans: Record<string, any> = {};
        await Promise.all(
          objectives.map(async (objective) => {
            try {
              const plan = await objectivesService.getObjectiveActionPlan(
                objective.id,
                year,
                timespan
              );
              plans[objective.id] = plan;
            } catch (error) {
              console.error(
                `Error fetching action plan for objective ${objective.id}:`,
                error
              );
              plans[objective.id] = null;
            }
          })
        );
        setActionPlans(plans);
      } catch (error) {
        console.error("Error fetching action plans:", error);
      } finally {
        setLoadingActionPlans(false);
      }
    };

    fetchActionPlans();
  }, [objectives, year, timespan, objectivesService]);

  const handleGenerateActionPlan = (objective: Objective) => {
    setSelectedObjectiveForPlan(objective);
    setActionPlanModalOpen(true);
  };

  const handleActionPlanGenerated = async () => {
    if (!selectedObjectiveForPlan) return;

    // Refresh the action plan for the selected objective
    try {
      const plan = await objectivesService.getObjectiveActionPlan(
        selectedObjectiveForPlan.id,
        year,
        timespan
      );
      setActionPlans((prev) => ({
        ...prev,
        [selectedObjectiveForPlan.id]: plan,
      }));
    } catch (error) {
      console.error("Error refreshing action plan:", error);
    }
  };

  // Compute current rating for reviews within selected timespan
  const computeCurrentRating = useCallback((): number => {
    const filteredReviews = enrichedReviews.filter((review) => {
      const reviewDate = new Date(review.published_at)
        .toISOString()
        .split("T")[0];
      return reviewDate >= startDate && reviewDate <= endDate;
    });

    if (filteredReviews.length === 0) return 0;

    const sum = filteredReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / filteredReviews.length;
  }, [enrichedReviews, startDate, endDate]);

  // Compute current rating for a specific keyword within selected timespan
  const computeKeywordRating = useCallback(
    (keywordId: string): number => {
      const filteredReviews = enrichedReviews.filter((review) => {
        const reviewDate = new Date(review.published_at)
          .toISOString()
          .split("T")[0];
        const inTimeframe = reviewDate >= startDate && reviewDate <= endDate;
        const hasKeyword = review.keywords.some((kw) => kw.id === keywordId);
        return inTimeframe && hasKeyword;
      });

      if (filteredReviews.length === 0) return 0;

      const sum = filteredReviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      return sum / filteredReviews.length;
    },
    [enrichedReviews, startDate, endDate]
  );

  // Compute current rating for a specific topic within selected timespan
  const computeTopicRating = useCallback(
    (topicId: string): number => {
      const filteredReviews = enrichedReviews.filter((review) => {
        const reviewDate = new Date(review.published_at)
          .toISOString()
          .split("T")[0];
        const inTimeframe = reviewDate >= startDate && reviewDate <= endDate;
        const hasTopic = review.topics.some((topic) => topic.id === topicId);
        return inTimeframe && hasTopic;
      });

      if (filteredReviews.length === 0) return 0;

      const sum = filteredReviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      return sum / filteredReviews.length;
    },
    [enrichedReviews, startDate, endDate]
  );

  // Count reviews for a specific keyword within selected timespan
  const countKeywordReviews = useCallback(
    (keywordId: string): number => {
      const filteredReviews = enrichedReviews.filter((review) => {
        const reviewDate = new Date(review.published_at)
          .toISOString()
          .split("T")[0];
        const inTimeframe = reviewDate >= startDate && reviewDate <= endDate;
        const hasKeyword = review.keywords.some((kw) => kw.id === keywordId);
        return inTimeframe && hasKeyword;
      });
      return filteredReviews.length;
    },
    [enrichedReviews, startDate, endDate]
  );

  // Count reviews for a specific topic within selected timespan
  const countTopicReviews = useCallback(
    (topicId: string): number => {
      const filteredReviews = enrichedReviews.filter((review) => {
        const reviewDate = new Date(review.published_at)
          .toISOString()
          .split("T")[0];
        const inTimeframe = reviewDate >= startDate && reviewDate <= endDate;
        const hasTopic = review.topics.some((topic) => topic.id === topicId);
        return inTimeframe && hasTopic;
      });
      return filteredReviews.length;
    },
    [enrichedReviews, startDate, endDate]
  );

  // Compute status details for each objective
  const objectiveStatusDetails = useMemo(() => {
    return objectives.map((objective) => {
      const currentRating = objective.target_rating
        ? computeCurrentRating()
        : undefined;

      const keywordTargets =
        objective.targets
          ?.filter((target) => target.target_type === "keyword")
          .map((target) => {
            const currentRating = computeKeywordRating(target.target_id);
            const reviewCount = countKeywordReviews(target.target_id);
            const progressPercentage =
              target.target_rating > 0
                ? Math.min((currentRating / target.target_rating) * 100, 100)
                : 0;

            return {
              id: target.id,
              keyword_id: target.target_id,
              keyword_text: target.keyword?.text || "",
              target_rating: target.target_rating,
              current_rating: currentRating,
              progress_percentage: progressPercentage,
              review_count: reviewCount,
            };
          })
          .filter((target) => target.review_count > 0) || [];

      const topicTargets =
        objective.targets
          ?.filter((target) => target.target_type === "topic")
          .map((target) => {
            const currentRating = computeTopicRating(target.target_id);
            const reviewCount = countTopicReviews(target.target_id);
            const progressPercentage =
              target.target_rating > 0
                ? Math.min((currentRating / target.target_rating) * 100, 100)
                : 0;

            return {
              id: target.id,
              topic_id: target.target_id,
              topic_name: target.topic?.name || "",
              target_rating: target.target_rating,
              current_rating: currentRating,
              progress_percentage: progressPercentage,
              review_count: reviewCount,
            };
          })
          .filter((target) => target.review_count > 0) || [];

      // Calculate overall progress using client-side calculation
      // This includes all targets (rating, sentiment, keywords, topics)
      const overallProgress = objectivesService.calculateProgressClientSide(
        objective,
        enrichedReviews,
        year,
        timespan
      );

      // Determine status indicator
      let statusIndicator: "on_track" | "close" | "off_track" | "far";
      if (
        overallProgress >= 90 ||
        (currentRating !== undefined &&
          objective.target_rating &&
          currentRating >= objective.target_rating)
      ) {
        statusIndicator = "on_track";
      } else if (overallProgress >= 70) {
        statusIndicator = "close";
      } else if (overallProgress >= 50) {
        statusIndicator = "off_track";
      } else {
        statusIndicator = "far";
      }

      return {
        objective,
        currentRating,
        keywordTargets,
        topicTargets,
        overallProgress,
        statusIndicator,
      };
    });
  }, [
    objectives,
    enrichedReviews,
    year,
    timespan,
    objectivesService,
    computeCurrentRating,
    computeKeywordRating,
    computeTopicRating,
    countKeywordReviews,
    countTopicReviews,
  ]);

  if (loading) {
    return (
      <Card sx={{ borderRadius: "18px", boxShadow: 2 }}>
        <CardContent>
          <Stack spacing={3}>
            <Skeleton variant="text" width="40%" height={32} />
            <Stack spacing={2}>
              <Skeleton variant="text" width="100%" height={24} />
              <Skeleton variant="text" width="80%" height={24} />
              <Skeleton variant="text" width="90%" height={24} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (objectives.length === 0) {
    return null;
  }

  if (enrichedReviews.length === 0) {
    return (
      <Card sx={{ borderRadius: "18px", boxShadow: 2 }}>
        <CardContent>
          <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
            <NoReviewsIllustration sx={{ opacity: 0.6, mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              {t("objectives.objectiveDetails", "Objective Details")}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              {t(
                "objectives.noReviewsForObjective",
                "No reviews found for this objective's time period"
              )}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Show expanded details for all objectives (should only be one when selected)
  return (
    <Card
      sx={{
        borderRadius: "18px",
        boxShadow: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background element */}
      <Box
        sx={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          bgcolor: "primary.main",
          opacity: 0.05,
          zIndex: 0,
        }}
      />
      <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
        <Stack spacing={2}>
          {objectiveStatusDetails.map((detail) => (
            <Box key={detail.objective.id}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 24,
                    bgcolor: "primary.main",
                    borderRadius: 2,
                  }}
                />
                <Typography variant="h6" fontWeight={600}>
                  {detail.objective.name}
                </Typography>
              </Stack>
              {detail.objective.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {detail.objective.description}
                </Typography>
              )}

              {/* Objective Score */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "grey.300",
                  mb: 2,
                }}
              >
                <Stack spacing={1} alignItems="center">
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t("objectives.objectiveScore", "Objective Score")}:
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color="primary.main"
                    >
                      {detail.overallProgress.toFixed(0)}%
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimespanDisplay(year, timespan)}
                  </Typography>
                </Stack>
              </Box>

              <Stack spacing={2}>
                {/* Overall Rating */}
                {detail.objective.target_rating &&
                  detail.currentRating !== undefined && (
                    <Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                        sx={{ mb: 1 }}
                      >
                        <Box
                          sx={{
                            width: 3,
                            height: 16,
                            bgcolor: "primary.main",
                            borderRadius: 1.5,
                            opacity: 0.6,
                          }}
                        />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {t("objectives.overallRating", "Overall Rating")}
                        </Typography>
                      </Stack>
                      <ObjectiveStatusIndicator
                        target={detail.objective.target_rating}
                        current={detail.currentRating}
                        label={t("objectives.overallRating", "Overall Rating")}
                        type="rating"
                      />
                    </Box>
                  )}

                {/* Keyword Targets */}
                {detail.keywordTargets.length > 0 && (
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <Box
                        sx={{
                          width: 3,
                          height: 16,
                          bgcolor: "secondary.main",
                          borderRadius: 1.5,
                          opacity: 0.6,
                        }}
                      />
                      <Typography variant="subtitle2" fontWeight={600}>
                        {t("objectives.keywords", "Keywords")}
                      </Typography>
                    </Stack>
                    <Grid container spacing={2}>
                      {detail.keywordTargets.map((keywordTarget) => (
                        <Grid
                          size={{ xs: 12, sm: 6, md: 4 }}
                          key={keywordTarget.id}
                        >
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderRadius: "12px",
                              borderColor: "grey.300",
                              borderWidth: 1,
                              borderStyle: "solid",
                              bgcolor: "background.paper",
                              height: "100%",
                              minHeight: 140,
                            }}
                          >
                            <Stack spacing={1} sx={{ height: "100%" }}>
                              <ObjectiveStatusIndicator
                                target={keywordTarget.target_rating}
                                current={keywordTarget.current_rating}
                                label={keywordTarget.keyword_text}
                                type="keyword"
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: -0.5 }}
                              >
                                {t(
                                  "objectives.reviewCount",
                                  "{{count}} reviews",
                                  {
                                    count: keywordTarget.review_count,
                                  }
                                )}
                              </Typography>
                            </Stack>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Topic Targets */}
                {detail.topicTargets.length > 0 && (
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <Box
                        sx={{
                          width: 3,
                          height: 16,
                          bgcolor: "warning.main",
                          borderRadius: 1.5,
                          opacity: 0.6,
                        }}
                      />
                      <Typography variant="subtitle2" fontWeight={600}>
                        {t("objectives.topics", "Topics")}
                      </Typography>
                    </Stack>
                    <Grid container spacing={2}>
                      {detail.topicTargets.map((topicTarget) => (
                        <Grid
                          size={{ xs: 12, sm: 6, md: 4 }}
                          key={topicTarget.id}
                        >
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderRadius: "12px",
                              borderColor: "grey.300",
                              borderWidth: 1,
                              borderStyle: "solid",
                              bgcolor: "background.paper",
                              height: "100%",
                              minHeight: 140,
                            }}
                          >
                            <Stack spacing={1} sx={{ height: "100%" }}>
                              <ObjectiveStatusIndicator
                                target={topicTarget.target_rating}
                                current={topicTarget.current_rating}
                                label={topicTarget.topic_name}
                                type="topic"
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: -0.5 }}
                              >
                                {t(
                                  "objectives.reviewCount",
                                  "{{count}} reviews",
                                  {
                                    count: topicTarget.review_count,
                                  }
                                )}
                              </Typography>
                            </Stack>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Action Plan Section */}
                {detail.objective.status === "failed" && (
                  <Box sx={{ mt: 3 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 2 }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 3,
                            height: 16,
                            bgcolor: "error.main",
                            borderRadius: 1.5,
                            opacity: 0.6,
                          }}
                        />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {t("objectives.actionPlan.title", "Action Plan")}
                        </Typography>
                      </Stack>
                      {!actionPlans[detail.objective.id] && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<LightbulbIcon />}
                          onClick={() =>
                            handleGenerateActionPlan(detail.objective)
                          }
                          sx={{
                            borderRadius: "980px",
                            textTransform: "none",
                          }}
                        >
                          {t("objectives.actionPlan.generate", "Generate Plan")}
                        </Button>
                      )}
                    </Stack>

                    {loadingActionPlans ? (
                      <Stack spacing={1}>
                        <Skeleton variant="text" width="100%" height={24} />
                        <Skeleton variant="text" width="90%" height={24} />
                        <Skeleton variant="text" width="95%" height={24} />
                      </Stack>
                    ) : actionPlans[detail.objective.id] ? (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: "12px",
                          borderColor: "grey.300",
                          bgcolor: "grey.50",
                        }}
                      >
                        <Box
                          sx={{
                            "& h2, & h3": {
                              mt: 2,
                              mb: 1,
                              fontSize: "1.1em",
                              fontWeight: 600,
                              color: "primary.main",
                            },
                            "& h2:first-of-type, & h3:first-of-type": {
                              mt: 0,
                            },
                            "& h4": {
                              mt: 1.5,
                              mb: 0.5,
                              fontSize: "1em",
                              fontWeight: 600,
                            },
                            "& strong": {
                              fontWeight: 600,
                            },
                            "& ul, & ol": {
                              pl: 2.5,
                              mb: 1,
                            },
                            "& li": {
                              mb: 0.5,
                            },
                            "& p": {
                              mb: 1,
                            },
                          }}
                          dangerouslySetInnerHTML={{
                            __html: formatMarkdown(
                              actionPlans[detail.objective.id]!.plan
                            ),
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 2, display: "block" }}
                        >
                          {t("objectives.actionPlan.generatedAt", "Generated")}:{" "}
                          {new Date(
                            actionPlans[detail.objective.id]!.created_at
                          ).toLocaleDateString()}
                        </Typography>
                      </Paper>
                    ) : (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: "12px",
                          borderColor: "grey.300",
                          bgcolor: "grey.50",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {t(
                            "objectives.actionPlan.noPlan",
                            "No action plan generated yet. Click the button above to generate one."
                          )}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>

      {/* Action Plan Generation Modal */}
      {selectedObjectiveForPlan && (
        <ObjectiveActionPlanModal
          open={actionPlanModalOpen}
          onClose={() => {
            setActionPlanModalOpen(false);
            setSelectedObjectiveForPlan(null);
          }}
          objective={selectedObjectiveForPlan}
          enrichedReviews={enrichedReviews}
          year={year}
          timespan={timespan}
          onPlanGenerated={handleActionPlanGenerated}
        />
      )}
    </Card>
  );
};

// Simple markdown to HTML converter
function formatMarkdown(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h4>$1</h4>");
  html = html.replace(/^## (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^# (.*$)/gim, "<h2>$1</h2>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");

  // Lists
  html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
  html = html.replace(/^- (.*$)/gim, "<li>$1</li>");
  html = html.replace(/^\d+\. (.*$)/gim, "<li>$1</li>");

  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li>.*<\/li>\n?)+/gim, (match) => `<ul>${match}</ul>`);

  // Paragraphs (lines that aren't already wrapped)
  html = html
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (
        !trimmed ||
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<li") ||
        trimmed.startsWith("</ul")
      ) {
        return line;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  return html;
}
