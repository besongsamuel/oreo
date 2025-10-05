import { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSupabase } from "../hooks/useSupabase";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: string;
  avatar_url: string | null;
}

interface UserContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  hasProfile: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(
    async (userId: string) => {
      console.log("Fetching profile for user:", userId);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        console.log("Profile fetch result:", { data, error });

        if (error) {
          if (error.code === "PGRST116") {
            // No profile found
            console.log("No profile found for user");
            setProfile(null);
          } else {
            console.error("Profile fetch error:", error);
            throw error;
          }
        } else {
          console.log("Profile loaded successfully:", data);
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
      }
    },
    [supabase]
  );

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    console.log("UserContext: Initializing");
    let mounted = true;

    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn("Loading timeout reached - forcing loading to false");
      if (mounted) {
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log("Getting session...");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("Session retrieved:", session?.user?.email);

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // Fetch profile if user exists
        if (session?.user) {
          console.log("User exists, fetching profile...");
          try {
            await fetchProfile(session.user.id);
          } catch (profileError) {
            console.error("Failed to fetch profile:", profileError);
            // Continue even if profile fetch fails
          }
        } else {
          console.log("No user session found");
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        console.log("Setting loading to false");
        clearTimeout(timeout);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email);

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      // Fetch profile if user exists
      if (session?.user) {
        try {
          await fetchProfile(session.user.id);
        } catch (profileError) {
          console.error(
            "Failed to fetch profile on auth change:",
            profileError
          );
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

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
    hasProfile: !!profile,
    signOut,
    refreshProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
