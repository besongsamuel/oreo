import {
  Box,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export const PrivacyPolicy = () => {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
        }}
      >
        <Stack spacing={4}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Privacy Policy
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Last updated: {new Date().toLocaleDateString()}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              1. Information We Collect
            </Typography>
            <Typography variant="body1" paragraph>
              We collect information you provide directly to us, such as when
              you create an account, submit reviews, or contact us for support.
              This may include:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                Personal information (name, email address, profile information)
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Review content and ratings you submit
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Communication preferences and support requests
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              2. How We Use Your Information
            </Typography>
            <Typography variant="body1" paragraph>
              We use the information we collect to:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                Provide, maintain, and improve our services
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Process and display your reviews and ratings
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Send you technical notices and support messages
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Respond to your comments and questions
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              3. Information Sharing
            </Typography>
            <Typography variant="body1" paragraph>
              We do not sell, trade, or otherwise transfer your personal
              information to third parties without your consent, except as
              described in this policy. We may share your information in the
              following circumstances:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                With your consent
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                To comply with legal obligations
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                To protect our rights and prevent fraud
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              4. Data Security
            </Typography>
            <Typography variant="body1" paragraph>
              We implement appropriate security measures to protect your
              personal information against unauthorized access, alteration,
              disclosure, or destruction. However, no method of transmission
              over the internet or electronic storage is 100% secure.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              5. Your Rights
            </Typography>
            <Typography variant="body1" paragraph>
              You have the right to:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                Access and update your personal information
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Delete your account and associated data
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Opt out of certain communications
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Request a copy of your data
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              6. Cookies and Tracking
            </Typography>
            <Typography variant="body1" paragraph>
              We use cookies and similar technologies to enhance your experience
              on our platform. You can control cookie settings through your
              browser preferences.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              7. Changes to This Policy
            </Typography>
            <Typography variant="body1" paragraph>
              We may update this privacy policy from time to time. We will
              notify you of any changes by posting the new policy on this page
              and updating the "Last updated" date.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              8. Contact Us
            </Typography>
            <Typography variant="body1" paragraph>
              If you have any questions about this privacy policy, please
              contact us at privacy@boresha.ca or through our support channels.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};
