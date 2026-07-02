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
        description: "Obtém as métricas agregadas do CRM (dashboard): total de leads no funil, valor em negociação e inadimplência total.",
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
        description: "Obtém as metas comerciais da equipe no ano atual.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "get_comissoes",
        description: "Obtém a lista de comissões registradas (valores, parcelas, taxa, comissão total, status) de vendas da organização.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "get_missoes",
        description: "Obtém o histórico ou status das missões (metas concluídas ou em progresso) do consultor.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "get_historico_contatos",
        description: "Obtém o histórico de todas as interações e contatos efetuados com os leads do CRM.",
        parameters: {
          type: "OBJECT",
          properties: {
            lead_id: { type: "STRING", description: "ID do lead para filtrar o histórico. Opcional." }
          }
        }
      },
      {
        name: "get_fechamentos_mensais",
        description: "Obtém a lista de fechamentos mensais de vendas consolidados por organização.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "mover_lead_etapa",
        description: "Altera a etapa/status de um lead no funil de vendas do CRM.",
        parameters: {
          type: "OBJECT",
          properties: {
            lead_id: { type: "STRING", description: "ID do lead que será movido." },
            nova_etapa: { type: "STRING", description: "A nova etapa (ex: 'proposta', 'negociacao', 'fechado', 'perdido', 'morto')." }
          },
          required: ["lead_id", "nova_etapa"]
        }
      },
      {
        name: "create_lead",
        description: "Cria um novo lead no funil do CRM.",
        parameters: {
          type: "OBJECT",
          properties: {
            nome: { type: "STRING", description: "Nome do lead." },
            telefone: { type: "STRING", description: "Telefone de contato." },
            valor_credito: { type: "NUMBER", description: "Valor estimado do crédito do consórcio." },
            tipo_consorcio: { type: "STRING", description: "Segmento do consórcio (ex: 'imoveis', 'veiculos', 'motos', 'pesados', 'investimentos')." },
            status: { type: "STRING", description: "Fase inicial no funil (default 'novo')." }
          },
          required: ["nome"]
        }
      },
      {
        name: "create_historico_contato",
        description: "Registra uma nova interação, contato ou conversa ocorrida no histórico de um lead.",
        parameters: {
          type: "OBJECT",
          properties: {
            lead_id: { type: "STRING", description: "ID do lead associado." },
            tipo_contato: { type: "STRING", description: "Tipo de contato (ex: 'whatsapp', 'ligacao', 'reuniao', 'email')." },
            descricao: { type: "STRING", description: "Resumo da conversa ocorrida." }
          },
          required: ["lead_id", "tipo_contato", "descricao"]
        }
      },
      {
        name: "search_web",
        description: "Pesquisa na internet usando Tavily para obter notícias externas, informações sobre consórcios, ABAC, mercado imobiliário, veículos e investimentos.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "O termo de busca (ex: 'notícias consórcio ABAC 2024')." }
          },
          required: ["query"]
        }
      }
    ]
  }
];

async function executeTool(supabase: any, name: string, args: any) {
  try {
    // Busca a organização do usuário logado via RLS (seguro)
    const { data: profile } = await supabase.from('perfis').select('organizacao_id').single();
    const orgId = profile?.organizacao_id;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Se temos a chave de admin e a org, criamos um cliente com privilégios de admin
    // que ignora as restrições normais de RLS do vendedor, mas filtra pela mesma organização.
    const useAdmin = !!(supabaseServiceRole && orgId);
    const client = useAdmin 
      ? createClient(supabaseUrl, supabaseServiceRole) 
      : supabase;

    if (name === "get_dashboard_metrics") {
      let leadsQuery = client.from('leads').select('*', { count: 'exact', head: true });
      if (useAdmin) leadsQuery = leadsQuery.eq('organizacao_id', orgId);
      const { count: leadsCount } = await leadsQuery;

      let inadQuery = client.from('inadimplentes').select('valor_parcela, parcelas_atrasadas');
      if (useAdmin) inadQuery = inadQuery.eq('organizacao_id', orgId);
      const { data: inadimplentes } = await inadQuery;

      const dividaTotal = (inadimplentes || []).reduce((acc: number, i: any) => acc + (i.valor_parcela * i.parcelas_atrasadas), 0);
      return { leadsCount, dividaTotal, message: "Métricas gerais retornadas com sucesso." };
    }
    if (name === "search_leads") {
      let query = client.from('leads').select('id, nome, telefone, status, valor_credito, created_at, lead_temperatura, cidade, tipo_consorcio');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      if (args.nome) query = query.ilike('nome', `%${args.nome}%`);
      if (args.status) query = query.eq('status', args.status);
      const { data } = await query.limit(20);
      return { results: data || [] };
    }
    if (name === "get_carteira") {
      let query = client.from('carteira').select('id, nome, grupo, cota, data_adesao, status');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.limit(20);
      return { results: data || [] };
    }
    if (name === "get_inadimplentes") {
      let query = client.from('inadimplentes').select('id, nome, valor_parcela, parcelas_atrasadas, status');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.limit(20);
      return { results: data || [] };
    }
    if (name === "get_metas") {
      let query = client.from('meta').select('*');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.limit(10);
      return { results: data || [] };
    }
    if (name === "get_comissoes") {
      let query = client.from('comissoes').select('*');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.order('created_at', { ascending: false }).limit(20);
      return { results: data || [] };
    }
    if (name === "get_missoes") {
      let query = client.from('missoes_concluidas').select('*');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.order('created_at', { ascending: false }).limit(30);
      return { results: data || [] };
    }
    if (name === "get_historico_contatos") {
      let query = client.from('historico_contatos').select('*');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      if (args.lead_id) query = query.eq('lead_id', args.lead_id);
      const { data } = await query.order('data_contato', { ascending: false }).limit(20);
      return { results: data || [] };
    }
    if (name === "get_fechamentos_mensais") {
      let query = client.from('fechamentos_mensais').select('*');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.order('created_at', { ascending: false }).limit(20);
      return { results: data || [] };
    }
    if (name === "mover_lead_etapa") {
      const { data, error } = await client.from('leads').update({
        status: args.nova_etapa,
        status_updated_at: new Date().toISOString()
      }).eq('id', args.lead_id).select();
      if (error) return { error: error.message };
      return { success: true, results: data };
    }
    if (name === "create_lead") {
      const { data, error } = await client.from('leads').insert({
        nome: args.nome,
        telefone: args.telefone || null,
        valor_credito: args.valor_credito || null,
        tipo_consorcio: args.tipo_consorcio || null,
        status: args.status || 'novo',
        organizacao_id: orgId
      }).select();
      if (error) return { error: error.message };
      return { success: true, results: data };
    }
    if (name === "create_historico_contato") {
      const { data, error } = await client.from('historico_contatos').insert({
        lead_id: args.lead_id,
        tipo_contato: args.tipo_contato,
        descricao: args.descricao,
        data_contato: new Date().toISOString(),
        organizacao_id: orgId
      }).select();
      if (error) return { error: error.message };
      return { success: true, results: data };
    }
    if (name === "search_web") {
      const tavilyKey = Deno.env.get("TAVILY_API_KEY") || "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";
      if (!tavilyKey) return { error: "TAVILY_API_KEY não configurada no Supabase Secrets." };
      
      const reqBody = {
        api_key: tavilyKey,
        query: args.query,
        search_depth: "basic",
        include_answer: true,
        max_results: 3
      };
      
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      });
      
      if (!res.ok) return { error: "Erro ao buscar na internet via Tavily." };
      const data = await res.json();
      
      return { 
        answer: data.answer, 
        results: data.results?.map((r: any) => ({ title: r.title, content: r.content, url: r.url })) 
      };
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
    const imageBase64 = body?.imageBase64;

    const userParts: any[] = [];
    if (prompt) {
      userParts.push({ text: prompt });
    }
    if (imageBase64) {
      userParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      });
    }

    const contents = [
      ...history.map((h: any) => ({
        role: h.role === "jarvis" || h.role === "model" ? "model" : "user",
        parts: [{ text: h.text }]
      }))
    ];

    if (userParts.length > 0) {
      contents.push({ role: "user", parts: userParts });
    }

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
          role: "user",
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
