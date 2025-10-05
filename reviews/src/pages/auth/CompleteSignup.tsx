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

    if (!user) {
      setError("No authenticated user found");
      setLoading(false);
      return;
    }

    try {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        email: email,
        full_name: fullName,
        company_name: companyName,
        role: "user",
      });

      if (profileError) throw profileError;

      // Refresh the profile in context
      await refreshProfile();

      // Redirect to home page
      navigate("/");
    } catch (err: any) {
      console.error("Error completing signup:", err);
      setError(err.message || "An error occurred while completing signup");
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
