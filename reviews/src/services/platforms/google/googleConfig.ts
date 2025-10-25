export const GOOGLE_CONFIG = {
    name: "google",
    displayName: "Google Business Profile",
    color: "#4285F4",
    iconUrl:
        "https://www.gstatic.com/images/branding/product/1x/google_blue_24dp.png",
    status: "active" as const,
};

export const GOOGLE_CLIENT_ID =
    "797993281283-gtmsam9n5a692n8vtfaatbt9bfl923jc.apps.googleusercontent.com";

export const GOOGLE_REDIRECT_URI = `${window.location.origin}/google-callback`;

export const GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/business.manage",
];

export const GOOGLE_API_BASE =
    "https://mybusinessbusinessinformation.googleapis.com/v1";
export const GOOGLE_ACCOUNT_MANAGEMENT_API =
    "https://mybusinessaccountmanagement.googleapis.com/v1";
