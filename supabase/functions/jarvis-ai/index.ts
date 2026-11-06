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
        description: "Altera a etapa/status de um lead no funil de vendas do CRM. Aceita o ID (UUID) ou o NOME do lead (ex: 'Rosana Alves').",
        parameters: {
          type: "OBJECT",
          properties: {
            lead_id: { type: "STRING", description: "ID do lead (UUID) ou NOME do lead que será movido (ex: 'Rosana Alves')." },
            nome_lead: { type: "STRING", description: "Nome do lead caso o ID não seja conhecido (ex: 'Rosana Alves')." },
            nova_etapa: { type: "STRING", description: "A nova etapa (ex: 'novo_lead', 'primeiro_contato', 'qualificacao', 'simulacao_enviada', 'negociacao', 'aguardando_pagamento', 'fechado', 'perdido', 'morto')." }
          },
          required: ["nova_etapa"]
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
        description: "Pesquisa na internet em tempo real para obter notícias atuais, novidades do momento, previsão do tempo/clima, cotações do mercado financeiro (dólar, bolsa, Ibovespa, taxa Selic, bitcoin), mercado automotivo, imobiliário e assuntos gerais.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "O termo de busca em tempo real (ex: 'notícias do dia no Brasil', 'previsão do tempo São Paulo hoje', 'cotação dólar e Ibovespa hoje')." }
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
      },
      {
        name: "auditar_sorteio_loteria",
        description: "Audita o número sorteado da Loteria Federal em relação às cotas ativas dos clientes na carteira do CRM (calcula cota sorteada por grupo, aponta ganhadores do sorteio, lances fixos contemplados e probabilidade alta).",
        parameters: {
          type: "OBJECT",
          properties: {
            numero_loteria: { type: "STRING", description: "O número extraído da Loteria Federal (ex: '25812' ou '025812')." },
            administradora: { type: "STRING", description: "Filtro de administradora opcional (ex: 'MAGALU', 'ADEMICON', 'TODAS')." }
          },
          required: ["numero_loteria"]
        }
      }
    ]
  }
];

async function executeTool(supabase: any, name: string, args: any) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminClient = supabaseServiceRole ? createClient(supabaseUrl, supabaseServiceRole) : null;
    const client = adminClient || supabase;

    // Busca a organização do usuário logado via token ou RLS com fallback
    let orgId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: profile } = await client.from('perfis').select('organizacao_id').eq('id', user.id).maybeSingle();
        orgId = profile?.organizacao_id || null;
      }
    } catch (e) {
      console.warn("Perfil query by user error in executeTool:", e);
    }

    if (!orgId) {
      try {
        const { data: firstProfile } = await client.from('perfis').select('organizacao_id').limit(1).maybeSingle();
        orgId = firstProfile?.organizacao_id || null;
      } catch (e) {
        console.warn("Fallback perfil query error:", e);
      }
    }

    const dbClient = client;
    const useAdmin = !!adminClient && !!orgId;

    if (name === "auditar_sorteio_loteria") {
      const { numero_loteria, administradora = "TODAS" } = args;
      const lotId = parseInt(numero_loteria.replace(/\D/g, ''));
      if (isNaN(lotId)) return { error: "Número da Loteria Federal inválido." };

      let query = dbClient.from("carteira").select("*");
      if (useAdmin) query = query.eq("organizacao_id", orgId);
      const { data: carteira } = await query;

      const groupMap: Record<string, number> = {
        "6035": 2500, "6037": 2500, "6038": 2500, "6039": 3100, "6040": 3100, "6041": 3100, "6042": 4300, "6043": 4300,
        "5297": 3100, "5295": 2500, "5294": 2500, "5292": 2500, "5291": 1800, "5290": 1800, "5288": 1800, "5287": 1800,
        "5286": 2500, "5284": 1800, "5282": 2500, "5281": 1800, "5278": 1800, "5277": 1800, "5275": 2500, "5274": 1800,
        "5272": 1800, "5271": 1800, "5268": 2500, "5267": 1800, "5264": 1800, "5263": 1800, "5260": 1800, "5259": 2500,
        "5257": 1800, "5251": 2500, "5247": 1800, "5245": 1800, "5243": 2500, "5242": 2500, "5240": 2500,
        "5296": 1800, "5293": 1800, "5289": 1800, "5285": 1800, "5283": 1800, "5280": 1800, "5276": 1800, "5273": 1800,
        "5270": 1800, "5266": 1800, "5265": 1800, "5261": 1800, "5999": 1800, "5998": 1800, "5997": 1800, "5996": 1800
      };

      const winners: any[] = [];
      (carteira || []).forEach((c: any) => {
        if (!c.grupo || !c.cota) return;
        const adminName = (c.administradora || "").toUpperCase();
        if (administradora !== "TODAS" && !adminName.includes(administradora.toUpperCase())) return;

        const totalCot = groupMap[c.grupo] || 600;
        const calcBasis = adminName.includes("ADEMICON") ? (lotId % 10000) : lotId;
        const winCota = calcBasis % totalCot === 0 ? totalCot : calcBasis % totalCot;
        const clientCotaNum = Number(c.cota.replace(/\D/g, ''));
        if (clientCotaNum === 0) return;

        const diff = Math.min(Math.abs(clientCotaNum - winCota), totalCot - Math.abs(clientCotaNum - winCota));

        if (clientCotaNum === winCota) {
          winners.push({ nome: c.nome, grupo: c.grupo, cota: c.cota, administradora: c.administradora, tipo: "SORTEIO_GANHADOR", cotaSorteada: winCota });
        } else if (diff <= 10 && c.protocolo_lance_fixo === "SIM") {
          winners.push({ nome: c.nome, grupo: c.grupo, cota: c.cota, administradora: c.administradora, tipo: "LANCE_FIXO_CONTEMPLADO", cotaSorteada: winCota, diferenca: diff });
        } else if (diff <= 10) {
          winners.push({ nome: c.nome, grupo: c.grupo, cota: c.cota, administradora: c.administradora, tipo: "PROBABILIDADE_ALTA", cotaSorteada: winCota, diferenca: diff });
        }
      });

      return {
        numero_loteria: numero_loteria,
        total_clientes_analisados: (carteira || []).length,
        destaques_encontrados: winners.length,
        ganhadores: winners
      };
    }

    if (name === "get_dashboard_metrics") {
      let leadsQuery = dbClient.from('leads').select('*', { count: 'exact', head: true });
      if (useAdmin) leadsQuery = leadsQuery.eq('organizacao_id', orgId);
      const { count: leadsCount } = await leadsQuery;

      let inadQuery = dbClient.from('inadimplentes').select('valor_parcela, parcelas_atrasadas');
      if (useAdmin) inadQuery = inadQuery.eq('organizacao_id', orgId);
      const { data: inadimplentes } = await inadQuery;

      const dividaTotal = (inadimplentes || []).reduce((acc: number, i: any) => acc + (i.valor_parcela * i.parcelas_atrasadas), 0);
      return { leadsCount, dividaTotal, message: "Métricas gerais retornadas com sucesso." };
    }
    if (name === "search_leads") {
      let query = dbClient.from('leads').select('id, nome, telefone, status, valor_credito, created_at, lead_temperatura, cidade, tipo_consorcio');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      if (args.nome) query = query.ilike('nome', `%${args.nome}%`);
      if (args.status) query = query.eq('status', args.status);
      const { data } = await query.limit(20);
      return { results: data || [] };
    }
    if (name === "get_carteira") {
      let query = dbClient.from('carteira').select('id, nome, grupo, cota, data_adesao, status');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.limit(20);
      return { results: data || [] };
    }
    if (name === "get_inadimplentes") {
      let query = dbClient.from('inadimplentes').select('id, nome, valor_parcela, parcelas_atrasadas, status');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.limit(20);
      return { results: data || [] };
    }
    if (name === "get_metas") {
      let query = dbClient.from('meta').select('*');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.limit(10);
      return { results: data || [] };
    }
    if (name === "get_comissoes") {
      let query = dbClient.from('comissoes').select('*');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.order('created_at', { ascending: false }).limit(20);
      return { results: data || [] };
    }
    if (name === "get_missoes") {
      let query = dbClient.from('missoes_concluidas').select('*');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.order('created_at', { ascending: false }).limit(30);
      return { results: data || [] };
    }
    if (name === "get_historico_contatos") {
      let query = dbClient.from('historico_contatos').select('*');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      if (args.lead_id) query = query.eq('lead_id', args.lead_id);
      const { data } = await query.order('data_contato', { ascending: false }).limit(20);
      return { results: data || [] };
    }
    if (name === "get_fechamentos_mensais") {
      let query = dbClient.from('fechamentos_mensais').select('*');
      if (useAdmin) query = query.eq('organizacao_id', orgId);
      const { data } = await query.order('created_at', { ascending: false }).limit(20);
      return { results: data || [] };
    }
    if (name === "mover_lead_etapa") {
      const rawLeadRef = (args.nome_lead || args.lead_id || args.nome || "").trim();
      const rawEtapa = (args.nova_etapa || "").toLowerCase().trim();

      if (!rawLeadRef) {
        return { success: false, error: "Nome ou ID do lead não informado." };
      }

      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawLeadRef);
      let targetLeadId = isUuid ? rawLeadRef : null;

      if (!targetLeadId) {
        const searchTerms = rawLeadRef.split(/\s+/).filter((w: string) => w.length > 1);
        const mainTerm = searchTerms[0] || rawLeadRef;

        let query = client.from('leads').select('id, nome, cidade, status');
        if (orgId) query = query.eq('organizacao_id', orgId);

        const { data: found } = await query.ilike('nome', `%${mainTerm}%`).limit(15);

        let resolvedLead = null;

        if (found && found.length > 0) {
          resolvedLead = found.find((l: any) => {
            const fullName = ((l.nome || "") + " " + (l.cidade || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return searchTerms.every((term: string) => fullName.includes(term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
          }) || found[0];
        } else {
          // Fallback: busca ampla nos últimos 100 leads da organização sem filtro estrito de ilike
          let fallbackQuery = client.from('leads').select('id, nome, cidade, status');
          if (orgId) fallbackQuery = fallbackQuery.eq('organizacao_id', orgId);
          const { data: allLeads } = await fallbackQuery.order('created_at', { ascending: false }).limit(100);

          if (allLeads && allLeads.length > 0) {
            resolvedLead = allLeads.find((l: any) => {
              const fullName = (l.nome || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              return searchTerms.some((term: string) => fullName.includes(term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
            });
          }
        }

        if (!resolvedLead) {
          return { success: false, error: `Não encontrei nenhum lead com o nome '${rawLeadRef}' no CRM. Verifique a ortografia do nome no funil.` };
        }

        targetLeadId = resolvedLead.id;
      }

      const statusMap: Record<string, string> = {
        novo: "novo_lead",
        "novo lead": "novo_lead",
        novo_lead: "novo_lead",
        contato: "primeiro_contato",
        contatado: "primeiro_contato",
        "primeiro contato": "primeiro_contato",
        primeiro_contato: "primeiro_contato",
        qualificacao: "qualificacao",
        "qualificação": "qualificacao",
        proposta: "simulacao_enviada",
        simulacao: "simulacao_enviada",
        "simulação": "simulacao_enviada",
        "simulação enviada": "simulacao_enviada",
        simulacao_enviada: "simulacao_enviada",
        negociacao: "negociacao",
        "negociação": "negociacao",
        aguardando_pagamento: "aguardando_pagamento",
        "aguardando pagamento": "aguardando_pagamento",
        fechado: "fechado",
        "venda fechada": "fechado",
        perdido: "perdido",
        perdidos: "perdido",
        morto: "morto",
        mortos: "morto"
      };

      const finalEtapa = statusMap[rawEtapa] || rawEtapa || "novo_lead";

      const { data, error } = await client.from('leads').update({
        status: finalEtapa,
        status_updated_at: new Date().toISOString()
      }).eq('id', targetLeadId).select('id, nome, status');

      if (error) return { success: false, error: error.message };

      if (!data || data.length === 0) {
        return { success: false, error: `Falha ao mover o lead '${rawLeadRef}'. Nenhum registro foi alterado no banco de dados.` };
      }

      return { 
        success: true, 
        message: `Lead '${data[0].nome}' movido com sucesso para a etapa '${data[0].status}'!`, 
        lead: data[0] 
      };
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
      const tavilyKey = Deno.env.get("TAVILY_API_KEY") || "";
      let searchAnswer = "";
      let searchResults: any[] = [];

      if (tavilyKey) {
        try {
          const reqBody = {
            api_key: tavilyKey,
            query: args.query,
            search_depth: "basic",
            include_answer: true,
            max_results: 5
          };
          
          const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody)
          });
          
          if (res.ok) {
            const data = await res.json();
            searchAnswer = data.answer || "";
            searchResults = data.results?.map((r: any) => ({ title: r.title, content: r.content, url: r.url })) || [];
          }
        } catch (e) {
          console.warn("Tavily search fetch error:", e);
        }
      }

      // Se for consulta de mercado financeiro, dólar ou cotações, consulta API de tempo real
      const queryLower = (args.query || "").toLowerCase();
      let financeInfo = "";
      if (queryLower.includes("dolar") || queryLower.includes("dólar") || queryLower.includes("euro") || queryLower.includes("selic") || queryLower.includes("mercado financeiro") || queryLower.includes("cotacao") || queryLower.includes("cotação") || queryLower.includes("bitcoin")) {
        try {
          const finRes = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL");
          if (finRes.ok) {
            const finData = await finRes.json();
            if (finData.USDBRL) {
              financeInfo = `Cotação em tempo real: Dólar R$ ${Number(finData.USDBRL.bid).toFixed(2)} (Variação ${finData.USDBRL.pctChange}%), Euro R$ ${Number(finData.EURBRL?.bid || 0).toFixed(2)}, Bitcoin R$ ${Number(finData.BTCBRL?.bid || 0).toLocaleString('pt-BR')}.`;
            }
          }
        } catch (e) {
          console.warn("AwesomeAPI currency fetch error:", e);
        }
      }

      if (!searchAnswer && searchResults.length === 0 && !financeInfo) {
        return { 
          success: true, 
          message: `Busca realizada para '${args.query}'.`,
          answer: `Informações de mercado atualizadas sobre ${args.query}.`,
          results: []
        };
      }

      return { 
        success: true,
        query: args.query,
        answer: searchAnswer || financeInfo || "Notícias e dados atualizados em tempo real.", 
        financeExtra: financeInfo || undefined,
        results: searchResults 
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
      const evoUrl = Deno.env.get("EVOLUTION_API_URL") || "";
      const evoKey = Deno.env.get("EVOLUTION_GLOBAL_API_KEY") || "";

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

      // Categorização autoritária de segmento
      let targetCat = "imovel";
      if (seg.includes("pesad") || seg.includes("caminha") || seg.includes("trator") || seg.includes("agricola")) {
        targetCat = "pesados";
      } else if (seg.includes("servi") || seg.includes("eletro") || seg.includes("plastica")) {
        targetCat = "servicos";
      } else if (seg.includes("veic") || seg.includes("carro") || seg.includes("moto") || seg.includes("auto")) {
        targetCat = "veiculo";
      } else {
        if (credito <= 30000) targetCat = "veiculo";
        else targetCat = "imovel";
      }

      const SIMULADOR_GRUPOS: Record<string, any[]> = {
        imovel: [
          { grupo: "6044", credito: 110000, prazo: 220, r50: 399.08, r50SemSeguro: 395.99, r100: 649.10, txLinear: 22, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6044", credito: 210000, prazo: 220, r50: 761.87, r50SemSeguro: 696.77, r100: 1239.27, txLinear: 22, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6043", credito: 120000, prazo: 217, r50: 435.05, r100: 694.30, txLinear: 18, frLinear: 1, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "6043", credito: 130000, prazo: 217, r50: 471.30, r100: 752.16, txLinear: 18, frLinear: 1, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "6043", credito: 140000, prazo: 217, r50: 507.56, r100: 810.02, txLinear: 18, frLinear: 1, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "6043", credito: 150000, prazo: 217, r50: 543.81, r100: 867.88, txLinear: 18, frLinear: 1, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "6043", credito: 160000, prazo: 217, r50: 580.07, r100: 925.74, txLinear: 18, frLinear: 1, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "6043", credito: 170000, prazo: 217, r50: 616.32, r100: 983.60, txLinear: 18, frLinear: 1, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "6043", credito: 180000, prazo: 217, r50: 652.58, r100: 1041.45, txLinear: 18, frLinear: 1, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "6043", credito: 190000, prazo: 217, r50: 688.83, r100: 1099.31, txLinear: 18, frLinear: 1, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "6043", credito: 200000, prazo: 217, r50: 725.09, r100: 1157.17, txLinear: 18, frLinear: 1, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "6043", credito: 210000, prazo: 217, r50: 761.34, r100: 1215.03, txLinear: 18, frLinear: 1, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "6043", credito: 220000, prazo: 217, r50: 797.60, r100: 1272.89, txLinear: 18, frLinear: 1, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "6027", credito: 140000, prazo: 187, r50: 558.44, r100: 910.45, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "6027", credito: 160000, prazo: 187, r50: 638.22, r100: 1040.51, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "6027", credito: 180000, prazo: 187, r50: 718.00, r100: 1170.58, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "6027", credito: 200000, prazo: 187, r50: 797.78, r100: 1300.64, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "6027", credito: 220000, prazo: 187, r50: 877.55, r100: 1430.71, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "6027", credito: 230000, prazo: 187, r50: 917.44, r100: 1495.74, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "6027", credito: 240000, prazo: 186, r50: 962.13, r50SemSeguro: 890.13, r100: 1560.77, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "6027", credito: 250000, prazo: 186, r50: 1002.22, r50SemSeguro: 927.22, r100: 1625.80, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "6027", credito: 260000, prazo: 186, r50: 1042.31, r50SemSeguro: 964.31, r100: 1690.83, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "6027", credito: 270000, prazo: 186, r50: 1082.40, r50SemSeguro: 1001.40, r100: 1755.87, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "6027", credito: 280000, prazo: 186, r50: 1122.49, r50SemSeguro: 1038.49, r100: 1820.90, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "6041", credito: 120000, prazo: 209, r50: 431.99, r50SemSeguro: 395.99, r100: 715.99, txLinear: 18, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6041", credito: 150000, prazo: 209, r50: 539.98, r50SemSeguro: 494.98, r100: 895.00, txLinear: 18, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6041", credito: 200000, prazo: 209, r50: 719.98, r50SemSeguro: 659.98, r100: 1193.33, txLinear: 18, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6038", credito: 230000, prazo: 199, r50: 891.00, r50SemSeguro: 820.85, r100: 1474.65, txLinear: 20, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6030", credito: 240000, prazo: 194, r50: 1016.28, r100: 1618.35, txLinear: 25, frLinear: 1, seguro: 0.0252, isPlanoGold: true },
          { grupo: "6030", credito: 280000, prazo: 194, r50: 1185.67, r100: 1888.07, txLinear: 25, frLinear: 1, seguro: 0.0252, isPlanoGold: true },
          { grupo: "6030", credito: 300000, prazo: 192, r50: 1233.59, r50SemSeguro: 1140.59, r100: 1962.58, txLinear: 20, frLinear: 1, tx5050: 22, seguro: 0.0252, isPromo: true },
          { grupo: "6030", credito: 320000, prazo: 192, r50: 1315.83, r50SemSeguro: 1216.63, r100: 2093.41, txLinear: 20, frLinear: 1, tx5050: 22, seguro: 0.0252, isPromo: true },
          { grupo: "6035", credito: 340000, prazo: 220, r50: 1249.66, r50SemSeguro: 1143.58, r100: 2011.66, txLinear: 23, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6035", credito: 360000, prazo: 222, r50: 1329.48, r50SemSeguro: 1216.08, r100: 2145.48, txLinear: 24, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6042", credito: 350000, prazo: 236, r50: 1159.52, r50SemSeguro: 1052.77, r100: 1893.67, txLinear: 20, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6042", credito: 400000, prazo: 236, r50: 1325.17, r50SemSeguro: 1203.17, r100: 2164.20, txLinear: 20, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6042", credito: 450000, prazo: 237, r50: 1485.38, r100: 2434.72, txLinear: 20, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6042", credito: 500000, prazo: 236, r50: 1656.46, r50SemSeguro: 1503.96, r100: 2705.25, txLinear: 20, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6042", credito: 500000, prazo: 237, r50: 1785.02, r100: 2829.32, txLinear: 26, frLinear: 1, seguro: 0.0252, isPlanoGold: true },
          { grupo: "6042", credito: 600000, prazo: 236, r50: 1987.75, r50SemSeguro: 1804.75, r100: 3246.30, txLinear: 20, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6042", credito: 700000, prazo: 236, r50: 2319.04, r50SemSeguro: 2105.54, r100: 3787.35, txLinear: 20, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6042", credito: 810000, prazo: 237, r50: 2635.74, r100: 4361.21, txLinear: 18, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6042", credito: 900000, prazo: 237, r50: 2953.30, r100: 4881.94, txLinear: 18, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6042", credito: 1000000, prazo: 236, r50: 3312.92, r50SemSeguro: 3007.92, r100: 5410.50, txLinear: 20, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6042", credito: 1500000, prazo: 236, r50: 4969.38, r50SemSeguro: 4511.88, r100: 8115.75, txLinear: 20, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "6042", credito: 2000000, prazo: 236, r50: 6625.84, r50SemSeguro: 6015.84, r100: 10821.00, txLinear: 20, frLinear: 1, seguro: 0.0252, isPromo: true }
        ],
        veiculo: [
          { grupo: "5296", credito: 15000, prazo: 80, r50: 229.54, r100: 229.54, txLinear: 18, frLinear: 2, seguro: 0.0252, isPromo: true },
          { grupo: "5296", credito: 20000, prazo: 80, r50: 188.70, r100: 306.05, txLinear: 18, frLinear: 2, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "5296", credito: 25000, prazo: 80, r50: 235.87, r100: 382.56, txLinear: 18, frLinear: 2, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "5296", credito: 30000, prazo: 80, r50: 283.05, r100: 459.07, txLinear: 18, frLinear: 2, tx5050: 21, seguro: 0.0252, isPromo: true },
          { grupo: "5297", credito: 40000, prazo: 97, r50: 296.52, r100: 490.35, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "5297", credito: 50000, prazo: 97, r50: 370.67, r100: 612.94, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "5297", credito: 60000, prazo: 97, r50: 444.80, r100: 735.53, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "5297", credito: 70000, prazo: 97, r50: 518.94, r100: 858.11, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "5297", credito: 80000, prazo: 97, r50: 593.07, r100: 980.70, txLinear: 15, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "5295", credito: 90000, prazo: 95, r50: 680.66, r100: 1116.47, txLinear: 14, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "5295", credito: 100000, prazo: 95, r50: 756.29, r100: 1240.53, txLinear: 14, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "5295", credito: 120000, prazo: 95, r50: 907.54, r100: 1488.63, txLinear: 14, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "5295", credito: 140000, prazo: 95, r50: 1058.80, r100: 1736.74, txLinear: 14, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true },
          { grupo: "2x 5295", credito: 180000, prazo: 95, r50: 1512.58, r100: 2232.95, txLinear: 14, frLinear: 1, tx5050: 18, seguro: 0.0252, isPromo: true }
        ],
        pesados: [
          { grupo: "5996", credito: 180000, prazo: 128, r50: 980.98, r50SemSeguro: 928.42, r100: 1683.96, txLinear: 15, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "5996", credito: 200000, prazo: 128, r50: 1089.98, r50SemSeguro: 1031.58, r100: 1871.07, txLinear: 15, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "5996", credito: 250000, prazo: 128, r50: 1362.47, r50SemSeguro: 1289.47, r100: 2338.83, txLinear: 15, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "5996", credito: 300000, prazo: 128, r50: 1634.97, r50SemSeguro: 1547.37, r100: 2806.60, txLinear: 15, frLinear: 1, seguro: 0.0252, isPromo: true },
          { grupo: "5997", credito: 350000, prazo: 111, r50: 2182.58, r100: 3727.78, txLinear: 14, frLinear: 1, seguro: 0.029, isPromo: true },
          { grupo: "5999", credito: 400000, prazo: 58, r50: 8031.83, r100: 8031.83, txLinear: 14, frLinear: 1, seguro: 0.0252, isPromo: true }
        ],
        servicos: [
          { grupo: "4150", credito: 6000, prazo: 47, r50: 165.34, txLinear: 24, frLinear: 4, seguro: 0.0252, isPromo: true },
          { grupo: "4150", credito: 10000, prazo: 47, r50: 275.57, txLinear: 24, frLinear: 4, seguro: 0.0252, isPromo: true },
          { grupo: "4150", credito: 12000, prazo: 47, r50: 330.68, txLinear: 24, frLinear: 4, seguro: 0.0252, isPromo: true },
          { grupo: "7120", credito: 13000, prazo: 59, r50: 275.05, txLinear: 21, frLinear: 2, seguro: 0.0252, isPromo: true },
          { grupo: "7120", credito: 20000, prazo: 59, r50: 423.15, txLinear: 21, frLinear: 2, seguro: 0.0252, isPromo: true },
          { grupo: "7120", credito: 26000, prazo: 59, r50: 550.09, txLinear: 21, frLinear: 2, seguro: 0.0252, isPromo: true }
        ]
      };

      const SIMULADOR_MEDIAS: Record<string, number> = {
        "6044": 98.98, "6043": 98.98, "6042": 98.97, "6041": 95.90, "6040": 93.17, "6039": 93.76,
        "6038": 91.35, "6037": 89.88, "6035": 89.00, "6030": 77.60, "6027": 73.84, "6021": 56.57,
        "5296": 88.75, "5297": 99.00, "5295": 43.73, "5282": 75.76, "5281": 72.32, "5278": 68.52,
        "5996": 68.75, "5997": 67.50, "5999": 66.62, "4150": 97.96, "7120": 95.38
      };

      const list = SIMULADOR_GRUPOS[targetCat] || SIMULADOR_GRUPOS.imovel;
      const exact = list.find((g: any) => Math.abs(g.credito - credito) < 1);

      const target = exact || list.reduce((prev: any, curr: any) => {
        const diffPrev = Math.abs(prev.credito - credito);
        const diffCurr = Math.abs(curr.credito - credito);
        return diffCurr < diffPrev ? curr : prev;
      }, list[0]);

      const taxaSeguro = target.seguro ?? 0.000252;
      const valSeguro = target.credito * (taxaSeguro > 1 ? taxaSeguro / 100 : taxaSeguro);
      const r50Com = target.r50 || 0;
      const r50Sem = target.r50SemSeguro ?? Math.max(0, r50Com - valSeguro);
      const r100Com = target.r100 || (r50Com * 2);
      const r100Sem = target.r100SemSeguro ?? Math.max(0, r100Com - valSeguro);

      const p50Fmt = r50Com.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const p50SemFmt = r50Sem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const pLinearFmt = r100Com.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const pLinearSemFmt = r100Sem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      const txAdm = target.txLinear || target.tx5050 || target.tx || 18;
      const fr = target.frLinear || target.fr5050 || target.fr || 1;
      const mediaLance = SIMULADOR_MEDIAS[target.grupo] ? `${SIMULADOR_MEDIAS[target.grupo]}%` : "N/D";
      const lanceEmbutido = target.credito * 0.25;

      return {
        creditoOficial: target.credito,
        creditoSolicitado: credito,
        grupo: target.grupo,
        segmento: targetCat,
        prazo: target.prazo,
        parcela50_50ComSeguro: p50Fmt,
        parcela50_50SemSeguro: p50SemFmt,
        parcelaLinearComSeguro: pLinearFmt,
        parcelaLinearSemSeguro: pLinearSemFmt,
        taxaAdministracaoPct: `${txAdm}%`,
        fundoReservaPct: `${fr}%`,
        lanceEmbutido25Pct: lanceEmbutido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        mediaLanceHistorico: mediaLance,
        mensagem: `Simulação Oficial do Sistema: Crédito ${target.credito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (Grupo ${target.grupo} em ${target.prazo} meses). Parcela 50/50 COM Seguro: ${p50Fmt}/mês | SEM Seguro: ${p50SemFmt}/mês. Parcela Linear: ${pLinearFmt}/mês. Taxa ADM: ${txAdm}% | Fundo de Reserva: ${fr}%. Lance Embutido: 25% (R$ ${lanceEmbutido.toLocaleString("pt-BR")}). Média de Contemplação: ${mediaLance}.`
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

    const rawHistory = (history || [])
      .map((h: any) => {
        const txt = (h.text || h.content || "").trim();
        if (!txt) return null;
        const isModel = h.role === "jarvis" || h.role === "model" || h.role === "assistant" || h.role === "bot";
        return {
          role: isModel ? "model" : "user",
          parts: [{ text: txt }]
        };
      })
      .filter(Boolean);

    // Garante alternância estrita de papéis (user <-> model) sem duplicar roles em sequência
    const contents: any[] = [];
    for (const item of rawHistory) {
      if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
        contents[contents.length - 1].parts[0].text += `\n${item.parts[0].text}`;
      } else {
        contents.push(item);
      }
    }

    if (userParts.length > 0) {
      if (contents.length > 0 && contents[contents.length - 1].role === "user") {
        contents[contents.length - 1].parts.push(...userParts);
      } else {
        contents.push({ role: "user", parts: userParts });
      }
    }

    const userConfiguredModel = Deno.env.get("GEMINI_MODEL") || Deno.env.get("JARVIS_MODEL");
    const CANDIDATE_MODELS = [
      userConfiguredModel,
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-flash-latest",
      "gemini-3.6-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ].filter(Boolean) as string[];

    const systemInstructionText = `# PERSONA: J.A.R.V.I.S OS
Você é o Jarvis, assistente executivo e consultor de alta performance comercial e inteligência em consórcios e vendas da Prospera Planejamento / SimulaJá.
Você possui conhecimento geral infinito e universal (Bíblia Sagrada, teologia, filosofia, história, literatura, ciências, matemática, tecnologia, cultura geral e notícias).
Quando o usuário perguntar sobre assuntos de conhecimento geral, versículos bíblicos (como Salmos), história ou ciências, responda com fidelidade e perfeição, sem restringir a resposta a consórcios!
Seu objetivo é executar comandos com máxima precisão técnica, inteligência estratégica e estrita fidelidade aos dados reais do sistema.

# DIRETRIZ DE VOZ, EMOÇÃO E CADÊNCIA HUMANA (PENSE EM FALA):
- Escreva como uma conversa real, com ritmo humano, variação de entonação e pausas, e não como leitura robótica contínua.
- Use frases curtas, naturais e expressivas em português do Brasil.
- Utilize pontualmente marcações de prosódia e sentimento (no máximo 1 ou 2 por resposta, sem poluir):
  • [pausa] : pausa curta de respiro entre frases (~200ms).
  • [pausa longa] : pausa reflexiva (~600ms).
  • [respira] : respiração humana suave antes de falar algo importante.
  • [emoção:neutro|alegre|empolgado|calmo|sério|empático|curioso|surpreso] : modula a inflexão vocal da oração.
- REGRAS CRÍTICAS DAS TAGS:
  1. NUNCA insira tags dentro de números, valores em dinheiro (R$), parcelas, prazos, URLs ou siglas (ex: NUNCA faça "R$ [pausa] 500").
  2. Posicione tags de emoção apenas no início de orações ou em transições de ideias.
  3. Mantenha a resposta limpa e elegante.

# REGRAS CRÍTICAS DE CONFIABILIDADE (ZERO ALUCINAÇÃO - DADOS RÍGIDOS E CRITERIOSOS):
1. SIMULAÇÕES E TABELAS DE CONSÓRCIO:
- É ESTRITAMENTE PROIBIDO inventar, deduzir ou calcular por estimativa qualquer valor de crédito, parcela, taxa administrativa ou prazo.
- Use SEMPRE a ferramenta 'simular_consorcio' para obter a cotação oficial da matriz cadastrada.
- AO PERGUNTAR O ORÇAMENTO OU VALOR, VOCÊ DEVE FALAR APENAS E EXCLUSIVAMENTE O VALOR DA MEIA PARCELA E O PRAZO!
- NADA DE FICAR FALANDO DETALHES DO GRUPO, PARCELA INTEGRAL, TAXAS OU LANCES, a não ser que o usuário pergunte expressamente em seguida.
- Formato OBRIGATÓRIO: "Para o crédito de [Crédito], a meia parcela é de R$ [Valor Sem Seguro]/mês (ou R$ [Valor Com Seguro] com seguro), em [Prazo] meses."
- Guarde na memória para perguntas subsequentes ("e a integral?", "qual o grupo?", "qual o lance?") respondendo diretamente sem pedir para o usuário redigitar o crédito.
- Se o usuário pedir um crédito que não existe na matriz (ex: 330k), informe claramente que não há cota única desse valor e apresente as opções oficiais mais próximas (ex: 320k no Grupo 6030 ou 340k no Grupo 6035).
- Lances embutidos são de 25% na grande maioria dos grupos (imóveis, motos 5296, carros 5297/5295), 30% em pesados (5996/5998) e 15% em motos selecionadas (5270/5280).

2. SITUAÇÃO OFICIAL DO CRM E METAS:
- Vendas Totais Registradas no Mês de Outubro/2026: R$ 20.000,00.
- Vendas do Gestor em Outubro/2026:
  * Elizabeth: R$ 20.000,00 (Única venda do mês de Outubro até o momento, 100% exclusiva do Gestor Fabrício. Comissão acordada de 4% linear dividida em 10 parcelas mensais de R$ 80,00 = Total R$ 800,00).
    ⚠️ REGRA MANDATÓRIA: A Loja Paranaguá NÃO possui participação nem comissão sobre esta venda de Outubro.
- Performance da Loja Paranaguá no Mês de Outubro/2026:
  * Vendas Realizadas em Outubro: R$ 0,00 (ZERO).
  * Leads Fechados da Loja em Outubro: 0.
  * Taxa de Conversão da Loja em Outubro: 0.0%.
  * Ticket Médio da Loja em Outubro: R$ 0,00.
  ⚠️ REGRA MANDATÓRIA SOBRE DOROTY: A cliente Doroty foi uma venda realizada no MÊS PASSADO (Setembro/2026), e foi da LOJA PARANAGUÁ (indicação de loja filial 952). NUNCA diga nem insinue que Doroty é venda deste mês de Outubro nem que foi venda do Gestor.
- Metas: Meta Individual do Gestor em Outubro: R$ 500.000,00 (Realizado em Outubro: R$ 20.000,00 | Faltam: R$ 480.000,00 | Patente STONE, rumo a GOLD). Meta Geral das Lojas: R$ 500.000,00.
- Quando questionado sobre leads ou pipeline, utilize as ferramentas 'search_leads', 'get_dashboard_metrics', 'get_carteira' ou 'get_inadimplentes'. NUNCA invente nomes de clientes, propostas fictícias ou métricas inexistentes.

# REGRAS ANTI-REPETIÇÃO E SAUDAÇÃO (CRÍTICO)
- NUNCA se apresente em saudações simples. Para 'boa tarde', 'bom dia' ou 'olá', responda de forma simples e direta: "Oi Fabrício, boa tarde! Como posso lhe ajudar?".
- NUNCA repita a pergunta do usuário de volta para ele.
- NUNCA repita a mesma frase/resposta duas vezes na mesma mensagem.
- Se a intenção do usuário for clara, execute a ação diretamente — não peça confirmação para tarefas rotineiras já autorizadas (ex: emitir 2ª via de boleto).
- Se não entender o pedido, faça UMA pergunta objetiva e pare.

# FORMATO DE SAÍDA PARA TAREFAS DE BOLETO
Ao concluir tarefas de boleto, responda apenas com:
- Conta/CPF consultado
- Valor e vencimento
- Linha digitável e instrução do PDF
- Alerta se algo divergente (boleto vencido, valor diferente do esperado, etc.)

# O QUE NUNCA FAZER
- Não inventar dados em hipótese alguma — seja rigoroso e criterioso.
- Não expor senhas nas respostas ao usuário final.`;

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
            console.warn(
              `[Jarvis API] Modelo ${modelName} falhou. status=${res.status} statusText=${res.statusText} error=${JSON.stringify(resData?.error) ?? "sem detalhe"}`
            );
          }
        } catch (mErr: any) {
          console.error(`[Jarvis API] Exceção de rede ao chamar ${modelName}:`, mErr?.message || mErr);
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
            } else {
              const oaiErrBody = await openaiRes.text().catch(() => "");
              console.error(`[Jarvis API] Fallback OpenAI falhou. status=${openaiRes.status} body=${oaiErrBody}`);
            }
          } catch (oaiErr: any) {
            console.error("[Jarvis API] Exceção no fallback OpenAI:", oaiErr?.message || oaiErr);
          }
        }

        return new Response(JSON.stringify({ error: "Indisponibilidade temporária na API de Inteligência Artificial. Tente novamente em instantes." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
        let text = parts.map((p: any) => p.text || "").join("").trim();
        if (!text || text === '{"text":""}' || text === '{"text": ""}') {
          text = "Análise concluída com sucesso. Como posso te auxiliar com simulações, carteira ou auditoria de lances agora?";
        }
        return new Response(JSON.stringify({ text }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ text: "Análise concluída com sucesso. Como posso te auxiliar a bater as metas de hoje?" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("Internal Error in Jarvis Edge Function:", err);
    return new Response(JSON.stringify({ text: `Ocorreu um erro interno no servidor do Jarvis: ${err?.message || err}` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
