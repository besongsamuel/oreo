import {
  ArrowBack as ArrowBackIcon,
  HelpOutline as HelpOutlineIcon,
} from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";
import {
  PlatformRegistryEntry,
  getPlatformConfig,
} from "../services/platforms/platformRegistry";
import { PlatformSlugInstructionsModal } from "./PlatformSlugInstructionsModal";

interface ZembraListing {
  name: string;
  address?: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  categories?: string[];
  globalRating?: number;
  reviewCount?: {
    native: {
      total: number;
      active: number;
    };
  };
  profileImage?: string;
  url?: string;
}

interface PlatformConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConnect: (
    platformLocationId: string,
    locationId: string,
    platformName: string,
    verifiedListing?: ZembraListing
  ) => Promise<void>;
  platformName?: string; // Optional for location-specific mode
  companyName: string;
  locations: Array<{
    id: string;
    name: string;
    address: string;
    city?: string;
  }>;
  // Location-specific mode props
  preSelectedLocationId?: string;
  availablePlatforms?: PlatformRegistryEntry[];
}

const getPlatformIdLabel = (platformName: string, t: any): string => {
  switch (platformName.toLowerCase()) {
    case "facebook":
      return t("platform.platformIdLabels.pageId");
    case "google":
      return t("platform.platformIdLabels.placeId");
    case "yelp":
      return t("platform.platformIdLabels.businessId");
    case "opentable":
      return t("platform.platformIdLabels.restaurantId");
    case "tripadvisor":
      return t("platform.platformIdLabels.locationId");
    default:
      return t("platform.platformIdLabels.locationId");
  }
};

const getPlatformIdPlaceholder = (platformName: string, t: any): string => {
  const key = platformName.toLowerCase();
  return t(`platform.platformIdPlaceholders.${key}`, {
    defaultValue: "Enter platform location ID",
  });
};

export const PlatformConnectionDialog = ({
  open,
  onClose,
  onConnect,
  platformName,
  companyName,
  locations,
  preSelectedLocationId,
  availablePlatforms,
}: PlatformConnectionDialogProps) => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const context = useContext(UserContext);
  const isUserAdmin =
    context?.isAdmin?.() || context?.profile?.role === "admin";
  const isLocationSpecificMode = !!preSelectedLocationId;
  const [selectedLocation, setSelectedLocation] = useState<string | null>(
    preSelectedLocationId || null
  );
  const [selectedPlatformName, setSelectedPlatformName] = useState<string>(
    platformName || ""
  );
  const [platformLocationId, setPlatformLocationId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedListing, setVerifiedListing] = useState<ZembraListing | null>(
    null
  );
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableLocations, setAvailableLocations] = useState(locations);
  const [allPlatforms, setAllPlatforms] = useState<PlatformRegistryEntry[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [platformInstructions, setPlatformInstructions] = useState<any>(null);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [loadingInstructions, setLoadingInstructions] = useState(false);

  // Fetch all platforms if admin
  useEffect(() => {
    const fetchAllPlatforms = async () => {
      if (!isUserAdmin || !isLocationSpecificMode || !open) {
        return;
      }

      setLoadingPlatforms(true);
      try {
        const { data: platformsData, error: platformsError } = await supabase
          .from("platforms")
          .select("id, name, display_name, icon_url, base_url")
          .eq("is_active", true)
          .order("display_name");

        if (platformsError) throw platformsError;

        // Map database platforms to PlatformRegistryEntry format
        const mappedPlatforms = (platformsData || [])
          .map((platform) => {
            const config = getPlatformConfig(platform.name);
            return {
              name: platform.name,
              displayName: platform.display_name,
              color: config?.color || "#666666",
              iconUrl: platform.icon_url || config?.iconUrl,
              status: (config?.status || "active") as
                | "active"
                | "coming_soon"
                | "maintenance",
              provider: null,
            };
          })
          .filter((p) => p.status === "active");

        setAllPlatforms(mappedPlatforms);
      } catch (err: any) {
        console.error("Error fetching all platforms:", err);
      } finally {
        setLoadingPlatforms(false);
      }
    };

    fetchAllPlatforms();
  }, [isUserAdmin, isLocationSpecificMode, open, supabase]);

  // Fetch platform instructions when platform is selected
  useEffect(() => {
    const fetchPlatformInstructions = async () => {
      if (!selectedPlatformName || !open) {
        setPlatformInstructions(null);
        return;
      }

      setLoadingInstructions(true);
      try {
        const { data, error } = await supabase
          .from("platforms")
          .select("instructions")
          .eq("name", selectedPlatformName.toLowerCase())
          .single();

        if (error) throw error;
        setPlatformInstructions(data?.instructions || null);
      } catch (err: any) {
        console.error("Error fetching platform instructions:", err);
        setPlatformInstructions(null);
      } finally {
        setLoadingInstructions(false);
      }
    };

    fetchPlatformInstructions();
  }, [selectedPlatformName, open, supabase]);

  // Filter out locations that already have connections for this platform
  useEffect(() => {
    const filterAvailableLocations = async () => {
      if (!platformName || isLocationSpecificMode) {
        if (isLocationSpecificMode) {
          setAvailableLocations(locations);
        }
        return;
      }

      // Get platform ID
      const { data: platformData } = await supabase
        .from("platforms")
        .select("id")
        .eq("name", platformName.toLowerCase())
        .single();

      if (!platformData) {
        setAvailableLocations(locations);
        return;
      }

      // Get all platform connections for this company
      const { data: connectionsData } = await supabase
        .from("platform_connections")
        .select("location_id")
        .eq("platform_id", platformData.id)
        .eq("is_active", true);

      if (!connectionsData) {
        setAvailableLocations(locations);
        return;
      }

      const connectedLocationIds = connectionsData.map((c) => c.location_id);

      // Filter out already connected locations
      const filtered = locations.filter(
        (loc) => !connectedLocationIds.includes(loc.id)
      );

      setAvailableLocations(filtered);
    };

    if (open) {
      filterAvailableLocations();
    }
  }, [open, platformName, supabase, locations, isLocationSpecificMode]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedLocation(preSelectedLocationId || null);
      setSelectedPlatformName(platformName || "");
      setPlatformLocationId("");
      setVerifiedListing(null);
      setVerificationError(null);
      setError(null);
      setSuccess(false);
    }
  }, [open, preSelectedLocationId, platformName]);

  const handleVerify = async () => {
    if (!platformLocationId.trim()) {
      setVerificationError(t("platform.pleaseEnterPlatformId"));
      return;
    }

    if (!selectedPlatformName) {
      setVerificationError("Please select a platform first");
      return;
    }

    setVerifying(true);
    setVerificationError(null);
    setVerifiedListing(null);

    try {
      const response = await supabase.functions.invoke("zembra-client", {
        body: {
          mode: "listing",
          network: selectedPlatformName.toLowerCase(),
          slug: platformLocationId.trim(),
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to verify listing");
      }

      setVerifiedListing(response.data.listing);
    } catch (err: any) {
      setVerificationError(err.message || t("platform.failedVerifyListing"));
    } finally {
      setVerifying(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedLocation || !verifiedListing || !selectedPlatformName) return;

    setConnecting(true);
    setError(null);
    setSuccess(false);

    try {
      // Check if the slug already exists in platform_connections
      const { data: platformData } = await supabase
        .from("platforms")
        .select("id")
        .eq("name", selectedPlatformName.toLowerCase())
        .single();

      if (platformData) {
        const { data: existingConnection, error: checkError } = await supabase
          .from("platform_connections")
          .select("id")
          .eq("platform_id", platformData.id)
          .eq("platform_location_id", platformLocationId.trim())
          .limit(1);

        if (checkError) {
          throw new Error(checkError.message);
        }

        if (existingConnection && existingConnection.length > 0) {
          setError(
            t(
              "platform.slugAlreadyExists",
              "This platform location ID already exists in the system. If this page belongs to you, please contact tech@boresha.ca for assistance."
            )
          );
          setConnecting(false);
          return;
        }
      }

      await onConnect(
        platformLocationId.trim(),
        selectedLocation,
        selectedPlatformName,
        verifiedListing
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t("platform.failedConnectPlatform"));
    } finally {
      setConnecting(false);
    }
  };

  const handleClose = () => {
    setSelectedLocation(preSelectedLocationId || null);
    setSelectedPlatformName(platformName || "");
    setPlatformLocationId("");
    setVerifiedListing(null);
    setVerificationError(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  // Get platforms to display
  // For admins: use all platforms from database
  // For regular users: use availablePlatforms (their selected platforms)
  const platformsToShow =
    isUserAdmin && isLocationSpecificMode
      ? allPlatforms
      : availablePlatforms || [];

  const shouldShowDropdown = platformsToShow.length > 6;

  return (
    <Dialog
      open={open}
      onClose={success ? handleClose : undefined}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {isLocationSpecificMode
          ? t("platform.connectPlatformToLocation", {
              defaultValue: "Connect Platform to Location",
            })
          : t("platform.connectTo", {
              platform:
                (platformName || "").charAt(0).toUpperCase() +
                (platformName || "").slice(1),
              company: companyName,
            })}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Success Message */}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {t("platform.jobCreatedMessage", {
                defaultValue:
                  "A job has been created to get your reviews. Reviews will be available shortly.",
              })}
            </Alert>
          )}

          {/* Location Selection - Only show if not in location-specific mode */}
          {!isLocationSpecificMode && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t("platform.selectLocation")}
              </Typography>
              {availableLocations.length === 0 ? (
                <Alert severity="info">
                  {t("platform.allLocationsConnected", {
                    platform: platformName || "",
                  })}
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {availableLocations.map((location) => (
                    <Card
                      key={location.id}
                      sx={{
                        cursor: "pointer",
                        border: selectedLocation === location.id ? 2 : 1,
                        borderColor:
                          selectedLocation === location.id
                            ? "primary.main"
                            : "divider",
                      }}
                      onClick={() => setSelectedLocation(location.id)}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Typography variant="subtitle1">
                          {location.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {location.address}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* Platform Selection - Show when in location-specific mode and no platform selected */}
          {isLocationSpecificMode && !selectedPlatformName && !success && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t("platform.selectPlatform", {
                  defaultValue: "Select a Platform",
                })}
              </Typography>
              {loadingPlatforms ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : platformsToShow.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {isUserAdmin
                      ? t("platform.noPlatformsAvailable", {
                          defaultValue: "No active platforms available.",
                        })
                      : t("platform.noPlatformsSelected", {
                          defaultValue:
                            "You haven't selected any platforms yet. Please go to your Profile to select the platforms you want to use.",
                        })}
                  </Typography>
                </Alert>
              ) : shouldShowDropdown ? (
                // Dropdown for more than 6 platforms
                <Autocomplete
                  options={platformsToShow}
                  getOptionLabel={(option) => option.displayName}
                  isOptionEqualToValue={(option, value) =>
                    option.name === value.name
                  }
                  value={
                    platformsToShow.find(
                      (p) => p.name === selectedPlatformName
                    ) || null
                  }
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setSelectedPlatformName(newValue.name);
                      setPlatformLocationId("");
                      setVerifiedListing(null);
                      setVerificationError(null);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("platform.selectPlatform", {
                        defaultValue: "Select a Platform",
                      })}
                      placeholder={t("platform.searchPlatform", {
                        defaultValue: "Search or select a platform...",
                      })}
                      sx={{ mt: 2 }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        py: 1,
                      }}
                    >
                      {option.iconUrl && (
                        <Avatar
                          src={option.iconUrl}
                          alt={option.displayName}
                          sx={{ width: 24, height: 24 }}
                        />
                      )}
                      <Typography>{option.displayName}</Typography>
                      {option.status === "coming_soon" && (
                        <Chip
                          label={t("platform.soon")}
                          size="small"
                          sx={{
                            ml: "auto",
                            height: 20,
                            fontSize: "0.7rem",
                            bgcolor: "text.secondary",
                            color: "white",
                          }}
                        />
                      )}
                    </Box>
                  )}
                />
              ) : (
                // Grid for 6 or fewer platforms
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, 1fr)",
                      sm: "repeat(3, 1fr)",
                      md: "repeat(4, 1fr)",
                      lg: "repeat(5, 1fr)",
                    },
                    gap: { xs: 1.5, sm: 2 },
                    mt: 2,
                  }}
                >
                  {platformsToShow.map((platform) => (
                    <Button
                      key={platform.name}
                      variant="outlined"
                      size="large"
                      onClick={() => {
                        setSelectedPlatformName(platform.name);
                        setPlatformLocationId("");
                        setVerifiedListing(null);
                        setVerificationError(null);
                      }}
                      disabled={platform.status !== "active"}
                      sx={{
                        py: 2,
                        borderRadius: 3,
                        borderColor: "divider",
                        color: "text.primary",
                        "&:hover": {
                          borderColor: platform.color,
                          bgcolor: `${platform.color}08`,
                        },
                        opacity: platform.status !== "active" ? 0.6 : 1,
                      }}
                    >
                      {platform.displayName}
                      {platform.status === "coming_soon" && (
                        <Chip
                          label={t("platform.soon")}
                          size="small"
                          sx={{
                            ml: 1,
                            height: 20,
                            fontSize: "0.7rem",
                            bgcolor: "text.secondary",
                            color: "white",
                          }}
                        />
                      )}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Platform Location ID Entry - Show when platform is selected and not in success state */}
          {selectedLocation &&
            selectedPlatformName &&
            !success &&
            (isLocationSpecificMode || platformName) && (
              <Box>
                {/* Back button to return to platform selection */}
                {isLocationSpecificMode && (
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => {
                      setSelectedPlatformName("");
                      setPlatformLocationId("");
                      setVerifiedListing(null);
                      setVerificationError(null);
                    }}
                    sx={{ mb: 2, textTransform: "none" }}
                    disabled={verifying || connecting}
                  >
                    {t("common.back")}
                  </Button>
                )}

                {/* Platform name display */}
                {(() => {
                  const platformConfig =
                    getPlatformConfig(selectedPlatformName);
                  return (
                    <Typography
                      variant="h5"
                      fontWeight={600}
                      sx={{ mb: 1 }}
                      color="primary"
                    >
                      {platformConfig?.displayName || selectedPlatformName}
                    </Typography>
                  );
                })()}

                <Typography variant="h6" gutterBottom>
                  {t("platform.enterPlaceId", {
                    label: getPlatformIdLabel(selectedPlatformName, t),
                  })}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<HelpOutlineIcon />}
                    onClick={() => setInstructionsModalOpen(true)}
                    disabled={!platformInstructions || loadingInstructions}
                    sx={{
                      textTransform: "none",
                      color: "primary.main",
                      fontWeight: 500,
                      p: 0,
                      minWidth: "auto",
                      "&:hover": {
                        backgroundColor: "transparent",
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {loadingInstructions
                      ? t("platform.loadingInstructions", {
                          defaultValue: "Loading instructions...",
                        })
                      : t("platform.howToFindSlug", {
                          defaultValue: "How to find the slug?",
                        })}
                  </Button>
                </Box>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label={getPlatformIdLabel(selectedPlatformName, t)}
                    placeholder={getPlatformIdPlaceholder(
                      selectedPlatformName,
                      t
                    )}
                    value={platformLocationId}
                    onChange={(e) => {
                      setPlatformLocationId(e.target.value);
                      setVerifiedListing(null);
                      setVerificationError(null);
                    }}
                    disabled={verifying || connecting}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleVerify}
                    disabled={
                      !platformLocationId.trim() || verifying || connecting
                    }
                    startIcon={
                      verifying ? <CircularProgress size={20} /> : null
                    }
                  >
                    {verifying ? t("platform.finding") : t("platform.find")}
                  </Button>
                  {verificationError && (
                    <Alert severity="error">{verificationError}</Alert>
                  )}
                </Stack>
              </Box>
            )}

          {/* Verified Listing Preview */}
          {verifiedListing && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t("platform.verifiedListing")}
              </Typography>
              <Card
                sx={{
                  bgcolor: "success.50",
                  border: 1,
                  borderColor: "success.main",
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {verifiedListing.profileImage && (
                      <Avatar
                        src={verifiedListing.profileImage}
                        sx={{ width: 60, height: 60 }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {verifiedListing.name}
                      </Typography>
                      {verifiedListing.address && (
                        <Typography variant="body2" color="text.secondary">
                          {[
                            verifiedListing.address.street,
                            verifiedListing.address.city,
                            verifiedListing.address.region,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </Typography>
                      )}
                      {verifiedListing.categories &&
                        verifiedListing.categories.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {verifiedListing.categories.join(", ")}
                          </Typography>
                        )}
                      {verifiedListing.globalRating && (
                        <Typography variant="body2" color="text.secondary">
                          {t("platform.rating", {
                            rating: verifiedListing.globalRating,
                          })}
                        </Typography>
                      )}
                      {verifiedListing.reviewCount && (
                        <Typography variant="body2" color="text.secondary">
                          {t("platform.reviewsCount", {
                            count: verifiedListing.reviewCount.native.active,
                          })}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {success ? (
          <Button onClick={handleClose} variant="contained">
            {t("common.close")}
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={connecting}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleConnect}
              variant="contained"
              disabled={
                !selectedLocation ||
                !verifiedListing ||
                !selectedPlatformName ||
                connecting ||
                (!isLocationSpecificMode && !availableLocations.length)
              }
            >
              {connecting ? t("platform.connecting") : t("platform.connect")}
            </Button>
          </>
        )}
      </DialogActions>

      {/* Platform Slug Instructions Modal */}
      <PlatformSlugInstructionsModal
        open={instructionsModalOpen}
        onClose={() => setInstructionsModalOpen(false)}
        platformName={
          getPlatformConfig(selectedPlatformName)?.displayName ||
          selectedPlatformName
        }
        instructions={platformInstructions}
      />
    </Dialog>
  );
};
