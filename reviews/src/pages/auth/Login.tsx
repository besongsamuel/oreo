import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useSupabase } from "../../hooks/useSupabase";

export const Login = () => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Wait a moment for the session to be fully established
      if (data.session) {
        // Small delay to ensure auth state is propagated
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || t("auth.invalidCredentials"));
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {t("auth.welcome")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("auth.loginTitle")}
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <form onSubmit={handleLogin}>
              <Stack spacing={2}>
                <TextField
                  label={t("auth.email")}
                  type="email"
                  fullWidth
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />

                <TextField
                  label={t("auth.password")}
                  type="password"
                  fullWidth
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? t("common.loading") : t("auth.signIn")}
                </Button>
              </Stack>
            </form>

            <Stack spacing={1}>
              <Link
                component={RouterLink}
                to="/auth/forgot-password"
                variant="body2"
                sx={{ textAlign: "center" }}
              >
                {t("auth.forgotPassword")}
              </Link>

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" component="span">
                  {t("auth.dontHaveAccount")}{" "}
                </Typography>
                <Link component={RouterLink} to="/auth/signup" variant="body2">
                  {t("auth.signUp")}
                </Link>
              </Box>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};
