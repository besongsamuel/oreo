import { Box, CircularProgress, Container } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../hooks/useUser";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { user, hasProfile, loading } = useUser();

  console.log("ProtectedRoute: Render", {
    loading,
    user: !!user,
    hasProfile,
    pathname: location.pathname,
  });

  if (loading) {
    console.log("ProtectedRoute: Showing loading screen");
    return (
      <Container>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to login");
    return <Navigate to="/auth/login" replace />;
  }

  if (!hasProfile && location.pathname !== "/auth/complete-signup") {
    console.log("ProtectedRoute: No profile, redirecting to complete-signup");
    return <Navigate to="/auth/complete-signup" replace />;
  }

  console.log("ProtectedRoute: Rendering children");
  return <>{children}</>;
};
