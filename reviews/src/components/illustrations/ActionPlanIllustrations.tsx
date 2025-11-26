import { SvgIcon, SvgIconProps } from "@mui/material";

// Empty state illustration - Checklist/Assignment icon
export const EmptyActionPlanIllustration = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 200 200" sx={{ fontSize: 120 }}>
    <defs>
      <linearGradient id="emptyActionPlanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f3e5f5" />
        <stop offset="100%" stopColor="#e1bee7" />
      </linearGradient>
    </defs>
    {/* Clipboard/Notepad background */}
    <rect
      x="40"
      y="50"
      width="120"
      height="130"
      rx="4"
      fill="url(#emptyActionPlanGradient)"
      opacity="0.3"
    />
    <rect
      x="45"
      y="55"
      width="110"
      height="120"
      rx="2"
      fill="none"
      stroke="#9c27b0"
      strokeWidth="2"
      opacity="0.4"
    />
    
    {/* Checklist lines */}
    <line
      x1="60"
      y1="80"
      x2="140"
      y2="80"
      stroke="#9c27b0"
      strokeWidth="2"
      opacity="0.3"
    />
    <line
      x1="60"
      y1="110"
      x2="140"
      y2="110"
      stroke="#9c27b0"
      strokeWidth="2"
      opacity="0.3"
    />
    <line
      x1="60"
      y1="140"
      x2="140"
      y2="140"
      stroke="#9c27b0"
      strokeWidth="2"
      opacity="0.3"
    />
    
    {/* Checkbox circles */}
    <circle cx="65" cy="80" r="4" fill="none" stroke="#9c27b0" strokeWidth="1.5" opacity="0.5" />
    <circle cx="65" cy="110" r="4" fill="none" stroke="#9c27b0" strokeWidth="1.5" opacity="0.5" />
    <circle cx="65" cy="140" r="4" fill="none" stroke="#9c27b0" strokeWidth="1.5" opacity="0.5" />
    
    {/* Clipboard clip */}
    <path
      d="M 75 50 Q 85 45 95 50 L 95 65 Q 85 70 75 65 Z"
      fill="#9c27b0"
      opacity="0.4"
    />
    
    {/* Sparkle/Star accents */}
    <path
      d="M 160 60 L 162 66 L 168 66 L 163 70 L 165 76 L 160 72 L 155 76 L 157 70 L 152 66 L 158 66 Z"
      fill="#9c27b0"
      opacity="0.3"
    />
    <path
      d="M 35 130 L 36 133 L 39 133 L 37 135 L 38 138 L 35 136 L 32 138 L 33 135 L 31 133 L 34 133 Z"
      fill="#9c27b0"
      opacity="0.3"
    />
  </SvgIcon>
);

