import { PlatformPage, PlatformProvider, StandardReview } from "../types";
import {
    YELP_CONFIG,
    YELP_REVIEWS_FUNCTION,
    YELP_SEARCH_FUNCTION,
} from "./yelpConfig";

export class YelpProvider implements PlatformProvider {
    getPlatformConfig() {
        return YELP_CONFIG;
    }

    async authenticate(): Promise<string> {
        // Yelp doesn't use OAuth, so we just return an empty string
        // The API key is stored in the edge function environment
        return "";
    }

    async getUserPages(accessToken: string): Promise<PlatformPage[]> {
        try {
            // Get company name from somewhere - we need to pass it as a parameter
            // For now, we'll get it from the URL or context
            // Since getUserPages doesn't accept additional params, we'll need to
            // store the company name in a different way or modify the interface

            // The company name should be passed through metadata or stored in context
            // For now, we'll throw an error indicating this needs to be handled
            throw new Error(
                "Yelp getUserPages requires a company name. This should be called from PlatformConnectionDialog with the company name.",
            );
        } catch (error) {
            console.error("Error in Yelp getUserPages:", error);
            throw error;
        }
    }

    async searchBusinesses(
        companyName: string,
        location?: string,
    ): Promise<PlatformPage[]> {
        try {
            if (!YELP_SEARCH_FUNCTION) {
                throw new Error(
                    "Yelp search function URL not configured. Please set REACT_APP_SUPABASE_URL.",
                );
            }

            const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
            const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error("Supabase configuration not found");
            }

            const response = await fetch(YELP_SEARCH_FUNCTION, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    companyName,
                    location: location || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Failed to search Yelp businesses: ${
                        errorData.error || "Unknown error"
                    }`,
                );
            }

            const data = await response.json();
            return data.businesses || [];
        } catch (error) {
            console.error("Error searching Yelp businesses:", error);
            throw error;
        }
    }

    async fetchReviews(
        businessId: string,
        accessToken: string,
        options?: any,
    ): Promise<StandardReview[]> {
        try {
            if (!YELP_REVIEWS_FUNCTION) {
                throw new Error(
                    "Yelp reviews function URL not configured. Please set REACT_APP_SUPABASE_URL.",
                );
            }

            const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
            const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error("Supabase configuration not found");
            }

            const response = await fetch(YELP_REVIEWS_FUNCTION, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({ businessId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Failed to fetch Yelp reviews: ${
                        errorData.error || "Unknown error"
                    }`,
                );
            }

            const data = await response.json();
            const yelpReviews = data.reviews || [];

            // Transform Yelp reviews to StandardReview format
            return yelpReviews.map((review: any) =>
                this.transformYelpReview(review)
            );
        } catch (error) {
            console.error("Error fetching Yelp reviews:", error);
            throw error;
        }
    }

    private transformYelpReview(review: any): StandardReview {
        return {
            externalId: review.id || this.generateHash(review.text),
            authorName: review.user?.name || "Anonymous",
            authorAvatar: review.user?.image_url,
            rating: review.rating || 0,
            content: review.text || "",
            title: undefined,
            publishedAt: new Date(review.time_created),
            replyContent: undefined,
            replyAt: undefined,
            rawData: review,
        };
    }

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
