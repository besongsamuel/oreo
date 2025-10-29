import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSupabase } from "../hooks/useSupabase";

export const SubscriptionSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseClient = useSupabase();

  useEffect(() => {
    const verifySubscription = async () => {
      if (!sessionId) {
        setError(t("subscription.invalidSession"));
        setLoading(false);
        return;
      }

      try {
        // Give webhook a moment to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check if subscription was updated
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        if (!session) {
          navigate("/auth/login");
          return;
        }

        // Fetch updated profile
        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("subscription_tier, subscription_expires_at")
          .eq("id", session.user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("Failed to fetch profile");
        }

        // If still not paid, wait a bit more and check again
        if (profile.subscription_tier !== "paid") {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const { data: profileRetry } = await supabaseClient
            .from("profiles")
            .select("subscription_tier, subscription_expires_at")
            .eq("id", session.user.id)
            .single();

          if (profileRetry?.subscription_tier !== "paid") {
            setError(t("subscription.verificationPending"));
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error verifying subscription:", err);
        setError(err.message || t("subscription.verificationError"));
        setLoading(false);
      }
    };

    verifySubscription();
  }, [sessionId, navigate, supabaseClient, t]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={3}>
        <CardContent>
          <Stack spacing={4} alignItems="center" textAlign="center">
            <CheckCircleIcon sx={{ fontSize: 80, color: "success.main" }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                {t("subscription.success.title")}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {loading
                  ? t("subscription.verifying")
                  : error
                  ? error
                  : t("subscription.success.message")}
              </Typography>
            </Box>

            {!loading && !error && (
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/profile")}
              >
                {t("subscription.goToProfile")}
              </Button>
            )}

            {error && (
              <Button variant="outlined" onClick={() => navigate("/profile")}>
                {t("common.back")}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};
