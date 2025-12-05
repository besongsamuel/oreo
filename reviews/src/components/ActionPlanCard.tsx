import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Delete as DeleteIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { ActionPlan } from "../services/actionPlansService";

interface ActionPlanCardProps {
  plan: ActionPlan;
  onCardClick: (planId: string) => void;
  onDeleteClick: (plan: ActionPlan) => void;
}

export const ActionPlanCard = ({
  plan,
  onCardClick,
  onDeleteClick,
}: ActionPlanCardProps) => {
  const { t } = useTranslation();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon sx={{ color: "success.main", fontSize: 16 }} />;
      case "in_progress":
        return <HourglassEmptyIcon sx={{ color: "warning.main", fontSize: 16 }} />;
      default:
        return <CircleIcon sx={{ color: "text.disabled", fontSize: 16 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      default:
        return "default";
    }
  };

  const calculateProgress = (): number => {
    if (!plan.total_items || plan.total_items === 0) return 0;
    return Math.round(((plan.completed_items || 0) / plan.total_items) * 100);
  };

  const getProgressColor = (percentage: number): "success" | "warning" | "error" => {
    if (percentage >= 80) return "success";
    if (percentage >= 50) return "warning";
    return "error";
  };

  const getMetadataTags = () => {
    const tags: string[] = [];
    const metadata = plan.metadata || {};

    if (plan.source_type === "objective") {
      if (metadata.year) {
        tags.push(`${metadata.year}`);
      }
      if (metadata.timespan) {
        const timespanMap: Record<string, string> = {
          q1: "Q1",
          q2: "Q2",
          q3: "Q3",
          q4: "Q4",
          all: t("objectives.allYear", "All Year"),
        };
        tags.push(timespanMap[metadata.timespan] || metadata.timespan.toUpperCase());
      }
    } else if (plan.source_type === "sentiment") {
      if (metadata.filterStartDate && metadata.filterEndDate) {
        const startDate = new Date(metadata.filterStartDate);
        const endDate = new Date(metadata.filterEndDate);
        const formatDate = (date: Date) =>
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        tags.push(`${formatDate(startDate)} - ${formatDate(endDate)}`);
      }
    }

    return tags;
  };

  const metadataTags = getMetadataTags();
  const progress = calculateProgress();

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "18px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
          transform: "translateY(-2px)",
        },
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={(e) => {
        // Don't navigate if clicking delete button
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        onCardClick(plan.id);
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="flex-start"
            justifyContent="space-between"
          >
            <AssignmentIcon
              sx={{
                color: "primary.main",
                fontSize: 32,
                mt: 0.5,
              }}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(plan);
              }}
              sx={{
                color: "error.main",
                "&:hover": {
                  backgroundColor: "error.light",
                  color: "error.dark",
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {plan.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                mb: 2,
              }}
            >
              {plan.description}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip
              label={t(
                `actionPlans.sourceType.${plan.source_type}`,
                plan.source_type
              )}
              size="small"
              variant="outlined"
            />
            <Chip
              label={t(`actionPlans.status.${plan.status}`, plan.status)}
              size="small"
              color={getStatusColor(plan.status) as any}
              icon={getStatusIcon(plan.status)}
            />
            {metadataTags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "primary.main",
                  color: "primary.main",
                }}
              />
            ))}
          </Stack>

          {/* Progress Indicator */}
          {plan.total_items !== undefined && plan.total_items > 0 && (
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 0.5 }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={500}
                >
                  {t("actionPlansListPage.progress", "Progress")}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color={`${getProgressColor(progress)}.main`}
                >
                  {progress}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                color={getProgressColor(progress)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "grey.200",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                {plan.completed_items || 0} / {plan.total_items}{" "}
                {t("actionPlansListPage.itemsCompleted", "items completed")}
              </Typography>
            </Box>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: "auto" }}
          >
            {new Date(plan.created_at).toLocaleDateString()}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

