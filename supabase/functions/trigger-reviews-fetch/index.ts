import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

const ZEMBRA_TRIGGER_URL = "https://api.zembra.io/reviews";
const ZEMBRA_FETCH_COOLDOWN_HOURS = 48;
const ZEMBRA_FETCH_COOLDOWN_MS = ZEMBRA_FETCH_COOLDOWN_HOURS * 60 * 60 * 1000;

interface TriggerRequestBody {
    company_id: string;
}

interface StandardReview {
    externalId: string;
    authorName: string;
    authorAvatar?: string;
    rating: number;
    content: string;
    title?: string;
    publishedAt: Date;
    replyContent?: string;
    replyAt?: Date;
    rawData: Record<string, unknown>;
}

interface SyncStats {
    reviewsFetched: number;
    reviewsNew: number;
    reviewsUpdated: number;
    errorMessage?: string;
}

type PlatformRelation =
    | { name: string | null }
    | { name: string | null }[]
    | null;

interface PlatformConnectionRow {
    id: string;
    platform_location_id: string | null;
    platform: PlatformRelation;
}

interface ZembraReview extends Record<string, unknown> {
    id: string;
    author?: {
        name?: string;
        photo?: string;
    };
    rating?: number;
    recommendation?: number;
    text?: string;
    title?: string;
    timestamp?: string | number;
    reply?: {
        text?: string;
        timestamp?: string;
    };
}

interface ZembraReviewResponse extends Record<string, unknown> {
    reviews?: ZembraReview[];
}

interface ZembraFetchCallLog {
    id: string;
    triggered_at: string;
    status: "pending" | "success" | "error";
}

const saveReviews = async (
    supabaseClient: SupabaseClient,
    platformConnectionId: string,
    reviews: StandardReview[],
): Promise<SyncStats> => {
    let reviewsNew = 0;
    const errors: string[] = [];

    for (const review of reviews) {
        try {
            const { data: existingReview, error: checkError } =
                await supabaseClient
                    .from("reviews")
                    .select("id")
                    .eq("platform_connection_id", platformConnectionId)
                    .eq("external_id", review.externalId)
                    .maybeSingle();

            if (checkError) {
                errors.push(
                    `Failed to check existing review ${review.externalId}: ${checkError.message}`,
                );
                continue;
            }

            if (!existingReview) {
                const { error: insertError } = await supabaseClient
                    .from("reviews")
                    .insert({
                        platform_connection_id: platformConnectionId,
                        external_id: review.externalId,
                        author_name: review.authorName,
                        author_avatar_url: review.authorAvatar,
                        rating: review.rating,
                        title: review.title,
                        content: review.content,
                        published_at: review.publishedAt.toISOString(),
                        reply_content: review.replyContent,
                        reply_at: review.replyAt?.toISOString() ?? null,
                        raw_data: review.rawData,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });

                if (insertError) {
                    errors.push(
                        `Failed to insert review ${review.externalId}: ${insertError.message}`,
                    );
                } else {
                    reviewsNew++;
                }
            }
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : "Unknown review insert error";
            errors.push(
                `Error processing review ${review.externalId}: ${message}`,
            );
        }
    }

    return {
        reviewsFetched: reviews.length,
        reviewsNew,
        reviewsUpdated: 0,
        errorMessage: errors.length > 0 ? errors.join("; ") : undefined,
    };
};

const triggerZembraFetch = async (
    network: string,
    slug: string,
    token: string,
): Promise<StandardReview[]> => {
    const response = await fetch(ZEMBRA_TRIGGER_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ network, slug, type: "partial" }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(
            `Zembra trigger failed (${response.status}): ${
                text.substring(0, 200)
            }`,
        );
    }
    let data: ZembraReviewResponse | null = null;
    const contentType = response.headers.get("content-type")?.toLowerCase();
    if (contentType?.includes("application/json")) {
        data = await response.json();
    }

    const reviews = Array.isArray(data?.reviews) ? data.reviews : [];

    return reviews.map((review) => ({
        externalId: review.id,
        authorName: review.author?.name || "",
        authorAvatar: review.author?.photo || undefined,
        rating: review.rating ?? review.recommendation ?? 0,
        content: review.text || "",
        title: review.title || undefined,
        publishedAt: new Date(review.timestamp || Date.now()),
        replyContent: review.reply?.text || undefined,
        replyAt: review.reply?.timestamp
            ? new Date(review.reply.timestamp)
            : undefined,
        rawData: review,
    }));
};

const callSentimentAnalysis = async (
    supabaseUrl: string,
    supabaseKey: string,
    companyId: string,
) => {
    await fetch(`${supabaseUrl}/functions/v1/sentiment-analysis`, {
        method: "POST",
        headers: {
            "X-Internal-Key": supabaseKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ company_id: companyId }),
    });
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    let supabaseClientRef: SupabaseClient | null = null;
    let fetchLogId: string | null = null;

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const zembraToken = Deno.env.get("ZEMBRA_API_TOKEN");

        if (!supabaseUrl || !supabaseServiceKey || !zembraToken) {
            throw new Error("Missing required environment variables");
        }

        const authHeader = req.headers.get("Authorization") ?? "";
        const jwt = authHeader.replace("Bearer ", "");

        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
            global: {
                headers: { Authorization: `Bearer ${jwt}` },
            },
        });
        supabaseClientRef = supabaseClient;

        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser(jwt);

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

        const body: TriggerRequestBody = await req.json();
        if (!body.company_id) {
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
            .select("id, owner_id")
            .eq("id", body.company_id)
            .maybeSingle();

        if (companyError || !company) {
            return new Response(
                JSON.stringify({ success: false, error: "Company not found" }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 404,
                },
            );
        }

        const { data: profile } = await supabaseClient
            .from("profiles")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle();

        const isAdmin = profile?.role === "admin";
        const isOwner = company.owner_id === user.id;

        if (!isAdmin && !isOwner) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized" }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 403,
                },
            );
        }

        const {
            data: recentLog,
            error: recentLogError,
        } = await supabaseClient
            .from("zembra_fetch_call_logs")
            .select("id, triggered_at, status")
            .eq("company_id", body.company_id)
            .neq("status", "error")
            .order("triggered_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (recentLogError) {
            throw new Error(
                `Failed to check Zembra fetch cooldown: ${recentLogError.message}`,
            );
        }

        const typedRecentLog = recentLog as ZembraFetchCallLog | null;
        if (typedRecentLog) {
            const lastTriggerMs = new Date(typedRecentLog.triggered_at)
                .getTime();
            if (
                !Number.isNaN(lastTriggerMs) &&
                Date.now() - lastTriggerMs < ZEMBRA_FETCH_COOLDOWN_MS
            ) {
                const nextEligibleAt = new Date(
                    lastTriggerMs + ZEMBRA_FETCH_COOLDOWN_MS,
                ).toISOString();

                return new Response(
                    JSON.stringify({
                        success: true,
                        skipped: true,
                        reason:
                            "Zembra reviews fetch already triggered within the last 48 hours",
                        nextEligibleAt,
                        cooldownHours: ZEMBRA_FETCH_COOLDOWN_HOURS,
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
        }

        const {
            data: fetchLog,
            error: logInsertError,
        } = await supabaseClient
            .from("zembra_fetch_call_logs")
            .insert({
                company_id: body.company_id,
                requested_by: profile?.id ?? null,
                status: "pending",
            })
            .select("id")
            .single();

        if (logInsertError || !fetchLog) {
            throw new Error(
                `Failed to create Zembra fetch log entry: ${
                    logInsertError?.message ?? "Unknown error"
                }`,
            );
        }

        fetchLogId = fetchLog.id;

        const { data: locations, error: locationsError } = await supabaseClient
            .from("locations")
            .select("id")
            .eq("company_id", body.company_id)
            .eq("is_active", true);

        if (locationsError) {
            throw new Error(
                `Failed to load locations: ${locationsError.message}`,
            );
        }

        let totalReviewsInserted = 0;
        let locationsProcessed = 0;
        const syncErrors: string[] = [];
        const locationIds = (locations || []).map((loc) => loc.id);

        await Promise.all(
            locationIds.map(async (locationId) => {
                const { data: connections, error: connectionsError } =
                    await supabaseClient
                        .from("platform_connections")
                        .select(
                            "id, platform_location_id, platform:platforms(name)",
                        )
                        .eq("location_id", locationId)
                        .eq("is_active", true)
                        .returns<PlatformConnectionRow[]>();

                if (connectionsError) {
                    console.error(
                        `Failed to load connections for location ${locationId}:`,
                        connectionsError,
                    );
                    return;
                }

                if (!connections || connections.length === 0) {
                    return;
                }

                locationsProcessed++;

                const typedConnections = connections ?? [];

                await Promise.all(
                    typedConnections.map(async (connection) => {
                        const platformEntity =
                            Array.isArray(connection.platform)
                                ? connection.platform[0] ?? null
                                : connection.platform;
                        const network = platformEntity?.name ?? null;
                        const slug = connection.platform_location_id;

                        if (!network || !slug) {
                            console.warn(
                                `Skipping connection ${connection.id}: missing network or slug`,
                            );
                            return;
                        }

                        try {
                            const reviews = await triggerZembraFetch(
                                network,
                                slug,
                                zembraToken,
                            );

                            if (reviews.length === 0) {
                                return;
                            }

                            const stats = await saveReviews(
                                supabaseClient,
                                connection.id,
                                reviews,
                            );

                            totalReviewsInserted += stats.reviewsNew;
                            if (stats.errorMessage) {
                                syncErrors.push(
                                    `Connection ${connection.id}: ${stats.errorMessage}`,
                                );
                            }
                        } catch (err) {
                            console.error(
                                `Failed to trigger reviews for connection ${connection.id}:`,
                                err,
                            );
                            const message = err instanceof Error
                                ? err.message
                                : "Unknown error";
                            syncErrors.push(
                                `Connection ${connection.id}: ${message}`,
                            );
                        }
                    }),
                );
            }),
        );

        if (totalReviewsInserted > 0) {
            await callSentimentAnalysis(
                supabaseUrl,
                supabaseServiceKey,
                body.company_id,
            );
        }

        const summaryError = syncErrors.length > 0
            ? syncErrors.join("; ")
            : null;

        if (fetchLogId) {
            await supabaseClient
                .from("zembra_fetch_call_logs")
                .update({
                    status: "success",
                    locations_processed: locationsProcessed,
                    reviews_inserted: totalReviewsInserted,
                    error_message: summaryError,
                    completed_at: new Date().toISOString(),
                })
                .eq("id", fetchLogId);
        }

        const responseBody: Record<string, unknown> = {
            success: true,
            skipped: false,
            locationsProcessed,
            reviewsInserted: totalReviewsInserted,
        };

        if (syncErrors.length > 0) {
            responseBody.warnings = syncErrors;
        }

        return new Response(
            JSON.stringify(responseBody),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error in trigger-reviews-fetch:", error);
        const message = error instanceof Error
            ? error.message
            : "Unknown error";

        if (supabaseClientRef && fetchLogId) {
            try {
                await supabaseClientRef
                    .from("zembra_fetch_call_logs")
                    .update({
                        status: "error",
                        error_message: message,
                        completed_at: new Date().toISOString(),
                    })
                    .eq("id", fetchLogId);
            } catch (logError) {
                console.error(
                    "Failed to update Zembra fetch log after error:",
                    logError,
                );
            }
        }

        return new Response(
            JSON.stringify({ success: false, error: message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});
