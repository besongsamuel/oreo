import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Button,
  Typography,
  Box,
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
  const { t, i18n } = useTranslation();
  const isFrench = i18n.language === "fr";
  const description =
    (isFrench
      ? platform.short_description_fr
      : platform.short_description_en) ||
    platform.short_description_en ||
    "";

  // Use icon_url from database
  const logoUrl = platform.icon_url;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onToggle(platform.id);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "18px",
        border: selected ? "2px solid" : "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: "background.paper",
        boxShadow: selected
          ? "0 4px 12px rgba(13, 45, 83, 0.1)"
          : "0 2px 8px rgba(0, 0, 0, 0.04)",
        transition: "all 0.3s ease-in-out",
        opacity: disabled ? 0.6 : 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        "&:hover": {
          boxShadow: disabled
            ? "0 2px 8px rgba(0, 0, 0, 0.04)"
            : selected
            ? "0 8px 24px rgba(13, 45, 83, 0.15)"
            : "0 8px 24px rgba(0, 0, 0, 0.12)",
          transform: disabled ? "none" : "translateY(-4px)",
          borderColor: disabled ? "divider" : "primary.main",
        },
      }}
    >
      {/* Media Section - Logo */}
      <CardMedia
        component="div"
        sx={{
          height: 200,
          bgcolor: selected ? "primary.light" : "grey.50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "background-color 0.3s ease-in-out",
          "&:hover": {
            bgcolor: disabled
              ? undefined
              : selected
              ? "primary.main"
              : "primary.light",
          },
        }}
      >
        {logoUrl ? (
          <Box
            component="img"
            src={logoUrl}
            alt={platform.display_name}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
              const fallback = img.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = "flex";
              }
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              p: 2,
            }}
          />
        ) : null}
        {/* Fallback placeholder if no logo */}
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: logoUrl ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              color: selected ? "primary.contrastText" : "text.secondary",
            }}
          >
            {platform.display_name.charAt(0)}
          </Typography>
        </Box>
      </CardMedia>

      {/* Content Section */}
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Typography
          variant="h6"
          component="div"
          fontWeight={600}
          sx={{
            color: selected ? "primary.main" : "text.primary",
            mb: description ? 1 : 0,
          }}
        >
          {platform.display_name}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.5,
            }}
          >
            {description}
          </Typography>
        )}
      </CardContent>

      {/* Actions Section - Selection Button */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant={selected ? "contained" : "outlined"}
          onClick={handleToggle}
          disabled={disabled}
          sx={{
            borderRadius: "980px",
            textTransform: "none",
            fontWeight: 600,
            py: 1.5,
          }}
        >
          {selected
            ? t("companies.selectPlatforms.selected", "Selected")
            : t("companies.selectPlatforms.select", "Select")}
        </Button>
      </CardActions>
    </Card>
  );
};
