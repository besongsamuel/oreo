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
                    `${FACEBOOK_GRAPH_API_BASE}/${pageId}/ratings?fields=id,reviewer{id,name},rating,review_text,created_time,response{message,created_time}&access_token=${tokenToUse}&limit=100`,
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
                    `${FACEBOOK_GRAPH_API_BASE}/${pageId}/posts?access_token=${tokenToUse}&limit=50`,
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

        // Extract additional reviewer information
        const reviewer = rating.reviewer ??
            { id: `anonymous`, name: "anonymous" };
        const reviewerId = reviewer.id;
        const reviewerName = reviewer.name;
        const reviewerPicture = reviewer.picture?.url ||
            reviewer.picture?.data?.url;
        const reviewerProfileLink = reviewer.link;

        // Validate and normalize rating
        let normalizedRating = rating.rating ?? 0;
        if (typeof normalizedRating !== "number" || isNaN(normalizedRating)) {
            normalizedRating = 0;
        }
        // Ensure rating is within valid range (0-5)
        normalizedRating = Math.max(0, Math.min(5, normalizedRating));

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

        return {
            externalId: rating.id ?? rating.created_time,
            authorName: reviewerName,
            authorAvatar: reviewerPicture,
            rating: normalizedRating,
            content: rating.review_text,
            title: undefined,
            publishedAt: publishedDate,
            replyContent: rating.response?.message,
            replyAt: rating.response
                ? new Date(rating.response.created_time)
                : undefined,
            rawData: {
                ...rating,
                reviewer: {
                    id: reviewerId,
                    name: reviewerName,
                    picture: reviewerPicture,
                    profile_link: reviewerProfileLink,
                },
            },
        };
    }

    private transformCommentToReview(
        post: any,
    ): StandardReview | null {
        // Validate required fields
        if (!post || !post.message) {
            return null;
        }

        // Only include comments that seem like reviews (contain keywords)
        const reviewKeywords = [
            "good",
            "bad",
            "great",
            "terrible",
            "excellent",
            "awful",
            "love",
            "hate",
            "recommend",
            "avoid",
        ];
        const messageLower = post.message.toLowerCase();
        const isReview = reviewKeywords.some((keyword) =>
            messageLower.includes(keyword)
        );

        if (!isReview) {
            return null;
        }

        // Extract additional reviewer information from comment
        const reviewer = { id: `anonymous`, name: "anonymous" };
        const reviewerId = reviewer.id;
        const reviewerName = reviewer.name;

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

        return {
            externalId: post.id,
            authorName: reviewerName,
            authorAvatar: undefined,
            rating: 0, // Comments don't have ratings, will be analyzed by AI later
            content: post.message,
            title: undefined,
            publishedAt: publishedDate,
            replyContent: undefined,
            replyAt: undefined,
            rawData: {
                ...post,
                reviewer: {
                    id: reviewerId,
                    name: reviewerName,
                },
            },
        };
    }
}
