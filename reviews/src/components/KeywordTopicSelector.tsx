import { Close as CloseIcon, Star as StarIcon } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface EnrichedReview {
  id: string;
  rating: number;
  keywords: Array<{
    id: string;
    text: string;
    category: string;
  }>;
  topics: Array<{
    id: string;
    name: string;
    category: string;
    description?: string;
  }>;
  published_at: string;
}

interface UnifiedOption {
  id: string;
  name: string;
  type: "keyword" | "topic";
  category: string;
  current_rating: number;
  description?: string;
}

interface KeywordTopicSelectorProps {
  enrichedReviews: EnrichedReview[];
  selectedKeywords: string[];
  selectedTopics: string[];
  onKeywordsChange: (keywordIds: string[]) => void;
  onTopicsChange: (topicIds: string[]) => void;
  keywordTargetRatings: Record<string, number>;
  topicTargetRatings: Record<string, number>;
  onKeywordRatingChange: (keywordId: string, rating: number) => void;
  onTopicRatingChange: (topicId: string, rating: number) => void;
}

const MAX_SELECTIONS = 5;

export const KeywordTopicSelector = ({
  enrichedReviews,
  selectedKeywords,
  selectedTopics,
  onKeywordsChange,
  onTopicsChange,
  keywordTargetRatings,
  topicTargetRatings,
  onKeywordRatingChange,
  onTopicRatingChange,
}: KeywordTopicSelectorProps) => {
  const { t } = useTranslation();
  const [autocompleteValue, setAutocompleteValue] =
    useState<UnifiedOption | null>(null);

  // Use all enriched reviews (filtering will be done by parent component with timespan)
  const filteredReviews = enrichedReviews;

  // Compute keywords with average ratings from enrichedReviews
  const keywords = useMemo(() => {
    const keywordMap = new Map<
      string,
      { id: string; text: string; category: string; ratings: number[] }
    >();

    filteredReviews.forEach((review) => {
      review.keywords.forEach((keyword) => {
        const existing = keywordMap.get(keyword.id);
        if (existing) {
          existing.ratings.push(review.rating);
        } else {
          keywordMap.set(keyword.id, {
            id: keyword.id,
            text: keyword.text,
            category: keyword.category || "other",
            ratings: [review.rating],
          });
        }
      });
    });

    return Array.from(keywordMap.values())
      .map((kw) => ({
        id: kw.id,
        text: kw.text,
        category: kw.category,
        current_rating:
          kw.ratings.reduce((sum, r) => sum + r, 0) / kw.ratings.length,
      }))
      .filter((kw) => kw.current_rating > 0)
      .sort((a, b) => b.current_rating - a.current_rating);
  }, [filteredReviews]);

  // Compute topics with average ratings from enrichedReviews
  const topics = useMemo(() => {
    const topicMap = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        description?: string;
        ratings: number[];
      }
    >();

    filteredReviews.forEach((review) => {
      review.topics.forEach((topic) => {
        const existing = topicMap.get(topic.id);
        if (existing) {
          existing.ratings.push(review.rating);
        } else {
          topicMap.set(topic.id, {
            id: topic.id,
            name: topic.name,
            category: topic.category || "neutral",
            description: topic.description,
            ratings: [review.rating],
          });
        }
      });
    });

    return Array.from(topicMap.values())
      .map((topic) => ({
        id: topic.id,
        name: topic.name,
        category: topic.category,
        description: topic.description,
        current_rating:
          topic.ratings.reduce((sum, r) => sum + r, 0) / topic.ratings.length,
      }))
      .filter((topic) => topic.current_rating > 0)
      .sort((a, b) => b.current_rating - a.current_rating);
  }, [filteredReviews]);

  // Create unified options array, filtering duplicates (keyword takes precedence)
  const unifiedOptions = useMemo(() => {
    const keywordOptions: UnifiedOption[] = keywords.map((kw) => ({
      id: kw.id,
      name: kw.text,
      type: "keyword" as const,
      category: kw.category,
      current_rating: kw.current_rating,
    }));

    const topicOptions: UnifiedOption[] = topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      type: "topic" as const,
      category: topic.category,
      current_rating: topic.current_rating,
      description: topic.description,
    }));

    // Create a set of keyword names (case-insensitive) for duplicate checking
    const keywordNames = new Set(
      keywordOptions.map((kw) => kw.name.toLowerCase())
    );

    // Filter out topics that have the same name as a keyword
    const filteredTopicOptions = topicOptions.filter(
      (topic) => !keywordNames.has(topic.name.toLowerCase())
    );

    // Combine and sort by rating
    return [...keywordOptions, ...filteredTopicOptions].sort(
      (a, b) => b.current_rating - a.current_rating
    );
  }, [keywords, topics]);

  // Get selected items details (combined keywords and topics)
  const selectedItems = useMemo(() => {
    const items: Array<UnifiedOption & { targetRating: number }> = [];

    // Add selected keywords
    selectedKeywords.forEach((keywordId) => {
      const option = unifiedOptions.find(
        (opt) => opt.id === keywordId && opt.type === "keyword"
      );
      if (option) {
        items.push({
          ...option,
          targetRating: keywordTargetRatings[keywordId] || 0,
        });
      }
    });

    // Add selected topics
    selectedTopics.forEach((topicId) => {
      const option = unifiedOptions.find(
        (opt) => opt.id === topicId && opt.type === "topic"
      );
      if (option) {
        items.push({
          ...option,
          targetRating: topicTargetRatings[topicId] || 0,
        });
      }
    });

    return items;
  }, [
    selectedKeywords,
    selectedTopics,
    unifiedOptions,
    keywordTargetRatings,
    topicTargetRatings,
  ]);

  const totalSelections = selectedKeywords.length + selectedTopics.length;
  const maxReached = totalSelections >= MAX_SELECTIONS;

  const handleOptionSelect = (option: UnifiedOption | null) => {
    if (!option) return;

    // Check if already selected
    const isKeywordSelected =
      option.type === "keyword" && selectedKeywords.includes(option.id);
    const isTopicSelected =
      option.type === "topic" && selectedTopics.includes(option.id);

    if (isKeywordSelected || isTopicSelected) {
      // Already selected, do nothing
      setAutocompleteValue(null);
      return;
    }

    // Check max selections
    if (maxReached) {
      setAutocompleteValue(null);
      return;
    }

    // Add to appropriate array
    if (option.type === "keyword") {
      onKeywordsChange([...selectedKeywords, option.id]);
      // Set default target rating to current rating + 0.5 (capped at 5)
      onKeywordRatingChange(
        option.id,
        Math.min(option.current_rating + 0.5, 5)
      );
    } else {
      onTopicsChange([...selectedTopics, option.id]);
      // Set default target rating to current rating + 0.5 (capped at 5)
      onTopicRatingChange(option.id, Math.min(option.current_rating + 0.5, 5));
    }

    // Clear autocomplete
    setAutocompleteValue(null);
  };

  const handleRemoveItem = (item: UnifiedOption & { targetRating: number }) => {
    if (item.type === "keyword") {
      onKeywordsChange(selectedKeywords.filter((id) => id !== item.id));
      if (keywordTargetRatings[item.id]) {
        onKeywordRatingChange(item.id, 0);
      }
    } else {
      onTopicsChange(selectedTopics.filter((id) => id !== item.id));
      if (topicTargetRatings[item.id]) {
        onTopicRatingChange(item.id, 0);
      }
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "success";
    if (rating >= 3) return "warning";
    return "error";
  };

  // Filter out already selected options
  const availableOptions = useMemo(() => {
    return unifiedOptions.filter((opt) => {
      if (opt.type === "keyword") {
        return !selectedKeywords.includes(opt.id);
      } else {
        return !selectedTopics.includes(opt.id);
      }
    });
  }, [unifiedOptions, selectedKeywords, selectedTopics]);

  return (
    <Stack spacing={3}>
      {/* Autocomplete Dropdown */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {t(
                  "objectives.selectKeywordOrTopic",
                  "Select Keyword or Topic"
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("objectives.selectDescription", {
                  selected: totalSelections,
                  max: MAX_SELECTIONS,
                  defaultValue:
                    "Select up to {{max}} keywords or topics ({{selected}}/{{max}} selected)",
                })}
              </Typography>
            </Box>

            <Autocomplete
              value={autocompleteValue}
              onChange={(_, newValue) => {
                setAutocompleteValue(newValue);
                if (newValue) {
                  handleOptionSelect(newValue);
                }
              }}
              options={availableOptions}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) =>
                option.type === value.type && option.id === value.id
              }
              disabled={maxReached}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={
                    maxReached
                      ? t(
                          "objectives.maxSelectionsReached",
                          "Maximum 5 selections reached"
                        )
                      : t(
                          "objectives.searchKeywordOrTopic",
                          "Search keywords or topics..."
                        )
                  }
                  size="small"
                />
              )}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  key={`${option.type}-${option.id}`}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ width: "100%" }}
                  >
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {option.name}
                    </Typography>
                    <Chip
                      label={
                        option.type === "keyword"
                          ? t("objectives.typeKeyword", "Keyword")
                          : t("objectives.typeTopic", "Topic")
                      }
                      size="small"
                      variant="outlined"
                      color={
                        option.type === "keyword" ? "primary" : "secondary"
                      }
                    />
                    <Chip
                      label={option.category}
                      size="small"
                      variant="outlined"
                    />
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <StarIcon
                        sx={{
                          fontSize: 16,
                          color: `${getRatingColor(
                            option.current_rating
                          )}.main`,
                        }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {option.current_rating.toFixed(1)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              )}
            />

            {maxReached && (
              <Typography variant="body2" color="warning.main">
                {t(
                  "objectives.maxSelectionsReached",
                  "Maximum 5 selections reached"
                )}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Selected Items List */}
      {selectedItems.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="h6" gutterBottom>
                {t("objectives.selectedItems", "Selected Items")}
              </Typography>
              <Stack spacing={1} sx={{ maxHeight: 400, overflowY: "auto" }}>
                {selectedItems.map((item) => (
                  <Box
                    key={`${item.type}-${item.id}`}
                    sx={{
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1.5,
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                        flexWrap="wrap"
                        gap={1}
                      >
                        <Stack
                          direction="row"
                          spacing={0.75}
                          alignItems="center"
                          flexWrap="wrap"
                          sx={{ flex: 1, minWidth: 0 }}
                        >
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {item.name}
                          </Typography>
                          <Chip
                            label={
                              item.type === "keyword"
                                ? t("objectives.typeKeyword", "Keyword")
                                : t("objectives.typeTopic", "Topic")
                            }
                            size="small"
                            variant="outlined"
                            color={
                              item.type === "keyword" ? "primary" : "secondary"
                            }
                            sx={{ height: 24 }}
                          />
                          <Chip
                            label={item.category}
                            size="small"
                            variant="outlined"
                            sx={{ height: 24 }}
                          />
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <StarIcon
                              sx={{
                                fontSize: 14,
                                color: `${getRatingColor(
                                  item.current_rating
                                )}.main`,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.current_rating.toFixed(1)}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexShrink={0}
                        >
                          <TextField
                            size="small"
                            type="number"
                            label={t("objectives.targetRating", "Target")}
                            value={item.targetRating || ""}
                            onChange={(e) => {
                              const rating = parseFloat(e.target.value) || 0;
                              if (item.type === "keyword") {
                                onKeywordRatingChange(item.id, rating);
                              } else {
                                onTopicRatingChange(item.id, rating);
                              }
                            }}
                            inputProps={{
                              min: 0,
                              max: 5,
                              step: 0.1,
                            }}
                            sx={{ width: 100 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItem(item)}
                            sx={{ color: "error.main" }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                      {item.description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.7rem", lineHeight: 1.3 }}
                        >
                          {item.description}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {selectedItems.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", py: 4 }}
        >
          {t(
            "objectives.noItemsSelected",
            "No items selected. Use the dropdown above to add keywords or topics."
          )}
        </Typography>
      )}
    </Stack>
  );
};
