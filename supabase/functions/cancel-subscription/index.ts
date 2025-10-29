import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Method not allowed",
                    message: "Only POST requests are supported",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 405,
                },
            );
        }

        // Get authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Unauthorized",
                    message: "Missing authorization header",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 401,
                },
            );
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        // Get authenticated user
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Unauthorized",
                    message: "Invalid authentication",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 401,
                },
            );
        }

        // Get user profile with subscription info
        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("subscription_tier, stripe_subscription_id")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Profile not found",
                    message: "User profile could not be retrieved",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 404,
                },
            );
        }

        // Check if user has an active subscription
        if (
            profile.subscription_tier !== "paid" ||
            !profile.stripe_subscription_id
        ) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "No active subscription",
                    message:
                        "User does not have an active subscription to cancel",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 400,
                },
            );
        }

        // Get Stripe secret key
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            console.error("Missing Stripe configuration");
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Configuration error",
                    message: "Stripe is not properly configured",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 500,
                },
            );
        }

        // Initialize Stripe
        const stripe = await import(
            "https://esm.sh/stripe@14.21.0?target=deno"
        );
        const stripeClient = new stripe.Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
        });

        // Cancel subscription in Stripe
        const subscription = await stripeClient.subscriptions.cancel(
            profile.stripe_subscription_id,
        );

        // Update profile to free tier
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAdminClient = createClient(
            supabaseUrl,
            supabaseServiceKey,
        );

        await supabaseAdminClient
            .from("profiles")
            .update({
                subscription_tier: "free",
                subscription_started_at: null,
                subscription_expires_at: null,
                stripe_subscription_id: null,
            })
            .eq("id", user.id);

        // Note: The webhook will also handle this when it receives customer.subscription.deleted
        // But we update here immediately for better UX

        return new Response(
            JSON.stringify({
                success: true,
                message: "Subscription cancelled successfully",
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    canceled_at: subscription.canceled_at
                        ? new Date(subscription.canceled_at * 1000)
                            .toISOString()
                        : null,
                },
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error cancelling subscription:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                message: "Failed to cancel subscription",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});
