import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface YelpBusinessLocation {
    address1?: string;
    address2?: string;
    address3?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    display_address: string[];
}

interface YelpBusiness {
    id: string;
    name: string;
    image_url?: string;
    url: string;
    rating: number;
    review_count: number;
    location: YelpBusinessLocation;
}

interface YelpSearchResponse {
    businesses: YelpBusiness[];
    total: number;
}

interface PlatformPage {
    id: string;
    name: string;
    profilePicture?: string;
    url?: string;
    metadata?: any;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get Yelp API key from environment
        const yelpApiKey = Deno.env.get("YELP_API_KEY");

        if (!yelpApiKey) {
            throw new Error("Yelp API key not configured");
        }

        // Parse request body
        const { companyName } = await req.json();

        if (!companyName) {
            throw new Error("Company name is required");
        }

        // Search for businesses on Yelp
        const response = await fetch(
            `https://api.yelp.com/v3/businesses/search?term=${
                encodeURIComponent(companyName)
            }&limit=20`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${yelpApiKey}`,
                    "Content-Type": "application/json",
                },
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to search Yelp businesses: ${response.status} ${errorText}`,
            );
        }

        const data: YelpSearchResponse = await response.json();

        // Transform Yelp businesses to PlatformPage format
        const pages: PlatformPage[] = data.businesses.map((business) => ({
            id: business.id,
            name: business.name,
            profilePicture: business.image_url,
            url: business.url,
            metadata: {
                address: business.location.display_address.join(", "),
                city: business.location.city,
                state: business.location.state,
                rating: business.rating,
                review_count: business.review_count,
            },
        }));

        // Return the businesses
        return new Response(JSON.stringify({ businesses: pages }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Error in search-yelp-businesses:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});
