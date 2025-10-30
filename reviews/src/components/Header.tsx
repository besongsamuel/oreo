import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LanguageIcon from "@mui/icons-material/Language";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export const Header = () => {
  const { t, i18n } = useTranslation();
  const context = useContext(UserContext);
  const user = context?.user;
  const profile = context?.profile;
  const signOut = context?.signOut;
  const updateLanguage = context?.updateLanguage;
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageAnchor, setLanguageAnchor] = useState<null | HTMLElement>(
    null
  );

  const isActive = (path: string) => location.pathname === path;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate("/profile");
  };

  const handleSignOut = async () => {
    handleMenuClose();
    if (signOut) {
      await signOut();
    }
    navigate("/");
  };

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchor(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchor(null);
  };

  const handleLanguageChange = async (language: string) => {
    handleLanguageClose();

    // Update i18next language
    i18n.changeLanguage(language);
    localStorage.setItem("i18nextLng", language);

    // Update profile if user is logged in
    if (updateLanguage && user) {
      await updateLanguage(language);
    }
  };

  return (
    <AppBar position="sticky" elevation={0} color="default">
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: "64px", py: 1 }}>
          {/* Mobile Menu Button */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setMobileMenuOpen(true)}
            sx={{ mr: 2, display: { xs: "flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              mr: { xs: 0, md: 4 },
              flexGrow: { xs: 1, md: 0 },
            }}
            onClick={() => navigate("/companies")}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                letterSpacing: "-0.01em",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              <Box component="span" sx={{ color: "#0071e3" }}>
                B
              </Box>
              <Box component="span" sx={{ color: "text.primary" }}>
                oresha
              </Box>
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {user && (
            <Box
              sx={{
                flexGrow: 1,
                display: { xs: "none", md: "flex" },
                justifyContent: "center",
                gap: 0.5,
              }}
            >
              <Button
                onClick={() => navigate("/companies")}
                color="inherit"
                sx={{
                  color: isActive("/companies")
                    ? "text.primary"
                    : "text.secondary",
                  fontWeight: isActive("/companies") ? 600 : 400,
                  fontSize: "0.875rem",
                  px: 2,
                  minWidth: "auto",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                {t("common.companies")}
              </Button>
              {profile?.role === "admin" && (
                <Button
                  onClick={() => navigate("/admin/dashboard")}
                  color="inherit"
                  sx={{
                    color: isActive("/admin/dashboard")
                      ? "text.primary"
                      : "text.secondary",
                    fontWeight: isActive("/admin/dashboard") ? 600 : 400,
                    fontSize: "0.875rem",
                    px: 2,
                    minWidth: "auto",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  Admin
                </Button>
              )}
            </Box>
          )}

          {/* User Avatar or Login Button */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Language Switcher */}
            <IconButton
              size="small"
              onClick={handleLanguageClick}
              color="inherit"
              sx={{
                p: 1,
              }}
              title={t("common.language")}
            >
              <LanguageIcon fontSize="small" />
            </IconButton>

            {/* Language Menu */}
            <Menu
              anchorEl={languageAnchor}
              open={Boolean(languageAnchor)}
              onClose={handleLanguageClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem
                onClick={() => handleLanguageChange("en")}
                selected={i18n.language === "en"}
              >
                <Typography variant="body2">{t("common.english")}</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => handleLanguageChange("fr")}
                selected={i18n.language === "fr"}
              >
                <Typography variant="body2">{t("common.french")}</Typography>
              </MenuItem>
            </Menu>

            {user ? (
              <>
                {/* Subscription Tier Badge */}
                {profile?.subscription_tier && (
                  <Chip
                    label={
                      profile.subscription_tier === "paid"
                        ? t("header.pro")
                        : t("header.free")
                    }
                    size="small"
                    color={
                      profile.subscription_tier === "paid"
                        ? "success"
                        : "default"
                    }
                    variant="outlined"
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  />
                )}

                {/* Admin Role Badge */}
                {profile?.role === "admin" && (
                  <Chip
                    label={t("header.admin")}
                    size="small"
                    color="primary"
                    variant="filled"
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  />
                )}

                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  color="inherit"
                  sx={{
                    p: 0,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "secondary.main",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    {profile?.full_name?.charAt(0)?.toUpperCase() ||
                      user?.email?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </IconButton>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={() => navigate("/auth/login")}
                sx={{
                  borderRadius: 980,
                  px: 3,
                  py: 0.75,
                  textTransform: "none",
                  fontSize: "0.875rem",
                }}
              >
                {t("common.login")}
              </Button>
            )}

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              sx={{
                mt: 1.5,
                "& .MuiPaper-root": {
                  borderRadius: "12px",
                  minWidth: 200,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                },
              }}
            >
              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  {profile?.full_name || t("common.name")}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.75rem" }}
                >
                  {user?.email}
                </Typography>
              </Box>

              <Divider />

              <MenuItem
                onClick={handleProfileClick}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <AccountCircleIcon
                  sx={{ mr: 2, fontSize: "1.25rem" }}
                  color="action"
                />
                <Typography variant="body2">{t("common.profile")}</Typography>
              </MenuItem>

              <MenuItem
                onClick={handleSignOut}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <LogoutIcon
                  sx={{ mr: 2, fontSize: "1.25rem" }}
                  color="action"
                />
                <Typography variant="body2">{t("common.signOut")}</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: 250,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t("header.menu")}
          </Typography>
          <List>
            {/* Dashboard link removed */}
            <ListItemButton
              selected={isActive("/companies")}
              onClick={() => {
                navigate("/companies");
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <ListItemText primary={t("common.companies")} />
            </ListItemButton>
            {profile?.role === "admin" && (
              <ListItemButton
                selected={isActive("/admin/dashboard")}
                onClick={() => {
                  navigate("/admin/dashboard");
                  setMobileMenuOpen(false);
                }}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemText primary="Admin" />
              </ListItemButton>
            )}
            <Divider sx={{ my: 2 }} />
            <ListItemButton
              onClick={() => {
                navigate("/profile");
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <AccountCircleIcon sx={{ mr: 2 }} fontSize="small" />
              <ListItemText primary={t("common.profile")} />
            </ListItemButton>
            <ListItemButton
              onClick={async () => {
                setMobileMenuOpen(false);
                if (signOut) {
                  await signOut();
                }
                navigate("/");
              }}
              sx={{
                borderRadius: 1,
              }}
            >
              <LogoutIcon sx={{ mr: 2 }} fontSize="small" />
              <ListItemText primary={t("common.signOut")} />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};
