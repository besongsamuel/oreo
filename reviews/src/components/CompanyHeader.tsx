import {
  Business as BusinessIcon,
  CameraAlt as CameraIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { useSupabase } from "../hooks/useSupabase";

interface CompanyDetails {
  id: string;
  name: string;
  industry: string;
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
}

export const CompanyHeader = ({
  company,
  onLogoUpdate,
}: CompanyHeaderProps) => {
  const supabase = useSupabase();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
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
        <Box sx={{ position: "relative" }}>
          <Avatar
            src={company.logo_url}
            sx={{
              bgcolor: "secondary.main",
              width: { xs: 48, sm: 56, md: 72 },
              height: { xs: 48, sm: 56, md: 72 },
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8,
              },
            }}
            onClick={handleLogoClick}
          >
            {!company.logo_url && (
              <BusinessIcon sx={{ fontSize: { xs: 24, sm: 32, md: 40 } }} />
            )}
          </Avatar>
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <IconButton
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              bgcolor: "primary.main",
              color: "white",
              width: 24,
              height: 24,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
            onClick={handleLogoClick}
          >
            <CameraIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontSize: { xs: "1.5rem", sm: "2rem", md: "3rem" } }}
          >
            {company.name}
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <Chip label={company.industry} variant="outlined" />
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
    </Paper>
  );
};
