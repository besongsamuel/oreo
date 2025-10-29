import { Cancel as CancelIcon } from "@mui/icons-material";
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
import { useNavigate } from "react-router-dom";

export const SubscriptionCancelled = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={3}>
        <CardContent>
          <Stack spacing={4} alignItems="center" textAlign="center">
            <CancelIcon sx={{ fontSize: 80, color: "text.secondary" }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                {t("subscription.cancelled.title")}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t("subscription.cancelled.message")}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/profile")}
            >
              {t("subscription.goToProfile")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};
