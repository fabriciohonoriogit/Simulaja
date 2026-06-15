import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await req.json();
    const { organizacaoId, instanceName } = body;

    // TODO: Validate that the user is an admin of this organizacaoId
    // ...

    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_GLOBAL_KEY = Deno.env.get("EVOLUTION_GLOBAL_KEY");

    if (!EVOLUTION_API_URL || !EVOLUTION_GLOBAL_KEY) {
      return new Response(JSON.stringify({ error: "Evolution API config missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // 1. Create the instance
    const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_GLOBAL_KEY,
      },
      body: JSON.stringify({
        instanceName,
        token: instanceName,
        qrcode: true,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Evolution API error: ${err}`);
    }

    const createData = await createRes.json();

    // 2. Set webhook for the new instance
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/webhook-evolution`;
    await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_GLOBAL_KEY,
      },
      body: JSON.stringify({
        url: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        events: ["MESSAGES_UPSERT"],
      }),
    });

    // 3. Save instance credentials to the database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseAdmin
      .from("organizacoes")
      .update({
        evolution_instance_name: instanceName,
        evolution_api_key: instanceName, // we used instanceName as token
      })
      .eq("id", organizacaoId);

    return new Response(JSON.stringify(createData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
