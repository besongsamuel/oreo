import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  description?: string;
  ctaText?: string;
}

export const UpgradeDialog = ({
  open,
  onClose,
  title,
  message,
  description,
  ctaText,
}: UpgradeDialogProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate("/pricing");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {title ||
          t("upgrade.dialogTitle", { defaultValue: "Upgrade Required" })}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body1">{message}</Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {t("common.cancel", { defaultValue: "Cancel" })}
        </Button>
        <Button variant="contained" onClick={handleUpgrade}>
          {ctaText ||
            t("upgrade.viewPricing", { defaultValue: "View Pricing" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};









