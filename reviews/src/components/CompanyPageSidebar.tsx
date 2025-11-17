import {
  Analytics as AnalyticsIcon,
  Dashboard as OverviewIcon,
  LocationOn as LocationOnIcon,
  RateReview as ReviewsIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";

export type CompanyPageSection =
  | "overview"
  | "reviews"
  | "analytics"
  | "locations"
  | "settings";

interface CompanyPageSidebarProps {
  activeSection: CompanyPageSection;
  onSectionChange: (section: CompanyPageSection) => void;
  isAdmin?: boolean;
}

interface NavigationItem {
  id: CompanyPageSection;
  labelKey: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

export const CompanyPageSidebar = ({
  activeSection,
  onSectionChange,
  isAdmin = false,
}: CompanyPageSidebarProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const navigationItems: NavigationItem[] = [
    {
      id: "overview",
      labelKey: "companyPage.sidebar.overview",
      icon: <OverviewIcon />,
    },
    {
      id: "analytics",
      labelKey: "companyPage.sidebar.analytics",
      icon: <AnalyticsIcon />,
    },
    {
      id: "reviews",
      labelKey: "companyPage.sidebar.reviews",
      icon: <ReviewsIcon />,
    },
    {
      id: "locations",
      labelKey: "companyPage.sidebar.locations",
      icon: <LocationOnIcon />,
    },
    ...(isAdmin
      ? [
          {
            id: "settings" as CompanyPageSection,
            labelKey: "companyPage.sidebar.settings",
            icon: <SettingsIcon />,
            adminOnly: true,
          },
        ]
      : []),
  ];

  // Mobile: horizontal bottom navigation
  if (isMobile) {
    return (
      <Paper
        elevation={2}
        sx={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderRadius: 0,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            overflowX: "auto",
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
          }}
        >
          {navigationItems.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              selected={activeSection === item.id}
              sx={{
                flexDirection: "column",
                minWidth: 80,
                py: 1.5,
                px: 1,
                "&.Mui-selected": {
                  bgcolor: "transparent",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                },
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "auto",
                  color: activeSection === item.id ? "primary.main" : "inherit",
                  mb: 0.5,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={t(item.labelKey)}
                primaryTypographyProps={{
                  variant: "caption",
                  sx: {
                    fontSize: "0.7rem",
                    textAlign: "center",
                    fontWeight: activeSection === item.id ? 600 : 400,
                  },
                }}
              />
            </ListItemButton>
          ))}
        </Box>
      </Paper>
    );
  }

  // Desktop/Tablet: vertical sidebar
  return (
    <Paper
      elevation={0}
      sx={{
        position: "sticky",
        top: (theme) => theme.spacing(11), // 88px - accounts for header (64px) + padding (16px) + spacing (8px)
        alignSelf: "flex-start",
        width: { xs: 240, md: 280 },
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        overflow: "hidden",
        maxHeight: (theme) => `calc(100vh - ${theme.spacing(11)})`,
      }}
    >
      <List
        component="nav"
        sx={{
          p: 0,
          "& .MuiListItemButton-root": {
            px: 3,
            py: 1.5,
            borderRadius: 0,
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              bgcolor: "action.hover",
            },
            "&.Mui-selected": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": {
                bgcolor: "primary.dark",
              },
              "& .MuiListItemIcon-root": {
                color: "primary.contrastText",
              },
              "& .MuiListItemText-primary": {
                fontWeight: 600,
              },
            },
          },
        }}
      >
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            selected={activeSection === item.id}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: activeSection === item.id ? "inherit" : "text.secondary",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={t(item.labelKey)}
              primaryTypographyProps={{
                variant: "body2",
                sx: {
                  fontWeight: activeSection === item.id ? 600 : 400,
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
};

