import { Business as BusinessIcon } from "@mui/icons-material";
import { Avatar, Box, Chip, Paper, Stack, Typography } from "@mui/material";

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
}

interface CompanyHeaderProps {
  company: CompanyDetails;
}

export const CompanyHeader = ({ company }: CompanyHeaderProps) => {
  return (
    <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Stack direction="row" spacing={{ xs: 2, sm: 3 }} alignItems="flex-start">
        <Avatar
          sx={{
            bgcolor: "secondary.main",
            width: { xs: 48, sm: 56, md: 72 },
            height: { xs: 48, sm: 56, md: 72 },
          }}
        >
          <BusinessIcon sx={{ fontSize: { xs: 24, sm: 32, md: 40 } }} />
        </Avatar>
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
