import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { SEO } from "../components/SEO";
import { UserContext } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";

// Google Maps types
declare global {
  interface Window {
    google: any; // Google Maps API will be loaded from script tag
  }
}

// Define type for Google Maps Autocomplete
type GoogleAutocomplete = any;

interface LocationFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;
}

export const AddLocation = () => {
  const { t } = useTranslation();
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const context = useContext(UserContext);
  const canCreateLocation = context?.canCreateLocation;
  const getPlanLimit = context?.getPlanLimit;
  const profile = context?.profile;

  const [formData, setFormData] = useState<LocationFormData>({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "United States",
    postal_code: "",
    phone: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<GoogleAutocomplete | null>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (autocompleteRef.current && window.google) {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        autocompleteRef.current,
        {
          componentRestrictions: { country: ["us", "ca"] },
          fields: ["address_components", "formatted_address", "geometry"],
        }
      );

      autocompleteInstance.addListener("place_changed", () => {
        const place = autocompleteInstance.getPlace();

        if (!place.address_components) return;

        // Parse address components
        let streetNumber = "";
        let route = "";
        let city = "";
        let state = "";
        let country = "";
        let postalCode = "";

        for (const component of place.address_components) {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          } else if (types.includes("route")) {
            route = component.short_name;
          } else if (types.includes("locality")) {
            city = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          } else if (types.includes("country")) {
            country = component.long_name;
          } else if (types.includes("postal_code")) {
            postalCode = component.long_name;
          }
        }

        const fullAddress = place.formatted_address || "";
        const address =
          streetNumber && route
            ? `${streetNumber} ${route}`
            : route || fullAddress;

        setFormData((prev) => ({
          ...prev,
          address,
          city: city || prev.city,
          state: state || prev.state,
          country: country || prev.country,
          postal_code: postalCode || prev.postal_code,
        }));
      });

      autocomplete.current = autocompleteInstance;
    }

    return () => {
      if (autocomplete.current) {
        window.google?.maps?.event?.clearInstanceListeners(
          autocomplete.current
        );
      }
    };
  }, []);

  const handleInputChange =
    (field: keyof LocationFormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) {
      setError(t("location.companyIdNotFound"));
      return;
    }

    // Validate required fields
    if (
      !formData.name ||
      !formData.address ||
      !formData.city ||
      !formData.country
    ) {
      setError(t("location.pleaseFillRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check location limit before creating (backend will also enforce)
      if (companyId && canCreateLocation) {
        const canCreate = await canCreateLocation(companyId);
        if (!canCreate && profile?.role !== "admin") {
          const maxLocations = getPlanLimit?.("max_locations_per_company") ?? 3;
          setUpgradeDialogOpen(true);
          setError(
            t("location.locationLimitReached", {
              max: maxLocations,
              defaultValue: `Location limit reached. Maximum ${maxLocations} locations per company allowed on your current plan.`,
            })
          );
          setLoading(false);
          return;
        }
      }

      const { error: insertError } = await supabase.from("locations").insert({
        company_id: companyId,
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state || null,
        country: formData.country,
        postal_code: formData.postal_code || null,
        phone: formData.phone || null,
        email: formData.email || null,
        is_active: true,
      });

      if (insertError) {
        // Check if error is about location limit
        if (insertError.message?.includes("Location limit reached")) {
          setUpgradeDialogOpen(true);
        }
        throw insertError;
      }

      // Navigate to success page
      navigate(`/companies/${companyId}/locations/success`);
    } catch (err: any) {
      console.error("Error creating location:", err);
      setError(err.message || t("location.failedCreate"));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/companies/${companyId}`);
  };

  return (
    <>
      <SEO
        title={t("location.addLocationSeoTitle")}
        description={t("location.addLocationSeoDescription")}
        keywords={t("location.addLocationSeoKeywords")}
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
            <Stack spacing={4}>
              {/* Header */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                  sx={{ textTransform: "none" }}
                >
                  {t("companyPage.back")}
                </Button>
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    {t("location.addLocationTitle")}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {t("location.addLocationDescription")}
                  </Typography>
                </Box>
              </Stack>

              {error && <Alert severity="error">{error}</Alert>}

              {/* Form */}
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  {/* Location Name */}
                  <TextField
                    label={t("location.locationName")}
                    required
                    fullWidth
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    placeholder={t("location.locationNamePlaceholder")}
                    disabled={loading}
                  />

                  {/* Address with Autocomplete */}
                  <TextField
                    inputRef={autocompleteRef}
                    label={t("location.streetAddress")}
                    required
                    fullWidth
                    value={formData.address}
                    onChange={handleInputChange("address")}
                    placeholder={t("location.addressPlaceholder")}
                    disabled={loading}
                  />

                  {/* City and State */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label={t("location.city")}
                      required
                      fullWidth
                      value={formData.city}
                      onChange={handleInputChange("city")}
                      placeholder={t("location.cityPlaceholder")}
                      disabled={loading}
                    />
                    <TextField
                      label={t("location.stateProvince")}
                      fullWidth
                      value={formData.state}
                      onChange={handleInputChange("state")}
                      placeholder={t("location.statePlaceholder")}
                      disabled={loading}
                    />
                  </Stack>

                  {/* Country and Postal Code */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label={t("location.country")}
                      required
                      fullWidth
                      value={formData.country}
                      onChange={handleInputChange("country")}
                      placeholder={t("location.countryPlaceholder")}
                      disabled={loading}
                    />
                    <TextField
                      label={t("location.postalCode")}
                      fullWidth
                      value={formData.postal_code}
                      onChange={handleInputChange("postal_code")}
                      placeholder={t("location.postalCodePlaceholder")}
                      disabled={loading}
                    />
                  </Stack>

                  {/* Contact Information */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label={t("location.phoneNumber")}
                      fullWidth
                      value={formData.phone}
                      onChange={handleInputChange("phone")}
                      placeholder={t("location.phonePlaceholder")}
                      disabled={loading}
                    />
                    <TextField
                      label={t("profile.email")}
                      fullWidth
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange("email")}
                      placeholder={t("location.emailPlaceholder")}
                      disabled={loading}
                    />
                  </Stack>

                  {/* Submit Button */}
                  <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      disabled={loading}
                      sx={{ textTransform: "none" }}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={
                        loading ||
                        !formData.name ||
                        !formData.address ||
                        !formData.city ||
                        !formData.country
                      }
                      sx={{
                        borderRadius: 980,
                        textTransform: "none",
                        fontWeight: 500,
                        px: 4,
                      }}
                    >
                      {loading
                        ? t("location.creating")
                        : t("location.createLocation")}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Upgrade Dialog */}
        <Dialog
          open={upgradeDialogOpen}
          onClose={() => setUpgradeDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {t("location.upgradeRequired", {
              defaultValue: "Upgrade Required",
            })}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body1">
                {t("location.locationLimitMessage", {
                  defaultValue: "You've reached the maximum number of locations allowed per company on your current plan.",
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("location.upgradeToAddMore", {
                  defaultValue: "Upgrade to a higher plan to add more locations and unlock additional features.",
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
              {t("location.viewPricing", {
                defaultValue: "View Pricing",
              })}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};
