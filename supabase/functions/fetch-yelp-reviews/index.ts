import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface YelpReview {
    id: string;
    rating: number;
    text: string;
    time_created: string;
    url: string;
    user: {
        id: string;
        name: string;
        image_url?: string;
    };
}

interface YelpReviewResponse {
    reviews: YelpReview[];
    total: number;
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
        const { businessId } = await req.json();

        if (!businessId) {
            throw new Error("Business ID is required");
        }

        // Fetch reviews for the business
        // Note: Yelp's public API returns a maximum of 3 reviews per business
        const response = await fetch(
            `https://api.yelp.com/v3/businesses/${businessId}/reviews?limit=50&sort_by=newest`,
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
                `Failed to fetch Yelp reviews: ${response.status} ${errorText}`,
            );
        }

        const data: YelpReviewResponse = await response.json();

        // Return the reviews
        return new Response(JSON.stringify({ reviews: data.reviews }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Error in fetch-yelp-reviews:", error);

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
