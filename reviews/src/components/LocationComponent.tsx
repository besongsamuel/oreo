import {
  Add as AddIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { usePlatformIntegration } from "../hooks/usePlatformIntegration";
import { getPlatformConfig } from "../services/platforms/platformRegistry";

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
  onReviewsFetched?: () => void; // Callback to refresh data after fetching reviews
}

export const LocationComponent = ({
  locations,
  locationConnections,
  companyId,
  onReviewsFetched,
}: LocationComponentProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { fetchReviews, connecting, error, success } = usePlatformIntegration();
  const [fetchingForConnection, setFetchingForConnection] = useState<
    string | null
  >(null);

  const handleFetchReviews = async (connection: LocationConnection) => {
    setFetchingForConnection(connection.id);
    try {
      const result = await fetchReviews(
        connection.platform.name,
        connection.platform_location_id,
        connection.id
      );

      if (result.success && onReviewsFetched) {
        onReviewsFetched();
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setFetchingForConnection(null);
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

                  {/* Fetch Reviews Buttons */}
                  {connections.length > 0 && (
                    <Stack spacing={1}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        {t("location.fetchReviews")}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {connections.map((connection) => {
                          const platformConfig = getPlatformConfig(
                            connection.platform.name
                          );
                          const platformColor =
                            platformConfig?.color || "#666666";
                          const isFetching =
                            fetchingForConnection === connection.id;

                          return (
                            <Button
                              key={`fetch-${connection.id}`}
                              variant="outlined"
                              size="small"
                              startIcon={
                                isFetching ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <RefreshIcon />
                                )
                              }
                              onClick={() => handleFetchReviews(connection)}
                              disabled={isFetching || connecting}
                              sx={{
                                borderRadius: 980,
                                textTransform: "none",
                                fontWeight: 500,
                                fontSize: "0.75rem",
                                borderColor: platformColor,
                                color: platformColor,
                                "&:hover": {
                                  borderColor: platformColor,
                                  backgroundColor: `${platformColor}08`,
                                },
                                "&:disabled": {
                                  borderColor: "text.disabled",
                                  color: "text.disabled",
                                },
                              }}
                            >
                              {isFetching
                                ? t("location.fetching")
                                : t("location.fetch", {
                                    platform: connection.platform.display_name,
                                  })}
                            </Button>
                          );
                        })}
                      </Stack>
                    </Stack>
                  )}

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
    </Paper>
  );
};
