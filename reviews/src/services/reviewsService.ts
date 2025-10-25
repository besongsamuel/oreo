import { SupabaseClient } from "@supabase/supabase-js";
import { StandardReview, SyncStats } from "./platforms/types";

export class ReviewsService {
    constructor(private supabase: SupabaseClient) {}

    async getPlatformByName(platformName: string): Promise<{ id: string }> {
        const { data, error } = await this.supabase
            .from("platforms")
            .select("id")
            .eq("name", platformName)
            .single();

        if (error) {
            throw new Error(`Failed to get platform: ${error.message}`);
        }

        return data;
    }

    async getOrCreatePlatformConnection(
        locationId: string,
        platformId: string,
        platformLocationId: string,
        platformUrl?: string,
        accessToken?: string,
    ): Promise<{ id: string }> {
        // Try to get existing connection
        const { data: existing, error: fetchError } = await this.supabase
            .from("platform_connections")
            .select("id")
            .eq("location_id", locationId)
            .eq("platform_id", platformId)
            .single();

        if (existing && !fetchError) {
            return existing;
        }

        // Create new connection
        const { data, error } = await this.supabase
            .from("platform_connections")
            .insert({
                location_id: locationId,
                platform_id: platformId,
                platform_location_id: platformLocationId,
                platform_url: platformUrl,
                access_token: accessToken,
                is_active: true,
            })
            .select("id")
            .single();

        if (error) {
            throw new Error(
                `Failed to create platform connection: ${error.message}`,
            );
        }

        return data;
    }

    async getPlatformConnection(
        connectionId: string,
    ): Promise<{ id: string; access_token?: string }> {
        const { data, error } = await this.supabase
            .from("platform_connections")
            .select("id, access_token")
            .eq("id", connectionId)
            .single();

        if (error) {
            throw new Error(
                `Failed to get platform connection: ${error.message}`,
            );
        }

        return data;
    }

    async getLocationPlatformConnections(locationId: string): Promise<
        Array<{
            id: string;
            platform_id: string;
            platform_location_id: string;
            platform_url?: string;
            is_active: boolean;
            last_sync_at?: string;
            platform: {
                name: string;
                display_name: string;
                icon_url?: string;
            };
        }>
    > {
        const { data, error } = await this.supabase
            .from("platform_connections")
            .select(`
                id,
                platform_id,
                platform_location_id,
                platform_url,
                is_active,
                last_sync_at,
                platform:platforms(
                    name,
                    display_name,
                    icon_url
                )
            `)
            .eq("location_id", locationId)
            .eq("is_active", true);

        if (error) {
            throw new Error(
                `Failed to get platform connections: ${error.message}`,
            );
        }

        return (data || []).map((item) => ({
            ...item,
            platform: Array.isArray(item.platform)
                ? item.platform[0]
                : item.platform,
        }));
    }

    async saveReviews(
        platformConnectionId: string,
        reviews: StandardReview[],
    ): Promise<SyncStats> {
        let reviewsNew = 0;
        const errors: string[] = [];

        for (const review of reviews) {
            try {
                // First check if review already exists
                const { data: existingReview, error: checkError } = await this
                    .supabase
                    .from("reviews")
                    .select("id, created_at")
                    .eq("platform_connection_id", platformConnectionId)
                    .eq("external_id", review.externalId)
                    .maybeSingle();

                if (checkError) {
                    errors.push(
                        `Failed to check existing review ${review.externalId}: ${checkError.message}`,
                    );
                    continue;
                }

                const reviewData = {
                    platform_connection_id: platformConnectionId,
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
                };

                if (!existingReview) {
                    const { error: insertError } = await this.supabase
                        .from("reviews")
                        .insert(reviewData);

                    if (insertError) {
                        errors.push(
                            `Failed to insert review ${review.externalId}: ${insertError.message}`,
                        );
                    } else {
                        reviewsNew++;
                    }
                }
            } catch (err: any) {
                errors.push(
                    `Error processing review ${review.externalId}: ${err.message}`,
                );
            }
        }

        return {
            reviewsFetched: reviews.length,
            reviewsNew,
            reviewsUpdated: 0,
            errorMessage: errors.length > 0 ? errors.join("; ") : undefined,
        };
    }

    async createSyncLog(
        platformConnectionId: string,
        stats: SyncStats,
    ): Promise<void> {
        const status = stats.errorMessage ? "failed" : "success";

        const { error } = await this.supabase
            .from("sync_logs")
            .insert({
                platform_connection_id: platformConnectionId,
                status,
                reviews_fetched: stats.reviewsFetched,
                reviews_new: stats.reviewsNew,
                reviews_updated: stats.reviewsUpdated,
                error_message: stats.errorMessage,
                started_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
            });

        if (error) {
            console.error("Failed to create sync log:", error);
        }
    }

    async getCompanyLocations(
        companyId: string,
    ): Promise<Array<{ id: string; name: string; address: string }>> {
        const { data, error } = await this.supabase
            .from("locations")
            .select("id, name, address")
            .eq("company_id", companyId)
            .eq("is_active", true);

        if (error) {
            throw new Error(
                `Failed to get company locations: ${error.message}`,
            );
        }

        return data || [];
    }
}
