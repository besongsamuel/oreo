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
import { useUser } from "../../context/UserContext";
import { useSupabase } from "../../hooks/useSupabase";

export const CompleteSignup = () => {
  const supabase = useSupabase();
  const { user, refreshProfile } = useUser();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Autofill email from user's auth email
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log("Complete Signup: Starting");
    console.log("User:", user);

    if (!user) {
      setError("No authenticated user found");
      setLoading(false);
      return;
    }

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Operation timed out after 10 seconds")), 10000);
    });

    try {
      const profileData = {
        id: user.id,
        email: email,
        full_name: fullName,
        company_name: companyName,
        role: "user",
      };

      console.log("Checking if profile exists...");
      
      // First, check if profile exists
      const { data: existingProfile, error: checkError } = await Promise.race([
        supabase.from("profiles").select("id").eq("id", user.id).maybeSingle(),
        timeoutPromise
      ]) as any;

      console.log("Profile check result:", { existingProfile, checkError });

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      let result;
      if (existingProfile) {
        console.log("Profile exists, updating...");
        // Profile exists, update it
        result = await Promise.race([
          supabase
            .from("profiles")
            .update({
              full_name: fullName,
              company_name: companyName,
            })
            .eq("id", user.id)
            .select(),
          timeoutPromise
        ]) as any;
      } else {
        console.log("Profile doesn't exist, inserting...");
        // Profile doesn't exist, insert it
        result = await Promise.race([
          supabase.from("profiles").insert(profileData).select(),
          timeoutPromise
        ]) as any;
      }

      const { data, error: profileError } = result;

      console.log("Profile operation result:", { data, error: profileError });

      if (profileError) {
        console.error("Profile error details:", {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
        });
        throw profileError;
      }

      console.log("Profile created/updated successfully");

      // Refresh the profile in context
      console.log("Refreshing profile in context...");
      await refreshProfile();

      console.log("Navigating to home...");
      // Small delay to ensure profile is loaded
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (err: any) {
      console.error("Error completing signup:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
      });
      setError(
        err.message ||
          err.details ||
          "An error occurred while completing signup. Please check the console for details."
      );
    } finally {
      setLoading(false);
    }
  };

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
                  {loading ? "Completing..." : "Complete Profile"}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};
