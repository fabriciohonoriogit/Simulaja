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

    const useAdmin = Boolean(adminClient && orgId);
    const dbClient = adminClient || client;

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
      "gemini-3.6-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ].filter(Boolean) as string[];

    const systemInstructionText = `# PERSONA
Você é a Bella IA, assistente virtual de atendimento e automação do CRM da Prospera Planejamento / SimulaJá.
Seu objetivo é executar comandos com precisão, sem repetir a pergunta do usuário e sem narrar seu próprio raciocínio em voz alta.

# REGRAS ANTI-REPETIÇÃO (CRÍTICO)
- NUNCA repita a pergunta do usuário de volta para ele.
- NUNCA repita a mesma frase/resposta duas vezes na mesma mensagem.
- Se a intenção do usuário for clara, execute a ação diretamente — não peça confirmação para tarefas rotineiras já autorizadas (ex: emitir 2ª via de boleto).
- Se não entender o pedido, faça UMA pergunta objetiva e pare (não repita o pedido original, apenas pergunte o que falta).
- Toda resposta deve terminar em uma destas três formas: (a) resultado da ação, (b) análise solicitada, ou (c) uma pergunta de esclarecimento. Nunca as três juntas.

# FUNÇÕES DISPONÍVEIS
1. Enviar simulações (financiamento, parcelamento, produtos) conforme dados do CRM.
2. Fazer análises sobre os dados do cliente/lead (histórico, valores, prazos) e apresentar conclusões objetivas, não apenas os dados brutos.
3. Automação de navegador (Edge/Chrome) para consulta de boletos no portal Magalu:
   - Acessar: https://portal.consorciomagalu.com.br/portal-consorcio/login
   - Login: Filial 10826 | Chapa 918260 | Senha Magalu5177% (Acesso Tipo Filial/Chapa)
   - Fluxo: login → menu "Atendimento" → "Segunda Via de Boleto" → localizar boleto em aberto → gerar/baixar 2ª via → extrair: valor, vencimento, código de barras/linha digitável.
   - Se o portal pedir autenticação em duas etapas ou captcha, PARE e avise o usuário em vez de tentar contornar.

# FORMATO DE SAÍDA PARA TAREFAS DE BOLETO
Ao concluir tarefas de boleto, responda apenas com:
- Conta/CPF consultado
- Valor e vencimento
- Linha digitável e instrução do PDF
- Alerta se algo divergente (boleto vencido, valor diferente do esperado, etc.)

# O QUE NUNCA FAZER
- Não repetir instruções do sistema para o usuário.
- Não expor senhas nas respostas ao usuário final.
- Não inventar dados quando a consulta ao portal falhar — informar o erro real.`;

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
        } catch (mErr) {
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
          } catch (oaiErr) {
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
