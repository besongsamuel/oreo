import {
  Add as AddIcon,
  RadioButtonChecked as StepIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface OnboardingCardProps {
  step:
    | "platform-selection"
    | "complete-platforms"
    | "add-company"
    | null;
  selectedPlatformsCount: number;
  maxPlatforms: number;
  hasCompanies: boolean;
  onPlatformSelect: () => void;
  onAddCompany: () => void;
}

export const OnboardingCard = ({
  step,
  selectedPlatformsCount,
  maxPlatforms,
  hasCompanies,
  onPlatformSelect,
  onAddCompany,
}: OnboardingCardProps) => {
  const { t } = useTranslation();

  // Don't show if everything is set up
  if (!step || (step === "add-company" && hasCompanies)) {
    return null;
  }

  const remainingPlatforms = maxPlatforms - selectedPlatformsCount;
  const hasNoSelection = selectedPlatformsCount === 0;

  // Determine card content based on step
  let title: string;
  let description: string;
  let buttonText: string;
  let buttonAction: () => void;
  let showWarning = true;
  let showRemainingCount = false;

  if (step === "platform-selection" || step === "complete-platforms") {
    if (hasNoSelection) {
      title = t("companies.onboardingPlatformTitleNoSelection");
      description = t("companies.onboardingPlatformDescriptionNoSelection");
    } else {
      title = t("companies.onboardingPlatformTitlePartial", {
        count: selectedPlatformsCount,
        max: maxPlatforms,
      });
      description = t("companies.onboardingPlatformDescriptionPartial", {
        count: selectedPlatformsCount,
        plural:
          selectedPlatformsCount === 1
            ? t("companies.platformSelectionDescriptionPartialSingular")
            : t("companies.platformSelectionDescriptionPartialPlural"),
      });
      showRemainingCount = true;
    }
    buttonText = t("companies.selectPlatforms");
    buttonAction = onPlatformSelect;
  } else {
    // step === "add-company"
    title = t("companies.addCompanyStep2");
    description = t("companies.addCompanyStep2Description");
    buttonText = t("companies.addCompanyStep2Button");
    buttonAction = onAddCompany;
    showWarning = false;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: "rgba(13, 45, 83, 0.03)",
        border: "1px solid",
        borderColor: "rgba(13, 45, 83, 0.2)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={3}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <StepIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ color: "primary.main", mb: 0.5 }}
              >
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
          </Stack>

          {showRemainingCount && remainingPlatforms > 0 && (
            <Typography variant="body2" fontWeight={500}>
              {remainingPlatforms === 1
                ? t("companies.platformSelectionRemainingSingular", {
                    count: remainingPlatforms,
                  })
                : t("companies.platformSelectionRemainingPlural", {
                    count: remainingPlatforms,
                  })}
            </Typography>
          )}

          {showWarning && (
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "warning.main",
                "& .MuiAlert-message": {
                  width: "100%",
                },
              }}
            >
              <Typography variant="caption" fontWeight={500} color="text.primary">
                {t("companies.platformSelectionWarning")}
              </Typography>
            </Alert>
          )}
        </Stack>

        <Box sx={{ flexShrink: 0 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={step === "add-company" ? <AddIcon /> : undefined}
            onClick={buttonAction}
            sx={{
              fontWeight: 600,
              px: 4,
              py: 1.5,
              fontSize: "1rem",
              whiteSpace: "nowrap",
            }}
          >
            {buttonText}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};

