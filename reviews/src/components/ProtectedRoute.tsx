import { Box, CircularProgress, Container } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { user, hasProfile, loading } = useUser();

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

  if (!hasProfile && location.pathname !== "/auth/complete-signup") {
    return <Navigate to="/auth/complete-signup" replace />;
  }

  return <>{children}</>;
};
