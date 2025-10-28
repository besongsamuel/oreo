import {
  Business as BusinessIcon,
  CameraAlt as CameraIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { useSupabase } from "../hooks/useSupabase";

interface CompanyDetails {
  id: string;
  name: string;
  industry: string;
  description?: string;
  website?: string;
  created_at: string;
  total_reviews: number;
  average_rating: number;
  positive_reviews: number;
  negative_reviews: number;
  neutral_reviews: number;
  total_locations: number;
  logo_url?: string;
}

interface CompanyHeaderProps {
  company: CompanyDetails;
  onLogoUpdate?: (logoUrl: string) => void;
  onCompanyUpdate?: () => void;
}

export const CompanyHeader = ({
  company,
  onLogoUpdate,
  onCompanyUpdate,
}: CompanyHeaderProps) => {
  const supabase = useSupabase();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: company.name,
    industry: company.industry,
    description: company.description || "",
    website: company.website || "",
  });

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleEditClick = () => {
    setFormData({
      name: company.name,
      industry: company.industry,
      description: company.description || "",
      website: company.website || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
  };

  const handleFormSubmit = async () => {
    setEditing(true);

    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: formData.name,
          industry: formData.industry,
          description: formData.description || null,
          website: formData.website || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", company.id);

      if (error) throw error;

      // Notify parent to refresh
      if (onCompanyUpdate) {
        onCompanyUpdate();
      }

      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating company:", error);
      alert("Failed to update company details. Please try again.");
    } finally {
      setEditing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Get file extension
      const fileExt = file.name.split(".").pop();
      const fileName = `${company.id}/logo.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("company_logo")
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("company_logo")
        .getPublicUrl(fileName);

      const logoUrl = data.publicUrl;

      // Update company record
      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: logoUrl })
        .eq("id", company.id);

      if (updateError) throw updateError;

      // Notify parent component
      if (onLogoUpdate) {
        onLogoUpdate(logoUrl);
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Stack direction="row" spacing={{ xs: 2, sm: 3 }} alignItems="flex-start">
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Upload button outside the square */}
          <IconButton
            size="small"
            sx={{
              bgcolor: "primary.main",
              color: "white",
              width: 32,
              height: 32,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
            onClick={handleLogoClick}
          >
            <CameraIcon />
          </IconButton>

          {/* Square logo container */}
          <Box
            sx={{
              width: { xs: 80, sm: 100, md: 120 },
              height: { xs: 80, sm: 100, md: 120 },
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: company.logo_url ? "transparent" : "secondary.main",
              cursor: "pointer",
              position: "relative",
              "&:hover": {
                opacity: 0.9,
              },
            }}
            onClick={handleLogoClick}
          >
            {company.logo_url ? (
              <Box
                component="img"
                src={company.logo_url}
                alt={`${company.name} logo`}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  p: 1,
                }}
              />
            ) : (
              <BusinessIcon sx={{ fontSize: { xs: 40, sm: 50, md: 60 } }} />
            )}
            {uploading && (
              <LinearProgress
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                }}
              />
            )}
          </Box>
        </Stack>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontSize: { xs: "1.5rem", sm: "2rem", md: "3rem" } }}
            >
              {company.name}
            </Typography>
            <IconButton
              size="small"
              onClick={handleEditClick}
              sx={{ color: "primary.main" }}
            >
              <EditIcon />
            </IconButton>
          </Stack>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            {company.industry && (
              <Chip label={company.industry} variant="outlined" />
            )}
            <Typography variant="body2" color="text.secondary">
              {company.total_locations} location
              {company.total_locations !== 1 ? "s" : ""}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Member since {new Date(company.created_at).toLocaleDateString()}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {/* Edit Company Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Company Details</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Company Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <TextField
              label="Industry"
              fullWidth
              value={formData.industry}
              onChange={(e) =>
                setFormData({ ...formData, industry: e.target.value })
              }
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <TextField
              label="Website"
              fullWidth
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={editing}>
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={editing || !formData.name}
          >
            {editing ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
