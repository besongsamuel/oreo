import {
  Box,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export const TermsOfUseFR = () => {
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
              Conditions d'utilisation
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              1. Acceptation des conditions
            </Typography>
            <Typography variant="body1" paragraph>
              En accédant et en utilisant Boresha, vous acceptez et vous engagez
              à respecter les termes et dispositions de cet accord. Si vous
              n'acceptez pas de vous conformer à ce qui précède, veuillez ne pas
              utiliser ce service.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              2. Licence d'utilisation
            </Typography>
            <Typography variant="body1" paragraph>
              L'autorisation est accordée d'accéder temporairement à Boresha
              pour une consultation transitoire personnelle et non commerciale
              uniquement. Il s'agit de l'octroi d'une licence, et non d'un
              transfert de titre, et en vertu de cette licence, vous ne pouvez
              pas :
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                Modifier ou copier les matériaux
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Utiliser les matériaux à des fins commerciales ou pour toute
                présentation publique
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Tenter de décompiler ou de désassembler tout logiciel contenu
                sur le site web
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Supprimer tout droit d'auteur ou toute autre notation de
                propriété des matériaux
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              3. Comptes utilisateurs
            </Typography>
            <Typography variant="body1" paragraph>
              Lorsque vous créez un compte chez nous, vous devez fournir des
              informations exactes, complètes et à jour en tout temps. Vous êtes
              responsable de la protection du mot de passe et de toutes les
              activités qui se produisent sous votre compte.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              4. Contenu généré par les utilisateurs
            </Typography>
            <Typography variant="body1" paragraph>
              Vous êtes responsable du contenu que vous publiez, y compris les
              avis, commentaires et autres matériaux. Vous acceptez de ne pas
              publier de contenu qui :
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                Est illégal, nuisible ou viole des lois
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Porte atteinte aux droits de propriété intellectuelle
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Contient des informations fausses ou trompeuses
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Est du spam, abusif ou harcelant
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              5. Utilisations interdites
            </Typography>
            <Typography variant="body1" paragraph>
              Vous ne pouvez pas utiliser notre service :
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" paragraph>
                À des fins illégales ou pour inciter d'autres personnes à
                accomplir des actes illégaux
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Pour violer toute réglementation, règle, loi internationale,
                fédérale, provinciale ou étatique, ou ordonnance locale
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Pour enfreindre ou violer nos droits de propriété intellectuelle
                ou les droits de propriété intellectuelle d'autrui
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                Pour harceler, abuser, insulter, nuire, diffamer, calomnier,
                dénigrer, intimider ou discriminer
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              6. Modération du contenu
            </Typography>
            <Typography variant="body1" paragraph>
              Nous nous réservons le droit d'examiner, de modifier ou de
              supprimer tout contenu à notre seule discrétion. Nous pouvons
              suspendre ou résilier des comptes qui violent ces conditions.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              7. Avertissement
            </Typography>
            <Typography variant="body1" paragraph>
              Les informations sur ce site web sont fournies « telles quelles ».
              Dans toute la mesure permise par la loi, nous excluons toutes les
              représentations, garanties, conditions et termes relatifs à notre
              site web et à l'utilisation de ce site web.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              8. Limitations
            </Typography>
            <Typography variant="body1" paragraph>
              En aucun cas, Boresha ou ses fournisseurs ne seront responsables
              de tout dommage (y compris, sans limitation, les dommages pour
              perte de données ou de profit, ou en raison d'une interruption
              d'activité) découlant de l'utilisation ou de l'incapacité
              d'utiliser les matériaux sur notre site web.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              9. Exactitude des matériaux
            </Typography>
            <Typography variant="body1" paragraph>
              Les matériaux apparaissant sur notre site web pourraient inclure
              des erreurs techniques, typographiques ou photographiques. Nous ne
              garantissons pas que les matériaux sur notre site web sont exacts,
              complets ou à jour.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              10. Liens
            </Typography>
            <Typography variant="body1" paragraph>
              Nous n'avons pas examiné tous les sites liés à notre site web et
              ne sommes pas responsables du contenu de ces sites liés.
              L'inclusion de tout lien n'implique pas notre approbation du site.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              11. Modifications
            </Typography>
            <Typography variant="body1" paragraph>
              Nous pouvons réviser ces conditions d'utilisation à tout moment
              sans préavis. En utilisant ce site web, vous acceptez d'être lié
              par la version alors en vigueur de ces conditions d'utilisation.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              12. Loi applicable
            </Typography>
            <Typography variant="body1" paragraph>
              Ces termes et conditions sont régis et interprétés conformément
              aux lois et vous vous soumettez irrévocablement à la juridiction
              exclusive des tribunaux de cet État ou de cet emplacement.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              13. Coordonnées de contact
            </Typography>
            <Typography variant="body1" paragraph>
              Si vous avez des questions concernant ces conditions
              d'utilisation, veuillez nous contacter à legal@boresha.com ou par
              nos canaux d'assistance.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};
