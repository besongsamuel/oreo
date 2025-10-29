import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, stripe-signature",
};

interface StripeEvent {
    id: string;
    type: string;
    data: {
        object: any;
    };
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

        // Get webhook secret
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

        if (!webhookSecret || !stripeSecretKey) {
            console.error("Missing Stripe webhook configuration");
            return new Response(
                JSON.stringify({ error: "Webhook secret not configured" }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 500,
                },
            );
        }

        // Get the signature from headers
        const signature = req.headers.get("stripe-signature");
        if (!signature) {
            return new Response(
                JSON.stringify({ error: "Missing stripe-signature header" }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 400,
                },
            );
        }

        // Get raw body for signature verification
        const body = await req.text();

        // Initialize Stripe for signature verification
        const stripe = await import(
            "https://esm.sh/stripe@14.21.0?target=deno"
        );
        const stripeClient = new stripe.Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
        });

        let event: StripeEvent;
        try {
            // Verify webhook signature
            event = stripeClient.webhooks.constructEvent(
                body,
                signature,
                webhookSecret,
            ) as StripeEvent;
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            return new Response(
                JSON.stringify({ error: "Invalid signature" }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 400,
                },
            );
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Check if event was already processed (idempotency)
        const { data: existingPayment } = await supabaseClient
            .from("stripe_payments")
            .select("id")
            .eq("event_id", event.id)
            .single();

        if (existingPayment) {
            console.log(`Event ${event.id} already processed, skipping`);
            return new Response(
                JSON.stringify({
                    received: true,
                    message: "Event already processed",
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

        console.log(`Processing Stripe event: ${event.type} (${event.id})`);

        // Handle different event types
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const userId = session.metadata?.user_id ||
                    session.subscription_details?.metadata?.user_id;

                if (!userId || !session.customer) {
                    console.error(
                        "Missing user_id or customer in checkout session",
                    );
                    break;
                }

                // Get subscription details
                const subscriptionId = session.subscription;
                if (!subscriptionId) {
                    console.error("No subscription ID in checkout session");
                    break;
                }

                const subscription = await stripeClient.subscriptions.retrieve(
                    subscriptionId,
                );
                const currentPeriodEnd = new Date(
                    subscription.current_period_end * 1000,
                );

                // Update profile with subscription details
                await supabaseClient
                    .from("profiles")
                    .update({
                        subscription_tier: "paid",
                        subscription_started_at: new Date().toISOString(),
                        subscription_expires_at: currentPeriodEnd.toISOString(),
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: subscriptionId,
                    })
                    .eq("id", userId);

                // Record payment event
                await supabaseClient.from("stripe_payments").insert({
                    user_id: userId,
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: subscriptionId,
                    amount: session.amount_total
                        ? session.amount_total / 100
                        : 0,
                    currency: session.currency || "usd",
                    status: "succeeded",
                    event_type: event.type,
                    event_id: event.id,
                    metadata: {
                        session_id: session.id,
                        subscription_id: subscriptionId,
                    },
                });

                console.log(`Subscription activated for user ${userId}`);
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object;
                const subscriptionId = invoice.subscription as string;

                if (!subscriptionId) {
                    console.error("No subscription ID in invoice");
                    break;
                }

                // Get subscription details
                const subscription = await stripeClient.subscriptions.retrieve(
                    subscriptionId,
                );
                const currentPeriodEnd = new Date(
                    subscription.current_period_end * 1000,
                );

                // Find user by subscription ID
                const { data: profile } = await supabaseClient
                    .from("profiles")
                    .select("id")
                    .eq("stripe_subscription_id", subscriptionId)
                    .single();

                if (!profile) {
                    console.error(
                        `No profile found for subscription ${subscriptionId}`,
                    );
                    break;
                }

                // Extend subscription expiry by 1 month (or use Stripe's current_period_end)
                await supabaseClient
                    .from("profiles")
                    .update({
                        subscription_expires_at: currentPeriodEnd.toISOString(),
                    })
                    .eq("id", profile.id);

                // Record payment
                await supabaseClient.from("stripe_payments").insert({
                    user_id: profile.id,
                    stripe_customer_id: subscription.customer as string,
                    stripe_subscription_id: subscriptionId,
                    stripe_payment_intent_id: invoice.payment_intent as string,
                    amount: invoice.amount_paid / 100,
                    currency: invoice.currency || "usd",
                    status: "succeeded",
                    event_type: event.type,
                    event_id: event.id,
                    metadata: {
                        invoice_id: invoice.id,
                        subscription_id: subscriptionId,
                    },
                });

                console.log(`Subscription renewed for user ${profile.id}`);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                const subscriptionId = subscription.id;

                // Find user by subscription ID
                const { data: profile } = await supabaseClient
                    .from("profiles")
                    .select("id")
                    .eq("stripe_subscription_id", subscriptionId)
                    .single();

                if (!profile) {
                    console.error(
                        `No profile found for subscription ${subscriptionId}`,
                    );
                    break;
                }

                // Update profile to free tier
                await supabaseClient
                    .from("profiles")
                    .update({
                        subscription_tier: "free",
                        subscription_started_at: null,
                        subscription_expires_at: null,
                        stripe_subscription_id: null,
                    })
                    .eq("id", profile.id);

                // Record cancellation event
                await supabaseClient.from("stripe_payments").insert({
                    user_id: profile.id,
                    stripe_customer_id: subscription.customer as string,
                    stripe_subscription_id: subscriptionId,
                    amount: 0,
                    currency: "usd",
                    status: "canceled",
                    event_type: event.type,
                    event_id: event.id,
                    metadata: {
                        subscription_id: subscriptionId,
                        canceled_at: subscription.canceled_at
                            ? new Date(subscription.canceled_at * 1000)
                                .toISOString()
                            : null,
                    },
                });

                console.log(`Subscription cancelled for user ${profile.id}`);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object;
                const subscriptionId = invoice.subscription as string;

                if (!subscriptionId) {
                    break;
                }

                // Find user by subscription ID
                const { data: profile } = await supabaseClient
                    .from("profiles")
                    .select("id")
                    .eq("stripe_subscription_id", subscriptionId)
                    .single();

                if (!profile) {
                    break;
                }

                // Record failed payment
                await supabaseClient.from("stripe_payments").insert({
                    user_id: profile.id,
                    stripe_customer_id: invoice.customer as string,
                    stripe_subscription_id: subscriptionId,
                    stripe_payment_intent_id: invoice.payment_intent as string,
                    amount: invoice.amount_due / 100,
                    currency: invoice.currency || "usd",
                    status: "failed",
                    event_type: event.type,
                    event_id: event.id,
                    metadata: {
                        invoice_id: invoice.id,
                        subscription_id: subscriptionId,
                        attempt_count: invoice.attempt_count,
                    },
                });

                console.log(`Payment failed for user ${profile.id}`);
                // Note: We don't cancel the subscription immediately - Stripe will retry
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(
            JSON.stringify({ received: true }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error processing webhook:", error);

        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});
