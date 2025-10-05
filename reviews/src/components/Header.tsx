import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export const Header = () => {
  const { user, profile, signOut } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              mr: 4,
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
              }}
            >
              <Box component="span" sx={{ color: "text.primary" }}>
                Aureanne
              </Box>
              <Box component="span" sx={{ color: "secondary.main" }}>
                Review
              </Box>
              <Box component="span" sx={{ color: "text.primary" }}>
                Tracker
              </Box>
            </Typography>
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
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
    </AppBar>
  );
};
