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
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { SEO } from "../components/SEO";

export const SuccessLocation = () => {
  const { t } = useTranslation();
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const handleBackToCompany = () => {
    navigate(`/companies/${companyId}`);
  };

  return (
    <>
      <SEO
        title={t("successLocation.seoTitle")}
        description={t("successLocation.seoDescription")}
        keywords={t("successLocation.seoKeywords")}
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
                  {t("successLocation.title")}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {t("successLocation.message")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("successLocation.description")}
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
                  {t("successLocation.backToCompany")}
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
                  {t("successLocation.viewCompanyPage")}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};
