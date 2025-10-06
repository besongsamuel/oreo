import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  LanguageOutlined as WebIcon,
} from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompanyCardSkeleton } from "../components/SkeletonLoaders";
import { useProfile } from "../hooks/useProfile";
import { useSupabase } from "../hooks/useSupabase";

interface Company {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  total_locations?: number;
  total_reviews?: number;
  average_rating?: number;
}

// Common industry options for autocomplete
const INDUSTRY_OPTIONS = [
  "Restaurant",
  "Hotel & Hospitality",
  "Retail",
  "Healthcare",
  "Beauty & Spa",
  "Automotive",
  "Real Estate",
  "Education",
  "Fitness & Wellness",
  "Entertainment",
  "Professional Services",
  "Home Services",
  "Technology",
  "Financial Services",
  "Legal Services",
  "Construction",
  "Manufacturing",
  "E-commerce",
  "Food & Beverage",
  "Travel & Tourism",
];

export const Companies = () => {
  const supabase = useSupabase();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    industry: "",
    website: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, profile]);

  const fetchCompanies = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    try {
      // Fetch companies with stats
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false });

      if (companiesError) throw companiesError;

      // Fetch stats for each company
      const { data: statsData } = await supabase
        .from("company_stats")
        .select("*")
        .eq("owner_id", profile.id);

      // Merge stats with companies
      const companiesWithStats = (companiesData || []).map((company) => {
        const stats = statsData?.find((s) => s.company_id === company.id);
        return {
          ...company,
          total_locations: stats?.total_locations || 0,
          total_reviews: stats?.total_reviews || 0,
          average_rating: stats?.average_rating || 0,
        };
      });

      setCompanies(companiesWithStats);
    } catch (err: any) {
      console.error("Error fetching companies:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      // Strip https:// or http:// from website for display
      let websiteDisplay = company.website || "";
      if (websiteDisplay.startsWith("https://")) {
        websiteDisplay = websiteDisplay.substring(8);
      } else if (websiteDisplay.startsWith("http://")) {
        websiteDisplay = websiteDisplay.substring(7);
      }
      setFormData({
        name: company.name,
        description: company.description || "",
        industry: company.industry || "",
        website: websiteDisplay,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: "",
        description: "",
        industry: "",
        website: "",
      });
    }
    setOpenDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCompany(null);
    setFormData({
      name: "",
      description: "",
      industry: "",
      website: "",
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    setError(null);

    try {
      // Format website URL with https:// if it has a value
      let websiteUrl = formData.website?.trim() || null;
      if (
        websiteUrl &&
        !websiteUrl.startsWith("http://") &&
        !websiteUrl.startsWith("https://")
      ) {
        websiteUrl = `https://${websiteUrl}`;
      }

      if (editingCompany) {
        // Update existing company
        const { error: updateError } = await supabase
          .from("companies")
          .update({
            name: formData.name,
            description: formData.description || null,
            industry: formData.industry || null,
            website: websiteUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCompany.id);

        if (updateError) throw updateError;
      } else {
        // Create new company
        const { error: insertError } = await supabase.from("companies").insert({
          owner_id: profile.id,
          name: formData.name,
          description: formData.description || null,
          industry: formData.industry || null,
          website: websiteUrl,
        });

        if (insertError) throw insertError;
      }

      await fetchCompanies();
      handleCloseDialog();
    } catch (err: any) {
      console.error("Error saving company:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Header Skeleton */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Companies
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Loading your companies...
              </Typography>
            </Box>
          </Stack>

          {/* Companies Grid Skeleton */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CompanyCardSkeleton key={i} />
            ))}
          </Box>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Companies
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage the businesses you're analyzing
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Company
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {/* Companies Grid */}
        {companies.length === 0 ? (
          <Card>
            <CardContent>
              <Stack spacing={2} alignItems="center" py={4}>
                <BusinessIcon sx={{ fontSize: 64, color: "text.secondary" }} />
                <Typography variant="h6" color="text.secondary">
                  No companies yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add your first company to start analyzing reviews
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Company
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {companies.map((company) => (
              <Box key={company.id}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {company.name}
                          </Typography>
                          {company.industry && (
                            <Chip
                              label={company.industry}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(company)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Stack>

                      {company.description && (
                        <Typography variant="body2" color="text.secondary">
                          {company.description}
                        </Typography>
                      )}

                      <Stack spacing={1}>
                        <Stack direction="row" spacing={2}>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {company.total_locations} location
                              {company.total_locations !== 1 ? "s" : ""}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <StarIcon
                              fontSize="small"
                              sx={{ color: "warning.main" }}
                            />
                            <Typography variant="body2">
                              {company.average_rating?.toFixed(1) || "0.0"}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {company.total_reviews} review
                          {company.total_reviews !== 1 ? "s" : ""}
                        </Typography>
                      </Stack>

                      {company.website && (
                        <Typography
                          variant="caption"
                          component="a"
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: "primary.main" }}
                        >
                          {company.website}
                        </Typography>
                      )}

                      <Divider />

                      <Button
                        variant="text"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate(`/companies/${company.id}`)}
                        sx={{
                          justifyContent: "space-between",
                          textTransform: "none",
                          fontWeight: 500,
                        }}
                      >
                        View Details
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}

        {/* Add/Edit Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingCompany ? "Edit Company" : "Add Company"}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                  label="Company Name"
                  required
                  fullWidth
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={submitting}
                />
                <Autocomplete
                  freeSolo
                  fullWidth
                  options={INDUSTRY_OPTIONS}
                  value={formData.industry}
                  onChange={(_, newValue) =>
                    setFormData({ ...formData, industry: newValue || "" })
                  }
                  onInputChange={(_, newInputValue) =>
                    setFormData({ ...formData, industry: newInputValue })
                  }
                  disabled={submitting}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Industry"
                      placeholder="Select or type an industry"
                    />
                  )}
                />
                <TextField
                  label="Website"
                  fullWidth
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  disabled={submitting}
                  placeholder="example.com"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WebIcon sx={{ color: "action.active", mr: 0.5 }} />
                        <Typography
                          variant="body1"
                          sx={{ color: "text.secondary" }}
                        >
                          https://
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={submitting}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || !formData.name}
              >
                {submitting
                  ? "Saving..."
                  : editingCompany
                  ? "Update"
                  : "Create"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Stack>
    </Container>
  );
};
