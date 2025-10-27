import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: string;
  avatar_url: string | null;
  subscription_tier: string;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  monthly_reviews_count: number;
  monthly_reviews_reset_at: string;
  created_at: string;
  updated_at: string;
}

interface UserContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);

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
      } else {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
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
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signOut,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
