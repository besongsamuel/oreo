import { Check as CheckIcon, Star as StarIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PlatformSelection } from "../components/PlatformSelection";
import { ProfileSectionSkeleton } from "../components/SkeletonLoaders";
import { UserContext } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";
import { useUser } from "../hooks/useUser";
import { getFormattedPlanName } from "../utils/planNames";
import { supabase as supabaseClient } from "../lib/supabaseClient";

export const Profile = () => {
  const { t, i18n } = useTranslation();
  const context = useContext(UserContext);
  const user = context?.user;
  const profile = context?.profile;
  const currentPlan = context?.currentPlan;
  const supabase = useSupabase();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [preferredLanguage, setPreferredLanguage] = useState(
    profile?.preferred_language || "fr"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [showPlatformManagement, setShowPlatformManagement] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    Array<{ id: string; name: string; display_name: string }>
  >([]);
  const [platformsLoading, setPlatformsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch user's selected platforms
  useEffect(() => {
    const fetchSelectedPlatforms = async () => {
      if (!user?.id) return;

      setPlatformsLoading(true);
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
          .eq("user_id", user.id);

        if (error) throw error;

        const platforms = (data || [])
          .map((item: any) => ({
            id: item.platforms?.id,
            name: item.platforms?.name,
            display_name: item.platforms?.display_name,
          }))
          .filter((p: any) => p.id && p.name && p.display_name);

        setSelectedPlatforms(platforms);
      } catch (err: any) {
        console.error("Error fetching selected platforms:", err);
      } finally {
        setPlatformsLoading(false);
      }
    };

    fetchSelectedPlatforms();
  }, [user?.id, supabase]);

  // Show skeleton if profile is not yet loaded
  if (!user || !profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {t("profile.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("profile.loading")}
            </Typography>
          </Box>
          <ProfileSectionSkeleton />
          <ProfileSectionSkeleton />
        </Stack>
      </Container>
    );
  }

  const handleEdit = () => {
    setFullName(profile?.full_name || "");
    setCompanyName(profile?.company_name || "");
    setPreferredLanguage(profile?.preferred_language || "fr");
    setIsEditing(true);
    setError(null);
    setSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          company_name: companyName,
          preferred_language: preferredLanguage,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update i18next language if language changed
      if (preferredLanguage !== profile?.preferred_language) {
        i18n.changeLanguage(preferredLanguage);
        localStorage.setItem("i18nextLng", preferredLanguage);
      }

      setSuccess(true);
      setIsEditing(false);

      setTimeout(() => setSuccess(false), 3000);

      // Profile will automatically refresh via UserContext
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || t("profile.failedUpdate"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setSubscriptionLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      // Get base URL for redirect
      const baseUrl = window.location.origin;

      // Get Supabase URL
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("Missing Supabase URL configuration");
      }

      // Call create-checkout-session edge function
      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planName: "pro", returnUrl: baseUrl }),
        }
      );

      const data = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      setError(err.message || "Failed to start checkout process");
      setSubscriptionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelDialogOpen(false);
    setSubscriptionLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      // Get Supabase URL
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("Missing Supabase URL configuration");
      }

      // Call cancel-subscription edge function
      const response = await fetch(
        `${supabaseUrl}/functions/v1/cancel-subscription`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      // Profile will refresh automatically via UserContext
      // Redirect to cancellation confirmation page
      navigate("/subscription/cancelled");
    } catch (err: any) {
      console.error("Error cancelling subscription:", err);
      setError(err.message || "Failed to cancel subscription");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const formattedCurrentPlanName = getFormattedPlanName(
    currentPlan?.plan_name,
    currentPlan?.plan_display_name,
    t,
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t("profile.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("profile.subtitle")}
          </Typography>
        </Box>

        {error && (
          <Paper sx={{ p: 2, bgcolor: "error.light", color: "error.dark" }}>
            <Typography variant="body2">{error}</Typography>
          </Paper>
        )}

        {success && (
          <Paper sx={{ p: 2, bgcolor: "success.light", color: "success.dark" }}>
            <Typography variant="body2">
              {t("profile.profileUpdated")}
            </Typography>
          </Paper>
        )}

        <Card elevation={2}>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t("profile.personalInfo")}
                </Typography>
                <Divider />
              </Box>

              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                  >
                    {t("profile.fullName")}
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1">
                      {profile?.full_name || t("profile.notSet")}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                  >
                    {t("profile.email")}
                  </Typography>
                  <Typography variant="body1">{user?.email}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("profile.emailCannotChange")}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                  >
                    {t("profile.companyName")}
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loading}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1">
                      {profile?.company_name || t("profile.notSet")}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                  >
                    {t("profile.role")}
                  </Typography>
                  <Chip
                    label={profile?.role || "user"}
                    size="small"
                    color="primary"
                  />
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                  >
                    {t("profile.preferredLanguage")}
                  </Typography>
                  {isEditing ? (
                    <Select
                      fullWidth
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      disabled={loading}
                      size="small"
                    >
                      <MenuItem value="en">{t("common.english")}</MenuItem>
                      <MenuItem value="fr">{t("common.french")}</MenuItem>
                    </Select>
                  ) : (
                    <Typography variant="body1">
                      {preferredLanguage === "en"
                        ? t("common.english")
                        : t("common.french")}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                {isEditing ? (
                  <>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading ? t("profile.saving") : t("profile.saveChanges")}
                    </Button>
                  </>
                ) : (
                  <Button variant="contained" onClick={handleEdit}>
                    {t("profile.editProfile")}
                  </Button>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {!currentPlan || currentPlan.plan_name === "free" ? (
          <Card
            elevation={4}
            sx={{
              background:
                "linear-gradient(135deg, rgba(0, 113, 227, 0.05) 0%, rgba(0, 113, 227, 0.02) 100%)",
              border: "2px solid",
              borderColor: "primary.main",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <StarIcon sx={{ color: "primary.main", fontSize: 28 }} />
                    <Typography variant="h5" fontWeight={700}>
                      {t("subscription.upgradeToPro")}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {t("subscription.unlockFeatures")}
                  </Typography>
                </Box>

                <Stack direction="row" alignItems="baseline" spacing={1}>
                  <Typography
                    variant="h3"
                    fontWeight={700}
                    color="primary.main"
                  >
                    $49
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {t("subscription.perMonth")}
                  </Typography>
                </Stack>

                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckIcon sx={{ color: "success.main", fontSize: 20 }} />
                    <Typography variant="body2">
                      {t("subscription.benefitUnlimited")}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckIcon sx={{ color: "success.main", fontSize: 20 }} />
                    <Typography variant="body2">
                      {t("subscription.benefitMonthlySummary")}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckIcon sx={{ color: "success.main", fontSize: 20 }} />
                    <Typography variant="body2">
                      {t("subscription.benefitAdvancedSentiment")}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckIcon sx={{ color: "success.main", fontSize: 20 }} />
                    <Typography variant="body2">
                      {t("subscription.benefitPrioritySupport")}
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleUpgrade}
                  disabled={subscriptionLoading}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    borderRadius: 980,
                    fontSize: "1rem",
                    fontWeight: 600,
                    textTransform: "none",
                    background:
                      "linear-gradient(135deg, #0071e3 0%, #0051a0 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #0051a0 0%, #003d7a 100%)",
                    },
                  }}
                >
                  {subscriptionLoading
                    ? t("common.loading")
                    : t("subscription.upgradeNow")}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Card elevation={2}>
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t("subscription.currentPlan")}
                  </Typography>
                  <Divider />
                </Box>

                <Stack spacing={2}>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      gutterBottom
                      display="block"
                    >
                      {t("subscription.plan")}
                    </Typography>
                    <Chip
                      label={
                        formattedCurrentPlanName || t("subscription.paid")
                      }
                      size="small"
                      color={
                        currentPlan?.plan_name === "free"
                          ? "default"
                          : "success"
                      }
                      icon={<StarIcon />}
                    />
                  </Box>

                  {/* Plan Features */}
                  {currentPlan?.features && currentPlan.features.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        gutterBottom
                        display="block"
                        sx={{ mb: 1 }}
                      >
                        Features
                      </Typography>
                      <Stack spacing={1}>
                        {currentPlan.features.map((feature) => {
                          let displayText = feature.feature_display_name;

                          // Add limit information if available
                          if (
                            feature.limit_value &&
                            typeof feature.limit_value === "object"
                          ) {
                            const limits = feature.limit_value;
                            // Admins have unlimited - show "Unlimited" instead of numbers
                            if (profile?.role === "admin") {
                              if (limits.max_companies) {
                                displayText = `${displayText} (Unlimited)`;
                              } else if (limits.max_locations_per_company) {
                                displayText = `${displayText} (Unlimited per company)`;
                              } else if (limits.max_reviews_per_sync) {
                                displayText = `${displayText} (Unlimited reviews)`;
                              }
                            } else {
                              if (limits.max_companies) {
                                displayText = `${displayText} (${
                                  limits.max_companies
                                } ${
                                  limits.max_companies === 1
                                    ? "company"
                                    : "companies"
                                })`;
                              } else if (limits.max_locations_per_company) {
                                displayText = `${displayText} (${limits.max_locations_per_company} per company)`;
                              } else if (limits.max_reviews_per_sync) {
                                displayText = `${displayText} (${limits.max_reviews_per_sync} reviews)`;
                              }
                            }
                          }

                          return (
                            <Box
                              key={feature.feature_id}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <CheckIcon
                                sx={{ color: "success.main", fontSize: 18 }}
                              />
                              <Typography variant="body2">
                                {displayText}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {profile?.subscription_expires_at &&
                    currentPlan?.plan_name !== "free" && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          gutterBottom
                          display="block"
                        >
                          {t("subscription.expiresAt")}
                        </Typography>
                        <Typography variant="body1">
                          {new Date(
                            profile.subscription_expires_at
                          ).toLocaleDateString(i18n.language, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </Typography>
                      </Box>
                    )}

                  {currentPlan?.plan_name !== "free" && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={subscriptionLoading}
                      sx={{ mt: 2 }}
                    >
                      {subscriptionLoading
                        ? t("common.loading")
                        : t("subscription.cancel")}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Dialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
        >
          <DialogTitle>{t("subscription.cancel")}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t("subscription.confirmCancel")}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCancelSubscription}
              color="error"
              variant="contained"
            >
              {t("subscription.cancel")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Platform Selection */}
        <Card elevation={2}>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Platform Selection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your selected review platforms
                </Typography>
                <Divider sx={{ mt: 2 }} />
              </Box>

              {platformsLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading platforms...
                </Typography>
              ) : (
                <>
                  {selectedPlatforms.length > 0 ? (
                    <>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          gutterBottom
                          display="block"
                          sx={{ mb: 1 }}
                        >
                          Selected Platforms
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          gap={1}
                        >
                          {selectedPlatforms.map((platform) => (
                            <Chip
                              key={platform.id}
                              label={platform.display_name}
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        You have selected {selectedPlatforms.length} of{" "}
                        {profile?.role === "admin"
                          ? "Unlimited"
                          : context?.getPlanLimit?.("max_platforms") ?? 3}{" "}
                        platform{selectedPlatforms.length !== 1 ? "s" : ""}{" "}
                        available.
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Alert severity="info">
                        <Typography variant="body2">
                          You haven't selected any platforms yet. Use the
                          platform selection below to choose your review
                          platforms.
                        </Typography>
                      </Alert>

                      {user?.id && (
                        <Button
                          variant="contained"
                          onClick={() => setShowPlatformManagement(true)}
                        >
                          Select Platforms
                        </Button>
                      )}
                    </>
                  )}

                  {showPlatformManagement && user?.id && (
                    <Box>
                      <Button
                        variant="text"
                        onClick={() => setShowPlatformManagement(false)}
                        sx={{ mb: 2 }}
                      >
                        ← Back to Profile
                      </Button>
                      <PlatformSelection
                        userId={user.id}
                        onComplete={() => {
                          setShowPlatformManagement(false);
                          // Refresh platforms after selection
                          const fetchSelectedPlatforms = async () => {
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
                                .eq("user_id", user.id);

                              if (error) throw error;

                              const platforms = (data || [])
                                .map((item: any) => ({
                                  id: item.platforms?.id,
                                  name: item.platforms?.name,
                                  display_name: item.platforms?.display_name,
                                }))
                                .filter(
                                  (p: any) => p.id && p.name && p.display_name
                                );

                              setSelectedPlatforms(platforms);
                            } catch (err: any) {
                              console.error(
                                "Error fetching selected platforms:",
                                err
                              );
                            }
                          };
                          fetchSelectedPlatforms();
                        }}
                        allowSkip={false}
                      />
                    </Box>
                  )}
                </>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t("profile.accountDetails")}
                </Typography>
                <Divider />
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {t("profile.userId")}
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="monospace"
                  sx={{ wordBreak: "break-all" }}
                >
                  {user?.id}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {t("profile.accountCreated")}
                </Typography>
                <Typography variant="body2">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString(
                        i18n.language,
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : t("profile.unknown")}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};
