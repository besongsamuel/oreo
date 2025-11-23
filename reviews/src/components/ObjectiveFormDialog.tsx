import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreateObjectiveInput, Objective } from "../services/objectivesService";
import { KeywordTopicSelector } from "./KeywordTopicSelector";

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

interface ObjectiveFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateObjectiveInput) => Promise<void>;
  objective?: Objective | null;
  companyId: string;
  enrichedReviews: EnrichedReview[];
}

const steps = ["general", "targets"];

export const ObjectiveFormDialog = ({
  open,
  onClose,
  onSubmit,
  objective,
  companyId,
  enrichedReviews,
}: ObjectiveFormDialogProps) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: General objective fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetRating, setTargetRating] = useState<number | undefined>(
    undefined
  );
  const [targetSentiment, setTargetSentiment] = useState<number | undefined>(
    undefined
  );
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  // Step 2: Keyword/Topic targets
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [keywordTargetRatings, setKeywordTargetRatings] = useState<
    Record<string, number>
  >({});
  const [topicTargetRatings, setTopicTargetRatings] = useState<
    Record<string, number>
  >({});

  // Initialize form when dialog opens or objective changes
  useEffect(() => {
    if (open) {
      if (objective) {
        // Edit mode
        setName(objective.name);
        setDescription(objective.description || "");
        setTargetRating(objective.target_rating);
        // Convert from -1 to 1 range to 1-100 range for display
        setTargetSentiment(
          objective.target_sentiment_score !== undefined
            ? objective.target_sentiment_score * 50 + 50
            : undefined
        );
        setPriority(objective.priority);

        // Load targets
        const keywordIds: string[] = [];
        const topicIds: string[] = [];
        const keywordRatings: Record<string, number> = {};
        const topicRatings: Record<string, number> = {};

        objective.targets?.forEach((target) => {
          if (target.target_type === "keyword") {
            keywordIds.push(target.target_id);
            keywordRatings[target.target_id] = target.target_rating;
          } else {
            topicIds.push(target.target_id);
            topicRatings[target.target_id] = target.target_rating;
          }
        });

        setSelectedKeywords(keywordIds);
        setSelectedTopics(topicIds);
        setKeywordTargetRatings(keywordRatings);
        setTopicTargetRatings(topicRatings);
      } else {
        // Create mode - reset form
        setName("");
        setDescription("");
        setTargetRating(undefined);
        setTargetSentiment(undefined);
        setPriority("medium");
        setSelectedKeywords([]);
        setSelectedTopics([]);
        setKeywordTargetRatings({});
        setTopicTargetRatings({});
      }
      setActiveStep(0);
      setError(null);
    }
  }, [open, objective]);

  const handleNext = () => {
    // Validate step 1
    if (activeStep === 0) {
      if (!name.trim()) {
        setError(t("objectives.errors.nameRequired", "Name is required"));
        return;
      }
      if (
        !targetRating &&
        !targetSentiment &&
        selectedKeywords.length === 0 &&
        selectedTopics.length === 0
      ) {
        setError(
          t(
            "objectives.errors.atLeastOneTarget",
            "Please set at least one target (rating, sentiment, keyword, or topic)"
          )
        );
        return;
      }
    }
    setError(null);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const targets = [
        ...selectedKeywords.map((keywordId) => ({
          target_type: "keyword" as const,
          target_id: keywordId,
          target_rating: keywordTargetRatings[keywordId] || 0,
        })),
        ...selectedTopics.map((topicId) => ({
          target_type: "topic" as const,
          target_id: topicId,
          target_rating: topicTargetRatings[topicId] || 0,
        })),
      ];

      // Convert target sentiment from 1-100 range to -1 to 1 range
      const targetSentimentScore =
        targetSentiment !== undefined ? (targetSentiment - 50) / 50 : undefined;

      const input: CreateObjectiveInput = {
        company_id: objective?.company_id || companyId,
        name: name.trim(),
        description: description.trim() || undefined,
        target_rating: targetRating,
        target_sentiment_score: targetSentimentScore,
        priority,
        targets: targets.length > 0 ? targets : undefined,
      };

      await onSubmit(input);
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          t("objectives.errors.saveFailed", "Failed to save objective")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {objective
            ? t("objectives.editObjective", "Edit Objective")
            : t("objectives.createObjective", "Create Objective")}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{t(`objectives.steps.${label}`, label)}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {activeStep === 0 && (
            <Stack spacing={3}>
              <TextField
                label={t("objectives.name", "Name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                placeholder={t(
                  "objectives.namePlaceholder",
                  "e.g., Achieve 4.6 stars"
                )}
              />

              <TextField
                label={t("objectives.description", "Description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder={t(
                  "objectives.descriptionPlaceholder",
                  "Optional description of the objective"
                )}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label={t("objectives.targetRating", "Target Rating")}
                  type="number"
                  value={targetRating || ""}
                  onChange={(e) =>
                    setTargetRating(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  fullWidth
                  inputProps={{ min: 0, max: 5, step: 0.1 }}
                  helperText={t(
                    "objectives.targetRatingHelper",
                    "Optional: Target average rating (0-5)"
                  )}
                />
                <TextField
                  label={t(
                    "objectives.targetSentiment",
                    "Target Sentiment Score"
                  )}
                  type="number"
                  value={targetSentiment || ""}
                  onChange={(e) =>
                    setTargetSentiment(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 1 }}
                  helperText={t(
                    "objectives.targetSentimentHelper",
                    "Optional: Target sentiment score (0-100, where 50 is neutral)"
                  )}
                />
              </Stack>

              <FormControl fullWidth>
                <InputLabel>{t("objectives.priority", "Priority")}</InputLabel>
                <Select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as "high" | "medium" | "low")
                  }
                  label={t("objectives.priority", "Priority")}
                >
                  <MenuItem value="high">
                    {t("objectives.priorityHigh", "High")}
                  </MenuItem>
                  <MenuItem value="medium">
                    {t("objectives.priorityMedium", "Medium")}
                  </MenuItem>
                  <MenuItem value="low">
                    {t("objectives.priorityLow", "Low")}
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}

          {activeStep === 1 && (
            <KeywordTopicSelector
              enrichedReviews={enrichedReviews}
              selectedKeywords={selectedKeywords}
              selectedTopics={selectedTopics}
              onKeywordsChange={setSelectedKeywords}
              onTopicsChange={setSelectedTopics}
              keywordTargetRatings={keywordTargetRatings}
              topicTargetRatings={topicTargetRatings}
              onKeywordRatingChange={(keywordId, rating) => {
                setKeywordTargetRatings((prev) => ({
                  ...prev,
                  [keywordId]: rating,
                }));
              }}
              onTopicRatingChange={(topicId, rating) => {
                setTopicTargetRatings((prev) => ({
                  ...prev,
                  [topicId]: rating,
                }));
              }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          {t("common.cancel", "Cancel")}
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            {t("common.back", "Back")}
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained" disabled={loading}>
            {t("common.next", "Next")}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: "980px", textTransform: "none" }}
          >
            {loading
              ? t("common.saving", "Saving...")
              : objective
              ? t("common.update", "Update")
              : t("common.create", "Create")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
