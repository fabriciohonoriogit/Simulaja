import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClientData {
  id: string;
  nome: string;
  celular?: string | null;
  grupo?: string | null;
  cota?: string | null;
  administradora?: string | null;
}

interface RequestBody {
  organizacaoId: string;
  clients: ClientData[];
  template: string;
}

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
const EVOLUTION_GLOBAL_API_KEY = Deno.env.get("EVOLUTION_GLOBAL_API_KEY");

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { organizacaoId, clients, template }: RequestBody = await req.json();

    if (!organizacaoId || !clients || !template) {
      throw new Error("Missing required fields");
    }

    // 1. Get the organization's Evolution Instance Name
    const { data: orgData, error: orgError } = await supabaseClient
      .from("organizacoes")
      .select("evolution_instance_name")
      .eq("id", organizacaoId)
      .single();

    if (orgError || !orgData?.evolution_instance_name) {
      throw new Error("Organization does not have an active WhatsApp instance connected.");
    }

    const instanceName = orgData.evolution_instance_name;

    // We start processing asynchronously to not block the Edge Function if there are many clients.
    // However, Deno Deploy edge functions terminate shortly after the response is sent.
    // So if the list is huge, this might fail. For now, we process them synchronously in the request,
    // assuming it's a manageable batch (e.g. 10-50).
    
    // In a production scenario for thousands of messages, we would insert into a queue table 
    // and process via pg_cron or a separate worker.

    const results = [];
    
    for (const client of clients) {
      if (!client.celular) {
        results.push({ id: client.id, status: 'failed', reason: 'No phone number' });
        continue;
      }

      const digits = client.celular.replace(/\D/g, "");
      if (digits.length < 10) {
        results.push({ id: client.id, status: 'failed', reason: 'Invalid phone number' });
        continue;
      }

      const formattedPhone = digits.startsWith("55") ? digits : `55${digits}`;

      // Replace variables
      const message = template
        .replace(/{{nome}}/gi, client.nome.split(" ")[0] || "")
        .replace(/{{grupo}}/gi, client.grupo || "")
        .replace(/{{cota}}/gi, client.cota || "")
        .replace(/{{administradora}}/gi, client.administradora || "");

      try {
        const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: EVOLUTION_GLOBAL_API_KEY || "",
          },
          body: JSON.stringify({
            number: formattedPhone,
            text: message,
            delay: 1200 // Add a minor delay natively supported by evolution
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Evolution API Error: ${errText}`);
        }

        results.push({ id: client.id, status: 'success' });
        
        // Wait 1 second between requests to avoid hitting rate limits on our end
        await delay(1000);
      } catch (err: any) {
        console.error(`Failed to send to ${formattedPhone}`, err);
        results.push({ id: client.id, status: 'failed', reason: err.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending bulk messages:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
