import {
  Box,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export const PrivacyPolicyFR = () => {
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
              Politique de confidentialité
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              1. Informations que nous collectons
            </Typography>
            <Typography variant="body1" paragraph>
              Nous collectons les informations que vous nous fournissez
              directement, par exemple lorsque vous créez un compte, soumettez
              des avis ou nous contactez pour obtenir de l'aide. Cela peut
              inclure :
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                Informations personnelles (nom, adresse courriel, informations
                de profil)
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Contenu des avis et notes que vous soumettez
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Préférences de communication et demandes d'assistance
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              2. Comment nous utilisons vos informations
            </Typography>
            <Typography variant="body1" paragraph>
              Nous utilisons les informations que nous collectons pour :
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                Fournir, maintenir et améliorer nos services
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Traiter et afficher vos avis et notes
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Vous envoyer des notifications techniques et des messages
                d'assistance
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Répondre à vos commentaires et questions
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              3. Partage d'informations
            </Typography>
            <Typography variant="body1" paragraph>
              Nous ne vendons, n'échangeons et ne transférons pas vos
              informations personnelles à des tiers sans votre consentement,
              sauf dans les cas décrits dans cette politique. Nous pouvons
              partager vos informations dans les circonstances suivantes :
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                Avec votre consentement
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Pour respecter les obligations légales
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Pour protéger nos droits et prévenir la fraude
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              4. Sécurité des données
            </Typography>
            <Typography variant="body1" paragraph>
              Nous mettons en œuvre des mesures de sécurité appropriées pour
              protéger vos informations personnelles contre l'accès non
              autorisé, la modification, la divulgation ou la destruction.
              Cependant, aucune méthode de transmission sur Internet ou de
              stockage électronique n'est sécurisée à 100 %.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              5. Vos droits
            </Typography>
            <Typography variant="body1" paragraph>
              Vous avez le droit de :
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                Accéder et mettre à jour vos informations personnelles
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Supprimer votre compte et les données associées
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Refuser certaines communications
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Demander une copie de vos données
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              6. Cookies et suivi
            </Typography>
            <Typography variant="body1" paragraph>
              Nous utilisons des cookies et des technologies similaires pour
              améliorer votre expérience sur notre plateforme. Vous pouvez
              contrôler les paramètres des cookies via les préférences de votre
              navigateur.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              7. Modifications de cette politique
            </Typography>
            <Typography variant="body1" paragraph>
              Nous pouvons mettre à jour cette politique de confidentialité de
              temps à autre. Nous vous informerons de tout changement en
              publiant la nouvelle politique sur cette page et en mettant à jour
              la date de « Dernière mise à jour ».
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              8. Nous contacter
            </Typography>
            <Typography variant="body1" paragraph>
              Si vous avez des questions concernant cette politique de
              confidentialité, veuillez nous contacter à privacy@boresha.ca ou
              par nos canaux d'assistance.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};
