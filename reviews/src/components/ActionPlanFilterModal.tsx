import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Alert,
  Stack,
  Box,
} from "@mui/material";
import {
  SentimentSatisfiedAlt as PositiveIcon,
  SentimentNeutral as NeutralIcon,
  SentimentDissatisfied as NegativeIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ActionPlanFilterModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (filters: {
    filterStartDate: string;
    filterEndDate: string;
    selectedSentiment: string;
  }) => void;
  loading?: boolean;
}

export const ActionPlanFilterModal: React.FC<ActionPlanFilterModalProps> = ({
  open,
  onClose,
  onGenerate,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");

  // Set default date range (last 3 months)
  useEffect(() => {
    if (open) {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);

      setEndDate(end.toISOString().split("T")[0]);
      setStartDate(start.toISOString().split("T")[0]);
      setSelectedSentiment("");
      setDateError("");
    }
  }, [open]);

  const validateDateRange = (start: string, end: string, setError: boolean = true): boolean => {
    if (!start || !end) {
      if (setError) {
        setDateError(t("actionPlanFilter.pleaseSelectDateRange"));
      }
      return false;
    }

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    if (startDateObj > endDateObj) {
      if (setError) {
        setDateError(t("actionPlanFilter.startDateAfterEndDate"));
      }
      return false;
    }

    const diffMonths =
      (endDateObj.getFullYear() - startDateObj.getFullYear()) * 12 +
      (endDateObj.getMonth() - startDateObj.getMonth());

    if (diffMonths > 3) {
      if (setError) {
        setDateError(t("actionPlanFilter.dateRangeExceedsThreeMonths"));
      }
      return false;
    }

    if (diffMonths < 0) {
      if (setError) {
        setDateError(t("actionPlanFilter.startDateAfterEndDate"));
      }
      return false;
    }

    if (setError) {
      setDateError("");
    }
    return true;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (endDate) {
      validateDateRange(newStartDate, endDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    if (startDate) {
      validateDateRange(startDate, newEndDate);
    }
  };

  const handleGenerate = () => {
    if (!validateDateRange(startDate, endDate)) {
      return;
    }

    if (!selectedSentiment) {
      setDateError(t("actionPlanFilter.pleaseSelectSentiment"));
      return;
    }

    onGenerate({
      filterStartDate: startDate,
      filterEndDate: endDate,
      selectedSentiment,
    });
  };

  const isFormValid = () => {
    return (
      startDate &&
      endDate &&
      selectedSentiment &&
      validateDateRange(startDate, endDate, false) && // Don't set error state during validation check
      !dateError
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("actionPlanFilter.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Date Range Picker */}
          <Box>
            <FormLabel component="legend" sx={{ mb: 1 }}>
              {t("actionPlanFilter.dateRange")}
            </FormLabel>
            <Stack direction="row" spacing={2}>
              <TextField
                label={t("actionPlanFilter.startDate")}
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                error={!!dateError && !!startDate}
              />
              <TextField
                label={t("actionPlanFilter.endDate")}
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                error={!!dateError && !!endDate}
              />
            </Stack>
            {dateError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {dateError}
              </Alert>
            )}
          </Box>

          {/* Sentiment Selection */}
          <FormControl component="fieldset">
            <FormLabel component="legend">
              {t("actionPlanFilter.sentiment")}
            </FormLabel>
            <RadioGroup
              value={selectedSentiment}
              onChange={(e) => {
                setSelectedSentiment(e.target.value);
                if (dateError === t("actionPlanFilter.pleaseSelectSentiment")) {
                  setDateError("");
                }
              }}
            >
              <FormControlLabel
                value="positive"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PositiveIcon sx={{ color: "success.main" }} />
                    <span>{t("actionPlanFilter.positive")}</span>
                  </Stack>
                }
              />
              <FormControlLabel
                value="negative"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <NegativeIcon sx={{ color: "error.main" }} />
                    <span>{t("actionPlanFilter.negative")}</span>
                  </Stack>
                }
              />
              <FormControlLabel
                value="neutral"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <NeutralIcon sx={{ color: "warning.main" }} />
                    <span>{t("actionPlanFilter.neutral")}</span>
                  </Stack>
                }
              />
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t("actionPlanFilter.cancel")}
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={!isFormValid() || loading}
        >
          {loading
            ? t("actionPlanFilter.generating")
            : t("actionPlanFilter.generate")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

