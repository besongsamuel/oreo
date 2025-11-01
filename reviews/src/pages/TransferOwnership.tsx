import {
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { SEO } from "../components/SEO";
import { UserContext } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";
import { AdminUser, fetchAllUsers } from "../services/adminService";

interface CompanyDetails {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  owner_id: string;
  total_reviews?: number;
  total_locations?: number;
  average_rating?: number;
}

export const TransferOwnership = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const context = useContext(UserContext);
  const profile = context?.profile;

  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (profile && profile.role !== "admin") {
      navigate("/dashboard");
    }
  }, [profile, navigate]);

  // Fetch company details
  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId || !profile) return;

      try {
        setLoading(true);
        setError(null);

        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .single();

        if (companyError) throw companyError;

        // Check if admin owns this company
        if (companyData.owner_id !== profile.id) {
          setError(
            t(
              "transferOwnership.errorNotOwner",
              "You can only transfer ownership of companies you own."
            )
          );
          setLoading(false);
          return;
        }

        // Fetch company stats
        const { data: statsData } = await supabase
          .from("company_stats")
          .select("*")
          .eq("company_id", companyId)
          .single();

        setCompany({
          ...companyData,
          total_reviews: statsData?.total_reviews || 0,
          total_locations: statsData?.total_locations || 0,
          average_rating: statsData?.average_rating || 0,
        });
      } catch (err: any) {
        console.error("Error fetching company:", err);
        setError(
          err.message ||
            t(
              "transferOwnership.errorFetchCompany",
              "Failed to load company information"
            )
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [companyId, profile, supabase, t]);

  // Fetch all users
  useEffect(() => {
    const loadUsers = async () => {
      if (!profile || profile.role !== "admin") return;

      try {
        const usersData = await fetchAllUsers();
        // Filter out current user (can't transfer to themselves)
        const filteredUsers = usersData.filter(
          (user) => user.id !== profile.id
        );
        setUsers(filteredUsers);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setError(
          err.message ||
            t(
              "transferOwnership.errorFetchUsers",
              "Failed to load users"
            )
        );
      }
    };

    loadUsers();
  }, [profile, t]);

  const handleTransfer = () => {
    if (!selectedUser) {
      setError(
        t(
          "transferOwnership.errorNoUser",
          "Please select a user to transfer ownership to"
        )
      );
      return;
    }

    // Open confirmation modal
    setConfirmOpen(true);
  };

  const handleConfirmTransfer = async () => {
    if (!companyId || !selectedUser || !company) return;

    try {
      setTransferring(true);
      setError(null);

      // Update company owner_id
      const { error: updateError } = await supabase
        .from("companies")
        .update({ owner_id: selectedUser.id })
        .eq("id", companyId);

      if (updateError) throw updateError;

      // Navigate to companies page
      navigate("/companies");
    } catch (err: any) {
      console.error("Error transferring ownership:", err);
      setError(
        err.message ||
          t(
            "transferOwnership.errorTransfer",
            "Failed to transfer ownership"
          )
      );
      setTransferring(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          {t("transferOwnership.loading", "Loading...")}
        </Typography>
      </Container>
    );
  }

  if (error && !company) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/companies/${companyId}`)}
        >
          {t("transferOwnership.backToCompany", "Back to Company")}
        </Button>
      </Container>
    );
  }

  return (
    <>
      <SEO
        title={t("transferOwnership.title", "Transfer Company Ownership")}
        description={t(
          "transferOwnership.description",
          "Transfer ownership of a company to another user"
        )}
      />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Header */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/companies/${companyId}`)}
            >
              {t("transferOwnership.back", "Back")}
            </Button>
            <Typography variant="h4" component="h1" fontWeight={700}>
              {t("transferOwnership.title", "Transfer Company Ownership")}
            </Typography>
          </Stack>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Two Column Layout */}
          <Grid container spacing={4}>
            {/* Left Column - Company Info */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: "18px" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    {t(
                      "transferOwnership.companyInfo",
                      "Company Information"
                    )}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t("transferOwnership.companyName", "Company Name")}
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {company?.name}
                      </Typography>
                    </Box>
                    {company?.description && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t("transferOwnership.description", "Description")}
                        </Typography>
                        <Typography variant="body1">
                          {company.description}
                        </Typography>
                      </Box>
                    )}
                    {company?.industry && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t("transferOwnership.industry", "Industry")}
                        </Typography>
                        <Typography variant="body1">
                          {company.industry}
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t(
                          "transferOwnership.totalLocations",
                          "Total Locations"
                        )}
                      </Typography>
                      <Typography variant="body1">
                        {company?.total_locations || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t("transferOwnership.totalReviews", "Total Reviews")}
                      </Typography>
                      <Typography variant="body1">
                        {company?.total_reviews || 0}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column - User Selection */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: "18px" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{ mb: 2 }}
                  >
                    {t(
                      "transferOwnership.selectUser",
                      "Select New Owner"
                    )}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Stack spacing={3}>
                    <Autocomplete
                      options={users}
                      getOptionLabel={(option) =>
                        `${option.email}${option.full_name ? ` (${option.full_name})` : ""}`
                      }
                      value={selectedUser}
                      onChange={(_, newValue) => {
                        setSelectedUser(newValue);
                        setError(null);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t(
                            "transferOwnership.userSearch",
                            "Search by email or name"
                          )}
                          placeholder={t(
                            "transferOwnership.userPlaceholder",
                            "Type to search users..."
                          )}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box
                          component="li"
                          {...props}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            py: 1.5,
                          }}
                        >
                          <Typography variant="body1">
                            {option.email}
                          </Typography>
                          {option.full_name && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {option.full_name}
                            </Typography>
                          )}
                        </Box>
                      )}
                      noOptionsText={t(
                        "transferOwnership.noUsers",
                        "No users found"
                      )}
                    />

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={handleTransfer}
                      disabled={!selectedUser || transferring}
                      sx={{
                        borderRadius: "980px",
                        textTransform: "none",
                        fontWeight: 600,
                        py: 1.5,
                        mt: 2,
                      }}
                    >
                      {transferring
                        ? t("transferOwnership.transferring", "Transferring...")
                        : t("transferOwnership.transfer", "Transfer Ownership")}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Container>

      {/* Confirmation Modal */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <WarningIcon color="warning" />
            <Typography variant="h6" fontWeight={600}>
              {t(
                "transferOwnership.confirmTitle",
                "Confirm Ownership Transfer"
              )}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t(
              "transferOwnership.confirmMessage",
              "Are you sure you want to transfer ownership of {{companyName}} to {{userEmail}}?",
              {
                companyName: company?.name,
                userEmail: selectedUser?.email,
              }
            )}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {t(
                "transferOwnership.confirmWarning",
                "This will transfer all company data including locations, reviews, and platform connections to the new owner. This action cannot be undone."
              )}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={transferring}
          >
            {t("transferOwnership.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleConfirmTransfer}
            variant="contained"
            color="primary"
            disabled={transferring}
            startIcon={<WarningIcon />}
          >
            {transferring
              ? t("transferOwnership.transferring", "Transferring...")
              : t("transferOwnership.confirm", "Confirm Transfer")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

