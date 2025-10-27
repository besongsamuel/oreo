import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
    ZembraClientRequest,
    ZembraClientResponse,
    ZembraJobResponse,
    ZembraListingResponse,
    ZembraReviewsResponse,
} from "./types.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

const ZEMBRA_API_BASE = "https://api.zembra.io/reviews/";
const DEFAULT_FIELDS = [
    "id",
    "text",
    "timestamp",
    "rating",
    "recommendation",
    "translation",
    "author",
];

// Sleep utility for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get Zembra API token from environment
        const zembraApiToken = Deno.env.get("ZEMBRA_API_TOKEN");

        if (!zembraApiToken) {
            throw new Error("Zembra API token not configured");
        }

        // Parse request body
        const body: ZembraClientRequest = await req.json();

        if (!body.mode || !body.network || !body.slug) {
            throw new Error(
                "Missing required parameters: mode, network, and slug are required",
            );
        }

        const { mode, network, slug, postedAfter, userId } = body;

        // Get user's subscription tier if userId is provided
        let isPaid = false;
        if (userId) {
            const supabaseUrl = Deno.env.get("SUPABASE_URL");
            const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

            if (supabaseUrl && supabaseKey) {
                const supabaseClient = createClient(supabaseUrl, supabaseKey);
                const { data: profile } = await supabaseClient
                    .from("profiles")
                    .select("subscription_tier")
                    .eq("id", userId)
                    .single();

                isPaid = profile?.subscription_tier === "paid";
            }
        }

        // Build base URL with common query parameters
        const baseUrl = new URL(ZEMBRA_API_BASE);
        baseUrl.searchParams.set("network", network);
        baseUrl.searchParams.set("slug", slug);
        baseUrl.searchParams.set("monitoring", isPaid ? "basic" : "none");
        baseUrl.searchParams.set("sortBy", "timestamp");
        baseUrl.searchParams.set("sortDirection", "DESC");

        // Add fields[] parameters
        DEFAULT_FIELDS.forEach((field) => {
            baseUrl.searchParams.append("fields[]", field);
        });

        // Add sizeLimit for free users (create-review-job mode only)
        if (mode === "create-review-job" && !isPaid) {
            baseUrl.searchParams.set("sizeLimit", "10");
        }

        // Add postedAfter parameter if provided (for incremental fetches)
        if (postedAfter) {
            // Convert ISO timestamp to Unix timestamp (milliseconds)
            const date = new Date(postedAfter);
            const unixTimestamp = Math.floor(date.getTime()).toString();
            baseUrl.searchParams.set("postedAfter", unixTimestamp);
        }

        const headers = {
            Accept: "application/json",
            Authorization: `Bearer ${zembraApiToken}`,
        };

        if (mode === "create-review-job") {
            // Create review job - POST request
            const response = await fetch(baseUrl.toString(), {
                method: "POST",
                headers,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Failed to create review job: ${response.status} ${errorText}`,
                );
            }

            const data: ZembraJobResponse = await response.json();

            const result: ZembraClientResponse = {
                success: true,
                jobId: data.data.job.jobId,
            };

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        } else if (mode === "get-reviews") {
            // Get reviews with retry logic - GET request
            let retryCount = 0;
            const maxRetries = 3;
            const backoffDelays = [10000, 15000, 20000]; // 10s, 15s, 20s

            while (retryCount <= maxRetries) {
                try {
                    const response = await fetch(baseUrl.toString(), {
                        method: "GET",
                        headers,
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(
                            `Failed to fetch reviews: ${response.status} ${errorText}`,
                        );
                    }

                    const data: ZembraReviewsResponse = await response.json();

                    // Check if reviews are available
                    if (
                        data.status === "SUCCESS" &&
                        data.data.reviews &&
                        data.data.reviews.length > 0
                    ) {
                        const result: ZembraClientResponse = {
                            success: true,
                            reviews: data.data.reviews,
                            retryCount,
                        };

                        return new Response(JSON.stringify(result), {
                            headers: {
                                ...corsHeaders,
                                "Content-Type": "application/json",
                            },
                            status: 200,
                        });
                    }

                    // If no reviews yet and we haven't maxed retries, retry
                    if (retryCount < maxRetries) {
                        const delay = backoffDelays[retryCount];
                        console.log(
                            `No reviews available yet. Retrying in ${
                                delay / 1000
                            }s (attempt ${retryCount + 1}/${maxRetries})`,
                        );
                        await sleep(delay);
                        retryCount++;
                    } else {
                        // No reviews after all retries
                        const result: ZembraClientResponse = {
                            success: true,
                            reviews: [],
                            retryCount,
                        };

                        return new Response(JSON.stringify(result), {
                            headers: {
                                ...corsHeaders,
                                "Content-Type": "application/json",
                            },
                            status: 200,
                        });
                    }
                } catch (error) {
                    if (retryCount < maxRetries) {
                        const delay = backoffDelays[retryCount];
                        console.error(
                            `Error fetching reviews (attempt ${
                                retryCount + 1
                            }). Retrying in ${delay / 1000}s:`,
                            error,
                        );
                        await sleep(delay);
                        retryCount++;
                    } else {
                        // All retries exhausted, throw the error
                        throw error;
                    }
                }
            }

            // If we exit the while loop without returning, return empty reviews
            const result: ZembraClientResponse = {
                success: true,
                reviews: [],
                retryCount,
            };

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        } else if (mode === "listing") {
            // Verify listing exists on platform
            const response = await fetch(
                `https://api.zembra.io/listing/${network}/?slug=${
                    encodeURIComponent(slug)
                }`,
                {
                    method: "GET",
                    headers,
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Failed to fetch listing: ${response.status} ${errorText}`,
                );
            }

            const data: ZembraListingResponse = await response.json();

            if (data.status !== "SUCCESS") {
                throw new Error(data.message || "Listing not found");
            }

            const result: ZembraClientResponse = {
                success: true,
                listing: data.data,
            };

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        } else {
            throw new Error(`Invalid mode: ${mode}`);
        }
    } catch (error) {
        console.error("Error in zembra-client:", error);

        const result: ZembraClientResponse = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
