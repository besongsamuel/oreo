// Platform-agnostic interfaces for review platform integrations

export interface StandardReview {
    externalId: string;
    authorName: string;
    authorAvatar?: string;
    rating: number; // Normalized to 0-5 scale
    content: string;
    title?: string;
    publishedAt: Date;
    replyContent?: string;
    replyAt?: Date;
    rawData: any; // Original platform response
}

export interface PlatformPage {
    id: string;
    name: string;
    profilePicture?: string;
    url?: string;
    metadata?: any;
}

export interface PlatformConfig {
    name: string;
    displayName: string;
    color: string;
    iconUrl?: string;
    baseUrl?: string;
    status: "active" | "coming_soon" | "maintenance";
}

export interface PlatformProvider {
    authenticate(): Promise<string>; // Returns access token
    getUserPages(accessToken: string): Promise<PlatformPage[]>;
    fetchReviews(
        pageId: string,
        accessToken: string,
        options?: any,
    ): Promise<StandardReview[]>;
    getPlatformConfig(): PlatformConfig;
}

export interface PlatformConnectionResult {
    success: boolean;
    reviewsImported: number;
    error?: string;
}

export interface SyncStats {
    reviewsFetched: number;
    reviewsNew: number;
    reviewsUpdated: number;
    errorMessage?: string;
}
