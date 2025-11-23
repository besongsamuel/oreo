import { Close as CloseIcon, Star as StarIcon } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
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

interface KeywordOption {
  id: string;
  text: string;
  category: string;
  current_rating: number;
}

interface TopicOption {
  id: string;
  name: string;
  category: string;
  description?: string;
  current_rating: number;
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

const MAX_KEYWORDS = 3;
const MAX_TOPICS = 3;

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
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchTopic, setSearchTopic] = useState("");

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

  const filteredKeywords = useMemo(() => {
    if (!searchKeyword) return keywords;
    const searchLower = searchKeyword.toLowerCase();
    return keywords.filter(
      (kw) =>
        kw.text.toLowerCase().includes(searchLower) ||
        kw.category.toLowerCase().includes(searchLower)
    );
  }, [keywords, searchKeyword]);

  const filteredTopics = useMemo(() => {
    if (!searchTopic) return topics;
    const searchLower = searchTopic.toLowerCase();
    return topics.filter(
      (topic) =>
        topic.name.toLowerCase().includes(searchLower) ||
        topic.category.toLowerCase().includes(searchLower) ||
        topic.description?.toLowerCase().includes(searchLower)
    );
  }, [topics, searchTopic]);

  const handleKeywordToggle = (keywordId: string) => {
    if (selectedKeywords.includes(keywordId)) {
      onKeywordsChange(selectedKeywords.filter((id) => id !== keywordId));
      // Remove rating when deselected
      if (keywordTargetRatings[keywordId]) {
        onKeywordRatingChange(keywordId, 0);
      }
    } else {
      if (selectedKeywords.length >= MAX_KEYWORDS) {
        return; // Max reached
      }
      onKeywordsChange([...selectedKeywords, keywordId]);
      // Set default target rating to current rating + 0.5 (capped at 5)
      const keyword = keywords.find((k) => k.id === keywordId);
      if (keyword) {
        onKeywordRatingChange(
          keywordId,
          Math.min(keyword.current_rating + 0.5, 5)
        );
      }
    }
  };

  const handleTopicToggle = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      onTopicsChange(selectedTopics.filter((id) => id !== topicId));
      // Remove rating when deselected
      if (topicTargetRatings[topicId]) {
        onTopicRatingChange(topicId, 0);
      }
    } else {
      if (selectedTopics.length >= MAX_TOPICS) {
        return; // Max reached
      }
      onTopicsChange([...selectedTopics, topicId]);
      // Set default target rating to current rating + 0.5 (capped at 5)
      const topic = topics.find((t) => t.id === topicId);
      if (topic) {
        onTopicRatingChange(topicId, Math.min(topic.current_rating + 0.5, 5));
      }
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "success";
    if (rating >= 3) return "warning";
    return "error";
  };

  // Get selected keyword and topic details
  const selectedKeywordDetails = useMemo(() => {
    const details: Array<KeywordOption & { targetRating: number }> = [];
    selectedKeywords.forEach((keywordId) => {
      const keyword = keywords.find((k) => k.id === keywordId);
      if (keyword) {
        details.push({
          ...keyword,
          targetRating: keywordTargetRatings[keywordId] || 0,
        });
      }
    });
    return details;
  }, [selectedKeywords, keywords, keywordTargetRatings]);

  const selectedTopicDetails = useMemo(() => {
    const details: Array<TopicOption & { targetRating: number }> = [];
    selectedTopics.forEach((topicId) => {
      const topic = topics.find((t) => t.id === topicId);
      if (topic) {
        details.push({
          ...topic,
          targetRating: topicTargetRatings[topicId] || 0,
        });
      }
    });
    return details;
  }, [selectedTopics, topics, topicTargetRatings]);

  return (
    <Stack spacing={3}>
      {/* Selected Keywords Section */}
      {selectedKeywordDetails.length > 0 && (
        <Card
          variant="outlined"
          sx={{ bgcolor: "primary.50", borderColor: "primary.main" }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" gutterBottom>
                {t("objectives.selectedKeywords", "Selected Keywords")}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {selectedKeywordDetails.map((keyword) => (
                  <Chip
                    key={keyword.id}
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={600}>
                          {keyword.text}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({t("objectives.targetRating", "Target")}:{" "}
                          {keyword.targetRating.toFixed(1)})
                        </Typography>
                      </Stack>
                    }
                    onDelete={() => handleKeywordToggle(keyword.id)}
                    deleteIcon={<CloseIcon />}
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Selected Topics Section */}
      {selectedTopicDetails.length > 0 && (
        <Card
          variant="outlined"
          sx={{ bgcolor: "primary.50", borderColor: "primary.main" }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" gutterBottom>
                {t("objectives.selectedTopics", "Selected Topics")}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {selectedTopicDetails.map((topic) => (
                  <Chip
                    key={topic.id}
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={600}>
                          {topic.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({t("objectives.targetRating", "Target")}:{" "}
                          {topic.targetRating.toFixed(1)})
                        </Typography>
                      </Stack>
                    }
                    onDelete={() => handleTopicToggle(topic.id)}
                    deleteIcon={<CloseIcon />}
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Keywords Section */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {t("objectives.keywords", "Keywords")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("objectives.keywordsDescription", {
                  selected: selectedKeywords.length,
                  max: MAX_KEYWORDS,
                  defaultValue:
                    "Select up to {{max}} keywords ({{selected}}/{{max}} selected)",
                })}
              </Typography>
            </Box>

            {selectedKeywords.length < MAX_KEYWORDS && (
              <TextField
                size="small"
                placeholder={t(
                  "objectives.searchKeywords",
                  "Search keywords..."
                )}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                fullWidth
              />
            )}

            <Stack spacing={1} sx={{ maxHeight: 300, overflowY: "auto" }}>
              {filteredKeywords.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("objectives.noKeywords", "No keywords available")}
                </Typography>
              ) : (
                filteredKeywords.map((keyword) => {
                  const isSelected = selectedKeywords.includes(keyword.id);
                  const isDisabled =
                    !isSelected && selectedKeywords.length >= MAX_KEYWORDS;

                  return (
                    <Box key={keyword.id}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleKeywordToggle(keyword.id)}
                            disabled={isDisabled}
                          />
                        }
                        label={
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ width: "100%" }}
                          >
                            <Typography variant="body2">
                              {keyword.text}
                            </Typography>
                            <Chip
                              label={keyword.category}
                              size="small"
                              variant="outlined"
                            />
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              sx={{ ml: "auto" }}
                            >
                              <StarIcon
                                sx={{
                                  fontSize: 16,
                                  color: `${getRatingColor(
                                    keyword.current_rating
                                  )}.main`,
                                }}
                              />
                              <Typography variant="body2" fontWeight={600}>
                                {keyword.current_rating.toFixed(1)}
                              </Typography>
                            </Stack>
                          </Stack>
                        }
                      />
                      {isSelected && (
                        <Box sx={{ ml: 4, mt: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            label={t(
                              "objectives.targetRating",
                              "Target Rating"
                            )}
                            value={keywordTargetRatings[keyword.id] || ""}
                            onChange={(e) =>
                              onKeywordRatingChange(
                                keyword.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            inputProps={{
                              min: 0,
                              max: 5,
                              step: 0.1,
                            }}
                            sx={{ width: 150 }}
                          />
                        </Box>
                      )}
                    </Box>
                  );
                })
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Topics Section */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {t("objectives.topics", "Topics")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("objectives.topicsDescription", {
                  selected: selectedTopics.length,
                  max: MAX_TOPICS,
                  defaultValue:
                    "Select up to {{max}} topics ({{selected}}/{{max}} selected)",
                })}
              </Typography>
            </Box>

            {selectedTopics.length < MAX_TOPICS && (
              <TextField
                size="small"
                placeholder={t("objectives.searchTopics", "Search topics...")}
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                fullWidth
              />
            )}

            <Stack spacing={1} sx={{ maxHeight: 300, overflowY: "auto" }}>
              {filteredTopics.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("objectives.noTopics", "No topics available")}
                </Typography>
              ) : (
                filteredTopics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  const isDisabled =
                    !isSelected && selectedTopics.length >= MAX_TOPICS;

                  return (
                    <Box key={topic.id}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleTopicToggle(topic.id)}
                            disabled={isDisabled}
                          />
                        }
                        label={
                          <Stack spacing={0.5} sx={{ width: "100%" }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {topic.name}
                              </Typography>
                              <Chip
                                label={topic.category}
                                size="small"
                                variant="outlined"
                                color={
                                  topic.category === "satisfaction"
                                    ? "success"
                                    : topic.category === "dissatisfaction"
                                    ? "error"
                                    : "default"
                                }
                              />
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                sx={{ ml: "auto" }}
                              >
                                <StarIcon
                                  sx={{
                                    fontSize: 16,
                                    color: `${getRatingColor(
                                      topic.current_rating
                                    )}.main`,
                                  }}
                                />
                                <Typography variant="body2" fontWeight={600}>
                                  {topic.current_rating.toFixed(1)}
                                </Typography>
                              </Stack>
                            </Stack>
                            {topic.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {topic.description}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                      {isSelected && (
                        <Box sx={{ ml: 4, mt: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            label={t(
                              "objectives.targetRating",
                              "Target Rating"
                            )}
                            value={topicTargetRatings[topic.id] || ""}
                            onChange={(e) =>
                              onTopicRatingChange(
                                topic.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            inputProps={{
                              min: 0,
                              max: 5,
                              step: 0.1,
                            }}
                            sx={{ width: 150 }}
                          />
                        </Box>
                      )}
                    </Box>
                  );
                })
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};
