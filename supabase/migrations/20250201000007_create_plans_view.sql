-- Create view for plans with features (for frontend queries)

CREATE OR REPLACE VIEW plans_with_features AS
SELECT 
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.display_name AS plan_display_name,
  sp.price_monthly,
  sp.stripe_price_id,
  sp.is_active,
  sp.created_at AS plan_created_at,
  sp.updated_at AS plan_updated_at,
  jsonb_agg(
    jsonb_build_object(
      'feature_id', f.id,
      'feature_code', f.code,
      'feature_display_name', f.display_name,
      'feature_description', f.description,
      'limit_value', pf.limit_value
    )
    ORDER BY f.code
  ) FILTER (WHERE f.id IS NOT NULL) AS features
FROM subscription_plans sp
LEFT JOIN plan_features pf ON sp.id = pf.plan_id
LEFT JOIN features f ON pf.feature_id = f.id
WHERE sp.is_active = true
GROUP BY sp.id, sp.name, sp.display_name, sp.price_monthly, sp.stripe_price_id, sp.is_active, sp.created_at, sp.updated_at;

COMMENT ON VIEW plans_with_features IS 'View that returns all active subscription plans with their associated features and limits for easy frontend consumption';

