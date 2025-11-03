import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: string;
  avatar_url: string | null;
  subscription_tier: string;
  subscription_plan_id: string | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  monthly_reviews_count: number;
  monthly_reviews_reset_at: string;
  preferred_language: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PlanFeature {
  feature_id: string;
  feature_code: string;
  feature_display_name: string;
  feature_description: string | null;
  limit_value: Record<string, any> | null;
}

interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  plan_display_name: string;
  price_monthly: number;
  stripe_price_id: string | null;
  is_active: boolean;
  features: PlanFeature[];
}

interface UserContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  currentPlan: SubscriptionPlan | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  hasFeature: (featureCode: string) => boolean;
  getPlanLimit: (limitType: string) => number | null;
  canCreateCompany: () => boolean;
  canCreateLocation: (companyId: string) => Promise<boolean>;
  isAdmin: () => boolean;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async (planId: string, userLanguage?: string) => {
    try {
      // Get user language preference (from parameter, profile, or default to 'en')
      const language = userLanguage || profile?.preferred_language || "en";
      const isFrench = language === "fr" || language.startsWith("fr-");

      // 1. Fetch the plan
      const { data: planData, error: planError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError) {
        throw planError;
      }

      // 2. Fetch all features with localization
      const { data: featuresData, error: featuresError } = await supabase
        .from("features")
        .select("id, code, display_name, description, display_name_fr, description_fr")
        .order("code");

      if (featuresError) {
        throw featuresError;
      }

      // 3. Fetch plan-feature relationships (for limits)
      const { data: planFeaturesData, error: planFeaturesError } = await supabase
        .from("plan_features")
        .select("plan_id, feature_id, limit_value")
        .eq("plan_id", planId);

      if (planFeaturesError) {
        throw planFeaturesError;
      }

      // 4. Match features to plan
      const features: PlanFeature[] = (featuresData || []).map((feature) => {
        const planFeature = (planFeaturesData || []).find(
          (pf) => pf.feature_id === feature.id
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
      });

      setCurrentPlan({
        plan_id: planData.id,
        plan_name: planData.name,
        plan_display_name: planData.display_name,
        price_monthly: planData.price_monthly,
        stripe_price_id: planData.stripe_price_id,
        is_active: planData.is_active,
        features,
      });
    } catch (error) {
      console.error("Error fetching plan:", error);
      setCurrentPlan(null);
    }
  };

  const fetchPlanByName = async (planName: string, userLanguage?: string) => {
    try {
      // Get user language preference (from parameter, profile, or default to 'en')
      const language = userLanguage || profile?.preferred_language || "en";
      const isFrench = language === "fr" || language.startsWith("fr-");

      // 1. Fetch the plan
      const { data: planData, error: planError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("name", planName)
        .single();

      if (planError) {
        throw planError;
      }

      // 2. Fetch all features with localization
      const { data: featuresData, error: featuresError } = await supabase
        .from("features")
        .select("id, code, display_name, description, display_name_fr, description_fr")
        .order("code");

      if (featuresError) {
        throw featuresError;
      }

      // 3. Fetch plan-feature relationships (for limits)
      const { data: planFeaturesData, error: planFeaturesError } = await supabase
        .from("plan_features")
        .select("plan_id, feature_id, limit_value")
        .eq("plan_id", planData.id);

      if (planFeaturesError) {
        throw planFeaturesError;
      }

      // 4. Match features to plan
      const features: PlanFeature[] = (featuresData || []).map((feature) => {
        const planFeature = (planFeaturesData || []).find(
          (pf) => pf.feature_id === feature.id
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
      });

      setCurrentPlan({
        plan_id: planData.id,
        plan_name: planData.name,
        plan_display_name: planData.display_name,
        price_monthly: planData.price_monthly,
        stripe_price_id: planData.stripe_price_id,
        is_active: planData.is_active,
        features,
      } as SubscriptionPlan);
    } catch (error) {
      console.error("Error fetching plan:", error);
      setCurrentPlan(null);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        setCurrentPlan(null);
      } else {
        setProfile(data as Profile);
        // Fetch plan information if plan_id exists
        // Pass the preferred_language from the fetched profile data
        const userLanguage = data.preferred_language || "en";
        if (data.subscription_plan_id) {
          await fetchPlan(data.subscription_plan_id, userLanguage);
        } else {
          // Default to free plan
          await fetchPlanByName("free", userLanguage);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      setCurrentPlan(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    }
  }, [user]);

  useEffect(() => {
    // Get initial session

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setCurrentPlan(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateLanguage = async (language: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_language: language })
        .eq("id", user.id);

      if (error) throw error;

      // Update local profile state
      if (profile) {
        const updatedProfile = { ...profile, preferred_language: language };
        setProfile(updatedProfile);
        
        // Re-fetch plan with new language
        if (currentPlan) {
          if (currentPlan.plan_id) {
            await fetchPlan(currentPlan.plan_id, language);
          } else if (currentPlan.plan_name) {
            await fetchPlanByName(currentPlan.plan_name, language);
          }
        }
      }
    } catch (error) {
      console.error("Error updating language:", error);
    }
  };

  // Helper function to check if user has a feature
  const hasFeature = (featureCode: string): boolean => {
    // Admins have all features
    if (profile?.role === "admin") {
      return true;
    }

    if (!currentPlan?.features) {
      return false;
    }

    return currentPlan.features.some(
      (feature) => feature.feature_code === featureCode
    );
  };

  // Helper function to get plan limit
  const getPlanLimit = (limitType: string): number | null => {
    // Admins have no limits
    if (profile?.role === "admin") {
      return null;
    }

    if (!currentPlan?.features) {
      return null;
    }

    // Find feature that might have this limit
    const feature = currentPlan.features.find((f) => {
      if (f.limit_value && typeof f.limit_value === "object") {
        return limitType in f.limit_value;
      }
      return false;
    });

    if (feature?.limit_value && typeof feature.limit_value === "object") {
      const limit = feature.limit_value[limitType];
      return typeof limit === "number" ? limit : null;
    }

    return null;
  };

  // Check if user can create another company
  const canCreateCompany = (): boolean => {
    // Admins can always create companies
    if (profile?.role === "admin") {
      return true;
    }

    if (!profile?.id) {
      return false;
    }

    const maxCompanies = getPlanLimit("max_companies");
    if (maxCompanies === null) {
      return true; // Unlimited
    }

    // We'll need to check the actual count, but returning true for now
    // The backend trigger will enforce the actual limit
    return true;
  };

  const isAdmin = useCallback((): boolean => {
    return profile?.role === "admin";
  }, [profile]);

  // Check if company can have another location
  const canCreateLocation = async (companyId: string): Promise<boolean> => {
    // Admins can always create locations
    if (profile?.role === "admin") {
      return true;
    }

    if (!profile?.id) {
      return false;
    }

    // Use the database function to check
    try {
      const { data, error } = await supabase.rpc("check_location_limit", {
        company_id: companyId,
      });

      if (error) {
        console.error("Error checking location limit:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Error checking location limit:", error);
      return false;
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      currentPlan,
      loading,
      signOut,
      updateLanguage,
      hasFeature,
      getPlanLimit,
      canCreateCompany,
      canCreateLocation,
      isAdmin,
    }),
    [user, session, profile, currentPlan, loading, isAdmin]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
