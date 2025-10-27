import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SEO } from "../components/SEO";
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
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const supabase = useSupabase();

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
      setError("Company ID not found");
      return;
    }

    // Validate required fields
    if (
      !formData.name ||
      !formData.address ||
      !formData.city ||
      !formData.country
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
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
        throw insertError;
      }

      // Navigate to success page
      navigate(`/companies/${companyId}/locations/success`);
    } catch (err: any) {
      console.error("Error creating location:", err);
      setError(err.message || "Failed to create location");
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
        title="Add Location - Boresha"
        description="Add a new location to your company for review tracking and analysis."
        keywords="add location, business location, company location, review tracking"
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
                  Back
                </Button>
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    Add Location
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Add a new location to track reviews and customer feedback
                  </Typography>
                </Box>
              </Stack>

              {error && <Alert severity="error">{error}</Alert>}

              {/* Form */}
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  {/* Location Name */}
                  <TextField
                    label="Location Name"
                    required
                    fullWidth
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    placeholder="e.g., Downtown Store, Main Office"
                    disabled={loading}
                  />

                  {/* Address with Autocomplete */}
                  <TextField
                    inputRef={autocompleteRef}
                    label="Street Address"
                    required
                    fullWidth
                    value={formData.address}
                    onChange={handleInputChange("address")}
                    placeholder="Start typing an address..."
                    disabled={loading}
                  />

                  {/* City and State */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="City"
                      required
                      fullWidth
                      value={formData.city}
                      onChange={handleInputChange("city")}
                      placeholder="New York"
                      disabled={loading}
                    />
                    <TextField
                      label="State/Province"
                      fullWidth
                      value={formData.state}
                      onChange={handleInputChange("state")}
                      placeholder="NY"
                      disabled={loading}
                    />
                  </Stack>

                  {/* Country and Postal Code */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Country"
                      required
                      fullWidth
                      value={formData.country}
                      onChange={handleInputChange("country")}
                      placeholder="United States"
                      disabled={loading}
                    />
                    <TextField
                      label="Postal Code"
                      fullWidth
                      value={formData.postal_code}
                      onChange={handleInputChange("postal_code")}
                      placeholder="10001"
                      disabled={loading}
                    />
                  </Stack>

                  {/* Contact Information */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Phone Number"
                      fullWidth
                      value={formData.phone}
                      onChange={handleInputChange("phone")}
                      placeholder="+1 (555) 123-4567"
                      disabled={loading}
                    />
                    <TextField
                      label="Email"
                      fullWidth
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange("email")}
                      placeholder="location@company.com"
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
                      Cancel
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
                      {loading ? "Creating..." : "Create Location"}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};
