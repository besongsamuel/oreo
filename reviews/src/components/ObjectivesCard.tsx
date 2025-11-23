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
} from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEnrichedReviews } from "../hooks/useEnrichedReviews";
import { CreateObjectiveInput, Objective } from "../services/objectivesService";
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
type QuarterFilter = "all" | "Q1" | "Q2" | "Q3" | "Q4";
type StatusFilter =
  | "all"
  | "not_started"
  | "in_progress"
  | "achieved"
  | "overdue"
  | "failed";

const getQuarter = (date: Date): "Q1" | "Q2" | "Q3" | "Q4" => {
  const month = date.getMonth(); // 0-11
  if (month < 3) return "Q1";
  if (month < 6) return "Q2";
  if (month < 9) return "Q3";
  return "Q4";
};

const getQuarterFromDate = (dateString: string): "Q1" | "Q2" | "Q3" | "Q4" => {
  return getQuarter(new Date(dateString));
};

export const ObjectivesCard = ({
  objectives,
  loading,
  companyId,
  onCreateObjective,
  onUpdateObjective,
  onDeleteObjective,
}: ObjectivesCardProps) => {
  const { t } = useTranslation();
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [quarterFilter, setQuarterFilter] = useState<QuarterFilter>("all");
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

  // Get selected objective
  const selectedObjective = useMemo(() => {
    return objectives.find((obj) => obj.id === selectedObjectiveId) || null;
  }, [objectives, selectedObjectiveId]);

  // Fetch enrichedReviews for selected objective
  const { enrichedReviews, loading: enrichedReviewsLoading } =
    useEnrichedReviews({
      companyId,
      startDate: selectedObjective?.start_date,
      endDate: selectedObjective?.end_date,
      enabled: !!selectedObjective,
    });

  const filteredObjectives = useMemo(() => {
    return objectives.filter((obj) => {
      if (priorityFilter !== "all" && obj.priority !== priorityFilter) {
        return false;
      }
      if (quarterFilter !== "all") {
        const objQuarter = getQuarterFromDate(obj.end_date);
        if (objQuarter !== quarterFilter) {
          return false;
        }
      }
      if (statusFilter !== "all" && obj.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [objectives, priorityFilter, quarterFilter, statusFilter]);

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

  return (
    <Stack spacing={3}>
      {/* Header with Create Button */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
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
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body1" fontWeight={500}>
            {t("objectives.selectObjective", "Select an Objective")}:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 300 }}>
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
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FilterListIcon sx={{ color: "text.secondary" }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("objectives.priority", "Priority")}</InputLabel>
            <Select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as PriorityFilter)
              }
              label={t("objectives.priority", "Priority")}
            >
              <MenuItem value="all">
                {t("objectives.allPriorities", "All Priorities")}
              </MenuItem>
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

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t("objectives.quarter", "Quarter")}</InputLabel>
            <Select
              value={quarterFilter}
              onChange={(e) =>
                setQuarterFilter(e.target.value as QuarterFilter)
              }
              label={t("objectives.quarter", "Quarter")}
            >
              <MenuItem value="all">
                {t("objectives.allQuarters", "All")}
              </MenuItem>
              <MenuItem value="Q1">Q1</MenuItem>
              <MenuItem value="Q2">Q2</MenuItem>
              <MenuItem value="Q3">Q3</MenuItem>
              <MenuItem value="Q4">Q4</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("objectives.statusLabel", "Status")}</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              label={t("objectives.statusLabel", "Status")}
            >
              <MenuItem value="all">
                {t("objectives.allGoals", "All Goals")}
              </MenuItem>
              <MenuItem value="in_progress">
                {t("objectives.status.inProgress", "In Progress")}
              </MenuItem>
              <MenuItem value="not_started">
                {t("objectives.status.notStarted", "Not Started")}
              </MenuItem>
              <MenuItem value="achieved">
                {t("objectives.status.achieved", "Achieved")}
              </MenuItem>
              <MenuItem value="overdue">
                {t("objectives.status.overdue", "Overdue")}
              </MenuItem>
              <MenuItem value="failed">
                {t("objectives.status.failed", "Failed")}
              </MenuItem>
            </Select>
          </FormControl>
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
          ) : (
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
                        {t(
                          "objectives.targetCompletionDate",
                          "Target Completion Date"
                        )}
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
                            <PlayIcon
                              sx={{ fontSize: 18, color: "primary.main" }}
                            />
                          )}
                          {objective.status === "achieved" && (
                            <StarIcon
                              sx={{ fontSize: 18, color: "success.main" }}
                            />
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
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
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
                          {new Date(objective.end_date).toLocaleDateString()}
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
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
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
          )}
        </CardContent>
      </Card>

      {/* Objective Details - Only show when objective is selected */}
      {selectedObjective && (
        <ObjectiveProgressChart
          objectives={[selectedObjective]}
          enrichedReviews={enrichedReviews}
          loading={enrichedReviewsLoading}
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
        startDate={selectedObjective?.start_date}
        endDate={selectedObjective?.end_date}
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
