import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { ProfileSectionSkeleton } from "../components/SkeletonLoaders";
import { useProfile } from "../hooks/useProfile";
import { useSupabase } from "../hooks/useSupabase";
import { useUser } from "../hooks/useUser";

export const Profile = () => {
  const { user } = useUser();
  const { profile, refreshProfile } = useProfile();
  const supabase = useSupabase();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Show skeleton if profile is not yet loaded
  if (!user || !profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Profile Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Loading your profile...
            </Typography>
          </Box>
          <ProfileSectionSkeleton />
          <ProfileSectionSkeleton />
        </Stack>
      </Container>
    );
  }

  const handleEdit = () => {
    setFullName(profile?.full_name || "");
    setCompanyName(profile?.company_name || "");
    setIsEditing(true);
    setError(null);
    setSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          company_name: companyName,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess(true);
      setIsEditing(false);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Profile Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your account information and preferences
          </Typography>
        </Box>

        {error && (
          <Paper sx={{ p: 2, bgcolor: "error.light", color: "error.dark" }}>
            <Typography variant="body2">{error}</Typography>
          </Paper>
        )}

        {success && (
          <Paper sx={{ p: 2, bgcolor: "success.light", color: "success.dark" }}>
            <Typography variant="body2">
              Profile updated successfully!
            </Typography>
          </Paper>
        )}

        <Card elevation={2}>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Divider />
              </Box>

              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                  >
                    Full Name
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1">
                      {profile?.full_name || "Not set"}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                  >
                    Email
                  </Typography>
                  <Typography variant="body1">{user?.email}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Email cannot be changed
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                  >
                    Company Name
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loading}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1">
                      {profile?.company_name || "Not set"}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                  >
                    Role
                  </Typography>
                  <Chip
                    label={profile?.role || "user"}
                    size="small"
                    color="primary"
                  />
                </Box>
              </Stack>

              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                {isEditing ? (
                  <>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button variant="contained" onClick={handleEdit}>
                    Edit Profile
                  </Button>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Account Details
                </Typography>
                <Divider />
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  User ID
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="monospace"
                  sx={{ wordBreak: "break-all" }}
                >
                  {user?.id}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Account Created
                </Typography>
                <Typography variant="body2">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Unknown"}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};
