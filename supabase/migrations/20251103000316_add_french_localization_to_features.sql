-- Add French localization columns to features table

ALTER TABLE features 
ADD COLUMN IF NOT EXISTS display_name_fr TEXT,
ADD COLUMN IF NOT EXISTS description_fr TEXT;

COMMENT ON COLUMN features.display_name_fr IS 'French display name for the feature';
COMMENT ON COLUMN features.description_fr IS 'French description of what the feature provides';

-- Populate French translations for existing features
UPDATE features 
SET 
  display_name_fr = CASE code
    WHEN 'monthly_summary' THEN 'Résumé mensuel'
    WHEN 'multiple_companies' THEN 'Plusieurs entreprises'
    WHEN 'max_companies' THEN 'Limite d''entreprises'
    WHEN 'max_locations_per_company' THEN 'Limite de sites'
    WHEN 'max_reviews_per_sync' THEN 'Limite de synchronisation'
    WHEN 'unlimited_reviews' THEN 'Avis illimités'
    WHEN 'max_platforms' THEN 'Limite de plateformes'
    ELSE display_name_fr
  END,
  description_fr = CASE code
    WHEN 'monthly_summary' THEN 'Accès à la génération de résumé mensuel'
    WHEN 'multiple_companies' THEN 'Possibilité de créer plus d''une entreprise'
    WHEN 'max_companies' THEN 'Nombre maximum d''entreprises autorisées'
    WHEN 'max_locations_per_company' THEN 'Nombre maximum de sites par entreprise'
    WHEN 'max_reviews_per_sync' THEN 'Nombre maximum d''avis récupérés par synchronisation depuis Zembra'
    WHEN 'unlimited_reviews' THEN 'Pas de limite sur les avis (plans payants)'
    WHEN 'max_platforms' THEN 'Nombre maximum de plateformes de révision sélectionnables'
    ELSE description_fr
  END
WHERE display_name_fr IS NULL OR description_fr IS NULL;

