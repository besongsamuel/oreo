import {
  CheckCircle as CheckCircleIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import Chart from "react-apexcharts";
import { useTranslation } from "react-i18next";

interface ObjectiveStatusIndicatorProps {
  target: number;
  current: number;
  label: string;
  type?: "rating" | "keyword" | "topic" | "sentiment";
  showProgress?: boolean;
}

export const ObjectiveStatusIndicator = ({
  target,
  current,
  label,
  type = "rating",
  showProgress = true,
}: ObjectiveStatusIndicatorProps) => {
  const { t } = useTranslation();

  // Convert sentiment scores to 1-100 scale for display
  const displayCurrent = type === "sentiment" 
    ? ((current + 1) / 2) * 99 + 1  // -1 -> 1, 0 -> 50.5, 1 -> 100
    : current;
  const displayTarget = type === "sentiment"
    ? ((target + 1) / 2) * 99 + 1  // -1 -> 1, 0 -> 50.5, 1 -> 100
    : target;

  // Calculate progress percentage
  // For sentiment scores (-1 to 1), normalize to 0-1 range first
  let progressPercentage = 0;
  if (type === "sentiment") {
    // Normalize sentiment scores from -1 to 1 range to 0 to 1 range
    const normalizedCurrent = (current + 1) / 2; // -1 -> 0, 0 -> 0.5, 1 -> 1
    const normalizedTarget = (target + 1) / 2;
    if (normalizedTarget > 0) {
      progressPercentage = Math.min((normalizedCurrent / normalizedTarget) * 100, 100);
    }
  } else {
    // For ratings (0-5 range)
    progressPercentage =
      target > 0 ? Math.min((current / target) * 100, 100) : 0;
  }

  // Determine status indicator
  let statusIndicator: "on_track" | "close" | "off_track" | "far";
  let icon;
  let color: "success" | "warning" | "error" | "info";

  if (current >= target) {
    statusIndicator = "on_track";
    icon = <CheckCircleIcon />;
    color = "success";
  } else if (progressPercentage >= 90) {
    statusIndicator = "on_track";
    icon = <TrendingUpIcon />;
    color = "success";
  } else if (progressPercentage >= 70) {
    statusIndicator = "close";
    icon = <TrendingUpIcon />;
    color = "warning";
  } else if (progressPercentage >= 50) {
    statusIndicator = "off_track";
    icon = <TrendingDownIcon />;
    color = "warning";
  } else {
    statusIndicator = "far";
    icon = <WarningIcon />;
    color = "error";
  }

  const getProgressColor = () => {
    if (progressPercentage >= 90) return "success";
    if (progressPercentage >= 70) return "warning";
    if (progressPercentage >= 50) return "warning";
    return "error";
  };

  const getChartColor = () => {
    if (progressPercentage >= 90) return "#4caf50";
    if (progressPercentage >= 70) return "#ff9800";
    if (progressPercentage >= 50) return "#ff9800";
    return "#f44336";
  };

  const chartColor = getChartColor();
  const remainingPercentage = 100 - progressPercentage;

  const chartOptions = {
    chart: {
      type: "donut" as const,
      width: 90,
      height: 90,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: false,
    },
    colors: [chartColor, "#e0e0e0"],
    tooltip: {
      enabled: false,
    },
    legend: {
      show: false,
    },
  };

  const chartSeries = [progressPercentage, remainingPercentage];

  return (
    <Box sx={{ py: 0.5 }}>
      <Stack direction="column" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
        {/* Icon and Chart */}
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <Box
            sx={{
              color: `${color}.main`,
              display: "flex",
              alignItems: "center",
              minWidth: 24,
            }}
          >
            {icon}
          </Box>
          {showProgress && (
            <Box
              sx={{
                width: 90,
                height: 90,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="donut"
                width={90}
                height={90}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color={chartColor}
                  sx={{ fontSize: "0.75rem", lineHeight: 1 }}
                >
                  {progressPercentage.toFixed(0)}%
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>

        {/* Label and Values */}
        <Stack spacing={0.5} sx={{ width: "100%", alignItems: "center" }}>
          <Typography variant="body2" fontWeight={600} textAlign="center">
            {label}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
              {t("objectives.current", "Current")}:{" "}
              <Box 
                component="span" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: "0.95rem",
                  color: "primary.main",
                  fontFamily: "inherit"
                }}
              >
                {displayCurrent.toFixed(type === "sentiment" ? 0 : 2)}
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
              {t("objectives.target", "Target")}:{" "}
              <Box 
                component="span" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: "0.9rem",
                  color: "text.secondary",
                  fontStyle: "italic"
                }}
              >
                {displayTarget.toFixed(type === "sentiment" ? 0 : 2)}
              </Box>
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

