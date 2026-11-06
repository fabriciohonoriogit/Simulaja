/**
 * ==============================================================================
 * SIMULAJÁ CRM • SERVIÇO DE GERAÇÃO & DISPARO DE PROPOSTAS DE ORÇAMENTO
 * Gera scripts padronizados com emoticons para WhatsApp e E-mail
 * ==============================================================================
 */

import { GRUPOS, GrupoItem } from "@/constants/simulador";
import { supabase } from "@/integrations/supabase/client";

export interface BudgetProposalParams {
  clienteNome?: string;
  telefone?: string;
  email?: string;
  valorCredito?: number;
  segmento?: "imovel" | "veiculo" | "pesados" | "servicos";
  lanceDinheiroPct?: number; // padrão 0%
  lanceEmbutidoPct?: number; // padrão 25%
  isLinear?: boolean;        // padrão false (50/50 negociado)
  consultorNome?: string;    // padrão "Fabricio Honório"
  dataStr?: string;          // padrão data de hoje
}

export interface GeneratedBudgetProposal {
  clienteNome: string;
  telefone?: string;
  email?: string;
  canal: "whatsapp" | "email" | "ambos";
  creditoFmt: string;
  parcelaAtualFmt: string;
  creditoDisponivelFmt: string;
  saldoDevedorFmt: string;
  prazo: number;
  prazoRestante: number;
  parcelaPosFmt: string;
  grupo: string;
  segmentoLabel: string;
  emojiBem: string;
  tipoParcelaStr: string;
  scriptWhatsApp: string;
  scriptEmail: string;
  assuntoEmail: string;
}

/**
 * Formata valores monetários no padrão compacto (ex: R$ 150.000 ou R$ 508)
 */
export function fmtBrlCompact(val: number): string {
  const rounded = Math.round(val);
  return `R$ ${rounded.toLocaleString("pt-BR")}`;
}

/**
 * Gera o script completo e exato de simulação com emoticons
 */
export function generateBudgetProposal(params: BudgetProposalParams): GeneratedBudgetProposal {
  const dataStr = params.dataStr || new Date().toLocaleDateString("pt-BR");
  const clienteNome = params.clienteNome?.trim() || "Não informado";
  const consultorNome = params.consultorNome || "Fabricio Honório";
  const targetCredit = params.valorCredito || 150000;
  const segmento = params.segmento || "imovel";

  let emojiBem = "🏠";
  let segmentoLabel = "Imóvel / Investimento";

  if (segmento === "veiculo") {
    emojiBem = "🚗";
    segmentoLabel = "Automóvel / Veículo";
  } else if (segmento === "pesados") {
    emojiBem = "🚛";
    segmentoLabel = "Pesados / Caminhão";
  } else if (segmento === "servicos") {
    emojiBem = "🎓";
    segmentoLabel = "Serviços / Especial";
  }

  // Busca grupo no simulador oficial
  const list: GrupoItem[] = (GRUPOS as any)[segmento] || GRUPOS.imovel;
  const exactMatches = list.filter((g) => Math.abs(g.credito - targetCredit) < 1);
  let g: GrupoItem = exactMatches[0];

  if (!g) {
    // Procura o mais próximo
    const sorted = [...list].sort((a, b) => a.credito - b.credito);
    let closest = sorted[0];
    let minDiff = Math.abs(sorted[0].credito - targetCredit);
    for (const item of sorted) {
      const diff = Math.abs(item.credito - targetCredit);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }
    g = closest || list[0];
  }

  const isLinear = params.isLinear || false;
  const prazo = g.prazo;
  const grupo = g.grupo;
  const tipoParcelaStr = isLinear
    ? "LINEAR 100%"
    : g.tipoVenda || "50/50 NEGOCIADO";

  const lanceDinheiroPct = params.lanceDinheiroPct ?? 0;
  const lanceEmbutidoPct = params.lanceEmbutidoPct ?? 25;
  const lanceTotalPct = lanceDinheiroPct + lanceEmbutidoPct;

  const lDinheiroRS = g.credito * (lanceDinheiroPct / 100);
  const lEmbutidoRS = g.credito * (lanceEmbutidoPct / 100);
  const lanceTotalRS = lDinheiroRS + lEmbutidoRS;
  const creditoDisponivel = g.credito - lEmbutidoRS;

  const selectedInstallment = isLinear
    ? (g.r100 || g.r100SemSeguro || 849.16)
    : (g.r50 || 508.25);

  const tx = isLinear ? (g.txLinear ?? g.tx ?? 17) : (g.tx5050 ?? g.tx ?? 17);
  const fr = isLinear ? (g.frLinear ?? g.fr ?? 1) : (g.fr5050 ?? g.fr ?? 1);
  const saldoDevedorBruto = g.credito + g.credito * (tx / 100) + g.credito * (fr / 100);

  const parcelasContemplar = 1;
  const saldoDevedorPosLance = saldoDevedorBruto - (parcelasContemplar * selectedInstallment) - lanceTotalRS;
  const prazoRestante = prazo - parcelasContemplar;
  const parcelaPos = prazoRestante > 0 && saldoDevedorPosLance > 0 ? saldoDevedorPosLance / prazoRestante : selectedInstallment;

  const creditoFmt = fmtBrlCompact(g.credito);
  const lanceTotalFmt = fmtBrlCompact(lanceTotalRS);
  const parcelaAtualFmt = fmtBrlCompact(selectedInstallment);
  const creditoDisponivelFmt = fmtBrlCompact(creditoDisponivel);
  const saldoDevedorFmt = fmtBrlCompact(saldoDevedorPosLance);
  const parcelaPosFmt = fmtBrlCompact(parcelaPos);

  const scriptWhatsApp = [
    `🗓️ ${dataStr}`,
    ``,
    `👤 Cliente: ${clienteNome}`,
    `📋 SIMULAÇÃO DE CONSÓRCIO`,
    `─────────────────────────`,
    `${emojiBem} Bem: ${segmentoLabel} | Grupo ${grupo}`,
    `💰 Carta de Crédito: ${creditoFmt}`,
    `⏱️ Prazo: ${prazo} meses`,
    `🏷️ Tipo de Parcela: ⚡ ${tipoParcelaStr}`,
    ``,
    `🎯 LANCE`,
    `─────────────────────────`,
    `💵 Dinheiro: ${lanceDinheiroPct}%`,
    `📥 Embutido: ${lanceEmbutidoPct}%`,
    `📊 Total do Lance: ${lanceTotalPct}% → ${lanceTotalFmt}`,
    ``,
    `💳 VALOR PARCELA`,
    `─────────────────────────`,
    `💲 Valor da Parcela Atual: ${parcelaAtualFmt}`,
    `💎 Crédito Disponível: ${creditoDisponivelFmt}`,
    `📉 Saldo Devedor: ${saldoDevedorFmt}`,
    `⏳ Prazo Restante: ${prazoRestante} meses`,
    `✨ Parcela Pós-Contemplação: ${parcelaPosFmt}`,
    ``,
    `─────────────────────────`,
    `🤝 Simulação realizada por ${consultorNome}`,
  ].join("\n");

  const assuntoEmail = `📋 Simulação Oficial de Consórcio | ${creditoFmt} - ${clienteNome}`;
  const scriptEmail = [
    `Olá, ${clienteNome}! Tudo bem?`,
    ``,
    `Conforme solicitado, segue o estudo financeiro e simulação oficial para o seu planejamento de consórcio:`,
    ``,
    `─────────────────────────────────────────────────────────`,
    scriptWhatsApp,
    `─────────────────────────────────────────────────────────`,
    ``,
    `Essa estrutura permite a você antecipar sua contemplação através de lance embutido sem descapitalizar seu caixa imediato.`,
    ``,
    `Fico à sua total disposição para esclarecer qualquer dúvida e iniciarmos seu cadastro.`,
    ``,
    `Atenciosamente,`,
    `${consultorNome}`,
    `Gestor de Planejamento Patrimonial | Prospera Plan & Consórcio Magalu`,
    `WhatsApp Oficial: (41) 99631-6737`,
  ].join("\n");

  return {
    clienteNome,
    telefone: params.telefone,
    email: params.email,
    canal: "whatsapp",
    creditoFmt,
    parcelaAtualFmt,
    creditoDisponivelFmt,
    saldoDevedorFmt,
    prazo,
    prazoRestante,
    parcelaPosFmt,
    grupo,
    segmentoLabel,
    emojiBem,
    tipoParcelaStr,
    scriptWhatsApp,
    scriptEmail,
    assuntoEmail,
  };
}

/**
 * Analisador semântico de solicitações de envio de orçamento pelo Jarvis
 */
export async function parseProposalRequestFromPrompt(
  rawPrompt: string
): Promise<{
  isMatch: boolean;
  proposal?: GeneratedBudgetProposal;
  clientNameFound?: string;
}> {
  const lower = rawPrompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const actionVerbs = [
    "enviar", "envie", "mande", "mandar", "gerar", "gere", "criar", "crie", "fazer", "faca", "passar", "passe", "disparar", "dispare"
  ];
  const targetNouns = ["orcamento", "proposta", "simulacao", "estudo", "cotacao"];

  const hasVerb = actionVerbs.some((v) => lower.includes(v));
  const hasNoun = targetNouns.some((n) => lower.includes(n));
  const hasChannel = lower.includes("whats") || lower.includes("zap") || lower.includes("email") || lower.includes("e-mail");

  const isMatch = (hasVerb && (hasNoun || hasChannel)) || (hasNoun && (hasChannel || lower.includes("cliente")));
  if (!isMatch) return { isMatch: false };

  // Detecta canal pretendido
  const hasWhats = lower.includes("whats") || lower.includes("whatsapp") || lower.includes("zap");
  const hasEmail = lower.includes("email") || lower.includes("e-mail");
  let canal: "whatsapp" | "email" | "ambos" = "whatsapp";
  if (hasWhats && hasEmail) canal = "ambos";
  else if (hasEmail) canal = "email";

  // Extrai nome do cliente com limpeza inteligente de preposições e canais
  let clienteNome = "Não informado";
  const nameMatch = rawPrompt.match(/(?:para\s+(?:o|a)?\s*(?:cliente\s+)?)([^,\n]+)/i);
  if (nameMatch && nameMatch[1]) {
    const rawTokens = nameMatch[1].trim().split(/\s+/);
    const stopWords = new Set([
      "no", "na", "nos", "nas", "via", "pelo", "pela", "pelos", "pelas",
      "whats", "whatsapp", "zap", "email", "e-mail", "imovel", "carro",
      "de", "do", "da", "dos", "das", "em", "com", "por", "sobre"
    ]);
    const cleanTokens: string[] = [];
    for (const token of rawTokens) {
      if (stopWords.has(token.toLowerCase()) || /^\d+/.test(token)) {
        break;
      }
      cleanTokens.push(token);
    }
    if (cleanTokens.length > 0) {
      clienteNome = cleanTokens.map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(" ");
    }
  }

  // Extrai valor do crédito
  let valorCredito = 150000;
  const millionMatch = lower.match(/(\d+[\d.,]*)\s*(?:milh[aã]o|milh[oõ]es|mi\b)/);
  if (millionMatch) {
    const val = parseFloat(millionMatch[1].replace(/\./g, "").replace(",", "."));
    if (!isNaN(val)) valorCredito = val * 1000000;
  } else {
    const thousandMatch = lower.match(/(\d+[\d.,]*)\s*(?:mil\b|k\b)/);
    if (thousandMatch) {
      const val = parseFloat(thousandMatch[1].replace(/\./g, "").replace(",", "."));
      if (!isNaN(val)) valorCredito = val * 1000;
    }
  }

  // Extrai segmento
  let segmento: "imovel" | "veiculo" | "pesados" | "servicos" = "imovel";
  if (lower.includes("carro") || lower.includes("veiculo") || lower.includes("auto") || lower.includes("moto")) {
    segmento = "veiculo";
  } else if (lower.includes("pesado") || lower.includes("caminhao") || lower.includes("trator")) {
    segmento = "pesados";
  } else if (lower.includes("servico")) {
    segmento = "servicos";
  }

  // Extrai telefone explícito, se houver
  let telefone: string | undefined;
  const phoneMatch = rawPrompt.match(/(?:\(?\d{2}\)?\s*)?9?\d{4}[-\s]?\d{4}/);
  if (phoneMatch) {
    telefone = phoneMatch[0].replace(/\D/g, "");
  }

  // Extrai e-mail explícito, se houver
  let email: string | undefined;
  const emailMatch = rawPrompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    email = emailMatch[0];
  }

  // Busca dados adicionais no CRM caso o cliente exista em leads
  if (clienteNome && clienteNome !== "Não informado" && (!telefone || !email)) {
    try {
      const { data: leads } = await supabase
        .from("leads")
        .select("nome, celular, email, valor_credito, tipo_consorcio")
        .ilike("nome", `%${clienteNome}%`)
        .limit(1);

      if (leads && leads.length > 0) {
        const lead = leads[0];
        clienteNome = lead.nome || clienteNome;
        if (!telefone && lead.celular) telefone = String(lead.celular).replace(/\D/g, "");
        if (!email && lead.email) email = lead.email;
        if (valorCredito === 150000 && lead.valor_credito) {
          const parsed = parseFloat(String(lead.valor_credito));
          if (!isNaN(parsed) && parsed > 0) valorCredito = parsed;
        }
      }
    } catch (e) {
      // Falha silenciosa de rede ao buscar leads
    }
  }

  const proposal = generateBudgetProposal({
    clienteNome,
    telefone,
    email,
    valorCredito,
    segmento,
  });

  proposal.canal = canal;

  return {
    isMatch: true,
    proposal,
    clientNameFound: clienteNome,
  };
}
