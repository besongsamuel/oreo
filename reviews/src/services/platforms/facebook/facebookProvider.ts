import { PlatformPage, PlatformProvider, StandardReview } from "../types";
import {
    FACEBOOK_CONFIG,
    FACEBOOK_GRAPH_API_BASE,
    FACEBOOK_PERMISSIONS,
} from "./facebookConfig";

// Extend Window interface to include FB
declare global {
    interface Window {
        FB: any;
    }
}

export class FacebookProvider implements PlatformProvider {
    private appId: string;

    constructor() {
        this.appId = process.env.REACT_APP_FACEBOOK_APP_ID || "";
        if (!this.appId) {
            throw new Error(
                "Facebook App ID not found in environment variables",
            );
        }
    }

    getPlatformConfig() {
        return FACEBOOK_CONFIG;
    }

    async authenticate(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!window.FB) {
                reject(new Error("Facebook SDK not loaded"));
                return;
            }

            // Check if we're on HTTPS or localhost
            const isSecure = window.location.protocol === "https:" ||
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1";

            if (!isSecure) {
                reject(
                    new Error(
                        "Facebook login requires HTTPS. Please use https://localhost:3000 or configure your Facebook app for HTTP development.",
                    ),
                );
                return;
            }

            window.FB.login(
                (response: any) => {
                    if (response.authResponse) {
                        resolve(response.authResponse.accessToken);
                    } else {
                        reject(
                            new Error(
                                "User cancelled login or did not fully authorize",
                            ),
                        );
                    }
                },
                {
                    scope: FACEBOOK_PERMISSIONS.join(","),
                },
            );
        });
    }

    async getUserPages(accessToken: string): Promise<PlatformPage[]> {
        try {
            const response = await fetch(
                `${FACEBOOK_GRAPH_API_BASE}/me/accounts?access_token=${accessToken}`,
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch pages: ${response.statusText}`,
                );
            }

            const data = await response.json();

            return data.data.map((page: any) => ({
                id: page.id,
                name: page.name,
                profilePicture: page.picture?.data?.url,
                url: page.link,
                metadata: {
                    category: page.category,
                    followers: page.followers_count,
                    accessToken: page.access_token,
                },
            }));
        } catch (error) {
            console.error("Error fetching Facebook pages:", error);
            throw error;
        }
    }

    async fetchReviews(
        pageId: string,
        accessToken: string,
        options?: { pageAccessToken?: string },
    ): Promise<StandardReview[]> {
        try {
            const reviews: StandardReview[] = [];

            // Use page access token if available, otherwise fall back to user access token
            const tokenToUse = options?.pageAccessToken || accessToken;

            // Try to fetch page ratings/reviews (may fail due to permissions)
            try {
                const ratingsResponse = await fetch(
                    `${FACEBOOK_GRAPH_API_BASE}/${pageId}/ratings?access_token=${tokenToUse}&limit=100`,
                );

                if (ratingsResponse.ok) {
                    const ratingsData = await ratingsResponse.json();
                    console.log(
                        `Fetched ${
                            ratingsData.data?.length || 0
                        } ratings from Facebook`,
                    );

                    for (const rating of ratingsData.data || []) {
                        const review = this.transformRatingToReview(rating);
                        if (review) {
                            reviews.push(review);
                        }
                    }
                } else if (ratingsResponse.status === 403) {
                    console.warn(
                        "Access to page ratings denied. This may be due to Facebook's restricted access to ratings API.",
                    );
                } else {
                    console.warn(
                        `Failed to fetch ratings: ${ratingsResponse.status} ${ratingsResponse.statusText}`,
                    );
                }
            } catch (ratingsError) {
                console.warn("Failed to fetch page ratings:", ratingsError);
            }

            // Fetch page posts with comments (this should work with current permissions)
            try {
                const postsResponse = await fetch(
                    `${FACEBOOK_GRAPH_API_BASE}/${pageId}/feed?fields=from,id,admin_creator,created_time,message&access_token=${tokenToUse}&limit=50`,
                );

                if (postsResponse.ok) {
                    const postsData = await postsResponse.json();
                    console.log(
                        `Fetched ${
                            postsData.data?.length || 0
                        } posts from Facebook`,
                    );

                    for (const post of postsData.data || []) {
                        if (post.message) {
                            const review = this.transformCommentToReview(
                                post,
                            );
                            if (review) {
                                reviews.push(review);
                            }
                        }
                    }
                } else {
                    console.warn(
                        `Failed to fetch posts: ${postsResponse.status} ${postsResponse.statusText}`,
                    );
                }
            } catch (postsError) {
                console.warn("Failed to fetch page posts:", postsError);
            }

            // If no reviews found, throw an informative error
            if (reviews.length === 0) {
                throw new Error(
                    "No reviews found. Facebook has restricted access to page ratings. " +
                        "Consider using Facebook Business Manager or alternative review collection methods.",
                );
            }

            return reviews;
        } catch (error) {
            console.error("Error fetching Facebook reviews:", error);
            throw error;
        }
    }

    private transformRatingToReview(rating: any): StandardReview | null {
        // Validate required fields
        if (!rating || !rating.review_text) {
            return null;
        }

        // Generate hash-based external ID from created_time and review_text
        const externalId = this.generateHash(
            rating.created_time + rating.review_text,
        );

        // Extract author information from 'from' field if available
        let authorName = "anonymous";
        let authorId: string | undefined = undefined;

        if (rating.from && typeof rating.from === "object") {
            if (rating.from.name) {
                authorName = rating.from.name;
            }
            if (rating.from.id) {
                authorId = rating.from.id;
            }
        }

        // Determine rating based on recommendation_type
        let normalizedRating = 0;
        if (rating.recommendation_type === "positive") {
            normalizedRating = 5;
        } else if (rating.recommendation_type === "negative") {
            normalizedRating = 1;
        }

        // Validate and normalize published date
        let publishedDate: Date;
        try {
            publishedDate = new Date(rating.created_time);
            if (isNaN(publishedDate.getTime())) {
                publishedDate = new Date(); // Fallback to current date
            }
        } catch (error) {
            publishedDate = new Date(); // Fallback to current date
        }

        // Create rawData with author information included
        const rawData = {
            ...rating,
            authorId,
            authorName,
        };

        return {
            externalId,
            authorName,
            authorAvatar: undefined,
            rating: normalizedRating,
            content: rating.review_text,
            title: undefined,
            publishedAt: publishedDate,
            replyContent: undefined,
            replyAt: undefined,
            rawData,
        };
    }

    private transformCommentToReview(
        post: any,
    ): StandardReview | null {
        // Validate required fields
        if (!post || !post.message) {
            return null;
        }

        // Extract external ID (id if present, else fallback to created_time)
        const externalId = post.id ?? post.created_time;

        // Extract author information from 'from' field if available
        let authorName = "anonymous";
        let authorId: string | undefined = undefined;

        if (post.from && typeof post.from === "object") {
            if (post.from.name) {
                authorName = post.from.name;
            }
            if (post.from.id) {
                authorId = post.from.id;
            }
        }

        // Validate and normalize published date
        let publishedDate: Date;
        try {
            publishedDate = new Date(post.created_time);
            if (isNaN(publishedDate.getTime())) {
                publishedDate = new Date(); // Fallback to current date
            }
        } catch (error) {
            publishedDate = new Date(); // Fallback to current date
        }

        // Create rawData with author information included
        const rawData = {
            ...post,
            authorId,
            authorName,
        };

        return {
            externalId,
            authorName,
            authorAvatar: undefined,
            rating: 0, // Posts don't have ratings, will be analyzed by AI later
            content: post.message,
            title: undefined,
            publishedAt: publishedDate,
            replyContent: undefined,
            replyAt: undefined,
            rawData,
        };
    }

    /**
     * Generate a deterministic hash from a string input
     * Uses a simple hash function that's consistent across runs
     */
    private generateHash(input: string): string {
        let hash = 0;
        if (input.length === 0) return hash.toString();

        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash).toString(36);
    }
}
