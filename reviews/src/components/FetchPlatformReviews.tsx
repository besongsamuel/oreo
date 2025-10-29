import {
  Facebook as FacebookIcon,
  Google as GoogleIcon,
  RateReview as ReviewIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PlatformRegistryEntry } from "../services/platforms/platformRegistry";

interface FetchPlatformReviewsProps {
  platforms: PlatformRegistryEntry[];
  connecting: boolean;
  onPlatformClick: (platformName: string) => void;
}

export const FetchPlatformReviews = ({
  platforms,
  connecting,
  onPlatformClick,
}: FetchPlatformReviewsProps) => {
  const { t } = useTranslation();
  // Get platform icon based on platform name
  const getPlatformIcon = (platformName: string) => {
    switch (platformName.toLowerCase()) {
      case "facebook":
        return <FacebookIcon />;
      case "google":
        return <GoogleIcon />;
      case "yelp":
      case "tripadvisor":
        return <ReviewIcon />;
      case "trustpilot":
        return <StarIcon />;
      default:
        return <ReviewIcon />;
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
      >
        {t("platform.connectToLocations")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("platform.connectDescription")}
      </Typography>
      <Box
        sx={{
          bgcolor: "grey.50",
          p: 2,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>{t("platform.whatHappens")}</strong>
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          component="ul"
          sx={{ mb: 0, pl: 2 }}
        >
          <li style={{ marginBottom: "8px" }}>{t("platform.connectPoint1")}</li>
          <li style={{ marginBottom: "8px" }}>{t("platform.connectPoint2")}</li>
          <li>{t("platform.connectPoint3")}</li>
        </Typography>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(4, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {platforms.map((platform) => (
          <Button
            key={platform.name}
            variant="outlined"
            size="large"
            startIcon={getPlatformIcon(platform.name)}
            onClick={() => onPlatformClick(platform.name)}
            disabled={platform.status !== "active" || connecting}
            sx={{
              py: 2,
              borderRadius: 3,
              borderColor: "divider",
              color: "text.primary",
              "&:hover": {
                borderColor: platform.color,
                bgcolor: `${platform.color}08`,
                "& .MuiSvgIcon-root": {
                  color: platform.color,
                },
              },
              "& .MuiSvgIcon-root": {
                fontSize: "1.5rem",
              },
              opacity: platform.status !== "active" ? 0.6 : 1,
            }}
          >
            {platform.displayName}
            {platform.status === "coming_soon" && (
              <Chip
                label={t("platform.soon")}
                size="small"
                sx={{
                  ml: 1,
                  height: 20,
                  fontSize: "0.7rem",
                  bgcolor: "text.secondary",
                  color: "white",
                }}
              />
            )}
          </Button>
        ))}
      </Box>
    </Paper>
  );
};
