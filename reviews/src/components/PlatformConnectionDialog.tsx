import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSupabase } from "../hooks/useSupabase";

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
    verifiedListing?: ZembraListing
  ) => Promise<void>;
  platformName: string;
  companyName: string;
  locations: Array<{
    id: string;
    name: string;
    address: string;
    city?: string;
  }>;
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
}: PlatformConnectionDialogProps) => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
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
  const [availableLocations, setAvailableLocations] = useState(locations);

  // Filter out locations that already have connections for this platform
  useEffect(() => {
    const filterAvailableLocations = async () => {
      if (!platformName) return;

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
  }, [open, platformName, supabase, locations]);

  const handleVerify = async () => {
    if (!platformLocationId.trim()) {
      setVerificationError(t("platform.pleaseEnterPlatformId"));
      return;
    }

    setVerifying(true);
    setVerificationError(null);
    setVerifiedListing(null);

    try {
      const response = await supabase.functions.invoke("zembra-client", {
        body: {
          mode: "listing",
          network: platformName.toLowerCase(),
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
    if (!selectedLocation || !verifiedListing) return;

    setConnecting(true);
    setError(null);

    try {
      await onConnect(
        platformLocationId.trim(),
        selectedLocation,
        verifiedListing
      );
      handleClose();
    } catch (err: any) {
      setError(err.message || t("platform.failedConnectPlatform"));
    } finally {
      setConnecting(false);
    }
  };

  const handleClose = () => {
    setSelectedLocation(null);
    setPlatformLocationId("");
    setVerifiedListing(null);
    setVerificationError(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t("platform.connectTo", {
          platform:
            platformName.charAt(0).toUpperCase() + platformName.slice(1),
          company: companyName,
        })}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Location Selection */}
          <Box>
            <Typography variant="h6" gutterBottom>
              {t("platform.selectLocation")}
            </Typography>
            {availableLocations.length === 0 ? (
              <Alert severity="info">
                {t("platform.allLocationsConnected", {
                  platform: platformName,
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

          {/* Platform Location ID Entry */}
          {selectedLocation && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t("platform.enterPlaceId", {
                  label: getPlatformIdLabel(platformName, t),
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t(
                  `platform.platformIdInstructions.${platformName.toLowerCase()}` as any,
                  {
                    defaultValue:
                      "Enter the location identifier from your platform account",
                  }
                )}
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label={getPlatformIdLabel(platformName, t)}
                  placeholder={getPlatformIdPlaceholder(platformName, t)}
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
                  startIcon={verifying ? <CircularProgress size={20} /> : null}
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
        <Button onClick={handleClose} disabled={connecting}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleConnect}
          variant="contained"
          disabled={
            !selectedLocation ||
            !verifiedListing ||
            connecting ||
            !availableLocations.length
          }
        >
          {connecting ? t("platform.connecting") : t("platform.connect")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
