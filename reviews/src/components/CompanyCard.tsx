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
  const navigate = useNavigate();

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          {/* Header with company name and location count */}
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ bgcolor: "secondary.main" }}>
              <BusinessIcon />
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
                {totalLocations} location
                {totalLocations !== 1 ? "s" : ""}
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
                Reviews
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
                Avg Rating
              </Typography>
            </Box>
          </Stack>

          {/* Sentiment chips */}
          <Stack direction="row" spacing={1}>
            <Chip
              label={`${positiveReviews} positive`}
              size="small"
              color="success"
              variant="outlined"
            />
            <Chip
              label={`${negativeReviews} negative`}
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
            View Details
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};
