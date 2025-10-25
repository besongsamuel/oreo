import { FacebookProvider } from "./facebook/facebookProvider";
import { GoogleProvider } from "./google/googleProvider";
import { PlatformConfig, PlatformProvider } from "./types";

export interface PlatformRegistryEntry {
    name: string;
    displayName: string;
    color: string;
    iconUrl?: string;
    status: "active" | "coming_soon" | "maintenance";
    provider: PlatformProvider | null;
}

export const PLATFORM_REGISTRY: Record<string, PlatformRegistryEntry> = {
    facebook: {
        name: "facebook",
        displayName: "Facebook",
        color: "#1877F2",
        iconUrl: "https://static.xx.fbcdn.net/rsrc.php/v3/yx/r/pyNVUg5EM0j.png",
        status: "active",
        provider: null, // Will be lazily initialized
    },
    google: {
        name: "google",
        displayName: "Google Business Profile",
        color: "#4285F4",
        iconUrl:
            "https://www.gstatic.com/images/branding/product/1x/google_blue_24dp.png",
        status: "active",
        provider: null,
    },
    yelp: {
        name: "yelp",
        displayName: "Yelp",
        color: "#D32323",
        iconUrl:
            "https://s3-media0.fl.yelpcdn.com/assets/srv0/developer_pages/5b0b5a5c4b4a/assets/img/318x318_yelp_logo.png",
        status: "coming_soon",
        provider: null,
    },
    trustpilot: {
        name: "trustpilot",
        displayName: "Trustpilot",
        color: "#00B67A",
        iconUrl: "https://cdn.trustpilot.net/brand-assets/1.1.0/logo-white.svg",
        status: "coming_soon",
        provider: null,
    },
    tripadvisor: {
        name: "tripadvisor",
        displayName: "TripAdvisor",
        color: "#34E0A1",
        iconUrl:
            "https://static.tacdn.com/img2/brand_refresh/Tripadvisor_lockup_horizontal_secondary_registered.svg",
        status: "coming_soon",
        provider: null,
    },
};

export function getPlatformProvider(
    platformName: string,
): PlatformProvider | null {
    const platform = PLATFORM_REGISTRY[platformName];
    if (!platform) return null;

    // Lazy initialization for Facebook provider to avoid circular dependencies
    if (platformName === "facebook" && !platform.provider) {
        platform.provider = new FacebookProvider();
    }

    // Lazy initialization for Google provider to avoid circular dependencies
    if (platformName === "google" && !platform.provider) {
        platform.provider = new GoogleProvider();
    }

    return platform.provider;
}

export function getActivePlatforms(): PlatformRegistryEntry[] {
    return Object.values(PLATFORM_REGISTRY).filter((platform) =>
        platform.status === "active"
    );
}

export function getAllPlatforms(): PlatformRegistryEntry[] {
    return Object.values(PLATFORM_REGISTRY);
}

export function getPlatformConfig(platformName: string): PlatformConfig | null {
    const platform = PLATFORM_REGISTRY[platformName];
    if (!platform) return null;

    return {
        name: platform.name,
        displayName: platform.displayName,
        color: platform.color,
        iconUrl: platform.iconUrl,
        status: platform.status,
    };
}
