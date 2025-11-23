import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Objective } from "../services/objectivesService";
import { NoReviewsIllustration } from "./illustrations/ObjectiveIllustrations";
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
}

interface ObjectiveProgressChartProps {
  objectives: Objective[];
  enrichedReviews: EnrichedReview[];
  loading?: boolean;
}

export const ObjectiveProgressChart = ({
  objectives,
  enrichedReviews,
  loading = false,
}: ObjectiveProgressChartProps) => {
  const { t } = useTranslation();

  // Compute current rating for reviews within objective timeframe
  const computeCurrentRating = useCallback(
    (startDate: string, endDate: string): number => {
      const filteredReviews = enrichedReviews.filter((review) => {
        const reviewDate = new Date(review.published_at)
          .toISOString()
          .split("T")[0];
        return reviewDate >= startDate && reviewDate <= endDate;
      });

      if (filteredReviews.length === 0) return 0;

      const sum = filteredReviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      return sum / filteredReviews.length;
    },
    [enrichedReviews]
  );

  // Compute current rating for a specific keyword within objective timeframe
  const computeKeywordRating = useCallback(
    (keywordId: string, startDate: string, endDate: string): number => {
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
    [enrichedReviews]
  );

  // Compute current rating for a specific topic within objective timeframe
  const computeTopicRating = useCallback(
    (topicId: string, startDate: string, endDate: string): number => {
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
    [enrichedReviews]
  );

  // Compute status details for each objective
  const objectiveStatusDetails = useMemo(() => {
    return objectives.map((objective) => {
      const currentRating = objective.target_rating
        ? computeCurrentRating(objective.start_date, objective.end_date)
        : undefined;

      const keywordTargets =
        objective.targets
          ?.filter((target) => target.target_type === "keyword")
          .map((target) => {
            const currentRating = computeKeywordRating(
              target.target_id,
              objective.start_date,
              objective.end_date
            );
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
            };
          }) || [];

      const topicTargets =
        objective.targets
          ?.filter((target) => target.target_type === "topic")
          .map((target) => {
            const currentRating = computeTopicRating(
              target.target_id,
              objective.start_date,
              objective.end_date
            );
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
            };
          }) || [];

      // Calculate overall progress
      let overallProgress = objective.progress || 0;
      if (objective.target_rating && currentRating !== undefined) {
        overallProgress = Math.min(
          (currentRating / objective.target_rating) * 100,
          100
        );
      }

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
    computeCurrentRating,
    computeKeywordRating,
    computeTopicRating,
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
              <Stack spacing={2}>
                {/* Overall Rating */}
                {detail.objective.target_rating &&
                  detail.currentRating !== undefined && (
                    <Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
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
                      sx={{ mb: 1 }}
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
                    <Stack spacing={0.5}>
                      {detail.keywordTargets.map((keywordTarget) => (
                        <ObjectiveStatusIndicator
                          key={keywordTarget.id}
                          target={keywordTarget.target_rating}
                          current={keywordTarget.current_rating}
                          label={keywordTarget.keyword_text}
                          type="keyword"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Topic Targets */}
                {detail.topicTargets.length > 0 && (
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
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
                    <Stack spacing={0.5}>
                      {detail.topicTargets.map((topicTarget) => (
                        <ObjectiveStatusIndicator
                          key={topicTarget.id}
                          target={topicTarget.target_rating}
                          current={topicTarget.current_rating}
                          label={topicTarget.topic_name}
                          type="topic"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
