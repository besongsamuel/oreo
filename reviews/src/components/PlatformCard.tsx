import { CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface PlatformCardProps {
  platform: {
    id: string;
    name: string;
    display_name: string;
    icon_url?: string | null;
    short_description_en?: string | null;
    short_description_fr?: string | null;
  };
  selected: boolean;
  onToggle: (platformId: string) => void;
  disabled?: boolean;
}

export const PlatformCard = ({
  platform,
  selected,
  onToggle,
  disabled = false,
}: PlatformCardProps) => {
  const { i18n, t } = useTranslation();
  const isFrench = i18n.language === "fr";
  const description =
    (isFrench ? platform.short_description_fr : platform.short_description_en) ||
    platform.short_description_en ||
    "";

  const handleClick = () => {
    if (!disabled) {
      onToggle(platform.id);
    }
  };

  return (
    <Card
      elevation={0}
      onClick={handleClick}
      sx={{
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: "18px",
        border: selected ? "2px solid" : "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "rgba(13, 45, 83, 0.02)" : "background.paper",
        boxShadow: selected
          ? "0 4px 12px rgba(13, 45, 83, 0.1)"
          : "0 2px 8px rgba(0, 0, 0, 0.04)",
        transition: "all 0.2s ease-in-out",
        opacity: disabled ? 0.6 : 1,
        "&:hover": {
          boxShadow: disabled
            ? "0 2px 8px rgba(0, 0, 0, 0.04)"
            : "0 4px 12px rgba(0, 0, 0, 0.08)",
          borderColor: disabled ? "divider" : "primary.main",
        },
      }}
    >
      <CardContent sx={{ p: 3, position: "relative" }}>
        {/* Checkbox in top-right corner */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
          }}
        >
          {selected ? (
            <CheckCircle
              sx={{
                color: "primary.main",
                fontSize: 28,
              }}
            />
          ) : (
            <RadioButtonUnchecked
              sx={{
                color: "text.secondary",
                fontSize: 28,
              }}
            />
          )}
        </Box>

        <Stack spacing={2} alignItems="center" sx={{ pt: 1 }}>
          {/* Platform Logo */}
          <Box
            sx={{
              width: 80,
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {platform.icon_url ? (
              <Box
                component="img"
                src={platform.icon_url}
                alt={platform.display_name}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  bgcolor: "grey.100",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {platform.display_name.charAt(0)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Platform Name */}
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              color: selected ? "primary.main" : "text.primary",
              textAlign: "center",
            }}
          >
            {platform.display_name}
          </Typography>

          {/* Short Description */}
          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: "center",
                minHeight: 40,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {description}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

