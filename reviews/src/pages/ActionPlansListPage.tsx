import {
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  PlayCircle as PlayCircleIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyActionPlanIllustration } from "../components/illustrations/ActionPlanIllustrations";
import { ActionPlanCardSkeleton } from "../components/SkeletonLoaders";
import { useActionPlans } from "../hooks/useActionPlans";
import { ActionPlan } from "../services/actionPlansService";

type SourceTypeFilter = "all" | "objective" | "sentiment";
type StatusFilter = "all" | "new" | "in_progress" | "completed";

export const ActionPlansListPage = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [sourceTypeFilter, setSourceTypeFilter] =
    useState<SourceTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<ActionPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const {
    actionPlans,
    loading,
    deleteActionPlan,
  } = useActionPlans(companyId, filters);

  const handleDeleteClick = (plan: ActionPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    setDeleting(true);
    try {
      await deleteActionPlan(planToDelete.id);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    } catch (error) {
      console.error("Error deleting action plan:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPlanToDelete(null);
  };

  const handleCardClick = (planId: string) => {
    navigate(`/companies/${companyId}/action_plans/${planId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon sx={{ color: "success.main", fontSize: 16 }} />;
      case "in_progress":
        return <PlayCircleIcon sx={{ color: "warning.main", fontSize: 16 }} />;
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/companies/${companyId}`)}
            sx={{ alignSelf: "flex-start" }}
          >
            {t("actionPlansListPage.backToCompany", "Back to Company")}
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              {t("actionPlansListPage.title", "Action Plans")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("actionPlansListPage.subtitle", "View and manage all your action plans")}
            </Typography>
          </Box>
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <ActionPlanCardSkeleton key={i} />
            ))}
          </Stack>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/companies/${companyId}`)}
          sx={{
            alignSelf: "flex-start",
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          {t("actionPlansListPage.backToCompany", "Back to Company")}
        </Button>

        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            {t("actionPlansListPage.title", "Action Plans")}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t("actionPlansListPage.subtitle", "View and manage all your action plans")}
          </Typography>
        </Box>

        {/* Filters */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: "18px" }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterListIcon sx={{ color: "text.secondary" }} />
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                {t("actionPlans.filter.title", "Filters")}
              </Typography>
            </Stack>
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={2}
              alignItems={isMobile ? "flex-start" : "center"}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                  {t("actionPlans.filter.sourceType", "Source Type")}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  <Chip
                    label={t("actionPlans.filter.allSources", "All Sources")}
                    onClick={() => setSourceTypeFilter("all")}
                    color={sourceTypeFilter === "all" ? "primary" : "default"}
                    variant={sourceTypeFilter === "all" ? "filled" : "outlined"}
                    clickable
                    size="small"
                  />
                  <Chip
                    label={t("actionPlans.filter.objective", "Objective")}
                    onClick={() => setSourceTypeFilter("objective")}
                    color={sourceTypeFilter === "objective" ? "primary" : "default"}
                    variant={sourceTypeFilter === "objective" ? "filled" : "outlined"}
                    clickable
                    size="small"
                  />
                  <Chip
                    label={t("actionPlans.filter.sentiment", "Sentiment")}
                    onClick={() => setSourceTypeFilter("sentiment")}
                    color={sourceTypeFilter === "sentiment" ? "primary" : "default"}
                    variant={sourceTypeFilter === "sentiment" ? "filled" : "outlined"}
                    clickable
                    size="small"
                  />
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                  {t("actionPlans.filter.status", "Status")}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  <Chip
                    label={t("actionPlans.filter.allStatuses", "All Statuses")}
                    onClick={() => setStatusFilter("all")}
                    color={statusFilter === "all" ? "primary" : "default"}
                    variant={statusFilter === "all" ? "filled" : "outlined"}
                    clickable
                    size="small"
                  />
                  <Chip
                    label={t("actionPlans.status.new", "New")}
                    onClick={() => setStatusFilter("new")}
                    color={statusFilter === "new" ? "primary" : "default"}
                    variant={statusFilter === "new" ? "filled" : "outlined"}
                    clickable
                    size="small"
                  />
                  <Chip
                    label={t("actionPlans.status.inProgress", "In Progress")}
                    onClick={() => setStatusFilter("in_progress")}
                    color={statusFilter === "in_progress" ? "warning" : "default"}
                    variant={statusFilter === "in_progress" ? "filled" : "outlined"}
                    clickable
                    size="small"
                  />
                  <Chip
                    label={t("actionPlans.status.completed", "Completed")}
                    onClick={() => setStatusFilter("completed")}
                    color={statusFilter === "completed" ? "success" : "default"}
                    variant={statusFilter === "completed" ? "filled" : "outlined"}
                    clickable
                    size="small"
                  />
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {/* Action Plans List */}
        {actionPlans.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: "18px",
              borderColor: "grey.300",
            }}
          >
            <EmptyActionPlanIllustration sx={{ mb: 3, color: "text.disabled" }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t("actionPlansListPage.noPlans", "No action plans found")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(
                "actionPlansListPage.noPlansDescription",
                "Action plans will appear here once generated from objectives or sentiment analysis."
              )}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {actionPlans.map((plan) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan.id}>
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
                    handleCardClick(plan.id);
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
                            handleDeleteClick(plan);
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

                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        gap={1}
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
                      </Stack>

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
              </Grid>
            ))}
          </Grid>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {t("actionPlansListPage.deleteConfirmTitle", "Delete Action Plan")}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {t(
                "actionPlansListPage.deleteConfirmMessage",
                "Are you sure you want to delete this action plan? This action cannot be undone."
              )}
            </Typography>
            {planToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: "8px" }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {planToDelete.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {planToDelete.description}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} disabled={deleting}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              disabled={deleting}
            >
              {deleting
                ? t("actionPlansListPage.deleting", "Deleting...")
                : t("common.delete", "Delete")}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
};

