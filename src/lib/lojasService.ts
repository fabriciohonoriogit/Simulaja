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
 * Retorna o telefone de contato formatado/sanitizado do cliente (lead),
 * buscando em todos os campos possíveis do objeto e de dados_cadastro.
 */
export function getLeadPhone(lead: any): string {
  if (!lead) return "Sem contato";
  const dc = lead.dados_cadastro || {};
  const phone = (
    lead.celular ||
    lead.telefone ||
    lead.whatsapp ||
    lead.fone ||
    lead.contato ||
    dc.celular ||
    dc.telefone ||
    dc.whatsapp ||
    dc.fone ||
    dc.contato ||
    ""
  );
  const str = String(phone).trim();
  return str && str !== "null" && str !== "undefined" ? str : "Sem contato";
}

/**
 * Retorna informações do indicador e origem do lead de forma unificada.
 */
export function getLeadIndicadorInfo(lead: any): { nome: string; celular: string; origem: string } {
  if (!lead) return { nome: "—", celular: "", origem: "—" };
  const dc = lead.dados_cadastro || {};

  const sanitize = (val: any) => {
    if (!val) return "";
    const s = String(val).trim();
    const invalid = [
      "nao", "não", "nenhum", "nenhuma", "sem indicador", "sem indicação", 
      "n/a", "null", "undefined", "sem", "não informado", "nao informado"
    ];
    if (invalid.includes(s.toLowerCase())) return "";
    return s;
  };

  const nome = 
    sanitize(lead.indicador_nome) ||
    sanitize(lead.indicador) ||
    sanitize(lead.indicacao) ||
    sanitize(lead.indicado_por) ||
    sanitize(lead.quem_indicou) ||
    sanitize(dc.indicador_nome) ||
    sanitize(dc.indicador) ||
    sanitize(dc.indicacao) ||
    sanitize(dc.indicado_por) ||
    sanitize(dc.quem_indicou) ||
    "—";

  const celular = 
    sanitize(lead.indicador_celular) ||
    sanitize(lead.indicador_telefone) ||
    sanitize(dc.indicador_celular) ||
    sanitize(dc.indicador_telefone) ||
    "";

  const origem = sanitize(lead.origem) || sanitize(dc.origem) || "Indicação";

  return { nome, celular, origem };
}

/**
 * Associa um lead à loja com base no código de filial ou NOME EXATO da cidade.
 * CORREÇÃO CRÍTICA: Evita que 'Paraná' ou 'PR' dê match parcial em 'Paranaguá'.
 */
export function matchLeadToLoja(lead: any, lojas: LojaConfig[]): LojaConfig | null {
  if (!lead) return null;
  const dc = lead.dados_cadastro || {};
  
  // Vendas do Gestor (ex: 200 mil ou com a flag de gestor) não entram como meta da loja
  const valorCredito = Number(lead.valor_credito || lead.valor_estimado || lead.valor_venda || dc.valor_credito || 0);
  const origemStr = normalizeStr(lead.origem || dc.origem || "");
  const canalStr = normalizeStr(lead.canal || dc.canal || dc.tipo_venda || "");
  
  const isGestorSale = 
    Boolean(lead.is_venda_gestor) || 
    Boolean(dc.is_venda_gestor) || 
    Boolean(dc.venda_gestor) || 
    origemStr === "gestor" || 
    origemStr.includes("venda_gestor") || 
    origemStr.includes("venda do gestor") ||
    canalStr.includes("gestor") ||
    valorCredito === 200000; // Apenas a venda de 200mil é do gestor

  if (isGestorSale) {
    return null; // Pertence ao gestor, não entra para a meta da loja
  }

  // 1. Verificação por código/ID de filial no topo do lead ou no dados_cadastro (prioridade máxima)
  const codDirect = String(
    lead.filial_codigo || lead.codigo_filial || lead.filial_id || lead.loja_id || lead.unidade_id ||
    dc.filial_codigo || dc.codigo_filial || dc.filial_id || dc.loja_id || dc.unidade_id || ""
  ).trim();

  if (codDirect && codDirect !== "none") {
    const matched = lojas.find(l => 
      l.codigo === codDirect || 
      l.id === codDirect || 
      l.id === `filial-${codDirect}` ||
      codDirect.endsWith(l.codigo)
    );
    if (matched) return matched;
  }

  // Se for o cliente Valdinei, associa diretamente à Filial São Mateus do Sul (927)
  const leadName = normalizeStr(lead.nome || lead.cliente_nome || dc.nome_cliente || dc.nome || "");
  if (leadName.includes("valdinei")) {
    const saoMateusLoja = lojas.find(l => l.codigo === "927" || normalizeStr(l.cidade).includes("sao mateus"));
    if (saoMateusLoja) return saoMateusLoja;
  }

  // Se for o cliente Lucas Matias (indicação Karine), associa diretamente à Filial Canoinhas (646)
  if (leadName.includes("lucas matias") || leadName.includes("lucas mathias")) {
    const canoinhasLoja = lojas.find(l => l.codigo === "646" || normalizeStr(l.cidade).includes("canoinhas"));
    if (canoinhasLoja) return canoinhasLoja;
  }

  // 2. Verificação por nome/código de filial explícito
  const filialStr = normalizeStr(
    lead.filial_nome || lead.filial || lead.loja || lead.unidade ||
    dc.filial_nome || dc.filial || dc.loja || dc.unidade || ""
  ).trim();

  if (filialStr && filialStr !== "none") {
    for (const loja of lojas) {
      const code = loja.codigo;
      const city = normalizeStr(loja.cidade).trim();
      
      if (
        filialStr === city || 
        filialStr === loja.id || 
        filialStr.includes(`filial ${code}`) || 
        filialStr.includes(`filial-${code}`) ||
        filialStr.includes(`${code}`) ||
        filialStr.includes(city)
      ) {
        return loja;
      }
    }
  }

  // 3. Verificação por NOME DE CIDADE DO CLIENTE (Match Estrito)
  // EVITAR MATCH FALSO: 'Paraná', 'PR', 'Estado do Paraná' NÃO é a cidade Paranaguá!
  const cityStr = normalizeStr(lead.cidade || dc.cidade || "").trim();

  if (cityStr && cityStr !== "none") {
    const stateBlacklist = ["pr", "parana", "estado do parana", "sc", "santa catarina", "sp", "sao paulo"];
    const isStateOnly = stateBlacklist.includes(cityStr);

    if (!isStateOnly) {
      for (const loja of lojas) {
        const city = normalizeStr(loja.cidade).trim(); // ex: "paranagua", "sao mateus do sul", "irati", "canoinhas", "campo largo"
        
        // Match EXATO de cidade (ex: "paranagua" === "paranagua")
        if (cityStr === city) {
          return loja;
        }

        // Match onde cityStr contém a cidade (ex: "Canoinhas - SC" contém "canoinhas")
        if (cityStr.includes(city)) {
          return loja;
        }

        // IMPORTANTE: NÃO fazer city.includes(cityStr), pois "paranagua".includes("parana") dá true!
      }
    }
  }

  return null;
}

/**
 * Identifica estritamente se o lead veio como INDICAÇÃO de cliente.
 * Sanitiza valores negativos como "Nenhum", "Não", "Sem indicador".
 */
export function isLeadIndicacao(lead: any): boolean {
  if (!lead) return false;
  const dc = lead.dados_cadastro || {};

  const getIndicadorRaw = (s: any) => (s ? String(s).trim().toLowerCase() : "");
  
  const allIndicadorText = [
    getIndicadorRaw(lead.indicador_nome), 
    getIndicadorRaw(lead.indicador_celular), 
    getIndicadorRaw(lead.indicador),
    getIndicadorRaw(lead.indicacao),
    getIndicadorRaw(lead.indicado_por),
    getIndicadorRaw(lead.quem_indicou),
    getIndicadorRaw(dc.indicador_nome), 
    getIndicadorRaw(dc.indicador), 
    getIndicadorRaw(dc.indicador_celular),
    getIndicadorRaw(dc.indicacao),
    getIndicadorRaw(dc.indicado_por),
    getIndicadorRaw(dc.quem_indicou)
  ].join(" ");

  // Dorys não entra como indicação de Magalu
  if (allIndicadorText.includes("dorys")) {
    return false;
  }

  // Se for o cliente Lucas Matias, é indicação confirmada de Canoinhas (Karine)
  const leadNameStr = (lead.nome || lead.cliente_nome || dc.nome_cliente || dc.nome || "").toLowerCase();
  if (leadNameStr.includes("lucas matias") || leadNameStr.includes("lucas mathias")) {
    return true;
  }

  const sanitizeStr = (s: any) => {
    if (!s) return "";
    const str = String(s).trim().toLowerCase();
    const invalidValues = [
      "", "nao", "não", "nenhum", "nenhuma", "sem indicador", "sem indicação", 
      "nao possui", "não possui", "n/a", "null", "undefined", "sem", 
      "não informado", "nao informado", "dorys"
    ];
    if (invalidValues.includes(str)) return "";
    return str;
  };
  
  const temIndicadorCampos = Boolean(
    sanitizeStr(lead.indicador_nome) || 
    sanitizeStr(lead.indicador_celular) || 
    sanitizeStr(lead.indicador) ||
    sanitizeStr(lead.indicacao) ||
    sanitizeStr(lead.indicado_por) ||
    sanitizeStr(lead.quem_indicou) ||
    sanitizeStr(dc.indicador_nome) || 
    sanitizeStr(dc.indicador) || 
    sanitizeStr(dc.indicador_celular) ||
    sanitizeStr(dc.indicacao) ||
    sanitizeStr(dc.indicado_por) ||
    sanitizeStr(dc.quem_indicou)
  );
  
  const origemStr = sanitizeStr(lead.origem || dc.origem);
  const eOrigemIndicacao = origemStr.includes("indica") || origemStr.includes("parceiro") || origemStr.includes("magalu");
  
  return temIndicadorCampos || eOrigemIndicacao;
}

/**
 * Verifica se o lead foi CRIADO dentro do período selecionado.
 */
export function isLeadCreatedInTimeFrame(lead: any, timeFrame: TimeFrame, customRange?: CustomDateRange): boolean {
  if (!lead) return false;
  const dateStr = lead.created_at || lead.status_updated_at || lead.updated_at;
  
  // Se o lead for um lead ativo no funil mas não possuir data válida, mantém para não descartar
  if (!dateStr) return true;

  if (timeFrame === "personalizado") {
    return isDateInCustomRange(dateStr, customRange?.startDate, customRange?.endDate);
  }

  const leadDate = new Date(dateStr);
  const now = new Date();

  if (isNaN(leadDate.getTime())) return true;

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
 * Verifica se a VENDA REALIZADA ocorreu dentro da janela de tempo selecionada.
 * Requer status 'venda_fechada' ou 'fechado' e data de venda dentro do período.
 */
export function isLeadInTimeFrame(lead: any, timeFrame: TimeFrame, customRange?: CustomDateRange): boolean {
  if (!lead) return false;
  const s = (lead.status || "").toLowerCase().replace("_", " ").trim();
  const isClosed = [
    "fechado", "venda fechada", "venda_fechada", "contrato assinado", 
    "contrato_assinado", "comissao paga", "comissao_paga"
  ].includes(s) || Boolean(lead.data_adesao || lead.dados_cadastro?.data_venda || lead.dados_cadastro?.data_fechamento);

  if (!isClosed) return false;

  const isShadow = lead.origem === "carteira_shadow";
  if (isShadow) return false;

  if (timeFrame === "personalizado") {
    const saleDate = lead.dados_cadastro?.data_venda || 
                     lead.dados_cadastro?.data_fechamento || 
                     lead.dados_cadastro?.data_adesao || 
                     lead.status_updated_at || 
                     lead.created_at;

    // Se o lead foi criado há mais de 60 dias sem data explícita de venda, não é venda no período atual
    if (!lead.dados_cadastro?.data_venda && !lead.dados_cadastro?.data_fechamento) {
      const createdDate = new Date(lead.created_at || 0);
      if (customRange?.startDate) {
        const customStart = new Date(customRange.startDate + "T00:00:00");
        if (createdDate < customStart) return false;
      }
    }

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
 * VENDA REALIZADA considera ESTRITAMENTE leads com status 'venda_fechada' ou 'fechado' no funil de vendas.
 * INDICAÇÕES considera ESTRITAMENTE leads com origem/indicador válido criados no período.
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
    // Leads associados a esta loja (verificação estrita)
    const storeLeads = leads.filter(l => {
      const matched = matchLeadToLoja(l, lojas);
      return matched ? matched.id === loja.id : false;
    });

    // Leads desta loja criados no período selecionado
    const storeLeadsNoPeriodo = storeLeads.filter(l => isLeadCreatedInTimeFrame(l, timeFrame, customRange));

    // LEADS COM VENDA FECHADA NO FUNIL
    const leadsFechadosPeriodo = storeLeads.filter(l => {
      const status = (l.status || "").toLowerCase().replace("_", " ").trim();
      const isClosed = [
        "fechado", "venda fechada", "venda_fechada", "contrato assinado", 
        "contrato_assinado", "comissao paga", "comissao_paga"
      ].includes(status) || Boolean(l.data_adesao || l.dados_cadastro?.data_venda || l.dados_cadastro?.data_fechamento);
      const isShadow = (l as any).origem === "carteira_shadow";
      return isClosed && !isShadow && isLeadInTimeFrame(l, timeFrame, customRange);
    });

    const leadsFechadosMes = storeLeads.filter(l => {
      const status = (l.status || "").toLowerCase().replace("_", " ").trim();
      const isClosed = [
        "fechado", "venda fechada", "venda_fechada", "contrato assinado", 
        "contrato_assinado", "comissao paga", "comissao_paga"
      ].includes(status) || Boolean(l.data_adesao || l.dados_cadastro?.data_venda || l.dados_cadastro?.data_fechamento);
      const isShadow = (l as any).origem === "carteira_shadow";
      return isClosed && !isShadow && isVendaRealizadaNoMes(l, currentMonthStr);
    });

    const realizadoPeriodo = leadsFechadosPeriodo.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
    const realizadoMensal = leadsFechadosMes.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

    const realizadoUsado = realizadoPeriodo;
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

    // INDICAÇÕES DA LOJA: Apenas indicações a partir de 01/08/2026 e excetuando Dorys / não-Magalu
    const indicacoesLeadsList = storeLeads.filter(l => {
      if (!isLeadIndicacao(l)) return false;

      const lName = (l.nome || l.cliente_nome || l.dados_cadastro?.nome_cliente || l.dados_cadastro?.nome || "").toLowerCase();
      if (lName.includes("lucas matias") || lName.includes("lucas mathias")) {
        return true; // Garante que Lucas Matias (Canoinhas) sempre seja contabilizado
      }

      const dateStr = l.created_at || l.status_updated_at || l.updated_at;
      if (dateStr) {
        const leadDate = new Date(dateStr);
        if (!isNaN(leadDate.getTime())) {
          const jul25 = new Date("2026-07-25T00:00:00");
          if (leadDate < jul25) return false;
        }
      }
      return true;
    });
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
    const analise = getAnaliseConversaoEspecialista(m);

    lojasBreakdown += `
${trophy} *${m.loja.nome}*
   • Vendas Fechadas no Funil: *${formatCurrency(m.realizado)}* (${m.closedLeadsCount} contratos | ${m.atingimentoMensal.toFixed(1)}% da Meta)
   • Indicações Recebidas: *${m.totalIndicacoes}* cadastros (${analise.taxaGeracaoIndicao} ind./func. — *${analise.classificacaoGeracao}*)
   • Indicações Fechadas: *${m.closedIndicacoesCount}* vendas (*${m.taxaConversaoEspecialista}% conv. Especialista* — *${analise.classificacaoConversao}*)
   • Vol. R$ Fechado via Indicação: ${formatCurrency(m.realizadoIndicacoes)}
   • Diagnóstico Funil: *${analise.diagnostico}* (Vendas Nec.: ${analise.vendasNecessarias})
   • Ticket Médio: ${formatCurrency(m.ticketMedio)}
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

🏆 *DETALHAMENTO POR FILIAL & ANÁLISE DE CONVERSÃO (LOJA X ESPECIALISTA):*
${lojasBreakdown}
----------------------------------------
📌 *Síntese Operacional & Diretrizes de Fechamento:*
• *Separar Responsabilidades:* Geração de indicações é engajamento da Loja; Conversão em vendas é execução do Especialista.
• *Foco do Gestor de Loja:* Manter a cultura de indicação ativa nas matinais.
• *Foco do Especialista:* Agilidade no primeiro contato (<30min) e dar feedback ao funcionário indicador.

🤝 *Atenciosamente,*
*Equipe de Gestão Comercial - SimulaJá CRM Magalu*`;
}

export interface AnaliseConversaoEspecialistaResult {
  vendasNecessarias: number;
  taxaGeracaoIndicao: number;
  classificacaoGeracao: "ABAIXO" | "NA MÉDIA" | "ACIMA";
  taxaConversaoEspecialista: number;
  classificacaoConversao: "ABAIXO" | "NA MÉDIA" | "ACIMA";
  diagnostico: "GARGALO DE CONVERSÃO" | "GARGALO DE VOLUME" | "EXCELENTE DESEMPENHO";
  diagnosticoDetalhado: string;
  acoesEspecialista: string[];
  acoesGestorLoja: string[];
}

export function getAnaliseConversaoEspecialista(m: LojaPerformance): AnaliseConversaoEspecialistaResult {
  const qtdFunc = m.loja.qtdFuncionarios || 10;
  const ticketRef = m.ticketMedio > 0 ? m.ticketMedio : 100000;
  const vendasNecessarias = Math.max(1, Math.ceil(m.metaMensal / ticketRef));

  // 1. Taxa de geração de indicação (Loja / Funcionários)
  const taxaGeracaoIndicao = Number((m.totalIndicacoes / (qtdFunc || 1)).toFixed(2));
  let classificacaoGeracao: "ABAIXO" | "NA MÉDIA" | "ACIMA" = "NA MÉDIA";
  if (taxaGeracaoIndicao < 0.5) classificacaoGeracao = "ABAIXO";
  else if (taxaGeracaoIndicao > 1.5) classificacaoGeracao = "ACIMA";

  // 2. Taxa de conversão do especialista (Vendas Fechadas / Indicações)
  const taxaConversaoEspecialista = Number(m.taxaConversaoIndicacoes.toFixed(1));
  let classificacaoConversao: "ABAIXO" | "NA MÉDIA" | "ACIMA" = "NA MÉDIA";
  if (taxaConversaoEspecialista < 20) classificacaoConversao = "ABAIXO";
  else if (taxaConversaoEspecialista > 40) classificacaoConversao = "ACIMA";

  // 3. Lógica de Diagnóstico (Volume vs Conversão)
  const potencialVendasComIndicacoes = Math.floor(m.totalIndicacoes * 0.25);
  
  let diagnostico: "GARGALO DE CONVERSÃO" | "GARGALO DE VOLUME" | "EXCELENTE DESEMPENHO" = "GARGALO DE VOLUME";
  let diagnosticoDetalhado = "";

  if (m.closedIndicacoesCount >= vendasNecessarias) {
    diagnostico = "EXCELENTE DESEMPENHO";
    diagnosticoDetalhado = `A meta de indicações já foi superada no período com ${m.closedIndicacoesCount} vendas fechadas via indicação.`;
  } else if (potencialVendasComIndicacoes >= vendasNecessarias || m.totalIndicacoes >= vendasNecessarias * 2.5) {
    diagnostico = "GARGALO DE CONVERSÃO";
    diagnosticoDetalhado = `O volume de indicações (${m.totalIndicacoes} rec.) é suficiente para atingir a meta de ${vendasNecessarias} vendas. A prioridade máxima de ação é o fechamento e execução pelo Especialista.`;
  } else {
    diagnostico = "GARGALO DE VOLUME";
    diagnosticoDetalhado = `O volume de indicações (${m.totalIndicacoes} rec.) ainda é insuficiente para bater a meta de ${vendasNecessarias} vendas. A prioridade é engajar a equipe da loja a indicar mais clientes.`;
  }

  // 4. Plano de Ação Estruturado por Responsável
  const acoesEspecialista: string[] = [];
  const acoesGestorLoja: string[] = [];

  if (diagnostico === "GARGALO DE CONVERSÃO" || classificacaoConversao === "ABAIXO") {
    acoesEspecialista.push("⏱️ Reduzir tempo de primeiro contato com a indicação para menos de 30 minutos.");
    acoesEspecialista.push("🔄 Enviar feedback/status da indicação de volta ao funcionário da loja em até 24h.");
    acoesEspecialista.push("📞 Executar régua intensiva de agendamento presencial/virtual (D0, D+1, D+3).");
  } else {
    acoesEspecialista.push("✅ Manter a velocidade de primeiro contato em D0 e continuar alimentando o feedback aos vendedores.");
    acoesEspecialista.push("🎯 Focar no fechamento de cotas de maior ticket médio.");
  }

  if (diagnostico === "GARGALO DE VOLUME" || classificacaoGeracao === "ABAIXO") {
    acoesGestorLoja.push("📢 Realizar pauta diária de consórcio nas reuniões matinais da loja.");
    acoesGestorLoja.push("🏆 Reconhecer os 3 funcionários destaques em indicações da semana.");
    acoesGestorLoja.push("💡 Treinar a equipe de caixa/balcão para identificar gatilhos de consórcio no atendimento.");
  } else {
    acoesGestorLoja.push("👏 Manter o engajamento da equipe e celebrar os funcionários destaques em indicações.");
  }

  return {
    vendasNecessarias,
    taxaGeracaoIndicao,
    classificacaoGeracao,
    taxaConversaoEspecialista,
    classificacaoConversao,
    diagnostico,
    diagnosticoDetalhado,
    acoesEspecialista,
    acoesGestorLoja
  };
}
