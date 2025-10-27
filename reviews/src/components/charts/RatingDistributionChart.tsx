import { Box, Card, Stack, Typography } from "@mui/material";
import Chart from "react-apexcharts";

interface RatingDistributionChartProps {
  ratings: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  totalReviews: number;
  onRatingClick?: (rating: number) => void;
}

export const RatingDistributionChart = ({
  ratings,
  totalReviews,
  onRatingClick,
}: RatingDistributionChartProps) => {
  const data = [
    {
      rating: 5,
      count: ratings[5],
      percentage: (ratings[5] / totalReviews) * 100,
    },
    {
      rating: 4,
      count: ratings[4],
      percentage: (ratings[4] / totalReviews) * 100,
    },
    {
      rating: 3,
      count: ratings[3],
      percentage: (ratings[3] / totalReviews) * 100,
    },
    {
      rating: 2,
      count: ratings[2],
      percentage: (ratings[2] / totalReviews) * 100,
    },
    {
      rating: 1,
      count: ratings[1],
      percentage: (ratings[1] / totalReviews) * 100,
    },
  ].filter((d) => d.count > 0);

  const getStarColor = (rating: number) => {
    if (rating >= 4) return "#4caf50";
    if (rating >= 3) return "#ff9800";
    return "#f44336";
  };

  // For horizontal bar chart, create single series with all data points
  const series = [
    {
      name: "Reviews",
      data: data.map((d) => d.count),
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      height: 250,
      toolbar: { show: false },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          if (
            config.dataPointIndex >= 0 &&
            config.dataPointIndex < data.length
          ) {
            const rating = data[config.dataPointIndex].rating;
            onRatingClick?.(rating);
          }
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "70%",
        distributed: true,
        borderRadius: 8,
      },
    },
    colors: data.map((d) => getStarColor(d.rating)),
    dataLabels: {
      enabled: true,
      formatter: (val: number) =>
        `${val} (${((val / totalReviews) * 100).toFixed(1)}%)`,
      style: {
        fontSize: "12px",
        fontWeight: 600,
      },
    },
    xaxis: {
      categories: data.map(
        (d) => `${d.rating} Star${d.rating !== 1 ? "s" : ""}`
      ),
    },
    yaxis: {
      show: false,
    },
    tooltip: {
      y: {
        formatter: (val: number) =>
          `${val} review${val !== 1 ? "s" : ""} (${(
            (val / totalReviews) *
            100
          ).toFixed(1)}%)`,
      },
    },
    grid: {
      borderColor: "#f0f0f0",
      strokeDashArray: 3,
    },
  };

  return (
    <Card sx={{ p: 2, borderRadius: "18px", boxShadow: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={600}>
          Rating Distribution
        </Typography>
        <Box sx={{ height: 250 }}>
          <Chart options={options} series={series} type="bar" height={250} />
        </Box>
        {data.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ py: 4 }}
          >
            No rating data available
          </Typography>
        )}
      </Stack>
    </Card>
  );
};
