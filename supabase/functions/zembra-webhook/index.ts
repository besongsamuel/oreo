import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface ZembraWebhookPayload {
    reference: string;
    type: string;
    format: string;
    internalId: string;
    data: {
        job: {
            network: string;
            slug: string;
            jobId: string;
            uid: string;
            monitoring: string;
            internalId: string;
            requestedAt: string;
            expiresAt: string;
            includeRawData: boolean;
            cost: number;
            active: boolean;
            dateLimit: string | null;
            sizeLimit: number | null;
        };
        target: {
            address: {
                street: string;
                city: string;
                region: string;
                postalCode: string;
                country: string;
            };
            aliases: string[];
            categories: string[];
            formattedAddress: string;
            globalRating: number;
            id: string;
            lastCrawled: string;
            lastUpdated: string;
            link: string;
            name: string;
            network: string;
            phone: string;
            photos: string[];
            priceRange: string | null;
            profileImage: string;
            ratingBreakdown: Array<{
                label: string;
                count: number;
            }>;
            reviewCount: {
                native: {
                    total: number;
                    active: number;
                    hidden: number;
                };
            };
            slug: string;
            url: string;
            website: string;
        };
        reviews: Array<{
            id: string;
            text: string;
            timestamp: string;
            rating: number;
            recommendation: number | null;
            translation: string | null;
            author: {
                id: string;
                name: string;
                url?: string;
                location?: string;
                photo?: string;
            };
        }>;
        returned: number;
    };
    pages: number;
    page: number;
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

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Verify webhook authentication
        const zembraApiToken = Deno.env.get("ZEMBRA_API_TOKEN");
        const requestToken = req.headers.get("X-Zembra-Token");

        if (!zembraApiToken) {
            console.error("Zembra API token not configured");
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Server configuration error",
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

        if (!requestToken || requestToken !== zembraApiToken) {
            console.error("Invalid or missing Zembra webhook token");
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Unauthorized",
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

        console.log("Received Zembra webhook");

        // Parse webhook payload
        const bodyText = await req.text();

        if (!bodyText || bodyText.trim().length === 0) {
            console.error("Empty request body - possible health check or ping");
            return new Response(
                JSON.stringify({
                    success: true,
                    message:
                        "Webhook endpoint is active. Awaiting review data.",
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

        let payload: ZembraWebhookPayload;

        try {
            payload = JSON.parse(bodyText);
        } catch (error) {
            console.error("Failed to parse webhook payload:", error);
            console.error("Body text:", bodyText);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Invalid JSON payload",
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

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        if (payload.type !== "reviews") {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Not a reviews webhook, ignoring",
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

        const { job, target, reviews } = payload.data;

        console.log(
            `Processing webhook for job: ${job.jobId}, slug: ${target.slug}, reviews: ${reviews.length}`,
        );

        // Find platform connection by slug matching platform_location_id
        const { data: connections, error: findError } = await supabaseClient
            .from("platform_connections")
            .select("id, location_id, locations!inner(company_id)")
            .eq("platform_location_id", target.slug);

        if (findError) {
            throw new Error(
                `Failed to find platform connection: ${findError.message}`,
            );
        }

        if (!connections || connections.length === 0) {
            console.warn(
                `No platform connection found for slug: ${target.slug}`,
            );
            return new Response(
                JSON.stringify({
                    success: false,
                    error:
                        `No platform connection found for slug: ${target.slug}`,
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

        const connectionId = connections[0].id;
        const companyId = (connections[0].locations as unknown as {
            company_id: string;
        }).company_id;

        // Transform Zembra reviews to StandardReview format
        const standardReviews: StandardReview[] = reviews.map((review) => {
            // Calculate rating: use rating if available, otherwise map recommendation
            let rating = review.rating;
            if (rating === null || rating === undefined) {
                if (review.recommendation === 1) {
                    rating = 5;
                } else if (review.recommendation === -1) {
                    rating = 1;
                } else {
                    rating = 0;
                }
            }

            return {
                externalId: review.id,
                authorName: review.author.name || "Anonymous",
                authorAvatar: review.author.photo,
                rating: rating,
                content: review.text || "",
                title: undefined,
                publishedAt: new Date(review.timestamp),
                replyContent: undefined,
                replyAt: undefined,
                rawData: review as Record<string, unknown>,
            };
        });

        console.log(
            `Transformed ${standardReviews.length} reviews for connection: ${connectionId}`,
        );

        // Transform all reviews to database format
        const reviewsToUpsert = standardReviews.map((review) => ({
            platform_connection_id: connectionId,
            external_id: review.externalId,
            author_name: review.authorName,
            author_avatar_url: review.authorAvatar,
            rating: review.rating,
            title: review.title,
            content: review.content,
            published_at: review.publishedAt.toISOString(),
            reply_content: review.replyContent,
            reply_at: review.replyAt?.toISOString(),
            raw_data: review.rawData,
            updated_at: new Date().toISOString(),
        }));

        // Save reviews to database in batches of 500
        let reviewsUpserted = 0;
        const errors: string[] = [];
        const BATCH_SIZE = 500;

        for (let i = 0; i < reviewsToUpsert.length; i += BATCH_SIZE) {
            const batch = reviewsToUpsert.slice(i, i + BATCH_SIZE);

            try {
                const { error: upsertError } = await supabaseClient
                    .from("reviews")
                    .upsert(batch, {
                        onConflict: "platform_connection_id, external_id",
                    });

                if (upsertError) {
                    errors.push(
                        `Failed to upsert batch ${
                            i / BATCH_SIZE + 1
                        }: ${upsertError.message}`,
                    );
                } else {
                    reviewsUpserted += batch.length;
                    console.log(
                        `Batch ${
                            i / BATCH_SIZE + 1
                        }: upserted ${batch.length} reviews`,
                    );
                }
            } catch (err) {
                const errorMessage = err instanceof Error
                    ? err.message
                    : "Unknown error";
                errors.push(
                    `Error processing batch ${
                        i / BATCH_SIZE + 1
                    }: ${errorMessage}`,
                );
            }
        }

        console.log(
            `Upserted ${reviewsUpserted} reviews for connection: ${connectionId}`,
        );

        // Update platform connection metadata with fetch time and count
        const { error: updateError } = await supabaseClient
            .from("platform_connections")
            .update({
                metadata: {
                    zembraJobId: job.jobId,
                    lastFetchTime: new Date().toISOString(),
                    lastFetchCount: reviews.length,
                },
                last_sync_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", connectionId);

        if (updateError) {
            console.error(
                "Failed to update platform connection metadata:",
                updateError,
            );
        }

        // Create sync log
        const syncStats = {
            reviewsFetched: reviews.length,
            reviewsNew: reviewsUpserted,
            reviewsUpdated: 0,
            errorMessage: errors.length > 0 ? errors.join("; ") : undefined,
        };

        const { error: syncLogError } = await supabaseClient
            .from("sync_logs")
            .insert({
                platform_connection_id: connectionId,
                status: syncStats.errorMessage ? "failed" : "success",
                reviews_fetched: syncStats.reviewsFetched,
                reviews_new: syncStats.reviewsNew,
                reviews_updated: syncStats.reviewsUpdated,
                error_message: syncStats.errorMessage,
                started_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
            });

        if (syncLogError) {
            console.error("Failed to create sync log:", syncLogError);
        }

        // Trigger sentiment analysis in the background (fire-and-forget)
        if (reviewsUpserted > 0) {
            console.log(
                `Triggering sentiment analysis for company ${companyId}`,
            );
            const sentimentUrl =
                `${supabaseUrl}/functions/v1/sentiment-analysis`;
            fetch(sentimentUrl, {
                method: "POST",
                headers: {
                    "X-Internal-Key": supabaseServiceKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    company_id: companyId,
                    retry_count: 0,
                }),
            }).catch((err) => {
                console.error(
                    "Error calling sentiment-analysis (non-blocking):",
                    err,
                );
            });
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Processed ${reviewsUpserted} reviews`,
                reviewsProcessed: reviewsUpserted,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error in zembra-webhook:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});
