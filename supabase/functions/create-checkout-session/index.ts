import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface CreateCheckoutSessionRequest {
    returnUrl?: string;
}

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

        // Get user profile
        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("subscription_tier, email, stripe_customer_id")
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

        // Check if already subscribed
        if (profile.subscription_tier === "paid") {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Already subscribed",
                    message: "User already has an active subscription",
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

        // Get Stripe environment variables
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        const stripePriceId = Deno.env.get("STRIPE_PRICE_ID");
        const baseUrl = Deno.env.get("BASE_URL") || "http://localhost:3000";

        if (!stripeSecretKey || !stripePriceId) {
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

        // Create or retrieve Stripe customer
        let customerId = profile.stripe_customer_id;

        if (!customerId) {
            const customer = await stripeClient.customers.create({
                email: profile.email || user.email || undefined,
                metadata: {
                    supabase_user_id: user.id,
                },
            });
            customerId = customer.id;

            // Save customer ID to profile
            const supabaseServiceKey = Deno.env.get(
                "SUPABASE_SERVICE_ROLE_KEY",
            )!;
            const supabaseAdminClient = createClient(
                supabaseUrl,
                supabaseServiceKey,
            );

            await supabaseAdminClient
                .from("profiles")
                .update({ stripe_customer_id: customerId })
                .eq("id", user.id);
        }

        // Parse request body for return URL
        const body: CreateCheckoutSessionRequest = await req.json().catch(
            () => ({})
        );
        const returnUrl = body.returnUrl || baseUrl;

        // Create Stripe Checkout session
        const session = await stripeClient.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            success_url:
                `${returnUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl}/profile`,
            metadata: {
                user_id: user.id,
            },
            subscription_data: {
                metadata: {
                    user_id: user.id,
                },
            },
        });

        return new Response(
            JSON.stringify({
                success: true,
                sessionId: session.id,
                url: session.url,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error creating checkout session:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                message: "Failed to create checkout session",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});
