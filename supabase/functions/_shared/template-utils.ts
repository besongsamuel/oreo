/**
 * Template utility functions for rendering email templates
 */

/**
 * Load an HTML template from the emails directory
 * @param templateName - Name of the template file (without .html extension)
 * @returns Template content as string
 */
export async function loadTemplate(templateName: string): Promise<string> {
    try {
        // In Supabase Edge Functions, the working directory is the function's directory
        // Templates are copied into each function directory for reliable access
        // Try paths in order of preference:
        // 1. From function directory (where templates are copied)
        // 2. From shared location (supabase/emails/)
        // 3. Alternative relative paths

        const paths = [
            `./${templateName}.html`, // From function directory (templates copied here)
            `../../emails/${templateName}.html`, // From _shared/ -> functions/ -> supabase/ -> emails/
            `../emails/${templateName}.html`, // Alternative relative path
            `../../../emails/${templateName}.html`, // Another alternative
        ];

        let lastError: Error | null = null;
        for (const pathToTry of paths) {
            try {
                const template = await Deno.readTextFile(pathToTry);
                console.log(`Successfully loaded template from: ${pathToTry}`);
                return template;
            } catch (pathError) {
                lastError = pathError instanceof Error
                    ? pathError
                    : new Error(String(pathError));
                // Only log if it's not a "not found" error to avoid spam
                if (!lastError.message.includes("No such file")) {
                    console.log(
                        `Failed to load from ${pathToTry}: ${lastError.message}`,
                    );
                }
                continue;
            }
        }

        // If all paths failed, throw with details
        const errorMessage =
            `Template file not found: ${templateName}.html. Tried paths: ${
                paths.join(", ")
            }. Last error: ${lastError?.message || "unknown"}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    } catch (error) {
        console.error(`Error loading template ${templateName}:`, error);
        throw new Error(
            `Failed to load template: ${templateName} - ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Render a template by replacing placeholders with values
 * Placeholders are in the format {{variable_name}}
 * @param template - Template string with placeholders
 * @param variables - Object with variable names and values
 * @returns Rendered template string
 */
export function renderTemplate(
    template: string,
    variables: Record<string, any>,
): string {
    let rendered = template;

    // Replace all placeholders {{variable_name}} with values
    for (const [key, value] of Object.entries(variables)) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        // Convert value to string, handling null/undefined
        const stringValue = value != null ? String(value) : "";
        rendered = rendered.replace(placeholder, stringValue);
    }

    return rendered;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped HTML string
 */
export function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
