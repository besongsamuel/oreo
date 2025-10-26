import { PlatformPage, PlatformProvider, StandardReview } from "../types";
import {
    GOOGLE_ACCOUNT_MANAGEMENT_API,
    GOOGLE_API_BASE,
    GOOGLE_CLIENT_ID,
    GOOGLE_CONFIG,
    GOOGLE_REDIRECT_URI,
    GOOGLE_SCOPES,
} from "./googleConfig";

export class GoogleProvider implements PlatformProvider {
    private clientId: string;

    constructor() {
        this.clientId = GOOGLE_CLIENT_ID;
    }

    getPlatformConfig() {
        return GOOGLE_CONFIG;
    }

    async authenticate(): Promise<string> {
        return new Promise((resolve, reject) => {
            // Check for stored authorization code from callback
            const authCode = localStorage.getItem("google_auth_code");
            const authError = localStorage.getItem("google_auth_error");

            // Clear stored values
            localStorage.removeItem("google_auth_code");
            localStorage.removeItem("google_auth_error");

            if (authError) {
                reject(new Error(`Google authentication failed: ${authError}`));
                return;
            }

            if (authCode) {
                // Exchange authorization code for access token
                this.exchangeCodeForToken(authCode)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            // Store current location for redirect after OAuth with platform query param
            const currentPath = window.location.pathname;
            const returnPath = `${currentPath}?fetch_reviews_platform=google`;
            localStorage.setItem("google_oauth_return_path", returnPath);

            // Initiate OAuth flow
            const authUrl = new URL(
                "https://accounts.google.com/o/oauth2/v2/auth",
            );
            authUrl.searchParams.set("client_id", this.clientId);
            authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
            authUrl.searchParams.set("response_type", "code");
            authUrl.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
            authUrl.searchParams.set("access_type", "offline");
            authUrl.searchParams.set("prompt", "consent");

            // Redirect to Google OAuth
            window.location.href = authUrl.toString();

            // Note: This promise will never resolve as we're redirecting
            // The actual resolution happens in the callback page
        });
    }

    private async exchangeCodeForToken(code: string): Promise<string> {
        // Use Supabase Edge Function to securely exchange code for token
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Supabase configuration not found");
        }

        const response = await fetch(
            `${supabaseUrl}/functions/v1/exchange-google-token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    code,
                    redirectUri: GOOGLE_REDIRECT_URI,
                }),
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Failed to exchange code for token: ${
                    errorData.error || "Unknown error"
                }`,
            );
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Token exchange failed");
        }

        return data.access_token;
    }

    async getUserPages(accessToken: string): Promise<PlatformPage[]> {
        try {
            // First, get all accounts
            const accountsResponse = await fetch(
                `${GOOGLE_ACCOUNT_MANAGEMENT_API}/accounts`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );

            if (!accountsResponse.ok) {
                throw new Error(
                    `Failed to fetch accounts: ${accountsResponse.statusText}`,
                );
            }

            const accountsData = await accountsResponse.json();
            const accounts = accountsData.accounts || [];

            // Fetch locations for each account
            const allLocations: PlatformPage[] = [];

            for (const account of accounts) {
                const locationsResponse = await fetch(
                    `${GOOGLE_API_BASE}/${account.name}/locations`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    },
                );

                if (locationsResponse.ok) {
                    const locationsData = await locationsResponse.json();
                    const locations = locationsData.locations || [];

                    const mappedLocations = locations.map((location: any) => ({
                        id: location.name, // Format: accounts/{account}/locations/{location}
                        name: location.title || location.locationName,
                        profilePicture: location.profile?.description
                            ?.profilePhoto?.url,
                        url: location.websiteUri,
                        metadata: {
                            address: location.storefrontAddress,
                            phoneNumber: location.phoneNumbers?.primaryPhone,
                            accountName: account.name,
                            accessToken: accessToken,
                        },
                    }));

                    allLocations.push(...mappedLocations);
                }
            }

            return allLocations;
        } catch (error) {
            console.error("Error fetching Google locations:", error);
            throw error;
        }
    }

    async fetchReviews(
        locationId: string,
        accessToken: string,
        options?: { pageAccessToken?: string; placeId?: string },
    ): Promise<StandardReview[]> {
        try {
            // Google Places API requires a Place ID, not a Business Profile location ID
            const placeId = options?.placeId;

            if (!placeId) {
                console.warn(
                    "No Place ID provided for Google reviews. Google Business Profile API doesn't expose reviews directly.",
                );
                return [];
            }

            // Note: You'll need a Google Maps API key for this
            const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

            if (!apiKey) {
                throw new Error("Google Maps API key not configured");
            }

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`,
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch reviews: ${response.statusText}`,
                );
            }

            const data = await response.json();
            const reviews = data.result?.reviews || [];

            return reviews.map((review: any) =>
                this.transformGoogleReview(review)
            );
        } catch (error) {
            console.error("Error fetching Google reviews:", error);
            throw error;
        }
    }

    private transformGoogleReview(review: any): StandardReview {
        const externalId = this.generateHash(
            review.time + (review.text || ""),
        );

        return {
            externalId,
            authorName: review.author_name || "Anonymous",
            authorAvatar: review.profile_photo_url,
            rating: review.rating || 0,
            content: review.text || "",
            publishedAt: new Date(review.time * 1000), // Unix timestamp to Date
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
