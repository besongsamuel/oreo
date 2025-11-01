import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { PlatformSelection } from "../../components/PlatformSelection";

export const CompleteSignup = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          setEmail(user.email || "");
        } else {
          // No user, redirect to login
          navigate("/auth/login");
        }
      } catch (err) {
        console.error("Error getting user:", err);
        navigate("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [navigate]);

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!userId) {
      setError("No authenticated user found");
      setLoading(false);
      return;
    }

    try {
      const profileData = {
        id: userId,
        email: email,
        full_name: fullName,
        company_name: companyName,
        role: "user",
      };

      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      // Update or insert profile
      if (existingProfile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            company_name: companyName,
          })
          .eq("id", userId);

        if (profileError) throw profileError;
      } else {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert(profileData);

        if (profileError) throw profileError;
      }

      // Move to platform selection step
      setProfileCompleted(true);
    } catch (err: any) {
      console.error("Error completing signup:", err);
      setError(err.message || "An error occurred while completing signup");
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSelectionComplete = () => {
    // Navigate to dashboard after platform selection
    navigate("/dashboard");
  };

  if (loading && !userId) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show platform selection after profile is completed
  if (profileCompleted && userId) {
    return (
      <PlatformSelection
        userId={userId}
        onComplete={handlePlatformSelectionComplete}
      />
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Complete Your Profile
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please provide some additional information to get started
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <form onSubmit={handleCompleteSignup}>
              <Stack spacing={2}>
                <TextField
                  label="Full Name"
                  fullWidth
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  autoComplete="name"
                  placeholder="John Doe"
                />

                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  helperText="This is your login email"
                />

                <TextField
                  label="Company Name"
                  fullWidth
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={loading}
                  placeholder="Acme Inc."
                  helperText="The company you're analyzing reviews for"
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? "Completing..." : "Continue"}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};
