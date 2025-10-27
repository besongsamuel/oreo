import { Star as StarIcon } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

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
}

interface ReviewComponentProps {
  review: Review;
  getSentimentColor: (sentiment: string) => "success" | "error" | "default";
}

export const ReviewComponent = ({
  review,
  getSentimentColor,
}: ReviewComponentProps) => {
  return (
    <Card variant="outlined">
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
                  {review.author_name || "Anonymous"}
                </Typography>
                <Chip
                  label={review.platform_name}
                  size="small"
                  variant="outlined"
                />
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
  );
};
