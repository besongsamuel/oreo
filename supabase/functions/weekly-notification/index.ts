import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

/**
 * Get ISO week number for a given date
 */
function getISOWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get start and end dates of the current week (Monday to Sunday)
 */
function getWeekDates(date: Date): { start: Date; end: Date } {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const now = new Date();
        const weekNumber = getISOWeekNumber(now);
        const weekDates = getWeekDates(now);
        
        const weekInfo = {
            iso_week_number: weekNumber,
            year: now.getFullYear(),
            week_start: weekDates.start.toISOString(),
            week_end: weekDates.end.toISOString(),
            current_date: now.toISOString(),
        };

        // Log the current week information
        console.log("=== Weekly Notification ===");
        console.log(`Current Week (ISO): Week ${weekNumber} of ${now.getFullYear()}`);
        console.log(`Week Start: ${weekDates.start.toISOString()}`);
        console.log(`Week End: ${weekDates.end.toISOString()}`);
        console.log(`Current Date: ${now.toISOString()}`);
        console.log("===========================");

        return new Response(
            JSON.stringify({
                success: true,
                message: "Weekly notification executed",
                data: weekInfo,
            }),
            {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error in weekly-notification:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error";

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
            }),
            {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
                status: 500,
            },
        );
    }
});

