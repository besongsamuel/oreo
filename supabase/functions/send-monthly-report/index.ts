import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { getPreviousMonthDates } from "../_shared/date-utils.ts";
import {
    checkDuplicateSend,
    getPositiveNegativeKeywords,
    getPreviousMonthStats,
    getRecipientsWithReviews,
    getReviewsByBranch,
    getReviewsByPlatform,
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
 * Format reviews by platform as HTML list
 */
function formatReviewsByPlatform(
    byPlatform: Array<{ platform_name: string; count: number }>,
    language: string,
): string {
    const isEnglish = language === "en";
    const reviewText = isEnglish ? "review" : "avis";
    const reviewsText = isEnglish ? "reviews" : "avis";
    const noDataText = isEnglish
        ? "<li>No data available</li>"
        : "<li>Aucune donnée disponible</li>";

    if (byPlatform.length === 0) {
        return noDataText;
    }
    return byPlatform
        .map(
            (p) => {
                const countText = p.count === 1 ? reviewText : reviewsText;
                return `<li><span class="distribution-name">${p.platform_name}:</span> ${p.count} ${countText}</li>`;
            },
        )
        .join("");
}

/**
 * Format reviews by branch as HTML list
 */
function formatReviewsByBranch(
    byBranch: Array<{ branch_name: string; count: number }>,
    language: string,
): string {
    const isEnglish = language === "en";
    const reviewText = isEnglish ? "review" : "avis";
    const reviewsText = isEnglish ? "reviews" : "avis";
    const noDataText = isEnglish
        ? "<li>No data available</li>"
        : "<li>Aucune donnée disponible</li>";

    if (byBranch.length === 0) {
        return noDataText;
    }
    return byBranch
        .map(
            (b) => {
                const countText = b.count === 1 ? reviewText : reviewsText;
                return `<li><span class="distribution-name">${b.branch_name}:</span> ${b.count} ${countText}</li>`;
            },
        )
        .join("");
}

/**
 * Format monthly trends as HTML list
 */
function formatMonthlyTrends(
    positivePoints: Array<{ text: string; count: number }>,
    negativePoints: Array<{ text: string; count: number }>,
    topKeywords: Array<{ text: string; count: number }>,
    notableChange: string,
    language: string,
): string {
    const items: string[] = [];
    const isEnglish = language === "en";

    // Positive points
    if (positivePoints.length > 0) {
        const positiveList = positivePoints
            .slice(0, 5)
            .map((p) => `${p.text} (${p.count})`)
            .join(", ");
        const positiveLabel = isEnglish
            ? "Points most appreciated by customers:"
            : "Les points que les clients ont le plus appréciés :";
        items.push(
            `<li><strong>${positiveLabel}</strong> ${positiveList}</li>`,
        );
    }

    // Negative points / Irritants
    if (negativePoints.length > 0) {
        const negativeList = negativePoints
            .slice(0, 5)
            .map((p) => `${p.text} (${p.count})`)
            .join(", ");
        const negativeLabel = isEnglish
            ? "Most frequent irritants:"
            : "Les irritants les plus fréquents :";
        items.push(
            `<li><strong>${negativeLabel}</strong> ${negativeList}</li>`,
        );
    }

    // Important keywords
    if (topKeywords.length > 0) {
        const keywordsList = topKeywords
            .slice(0, 5)
            .map((k) => k.text)
            .join(", ");
        const keywordsLabel = isEnglish
            ? "Important keywords of the month:"
            : "Mots-clés importants du mois :";
        items.push(
            `<li><strong>${keywordsLabel}</strong> ${keywordsList}</li>`,
        );
    }

    // Notable change
    if (notableChange) {
        const changeLabel = isEnglish
            ? "Notable change observed this month:"
            : "Changement marquant observé ce mois-ci :";
        items.push(
            `<li><strong>${changeLabel}</strong> ${notableChange}</li>`,
        );
    }

    return items.join("");
}

/**
 * Format month comparison as HTML
 */
function formatMonthComparison(
    currentStats: ReviewStats,
    previousStats: ReviewStats | null,
    language: string,
): string {
    const isEnglish = language === "en";
    const noDataText = isEnglish
        ? '<div class="comparison-content">Previous month data not available for comparison.</div>'
        : '<div class="comparison-content">Données du mois précédent non disponibles pour comparaison.</div>';

    if (!previousStats) {
        return noDataText;
    }

    const items: string[] = [];

    // Calculate variations
    const ratingDiff = currentStats.average_rating -
        previousStats.average_rating;
    const reviewsDiff = currentStats.total_reviews -
        previousStats.total_reviews;
    const positiveDiff = currentStats.sentiment_breakdown.positive -
        previousStats.sentiment_breakdown.positive;
    const negativeDiff = currentStats.sentiment_breakdown.negative -
        previousStats.sentiment_breakdown.negative;

    // What's improving
    const improvements: string[] = [];
    if (ratingDiff > 0) {
        if (isEnglish) {
            improvements.push(
                `Average rating increased by ${ratingDiff.toFixed(1)} point`,
            );
        } else {
            improvements.push(
                `Note moyenne en hausse de ${ratingDiff.toFixed(1)} point`,
            );
        }
    }
    if (positiveDiff > 0) {
        if (isEnglish) {
            improvements.push(
                `${positiveDiff} additional positive review${
                    positiveDiff > 1 ? "s" : ""
                }`,
            );
        } else {
            improvements.push(`${positiveDiff} avis positifs supplémentaires`);
        }
    }
    if (reviewsDiff > 0) {
        if (isEnglish) {
            improvements.push(
                `${reviewsDiff} additional review${reviewsDiff > 1 ? "s" : ""}`,
            );
        } else {
            improvements.push(`${reviewsDiff} avis supplémentaires`);
        }
    }

    if (improvements.length > 0) {
        const improvingTitle = isEnglish
            ? "✅ What's Improving"
            : "✅ Ce qui s'améliore";
        items.push(
            `<div class="comparison-box improving">
                <div class="comparison-title">${improvingTitle}</div>
                <div class="comparison-content">${improvements.join(", ")}</div>
            </div>`,
        );
    }

    // What's degrading
    const degradations: string[] = [];
    if (ratingDiff < 0) {
        if (isEnglish) {
            degradations.push(
                `Average rating decreased by ${
                    Math.abs(ratingDiff).toFixed(1)
                } point`,
            );
        } else {
            degradations.push(
                `Note moyenne en baisse de ${
                    Math.abs(ratingDiff).toFixed(1)
                } point`,
            );
        }
    }
    if (negativeDiff > 0) {
        if (isEnglish) {
            degradations.push(
                `${negativeDiff} additional negative review${
                    negativeDiff > 1 ? "s" : ""
                }`,
            );
        } else {
            degradations.push(`${negativeDiff} avis négatifs supplémentaires`);
        }
    }

    if (degradations.length > 0) {
        const degradingTitle = isEnglish
            ? "⚠️ What's Degrading"
            : "⚠️ Ce qui se dégrade";
        items.push(
            `<div class="comparison-box degrading">
                <div class="comparison-title">${degradingTitle}</div>
                <div class="comparison-content">${degradations.join(", ")}</div>
            </div>`,
        );
    }

    // Variation du sentiment global
    const prevTotal = previousStats.sentiment_breakdown.positive +
        previousStats.sentiment_breakdown.negative +
        previousStats.sentiment_breakdown.neutral;
    const currTotal = currentStats.sentiment_breakdown.positive +
        currentStats.sentiment_breakdown.negative +
        currentStats.sentiment_breakdown.neutral;

    if (prevTotal > 0 && currTotal > 0) {
        const prevPositivePercent =
            (previousStats.sentiment_breakdown.positive / prevTotal) * 100;
        const currPositivePercent =
            (currentStats.sentiment_breakdown.positive / currTotal) * 100;
        const sentimentVariation = currPositivePercent - prevPositivePercent;

        if (Math.abs(sentimentVariation) > 5) {
            const variationText = sentimentVariation > 0
                ? `+${sentimentVariation.toFixed(1)}%`
                : `${sentimentVariation.toFixed(1)}%`;
            const sentimentLabel = isEnglish
                ? "Global sentiment variation:"
                : "Variation du sentiment global :";
            const sentimentSuffix = isEnglish
                ? "of positive reviews"
                : "d'avis positifs";
            items.push(
                `<div class="comparison-content" style="margin-top: 15px;">
                    <strong>${sentimentLabel}</strong> ${variationText} ${sentimentSuffix}
                </div>`,
            );
        }
    }

    return items.join("");
}

/**
 * Generate monthly recommendations
 */
function generateMonthlyRecommendations(
    stats: ReviewStats,
    keywordsData: {
        positive: Array<{ text: string }>;
        negative: Array<{ text: string }>;
    },
    language: string,
): string[] {
    const recommendations: string[] = [];
    const isEnglish = language === "en";

    // Recommendation based on negative keywords
    if (keywordsData.negative.length > 0) {
        const topNegative = keywordsData.negative[0].text;
        if (isEnglish) {
            recommendations.push(
                `Improve ${topNegative} - This is the most frequently mentioned negative point.`,
            );
        } else {
            recommendations.push(
                `Améliorer ${topNegative} - C'est le point le plus souvent mentionné négativement.`,
            );
        }
    }

    // Recommendation based on sentiment
    const totalSentiment = stats.sentiment_breakdown.positive +
        stats.sentiment_breakdown.negative + stats.sentiment_breakdown.neutral;
    if (totalSentiment > 0) {
        const negativePercent =
            (stats.sentiment_breakdown.negative / totalSentiment) * 100;
        if (negativePercent > 30) {
            if (isEnglish) {
                recommendations.push(
                    "Standardize service - The percentage of negative reviews is high.",
                );
            } else {
                recommendations.push(
                    "Uniformiser le service - Le pourcentage d'avis négatifs est élevé.",
                );
            }
        } else if (stats.average_rating < 4.0) {
            if (isEnglish) {
                recommendations.push(
                    "Optimize overall quality - The average rating can be improved.",
                );
            } else {
                recommendations.push(
                    "Optimiser la qualité globale - La note moyenne peut être améliorée.",
                );
            }
        }
    }

    // Default recommendation if we don't have 3 yet
    if (recommendations.length < 3) {
        if (isEnglish) {
            recommendations.push(
                "Continue soliciting customer reviews to maintain visibility.",
            );
        } else {
            recommendations.push(
                "Continuer à solliciter les avis clients pour maintenir la visibilité.",
            );
        }
    }

    return recommendations.slice(0, 3);
}

/**
 * Generate executive summary for monthly report
 */
function generateExecutiveSummary(
    stats: ReviewStats,
    ratingVariation: string,
    language: string,
): string {
    const isEnglish = language === "en";

    const parts: string[] = [];

    if (isEnglish) {
        parts.push(
            `This month, you received ${stats.total_reviews} review${
                stats.total_reviews !== 1 ? "s" : ""
            }`,
        );
        if (stats.average_rating >= 4.5) {
            parts.push(
                `with an excellent average rating of ${
                    stats.average_rating.toFixed(1)
                }/5`,
            );
        } else if (stats.average_rating >= 4.0) {
            parts.push(
                `with a strong average rating of ${
                    stats.average_rating.toFixed(1)
                }/5`,
            );
        } else {
            parts.push(
                `with an average rating of ${
                    stats.average_rating.toFixed(1)
                }/5`,
            );
        }
        if (
            ratingVariation && ratingVariation !== "N/A" &&
            ratingVariation !== "0%"
        ) {
            parts.push(`(${ratingVariation} compared to last month)`);
        }
        parts.push(".");
    } else {
        parts.push(`Ce mois-ci, vous avez reçu ${stats.total_reviews} avis`);
        if (stats.average_rating >= 4.5) {
            parts.push(
                `avec une note moyenne excellente de ${
                    stats.average_rating.toFixed(1)
                }/5`,
            );
        } else if (stats.average_rating >= 4.0) {
            parts.push(
                `avec une bonne note moyenne de ${
                    stats.average_rating.toFixed(1)
                }/5`,
            );
        } else {
            parts.push(
                `avec une note moyenne de ${stats.average_rating.toFixed(1)}/5`,
            );
        }
        if (
            ratingVariation && ratingVariation !== "N/A" &&
            ratingVariation !== "0%"
        ) {
            parts.push(`(${ratingVariation} par rapport au mois dernier)`);
        }
        parts.push(".");
    }

    return parts.join(" ");
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

            // Get user language preference
            const userLanguage = recipient.preferred_language || "fr";
            const isEnglish = userLanguage === "en";

            // Format month for display based on language
            const locale = isEnglish ? "en-US" : "fr-FR";
            const periodMonth = startDate.toLocaleDateString(locale, {
                month: "long",
                year: "numeric",
            });

            // Get additional data for monthly report
            const [
                reviewsByPlatform,
                reviewsByBranch,
                keywordsData,
                previousStats,
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
                getPositiveNegativeKeywords(
                    supabase,
                    recipient.company_id,
                    startDate,
                    endDate,
                ),
                getPreviousMonthStats(
                    supabase,
                    recipient.company_id,
                    startDate,
                ),
            ]);

            // Calculate rating variation
            let ratingVariation = "";
            let ratingVariationClass = "";
            if (previousStats && previousStats.average_rating > 0) {
                const diff = stats.average_rating -
                    previousStats.average_rating;
                const percentChange = previousStats.average_rating > 0
                    ? ((diff / previousStats.average_rating) * 100).toFixed(1)
                    : "0";
                if (diff > 0) {
                    ratingVariation = `+${percentChange}%`;
                    ratingVariationClass = "positive";
                } else if (diff < 0) {
                    ratingVariation = `${percentChange}%`;
                    ratingVariationClass = "negative";
                } else {
                    ratingVariation = "0%";
                }
            } else {
                ratingVariation = "N/A";
            }

            // Determine notable change
            let notableChange = "";
            if (previousStats) {
                const reviewChange = stats.total_reviews -
                    previousStats.total_reviews;
                if (Math.abs(reviewChange) > 5) {
                    if (isEnglish) {
                        notableChange = `${
                            reviewChange > 0 ? "+" : ""
                        }${reviewChange} review${
                            reviewChange !== 1 ? "s" : ""
                        } compared to previous month`;
                    } else {
                        notableChange = `${
                            reviewChange > 0 ? "+" : ""
                        }${reviewChange} avis par rapport au mois précédent`;
                    }
                }
            }

            // Generate recommendations and executive summary
            const recommendations = generateMonthlyRecommendations(
                stats,
                keywordsData,
                userLanguage,
            );
            const executiveSummary = generateExecutiveSummary(
                stats,
                ratingVariation,
                userLanguage,
            );

            // Prepare template data for Resend template
            const templateData = {
                company_name: recipient.company_name,
                period_month: periodMonth,
                executive_summary: executiveSummary,
                total_reviews: stats.total_reviews.toString(),
                average_rating: stats.average_rating.toFixed(2),
                rating_variation: ratingVariation,
                rating_variation_class: ratingVariationClass,
                reviews_by_platform: formatReviewsByPlatform(
                    reviewsByPlatform,
                    userLanguage,
                ),
                reviews_by_branch: formatReviewsByBranch(
                    reviewsByBranch,
                    userLanguage,
                ),
                monthly_trends: formatMonthlyTrends(
                    keywordsData.positive,
                    keywordsData.negative,
                    stats.top_keywords,
                    notableChange,
                    userLanguage,
                ),
                month_comparison: formatMonthComparison(
                    stats,
                    previousStats,
                    userLanguage,
                ),
                monthly_recommendations: recommendations
                    .map((rec) => `<li>${rec}</li>`)
                    .join(""),
                cta_url: ctaUrl,
            };

            // Select template based on user language
            const templateId = isEnglish
                ? "monthly-performance-review-en"
                : "monthly-performance-review-fr";

            // Send email using Resend template
            const subject = isEnglish
                ? `Monthly Performance Report - ${recipient.company_name}`
                : `Rapport mensuel de performance - ${recipient.company_name}`;
            await sendEmail(
                resend,
                recipient.owner_email,
                subject,
                templateId,
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



