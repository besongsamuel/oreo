import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSupabase } from "./useSupabase";

export interface PlanFeature {
  feature_id: string;
  feature_code: string;
  feature_display_name: string;
  feature_description: string | null;
  limit_value: Record<string, any> | null;
}

export interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  plan_display_name: string;
  price_monthly: number;
  stripe_price_id: string | null;
  is_active: boolean;
  pricing_page_title: string | null;
  plan_created_at: string;
  plan_updated_at: string;
  features: PlanFeature[];
}

export const useSubscriptionPlans = () => {
  const supabase = useSupabase();
  const { i18n } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current language (default to 'en' if not available)
        const language = i18n.language || "en";
        const isFrench = language === "fr" || language.startsWith("fr-");

        // 1. Fetch all active plans
        const { data: plansData, error: plansError } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("price_monthly", { ascending: true });

        if (plansError) {
          throw plansError;
        }

        // 2. Fetch all features with localization
        const { data: featuresData, error: featuresError } = await supabase
          .from("features")
          .select(
            "id, code, display_name, description, display_name_fr, description_fr",
          )
          .order("code");

        if (featuresError) {
          throw featuresError;
        }

        // 3. Fetch all plan-feature relationships (for limits)
        const { data: planFeaturesData, error: planFeaturesError } =
          await supabase
            .from("plan_features")
            .select("plan_id, feature_id, limit_value");

        if (planFeaturesError) {
          throw planFeaturesError;
        }

        // 4. Match features to plans
        const plansWithFeatures: SubscriptionPlan[] = (plansData || []).map(
          (plan) => {
            // For each plan, create a feature list from ALL features
            const features: PlanFeature[] = (featuresData || []).map(
              (feature) => {
                // Find if this feature is linked to this plan
                const planFeature = (planFeaturesData || []).find(
                  (pf) =>
                    pf.plan_id === plan.id && pf.feature_id === feature.id,
                );

                // Select language-appropriate display name and description
                const displayName = isFrench
                  ? feature.display_name_fr || feature.display_name
                  : feature.display_name;
                const description = isFrench
                  ? feature.description_fr || feature.description
                  : feature.description;

                return {
                  feature_id: feature.id,
                  feature_code: feature.code,
                  feature_display_name: displayName,
                  feature_description: description,
                  limit_value: planFeature?.limit_value || null,
                };
              },
            );

            return {
              plan_id: plan.id,
              plan_name: plan.name,
              plan_display_name: plan.display_name,
              price_monthly: plan.price_monthly,
              stripe_price_id: plan.stripe_price_id,
              is_active: plan.is_active,
              pricing_page_title: plan.pricing_page_title,
              plan_created_at: plan.created_at,
              plan_updated_at: plan.updated_at,
              features,
            };
          },
        );

        setPlans(plansWithFeatures);
      } catch (err) {
        console.error("Error fetching subscription plans:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [supabase, i18n.language]);

  return { plans, loading, error };
};
