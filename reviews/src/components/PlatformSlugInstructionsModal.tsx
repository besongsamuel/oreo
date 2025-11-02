import { Close as CloseIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { slugFormatPerNetwork } from "../utils/slugFormatPerNetwork";

interface PlatformSlugInstructionsModalProps {
  open: boolean;
  onClose: () => void;
  platformName: string;
  platformSlug: string; // The platform slug/key (e.g., "facebook", "google")
}

export const PlatformSlugInstructionsModal = ({
  open,
  onClose,
  platformName,
  platformSlug,
}: PlatformSlugInstructionsModalProps) => {
  const { t } = useTranslation();

  // Look up instructions from the hardcoded object
  const instructions = platformSlug
    ? slugFormatPerNetwork[platformSlug.toLowerCase()]
    : null;

  if (!instructions) {
    return null;
  }

  // Extract slug from example URL by finding the last path segment
  const extractSlugFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter((p) => p);
      return pathParts[pathParts.length - 1] || "";
    } catch {
      // If URL parsing fails, try to extract from the path
      const parts = url.split("/").filter((p) => p);
      return parts[parts.length - 1] || "";
    }
  };

  const exampleUrl = instructions.exampleUrl;
  const slugText = extractSlugFromUrl(exampleUrl);
  const urlBeforeSlug = exampleUrl.substring(
    0,
    exampleUrl.lastIndexOf(slugText)
  );
  const urlAfterSlug = exampleUrl.substring(
    exampleUrl.lastIndexOf(slugText) + slugText.length
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          {t("platform.slugInstructions.title", {
            defaultValue: "Where can I find the slug?",
          })}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ ml: 2 }}
          aria-label={t("common.close", { defaultValue: "Close" })}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Explanation */}
          <Typography variant="body1" color="text.secondary">
            {t("platform.slugInstructions.explanation", {
              defaultValue:
                "The slug is the part of the URL that uniquely identifies the business. It varies from network to another.",
            })}
          </Typography>

          {/* Network Selection */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("platform.slugInstructions.selectNetwork", {
                defaultValue:
                  "Select a network to find out where to find the slug and what are the acceptable formats:",
              })}
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
              {t("platform.slugInstructions.network", {
                defaultValue: "Network",
              })}
            </Typography>
            <Chip
              label={platformName}
              sx={{
                mt: 1,
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            />
          </Box>

          <Divider />

          {/* Example URL */}
          <Box>
            <Typography
              variant="body2"
              fontWeight={600}
              gutterBottom
              sx={{ mb: 1 }}
            >
              {t("platform.slugInstructions.exampleUrl", {
                defaultValue: "Example of business URL",
              })}
            </Typography>
            <Box
              component="a"
              href={exampleUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-block",
                wordBreak: "break-all",
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              <Typography
                component="span"
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  color: "text.primary",
                }}
              >
                {urlBeforeSlug}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    color: "error.main",
                    fontWeight: 600,
                    backgroundColor: "error.light",
                    px: 0.5,
                    borderRadius: 0.5,
                  }}
                >
                  {slugText}
                </Typography>
                {urlAfterSlug}
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Acceptable Formats */}
          <Box>
            <Typography
              variant="body2"
              fontWeight={600}
              gutterBottom
              sx={{ mb: 1.5 }}
            >
              {t("platform.slugInstructions.acceptableFormats", {
                defaultValue: "Acceptable slug formats in order of preference:",
              })}
            </Typography>
            <List dense sx={{ pl: 0 }}>
              {instructions.acceptableFormats.map((format, index) => (
                <ListItem
                  key={index}
                  sx={{
                    py: 0.5,
                    px: 0,
                    display: "list-item",
                    listStyleType: "disc",
                    listStylePosition: "inside",
                  }}
                >
                  <Typography
                    variant="body2"
                    component="code"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      color: "text.primary",
                      backgroundColor: "grey.100",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      display: "inline-block",
                      wordBreak: "break-all",
                    }}
                  >
                    {format}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        </Stack>
      </DialogContent>
      <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ textTransform: "none" }}
        >
          {t("common.close", { defaultValue: "Close" })}
        </Button>
      </Box>
    </Dialog>
  );
};
