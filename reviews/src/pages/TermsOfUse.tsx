import {
  Box,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export const TermsOfUse = () => {
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
              Terms of Use
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Last updated: {new Date().toLocaleDateString()}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              1. Acceptance of Terms
            </Typography>
            <Typography variant="body1" paragraph>
              By accessing and using Boresha, you accept and agree to be bound
              by the terms and provision of this agreement. If you do not agree
              to abide by the above, please do not use this service.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              2. Use License
            </Typography>
            <Typography variant="body1" paragraph>
              Permission is granted to temporarily access Boresha for personal,
              non-commercial transitory viewing only. This is the grant of a
              license, not a transfer of title, and under this license you may
              not:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                Modify or copy the materials
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Use the materials for any commercial purpose or for any public
                display
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Attempt to reverse engineer any software contained on the
                website
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Remove any copyright or other proprietary notations from the
                materials
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              3. User Accounts
            </Typography>
            <Typography variant="body1" paragraph>
              When you create an account with us, you must provide information
              that is accurate, complete, and current at all times. You are
              responsible for safeguarding the password and for all activities
              that occur under your account.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              4. User-Generated Content
            </Typography>
            <Typography variant="body1" paragraph>
              You are responsible for the content you post, including reviews,
              comments, and other materials. You agree not to post content that:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                Is illegal, harmful, or violates any laws
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Infringes on intellectual property rights
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Contains false or misleading information
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Is spam, abusive, or harassing
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              5. Prohibited Uses
            </Typography>
            <Typography variant="body1" paragraph>
              You may not use our service:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                For any unlawful purpose or to solicit others to perform
                unlawful acts
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                To violate any international, federal, provincial, or state
                regulations, rules, laws, or local ordinances
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                To infringe upon or violate our intellectual property rights or
                the intellectual property rights of others
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                To harass, abuse, insult, harm, defame, slander, disparage,
                intimidate, or discriminate
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              6. Content Moderation
            </Typography>
            <Typography variant="body1" paragraph>
              We reserve the right to review, edit, or remove any content at our
              sole discretion. We may suspend or terminate accounts that violate
              these terms.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              7. Disclaimer
            </Typography>
            <Typography variant="body1" paragraph>
              The information on this website is provided on an "as is" basis.
              To the fullest extent permitted by law, we exclude all
              representations, warranties, conditions and terms relating to our
              website and the use of this website.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              8. Limitations
            </Typography>
            <Typography variant="body1" paragraph>
              In no event shall Boresha or its suppliers be liable for any
              damages (including, without limitation, damages for loss of data
              or profit, or due to business interruption) arising out of the use
              or inability to use the materials on our website.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              9. Accuracy of Materials
            </Typography>
            <Typography variant="body1" paragraph>
              The materials appearing on our website could include technical,
              typographical, or photographic errors. We do not warrant that any
              of the materials on its website are accurate, complete, or
              current.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              10. Links
            </Typography>
            <Typography variant="body1" paragraph>
              We have not reviewed all of the sites linked to our website and
              are not responsible for the contents of any such linked site. The
              inclusion of any link does not imply endorsement by us of the
              site.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              11. Modifications
            </Typography>
            <Typography variant="body1" paragraph>
              We may revise these terms of service at any time without notice.
              By using this website, you are agreeing to be bound by the then
              current version of these terms of service.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              12. Governing Law
            </Typography>
            <Typography variant="body1" paragraph>
              These terms and conditions are governed by and construed in
              accordance with the laws and you irrevocably submit to the
              exclusive jurisdiction of the courts in that state or location.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              13. Contact Information
            </Typography>
            <Typography variant="body1" paragraph>
              If you have any questions about these Terms of Use, please contact
              us at legal@boresha.com or through our support channels.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};
