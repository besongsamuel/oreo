import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useUser } from "../hooks/useUser";

export const Home = () => {
  const { user, profile, signOut } = useUser();

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
                Profile Information
              </Typography>
              {user ? (
                <Stack spacing={2}>
                  {profile?.full_name && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">
                        {profile.full_name}
                      </Typography>
                    </Box>
                  )}

                  {profile?.company_name && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Company
                      </Typography>
                      <Typography variant="body1">
                        {profile.company_name}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{user.email}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Role
                    </Typography>
                    <Chip
                      label={profile?.role || "user"}
                      size="small"
                      color="primary"
                    />
                  </Box>

                  <Box sx={{ pt: 1 }}>
                    <Button variant="outlined" color="error" onClick={signOut}>
                      Sign Out
                    </Button>
                  </Box>
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
};
