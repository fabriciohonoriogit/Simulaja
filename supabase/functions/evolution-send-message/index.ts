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
  media?: {
    base64: string;
    mimeType: string;
    fileName: string;
  };
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

    const reqBody = await req.json();
    let { organizacaoId, clients, template, media, number, text }: any = reqBody;

    // Handle single message fallback from client frontend
    if ((!clients || clients.length === 0) && number && text) {
      clients = [{ id: '1', nome: 'Cliente', celular: number }];
      template = text;
    }

    if ((!organizacaoId && (!clients || clients.length === 0)) || (!template && !media)) {
      throw new Error("Missing required fields");
    }

    let instanceName = reqBody.instanceName || "simulaja";

    if (organizacaoId) {
      const { data: orgData } = await supabaseClient
        .from("organizacoes")
        .select("evolution_instance_name")
        .eq("id", organizacaoId)
        .maybeSingle();

      if (orgData?.evolution_instance_name) {
        instanceName = orgData.evolution_instance_name;
      }
    }

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
      const message = (template || "")
        .replace(/{{nome}}/gi, client.nome.split(" ")[0] || "")
        .replace(/{{grupo}}/gi, client.grupo || "")
        .replace(/{{cota}}/gi, client.cota || "")
        .replace(/{{administradora}}/gi, client.administradora || "");

      try {
        let endpoint = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;
        let payload: any = {
          number: formattedPhone,
          text: message,
          delay: 1200
        };

        if (media && media.base64) {
          endpoint = `${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`;
          
          let mediaType = "document";
          if (media.mimeType.startsWith("image/")) mediaType = "image";
          else if (media.mimeType.startsWith("video/")) mediaType = "video";
          else if (media.mimeType.startsWith("audio/")) mediaType = "audio";

          payload = {
            number: formattedPhone,
            mediatype: mediaType,
            mimetype: media.mimeType,
            caption: message, // Envia o texto como legenda
            media: media.base64,
            fileName: media.fileName || "arquivo",
            delay: 1200
          };
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: EVOLUTION_GLOBAL_API_KEY || "",
          },
          body: JSON.stringify(payload),
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
