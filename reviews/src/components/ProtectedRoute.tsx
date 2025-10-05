import { Box, CircularProgress, Container } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, hasProfile } = useUser();
  const location = useLocation();

  if (loading) {
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
    return <Navigate to="/auth/login" replace />;
  }

  // If user doesn't have a profile and not already on complete-signup page
  if (!hasProfile && location.pathname !== "/auth/complete-signup") {
    return <Navigate to="/auth/complete-signup" replace />;
  }

  return <>{children}</>;
};
