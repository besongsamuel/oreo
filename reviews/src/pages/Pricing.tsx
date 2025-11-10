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
import { getFormattedPlanName } from "../utils/planNames";

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
  const hidePricing =
    (process.env.REACT_APP_HIDE_PRICING ?? process.env.HIDE_PRICING ?? "1") !==
    "0";

  const getPlanDisplayName = (plan: SubscriptionPlan) =>
    getFormattedPlanName(plan.plan_name, plan.plan_display_name, t);

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

    // Handle Review Sync Limit for pro and enterprise plans
    if (
      featureCode === "max_reviews_per_sync" &&
      (plan.plan_name === "pro" || plan.plan_name === "enterprise")
    ) {
      return t("pricing.unlimited");
    }

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
      return t("pricing.unlimited");
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
            {t("pricing.backToHome")}
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
                  : t("pricing.pricingTitle")}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: "600px", mx: "auto" }}
              >
                {t("pricing.pricingSubtitle")}
              </Typography>
            </Box>

            {/* Pricing Cards */}
            {plansLoading ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  {t("pricing.loadingPlans")}
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
                  const shouldHidePrice =
                    hidePricing && plan.plan_name === "enterprise";

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
                          {t("pricing.mostPopular")}
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
                          {t("pricing.current")}
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
                              {getPlanDisplayName(plan)}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="baseline"
                            >
                              {shouldHidePrice ? (
                                <Typography variant="h5" fontWeight={600}>
                                  {t("pricing.customPricing")}
                                </Typography>
                              ) : (
                                <>
                                  <Typography variant="h2" fontWeight={700}>
                                    ${plan.price_monthly.toFixed(0)}
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    color="text.secondary"
                                  >
                                    {t("pricing.perMonth")}
                                  </Typography>
                                </>
                              )}
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
                              ? t("pricing.currentPlan")
                              : isFree
                              ? t("pricing.getStarted")
                              : loading
                              ? t("pricing.loading")
                              : t("pricing.choosePlanButton")}
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
                              {t("pricing.feature")}
                            </Typography>
                          </TableCell>
                          {plans.map((plan) => (
                            <TableCell key={plan.plan_id} align="center">
                              <Typography variant="subtitle2" fontWeight={600}>
                                {getPlanDisplayName(plan)}
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
                {t("pricing.faqTitle")}
              </Typography>
              <Box sx={{ maxWidth: "800px", mx: "auto", mt: 4 }}>
                <Stack spacing={3}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {t("pricing.faq1Question")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("pricing.faq1Answer")}
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {t("pricing.faq2Question")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("pricing.faq2Answer")}
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {t("pricing.faq3Question")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("pricing.faq3Answer")}
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {t("pricing.faq4Question")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("pricing.faq4Answer")}
                    </Typography>
                  </Paper>
                </Stack>
              </Box>
            </Box>

            {/* CTA Section */}
            <Box textAlign="center" sx={{ py: 6 }}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {t("pricing.ctaTitle")}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {t("pricing.ctaSubtitle")}
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
                {t("pricing.startFreeTrial")}
              </Button>
            </Box>
          </Stack>
        </Container>
      </Box>
    </>
  );
};
