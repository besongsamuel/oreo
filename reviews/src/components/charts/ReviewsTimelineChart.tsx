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
      data: reviewCounts,
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      height: 350,
      type: "line",
      toolbar: { show: false },
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
      },
      selection: {
        enabled: true,
      },
    },
    stroke: {
      width: 3,
      curve: "smooth",
    },
    colors: ["#0071e3"],
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 5,
      strokeWidth: 2,
    },
    legend: {
      show: false,
    },
    xaxis: {
      categories: dates,
      labels: {
        rotate: 0,
        style: {
          fontSize: "12px",
        },
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
        },
        formatter: function (val: number) {
          return Math.floor(val).toString();
        },
      },
    },
    tooltip: {
      enabled: true,
      custom: function ({ seriesIndex, dataPointIndex, w }) {
        const count = w.globals.initialSeries[0].data[dataPointIndex];
        const date = w.globals.labels[dataPointIndex];
        const avgRating = avgRatings[dataPointIndex];

        return `
          <div style="padding: 12px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-weight: 600; margin-bottom: 6px; font-size: 14px;">${date}</div>
            <div style="margin-bottom: 4px; color: #666; font-size: 13px;">${count} ${
          count === 1 ? "review" : "reviews"
        }</div>
            <div style="color: #666; font-size: 13px;">⭐ ${avgRating.toFixed(
              1
            )} avg rating</div>
          </div>
        `;
      },
    },
    grid: {
      borderColor: "#e0e0e0",
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: ["#ffffff"],
        inverseColors: false,
        opacityFrom: 0.3,
        opacityTo: 0.1,
        stops: [0, 100],
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
            Weekly review volume trends
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
