import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");

        if (!authHeader) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Missing authorization header",
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

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error("Supabase environment variables are not set");
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Service is misconfigured",
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

        const supabaseAuthClient = createClient(
            supabaseUrl,
            supabaseServiceKey,
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            },
        );
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        const {
            data: { user },
            error: authError,
        } = await supabaseAuthClient.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized" }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 401,
                },
            );
        }

        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || profile?.role !== "admin") {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Access denied",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 403,
                },
            );
        }

        const body = await req.json().catch(() => null);
        const companyId = body?.company_id;

        if (!companyId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "company_id is required",
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

        const { data: company, error: companyError } = await supabaseClient
            .from("companies")
            .select("id")
            .eq("id", companyId)
            .single();

        if (companyError || !company) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Company not found",
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

        const payload = {
            ...body,
            company_id: companyId,
        };

        fetch(
            `${supabaseUrl}/functions/v1/sentiment-analysis`,
            {
                method: "POST",
                headers: {
                    "X-Internal-Key": supabaseServiceKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            },
        )
            .then(async (res) => {
                const text = await res.text();
                if (!res.ok) {
                    console.error(
                        "sentiment-analysis call failed",
                        res.status,
                        text,
                    );
                } else {
                    console.log("sentiment-analysis response", text);
                }
            })
            .catch((err) => {
                console.error("sentiment-analysis call error", err);
            });

        return new Response(
            JSON.stringify({
                success: true,
                message:
                    "Sentiment analysis has been started. It may take a few minutes to complete.",
            }),
            {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
                status: 202,
            },
        );
    } catch (error) {
        console.error("Error in refresh-sentiments proxy:", error);
        const message = error instanceof Error
            ? error.message
            : "Unknown error";

        return new Response(
            JSON.stringify({
                success: false,
                error: message,
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
});
