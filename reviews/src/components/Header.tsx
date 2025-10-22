import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Avatar,
  Box,
  Button,
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
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";
import { useUser } from "../hooks/useUser";

export const Header = () => {
  const { user, signOut } = useUser();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    await signOut();
    navigate("/auth/login");
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
            onClick={() => navigate("/dashboard")}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "baseline",
                gap: 0.5,
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              <Box component="span" sx={{ color: "text.primary" }}>
                Boresha
              </Box>
              <Box
                component="span"
                sx={{
                  color: "secondary.main",
                  display: { xs: "none", sm: "inline" },
                }}
              >
                Review
              </Box>
              <Box
                component="span"
                sx={{
                  color: "text.primary",
                  display: { xs: "none", sm: "inline" },
                }}
              >
                Tracker
              </Box>
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            <Button
              onClick={() => navigate("/dashboard")}
              color="inherit"
              sx={{
                color: isActive("/dashboard")
                  ? "text.primary"
                  : "text.secondary",
                fontWeight: isActive("/dashboard") ? 600 : 400,
                fontSize: "0.875rem",
                px: 2,
                minWidth: "auto",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              Dashboard
            </Button>
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
              Companies
            </Button>
          </Box>

          {/* User Avatar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                  {profile?.full_name || "User"}
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
                <Typography variant="body2">Profile</Typography>
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
                <Typography variant="body2">Sign Out</Typography>
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
            Menu
          </Typography>
          <List>
            <ListItemButton
              selected={isActive("/dashboard")}
              onClick={() => {
                navigate("/dashboard");
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <ListItemText primary="Dashboard" />
            </ListItemButton>
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
              <ListItemText primary="Companies" />
            </ListItemButton>
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
              <ListItemText primary="Profile" />
            </ListItemButton>
            <ListItemButton
              onClick={async () => {
                setMobileMenuOpen(false);
                await signOut();
                navigate("/auth/login");
              }}
              sx={{
                borderRadius: 1,
              }}
            >
              <LogoutIcon sx={{ mr: 2 }} fontSize="small" />
              <ListItemText primary="Sign Out" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};
