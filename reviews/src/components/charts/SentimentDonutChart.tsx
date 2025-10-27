import { Box, Card, Stack, Typography } from "@mui/material";
import Chart from "react-apexcharts";

interface SentimentDonutChartProps {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export const SentimentDonutChart = ({
  positive,
  neutral,
  negative,
  total,
}: SentimentDonutChartProps) => {
  const data = [positive, neutral, negative];
  const labels = ["Positive", "Neutral", "Negative"];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      height: 300,
    },
    labels: labels,
    colors: ["#4caf50", "#ff9800", "#f44336"],
    legend: {
      position: "bottom",
      fontSize: "14px",
      labels: {
        colors: "#000",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        return `${val.toFixed(1)}%`;
      },
      style: {
        fontSize: "14px",
        fontWeight: 600,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "60%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "18px",
              fontWeight: 600,
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: 700,
              formatter: (val: string) => {
                const num = parseFloat(val);
                return `${Math.round((num / 100) * total)}`;
              },
            },
            total: {
              show: true,
              label: "Total Reviews",
              fontSize: "14px",
              fontWeight: 400,
              color: "#666",
              formatter: () => total.toString(),
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => {
          const count = Math.round((val / 100) * total);
          const percentage = ((count / total) * 100).toFixed(1);
          return `${count} review${count !== 1 ? "s" : ""} (${percentage}%)`;
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 250,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  return (
    <Card sx={{ p: 2, borderRadius: "18px", boxShadow: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={600}>
          Sentiment Breakdown
        </Typography>
        <Box sx={{ height: 300 }}>
          <Chart options={options} series={data} type="donut" height={300} />
        </Box>
      </Stack>
    </Card>
  );
};
