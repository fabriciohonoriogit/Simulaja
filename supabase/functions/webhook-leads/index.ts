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
    // A URL será: /functions/v1/webhook-leads?org=ID_DA_ORG
    const url = new URL(req.url);
    const organizacaoId = url.searchParams.get("org");

    if (!organizacaoId) {
      return new Response(JSON.stringify({ error: "Parâmetro 'org' é obrigatório na URL" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const body = await req.json();

    // Mapear campos de diferentes plataformas (Meta Ads, RD Station, ActiveCampaign)
    const nome = body.nome || body.name || body.full_name || "Lead Desconhecido";
    const telefone = body.telefone || body.phone || body.phone_number || null;
    const email = body.email || null;
    const origem = body.origem || body.source || "webhook_api";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Inserir na tabela leads
    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert({
        nome,
        telefone,
        email,
        origem,
        status: "novo",
        organizacao_id: organizacaoId,
        dados_cadastro: {
          payload_bruto: body, // Salvar o payload inteiro para debug
        },
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, lead: data }), {
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
