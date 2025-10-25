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

            // Create platform connection
            const connection = await reviewsService
                .getOrCreatePlatformConnection(
                    locationId,
                    platform.id,
                    pageId,
                    undefined, // platformUrl
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

            // Trigger sentiment analysis for new reviews
            if (stats.reviewsNew > 0) {
                try {
                    await supabase.functions.invoke(
                        "perform-sentiment-analysis",
                        {
                            body: { connectionId: connection.id },
                        },
                    );
                    console.log(
                        `Triggered sentiment analysis for ${stats.reviewsNew} new reviews`,
                    );
                } catch (err) {
                    console.error("Failed to trigger sentiment analysis:", err);
                    // Don't fail the whole operation if sentiment analysis fails
                }
            }

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
        fetchReviews,
        clearMessages: () => {
            setError(null);
            setSuccess(null);
        },
    };
}
