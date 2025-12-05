import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  FilterList as FilterListIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useActionPlans } from "../hooks/useActionPlans";
import { ContentSkeleton } from "./SkeletonLoaders";

interface ActionPlansCardProps {
  companyId: string;
}

type SourceTypeFilter = "all" | "objective" | "sentiment";
type StatusFilter = "all" | "new" | "in_progress" | "completed";

export const ActionPlansCard = ({ companyId }: ActionPlansCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [sourceTypeFilter, setSourceTypeFilter] =
    useState<SourceTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filters = useMemo(() => {
    const f: {
      source_type?: "objective" | "sentiment";
      status?: "new" | "in_progress" | "completed";
    } = {};
    if (sourceTypeFilter !== "all") {
      f.source_type = sourceTypeFilter;
    }
    if (statusFilter !== "all") {
      f.status = statusFilter;
    }
    return f;
  }, [sourceTypeFilter, statusFilter]);

  const { actionPlans, loading } = useActionPlans(companyId, filters);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon sx={{ color: "success.main" }} />;
      case "in_progress":
        return <HourglassEmptyIcon sx={{ color: "warning.main" }} />;
      default:
        return <CircleIcon sx={{ color: "text.disabled" }} />;
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

  if (loading) {
    return (
      <Stack spacing={3}>
        <Typography variant="h5" fontWeight={600}>
          {t("actionPlans.title", "Action Plans")}
        </Typography>
        <ContentSkeleton />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 1 }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {t("actionPlans.title", "Action Plans")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(
                "actionPlans.subtitle",
                "View and manage your action plans to improve your business"
              )}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate(`/companies/${companyId}/action_plans`)}
            sx={{
              alignSelf: "flex-start",
              textTransform: "none",
            }}
          >
            {t("actionPlans.viewAll", "View All")}
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: "12px" }}>
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          alignItems={isMobile ? "stretch" : "center"}
        >
          <FilterListIcon sx={{ color: "text.secondary" }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>
              {t("actionPlans.filter.sourceType", "Source Type")}
            </InputLabel>
            <Select
              value={sourceTypeFilter}
              label={t("actionPlans.filter.sourceType", "Source Type")}
              onChange={(e) =>
                setSourceTypeFilter(e.target.value as SourceTypeFilter)
              }
            >
              <MenuItem value="all">
                {t("actionPlans.filter.allSources", "All Sources")}
              </MenuItem>
              <MenuItem value="objective">
                {t("actionPlans.filter.objective", "Objective")}
              </MenuItem>
              <MenuItem value="sentiment">
                {t("actionPlans.filter.sentiment", "Sentiment")}
              </MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("actionPlans.filter.status", "Status")}</InputLabel>
            <Select
              value={statusFilter}
              label={t("actionPlans.filter.status", "Status")}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <MenuItem value="all">
                {t("actionPlans.filter.allStatuses", "All Statuses")}
              </MenuItem>
              <MenuItem value="new">
                {t("actionPlans.status.new", "New")}
              </MenuItem>
              <MenuItem value="in_progress">
                {t("actionPlans.status.inProgress", "In Progress")}
              </MenuItem>
              <MenuItem value="completed">
                {t("actionPlans.status.completed", "Completed")}
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Action Plans List */}
      {actionPlans.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: "12px",
            borderColor: "grey.300",
          }}
        >
          <AssignmentIcon
            sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t("actionPlans.noPlans", "No action plans found")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(
              "actionPlans.noPlansDescription",
              "Action plans will appear here once generated from objectives or sentiment analysis."
            )}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {actionPlans.map((plan) => (
            <Card
              key={plan.id}
              variant="outlined"
              sx={{ borderRadius: "18px" }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                  sx={{ width: "100%" }}
                >
                  <AssignmentIcon
                    sx={{ color: "primary.main", mt: 0.5, flexShrink: 0 }}
                  />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="flex-start"
                      justifyContent="space-between"
                    >
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {plan.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {plan.description}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ mt: 1 }}
                          flexWrap="wrap"
                          gap={1}
                          alignItems="center"
                        >
                          <Chip
                            label={t(
                              `actionPlans.sourceType.${plan.source_type}`,
                              plan.source_type
                            )}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={t(
                              `actionPlans.status.${plan.status}`,
                              plan.status
                            )}
                            size="small"
                            color={getStatusColor(plan.status) as any}
                            icon={getStatusIcon(plan.status)}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(plan.created_at).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() =>
                          navigate(
                            `/companies/${companyId}/action_plans/${plan.id}`
                          )
                        }
                        sx={{
                          borderRadius: "980px",
                          textTransform: "none",
                          flexShrink: 0,
                          ml: 2,
                        }}
                      >
                        {t("actionPlans.viewDetails", "View Details")}
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
};
