import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

const tools = [
  {
    functionDeclarations: [
      {
        name: "get_dashboard_metrics",
        description: "Obtem as métricas agregadas do CRM (dashboard): total de leads no funil, valor em negociação e inadimplência total.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "search_leads",
        description: "Busca leads e clientes no CRM. Retorna nome, status, telefone, id e dados da proposta.",
        parameters: {
          type: "OBJECT",
          properties: {
            nome: { type: "STRING", description: "Nome do lead para buscar." },
            status: { type: "STRING", description: "Status no funil (novo, em_andamento, proposta, negociacao, aguardando_docs, contrato_assinado, comissao_paga, fechado, perdido, morto)." }
          }
        }
      },
      {
        name: "get_carteira",
        description: "Lista clientes na carteira (ativos e inativos).",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "get_inadimplentes",
        description: "Lista clientes inadimplentes e detalha os valores atrasados.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "get_metas",
        description: "Obtem as metas comerciais da equipe no ano atual.",
        parameters: { type: "OBJECT", properties: {} }
      }
    ]
  }
];

async function executeTool(supabase: any, name: string, args: any) {
  try {
    if (name === "get_dashboard_metrics") {
      const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
      const { data: inadimplentes } = await supabase.from('inadimplentes').select('valor_parcela, parcelas_atrasadas');
      const dividaTotal = (inadimplentes || []).reduce((acc: number, i: any) => acc + (i.valor_parcela * i.parcelas_atrasadas), 0);
      return { leadsCount, dividaTotal, message: "Métricas gerais retornadas com sucesso." };
    }
    if (name === "search_leads") {
      let query = supabase.from('leads').select('id, nome, telefone, status, valor_credito, created_at, lead_temperatura, cidade, tipo_consorcio');
      if (args.nome) query = query.ilike('nome', `%${args.nome}%`);
      if (args.status) query = query.eq('status', args.status);
      const { data } = await query.limit(20);
      return { results: data || [] };
    }
    if (name === "get_carteira") {
      const { data } = await supabase.from('carteira').select('id, nome, grupo, cota, data_adesao, status').limit(20);
      return { results: data || [] };
    }
    if (name === "get_inadimplentes") {
      const { data } = await supabase.from('inadimplentes').select('id, nome, valor_parcela, parcelas_atrasadas, status').limit(20);
      return { results: data || [] };
    }
    if (name === "get_metas") {
      const { data } = await supabase.from('meta').select('*').limit(10);
      return { results: data || [] };
    }
    return { error: `Ferramenta ${name} não encontrada.` };
  } catch(e: any) {
    return { error: e.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    const body = await req.json().catch(() => ({}));
    let prompt = body?.prompt ?? "";
    const history = body?.history || [];

    const contents = [
      ...history.map((h: any) => ({
        role: h.role === "jarvis" || h.role === "model" ? "model" : "user",
        parts: [{ text: h.text }]
      })),
      { role: "user", parts: [{ text: prompt }] }
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

    let maxLoops = 4;
    let loopCount = 0;
    
    while (loopCount < maxLoops) {
      loopCount++;
      const upstream = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          tools,
          generationConfig: { maxOutputTokens: 1000 },
        }),
      });

      const data = await upstream.json();
      
      if (!upstream.ok) {
        console.error("Gemini API Error:", data);
        return new Response(JSON.stringify({ text: "O Jarvis não conseguiu processar (Erro API).", error: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const candidate = data?.candidates?.[0];
      if (!candidate) {
        return new Response(JSON.stringify({ text: "Desculpe, não consegui formular uma resposta." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const parts = candidate.content?.parts || [];
      const functionCallPart = parts.find((p: any) => p.functionCall);
      
      if (functionCallPart) {
        const fnName = functionCallPart.functionCall.name;
        const fnArgs = functionCallPart.functionCall.args;
        
        console.log(`[Jarvis Tool Call] ${fnName}`, fnArgs);

        contents.push({
          role: "model",
          parts: [{ functionCall: functionCallPart.functionCall }]
        });
        
        const result = await executeTool(supabase, fnName, fnArgs);
        
        contents.push({
          role: "user", // The Gemini REST API accepts 'user' role with functionResponse or 'function' role. 'function' role is standard but 'user' works if strict mode is off. Better to use 'function'. Wait, actually Gemini API strictly uses 'function'. Let me use 'function'.
          // Wait, role must be "function" for functionResponse! Wait, Gemini requires role "user" or "model" usually, but for functionResponse it uses "function"! No, role is "user" for function calls in some versions, but standard is "function". Let's use "function".
          // In Gemini API, it's actually `role: "function"`.
          role: "function",
          parts: [{
            functionResponse: {
              name: fnName,
              response: { name: fnName, content: result }
            }
          }]
        });
        continue;
      } else {
        const text = parts.map((p: any) => p.text || "").join("");
        return new Response(JSON.stringify({ text }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ text: "Precisei de muitas ferramentas e me perdi. Tente ser mais específico!" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("Internal Error:", err);
    return new Response(JSON.stringify({ text: "O Jarvis encontrou uma instabilidade interna.", error: err.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
