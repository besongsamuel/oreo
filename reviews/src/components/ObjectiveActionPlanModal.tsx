import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Skeleton,
  Box,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSupabase } from "../hooks/useSupabase";
import {
  Objective,
  ObjectivesService,
} from "../services/objectivesService";
import { EnrichedReview } from "../services/objectivesService";
import { Timespan, getFailedReviewIds } from "../utils/objectivesUtils";

interface ObjectiveActionPlanModalProps {
  open: boolean;
  onClose: () => void;
  objective: Objective;
  enrichedReviews: EnrichedReview[];
  year: number;
  timespan: Timespan;
  onPlanGenerated?: () => void;
}

export const ObjectiveActionPlanModal = ({
  open,
  onClose,
  objective,
  enrichedReviews,
  year,
  timespan,
  onPlanGenerated,
}: ObjectiveActionPlanModalProps) => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const objectivesService = new ObjectivesService(supabase);

      // Get failed review IDs
      const failedReviewIds = getFailedReviewIds(
        objective,
        enrichedReviews,
        year,
        timespan
      );

      // Check if there are any failed reviews
      const totalFailedReviews =
        failedReviewIds.rating_review_ids.length +
        failedReviewIds.sentiment_review_ids.length +
        Object.values(failedReviewIds.keyword_review_ids).flat().length +
        Object.values(failedReviewIds.topic_review_ids).flat().length;

      if (totalFailedReviews === 0) {
        setError(
          t(
            "objectives.actionPlan.noFailedReviews",
            "No failed reviews found for this objective. Cannot generate action plan."
          )
        );
        setGenerating(false);
        return;
      }

      // Generate action plan
      await objectivesService.generateObjectiveActionPlan(
        objective.id,
        year,
        timespan,
        failedReviewIds
      );

      // Call callback to refresh
      if (onPlanGenerated) {
        onPlanGenerated();
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error("Error generating action plan:", err);
      setError(
        err instanceof Error
          ? err.message
          : t(
              "objectives.actionPlan.generationError",
              "Failed to generate action plan"
            )
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    if (!generating) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "18px",
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight={600}>
          {t("objectives.actionPlan.generateTitle", "Generate Action Plan")}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: "12px" }}>
              {error}
            </Alert>
          )}

          {generating ? (
            <Stack spacing={2} sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t(
                  "objectives.actionPlan.generating",
                  "Generating action plan based on failed reviews..."
                )}
              </Typography>
              <Stack spacing={1}>
                <Skeleton variant="text" width="100%" height={24} />
                <Skeleton variant="text" width="90%" height={24} />
                <Skeleton variant="text" width="95%" height={24} />
                <Skeleton variant="text" width="85%" height={24} />
              </Stack>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {t(
                    "objectives.actionPlan.generatingNote",
                    "This may take a few moments..."
                  )}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {t(
                  "objectives.actionPlan.description",
                  "Generate an AI-powered action plan based on reviews that did not meet the objective targets. The plan will provide 1-3 actionable recommendations."
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(
                  "objectives.actionPlan.confirmation",
                  "This will analyze failed reviews and create a plan for:"
                )}
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "grey.300",
                }}
              >
                <Typography variant="body2" fontWeight={500}>
                  {objective.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("objectives.year", "Year")}: {year} |{" "}
                  {t("objectives.timespan", "Timespan")}: {timespan.toUpperCase()}
                </Typography>
              </Box>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1.5,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={generating}
          sx={{
            borderRadius: "980px",
            px: 3,
            textTransform: "none",
          }}
        >
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={generating}
          sx={{
            borderRadius: "980px",
            px: 3,
            textTransform: "none",
          }}
        >
          {generating
            ? t("objectives.actionPlan.generating", "Generating...")
            : t("objectives.actionPlan.generate", "Generate Plan")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

