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
  Typography,
  Divider,
  Paper,
} from "@mui/material";
import {
  SentimentSatisfiedAlt as PositiveIcon,
  SentimentNeutral as NeutralIcon,
  SentimentDissatisfied as NegativeIcon,
  InfoOutlined as InfoIcon,
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          pt: 3,
          px: 3,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          {t("actionPlanFilter.title")}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 3 }}>
        <Stack spacing={4}>
          {/* Date Range Picker */}
          <Box>
            <FormLabel
              component="legend"
              sx={{
                mb: 2,
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "text.primary",
              }}
            >
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Stack>
            {/* Info Note */}
            <Box
              sx={{
                mt: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: "action.hover",
              }}
            >
              <InfoIcon
                sx={{
                  fontSize: 18,
                  color: "text.secondary",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.75rem",
                }}
              >
                {t("actionPlanFilter.dateRangeNote")}
              </Typography>
            </Box>
            {dateError && (
              <Alert
                severity="error"
                sx={{
                  mt: 1.5,
                  borderRadius: 2,
                }}
              >
                {dateError}
              </Alert>
            )}
          </Box>

          <Divider />

          {/* Sentiment Selection */}
          <FormControl component="fieldset">
            <FormLabel
              component="legend"
              sx={{
                mb: 2,
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "text.primary",
              }}
            >
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
              sx={{
                gap: 1,
              }}
            >
              <Paper
                elevation={selectedSentiment === "positive" ? 2 : 0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border:
                    selectedSentiment === "positive"
                      ? "2px solid"
                      : "1px solid",
                  borderColor:
                    selectedSentiment === "positive"
                      ? "success.main"
                      : "divider",
                  bgcolor:
                    selectedSentiment === "positive"
                      ? "action.selected"
                      : "background.paper",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "success.main",
                    bgcolor: "action.hover",
                  },
                }}
              >
                <FormControlLabel
                  value="positive"
                  control={<Radio />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <PositiveIcon
                        sx={{
                          color: "success.main",
                          fontSize: 24,
                        }}
                      />
                      <Typography fontWeight={500}>
                        {t("actionPlanFilter.positive")}
                      </Typography>
                    </Stack>
                  }
                  sx={{
                    m: 0,
                    width: "100%",
                  }}
                />
              </Paper>
              <Paper
                elevation={selectedSentiment === "negative" ? 2 : 0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border:
                    selectedSentiment === "negative"
                      ? "2px solid"
                      : "1px solid",
                  borderColor:
                    selectedSentiment === "negative"
                      ? "error.main"
                      : "divider",
                  bgcolor:
                    selectedSentiment === "negative"
                      ? "action.selected"
                      : "background.paper",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "error.main",
                    bgcolor: "action.hover",
                  },
                }}
              >
                <FormControlLabel
                  value="negative"
                  control={<Radio />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <NegativeIcon
                        sx={{
                          color: "error.main",
                          fontSize: 24,
                        }}
                      />
                      <Typography fontWeight={500}>
                        {t("actionPlanFilter.negative")}
                      </Typography>
                    </Stack>
                  }
                  sx={{
                    m: 0,
                    width: "100%",
                  }}
                />
              </Paper>
              <Paper
                elevation={selectedSentiment === "neutral" ? 2 : 0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border:
                    selectedSentiment === "neutral" ? "2px solid" : "1px solid",
                  borderColor:
                    selectedSentiment === "neutral"
                      ? "warning.main"
                      : "divider",
                  bgcolor:
                    selectedSentiment === "neutral"
                      ? "action.selected"
                      : "background.paper",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "warning.main",
                    bgcolor: "action.hover",
                  },
                }}
              >
                <FormControlLabel
                  value="neutral"
                  control={<Radio />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <NeutralIcon
                        sx={{
                          color: "warning.main",
                          fontSize: 24,
                        }}
                      />
                      <Typography fontWeight={500}>
                        {t("actionPlanFilter.neutral")}
                      </Typography>
                    </Stack>
                  }
                  sx={{
                    m: 0,
                    width: "100%",
                  }}
                />
              </Paper>
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            borderRadius: 6,
            px: 3,
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          {t("actionPlanFilter.cancel")}
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={!isFormValid() || loading}
          sx={{
            borderRadius: 6,
            px: 3,
            textTransform: "none",
            fontWeight: 500,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            },
          }}
        >
          {loading
            ? t("actionPlanFilter.generating")
            : t("actionPlanFilter.generate")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

