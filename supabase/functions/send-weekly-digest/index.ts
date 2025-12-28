import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import {
    getPreviousWeekDates,
    isFirstMondayOfMonth,
} from "../_shared/date-utils.ts";
import {
    checkDuplicateSend,
    getPositiveNegativeKeywords,
    getRecipientsWithReviews,
    getReviewsByBranch,
    getReviewsByPlatform,
    getReviewStats,
    getUnansweredReviewsCount,
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
 * Format reviews by platform and branch as HTML list
 */
function formatReviewsByPlatformBranch(
    byPlatform: Array<{ platform_name: string; count: number }>,
    byBranch: Array<{ branch_name: string; count: number }>,
    language: string,
): string {
    const items: string[] = [];
    const isEnglish = language === "en";
    const reviewText = isEnglish ? "review" : "avis";
    const reviewsText = isEnglish ? "reviews" : "avis";
    const noDataText = isEnglish
        ? "<li>No reviews available</li>"
        : "<li>Aucun avis disponible</li>";

    // Show platforms first
    for (const platform of byPlatform) {
        const countText = platform.count === 1 ? reviewText : reviewsText;
        items.push(
            `<li><span class="review-platform">${platform.count} ${countText} ${platform.platform_name}</span></li>`,
        );
    }

    // Then show branches
    for (const branch of byBranch) {
        const countText = branch.count === 1 ? reviewText : reviewsText;
        items.push(
            `<li><span class="review-platform">${branch.count} ${countText}</span> <span class="review-branch">- ${branch.branch_name}</span></li>`,
        );
    }

    if (items.length === 0) {
        return noDataText;
    }

    return items.join("");
}

/**
 * Format weekly trends as HTML list
 */
function formatWeeklyTrends(
    sentimentGeneral: string,
    mostFrequentKeyword: string,
    positivePoints: Array<{ text: string; count: number }>,
    negativePoints: Array<{ text: string; count: number }>,
    language: string,
): string {
    const items: string[] = [];
    const isEnglish = language === "en";

    // General sentiment
    const sentimentLabel = isEnglish
        ? "General sentiment of the week:"
        : "Sentiment général de la semaine :";
    items.push(
        `<li><strong>${sentimentLabel}</strong> ${sentimentGeneral}</li>`,
    );

    // Most frequent keyword
    if (mostFrequentKeyword) {
        const keywordLabel = isEnglish
            ? "Most frequent keyword:"
            : "Mot-clé le plus fréquent :";
        items.push(
            `<li><strong>${keywordLabel}</strong> ${mostFrequentKeyword}</li>`,
        );
    }

    // Positive points
    if (positivePoints.length > 0) {
        const positiveList = positivePoints
            .slice(0, 3)
            .map((p) => p.text)
            .join(", ");
        const positiveLabel = isEnglish
            ? "Points appreciated by customers:"
            : "Points appréciés par les clients :";
        items.push(
            `<li><strong>${positiveLabel}</strong> ${positiveList}</li>`,
        );
    }

    // Negative points
    if (negativePoints.length > 0) {
        const negativeList = negativePoints
            .slice(0, 3)
            .map((p) => p.text)
            .join(", ");
        const negativeLabel = isEnglish
            ? "Negative points:"
            : "Points négatifs :";
        items.push(
            `<li><strong>${negativeLabel}</strong> ${negativeList}</li>`,
        );
    }

    return items.join("");
}

/**
 * Generate key highlights for weekly digest
 */
function generateKeyHighlights(
    stats: ReviewStats,
    unansweredCount: number,
    language: string,
): string {
    const highlights: string[] = [];

    if (language === "en") {
        if (stats.total_reviews > 0) {
            highlights.push(
                `${stats.total_reviews} review${
                    stats.total_reviews > 1 ? "s" : ""
                } received this week`,
            );
        }
        if (stats.average_rating >= 4.5) {
            highlights.push(
                `Excellent average rating of ${
                    stats.average_rating.toFixed(1)
                }/5`,
            );
        } else if (stats.average_rating >= 4.0) {
            highlights.push(
                `Strong average rating of ${stats.average_rating.toFixed(1)}/5`,
            );
        }
        if (unansweredCount > 0) {
            highlights.push(
                `${unansweredCount} unanswered review${
                    unansweredCount > 1 ? "s" : ""
                } requiring attention`,
            );
        }
    } else {
        if (stats.total_reviews > 0) {
            highlights.push(
                `${stats.total_reviews} avis reçu${
                    stats.total_reviews > 1 ? "s" : ""
                } cette semaine`,
            );
        }
        if (stats.average_rating >= 4.5) {
            highlights.push(
                `Note moyenne excellente de ${
                    stats.average_rating.toFixed(1)
                }/5`,
            );
        } else if (stats.average_rating >= 4.0) {
            highlights.push(
                `Bonne note moyenne de ${stats.average_rating.toFixed(1)}/5`,
            );
        }
        if (unansweredCount > 0) {
            highlights.push(
                `${unansweredCount} avis non répondu${
                    unansweredCount > 1 ? "s" : ""
                } nécessitant votre attention`,
            );
        }
    }

    if (highlights.length === 0) {
        return language === "en"
            ? "<li>New reviews received this week</li>"
            : "<li>Nouveaux avis reçus cette semaine</li>";
    }

    return highlights.map((h) => `<li>${h}</li>`).join("");
}

/**
 * Generate a weekly recommendation based on stats
 */
function generateWeeklyRecommendation(
    unansweredCount: number,
    negativeCount: number,
    totalReviews: number,
    language: string,
): string {
    if (language === "en") {
        if (unansweredCount > 0) {
            return `Respond to the ${unansweredCount} unanswered review${
                unansweredCount > 1 ? "s" : ""
            } to improve your customer engagement.`;
        }
        if (negativeCount > 0 && totalReviews > 0) {
            const negativePercent = Math.round(
                (negativeCount / totalReviews) * 100,
            );
            if (negativePercent > 20) {
                return `Monitor the issues mentioned in negative reviews (${negativePercent}% of reviews).`;
            }
        }
        return "Continue maintaining the quality of service for your customers.";
    } else {
        if (unansweredCount > 0) {
            return `Répondez aux ${unansweredCount} avis non répondus pour améliorer votre engagement client.`;
        }
        if (negativeCount > 0 && totalReviews > 0) {
            const negativePercent = Math.round(
                (negativeCount / totalReviews) * 100,
            );
            if (negativePercent > 20) {
                return `Surveillez les irritants mentionnés dans les avis négatifs (${negativePercent}% des avis).`;
            }
        }
        return "Continuez à maintenir la qualité de service pour vos clients.";
    }
}

/**
 * Process and send weekly digest emails
 */
async function processWeeklyDigest(
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
    // For cron triggers: filter by weekly_digest_enabled flag
    // For manual triggers: bypass filter (null) to allow admin validation
    let recipients: Awaited<ReturnType<typeof getRecipientsWithReviews>>;
    try {
        const emailType = trigger === "cron" && !recipientOverride
            ? "weekly_digest"
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
        console.log("No recipients found for weekly digest");
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
                    email_type: "weekly_digest",
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
                "weekly_digest",
                startDate,
                endDate,
                recipient.company_id,
            );

            if (isDuplicate) {
                await logEmailAttempt(supabase, {
                    email_type: "weekly_digest",
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

            // Get additional data for weekly digest
            const [
                reviewsByPlatform,
                reviewsByBranch,
                unansweredCount,
                keywordsData,
            ] = await Promise.all([
                getReviewsByPlatform(
                    supabase,
                    recipient.company_id,
                    startDate,
                    endDate,
                ),
                getReviewsByBranch(
                    supabase,
                    recipient.company_id,
                    startDate,
                    endDate,
                ),
                getUnansweredReviewsCount(
                    supabase,
                    recipient.company_id,
                    startDate,
                    endDate,
                ),
                getPositiveNegativeKeywords(
                    supabase,
                    recipient.company_id,
                    startDate,
                    endDate,
                ),
            ]);

            // Get user language preference
            const userLanguage = recipient.preferred_language || "fr";
            const isEnglish = userLanguage === "en";

            // Determine general sentiment
            const totalSentiment = stats.sentiment_breakdown.positive +
                stats.sentiment_breakdown.negative +
                stats.sentiment_breakdown.neutral;
            let sentimentGeneral = isEnglish ? "Neutral" : "Neutre";
            if (totalSentiment > 0) {
                const positivePercent =
                    (stats.sentiment_breakdown.positive / totalSentiment) * 100;
                const negativePercent =
                    (stats.sentiment_breakdown.negative / totalSentiment) * 100;
                if (positivePercent > 60) {
                    sentimentGeneral = isEnglish
                        ? "Very positive"
                        : "Très positif";
                } else if (positivePercent > 40) {
                    sentimentGeneral = isEnglish
                        ? "Rather positive"
                        : "Plutôt positif";
                } else if (negativePercent > 40) {
                    sentimentGeneral = isEnglish
                        ? "Rather negative"
                        : "Plutôt négatif";
                } else if (negativePercent > 20) {
                    sentimentGeneral = isEnglish ? "Mixed" : "Mixte";
                }
            }

            // Get most frequent keyword
            const mostFrequentKeyword = stats.top_keywords.length > 0
                ? stats.top_keywords[0].text
                : "";

            // Format date range based on language
            const locale = isEnglish ? "en-US" : "fr-FR";
            const periodStart = startDate.toLocaleDateString(locale, {
                day: "numeric",
                month: "long",
            });
            const periodEnd = endDate.toLocaleDateString(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
            });

            // Prepare template data for Resend template
            const templateData = {
                company_name: recipient.company_name,
                period_start: periodStart,
                period_end: periodEnd,
                key_highlights: generateKeyHighlights(
                    stats,
                    unansweredCount,
                    userLanguage,
                ),
                reviews_by_platform_branch: formatReviewsByPlatformBranch(
                    reviewsByPlatform,
                    reviewsByBranch,
                    userLanguage,
                ),
                unanswered_reviews_count: unansweredCount.toString(),
                weekly_trends: formatWeeklyTrends(
                    sentimentGeneral,
                    mostFrequentKeyword,
                    keywordsData.positive,
                    keywordsData.negative,
                    userLanguage,
                ),
                weekly_recommendation: generateWeeklyRecommendation(
                    unansweredCount,
                    stats.sentiment_breakdown.negative,
                    stats.total_reviews,
                    userLanguage,
                ),
                cta_url: ctaUrl,
            };

            // Select template based on user language
            const templateId = isEnglish
                ? "weekly-review-summary-en"
                : "weekly-review-summary-fr";

            // Send email using Resend template
            const subject = isEnglish
                ? `Weekly Review Summary - ${recipient.company_name}`
                : `Résumé hebdomadaire des avis - ${recipient.company_name}`;
            await sendEmail(
                resend,
                recipient.owner_email,
                subject,
                templateId,
                templateData,
            );

            // Log success
            await logEmailAttempt(supabase, {
                email_type: "weekly_digest",
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
                `Sent weekly digest to ${recipient.owner_email} for ${recipient.company_name}`,
            );
        } catch (error) {
            const errorMsg =
                `Failed to process ${recipient.owner_email} for ${recipient.company_name}: ${error}`;
            console.error(errorMsg);

            // Log failure
            try {
                await logEmailAttempt(supabase, {
                    email_type: "weekly_digest",
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
            // Check if this Monday is the 1st of the month (skip weekly digest)
            if (isFirstMondayOfMonth(now)) {
                return new Response(
                    JSON.stringify({
                        success: true,
                        message:
                            "Skipped: Weekly digest not sent on Monthly Report week",
                        skipped: true,
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

            const dates = getPreviousWeekDates(now);
            startDate = dates.start;
            endDate = dates.end;
        } else {
            // Manual trigger: use targetDate to calculate previous week
            if (!targetDate) {
                throw new Error("targetDate is required for manual triggers");
            }
            const target = new Date(targetDate);
            const dates = getPreviousWeekDates(target);
            startDate = dates.start;
            endDate = dates.end;
        }

        console.log(
            `Processing weekly digest for period: ${startDate.toISOString()} to ${endDate.toISOString()}`,
        );

        // Process weekly digest
        const results = await processWeeklyDigest(
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
                message: "Weekly digest processing completed",
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
        console.error("Error in send-weekly-digest:", error);
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



