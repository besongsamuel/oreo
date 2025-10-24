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
import { useEffect, useState } from "react";
import { getPlatformProvider } from "../services/platforms/platformRegistry";
import { PlatformPage } from "../services/platforms/types";

interface PlatformConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConnect: (pageId: string, locationId: string) => Promise<void>;
  platformName: string;
  companyName: string;
  locations: Array<{ id: string; name: string; address: string }>;
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
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, platformName]);

  const fetchPages = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = getPlatformProvider(platformName);
      if (!provider) {
        throw new Error(`${platformName} is not available`);
      }

      const accessToken = await provider.authenticate();
      const userPages = await provider.getUserPages(accessToken);
      setPages(userPages);
    } catch (err: any) {
      setError(err.message || "Failed to fetch pages");
    } finally {
      setLoading(false);
    }
  };

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
              </Box>

              {/* Page Selection */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Select{" "}
                  {platformName.charAt(0).toUpperCase() + platformName.slice(1)}{" "}
                  Page
                </Typography>
                <Stack spacing={1}>
                  {pages.map((page) => (
                    <Card
                      key={page.id}
                      sx={{
                        cursor: "pointer",
                        border: selectedPage === page.id ? 2 : 1,
                        borderColor:
                          selectedPage === page.id ? "primary.main" : "divider",
                      }}
                      onClick={() => setSelectedPage(page.id)}
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
