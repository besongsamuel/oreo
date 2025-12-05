import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActionPlan } from "../services/actionPlansService";

interface ActionPlanStatsDashboardProps {
  actionPlans: ActionPlan[];
  loading?: boolean;
}

export const ActionPlanStatsDashboard = ({
  actionPlans,
  loading = false,
}: ActionPlanStatsDashboardProps) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const totalPlans = actionPlans.length;
    const activePlans = actionPlans.filter(
      (plan) => plan.status === "in_progress"
    ).length;
    const completedPlans = actionPlans.filter(
      (plan) => plan.status === "completed"
    ).length;

    // Calculate completion rate
    let completionRate = 0;
    if (totalPlans > 0) {
      completionRate = Math.round((completedPlans / totalPlans) * 100);
    }

    // Calculate total items stats
    const totalItems = actionPlans.reduce(
      (sum, plan) => sum + (plan.total_items || 0),
      0
    );
    const completedItems = actionPlans.reduce(
      (sum, plan) => sum + (plan.completed_items || 0),
      0
    );
    const inProgressItems = actionPlans.reduce(
      (sum, plan) => sum + (plan.in_progress_items || 0),
      0
    );

    // Calculate items completed this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // For now, we'll estimate based on completed items in active/completed plans
    // In the future, we could track completion timestamps
    const itemsCompletedThisWeek = Math.floor(completedItems * 0.15); // Estimate

    // Calculate items completed this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const itemsCompletedThisMonth = Math.floor(completedItems * 0.4); // Estimate

    return {
      totalPlans,
      activePlans,
      completedPlans,
      completionRate,
      totalItems,
      completedItems,
      inProgressItems,
      itemsCompletedThisWeek,
      itemsCompletedThisMonth,
    };
  }, [actionPlans]);

  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Card
              sx={{
                borderRadius: "18px",
                boxShadow: 2,
                minHeight: 140,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    width: "100%",
                    height: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("common.loading", "Loading...")}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  const statCards = [
    {
      title: t(
        "actionPlansStats.totalPlans",
        "Total Action Plans"
      ),
      value: stats.totalPlans,
      icon: <AssignmentIcon />,
      color: "primary",
    },
    {
      title: t(
        "actionPlansStats.completionRate",
        "Completion Rate"
      ),
      value: `${stats.completionRate}%`,
      icon: <TrendingUpIcon />,
      color: "success",
    },
    {
      title: t(
        "actionPlansStats.activePlans",
        "Active Plans"
      ),
      value: stats.activePlans,
      icon: <HourglassEmptyIcon />,
      color: "warning",
    },
    {
      title: t(
        "actionPlansStats.itemsCompleted",
        "Items Completed"
      ),
      value: `${stats.completedItems}/${stats.totalItems || 0}`,
      icon: <CheckCircleIcon />,
      color: "info",
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statCards.map((stat, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
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
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {stat.title}
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color={`${stat.color}.main`}
                    >
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "16px",
                      bgcolor: `${stat.color}.main`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      boxShadow: `0 4px 14px ${stat.color === "primary" ? "rgba(25, 118, 210, 0.25)" : stat.color === "success" ? "rgba(46, 125, 50, 0.25)" : stat.color === "warning" ? "rgba(237, 108, 2, 0.25)" : "rgba(2, 136, 209, 0.25)"}`,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        transform: "translateY(-2px) scale(1.02)",
                        boxShadow: `0 6px 20px ${stat.color === "primary" ? "rgba(25, 118, 210, 0.35)" : stat.color === "success" ? "rgba(46, 125, 50, 0.35)" : stat.color === "warning" ? "rgba(237, 108, 2, 0.35)" : "rgba(2, 136, 209, 0.35)"}`,
                      },
                      "& svg": {
                        fontSize: 32,
                      },
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

