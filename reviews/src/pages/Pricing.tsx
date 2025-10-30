import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import {
  SubscriptionPlan,
  useSubscriptionPlans,
} from "../hooks/useSubscriptionPlans";
import { useSupabase } from "../hooks/useSupabase";

export const Pricing = () => {
  const { t } = useTranslation();
  const context = useContext(UserContext);
  const user = context?.user;
  const profile = context?.profile;
  const currentPlan = context?.currentPlan;
  const navigate = useNavigate();
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);

  const handleGetStarted = (planName?: string) => {
    if (user) {
      if (planName && planName !== "free") {
        handleUpgrade(planName);
      } else {
        navigate("/dashboard");
      }
    } else {
      navigate("/auth/signup");
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (!user) {
      navigate("/auth/signup");
      return;
    }

    setLoading(true);
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("Missing Supabase URL configuration");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth/signup");
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ planName }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout or handle free plan
      if (result.url) {
        window.location.href = result.url;
      } else if (result.planId) {
        // Free plan - refresh page
        window.location.reload();
      }
    } catch (err) {
      console.error("Error upgrading plan:", err);
      alert(err instanceof Error ? err.message : "Failed to upgrade plan");
    } finally {
      setLoading(false);
    }
  };

  // Extract all unique features from all plans
  const getAllFeatures = (): string[] => {
    const featureSet = new Set<string>();
    plans.forEach((plan) => {
      plan.features?.forEach((feature) => {
        featureSet.add(feature.feature_code);
      });
    });
    return Array.from(featureSet);
  };

  // Get feature display value for a plan
  const getFeatureValue = (
    plan: SubscriptionPlan | null,
    featureCode: string
  ): string => {
    if (!plan) return "—";

    const feature = plan.features?.find((f) => f.feature_code === featureCode);
    if (!feature) return "—";

    // Handle limit features
    if (feature.limit_value && typeof feature.limit_value === "object") {
      const limits = feature.limit_value;
      if (limits.max_companies) {
        return limits.max_companies === 1 ? "1" : `${limits.max_companies}`;
      }
      if (limits.max_locations_per_company) {
        return `${limits.max_locations_per_company}`;
      }
      if (limits.max_reviews_per_sync) {
        return `${limits.max_reviews_per_sync}`;
      }
    }

    // Boolean features
    if (feature.feature_code === "unlimited_reviews") {
      return "Unlimited";
    }
    if (feature.feature_code === "monthly_summary") {
      return "✓";
    }

    return "✓";
  };

  return (
    <>
      <Box sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
            sx={{ mb: 4 }}
          >
            Back to Home
          </Button>

          <Stack spacing={6}>
            {/* Header */}
            <Box textAlign="center">
              <Typography
                variant="h2"
                fontWeight={700}
                gutterBottom
                sx={{ fontSize: { xs: "2.5rem", md: "3.5rem" } }}
              >
                {plans.length > 0 && plans[0].pricing_page_title
                  ? plans[0].pricing_page_title
                  : t("pricing.pricingTitle", {
                      defaultValue: "Simple Pricing",
                    })}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: "600px", mx: "auto" }}
              >
                {t("pricing.pricingSubtitle", {
                  defaultValue:
                    "Choose the plan that fits your business needs. Upgrade or downgrade at any time.",
                })}
              </Typography>
            </Box>

            {/* Pricing Cards */}
            {plansLoading ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  Loading plans...
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md:
                      plans.length === 2 ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                  },
                  gap: 4,
                }}
              >
                {plans.map((plan, index) => {
                  const isCurrentPlan = currentPlan?.plan_id === plan.plan_id;
                  const isPopular = plan.plan_name === "pro";
                  const isFree = plan.price_monthly === 0;

                  return (
                    <Card
                      key={plan.plan_id}
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        border: isPopular
                          ? "2px solid #0071e3"
                          : isCurrentPlan
                          ? "2px solid #28a745"
                          : undefined,
                        position: "relative",
                        overflow: "visible",
                      }}
                    >
                      {isPopular && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: -12,
                            left: "50%",
                            transform: "translateX(-50%)",
                            bgcolor: "#0071e3",
                            color: "white",
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            zIndex: 1,
                          }}
                        >
                          MOST POPULAR
                        </Box>
                      )}
                      {isCurrentPlan && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: -12,
                            right: 16,
                            bgcolor: "#28a745",
                            color: "white",
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            zIndex: 1,
                          }}
                        >
                          CURRENT
                        </Box>
                      )}
                      <CardContent
                        sx={{ p: 4, pt: isPopular || isCurrentPlan ? 5 : 4 }}
                      >
                        <Stack spacing={3}>
                          <Box>
                            <Typography
                              variant="h4"
                              fontWeight={700}
                              gutterBottom
                            >
                              {plan.plan_display_name}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="baseline"
                            >
                              <Typography variant="h2" fontWeight={700}>
                                ${plan.price_monthly.toFixed(0)}
                              </Typography>
                              <Typography
                                variant="body1"
                                color="text.secondary"
                              >
                                /month
                              </Typography>
                            </Stack>
                          </Box>

                          <Button
                            variant={isPopular ? "contained" : "outlined"}
                            fullWidth
                            onClick={() => handleGetStarted(plan.plan_name)}
                            disabled={loading || isCurrentPlan}
                            sx={{
                              borderRadius: 980,
                              py: 1.5,
                              textTransform: "none",
                              fontSize: "1rem",
                            }}
                          >
                            {isCurrentPlan
                              ? "Current Plan"
                              : isFree
                              ? "Get Started"
                              : loading
                              ? "Loading..."
                              : "Choose Plan"}
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}

            {/* Feature Comparison Table */}
            {!plansLoading &&
              plans.length > 0 &&
              getAllFeatures().length > 0 && (
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 3, overflow: "hidden" }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "background.default" }}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>
                              Feature
                            </Typography>
                          </TableCell>
                          {plans.map((plan) => (
                            <TableCell key={plan.plan_id} align="center">
                              <Typography variant="subtitle2" fontWeight={600}>
                                {plan.plan_display_name}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getAllFeatures().map((featureCode, index) => {
                          const feature = plans[0]?.features?.find(
                            (f) => f.feature_code === featureCode
                          );
                          const featureName =
                            feature?.feature_display_name || featureCode;

                          return (
                            <TableRow
                              key={featureCode}
                              sx={
                                index % 2 === 0
                                  ? { bgcolor: "background.default" }
                                  : {}
                              }
                            >
                              <TableCell>
                                <Typography variant="body2">
                                  {featureName}
                                </Typography>
                              </TableCell>
                              {plans.map((plan) => {
                                const value = getFeatureValue(
                                  plan,
                                  featureCode
                                );
                                return (
                                  <TableCell key={plan.plan_id} align="center">
                                    {value === "✓" ? (
                                      <CheckIcon color="success" />
                                    ) : value === "—" || value === null ? (
                                      <CloseIcon
                                        sx={{ color: "text.disabled" }}
                                      />
                                    ) : (
                                      <Typography variant="body2">
                                        {value}
                                      </Typography>
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

            {/* FAQ Section */}
            <Box>
              <Typography
                variant="h4"
                fontWeight={700}
                gutterBottom
                textAlign="center"
              >
                Frequently Asked Questions
              </Typography>
              <Box sx={{ maxWidth: "800px", mx: "auto", mt: 4 }}>
                <Stack spacing={3}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Can I upgrade or downgrade my plan?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Yes, you can change your plan at any time. When you
                      upgrade, you'll be charged a prorated amount. When you
                      downgrade, the changes will take effect at the end of your
                      current billing cycle.
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      What happens if I exceed my free plan limit?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      When you reach 15 reviews on the free plan, you can either
                      upgrade to a paid plan for unlimited reviews, or wait
                      until the next sync when you can fetch more reviews.
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      How do monthly summaries work?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly summaries are automatically generated at the end
                      of each month for paid plan users. They include aggregated
                      sentiment data, top keywords, topics, and trends to help
                      you understand customer feedback patterns.
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      What platforms are supported?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      We support Google, Facebook, Yelp, OpenTable, and
                      TripAdvisor. More platforms are being added regularly
                      based on user feedback.
                    </Typography>
                  </Paper>
                </Stack>
              </Box>
            </Box>

            {/* CTA Section */}
            <Box textAlign="center" sx={{ py: 6 }}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Ready to get started?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Join hundreds of businesses managing their online reputation
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => handleGetStarted()}
                sx={{
                  borderRadius: 980,
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  textTransform: "none",
                }}
              >
                Start Your Free Trial
              </Button>
            </Box>
          </Stack>
        </Container>
      </Box>
    </>
  );
};
