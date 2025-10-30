import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { ProtectedRoute } from "./ProtectedRoute";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const context = useContext(UserContext);
  const isAdmin = context?.isAdmin;

  // First check if user is authenticated
  if (!context?.user || !context?.profile) {
    return <Navigate to="/auth/login" replace />;
  }

  // Then check if user is admin
  if (!isAdmin?.()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

