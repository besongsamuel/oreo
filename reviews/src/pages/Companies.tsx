import {
  Add as AddIcon,
  Business as BusinessIcon,
  Facebook as FacebookIcon,
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
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CompaniesCompanyCard } from "../components/CompaniesCompanyCard";
import { OnboardingCard } from "../components/OnboardingCard";
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
  logo_url?: string | null;
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
  const getPlanLimit = context?.getPlanLimit;
  const isAdmin = context?.isAdmin;
  const navigate = useNavigate();
  const {
    connectPlatformUnified,
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
  const [selectedPlatformsCount, setSelectedPlatformsCount] =
    useState<number>(0);
  const [selectedPlatformsList, setSelectedPlatformsList] = useState<
    Array<{ id: string; name: string; display_name: string }>
  >([]);
  const [platformCheckLoading, setPlatformCheckLoading] = useState(true);

  const platforms = getAllPlatforms();

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, profile]);

  // Check platform selection status
  useEffect(() => {
    const checkPlatformSelection = async () => {
      if (!profile?.id) {
        setPlatformCheckLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_platforms")
          .select(
            `
            platform_id,
            platforms:platform_id (
              id,
              name,
              display_name
            )
          `
          )
          .eq("user_id", profile.id);

        if (error) throw error;

        const platforms = (data || [])
          .map((item: any) => ({
            id: item.platforms?.id,
            name: item.platforms?.name,
            display_name: item.platforms?.display_name,
          }))
          .filter((p: any) => p.id && p.name && p.display_name);

        setSelectedPlatformsList(platforms);
        setSelectedPlatformsCount(platforms.length);
      } catch (err: any) {
        console.error("Error checking platform selection:", err);
      } finally {
        setPlatformCheckLoading(false);
      }
    };

    checkPlatformSelection();
  }, [profile?.id, supabase]);

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
      // Admins have unlimited companies
      if (isAdmin?.() || profile?.role === "admin") {
        // Allow admins to proceed
      } else {
        // Check actual company count against plan limit for regular users
        const maxCompanies = getPlanLimit?.("max_companies");

        // If maxCompanies is null or undefined, it means unlimited
        if (maxCompanies !== null && maxCompanies !== undefined) {
          // Count only companies owned by the current user (not all companies for admins)
          const userCompanyCount = companies.filter(
            (c) => c.owner_id === profile?.id
          ).length;

          if (userCompanyCount >= maxCompanies) {
            setError(
              t("companies.companyLimitReached", {
                max: maxCompanies,
                defaultValue: `You have reached the limit of ${maxCompanies} ${
                  maxCompanies === 1 ? "company" : "companies"
                }. Please upgrade your plan to add more companies.`,
              })
            );
            setUpgradeDialogOpen(true);
            return;
          }
        }
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
        // Admins have unlimited companies
        if (isAdmin?.() || profile?.role === "admin") {
          // Allow admins to proceed without limit check
        } else {
          // Check actual company count against plan limit for regular users
          const maxCompanies = getPlanLimit?.("max_companies");

          // If maxCompanies is null or undefined, it means unlimited
          if (maxCompanies !== null && maxCompanies !== undefined) {
            // Count only companies owned by the current user
            const userCompanyCount = companies.filter(
              (c) => c.owner_id === profile?.id
            ).length;

            if (userCompanyCount >= maxCompanies) {
              throw new Error(
                t("companies.companyLimitReached", {
                  max: maxCompanies,
                  defaultValue: `Company limit reached. Maximum ${maxCompanies} ${
                    maxCompanies === 1 ? "company" : "companies"
                  } allowed on your current plan.`,
                })
              );
            }
          }
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
            flexWrap="wrap"
            gap={2}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton
                variant="text"
                width="40%"
                height={48}
                sx={{
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
                  mb: 1,
                }}
              />
              <Skeleton
                variant="text"
                width="30%"
                height={24}
                sx={{ display: { xs: "none", sm: "block" } }}
              />
            </Box>
            <Skeleton
              variant="rounded"
              sx={{
                width: { xs: 80, sm: 180 },
                height: 40,
              }}
            />
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
          {/* Selected Platforms Display */}
          {!platformCheckLoading &&
            profile &&
            profile.role !== "admin" &&
            selectedPlatformsList.length > 0 && (
              <Box
                sx={{
                  pb: 3,
                  bgcolor: "rgba(13, 45, 83, 0.02)",
                  borderRadius: 2,
                  px: 2,
                  py: 2,
                }}
              >
                <Stack spacing={1.5}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    {t("companies.selectedPlatformsLabel")}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    gap={1}
                    justifyContent="center"
                  >
                    {selectedPlatformsList.map((platform) => (
                      <Chip
                        key={platform.id}
                        label={platform.display_name}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          fontSize: "0.75rem",
                          height: 24,
                          borderColor: "primary.main",
                          color: "primary.main",
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>
                <Divider sx={{ mt: 2, borderColor: "divider" }} />
              </Box>
            )}

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
                fontWeight={700}
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

          {/* Unified Onboarding Card */}
          {!platformCheckLoading &&
            profile &&
            profile.role !== "admin" &&
            (() => {
              // Admins won't see this onboarding card, but ensure no fallback for non-admins
              const maxPlatforms = getPlanLimit?.("max_platforms") ?? 3;
              const remainingPlatforms = maxPlatforms - selectedPlatformsCount;
              const hasNoCompanies = companies.length === 0;
              const hasCompletedPlatformSelection = remainingPlatforms === 0;

              let step:
                | "platform-selection"
                | "complete-platforms"
                | "add-company"
                | null = null;

              if (remainingPlatforms > 0) {
                step =
                  selectedPlatformsCount === 0
                    ? "platform-selection"
                    : "complete-platforms";
              } else if (hasCompletedPlatformSelection && hasNoCompanies) {
                step = "add-company";
              }

              return (
                <OnboardingCard
                  step={step}
                  selectedPlatformsCount={selectedPlatformsCount}
                  maxPlatforms={maxPlatforms}
                  hasCompanies={!hasNoCompanies}
                  onPlatformSelect={() => navigate("/select-platforms")}
                  onAddCompany={() => handleOpenDialog()}
                />
              );
            })()}

          {error && <Alert severity="error">{error}</Alert>}

          {/* Admin View - Separate sections */}
          {profile?.role === "admin" ? (
            <>
              {/* My Companies */}
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={600}
                  gutterBottom
                  sx={{ mb: 3 }}
                >
                  My Companies
                </Typography>
                {companies.filter((c) => c.owner_id === profile.id).length ===
                0 ? (
                  <Card>
                    <CardContent>
                      <Stack spacing={2} alignItems="center" py={6}>
                        <BusinessIcon
                          sx={{ fontSize: 64, color: "text.secondary" }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          You don't have any companies yet
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenDialog()}
                          sx={{ mt: 1 }}
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
                      gap: { xs: 2, sm: 3, md: 4 },
                      alignItems: "stretch",
                    }}
                  >
                    {companies
                      .filter((c) => c.owner_id === profile.id)
                      .map((company) => (
                        <CompaniesCompanyCard
                          key={company.id}
                          companyId={company.id}
                          companyName={company.name}
                          industry={company.industry}
                          description={company.description}
                          website={company.website}
                          logoUrl={company.logo_url}
                          totalLocations={company.total_locations || 0}
                          totalReviews={company.total_reviews || 0}
                          averageRating={company.average_rating || 0}
                          onEdit={() => handleOpenDialog(company)}
                          onViewDetails={() =>
                            navigate(`/companies/${company.id}`)
                          }
                        />
                      ))}
                  </Box>
                )}
              </Box>

              {/* Other Companies */}
              <Box sx={{ mt: 5 }}>
                <Typography
                  variant="h5"
                  fontWeight={600}
                  gutterBottom
                  sx={{ mb: 3 }}
                >
                  Other Companies
                </Typography>
                {companies.filter((c) => c.owner_id !== profile.id).length ===
                0 ? (
                  <Card>
                    <CardContent>
                      <Stack spacing={2} alignItems="center" py={6}>
                        <BusinessIcon
                          sx={{ fontSize: 64, color: "text.secondary" }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No other companies
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
                      gap: { xs: 2, sm: 3, md: 4 },
                      alignItems: "stretch",
                    }}
                  >
                    {companies
                      .filter((c) => c.owner_id !== profile.id)
                      .map((company) => (
                        <CompaniesCompanyCard
                          key={company.id}
                          companyId={company.id}
                          companyName={company.name}
                          industry={company.industry}
                          description={company.description}
                          website={company.website}
                          logoUrl={company.logo_url}
                          totalLocations={company.total_locations || 0}
                          totalReviews={company.total_reviews || 0}
                          averageRating={company.average_rating || 0}
                          ownerName={company.owner_name}
                          ownerEmail={company.owner_email}
                          onEdit={() => handleOpenDialog(company)}
                          onViewDetails={() =>
                            navigate(`/companies/${company.id}`)
                          }
                        />
                      ))}
                  </Box>
                )}
              </Box>
            </>
          ) : (
            <>
              {/* Regular User View */}
              {(() => {
                // Admins won't see this section, but ensure proper handling
                const maxPlatforms = getPlanLimit?.("max_platforms") ?? 3;
                const remainingPlatforms =
                  maxPlatforms - selectedPlatformsCount;
                const hasNoCompanies = companies.length === 0;
                const hasCompletedPlatformSelection = remainingPlatforms === 0;
                const showStep2 =
                  hasCompletedPlatformSelection && hasNoCompanies;

                // Don't show the old empty state if Step 2 is already showing
                if (hasNoCompanies && !showStep2) {
                  return (
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
                  );
                }

                if (!hasNoCompanies) {
                  return (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(2, 1fr)",
                          lg: "repeat(3, 1fr)",
                        },
                        gap: { xs: 2, sm: 3, md: 4 },
                        alignItems: "stretch",
                      }}
                    >
                      {companies.map((company) => (
                        <CompaniesCompanyCard
                          key={company.id}
                          companyId={company.id}
                          companyName={company.name}
                          industry={company.industry}
                          description={company.description}
                          website={company.website}
                          logoUrl={company.logo_url}
                          totalLocations={company.total_locations || 0}
                          totalReviews={company.total_reviews || 0}
                          averageRating={company.average_rating || 0}
                          onEdit={() => handleOpenDialog(company)}
                          onViewDetails={() =>
                            navigate(`/companies/${company.id}`)
                          }
                        />
                      ))}
                    </Box>
                  );
                }

                return null;
              })()}
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
