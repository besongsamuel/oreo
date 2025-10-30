import {
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AggregateIcon,
  KeywordsIcon,
  ReviewsIcon,
  SummaryIcon,
} from "../components/icons/FeatureIcons";
import { UserContext } from "../context/UserContext";
import { useSubscriptionPlans, SubscriptionPlan } from "../hooks/useSubscriptionPlans";

export const Home = () => {
  const { t } = useTranslation();
  const context = useContext(UserContext);
  const profile = context?.profile;
  const user = context?.user;
  const navigate = useNavigate();
  const { plans, loading: plansLoading } = useSubscriptionPlans();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth/signup");
    }
  };

  const features = [
    {
      icon: <ReviewsIcon sx={{ fontSize: 48, color: "#0071e3" }} />,
      title: t("home.feature1Title"),
      description: t("home.feature1Desc"),
    },
    {
      icon: <AggregateIcon sx={{ fontSize: 48, color: "#0071e3" }} />,
      title: t("home.feature2Title"),
      description: t("home.feature2Desc"),
    },
    {
      icon: <KeywordsIcon sx={{ fontSize: 48, color: "#0071e3" }} />,
      title: t("home.feature3Title"),
      description: t("home.feature3Desc"),
    },
    {
      icon: <SummaryIcon sx={{ fontSize: 48, color: "#0071e3" }} />,
      title: t("home.feature4Title"),
      description: t("home.feature4Desc"),
    },
  ];

  return (
    <>
      <Box>
        {/* Hero Section */}
        <Box sx={{ bgcolor: "background.default", py: 12 }}>
          <Container maxWidth="lg">
            <Stack spacing={4} alignItems="center" textAlign="center">
              <Typography
                variant="h1"
                fontWeight={700}
                sx={{ fontSize: { xs: "3rem", md: "4.5rem" } }}
              >
                {t("home.heroTitle")}
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                sx={{ maxWidth: "600px" }}
              >
                {t("home.heroSubtitle")}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetStarted}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    borderRadius: 980,
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                    textTransform: "none",
                  }}
                >
                  {t("home.getStartedFree")}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/pricing")}
                  sx={{
                    borderRadius: 980,
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                    textTransform: "none",
                  }}
                >
                  {t("home.viewPricing")}
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 10, bgcolor: "background.paper" }}>
          <Container maxWidth="lg">
            <Typography
              variant="h3"
              fontWeight={600}
              textAlign="center"
              gutterBottom
              sx={{ mb: 8 }}
            >
              {t("home.featuresTitle")}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                },
                gap: 4,
              }}
            >
              {features.map((feature, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Stack spacing={2}>
                      {feature.icon}
                      <Typography variant="h5" fontWeight={600}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Container>
        </Box>

        {/* Pricing Section */}
        <Box sx={{ py: 10, bgcolor: "background.default" }}>
          <Container maxWidth="md">
            <Typography
              variant="h3"
              fontWeight={600}
              textAlign="center"
              gutterBottom
            >
              {plans.length > 0 && plans[0].pricing_page_title 
                ? plans[0].pricing_page_title 
                : t("home.pricingTitle")}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 6 }}
            >
              {t("home.pricingSubtitle")}
            </Typography>

            {plansLoading ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  Loading pricing...
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { 
                    xs: "1fr", 
                    md: plans.length === 2 ? "repeat(2, 1fr)" : "repeat(3, 1fr)"
                  },
                  gap: 4,
                  mt: 6,
                }}
              >
                {plans.map((plan) => {
                  const isPopular = plan.plan_name === "pro";
                  const isFree = plan.price_monthly === 0;
                  
                  // Get key features for display (limit to 4 most important)
                  const keyFeatures = plan.features?.slice(0, 4) || [];

                  return (
                    <Card
                      key={plan.plan_id}
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        border: isPopular ? "2px solid" : "1px solid",
                        borderColor: isPopular ? "#0071e3" : "divider",
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
                          {t("home.mostPopular")}
                        </Box>
                      )}
                      <CardContent sx={{ p: 4, pt: isPopular ? 5 : 4 }}>
                        <Stack spacing={3}>
                          <Box>
                            <Typography variant="h5" fontWeight={600} gutterBottom>
                              {plan.plan_display_name}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="baseline">
                              <Typography variant="h3" fontWeight={700}>
                                ${plan.price_monthly.toFixed(0)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {t("home.monthly")}
                              </Typography>
                            </Stack>
                          </Box>

                          <Stack spacing={2}>
                            {keyFeatures.map((feature) => (
                              <Box
                                key={feature.feature_id}
                                sx={{ display: "flex", alignItems: "center", gap: 1 }}
                              >
                                <CheckIcon color="success" />
                                <Typography variant="body2">
                                  {feature.feature_display_name}
                                </Typography>
                              </Box>
                            ))}
                            {keyFeatures.length === 0 && (
                              <Typography variant="body2" color="text.secondary">
                                {t("home.featureReviews")}
                              </Typography>
                            )}
                          </Stack>

                          <Button
                            variant={isPopular ? "contained" : "outlined"}
                            fullWidth
                            onClick={() => {
                              if (isFree) {
                                navigate("/auth/signup");
                              } else {
                                handleGetStarted();
                              }
                            }}
                            sx={{
                              borderRadius: 980,
                              py: 1.5,
                              textTransform: "none",
                              fontSize: "1rem",
                            }}
                          >
                            {isFree ? t("home.getStarted") : t("home.startFreeTrial")}
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Container>
        </Box>
      </Box>
    </>
  );
};
