import { Box, CircularProgress, Container } from "@mui/material";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserProvider } from "../context/UserContext"; // ADD THIS
import { useSupabase } from "../hooks/useSupabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const supabase = useSupabase();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  // Remove this line: const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Auth check timeout")), 2000)
        );

        const result = await Promise.race([
          sessionPromise,
          timeoutPromise,
        ]).catch(() => ({ data: { session: null }, error: null }));

        if (!mounted) return;

        const session = result.data?.session;
        const user = session?.user;

        setAuthenticated(!!user);
        // Remove this line: setUserId(user?.id || null);

        if (user) {
          try {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", user.id)
              .maybeSingle();

            if (!mounted) return;

            if (!error && profile) {
              setHasProfile(true);
            } else {
              setHasProfile(false);
            }
          } catch (profileError) {
            console.error("Error checking profile:", profileError);
            setHasProfile(false);
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        if (mounted) {
          setAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const user = session?.user;
      setAuthenticated(!!user);
      // Remove this line: setUserId(user?.id || null);

      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          if (mounted && !error && profile) {
            setHasProfile(true);
          } else {
            setHasProfile(false);
          }
        } catch (profileError) {
          console.error("Error checking profile on auth change:", profileError);
          setHasProfile(false);
        }
      } else {
        setHasProfile(false);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return (
      <Container>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!authenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!hasProfile && location.pathname !== "/auth/complete-signup") {
    return <Navigate to="/auth/complete-signup" replace />;
  }

  // CHANGE THIS LINE:
  return <UserProvider>{children}</UserProvider>;
};
