import { CheckCircle, ArrowBack } from "@mui/icons-material";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SEO } from "../components/SEO";

export const PlatformSelectionSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title={t("companies.selectPlatforms.successTitle")}
        description={t("companies.selectPlatforms.successDescription")}
      />
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
        <Stack spacing={4} alignItems="center" textAlign="center">
          {/* Success Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "success.main",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle sx={{ fontSize: 48 }} />
          </Box>

          {/* Success Message */}
          <Stack spacing={2}>
            <Typography variant="h4" component="h1" fontWeight={700}>
              {t("companies.selectPlatforms.successTitle")}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
              {t("companies.selectPlatforms.successDescription")}
            </Typography>
          </Stack>

          {/* Action Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/companies")}
            sx={{
              minWidth: 250,
              fontWeight: 600,
              px: 4,
            }}
          >
              {t("companies.selectPlatforms.backToCompanies")}
          </Button>
        </Stack>
      </Container>
    </>
  );
};

