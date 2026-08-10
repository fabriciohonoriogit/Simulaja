import { LojaConfig, INITIAL_LOJAS, STORAGE_KEY_LOJAS, COORDENADOR_REGIONAL } from "@/constants/lojas";
import { isVendaRealizadaNoMes, formatCurrency } from "./utils";

export type TimeFrame = "dia" | "semana" | "quinzena" | "mes" | "personalizado";

export interface CustomDateRange {
  startDate?: string; // formato "YYYY-MM-DD"
  endDate?: string;   // formato "YYYY-MM-DD"
}

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
  indicacoesLeadsList: any[]; // Lista detalhada de leads com indicação para auditoria
}

export function getLojasStorageKey(organizacaoId?: string | null): string {
  if (!organizacaoId) return STORAGE_KEY_LOJAS;
  return `${STORAGE_KEY_LOJAS}_${organizacaoId}`;
}

export function getLojasConfig(organizacaoId?: string | null): LojaConfig[] {
  try {
    const key = getLojasStorageKey(organizacaoId);
    const saved = localStorage.getItem(key);
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

export function saveLojasConfig(lojas: LojaConfig[], organizacaoId?: string | null): void {
  try {
    const key = getLojasStorageKey(organizacaoId);
    localStorage.setItem(key, JSON.stringify(lojas));
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

export function isDateInCustomRange(dateStr: string | null | undefined, startDate?: string, endDate?: string): boolean {
  if (!dateStr) return false;
  const leadDateStr = String(dateStr).substring(0, 10);
  if (startDate && leadDateStr < startDate) return false;
  if (endDate && leadDateStr > endDate) return false;
  return true;
}

/**
 * Associa um lead à loja com base no código de filial ou nome da cidade.
 */
export function matchLeadToLoja(lead: any, lojas: LojaConfig[]): LojaConfig | null {
  if (!lead) return null;
  const dc = lead.dados_cadastro || {};
  
  // 1. Verificação por código de filial no dados_cadastro
  const codDirect = String(dc.filial_codigo || dc.codigo_filial || dc.filial_id || dc.loja_id || dc.unidade_id || "").trim();
  if (codDirect) {
    const matched = lojas.find(l => l.codigo === codDirect || l.id === codDirect);
    if (matched) return matched;
  }

  // 2. Verificação estrita por nome de cidade ou filial
  const cityStr = normalizeStr(lead.cidade || dc.cidade || "");
  const filialStr = normalizeStr(dc.filial_nome || dc.filial || dc.loja || dc.unidade || "");

  for (const loja of lojas) {
    const code = loja.codigo;
    const city = normalizeStr(loja.cidade);
    
    if (cityStr && (cityStr.includes(city) || city.includes(cityStr))) {
      return loja;
    }
    if (filialStr && (filialStr.includes(city) || filialStr.includes(code))) {
      return loja;
    }
  }

  return null;
}

/**
 * Identifica estritamente se o lead veio como INDICAÇÃO (possui indicador ou origem de indicação).
 * NOTA: Indicação NÃO é venda por padrão. É a origem do lead!
 */
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
  
  const origemStr = (lead.origem || dc.origem || "").toLowerCase().trim();
  const eOrigemIndicacao = origemStr.includes("indica") || origemStr === "parceiro";
  
  return temIndicadorCampos || eOrigemIndicacao;
}

/**
 * Verifica se o lead foi CRIADO dentro do período selecionado (Dia, Semana, Quinzena, Mês ou Personalizado).
 */
export function isLeadCreatedInTimeFrame(lead: any, timeFrame: TimeFrame, customRange?: CustomDateRange): boolean {
  if (!lead) return false;
  const dateStr = lead.created_at || lead.status_updated_at || lead.updated_at;
  if (!dateStr) return false;

  if (timeFrame === "personalizado") {
    return isDateInCustomRange(dateStr, customRange?.startDate, customRange?.endDate);
  }

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
      const leadMonthStr = leadDate.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).substring(0, 7);
      return leadMonthStr === currentMonthStr;
    }
    default:
      return true;
  }
}

/**
 * Verifica se a venda realizada ocorreu dentro da janela de tempo selecionada (ou intervalo personalizado).
 */
export function isLeadInTimeFrame(lead: any, timeFrame: TimeFrame, customRange?: CustomDateRange): boolean {
  if (!lead) return false;

  if (timeFrame === "personalizado") {
    const saleDate = lead.dados_cadastro?.data_venda || lead.dados_cadastro?.data_fechamento || lead.status_updated_at || lead.created_at;
    return isDateInCustomRange(saleDate, customRange?.startDate, customRange?.endDate);
  }

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

/**
 * Calcula o desempenho real das 5 lojas.
 * VENDA REALIZADA considera ESTRITAMENTE leads com status 'venda_fechada' ou 'fechado' no funil.
 * INDICAÇÕES considera ESTRITAMENTE leads criados no período/intervalo selecionado.
 */
export function calculateLojasPerformance(
  leads: any[],
  lojas: LojaConfig[],
  timeFrame: TimeFrame = "mes",
  customRange?: CustomDateRange
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
  else if (timeFrame === "personalizado" && customRange?.startDate && customRange?.endDate) {
    const s = new Date(customRange.startDate + "T00:00:00");
    const e = new Date(customRange.endDate + "T23:59:59");
    const diffMs = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    periodFactor = diffDays / daysInMonth;
  }

  const currentMonthStr = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).substring(0, 7);

  const rawMetrics: Omit<LojaPerformance, "posicao" | "statusMeta">[] = lojas.map((loja) => {
    // Leads associados a esta loja
    const storeLeads = leads.filter(l => {
      const matched = matchLeadToLoja(l, lojas);
      return matched ? matched.id === loja.id : false;
    });

    // Leads desta loja criados no período selecionado
    const storeLeadsNoPeriodo = storeLeads.filter(l => isLeadCreatedInTimeFrame(l, timeFrame, customRange));

    // LEADS COM VENDA FECHADA NO FUNIL
    const leadsFechadosPeriodo = storeLeads.filter(l => {
      const status = (l.status || "").toLowerCase().replace("_", " ").trim();
      const isClosed = status === "fechado" || status === "venda fechada" || status === "venda_fechada";
      const isShadow = (l as any).origem === "carteira_shadow";
      return isClosed && !isShadow && isLeadInTimeFrame(l, timeFrame, customRange);
    });

    const leadsFechadosMes = storeLeads.filter(l => {
      const status = (l.status || "").toLowerCase().replace("_", " ").trim();
      const isClosed = status === "fechado" || status === "venda fechada" || status === "venda_fechada";
      const isShadow = (l as any).origem === "carteira_shadow";
      return isClosed && !isShadow && isVendaRealizadaNoMes(l, currentMonthStr);
    });

    const realizadoPeriodo = leadsFechadosPeriodo.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
    const realizadoMensal = leadsFechadosMes.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

    const realizadoUsado = (timeFrame === "mes" || timeFrame === "personalizado") ? realizadoPeriodo : realizadoPeriodo;
    const leadsFechadosUsados = leadsFechadosPeriodo;

    const metaPeriodo = Math.round(loja.metaMensal * periodFactor);
    const atingimentoPeriodo = metaPeriodo > 0 ? (realizadoUsado / metaPeriodo) * 100 : 0;
    const atingimentoMensal = loja.metaMensal > 0 ? (realizadoMensal / loja.metaMensal) * 100 : 0;

    const faltanteMensal = Math.max(0, loja.metaMensal - realizadoMensal);
    const superavitMensal = Math.max(0, realizadoMensal - loja.metaMensal);

    const closedLeadsCount = leadsFechadosUsados.length;
    const ticketMedio = closedLeadsCount > 0 ? realizadoUsado / closedLeadsCount : 0;

    const ritmoDiario = realizadoMensal / currentDay;
    const projecaoMes = Math.round(ritmoDiario * daysInMonth);

    // INDICAÇÕES E ANÁLISE DE CONVERSÃO NO PERÍODO SELECIONADO
    const indicacoesLeadsList = storeLeadsNoPeriodo.filter(isLeadIndicacao);
    const totalIndicacoes = indicacoesLeadsList.length;

    // Vendas oriundas de INDICAÇÃO que foram fechadas no período
    const closedIndicacoesLeads = leadsFechadosUsados.filter(isLeadIndicacao);
    const closedIndicacoesCount = closedIndicacoesLeads.length;
    const realizadoIndicacoes = closedIndicacoesLeads.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

    const totalLeadsPeriodo = storeLeadsNoPeriodo.length;
    const taxaConversaoGeral = totalLeadsPeriodo > 0 ? (closedLeadsCount / totalLeadsPeriodo) * 100 : 0;
    const taxaConversaoIndicacoes = totalIndicacoes > 0 ? (closedIndicacoesCount / totalIndicacoes) * 100 : 0;
    
    const otherLeadsCount = Math.max(0, totalLeadsPeriodo - totalIndicacoes);
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
      totalLeads: totalLeadsPeriodo,
      closedLeadsCount,
      ticketMedio,
      projecaoMes,
      totalIndicacoes,
      closedIndicacoesCount,
      realizadoIndicacoes,
      taxaConversaoGeral,
      taxaConversaoIndicacoes,
      taxaConversaoOutros,
      percentualVolumeIndicacao,
      indicacoesLeadsList
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

export function getTimeFrameLabel(timeFrame: TimeFrame, customRange?: CustomDateRange): string {
  switch (timeFrame) {
    case "dia": return "DO DIA (Hoje)";
    case "semana": return "DA SEMANA (7 dias)";
    case "quinzena": return "DA QUINZENA (15 dias)";
    case "mes": return "DO MÊS (Agosto/2026)";
    case "personalizado": {
      const formatDate = (dStr?: string) => {
        if (!dStr) return "";
        const parts = dStr.split("-");
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dStr;
      };
      const start = formatDate(customRange?.startDate) || "Início";
      const end = formatDate(customRange?.endDate) || "Hoje";
      return `PERÍODO PERSONALIZADO (${start} até ${end})`;
    }
  }
}

export function generateWhatsAppManagerReport(
  lojasMetrics: LojaPerformance[],
  timeFrame: TimeFrame,
  metaGlobal: number,
  realizadoGlobal: number,
  selectedLojaId: string = "all",
  customRange?: CustomDateRange
): string {
  const timeLabel = getTimeFrameLabel(timeFrame, customRange);
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
💰 *Vendas Fechadas:* ${formatCurrency(item.realizado)}
📈 *Atingimento da Meta:* ${percentText}% ${emojiStatus}
${item.faltanteMensal > 0 ? `🔻 *Faltante para Meta:* ${formatCurrency(item.faltanteMensal)}` : `🎉 *Superávit de Vendas:* ${formatCurrency(item.superavitMensal)}`}

🤝 *ANÁLISE DE INDICAÇÕES DA LOJA (PERÍODO):*
📩 *Indicações Recebidas no Período:* ${item.totalIndicacoes} cadastros
✅ *Vendas Fechadas via Indicação:* ${item.closedIndicacoesCount} contratos
🔥 *Taxa de Conversão de Indicações:* *${item.taxaConversaoIndicacoes.toFixed(1)}%*
💰 *Volume Vendido via Indicação:* ${formatCurrency(item.realizadoIndicacoes)} (${item.percentualVolumeIndicacao.toFixed(1)}% do total fechado)

📊 *INDICADORES DE FUNIL & CONVERSÃO:*
🤝 *Total Contratos Fechados no Funil:* ${item.closedLeadsCount} vendas
🎯 *Total Leads da Unidade no Período:* ${item.totalLeads} atendimentos
⚡ *Taxa de Conversão Geral da Loja:* *${item.taxaConversaoGeral.toFixed(1)}%*
💡 *Ticket Médio da Loja:* ${formatCurrency(item.ticketMedio)}
🔮 *Projeção de Fechamento Mês:* ${formatCurrency(item.projecaoMes)}
🥇 *Posição no Ranking Geral:* ${item.posicao}º lugar das 5 Lojas

💪 _"Venda realizada no funil é resultado de acompanhamento e alta conversão. Vamos pra cima!"_
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
   • Vendas Fechadas: *${formatCurrency(item.realizado)}* (${item.atingimentoMensal.toFixed(1)}% da Meta)
   • Indicações no Período: ${item.totalIndicacoes} rec. | ${item.closedIndicacoesCount} fechadas (*${item.taxaConversaoIndicacoes.toFixed(1)}% conv.*)
   • Vol. Indicações Fechadas: ${formatCurrency(item.realizadoIndicacoes)}
   • Conversão Geral Loja: ${item.taxaConversaoGeral.toFixed(1)}% | Ticket Médio: ${formatCurrency(item.ticketMedio)}
`;
  });

  return `📊 *RELATÓRIO CONSOLIDADO MULTI-LOJAS & INDICAÇÕES MAGALU* 🚀
📅 *Período de Análise:* ${timeLabel} (${dateFormatted})
🏢 *Total de Unidades Acompanhadas:* 5 Lojas

========================================
🎯 *META GLOBAL CONSOLIDADA:* ${formatCurrency(metaGlobal)}
💰 *VENDAS FECHADAS GLOBAL:* ${formatCurrency(realizadoGlobal)}
📈 *ATINGIMENTO GLOBAL:* *${atingimentoGlobal.toFixed(1)}%*
${faltanteGlobal > 0 ? `🔻 *FALTANTE PARA META GLOBAL:* ${formatCurrency(faltanteGlobal)}` : `🎉 *SUPERÁVIT GLOBAL:* ${formatCurrency(Math.abs(realizadoGlobal - metaGlobal))}`}

🤝 *PAINEL CONSOLIDADO DE INDICAÇÕES:*
📩 *Total Indicações Recebidas no Período:* ${totalIndicacoesGlobal} cadastros
✅ *Vendas Fechadas via Indicação:* ${closedIndicacoesGlobal} contratos
📈 *Taxa de Conversão de Indicações:* *${taxaConversaoIndicacoesGlobal.toFixed(1)}%*
💰 *Volume Fechado via Indicações:* ${formatCurrency(realizadoIndicacoesGlobal)}
========================================

🏆 *RANKING & CONVERSÃO POR FILIAL:*
${lojaTextList}
----------------------------------------
📌 *Diretrizes Estratégicas para Gerentes:*
1. Focar na evolução dos leads do funil para a coluna 'Venda Fechada'.
2. Estimular o canal de indicações devido à alta taxa de conversão (${taxaConversaoIndicacoesGlobal.toFixed(1)}%).
3. Realizar follow-up diário com os especialistas de vendas.

🔥 *SIMULAJÁ CRM - GESTÃO MULTI-LOJA MAGALU*`;
}

export function generateWhatsAppRegionalCoordinatorReport(
  lojasMetrics: LojaPerformance[],
  timeFrame: TimeFrame,
  metaGlobal: number,
  realizadoGlobal: number,
  customRange?: CustomDateRange
): string {
  const timeLabel = getTimeFrameLabel(timeFrame, customRange);
  const dateFormatted = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const atingimentoGlobal = metaGlobal > 0 ? (realizadoGlobal / metaGlobal) * 100 : 0;
  const faltanteGlobal = Math.max(0, metaGlobal - realizadoGlobal);
  const sortedByRank = [...lojasMetrics].sort((a, b) => a.posicao - b.posicao);

  const totalIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.totalIndicacoes, 0);
  const closedIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.closedIndicacoesCount, 0);
  const realizadoIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.realizadoIndicacoes, 0);
  const taxaConversaoIndicacoesGlobal = totalIndicacoesGlobal > 0 ? (closedIndicacoesGlobal / totalIndicacoesGlobal) * 100 : 0;
  const totalContratosFechados = lojasMetrics.reduce((acc, l) => acc + l.closedLeadsCount, 0);

  let lojasBreakdown = "";
  sortedByRank.forEach(m => {
    const trophy = m.posicao === 1 ? "🥇" : m.posicao === 2 ? "🥈" : m.posicao === 3 ? "🥉" : "🏬";
    lojasBreakdown += `
${trophy} *${m.loja.nome}*
   • Vendas Fechadas no Funil: *${formatCurrency(m.realizado)}* (${m.closedLeadsCount} contratos | ${m.atingimentoMensal.toFixed(1)}% da Meta)
   • Indicações Recebidas: *${m.totalIndicacoes}* cadastros
   • Indicações Fechadas: *${m.closedIndicacoesCount}* vendas (*${m.taxaConversaoIndicacoes.toFixed(1)}% conv.*)
   • Vol. R$ Fechado via Indicação: ${formatCurrency(m.realizadoIndicacoes)}
   • Conversão Geral da Loja: ${m.taxaConversaoGeral.toFixed(1)}% | Ticket Médio: ${formatCurrency(m.ticketMedio)}
`;
  });

  return `👔 *RELATÓRIO REGIONAL DE FECHAMENTO - CONSÓRCIO MAGALU* 🚀
👤 *Coordenador Regional:* ${COORDENADOR_REGIONAL.nome} (${COORDENADOR_REGIONAL.regional})
📅 *Data do Fechamento:* ${dateFormatted} (${timeLabel})
🏬 *Unidades da Regional Curitiba:* 5 Lojas (Paranaguá, São Mateus, Irati, Canoinhas, Campo Largo)

========================================
🎯 *META GLOBAL CONSOLIDADA:* ${formatCurrency(metaGlobal)}
💰 *VENDAS FECHADAS NO FUNIL:* *${formatCurrency(realizadoGlobal)}* (${totalContratosFechados} contratos)
📈 *ATINGIMENTO REGIONAL:* *${atingimentoGlobal.toFixed(1)}%*
${faltanteGlobal > 0 ? `🔻 *Faltante Global:* ${formatCurrency(faltanteGlobal)}` : `🎉 *Superávit Global:* ${formatCurrency(Math.abs(realizadoGlobal - metaGlobal))}`}

🤝 *PAINEL CONSOLIDADO DE INDICAÇÕES (REGIONAL CURITIBA):*
📩 *Total Indicações Recebidas:* ${totalIndicacoesGlobal} cadastros
✅ *Vendas Fechadas via Indicação:* ${closedIndicacoesGlobal} contratos
📈 *Taxa de Conversão de Indicações:* *${taxaConversaoIndicacoesGlobal.toFixed(1)}%*
💰 *Volume Fechado via Indicação:* ${formatCurrency(realizadoIndicacoesGlobal)}
========================================

🏆 *DETALHAMENTO POR FILIAL & INDICAÇÕES:*
${lojasBreakdown}
----------------------------------------
📌 *Síntese Operacional de Fechamento:*
• Relatório consolidado de fechamento das 5 unidades Magalu da Regional Curitiba.
• Foco da equipe regional em aumentar a conversão de indicações ativas e vendas fechadas.

🤝 *Atenciosamente,*
*Equipe de Gestão Comercial - SimulaJá CRM Magalu*`;
}
