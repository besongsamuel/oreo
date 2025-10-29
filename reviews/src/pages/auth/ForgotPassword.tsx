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
import { Link as RouterLink } from "react-router-dom";
import { useSupabase } from "../../hooks/useSupabase";

export const ForgotPassword = () => {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t("auth.resetPasswordError"));
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
                {t("auth.resetPasswordTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("auth.resetPasswordMessage")}
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {success && (
              <Alert severity="success">{t("auth.passwordResetMessage")}</Alert>
            )}

            <form onSubmit={handleResetPassword}>
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

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || success}
                >
                  {loading ? t("common.loading") : t("auth.resetPassword")}
                </Button>
              </Stack>
            </form>

            <Box sx={{ textAlign: "center" }}>
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
