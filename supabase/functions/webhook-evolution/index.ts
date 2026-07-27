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
    const body = await req.json();

    // Evolution API envia webhook no formato MESSAGES_UPSERT
    if (body.event === "messages.upsert" || body.type === "messages.upsert") {
      const messages = body.data?.messages || body.messages || [];
      if (messages.length === 0) {
        return new Response(JSON.stringify({ status: "no_messages" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const msg = messages[0];
      
      // 1. Ignorar mensagens enviadas por nós mesmos (fromMe)
      if (msg.key?.fromMe) {
        return new Response(JSON.stringify({ status: "ignored_from_me" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const remoteJid = msg.key?.remoteJid || "";

      // 2. Ignorar mensagens de grupos (@g.us) ou status
      if (!remoteJid || remoteJid.includes("@g.us") || remoteJid.includes("status@broadcast")) {
        return new Response(JSON.stringify({ status: "ignored_group_or_status" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Extrair o número limpo e os últimos 8 dígitos (para lidar com variação de 8 e 9 dígitos no Brasil)
      const rawNumber = remoteJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
      const shortNumber = rawNumber.startsWith("55") ? rawNumber.substring(2) : rawNumber;
      const last8Digits = rawNumber.length >= 8 ? rawNumber.slice(-8) : rawNumber;

      // Extrair o conteúdo do texto
      const messageType = Object.keys(msg.message || {})[0];
      let incomingText = "";

      if (messageType === "conversation") {
        incomingText = msg.message.conversation;
      } else if (messageType === "extendedTextMessage") {
        incomingText = msg.message.extendedTextMessage?.text;
      }

      if (!incomingText) {
        return new Response(JSON.stringify({ status: "ignored_non_text" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // 3. REGRA DE FILTRO: Buscar se o número de telefone pertence a um LEAD EXISTENTE no CRM
      const { data: leads, error: leadErr } = await supabaseAdmin
        .from("leads")
        .select("id, nome, atendimento_ia, organizacao_id")
        .or(`celular.ilike.%${shortNumber}%,telefone.ilike.%${shortNumber}%,celular.ilike.%${last8Digits}%,telefone.ilike.%${last8Digits}%`)
        .limit(1);

      // Se o número NÃO pertence a nenhum lead existente no CRM, IGNORA COMPLETAMENTE (não cria lead, não salva chat)
      if (leadErr || !leads || leads.length === 0) {
        console.log(`[Filtro WhatsApp] Mensagem ignorada do número ${rawNumber}: não é um lead cadastrado no CRM.`);
        return new Response(JSON.stringify({ status: "ignored_not_a_crm_lead" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const matchedLead = leads[0];

      // 4. Salvar a mensagem no histórico do chat do lead
      const { error: msgErr } = await supabaseAdmin
        .from("chat_messages")
        .insert({
          lead_id: matchedLead.id,
          content: incomingText,
          role: "user",
        });

      if (msgErr) {
        console.error("Erro ao registrar chat_messages:", msgErr);
      }

      return new Response(JSON.stringify({ success: true, leadId: matchedLead.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ status: "event_ignored" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in webhook-evolution:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
