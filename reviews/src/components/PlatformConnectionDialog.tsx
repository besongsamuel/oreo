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

const getPlatformIdLabel = (platformName: string): string => {
  switch (platformName.toLowerCase()) {
    case "facebook":
      return "Page ID";
    case "google":
      return "Place ID";
    case "yelp":
      return "Business ID";
    case "opentable":
      return "Restaurant ID";
    case "tripadvisor":
      return "Location ID";
    default:
      return "Location ID";
  }
};

const getPlatformIdPlaceholder = (platformName: string): string => {
  switch (platformName.toLowerCase()) {
    case "facebook":
      return "e.g., 123456789012345";
    case "google":
      return "e.g., ChIJN1t_tDeuEmsRUsoyG83frY4";
    case "yelp":
      return "e.g., cafe-de-olla-san-francisco-2";
    case "opentable":
      return "e.g., restaurant-name";
    case "tripadvisor":
      return "e.g., g1234567";
    default:
      return "Enter platform location ID";
  }
};

export const PlatformConnectionDialog = ({
  open,
  onClose,
  onConnect,
  platformName,
  companyName,
  locations,
}: PlatformConnectionDialogProps) => {
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
      setVerificationError("Please enter a Platform Location ID");
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
      setVerificationError(
        err.message || "Failed to verify listing. Please check the ID."
      );
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
      setError(err.message || "Failed to connect platform");
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
        Connect {platformName.charAt(0).toUpperCase() + platformName.slice(1)}{" "}
        to {companyName}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Location Selection */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Location
            </Typography>
            {availableLocations.length === 0 ? (
              <Alert severity="info">
                All locations are already connected to {platformName}. Please
                add a new location to connect.
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
                Enter {getPlatformIdLabel(platformName)}
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label={getPlatformIdLabel(platformName)}
                  placeholder={getPlatformIdPlaceholder(platformName)}
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
                  {verifying ? "Verifying..." : "Verify"}
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
                Verified Listing
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
                          Rating: {verifiedListing.globalRating} / 5.0
                        </Typography>
                      )}
                      {verifiedListing.reviewCount && (
                        <Typography variant="body2" color="text.secondary">
                          {verifiedListing.reviewCount.native.active} reviews
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
          Cancel
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
          {connecting ? "Connecting..." : "Connect"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
