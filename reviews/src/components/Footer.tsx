import { Box, Container, Link, Typography } from "@mui/material";

export const Footer = () => {
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
            © {new Date().getFullYear()}
            <Box component="span" sx={{ fontWeight: 500 }}>
              Aureanne
            </Box>
            <Box component="span" sx={{ color: "secondary.main", fontWeight: 500 }}>
              Review
            </Box>
            <Box component="span" sx={{ fontWeight: 500 }}>
              Tracker
            </Box>
            . All rights reserved.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Designed by{" "}
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
      </Container>
    </Box>
  );
};
