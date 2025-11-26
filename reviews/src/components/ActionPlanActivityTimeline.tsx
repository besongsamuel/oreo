import {
  CheckCircle as CheckCircleIcon,
  EditNote as EditNoteIcon,
  PlayArrow as PlayArrowIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActionPlan, ActionPlanItem, ActionPlanItemNote } from "../services/actionPlansService";

interface ActionPlanActivityTimelineProps {
  actionPlan: ActionPlan;
  maxItems?: number;
}

interface ActivityEvent {
  type: "completed" | "started" | "note_added";
  itemTitle: string;
  timestamp: string;
  noteText?: string;
}

export const ActionPlanActivityTimeline = ({
  actionPlan,
  maxItems = 10,
}: ActionPlanActivityTimelineProps) => {
  const { t } = useTranslation();

  const activities = useMemo(() => {
    const events: ActivityEvent[] = [];

    if (!actionPlan.items) return [];

    actionPlan.items.forEach((item) => {
      // Track status changes based on updated_at
      if (item.status === "completed") {
        events.push({
          type: "completed",
          itemTitle: item.title,
          timestamp: item.updated_at,
        });
      } else if (item.status === "in_progress") {
        events.push({
          type: "started",
          itemTitle: item.title,
          timestamp: item.updated_at,
        });
      }

      // Track notes
      if (item.notes && item.notes.length > 0) {
        item.notes.forEach((note) => {
          events.push({
            type: "note_added",
            itemTitle: item.title,
            timestamp: note.created_at,
            noteText: note.note,
          });
        });
      }
    });

    // Sort by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return events.slice(0, maxItems);
  }, [actionPlan.items, maxItems]);

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t("activity.justNow", "Just now");
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return t("activity.minutesAgo", "{{count}} minute{{plural}} ago", {
        count: diffInMinutes,
        plural: diffInMinutes === 1 ? "" : "s",
      });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return t("activity.hoursAgo", "{{count}} hour{{plural}} ago", {
        count: diffInHours,
        plural: diffInHours === 1 ? "" : "s",
      });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return t("activity.daysAgo", "{{count}} day{{plural}} ago", {
        count: diffInDays,
        plural: diffInDays === 1 ? "" : "s",
      });
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return t("activity.weeksAgo", "{{count}} week{{plural}} ago", {
        count: diffInWeeks,
        plural: diffInWeeks === 1 ? "" : "s",
      });
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return t("activity.monthsAgo", "{{count}} month{{plural}} ago", {
      count: diffInMonths,
      plural: diffInMonths === 1 ? "" : "s",
    });
  };

  const getActivityIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "completed":
        return <CheckCircleIcon />;
      case "started":
        return <PlayArrowIcon />;
      case "note_added":
        return <EditNoteIcon />;
    }
  };

  const getActivityColor = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "completed":
        return "success";
      case "started":
        return "warning";
      case "note_added":
        return "info";
    }
  };

  const getActivityMessage = (activity: ActivityEvent) => {
    switch (activity.type) {
      case "completed":
        return t(
          "activity.completed",
          "Completed: {{itemTitle}}",
          { itemTitle: activity.itemTitle }
        );
      case "started":
        return t(
          "activity.started",
          "Started: {{itemTitle}}",
          { itemTitle: activity.itemTitle }
        );
      case "note_added":
        return t(
          "activity.noteAdded",
          "Added note to: {{itemTitle}}",
          { itemTitle: activity.itemTitle }
        );
    }
  };

  if (activities.length === 0) {
    return (
      <Card variant="outlined" sx={{ borderRadius: "18px" }}>
        <CardContent>
          <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
            <TimelineIcon sx={{ fontSize: 48, color: "text.disabled" }} />
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {t(
                "activity.noActivity",
                "No recent activity. Start working on your action items to see progress here!"
              )}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: "18px" }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TimelineIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" fontWeight={600}>
              {t("activity.recentActivity", "Recent Activity")}
            </Typography>
          </Stack>
          <Stack spacing={0}>
            {activities.map((activity, index) => (
              <Box key={index}>
                <Stack direction="row" spacing={2} sx={{ py: 1.5 }}>
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: `${getActivityColor(activity.type)}.light`,
                      color: `${getActivityColor(activity.type)}.main`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getActivityIcon(activity.type)}
                  </Box>
                  {/* Content */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {getActivityMessage(activity)}
                    </Typography>
                    {activity.noteText && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          mt: 0.5,
                          fontStyle: "italic",
                        }}
                      >
                        "{activity.noteText.substring(0, 100)}
                        {activity.noteText.length > 100 ? "..." : ""}"
                      </Typography>
                    )}
                  </Box>
                  {/* Timestamp */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ flexShrink: 0, alignSelf: "flex-start", pt: 0.5 }}
                  >
                    {formatTimeAgo(activity.timestamp)}
                  </Typography>
                </Stack>
                {index < activities.length - 1 && (
                  <Divider sx={{ ml: 7, borderColor: "divider" }} />
                )}
              </Box>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

