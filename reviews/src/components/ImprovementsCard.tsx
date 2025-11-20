import {
  CalendarToday as CalendarTodayIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  PriorityHigh as PriorityHighIcon,
  TrendingDown as TrendingDownIcon,
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
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  keywordCount?: number;
  topicCount?: number;
}

interface ImprovementsCardProps {
  negativeReviewsCount: number;
  negativeReviewsPercentage: number;
  totalReviews: number;
  recommendations: Recommendation[];
  onFilterNegativeReviews: () => void;
  dateRange?: string;
}

export const ImprovementsCard = ({
  negativeReviewsCount,
  negativeReviewsPercentage,
  totalReviews,
  recommendations,
  onFilterNegativeReviews,
  dateRange,
}: ImprovementsCardProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const topRecommendations = recommendations.slice(0, 5);
  const hasMoreRecommendations = recommendations.length > 5;

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
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

  const getCategoryLabel = (category: string) => {
    return t(`improvementsCard.category.${category}`, category);
  };

  const getPriorityLabel = (priority: "high" | "medium" | "low") => {
    return t(`improvementsCard.priority.${priority}`, priority);
  };

  if (negativeReviewsCount === 0) {
    return null;
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: "error.light",
        bgcolor: "error.light",
        background:
          "linear-gradient(to bottom, rgba(211, 47, 47, 0.05), rgba(211, 47, 47, 0.02))",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="flex-start"
              justifyContent="space-between"
            >
              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <TrendingDownIcon sx={{ color: "error.main" }} />
                  <Typography variant="h6" fontWeight={600}>
                    {t("improvementsCard.title", "Areas for Improvement")}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {t(
                    "improvementsCard.subtitle",
                    "Key insights from negative reviews"
                  )}
                </Typography>
              </Box>
            </Stack>

            {/* Date Range Highlight */}
            {dateRange && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  border: 1,
                  borderColor: "primary.dark",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  boxShadow: 1,
                }}
              >
                <CalendarTodayIcon
                  sx={{
                    color: "primary.contrastText",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "primary.contrastText",
                    fontWeight: 600,
                    flex: 1,
                  }}
                >
                  {t("improvementsCard.basedOnDateRange", {
                    dateRange,
                    defaultValue: "Based on {{dateRange}}",
                  })}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Summary Stats */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 2,
            }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t("improvementsCard.negativeReviewsCount", "Negative Reviews")}
              </Typography>
              <Typography variant="h4" fontWeight={600} color="error.main">
                {negativeReviewsCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("improvementsCard.outOfTotal", {
                  total: totalReviews,
                  defaultValue: "out of {{total}} reviews",
                })}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t("improvementsCard.negativeReviewsPercentage", "Percentage")}
              </Typography>
              <Typography variant="h4" fontWeight={600} color="error.main">
                {negativeReviewsPercentage.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("improvementsCard.ofAllReviews", "of all reviews")}
              </Typography>
            </Box>
          </Box>

          {/* Top Priorities */}
          {topRecommendations.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {t("improvementsCard.topPriorities", "Top Priorities")}
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {topRecommendations.map((rec, index) => (
                  <Box
                    key={rec.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      border: 1,
                      borderColor: "divider",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        boxShadow: 1,
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                        flexWrap="wrap"
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PriorityHighIcon
                            sx={{
                              color: `${getPriorityColor(rec.priority)}.main`,
                              fontSize: 20,
                            }}
                          />
                          <Typography variant="subtitle2" fontWeight={600}>
                            {rec.title}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip
                            label={getCategoryLabel(rec.category)}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={getPriorityLabel(rec.priority)}
                            size="small"
                            color={getPriorityColor(rec.priority)}
                          />
                        </Stack>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {rec.description}
                      </Typography>
                      {(rec.keywordCount || rec.topicCount) && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          {rec.keywordCount && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {t("improvementsCard.mentionedInKeywords", {
                                count: rec.keywordCount,
                                defaultValue:
                                  "Mentioned in {{count}} keyword{{s}}",
                              })}
                            </Typography>
                          )}
                          {rec.topicCount && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {t("improvementsCard.mentionedInTopics", {
                                count: rec.topicCount,
                                defaultValue: "{{count}} topic{{s}}",
                              })}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Expandable Recommendations by Category */}
          {hasMoreRecommendations && (
            <Accordion
              expanded={expanded}
              onChange={(_, isExpanded) => setExpanded(isExpanded)}
              sx={{
                boxShadow: "none",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                "&:before": {
                  display: "none",
                },
                "&.Mui-expanded": {
                  margin: 0,
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 2,
                  py: 1.5,
                  "& .MuiAccordionSummary-content": {
                    margin: 0,
                    alignItems: "center",
                  },
                }}
              >
                <Typography variant="body2" fontWeight={500}>
                  {expanded
                    ? t(
                        "improvementsCard.hideRecommendations",
                        "Hide All Recommendations"
                      )
                    : t(
                        "improvementsCard.viewAllRecommendations",
                        "View All Recommendations"
                      )}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pb: 2 }}>
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    color="text.secondary"
                    gutterBottom
                    sx={{ mb: 2 }}
                  >
                    {t(
                      "improvementsCard.recommendationsByCategory",
                      "Recommendations by Category"
                    )}
                  </Typography>
                  <Stack spacing={2}>
                    {Object.entries(
                      recommendations.reduce((acc, rec) => {
                        if (!acc[rec.category]) {
                          acc[rec.category] = [];
                        }
                        acc[rec.category].push(rec);
                        return acc;
                      }, {} as Record<string, Recommendation[]>)
                    ).map(([category, recs]) => (
                      <Box key={category}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ mb: 1, textTransform: "capitalize" }}
                        >
                          {getCategoryLabel(category)}
                        </Typography>
                        <Stack spacing={1}>
                          {recs.map((rec) => (
                            <Box
                              key={rec.id}
                              sx={{
                                p: 1.5,
                                borderRadius: 1,
                                bgcolor: "grey.50",
                                border: 1,
                                borderColor: "divider",
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                justifyContent="space-between"
                                flexWrap="wrap"
                              >
                                <Typography variant="body2" fontWeight={500}>
                                  {rec.title}
                                </Typography>
                                <Chip
                                  label={getPriorityLabel(rec.priority)}
                                  size="small"
                                  color={getPriorityColor(rec.priority)}
                                />
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.5, display: "block" }}
                              >
                                {rec.description}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Action Button */}
          <Button
            variant="contained"
            color="error"
            startIcon={<FilterListIcon />}
            onClick={onFilterNegativeReviews}
            fullWidth
            sx={{
              borderRadius: "980px",
              textTransform: "none",
              fontWeight: 600,
              py: 1.5,
            }}
          >
            {t(
              "improvementsCard.filterNegativeReviews",
              "View Negative Reviews"
            )}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};
