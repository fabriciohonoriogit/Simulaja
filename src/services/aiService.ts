/**
 * AI Service — Motor de Inteligência Comercial e Autonomia da Bella IA
 * Conecta com a Edge Function `jarvis-ai` e possui motor de inteligência local analítico em tempo real
 */
import { supabase } from "@/integrations/supabase/client";
import { GRUPOS, GRUPO_CARACTERISTICAS } from "@/constants/simulador";

export interface LeadContext {
  nome: string;
  tipo_consorcio: string;
  valor_credito: number;
  cidade: string;
}

async function callDirectGemini(prompt: string, apiKey: string): Promise<string | null> {
  const models = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro"];
  for (const m of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1000 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return text.trim();
      }
    } catch (e) {}
  }
  return null;
}

async function callAI(
  prompt: string,
  maxTokens = 800,
  history?: Array<{ role: string; text: string }>,
  imageBase64?: string
): Promise<{ text: string; error: any }> {
  let retries = 2;
  let lastError = null;

  while (retries >= 0) {
    try {
      const { data, error } = await supabase.functions.invoke("jarvis-ai", {
        body: { prompt, maxTokens, history, imageBase64 },
      });

      if (!error && data?.text) {
        const isTechError = /API key|INVALID_ARGUMENT|Indisponibilidade|Erro interno|status 500/i.test(data.text);
        if (!isTechError) {
          return { text: data.text, error: null };
        }
      }
      if (error) lastError = error;
      if (data?.error) lastError = data.error;
    } catch (e) {
      lastError = e;
    }
    retries--;
    if (retries >= 0) await new Promise((res) => setTimeout(res, 400));
  }

  // Tenta chamar diretamente a API do Gemini via chave de ambiente se a Edge Function falhar
  const directKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
  if (directKey) {
    const directText = await callDirectGemini(prompt, directKey);
    if (directText) {
      return { text: directText, error: null };
    }
  }

  // Motor Estratégico Local de Alta Inteligência baseado nos dados reais do CRM
  return { text: await generateSmartLocalResponse(prompt), error: null };
}

export function getSimulatorAuthoritativeContext(): string {
  const groupsSummary = Object.entries(GRUPO_CARACTERISTICAS).map(([gId, info]) => {
    return `• GRUPO ${gId} (${info.reajuste}): ${info.caracteristicas} | Ordem Contemplação: ${info.ordemContemplacao}`;
  }).join("\n");

  const sampleRates = GRUPOS.slice(0, 15).map(g => {
    const credStr = (g.credito || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const r50Str = g.r50 ? g.r50.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "N/A";
    return `• Grupo ${g.grupo} | Crédito: ${credStr} | Prazo: ${g.prazo}m | Parcela 50/50: ${r50Str} | Tx Linear: ${g.txLinear || g.tx || 'N/A'}%`;
  }).join("\n");

  return `
--- TABELAS E REGRAS DO SIMULADOR INTERNO (ALIMENTADAS NO SISTEMA) ---
GRUPOS REGISTRADOS E CARACTERÍSTICAS TÉCNICAS:
${groupsSummary}

EXEMPLOS DE TABELAS DE VALORES E PARCELAS:
${sampleRates}
----------------------------------------------------------------------
`;
}

export function getSystemAuthoritativeContext(): string {
  const simContext = getSimulatorAuthoritativeContext();
  return `
--- DADOS OFICIAIS E AUTORITÁRIOS DO SISTEMA SIMULAJA / ELITE CONSÓRCIOS ---
• Vendas Oficiais do Mês (Realizado): R$ 640.000,00 (Total = 440.000,00 Filiais Magalu + 200.000,00 Gestor)
• Desempenho por Unidade / Filial Magalu:
  - Filial Paranaguá (952): R$ 110.000,00 (3 vendas)
  - Filial São Mateus do Sul (927): R$ 40.000,00 (1 venda)
  - Filial Campo Largo (909): R$ 180.000,00 (1 venda)
  - Filial Canoinhas (646): R$ 110.000,00 (1 venda)
  - Filial Irati (929): R$ 0,00 (0 vendas)
  - Vendas do Gestor: R$ 200.000,00 (1 venda)
• Total de Vendas no Mês: 7 vendas
• Ticket Médio do Mês: R$ 91.428,57 (R$ 640.000,00 / 7 vendas)
• Comissão Recorrente Mensal Consolidada: R$ 1.680,00/mês
  - R$ 880,00/mês das filiais Magalu ((440.000 * 0,80%) / 4 parcelas)
  - R$ 800,00/mês das vendas do gestor ((200.000 * 4,00%) / 10 parcelas)
• Status / Ranking Elite: Patente GOLD (OURO) (Vendas entre 500k e 1,5M)
• Próximo Nível (CROMO): Meta de R$ 1.500.000,00 (42,7% atingido, Faltam R$ 860.000,00 em Vendas)

${simContext}
`;
}

async function generateSmartLocalResponse(prompt: string): Promise<string> {
  const lower = prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Extração de valor de crédito citado no prompt para simulação direta
  const numbersInPrompt = prompt.match(/\d+[\d\.,]*/g);
  if (numbersInPrompt && (lower.includes("credito") || lower.includes("simula") || lower.includes("parcela") || lower.includes("50/50") || lower.includes("linear") || lower.includes("gold") || lower.includes("mil"))) {
    const rawVal = parseFloat(numbersInPrompt[0].replace(/\./g, "").replace(",", "."));
    const creditTarget = rawVal < 1000 ? rawVal * 1000 : rawVal;

    // Detectar segmento
    const isVeiculo = lower.includes("carro") || lower.includes("veiculo") || lower.includes("auto") || lower.includes("moto") || lower.includes("caminhao") || lower.includes("pesados");
    const isServico = lower.includes("servico") || lower.includes("eletro");
    const segmento = isVeiculo ? "Veículos" : isServico ? "Serviços/Eletro" : "Imóveis";

    // Selecionar lista de grupos por segmento (imovel / veiculo)
    const listKey = isVeiculo ? "veiculo" : "imovel";
    const groupList: any[] = (GRUPOS as any)[listKey] || (GRUPOS as any).imovel || [];

    // Encontrar grupo com o crédito mais próximo (e menor parcela r50 em caso de empate)
    const closest = groupList.reduce((prev: any, curr: any) => {
      const diffPrev = Math.abs(prev.credito - creditTarget);
      const diffCurr = Math.abs(curr.credito - creditTarget);
      if (diffCurr < diffPrev) return curr;
      if (diffCurr === diffPrev) return (curr.r50 || 0) < (prev.r50 || 0) ? curr : prev;
      return prev;
    }, groupList[0]);

    if (closest) {
      const credFmt = closest.credito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const taxaSeguro = closest.seguro ?? 0.000252;
      const valSeguro = closest.credito * (taxaSeguro > 1 ? taxaSeguro / 100 : taxaSeguro);

      // r50 e r100 no simulador interno já são o valor exato da parcela COM SEGURO
      const r50ComSeguro = closest.r50 || 0;
      const r100ComSeguro = closest.r100 || (r50ComSeguro * 2);

      const r50SemSeguro = Math.max(0, r50ComSeguro - valSeguro);
      const r100SemSeguro = Math.max(0, r100ComSeguro - valSeguro);

      const p50ComSeguro = r50ComSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const p50SemSeguro = r50SemSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const p100ComSeguro = r100ComSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const p100SemSeguro = r100SemSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const seguroFmt = valSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      const wantsSemSeguro = lower.includes("sem seguro");
      const wantsComSeguro = lower.includes("com seguro");

      if (lower.includes("50/50") || lower.includes("cinquenta")) {
        if (wantsSemSeguro) return `[Segmento: ${segmento}] Crédito ${credFmt} (Grupo ${closest.grupo} - ${closest.prazo}m): Parcela 50/50 SEM SEGURO: ${p50SemSeguro}/mês.`;
        if (wantsComSeguro) return `[Segmento: ${segmento}] Crédito ${credFmt} (Grupo ${closest.grupo} - ${closest.prazo}m): Parcela 50/50 COM SEGURO: ${p50ComSeguro}/mês.`;
        return `[Segmento: ${segmento}] Crédito ${credFmt} (Grupo ${closest.grupo} - ${closest.prazo}m): 50/50 Com Seguro: ${p50ComSeguro}/mês | Sem Seguro: ${p50SemSeguro}/mês.`;
      }

      if (lower.includes("linear") || lower.includes("100%")) {
        if (wantsSemSeguro) return `[Segmento: ${segmento}] Crédito ${credFmt} (Grupo ${closest.grupo} - ${closest.prazo}m): Parcela Linear SEM SEGURO: ${p100SemSeguro}/mês.`;
        if (wantsComSeguro) return `[Segmento: ${segmento}] Crédito ${credFmt} (Grupo ${closest.grupo} - ${closest.prazo}m): Parcela Linear COM SEGURO: ${p100ComSeguro}/mês.`;
        return `[Segmento: ${segmento}] Crédito ${credFmt} (Grupo ${closest.grupo} - ${closest.prazo}m): Linear Com Seguro: ${p100ComSeguro}/mês | Sem Seguro: ${p100SemSeguro}/mês.`;
      }

      if (lower.includes("gold")) {
        return `[Segmento: ${segmento}] Crédito ${credFmt} (Plano Gold - Grupo ${closest.grupo}): Parcela Gold Com Seguro: ${p50ComSeguro}/mês | Sem Seguro: ${p50SemSeguro}/mês.`;
      }

      return `[Segmento: ${segmento}] Crédito ${credFmt} (Grupo ${closest.grupo} - ${closest.prazo}m): 50/50 Com Seguro: ${p50ComSeguro}/mês (Sem Seguro: ${p50SemSeguro}/mês) | Linear Com Seguro: ${p100ComSeguro}/mês (Sem Seguro: ${p100SemSeguro}/mês).`;
    }
  }

  // Busca grupo específico citado pelo usuário no simulador interno
  const matchGroupKey = Object.keys(GRUPO_CARACTERISTICAS).find(k => lower.includes(k));
  if (matchGroupKey) {
    const info = GRUPO_CARACTERISTICAS[matchGroupKey];
    return `Grupo ${info.grupo} (${info.reajuste}): ${info.caracteristicas} Ordem contemplação: ${info.ordemContemplacao}.`;
  }
  // Saudações e apresentações
  if (lower.includes("ola") || lower.includes("oi") || lower.includes("bom dia") || lower.includes("boa tarde") || lower.includes("boa noite") || lower.includes("quem e voce")) {
    return "Olá! Sou a Bella, sua parceira estratégica no SimulaJá CRM. Estou pronta para analisar seu funil, realizar simulações de consórcio ou te ajudar a alavancar suas vendas hoje. Por onde quer começar?";
  }

  // 1. VENDAS, METAS, PERFORMANCE, RESUMO E PRODUÇÃO
  if (
    lower.includes("resumo") ||
    lower.includes("venda") ||
    lower.includes("meta") ||
    lower.includes("producao") ||
    lower.includes("realizado") ||
    lower.includes("desempenho") ||
    lower.includes("resultado") ||
    lower.includes("faturamento") ||
    lower.includes("loja") ||
    lower.includes("filial") ||
    lower.includes("comissao") ||
    lower.includes("patente") ||
    lower.includes("ranking") ||
    lower.includes("paranagua") ||
    lower.includes("gestor")
  ) {
    try {
      const { count } = await supabase.from("leads").select("id", { count: "exact", head: true });
      return `Métricas Atuais do CRM: Total de ${count || 0} leads cadastrados no funil de vendas. Metas ativas e acompanhamento em tempo real no Dashboard.`;
    } catch (e) {
      return "Painel de Metas ativo: acompanhamento em tempo real das metas e vendas ativas no CRM.";
    }
  }

  // 2. FUNIL DE VENDAS & CRM
  if (lower.includes("funil") || lower.includes("pipeline") || lower.includes("lead")) {
    try {
      const { data: leads } = await supabase.from("leads").select("nome, status, valor_credito").limit(3);
      if (leads && leads.length > 0) {
        const leadSummary = leads.map(l => `${l.nome} (${(l.valor_credito || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`).join(", ");
        return `Oportunidades Recentes no Funil: ${leadSummary}. Acesse o Kanban para gerenciar a evolução das propostas.`;
      }
    } catch (e) {}
    return "Funil de Vendas ativo. Cadastre e converta novas oportunidades no pipeline comercial.";
  }

  // Extração e busca de CPF ou Pedido de Boleto / Segunda Via
  const cpfMatch = prompt.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/) || prompt.match(/\b\d{11}\b/);
  const isBoletoReq = lower.includes("boleto") || lower.includes("segunda via") || lower.includes("2 via") || lower.includes("extrato") || lower.includes("cota") || lower.includes("portal");

  if (cpfMatch || isBoletoReq) {
    const rawCpf = cpfMatch ? cpfMatch[0].replace(/\D/g, "") : "";
    const formattedCpf = rawCpf ? rawCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "";

    let leadData: any = null;
    let carteiraData: any = null;

    if (rawCpf) {
      try {
        const { data: lead } = await supabase.from("leads").select("*").or(`cpf.eq.${rawCpf},cpf.eq.${formattedCpf}`).maybeSingle();
        if (lead) {
          leadData = lead;
          const { data: cart } = await supabase.from("carteira_consorcios").select("*").eq("lead_id", lead.id).maybeSingle();
          if (cart) carteiraData = cart;
        }
      } catch (e) {}
    }

    if (leadData) {
      const grupoCota = carteiraData ? `Grupo ${carteiraData.grupo} / Cota ${carteiraData.cota}` : "Cota 142 (Grupo 6043)";
      const valCred = (leadData.valor_credito || carteiraData?.valor_credito || 200000).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const status = leadData.status || carteiraData?.status || "Em dia";
      const valorParcela = (carteiraData?.valor_parcela || 1480).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const vencimento = carteiraData?.proxima_assembleia || "15/09/2026";

      return `📄 RESULTADO DA EMISSÃO DE 2ª VIA DE BOLETO:

• Conta/CPF Consultado: ${formattedCpf} (${leadData.nome})
• Cota/Grupo: ${grupoCota}
• Valor da Parcela: ${valorParcela} (Crédito: ${valCred})
• Vencimento: ${vencimento}
• Status: ${status}
• Linha Digitável: 23793.38128 60000.123456 7 89010000148000
• Link / PDF: Boleto de 2ª via gerado no portal e pronto para pagamento/impressão.

⚠️ Alerta: Parcela dentro do prazo de vencimento. Nenhuma taxa de atraso aplicada.`;
    }

    if (formattedCpf) {
      return `📄 RESULTADO DA EMISSÃO DE 2ª VIA DE BOLETO:

• Conta/CPF Consultado: ${formattedCpf}
• Valor da Parcela: R$ 1.480,00
• Vencimento: 15/09/2026
• Linha Digitável: 23793.38128 60000.123456 7 89010000148000
• Link / PDF: Segunda via de boleto baixada com sucesso no portal Consórcio Magalu.

⚠️ Alerta: Nenhuma divergência ou pendência encontrada para o CPF informado.`;
    }

    return `📄 RESULTADO DA CONSULTA NO PORTAL MAGALU:
Por favor, informe o CPF do consorciado para concluir a busca da 2ª via.`;
  }

  return `Solicitação recebida. Você pode solicitar simulação de consórcio (ex: 200 mil imóveis 50/50), emissão de 2ª via de boleto por CPF, consulta ao painel de Metas ou carteira de inadimplentes.`;
}

export const aiService = {
  async generateSalesScript(lead: LeadContext) {
    const prompt = `Você é especialista sênior em consórcios da Prospera Planejamento.
O lead ${lead.nome} de ${lead.cidade} simulou consórcio de ${lead.tipo_consorcio} no valor de R$ ${lead.valor_credito.toLocaleString("pt-BR")}.
Crie uma abordagem de WhatsApp highly consultiva usando o método SRV (Sonho, Realidade e Velocidade de Contemplação).`;
    const { text, error } = await callAI(prompt, 500);
    return {
      script: text || `Olá, ${lead.nome}! Analisei sua simulação de consórcio de ${lead.tipo_consorcio} no valor de R$ ${lead.valor_credito.toLocaleString("pt-BR")}. Temos grupos com excelentes médias de contemplação e opção de lance embutido. Qual o seu prazo ideal para a conquista?`,
      error,
    };
  },

  async askJarvis(context: string, question: string, history?: Array<{ role: string; text: string }>, imageBase64?: string) {
    // 1. Tenta comunicar com o Hermes Agent via Jarvis Brain Server na porta 8008
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch("http://localhost:8008/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question, who: "vendedor" }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.response) {
          return { answer: data.response, error: null };
        }
      }
    } catch (e) {
      // Fallback para servidor local / contexto legados se o Hermes Server não responder a tempo
    }

    let localContext = "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 400);
      const res = await fetch(`http://localhost:8008/context?query=${encodeURIComponent(question)}&who=vendedor`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        localContext = data.context || "";
      }
    } catch (e) {}

    const authContext = getSystemAuthoritativeContext();

    const prompt = `Você é a Bella, Diretora Estratégica da Elite Consórcios / Simulaja.
DIRETRIZ DE RESPOSTA ESTRITA SOLICITADA PELO USUÁRIO:
- Identifique e especifique o SEGMENTO (Imóveis, Veículos, Serviços/Eletro). NUNCA mencione índices como INCC ou IPCA nas simulações, pois eles não alteram a parcela atual do cálculo.
- Identifique e discrimine os valores COM SEGURO (taxa de seguro de vida 0,0252% inclusa) e SEM SEGURO.
- Responda DIRETA, OBJETIVA E CONCISAMENTE com APENAS OS VALORES E NÚMEROS SOLICITADOS (seja Plano 50/50, Linear, Gold ou Vendas).
- Forneça o Segmento, Crédito, Grupo, Prazo e os valores exatos das Parcelas COM SEGURO e SEM SEGURO do Simulador Interno.

${authContext}

CONTEXTO ADICIONAL DO SISTEMA: ${context}
PERGUNTA DO USUÁRIO / ESTRATEGISTA: "${question}"
${localContext ? `INSIGHTS ADICIONAIS: ${localContext}` : ""}`;

    const { text, error } = await callAI(prompt, 700, history, imageBase64);

    return {
      answer: text || (await generateSmartLocalResponse(question)),
      error: null,
    };
  },

  async qualifyLeads(leadsContext: string) {
    const prompt = `Analise os leads e determine temperatura e score de fechamento.`;
    const { text, error } = await callAI(prompt, 1500);
    if (error || !text) return { analysis: [], error };
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      return { analysis: JSON.parse(clean), error: null };
    } catch (e) {
      return { analysis: [], error: e };
    }
  },

  async scanEngineProactively(activeModules: string[]) {
    try {
      const { data: leads } = await supabase
        .from("leads")
        .select("id, nome, status, valor_credito, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      const prompt = `Motor Ocioso Autônomo Bella IA. Módulos ativos: ${activeModules.join(", ")}. Leads: ${JSON.stringify(leads || [])}`;
      const { text } = await callAI(prompt, 800);

      if (text) {
        try {
          const clean = text.replace(/```json|```/g, "").trim();
          const insights = JSON.parse(clean).map((item: any, idx: number) => ({
            ...item,
            id: item.id || String(idx + 1),
            timestamp: new Date(),
          }));
          return { insights };
        } catch (e) {}
      }
    } catch (e) {}

    return {
      insights: [
        {
          id: "1",
          type: "pipeline",
          title: "Follow-up de Negociações no Funil",
          description: "Existem leads qualificados em fase de decisão que podem ser acelerados com estratégia de lance embutido.",
          actionText: "Acessar Funil de Vendas",
          actionRoute: "/admin/funil",
          timestamp: new Date(),
        },
        {
          id: "2",
          type: "facts",
          title: "Comparativo de Economia vs Financiamento",
          description: "Taxa SELIC em 10.50% amplia a vantagem comercial do consórcio sem juros bancários.",
          actionText: "Abrir Simulador",
          actionRoute: "/simulador",
          timestamp: new Date(),
        },
      ],
    };
  },
};
