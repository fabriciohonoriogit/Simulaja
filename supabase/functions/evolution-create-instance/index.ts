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

    const rawUrl = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_URL") || "";
    const EVOLUTION_API_URL = rawUrl.replace(/\/+$/, "");
    const EVOLUTION_GLOBAL_KEY = Deno.env.get("EVOLUTION_GLOBAL_KEY") || Deno.env.get("EVOLUTION_GLOBAL_API_KEY") || "";

    if (!EVOLUTION_API_URL || !EVOLUTION_GLOBAL_KEY || EVOLUTION_API_URL.includes("localhost")) {
      return new Response(JSON.stringify({
        error: "EVOLUTION_API_URL ou EVOLUTION_GLOBAL_KEY não configurados (ou apontando para localhost) nos secrets do projeto Supabase. Configure-os em Project Settings > Edge Functions > Secrets."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let createData: any = null;
    let qrcodeBase64: string | null = null;
    let state = "connecting";

    try {
      // 1. Tenta buscar QR Code / status da instância se já existir
      const connRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        headers: { apikey: EVOLUTION_GLOBAL_KEY }
      });
      if (connRes.ok) {
        const connData = await connRes.json();
        state = connData?.instance?.state || connData?.state || "connecting";
        qrcodeBase64 = connData?.base64 || connData?.qrcode?.base64 || null;
      }

      // 2. Se não encontrou ou status não ok, tenta criar a instância
      if (!connRes.ok || state === "close" || state === "closed") {
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

        if (createRes.ok) {
          createData = await createRes.json();
          qrcodeBase64 = createData?.qrcode?.base64 || createData?.base64 || qrcodeBase64;
          state = createData?.instance?.state || createData?.state || state;
        }
      }
    } catch (errApi) {
      console.warn("Evolution API offline ou inacessível no servidor:", errApi);
    }

    // 3. Set webhook for the instance if possible
    try {
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
    } catch (webhookErr) {
      console.warn("Falha ao atualizar webhook:", webhookErr);
    }

    // 4. Save instance credentials to the database if organizacaoId is provided
    if (organizacaoId) {
      try {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        await supabaseAdmin
          .from("organizacoes")
          .update({
            evolution_instance_name: instanceName,
            evolution_api_key: instanceName,
          })
          .eq("id", organizacaoId);
      } catch (dbErr) {
        console.warn("Falha ao salvar instancia na organizacao:", dbErr);
      }
    }

    const isConnected = state === "open" || state === "CONNECTED";

    return new Response(JSON.stringify({
      success: true,
      qrcode: qrcodeBase64,
      connected: isConnected,
      state: state,
      instanceName: instanceName
    }), {
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
