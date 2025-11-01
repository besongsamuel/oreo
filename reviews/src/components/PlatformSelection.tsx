import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Container,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningIcon from "@mui/icons-material/Warning";
import { useEffect, useState } from "react";
import { useSupabase } from "../hooks/useSupabase";
import { useTranslation } from "react-i18next";
import { UserContext } from "../context/UserContext";
import { useContext } from "react";

interface SupportedPlatform {
    id: string;
    name: string;
    display_name: string;
    description_en: string;
    description_fr: string;
    icon_url?: string;
    base_url?: string;
}

interface PlatformSelectionProps {
    userId: string;
    onComplete: () => void;
    onSkip?: () => void;
    allowSkip?: boolean;
}

export const PlatformSelection = ({
    userId,
    onComplete,
    onSkip,
    allowSkip = false,
}: PlatformSelectionProps) => {
    const supabase = useSupabase();
    const { t, i18n } = useTranslation();
    const { getPlanLimit } = useContext(UserContext) || {};

    const [platforms, setPlatforms] = useState<SupportedPlatform[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const maxPlatforms = getPlanLimit?.("max_platforms") || 3;
    const currentLanguage = i18n.language === "fr" ? "fr" : "en";

    useEffect(() => {
        fetchPlatforms();
        fetchUserPlatforms();
    }, [userId]);

    const fetchPlatforms = async () => {
        try {
            const { data, error } = await supabase
                .from("platforms")
                .select("*")
                .eq("is_active", true)
                .order("display_name");

            if (error) throw error;
            setPlatforms(data || []);
        } catch (err: any) {
            console.error("Error fetching platforms:", err);
            setError(err.message || "Failed to load platforms");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPlatforms = async () => {
        try {
            const { data, error } = await supabase
                .from("user_platforms")
                .select("platform_id, platforms:platform_id(name)")
                .eq("user_id", userId);

            if (error) throw error;

            const selected = (data || [])
                .map(
                    (item: any) => item.platforms?.name
                )
                .filter((name: string | undefined): name is string => !!name);

            setSelectedPlatforms(selected);
        } catch (err: any) {
            console.error("Error fetching user platforms:", err);
        }
    };

    const handleTogglePlatform = (platformName: string) => {
        setError(null);
        const isSelected = selectedPlatforms.includes(platformName);

        if (isSelected) {
            // Remove platform
            setSelectedPlatforms(
                selectedPlatforms.filter((name) => name !== platformName)
            );
        } else {
            // Add platform (check limit)
            if (selectedPlatforms.length >= maxPlatforms) {
                setError(
                    `You can only select up to ${maxPlatforms} platform${
                        maxPlatforms > 1 ? "s" : ""
                    }. Please remove a platform first.`
                );
                return;
            }
            setSelectedPlatforms([...selectedPlatforms, platformName]);
        }
    };

    const handleSave = async () => {
        if (selectedPlatforms.length === 0) {
            setError("Please select at least one platform");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Get platform IDs for selected platforms
            const { data: platformData, error: platformError } = await supabase
                .from("platforms")
                .select("id, name")
                .in("name", selectedPlatforms);

            if (platformError) throw platformError;

            const platformIds = platformData?.map((p) => p.id) || [];

            // Delete existing user platforms
            const { error: deleteError } = await supabase
                .from("user_platforms")
                .delete()
                .eq("user_id", userId);

            if (deleteError) throw deleteError;

            // Insert new selections
            if (platformIds.length > 0) {
                const insertData = platformIds.map((platformId) => ({
                    user_id: userId,
                    platform_id: platformId,
                }));

                const { error: insertError } = await supabase
                    .from("user_platforms")
                    .insert(insertData);

                if (insertError) throw insertError;
            }

            onComplete();
        } catch (err: any) {
            console.error("Error saving platforms:", err);
            setError(err.message || "Failed to save platform selections");
        } finally {
            setSaving(false);
        }
    };

    const getPlatformDescription = (platform: SupportedPlatform): string => {
        return currentLanguage === "fr"
            ? platform.description_fr || platform.description_en
            : platform.description_en;
    };

    const filteredPlatforms = platforms.filter((platform) =>
        platform.display_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
        platform.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    Loading platforms...
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={4}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Select Your Platforms
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Choose the review platforms you want to connect. You can
                        select up to {maxPlatforms} platform
                        {maxPlatforms > 1 ? "s" : ""}.
                    </Typography>
                </Box>

                <Alert
                    severity="warning"
                    icon={<WarningIcon />}
                >
                    <Typography variant="body2" fontWeight={600}>
                        Platform selection cannot be changed
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Your platform selection is permanent and cannot be modified after
                        you save. Please choose carefully.
                    </Typography>
                </Alert>

                {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box>
                    <TextField
                        fullWidth
                        placeholder="Search platforms..."
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
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 3 }}
                    />

                    <Box sx={{ mb: 2 }}>
                        <Chip
                            label={`${selectedPlatforms.length} of ${maxPlatforms} selected`}
                            color={
                                selectedPlatforms.length >= maxPlatforms
                                    ? "success"
                                    : "default"
                            }
                        />
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, 1fr)",
                                md: "repeat(3, 1fr)",
                            },
                            gap: 2,
                        }}
                    >
                        {filteredPlatforms.map((platform) => {
                            const isSelected =
                                selectedPlatforms.includes(platform.name);
                            const isDisabled =
                                !isSelected &&
                                selectedPlatforms.length >= maxPlatforms;

                            return (
                                <Box key={platform.id}>
                                    <Card
                                        sx={{
                                            height: "100%",
                                            cursor: isDisabled
                                                ? "not-allowed"
                                                : "pointer",
                                            opacity: isDisabled ? 0.6 : 1,
                                            border: isSelected
                                                ? 2
                                                : 1,
                                            borderColor: isSelected
                                                ? "primary.main"
                                                : "divider",
                                            transition: "all 0.2s",
                                            "&:hover": isDisabled
                                                ? {}
                                                : {
                                                      boxShadow: 4,
                                                      transform: "translateY(-2px)",
                                                  },
                                        }}
                                        onClick={() => {
                                            if (!isDisabled) {
                                                handleTogglePlatform(
                                                    platform.name
                                                );
                                            }
                                        }}
                                    >
                                        <CardContent>
                                            <Stack spacing={2}>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1,
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={
                                                                    isSelected
                                                                }
                                                                disabled={
                                                                    isDisabled
                                                                }
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!isDisabled) {
                                                                        handleTogglePlatform(
                                                                            platform.name
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            platform.display_name
                                                        }
                                                        sx={{
                                                            flex: 1,
                                                            margin: 0,
                                                            pointerEvents: "auto",
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!isDisabled) {
                                                                handleTogglePlatform(
                                                                    platform.name
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </Box>

                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1,
                                                        color: "text.secondary",
                                                    }}
                                                >
                                                    <InfoOutlinedIcon
                                                        fontSize="small"
                                                    />
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            fontSize: "0.75rem",
                                                        }}
                                                    >
                                                        {
                                                            getPlatformDescription(
                                                                platform
                                                            )
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Box>
                            );
                        })}
                    </Box>

                    {filteredPlatforms.length === 0 && (
                        <Paper sx={{ p: 4, textAlign: "center" }}>
                            <Typography variant="body1" color="text.secondary">
                                No platforms found matching "{searchQuery}"
                            </Typography>
                        </Paper>
                    )}
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        gap: 2,
                        justifyContent: "flex-end",
                    }}
                >
                    {allowSkip && onSkip && (
                        <Button onClick={onSkip} disabled={saving}>
                            Skip
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={
                            saving ||
                            selectedPlatforms.length === 0 ||
                            selectedPlatforms.length > maxPlatforms
                        }
                        size="large"
                    >
                        {saving ? "Saving..." : "Continue"}
                    </Button>
                </Box>
            </Stack>
        </Container>
    );
};

