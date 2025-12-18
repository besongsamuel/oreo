import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import {
    formatMonthYear,
    getPreviousMonthDates,
} from "../_shared/date-utils.ts";
import {
    checkDuplicateSend,
    getRecipientsWithReviews,
    getReviewStats,
    logEmailAttempt,
    type ReviewStats,
    sendEmail,
} from "../_shared/email-utils.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface RequestPayload {
    trigger: "cron" | "manual";
    targetDate?: string; // ISO date (required for manual)
    companyId?: string; // optional, filter to specific company (manual only)
    recipientOverride?: string; // optional, for testing
}

/**
 * Validate admin access for manual triggers
 */
async function validateAdminAccess(
    authHeader: string | null,
    supabase: SupabaseClient,
): Promise<boolean> {
    if (!authHeader) {
        return false;
    }

    try {
        const token = authHeader.replace("Bearer ", "");
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return false;
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return false;
        }

        return profile.role === "admin";
    } catch (error) {
        console.error("Error validating admin access:", error);
        return false;
    }
}

/**
 * Format keywords as HTML list items
 */
function formatKeywords(keywords: ReviewStats["top_keywords"]): string {
    if (!keywords || keywords.length === 0) {
        return '<li class="keyword-item">No keywords available</li>';
    }

    return keywords
        .map(
            (kw) =>
                `<li class="keyword-item">${kw.text} <span style="color: #86868b; font-size: 12px;">(${kw.count})</span></li>`,
        )
        .join("");
}

/**
 * Process and send monthly report emails
 */
async function processMonthlyReport(
    supabase: SupabaseClient,
    resend: Resend,
    startDate: Date,
    endDate: Date,
    trigger: "cron" | "manual",
    recipientOverride?: string,
    companyId?: string,
): Promise<{
    sent: number;
    skipped: number;
    failed: number;
    errors: string[];
}> {
    const results = {
        sent: 0,
        skipped: 0,
        failed: 0,
        errors: [] as string[],
    };

    // Get recipients
    // For cron triggers: filter by monthly_digest_enabled flag
    // For manual triggers: bypass filter (null) to allow admin validation
    let recipients: Awaited<ReturnType<typeof getRecipientsWithReviews>>;
    try {
        const emailType = trigger === "cron" && !recipientOverride
            ? "monthly_report"
            : null; // null = bypass filter for manual/admin triggers
        recipients = await getRecipientsWithReviews(
            supabase,
            startDate,
            endDate,
            emailType,
            companyId, // Filter by company if provided (manual triggers only)
        );
    } catch (error) {
        const errorMsg = `Failed to get recipients: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
        return results;
    }

    // If recipientOverride is provided, filter to that email only
    if (recipientOverride) {
        recipients = recipients.filter((r) =>
            r.owner_email === recipientOverride
        );
    }

    if (recipients.length === 0) {
        console.log("No recipients found for monthly report");
        return results;
    }

    // Get Supabase URL for CTA link
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const ctaUrl = supabaseUrl.replace("/rest/v1", "") || "https://boresha.ca";

    // Process each recipient
    for (const recipient of recipients) {
        try {
            // Get review stats for this company
            const stats = await getReviewStats(
                supabase,
                recipient.company_id,
                startDate,
                endDate,
            );

            // Review count guard: skip if no reviews
            if (stats.total_reviews === 0) {
                await logEmailAttempt(supabase, {
                    email_type: "monthly_report",
                    period_start: startDate,
                    period_end: endDate,
                    trigger_type: recipientOverride ? "manual" : "cron",
                    status: "skipped",
                    skip_reason: "no_reviews",
                    recipient_email: recipient.owner_email,
                    company_id: recipient.company_id,
                    total_reviews: 0,
                });
                results.skipped++;
                continue;
            }

            // Check for duplicate send
            const isDuplicate = await checkDuplicateSend(
                supabase,
                "monthly_report",
                startDate,
                endDate,
                recipient.company_id,
            );

            if (isDuplicate) {
                await logEmailAttempt(supabase, {
                    email_type: "monthly_report",
                    period_start: startDate,
                    period_end: endDate,
                    trigger_type: recipientOverride ? "manual" : "cron",
                    status: "skipped",
                    skip_reason: "duplicate_send",
                    recipient_email: recipient.owner_email,
                    company_id: recipient.company_id,
                    total_reviews: stats.total_reviews,
                });
                results.skipped++;
                continue;
            }

            // Format month for display
            const periodMonth = formatMonthYear(startDate);

            // Prepare template data for Resend template
            const templateData = {
                company_name: recipient.company_name,
                period_month: periodMonth,
                total_reviews: stats.total_reviews.toString(),
                average_rating: stats.average_rating.toFixed(2),
                sentiment_positive: stats.sentiment_breakdown.positive
                    .toString(),
                sentiment_neutral: stats.sentiment_breakdown.neutral.toString(),
                sentiment_negative: stats.sentiment_breakdown.negative
                    .toString(),
                top_keywords: formatKeywords(stats.top_keywords),
                cta_url: ctaUrl,
            };

            // Send email using Resend template
            const subject =
                `Your Monthly Review Report - ${recipient.company_name}`;
            await sendEmail(
                resend,
                recipient.owner_email,
                subject,
                "monthly-performance-review",
                templateData,
            );

            // Log success
            await logEmailAttempt(supabase, {
                email_type: "monthly_report",
                period_start: startDate,
                period_end: endDate,
                trigger_type: recipientOverride ? "manual" : "cron",
                status: "sent",
                recipient_email: recipient.owner_email,
                company_id: recipient.company_id,
                total_reviews: stats.total_reviews,
            });

            results.sent++;
            console.log(
                `Sent monthly report to ${recipient.owner_email} for ${recipient.company_name}`,
            );
        } catch (error) {
            const errorMsg =
                `Failed to process ${recipient.owner_email} for ${recipient.company_name}: ${error}`;
            console.error(errorMsg);

            // Log failure
            try {
                await logEmailAttempt(supabase, {
                    email_type: "monthly_report",
                    period_start: startDate,
                    period_end: endDate,
                    trigger_type: recipientOverride ? "manual" : "cron",
                    status: "failed",
                    recipient_email: recipient.owner_email,
                    company_id: recipient.company_id,
                    total_reviews: 0,
                    error_message: error instanceof Error
                        ? error.message
                        : String(error),
                });
            } catch (logError) {
                console.error("Failed to log error:", logError);
            }

            results.failed++;
            results.errors.push(errorMsg);
            // Continue processing other recipients
        }
    }

    return results;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Check request method
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

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Supabase environment variables are not set");
        }

        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Initialize Resend
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) {
            throw new Error("RESEND_API_KEY environment variable is not set");
        }
        const resend = new Resend(resendApiKey);

        // Parse request payload
        let payload: RequestPayload;
        try {
            payload = await req.json();
        } catch (_parseError) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Invalid request body",
                    message: "Request body must be valid JSON",
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

        const { trigger, targetDate, companyId, recipientOverride } = payload;

        // Validate trigger type
        if (trigger !== "cron" && trigger !== "manual") {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Invalid trigger type",
                    message: "trigger must be 'cron' or 'manual'",
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

        // Validate admin access for manual triggers
        if (trigger === "manual") {
            const authHeader = req.headers.get("Authorization");
            const isAdmin = await validateAdminAccess(
                authHeader,
                supabaseClient,
            );

            if (!isAdmin) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Unauthorized",
                        message: "Admin access required for manual triggers",
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

            if (!targetDate) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Missing targetDate",
                        message: "targetDate is required for manual triggers",
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

        // Calculate date range
        let startDate: Date;
        let endDate: Date;

        if (trigger === "cron") {
            const now = new Date();
            const dates = getPreviousMonthDates(now);
            startDate = dates.start;
            endDate = dates.end;
        } else {
            // Manual trigger: use targetDate to calculate previous month
            if (!targetDate) {
                throw new Error("targetDate is required for manual triggers");
            }
            const target = new Date(targetDate);
            const dates = getPreviousMonthDates(target);
            startDate = dates.start;
            endDate = dates.end;
        }

        console.log(
            `Processing monthly report for period: ${startDate.toISOString()} to ${endDate.toISOString()}`,
        );

        // Process monthly report
        const results = await processMonthlyReport(
            supabaseClient,
            resend,
            startDate,
            endDate,
            trigger,
            recipientOverride,
            companyId,
        );

        return new Response(
            JSON.stringify({
                success: true,
                message: "Monthly report processing completed",
                period: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                },
                results: {
                    sent: results.sent,
                    skipped: results.skipped,
                    failed: results.failed,
                },
                errors: results.errors.length > 0 ? results.errors : undefined,
            }),
            {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error in send-monthly-report:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error";

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
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
