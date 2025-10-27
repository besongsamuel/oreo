// Type definitions for Zembra API

export interface ZembraAuthor {
    id: string;
    name: string;
    url?: string;
    location?: string;
    photo?: string;
}

export interface ZembraReview {
    id: string;
    text: string;
    timestamp: string;
    rating: number;
    recommendation: string | null;
    translation: string | null;
    author: ZembraAuthor;
}

export interface ZembraJob {
    network: string;
    slug: string;
    jobId: string;
    uid: string;
    monitoring: string;
    internalId: string | null;
    requestedAt: string;
    expiresAt: string;
    includeRawData: boolean;
    cost: number;
    active: boolean;
    sizeLimit: number | null;
    dateLimit: number | null;
}

export interface ZembraTarget {
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
}

export interface ZembraJobResponse {
    status: string;
    message: string;
    data: {
        job: ZembraJob;
    };
}

export interface ZembraReviewsResponse {
    status: string;
    message: string;
    data: {
        job: ZembraJob;
        target: ZembraTarget;
        reviews: ZembraReview[];
        returned: number;
    };
}

export interface ZembraListingResponse {
    status: string;
    message: string;
    data: ZembraTarget;
    cost: number;
    balance: number;
}

export interface ZembraClientRequest {
    mode: "create-review-job" | "get-reviews" | "listing";
    network: string;
    slug: string;
    postedAfter?: string; // ISO timestamp for incremental fetches
}

export interface ZembraClientResponse {
    success: boolean;
    jobId?: string;
    reviews?: ZembraReview[];
    listing?: ZembraTarget;
    error?: string;
    retryCount?: number;
}
