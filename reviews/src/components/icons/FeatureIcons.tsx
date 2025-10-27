import { SvgIcon, SvgIconProps } from "@mui/material";

export const ReviewsIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2z" />
    <path
      d="M17 11l-4 4-2-2"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="16"
      cy="16"
      r="3"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </SvgIcon>
);

export const AggregateIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <rect
      x="2"
      y="3"
      width="10"
      height="6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <rect
      x="2"
      y="13"
      width="10"
      height="6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <rect
      x="14"
      y="3"
      width="8"
      height="6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <rect
      x="14"
      y="13"
      width="8"
      height="6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M12 6h2M7 8h2M17 8h2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </SvgIcon>
);

export const KeywordsIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M3 7v10l5 4V7L3 7z" fill="currentColor" />
    <path d="M10 12l-2-2v4l2-2z" fill="currentColor" />
    <rect x="15" y="10" width="4" height="2" fill="currentColor" />
    <rect x="15" y="13" width="6" height="2" fill="currentColor" />
    <circle cx="12" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="6" r="1" fill="currentColor" />
  </SvgIcon>
);

export const SummaryIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path
      d="M5 3v18h14V3H5zm2 2h10v14H7V5z"
      fill="currentColor"
      opacity="0.3"
    />
    <path d="M9 8h8v2H9V8zm0 3h8v2H9v-2zm0 3h6v2H9v-2z" fill="currentColor" />
    <path
      d="M7 5v14M15 5h4M19 9v10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </SvgIcon>
);
