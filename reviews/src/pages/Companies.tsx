import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Facebook as FacebookIcon,
  LocationOn as LocationIcon,
  MoreVert as MoreVertIcon,
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
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PlatformConnectionDialog } from "../components/PlatformConnectionDialog";
import { SEO } from "../components/SEO";
import { CompanyCardSkeleton } from "../components/SkeletonLoaders";
import { UserContext } from "../context/UserContext";
import { usePlatformIntegration } from "../hooks/usePlatformIntegration";
import { useSupabase } from "../hooks/useSupabase";
import { getAllPlatforms } from "../services/platforms/platformRegistry";

interface Company {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  total_locations?: number;
  total_reviews?: number;
  average_rating?: number;
  owner_email?: string;
  owner_name?: string | null;
  owner_role?: string;
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
  const { t } = useTranslation();
  const supabase = useSupabase();
  const context = useContext(UserContext);
  const profile = context?.profile;
  const canCreateCompany = context?.canCreateCompany;
  const getPlanLimit = context?.getPlanLimit;
  const navigate = useNavigate();
  const {
    connectPlatformUnified,
    connecting,
    error: platformError,
    success: platformSuccess,
  } = usePlatformIntegration();

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

  // Platform integration state
  const [platformDialogOpen, setPlatformDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyLocations, setCompanyLocations] = useState<
    Array<{ id: string; name: string; address: string }>
  >([]);
  const [platformMenuAnchor, setPlatformMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const platforms = getAllPlatforms();

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
      let companiesData;
      let companiesError;

      // If admin, fetch all companies with owner info
      if (profile.role === "admin") {
        const result = await supabase
          .from("companies")
          .select(
            `
            *,
            owner:profiles!owner_id (
              id,
              email,
              full_name,
              role
            )
          `
          )
          .order("created_at", { ascending: false });
        companiesData = result.data;
        companiesError = result.error;
      } else {
        // Regular users see only their companies
        const result = await supabase
          .from("companies")
          .select("*")
          .eq("owner_id", profile.id)
          .order("created_at", { ascending: false });
        companiesData = result.data;
        companiesError = result.error;
      }

      if (companiesError) throw companiesError;

      // Fetch stats for all companies
      const companyIds = companiesData?.map((c) => c.id) || [];
      const { data: statsData } = await supabase
        .from("company_stats")
        .select("*")
        .in("company_id", companyIds);

      // Merge stats with companies and add owner info
      const companiesWithStats = (companiesData || []).map((company) => {
        const stats = statsData?.find((s) => s.company_id === company.id);
        const owner = (company.owner as any) || {};
        return {
          ...company,
          total_locations: stats?.total_locations || 0,
          total_reviews: stats?.total_reviews || 0,
          average_rating: stats?.average_rating || 0,
          owner_email: owner.email,
          owner_name: owner.full_name,
          owner_role: owner.role,
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
    // If creating new company, check limits first
    if (!company && !editingCompany) {
      // Check if user can create another company
      if (!canCreateCompany?.() && profile?.role !== "admin") {
        const maxCompanies = getPlanLimit?.("max_companies") ?? 1;
        setError(
          t("companies.companyLimitReached", {
            max: maxCompanies,
            defaultValue: `You have reached the limit of ${maxCompanies} company. Please upgrade your plan to add more companies.`,
          })
        );
        setUpgradeDialogOpen(true);
        return;
      }
    }

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
        // Check company limit before creating (backend will also enforce)
        if (!canCreateCompany?.() && profile?.role !== "admin") {
          const maxCompanies = getPlanLimit?.("max_companies") ?? 1;
          throw new Error(
            t("companies.companyLimitReached", {
              max: maxCompanies,
              defaultValue: `Company limit reached. Maximum ${maxCompanies} company allowed on your current plan.`,
            })
          );
        }

        // Create new company
        const { error: insertError } = await supabase.from("companies").insert({
          owner_id: profile.id,
          name: formData.name,
          description: formData.description || null,
          industry: formData.industry || null,
          website: websiteUrl,
        });

        if (insertError) {
          // Check if error is about company limit
          if (insertError.message?.includes("Company limit reached")) {
            setUpgradeDialogOpen(true);
          }
          throw insertError;
        }
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

  // Platform integration functions
  const handlePlatformMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    company: Company
  ) => {
    setPlatformMenuAnchor(event.currentTarget);
    setSelectedCompany(company);
  };

  const handlePlatformMenuClose = () => {
    setPlatformMenuAnchor(null);
    setSelectedCompany(null);
    setSelectedPlatform(null);
  };

  const handlePlatformSelect = async (platformName: string) => {
    if (!selectedCompany) return;

    setSelectedPlatform(platformName);
    handlePlatformMenuClose();

    try {
      // Get company locations
      const { data: locations, error } = await supabase
        .from("locations")
        .select("id, name, address")
        .eq("company_id", selectedCompany.id)
        .eq("is_active", true);

      if (error) throw error;

      if (!locations || locations.length === 0) {
        setError(t("companies.addLocationFirst"));
        return;
      }

      setCompanyLocations(locations);
      setPlatformDialogOpen(true);
    } catch (err: any) {
      setError(err.message || t("companies.failedLoadLocations"));
    }
  };

  const handlePlatformConnect = async (
    platformLocationId: string,
    locationId: string,
    verifiedListing?: any
  ) => {
    if (!selectedCompany || !selectedPlatform) return;

    try {
      await connectPlatformUnified(
        selectedPlatform,
        platformLocationId,
        locationId,
        verifiedListing
      );
      await fetchCompanies(); // Refresh company data
    } catch (err: any) {
      setError(err.message || t("companies.failedConnectPlatform"));
    }
  };

  const handlePlatformDialogClose = () => {
    setPlatformDialogOpen(false);
    setSelectedCompany(null);
    setCompanyLocations([]);
    setSelectedPlatform(null);
  };

  if (loading) {
    return (
      <Container
        maxWidth="xl"
        sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
        <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Header Skeleton */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {t("companies.title")}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t("companies.loading")}
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
    <>
      <SEO
        title={t("companies.companiesSeoTitle")}
        description={t("companies.companiesSeoDescription")}
        keywords={t("companies.companiesSeoKeywords")}
      />
      <Container
        maxWidth="xl"
        sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
        <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Box>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" } }}
              >
                {t("companies.title")}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {t("companies.manage")}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={
                <AddIcon sx={{ display: { xs: "none", sm: "inline" } }} />
              }
              onClick={() => handleOpenDialog()}
              sx={{
                minWidth: { xs: "auto", sm: "auto" },
                px: { xs: 2, sm: 3 },
              }}
            >
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("companies.addCompany")}
              </Box>
              <Box
                component="span"
                sx={{ display: { xs: "inline", sm: "none" } }}
              >
                {t("companies.add")}
              </Box>
            </Button>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          {/* Admin View - Separate sections */}
          {profile?.role === "admin" ? (
            <>
              {/* Owned by You */}
              <Box>
                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                  Owned by You
                </Typography>
                {companies.filter((c) => c.owner_id === profile.id).length ===
                0 ? (
                  <Card>
                    <CardContent>
                      <Stack spacing={2} alignItems="center" py={4}>
                        <BusinessIcon
                          sx={{ fontSize: 64, color: "text.secondary" }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No companies you own
                        </Typography>
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
                      alignItems: "stretch",
                    }}
                  >
                    {companies
                      .filter((c) => c.owner_id === profile.id)
                      .map((company) => (
                        <Box key={company.id} sx={{ height: "100%" }}>
                          <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                              <Stack spacing={2} sx={{ flexGrow: 1 }}>
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
                                  <Stack direction="row" spacing={0.5}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) =>
                                        handlePlatformMenuOpen(e, company)
                                      }
                                      disabled={connecting}
                                    >
                                      <MoreVertIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenDialog(company)}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Stack>
                                </Stack>

                                {company.description && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
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
                                      <LocationIcon
                                        fontSize="small"
                                        color="action"
                                      />
                                      <Typography variant="body2">
                                        {company.total_locations}{" "}
                                        {company.total_locations !== 1
                                          ? t("companies.multipleLocations")
                                          : t("companies.singleLocation")}
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
                                        {company.average_rating?.toFixed(1) ||
                                          "0.0"}
                                      </Typography>
                                    </Stack>
                                  </Stack>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {company.total_reviews}{" "}
                                    {company.total_reviews !== 1
                                      ? t("companies.multipleReviews")
                                      : t("companies.singleReview")}
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
                                  onClick={() =>
                                    navigate(`/companies/${company.id}`)
                                  }
                                  sx={{
                                    justifyContent: "space-between",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    mt: "auto",
                                  }}
                                >
                                  {t("companies.viewDetails")}
                                </Button>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Box>
                      ))}
                  </Box>
                )}
              </Box>

              {/* Owned by Others */}
              <Box>
                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                  Owned by Others
                </Typography>
                {companies.filter((c) => c.owner_id !== profile.id).length ===
                0 ? (
                  <Card>
                    <CardContent>
                      <Stack spacing={2} alignItems="center" py={4}>
                        <BusinessIcon
                          sx={{ fontSize: 64, color: "text.secondary" }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No companies owned by other users
                        </Typography>
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
                      alignItems: "stretch",
                    }}
                  >
                    {companies
                      .filter((c) => c.owner_id !== profile.id)
                      .map((company) => (
                        <Box key={company.id} sx={{ height: "100%" }}>
                          <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                              <Stack spacing={2} sx={{ flexGrow: 1 }}>
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="flex-start"
                                >
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" gutterBottom>
                                      {company.name}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                      sx={{ mb: 0.5 }}
                                    >
                                      Owner:{" "}
                                      {company.owner_name ||
                                        company.owner_email}
                                    </Typography>
                                    {company.industry && (
                                      <Chip
                                        label={company.industry}
                                        size="small"
                                        variant="outlined"
                                      />
                                    )}
                                  </Box>
                                  <Stack direction="row" spacing={0.5}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) =>
                                        handlePlatformMenuOpen(e, company)
                                      }
                                      disabled={connecting}
                                    >
                                      <MoreVertIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenDialog(company)}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Stack>
                                </Stack>

                                {company.description && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
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
                                      <LocationIcon
                                        fontSize="small"
                                        color="action"
                                      />
                                      <Typography variant="body2">
                                        {company.total_locations}{" "}
                                        {company.total_locations !== 1
                                          ? t("companies.multipleLocations")
                                          : t("companies.singleLocation")}
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
                                        {company.average_rating?.toFixed(1) ||
                                          "0.0"}
                                      </Typography>
                                    </Stack>
                                  </Stack>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {company.total_reviews}{" "}
                                    {company.total_reviews !== 1
                                      ? t("companies.multipleReviews")
                                      : t("companies.singleReview")}
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
                                  onClick={() =>
                                    navigate(`/companies/${company.id}`)
                                  }
                                  sx={{
                                    justifyContent: "space-between",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    mt: "auto",
                                  }}
                                >
                                  {t("companies.viewDetails")}
                                </Button>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Box>
                      ))}
                  </Box>
                )}
              </Box>
            </>
          ) : (
            <>
              {/* Regular User View */}
              {companies.length === 0 ? (
                <Card>
                  <CardContent>
                    <Stack spacing={2} alignItems="center" py={4}>
                      <BusinessIcon
                        sx={{ fontSize: 64, color: "text.secondary" }}
                      />
                      <Typography variant="h6" color="text.secondary">
                        {t("companies.noCompaniesYet")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t("companies.addFirstCompany")}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                      >
                        {t("companies.addCompany")}
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
                    alignItems: "stretch",
                  }}
                >
                  {companies.map((company) => (
                    <Box key={company.id} sx={{ height: "100%" }}>
                      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                          <Stack spacing={2} sx={{ flexGrow: 1 }}>
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
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={(e) =>
                                    handlePlatformMenuOpen(e, company)
                                  }
                                  disabled={connecting}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(company)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Stack>
                            </Stack>

                            {company.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
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
                                  <LocationIcon
                                    fontSize="small"
                                    color="action"
                                  />
                                  <Typography variant="body2">
                                    {company.total_locations}{" "}
                                    {company.total_locations !== 1
                                      ? t("companies.multipleLocations")
                                      : t("companies.singleLocation")}
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
                                    {company.average_rating?.toFixed(1) ||
                                      "0.0"}
                                  </Typography>
                                </Stack>
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {company.total_reviews}{" "}
                                {company.total_reviews !== 1
                                  ? t("companies.multipleReviews")
                                  : t("companies.singleReview")}
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
                              onClick={() =>
                                navigate(`/companies/${company.id}`)
                              }
                              sx={{
                                justifyContent: "space-between",
                                textTransform: "none",
                                fontWeight: 500,
                                mt: "auto",
                              }}
                            >
                              {t("companies.viewDetails")}
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              )}
            </>
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
                {editingCompany
                  ? t("companies.editCompanyDialog")
                  : t("companies.addCompanyDialog")}
              </DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {error && <Alert severity="error">{error}</Alert>}
                  <TextField
                    label={t("companies.companyName")}
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
                        label={t("companies.industry")}
                        placeholder={t("companies.industryPlaceholder")}
                      />
                    )}
                  />
                  <TextField
                    label={t("companies.website")}
                    fullWidth
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    disabled={submitting}
                    placeholder={t("companies.websitePlaceholder")}
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
                    label={t("companies.description")}
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
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting || !formData.name}
                >
                  {submitting
                    ? t("companies.saving")
                    : editingCompany
                    ? t("companies.update")
                    : t("companies.create")}
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          {/* Platform Menu */}
          <Menu
            anchorEl={platformMenuAnchor}
            open={Boolean(platformMenuAnchor)}
            onClose={handlePlatformMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            {platforms.map((platform) => (
              <MenuItem
                key={platform.name}
                onClick={() => handlePlatformSelect(platform.name)}
                disabled={platform.status !== "active"}
              >
                <ListItemIcon>
                  {platform.name === "facebook" && (
                    <FacebookIcon sx={{ color: platform.color }} />
                  )}
                  {/* Add other platform icons as they become available */}
                </ListItemIcon>
                <ListItemText
                  primary={platform.displayName}
                  secondary={
                    platform.status === "coming_soon"
                      ? t("companies.comingSoon")
                      : undefined
                  }
                />
              </MenuItem>
            ))}
          </Menu>

          {/* Platform Connection Dialog */}
          {selectedPlatform && selectedCompany && (
            <PlatformConnectionDialog
              open={platformDialogOpen}
              onClose={handlePlatformDialogClose}
              onConnect={handlePlatformConnect}
              platformName={selectedPlatform}
              companyName={selectedCompany.name}
              locations={companyLocations}
            />
          )}

          {/* Platform Integration Messages */}
          {platformError && (
            <Alert severity="error" onClose={() => setError(null)}>
              {platformError}
            </Alert>
          )}
          {platformSuccess && (
            <Alert severity="success" onClose={() => setError(null)}>
              {platformSuccess}
            </Alert>
          )}

          {/* Upgrade Dialog */}
          <Dialog
            open={upgradeDialogOpen}
            onClose={() => setUpgradeDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {t("companies.upgradeRequired", {
                defaultValue: "Upgrade Required",
              })}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body1">
                  {t("companies.companyLimitMessage", {
                    defaultValue:
                      "You've reached the maximum number of companies allowed on your current plan.",
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("companies.upgradeToAddMore", {
                    defaultValue:
                      "Upgrade to a higher plan to add more companies and unlock additional features.",
                  })}
                </Typography>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setUpgradeDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setUpgradeDialogOpen(false);
                  navigate("/pricing");
                }}
              >
                {t("companies.viewPricing", {
                  defaultValue: "View Pricing",
                })}
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </Container>
    </>
  );
};
