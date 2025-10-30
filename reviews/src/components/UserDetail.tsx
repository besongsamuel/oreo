import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { SEO } from "./SEO";
import { UserContext } from "../context/UserContext";
import { useTrial } from "../hooks/useTrial";
import {
  fetchUserDetails,
  UserDetail,
} from "../services/adminService";

export const UserDetailView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const context = useContext(UserContext);
  const isAdmin = context?.isAdmin;
  const { startTrial, loading: trialLoading } = useTrial();

  const [loading, setLoading] = useState(true);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin?.()) {
      navigate("/dashboard");
      return;
    }

    if (userId) {
      fetchUser();
    }
  }, [userId, isAdmin, navigate]);

  const fetchUser = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchUserDetails(userId);
      setUserDetail(data);
    } catch (err: any) {
      console.error("Error fetching user details:", err);
      setError(err.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    if (!userId) return;
    if (!window.confirm("Start a 30-day Pro trial for this user?")) {
      return;
    }

    try {
      await startTrial(userId);
      alert("Trial started successfully!");
      await fetchUser();
    } catch (err: any) {
      alert(err.message || "Failed to start trial");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTrialStatus = (status: string) => {
    const colors: Record<string, "default" | "success" | "error"> = {
      active: "success",
      expired: "error",
      cancelled: "default",
    };
    return colors[status] || "default";
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="body1">Loading user details...</Typography>
      </Container>
    );
  }

  if (error || !userDetail) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin/dashboard")}
            sx={{ textTransform: "none" }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="body1" color="error">
            {error || "User not found"}
          </Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <>
      <SEO
        title={`User Details - ${userDetail.full_name || userDetail.email} - Boresha`}
        description="View user details and subscription information"
        keywords="admin, user, details"
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/admin/dashboard")}
              sx={{ textTransform: "none" }}
            >
              Back to Dashboard
            </Button>
          </Stack>

          <Card>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                    <PersonIcon sx={{ fontSize: 40, color: "primary.main" }} />
                    <Box flex={1}>
                      <Typography variant="h4" fontWeight={700}>
                        {userDetail.full_name || "—"}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {userDetail.email}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                      <Chip
                        label={userDetail.role}
                        color={userDetail.role === "admin" ? "primary" : "default"}
                        sx={{ textTransform: "capitalize" }}
                      />
                      <Chip
                        label={userDetail.subscription_plan_display_name || "Free"}
                        color={
                          userDetail.subscription_plan_name === "free"
                            ? "default"
                            : "success"
                        }
                      />
                    </Stack>
                  </Stack>
                  <Divider />
                </Box>

                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Company Name
                    </Typography>
                    <Typography variant="body1">
                      {userDetail.company_name || "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Joined
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(userDetail.created_at)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Companies
                    </Typography>
                    <Typography variant="body1">
                      {userDetail.companies_count || 0}
                    </Typography>
                  </Box>
                </Stack>

                {userDetail.subscription_plan_name === "free" && (
                  <Box>
                    <Button
                      variant="contained"
                      startIcon={<StarIcon />}
                      onClick={handleStartTrial}
                      disabled={trialLoading}
                      sx={{ textTransform: "none" }}
                    >
                      {trialLoading ? "Starting..." : "Start Pro Trial (30 days)"}
                    </Button>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Companies ({userDetail.companies.length})
              </Typography>

              {userDetail.companies.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <BusinessIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No companies found
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {userDetail.companies.map((company) => (
                    <Paper
                      key={company.id}
                      variant="outlined"
                      sx={{ p: 3, borderRadius: 2 }}
                    >
                      <Stack spacing={2}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box>
                            <Link
                              href={`/companies/${company.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/companies/${company.id}`);
                              }}
                              sx={{
                                textDecoration: "none",
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              <Typography variant="h6" color="primary">
                                {company.name}
                              </Typography>
                            </Link>
                            {company.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {company.description}
                              </Typography>
                            )}
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={3}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Locations
                            </Typography>
                            <Typography variant="body1">
                              {company.locations_count}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Reviews
                            </Typography>
                            <Typography variant="body1">
                              {company.reviews_count}
                            </Typography>
                          </Box>
                          {company.average_rating && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Avg Rating
                              </Typography>
                              <Typography variant="body1">
                                {company.average_rating.toFixed(1)} ⭐
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {userDetail.trial_history.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Trial History
                </Typography>
                <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "background.default" }}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Started
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Expires
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Plan
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Status
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Granted By
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userDetail.trial_history.map((trial) => (
                        <TableRow key={trial.id}>
                          <TableCell>{formatDate(trial.starts_at)}</TableCell>
                          <TableCell>{formatDate(trial.expires_at)}</TableCell>
                          <TableCell>{trial.trial_plan_name || "Pro"}</TableCell>
                          <TableCell>
                            <Chip
                              label={trial.status}
                              size="small"
                              color={formatTrialStatus(trial.status)}
                              sx={{ textTransform: "capitalize" }}
                            />
                          </TableCell>
                          <TableCell>{trial.granted_by_name || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Container>
    </>
  );
};

