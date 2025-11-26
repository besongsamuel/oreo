import {
  ArrowForward as ArrowForwardIcon,
  Assignment as AssignmentIcon,
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
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleViewActionPlans = () => {
    navigate(`/companies/${companyId}/action_plans`);
  };

  return (
    <Box sx={{ height: "100%" }}>
      <Card
        elevation={0}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: "18px",
          border: "none",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          transition: "box-shadow 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          },
        }}
      >
        <CardContent
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            p: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          <Stack
            spacing={2}
            sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
          >
            {/* Top Section: Logo + Name */}
            <Stack direction="row" spacing={2} alignItems="flex-start">
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
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}
                >
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    onClick={onViewDetails}
                    sx={{
                      cursor: "pointer",
                      color: "text.primary",
                      "&:hover": {
                        color: "primary.main",
                        textDecoration: "underline",
                      },
                      flexGrow: 1,
                    }}
                  >
                    {companyName}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={onEdit}
                    sx={{
                      opacity: 0.6,
                      "&:hover": {
                        opacity: 1,
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Stack>
                {ownerName || ownerEmail ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mt: 0.5 }}
                  >
                    Owner: {ownerName || ownerEmail}
                  </Typography>
                ) : null}
              </Box>
            </Stack>

            {/* Primary Stats: Rating prominently */}
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <StarIcon
                  fontSize="small"
                  sx={{ color: "warning.main", fontSize: 20 }}
                />
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ color: "text.primary" }}
                >
                  {averageRating?.toFixed(1) || "0.0"}
                </Typography>
              </Stack>

              {/* Secondary Stats */}
              <Stack direction="row" spacing={2}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LocationIcon
                    fontSize="small"
                    sx={{ color: "text.secondary", fontSize: 16 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    {totalLocations}{" "}
                    {totalLocations !== 1
                      ? t("companies.multipleLocations")
                      : t("companies.singleLocation")}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem" }}
                >
                  {totalReviews}{" "}
                  {totalReviews !== 1
                    ? t("companies.multipleReviews")
                    : t("companies.singleReview")}
                </Typography>
              </Stack>

              {/* Industry Chip */}
              {industry && (
                <Box sx={{ pt: 0.5 }}>
                  <Chip
                    label={industry}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: "0.75rem",
                      height: 24,
                    }}
                  />
                </Box>
              )}
            </Stack>

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Bottom Section */}
            <Divider sx={{ my: 0 }} />
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              sx={{ mt: 1 }}
            >
              <Button
                variant="text"
                startIcon={<AssignmentIcon />}
                onClick={handleViewActionPlans}
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  fontWeight: 500,
                  px: 0,
                  flex: 1,
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                }}
              >
                {t("companies.viewActionPlans", "View Action Plans")}
              </Button>
              <Button
                variant="text"
                endIcon={<ArrowForwardIcon />}
                onClick={onViewDetails}
                sx={{
                  justifyContent: "flex-end",
                  textTransform: "none",
                  fontWeight: 500,
                  px: 0,
                  flex: 1,
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                }}
              >
                {t("companies.viewDetails")}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
