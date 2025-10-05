import { createTheme } from "@mui/material/styles";

// Apple-inspired minimalist theme
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#000000",
      light: "#2c2c2c",
      dark: "#000000",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0071e3",
      light: "#4da6ff",
      dark: "#0051a3",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ff3b30",
    },
    warning: {
      main: "#ff9500",
    },
    info: {
      main: "#0071e3",
    },
    success: {
      main: "#34c759",
    },
    background: {
      default: "#f5f5f7",
      paper: "#ffffff",
    },
    text: {
      primary: "#1d1d1f",
      secondary: "#6e6e73",
    },
    divider: "rgba(0, 0, 0, 0.08)",
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "SF Pro Display",
      "SF Pro Text",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "3rem",
      fontWeight: 700,
      letterSpacing: "-0.015em",
      color: "#1d1d1f",
    },
    h2: {
      fontSize: "2.5rem",
      fontWeight: 700,
      letterSpacing: "-0.015em",
      color: "#1d1d1f",
    },
    h3: {
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      color: "#1d1d1f",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
      color: "#1d1d1f",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      letterSpacing: "-0.005em",
      color: "#1d1d1f",
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: 600,
      letterSpacing: "0em",
      color: "#1d1d1f",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
      letterSpacing: "0.004em",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      letterSpacing: "0.004em",
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: "980px",
          padding: "10px 24px",
          fontSize: "1rem",
          letterSpacing: "0.004em",
          boxShadow: "none",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: "none",
            transform: "scale(0.98)",
          },
        },
        contained: {
          backgroundColor: "#0071e3",
          "&:hover": {
            backgroundColor: "#0051a3",
          },
        },
        outlined: {
          borderColor: "#d2d2d7",
          color: "#0071e3",
          "&:hover": {
            borderColor: "#0071e3",
            backgroundColor: "rgba(0, 113, 227, 0.04)",
          },
        },
        text: {
          color: "#0071e3",
          "&:hover": {
            backgroundColor: "rgba(0, 113, 227, 0.04)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "18px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "18px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        },
        elevation1: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        },
        elevation2: {
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 1px 0 rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          fontWeight: 500,
          letterSpacing: "0.004em",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            backgroundColor: "#ffffff",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#0071e3",
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0071e3",
        },
      },
    },
  },
});
