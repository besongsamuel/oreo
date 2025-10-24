import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { SEO } from "../components/SEO";

export const SuccessLocation = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const handleBackToCompany = () => {
    navigate(`/companies/${companyId}`);
  };

  return (
    <>
      <SEO
        title="Location Created - Boresha"
        description="Location successfully created. You can now track reviews for this location."
        keywords="location created, success, review tracking"
      />
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card>
          <CardContent sx={{ p: { xs: 4, sm: 6, md: 8 } }}>
            <Stack spacing={4} alignItems="center" sx={{ textAlign: "center" }}>
              {/* Success Icon */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: "success.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 48, color: "success.main" }} />
              </Box>

              {/* Success Message */}
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Location Created!
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Your new location has been successfully added to your company.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You can now connect review platforms and start tracking
                  customer feedback for this location.
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBackToCompany}
                  sx={{
                    borderRadius: 980,
                    textTransform: "none",
                    fontWeight: 500,
                    px: 4,
                  }}
                >
                  Back to Company
                </Button>
                <Button
                  variant="contained"
                  onClick={handleBackToCompany}
                  sx={{
                    borderRadius: 980,
                    textTransform: "none",
                    fontWeight: 500,
                    px: 4,
                  }}
                >
                  View Company Page
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};
