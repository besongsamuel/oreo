import { Box, Card, Stack, Typography } from "@mui/material";
import Chart from "react-apexcharts";

interface ReviewDataPoint {
  date: string;
  count: number;
  avgRating: number;
  positive: number;
  negative: number;
}

interface ReviewsTimelineChartProps {
  data: ReviewDataPoint[];
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

export const ReviewsTimelineChart = ({
  data,
  onDateRangeChange,
}: ReviewsTimelineChartProps) => {
  const dates = data.map((d) => d.date);
  const reviewCounts = data.map((d) => d.count);
  const avgRatings = data.map((d) => d.avgRating);

  const series = [
    {
      name: "Reviews",
      type: "column",
      data: reviewCounts,
    },
    {
      name: "Avg Rating",
      type: "line",
      data: avgRatings,
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      height: 350,
      type: "line",
      toolbar: { show: true },
      zoom: {
        enabled: true,
      },
    },
    stroke: {
      width: [0, 4],
      curve: "smooth",
    },
    colors: ["#0071e3", "#ff9800"],
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
      strokeWidth: 2,
    },
    legend: {
      show: true,
      position: "top",
    },
    xaxis: {
      categories: dates,
      labels: {
        rotate: -45,
        style: {
          fontSize: "10px",
        },
      },
    },
    yaxis: [
      {
        title: {
          text: "Number of Reviews",
        },
      },
      {
        opposite: true,
        title: {
          text: "Average Rating",
        },
        min: 0,
        max: 5,
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      custom: function ({ seriesIndex, dataPointIndex, w }) {
        const data = w.globals.initialSeries[0].data[dataPointIndex];
        const rating = w.globals.initialSeries[1].data[dataPointIndex];
        const date = w.globals.labels[dataPointIndex];

        return `
          <div style="padding: 8px;">
            <div><strong>${date}</strong></div>
            <div>Reviews: ${data}</div>
            <div>Avg Rating: ${rating?.toFixed(1)} ⭐</div>
          </div>
        `;
      },
    },
    grid: {
      borderColor: "#f0f0f0",
      strokeDashArray: 3,
    },
    plotOptions: {
      bar: {
        columnWidth: "60%",
        borderRadius: 8,
      },
    },
  };

  return (
    <Card sx={{ p: 2, borderRadius: "18px", boxShadow: 2 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Reviews Over Time
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review volume and average rating trends
          </Typography>
        </Box>
        <Box sx={{ height: 350 }}>
          {data.length > 0 ? (
            <Chart options={options} series={series} type="line" height={350} />
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ height: "100%", color: "text.secondary" }}
            >
              <Typography variant="body2">
                No timeline data available
              </Typography>
            </Stack>
          )}
        </Box>
      </Stack>
    </Card>
  );
};
