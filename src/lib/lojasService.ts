import { LojaConfig, INITIAL_LOJAS, STORAGE_KEY_LOJAS } from "@/constants/lojas";
import { isVendaRealizadaNoMes, formatCurrency } from "./utils";

export type TimeFrame = "dia" | "semana" | "quinzena" | "mes";

export interface LojaPerformance {
  loja: LojaConfig;
  realizado: number;
  metaPeriodo: number;
  metaMensal: number;
  atingimentoPeriodo: number;
  atingimentoMensal: number;
  faltanteMensal: number;
  superavitMensal: number;
  totalLeads: number;
  closedLeadsCount: number;
  ticketMedio: number;
  projecaoMes: number;
  posicao: number;
  statusMeta: "superada" | "excelente" | "atencao" | "critico";
  // Métricas de Indicações e Análise de Conversão
  totalIndicacoes: number;
  closedIndicacoesCount: number;
  realizadoIndicacoes: number;
  taxaConversaoGeral: number;
  taxaConversaoIndicacoes: number;
  taxaConversaoOutros: number;
  percentualVolumeIndicacao: number;
}

export function getLojasConfig(): LojaConfig[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOJAS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Erro ao carregar configurações das lojas:", err);
  }
  return INITIAL_LOJAS;
}

export function saveLojasConfig(lojas: LojaConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOJAS, JSON.stringify(lojas));
  } catch (err) {
    console.error("Erro ao salvar configurações das lojas:", err);
  }
}

export function normalizeStr(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function matchLeadToLoja(lead: any, lojas: LojaConfig[]): LojaConfig | null {
  const dc = lead.dados_cadastro || {};
  
  // 1. Verificação direta por código de filial no dados_cadastro
  const codDirect = dc.filial_codigo || dc.codigo_filial || dc.filial_id || dc.loja_id || dc.unidade_id;
  if (codDirect) {
    const matched = lojas.find(l => l.codigo === String(codDirect) || l.id === String(codDirect));
    if (matched) return matched;
  }

  // 2. Verificação por nome de filial ou loja em dados_cadastro ou origem
  const textFields = [
    dc.filial,
    dc.loja,
    dc.unidade,
    lead.origem,
    lead.cidade,
    dc.cidade
  ].filter(Boolean).map(s => normalizeStr(String(s)));

  for (const loja of lojas) {
    const code = loja.codigo;
    const city = normalizeStr(loja.cidade);
    
    for (const text of textFields) {
      if (text.includes(code) || text.includes(city)) {
        return loja;
      }
    }
  }

  return null;
}

export function isLeadIndicacao(lead: any): boolean {
  if (!lead) return false;
  const dc = lead.dados_cadastro || {};
  const temIndicadorCampos = Boolean(
    (lead.indicador_nome && lead.indicador_nome.trim().length > 0) || 
    (lead.indicador_celular && lead.indicador_celular.trim().length > 0) || 
    (dc.indicador_nome && String(dc.indicador_nome).trim().length > 0) || 
    (dc.indicador && String(dc.indicador).trim().length > 0) || 
    (dc.indicador_celular && String(dc.indicador_celular).trim().length > 0)
  );
  
  const origemStr = (lead.origem || dc.origem || "").toLowerCase();
  const eOrigemIndicacao = origemStr.includes("indica") || origemStr === "loja" || origemStr === "parceiro";
  
  return temIndicadorCampos || eOrigemIndicacao;
}

export function isLeadInTimeFrame(lead: any, timeFrame: TimeFrame): boolean {
  const dateStr = lead.status_updated_at || lead.created_at || lead.updated_at;
  if (!dateStr) return false;

  const leadDate = new Date(dateStr);
  const now = new Date();

  if (isNaN(leadDate.getTime())) return false;

  switch (timeFrame) {
    case "dia": {
      const todayStr = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      const leadDateStr = leadDate.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      return todayStr === leadDateStr;
    }
    case "semana": {
      const diffTime = Math.abs(now.getTime() - leadDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    case "quinzena": {
      const diffTime = Math.abs(now.getTime() - leadDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 15;
    }
    case "mes": {
      const currentMonthStr = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).substring(0, 7);
      return isVendaRealizadaNoMes(lead, currentMonthStr);
    }
    default:
      return true;
  }
}

export function calculateLojasPerformance(
  leads: any[],
  lojas: LojaConfig[],
  timeFrame: TimeFrame = "mes"
): {
  lojasMetrics: LojaPerformance[];
  metaGlobalMensal: number;
  metaGlobalPeriodo: number;
  realizadoGlobalPeriodo: number;
  realizadoGlobalMensal: number;
  atingimentoGlobalMensal: number;
  atingimentoGlobalPeriodo: number;
  lojaDestaque: LojaPerformance | null;
  totalIndicacoesGlobal: number;
  closedIndicacoesGlobal: number;
  realizadoIndicacoesGlobal: number;
  taxaConversaoGlobalIndicacoes: number;
  taxaConversaoGlobalGeral: number;
} {
  const now = new Date();
  const currentDay = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  let periodFactor = 1;
  if (timeFrame === "dia") periodFactor = 1 / daysInMonth;
  else if (timeFrame === "semana") periodFactor = 7 / daysInMonth;
  else if (timeFrame === "quinzena") periodFactor = 15 / daysInMonth;

  const leadsComLoja = leads.map(l => {
    const lojaMatched = matchLeadToLoja(l, lojas);
    return { lead: l, lojaId: lojaMatched?.id || null };
  });

  const temTagExplicit = leadsComLoja.some(item => item.lojaId !== null);

  const rawMetrics: Omit<LojaPerformance, "posicao" | "statusMeta">[] = lojas.map((loja, idx) => {
    const storeLeads = leads.filter((l, lIdx) => {
      const matched = matchLeadToLoja(l, lojas);
      if (matched) return matched.id === loja.id;
      if (!temTagExplicit) {
        return lIdx % lojas.length === idx;
      }
      return false;
    });

    const leadsFechadosPeriodo = storeLeads.filter(l => {
      const status = (l.status || "").toLowerCase().replace("_", " ");
      const isClosed = status === "fechado" || status === "venda fechada";
      return isClosed && isLeadInTimeFrame(l, timeFrame);
    });

    const currentMonthStr = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).substring(0, 7);
    const leadsFechadosMes = storeLeads.filter(l => isVendaRealizadaNoMes(l, currentMonthStr));

    const realizadoPeriodo = leadsFechadosPeriodo.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
    const realizadoMensal = leadsFechadosMes.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

    const realizadoUsado = timeFrame === "mes" ? realizadoMensal : realizadoPeriodo;
    const leadsFechadosUsados = timeFrame === "mes" ? leadsFechadosMes : leadsFechadosPeriodo;

    const metaPeriodo = Math.round(loja.metaMensal * periodFactor);
    const atingimentoPeriodo = metaPeriodo > 0 ? (realizadoUsado / metaPeriodo) * 100 : 0;
    const atingimentoMensal = loja.metaMensal > 0 ? (realizadoMensal / loja.metaMensal) * 100 : 0;

    const faltanteMensal = Math.max(0, loja.metaMensal - realizadoMensal);
    const superavitMensal = Math.max(0, realizadoMensal - loja.metaMensal);

    const closedLeadsCount = leadsFechadosUsados.length;
    const ticketMedio = closedLeadsCount > 0 ? realizadoUsado / closedLeadsCount : 0;

    const ritmoDiario = realizadoMensal / currentDay;
    const projecaoMes = Math.round(ritmoDiario * daysInMonth);

    // INDICAÇÕES E ANÁLISE DE CONVERSÃO
    const indicacoesLeads = storeLeads.filter(isLeadIndicacao);
    const totalIndicacoes = indicacoesLeads.length;

    const closedIndicacoesLeads = leadsFechadosUsados.filter(isLeadIndicacao);
    const closedIndicacoesCount = closedIndicacoesLeads.length;
    const realizadoIndicacoes = closedIndicacoesLeads.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

    const taxaConversaoGeral = storeLeads.length > 0 ? (closedLeadsCount / storeLeads.length) * 100 : 0;
    const taxaConversaoIndicacoes = totalIndicacoes > 0 ? (closedIndicacoesCount / totalIndicacoes) * 100 : 0;
    
    const otherLeadsCount = Math.max(0, storeLeads.length - totalIndicacoes);
    const closedOtherLeadsCount = Math.max(0, closedLeadsCount - closedIndicacoesCount);
    const taxaConversaoOutros = otherLeadsCount > 0 ? (closedOtherLeadsCount / otherLeadsCount) * 100 : 0;

    const percentualVolumeIndicacao = realizadoUsado > 0 ? (realizadoIndicacoes / realizadoUsado) * 100 : 0;

    return {
      loja,
      realizado: realizadoUsado,
      metaPeriodo,
      metaMensal: loja.metaMensal,
      atingimentoPeriodo,
      atingimentoMensal,
      faltanteMensal,
      superavitMensal,
      totalLeads: storeLeads.length,
      closedLeadsCount,
      ticketMedio,
      projecaoMes,
      totalIndicacoes,
      closedIndicacoesCount,
      realizadoIndicacoes,
      taxaConversaoGeral,
      taxaConversaoIndicacoes,
      taxaConversaoOutros,
      percentualVolumeIndicacao
    };
  });

  const sorted = [...rawMetrics].sort((a, b) => b.realizado - a.realizado);

  const lojasMetrics: LojaPerformance[] = rawMetrics.map(m => {
    const pos = sorted.findIndex(s => s.loja.id === m.loja.id) + 1;
    let statusMeta: "superada" | "excelente" | "atencao" | "critico" = "atencao";
    
    if (m.atingimentoMensal >= 100) statusMeta = "superada";
    else if (m.atingimentoMensal >= 75) statusMeta = "excelente";
    else if (m.atingimentoMensal >= 40) statusMeta = "atencao";
    else statusMeta = "critico";

    return {
      ...m,
      posicao: pos,
      statusMeta
    };
  });

  const metaGlobalMensal = lojas.reduce((acc, l) => acc + l.metaMensal, 0);
  const metaGlobalPeriodo = Math.round(metaGlobalMensal * periodFactor);
  const realizadoGlobalMensal = lojasMetrics.reduce((acc, l) => acc + l.realizado, 0);
  const realizadoGlobalPeriodo = lojasMetrics.reduce((acc, l) => acc + l.realizado, 0);

  const atingimentoGlobalMensal = metaGlobalMensal > 0 ? (realizadoGlobalMensal / metaGlobalMensal) * 100 : 0;
  const atingimentoGlobalPeriodo = metaGlobalPeriodo > 0 ? (realizadoGlobalPeriodo / metaGlobalPeriodo) * 100 : 0;

  const lojaDestaque = [...lojasMetrics].sort((a, b) => b.atingimentoMensal - a.atingimentoMensal)[0] || null;

  const totalIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.totalIndicacoes, 0);
  const closedIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.closedIndicacoesCount, 0);
  const realizadoIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.realizadoIndicacoes, 0);
  
  const totalLeadsGlobal = leads.length;
  const totalClosedGlobal = lojasMetrics.reduce((acc, l) => acc + l.closedLeadsCount, 0);

  const taxaConversaoGlobalIndicacoes = totalIndicacoesGlobal > 0 ? (closedIndicacoesGlobal / totalIndicacoesGlobal) * 100 : 0;
  const taxaConversaoGlobalGeral = totalLeadsGlobal > 0 ? (totalClosedGlobal / totalLeadsGlobal) * 100 : 0;

  return {
    lojasMetrics,
    metaGlobalMensal,
    metaGlobalPeriodo,
    realizadoGlobalPeriodo,
    realizadoGlobalMensal,
    atingimentoGlobalMensal,
    atingimentoGlobalPeriodo,
    lojaDestaque,
    totalIndicacoesGlobal,
    closedIndicacoesGlobal,
    realizadoIndicacoesGlobal,
    taxaConversaoGlobalIndicacoes,
    taxaConversaoGlobalGeral
  };
}

export function getTimeFrameLabel(timeFrame: TimeFrame): string {
  switch (timeFrame) {
    case "dia": return "DO DIA (Hoje)";
    case "semana": return "DA SEMANA (7 dias)";
    case "quinzena": return "DA QUINZENA (15 dias)";
    case "mes": return "DO MÊS (Agosto/2026)";
  }
}

export function generateWhatsAppManagerReport(
  lojasMetrics: LojaPerformance[],
  timeFrame: TimeFrame,
  metaGlobal: number,
  realizadoGlobal: number,
  selectedLojaId: string = "all"
): string {
  const timeLabel = getTimeFrameLabel(timeFrame);
  const dateFormatted = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  if (selectedLojaId !== "all") {
    const item = lojasMetrics.find(m => m.loja.id === selectedLojaId);
    if (!item) return "";

    const percentText = item.atingimentoMensal.toFixed(1);
    const emojiStatus = item.atingimentoMensal >= 100 ? "🏆 META SUPERADA!" : item.atingimentoMensal >= 80 ? "🚀 EXCELENTE RITMO!" : "⚡ FOCO NA META!";

    return `📊 *RELATÓRIO DE DESEMPENHO E CONVERSÃO DE UNIDADE* 🏬
🏢 *${item.loja.nome}*
📅 *Período:* ${timeLabel} (${dateFormatted})
👤 *Gerente:* ${item.loja.gerente || "Gerência Local"}

----------------------------------------
🎯 *Meta Mensal:* ${formatCurrency(item.metaMensal)}
🎯 *Meta Apropriada (${timeFrame.toUpperCase()}):* ${formatCurrency(item.metaPeriodo)}
💰 *Vendas Realizadas:* ${formatCurrency(item.realizado)}
📈 *Atingimento da Meta:* ${percentText}% ${emojiStatus}
${item.faltanteMensal > 0 ? `🔻 *Faltante para Meta:* ${formatCurrency(item.faltanteMensal)}` : `🎉 *Superávit de Vendas:* ${formatCurrency(item.superavitMensal)}`}

🤝 *ANÁLISE DE INDICAÇÕES DA LOJA:*
📩 *Indicações Recebidas:* ${item.totalIndicacoes} cadastros
✅ *Indicações Convertidas em Venda:* ${item.closedIndicacoesCount} contratos
🔥 *Taxa de Conversão das Indicações:* *${item.taxaConversaoIndicacoes.toFixed(1)}%*
💰 *Volume Vendido via Indicação:* ${formatCurrency(item.realizadoIndicacoes)} (${item.percentualVolumeIndicacao.toFixed(1)}% do volume total)

📊 *INDICADORES DE EFICIÊNCIA & CONVERSÃO:*
🤝 *Total Contratos Fechados:* ${item.closedLeadsCount} vendas
🎯 *Total Leads / Oportunidades:* ${item.totalLeads} atendimentos
⚡ *Taxa de Conversão Geral da Loja:* *${item.taxaConversaoGeral.toFixed(1)}%*
💡 *Ticket Médio da Loja:* ${formatCurrency(item.ticketMedio)}
🔮 *Projeção de Fechamento Mês:* ${formatCurrency(item.projecaoMes)}
🥇 *Posição no Ranking Geral:* ${item.posicao}º lugar das 5 Lojas

💪 _"Cliente indicado é venda com maior taxa de fechamento. Estimule indicações com a equipe e parceiros!"_
📱 *Gerado via SimulaJá CRM Magalu*`;
  }

  // Visão Geral Consolidada das 5 Lojas
  const atingimentoGlobal = metaGlobal > 0 ? (realizadoGlobal / metaGlobal) * 100 : 0;
  const faltanteGlobal = Math.max(0, metaGlobal - realizadoGlobal);
  const sortedByRank = [...lojasMetrics].sort((a, b) => a.posicao - b.posicao);

  const totalIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.totalIndicacoes, 0);
  const closedIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.closedIndicacoesCount, 0);
  const realizadoIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.realizadoIndicacoes, 0);
  const taxaConversaoIndicacoesGlobal = totalIndicacoesGlobal > 0 ? (closedIndicacoesGlobal / totalIndicacoesGlobal) * 100 : 0;

  let lojaTextList = "";
  sortedByRank.forEach(item => {
    const trophy = item.posicao === 1 ? "🥇" : item.posicao === 2 ? "🥈" : item.posicao === 3 ? "🥉" : "🏬";
    lojaTextList += `
${trophy} *${item.loja.nome}*
   • Vendas: *${formatCurrency(item.realizado)}* (${item.atingimentoMensal.toFixed(1)}% da Meta)
   • Indicações: ${item.totalIndicacoes} rec. | ${item.closedIndicacoesCount} fechadas (*${item.taxaConversaoIndicacoes.toFixed(1)}% conv.*)
   • Vol. Indicações: ${formatCurrency(item.realizadoIndicacoes)}
   • Conversão Geral Loja: ${item.taxaConversaoGeral.toFixed(1)}% | Ticket Médio: ${formatCurrency(item.ticketMedio)}
`;
  });

  return `📊 *RELATÓRIO CONSOLIDADO MULTI-LOJAS & INDICAÇÕES MAGALU* 🚀
📅 *Período de Análise:* ${timeLabel} (${dateFormatted})
🏢 *Total de Unidades Acompanhadas:* 5 Lojas

========================================
🎯 *META GLOBAL CONSOLIDADA:* ${formatCurrency(metaGlobal)}
💰 *REALIZADO GLOBAL:* ${formatCurrency(realizadoGlobal)}
📈 *ATINGIMENTO GLOBAL:* *${atingimentoGlobal.toFixed(1)}%*
${faltanteGlobal > 0 ? `🔻 *FALTANTE PARA META GLOBAL:* ${formatCurrency(faltanteGlobal)}` : `🎉 *SUPERÁVIT GLOBAL:* ${formatCurrency(Math.abs(realizadoGlobal - metaGlobal))}`}

🤝 *PAINEL CONSOLIDADO DE INDICAÇÕES:*
📩 *Total Indicações Recebidas:* ${totalIndicacoesGlobal} cadastros
✅ *Indicações Fechadas:* ${closedIndicacoesGlobal} contratos
📈 *Taxa de Conversão de Indicações:* *${taxaConversaoIndicacoesGlobal.toFixed(1)}%*
💰 *Volume Bruto via Indicações:* ${formatCurrency(realizadoIndicacoesGlobal)}
========================================

🏆 *RANKING & CONVERSÃO POR FILIAL:*
${lojaTextList}
----------------------------------------
📌 *Diretrizes Estratégicas para Gerentes:*
1. Priorizar o atendimento às Indicações (conversão de ${taxaConversaoIndicacoesGlobal.toFixed(1)}% vs média de mercado).
2. Promover a campanha de indicação em loja física com vendedores parceiros.
3. Fazer reuniões matinais focando nos leads quentes e indicações do dia.

🔥 *SIMULAJÁ CRM - GESTÃO MULTI-LOJA MAGALU*`;
}
