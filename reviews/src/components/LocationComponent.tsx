import {
  Add as AddIcon,
  Business as BusinessIcon,
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
import { useNavigate } from "react-router-dom";
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
}

export const LocationComponent = ({
  locations,
  locationConnections,
  companyId,
}: LocationComponentProps) => {
  const navigate = useNavigate();

  if (locations.length === 0) {
    return (
      <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Box sx={{ textAlign: "center", py: 4 }}>
          <BusinessIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No locations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add your first location to start tracking reviews
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
            Add Location
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
        <Typography variant="h6">Locations</Typography>
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
          Add Location
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

                  <Divider />

                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {location.total_reviews}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reviews
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
                        Avg Rating
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
