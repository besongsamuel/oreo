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

export const Signup = () => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setSuccess(true);
      // Redirect after a short delay to show success message
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || t("auth.createAccountError"));
    } finally {
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
                {t("auth.createAccount")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("auth.signupTitle")}
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {success && (
              <Alert severity="success">{t("auth.createAccount")}</Alert>
            )}

            <form onSubmit={handleSignup}>
              <Stack spacing={2}>
                <TextField
                  label={t("auth.email")}
                  type="email"
                  fullWidth
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || success}
                  autoComplete="email"
                />

                <TextField
                  label={t("auth.password")}
                  type="password"
                  fullWidth
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                  autoComplete="new-password"
                  helperText={t("auth.passwordTooShort")}
                />

                <TextField
                  label={t("auth.confirmPassword")}
                  type="password"
                  fullWidth
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || success}
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || success}
                >
                  {loading ? t("common.loading") : t("auth.signUp")}
                </Button>
              </Stack>
            </form>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" component="span">
                {t("auth.alreadyHaveAccount")}{" "}
              </Typography>
              <Link component={RouterLink} to="/auth/login" variant="body2">
                {t("auth.signIn")}
              </Link>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};
