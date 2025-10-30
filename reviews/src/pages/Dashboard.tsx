import { Star as StarIcon } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CompanyCard } from "../components/CompanyCard";
import { SEO } from "../components/SEO";
import { StatCardSkeleton } from "../components/SkeletonLoaders";
import { UserContext } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";

interface CompanyStat {
  company_id: string;
  company_name: string;
  total_reviews: number;
  average_rating: number;
  positive_reviews: number;
  negative_reviews: number;
  neutral_reviews: number;
  total_locations: number;
}

// Removed RecentReview/Keywords interfaces for a cleaner dashboard

export const Dashboard = () => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const context = useContext(UserContext);
  const profile = context?.profile;
  const [loading, setLoading] = useState(true);
  const [companyStats, setCompanyStats] = useState<CompanyStat[]>([]);
  // Recent reviews and keywords removed from Dashboard for cleaner UX

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      try {
        // Fetch company stats for all user's companies
        const { data: stats, error: statsError } = await supabase
          .from("company_stats")
          .select("*")
          .eq("owner_id", profile.id)
          .order("total_reviews", { ascending: false });

        if (statsError) {
          console.error("Error fetching stats:", statsError);
        } else {
          setCompanyStats(stats || []);
        }

        // Removed: recent reviews and keyword fetching to simplify dashboard
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, profile]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Header Skeleton */}
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {t("dashboard.title")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("dashboard.loading")}
            </Typography>
          </Box>

          {/* Companies Overview Skeleton */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("dashboard.companiesOverview")}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
                mt: 1,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <StatCardSkeleton key={i} />
              ))}
            </Box>
          </Paper>

          {/* Removed keyword and recent review skeletons for cleaner layout */}
        </Stack>
      </Container>
    );
  }

  // Removed sentiment/category helpers as keyword/review UI is removed

  return (
    <>
      <SEO
        title={t("dashboard.seoTitle")}
        description={t("dashboard.seoDescription")}
        keywords={t("dashboard.seoKeywords")}
      />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Header */}
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {t("dashboard.title")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("dashboard.welcomeBack", {
                name: profile?.full_name || profile?.email,
              })}
            </Typography>
          </Box>

          {/* Companies Performance */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("dashboard.companiesOverview")}
            </Typography>
            {companyStats.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t("dashboard.noCompanies")}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 3,
                  mt: 1,
                }}
              >
                {companyStats.slice(0, 6).map((company) => (
                  <CompanyCard
                    key={company.company_id}
                    companyId={company.company_id}
                    companyName={company.company_name}
                    totalLocations={company.total_locations}
                    totalReviews={company.total_reviews}
                    averageRating={company.average_rating}
                    positiveReviews={company.positive_reviews}
                    negativeReviews={company.negative_reviews}
                  />
                ))}
              </Box>
            )}
          </Paper>

          {/* Removed: keyword analysis, recent reviews, and trending keywords sections */}
        </Stack>
      </Container>
    </>
  );
};
