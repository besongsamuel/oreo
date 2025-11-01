/**
 * Platform Logo Scraper and Upload Script
 *
 * Scrapes platform logos from https://zembratech.com/supported-platforms/,
 * downloads the images, uploads them to Supabase storage, and updates the database.
 *
 * Usage:
 *   node scripts/fetch-platform-logos.js
 *
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for admin operations
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const path = require("path");

// Configuration
const ZEMBRA_URL = "https://zembratech.com/supported-platforms/";
const BUCKET_NAME = "platform_company_logos";
const DELAY_MS = 500; // Delay between requests to avoid overwhelming server

// Platform name mapping (Zembra display name → database slug)
const PLATFORM_NAME_MAP = {
  "Open Table": "opentable",
  "Better Business Bureau": "bbb",
  "Apartment Guide": "apartment-guide",
  "Apple Maps": "apple-maps",
  "Google Local Services Ads": "google-local-services-ads",
  "Google Play": "google-play",
  "Kelley Blue Book": "kelley-blue-book",
  "The Knot": "the-knot",
  "Yellow Pages": "yellow-pages",
  "Product Hunt": "producthunt",
  "Product Review": "productreview",
  "Software Advice": "softwareadvice",
  "Great Schools": "greatschools",
  Abritel: "abritel",
};

// Initialize Supabase client
const supabaseUrl =
  process.env.SUPABASE_URL || "https://obwpbnpwwgmbirvjdzwo.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

// Custom fetch implementation using axios for better Node.js compatibility
function createAxiosFetch(axiosInstance) {
  return async (url, options = {}) => {
    try {
      // Sanitize headers - filter out invalid characters and convert to plain object
      const sanitizedHeaders = {};
      if (options.headers) {
        // Handle Headers object, Map, or plain object
        let headersToProcess = options.headers;

        // Check if it's a Headers-like object with forEach
        if (
          headersToProcess &&
          typeof headersToProcess.forEach === "function" &&
          !Array.isArray(headersToProcess)
        ) {
          const tempHeaders = {};
          headersToProcess.forEach((value, key) => {
            tempHeaders[key] = value;
          });
          headersToProcess = tempHeaders;
        } else if (
          typeof headersToProcess === "object" &&
          headersToProcess !== null
        ) {
          // Already an object, use as-is
          headersToProcess = headersToProcess;
        } else {
          headersToProcess = {};
        }

        // Filter and sanitize header values
        Object.keys(headersToProcess).forEach((key) => {
          if (headersToProcess[key] != null) {
            try {
              let value = headersToProcess[key];
              // Convert to string, handling various types
              if (typeof value !== "string") {
                value = String(value);
              }
              // Remove invalid characters: null bytes, and other control characters
              // Keep \t (0x09), \n (0x0A), \r (0x0D) but remove others
              const sanitizedValue = value
                .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars
                .trim(); // Remove leading/trailing whitespace

              if (sanitizedValue.length > 0 && key.length > 0) {
                // Also sanitize the key
                const sanitizedKey = String(key)
                  .replace(/[\x00-\x1F\x7F]/g, "")
                  .trim();
                if (sanitizedKey.length > 0) {
                  sanitizedHeaders[sanitizedKey] = sanitizedValue;
                }
              }
            } catch (err) {
              // Skip invalid headers
              console.warn(
                `Warning: Skipping invalid header "${key}":`,
                err.message
              );
            }
          }
        });
      }

      // Ensure we always have valid headers object
      const finalHeaders =
        Object.keys(sanitizedHeaders).length > 0 ? sanitizedHeaders : {};

      const response = await axiosInstance({
        method: options.method || "GET",
        url,
        data: options.body,
        headers: finalHeaders,
        timeout: 30000,
        validateStatus: () => true, // Don't throw on any status
      });

      // Create a simple headers object
      const headersObj = {};
      Object.keys(response.headers).forEach((key) => {
        headersObj[key.toLowerCase()] = response.headers[key];
      });

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText || "",
        json: async () => response.data,
        text: async () => {
          if (typeof response.data === "string") {
            return response.data;
          }
          return JSON.stringify(response.data);
        },
        headers: {
          get: (name) => headersObj[name.toLowerCase()],
          has: (name) => name.toLowerCase() in headersObj,
          entries: () => Object.entries(headersObj),
          keys: () => Object.keys(headersObj),
          values: () => Object.values(headersObj),
        },
      };
    } catch (error) {
      throw new Error(`Fetch failed: ${error.message}`);
    }
  };
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: createAxiosFetch(axios),
  },
});

// Statistics
const stats = {
  total: 0,
  successful: 0,
  failed: 0,
  unmatched: [],
  errors: [],
};

/**
 * Normalize platform name for matching
 */
function normalizePlatformName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Match Zembra platform name to database platform name
 */
function matchPlatformName(zembraName, dbPlatforms) {
  // Try direct mapping first
  const mapped = PLATFORM_NAME_MAP[zembraName];
  if (mapped) {
    const found = dbPlatforms.find((p) => p.name === mapped);
    if (found) return found;
  }

  // Try case-insensitive match
  const normalized = normalizePlatformName(zembraName);
  let found = dbPlatforms.find((p) => p.name.toLowerCase() === normalized);

  // Try display name match
  if (!found) {
    found = dbPlatforms.find(
      (p) => p.display_name.toLowerCase() === zembraName.toLowerCase()
    );
  }

  return found || null;
}

/**
 * Fetch Zembra website HTML
 */
async function fetchZembraPage() {
  try {
    console.log(`📥 Fetching ${ZEMBRA_URL}...`);
    const response = await axios.get(ZEMBRA_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch Zembra page:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Status Text: ${error.response.statusText}`);
    }
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    console.error(`   Error Message: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    throw error;
  }
}

/**
 * Parse platform logos from HTML
 * Zembra website structure: Each platform has a div.featured-img containing an img tag
 * with src pointing to cdn.zembratech.com
 */
function parsePlatformLogos(html) {
  const $ = cheerio.load(html);
  const platforms = [];

  // Strategy 1: Look for div.featured-img, then find img within it (primary method)
  $("div.featured-img").each((index, element) => {
    const $featuredImgDiv = $(element);

    // Find the img element within the featured-img div
    const $img = $featuredImgDiv.find("img").first();
    if (!$img.length) return;

    // Get the logo URL from the img src attribute
    const logoUrl = $img.attr("data-src");
    if (!logoUrl) return;

    // Find the platform name - look in the parent structure
    // The featured-img div is usually within a platform item container
    const $parent = $featuredImgDiv
      .parent()
      .closest("li, div, article, section");

    // Try to find platform name from various locations
    let platformName = null;

    // 1. Check alt text
    platformName = $img.attr("alt");

    // 2. Check nearby heading (h1-h6)
    if (!platformName || platformName.trim().length === 0) {
      const heading = $parent.find("h1, h2, h3, h4, h5, h6").first();
      platformName = heading.text().trim();
    }

    // 3. Check for text content in parent container
    if (!platformName || platformName.trim().length === 0) {
      platformName = $parent.text().trim().split("\n")[0].trim();
    }

    // 4. Try to extract from URL filename (e.g., abritelpng.png → Abritel)
    if (!platformName || platformName.trim().length === 0) {
      const urlMatch = logoUrl.match(
        /\/([^\/]+)\.(png|jpg|jpeg|svg|gif|webp)/i
      );
      if (urlMatch) {
        // Remove common suffixes like "png", "logo", etc.
        let nameFromUrl = urlMatch[1]
          .replace(/\.png$/i, "")
          .replace(/\.jpg$/i, "")
          .replace(/\.jpeg$/i, "")
          .replace(/\.svg$/i, "")
          .replace(/logo$/i, "")
          .replace(/icon$/i, "");

        // Handle cases like "abritelpng" where extension is in the filename
        // Split on "png", "jpg", etc. if they appear in the middle
        nameFromUrl = nameFromUrl.replace(/(png|jpg|jpeg|svg|gif|webp)/i, "");

        // Convert to title case
        platformName = nameFromUrl
          .split(/[-_]/)
          .map((word) => {
            // Handle camelCase or all lowercase
            if (word === word.toLowerCase()) {
              return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
          })
          .join(" ")
          .trim();
      }
    }

    // Make URL absolute if relative
    let finalLogoUrl = logoUrl;
    if (finalLogoUrl && !finalLogoUrl.startsWith("http")) {
      if (finalLogoUrl.startsWith("//")) {
        finalLogoUrl = "https:" + finalLogoUrl;
      } else if (finalLogoUrl.startsWith("/")) {
        finalLogoUrl = "https://cdn.zembratech.com" + finalLogoUrl;
      } else {
        finalLogoUrl = "https://cdn.zembratech.com/" + finalLogoUrl;
      }
    }

    if (platformName && platformName.trim().length > 0 && finalLogoUrl) {
      platforms.push({
        name: platformName.trim(),
        logoUrl: finalLogoUrl,
      });
    }
  });

  // Strategy 2: Also check for platform items with structured markup (fallback)
  // Look for any container that might have a featured-img div but wasn't caught above
  $('li, .platform-item, [class*="platform"], article, section').each(
    (index, element) => {
      const $el = $(element);

      // Look for featured-img div within this container
      const $featuredImg = $el.find("div.featured-img img").first();
      if (!$featuredImg.length) {
        return; // Skip if no featured-img found
      }

      // Skip if we already processed this
      const logoUrl = $featuredImg.attr("src");
      if (!logoUrl || platforms.find((p) => p.logoUrl === logoUrl)) {
        return; // Already processed
      }

      // Extract platform name (usually in h3 or heading)
      const nameEl = $el
        .find("h1, h2, h3, h4, h5, h6, .platform-name, [class*='name']")
        .first();
      let platformName = nameEl.text().trim();

      // Fallback: try alt text or other methods if no heading found
      if (!platformName || platformName.length === 0) {
        platformName = $featuredImg.attr("alt");
      }

      if (!platformName || platformName.length === 0) return;

      // Make URL absolute if relative
      let finalLogoUrl = logoUrl;
      if (finalLogoUrl && !finalLogoUrl.startsWith("http")) {
        if (finalLogoUrl.startsWith("//")) {
          finalLogoUrl = "https:" + finalLogoUrl;
        } else if (finalLogoUrl.startsWith("/")) {
          finalLogoUrl = "https://cdn.zembratech.com" + finalLogoUrl;
        } else {
          finalLogoUrl = "https://cdn.zembratech.com/" + finalLogoUrl;
        }
      }

      if (
        platformName &&
        finalLogoUrl &&
        !platforms.find((p) => p.name === platformName)
      ) {
        platforms.push({
          name: platformName,
          logoUrl: finalLogoUrl,
        });
      }
    }
  );

  // Remove duplicates based on platform name
  const uniquePlatforms = [];
  const seenNames = new Set();

  platforms.forEach((platform) => {
    const normalizedName = platform.name.toLowerCase().trim();
    if (!seenNames.has(normalizedName)) {
      seenNames.add(normalizedName);
      uniquePlatforms.push(platform);
    }
  });

  return uniquePlatforms;
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "image/*",
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const contentType = response.headers["content-type"] || "image/png";
    const buffer = Buffer.from(response.data);

    // Determine file extension from Content-Type
    const extensionMap = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };

    let extension = extensionMap[contentType] || "png";

    // Try to get extension from URL
    const urlExt = url.split(".").pop().split("?")[0].toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(urlExt)) {
      extension = urlExt === "jpeg" ? "jpg" : urlExt;
    }

    return {
      buffer,
      contentType,
      extension,
    };
  } catch (error) {
    console.error(`   ⚠️  Download failed for ${url}:`);
    if (error.response) {
      console.error(`      Status: ${error.response.status}`);
    }
    if (error.code) {
      console.error(`      Error Code: ${error.code}`);
    }
    console.error(`      Error Message: ${error.message}`);
    throw error;
  }
}

/**
 * Upload image to Supabase storage
 */
async function uploadToStorage(platformName, imageData) {
  try {
    const fileName = `${platformName}.${imageData.extension}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, imageData.buffer, {
        upsert: true,
        contentType: imageData.contentType,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error(`   ⚠️  Upload failed: ${error.message}`);
    throw error;
  }
}

/**
 * Update database with logo URL
 */
async function updateDatabase(platformId, logoUrl) {
  try {
    const { error } = await supabase
      .from("platforms")
      .update({ icon_url: logoUrl })
      .eq("id", platformId);

    if (error) throw error;
  } catch (error) {
    console.error(`   ⚠️  Database update failed: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch all platforms from database
 */
async function fetchDatabasePlatforms() {
  try {
    const { data, error } = await supabase
      .from("platforms")
      .select("id, name, display_name")
      .eq("is_active", true);

    if (error) {
      console.error("❌ Supabase query error:", error);
      throw new Error(
        `Database query failed: ${error.message || JSON.stringify(error)}`
      );
    }
    return data || [];
  } catch (error) {
    console.error("❌ Failed to fetch platforms from database:");
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    throw error;
  }
}

/**
 * Process a single platform
 */
async function processPlatform(zembraPlatform, dbPlatforms) {
  const dbPlatform = matchPlatformName(zembraPlatform.name, dbPlatforms);

  if (!dbPlatform) {
    stats.unmatched.push(zembraPlatform.name);
    console.log(`   ⚠️  No match found for "${zembraPlatform.name}"`);
    return false;
  }

  try {
    // Download image
    const imageData = await downloadImage(zembraPlatform.logoUrl);
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

    // Upload to storage
    const publicUrl = await uploadToStorage(dbPlatform.name, imageData);
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

    // Update database
    await updateDatabase(dbPlatform.id, publicUrl);

    stats.successful++;
    console.log(
      `   ✓ ${dbPlatform.display_name} → ${dbPlatform.name}.${imageData.extension}`
    );
    return true;
  } catch (error) {
    stats.failed++;
    stats.errors.push({
      platform: dbPlatform.name,
      error: error.message,
    });
    console.log(`   ✗ ${dbPlatform.display_name} - ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting platform logo scraper...\n");

  try {
    // Fetch database platforms
    console.log("📊 Fetching platforms from database...");
    const dbPlatforms = await fetchDatabasePlatforms();
    console.log(`   Found ${dbPlatforms.length} platforms\n`);

    // Fetch Zembra page
    const html = await fetchZembraPage();

    // Parse platform logos
    console.log("🔍 Parsing platform logos from Zembra website...");
    const zembraPlatforms = parsePlatformLogos(html);
    console.log(
      `   Found ${zembraPlatforms.length} platforms on Zembra site\n`
    );

    stats.total = zembraPlatforms.length;

    // Process each platform
    console.log("📤 Processing platforms...\n");
    for (let i = 0; i < zembraPlatforms.length; i++) {
      const zembraPlatform = zembraPlatforms[i];
      console.log(
        `[${i + 1}/${zembraPlatforms.length}] Processing: ${
          zembraPlatform.name
        }`
      );

      await processPlatform(zembraPlatform, dbPlatforms);

      // Rate limiting
      if (i < zembraPlatforms.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total platforms processed: ${stats.total}`);
    console.log(`✅ Successful: ${stats.successful}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`⚠️  Unmatched: ${stats.unmatched.length}`);

    if (stats.unmatched.length > 0) {
      console.log("\n⚠️  Unmatched platforms:");
      stats.unmatched.forEach((name) => {
        console.log(`   - ${name}`);
      });
    }

    if (stats.errors.length > 0) {
      console.log("\n❌ Errors:");
      stats.errors.forEach(({ platform, error }) => {
        console.log(`   - ${platform}: ${error}`);
      });
    }

    console.log("\n✨ Done!");
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run script
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = {
  fetchZembraPage,
  parsePlatformLogos,
  downloadImage,
  uploadToStorage,
  updateDatabase,
};
