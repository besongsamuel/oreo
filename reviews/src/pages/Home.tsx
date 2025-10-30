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

export const Home = () => {
  const { t } = useTranslation();
  const context = useContext(UserContext);
  const profile = context?.profile;
  const user = context?.user;
  const navigate = useNavigate();

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
              {t("home.pricingTitle")}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 6 }}
            >
              {t("home.pricingSubtitle")}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 4,
                mt: 6,
              }}
            >
              {/* Free Plan */}
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h5" fontWeight={600} gutterBottom>
                        {t("home.planFree")}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="baseline">
                        <Typography variant="h3" fontWeight={700}>
                          $0
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t("home.monthly")}
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack spacing={2}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          {t("home.featureReviews")}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          {t("home.featureAnalytics")}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          {t("home.featureMultiPlatform")}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          {t("home.featureKeywords")}
                        </Typography>
                      </Box>
                    </Stack>

                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate("/auth/signup")}
                      sx={{
                        borderRadius: 980,
                        py: 1.5,
                        textTransform: "none",
                        fontSize: "1rem",
                      }}
                    >
                      {t("home.getStarted")}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Paid Plan */}
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  border: "2px solid",
                  borderColor: "#0071e3",
                  position: "relative",
                  overflow: "visible",
                }}
              >
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
                <CardContent sx={{ p: 4, pt: 5 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h5" fontWeight={600} gutterBottom>
                        {t("home.planPro")}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="baseline">
                        <Typography variant="h3" fontWeight={700}>
                          $49
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t("home.monthly")}
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack spacing={2}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          {t("home.featureUnlimited")}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2" fontWeight={600}>
                          {t("home.featureMonthlySummary")}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          {t("home.featureSentiment")}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          {t("home.featureSupport")}
                        </Typography>
                      </Box>
                    </Stack>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleGetStarted}
                      sx={{
                        borderRadius: 980,
                        py: 1.5,
                        textTransform: "none",
                        fontSize: "1rem",
                      }}
                    >
                      {t("home.startFreeTrial")}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Container>
        </Box>
      </Box>
    </>
  );
};
