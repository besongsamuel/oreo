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
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { UserContext } from "../context/UserContext";

export const Pricing = () => {
  const context = useContext(UserContext);
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
    { name: "Monthly review limit", free: "10", paid: "Unlimited" },
    { name: "Multi-platform support", free: "✓", paid: "✓" },
    { name: "Keyword extraction", free: "✓", paid: "✓" },
    { name: "Topic identification", free: "✓", paid: "✓" },
    { name: "Sentiment analysis", free: "✓", paid: "✓" },
    { name: "Monthly summary reports", free: "—", paid: "✓" },
    { name: "Advanced analytics", free: "—", paid: "✓" },
    { name: "Priority support", free: "—", paid: "✓" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <Box sx={{ flex: 1, py: 8 }}>
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
                Simple Pricing
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: "600px", mx: "auto" }}
              >
                Choose the plan that fits your business needs. Upgrade or
                downgrade at any time.
              </Typography>
            </Box>

            {/* Pricing Cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 4,
              }}
            >
              {/* Free Plan */}
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h4" fontWeight={700} gutterBottom>
                        Free
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="baseline">
                        <Typography variant="h2" fontWeight={700}>
                          $0
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          /month
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        Perfect for small businesses getting started
                      </Typography>
                    </Box>

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
                  border: "2px solid #0071e3",
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
                      <Typography variant="h4" fontWeight={700} gutterBottom>
                        Professional
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="baseline">
                        <Typography variant="h2" fontWeight={700}>
                          $49
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          /month
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        For growing businesses that need comprehensive insights
                      </Typography>
                    </Box>

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

            {/* Feature Comparison Table */}
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
                      <TableCell align="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          Free
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          Professional
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {features.map((feature, index) => (
                      <TableRow
                        key={feature.name}
                        sx={
                          index % 2 === 0
                            ? { bgcolor: "background.default" }
                            : {}
                        }
                      >
                        <TableCell>
                          <Typography variant="body2">
                            {feature.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {feature.free === "✓" ? (
                            <CheckIcon color="success" />
                          ) : feature.free === "—" ? (
                            <CloseIcon sx={{ color: "text.disabled" }} />
                          ) : (
                            <Typography variant="body2">
                              {feature.free}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {feature.paid === "✓" ? (
                            <CheckIcon color="success" />
                          ) : (
                            <Typography variant="body2">
                              {feature.paid}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

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
                      When you reach 10 reviews in a month on the free plan, you
                      can either upgrade to the Professional plan for unlimited
                      reviews, or wait until the next month when your count
                      resets.
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      How do monthly summaries work?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly summaries are automatically generated at the end
                      of each month for Professional users. They include
                      aggregated sentiment data, top keywords, topics, and
                      trends to help you understand customer feedback patterns.
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
                onClick={handleGetStarted}
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
      <Footer />
    </Box>
  );
};
