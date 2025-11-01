import {
  Add as AddIcon,
  Business as BusinessIcon,
  Link as LinkIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { usePlatformIntegration } from "../hooks/usePlatformIntegration";
import { useSupabase } from "../hooks/useSupabase";
import { getPlatformConfig } from "../services/platforms/platformRegistry";
import { PlatformConnectionDialog } from "./PlatformConnectionDialog";

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  total_reviews: number;
  average_rating: number;
}

interface LocationConnection {
  id: string;
  platform_id: string;
  platform_location_id: string;
  platform_url?: string;
  is_active: boolean;
  last_sync_at?: string;
  platform: {
    name: string;
    display_name: string;
    icon_url?: string;
  };
}

interface LocationComponentProps {
  locations: Location[];
  locationConnections: Record<string, LocationConnection[]>;
  companyId: string;
  companyName?: string; // Company name for dialog
  onReviewsFetched?: () => void; // Callback to refresh data after fetching reviews
  onConnectionCreated?: () => void; // Callback to refresh after platform connection
}

export const LocationComponent = ({
  locations,
  locationConnections,
  companyId,
  companyName = "",
  onReviewsFetched,
  onConnectionCreated,
}: LocationComponentProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { connectPlatformUnified } = usePlatformIntegration();
  const supabase = useSupabase();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const [availablePlatforms, setAvailablePlatforms] = useState<
    Array<{
      name: string;
      displayName: string;
      color: string;
      iconUrl?: string;
      status: "active" | "coming_soon" | "maintenance";
      provider: null;
    }>
  >([]);

  const handleOpenConnectDialog = async (locationId: string) => {
    setSelectedLocationId(locationId);

    // Get user's selected platforms from database
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch user's selected platforms with full platform details
    const { data: userPlatforms } = await supabase
      .from("user_platforms")
      .select(
        `
        platform_id,
        platforms:platform_id (
          id,
          name,
          display_name,
          icon_url,
          base_url
        )
      `
      )
      .eq("user_id", user.id);

    if (!userPlatforms || userPlatforms.length === 0) {
      setAvailablePlatforms([]);
      setDialogOpen(true);
      return;
    }

    // Filter out platforms already connected to this location
    const connectedPlatforms = (locationConnections[locationId] || []).map(
      (conn) => conn.platform.name.toLowerCase()
    );

    // Map database platforms to PlatformRegistryEntry format
    const mappedPlatforms = userPlatforms
      .map((item: any) => {
        const platform = item.platforms;
        if (!platform) return null;

        // Get platform config from registry for color and status
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
      .filter((p: any): p is NonNullable<typeof p> => p !== null)
      .filter(
        (platform) => !connectedPlatforms.includes(platform.name.toLowerCase())
      );

    setAvailablePlatforms(mappedPlatforms);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLocationId(null);
    setAvailablePlatforms([]);
  };

  const handlePlatformConnect = async (
    platformLocationId: string,
    locationId: string,
    platformName: string,
    verifiedListing?: any
  ) => {
    if (!selectedLocationId) return;

    try {
      await connectPlatformUnified(
        platformName.toLowerCase(),
        platformLocationId,
        locationId,
        verifiedListing
      );

      // Refresh connections after successful connection
      if (onConnectionCreated) {
        onConnectionCreated();
      }
    } catch (err) {
      console.error("Failed to connect platform:", err);
      throw err; // Re-throw to let dialog handle error display
    }
  };

  if (locations.length === 0) {
    return (
      <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Box sx={{ textAlign: "center", py: 4 }}>
          <BusinessIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t("location.noLocationsYet")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("location.addFirstLocation")}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/companies/${companyId}/locations/new`)}
            sx={{
              borderRadius: 980,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            {t("location.addLocation")}
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">{t("location.title")}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/companies/${companyId}/locations/new`)}
          sx={{
            borderRadius: 980,
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          {t("location.addLocation")}
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
          },
          gap: 2,
        }}
      >
        {locations.map((location) => {
          const connections = locationConnections[location.id] || [];

          return (
            <Card key={location.id} variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {location.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {location.address}, {location.city}, {location.state}
                      </Typography>
                    </Box>

                    {/* Platform Connection Badges */}
                    {connections.length > 0 && (
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {connections.map((connection) => {
                          const platformConfig = getPlatformConfig(
                            connection.platform.name
                          );
                          const platformColor =
                            platformConfig?.color || "#666666";

                          return (
                            <Chip
                              key={connection.id}
                              label={connection.platform.display_name}
                              size="small"
                              sx={{
                                backgroundColor: platformColor,
                                color: "white",
                                fontWeight: 500,
                                "& .MuiChip-label": {
                                  fontSize: "0.75rem",
                                },
                              }}
                            />
                          );
                        })}
                      </Stack>
                    )}
                  </Stack>

                  {/* Connect Platform Button */}
                  <Button
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    onClick={() => handleOpenConnectDialog(location.id)}
                    size="small"
                    sx={{
                      borderRadius: 980,
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      alignSelf: "flex-start",
                    }}
                  >
                    {t("location.connectPlatform", {
                      defaultValue: "Connect Platform",
                    })}
                  </Button>

                  <Divider />

                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {location.total_reviews}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("companies.reviews")}
                      </Typography>
                    </Box>
                    <Box>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="h6" fontWeight={600}>
                          {location.average_rating.toFixed(1)}
                        </Typography>
                        <StarIcon
                          sx={{
                            color: "warning.main",
                            fontSize: "1rem",
                          }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {t("companies.avgRating")}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Platform Connection Dialog */}
      {selectedLocationId && (
        <PlatformConnectionDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          onConnect={handlePlatformConnect}
          companyName={companyName}
          locations={locations.filter((loc) => loc.id === selectedLocationId)}
          preSelectedLocationId={selectedLocationId}
          availablePlatforms={availablePlatforms}
        />
      )}
    </Paper>
  );
};
