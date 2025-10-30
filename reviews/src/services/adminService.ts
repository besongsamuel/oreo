import { supabase } from "../lib/supabaseClient";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: string;
  subscription_plan_id: string | null;
  subscription_plan_name: string | null;
  subscription_plan_display_name: string | null;
  created_at: string;
  companies_count?: number;
}

export interface UserDetail extends AdminUser {
  companies: CompanyWithStats[];
  trial_history: TrialHistory[];
}

export interface CompanyWithStats {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  created_at: string;
  locations_count: number;
  reviews_count: number;
  average_rating: number | null;
}

export interface TrialHistory {
  id: string;
  user_id: string;
  granted_by: string;
  granted_by_name: string | null;
  trial_plan_id: string;
  trial_plan_name: string | null;
  starts_at: string;
  expires_at: string;
  status: "active" | "expired" | "cancelled";
  created_at: string;
}

/**
 * Fetch all users in the system (admin only)
 */
export const fetchAllUsers = async (): Promise<AdminUser[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      full_name,
      company_name,
      role,
      subscription_plan_id,
      created_at,
      subscription_plans:subscription_plan_id (
        name,
        display_name
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    throw error;
  }

  // Get companies count for each user
  const userIds = data?.map((user) => user.id) || [];
  const { data: companiesData } = await supabase
    .from("companies")
    .select("owner_id")
    .in("owner_id", userIds);

  const companiesCountMap = new Map<string, number>();
  companiesData?.forEach((company) => {
    const count = companiesCountMap.get(company.owner_id) || 0;
    companiesCountMap.set(company.owner_id, count + 1);
  });

  return (
    data?.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      company_name: user.company_name,
      role: user.role,
      subscription_plan_id: user.subscription_plan_id,
      subscription_plan_name:
        (user.subscription_plans as any)?.name || null,
      subscription_plan_display_name:
        (user.subscription_plans as any)?.display_name || null,
      created_at: user.created_at,
      companies_count: companiesCountMap.get(user.id) || 0,
    })) || []
  );
};

/**
 * Fetch detailed information about a specific user
 */
export const fetchUserDetails = async (
  userId: string
): Promise<UserDetail | null> => {
  // Fetch user profile
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      full_name,
      company_name,
      role,
      subscription_plan_id,
      created_at,
      subscription_plans:subscription_plan_id (
        name,
        display_name
      )
    `
    )
    .eq("id", userId)
    .single();

  if (profileError || !profileData) {
    console.error("Error fetching user profile:", profileError);
    throw profileError;
  }

  // Fetch user's companies with stats
  const { data: companiesData, error: companiesError } = await supabase
    .from("companies")
    .select(
      `
      id,
      name,
      description,
      industry,
      website,
      created_at
    `
    )
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (companiesError) {
    console.error("Error fetching companies:", companiesError);
    throw companiesError;
  }

  // Get stats for each company
  const companyIds = companiesData?.map((c) => c.id) || [];
  const { data: statsData } = await supabase
    .from("company_stats")
    .select("company_id, total_locations, total_reviews, average_rating")
    .in("company_id", companyIds);

  const statsMap = new Map(
    statsData?.map((stat) => [stat.company_id, stat]) || []
  );

  const companies: CompanyWithStats[] =
    companiesData?.map((company) => {
      const stats = statsMap.get(company.id);
      return {
        id: company.id,
        name: company.name,
        description: company.description,
        industry: company.industry,
        website: company.website,
        created_at: company.created_at,
        locations_count: stats?.total_locations || 0,
        reviews_count: stats?.total_reviews || 0,
        average_rating: stats?.average_rating || null,
      };
    }) || [];

  // Fetch trial history
  const { data: trialData, error: trialError } = await supabase
    .from("trial_trials")
    .select(
      `
      id,
      user_id,
      granted_by,
      trial_plan_id,
      starts_at,
      expires_at,
      status,
      created_at,
      granted_by_profile:granted_by (
        full_name,
        email
      ),
      trial_plan:subscription_plans!trial_trials_trial_plan_id_fkey (
        name
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (trialError) {
    console.error("Error fetching trial history:", trialError);
    // Don't throw, just return empty array
  }

  const trial_history: TrialHistory[] =
    trialData?.map((trial) => {
      const grantedByProfile = (trial.granted_by_profile as any) || {};
      return {
        id: trial.id,
        user_id: trial.user_id,
        granted_by: trial.granted_by,
        granted_by_name:
          grantedByProfile.full_name || grantedByProfile.email || null,
        trial_plan_id: trial.trial_plan_id,
        trial_plan_name: (trial.trial_plan as any)?.name || null,
        starts_at: trial.starts_at,
        expires_at: trial.expires_at,
        status: trial.status,
        created_at: trial.created_at,
      };
    }) || [];

  return {
    id: profileData.id,
    email: profileData.email,
    full_name: profileData.full_name,
    company_name: profileData.company_name,
    role: profileData.role,
    subscription_plan_id: profileData.subscription_plan_id,
    subscription_plan_name: (profileData.subscription_plans as any)?.name || null,
    subscription_plan_display_name:
      (profileData.subscription_plans as any)?.display_name || null,
    created_at: profileData.created_at,
    companies_count: companies.length,
    companies,
    trial_history,
  };
};

/**
 * Fetch all companies (admin only - includes all companies in system)
 */
export const fetchAllCompanies = async (): Promise<
  Array<CompanyWithStats & { owner_id: string; owner_email: string; owner_name: string | null; owner_role: string }>
> => {
  const { data, error } = await supabase
    .from("companies")
    .select(
      `
      id,
      name,
      description,
      industry,
      website,
      owner_id,
      created_at,
      owner:profiles!owner_id (
        email,
        full_name,
        role
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }

  const companyIds = data?.map((c) => c.id) || [];
  const { data: statsData } = await supabase
    .from("company_stats")
    .select("company_id, total_locations, total_reviews, average_rating")
    .in("company_id", companyIds);

  const statsMap = new Map(
    statsData?.map((stat) => [stat.company_id, stat]) || []
  );

  return (
    data?.map((company) => {
      const owner = (company.owner as any) || {};
      const stats = statsMap.get(company.id);
      return {
        id: company.id,
        name: company.name,
        description: company.description,
        industry: company.industry,
        website: company.website,
        owner_id: company.owner_id,
        owner_email: owner.email || "",
        owner_name: owner.full_name || null,
        owner_role: owner.role || "user",
        created_at: company.created_at,
        locations_count: stats?.total_locations || 0,
        reviews_count: stats?.total_reviews || 0,
        average_rating: stats?.average_rating || null,
      };
    }) || []
  );
};

/**
 * Fetch trial history for a specific user
 */
export const fetchTrialHistory = async (
  userId: string
): Promise<TrialHistory[]> => {
  const { data, error } = await supabase
    .from("trial_trials")
    .select(
      `
      id,
      user_id,
      granted_by,
      trial_plan_id,
      starts_at,
      expires_at,
      status,
      created_at,
      granted_by_profile:granted_by (
        full_name,
        email
      ),
      trial_plan:subscription_plans!trial_trials_trial_plan_id_fkey (
        name
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching trial history:", error);
    throw error;
  }

  return (
    data?.map((trial) => {
      const grantedByProfile = (trial.granted_by_profile as any) || {};
      return {
        id: trial.id,
        user_id: trial.user_id,
        granted_by: trial.granted_by,
        granted_by_name:
          grantedByProfile.full_name || grantedByProfile.email || null,
        trial_plan_id: trial.trial_plan_id,
        trial_plan_name: (trial.trial_plan as any)?.name || null,
        starts_at: trial.starts_at,
        expires_at: trial.expires_at,
        status: trial.status,
        created_at: trial.created_at,
      };
    }) || []
  );
};

