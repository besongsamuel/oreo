import { Box, SvgIcon, SvgIconProps } from "@mui/material";

// Empty state illustration - Target/Goal icon
export const EmptyObjectiveIllustration = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 200 200" sx={{ fontSize: 120 }}>
    <defs>
      <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e3f2fd" />
        <stop offset="100%" stopColor="#bbdefb" />
      </linearGradient>
    </defs>
    {/* Target circle */}
    <circle cx="100" cy="100" r="80" fill="url(#emptyGradient)" opacity="0.3" />
    <circle cx="100" cy="100" r="60" fill="none" stroke="#2196f3" strokeWidth="2" opacity="0.5" />
    <circle cx="100" cy="100" r="40" fill="none" stroke="#2196f3" strokeWidth="2" opacity="0.5" />
    <circle cx="100" cy="100" r="20" fill="#2196f3" opacity="0.3" />
    {/* Arrow pointing up */}
    <path
      d="M 100 60 L 90 80 L 95 80 L 95 100 L 105 100 L 105 80 L 110 80 Z"
      fill="#2196f3"
      opacity="0.6"
    />
  </SvgIcon>
);

// No reviews illustration - Chart/Data icon
export const NoReviewsIllustration = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 200 200" sx={{ fontSize: 120 }}>
    <defs>
      <linearGradient id="noReviewsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff3e0" />
        <stop offset="100%" stopColor="#ffe0b2" />
      </linearGradient>
    </defs>
    {/* Chart bars */}
    <rect x="40" y="120" width="20" height="40" fill="url(#noReviewsGradient)" rx="2" />
    <rect x="70" y="100" width="20" height="60" fill="url(#noReviewsGradient)" rx="2" />
    <rect x="100" y="80" width="20" height="80" fill="url(#noReviewsGradient)" rx="2" />
    <rect x="130" y="110" width="20" height="50" fill="url(#noReviewsGradient)" rx="2" />
    {/* Chart line */}
    <path
      d="M 50 120 L 80 100 L 110 80 L 140 110"
      fill="none"
      stroke="#ff9800"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.5"
    />
    {/* Question mark */}
    <circle cx="160" cy="50" r="15" fill="#ff9800" opacity="0.2" />
    <text
      x="160"
      y="58"
      textAnchor="middle"
      fontSize="20"
      fill="#ff9800"
      fontWeight="bold"
      opacity="0.6"
    >
      ?
    </text>
  </SvgIcon>
);

// Success/Progress illustration - Checkmark with progress
export const ProgressIllustration = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 200 200" sx={{ fontSize: 80 }}>
    <defs>
      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c8e6c9" />
        <stop offset="100%" stopColor="#81c784" />
      </linearGradient>
    </defs>
    {/* Progress circle */}
    <circle
      cx="100"
      cy="100"
      r="70"
      fill="none"
      stroke="#e0e0e0"
      strokeWidth="8"
    />
    <circle
      cx="100"
      cy="100"
      r="70"
      fill="none"
      stroke="url(#progressGradient)"
      strokeWidth="8"
      strokeDasharray={`${2 * Math.PI * 70 * 0.75} ${2 * Math.PI * 70}`}
      strokeDashoffset={2 * Math.PI * 70 * 0.25}
      transform="rotate(-90 100 100)"
    />
    {/* Checkmark */}
    <path
      d="M 70 100 L 90 120 L 130 80"
      fill="none"
      stroke="#4caf50"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

// Section divider illustration - Decorative line with icon
export const SectionDivider = ({ icon }: { icon?: React.ReactNode }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      my: 2,
      "&::before, &::after": {
        content: '""',
        flex: 1,
        height: "1px",
        bgcolor: "divider",
      },
    }}
  >
    {icon && (
      <Box sx={{ mx: 2, color: "text.secondary", opacity: 0.5 }}>
        {icon}
      </Box>
    )}
  </Box>
);

