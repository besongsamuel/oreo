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
        options?: any,
    ): Promise<StandardReview[]> {
        try {
            const reviews: StandardReview[] = [];

            // Try to fetch page ratings/reviews (may fail due to permissions)
            try {
                const ratingsResponse = await fetch(
                    `${FACEBOOK_GRAPH_API_BASE}/${pageId}/ratings?access_token=${accessToken}&limit=100`,
                );

                if (ratingsResponse.ok) {
                    const ratingsData = await ratingsResponse.json();

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
                }
            } catch (ratingsError) {
                console.warn("Failed to fetch page ratings:", ratingsError);
            }

            // Fetch page posts with comments (this should work with current permissions)
            try {
                const postsResponse = await fetch(
                    `${FACEBOOK_GRAPH_API_BASE}/${pageId}/posts?access_token=${accessToken}&limit=50&fields=id,message,created_time,comments{id,message,from,created_time}`,
                );

                if (postsResponse.ok) {
                    const postsData = await postsResponse.json();

                    for (const post of postsData.data || []) {
                        if (post.comments?.data) {
                            for (const comment of post.comments.data) {
                                const review = this.transformCommentToReview(
                                    comment,
                                    post,
                                );
                                if (review) {
                                    reviews.push(review);
                                }
                            }
                        }
                    }
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
        if (!rating.reviewer || !rating.review_text) {
            return null;
        }

        return {
            externalId: rating.id,
            authorName: rating.reviewer.name,
            authorAvatar: rating.reviewer.picture?.data?.url,
            rating: rating.rating, // Facebook ratings are already 1-5
            content: rating.review_text,
            title: undefined,
            publishedAt: new Date(rating.created_time),
            replyContent: rating.response?.message,
            replyAt: rating.response
                ? new Date(rating.response.created_time)
                : undefined,
            rawData: rating,
        };
    }

    private transformCommentToReview(
        comment: any,
        post: any,
    ): StandardReview | null {
        if (!comment.from || !comment.message) {
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
        const messageLower = comment.message.toLowerCase();
        const isReview = reviewKeywords.some((keyword) =>
            messageLower.includes(keyword)
        );

        if (!isReview) {
            return null;
        }

        return {
            externalId: `comment_${comment.id}`,
            authorName: comment.from.name,
            authorAvatar: comment.from.picture?.data?.url,
            rating: 0, // Comments don't have ratings, will be analyzed by AI later
            content: comment.message,
            title: undefined,
            publishedAt: new Date(comment.created_time),
            replyContent: undefined,
            replyAt: undefined,
            rawData: { comment, post },
        };
    }
}
