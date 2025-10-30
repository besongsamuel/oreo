import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StartTrialRequest {
  userId: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the requesting user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify requesting user is admin
    const { data: requestingProfile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !requestingProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "Profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (requestingProfile.role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { userId }: StartTrialRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get target user profile
    const { data: targetProfile, error: targetError } = await supabaseClient
      .from("profiles")
      .select("id, email, subscription_plan_id, full_name")
      .eq("id", userId)
      .single();

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get plan IDs
    const { data: plans, error: plansError } = await supabaseClient
      .from("subscription_plans")
      .select("id, name")
      .in("name", ["free", "pro"]);

    if (plansError || !plans) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch plans" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const freePlan = plans.find((p) => p.name === "free");
    const proPlan = plans.find((p) => p.name === "pro");

    if (!freePlan || !proPlan) {
      return new Response(
        JSON.stringify({ success: false, error: "Required plans not found" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is on free plan
    if (targetProfile.subscription_plan_id !== freePlan.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Trial can only be granted to users on the free plan",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already has an active trial
    const { data: activeTrial, error: trialCheckError } = await supabaseClient
      .from("trial_trials")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (trialCheckError && trialCheckError.code !== "PGRST116") {
      // PGRST116 is "not xfound" which is fine
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to check existing trials",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (activeTrial) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User already has an active trial",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update user's subscription to pro
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ subscription_plan_id: proPlan.id })
      .eq("id", userId);

    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update user subscription",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create trial record
    const { data: trialRecord, error: trialError } = await supabaseClient
      .from("trial_trials")
      .insert({
        user_id: userId,
        granted_by: user.id,
        trial_plan_id: proPlan.id,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (trialError || !trialRecord) {
      // Rollback subscription update if trial creation fails
      await supabaseClient
        .from("profiles")
        .update({ subscription_plan_id: freePlan.id })
        .eq("id", userId);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create trial record",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        trial: {
          id: trialRecord.id,
          userId: trialRecord.user_id,
          expiresAt: trialRecord.expires_at,
          status: trialRecord.status,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in start-trial function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

