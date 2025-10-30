import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface CreateCheckoutSessionRequest {
    returnUrl?: string;
    planName?: string; // 'pro' or 'enterprise'
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
        const supabaseServiceKey = Deno.env.get(
            "SUPABASE_SERVICE_ROLE_KEY",
        )!;
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });
        const supabaseAdminClient = createClient(
            supabaseUrl,
            supabaseServiceKey,
        );

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

        // Parse request body for return URL and plan name
        const body: CreateCheckoutSessionRequest = await req.json().catch(
            () => ({}),
        );
        const baseUrl = Deno.env.get("BASE_URL") || "http://localhost:3000";
        const returnUrl = body.returnUrl || baseUrl;
        const planName = body.planName || "pro"; // Default to pro if not specified

        // Get user profile with subscription plan
        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select(
                "subscription_tier, subscription_plan_id, email, stripe_customer_id",
            )
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

        // Lookup plan by name
        const { data: plan, error: planError } = await supabaseAdminClient
            .from("subscription_plans")
            .select("id, name, display_name, stripe_price_id, price_monthly")
            .eq("name", planName)
            .eq("is_active", true)
            .single();

        if (planError || !plan) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Invalid plan",
                    message: `Plan "${planName}" not found or not active`,
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

        // Check if already subscribed (check both subscription_tier and subscription_plan_id)
        if (profile.subscription_plan_id) {
            const { data: currentPlan } = await supabaseAdminClient
                .from("subscription_plans")
                .select("name")
                .eq("id", profile.subscription_plan_id)
                .single();

            // Allow if they're upgrading or changing plans
            if (currentPlan && currentPlan.name === planName) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Already subscribed",
                        message:
                            `You are already on the ${plan.display_name} plan`,
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
        }

        // If free plan, directly assign to user (no Stripe needed)
        if (plan.price_monthly === 0) {
            await supabaseAdminClient
                .from("profiles")
                .update({ subscription_plan_id: plan.id })
                .eq("id", user.id);

            return new Response(
                JSON.stringify({
                    success: true,
                    planId: plan.id,
                    planName: plan.name,
                    message: "Free plan activated",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 200,
                },
            );
        }

        // Check if plan requires Stripe (paid plan)
        if (!plan.stripe_price_id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Configuration error",
                    message:
                        `Stripe price ID not configured for ${plan.display_name} plan`,
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

        // Get Stripe environment variables
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
            await supabaseAdminClient
                .from("profiles")
                .update({ stripe_customer_id: customerId })
                .eq("id", user.id);
        }

        // Create Stripe Checkout session
        const session = await stripeClient.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [
                {
                    price: plan.stripe_price_id,
                    quantity: 1,
                },
            ],
            success_url:
                `${returnUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl}/profile`,
            subscription_data: {
                metadata: {
                    user_id: user.id,
                    plan_name: plan.name,
                    plan_id: plan.id,
                },
            },
            metadata: {
                user_id: user.id,
                plan_name: plan.name,
                plan_id: plan.id,
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
