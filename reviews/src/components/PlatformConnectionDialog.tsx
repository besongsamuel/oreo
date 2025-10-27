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
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { getPlatformProvider } from "../services/platforms/platformRegistry";
import { PlatformPage } from "../services/platforms/types";

interface PlatformConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConnect: (page: PlatformPage, locationId: string) => Promise<void>;
  platformName: string;
  companyName: string;
  locations: Array<{
    id: string;
    name: string;
    address: string;
    city?: string;
  }>;
}

export const PlatformConnectionDialog = ({
  open,
  onClose,
  onConnect,
  platformName,
  companyName,
  locations,
}: PlatformConnectionDialogProps) => {
  const [pages, setPages] = useState<PlatformPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<PlatformPage | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [searching, setSearching] = useState(false);

  const fetchPages = useCallback(
    async (location?: {
      id: string;
      name: string;
      address: string;
      city?: string;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const provider = getPlatformProvider(platformName);
        if (!provider) {
          throw new Error(`${platformName} is not available`);
        }

        const accessToken = await provider.authenticate();

        // Special handling for Yelp
        if (platformName.toLowerCase() === "yelp") {
          if (!location) {
            setLoading(false);
            return;
          }
          setSearching(true);
          const yelpProvider = provider as any;
          if (yelpProvider.searchBusinesses) {
            const businesses = await yelpProvider.searchBusinesses(
              companyName,
              location.city || location.address
            );
            setPages(businesses);
          } else {
            throw new Error("Yelp provider searchBusinesses method not found");
          }
          setSearching(false);
        } else {
          const userPages = await provider.getUserPages(accessToken);
          setPages(userPages);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch pages");
      } finally {
        setLoading(false);
      }
    },
    [platformName, companyName]
  );

  // Fetch pages automatically when dialog opens for Facebook and Google
  useEffect(() => {
    if (open && platformName.toLowerCase() !== "yelp") {
      fetchPages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, platformName]);

  const handleConnect = async () => {
    if (!selectedPage || !selectedLocation) return;

    setConnecting(true);
    try {
      await onConnect(selectedPage, selectedLocation);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to connect platform");
    } finally {
      setConnecting(false);
    }
  };

  const handleClose = () => {
    setPages([]);
    setSelectedPage(null);
    setSelectedLocation(null);
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

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Stack alignItems="center" spacing={2}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  Loading your {platformName} pages...
                </Typography>
              </Stack>
            </Box>
          ) : (
            <>
              {/* Location Selection */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Select Location
                </Typography>
                {platformName.toLowerCase() !== "yelp" && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Please select a location to connect this{" "}
                    {platformName.charAt(0).toUpperCase() +
                      platformName.slice(1)}{" "}
                    account to
                  </Typography>
                )}
                <Stack spacing={1}>
                  {locations.map((location) => (
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
                      onClick={() => {
                        setSelectedLocation(location.id);
                        setSelectedPage(null);
                        // For Yelp, fetch businesses when location is selected
                        if (platformName.toLowerCase() === "yelp") {
                          fetchPages(location);
                        }
                      }}
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
              </Box>

              {/* Page Selection */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Select{" "}
                  {platformName.charAt(0).toUpperCase() + platformName.slice(1)}{" "}
                  Page
                </Typography>
                {platformName.toLowerCase() === "yelp" && !selectedLocation && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Please select a location first to search for businesses
                  </Typography>
                )}
                {searching && (
                  <Box display="flex" justifyContent="center" py={2}>
                    <Stack alignItems="center" spacing={2}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" color="text.secondary">
                        Searching Yelp for businesses...
                      </Typography>
                    </Stack>
                  </Box>
                )}
                {!searching && pages.length === 0 && selectedLocation && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    No businesses found. Try selecting a different location.
                  </Typography>
                )}
                <Stack spacing={1}>
                  {pages.map((page) => (
                    <Card
                      key={page.id}
                      sx={{
                        cursor: "pointer",
                        border: selectedPage?.id === page.id ? 2 : 1,
                        borderColor:
                          selectedPage?.id === page.id
                            ? "primary.main"
                            : "divider",
                      }}
                      onClick={() => setSelectedPage(page)}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            src={page.profilePicture}
                            sx={{ width: 40, height: 40 }}
                          >
                            {page.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1">
                              {page.name}
                            </Typography>
                            {page.url && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {page.url}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </>
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
          disabled={!selectedPage || !selectedLocation || connecting || loading}
        >
          {connecting ? "Connecting..." : "Connect"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
