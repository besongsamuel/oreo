import {
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface CompanyCardProps {
  companyId: string;
  companyName: string;
  totalLocations: number;
  totalReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  companyId,
  companyName,
  totalLocations,
  totalReviews,
  averageRating,
  positiveReviews,
  negativeReviews,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          {/* Header with company name and location count */}
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ bgcolor: "secondary.main" }}>
              <BusinessIcon sx={{ color: "white" }} />
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                noWrap
                title={companyName}
              >
                {companyName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalLocations}{" "}
                {totalLocations !== 1
                  ? t("dashboard.locations")
                  : t("dashboard.location")}
              </Typography>
            </Box>
          </Stack>

          <Divider />

          {/* Stats: Reviews and Rating */}
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {totalReviews}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("companies.reviews")}
              </Typography>
            </Box>
            <Box>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="h5" fontWeight={700}>
                  {averageRating?.toFixed(1) || "0.0"}
                </Typography>
                <StarIcon sx={{ color: "warning.main", fontSize: "1.2rem" }} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {t("companies.avgRating")}
              </Typography>
            </Box>
          </Stack>

          {/* Sentiment chips */}
          <Stack direction="row" spacing={1}>
            <Chip
              label={`${positiveReviews} ${t("companies.positive")}`}
              size="small"
              color="success"
              variant="outlined"
            />
            <Chip
              label={`${negativeReviews} ${t("companies.negative")}`}
              size="small"
              color="error"
              variant="outlined"
            />
          </Stack>

          <Divider />

          {/* View Details button */}
          <Button
            variant="text"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate(`/companies/${companyId}`)}
            sx={{
              justifyContent: "space-between",
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            {t("companies.viewDetails")}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};
