import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  AddLocation,
  Companies,
  Home,
  Pricing,
  PrivacyPolicy,
  TermsOfUse,
} from "./pages";
import { CompanyPage } from "./pages/CompanyPage";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { SuccessLocation } from "./pages/SuccessLocation";
import { CompleteSignup, ForgotPassword, Login, Signup } from "./pages/auth";
import { GoogleCallback } from "./pages/auth/GoogleCallback";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Protected routes with layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
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
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
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

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
