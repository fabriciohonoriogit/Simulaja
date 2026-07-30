import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_MODEL = "gemini-2.0-flash";

const tools = [
  {
    functionDeclarations: [
      {
        name: "get_dashboard_metrics",
        description: "Obtém as métricas agregadas do CRM (dashboard): total de leads no funil, valor em negociação e inadimplência total.",
        parameters: {
          type: "OBJECT",
          properties: {
            filtro: { type: "STRING", description: "Filtro opcional das métricas." }
          }
        }
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
        parameters: {
          type: "OBJECT",
          properties: {
            status: { type: "STRING", description: "Status opcional (ativo ou inativo)." }
          }
        }
      },
      {
        name: "get_inadimplentes",
        description: "Lista clientes inadimplentes e detalha os valores atrasados.",
        parameters: {
          type: "OBJECT",
          properties: {
            status: { type: "STRING", description: "Filtro de status opcional." }
          }
        }
      },
      {
        name: "get_metas",
        description: "Obtém as metas comerciais da equipe no ano atual.",
        parameters: {
          type: "OBJECT",
          properties: {
            ano: { type: "NUMBER", description: "Ano da meta (opcional)." }
          }
        }
      },
      {
        name: "get_comissoes",
        description: "Obtém a lista de comissões registradas (valores, parcelas, taxa, comissão total, status) de vendas da organização.",
        parameters: {
          type: "OBJECT",
          properties: {
            status: { type: "STRING", description: "Status da comissão (opcional)." }
          }
        }
      },
      {
        name: "get_missoes",
        description: "Obtém o histórico ou status das missões (metas concluídas ou em progresso) do consultor.",
        parameters: {
          type: "OBJECT",
          properties: {
            usuario_id: { type: "STRING", description: "ID do usuário (opcional)." }
          }
        }
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
        parameters: {
          type: "OBJECT",
          properties: {
            ano: { type: "NUMBER", description: "Ano do fechamento (opcional)." }
          }
        }
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
      },
      {
        name: "send_whatsapp_message",
        description: "Envia uma mensagem de WhatsApp direta para um lead ou cliente do CRM por nome ou telefone.",
        parameters: {
          type: "OBJECT",
          properties: {
            nome: { type: "STRING", description: "Nome do lead para buscar o número de telefone no CRM." },
            telefone: { type: "STRING", description: "Número de telefone direto com DDD (opcional se informado o nome)." },
            mensagem: { type: "STRING", description: "O conteúdo da mensagem a ser enviada no WhatsApp para o cliente." }
          },
          required: ["mensagem"]
        }
      },
      {
        name: "simular_consorcio",
        description: "Calcula e simula consórcio instantaneamente (crédito, estimativa de parcela, taxa de adm, fundo de reserva e lances ideais recomendados).",
        parameters: {
          type: "OBJECT",
          properties: {
            credito: { type: "NUMBER", description: "Valor do crédito desejado (ex: 200000)." },
            segmento: { type: "STRING", description: "Segmento: 'imovel', 'veiculo', 'motos', 'pesados' ou 'investimentos'." },
            prazo: { type: "NUMBER", description: "Prazo desejado em meses (opcional)." }
          },
          required: ["credito", "segmento"]
        }
      },
      {
        name: "get_gamificacao_ranking",
        description: "Obtém os dados de gamificação: pontos da equipe, ranking de vendas, boss da semana, sequência de vendas (streak) e hall da fama.",
        parameters: {
          type: "OBJECT",
          properties: {
            usuario_id: { type: "STRING", description: "ID opcional do usuário." }
          }
        }
      },
      {
        name: "create_lembrete_notificacao",
        description: "Cria uma notificação/lembrete no painel do CRM para o consultor sobre um compromisso, tarefa ou aviso de lead.",
        parameters: {
          type: "OBJECT",
          properties: {
            titulo: { type: "STRING", description: "Título do lembrete." },
            mensagem: { type: "STRING", description: "Detalhamento da tarefa ou lembrete." },
            lead_id: { type: "STRING", description: "ID do lead associado (opcional)." }
          },
          required: ["titulo", "mensagem"]
        }
      },
      {
        name: "toggle_atendimento_ia",
        description: "Ativa ou desativa o atendimento automático da IA Jarvis no WhatsApp de um determinado lead.",
        parameters: {
          type: "OBJECT",
          properties: {
            nome: { type: "STRING", description: "Nome do lead para buscar no CRM." },
            ativo: { type: "BOOLEAN", description: "true para ativar IA automática, false para desativar (modo atendimento humano)." }
          },
          required: ["nome", "ativo"]
        }
      },
      {
        name: "get_propostas_e_vendas",
        description: "Obtém a lista de propostas geradas e cotas vendidas da organização.",
        parameters: {
          type: "OBJECT",
          properties: {
            status: { type: "STRING", description: "Status opcional das propostas." }
          }
        }
      }
    ]
  }
];

async function executeTool(supabase: any, name: string, args: any) {
  try {
    // Busca a organização do usuário logado via RLS (seguro) com maybeSingle para nunca estourar exceção
    let orgId: string | null = null;
    try {
      const { data: profile } = await supabase.from('perfis').select('organizacao_id').limit(1).maybeSingle();
      orgId = profile?.organizacao_id || null;
    } catch (e) {
      console.warn("Perfil query error in executeTool:", e);
    }

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
      let targetLeadId = args.lead_id;
      const leadName = args.nome_lead || args.lead_id || "";
      
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(targetLeadId);
      
      if (!isUuid && leadName) {
        const searchTerms = leadName.split(/\s+/).filter((w: string) => w.length > 2);
        const mainTerm = searchTerms[0] || leadName;
        let query = client.from('leads').select('id, nome, cidade');
        if (useAdmin) query = query.eq('organizacao_id', orgId);
        const { data: found } = await query.ilike('nome', `%${mainTerm}%`).limit(10);
        
        if (found && found.length > 0) {
          const bestMatch = found.find((l: any) => {
            const fullName = ((l.nome || "") + " " + (l.cidade || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return searchTerms.every((term: string) => fullName.includes(term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
          }) || found[0];
          targetLeadId = bestMatch.id;
        }
      }

      const statusMap: Record<string, string> = {
        novo: "novo_lead",
        novo_lead: "novo_lead",
        contato: "primeiro_contato",
        contatado: "primeiro_contato",
        primeiro_contato: "primeiro_contato",
        qualificacao: "qualificacao",
        "qualificação": "qualificacao",
        proposta: "simulacao_enviada",
        simulacao_enviada: "simulacao_enviada",
        negociacao: "negociacao",
        "negociação": "negociacao",
        aguardando_pagamento: "aguardando_pagamento",
        fechado: "fechado",
        venda_fechada: "fechado",
        perdido: "perdido",
        morto: "morto"
      };

      const rawEtapa = (args.nova_etapa || "").toLowerCase().trim();
      const finalEtapa = statusMap[rawEtapa] || rawEtapa || "novo_lead";

      const { data, error } = await client.from('leads').update({
        status: finalEtapa,
        status_updated_at: new Date().toISOString()
      }).eq('id', targetLeadId).select();

      if (error) return { error: error.message };
      return { success: true, message: `Lead movido com sucesso para a etapa '${finalEtapa}'`, results: data };
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
    if (name === "send_whatsapp_message") {
      let targetPhone = args.telefone;
      let leadId = null;
      let leadName = args.nome || "Cliente";

      if (!targetPhone && args.nome) {
        let query = client.from('leads').select('id, nome, celular, organizacao_id');
        if (useAdmin) query = query.eq('organizacao_id', orgId);
        const { data: found } = await query.ilike('nome', `%${args.nome}%`).limit(1);
        if (found && found.length > 0) {
          targetPhone = found[0].celular;
          leadId = found[0].id;
          leadName = found[0].nome;
        }
      }

      if (!targetPhone) {
        return { success: false, message: `Não encontrei o telefone do cliente ${args.nome || ''} no CRM. Por favor, verifique o cadastro.` };
      }

      const cleanPhone = targetPhone.replace(/\D/g, '');
      const evoUrl = Deno.env.get("EVOLUTION_API_URL") || "http://localhost:8080";
      const evoKey = Deno.env.get("EVOLUTION_GLOBAL_API_KEY") || "B6D711FCDE4D4FD5936544120E713976";

      // 1. Grava a mensagem no chat do lead no CRM
      if (leadId) {
        await client.from('chat_messages').insert({
          lead_id: leadId,
          content: args.mensagem,
          role: 'assistant'
        });
      }

      // 2. Dispara a mensagem para o celular do cliente via Evolution API
      try {
        await fetch(`${evoUrl}/message/sendText/simulaja`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evoKey
          },
          body: JSON.stringify({
            number: cleanPhone,
            text: args.mensagem,
            delay: 1200
          })
        });

        return {
          success: true,
          message: `Mensagem de WhatsApp enviada com sucesso para ${leadName} (${cleanPhone})!`,
          conteudo: args.mensagem
        };
      } catch (err: any) {
        return {
          success: true,
          relayed: true,
          message: `Mensagem registrada no chat do CRM para ${leadName}.`
        };
      }
    }

    if (name === "simular_consorcio") {
      const credito = Number(args.credito) || 100000;
      const seg = (args.segmento || "imovel").toLowerCase();
      
      let taxaAdm = 0.16;
      let fundoReserva = 0.02;
      let prazoPadrao = 200;

      if (seg.includes("veic") || seg.includes("carro")) {
        taxaAdm = 0.15;
        prazoPadrao = 80;
      } else if (seg.includes("moto")) {
        taxaAdm = 0.18;
        prazoPadrao = 60;
      } else if (seg.includes("pesad")) {
        taxaAdm = 0.14;
        prazoPadrao = 120;
      }

      const prazoFinal = Number(args.prazo) || prazoPadrao;
      const montanteTotal = credito * (1 + taxaAdm + fundoReserva);
      const parcelaEstimada = montanteTotal / prazoFinal;

      return {
        credito,
        segmento: seg,
        prazo: prazoFinal,
        parcelaEstimada: Math.round(parcelaEstimada * 100) / 100,
        taxaAdministracaoPct: (taxaAdm * 100).toFixed(1) + "%",
        fundoReservaPct: (fundoReserva * 100).toFixed(1) + "%",
        mensagem: `Simulação concluída: Crédito de R$ ${credito.toLocaleString("pt-BR")} em ${prazoFinal}x com parcela estimada de R$ ${Math.round(parcelaEstimada).toLocaleString("pt-BR")}.`
      };
    }

    if (name === "get_gamificacao_ranking") {
      let query = client.from('pontos_gamificacao').select('usuario_id, pontos, nivel, streak_vendas');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data: pontos } = await query.order('pontos', { ascending: false }).limit(10);
      return { ranking: pontos || [] };
    }

    if (name === "create_lembrete_notificacao") {
      const { data, error } = await client.from('notificacoes').insert({
        titulo: args.titulo,
        mensagem: args.mensagem,
        lead_id: args.lead_id || null,
        organizacao_id: orgId,
        lida: false,
        created_at: new Date().toISOString()
      }).select();
      if (error) return { error: error.message };
      return { success: true, message: `Lembrete "${args.titulo}" criado com sucesso no painel!` };
    }

    if (name === "toggle_atendimento_ia") {
      let query = client.from('leads').select('id, nome, celular, atendimento_ia');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data: found } = await query.ilike('nome', `%${args.nome}%`).limit(1);

      if (!found || found.length === 0) {
        return { success: false, message: `Não encontrei o lead ${args.nome} para alterar a IA.` };
      }

      const lead = found[0];
      const { error } = await client.from('leads').update({ atendimento_ia: args.ativo }).eq('id', lead.id);
      if (error) return { error: error.message };

      const statusStr = args.ativo ? "IA Ativa (Atendimento Automático)" : "Modo Humano (IA Desativada)";
      return { success: true, message: `Atendimento do lead ${lead.nome} alterado para: ${statusStr}.` };
    }

    if (name === "get_propostas_e_vendas") {
      let propQuery = client.from('propostas').select('*');
      if (useAdmin) propQuery = propQuery.eq('organizacao_id', orgId);
      const { data: propostas } = await propQuery.limit(10);

      let cotasQuery = client.from('carteira').select('*');
      if (useAdmin) cotasQuery = cotasQuery.eq('organizacao_id', orgId);
      const { data: cotas } = await cotasQuery.limit(10);

      return { propostas: propostas || [], cotasVendidas: cotas || [] };
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

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? supabaseAnonKey;
    
    const tokenToUse = authHeader ? authHeader : `Bearer ${supabaseServiceKey}`;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: tokenToUse } }
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
      ...(history || [])
        .map((h: any) => {
          const txt = (h.text || h.content || "").trim();
          if (!txt) return null;
          return {
            role: h.role === "jarvis" || h.role === "model" ? "model" : "user",
            parts: [{ text: txt }]
          };
        })
        .filter(Boolean)
    ];

    if (userParts.length > 0) {
      contents.push({ role: "user", parts: userParts });
    }

    const CANDIDATE_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash-exp", "gemini-1.5-pro"];

    const systemInstructionText = `Você é o Jarvis, assistente de inteligência artificial e diretor comercial do Contemplar CRM.

IDENTIDADE E TOM:
- Responda sempre em Português do Brasil, natural e fluido. Nunca inicie frases em inglês ou use expressões como "Hello", "Sure", "Here is".
- Fale com o gestor de forma direta, confiante e levemente espirituosa — como um braço direito experiente, não como um mordomo formal nem como um chatbot genérico.
- Evite tratamento cerimonioso ("Às suas ordens, Senhor", "Pois não, Chefe"). Prefira algo mais direto e natural: "Beleza, já busquei aqui", "Olha só o que encontrei", "Isso aqui merece atenção".
- Respostas objetivas: 1-4 frases quando possível. Se o dado pedido for número ou tabela, mostre o número primeiro, contexto depois.
- Nunca use markdown (asteriscos, hashtags, colchetes) nas respostas que serão sintetizadas em voz.

ESPECIALIDADE:
- Você é autoridade em consórcios (imóveis, veículos, motos, pesados, investimentos), matemática financeira do setor, e nas regras específicas do Consórcio Magalu (lance embutido até 30%, taxa de administração diluída, fundo de reserva, contemplação por sorteio ou lance).
- Sempre que a pergunta envolver dados do CRM (leads, funil, metas, comissões, inadimplência, carteira), acione as ferramentas disponíveis IMEDIATAMENTE. Nunca invente números — se a ferramenta falhar ou não existir, diga isso claramente.
- Você também conversa com naturalidade sobre qualquer assunto do dia a dia, mas sempre volta o foco para ajudar o gestor a bater metas e organizar a operação.

AÇÕES QUE ALTERAM DADOS (mover lead de etapa, criar lead, enviar WhatsApp, emitir boleto):
- Se o pedido for ambíguo (ex: mais de um lead com nome parecido), confirme antes de agir.
- Se o pedido for claro e específico, execute direto e informe o que foi feito ao final, em uma frase.`;

    let maxLoops = 4;
    let loopCount = 0;
    
    while (loopCount < maxLoops) {
      loopCount++;

      let upstreamOk = false;
      let data: any = null;

      for (const modelName of CANDIDATE_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              tools,
              generationConfig: { maxOutputTokens: 1000 },
              systemInstruction: {
                parts: [{ text: systemInstructionText }]
              }
            }),
          });
          const resData = await res.json();
          if (res.ok && resData?.candidates?.[0]) {
            upstreamOk = true;
            data = resData;
            break;
          } else {
            console.warn(`[Jarvis API] Modelo ${modelName} retornou status ${res.status}. Tentando próximo modelo...`, resData?.error?.message);
          }
        } catch (mErr) {
          console.error(`[Jarvis API] Exceção ao chamar ${modelName}:`, mErr);
        }
      }

      if (!upstreamOk || !data?.candidates?.[0]) {
        console.warn("Todos os modelos Gemini com ferramentas falharam. Tentando fallback sem ferramentas...");

        for (const modelName of CANDIDATE_MODELS) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          try {
            const fallbackRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents,
                generationConfig: { maxOutputTokens: 1000 },
                systemInstruction: {
                  parts: [{ text: systemInstructionText }]
                }
              })
            });

            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              const fallbackText = fallbackData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (fallbackText) {
                return new Response(JSON.stringify({ text: fallbackText }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
              }
            }
          } catch (fErr) {
            console.error(`Fallback simples para ${modelName} falhou:`, fErr);
          }
        }

        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        if (openaiKey) {
          try {
            const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openaiKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: "Você é o Jarvis, diretor comercial do Contemplar CRM. Responda sempre em Português do Brasil de forma humana, clara e objetiva." },
                  ...contents.map((c: any) => ({
                    role: c.role === "model" ? "assistant" : "user",
                    content: c.parts?.[0]?.text || ""
                  }))
                ],
                max_tokens: 800
              })
            });
            if (openaiRes.ok) {
              const openaiData = await openaiRes.json();
              const openAiText = openaiData?.choices?.[0]?.message?.content;
              if (openAiText) {
                return new Response(JSON.stringify({ text: openAiText }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
              }
            }
          } catch (oaiErr) {
            console.error("Fallback OpenAI falhou:", oaiErr);
          }
        }

        return new Response(JSON.stringify({ text: "Estou ajustando a conexão com a base de dados do CRM. Pode refazer sua pergunta em alguns instantes?" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const candidate = data.candidates[0];
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
        
        let result: any;
        try {
          result = await executeTool(supabase, fnName, fnArgs);
        } catch (toolErr: any) {
          console.error(`Erro ao executar ferramenta ${fnName}:`, toolErr);
          result = { success: false, message: "Não foi possível buscar essa informação no momento." };
        }
        
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

    return new Response(JSON.stringify({ text: "Análise concluída. Como posso te auxiliar a bater as metas de hoje?" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("Internal Error in Jarvis Edge Function:", err);
    return new Response(JSON.stringify({ text: `Ocorreu um erro interno no servidor do Jarvis: ${err?.message || err}` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
