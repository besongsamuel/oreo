import { CircularProgress, Container, Typography } from "@mui/material";
import { useEffect, useRef } from "react";

export const GoogleCallback = () => {
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }

    const handleCallback = () => {
      // Extract authorization code from URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      // Get the return path from localStorage (includes query params)
      const returnPath =
        localStorage.getItem("google_oauth_return_path") || "/companies";

      // Clean up stored return path
      localStorage.removeItem("google_oauth_return_path");

      if (error) {
        console.error("Google OAuth error:", error);
        localStorage.setItem("google_auth_error", error);
        // Navigate with full URL including query parameters
        window.location.href = returnPath;
        return;
      }

      if (code) {
        // Store the authorization code
        localStorage.setItem("google_auth_code", code);
        // Navigate with full URL including query parameters
        window.location.href = returnPath;
      } else {
        console.error("No authorization code received");
        // Navigate with full URL including query parameters
        window.location.href = returnPath;
      }
    };

    hasProcessed.current = true;
    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // navigate is stable and doesn't need to be in dependencies

  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Completing Google authentication...
      </Typography>
    </Container>
  );
};
