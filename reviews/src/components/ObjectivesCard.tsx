import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  PlayArrow as PlayIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEnrichedReviews } from "../hooks/useEnrichedReviews";
import { useSupabase } from "../hooks/useSupabase";
import {
  CreateObjectiveInput,
  Objective,
  ObjectivesService,
} from "../services/objectivesService";
import {
  Timespan,
  calculateObjectiveStatus,
  formatTimespanDisplay,
  getCurrentQuarter,
  getTimespanDates,
} from "../utils/objectivesUtils";
import { ObjectiveFormDialog } from "./ObjectiveFormDialog";
import { ObjectiveProgressChart } from "./ObjectiveProgressChart";

interface ObjectivesCardProps {
  objectives: Objective[];
  loading: boolean;
  companyId: string;
  onCreateObjective: (input: CreateObjectiveInput) => Promise<void>;
  onUpdateObjective: (
    objectiveId: string,
    input: CreateObjectiveInput
  ) => Promise<void>;
  onDeleteObjective: (objectiveId: string) => Promise<void>;
}

type PriorityFilter = "all" | "high" | "medium" | "low";
type StatusFilter =
  | "all"
  | "not_started"
  | "in_progress"
  | "achieved"
  | "overdue"
  | "failed";

export const ObjectivesCard = ({
  objectives,
  loading,
  companyId,
  onCreateObjective,
  onUpdateObjective,
  onDeleteObjective,
}: ObjectivesCardProps) => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Year and timespan selection (client-side only)
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [timespan, setTimespan] = useState<Timespan>(getCurrentQuarter());

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(
    null
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingObjectiveId, setDeletingObjectiveId] = useState<string | null>(
    null
  );

  // Calculate date range from year and timespan
  const { startDate, endDate } = useMemo(() => {
    return getTimespanDates(year, timespan);
  }, [year, timespan]);

  // Fetch enrichedReviews for all objectives with selected timespan
  const { enrichedReviews, loading: enrichedReviewsLoading } =
    useEnrichedReviews({
      companyId,
      startDate,
      endDate,
      enabled: true,
    });

  // Calculate progress and status for each objective client-side
  const objectivesWithProgress = useMemo(() => {
    const objectivesService = new ObjectivesService(supabase);
    return objectives.map((objective) => {
      const progress = objectivesService.calculateProgressClientSide(
        objective,
        enrichedReviews,
        year,
        timespan
      );
      // Calculate status based on progress and timespan completion
      const passScore = objective.pass_score ?? 100;
      const status = calculateObjectiveStatus(
        progress,
        year,
        timespan,
        passScore
      );
      return {
        ...objective,
        progress,
        status, // Override database status with calculated status
      };
    });
  }, [objectives, enrichedReviews, year, timespan, supabase]);

  // Get selected objective
  const selectedObjective = useMemo(() => {
    return (
      objectivesWithProgress.find((obj) => obj.id === selectedObjectiveId) ||
      null
    );
  }, [objectivesWithProgress, selectedObjectiveId]);

  const filteredObjectives = useMemo(() => {
    return objectivesWithProgress.filter((obj) => {
      if (priorityFilter !== "all" && obj.priority !== priorityFilter) {
        return false;
      }
      if (statusFilter !== "all" && obj.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [objectivesWithProgress, priorityFilter, statusFilter]);

  const timespanOptions = useMemo<Array<{ value: Timespan; label: string }>>(
    () => [
      { value: "q1", label: "Q1" },
      { value: "q2", label: "Q2" },
      { value: "q3", label: "Q3" },
      { value: "q4", label: "Q4" },
      {
        value: "all",
        label: t("objectives.allYear", "All Year"),
      },
    ],
    [t]
  );

  const priorityChipOptions = useMemo<
    Array<{ value: PriorityFilter; label: string }>
  >(
    () => [
      {
        value: "all",
        label: t("objectives.allPriorities", "All Priorities"),
      },
      { value: "high", label: t("objectives.priorityHigh", "High") },
      { value: "medium", label: t("objectives.priorityMedium", "Medium") },
      { value: "low", label: t("objectives.priorityLow", "Low") },
    ],
    [t]
  );

  const statusChipOptions = useMemo<
    Array<{ value: StatusFilter; label: string }>
  >(
    () => [
      { value: "all", label: t("objectives.allGoals", "All Goals") },
      {
        value: "in_progress",
        label: t("objectives.status.inProgress", "In Progress"),
      },
      {
        value: "not_started",
        label: t("objectives.status.notStarted", "Not Started"),
      },
      { value: "achieved", label: t("objectives.status.achieved", "Achieved") },
      { value: "overdue", label: t("objectives.status.overdue", "Overdue") },
      { value: "failed", label: t("objectives.status.failed", "Failed") },
    ],
    [t]
  );

  const handleCreateClick = () => {
    setEditingObjective(null);
    setEditDialogOpen(true);
  };

  const handleEditClick = (objective: Objective) => {
    setEditingObjective(objective);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (objectiveId: string) => {
    setDeletingObjectiveId(objectiveId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingObjectiveId) {
      await onDeleteObjective(deletingObjectiveId);
      setDeleteConfirmOpen(false);
      setDeletingObjectiveId(null);
    }
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
    setEditingObjective(null);
  };

  const handleDialogSubmit = async (input: CreateObjectiveInput) => {
    if (editingObjective) {
      await onUpdateObjective(editingObjective.id, input);
    } else {
      await onCreateObjective(input);
    }
    handleDialogClose();
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 67) return "success";
    if (progress >= 34) return "warning";
    return "error";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "achieved":
        return "success";
      case "in_progress":
        return "primary";
      case "overdue":
        return "error";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const desktopObjectivesTable = (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                {t("objectives.name", "Name")}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                {t("objectives.progress", "Progress")}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                {t("objectives.priority", "Priority")}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                {t("objectives.timespan", "Timespan")}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight={600}>
                {t("common.actions", "Actions")}
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredObjectives.map((objective) => (
            <TableRow
              key={objective.id}
              hover
              onClick={() => setSelectedObjectiveId(objective.id)}
              sx={{
                cursor: "pointer",
                bgcolor:
                  selectedObjectiveId === objective.id
                    ? "action.selected"
                    : "transparent",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  {objective.status === "in_progress" && (
                    <PlayIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  )}
                  {objective.status === "achieved" && (
                    <StarIcon sx={{ fontSize: 18, color: "success.main" }} />
                  )}
                  <Typography variant="body2" fontWeight={500}>
                    {objective.name}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Box sx={{ minWidth: 200 }}>
                  <Stack spacing={0.5}>
                    <LinearProgress
                      variant="determinate"
                      value={objective.progress || 0}
                      color={getProgressColor(objective.progress || 0)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: "grey.200",
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {objective.progress?.toFixed(0) || 0}%
                    </Typography>
                  </Stack>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={t(
                    `objectives.priority${
                      objective.priority.charAt(0).toUpperCase() +
                      objective.priority.slice(1)
                    }`,
                    objective.priority
                  )}
                  size="small"
                  color={getPriorityColor(objective.priority)}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatTimespanDisplay(year, timespan)}
                </Typography>
                <Chip
                  label={t(
                    `objectives.status.${objective.status}`,
                    objective.status
                  )}
                  size="small"
                  color={getStatusColor(objective.status)}
                  sx={{ mt: 0.5 }}
                />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(objective);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(objective.id);
                    }}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const mobileObjectivesList = (
    <Stack spacing={2}>
      {filteredObjectives.map((objective) => (
        <Card
          key={objective.id}
          variant="outlined"
          onClick={() => setSelectedObjectiveId(objective.id)}
          sx={{
            borderRadius: "16px",
            borderColor:
              selectedObjectiveId === objective.id ? "primary.main" : "divider",
          }}
        >
          <CardContent>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  {objective.status === "in_progress" && (
                    <PlayIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  )}
                  {objective.status === "achieved" && (
                    <StarIcon sx={{ fontSize: 18, color: "success.main" }} />
                  )}
                  <Typography variant="body1" fontWeight={600}>
                    {objective.name}
                  </Typography>
                </Stack>
                <Chip
                  label={t(
                    `objectives.status.${objective.status}`,
                    objective.status
                  )}
                  size="small"
                  color={getStatusColor(objective.status)}
                />
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {t("objectives.progress", "Progress")}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={objective.progress || 0}
                  color={getProgressColor(objective.progress || 0)}
                  sx={{ height: 8, borderRadius: 4, bgcolor: "grey.200" }}
                />
                <Typography variant="caption" color="text.secondary">
                  {objective.progress?.toFixed(0) || 0}%
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={t(
                    `objectives.priority${
                      objective.priority.charAt(0).toUpperCase() +
                      objective.priority.slice(1)
                    }`,
                    objective.priority
                  )}
                  size="small"
                  color={getPriorityColor(objective.priority)}
                />
                <Chip
                  label={formatTimespanDisplay(year, timespan)}
                  size="small"
                  variant="outlined"
                />
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(objective);
                  }}
                >
                  {t("common.edit", "Edit")}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(objective.id);
                  }}
                >
                  {t("common.delete", "Delete")}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  return (
    <Stack spacing={3}>
      {/* Header with Create Button */}
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        spacing={isMobile ? 2 : 0}
      >
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {t("objectives.title", "My Objectives")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(
              "objectives.subtitle",
              "Track your objectives and actions to improve daily customer experience"
            )}
          </Typography>
        </Box>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={handleCreateClick}
          sx={{ borderRadius: "980px", textTransform: "none" }}
        >
          {t("objectives.createObjective", "Create Objective")}
        </Button>
      </Stack>

      {/* Objective Selection */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: "18px",
          bgcolor: "background.paper",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle decorative background */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 4,
            height: "100%",
            bgcolor: "primary.main",
            opacity: 0.3,
          }}
        />
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          alignItems={isMobile ? "flex-start" : "center"}
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Typography variant="body1" fontWeight={500}>
            {t("objectives.selectObjective", "Select an Objective")}:
          </Typography>
          <FormControl
            size="small"
            sx={{
              minWidth: isMobile ? "100%" : 300,
              width: isMobile ? "100%" : undefined,
            }}
          >
            <Select
              value={selectedObjectiveId || ""}
              onChange={(e) => setSelectedObjectiveId(e.target.value || null)}
              displayEmpty
              sx={{ borderRadius: "12px" }}
            >
              <MenuItem value="">
                <em>{t("objectives.noneSelected", "None")}</em>
              </MenuItem>
              {objectives.map((objective) => (
                <MenuItem key={objective.id} value={objective.id}>
                  {objective.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Filters */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: "18px",
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={isMobile ? 2 : 3}>
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            alignItems={isMobile ? "flex-start" : "center"}
            flexWrap="wrap"
          >
            <FilterListIcon sx={{ color: "text.secondary" }} />
            <FormControl
              size="small"
              sx={{
                minWidth: 120,
                width: isMobile ? "100%" : "auto",
              }}
            >
              <InputLabel>{t("objectives.year", "Year")}</InputLabel>
              <Select
                value={year}
                onChange={(e) => setYear(e.target.value as number)}
                label={t("objectives.year", "Year")}
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map(
                  (y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Stack>

          <Stack spacing={2}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: "block" }}
              >
                {t("objectives.priority", "Priority")}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                {priorityChipOptions.map((option) => {
                  const selected = priorityFilter === option.value;
                  return (
                    <Chip
                      key={option.value}
                      label={option.label}
                      clickable
                      variant={selected ? "filled" : "outlined"}
                      color={selected ? "primary" : "default"}
                      onClick={() => setPriorityFilter(option.value)}
                      sx={{
                        borderRadius: "999px",
                        px: 1.5,
                        borderColor: selected ? "primary.main" : "grey.300",
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: "block" }}
              >
                {t("objectives.timespan", "Timespan")}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                {timespanOptions.map((option) => {
                  const selected = timespan === option.value;
                  return (
                    <Chip
                      key={option.value}
                      label={option.label}
                      clickable
                      variant={selected ? "filled" : "outlined"}
                      color={selected ? "primary" : "default"}
                      onClick={() => setTimespan(option.value)}
                      sx={{
                        borderRadius: "999px",
                        px: 1.5,
                        borderColor: selected ? "primary.main" : "grey.300",
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: "block" }}
              >
                {t("objectives.statusLabel", "Status")}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                {statusChipOptions.map((option) => {
                  const selected = statusFilter === option.value;
                  return (
                    <Chip
                      key={option.value}
                      label={option.label}
                      clickable
                      variant={selected ? "filled" : "outlined"}
                      color={selected ? "primary" : "default"}
                      onClick={() => setStatusFilter(option.value)}
                      sx={{
                        borderRadius: "999px",
                        px: 1.5,
                        borderColor: selected ? "primary.main" : "grey.300",
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* Objectives Table */}
      <Card variant="outlined" sx={{ borderRadius: "18px" }}>
        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : filteredObjectives.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                {t("objectives.noObjectivesFound", "No objectives found")}
              </Typography>
            </Box>
          ) : isMobile ? (
            mobileObjectivesList
          ) : (
            desktopObjectivesTable
          )}
        </CardContent>
      </Card>

      {/* Objective Details - Only show when objective is selected */}
      {selectedObjective && (
        <ObjectiveProgressChart
          objectives={[selectedObjective]}
          enrichedReviews={enrichedReviews}
          loading={enrichedReviewsLoading}
          year={year}
          timespan={timespan}
          companyId={companyId}
        />
      )}

      {/* Create/Edit Dialog */}
      <ObjectiveFormDialog
        open={editDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        objective={editingObjective}
        companyId={companyId}
        enrichedReviews={enrichedReviews}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <Card
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1300,
            p: 3,
            borderRadius: 2,
            boxShadow: 4,
            minWidth: 300,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6">
              {t("objectives.confirmDelete", "Confirm Delete")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(
                "objectives.deleteMessage",
                "Are you sure you want to delete this objective? This action cannot be undone."
              )}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeletingObjectiveId(null);
                }}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteConfirm}
              >
                {t("common.delete", "Delete")}
              </Button>
            </Stack>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};
