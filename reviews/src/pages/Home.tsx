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
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import {
  AggregateIcon,
  KeywordsIcon,
  ReviewsIcon,
  SummaryIcon,
} from "../components/icons/FeatureIcons";
import { UserContext } from "../context/UserContext";

export const Home = () => {
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
      title: "Pull Reviews from Social Media",
      description:
        "Aggregate reviews from Google, Facebook, Yelp, OpenTable, and TripAdvisor all in one place.",
    },
    {
      icon: <AggregateIcon sx={{ fontSize: 48, color: "#0071e3" }} />,
      title: "Aggregate Across Locations",
      description:
        "Track reviews from multiple locations and get a unified view of your customer feedback.",
    },
    {
      icon: <KeywordsIcon sx={{ fontSize: 48, color: "#0071e3" }} />,
      title: "Extract Keywords & Topics",
      description:
        "Automatically extract key insights from reviews to understand what customers are talking about.",
    },
    {
      icon: <SummaryIcon sx={{ fontSize: 48, color: "#0071e3" }} />,
      title: "Monthly Customer Sentiment",
      description:
        "Get comprehensive monthly summaries of how your customers feel about your business (paid plan).",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <Box sx={{ flex: 1 }}>
        {/* Hero Section */}
        <Box sx={{ bgcolor: "background.default", py: 12 }}>
          <Container maxWidth="lg">
            <Stack spacing={4} alignItems="center" textAlign="center">
              <Typography
                variant="h1"
                fontWeight={700}
                sx={{ fontSize: { xs: "3rem", md: "4.5rem" } }}
              >
                Take Control of Your
                <br />
                Online Reputation
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                sx={{ maxWidth: "600px" }}
              >
                Monitor, analyze, and respond to customer reviews from all major
                platforms in one unified dashboard.
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
                  Get Started Free
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
                  View Pricing
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
              Everything You Need
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
              Simple, Transparent Pricing
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 6 }}
            >
              Choose the plan that fits your needs
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
                        Free
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="baseline">
                        <Typography variant="h3" fontWeight={700}>
                          $0
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          /month
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack spacing={2}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          Up to 10 reviews/month
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">Basic analytics</Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          Multi-platform support
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          Keyword extraction
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
                      Get Started
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
                  MOST POPULAR
                </Box>
                <CardContent sx={{ p: 4, pt: 5 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h5" fontWeight={600} gutterBottom>
                        Professional
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="baseline">
                        <Typography variant="h3" fontWeight={700}>
                          $49
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          /month
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack spacing={2}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          Unlimited reviews/month
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2" fontWeight={600}>
                          Monthly summary reports
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          Advanced sentiment analysis
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckIcon color="success" />
                        <Typography variant="body2">
                          Priority support
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
                      Start Free Trial
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};
