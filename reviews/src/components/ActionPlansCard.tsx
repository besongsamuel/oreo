import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Note as NoteIcon,
  PlayCircle as PlayCircleIcon,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "../context/UserContext";
import { useActionPlans } from "../hooks/useActionPlans";
import {
  ActionPlan,
  ActionPlanItem,
  ActionPlanItemNote,
} from "../services/actionPlansService";
import { ContentSkeleton } from "./SkeletonLoaders";

interface ActionPlansCardProps {
  companyId: string;
}

type SourceTypeFilter = "all" | "objective" | "sentiment";
type StatusFilter = "all" | "new" | "in_progress" | "completed";

export const ActionPlansCard = ({ companyId }: ActionPlansCardProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const context = useContext(UserContext);
  const userId = context?.profile?.id;

  const [sourceTypeFilter, setSourceTypeFilter] =
    useState<SourceTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ActionPlanItem | null>(
    null
  );
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ActionPlanItemNote | null>(
    null
  );
  const [noteText, setNoteText] = useState("");

  const filters = useMemo(() => {
    const f: { source_type?: "objective" | "sentiment"; status?: "new" | "in_progress" | "completed" } = {};
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
    getActionPlan,
    updateItemStatus,
    addNote,
    updateNote,
    deleteNote,
  } = useActionPlans(companyId, filters);

  // Fetch full details when expanding a plan
  const [detailedPlans, setDetailedPlans] = useState<
    Record<string, ActionPlan>
  >({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>(
    {}
  );

  const handlePlanExpand = async (planId: string) => {
    if (expandedPlanId === planId) {
      setExpandedPlanId(null);
      return;
    }

    setExpandedPlanId(planId);

    // If we already have the details, don't fetch again
    if (detailedPlans[planId]) {
      return;
    }

    setLoadingDetails((prev) => ({ ...prev, [planId]: true }));
    try {
      const plan = await getActionPlan(planId);
      if (plan) {
        setDetailedPlans((prev) => ({ ...prev, [planId]: plan }));
      }
    } catch (error) {
      console.error("Error fetching action plan details:", error);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [planId]: false }));
    }
  };

  const handleStatusChange = async (
    itemId: string,
    newStatus: "new" | "in_progress" | "completed"
  ) => {
    try {
      await updateItemStatus(itemId, newStatus);
      // Refresh the detailed plan if it's loaded
      if (expandedPlanId) {
        const plan = await getActionPlan(expandedPlanId);
        if (plan) {
          setDetailedPlans((prev) => ({ ...prev, [expandedPlanId]: plan }));
        }
      }
    } catch (error) {
      console.error("Error updating item status:", error);
    }
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
    if (!selectedItem || !noteText.trim() || !userId) return;

    try {
      if (editingNote) {
        await updateNote(editingNote.id, noteText.trim());
      } else {
        await addNote(selectedItem.id, noteText.trim(), userId);
      }
      setNoteDialogOpen(false);
      setNoteText("");
      setEditingNote(null);
      setSelectedItem(null);

      // Refresh the detailed plan if it's loaded
      if (expandedPlanId) {
        const plan = await getActionPlan(expandedPlanId);
        if (plan) {
          setDetailedPlans((prev) => ({ ...prev, [expandedPlanId]: plan }));
        }
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
      await deleteNote(noteId);
      // Refresh the detailed plan if it's loaded
      if (expandedPlanId) {
        const plan = await getActionPlan(expandedPlanId);
        if (plan) {
          setDetailedPlans((prev) => ({ ...prev, [expandedPlanId]: plan }));
        }
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon sx={{ color: "success.main" }} />;
      case "in_progress":
        return <PlayCircleIcon sx={{ color: "warning.main" }} />;
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

  const currentPlan = expandedPlanId
    ? detailedPlans[expandedPlanId] || null
    : null;

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
          <AssignmentIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
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
          {actionPlans.map((plan) => {
            const isExpanded = expandedPlanId === plan.id;
            const planDetails = isExpanded ? currentPlan : null;
            const isLoadingDetails = loadingDetails[plan.id];

            return (
              <Card key={plan.id} variant="outlined" sx={{ borderRadius: "18px" }}>
                <CardContent>
                  <Accordion
                    expanded={isExpanded}
                    onChange={() => handlePlanExpand(plan.id)}
                    sx={{
                      boxShadow: "none",
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ width: "100%" }}
                      >
                        <AssignmentIcon sx={{ color: "primary.main" }} />
                        <Box sx={{ flexGrow: 1 }}>
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
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      {isLoadingDetails ? (
                        <ContentSkeleton />
                      ) : planDetails ? (
                        <Stack spacing={3} sx={{ mt: 2 }}>
                          {/* Markdown Plan */}
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderRadius: "12px",
                              bgcolor: "grey.50",
                            }}
                          >
                            <Typography
                              variant="body2"
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
                                __html: formatMarkdown(planDetails.plan_markdown),
                              }}
                            />
                          </Paper>

                          {/* Action Items by Topic */}
                          {planDetails.items && planDetails.items.length > 0 && (
                            <Box>
                              <Typography variant="h6" fontWeight={600} gutterBottom>
                                {t("actionPlans.actionItems", "Action Items")}
                              </Typography>
                              {Object.entries(
                                groupItemsByTopic(planDetails.items)
                              ).map(([topic, items]) => (
                                <Box key={topic} sx={{ mb: 3 }}>
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                    sx={{ mb: 1.5, color: "primary.main" }}
                                  >
                                    {topic}
                                  </Typography>
                                  <Stack spacing={2}>
                                    {items.map((item) => (
                                      <Paper
                                        key={item.id}
                                        variant="outlined"
                                        sx={{
                                          p: 2,
                                          borderRadius: "12px",
                                          borderLeft: 3,
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
                                          >
                                            <Box sx={{ flexGrow: 1 }}>
                                              <Typography
                                                variant="subtitle2"
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
                                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                              <Select
                                                value={item.status}
                                                onChange={(e) =>
                                                  handleStatusChange(
                                                    item.id,
                                                    e.target.value as any
                                                  )
                                                }
                                              >
                                                <MenuItem value="new">
                                                  {t("actionPlans.status.new", "New")}
                                                </MenuItem>
                                                <MenuItem value="in_progress">
                                                  {t(
                                                    "actionPlans.status.inProgress",
                                                    "In Progress"
                                                  )}
                                                </MenuItem>
                                                <MenuItem value="completed">
                                                  {t(
                                                    "actionPlans.status.completed",
                                                    "Completed"
                                                  )}
                                                </MenuItem>
                                              </Select>
                                            </FormControl>
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
                                                          t("actionPlans.anonymous", "Anonymous")}
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
                              ))}
                            </Box>
                          )}
                        </Stack>
                      ) : null}
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

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
    </Stack>
  );
};

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

