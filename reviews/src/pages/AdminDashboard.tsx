import {
  ArrowForward as ArrowForwardIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "../components/SEO";
import { UserContext } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";
import { useTrial } from "../hooks/useTrial";
import {
  AdminUser,
  CompanyWithStats,
  fetchAllCompanies,
  fetchAllUsers,
} from "../services/adminService";
import { getFormattedPlanName } from "../utils/planNames";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);
  const profile = context?.profile;
  const isAdmin = context?.isAdmin;
  const { startTrial, loading: trialLoading } = useTrial();
  const supabase = useSupabase();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Email trigger state
  const [companies, setCompanies] = useState<
    Array<CompanyWithStats & { owner_email: string; owner_name: string | null }>
  >([]);
  const [selectedCompany, setSelectedCompany] = useState<
    | (CompanyWithStats & { owner_email: string; owner_name: string | null })
    | null
  >(null);
  const [emailTargetDate, setEmailTargetDate] = useState<string>("");
  const [emailRecipientOverride, setEmailRecipientOverride] =
    useState<string>("");
  const [triggeringWeekly, setTriggeringWeekly] = useState(false);
  const [triggeringMonthly, setTriggeringMonthly] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    type: "weekly" | "monthly" | null;
    success: boolean;
    message: string;
    results?: {
      sent: number;
      skipped: number;
      failed: number;
    };
    errors?: string[];
  } | null>(null);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }

    // Check if user is admin
    if (!isAdmin?.()) {
      navigate("/dashboard");
      return;
    }

    fetchUsers();
    fetchCompanies();
  }, [profile, isAdmin, navigate]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter((user) => {
      const planLabel = getFormattedPlanName(
        user.subscription_plan_name,
        user.subscription_plan_display_name
      ).toLowerCase();

      return (
        user.email?.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query) ||
        user.company_name?.toLowerCase().includes(query) ||
        planLabel.includes(query)
      );
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await fetchAllCompanies();
      setCompanies(data);
    } catch (err: any) {
      console.error("Error fetching companies:", err);
      // Don't set error state - this is not critical for the main page
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleStartTrial = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (!window.confirm("Start a 30-day Pro trial for this user?")) {
      return;
    }

    try {
      await startTrial(userId);
      alert("Trial started successfully!");
      await fetchUsers(); // Refresh user list
    } catch (err: any) {
      alert(err.message || "Failed to start trial");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Initialize target date to today
  useEffect(() => {
    const today = new Date();
    setEmailTargetDate(today.toISOString().split("T")[0]);
  }, []);

  const handleTriggerWeeklyDigest = async () => {
    if (!emailTargetDate) {
      setEmailResult({
        type: "weekly",
        success: false,
        message: "Please select a target date",
      });
      return;
    }

    setTriggeringWeekly(true);
    setEmailResult(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "send-weekly-digest",
        {
          body: {
            trigger: "manual",
            targetDate: emailTargetDate,
            companyId: selectedCompany?.id || undefined,
            recipientOverride: emailRecipientOverride || undefined,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        setEmailResult({
          type: "weekly",
          success: true,
          message: data.message || "Weekly digest triggered successfully",
          results: data.results,
          errors: data.errors,
        });
      } else {
        setEmailResult({
          type: "weekly",
          success: false,
          message: data?.error || "Failed to trigger weekly digest",
          errors: data?.errors,
        });
      }
    } catch (err: any) {
      console.error("Error triggering weekly digest:", err);
      setEmailResult({
        type: "weekly",
        success: false,
        message: err.message || "Failed to trigger weekly digest",
      });
    } finally {
      setTriggeringWeekly(false);
    }
  };

  const handleTriggerMonthlyReport = async () => {
    if (!emailTargetDate) {
      setEmailResult({
        type: "monthly",
        success: false,
        message: "Please select a target date",
      });
      return;
    }

    setTriggeringMonthly(true);
    setEmailResult(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "send-monthly-report",
        {
          body: {
            trigger: "manual",
            targetDate: emailTargetDate,
            companyId: selectedCompany?.id || undefined,
            recipientOverride: emailRecipientOverride || undefined,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        setEmailResult({
          type: "monthly",
          success: true,
          message: data.message || "Monthly report triggered successfully",
          results: data.results,
          errors: data.errors,
        });
      } else {
        setEmailResult({
          type: "monthly",
          success: false,
          message: data?.error || "Failed to trigger monthly report",
          errors: data?.errors,
        });
      }
    } catch (err: any) {
      console.error("Error triggering monthly report:", err);
      setEmailResult({
        type: "monthly",
        success: false,
        message: err.message || "Failed to trigger monthly report",
      });
    } finally {
      setTriggeringMonthly(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="body1">Loading users...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <>
      <SEO
        title="Admin Dashboard - Boresha"
        description="Manage users and subscriptions"
        keywords="admin, users, management"
      />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Header */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <PeopleIcon sx={{ fontSize: 40, color: "primary.main" }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  Admin Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Manage users and subscriptions
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Email Triggers */}
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <EmailIcon sx={{ fontSize: 32, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Email Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manually trigger weekly digest or monthly report emails.
                    Select a company to send only to that company, or leave
                    empty to send to all companies (even if disabled).
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={3}>
                <Autocomplete
                  options={companies}
                  getOptionLabel={(option) =>
                    `${option.name} (${option.owner_email})`
                  }
                  value={selectedCompany}
                  onChange={(_, newValue) => setSelectedCompany(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Company (Optional)"
                      helperText="Select a company to send only to that company, or leave empty for all companies"
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Owner: {option.owner_email}
                          {option.owner_name && ` (${option.owner_name})`}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
                <Stack direction="row" spacing={2} alignItems="flex-end">
                  <TextField
                    label="Target Date"
                    type="date"
                    value={emailTargetDate}
                    onChange={(e) => setEmailTargetDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{ flex: 1 }}
                    helperText="Date used to calculate the reporting period"
                    required
                  />
                  <TextField
                    label="Recipient Override (Optional)"
                    type="email"
                    value={emailRecipientOverride}
                    onChange={(e) => setEmailRecipientOverride(e.target.value)}
                    placeholder="admin@example.com"
                    sx={{ flex: 1 }}
                    helperText="Send only to this email (for testing)"
                  />
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={handleTriggerWeeklyDigest}
                    disabled={triggeringWeekly || triggeringMonthly}
                    startIcon={
                      triggeringWeekly ? (
                        <CircularProgress size={16} />
                      ) : (
                        <EmailIcon />
                      )
                    }
                    sx={{ textTransform: "none" }}
                  >
                    {triggeringWeekly
                      ? "Triggering..."
                      : "Trigger Weekly Digest"}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleTriggerMonthlyReport}
                    disabled={triggeringWeekly || triggeringMonthly}
                    startIcon={
                      triggeringMonthly ? (
                        <CircularProgress size={16} />
                      ) : (
                        <EmailIcon />
                      )
                    }
                    sx={{ textTransform: "none" }}
                  >
                    {triggeringMonthly
                      ? "Triggering..."
                      : "Trigger Monthly Report"}
                  </Button>
                </Stack>

                {emailResult && (
                  <Alert
                    severity={emailResult.success ? "success" : "error"}
                    onClose={() => setEmailResult(null)}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {emailResult.type === "weekly"
                        ? "Weekly Digest"
                        : "Monthly Report"}{" "}
                      - {emailResult.success ? "Success" : "Failed"}
                    </Typography>
                    <Typography variant="body2">
                      {emailResult.message}
                    </Typography>
                    {emailResult.results && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" component="div">
                          Sent: {emailResult.results.sent} | Skipped:{" "}
                          {emailResult.results.skipped} | Failed:{" "}
                          {emailResult.results.failed}
                        </Typography>
                      </Box>
                    )}
                    {emailResult.errors && emailResult.errors.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" component="div">
                          Errors:
                        </Typography>
                        {emailResult.errors.map((err, idx) => (
                          <Typography
                            key={idx}
                            variant="caption"
                            component="div"
                            sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                          >
                            • {err}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardContent>
              <TextField
                fullWidth
                placeholder="Search users by name, email, company, or plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                All Users ({filteredUsers.length})
              </Typography>

              {filteredUsers.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchQuery
                      ? "No users found matching your search"
                      : "No users found"}
                  </Typography>
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "background.default" }}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            User
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Email
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Role
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Plan
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Companies
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Joined
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={600}>
                            Actions
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          hover
                          sx={{
                            cursor: "pointer",
                            "&:hover": {
                              bgcolor: "action.hover",
                            },
                          }}
                          onClick={() => handleUserClick(user.id)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {user.full_name || "—"}
                            </Typography>
                            {user.company_name && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {user.company_name}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {user.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.role}
                              size="small"
                              color={
                                user.role === "admin" ? "primary" : "default"
                              }
                              sx={{ textTransform: "capitalize" }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                getFormattedPlanName(
                                  user.subscription_plan_name,
                                  user.subscription_plan_display_name
                                ) || "Free"
                              }
                              size="small"
                              color={
                                user.subscription_plan_name === "free"
                                  ? "default"
                                  : "success"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {user.companies_count || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(user.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                            >
                              {user.subscription_plan_name === "free" && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={(e) => handleStartTrial(e, user.id)}
                                  disabled={trialLoading}
                                  sx={{ textTransform: "none" }}
                                >
                                  Start Trial
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                endIcon={<ArrowForwardIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUserClick(user.id);
                                }}
                                sx={{ textTransform: "none" }}
                              >
                                View
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </>
  );
};
