import { PlatformConfig } from "../types";

export const FACEBOOK_CONFIG: PlatformConfig = {
    name: "facebook",
    displayName: "Facebook",
    color: "#1877F2",
    iconUrl: "https://static.xx.fbcdn.net/rsrc.php/v3/yx/r/pyNVUg5EM0j.png",
    baseUrl: "https://www.facebook.com",
    status: "active",
};

export const FACEBOOK_PERMISSIONS = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_read_user_content",
];

export const FACEBOOK_API_VERSION = "v24.0";

export const FACEBOOK_GRAPH_API_BASE =
    `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

export const ZEMBRA_CLIENT_FUNCTION = process.env
        .REACT_APP_SUPABASE_URL
    ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/zembra-client`
    : "";
