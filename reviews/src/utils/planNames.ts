export const getFormattedPlanName = (
  planName?: string | null,
  fallbackName?: string | null,
  translate?: (key: string) => string,
) => {
  if (planName === "pro") {
    return translate ? translate("pricing.standardPlanName") : "Standard";
  }

  if (planName === "enterprise") {
    return translate
      ? translate("pricing.professionalPlanName")
      : "Professional";
  }

  return fallbackName ?? planName ?? "";
};
