/**
 * Email utility functions for sending notifications
 */

import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

export interface EmailLogData {
    email_type: "weekly_digest" | "monthly_report";
    period_start: Date;
    period_end: Date;
    trigger_type: "cron" | "manual";
    status: "sent" | "skipped" | "failed";
    skip_reason?: string;
    recipient_email: string;
    company_id?: string;
    total_reviews: number;
    error_message?: string;
}

export interface ReviewStats {
    total_reviews: number;
    average_rating: number;
    sentiment_breakdown: {
        positive: number;
        neutral: number;
        negative: number;
    };
    top_keywords: Array<{
        text: string;
        category: string;
        count: number;
    }>;
}

export interface RecipientWithCompany {
    owner_id: string;
    owner_email: string;
    owner_name: string | null;
    company_id: string;
    company_name: string;
    preferred_language: string;
}

/**
 * Send an email using Resend template
 * @param _resend - Resend client instance (not used, kept for API compatibility)
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param templateId - Resend template ID
 * @param templateData - Template data/variables to pass to the template
 * @returns Resend response
 */
export async function sendEmail(
    _resend: Resend,
    to: string,
    subject: string,
    templateId: string,
    templateData: Record<string, string | number>,
): Promise<{ id: string }> {
    // Since Resend SDK 4.0.0 doesn't fully support templates, use REST API directly
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
        throw new Error("RESEND_API_KEY environment variable is not set");
    }

    const requestBody = {
        from: "Boresha <notifications@boresha.ca>",
        to: [to],
        subject: subject,
        template: {
            id: templateId,
            variables: templateData,
        },
    };

    console.log("Sending email with template:", {
        templateId,
        to,
        subject,
        variableCount: Object.keys(templateData).length,
    });

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    const result = await response.json() as
        | { id: string }
        | { error: { message: string; statusCode?: number } }
        | { message: string; statusCode?: number };

    if (!response.ok) {
        const errorMessage = ("error" in result && result.error?.message) ||
            ("message" in result && result.message) ||
            "Unknown error";
        const statusCode = ("error" in result && result.error?.statusCode) ||
            ("statusCode" in result && result.statusCode) ||
            response.status;

        console.error("Resend API error:", {
            statusCode,
            errorMessage,
            templateId,
            requestBody: JSON.stringify(requestBody, null, 2),
        });

        throw new Error(
            `Resend API error: ${errorMessage} (Status: ${statusCode})`,
        );
    }

    console.log("Email sent successfully:", result);
    return result as { id: string };
}

/**
 * Get all company owners who have reviews in the specified date range
 * @param supabase - Supabase client
 * @param startDate - Start date of the period
 * @param endDate - End date of the period
 * @param emailType - Type of email ('weekly_digest' | 'monthly_report' | null). If null, bypasses digest enabled check (for manual admin triggers)
 * @param companyId - Optional company ID to filter to a specific company (manual triggers only)
 * @returns Array of recipients with their companies
 */
export async function getRecipientsWithReviews(
    supabase: SupabaseClient,
    startDate: Date,
    endDate: Date,
    emailType: "weekly_digest" | "monthly_report" | null = null,
    companyId?: string,
): Promise<RecipientWithCompany[]> {
    // Query to get distinct company owners who have reviews in the period
    // Join: reviews -> platform_connections -> locations -> companies -> profiles
    const { data, error } = await supabase
        .from("reviews")
        .select(`
            platform_connection_id,
            platform_connections!inner(
                location_id,
                locations!inner(
                    company_id,
                    companies!inner(
                        id,
                        name,
                        owner_id,
                        weekly_digest_enabled,
                        monthly_digest_enabled,
                        profiles!owner_id(
                            id,
                            email,
                            full_name,
                            preferred_language
                        )
                    )
                )
            )
        `)
        .gte("published_at", startDate.toISOString())
        .lte("published_at", endDate.toISOString());

    if (error) {
        throw new Error(`Failed to fetch recipients: ${error.message}`);
    }

    // Extract unique owner-company pairs
    const recipientMap = new Map<string, RecipientWithCompany>();

    if (data) {
        for (const review of data) {
            const platformConnection = review.platform_connections as any;
            const location = platformConnection.locations as any;
            const company = location.companies as any;
            const profile = company.profiles as any;

            if (company && profile && company.id && profile.email) {
                // Filter by specific company if provided (manual triggers only)
                if (companyId && company.id !== companyId) {
                    continue; // Skip companies that don't match the specified companyId
                }

                // Filter by digest enabled flags for cron triggers
                // Manual triggers (emailType === null) bypass this check
                if (emailType !== null) {
                    if (
                        emailType === "weekly_digest" &&
                        !company.weekly_digest_enabled
                    ) {
                        continue; // Skip companies with weekly digest disabled
                    }
                    if (
                        emailType === "monthly_report" &&
                        !company.monthly_digest_enabled
                    ) {
                        continue; // Skip companies with monthly digest disabled
                    }
                }

                const key = `${profile.id}_${company.id}`;
                if (!recipientMap.has(key)) {
                    recipientMap.set(key, {
                        owner_id: profile.id,
                        owner_email: profile.email,
                        owner_name: profile.full_name || null,
                        company_id: company.id,
                        company_name: company.name,
                        preferred_language: profile.preferred_language || "fr",
                    });
                }
            }
        }
    }

    return Array.from(recipientMap.values());
}

/**
 * Get review statistics for a company in a date range
 * @param supabase - Supabase client
 * @param companyId - Company ID
 * @param startDate - Start date of the period
 * @param endDate - End date of the period
 * @returns Review statistics
 */
export async function getReviewStats(
    supabase: SupabaseClient,
    companyId: string,
    startDate: Date,
    endDate: Date,
): Promise<ReviewStats> {
    // Get all locations for the company
    const { data: locations, error: locationsError } = await supabase
        .from("locations")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true);

    if (locationsError) {
        throw new Error(`Failed to fetch locations: ${locationsError.message}`);
    }

    if (!locations || locations.length === 0) {
        return {
            total_reviews: 0,
            average_rating: 0,
            sentiment_breakdown: { positive: 0, neutral: 0, negative: 0 },
            top_keywords: [],
        };
    }

    const locationIds = locations.map((loc) => loc.id);

    // Get platform connections for these locations
    const { data: platformConnections, error: pcError } = await supabase
        .from("platform_connections")
        .select("id")
        .in("location_id", locationIds)
        .eq("is_active", true);

    if (pcError) {
        throw new Error(
            `Failed to fetch platform connections: ${pcError.message}`,
        );
    }

    if (!platformConnections || platformConnections.length === 0) {
        return {
            total_reviews: 0,
            average_rating: 0,
            sentiment_breakdown: { positive: 0, neutral: 0, negative: 0 },
            top_keywords: [],
        };
    }

    const platformConnectionIds = platformConnections.map((pc) => pc.id);

    // Get reviews for the period
    const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("id, rating, published_at")
        .in("platform_connection_id", platformConnectionIds)
        .gte("published_at", startDate.toISOString())
        .lte("published_at", endDate.toISOString());

    if (reviewsError) {
        throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
    }

    const reviewsList = reviews || [];
    const totalReviews = reviewsList.length;

    if (totalReviews === 0) {
        return {
            total_reviews: 0,
            average_rating: 0,
            sentiment_breakdown: { positive: 0, neutral: 0, negative: 0 },
            top_keywords: [],
        };
    }

    // Calculate average rating
    const sumRating = reviewsList.reduce(
        (sum, r) => sum + Number(r.rating || 0),
        0,
    );
    const averageRating = sumRating / totalReviews;

    // Get sentiment breakdown
    const reviewIds = reviewsList.map((r) => r.id);
    const { data: sentiments, error: sentimentsError } = await supabase
        .from("sentiment_analysis")
        .select("sentiment")
        .in("review_id", reviewIds);

    if (sentimentsError) {
        console.warn(`Failed to fetch sentiments: ${sentimentsError.message}`);
    }

    const sentimentBreakdown = {
        positive: 0,
        neutral: 0,
        negative: 0,
    };

    if (sentiments) {
        for (const sentiment of sentiments) {
            const sent = sentiment.sentiment as string;
            if (sent === "positive") sentimentBreakdown.positive++;
            else if (sent === "negative") sentimentBreakdown.negative++;
            else sentimentBreakdown.neutral++;
        }
    }

    // Get top keywords
    const { data: reviewKeywords, error: keywordsError } = await supabase
        .from("review_keywords")
        .select(`
            keyword_id,
            keywords!inner(
                text,
                category
            )
        `)
        .in("review_id", reviewIds);

    if (keywordsError) {
        console.warn(`Failed to fetch keywords: ${keywordsError.message}`);
    }

    // Aggregate keywords by count
    const keywordMap = new Map<
        string,
        { text: string; category: string; count: number }
    >();

    if (reviewKeywords) {
        for (const rk of reviewKeywords) {
            const keyword = (rk as any).keywords;
            if (keyword) {
                const key = keyword.text;
                const existing = keywordMap.get(key);
                if (existing) {
                    existing.count++;
                } else {
                    keywordMap.set(key, {
                        text: keyword.text,
                        category: keyword.category || "other",
                        count: 1,
                    });
                }
            }
        }
    }

    // Sort by count and take top 10
    const topKeywords = Array.from(keywordMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return {
        total_reviews: totalReviews,
        average_rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
        sentiment_breakdown: sentimentBreakdown,
        top_keywords: topKeywords,
    };
}

/**
 * Check if an email has already been sent for this period and company
 * @param supabase - Supabase client
 * @param emailType - Type of email
 * @param periodStart - Start date of period
 * @param periodEnd - End date of period
 * @param companyId - Company ID (optional, for company-specific checks)
 * @returns True if email was already sent
 */
export async function checkDuplicateSend(
    supabase: SupabaseClient,
    emailType: "weekly_digest" | "monthly_report",
    periodStart: Date,
    periodEnd: Date,
    companyId?: string,
): Promise<boolean> {
    const query = supabase
        .from("email_notification_logs")
        .select("id")
        .eq("email_type", emailType)
        .eq("period_start", periodStart.toISOString())
        .eq("period_end", periodEnd.toISOString())
        .eq("status", "sent");

    if (companyId) {
        query.eq("company_id", companyId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
        console.warn(`Failed to check duplicate send: ${error.message}`);
        return false; // Don't block on error, allow send
    }

    return (data?.length || 0) > 0;
}

/**
 * Log an email execution attempt
 * @param supabase - Supabase client
 * @param logData - Log data to insert
 */
export async function logEmailAttempt(
    supabase: SupabaseClient,
    logData: EmailLogData,
): Promise<void> {
    const { error } = await supabase.from("email_notification_logs").insert({
        email_type: logData.email_type,
        period_start: logData.period_start.toISOString(),
        period_end: logData.period_end.toISOString(),
        trigger_type: logData.trigger_type,
        status: logData.status,
        skip_reason: logData.skip_reason || null,
        recipient_email: logData.recipient_email,
        company_id: logData.company_id || null,
        total_reviews: logData.total_reviews,
        error_message: logData.error_message || null,
    });

    if (error) {
        console.error(`Failed to log email attempt: ${error.message}`);
        // Don't throw - logging failure shouldn't break the flow
    }
}

/**
 * Get reviews grouped by platform for a company in a date range
 */
export async function getReviewsByPlatform(
    supabase: SupabaseClient,
    companyId: string,
    startDate: Date,
    endDate: Date,
): Promise<Array<{ platform_name: string; count: number }>> {
    const { data: locations } = await supabase
        .from("locations")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true);

    if (!locations || locations.length === 0) return [];

    const locationIds = locations.map((loc) => loc.id);

    const { data: platformConnections } = await supabase
        .from("platform_connections")
        .select("id, platform_id, platforms(display_name)")
        .in("location_id", locationIds)
        .eq("is_active", true);

    if (!platformConnections || platformConnections.length === 0) return [];

    const platformConnectionIds = platformConnections.map((pc) => pc.id);

    const { data: reviews } = await supabase
        .from("reviews")
        .select("platform_connection_id")
        .in("platform_connection_id", platformConnectionIds)
        .gte("published_at", startDate.toISOString())
        .lte("published_at", endDate.toISOString());

    if (!reviews) return [];

    const platformMap = new Map<string, number>();
    const connectionToPlatform = new Map<string, string>();

    for (const pc of platformConnections) {
        const platform = pc.platforms as any;
        const platformName = platform?.display_name || "Unknown";
        connectionToPlatform.set(pc.id, platformName);
    }

    for (const review of reviews) {
        const platformName = connectionToPlatform.get(
            review.platform_connection_id,
        ) || "Unknown";
        platformMap.set(
            platformName,
            (platformMap.get(platformName) || 0) + 1,
        );
    }

    return Array.from(platformMap.entries())
        .map(([platform_name, count]) => ({ platform_name, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Get reviews grouped by location/branch for a company in a date range
 */
export async function getReviewsByBranch(
    supabase: SupabaseClient,
    companyId: string,
    startDate: Date,
    endDate: Date,
): Promise<Array<{ branch_name: string; count: number }>> {
    const { data: locations } = await supabase
        .from("locations")
        .select("id, name")
        .eq("company_id", companyId)
        .eq("is_active", true);

    if (!locations || locations.length === 0) return [];

    const locationIds = locations.map((loc) => loc.id);
    const locationMap = new Map<string, string>();
    for (const loc of locations) {
        locationMap.set(loc.id, loc.name);
    }

    const { data: platformConnections } = await supabase
        .from("platform_connections")
        .select("id, location_id")
        .in("location_id", locationIds)
        .eq("is_active", true);

    if (!platformConnections || platformConnections.length === 0) return [];

    const platformConnectionIds = platformConnections.map((pc) => pc.id);
    const connectionToLocation = new Map<string, string>();

    for (const pc of platformConnections) {
        const locationName = locationMap.get(pc.location_id) || "Unknown";
        connectionToLocation.set(pc.id, locationName);
    }

    const { data: reviews } = await supabase
        .from("reviews")
        .select("platform_connection_id")
        .in("platform_connection_id", platformConnectionIds)
        .gte("published_at", startDate.toISOString())
        .lte("published_at", endDate.toISOString());

    if (!reviews) return [];

    const branchMap = new Map<string, number>();

    for (const review of reviews) {
        const branchName = connectionToLocation.get(
            review.platform_connection_id,
        ) || "Unknown";
        branchMap.set(branchName, (branchMap.get(branchName) || 0) + 1);
    }

    return Array.from(branchMap.entries())
        .map(([branch_name, count]) => ({ branch_name, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Get count of unanswered reviews for a company in a date range
 */
export async function getUnansweredReviewsCount(
    supabase: SupabaseClient,
    companyId: string,
    startDate: Date,
    endDate: Date,
): Promise<number> {
    const { data: locations } = await supabase
        .from("locations")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true);

    if (!locations || locations.length === 0) return 0;

    const locationIds = locations.map((loc) => loc.id);

    const { data: platformConnections } = await supabase
        .from("platform_connections")
        .select("id")
        .in("location_id", locationIds)
        .eq("is_active", true);

    if (!platformConnections || platformConnections.length === 0) return 0;

    const platformConnectionIds = platformConnections.map((pc) => pc.id);

    const { data: reviews } = await supabase
        .from("reviews")
        .select("id")
        .in("platform_connection_id", platformConnectionIds)
        .gte("published_at", startDate.toISOString())
        .lte("published_at", endDate.toISOString())
        .is("reply_content", null);

    return reviews?.length || 0;
}

/**
 * Get a negative review example for a company in a date range
 */
export async function getNegativeReviewExample(
    supabase: SupabaseClient,
    companyId: string,
    startDate: Date,
    endDate: Date,
): Promise<{ rating: number; content: string } | null> {
    const { data: locations } = await supabase
        .from("locations")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true);

    if (!locations || locations.length === 0) return null;

    const locationIds = locations.map((loc) => loc.id);

    const { data: platformConnections } = await supabase
        .from("platform_connections")
        .select("id")
        .in("location_id", locationIds)
        .eq("is_active", true);

    if (!platformConnections || platformConnections.length === 0) return null;

    const platformConnectionIds = platformConnections.map((pc) => pc.id);

    // Get reviews first
    const { data: reviews } = await supabase
        .from("reviews")
        .select("id, rating, content")
        .in("platform_connection_id", platformConnectionIds)
        .gte("published_at", startDate.toISOString())
        .lte("published_at", endDate.toISOString())
        .not("content", "is", null)
        .order("rating", { ascending: true })
        .limit(10); // Get lowest rated reviews

    if (!reviews || reviews.length === 0) return null;

    // Get sentiment for these reviews
    const reviewIds = reviews.map((r) => r.id);
    const { data: sentiments } = await supabase
        .from("sentiment_analysis")
        .select("review_id, sentiment")
        .in("review_id", reviewIds)
        .eq("sentiment", "negative")
        .limit(1);

    // If we have a negative sentiment review, use it; otherwise use the lowest rated
    if (sentiments && sentiments.length > 0) {
        const negativeReviewId = sentiments[0].review_id;
        const review = reviews.find((r) => r.id === negativeReviewId);
        if (review) {
            return {
                rating: Number(review.rating) || 0,
                content: review.content || "",
            };
        }
    }

    // Fallback to lowest rated review
    const lowestRated = reviews[0];
    if (Number(lowestRated.rating) <= 3) {
        return {
            rating: Number(lowestRated.rating) || 0,
            content: lowestRated.content || "",
        };
    }

    return null;
}

/**
 * Get positive and negative keywords separately
 */
export async function getPositiveNegativeKeywords(
    supabase: SupabaseClient,
    companyId: string,
    startDate: Date,
    endDate: Date,
): Promise<{
    positive: Array<{ text: string; count: number }>;
    negative: Array<{ text: string; count: number }>;
}> {
    const { data: locations } = await supabase
        .from("locations")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true);

    if (!locations || locations.length === 0) {
        return { positive: [], negative: [] };
    }

    const locationIds = locations.map((loc) => loc.id);

    const { data: platformConnections } = await supabase
        .from("platform_connections")
        .select("id")
        .in("location_id", locationIds)
        .eq("is_active", true);

    if (!platformConnections || platformConnections.length === 0) {
        return { positive: [], negative: [] };
    }

    const platformConnectionIds = platformConnections.map((pc) => pc.id);

    const { data: reviews } = await supabase
        .from("reviews")
        .select("id")
        .in("platform_connection_id", platformConnectionIds)
        .gte("published_at", startDate.toISOString())
        .lte("published_at", endDate.toISOString());

    if (!reviews || reviews.length === 0) {
        return { positive: [], negative: [] };
    }

    const reviewIds = reviews.map((r) => r.id);

    // Get sentiment for reviews
    const { data: sentiments } = await supabase
        .from("sentiment_analysis")
        .select("review_id, sentiment")
        .in("review_id", reviewIds);

    const sentimentMap = new Map<string, string>();
    if (sentiments) {
        for (const s of sentiments) {
            sentimentMap.set(s.review_id, s.sentiment as string);
        }
    }

    // Get keywords
    const { data: reviewKeywords } = await supabase
        .from("review_keywords")
        .select(`
            review_id,
            keywords!inner(text)
        `)
        .in("review_id", reviewIds);

    const positiveKeywords = new Map<string, number>();
    const negativeKeywords = new Map<string, number>();

    if (reviewKeywords) {
        for (const rk of reviewKeywords) {
            const keyword = (rk as any).keywords;
            const sentiment = sentimentMap.get(rk.review_id) || "neutral";

            if (keyword) {
                const keywordText = keyword.text;
                if (sentiment === "positive") {
                    positiveKeywords.set(
                        keywordText,
                        (positiveKeywords.get(keywordText) || 0) + 1,
                    );
                } else if (sentiment === "negative") {
                    negativeKeywords.set(
                        keywordText,
                        (negativeKeywords.get(keywordText) || 0) + 1,
                    );
                }
            }
        }
    }

    return {
        positive: Array.from(positiveKeywords.entries())
            .map(([text, count]) => ({ text, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
        negative: Array.from(negativeKeywords.entries())
            .map(([text, count]) => ({ text, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
    };
}

/**
 * Get previous month statistics for comparison
 */
export async function getPreviousMonthStats(
    supabase: SupabaseClient,
    companyId: string,
    currentStartDate: Date,
): Promise<ReviewStats | null> {
    // Calculate previous month dates
    const prevMonthEnd = new Date(currentStartDate);
    prevMonthEnd.setDate(0); // Last day of previous month
    const prevMonthStart = new Date(prevMonthEnd);
    prevMonthStart.setDate(1); // First day of previous month

    try {
        const stats = await getReviewStats(
            supabase,
            companyId,
            prevMonthStart,
            prevMonthEnd,
        );
        return stats;
    } catch (error) {
        console.warn(`Failed to get previous month stats: ${error}`);
        return null;
    }
}
