import { CircularProgress, Container, Typography } from "@mui/material";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = () => {
      // Extract authorization code from URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      // Get the return path from localStorage
      const returnPath =
        localStorage.getItem("google_oauth_return_path") || "/companies";

      // Clean up stored return path
      localStorage.removeItem("google_oauth_return_path");

      if (error) {
        console.error("Google OAuth error:", error);
        localStorage.setItem("google_auth_error", error);
        navigate(returnPath);
        return;
      }

      if (code) {
        // Store the authorization code
        localStorage.setItem("google_auth_code", code);
        navigate(returnPath);
      } else {
        console.error("No authorization code received");
        navigate(returnPath);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Completing Google authentication...
      </Typography>
    </Container>
  );
};
