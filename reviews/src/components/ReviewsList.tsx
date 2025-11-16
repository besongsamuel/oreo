import { FilterList as FilterListIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { ReviewComponent } from "./ReviewComponent";
import { ReviewCardSkeleton } from "./SkeletonLoaders";

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

interface ReviewsListProps {
  reviews: Review[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  selectedKeyword: string;
  selectedRating: string;
  onClearFilters: () => void;
  getSentimentColor: (sentiment: string) => "success" | "error" | "default";
}

export const ReviewsList = ({
  reviews,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  loading,
  selectedKeyword,
  selectedRating,
  onClearFilters,
  getSentimentColor,
}: ReviewsListProps) => {
  const { t } = useTranslation();

  const hasActiveFilters = selectedKeyword !== "all" || selectedRating !== "all";
  const startIndex = (currentPage - 1) * 50 + 1;
  const endIndex = Math.min(currentPage * 50, totalCount);

  if (loading) {
    return (
      <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              {t("companyPage.reviews", "Reviews")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("companyPage.loadingReviews", "Loading reviews...")}
            </Typography>
          </Box>
        </Stack>
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <ReviewCardSkeleton key={i} />
          ))}
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h6" gutterBottom>
            {t("companyPage.reviews", "Reviews")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalCount > 0
              ? t("companyPage.showingReviewsRange", {
                  start: startIndex,
                  end: endIndex,
                  total: totalCount,
                  defaultValue: `Showing ${startIndex}-${endIndex} of ${totalCount} reviews`,
                })
              : t("companyPage.noReviews", "No reviews")}
            {totalPages > 1 &&
              ` • ${t("companyPage.pageOf", {
                current: currentPage,
                total: totalPages,
              })}`}
          </Typography>
        </Box>
        {hasActiveFilters && (
          <Button
            variant="text"
            size="small"
            onClick={onClearFilters}
            sx={{
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            {t("companyPage.clearFilters")}
          </Button>
        )}
      </Stack>

      {totalCount === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <FilterListIcon
            sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t("companyPage.noReviewsMatch")}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            {t("companyPage.noReviewsMatchDescription")}
          </Typography>
          {hasActiveFilters && (
            <Button
              variant="contained"
              onClick={onClearFilters}
              sx={{ borderRadius: 980 }}
            >
              {t("companyPage.clearAllFilters")}
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Stack spacing={2}>
            {reviews.map((review) => (
              <ReviewComponent
                key={review.id}
                review={review}
                getSentimentColor={getSentimentColor}
              />
            ))}
          </Stack>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 1,
                mt: 3,
              }}
            >
              <Button
                variant="outlined"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                sx={{ borderRadius: 980 }}
              >
                {t("companyPage.previous")}
              </Button>
              <Typography variant="body2" color="text.secondary">
                {t("companyPage.pageOfShort", {
                  current: currentPage,
                  total: totalPages,
                })}
              </Typography>
              <Button
                variant="outlined"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                sx={{ borderRadius: 980 }}
              >
                {t("companyPage.next")}
              </Button>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

