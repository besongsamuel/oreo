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

            // Get platform connection to retrieve stored access token
            const connection = await reviewsService.getPlatformConnection(
                platformConnectionId,
            );
            const pageAccessToken = connection.access_token;

            // Fetch reviews with page access token
            const reviews = await provider.fetchReviews(
                pageId,
                pageAccessToken || "",
            );

            // Save reviews to database
            const stats = await reviewsService.saveReviews(
                platformConnectionId,
                reviews,
            );

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
