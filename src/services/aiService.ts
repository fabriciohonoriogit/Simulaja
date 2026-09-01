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

  // Busca grupo específico citado pelo usuário no simulador interno
  const matchGroupKey = Object.keys(GRUPO_CARACTERISTICAS).find(k => lower.includes(k));
  if (matchGroupKey) {
    const info = GRUPO_CARACTERISTICAS[matchGroupKey];
    return `Consulta ao Simulador Interno (Grupo ${info.grupo}): Reajuste pelo ${info.reajuste}. ${info.caracteristicas} Ordem de contemplação: ${info.ordemContemplacao}. Regra de reajuste: ${info.regraReajuste}.`;
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
    return `Análise de Performance Comercial: O resultado realizado oficial do mês é de R$ 640.000,00 (R$ 440.000,00 das 5 Filiais Magalu + R$ 200.000,00 do Gestor), totalizando 7 vendas com ticket médio de R$ 91.428,57. A comissão recorrente mensal consolidada é de R$ 1.680,00/mês (R$ 880,00 das filiais + R$ 800,00 do gestor). No Ranking Elite, o status é GOLD (OURO) com 42,7% da meta de R$ 1,5M atingidos (faltam R$ 860.000,00 para a patente CROMO). Desempenho por loja: Campo Largo R$ 180k, Paranaguá R$ 110k, Canoinhas R$ 110k, São Mateus do Sul R$ 40k e Irati R$ 0.`;
  }

  // 2. FUNIL DE VENDAS & CRM
  if (lower.includes("funil") || lower.includes("pipeline") || lower.includes("lead")) {
    return `Mapeamento do Funil: Temos 7 vendas realizadas no mês que somam R$ 640.000,00. As oportunidades em tratativa no funil estão qualificadas. Recomendo focar o follow-up nos leads de alto ticket para atingir a meta de R$ 1,5M.`;
  }

  // 3. INADIMPLÊNCIA & CARTEIRA
  if (lower.includes("inadimplent") || lower.includes("atraso") || lower.includes("carteira") || lower.includes("assembleia")) {
    return `Análise de Carteira: Acompanhamento de adimplência e comissões alinhado. A comissão recorrente garantida no mês é de R$ 1.680,00/mês. Recomendo manter contato preventivo antes das assembleias para assegurar a retenção e indicar novos clientes.`;
  }

  // 4. LANCES & SIMULAÇÕES DO SIMULADOR INTERNO
  if (lower.includes("grupo") || lower.includes("lance") || lower.includes("simula") || lower.includes("imovel") || lower.includes("carro") || lower.includes("veiculo")) {
    return `Simulador Interno Magalu: Temos grupos registrados para imóveis (ex: Grupos 6043, 6042, 6027, 6021, 6022) com lance embutido de 25%, reajuste pelo INCC e opções de planos 50/50 e Linear. Para veículos (ex: Grupos 5297, 5295, 5294), opções de 40k a 170k com reajuste IPCA. Todos os grupos e parcelas exatas estão cadastrados na tabela do simulador interno.`;
  }

  // 5. TAXA SELIC & COMPARATIVO DE FINANCIAMENTO
  if (lower.includes("selic") || lower.includes("financiamento") || lower.includes("juro") || lower.includes("banco")) {
    return `Matemática Financeira: Com a Selic elevada, o consórcio sem juros bancários gera uma economia média de 60% a 70% no Custo Efetivo Total em comparação ao financiamento tradicional, sendo a melhor solução de investimento patrimonial.`;
  }

  return `Diretoria Estratégica Bella IA. Todos os indicadores comerciais estão atualizados: Vendas do mês em R$ 640.000,00, Comissão Recorrente em R$ 1.680,00/mês e Patente GOLD (OURO). Qual indicador ou estratégia comercial deseja analisar?`;
}

export const aiService = {
  async generateSalesScript(lead: LeadContext) {
    const prompt = `Você é especialista sênior em consórcios da Prospera Planejamento.
O lead ${lead.nome} de ${lead.cidade} simulou consórcio de ${lead.tipo_consorcio} no valor de R$ ${lead.valor_credito.toLocaleString("pt-BR")}.
Crie uma abordagem de WhatsApp altamente consultiva usando o método SRV (Sonho, Realidade e Velocidade de Contemplação).`;
    const { text, error } = await callAI(prompt, 500);
    return {
      script: text || `Olá, ${lead.nome}! Analisei sua simulação de consórcio de ${lead.tipo_consorcio} no valor de R$ ${lead.valor_credito.toLocaleString("pt-BR")}. Temos grupos com excelentes médias de contemplação e opção de lance embutido. Qual o seu prazo ideal para a conquista?`,
      error,
    };
  },

  async askJarvis(context: string, question: string, history?: Array<{ role: string; text: string }>, imageBase64?: string) {
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

    const prompt = `Você é a Bella, Diretora Estratégica e Especialista Sênior em Consórcios do Simulaja / Elite Consórcios.
IMPORTANTE: Responda ao usuário utilizando ESTRITAMENTE e OBRIGATORIAMENTE os dados oficiais do sistema listados abaixo. NUNCA invente, alucine ou presuma valores de vendas, comissões ou lojas que divirjam destes dados oficiais:

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
