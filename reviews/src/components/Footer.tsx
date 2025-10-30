import {
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  MusicNote as TikTokIcon,
} from "@mui/icons-material";
import {
  Box,
  Container,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.grey[100]
            : theme.palette.grey[900],
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3}>
          {/* Social Media Links */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <IconButton
              component="a"
              href="https://www.instagram.com/boreshacx"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "text.secondary",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              <InstagramIcon />
            </IconButton>
            <IconButton
              component="a"
              href="https://www.tiktok.com/@boreshacx"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "text.secondary",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              <TikTokIcon />
            </IconButton>
            <IconButton
              component="a"
              href="https://www.linkedin.com/company/boreshacx"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "text.secondary",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              <LinkedInIcon />
            </IconButton>
          </Box>

          {/* Legal Links */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            <Link
              component={RouterLink}
              to="/pricing"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: "0.875rem",
                "&:hover": {
                  textDecoration: "underline",
                  color: "primary.main",
                },
              }}
            >
              {t("common.pricing", { defaultValue: "Pricing" })}
            </Link>
            <Link
              component={RouterLink}
              to="/privacy-policy"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: "0.875rem",
                "&:hover": {
                  textDecoration: "underline",
                  color: "primary.main",
                },
              }}
            >
              {t("footer.privacyPolicy")}
            </Link>
            <Link
              component={RouterLink}
              to="/terms-of-use"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: "0.875rem",
                "&:hover": {
                  textDecoration: "underline",
                  color: "primary.main",
                },
              }}
            >
              {t("footer.termsOfUse")}
            </Link>
          </Box>

          {/* Copyright and Design Credit */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              component="div"
              sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}
            >
              {t("footer.copyright", {
                year: new Date().getFullYear(),
                company: "Boresha",
              })}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {t("footer.designedBy", { company: "Aftermath Technologies" })}{" "}
              <Link
                href="https://www.aftermathtechnologies.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  fontWeight: 600,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Aftermath Technologies
              </Link>
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};
