import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Note as NoteIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ActionPlanActivityTimeline } from "../components/ActionPlanActivityTimeline";
import { ConfettiCelebration } from "../components/ConfettiCelebration";
import { ActionPlanDetailSkeleton } from "../components/SkeletonLoaders";
import { UserContext } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";
import {
  ActionPlan,
  ActionPlanItem,
  ActionPlanItemNote,
  ActionPlansService,
} from "../services/actionPlansService";

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

export const ActionPlanDetailPage = () => {
  const { companyId, actionPlanId } = useParams<{
    companyId: string;
    actionPlanId: string;
  }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const context = useContext(UserContext);
  const userId = context?.profile?.id;
  const supabase = useSupabase();
  const service = useMemo(() => new ActionPlansService(supabase), [supabase]);

  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedItem, setSelectedItem] = useState<ActionPlanItem | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ActionPlanItemNote | null>(
    null
  );
  const [noteText, setNoteText] = useState("");
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [itemToComplete, setItemToComplete] = useState<ActionPlanItem | null>(
    null
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Item management state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionPlanItem | null>(null);
  const [itemFormData, setItemFormData] = useState({
    topic: "",
    title: "",
    description: "",
  });
  const [itemFormErrors, setItemFormErrors] = useState({
    topic: "",
    title: "",
    description: "",
  });
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ActionPlanItem | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    const fetchActionPlan = async () => {
      if (!actionPlanId || !companyId) {
        return;
      }

      setLoading(true);
      try {
        const plan = await service.getActionPlan(actionPlanId);
        if (!plan) {
          navigate(`/companies/${companyId}/action_plans`);
          return;
        }
        setActionPlan(plan);
      } catch (error) {
        console.error("Error fetching action plan:", error);
        navigate(`/companies/${companyId}/action_plans`);
      } finally {
        setLoading(false);
      }
    };

    fetchActionPlan();
  }, [actionPlanId, companyId, navigate, service]);

  const handleStatusChange = async (
    itemId: string,
    newStatus: "new" | "in_progress" | "completed"
  ) => {
    try {
      await service.updateActionPlanItemStatus(itemId, newStatus);
      // Refresh the plan
      if (actionPlanId) {
        const plan = await service.getActionPlan(actionPlanId);
        if (plan) {
          setActionPlan(plan);
        }
      }
    } catch (error) {
      console.error("Error updating item status:", error);
    }
  };

  const handleStatusSelect = async (
    item: ActionPlanItem,
    newStatus: "new" | "in_progress" | "completed"
  ) => {
    // If changing to completed, show confirmation dialog
    if (newStatus === "completed" && item.status !== "completed") {
      setItemToComplete(item);
      setCompleteConfirmOpen(true);
      return;
    }

    // For other status changes, update directly
    await handleStatusChange(item.id, newStatus);
  };

  const handleCompleteConfirm = async () => {
    if (itemToComplete) {
      await handleStatusChange(itemToComplete.id, "completed");
      setCompleteConfirmOpen(false);

      // Trigger celebration
      setShowConfetti(true);
      setSuccessMessage(
        t(
          "actionPlanDetailPage.completionSuccess",
          '🎉 Great job! You completed "{{itemTitle}}"!',
          { itemTitle: itemToComplete.title }
        )
      );

      setItemToComplete(null);
    }
  };

  const handleCompleteCancel = () => {
    setCompleteConfirmOpen(false);
    setItemToComplete(null);
  };

  const handleAddNote = (item: ActionPlanItem) => {
    setSelectedItem(item);
    setEditingNote(null);
    setNoteText("");
    setNoteDialogOpen(true);
  };

  const handleEditNote = (note: ActionPlanItemNote, item: ActionPlanItem) => {
    setSelectedItem(item);
    setEditingNote(note);
    setNoteText(note.note);
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedItem || !noteText.trim() || !userId || !actionPlanId) return;

    try {
      if (editingNote) {
        await service.updateActionPlanItemNote(editingNote.id, noteText.trim());
      } else {
        await service.addActionPlanItemNote(
          selectedItem.id,
          noteText.trim(),
          userId
        );
      }
      setNoteDialogOpen(false);
      setNoteText("");
      setEditingNote(null);
      setSelectedItem(null);

      // Refresh the plan
      const plan = await service.getActionPlan(actionPlanId);
      if (plan) {
        setActionPlan(plan);
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (
      !window.confirm(t("actionPlans.confirmDeleteNote", "Delete this note?"))
    ) {
      return;
    }

    try {
      await service.deleteActionPlanItemNote(noteId);
      // Refresh the plan
      if (actionPlanId) {
        const plan = await service.getActionPlan(actionPlanId);
        if (plan) {
          setActionPlan(plan);
        }
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleAddItem = (topic?: string) => {
    setEditingItem(null);
    setItemFormData({
      topic: topic || "",
      title: "",
      description: "",
    });
    setItemFormErrors({
      topic: "",
      title: "",
      description: "",
    });
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: ActionPlanItem) => {
    setEditingItem(item);
    setItemFormData({
      topic: item.topic,
      title: item.title,
      description: item.description,
    });
    setItemFormErrors({
      topic: "",
      title: "",
      description: "",
    });
    setItemDialogOpen(true);
  };

  const validateItemForm = (): boolean => {
    const errors = {
      topic: "",
      title: "",
      description: "",
    };
    let isValid = true;

    if (!itemFormData.topic.trim()) {
      errors.topic = t("actionPlans.itemTopicRequired", "Topic is required");
      isValid = false;
    }

    if (!itemFormData.title.trim()) {
      errors.title = t("actionPlans.itemTitleRequired", "Title is required");
      isValid = false;
    } else if (itemFormData.title.trim().length < 3) {
      errors.title = t(
        "actionPlans.itemTitleMinLength",
        "Title must be at least 3 characters"
      );
      isValid = false;
    }

    if (!itemFormData.description.trim()) {
      errors.description = t(
        "actionPlans.itemDescriptionRequired",
        "Description is required"
      );
      isValid = false;
    } else if (itemFormData.description.trim().length < 10) {
      errors.description = t(
        "actionPlans.itemDescriptionMinLength",
        "Description must be at least 10 characters"
      );
      isValid = false;
    }

    setItemFormErrors(errors);
    return isValid;
  };

  const handleSaveItem = async () => {
    if (!actionPlanId || !validateItemForm()) {
      return;
    }

    setSavingItem(true);
    try {
      if (editingItem) {
        await service.updateActionPlanItem(
          editingItem.id,
          itemFormData.topic.trim(),
          itemFormData.title.trim(),
          itemFormData.description.trim()
        );
      } else {
        await service.createActionPlanItem(
          actionPlanId,
          itemFormData.topic.trim(),
          itemFormData.title.trim(),
          itemFormData.description.trim()
        );
      }

      setItemDialogOpen(false);
      setEditingItem(null);
      setItemFormData({ topic: "", title: "", description: "" });

      // Refresh the plan
      const plan = await service.getActionPlan(actionPlanId);
      if (plan) {
        setActionPlan(plan);
      }
    } catch (error) {
      console.error("Error saving item:", error);
      setSuccessMessage(
        t("actionPlans.saveItemError", "Failed to save item. Please try again.")
      );
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = (item: ActionPlanItem) => {
    setItemToDelete(item);
    setDeleteItemDialogOpen(true);
  };

  const handleDeleteItemConfirm = async () => {
    if (!itemToDelete || !actionPlanId) return;

    try {
      await service.deleteActionPlanItem(itemToDelete.id);
      setDeleteItemDialogOpen(false);
      setItemToDelete(null);

      // Refresh the plan
      const plan = await service.getActionPlan(actionPlanId);
      if (plan) {
        setActionPlan(plan);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      setSuccessMessage(
        t(
          "actionPlans.deleteItemError",
          "Failed to delete item. Please try again."
        )
      );
    }
  };

  const handleDeleteItemCancel = () => {
    setDeleteItemDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDeletePlan = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!actionPlanId) return;

    setDeleting(true);
    try {
      await service.deleteActionPlan(actionPlanId);
      navigate(`/companies/${companyId}/action_plans`);
    } catch (error) {
      console.error("Error deleting action plan:", error);
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

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

  // Group items by topic
  const groupItemsByTopic = (items: ActionPlanItem[]) => {
    const grouped: Record<string, ActionPlanItem[]> = {};
    items.forEach((item) => {
      if (!grouped[item.topic]) {
        grouped[item.topic] = [];
      }
      grouped[item.topic].push(item);
    });
    return grouped;
  };

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (!actionPlan?.items || actionPlan.items.length === 0) return 0;
    const completed = actionPlan.items.filter(
      (item) => item.status === "completed"
    ).length;
    return Math.round((completed / actionPlan.items.length) * 100);
  }, [actionPlan?.items]);

  // Check if entire plan is completed
  const isPlanCompleted = useMemo(() => {
    if (!actionPlan?.items || actionPlan.items.length === 0) return false;
    return actionPlan.items.every((item) => item.status === "completed");
  }, [actionPlan?.items]);

  // Show celebration when plan is fully completed
  useEffect(() => {
    if (isPlanCompleted && actionPlan?.items && actionPlan.items.length > 0) {
      const allCompleted = actionPlan.items.every(
        (item) => item.status === "completed"
      );
      if (allCompleted && actionPlan.items.length > 0) {
        setShowConfetti(true);
        setSuccessMessage(
          t(
            "actionPlanDetailPage.planCompletedSuccess",
            "🎉 Amazing! You've completed the entire action plan!"
          )
        );
      }
    }
  }, [isPlanCompleted, actionPlan?.items, t]);

  if (loading) {
    return (
      <Container
        maxWidth="xl"
        sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
        <Stack spacing={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/companies/${companyId}/action_plans`)}
            sx={{ alignSelf: "flex-start" }}
          >
            {t("actionPlanDetailPage.backToPlans", "Back to Action Plans")}
          </Button>
          <ActionPlanDetailSkeleton />
        </Stack>
      </Container>
    );
  }

  if (!actionPlan) {
    return null;
  }

  return (
    <>
      <ConfettiCelebration
        trigger={showConfetti}
        duration={3000}
        onComplete={() => setShowConfetti(false)}
      />
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        message={successMessage}
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor: "success.main",
            color: "white",
            fontSize: "1rem",
            fontWeight: 500,
            borderRadius: "12px",
          },
        }}
      />
      <Container
        maxWidth="xl"
        sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
        <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Back Button and Delete */}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/companies/${companyId}/action_plans`)}
              sx={{
                alignSelf: "flex-start",
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              {t("actionPlanDetailPage.backToPlans", "Back to Action Plans")}
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              onClick={handleDeletePlan}
              variant="outlined"
              color="error"
              sx={{
                alignSelf: "flex-start",
              }}
            >
              {t("actionPlanDetailPage.deletePlan", "Delete Plan")}
            </Button>
          </Stack>

          {/* Header */}
          <Card variant="outlined" sx={{ borderRadius: "18px" }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <AssignmentIcon
                    sx={{ color: "primary.main", fontSize: 40, mt: 0.5 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" fontWeight={600} gutterBottom>
                      {actionPlan.name}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {actionPlan.description}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      gap={1}
                      alignItems="center"
                    >
                      <Chip
                        label={t(
                          `actionPlans.sourceType.${actionPlan.source_type}`,
                          actionPlan.source_type
                        )}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={t(
                          `actionPlans.status.${actionPlan.status}`,
                          actionPlan.status
                        )}
                        size="small"
                        color={getStatusColor(actionPlan.status) as any}
                        icon={getStatusIcon(actionPlan.status)}
                      />
                      {/* Progress Indicator */}
                      {actionPlan.items && actionPlan.items.length > 0 && (
                        <Box sx={{ ml: "auto" }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography variant="body2" color="text.secondary">
                              {t("actionPlansListPage.progress", "Progress")}:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={`${
                                completionPercentage >= 80
                                  ? "success"
                                  : completionPercentage >= 50
                                  ? "warning"
                                  : "error"
                              }.main`}
                            >
                              {completionPercentage}%
                            </Typography>
                          </Stack>
                        </Box>
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ alignSelf: "center" }}
                      >
                        {new Date(actionPlan.created_at).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Markdown Plan */}
          <Accordion
            defaultExpanded={false}
            sx={{
              borderRadius: "18px",
              "&:before": {
                display: "none",
              },
              boxShadow: "none",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                borderRadius: "18px",
                bgcolor: "grey.50",
                "&:hover": {
                  bgcolor: "grey.100",
                },
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                {t("actionPlanDetailPage.markdownPlan", "Markdown Plan")}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                p: 3,
                bgcolor: "grey.50",
              }}
            >
              <Typography
                variant="body1"
                component="div"
                sx={{
                  "& h2": {
                    mt: 3,
                    mb: 1,
                    fontSize: "1.3em",
                    fontWeight: 600,
                    color: "primary.main",
                  },
                  "& h3": {
                    mt: 2,
                    mb: 0.5,
                    fontSize: "1.1em",
                    fontWeight: 600,
                    color: "text.primary",
                  },
                  "& h4": {
                    mt: 1.5,
                    mb: 0.5,
                    fontSize: "1em",
                    fontWeight: 600,
                  },
                  "& p": {
                    mb: 1.5,
                    lineHeight: 1.6,
                  },
                  "& strong": {
                    fontWeight: 600,
                  },
                  "& ul, & ol": {
                    pl: 2,
                    mb: 1.5,
                    "& li": {
                      mb: 0.5,
                      lineHeight: 1.6,
                    },
                  },
                }}
                dangerouslySetInnerHTML={{
                  __html: formatMarkdown(actionPlan.plan_markdown),
                }}
              />
            </AccordionDetails>
          </Accordion>

          {/* Action Items by Topic */}
          <Box>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 3 }}
            >
              <Typography variant="h5" fontWeight={600}>
                {t("actionPlans.actionItems", "Action Items")}
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => handleAddItem()}
                sx={{
                  borderRadius: "980px",
                  textTransform: "none",
                }}
              >
                {t("actionPlans.addItem", "Add Item")}
              </Button>
            </Stack>
            {actionPlan.items && actionPlan.items.length > 0 ? (
              Object.entries(groupItemsByTopic(actionPlan.items)).map(
                ([topic, items]) => (
                  <Box key={topic} sx={{ mb: 4 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 2 }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ color: "primary.main" }}
                      >
                        {topic}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddItem(topic)}
                        sx={{
                          textTransform: "none",
                        }}
                      >
                        {t("actionPlans.addItem", "Add Item")}
                      </Button>
                    </Stack>
                    <Stack spacing={2}>
                      {items.map((item) => (
                        <Paper
                          key={item.id}
                          variant="outlined"
                          sx={{
                            p: 3,
                            borderRadius: "18px",
                            borderLeft: 4,
                            borderLeftColor:
                              item.status === "completed"
                                ? "success.main"
                                : item.status === "in_progress"
                                ? "warning.main"
                                : "grey.300",
                          }}
                        >
                          <Stack spacing={2}>
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="flex-start"
                              justifyContent="space-between"
                            >
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={600}
                                >
                                  {item.title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 0.5 }}
                                >
                                  {item.description}
                                </Typography>
                              </Box>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditItem(item)}
                                  sx={{
                                    color: "primary.main",
                                    "&:hover": {
                                      backgroundColor: "primary.light",
                                      color: "primary.dark",
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteItem(item)}
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
                                <FormControl
                                  size="small"
                                  sx={{ minWidth: 150 }}
                                >
                                  <Select
                                    value={item.status}
                                    onChange={(e) =>
                                      handleStatusSelect(
                                        item,
                                        e.target.value as
                                          | "new"
                                          | "in_progress"
                                          | "completed"
                                      )
                                    }
                                    sx={{
                                      "& .MuiSelect-select": {
                                        py: 1,
                                      },
                                    }}
                                  >
                                    <MenuItem value="new">
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                      >
                                        <CircleIcon
                                          sx={{
                                            color: "text.disabled",
                                            fontSize: 16,
                                          }}
                                        />
                                        <Typography variant="body2">
                                          {t(
                                            "actionPlans.status.notStarted",
                                            "Not Started"
                                          )}
                                        </Typography>
                                      </Stack>
                                    </MenuItem>
                                    <MenuItem value="in_progress">
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                      >
                                        <HourglassEmptyIcon
                                          sx={{
                                            color: "warning.main",
                                            fontSize: 16,
                                          }}
                                        />
                                        <Typography variant="body2">
                                          {t(
                                            "actionPlans.status.inProgress",
                                            "In Progress"
                                          )}
                                        </Typography>
                                      </Stack>
                                    </MenuItem>
                                    <MenuItem value="completed">
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                      >
                                        <CheckCircleIcon
                                          sx={{
                                            color: "success.main",
                                            fontSize: 16,
                                          }}
                                        />
                                        <Typography variant="body2">
                                          {t(
                                            "actionPlans.status.completed",
                                            "Completed"
                                          )}
                                        </Typography>
                                      </Stack>
                                    </MenuItem>
                                  </Select>
                                </FormControl>
                              </Stack>
                            </Stack>

                            {/* Notes Section */}
                            <Box>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ mb: 1 }}
                              >
                                <NoteIcon fontSize="small" />
                                <Typography variant="caption" fontWeight={600}>
                                  {t("actionPlans.notes", "Notes")}
                                </Typography>
                                <Button
                                  size="small"
                                  onClick={() => handleAddNote(item)}
                                  sx={{ ml: "auto" }}
                                >
                                  {t("actionPlans.addNote", "Add Note")}
                                </Button>
                              </Stack>
                              {item.notes && item.notes.length > 0 && (
                                <Stack spacing={1}>
                                  {item.notes.map((note) => (
                                    <Paper
                                      key={note.id}
                                      variant="outlined"
                                      sx={{
                                        p: 1.5,
                                        borderRadius: "8px",
                                        bgcolor: "grey.50",
                                      }}
                                    >
                                      <Typography variant="body2">
                                        {note.note}
                                      </Typography>
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        sx={{ mt: 1 }}
                                      >
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {note.created_by_profile?.full_name ||
                                            note.created_by_profile?.email ||
                                            t(
                                              "actionPlans.anonymous",
                                              "Anonymous"
                                            )}
                                          {" • "}
                                          {new Date(
                                            note.created_at
                                          ).toLocaleDateString()}
                                        </Typography>
                                        {userId === note.created_by && (
                                          <>
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                handleEditNote(note, item)
                                              }
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                handleDeleteNote(note.id)
                                              }
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </>
                                        )}
                                      </Stack>
                                    </Paper>
                                  ))}
                                </Stack>
                              )}
                            </Box>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )
              )
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: "18px",
                  borderColor: "grey.300",
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  {t(
                    "actionPlans.noItems",
                    "No action items yet. Click 'Add Item' to create one."
                  )}
                </Typography>
              </Paper>
            )}
          </Box>

          {/* Activity Timeline */}
          <ActionPlanActivityTimeline actionPlan={actionPlan} maxItems={10} />

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleDeleteCancel}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {t(
                "actionPlanDetailPage.deleteConfirmTitle",
                "Delete Action Plan"
              )}
            </DialogTitle>
            <DialogContent>
              <Typography>
                {t(
                  "actionPlanDetailPage.deleteConfirmMessage",
                  "Are you sure you want to delete this action plan? This action cannot be undone."
                )}
              </Typography>
              {actionPlan && (
                <Box
                  sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    {actionPlan.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {actionPlan.description}
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
                  ? t("actionPlanDetailPage.deleting", "Deleting...")
                  : t("common.delete", "Delete")}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Complete Confirmation Dialog */}
          <Dialog
            open={completeConfirmOpen}
            onClose={handleCompleteCancel}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {t(
                "actionPlanDetailPage.completeConfirmTitle",
                "Mark as Completed?"
              )}
            </DialogTitle>
            <DialogContent>
              <Typography>
                {t(
                  "actionPlanDetailPage.completeConfirmMessage",
                  "Are you sure you want to mark this action item as completed?"
                )}
              </Typography>
              {itemToComplete && (
                <Box
                  sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    {itemToComplete.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {itemToComplete.description}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCompleteCancel}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                onClick={handleCompleteConfirm}
                variant="contained"
                color="success"
              >
                {t("actionPlanDetailPage.complete", "Mark as Completed")}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Note Dialog */}
          <Dialog
            open={noteDialogOpen}
            onClose={() => {
              setNoteDialogOpen(false);
              setNoteText("");
              setEditingNote(null);
              setSelectedItem(null);
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {editingNote
                ? t("actionPlans.editNote", "Edit Note")
                : t("actionPlans.addNote", "Add Note")}
            </DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={t(
                  "actionPlans.notePlaceholder",
                  "Enter your note here..."
                )}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setNoteDialogOpen(false);
                  setNoteText("");
                  setEditingNote(null);
                  setSelectedItem(null);
                }}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                onClick={handleSaveNote}
                variant="contained"
                disabled={!noteText.trim()}
              >
                {t("common.save", "Save")}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Add/Edit Item Dialog */}
          <Dialog
            open={itemDialogOpen}
            onClose={() => {
              setItemDialogOpen(false);
              setEditingItem(null);
              setItemFormData({ topic: "", title: "", description: "" });
              setItemFormErrors({ topic: "", title: "", description: "" });
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {editingItem
                ? t("actionPlans.editItem", "Edit Item")
                : t("actionPlans.addItem", "Add Item")}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label={t("actionPlans.itemTopic", "Topic")}
                  value={itemFormData.topic}
                  onChange={(e) =>
                    setItemFormData({ ...itemFormData, topic: e.target.value })
                  }
                  error={!!itemFormErrors.topic}
                  helperText={itemFormErrors.topic}
                  placeholder={t(
                    "actionPlans.itemTopicPlaceholder",
                    "Enter topic name (e.g., Customer Service)"
                  )}
                />
                <TextField
                  fullWidth
                  label={t("actionPlans.itemTitle", "Title")}
                  value={itemFormData.title}
                  onChange={(e) =>
                    setItemFormData({ ...itemFormData, title: e.target.value })
                  }
                  error={!!itemFormErrors.title}
                  helperText={itemFormErrors.title}
                  placeholder={t(
                    "actionPlans.itemTitlePlaceholder",
                    "Enter item title"
                  )}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label={t("actionPlans.itemDescription", "Description")}
                  value={itemFormData.description}
                  onChange={(e) =>
                    setItemFormData({
                      ...itemFormData,
                      description: e.target.value,
                    })
                  }
                  error={!!itemFormErrors.description}
                  helperText={itemFormErrors.description}
                  placeholder={t(
                    "actionPlans.itemDescriptionPlaceholder",
                    "Enter item description"
                  )}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setItemDialogOpen(false);
                  setEditingItem(null);
                  setItemFormData({ topic: "", title: "", description: "" });
                  setItemFormErrors({ topic: "", title: "", description: "" });
                }}
                disabled={savingItem}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                onClick={handleSaveItem}
                variant="contained"
                disabled={savingItem}
              >
                {savingItem
                  ? t("common.saving", "Saving...")
                  : t("common.save", "Save")}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Item Confirmation Dialog */}
          <Dialog
            open={deleteItemDialogOpen}
            onClose={handleDeleteItemCancel}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {t("actionPlans.deleteItem", "Delete Item")}
            </DialogTitle>
            <DialogContent>
              <Typography>
                {t(
                  "actionPlans.deleteItemConfirm",
                  "Are you sure you want to delete this action item?"
                )}
              </Typography>
              {itemToDelete && (
                <Box
                  sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    {itemToDelete.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {itemToDelete.description}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDeleteItemCancel}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                onClick={handleDeleteItemConfirm}
                variant="contained"
                color="error"
              >
                {t("common.delete", "Delete")}
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </Container>
    </>
  );
};
