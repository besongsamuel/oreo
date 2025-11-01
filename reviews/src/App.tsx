import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./components/AdminRoute";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UserDetailView } from "./components/UserDetail";
import { UserContext } from "./context/UserContext";
import {
  AddLocation,
  AdminDashboard,
  Companies,
  Home,
  Pricing,
  PrivacyPolicy,
  TermsOfUse,
  TransferOwnership,
} from "./pages";
import { CompanyPage } from "./pages/CompanyPage";
// import { Dashboard } from "./pages/Dashboard";
import { PlatformSelectionSuccess } from "./pages/PlatformSelectionSuccess";
import { Profile } from "./pages/Profile";
import { SelectPlatforms } from "./pages/SelectPlatforms";
import { SubscriptionCancelled } from "./pages/SubscriptionCancelled";
import { SubscriptionSuccess } from "./pages/SubscriptionSuccess";
import { SuccessLocation } from "./pages/SuccessLocation";
import { CompleteSignup, ForgotPassword, Login, Signup } from "./pages/auth";
import { GoogleCallback } from "./pages/auth/GoogleCallback";

function AppContent() {
  const { i18n } = useTranslation();
  const context = useContext(UserContext);

  useEffect(() => {
    // Set language from profile or localStorage
    const profileLanguage = context?.profile?.preferred_language;
    const storedLanguage = localStorage.getItem("i18nextLng");

    if (profileLanguage && i18n.language !== profileLanguage) {
      i18n.changeLanguage(profileLanguage);
      localStorage.setItem("i18nextLng", profileLanguage);
    } else if (storedLanguage && i18n.language !== storedLanguage) {
      i18n.changeLanguage(storedLanguage);
    } else if (!profileLanguage && !storedLanguage && i18n.language !== "fr") {
      // Default to French
      i18n.changeLanguage("fr");
      localStorage.setItem("i18nextLng", "fr");
    }
  }, [context?.profile?.preferred_language, i18n]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - accessible to all, including logged-in users */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/pricing"
          element={
            <Layout>
              <Pricing />
            </Layout>
          }
        />

        {/* Protected routes with layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Companies />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <Layout>
                <Companies />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies/:companyId"
          element={
            <ProtectedRoute>
              <Layout>
                <CompanyPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies/:companyId/locations/new"
          element={
            <ProtectedRoute>
              <Layout>
                <AddLocation />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies/:companyId/locations/success"
          element={
            <ProtectedRoute>
              <Layout>
                <SuccessLocation />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies/:companyId/transfer-ownership"
          element={
            <ProtectedRoute>
              <Layout>
                <TransferOwnership />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/select-platforms"
          element={
            <ProtectedRoute>
              <Layout>
                <SelectPlatforms />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/select-platforms/success"
          element={
            <ProtectedRoute>
              <Layout>
                <PlatformSelectionSuccess />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription/success"
          element={
            <ProtectedRoute>
              <Layout>
                <SubscriptionSuccess />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription/cancelled"
          element={
            <ProtectedRoute>
              <Layout>
                <SubscriptionCancelled />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Auth routes (no layout) */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/complete-signup" element={<CompleteSignup />} />
        <Route path="/google-callback" element={<GoogleCallback />} />

        {/* Public legal pages (with layout) */}
        <Route
          path="/privacy-policy"
          element={
            <Layout>
              <PrivacyPolicy />
            </Layout>
          }
        />
        <Route
          path="/terms-of-use"
          element={
            <Layout>
              <TermsOfUse />
            </Layout>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/:userId"
          element={
            <AdminRoute>
              <Layout>
                <UserDetailView />
              </Layout>
            </AdminRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return <AppContent />;
}

export default App;
