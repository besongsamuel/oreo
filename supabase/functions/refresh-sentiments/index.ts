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

        const { data: activeRun } = await supabaseClient
            .from("sentiment_analysis_runs")
            .select("id, status, started_at")
            .eq("company_id", companyId)
            .in("status", ["pending", "in_progress"])
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (activeRun) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error:
                        "Sentiment analysis is already in progress for this company.",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 409,
                },
            );
        }

        const { data: unprocessedCount, error: unprocessedCountError } =
            await supabaseClient.rpc("get_unprocessed_reviews_count", {
                company_uuid: companyId,
            });

        if (unprocessedCountError) {
            console.error(
                "Error fetching unprocessed reviews count:",
                unprocessedCountError,
            );
            return new Response(
                JSON.stringify({
                    success: false,
                    error:
                        "Unable to determine pending reviews for sentiment analysis.",
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

        const totalReviewsToProcess = unprocessedCount || 0;

        if (totalReviewsToProcess === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error:
                        "No unprocessed reviews available for sentiment analysis.",
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

        const { data: runRecord, error: runInsertError } = await supabaseClient
            .from("sentiment_analysis_runs")
            .insert({
                company_id: companyId,
                status: "pending",
                total_reviews: totalReviewsToProcess,
                triggered_by: user.id,
                started_at: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (runInsertError || !runRecord) {
            console.error(
                "Failed to create sentiment analysis run record:",
                runInsertError,
            );
            return new Response(
                JSON.stringify({
                    success: false,
                    error:
                        "Unable to start sentiment analysis tracking for this company.",
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

        const payload = {
            ...body,
            company_id: companyId,
            run_id: runRecord.id,
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
                    await supabaseClient
                        .from("sentiment_analysis_runs")
                        .update({
                            status: "failed",
                            error_details:
                                `Failed to invoke sentiment-analysis: ${res.status} ${text}`,
                            completed_at: new Date().toISOString(),
                        })
                        .eq("id", runRecord.id);
                } else {
                    console.log("sentiment-analysis response", text);
                }
            })
            .catch((err) => {
                console.error("sentiment-analysis call error", err);
                supabaseClient
                    .from("sentiment_analysis_runs")
                    .update({
                        status: "failed",
                        error_details: `Invocation error: ${
                            err instanceof Error ? err.message : String(err)
                        }`,
                        completed_at: new Date().toISOString(),
                    })
                    .eq("id", runRecord.id)
                    .then(({ error }) => {
                        if (error) {
                            console.error(
                                "Failed to update run after invocation error:",
                                error,
                            );
                        }
                    });
            });

        return new Response(
            JSON.stringify({
                success: true,
                run_id: runRecord.id,
                total_reviews: totalReviewsToProcess,
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
