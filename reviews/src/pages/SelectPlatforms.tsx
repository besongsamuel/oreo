import { Check as CheckIcon, Warning as WarningIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PlatformCard } from "../components/PlatformCard";
import { SEO } from "../components/SEO";
import { UserContext } from "../context/UserContext";
import { useSupabase } from "../hooks/useSupabase";

interface Platform {
  id: string;
  name: string;
  display_name: string;
  icon_url?: string | null;
  short_description_en?: string | null;
  short_description_fr?: string | null;
}

// Popular platforms that should appear first (in order)
const POPULAR_PLATFORM_NAMES = [
  'google',
  'facebook',
  'yelp',
  'opentable',
  'tripadvisor',
  'trustpilot',
  'booking',
  'airbnb',
  'glassdoor',
  'indeed',
];

export const SelectPlatforms = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const context = useContext(UserContext);
  const { getPlanLimit, isAdmin, profile: contextProfile } = context || {};

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [userPlatforms, setUserPlatforms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ id: string } | null>(null);

  // Admins have unlimited platforms - use Infinity instead of fallback
  const isUserAdmin = isAdmin?.() || contextProfile?.role === "admin";
  const maxPlatforms = isUserAdmin 
    ? Infinity 
    : (getPlanLimit?.("max_platforms") ?? 3);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();
        if (profileData) {
          setProfile(profileData);
        }
      }
    };
    fetchProfile();
  }, [supabase]);

  // Fetch all platforms
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("platforms")
          .select("id, name, display_name, icon_url, short_description_en, short_description_fr")
          .eq("is_active", true)
          .order("display_name");

        if (error) throw error;

        // Sort platforms: popular ones first (in specified order), then alphabetically
        const sortedPlatforms = (data || []).sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const aIsPopular = POPULAR_PLATFORM_NAMES.includes(aName);
          const bIsPopular = POPULAR_PLATFORM_NAMES.includes(bName);

          // Popular platforms come first
          if (aIsPopular && !bIsPopular) return -1;
          if (!aIsPopular && bIsPopular) return 1;

          // If both are popular, sort by popularity order
          if (aIsPopular && bIsPopular) {
            const aIndex = POPULAR_PLATFORM_NAMES.indexOf(aName);
            const bIndex = POPULAR_PLATFORM_NAMES.indexOf(bName);
            return aIndex - bIndex;
          }

          // Both not popular: sort alphabetically
          return a.display_name.localeCompare(b.display_name);
        });

        setPlatforms(sortedPlatforms);
      } catch (err: any) {
        console.error("Error fetching platforms:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, [supabase]);

  // Fetch user's selected platforms
  useEffect(() => {
    if (!profile?.id) return;

    const fetchUserPlatforms = async () => {
      try {
        const { data, error } = await supabase
          .from("user_platforms")
          .select("platform_id")
          .eq("user_id", profile.id);

        if (error) throw error;

        const platformIds = (data || []).map((item: any) => item.platform_id);
        setUserPlatforms(platformIds);
        setSelectedPlatforms(platformIds);
      } catch (err: any) {
        console.error("Error fetching user platforms:", err);
      }
    };

    fetchUserPlatforms();
  }, [profile, supabase]);

  const handleTogglePlatform = (platformId: string) => {
    setError(null);
    
    // Prevent unselecting persisted platforms
    if (userPlatforms.includes(platformId)) {
      setError(
        t("companies.selectPlatforms.errorCannotUnselect", "You cannot unselect a platform that has already been saved.")
      );
      return;
    }
    
    if (selectedPlatforms.includes(platformId)) {
      // Deselect (only allowed for non-persisted platforms)
      setSelectedPlatforms(selectedPlatforms.filter((id) => id !== platformId));
    } else {
      // For admins (unlimited), skip limit check
      if (!isUserAdmin) {
        // Calculate remaining slots (accounting for already persisted platforms)
        const remainingSlots = maxPlatforms - userPlatforms.length;
        const newSelectionsCount = selectedPlatforms.filter(
          (id) => !userPlatforms.includes(id)
        ).length;
        
        // Check if adding this would exceed remaining slots
        if (newSelectionsCount >= remainingSlots) {
          setError(
            t("companies.selectPlatforms.errorMaxReached", {
              max: maxPlatforms,
              plural:
                maxPlatforms > 1
                  ? t("companies.selectPlatforms.errorMaxReachedPlural")
                  : t("companies.selectPlatforms.errorMaxReachedSingular"),
            })
          );
          return;
        }
      }
      // Select
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    
    // Filter out persisted platforms - only send new selections
    const newPlatformIds = selectedPlatforms.filter(
      (id) => !userPlatforms.includes(id)
    );
    
    if (newPlatformIds.length === 0) {
      // All selected platforms are already persisted, nothing to save
      navigate("/select-platforms/success");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Call edge function to add new platforms
      const { data, error: functionError } = await supabase.functions.invoke(
        "add-user-platforms",
        {
          body: {
            platform_ids: newPlatformIds,
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data?.success) {
        // Handle 403 errors specifically
        if (data?.error && data.error.includes("Cannot add")) {
          throw new Error(data.error);
        }
        throw new Error(data?.error || t("companies.selectPlatforms.errorSaveFailed"));
      }

      // Navigate to success page
      navigate("/select-platforms/success");
    } catch (err: any) {
      console.error("Error saving platform selection:", err);
      
      // Check if it's a 403 error from the edge function
      if (err.status === 403 || err.message?.includes("Cannot add")) {
        setError(err.message || (isUserAdmin 
          ? t("companies.selectPlatforms.errorSaveFailed", "Failed to save platform selection. Please try again.")
          : t("companies.selectPlatforms.errorMaxReached", {
              max: maxPlatforms,
              plural:
                maxPlatforms > 1
                  ? t("companies.selectPlatforms.errorMaxReachedPlural")
                  : t("companies.selectPlatforms.errorMaxReachedSingular"),
            })));
      } else {
        setError(err.message || t("companies.selectPlatforms.errorSaveFailed"));
      }
      setSaving(false);
    }
  };

  const filteredPlatforms = platforms.filter((platform) =>
    platform.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    platform.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate new platforms (excluding persisted ones)
  const newPlatformIds = selectedPlatforms.filter(
    (id) => !userPlatforms.includes(id)
  );
  
  // Calculate remaining slots (for non-admins only)
  const remainingSlots = isUserAdmin 
    ? Infinity 
    : (maxPlatforms - userPlatforms.length);
  
  const canSave =
    newPlatformIds.length > 0 &&
    (isUserAdmin || newPlatformIds.length <= remainingSlots);

  return (
    <>
      <SEO
        title={t("companies.selectPlatforms.title")}
        description={t("companies.selectPlatforms.subtitle")}
      />
      <Container maxWidth="xl" sx={{ py: { xs: 3, sm: 4, md: 5 } }}>
        <Stack spacing={4}>
          {/* Header */}
          <Stack spacing={1}>
            <Typography variant="h4" component="h1" fontWeight={700}>
              {t("companies.selectPlatforms.title")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isUserAdmin
                ? t("companies.selectPlatforms.subtitleUnlimited", "Choose the review platforms you want to connect. You can select unlimited platforms.")
                : t("companies.selectPlatforms.subtitle", {
                    max: maxPlatforms,
                    plural:
                      maxPlatforms > 1
                        ? t("companies.selectPlatforms.subtitlePlural")
                        : t("companies.selectPlatforms.subtitleSingular"),
                  })}
            </Typography>
          </Stack>

          {/* Warning Banner */}
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "warning.main",
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              {t("companies.selectPlatforms.warningTitle")}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {t("companies.selectPlatforms.warningMessage")}
            </Typography>
          </Alert>

          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder={t("companies.selectPlatforms.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery("")}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: 600,
            }}
          />

          {/* Selected Count */}
          <Box>
            <Chip
              label={isUserAdmin
                ? t("companies.selectPlatforms.selectedCountUnlimited", "{{selected}} selected (unlimited)", {
                    selected: selectedPlatforms.length,
                  })
                : t("companies.selectPlatforms.selectedCount", {
                    count: selectedPlatforms.length,
                    max: maxPlatforms,
                  })}
              color={!isUserAdmin && selectedPlatforms.length === maxPlatforms ? "primary" : "default"}
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Platforms Grid */}
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              {t("companies.selectPlatforms.loading")}
            </Typography>
          ) : filteredPlatforms.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                {t("companies.selectPlatforms.noResults")}
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)",
                },
                gap: { xs: 2, sm: 3, md: 4 },
              }}
            >
              {filteredPlatforms.map((platform) => {
                const isPersisted = userPlatforms.includes(platform.id);
                const isSelected = selectedPlatforms.includes(platform.id);
                // For admins, no limit checks needed
                const remainingSlots = isUserAdmin 
                  ? Infinity 
                  : (maxPlatforms - userPlatforms.length);
                const newSelectionsCount = selectedPlatforms.filter(
                  (id) => !userPlatforms.includes(id)
                ).length;
                
                return (
                  <PlatformCard
                    key={platform.id}
                    platform={platform}
                    selected={isSelected}
                    onToggle={handleTogglePlatform}
                    disabled={
                      isPersisted || // Prevent unselecting persisted platforms
                      (!isUserAdmin && !isSelected && newSelectionsCount >= remainingSlots) // Prevent selecting when limit reached (non-admins only)
                    }
                    locked={isPersisted} // Visual indicator for persisted platforms
                  />
                );
              })}
            </Box>
          )}

          {/* Bottom Action Bar */}
          <Paper
            elevation={4}
            sx={{
              position: "sticky",
              bottom: 0,
              p: 3,
              bgcolor: "background.paper",
              borderTop: "1px solid",
              borderColor: "divider",
              borderRadius: 0,
              zIndex: 100,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary">
                {t("companies.selectPlatforms.selectedCount", {
                  count: selectedPlatforms.length,
                  max: maxPlatforms,
                })}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleSave}
                disabled={!canSave || saving}
                startIcon={saving ? undefined : <CheckIcon />}
                sx={{
                  minWidth: 200,
                  fontWeight: 600,
                }}
              >
                {saving ? t("companies.selectPlatforms.saving") : t("companies.selectPlatforms.save")}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </>
  );
};

