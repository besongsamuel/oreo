import {
  ArrowBack as ArrowBackIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ActionPlanCard } from "../components/ActionPlanCard";
import { ActionPlanStatsDashboard } from "../components/ActionPlanStatsDashboard";
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
  const [searchQuery, setSearchQuery] = useState("");
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

  const { actionPlans, loading, deleteActionPlan } = useActionPlans(
    companyId,
    filters
  );

  // Filter action plans by search query
  const filteredActionPlans = useMemo(() => {
    if (!searchQuery.trim()) {
      return actionPlans;
    }
    const query = searchQuery.toLowerCase().trim();
    return actionPlans.filter(
      (plan) =>
        plan.name.toLowerCase().includes(query) ||
        plan.description.toLowerCase().includes(query)
    );
  }, [actionPlans, searchQuery]);

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

  if (loading) {
    return (
      <Container
        maxWidth="xl"
        sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
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
              {t(
                "actionPlansListPage.subtitle",
                "View and manage all your action plans"
              )}
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
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
    >
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
            {t(
              "actionPlansListPage.subtitle",
              "View and manage all your action plans"
            )}
          </Typography>
        </Box>

        {/* Statistics Dashboard */}
        <ActionPlanStatsDashboard actionPlans={actionPlans} loading={loading} />

        {/* Search and Filters */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: "18px" }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterListIcon sx={{ color: "text.secondary" }} />
              <Typography
                variant="body2"
                fontWeight={600}
                color="text.secondary"
              >
                {t("actionPlans.filter.title", "Filters")}
              </Typography>
            </Stack>
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={2}
              alignItems={isMobile ? "flex-start" : "center"}
            >
              <TextField
                fullWidth={isMobile}
                size="small"
                placeholder={t("common.search", "Search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: isMobile ? "100%" : 250,
                }}
              />
              <FormControl
                size="small"
                sx={{ minWidth: isMobile ? "100%" : 180 }}
              >
                <Select
                  value={sourceTypeFilter}
                  onChange={(e) =>
                    setSourceTypeFilter(e.target.value as SourceTypeFilter)
                  }
                  displayEmpty
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
              <FormControl
                size="small"
                sx={{ minWidth: isMobile ? "100%" : 180 }}
              >
                <Select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  displayEmpty
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
          </Stack>
        </Paper>

        {/* Action Plans List */}
        {filteredActionPlans.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: "18px",
              borderColor: "grey.300",
            }}
          >
            <EmptyActionPlanIllustration
              sx={{ mb: 3, color: "text.disabled" }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchQuery.trim()
                ? t(
                    "actionPlansListPage.noPlansMatch",
                    "No action plans match your search"
                  )
                : t("actionPlansListPage.noPlans", "No action plans found")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery.trim()
                ? t(
                    "actionPlansListPage.noPlansMatchDescription",
                    "Try adjusting your search or filters to see more results."
                  )
                : t(
                    "actionPlansListPage.noPlansDescription",
                    "Action plans will appear here once generated from objectives or sentiment analysis."
                  )}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredActionPlans.map((plan) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan.id}>
                <ActionPlanCard
                  plan={plan}
                  onCardClick={handleCardClick}
                  onDeleteClick={handleDeleteClick}
                />
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
              <Box
                sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
              >
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
