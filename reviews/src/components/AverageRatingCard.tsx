import { Star as StarIcon } from "@mui/icons-material";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface AverageRatingCardProps {
  averageRating: number;
  totalReviews: number;
}

export const AverageRatingCard = ({
  averageRating,
  totalReviews,
}: AverageRatingCardProps) => {
  const { t } = useTranslation();

  const getRatingMessage = (rating: number): {
    message: string;
    color: string;
    severity: "error" | "warning" | "info" | "success";
  } => {
    if (rating < 2) {
      return {
        message: t("companyPage.ratingMessage.critical", {
          defaultValue:
            "Your rating needs immediate attention. Focus on addressing customer concerns and improving service quality. Every improvement counts!",
        }),
        color: "error.main",
        severity: "error",
      };
    } else if (rating >= 2 && rating < 3) {
      return {
        message: t("companyPage.ratingMessage.low", {
          defaultValue:
            "There's significant room for improvement. Review negative feedback and implement changes. You're on the right track to better ratings!",
        }),
        color: "error.main",
        severity: "error",
      };
    } else if (rating >= 3 && rating < 4.3) {
      return {
        message: t("companyPage.ratingMessage.good", {
          defaultValue:
            "You're doing well! Keep focusing on customer satisfaction and addressing feedback. Small improvements can push you to excellent ratings!",
        }),
        color: "warning.main",
        severity: "warning",
      };
    } else if (rating >= 4.3 && rating < 4.7) {
      return {
        message: t("companyPage.ratingMessage.veryGood", {
          defaultValue:
            "Excellent work! You're close to outstanding. Continue maintaining high standards and responding to customer feedback to reach the top!",
        }),
        color: "info.main",
        severity: "info",
      };
    } else {
      // rating >= 4.7
      return {
        message: t("companyPage.ratingMessage.excellent", {
          defaultValue:
            "Outstanding! You're delivering exceptional customer experiences. Keep up the excellent work and maintain these high standards!",
        }),
        color: "success.main",
        severity: "success",
      };
    }
  };

  const ratingInfo = getRatingMessage(averageRating);

  return (
    <Card
      sx={{
        borderRadius: "18px",
        boxShadow: 2,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Stack spacing={2} alignItems="center" sx={{ textAlign: "center" }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("companyPage.averageRating")}
            </Typography>
            {/* Single line for rating - highlighted and centered */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={{
                flexWrap: "nowrap",
              }}
            >
              <Typography
                variant="h2"
                fontWeight={700}
                sx={{
                  color: "warning.main",
                  lineHeight: 1.2,
                  fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" },
                }}
              >
                {averageRating.toFixed(1)}
              </Typography>
              <StarIcon
                sx={{
                  color: "warning.main",
                  fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" },
                  flexShrink: 0,
                }}
              />
            </Stack>
          </Box>

          {/* Rating Message */}
          {totalReviews > 0 && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: `${ratingInfo.color}08`,
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: ratingInfo.color,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  fontSize: { xs: "0.95rem", sm: "1rem", md: "1.05rem" },
                }}
              >
                {ratingInfo.message}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

