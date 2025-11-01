import {
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface CompaniesCompanyCardProps {
  companyId: string;
  companyName: string;
  industry: string | null;
  description: string | null;
  website: string | null;
  logoUrl?: string | null;
  totalLocations: number;
  totalReviews: number;
  averageRating: number;
  ownerName?: string | null;
  ownerEmail?: string;
  onEdit: () => void;
  onViewDetails: () => void;
}

export const CompaniesCompanyCard = ({
  companyId,
  companyName,
  industry,
  description,
  website,
  logoUrl,
  totalLocations,
  totalReviews,
  averageRating,
  ownerName,
  ownerEmail,
  onEdit,
  onViewDetails,
}: CompaniesCompanyCardProps) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ height: "100%" }}>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack
            spacing={2}
            sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
          >
            <Box sx={{ flexGrow: 0 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {logoUrl ? (
                      <Box
                        component="img"
                        src={logoUrl}
                        alt={companyName}
                        sx={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <BusinessIcon
                        sx={{
                          fontSize: 48,
                          color: "primary.main",
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      onClick={onViewDetails}
                      sx={{
                        cursor: "pointer",
                        color: "primary.main",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {companyName}
                    </Typography>
                    {ownerName || ownerEmail ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        Owner: {ownerName || ownerEmail}
                      </Typography>
                    ) : null}
                    {industry && (
                      <Chip label={industry} size="small" variant="outlined" />
                    )}
                  </Box>
                </Stack>
                <IconButton size="small" onClick={onEdit}>
                  <EditIcon />
                </IconButton>
              </Stack>

              {description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  {description}
                </Typography>
              )}

              <Stack spacing={1} sx={{ mt: 2 }}>
                <Stack direction="row" spacing={2}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {totalLocations}{" "}
                      {totalLocations !== 1
                        ? t("companies.multipleLocations")
                        : t("companies.singleLocation")}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <StarIcon fontSize="small" sx={{ color: "warning.main" }} />
                    <Typography variant="body2">
                      {averageRating?.toFixed(1) || "0.0"}
                    </Typography>
                  </Stack>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {totalReviews}{" "}
                  {totalReviews !== 1
                    ? t("companies.multipleReviews")
                    : t("companies.singleReview")}
                </Typography>
              </Stack>

              {website && (
                <Typography
                  variant="caption"
                  component="a"
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "primary.main", mt: 2, display: "block" }}
                >
                  {website}
                </Typography>
              )}
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Divider />

            <Button
              variant="text"
              endIcon={<ArrowForwardIcon />}
              onClick={onViewDetails}
              sx={{
                justifyContent: "space-between",
                textTransform: "none",
                fontWeight: 500,
                alignSelf: "flex-end",
                width: "100%",
              }}
            >
              {t("companies.viewDetails")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
