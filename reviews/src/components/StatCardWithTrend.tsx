import { TrendingDown, TrendingUp } from "@mui/icons-material";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

interface StatCardWithTrendProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive?: boolean;
    period?: string;
  };
  icon?: React.ReactNode;
  color?: string;
  sparkline?: number[];
}

export const StatCardWithTrend = ({
  title,
  value,
  trend,
  icon,
  color = "primary",
  sparkline,
}: StatCardWithTrendProps) => {
  const TrendIcon = trend?.isPositive ? TrendingUp : TrendingDown;
  const trendColor = trend?.isPositive ? "success.main" : "error.main";

  return (
    <Card
      sx={{
        borderRadius: "18px",
        boxShadow: 2,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color }}>
                {typeof value === "number" ? value.toLocaleString() : value}
              </Typography>
            </Box>
            {icon && (
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "12px",
                  bgcolor: `${color}.light`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: `${color}.main`,
                }}
              >
                {icon}
              </Box>
            )}
          </Box>

          {trend && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <TrendIcon sx={{ color: trendColor, fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ color: trendColor, fontWeight: 600 }}
              >
                {Math.abs(trend.value).toFixed(1)}%
              </Typography>
              {trend.period && (
                <Typography variant="caption" color="text.secondary">
                  vs {trend.period}
                </Typography>
              )}
            </Box>
          )}

          {sparkline && sparkline.length > 0 && (
            <Box sx={{ height: 30, mt: 1 }}>
              <svg width="100%" height="30" style={{ overflow: "visible" }}>
                <polyline
                  points={sparkline
                    .map((val, idx) => {
                      const x = (idx / (sparkline.length - 1 || 1)) * 100;
                      const y = 25 - (val / Math.max(...sparkline)) * 20;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
