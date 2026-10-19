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

// Helper to process Spintax {opcao1|opcao2|opcao3} for unique message hashing
function processSpintax(text: string): string {
  if (!text) return "";
  let result = text;
  const regex = /\{([^{}]+)\}/;
  let match;
  let iterations = 0;
  while ((match = regex.exec(result)) !== null && iterations < 30) {
    iterations++;
    const options = match[1].split("|");
    const chosen = options[Math.floor(Math.random() * options.length)];
    result = result.replace(match[0], chosen);
  }
  return result;
}

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

    // Configurações Anti-Ban (Safe Broadcast)
    const safeMode = reqBody.safeMode !== false; // Padrão: ativado
    const minDelaySec = typeof reqBody.minDelaySeconds === "number" ? Math.max(3, reqBody.minDelaySeconds) : 8;
    const maxDelaySec = typeof reqBody.maxDelaySeconds === "number" ? Math.max(minDelaySec, reqBody.maxDelaySeconds) : 18;
    const batchSize = typeof reqBody.batchSize === "number" ? Math.max(3, reqBody.batchSize) : 10;
    const batchCooldownSec = typeof reqBody.batchCooldownSeconds === "number" ? Math.max(10, reqBody.batchCooldownSeconds) : 35;

    const results = [];
    
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];

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

      // 1. Inter-message Cadence (Proteção Anti-Ban com Jitter e Pausa de Respiro)
      if (i > 0) {
        if (safeMode) {
          if (i % batchSize === 0) {
            console.log(`[Anti-Ban] Pausa de respiro após ${i} envios: pausando ${batchCooldownSec}s...`);
            await delay(batchCooldownSec * 1000);
          } else {
            const jitterMs = Math.floor(Math.random() * ((maxDelaySec - minDelaySec) * 1000)) + (minDelaySec * 1000);
            console.log(`[Anti-Ban] Intervalo seguro para contato ${i + 1}/${clients.length}: ${(jitterMs / 1000).toFixed(1)}s`);
            await delay(jitterMs);
          }
        } else {
          // Fallback mínimo de 2s para evitar overload
          await delay(2000);
        }
      }

      // 2. Personalização com variáveis e Spintax (Gera hash de texto diferente por cliente)
      const rawText = (template || "")
        .replace(/{{nome}}/gi, client.nome.split(" ")[0] || "")
        .replace(/{{grupo}}/gi, client.grupo || "")
        .replace(/{{cota}}/gi, client.cota || "")
        .replace(/{{administradora}}/gi, client.administradora || "");
      
      const message = processSpintax(rawText);

      // Simulação realista de tempo de digitação (typing delay proporcional)
      const typingDelay = Math.min(4000, Math.max(1500, Math.floor(message.length * 30) + Math.floor(Math.random() * 800)));

      try {
        let endpoint = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;
        let payload: any = {
          number: formattedPhone,
          text: message,
          delay: typingDelay,
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
            delay: typingDelay,
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
