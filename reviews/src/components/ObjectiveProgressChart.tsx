import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import Chart from "react-apexcharts";
import { useTranslation } from "react-i18next";

interface ObjectiveProgressChartProps {
  achieved: number;
  inProgress: number;
  notStarted: number;
}

export const ObjectiveProgressChart = ({
  achieved,
  inProgress,
  notStarted,
}: ObjectiveProgressChartProps) => {
  const { t } = useTranslation();

  const total = achieved + inProgress + notStarted;

  const series = [achieved, inProgress, notStarted];
  const labels = [
    t("objectives.status.achieved", "Achieved"),
    t("objectives.status.inProgress", "In Progress"),
    t("objectives.status.notStarted", "Not Started"),
  ];

  const colors = ["#4caf50", "#2196f3", "#9e9e9e"];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      height: 300,
      toolbar: { show: false },
    },
    labels,
    colors,
    legend: {
      position: "bottom",
      horizontalAlign: "center",
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        return `${val.toFixed(0)}%`;
      },
      style: {
        fontSize: "14px",
        fontWeight: 600,
        colors: ["#fff"],
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "16px",
              fontWeight: 600,
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: 700,
              formatter: (val: string) => {
                const percentage = parseFloat(val);
                const count = Math.round((percentage / 100) * total);
                return `${count}`;
              },
            },
            total: {
              show: true,
              label: t("objectives.total", "Total"),
              fontSize: "16px",
              fontWeight: 600,
              formatter: () => {
                return `${total}`;
              },
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => {
          const count = Math.round((val / 100) * total);
          return `${count} (${val.toFixed(1)}%)`;
        },
      },
    },
  };

  if (total === 0) {
    return (
      <Card sx={{ borderRadius: "18px", boxShadow: 2 }}>
        <CardContent>
          <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
            <Typography variant="h6" fontWeight={600}>
              {t("objectives.progressionGlobale", "Global Progress")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("objectives.noObjectives", "No objectives yet")}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: "18px", boxShadow: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={600}>
            {t("objectives.progressionGlobale", "Global Progress")}
          </Typography>
          <Box sx={{ height: 300 }}>
            <Chart
              options={options}
              series={series}
              type="donut"
              height={300}
            />
          </Box>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            flexWrap="wrap"
            sx={{ mt: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  bgcolor: colors[0],
                }}
              />
              <Typography variant="body2">
                {t("objectives.status.achieved", "Achieved")}: {achieved} (
                {total > 0 ? ((achieved / total) * 100).toFixed(0) : 0}%)
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  bgcolor: colors[1],
                }}
              />
              <Typography variant="body2">
                {t("objectives.status.inProgress", "In Progress")}: {inProgress}{" "}
                ({total > 0 ? ((inProgress / total) * 100).toFixed(0) : 0}%)
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  bgcolor: colors[2],
                }}
              />
              <Typography variant="body2">
                {t("objectives.status.notStarted", "Not Started")}: {notStarted}{" "}
                ({total > 0 ? ((notStarted / total) * 100).toFixed(0) : 0}%)
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
