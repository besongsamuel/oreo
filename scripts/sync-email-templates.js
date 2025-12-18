/**
 * Email Template Sync Script
 *
 * Reads HTML template files from email-templates/ folder and syncs them to Resend.
 * For each template, it checks if it exists, creates or updates it, then publishes it.
 *
 * Usage:
 *   node scripts/sync-email-templates.js
 *   npm run sync-templates
 *
 * Environment Variables Required:
 *   RESEND_API_KEY - Your Resend API key
 */

require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");

// Configuration
const RESEND_API_BASE = "https://api.resend.com";
const TEMPLATES_DIR = path.join(__dirname, "..", "email-templates");
const DELAY_MS = 2000; // 2 seconds delay between API calls to prevent throttling

// Get Resend API key from environment
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error("❌ Missing required environment variable: RESEND_API_KEY");
  console.error(
    "   Please set RESEND_API_KEY in your .env file or environment variables"
  );
  process.exit(1);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make API request to Resend
 */
async function resendApiRequest(endpoint, method = "GET", body = null) {
  const url = `${RESEND_API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ||
      data?.message ||
      `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Resend API error: ${errorMessage}`);
  }

  return data;
}

/**
 * Extract variable names from HTML template using Resend syntax {{{VAR_NAME}}}
 */
function extractVariables(html) {
  const variableRegex = /\{\{\{(\w+)\}\}\}/g;
  const variables = new Set();
  let match;

  while ((match = variableRegex.exec(html)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables).map((key) => ({
    key,
    type: "string",
    fallbackValue: "",
  }));
}

/**
 * List all templates from Resend
 */
async function listTemplates() {
  try {
    const response = await resendApiRequest("/templates");
    return response.data || [];
  } catch (error) {
    console.error("❌ Failed to list templates:", error.message);
    throw error;
  }
}

/**
 * Find template by name
 */
async function findTemplateByName(templateName) {
  const templates = await listTemplates();
  return templates.find((t) => t.name === templateName);
}

/**
 * Create a new template in Resend
 */
async function createTemplate(templateName, html, variables) {
  try {
    console.log(`  📝 Creating template "${templateName}"...`);
    const response = await resendApiRequest("/templates", "POST", {
      name: templateName,
      html: html,
      variables: variables,
    });
    console.log(`  ✅ Template "${templateName}" created successfully`);
    return response;
  } catch (error) {
    console.error(
      `  ❌ Failed to create template "${templateName}":`,
      error.message
    );
    throw error;
  }
}

/**
 * Update an existing template in Resend
 */
async function updateTemplate(templateId, html, variables) {
  try {
    console.log(`  📝 Updating template (ID: ${templateId})...`);
    const response = await resendApiRequest(
      `/templates/${templateId}`,
      "PATCH",
      {
        html: html,
        variables: variables,
      }
    );
    console.log(`  ✅ Template updated successfully`);
    return response;
  } catch (error) {
    console.error(`  ❌ Failed to update template:`, error.message);
    throw error;
  }
}

/**
 * Publish a template in Resend
 */
async function publishTemplate(templateId) {
  try {
    console.log(`  📤 Publishing template (ID: ${templateId})...`);
    const response = await resendApiRequest(
      `/templates/${templateId}/publish`,
      "POST"
    );
    console.log(`  ✅ Template published successfully`);
    return response;
  } catch (error) {
    console.error(`  ❌ Failed to publish template:`, error.message);
    throw error;
  }
}

/**
 * Process a single template file
 */
async function processTemplate(filePath) {
  const fileName = path.basename(filePath);
  const templateName = path.basename(fileName, path.extname(fileName));

  console.log(`\n🔄 Processing template: ${templateName}`);

  try {
    // Read HTML content
    const html = await fs.readFile(filePath, "utf-8");

    // Extract variables from HTML
    const variables = extractVariables(html);
    console.log(
      `  📋 Found ${variables.length} variables:`,
      variables.map((v) => v.key).join(", ")
    );

    // Check if template exists
    const existingTemplate = await findTemplateByName(templateName);

    let templateId;
    if (existingTemplate) {
      // Template exists, update it
      templateId = existingTemplate.id;
      await updateTemplate(templateId, html, variables);
    } else {
      // Template doesn't exist, create it
      const createResponse = await createTemplate(
        templateName,
        html,
        variables
      );
      templateId = createResponse.id;
    }

    // Wait 2 seconds before publishing to prevent throttling
    console.log(`  ⏳ Waiting ${DELAY_MS / 1000}s before publishing...`);
    await sleep(DELAY_MS);

    // Publish the template
    await publishTemplate(templateId);

    // Wait 2 seconds before processing next template
    console.log(
      `  ⏳ Waiting ${DELAY_MS / 1000}s before processing next template...`
    );
    await sleep(DELAY_MS);

    return { success: true, templateName };
  } catch (error) {
    console.error(
      `  ❌ Failed to process template "${templateName}":`,
      error.message
    );
    return { success: false, templateName, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Starting email template sync to Resend\n");

  try {
    // Check if templates directory exists
    try {
      await fs.access(TEMPLATES_DIR);
    } catch (error) {
      console.error(`❌ Templates directory not found: ${TEMPLATES_DIR}`);
      process.exit(1);
    }

    // Read all HTML files from templates directory
    const files = await fs.readdir(TEMPLATES_DIR);
    const htmlFiles = files.filter((file) => file.endsWith(".html"));

    if (htmlFiles.length === 0) {
      console.log(`⚠️  No HTML template files found in ${TEMPLATES_DIR}`);
      process.exit(0);
    }

    console.log(
      `📁 Found ${htmlFiles.length} template file(s):`,
      htmlFiles.join(", ")
    );

    // Process each template
    const results = [];
    for (const file of htmlFiles) {
      const filePath = path.join(TEMPLATES_DIR, file);
      const result = await processTemplate(filePath);
      results.push(result);
    }

    // Summary
    console.log("\n📊 Summary:");
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(`  ✅ Successfully synced: ${successful.length}`);
    successful.forEach((r) => console.log(`     - ${r.templateName}`));

    if (failed.length > 0) {
      console.log(`  ❌ Failed: ${failed.length}`);
      failed.forEach((r) =>
        console.log(`     - ${r.templateName}: ${r.error}`)
      );
      process.exit(1);
    }

    console.log("\n🎉 All templates synced successfully!");
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
