import { useEffect, useState } from "react";
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
  plan_created_at: string;
  plan_updated_at: string;
  features: PlanFeature[];
}

export const useSubscriptionPlans = () => {
  const supabase = useSupabase();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch plans with features using the view
        const { data, error: fetchError } = await supabase
          .from("plans_with_features")
          .select("*")
          .order("price_monthly", { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          setPlans(data as SubscriptionPlan[]);
        }
      } catch (err) {
        console.error("Error fetching subscription plans:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [supabase]);

  return { plans, loading, error };
};

