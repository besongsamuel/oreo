import {
  SentimentDissatisfied as NegativeIcon,
  SentimentNeutral as NeutralIcon,
  SentimentSatisfiedAlt as PositiveIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { PieChart } from "@mui/x-charts/PieChart";

interface SentimentData {
  overallScore: number;
  overallSentiment: string;
  totalReviews: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  byAgeGroup: {
    ageRange: string;
    avgScore: number;
    count: number;
  }[];
  byGender: {
    gender: string;
    avgScore: number;
    count: number;
  }[];
  emotions?: {
    emoji: string;
    count: number;
    percentage: number;
  }[];
}

interface SentimentAnalysisProps {
  sentimentData: SentimentData;
}

export const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({
  sentimentData,
}) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return <PositiveIcon sx={{ color: "success.main" }} />;
      case "negative":
        return <NegativeIcon sx={{ color: "error.main" }} />;
      default:
        return <NeutralIcon sx={{ color: "warning.main" }} />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "success";
      case "negative":
        return "error";
      default:
        return "warning";
    }
  };

  // Convert score from -1 to 1 range to 0 to 100 for gauge
  const gaugeValue = ((sentimentData.overallScore + 1) / 2) * 100;

  // Sentiment distribution data for pie chart
  const sentimentDistribution = [
    {
      id: 0,
      value: sentimentData.positiveCount,
      label: "Positive",
      color: "#4caf50",
    },
    {
      id: 1,
      value: sentimentData.neutralCount,
      label: "Neutral",
      color: "#ff9800",
    },
    {
      id: 2,
      value: sentimentData.negativeCount,
      label: "Negative",
      color: "#f44336",
    },
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Sentiment Analysis
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            AI-powered sentiment insights from {sentimentData.totalReviews}{" "}
            reviews
          </Typography>
        </Box>

        {/* Overall Sentiment Score */}
        <Card variant="outlined" sx={{ bgcolor: "background.default" }}>
          <CardContent>
            <Stack
              direction="row"
              spacing={4}
              alignItems="center"
              flexWrap="wrap"
            >
              {/* Gauge Chart */}
              <Box sx={{ position: "relative" }}>
                <Gauge
                  width={200}
                  height={200}
                  value={gaugeValue}
                  startAngle={-110}
                  endAngle={110}
                  sx={{
                    [`& .${gaugeClasses.valueText}`]: {
                      fontSize: 28,
                      fontWeight: "bold",
                    },
                    [`& .${gaugeClasses.valueArc}`]: {
                      fill:
                        gaugeValue >= 66
                          ? "#4caf50"
                          : gaugeValue >= 33
                          ? "#ff9800"
                          : "#f44336",
                    },
                  }}
                  text={({ value }) => `${Math.round(value || 0)}%`}
                />
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    bottom: 30,
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "text.secondary",
                  }}
                >
                  Sentiment Score
                </Typography>
              </Box>

              {/* Sentiment Details */}
              <Stack spacing={2} sx={{ flexGrow: 1 }}>
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Overall Sentiment
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {getSentimentIcon(sentimentData.overallSentiment)}
                    <Chip
                      label={sentimentData.overallSentiment.toUpperCase()}
                      color={
                        getSentimentColor(sentimentData.overallSentiment) as any
                      }
                      size="medium"
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Sentiment Breakdown */}
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Sentiment Distribution
                  </Typography>
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PositiveIcon
                          sx={{ color: "success.main", fontSize: 18 }}
                        />
                        <Typography variant="body2">Positive</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {sentimentData.positiveCount} (
                        {(
                          (sentimentData.positiveCount /
                            sentimentData.totalReviews) *
                          100
                        ).toFixed(0)}
                        %)
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <NeutralIcon
                          sx={{ color: "warning.main", fontSize: 18 }}
                        />
                        <Typography variant="body2">Neutral</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {sentimentData.neutralCount} (
                        {(
                          (sentimentData.neutralCount /
                            sentimentData.totalReviews) *
                          100
                        ).toFixed(0)}
                        %)
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <NegativeIcon
                          sx={{ color: "error.main", fontSize: 18 }}
                        />
                        <Typography variant="body2">Negative</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {sentimentData.negativeCount} (
                        {(
                          (sentimentData.negativeCount /
                            sentimentData.totalReviews) *
                          100
                        ).toFixed(0)}
                        %)
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>

              {/* Pie Chart */}
              <Box sx={{ minWidth: 250 }}>
                <PieChart
                  series={[
                    {
                      data: sentimentDistribution,
                      highlightScope: { fade: "global", highlight: "item" },
                    },
                  ]}
                  height={200}
                  margin={{ right: 5 }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Emotions Analysis */}
        {sentimentData.emotions && sentimentData.emotions.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Most common emotions expressed in reviews
            </Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {sentimentData.emotions.slice(0, 5).map((item) => (
                <Stack
                  key={item.emoji}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: "background.default",
                    borderRadius: 1,
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h4">{item.emoji}</Typography>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {item.count} occurrences
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.percentage.toFixed(1)}% of reviews
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="h6" fontWeight={600}>
                    {item.count}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
