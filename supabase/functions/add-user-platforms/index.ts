import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface AddUserPlatformsRequest {
    platform_ids: string[];
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Get authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                {
                    status: 401,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Verify user authentication
        const token = authHeader.replace("Bearer ", "");
        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Invalid or expired token" }),
                {
                    status: 401,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Parse request body
        const body: AddUserPlatformsRequest = await req.json();

        if (!body.platform_ids || !Array.isArray(body.platform_ids)) {
            return new Response(
                JSON.stringify({ error: "platform_ids must be an array" }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        if (body.platform_ids.length === 0) {
            return new Response(
                JSON.stringify({ error: "platform_ids cannot be empty" }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Get user's current platform count
        const { data: currentPlatforms, error: selectError } =
            await supabaseClient
                .from("user_platforms")
                .select("platform_id")
                .eq("user_id", user.id);

        if (selectError) {
            throw new Error(
                `Failed to fetch current platforms: ${selectError.message}`,
            );
        }

        const currentCount = currentPlatforms?.length || 0;
        const existingPlatformIds = new Set(
            (currentPlatforms || []).map((p: { platform_id: string }) =>
                p.platform_id
            ),
        );

        // Get user's max platform limit
        const { data: maxLimit, error: limitError } = await supabaseClient.rpc(
            "get_user_platform_limit",
            { user_id: user.id },
        );

        if (limitError) {
            throw new Error(
                `Failed to get platform limit: ${limitError.message}`,
            );
        }

        // Calculate remaining slots
        // If maxLimit is null, user has unlimited (admin), otherwise use the limit
        const remainingSlots = maxLimit === null
            ? Infinity
            : Math.max(0, maxLimit - currentCount);

        // Filter out platforms that already exist
        const newPlatformIds = body.platform_ids.filter(
            (id) => !existingPlatformIds.has(id),
        );

        if (newPlatformIds.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "All platforms are already selected",
                    added: 0,
                    skipped: body.platform_ids.length,
                }),
                {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Validate: check if adding these would exceed the limit
        if (newPlatformIds.length > remainingSlots) {
            return new Response(
                JSON.stringify({
                    error:
                        `Cannot add ${newPlatformIds.length} platform(s). You can only add ${remainingSlots} more platform(s).`,
                    current_count: currentCount,
                    max_limit: maxLimit,
                    remaining_slots: remainingSlots,
                    requested: newPlatformIds.length,
                }),
                {
                    status: 403,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Insert new platforms
        const insertData = newPlatformIds.map((platformId) => ({
            user_id: user.id,
            platform_id: platformId,
        }));

        const { error: insertError } = await supabaseClient
            .from("user_platforms")
            .insert(insertData);

        if (insertError) {
            throw new Error(
                `Failed to insert platforms: ${insertError.message}`,
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message:
                    `Successfully added ${newPlatformIds.length} platform(s)`,
                added: newPlatformIds.length,
                skipped: body.platform_ids.length - newPlatformIds.length,
                total_platforms: currentCount + newPlatformIds.length,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (error) {
        console.error("Error in add-user-platforms:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error";

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
