import { PlatformConfig } from "../types";

export const YELP_API_BASE = "https://api.yelp.com/v3";

export const YELP_SEARCH_FUNCTION = process.env
        .REACT_APP_SUPABASE_URL
    ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/search-yelp-businesses`
    : "";

export const YELP_REVIEWS_FUNCTION = process.env
        .REACT_APP_SUPABASE_URL
    ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/fetch-yelp-reviews`
    : "";

export const ZEMBRA_CLIENT_FUNCTION = process.env
        .REACT_APP_SUPABASE_URL
    ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/zembra-client`
    : "";

export const YELP_CONFIG: PlatformConfig = {
    name: "yelp",
    displayName: "Yelp",
    color: "#D32323",
    iconUrl:
        "https://s3-media0.fl.yelpcdn.com/assets/srv0/developer_pages/5b0b5a5c4b4a/assets/img/318x318_yelp_logo.png",
    baseUrl: "https://www.yelp.com",
    status: "active",
};
