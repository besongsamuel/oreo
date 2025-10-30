import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface StartTrialResponse {
  success: boolean;
  trial?: {
    id: string;
    userId: string;
    expiresAt: string;
    status: string;
  };
  error?: string;
}

export const useTrial = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTrial = async (userId: string): Promise<StartTrialResponse> => {
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("Missing Supabase URL configuration");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/start-trial`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result: StartTrialResponse = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || "Failed to start trial";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start trial";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { startTrial, loading, error };
};

