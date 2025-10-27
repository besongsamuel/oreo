import { useState } from "react";
import { useSupabase } from "../hooks/useSupabase";
import { getPlatformProvider } from "../services/platforms/platformRegistry";
import {
    PlatformConnectionResult,
    PlatformPage,
} from "../services/platforms/types";
import { ReviewsService } from "../services/reviewsService";

export function usePlatformIntegration() {
    const supabase = useSupabase();
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Helper function to handle Zembra-based platforms (Yelp, Facebook, etc.)
    const handleZembraPlatformConnection = async (
        network: string,
        pageId: string,
        connection: any,
        reviewsService: ReviewsService,
    ): Promise<PlatformConnectionResult> => {
        // Create Zembra review job
        const createJobResponse = await supabase.functions.invoke(
            "zembra-client",
            {
                body: {
                    mode: "create-review-job",
                    network: network,
                    slug: pageId,
                },
            },
        );

        if (!createJobResponse.data?.success) {
            throw new Error(
                createJobResponse.data?.error ||
                    "Failed to create Zembra review job",
            );
        }

        const jobId = createJobResponse.data.jobId;

        // Get full connection to access metadata
        const { data: fullConnection } = await supabase
            .from("platform_connections")
            .select("metadata")
            .eq("id", connection.id)
            .single();

        // Update connection with Zembra job ID in metadata
        await supabase
            .from("platform_connections")
            .update({
                metadata: {
                    ...(fullConnection?.metadata || {}),
                    zembra_job_id: jobId,
                },
            })
            .eq("id", connection.id);

        // Wait for job to process
        await new Promise((resolve) => setTimeout(resolve, 15000));

        // Fetch reviews from Zembra
        const getReviewsResponse = await supabase.functions.invoke(
            "zembra-client",
            {
                body: {
                    mode: "get-reviews",
                    network: network,
                    slug: pageId,
                },
            },
        );

        if (!getReviewsResponse.data?.success) {
            throw new Error(
                getReviewsResponse.data?.error ||
                    "Failed to fetch reviews from Zembra",
            );
        }

        const zembraReviews = getReviewsResponse.data.reviews || [];

        // Transform Zembra reviews to StandardReview format
        const reviews = zembraReviews.map((review: any) => {
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
                authorName: review.author?.name || "Anonymous",
                authorAvatar: review.author?.photo,
                rating: rating,
                content: review.text || "",
                title: undefined,
                publishedAt: new Date(review.timestamp),
                replyContent: undefined,
                replyAt: undefined,
                rawData: review,
            };
        });

        // Save reviews to database
        const stats = await reviewsService.saveReviews(connection.id, reviews);

        // Get full connection to access metadata
        const { data: currentConnection } = await supabase
            .from("platform_connections")
            .select("metadata")
            .eq("id", connection.id)
            .single();

        // Update connection with fetch time and count in metadata
        await supabase
            .from("platform_connections")
            .update({
                metadata: {
                    ...(currentConnection?.metadata || {}),
                    zembra_last_fetch_at: new Date().toISOString(),
                    zembra_review_count: zembraReviews.length,
                },
            })
            .eq("id", connection.id);

        // Create sync log
        await reviewsService.createSyncLog(connection.id, stats);

        return {
            success: true,
            reviewsImported: stats.reviewsNew + stats.reviewsUpdated,
        };
    };

    // Helper function to handle Zembra-based platform fetches (Yelp, Facebook, etc.)
    const handleZembraPlatformFetch = async (
        network: string,
        pageId: string,
        platformConnectionId: string,
        reviewsService: ReviewsService,
    ): Promise<PlatformConnectionResult> => {
        // Get the last fetch time from connection metadata
        const { data: connection } = await supabase
            .from("platform_connections")
            .select("metadata")
            .eq("id", platformConnectionId)
            .single();

        const metadata = connection?.metadata || {};
        const lastFetchAt = metadata.zembra_last_fetch_at;
        const currentReviewCount = metadata.zembra_review_count || 0;

        // Calculate time difference if last fetch exists
        let shouldFetch = true;
        let postedAfter: string | undefined = undefined;

        if (lastFetchAt) {
            const now = new Date();
            const lastFetch = new Date(lastFetchAt);
            const daysSinceLastFetch = (now.getTime() - lastFetch.getTime()) /
                (1000 * 60 * 60 * 24);

            if (daysSinceLastFetch < 5) {
                // Don't fetch if less than 5 days
                shouldFetch = false;
                postedAfter = undefined;
            } else {
                // Use last fetch time for incremental fetch
                postedAfter = lastFetchAt;
            }
        }

        if (!shouldFetch) {
            // Return empty results without fetching
            return {
                success: true,
                reviewsImported: 0,
            };
        }

        // First, create a new review job to get the latest reviews
        const createJobResponse = await supabase.functions.invoke(
            "zembra-client",
            {
                body: {
                    mode: "create-review-job",
                    network: network,
                    slug: pageId,
                },
            },
        );

        if (!createJobResponse.data?.success) {
            throw new Error(
                createJobResponse.data?.error ||
                    "Failed to create Zembra review job",
            );
        }

        const jobId = createJobResponse.data.jobId;

        await supabase
            .from("platform_connections")
            .update({
                metadata: {
                    ...metadata,
                    zembra_job_id: jobId,
                },
            })
            .eq("id", platformConnectionId);

        // Wait for job to process
        await new Promise((resolve) => setTimeout(resolve, 30000));

        // Now call get-reviews with postedAfter if it exists
        const getReviewsResponse = await supabase.functions.invoke(
            "zembra-client",
            {
                body: {
                    mode: "get-reviews",
                    network: network,
                    slug: pageId,
                    postedAfter: postedAfter,
                },
            },
        );

        if (!getReviewsResponse.data?.success) {
            throw new Error(
                getReviewsResponse.data?.error ||
                    "Failed to fetch reviews from Zembra",
            );
        }

        const zembraReviews = getReviewsResponse.data.reviews || [];

        // Transform Zembra reviews to StandardReview format
        const reviews = zembraReviews.map((review: any) => {
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
                authorName: review.author?.name || "Anonymous",
                authorAvatar: review.author?.photo,
                rating: rating,
                content: review.text || "",
                title: undefined,
                publishedAt: new Date(review.timestamp),
                replyContent: undefined,
                replyAt: undefined,
                rawData: review,
            };
        });

        // Save reviews to database
        const stats = await reviewsService.saveReviews(
            platformConnectionId,
            reviews,
        );

        // Update connection with fetch time and count in metadata
        await supabase
            .from("platform_connections")
            .update({
                metadata: {
                    ...metadata,
                    zembra_last_fetch_at: new Date().toISOString(),
                    zembra_review_count: currentReviewCount + reviews.length,
                },
            })
            .eq("id", platformConnectionId);

        // Create sync log
        await reviewsService.createSyncLog(platformConnectionId, stats);

        return {
            success: true,
            reviewsImported: stats.reviewsNew + stats.reviewsUpdated,
        };
    };

    const connectPlatformUnified = async (
        platformName: string,
        platformLocationId: string,
        locationId: string,
        verifiedListing?: any, // ZembraTarget - listing data from Zembra
    ): Promise<PlatformConnectionResult> => {
        setConnecting(true);
        setError(null);
        setSuccess(null);

        try {
            const reviewsService = new ReviewsService(supabase);

            // Get platform record
            const platform = await reviewsService.getPlatformByName(
                platformName,
            );

            // Extract platform URL from verified listing
            const platformUrl = verifiedListing?.url;

            // Create platform connection with URL from verified listing
            const connection = await reviewsService
                .getOrCreatePlatformConnection(
                    locationId,
                    platform.id,
                    platformLocationId,
                    platformUrl, // Use URL from Zembra listing verification
                    undefined, // accessToken not needed
                );

            // Create Zembra review job
            const createJobResponse = await supabase.functions.invoke(
                "zembra-client",
                {
                    body: {
                        mode: "create-review-job",
                        network: platformName,
                        slug: platformLocationId,
                    },
                },
            );

            if (!createJobResponse.data?.success) {
                throw new Error(
                    createJobResponse.data?.error ||
                        "Failed to create review job",
                );
            }

            // Update connection metadata with job ID
            const jobId = createJobResponse.data.jobId;
            await supabase
                .from("platform_connections")
                .update({
                    metadata: {
                        zembraJobId: jobId,
                    },
                })
                .eq("id", connection.id);

            setSuccess(
                `Successfully connected ${platformName}. Reviews will be imported shortly.`,
            );

            return {
                success: true,
                reviewsImported: 0, // Reviews will come via webhook
            };
        } catch (err: any) {
            const errorMessage = err.message || "Failed to connect platform";
            setError(errorMessage);

            return {
                success: false,
                reviewsImported: 0,
                error: errorMessage,
            };
        } finally {
            setConnecting(false);
        }
    };

    const connectPlatform = async (
        platformName: string,
        companyId: string,
        page: PlatformPage,
        locationId: string,
    ): Promise<PlatformConnectionResult> => {
        setConnecting(true);
        setError(null);
        setSuccess(null);

        try {
            const provider = getPlatformProvider(platformName);
            if (!provider) {
                throw new Error(`Platform ${platformName} is not available`);
            }

            const reviewsService = new ReviewsService(supabase);

            // Get platform record
            const platform = await reviewsService.getPlatformByName(
                platformName,
            );

            // Extract page information directly from the page object
            const pageId = page.id;
            const pageAccessToken = page.metadata?.accessToken;

            // For Zembra-based platforms (Yelp, Facebook), use the helper function
            const platformNameLower = platformName.toLowerCase();
            if (
                platformNameLower === "yelp" || platformNameLower === "facebook"
            ) {
                // Create platform connection first
                const connection = await reviewsService
                    .getOrCreatePlatformConnection(
                        locationId,
                        platform.id,
                        pageId,
                        page.url,
                        pageAccessToken,
                    );

                // Handle Zembra connection
                const result = await handleZembraPlatformConnection(
                    platformNameLower,
                    pageId,
                    connection,
                    reviewsService,
                );

                setSuccess(
                    `Successfully imported ${result.reviewsImported} reviews from ${platformName}`,
                );
                return result;
            } else {
                // Standard flow for other platforms
                const connection = await reviewsService
                    .getOrCreatePlatformConnection(
                        locationId,
                        platform.id,
                        pageId,
                        page.url,
                        pageAccessToken,
                    );

                // Fetch reviews with page access token
                const reviews = await provider.fetchReviews(
                    pageId,
                    pageAccessToken || "",
                    {
                        pageAccessToken,
                    },
                );

                // Save reviews to database
                const stats = await reviewsService.saveReviews(
                    connection.id,
                    reviews,
                );

                // Create sync log
                await reviewsService.createSyncLog(connection.id, stats);

                const result: PlatformConnectionResult = {
                    success: true,
                    reviewsImported: stats.reviewsNew + stats.reviewsUpdated,
                };

                setSuccess(
                    `Successfully imported ${result.reviewsImported} reviews from ${platformName}`,
                );
                return result;
            }
        } catch (err: any) {
            const errorMessage = err.message || "Failed to connect platform";
            setError(errorMessage);

            return {
                success: false,
                reviewsImported: 0,
                error: errorMessage,
            };
        } finally {
            setConnecting(false);
        }
    };

    const fetchReviews = async (
        platformName: string,
        pageId: string,
        platformConnectionId: string,
    ): Promise<PlatformConnectionResult> => {
        setConnecting(true);
        setError(null);
        setSuccess(null);

        try {
            const provider = getPlatformProvider(platformName);
            if (!provider) {
                throw new Error(`Platform ${platformName} is not available`);
            }

            const reviewsService = new ReviewsService(supabase);

            // For Zembra-based platforms (Yelp, Facebook), use the helper function
            const platformNameLower = platformName.toLowerCase();
            if (
                platformNameLower === "yelp" || platformNameLower === "facebook"
            ) {
                const result = await handleZembraPlatformFetch(
                    platformNameLower,
                    pageId,
                    platformConnectionId,
                    reviewsService,
                );

                setSuccess(
                    `Successfully imported ${result.reviewsImported} reviews from ${platformName}`,
                );
                return result;
            } else {
                // Standard flow for other platforms
                // Authenticate with the platform to get access token
                const accessToken = await provider.authenticate();

                // Get user pages to find the specific page and its token
                const userPages = await provider.getUserPages(accessToken);
                const targetPage = userPages.find((page) => page.id === pageId);

                if (!targetPage) {
                    throw new Error(`Page ${pageId} not found in user pages`);
                }

                // Get the page access token from the page metadata
                const pageAccessToken = targetPage.metadata?.accessToken;
                if (!pageAccessToken) {
                    throw new Error(`No access token found for page ${pageId}`);
                }

                // Fetch reviews with page access token
                const reviews = await provider.fetchReviews(
                    pageId,
                    pageAccessToken,
                    {
                        pageAccessToken,
                    },
                );

                // Save reviews to database
                const stats = await reviewsService.saveReviews(
                    platformConnectionId,
                    reviews,
                );

                // Note: Sentiment analysis is now triggered automatically by database webhook
                // when reviews are inserted, so no manual call is needed

                // Create sync log
                await reviewsService.createSyncLog(platformConnectionId, stats);

                const result: PlatformConnectionResult = {
                    success: true,
                    reviewsImported: stats.reviewsNew + stats.reviewsUpdated,
                };

                setSuccess(
                    `Successfully imported ${result.reviewsImported} reviews from ${platformName}`,
                );
                return result;
            }
        } catch (err: any) {
            const errorMessage = err.message || "Failed to fetch reviews";
            setError(errorMessage);

            return {
                success: false,
                reviewsImported: 0,
                error: errorMessage,
            };
        } finally {
            setConnecting(false);
        }
    };

    return {
        connecting,
        error,
        success,
        connectPlatform,
        connectPlatformUnified,
        fetchReviews,
        clearMessages: () => {
            setError(null);
            setSuccess(null);
        },
    };
}
