import {
  ArrowForward as ArrowForwardIcon,
  People as PeopleIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { useTrial } from "../hooks/useTrial";
import { AdminUser, fetchAllUsers } from "../services/adminService";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);
  const profile = context?.profile;
  const isAdmin = context?.isAdmin;
  const { startTrial, loading: trialLoading } = useTrial();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

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
  }, [profile, isAdmin, navigate]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.email?.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query) ||
        user.company_name?.toLowerCase().includes(query) ||
        user.subscription_plan_display_name?.toLowerCase().includes(query)
    );
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
                                user.subscription_plan_display_name || "Free"
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
