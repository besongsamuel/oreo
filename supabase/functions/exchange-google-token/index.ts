import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Get Google OAuth credentials from environment
        const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
        const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

        if (!googleClientId || !googleClientSecret) {
            throw new Error("Google OAuth credentials not configured");
        }

        // Parse request body
        const { code, redirectUri } = await req.json();

        if (!code) {
            throw new Error("Authorization code is required");
        }

        // Exchange authorization code for access token
        const tokenResponse = await fetch(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    code,
                    client_id: googleClientId,
                    client_secret: googleClientSecret,
                    redirect_uri: redirectUri ||
                        "http://localhost:3000/google-callback",
                    grant_type: "authorization_code",
                }),
            },
        );

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            throw new Error(
                `Failed to exchange code for token: ${
                    errorData.error_description || errorData.error
                }`,
            );
        }

        const tokenData = await tokenResponse.json();

        // Return the token data
        return new Response(
            JSON.stringify({
                success: true,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_in: tokenData.expires_in,
                token_type: tokenData.token_type,
                scope: tokenData.scope,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error in exchange-google-token:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});
