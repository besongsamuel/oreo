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
      icon: <ReviewsIcon sx={{ fontSize: 48, color: "#DF4333" }} />,
      title: t("home.feature1Title"),
      description: t("home.feature1Desc"),
    },
    {
      icon: <AggregateIcon sx={{ fontSize: 48, color: "#DF4333" }} />,
      title: t("home.feature2Title"),
      description: t("home.feature2Desc"),
    },
    {
      icon: <KeywordsIcon sx={{ fontSize: 48, color: "#DF4333" }} />,
      title: t("home.feature3Title"),
      description: t("home.feature3Desc"),
    },
    {
      icon: <SummaryIcon sx={{ fontSize: 48, color: "#DF4333" }} />,
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
      </Box>
    </>
  );
};
