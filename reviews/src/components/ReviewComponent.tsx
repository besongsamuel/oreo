import {
  Close as CloseIcon,
  Star as StarIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  author_name: string;
  author_avatar_url?: string;
  published_at: string;
  sentiment: string;
  location_name: string;
  platform_name: string;
  raw_data?: {
    replies?: Array<{
      id: string;
      text: string;
      timestamp: string;
      author: {
        id: string;
        name: string;
        photo?: string;
        url?: string;
      };
    }>;
  };
}

interface ReviewComponentProps {
  review: Review;
  getSentimentColor: (sentiment: string) => "success" | "error" | "default";
}

export const ReviewComponent = ({
  review,
  getSentimentColor,
}: ReviewComponentProps) => {
  const { t } = useTranslation();
  const [repliesDialogOpen, setRepliesDialogOpen] = useState(false);

  const hasReplies =
    review.raw_data?.replies && review.raw_data.replies.length > 0;
  const replies = review.raw_data?.replies || [];

  const isNegative =
    (review.rating <= 2 || review.sentiment === "negative") && !hasReplies;

  const handleOpenReplies = () => {
    setRepliesDialogOpen(true);
  };

  const handleCloseReplies = () => {
    setRepliesDialogOpen(false);
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          transition: "all 0.2s ease-in-out",
          border: isNegative ? 2 : 1,
          borderColor: isNegative ? "error.main" : "divider",
          bgcolor: isNegative ? "rgba(211, 47, 47, 0.03)" : "background.paper",
          "&:hover": {
            boxShadow: isNegative ? 3 : 2,
            transform: "translateY(-2px)",
            borderColor: isNegative ? "error.dark" : "primary.main",
          },
        }}
      >
        <CardContent>
          <Stack spacing={1}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Avatar
                    src={review.author_avatar_url}
                    sx={{ width: 32, height: 32 }}
                  >
                    {(review.author_name || "A").charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {review.author_name || t("dashboard.anonymous")}
                  </Typography>
                  <Chip
                    label={review.platform_name}
                    size="small"
                    variant="outlined"
                  />
                  {isNegative && (
                    <Chip
                      icon={<WarningIcon sx={{ fontSize: 16 }} />}
                      label={t("reviewComponent.needsAttention", "Needs Attention")}
                      size="small"
                      color="error"
                      variant="filled"
                      sx={{
                        fontWeight: 600,
                        "& .MuiChip-icon": {
                          color: "inherit",
                        },
                      }}
                    />
                  )}
                  {hasReplies && (
                    <Chip
                      label={t("companyPage.hasReply", "Has Reply")}
                      size="small"
                      color="primary"
                      variant="filled"
                      onClick={handleOpenReplies}
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          opacity: 0.9,
                        },
                      }}
                    />
                  )}
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {review.location_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(review.published_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" fontWeight="bold">
                  {review.rating.toFixed(1)}
                </Typography>
                <StarIcon fontSize="small" sx={{ color: "warning.main" }} />
                {review.sentiment && (
                  <Chip
                    label={review.sentiment}
                    size="small"
                    color={getSentimentColor(review.sentiment)}
                  />
                )}
              </Stack>
            </Stack>
            {review.title && (
              <Typography variant="subtitle2" fontWeight={600}>
                {review.title}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {review.content?.substring(0, 200)}
              {review.content && review.content.length > 200 ? "..." : ""}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Replies Dialog */}
      <Dialog
        open={repliesDialogOpen}
        onClose={handleCloseReplies}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5" fontWeight={600}>
              {t("companyPage.replies", "Replies")}
            </Typography>
            <IconButton
              onClick={handleCloseReplies}
              size="small"
              sx={{ ml: 2 }}
              aria-label={t("common.close", { defaultValue: "Close" })}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {replies.map((reply) => (
              <Box key={reply.id}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <Avatar
                    src={reply.author?.photo}
                    sx={{ width: 32, height: 32 }}
                  >
                    {(reply.author?.name || "A").charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {reply.author?.name || t("dashboard.anonymous")}
                    </Typography>
                    {reply.timestamp && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(reply.timestamp).toLocaleDateString()}{" "}
                        {new Date(reply.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    )}
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
                  {reply.text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};
