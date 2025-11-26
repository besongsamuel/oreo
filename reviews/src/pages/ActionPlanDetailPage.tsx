import {
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Note as NoteIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircleOutlined as CheckCircleOutlinedIcon,
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
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { ActionPlanDetailSkeleton } from "../components/SkeletonLoaders";
import {
  ActionPlan,
  ActionPlanItem,
  ActionPlanItemNote,
  ActionPlansService,
} from "../services/actionPlansService";
import { useSupabase } from "../hooks/useSupabase";

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
  const [editingNote, setEditingNote] = useState<ActionPlanItemNote | null>(null);
  const [noteText, setNoteText] = useState("");
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [itemToComplete, setItemToComplete] = useState<ActionPlanItem | null>(null);

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

  const handleToggleInProgress = async (item: ActionPlanItem) => {
    const newStatus = item.status === "in_progress" ? "new" : "in_progress";
    await handleStatusChange(item.id, newStatus);
  };

  const handleCompleteClick = (item: ActionPlanItem) => {
    setItemToComplete(item);
    setCompleteConfirmOpen(true);
  };

  const handleCompleteConfirm = async () => {
    if (itemToComplete) {
      await handleStatusChange(itemToComplete.id, "completed");
      setCompleteConfirmOpen(false);
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
        await service.addActionPlanItemNote(selectedItem.id, noteText.trim(), userId);
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
    if (!window.confirm(t("actionPlans.confirmDeleteNote", "Delete this note?"))) {
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* Back Button and Delete */}
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
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
                <AssignmentIcon sx={{ color: "primary.main", fontSize: 40, mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" fontWeight={600} gutterBottom>
                    {actionPlan.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {actionPlan.description}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    <Chip
                      label={t(
                        `actionPlans.sourceType.${actionPlan.source_type}`,
                        actionPlan.source_type
                      )}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={t(`actionPlans.status.${actionPlan.status}`, actionPlan.status)}
                      size="small"
                      color={getStatusColor(actionPlan.status) as any}
                      icon={getStatusIcon(actionPlan.status)}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                      {new Date(actionPlan.created_at).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Markdown Plan */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: "18px",
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
        </Paper>

        {/* Action Items by Topic */}
        {actionPlan.items && actionPlan.items.length > 0 && (
          <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
              {t("actionPlans.actionItems", "Action Items")}
            </Typography>
            {Object.entries(groupItemsByTopic(actionPlan.items)).map(([topic, items]) => (
              <Box key={topic} sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{ mb: 2, color: "primary.main" }}
                >
                  {topic}
                </Typography>
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
                            <Typography variant="subtitle1" fontWeight={600}>
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
                          {item.status === "completed" ? (
                            <Tooltip title={t("actionPlans.status.completedTooltip", "This action item has been completed")}>
                              <Chip
                                icon={<CheckCircleIcon />}
                                label={t("actionPlans.status.completed", "Completed")}
                                color="success"
                                size="small"
                              />
                            </Tooltip>
                          ) : (
                            <Stack direction="row" spacing={1} alignItems="center">
                              {item.status === "new" && (
                                <Tooltip title={t("actionPlans.status.notStartedTooltip", "This action item has not been started yet")}>
                                  <Chip
                                    label={t("actionPlans.status.notStarted", "Not Started")}
                                    color="default"
                                    variant="outlined"
                                    size="small"
                                  />
                                </Tooltip>
                              )}
                              {item.status === "in_progress" && (
                                <Tooltip title={t("actionPlans.status.inProgressTooltip", "This action item is currently in progress")}>
                                  <Chip
                                    icon={<HourglassEmptyIcon />}
                                    label={t("actionPlans.status.inProgress", "In Progress")}
                                    sx={{
                                      bgcolor: "#ff9500",
                                      color: "#ffffff",
                                      fontWeight: 600,
                                      "& .MuiChip-icon": {
                                        color: "#ffffff",
                                      },
                                    }}
                                    size="small"
                                  />
                                </Tooltip>
                              )}
                              <Tooltip
                                title={
                                  item.status === "in_progress"
                                    ? t("actionPlans.status.markAsNew", "Mark as Not Started")
                                    : t("actionPlans.status.markInProgress", "Mark as In Progress")
                                }
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleInProgress(item)}
                                  sx={{
                                    bgcolor:
                                      item.status === "in_progress"
                                        ? "#ff9500"
                                        : "transparent",
                                    color: item.status === "in_progress" ? "#ffffff" : "inherit",
                                    border: item.status === "in_progress" ? "none" : "1px solid",
                                    borderColor: item.status === "in_progress" ? "transparent" : "grey.400",
                                    "&:hover": {
                                      bgcolor: item.status === "in_progress" ? "#ff8c00" : "action.hover",
                                    },
                                  }}
                                >
                                  {item.status === "in_progress" ? (
                                    <HourglassEmptyIcon />
                                  ) : (
                                    <PlayArrowIcon />
                                  )}
                                </IconButton>
                              </Tooltip>
                              {item.status === "in_progress" && (
                                <Tooltip title={t("actionPlans.status.complete", "Mark as Completed")}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCompleteClick(item)}
                                    sx={{
                                      bgcolor: "transparent",
                                      border: "1px solid",
                                      borderColor: "success.main",
                                      color: "success.main",
                                      "&:hover": {
                                        bgcolor: "success.light",
                                        borderColor: "success.dark",
                                        color: "success.dark",
                                      },
                                    }}
                                  >
                                    <CheckCircleOutlinedIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          )}
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
                                  <Typography variant="body2">{note.note}</Typography>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ mt: 1 }}
                                  >
                                    <Typography variant="caption" color="text.secondary">
                                      {note.created_by_profile?.full_name ||
                                        note.created_by_profile?.email ||
                                        t("actionPlans.anonymous", "Anonymous")}
                                      {" • "}
                                      {new Date(note.created_at).toLocaleDateString()}
                                    </Typography>
                                    {userId === note.created_by && (
                                      <>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleEditNote(note, item)}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleDeleteNote(note.id)}
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
            ))}
          </Box>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {t("actionPlanDetailPage.deleteConfirmTitle", "Delete Action Plan")}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {t(
                "actionPlanDetailPage.deleteConfirmMessage",
                "Are you sure you want to delete this action plan? This action cannot be undone."
              )}
            </Typography>
            {actionPlan && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: "8px" }}>
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
            {t("actionPlanDetailPage.completeConfirmTitle", "Mark as Completed?")}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {t(
                "actionPlanDetailPage.completeConfirmMessage",
                "Are you sure you want to mark this action item as completed?"
              )}
            </Typography>
            {itemToComplete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: "8px" }}>
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
              placeholder={t("actionPlans.notePlaceholder", "Enter your note here...")}
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
      </Stack>
    </Container>
  );
};

