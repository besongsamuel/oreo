import { Box, Chip, Container, Paper, Stack, Typography } from "@mui/material";
import { useUser } from "./context/UserContext";

function App() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 8, textAlign: "center" }}>
          <Typography variant="h5">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h3" component="h1" gutterBottom>
              Reviews App
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body1">Status:</Typography>
              <Chip
                label="Connected to Supabase"
                color="success"
                size="small"
              />
            </Stack>

            <Box>
              <Typography variant="h6" gutterBottom>
                Authentication Status
              </Typography>
              {user ? (
                <Stack spacing={1}>
                  <Chip
                    label={`Logged in as: ${user.email}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    User ID: {user.id}
                  </Typography>
                </Stack>
              ) : (
                <Chip
                  label="Not logged in"
                  color="default"
                  variant="outlined"
                />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary">
              This app is integrated with Material UI theming and Supabase
              authentication.
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}

export default App;
