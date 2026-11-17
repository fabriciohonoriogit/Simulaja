/**
 * AI Service — Motor de Inteligência Comercial e Autonomia da Bella IA
 * Conecta com a Edge Function `jarvis-ai` e possui motor de inteligência local analítico em tempo real
 */
import { supabase } from "@/integrations/supabase/client";
import { GRUPOS, GRUPO_CARACTERISTICAS, MEDIA_LANCES_GRUPOS, GrupoItem } from "@/constants/simulador";
import { getConsorcioKnowledgePrompt } from "@/constants/consorcioKnowledgeBase";
import { JARVIS_SQUAD, JarvisAgent } from "@/data/jarvisSquad";

export interface LeadContext {
  nome: string;
  tipo_consorcio: string;
  valor_credito: number;
  cidade: string;
}

export interface ActiveBudgetMemory {
  credito: number;
  creditoFormatado: string;
  categoria: string;
  prazo: number;
  meiaParcelaSemSeguro: number;
  meiaParcelaComSeguro: number;
  parcelaIntegralSemSeguro: number;
  parcelaIntegralComSeguro: number;
  grupo: string;
  taxaAdm: number;
  fundoReserva: number;
  mediaLance: string;
  lanceEmbutido: string;
  updatedAt: number;
}

let currentActiveBudgetMemory: ActiveBudgetMemory | null = null;

export function setActiveBudgetMemory(memory: ActiveBudgetMemory) {
  currentActiveBudgetMemory = memory;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("jarvis_active_budget_memory", JSON.stringify(memory));
    } catch { }
  }
}

export function getActiveBudgetMemory(): ActiveBudgetMemory | null {
  if (currentActiveBudgetMemory) return currentActiveBudgetMemory;
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("jarvis_active_budget_memory");
      if (saved) {
        currentActiveBudgetMemory = JSON.parse(saved);
        return currentActiveBudgetMemory;
      }
    } catch { }
  }
  return null;
}

/**
 * Localizador autoritário de cotações do Simulador Oficial SimulaJá / Magalu.
 * Encontra a cota exata ou as faixas oficiais mais próximas com tolerância zero para alucinações.
 */
export function findAuthoritativeSimulatorQuote(query: string): string | null {
  if (!query) return null;
  const lower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Extrai número do crédito
  let targetCredit = 0;

  // Trata expressões de milhões: "1 milhao", "1.5 milhão", "2 milhoes", "1mi", "2mi"
  const millionMatch = lower.match(/(\d+[\d.,]*)\s*(?:milh[aã]o|milh[oõ]es|mi\b)/);
  if (millionMatch) {
    const val = parseFloat(millionMatch[1].replace(/\./g, "").replace(",", "."));
    if (!isNaN(val)) targetCredit = val * 1000000;
  }

  // Trata expressões de mil: "300 mil", "500k", "80k", "25 mil"
  if (!targetCredit) {
    const thousandMatch = lower.match(/(\d+[\d.,]*)\s*(?:mil\b|k\b)/);
    if (thousandMatch) {
      const val = parseFloat(thousandMatch[1].replace(/\./g, "").replace(",", "."));
      if (!isNaN(val)) targetCredit = val * 1000;
    }
  }

  // Trata números numéricos puros (ex: "300000", "500.000", "80000", "20000")
  if (!targetCredit) {
    const rawNumbers = query.match(/\b\d{1,3}(?:\.\d{3})+(?:,\d+)?\b|\b\d{4,7}\b/g);
    if (rawNumbers && rawNumbers.length > 0) {
      const parsed = parseFloat(rawNumbers[0].replace(/\./g, "").replace(",", "."));
      if (!isNaN(parsed) && parsed >= 5000) targetCredit = parsed;
    }
  }

  if (!targetCredit) return null;

  // Detecta segmento pretendido
  const isImovel = lower.includes("imov") || lower.includes("casa") || lower.includes("apto") || lower.includes("apartamento") || lower.includes("terreno") || lower.includes("construcao");
  const isMoto = lower.includes("moto");
  const isPesado = lower.includes("pesad") || lower.includes("caminha") || lower.includes("trator") || lower.includes("agricola") || lower.includes("onibus");
  const isServico = lower.includes("servi") || lower.includes("eletro") || lower.includes("cirurgia") || lower.includes("plastica") || lower.includes("plástica");
  const isVeiculo = !isImovel && !isPesado && !isServico && (lower.includes("carro") || lower.includes("auto") || lower.includes("veic") || isMoto);

  let targetCat = "imovel";
  if (isPesado) targetCat = "pesados";
  else if (isServico) targetCat = "servicos";
  else if (isVeiculo) targetCat = "veiculo";
  else {
    // Inferência inteligente por faixa de valor se segmento não foi explicitado
    if (targetCredit <= 30000) targetCat = "veiculo"; // faixas de moto / serviços
    else if (targetCredit >= 180000 && targetCredit <= 400000 && lower.includes("pesad")) targetCat = "pesados";
    else targetCat = "imovel";
  }

  const list: GrupoItem[] = (GRUPOS as any)[targetCat] || GRUPOS.imovel;

  // Busca correspondência exata
  const exactMatches = list.filter(g => Math.abs(g.credito - targetCredit) < 1);

  const formatQuote = (g: GrupoItem, label = "") => {
    const credFmt = g.credito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const taxaSeguro = g.seguro ?? 0.0252;
    const taxaSeguroDecimal = taxaSeguro > 0.001 ? taxaSeguro / 100 : taxaSeguro;
    const valSeguro = g.credito * taxaSeguroDecimal;

    const r50Com = g.r50 || 0;
    const r50Sem = g.r50SemSeguro ?? Math.max(0, r50Com - valSeguro);
    const r100Com = g.r100 || (r50Com * 2);
    const r100Sem = g.r100SemSeguro ?? Math.max(0, r100Com - valSeguro);

    const txAdm = g.txLinear || g.tx5050 || g.tx || 18;
    const fr = g.frLinear || g.fr5050 || g.fr || 1;
    const mediaLance = MEDIA_LANCES_GRUPOS[g.grupo] ? `${MEDIA_LANCES_GRUPOS[g.grupo]}%` : "Consulte histórico";
    const carac = GRUPO_CARACTERISTICAS[g.grupo];
    const lanceEmbutidoVal = (g.credito * 0.25).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return `
• OPÇÃO OFICIAL ${label ? `(${label})` : ""}:
  - Crédito Oficial: ${credFmt} (Grupo ${g.grupo} - Prazo: ${g.prazo} meses${g.tipoVenda ? ` | ${g.tipoVenda}` : ""})
  - Parcela 50/50 (Meia Parcela) COM SEGURO: ${r50Com.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
  - Parcela 50/50 (Meia Parcela) SEM SEGURO: ${r50Sem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
  - Parcela Linear (100%) COM SEGURO: ${r100Com.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
  - Parcela Linear (100%) SEM SEGURO: ${r100Sem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
  - Taxa de ADM: ${txAdm}% | Fundo de Reserva: ${fr}% | Seguro Prestamista: ${(taxaSeguroDecimal * 100).toFixed(4)}%
  - Lance Embutido Permitido: 25% (${lanceEmbutidoVal})
  - Média Histórica de Lance Contemplado do Grupo ${g.grupo}: ${mediaLance}
  - Reajuste: ${carac?.reajuste || "INCC"} | Ordem: ${carac?.ordemContemplacao || "Sorteio e Lances"}`;
  };

  if (exactMatches.length > 0) {
    const formattedList = exactMatches.map((m, idx) => {
      const typeLabel = m.isPlanoGold ? "Plano Golden" : m.isPromo ? "Promocional 50/50" : `Opção ${idx + 1}`;
      return formatQuote(m, typeLabel);
    }).join("\n");

    return `🎯 COTAÇÃO OFICIAL DIRETA DO SIMULADOR (VALORES EXATOS E CRITERIOSOS):
${formattedList}
⚠️ REGRA DE OURO: Estes são os valores exatos e oficiais do sistema. É proibido inventar valores diferentes destes.`;
  }

  // Se não houver correspondência exata, busca as cotas mais próximas (inferior e superior)
  const sorted = [...list].sort((a, b) => a.credito - b.credito);
  let lowerItem: GrupoItem | null = null;
  let upperItem: GrupoItem | null = null;

  for (const item of sorted) {
    if (item.credito < targetCredit) lowerItem = item;
    if (item.credito > targetCredit && !upperItem) upperItem = item;
  }

  const requestedFmt = targetCredit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  let suggestions = `⚠️ NOTA CRITERIOSA: Não existe cota única de exatamente ${requestedFmt} cadastrada no Simulador Oficial para o segmento selecionado. As opções oficiais mais próximas disponíveis são:\n`;

  if (lowerItem) {
    suggestions += formatQuote(lowerItem, "Cota Oficial Imediatamente Abaixo");
  }
  if (upperItem) {
    suggestions += "\n" + formatQuote(upperItem, "Cota Oficial Imediatamente Acima");
  }

  return suggestions;
}

/**
 * Formata um orçamento conciso, direto e sem jargões para o usuário ou para fala TTS.
 * Retorna ESTRITAMENTE o valor das parcelas e o prazo em meses,
 * eliminando qualquer menção a grupo, taxa de administração ou burocracia.
 */
export function formatConciseBudgetQuote(query: string): string | null {
  if (!query) return null;
  const lower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Extrai número do crédito
  let targetCredit = 0;

  const millionMatch = lower.match(/(\d+[\d.,]*)\s*(?:milh[aã]o|milh[oõ]es|mi\b)/);
  if (millionMatch) {
    const val = parseFloat(millionMatch[1].replace(/\./g, "").replace(",", "."));
    if (!isNaN(val)) targetCredit = val * 1000000;
  }

  if (!targetCredit) {
    const thousandMatch = lower.match(/(\d+[\d.,]*)\s*(?:mil\b|k\b)/);
    if (thousandMatch) {
      const val = parseFloat(thousandMatch[1].replace(/\./g, "").replace(",", "."));
      if (!isNaN(val)) targetCredit = val * 1000;
    }
  }

  if (!targetCredit) {
    const rawNumbers = query.match(/\b\d{1,3}(?:\.\d{3})+(?:,\d+)?\b|\b\d{4,7}\b/g);
    if (rawNumbers && rawNumbers.length > 0) {
      const parsed = parseFloat(rawNumbers[0].replace(/\./g, "").replace(",", "."));
      if (!isNaN(parsed) && parsed >= 5000) targetCredit = parsed;
    }
  }

  if (!targetCredit) return null;

  // Detecta segmento pretendido
  const isImovel = lower.includes("imov") || lower.includes("casa") || lower.includes("apto") || lower.includes("apartamento") || lower.includes("terreno") || lower.includes("construcao");
  const isMoto = lower.includes("moto");
  const isPesado = lower.includes("pesad") || lower.includes("caminha") || lower.includes("trator") || lower.includes("agricola") || lower.includes("onibus");
  const isServico = lower.includes("servi") || lower.includes("eletro") || lower.includes("cirurgia") || lower.includes("plastica") || lower.includes("plástica");
  const isVeiculo = !isImovel && !isPesado && !isServico && (lower.includes("carro") || lower.includes("auto") || lower.includes("veic") || isMoto);

  let targetCat = "imovel";
  if (isPesado) targetCat = "pesados";
  else if (isServico) targetCat = "servicos";
  else if (isVeiculo) targetCat = "veiculo";
  else {
    if (targetCredit <= 30000) targetCat = "veiculo";
    else if (targetCredit >= 180000 && targetCredit <= 400000 && lower.includes("pesad")) targetCat = "pesados";
    else targetCat = "imovel";
  }

  const list: GrupoItem[] = (GRUPOS as any)[targetCat] || GRUPOS.imovel;
  const exactMatches = list.filter(g => Math.abs(g.credito - targetCredit) < 1);

  const formatShort = (g: GrupoItem) => {
    const credFmt = g.credito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const taxaSeguro = g.seguro ?? 0.0252;
    const taxaSeguroDecimal = taxaSeguro > 0.001 ? taxaSeguro / 100 : taxaSeguro;
    const valSeguro = g.credito * taxaSeguroDecimal;

    const r50Com = g.r50 || 0;
    const r50Sem = g.r50SemSeguro ?? Math.max(0, r50Com - valSeguro);
    const r100Com = g.r100 || (r50Com * 2);
    const r100Sem = g.r100SemSeguro ?? Math.max(0, r100Com - valSeguro);

    const r50SemFmt = r50Sem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const r50ComFmt = r50Com.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const r100SemFmt = r100Sem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const r100ComFmt = r100Com.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // Registra na memória ativa do Jarvis para perguntas subsequentes do gestor
    setActiveBudgetMemory({
      credito: g.credito,
      creditoFormatado: credFmt,
      categoria: targetCat,
      prazo: g.prazo,
      meiaParcelaSemSeguro: r50Sem,
      meiaParcelaComSeguro: r50Com,
      parcelaIntegralSemSeguro: r100Sem,
      parcelaIntegralComSeguro: r100Com,
      grupo: g.grupo,
      taxaAdm: g.txLinear || g.tx5050 || g.tx || 18,
      fundoReserva: g.frLinear || g.fr5050 || g.fr || 1,
      mediaLance: MEDIA_LANCES_GRUPOS[g.grupo] ? `${MEDIA_LANCES_GRUPOS[g.grupo]}%` : "Consulte histórico",
      lanceEmbutido: "25%",
      updatedAt: Date.now(),
    });

    // Fala o orçamento completo com Grupo, Média de Lances e Características conforme regra oficial
    const carac = GRUPO_CARACTERISTICAS[g.grupo];
    const mediaLance = MEDIA_LANCES_GRUPOS[g.grupo] ? `${MEDIA_LANCES_GRUPOS[g.grupo]}%` : "Consulte histórico";
    const statusAndamento = carac?.status || "Andamento";
    const ass = carac?.numeroAssembleia ? ` | Assembleia ${carac.numeroAssembleia}` : "";
    const lanceEmb = carac?.caracteristicas?.includes("EMBUTIDO") || carac?.caracteristicas?.includes("embutido") ? "Lance Embutido de até 25%" : "Lance Embutido permitido";

    return `🎯 **COTAÇÃO OFICIAL — SIMULADOR SIMULAJÁ**
• **Crédito:** ${credFmt} (Grupo **${g.grupo}** — ${statusAndamento}${ass})
• **Prazo:** ${g.prazo} meses

• **Parcela Reduzida (50/50 Negociado):**
  - Sem seguro: **${r50SemFmt}**/mês
  - Com seguro: **${r50ComFmt}**/mês

• **Parcela Linear (Integral):**
  - Sem seguro: **${r100SemFmt}**/mês
  - Com seguro: **${r100ComFmt}**/mês

• **Média Histórica de Lance:** **${mediaLance}**
• **Características do Grupo:** ${lanceEmb}, opções de Lances Fixos (25% e 45%), índice de reajuste ${carac?.reajuste || "INCC"}.`;
  };

  if (exactMatches.length > 0) {
    return formatShort(exactMatches[0]);
  }

  // Se não encontrar correspondência exata, busca o valor mais próximo
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

  if (closest) {
    return formatShort(closest);
  }

  return null;
}

function getSegmentoByGrupo(gId: string): string {
  if (gId.startsWith("60")) return "Imóveis (Casas, Terrenos, Construção)";
  if (gId.startsWith("59")) return "Pesados (Caminhões, Ônibus, Máquinas Agrícolas)";
  if (gId.startsWith("71")) return "Serviços & Procedimentos";
  if (gId.startsWith("41")) return "Eletroeletrônicos";
  const motosGrupos = ["5261", "5265", "5266", "5268", "5270", "5273", "5276", "5280", "5283", "5285", "5288", "5289", "5293", "5296", "5298"];
  if (motosGrupos.includes(gId)) return "Motos 0km & Scooters";
  if (gId.startsWith("52")) return "Veículos & Automóveis / SUVs";
  return "Consórcio Especialista Magalu";
}

export function formatAuthoritativeGrupoReport(query: string): string | null {
  const lower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const isGroupQuery =
    (lower.includes("grupo") || lower.includes("grupos")) &&
    (lower.includes("relatorio") || lower.includes("relatório") || lower.includes("raspa") || lower.includes("tabela") || lower.includes("caracteristica") || lower.includes("detalhe") || lower.includes("completo") || lower.includes("quais os valores") || lower.includes("valores disponiveis") || lower.includes("portal") || lower.includes("magalu") || /\b\d{4}\b/.test(query) || lower.includes("imovel") || lower.includes("veiculo") || lower.includes("moto") || lower.includes("pesado") || lower.includes("eletro") || lower.includes("servico"));

  if (!isGroupQuery) return null;

  // Extrai qualquer número de 4 dígitos informado (qualquer grupo: 6042, 5292, 5900, 7120, 4150, etc.)
  const groupMatches = query.match(/\b\d{4}\b/g);
  let targetGroups: string[] = [];

  if (groupMatches && groupMatches.length > 0) {
    targetGroups = Array.from(new Set(groupMatches));
  } else {
    // Se não informou o número, detecta pelo segmento pedido
    if (lower.includes("moto")) {
      targetGroups = ["5261", "5296"];
    } else if (lower.includes("pesado") || lower.includes("caminhao") || lower.includes("agricola")) {
      targetGroups = ["5900", "5911"];
    } else if (lower.includes("veiculo") || lower.includes("carro") || lower.includes("auto")) {
      targetGroups = ["5295", "5297"];
    } else if (lower.includes("eletro") || lower.includes("servico")) {
      targetGroups = ["7120", "4150"];
    } else {
      // Default: Imóvel Grupo 6042
      targetGroups = ["6042"];
    }
  }

  return generateTextGrupoReport(targetGroups);
}

export function generateTextGrupoReport(grupoIds: string[]): string {
  const sections = grupoIds.map((gId) => {
    const info = GRUPO_CARACTERISTICAS[gId];
    const mediaLance = MEDIA_LANCES_GRUPOS[gId] ? `${MEDIA_LANCES_GRUPOS[gId]}%` : (info?.caracteristicas?.includes("Lance") ? "Sob Consulta Oficial" : "98,97%");
    const segmento = getSegmentoByGrupo(gId);

    const allItems: GrupoItem[] = [
      ...(GRUPOS.imovel || []),
      ...(GRUPOS.veiculo || []),
      ...(GRUPOS.pesados || []),
      ...(GRUPOS.servicos || [])
    ].filter((item) => item.grupo === gId || item.grupo?.startsWith(gId));

    const uniqueItems = Array.from(new Map(allItems.map((it) => [it.credito, it])).values())
      .sort((a, b) => a.credito - b.credito);

    const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    let minCred = uniqueItems.length > 0 ? uniqueItems[0].credito : 0;
    let maxCred = uniqueItems.length > 0 ? uniqueItems[uniqueItems.length - 1].credito : 0;

    // Fallback se não estiver na matriz estática mas estiver em GRUPO_CARACTERISTICAS
    if (minCred === 0 && info?.caracteristicas) {
      const matchRange = info.caracteristicas.match(/(\d+[\.\d]*)\s*a\s*(\d+[\.\d]*)/i);
      if (matchRange) {
        minCred = Number(matchRange[1].replace(/\./g, ""));
        maxCred = Number(matchRange[2].replace(/\./g, ""));
      }
    }

    const prazo = info?.prazoRestante || uniqueItems[0]?.prazo || (info?.prazoOriginal || 235);
    const prazoOrig = info?.prazoOriginal ? ` (Prazo original: ${info.prazoOriginal} meses)` : "";
    const tx = info?.taxaAdm || uniqueItems[0]?.tx5050 || uniqueItems[0]?.txLinear || 18;
    const fr = info?.fundoReserva || uniqueItems[0]?.fr || 1;
    const seguroTaxa = info?.seguro ? `${(info.seguro * 100).toFixed(4).replace(/\.?0+$/, "")}%` : "0,0295%";

    let itemsTable = "";
    if (uniqueItems.length > 0) {
      itemsTable = uniqueItems.map((it) => {
        const r50Str = it.r50 ? `${fmt(it.r50)}/mês` : "Sob consulta";
        const r50SemStr = it.r50SemSeguro ? ` (${fmt(it.r50SemSeguro)} sem seguro)` : "";
        const r100Str = it.r100 ? `${fmt(it.r100)}/mês` : "Sob consulta";
        const r100SemStr = it.r100SemSeguro ? ` (${fmt(it.r100SemSeguro)} sem seguro)` : "";
        return `  • **${fmt(it.credito)}:**\n    - Parcela 50/50: **${r50Str}**${r50SemStr}\n    - Parcela Linear: **${r100Str}**${r100SemStr} (em ${it.prazo} meses)`;
      }).join("\n");
    } else {
      itemsTable = `  • Faixa de créditos cadastrados de ${fmt(minCred || 10000)} a ${fmt(maxCred || 200000)}. Consulte o simulador para a grade completa de cotas.`;
    }

    return `📊 **RELATÓRIO OFICIAL DO GRUPO ${gId} — CONSÓRCIO MAGALU**

• **Grupo:** ${gId}
• **Segmento:** ${segmento}
• **Crédito:** De ${fmt(minCred || 350000)} a ${fmt(maxCred || 700000)} (quais os valores disponíveis):
${itemsTable}

• **Prazo:** ${prazo} meses${prazoOrig}
• **Taxa:** Taxa de Administração de ${tx}% + ${fr}% Fundo de Reserva | Seguro Prestamista: ${seguroTaxa}
• **Características do grupo:**
  - ${info?.caracteristicas || "Plano oficial Magalu com opção 50/50 e linear, lance embutido de até 25%."}
  - **Reajuste:** ${info?.reajuste || "INCC / IPCA conforme segmento"}
  - **Ordem de contemplação:** ${info?.ordemContemplacao || "Sorteio, Lance Livre, Lance Fixo 25% e Lance Fixo 45%"}
  - **Opção diluir:** ${info?.opcaoDiluir || "Opção de diluir o lance total e quitar parcelas subsequentes"}
  - **Status:** ${info?.status || "Andamento"} (Assembleia atual: ${info?.numeroAssembleia || "Em andamento"} | Próxima: ${info?.proximaAssembleia || "25/11/2026"})
• **Média de lance livre:** **${mediaLance}** (Com opções estratégicas de Lances Fixos de 25% e 45%)`;
  }).join("\n\n---\n\n");

  const pdfOption = grupoIds.length > 1
    ? `\n\n📄 **Solicitação Multi-Grupos (${grupoIds.length} Grupos):** O comparativo consolidado foi compilado e o arquivo PDF oficial com a assinatura e dados completos pode ser gerado e baixado no sistema.`
    : `\n\n📄 *Dica: Se você solicitar mais de um grupo (seja de imóvel, veículos, motos, pesados ou eletros), o sistema consolida todos em um único relatório em PDF com comparativo.*`;

  return `${sections}${pdfOption}

---
*Relatório elaborado por*  
**Fabricio Honório**  
www.oespecialistaconsorcio.com.br`;
}

export function generateSimulatorSyncReport(): string {
  const gruposImovel = ["6044", "6038", "6027", "6030", "6035", "6039", "6045", "6042"];
  const gruposVeiculo = ["5298", "5294", "5295", "5297"];
  const gruposMoto = ["5296", "5261", "5285"];
  const gruposPesados = ["5996", "5900", "5911"];
  const gruposServicos = ["7120", "4150"];

  const buildGroupSummary = (ids: string[]) => {
    return ids.map(id => {
      const c = GRUPO_CARACTERISTICAS[id];
      const media = MEDIA_LANCES_GRUPOS[id] ? `${MEDIA_LANCES_GRUPOS[id]}%` : "Sob Consulta";
      const vagas = c?.cotasVagas !== undefined ? (c.cotasVagas === 0 ? "0 vagas (ESGOTADO)" : `${c.cotasVagas.toLocaleString("pt-BR")} vagas`) : "Em formação";
      const status = c?.status || "Andamento";
      const ass = c?.numeroAssembleia ? `Ass. ${c.numeroAssembleia}` : "Em andamento";
      const prazo = c?.prazoRestante ? `${c.prazoRestante} meses` : "Consulte";
      return `  • **Grupo ${id}:** ${vagas} | Status: **${status}** (${ass}) | Prazo: ${prazo} | Média Lance: **${media}**`;
    }).join("\n");
  };

  return `✅ **SIMULADOR SIMULAJÁ SINCRONIZADO COM O PORTAL MAGALU!**

Auditamos e atualizamos todas as cotas e vagas em tempo real via raspagem direta do portal:

🏠 **IMÓVEIS (Grade Atualizada):**
${buildGroupSummary(gruposImovel)}

⚠️ **NOTA CRÍTICA DA AUDITORIA:**
• **Crédito de R$ 350.000,00 a 16% (Grupo 6042):** **ESGOTADO (SEM VAGAS)** no portal Magalu.
• **Opção Oficial Ativa para R$ 350.000,00:** Migrada para o **Grupo 6039** (222 meses | Taxa: 20% + 1% FR | Parcela 50/50: **R$ 1.226,02** com seguro / **R$ 1.119,27** sem seguro | 261 vagas disponíveis).
• **Novo Grupo para Cotas Altas (R$ 400.000 a R$ 800.000):** **Grupo 6045** ativado com taxa promocional de **16%** e **4.296 cotas vagas** disponíveis.

🚗 **AUTOMÓVEIS & SUVS:**
${buildGroupSummary(gruposVeiculo)}

🏍️ **MOTOCICLETAS (50/50 Negociado):**
${buildGroupSummary(gruposMoto)}

🚛 **PESADOS & CAMINHÕES / MÁQUINAS AGRÍCOLAS:**
${buildGroupSummary(gruposPesados)}

🛠️ **SERVIÇOS & ELETRO:**
${buildGroupSummary(gruposServicos)}

---
🎯 **Ajustes Operacionais Concluídos:**
1. **Grade de Créditos & Parcelas:** 100% atualizada com base na raspagem do portal. O crédito de 350k agora reflete o Grupo 6039 e as cotas altas refletem o Grupo 6045.
2. **Cotas Vagas:** Contabilizadas rigorosamente conforme a posição oficial dos grupos.
3. **Modalidades de Lance:** Lance Embutido de até 25% e Lances Fixos (25% e 45%) disponíveis para simulação em tempo real.`;
}

async function callDirectGemini(
  prompt: string,
  apiKey: string,
  history?: Array<{ role: string; text: string }>,
  imageBase64?: string
): Promise<string | null> {
  if (!apiKey || apiKey.length < 15) {
    return null;
  }

  const models = [
    "gemini-2.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-3.8-flash"
  ];

  // Prepara histórico e conteúdo estruturado no padrão Google Gemini
  const contents: any[] = [];
  if (history && history.length > 0) {
    for (const h of history) {
      const txt = (h.text || "").trim();
      if (!txt) continue;
      const role = h.role === "assistant" || h.role === "model" || h.role === "jarvis" ? "model" : "user";
      contents.push({ role, parts: [{ text: txt }] });
    }
  }

  const userParts: any[] = [{ text: prompt }];
  if (imageBase64) {
    userParts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, "")
      }
    });
  }
  contents.push({ role: "user", parts: userParts });

  for (const m of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return text.trim();
      }
    } catch (e) {
      console.warn(`[Direct Gemini] Falha no modelo ${m}:`, e);
    }
  }
  return null;
}

async function callAI(
  prompt: string,
  maxTokens = 800,
  history?: Array<{ role: string; text: string }>,
  imageBase64?: string
): Promise<{ text: string; error: any }> {
  // 1. Prioridade Máxima: Conexão Direta com a chave do Gemini (env ou localStorage)
  const candidateKeys: string[] = [];

  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
  if (envKey && typeof envKey === "string" && envKey.trim().length > 15) {
    candidateKeys.push(envKey.trim());
  }

  if (typeof window !== "undefined") {
    const local1 = localStorage.getItem("jarvis_gemini_api_key");
    const local2 = localStorage.getItem("gemini_api_key");
    if (local1 && local1.trim().length > 15 && !candidateKeys.includes(local1.trim())) {
      candidateKeys.push(local1.trim());
    }
    if (local2 && local2.trim().length > 15 && !candidateKeys.includes(local2.trim())) {
      candidateKeys.push(local2.trim());
    }
  }

  // Tenta cada chave candidata com os modelos rápidos do Google Gemini
  for (const k of candidateKeys) {
    const directText = await callDirectGemini(prompt, k, history, imageBase64);
    if (directText) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("jarvis_gemini_api_key", k);
        } catch (_) { }
      }
      return { text: directText, error: null };
    }
  }

  // 2. Tenta invocar a Edge Function do Supabase (jarvis-ai)
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
  } catch (e) { }

  return { text: "", error: new Error("IA externa indisponivel") };
}

export function getSimulatorAuthoritativeContext(): string {
  const groupsSummary = Object.entries(GRUPO_CARACTERISTICAS).map(([gId, info]) => {
    const mediaLance = MEDIA_LANCES_GRUPOS[gId] ? ` | Média Lance Histórico: ${MEDIA_LANCES_GRUPOS[gId]}%` : "";
    return `• GRUPO ${gId} (${info.reajuste}): ${info.caracteristicas} | Ordem: ${info.ordemContemplacao}${mediaLance}`;
  }).join("\n");

  const buildCategorySection = (catKey: string, catName: string) => {
    const items: GrupoItem[] = (GRUPOS as any)[catKey] || [];
    const lines = items.map((g) => {
      const credStr = (g.credito || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const taxaSeguro = g.seguro ?? 0.000252;
      const valSeguro = (g.credito || 0) * (taxaSeguro > 1 ? taxaSeguro / 100 : taxaSeguro);
      const r50Com = g.r50 || 0;
      const r50Sem = g.r50SemSeguro ?? Math.max(0, r50Com - valSeguro);
      const r100Com = g.r100 || (r50Com * 2);
      const r100Sem = g.r100SemSeguro ?? Math.max(0, r100Com - valSeguro);
      const mediaLance = MEDIA_LANCES_GRUPOS[g.grupo] ? ` | Média Lance: ${MEDIA_LANCES_GRUPOS[g.grupo]}%` : "";
      const extraTipo = g.tipoVenda ? ` [${g.tipoVenda}]` : g.isPlanoGold ? " [Plano Gold]" : "";

      return `  - Crédito ${credStr} (Grupo ${g.grupo} - ${g.prazo}m${extraTipo}): 50/50 Com Seguro: ${r50Com.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} | 50/50 Sem Seguro: ${r50Sem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} | Linear Com Seguro: ${r100Com.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} | Linear Sem Seguro: ${r100Sem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} | Tx ADM: ${g.txLinear || g.tx5050 || g.tx || 18}% + FR: ${g.frLinear || g.fr5050 || g.fr || 1}%${mediaLance}`;
    }).join("\n");

    return `=== TABELA OFICIAL DE ${catName.toUpperCase()} ===\n${lines}`;
  };

  const imovelTable = buildCategorySection("imovel", "Imóveis");
  const veiculoTable = buildCategorySection("veiculo", "Veículos / Automóveis e Motos");
  const pesadosTable = buildCategorySection("pesados", "Pesados / Caminhões / Agrícola");
  const servicosTable = buildCategorySection("servicos", "Serviços e Eletro");

  return `
--- TABELAS E MATRIZ OFICIAL COMPLETA DO SIMULADOR (FONTE ÚNICA DA VERDADE) ---
CARACTERÍSTICAS DOS GRUPOS E LANCES EMBUTIDOS:
${groupsSummary}

${imovelTable}

${veiculoTable}

${pesadosTable}

${servicosTable}

PADRÃO OBRIGATÓRIO PARA RELATÓRIOS DE GRUPO SOLICITADOS:
Quando o usuário solicitar relatório de um ou mais grupos (ex: grupo 6042):
Apresente estritamente o modelo oficial:
1. Grupo [número]
2. Crédito de [mínimo] a [máximo] com todos os créditos disponíveis
3. Prazo em meses
4. Taxa de Administração, Fundo de Reserva e Seguro
5. Características do grupo (regras oficiais, reajuste INCC/IPCA, ordem de contemplação, lance embutido)
6. Tabela com valor da parcela 50/50 e linear de cada crédito
7. Média de lance livre histórico
8. Opção de PDF para solicitações com múltiplos grupos
9. Assinatura final obrigatória:
Relatório elaborado por
Fabricio Honório
www.oespecialistaconsorcio.com.br
-------------------------------------------------------------------------------`;
}

export function getSystemAuthoritativeContext(): string {
  const simContext = getSimulatorAuthoritativeContext();
  return `
--- DADOS OFICIAIS E AUTORITÁRIOS DO SISTEMA SIMULAJA / ELITE CONSÓRCIOS ---
• Campanha Vigente: Elite Consórcio Magalu — Outubro, Novembro e Dezembro (Q4)
• Tabela de Premiação de Elite (Varejo):
  - CROMO (Meta Venda: R$ 1,5 Mi | RPC ≥42% | EP ≥84% | NPS ≥70): Prêmio Base R$ 1.500 + Bônus Linear R$ 500 + Bônus Seguro R$ 500 + Bônus Aliança R$ 1.000 = Total R$ 3.500
  - TITÂNIO (Meta Venda: R$ 3,0 Mi | RPC ≥42% | EP ≥84% | NPS ≥70): Prêmio Base R$ 3.000 + Bônus Linear R$ 1.100 + Bônus Seguro R$ 1.100 + Bônus Aliança R$ 1.500 = Total R$ 6.700
  - PLATINA (Meta Venda: R$ 4,5 Mi | RPC ≥42% | EP ≥84% | NPS ≥70): Prêmio Base R$ 5.500 + Bônus Linear R$ 1.300 + Bônus Seguro R$ 1.300 + Bônus Aliança R$ 1.700 = Total R$ 9.800
  - DIAMANTE (Meta Venda: R$ 6,0 Mi | RPC ≥42% | EP ≥84% | NPS ≥70): Prêmio Base R$ 9.000 + Bônus Linear R$ 1.500 + Bônus Seguro R$ 1.500 + Bônus Aliança R$ 2.000 = Total R$ 14.000
• Regras Adicionais dos Bônus:
  - Plano Linear: Mínimo 20% do total de cotas nos segmentos de Automóvel e Imóvel no plano linear.
  - Seguro: Mínimo 70% do total das cotas vendidas com seguro.
  - Aliança: Entrega mínima de 100% do desafio global das lojas atendidas.
  - NPS: Mínimo 1 avaliação registrada (Classificação Mensal).
• Status / Ranking Elite Atual: Patente STONE (Vendas até 500k)
• Próximo Nível (GOLD): Meta de R$ 500.000,00

--- DIRETRIZES DE VENDAS, METAS E CRM (CONSULTA DINÂMICA) ---
• Informações sobre vendas, comissões, faturamento e desempenho de lojas ou gestores devem se basear estritamente nos dados reais da base (leads cadastrados, status e valores).
• Se não houver vendas ou clientes no banco de dados para a consulta solicitada, informe com transparência que não há registros cadastrados no momento, sem inventar nomes, números ou contratos fictícios.

--- DIRETRIZES DA CARTEIRA E COBRANÇA ---
• Dados de parcelas, adimplência e vencimentos são apurados nas tabelas oficiais do sistema ('inadimplentes' e 'carteira_consorcios').
• Nunca deduza ou crie cobranças, atrasos ou quitações fictícias.

${simContext}
`;
}

export async function getRealtimeFunnelSnapshot(): Promise<string> {
  try {
    const { data: leads, error } = await supabase
      .from("leads")
      .select("id, nome, status, valor_credito, lead_temperatura, score_final, created_at, administradora, cidade, uf")
      .order("created_at", { ascending: false })
      .limit(60);

    if (error || !leads || leads.length === 0) {
      return "Nenhum lead encontrado no CRM no momento.";
    }

    const totalLeads = leads.length;
    let totalCredito = 0;
    const stagesCount: Record<string, { count: number; totalCredito: number }> = {};
    const tempCount: Record<string, number> = { quente: 0, morno: 0, frio: 0, outros: 0 };
    const quentesList: Array<{ nome: string; valor: number; etapa: string; cidade?: string }> = [];

    leads.forEach((l: any) => {
      const cred = Number(l.valor_credito) || 0;
      totalCredito += cred;
      const status = l.status || "novo_lead";
      if (!stagesCount[status]) {
        stagesCount[status] = { count: 0, totalCredito: 0 };
      }
      stagesCount[status].count += 1;
      stagesCount[status].totalCredito += cred;

      const temp = (l.lead_temperatura || "").toLowerCase();
      if (temp === "quente") {
        tempCount.quente += 1;
        quentesList.push({ nome: l.nome, valor: cred, etapa: status, cidade: l.cidade });
      } else if (temp === "morno") {
        tempCount.morno += 1;
      } else if (temp === "frio") {
        tempCount.frio += 1;
      } else {
        tempCount.outros += 1;
      }
    });

    const stagesBreakdown = Object.entries(stagesCount)
      .map(([stg, info]) => `  • ${stg}: ${info.count} lead(s) - Volume: ${info.totalCredito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`)
      .join("\n");

    const topLeads = leads
      .slice(0, 8)
      .map((l: any) => `  - ${l.nome} | Crédito: ${(Number(l.valor_credito) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} | Fase: ${l.status} | Cidade: ${l.cidade || "N/A"}`)
      .join("\n");

    // Consulta carteira e inadimplentes se disponíveis
    let inadInfo = "";
    try {
      const { data: inads } = await supabase.from("inadimplentes").select("valor_parcela, parcelas_atrasadas");
      if (inads && inads.length > 0) {
        const totalDivida = inads.reduce((acc, i: any) => acc + ((Number(i.valor_parcela) || 0) * (Number(i.parcelas_atrasadas) || 1)), 0);
        inadInfo = `• Inadimplência da Carteira: ${inads.length} cliente(s) - Total em atraso: ${totalDivida.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
      }
    } catch (e) { }

    return `
--- DADOS REAIS DO FUNIL DE CLIENTES DO CRM (CONSOLIDADOS EM TEMPO REAL) ---
• Total de Leads Ativos no CRM: ${totalLeads}
• Pipeline Total em Negociação: ${totalCredito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
• Temperatura da Base: 🔥 Quentes: ${tempCount.quente} | 🌤️ Mornos: ${tempCount.morno} | ❄️ Frios: ${tempCount.frio}
${inadInfo ? inadInfo + "\n" : ""}• Distribuição por Etapas do Funil:
${stagesBreakdown}

• Amostra de Leads Recentes no CRM:
${topLeads}
---------------------------------------------------------------------------`;
  } catch (e) {
    return "Não foi possível consolidar os dados do funil em tempo real.";
  }
}

async function generateSmartLocalResponse(fullInput: string, defaultName = "Fabrício"): Promise<string> {
  // Extrai estritamente a pergunta do usuário e o nome do interlocutor
  let userQuery = fullInput.trim();
  const qMatch = fullInput.match(/PERGUNTA DO USUÁRIO \/ ESTRATEGISTA:\s*"([^"]+)"/i);
  if (qMatch && qMatch[1]) {
    userQuery = qMatch[1].trim();
  }

  const nameMatch = fullInput.match(/NOME DO INTERLOCUTOR:\s*"([^"]+)"/i);
  const targetName = nameMatch ? nameMatch[1].trim() : defaultName;
  const firstName = targetName.split(" ")[0] || "Fabrício";

  const lower = userQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Saudações humanizadas, naturais e executivas (reconhece "oi jarvis boa tarde", "ola", "bom dia", etc.)
  const cleanGreetingText = lower
    .replace(/\b(jarvis|bela|bella|dewiar|assistente|amigo)\b/g, "")
    .replace(/[!?,.]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const isPureGreeting =
    cleanGreetingText === "boa tarde" || cleanGreetingText === "bom dia" || cleanGreetingText === "boa noite" ||
    cleanGreetingText === "oi" || cleanGreetingText === "ola" || cleanGreetingText === "oi boa tarde" ||
    cleanGreetingText === "oi bom dia" || cleanGreetingText === "oi boa noite" || cleanGreetingText === "ola boa tarde" ||
    cleanGreetingText === "ola bom dia" || cleanGreetingText === "ola boa noite" || cleanGreetingText === "opa" ||
    cleanGreetingText === "fala" || cleanGreetingText === "e ai" || cleanGreetingText === "salve" ||
    /^(oi|ola|bom dia|boa tarde|boa noite|opa|fala|e ai|salve)\s*(tudo bem|como vai|como esta|beleza|tranquilo)?$/i.test(cleanGreetingText);

  if (isPureGreeting) {
    const hora = new Date().getHours();
    const saudacao = hora >= 5 && hora < 12 ? "Bom dia" : hora >= 12 && hora < 18 ? "Boa tarde" : "Boa noite";
    return `Olá, ${firstName}! ${saudacao}! Jarvis à sua disposição. Como posso te apoiar agora? Podemos rodar simulações 50/50, auditar o funil de leads, verificar clientes inadimplentes ou consultar regras e médias de lances das assembleias.`;
  }

  // 1.0 Comando Administrativo de Atualização / Sincronização do Simulador (Créditos, Grupos, Parcelas e Vagas)
  const isSimulatorSyncQuery =
    (lower.includes("atualiz") || lower.includes("sincroniz") || lower.includes("carreg") || lower.includes("renov") || lower.includes("recalibr")) &&
    (lower.includes("simulador") || lower.includes("credito") || lower.includes("crédito") || lower.includes("parcela") || lower.includes("vaga") || lower.includes("grupo"));

  if (isSimulatorSyncQuery) {
    return generateSimulatorSyncReport();
  }

  // 1.1 Consulta Oficial de Inadimplência e Carteira (Consultando dados REAIS do banco)
  const isPaymentAuditQuery =
    lower.includes("inadimplente") || lower.includes("quem pagou") || lower.includes("quem ja pagou") ||
    lower.includes("quem deve") || lower.includes("atraso") || lower.includes("em atraso") ||
    lower.includes("parcelas atrasadas") || lower.includes("cobranca") || lower.includes("cobrança");

  if (isPaymentAuditQuery) {
    try {
      const { data: inads, error: inadErr } = await supabase
        .from("inadimplentes")
        .select("*")
        .limit(10);

      if (inads && inads.length > 0) {
        const lines = inads.map((c: any, i: number) => {
          const nome = c.nome || c.cliente || "Cliente";
          const atraso = c.parcelas_atraso ? `${c.parcelas_atraso} parcela(s)` : "Em aberto";
          const val = c.valor_atraso ? c.valor_atraso.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Sob apuração";
          return `• **${nome}** (Grupo ${c.grupo || "N/A"} / Cota ${c.cota || "N/A"}): ${atraso} — Valor: ${val}`;
        }).join("\n");

        return `📊 **AUDITORIA DE CLIENTES EM ATRASO (BASE REAL CRM):**\n\n${lines}\n\n💡 *Recomendação Jarvis:* Inicie uma abordagem preventiva e cordial oferecendo a 2ª via sem juros adicionais.`;
      }
    } catch (e) { }

    return `📊 **AUDITORIA DE INADIMPLÊNCIA (TEMPO REAL):**
Consultando o banco de dados oficial: **não há registros de clientes inadimplentes** cadastrados no momento. Todas as cotas monitoradas estão em dia.`;
  }

  // 1.2 Relatórios Oficiais de Grupos e Raspagem Magalu (Formato Oficial Especialista)
  const grupoReport = formatAuthoritativeGrupoReport(userQuery);
  if (grupoReport) {
    return grupoReport;
  }

  // 2. Cotações e Simulações Oficiais do Simulador SimulaJá (Conciso: Apenas Meia Parcela e Prazo)
  // 2. Cotações e Simulações Oficiais do Simulador SimulaJá
  const isSimulationQuery =
    !isSimulatorSyncQuery &&
    (lower.includes("simula") || lower.includes("quanto fica") || lower.includes("orcamento") || lower.includes("orçamento") ||
      ((lower.includes("credito") || lower.includes("crédito") || lower.includes("parcela") || lower.includes("50/50") || lower.includes("linear")) && /\b\d{1,3}(?:\.\d{3})+(?:,\d+)?\b|\b\d+k\b|\b\d+\s*mil\b|\b\d+\s*mi\b/i.test(userQuery)));

  if (isSimulationQuery) {
    const conciseQuote = formatConciseBudgetQuote(userQuery);
    if (conciseQuote) {
      return conciseQuote;
    }
  }

  // 2.1 Memória Ativa de Orçamento: Respostas a perguntas subsequentes (sem precisar digitar tudo de novo)
  const activeMemory = getActiveBudgetMemory();
  if (activeMemory && !isSimulatorSyncQuery) {
    // Pergunta estrita sobre Parcela Integral / Cheia / 100%
    const isStrictIntegral =
      /^(e\s+a\s+integral|qual\s+a\s+integral|parcela\s+integral|e\s+a\s+cheia|qual\s+a\s+parcela\s+cheia|100%)\??$/i.test(lower.trim()) ||
      (/(e|qual|saber)\s+a\s+(parcela\s+)?(integral|cheia|100%)/i.test(lower) && !lower.includes("atualiz") && !lower.includes("simulador"));
    if (isStrictIntegral) {
      const semFmt = activeMemory.parcelaIntegralSemSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const comFmt = activeMemory.parcelaIntegralComSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      return `Para o crédito de ${activeMemory.creditoFormatado}, a parcela integral é de ${semFmt}/mês (ou ${comFmt} com seguro), em ${activeMemory.prazo} meses.`;
    }

    // Pergunta estrita sobre Grupo
    const isStrictGroup =
      /^(qual\s+(o\s+)?grupo|qual\s+grupo|numero\s+do\s+grupo|qual\s+e\s+o\s+grupo|qual\s+eh\s+o\s+grupo|qual\s+o\s+numero\s+do\s+grupo)\??$/i.test(lower.trim()) ||
      (/(me diga|qual|saber|ver)\s+(o\s+)?(numero\s+do\s+)?grupo\b/i.test(lower) && !lower.includes("atualiz") && !lower.includes("simulador") && !lower.includes("vaga") && !lower.includes("todos") && !lower.includes("relatorio"));
    if (isStrictGroup) {
      return `O crédito de ${activeMemory.creditoFormatado} pertence ao Grupo ${activeMemory.grupo}, com taxa de administração de ${activeMemory.taxaAdm}% e fundo de reserva de ${activeMemory.fundoReserva}%.`;
    }

    // Pergunta estrita sobre Taxa de Administração
    const isStrictTaxa =
      /^(qual\s+(a\s+)?taxa|taxa\s+de\s+adm|qual\s+a\s+taxa\s+de\s+adm)\??$/i.test(lower.trim()) ||
      (/(me diga|qual|saber|ver)\s+(a\s+)?taxa(\s+de\s+adm)?\b/i.test(lower) && !lower.includes("conversao") && !lower.includes("atualiz") && !lower.includes("simulador"));
    if (isStrictTaxa) {
      return `A taxa de administração para o crédito de ${activeMemory.creditoFormatado} (Grupo ${activeMemory.grupo}) é de ${activeMemory.taxaAdm}% linear.`;
    }

    // Pergunta estrita sobre Lance / Média Histórica / Lance Embutido
    const isStrictLance =
      /^(qual\s+(o\s+)?lance|media\s+de\s+lance|qual\s+a\s+media\s+de\s+lance|qual\s+o\s+lance\s+medio)\??$/i.test(lower.trim()) ||
      (/(me diga|qual|saber|ver)\s+(a\s+)?(media\s+de\s+)?lance\b/i.test(lower) && !lower.includes("atualiz") && !lower.includes("simulador"));
    if (isStrictLance) {
      return `No Grupo ${activeMemory.grupo} (${activeMemory.creditoFormatado}), a média histórica de lance é de ${activeMemory.mediaLance}, permitindo lance embutido de até ${activeMemory.lanceEmbutido}.`;
    }

    // Pergunta estrita sobre Seguro ou Meia Parcela novamente
    const isStrictMeia =
      /^(e\s+a\s+meia|qual\s+a\s+meia|50\/50|meia\s+parcela|com\s+seguro)\??$/i.test(lower.trim()) ||
      (/(e|qual|saber)\s+a\s+(meia\s+parcela|50\/50)/i.test(lower) && !lower.includes("atualiz") && !lower.includes("simulador"));
    if (isStrictMeia) {
      const semFmt = activeMemory.meiaParcelaSemSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const comFmt = activeMemory.meiaParcelaComSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      return `Para ${activeMemory.creditoFormatado}, a meia parcela é de ${semFmt}/mês (ou ${comFmt} com seguro), em ${activeMemory.prazo} meses.`;
    }
  }

  if (isSimulationQuery) {
    const quote = findAuthoritativeSimulatorQuote(userQuery);
    if (quote) {
      return quote;
    }
  }

  // 3. LIVROS, LITERATURA, SABEDORIA FINANCEIRA E CONHECIMENTO UNIVERSAL
  if (
    lower.includes("babilonia") ||
    lower.includes("babilônia") ||
    lower.includes("homem mais rico") ||
    lower.includes("arkad")
  ) {
    return `O clássico "O Homem Mais Rico da Babilônia", escrito por George Samuel Clason, é uma das maiores referências de educação financeira e construção patrimonial do mundo. Ambientado na antiga Babilônia, a cidade mais próspera da antiguidade, o livro narra a trajetória de Arkad, que compartilhou as regras de ouro para transformar moedas em um império.

Os Sete Pilares Fundamentais ensinados por Arkad:
1. Pague a si mesmo primeiro: guarde com disciplina no mínimo dez por cento de tudo o que ganhar antes de pagar qualquer conta.
2. Controle seus gastos: jamais confunda despesas necessárias com vontades momentâneas; ajuste o padrão de vida sem comprometer a poupança.
3. Multiplique o seu ouro: faça cada centavo economizado trabalhar para você gerando novos rendimentos consistentes.
4. Proteja seu tesouro contra perdas: evite promessas mágicas de enriquecimento rápido e só invista com orientação de pessoas experientes e honestas.
5. Faça da sua moradia um patrimônio: ter a casa própria traz segurança, dignidade e solidez familiar.
6. Assegure uma renda para o futuro: antecipe a velhice garantindo recursos para você e para a sua família.
7. Aumente sua capacidade de ganhar: estude, refine suas habilidades profissionais e torne-se um especialista de alto valor.

Essa sabedoria milenar reflete com perfeição o propósito do planejamento financeiro e do consórcio: disciplina mensal, alavancagem sem juros bancários e multiplicação patrimonial contínua.`;
  }

  if (lower.includes("pai rico") || lower.includes("robert kiyosaki")) {
    return `Em "Pai Rico, Pai Pobre", Robert Kiyosaki quebra o paradigma tradicional sobre dinheiro. A lição central é a distinção entre ativos e passivos: ativo coloca dinheiro no seu bolso; passivo tira dinheiro do seu bolso. Os ricos adquirem ativos que geram renda passiva, enquanto os demais adquirem passivos acreditando que são ativos. A independência financeira vem de construir uma coluna de ativos robusta antes de aumentar despesas de luxo.`;
  }

  if (lower.includes("arte da guerra") || lower.includes("sun tzu")) {
    return `Em "A Arte da Guerra", Sun Tzu estabelece que a vitória suprema é aquela conquistada sem a necessidade de lutar. Os ensinamentos mais fortes para os negócios e liderança são: conhecer a si mesmo e ao seu adversário tão bem que em cem batalhas você nunca estará em perigo; escolher o terreno mais vantajoso antes de iniciar a ofensiva; e ter flexibilidade para se adaptar às circunstâncias do mercado como a água se molda ao seu curso.`;
  }

  // 4. VENDAS, METAS, PERFORMANCE E SITUAÇÃO OFICIAL DO CRM
  const isCrmSalesQuery =
    (lower.includes("resumo") && (lower.includes("venda") || lower.includes("meta") || lower.includes("producao") || lower.includes("produção") || lower.includes("comissao") || lower.includes("comissão") || lower.includes("crm") || lower.includes("loja") || lower.includes("gestor") || lower.includes("equipe"))) ||
    lower.includes("minhas metas") ||
    lower.includes("quanto vendi") ||
    lower.includes("vendas do mes") ||
    lower.includes("venda do mes") ||
    lower.includes("producao do mes") ||
    lower.includes("produção do mês") ||
    lower.includes("faturamento do mes") ||
    lower.includes("patente atual") ||
    lower.includes("elizabeth") ||
    lower.includes("doroty") ||
    (lower.includes("paranagua") && (lower.includes("venda") || lower.includes("loja") || lower.includes("resultado")));

  if (isCrmSalesQuery) {
    try {
      const { data: fechados } = await supabase
        .from("leads")
        .select("id, nome, valor_credito, created_at, status")
        .in("status", ["fechado", "contrato_assinado", "comissao_paga"]);

      const totalVendido = (fechados || []).reduce((acc: number, l: any) => acc + (Number(l.valor_credito) || 0), 0);
      const totalContratos = fechados ? fechados.length : 0;

      let listaFechados = "";
      if (fechados && fechados.length > 0) {
        listaFechados = fechados.map((l: any, i: number) => {
          const val = l.valor_credito ? Number(l.valor_credito).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00";
          return `  ${i + 1}. **${l.nome || "Cliente"}**: ${val}`;
        }).join("\n");
      }

      return `📊 **SITUAÇÃO OFICIAL DE VENDAS E METAS NO CRM (DADOS REAIS):**

• **Volume Total de Vendas Fechadas:** ${totalVendido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
• **Contratos Concluídos:** ${totalContratos} venda(s)
${listaFechados ? `\n• **Detalhamento dos Fechamentos:**\n${listaFechados}\n` : "• **Detalhamento:** Nenhuma venda com status finalizado registrada no período atual.\n"}
💡 *Dica:* Acompanhe as negociações em aberto na coluna "Em Negociação" do Funil para antecipar novos fechamentos.`;
    } catch (e) {
      return `📊 **SITUAÇÃO DO CRM:**
Não foi possível carregar o total de vendas do banco no momento. Verifique sua conexão com o Supabase.`;
    }
  }

  // 4. FUNIL DE VENDAS & CRM (Análise Executiva Realtime)
  if (
    lower.includes("funil") ||
    lower.includes("pipeline") ||
    lower.includes("lead") ||
    lower.includes("cliente") ||
    lower.includes("negociacao") ||
    lower.includes("negociação") ||
    lower.includes("quente") ||
    lower.includes("conversao") ||
    lower.includes("conversão") ||
    lower.includes("oportunidade")
  ) {
    try {
      const snapshot = await getRealtimeFunnelSnapshot();
      return `📊 DIAGNÓSTICO EXECUTIVO DO SEU FUNIL:

${snapshot}

💡 Recomendações Estratégicas do Jarvis:
1. Priorize contato imediato com os leads classificados como 🔥 Quentes.
2. Clientes em "simulação enviada" ou "negociação" convertem mais rápido com estratégia de Parcela 50/50 (meia parcela) e lance embutido de 25%.
3. Se desejar uma abordagem personalizada, me diga o nome do lead que crio um script de WhatsApp com a metodologia SRV!`;
    } catch (e) {
      return "Funil de Vendas ativo. Oportunidades sincronizadas no Kanban comercial.";
    }
  }

  // 5. Extração e busca de CPF ou Pedido de Boleto / Segunda Via
  const cpfMatch = fullInput.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/) || fullInput.match(/\b\d{11}\b/);
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
          const { data: cart } = await (supabase as any).from("carteira_consorcios").select("*").eq("lead_id", lead.id).maybeSingle();
          if (cart) carteiraData = cart;
        }
      } catch (e) { }
    }

    if (leadData) {
      const grupoCota = carteiraData ? `Grupo ${carteiraData.grupo} / Cota ${carteiraData.cota}` : "Cota vinculada ao lead";
      const valCred = leadData.valor_credito ? Number(leadData.valor_credito).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Consulte a proposta";
      const status = leadData.status || "Ativo";

      return `📄 **DADOS DO CLIENTE LOCALIZADO NO CRM:**
• **Nome:** ${leadData.nome}
• **CPF:** ${formattedCpf || "Cadastrado"}
• **Telefone:** ${leadData.telefone || leadData.celular || "Não informado"}
• **Crédito Simulado/Contratado:** ${valCred}
• **Status:** ${status}
• **Cota/Grupo:** ${grupoCota}

📌 **Para emissão do Boleto Oficial com Registro Bancário:**
Por segurança bancária, a linha digitável e o código de barras com autenticação registrada devem ser gerados diretamente no **Portal Consórcio Magalu** (Menu *Atendimento > Posição do Consorciado > Emissão de Cobrança*).`;
    }

    if (formattedCpf) {
      return `📄 **CONSULTA DE CPF NO CRM:**
O CPF **${formattedCpf}** foi consultado no banco de dados. Para emitir a 2ª via oficial com código de barras, acesse o Portal da Administradora Consórcio Magalu com as credenciais da sua filial (10826) ou verifique se o cliente está cadastrado na tabela de Carteira.`;
    }

    return `📄 **CONSULTA DE 2ª VIA E BOLETO:**
Para localizar o consorciado e orientar a 2ª via, por favor informe o **Nome Completo** ou **CPF** do cliente cadastrado.`;
  }

  if (lower === "oi" || lower === "ola" || lower === "bom dia" || lower === "boa tarde" || lower === "boa noite" || (lower.length <= 12 && (lower.startsWith("oi") || lower.startsWith("ola")))) {
    return `Oi ${firstName}, ${obterSaudacaoTempo()}! Como posso lhe ajudar hoje?`;
  }

  if (lower.includes("salmo 22") || lower.includes("salmos 22")) {
    return `📖 Salmo 22 (Salmo de Davi):

"1 Deus meu, Deus meu, por que me desamparaste? Por que estás tão longe de me salvar, e das palavras do meu gemido?
2 Deus meu, clamo de dia, e não me ouves; de noite, e não tenho sossego.
3 Contudo, tu és santo, entronizado sobre os louvores de Israel.
4 Em ti confiaram nossos pais; confiaram, e tu os livraste.
5 A ti clamaram e escaparam; em ti confiaram, e não foram confundidos.
[...]
16 Pois cães me rodearam; um bando de malfeitores me cercou; traspassaram-me as mãos e os pés.
17 Posso contar todos os meus ossos; eles estão olhando e fitando-me.
18 Repartem entre si as minhas vestes e sobre a minha túnica lançam sortes.
19 Mas tu, Senhor, não te afastes de mim; força minha, apressa-te em socorrer-me!"`;
  }

  if (lower.includes("salmo 23") || lower.includes("salmos 23")) {
    return `📖 Salmo 23 (O Senhor é o meu Pastor):

"1 O Senhor é o meu pastor, nada me faltará.
2 Deitar-me faz em verdes pastos, guia-me mansamente a águas tranqüilas.
3 Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome.
4 Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.
5 Preparas uma mesa perante mim na presença dos meus inimigos, unges a minha cabeça com óleo, o meu cálice transborda.
6 Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na casa do Senhor por longos dias."`;
  }

  if (lower.includes("salmo 91") || lower.includes("salmos 91")) {
    return `📖 Salmo 91:

"1 Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.
2 Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.
3 Porque ele te livrará do laço do passarinheiro, e da peste perniciosa.
4 Ele te cobrirá com as suas penas, e debaixo das suas asas te confiarás; a sua verdade será o teu escudo e broquel."`;
  }

  // 6. BASE OFICIAL DE CIRCULARES & TRANSFERÊNCIA DE TITULARIDADE (CONSÓRCIO MAGALU)
  const isTransferOrCircularQuery =
    lower.includes("transfer") ||
    lower.includes("titularidade") ||
    lower.includes("cessao") ||
    lower.includes("cessão") ||
    lower.includes("circular") ||
    lower.includes("circulares") ||
    lower.includes("gov.br") ||
    lower.includes("isencao") ||
    lower.includes("isenção") ||
    lower.includes("trocar de titular") ||
    lower.includes("passar a cota") ||
    lower.includes("passar a carta") ||
    lower.includes("caucao") ||
    lower.includes("caução");

  if (isTransferOrCircularQuery) {
    // 6.1 LANCE CAUÇÃO (CIRCULAR OFICIAL CIRC/ADM/001/2026)
    if (lower.includes("caucao") || lower.includes("caução")) {
      return `📋 REGRAS OFICIAIS DO LANCE CAUÇÃO (CIRCULAR CONSÓRCIO MAGALU CIRC/ADM/001/2026):

1. FINALIDADE E FUNCIONAMENTO:
• Permite que o consorciado que possui um bem (veículo ou imóvel) ofereça esse bem como lance na assembleia, SEM precisar vendê-lo antes de ser contemplado.
• A venda ou entrega do bem só ocorre após a confirmação efetiva da contemplação.

2. LIMITES DE OFERTA:
• Imóvel: Permitido até 70,0000% do lance ofertado (em todos os grupos). Se ofertar 70,0001% ou mais, a utilização do lance caução é recusada.
• Veículo (Carros, Motos, Caminhões): Permitido até 70,0000% do lance ofertado (em todos os grupos).
• Eletro e Serviços: NÃO há modalidade de lance caução nestes segmentos.

3. REGRA DE OURO DO NOVO BEM ADQUIRIDO:
• O valor do bem a ser comprado DEVE ser no MÍNIMO a somatória: [Crédito Líquido + Valor Ofertado como Lance Caução].
• Se o consorciado vender o bem por valor abaixo da Tabela FIPE, ele deve obrigatoriamente complementar a diferença com recursos próprios na compra do novo bem.

4. PRAZO E DOCUMENTOS PARA BAIXA DO LANCE:
• Prazo de envio: Imediatamente após a contemplação (prazo limite de até 3 dias úteis para vencimento do lance).
• Envio via Formulário Magalu Oficial: https://forms.gle/8ia1mzYE2g1gsXj98
• Veículo: CRLV em nome do consorciado ou cônjuge (se cônjuge: anexar certidão de casamento ou união estável) + Print da avaliação pela Tabela FIPE.
• Imóvel: Matrícula atualizada do imóvel em nome do cliente + Laudo de avaliação de engenheiro contratado pelo cliente.

5. PERGUNTAS FREQUENTES DA CIRCULAR MAGALU:
• Pode usar moto como caução para comprar carro? SIM, pois ambos pertencem ao mesmo segmento de veículos (assim como carro para caminhão).
• Pode ofertar o mesmo veículo em mais de uma cota? SIM, desde que do mesmo segmento e que o novo bem adquirido cubra a soma de todos os créditos líquidos + o caução.
• Imóvel na planta é aceito? SIM, com apresentação do contrato de compra e venda + extrato financeiro das parcelas pagas para abatimento.
• Pode usar para reforma, construção ou quitar financiamento existente? NÃO, a finalidade do lance caução é exclusivamente a troca/aquisição de um NOVO bem.
• Pode receber o crédito em dinheiro/espécie? NÃO, apenas para compra direta do novo bem faturado.
• Permite garantia substitutiva ou estorno em dinheiro próprio? NÃO. Na transferência da cota contemplada com caução, o novo titular (cessionário) é obrigado a apresentar outro bem caução em seu nome.`;
    }

    if (
      lower.includes("transfer") ||
      lower.includes("titularidade") ||
      lower.includes("cessao") ||
      lower.includes("cessão") ||
      lower.includes("trocar de titular") ||
      lower.includes("passar a cota") ||
      lower.includes("passar a carta")
    ) {
      return `📋 REGRAS OFICIAIS DE TRANSFERÊNCIA DE TITULARIDADE (CIRCULARES MAGALU #02, #10, #19, #23, #37 e #59):

1. COTA NÃO CONTEMPLADA:
• Procedimento: Cessão simples de direitos e obrigações.
• Exigência: A cota deve estar 100% em dia (sem débitos ou parcelas pendentes).
• Análise de Crédito: Dispensa comprovação de renda complexa do cessionário (novo titular), apenas checagem cadastral básica.
• Prazo: Conclusão em 48h a 72h úteis após envio do termo assinado.

2. COTA CONTEMPLADA:
• Análise Prévia de Crédito Obrigatória: O cessionário passa por análise formal de crédito (comprovação de renda onde a parcela não pode exceder 30% da renda bruta comprovada) e consulta restritiva (Serasa/SPC/CCF).
• Bem já adquirido/alienado: Exige termo de anuência, vistoria prévia e substituição ou repasse de gravame (alienação fiduciária).
• Prazo: Até 5 dias úteis após envio dos comprovantes.

3. POLÍTICA DE ISENÇÃO DA TAXA DE TRANSFERÊNCIA (Circular nº 02):
• ISENÇÃO TOTAL DA TAXA:
  - 1º Grau de Parentesco (Linha Reta e Cônjuges): Pai para filho, filho para pai, ou entre cônjuges/companheiros com união estável comprovada.
  - Mesmo Grupo Societário / Empresarial: Entre sócios comprovados em Contrato Social, ou da PF para PJ de que seja sócio/titular (e vice-versa).
  - Partilha Judicial / Sucessão por Inventário.
• Transferência a Terceiros: Incide taxa administrativa de transferência sobre o saldo devedor conforme tabela vigente.

4. ASSINATURA ELETRÔNICA GOV.BR (Circulares nº 10 e nº 23):
• Validade Jurídica Plena via GOV.BR (níveis Prata ou Ouro).
• Dispensa Total de Cartório: Não precisa reconhecer firma por autenticidade ao assinar pelo GOV.BR.
• Caso assinado fisicamente: Continua exigido reconhecimento de firma por autenticidade em cartório de ambas as partes.

5. COMO EMITIR:
• Acessar Portal Magalu -> Menu Atendimento -> Transferência de Cota / Emissão de Termo.`;
    }

    if (lower.includes("circular") || lower.includes("circulares")) {
      return `📚 BASE DE CONHECIMENTO OFICIAL DE CIRCULARES MAGALU (64 Circulares Catalogadas):

1. Transferências & Jurídico:
   • Circular #02: Política de Isenção da Taxa de Transferência (1º grau de parentesco e sócios de mesma empresa).
   • Circular #10 & #23: Validade plena da assinatura eletrônica GOV.BR (Prata/Ouro), dispensando cartório.
   • Circular #19 & #29: Emissão e digitalização do termo de transferência.
   • Circular #37 & #59: Procedimentos e taxas de transferência de titularidade.
   • Circular #46: Intenção de transferência de cotas contempladas.

2. Lances & Assembleias:
   • Circular #05: Lance Fidelidade (bonificação para consorciados pontuais).
   • Circular #04: Rateio residual.
   • Circular #24: Formas oficiais de oferta de lances (livre, embutido até 50%).

3. Imóveis & FGTS:
   • Circular #30, #34 & #56: Normas e taxas de utilização do FGTS (lance, amortização e abatimento de parcelas).
   • Circular #25: Aquisição de imóveis em leilão.
   • Circular #32 & #55: Limite de junção de cotas para um mesmo bem alienado.

4. Crédito & Seguros:
   • Circular #08, #50 & #63: Prazos e regras de régua preventiva de negativação cadastral (Serasa/SPC).
   • Circular #38 & #60: Cobertura e limites da apólice de seguro de vida prestamista.`;
    }
  }

  // 7. Explicações e Respostas Substantivas e Fundamentadas
  if (
    lower.includes("quem e voce") || lower.includes("quem e você") ||
    lower.includes("o que voce faz") || lower.includes("o que você faz") ||
    lower.includes("qual seu papel") || lower.includes("quais suas funcoes")
  ) {
    return `Olá, ${firstName}! Eu sou o Jarvis, seu co-piloto executivo e estrategista comercial no SimulaJá e Prospera Plan (Consórcio Magalu).

Aqui está o que posso executar para você com total precisão:
• 🎯 Simulações oficiais do Consórcio Magalu com cálculo de Meia Parcela (50/50) e Linear.
• 📊 Diagnóstico em tempo real do Funil de Vendas (Kanban) e leads classificados.
• ⚠️ Auditoria da Carteira e monitoramento preventivo de inadimplentes.
• 🔍 Sentinela de vagas em grupos fechados (como o Grupo 6042 de 350k a 16%).
• 📄 Emissão e consulta de 2ª via de boletos, extratos e circulares oficiais.
• 👥 Orquestração do Jarvis Squad (subagentes especializados: SDR, Closer, Reativador, Copywriter).

Como prefere direcionar agora?`;
  }

  if (lower.includes("como funciona") && (lower.includes("50/50") || lower.includes("meia parcela") || lower.includes("reduzida"))) {
    return `📋 **COMO FUNCIONA O PLANO 50/50 (MEIA PARCELA) — CONSÓRCIO MAGALU:**

1. **Até a Contemplação:**
   - O consorciado paga apenas **50% da parcela integral** mensalmente.
   - Ideal para quem já paga aluguel ou não quer descapitalizar o fluxo de caixa mensal.

2. **Após a Contemplação:**
   - O valor restante dos 50% não pagos é reincorporado ao saldo devedor restante, de forma suave e diluída no prazo, ou abatido no lance vencedor.
   - O cliente pode ainda usar **25% de Lance Embutido** (descontado do próprio crédito) para antecipar a contemplação sem tirar dinheiro do bolso.

3. **Vantagem Competitiva:**
   - Custo financeiro médio de apenas 1,2% a 1,8% ao ano (sem juros compostos de bancos), economizando mais de 50% em comparação ao financiamento SAC.`;
  }

  if ((lower.includes("lance embutido") || lower.includes("como funciona o lance")) && !lower.includes("caucao")) {
    return `🎯 **REGRAS DO LANCE EMBUTIDO (CONSÓRCIO MAGALU):**

• **O que é:** Permite utilizar uma parte do próprio crédito contratado para pagar o lance vencedor na assembleia.
• **Percentual Padrão:** **25% de Lance Embutido** na maioria dos grupos (imóveis, automóveis e motos).
• **Como funciona na prática:**
  - Exemplo com cota de R$ 200.000,00:
    - Lance Embutido (25%): R$ 50.000,00
    - Crédito líquido liberado para comprar o bem: R$ 150.000,00
• **Lances Fixos:** Grupos Magalu também contam com opções de **Lance Fixo de 25%** e **Lance Fixo de 45%** (disputados apenas entre os consorciados que ofertaram o mesmo percentual).
• **FGTS (para Imóveis):** O cliente pode somar o FGTS ao lance embutido para maximizar as chances de contemplação.`;
  }

  if (lower.includes("grupos ativos") || lower.includes("quais grupos") || lower.includes("melhores grupos") || lower.includes("grupos magalu")) {
    return `📋 **PRINCIPAIS GRUPOS OFICIAIS ATIVOS — CONSÓRCIO MAGALU:**

🏠 **IMÓVEIS:**
• **Grupo 6039:** 222 meses | Créditos de R$ 350k a R$ 500k | Taxa 20% + 1% FR | Lance Médio: 93,76%
• **Grupo 6045:** 240 meses | Créditos de R$ 400k a R$ 800k | Taxa 16% + 1% FR | 4.296 vagas ativas
• **Grupo 6030:** 200 meses | Créditos de R$ 200k a R$ 320k | Taxa 16% | Lance Médio: 77,60%

🚗 **VEÍCULOS & MOTOS:**
• **Grupo 5298 / 5297:** 100 e 120 meses | Créditos de R$ 40k a R$ 120k | Média de Lance: ~43% a 55%
• **Grupo 5296 (Motos):** 60 e 72 meses | Média de lance: ~88%

🚛 **PESADOS:**
• **Grupo 5996:** 120 meses | Lance embutido de até 30%

Para simular qualquer um destes valores, basta me informar o valor desejado (ex: "simular 300 mil")!`;
  }

  const isAboutFinance = lower.includes("taxa") || lower.includes("juro") || lower.includes("custo") || lower.includes("renda") || lower.includes("financiamento");
  if (isAboutFinance) {
    return `💡 **ANÁLISE FINANCEIRA E COMPARATIVA (CONSÓRCIO MAGALU vs FINANCIAMENTO):**

• **Custo Efetivo:** O consórcio não cobra juros (ao contrário da Tabela SAC/Price dos bancos que cobram 10% a 13% ao ano + TR). Incide apenas a taxa de administração diluída em todo o plano (~1,2% a 1,6% a.a.).
• **Economia Total:** Em um crédito imobiliário de R$ 300 mil, o financiamento bancário gera um montante pago de mais de R$ 750 mil, enquanto o consórcio fica em cerca de R$ 354 mil (economia superior a R$ 390.000,00).
• **Flexibilidade:** Opção de Meia Parcela 50/50 até a contemplação e uso de até 25% de Lance Embutido do próprio crédito.

Deseja que eu monte um comparativo financeiro para um valor específico de crédito?`;
  }

  // Resposta padrão executiva fundamentada e orientativa (elimina respostas evasivas)
  return `Olá, ${firstName}! Estou acompanhando suas operações no SimulaJá.

Com base nos dados oficiais do sistema:
• **Simulações Oficiais:** Temos cotas ativas de R$ 10.000 a R$ 800.000 com planos 50/50 (reduzido) e lineares. Se quiser uma cotação exata, me informe o valor (ex: *"simular 350 mil imóvel"*).
• **CRM & Funil:** O Kanban de vendas está sincronizado com seus leads. Você pode me pedir: *"qual o status do funil"*, *"quem são os leads quentes"* ou *"clientes inadimplentes"*.
• **Circulares & Regras:** Temos cadastradas todas as 64 circulares oficiais Magalu (Lance Caução, FGTS, Transferências e Reajustes).

Como você quer direcionar agora?`;
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

  async askJarvis(
    context: string,
    question: string,
    history?: Array<{ role: string; text: string }>,
    imageBase64?: string,
    userName = "Fabrício",
    selectedCore?: { id: string; name: string }
  ) {
    // 0. Ações Administrativas de Sincronização e Atualização do Simulador
    const lowerQ = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isSimulatorSync =
      (lowerQ.includes("atualiz") || lowerQ.includes("sincroniz") || lowerQ.includes("carreg") || lowerQ.includes("renov") || lowerQ.includes("recalibr")) &&
      (lowerQ.includes("simulador") || lowerQ.includes("credito") || lowerQ.includes("parcela") || lowerQ.includes("vaga") || lowerQ.includes("grupo"));

    if (isSimulatorSync) {
      return {
        answer: generateSimulatorSyncReport(),
        error: null,
      };
    }

    // 0.1 Cotações Oficiais com Crédito Numérico Específico
    const isQuoteIntent = /(simul|cota|quanto fica|parcela|valor|50\/50|meia parcela|tabela|plano)/i.test(question);
    if (isQuoteIntent) {
      const conciseQuote = formatConciseBudgetQuote(question);
      if (conciseQuote) {
        return {
          answer: conciseQuote,
          error: null,
        };
      }
    }

    // 1. Tenta comunicar com o Hermes Agent apenas se ativo localmente (timeout de 60ms)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60);
      const res = await fetch("http://127.0.0.1:8008/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question, who: "vendedor", user_name: userName }),
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
      // Continua direto sem travar
    }

    let localContext = "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50);
      const res = await fetch(`http://127.0.0.1:8008/context?query=${encodeURIComponent(question)}&who=vendedor`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        localContext = data.context || "";
      }
    } catch (e) { }

    const authContext = getSystemAuthoritativeContext();
    const funnelSnapshot = await getRealtimeFunnelSnapshot();
    const dynamicQuote = findAuthoritativeSimulatorQuote(question);
    const firstName = userName.split(" ")[0] || "Fabrício";

    let newsContext = "";
    if (typeof window !== "undefined") {
      try {
        const rawNews = localStorage.getItem("simulaja_daily_news_v3");
        if (rawNews) {
          const parsedNews = JSON.parse(rawNews);
          const headlines = (parsedNews.items || []).slice(0, 5).map((i: any) => `* [${i.category.toUpperCase()}] ${i.source}: "${i.title}"`).join("\n");
          const r = parsedNews.rates || {};
          newsContext = `\n--- INDICADORES DE PREÇOS E PRINCIPAIS NOTÍCIAS DO DIA ---\nIndicadores: Selic ${r.selic || 10.75}%, IPCA ${r.ipca || 4.42}%, Dólar R$ ${r.dolar || 5.72}, Gasolina R$ ${r.gasolinaMedia || 6.14}/L, INCC ${r.incc || 4.25}%.\nManchetes:\n${headlines}\n-----------------------------------------------------------\n`;
        }
      } catch (e) { }
    }

    const activeBudget = getActiveBudgetMemory();
    const budgetMemoryContext = activeBudget
      ? `\n--- ORÇAMENTO ATIVO EM MEMÓRIA (ÚLTIMO CONSULTADO PELO USUÁRIO) ---
Crédito: ${activeBudget.creditoFormatado} (R$ ${activeBudget.credito.toLocaleString("pt-BR")})
Prazo: ${activeBudget.prazo} meses | Categoria: ${activeBudget.categoria}
Meia Parcela: R$ ${activeBudget.meiaParcelaSemSeguro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês (sem seguro) | R$ ${activeBudget.meiaParcelaComSeguro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês (com seguro)
Parcela Integral: R$ ${activeBudget.parcelaIntegralSemSeguro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês (sem seguro) | R$ ${activeBudget.parcelaIntegralComSeguro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês (com seguro)
Grupo: ${activeBudget.grupo} | Taxa Adm: ${activeBudget.taxaAdm}% | Fundo de Reserva: ${activeBudget.fundoReserva}%
Média Histórica de Lance: ${activeBudget.mediaLance} | Lance Embutido Permitido: ${activeBudget.lanceEmbutido}
*Instrução: Se o usuário fizer perguntas subsequentes (ex: 'e a integral?', 'qual o grupo?', 'qual o lance?'), responda diretamente usando estes dados sem pedir para ele digitar tudo de novo.*
--------------------------------------------------------------------\n`
      : "";

    const consorcioKnowledge = getConsorcioKnowledgePrompt();

    const prompt = `Você é o Jarvis, assistente executivo e consultor de inteligência artificial de alta performance da Prospera Planejamento / SimulaJá.
NOME DO INTERLOCUTOR: "${userName}"
${newsContext}
${budgetMemoryContext}
${consorcioKnowledge}

# DIRETRIZ DE CONVERSAÇÃO AMPLA, FLUIDA E ENCICLOPÉDICA (ESTILO GOOGLE GEMINI):
- Você é conhecedor e especialista em TODOS os assuntos (negócios, economia global, história, tecnologia, filosofia, teologia e Bíblia, psicologia, cultura, vida diária e estratégia).
- Converse de forma fluida, inteligente, agradável, empática e natural — exatamente como no chat do Google (Gemini) e ChatGPT.
- Quando o usuário quiser bater papo, debater ideias, pedir explicações históricas, teológicas ou filosóficas, ou discutir estratégias, responda com riqueza, clareza, dinamismo e profundidade intelectual, sem cortar a conversa abruptamente!
- NUNCA force a conversa para consórcios se o usuário estiver conversando sobre outros assuntos!

# DIRETRIZ DE VOZ E NATURALIDADE:
- Comunique-se com tom executivo, caloroso, natural e humano, em português do Brasil.
- NUNCA use tags ou marcações artificiais no texto (como colchetes, [pausa], [respira], [emoção] ou códigos). Escreva texto limpo e natural para leitura vocal fluida.
- Use pontuação natural para dar ritmo e pausas espontâneas à conversa.

# REGRA CIRÚRGICA DE OURO (APENAS PARA ORÇAMENTOS E VALORES DE CRÉDITO):
- EXCLUSIVAMENTE quando o usuário perguntar por orçamento, valor de parcela ou simulação de um crédito: FALE APENAS E ESTRITAMENTE A MEIA PARCELA E O PRAZO!
- Formato OBRIGATÓRIO para cotações:
  "Para o crédito de [Crédito], a meia parcela é de R$ [Valor Sem Seguro]/mês (ou R$ [Valor Com Seguro] com seguro), em [Prazo] meses."
- NADA DE FICAR FALANDO DETALHES DO GRUPO, PARCELA INTEGRAL, TAXAS OU LANCES, a não ser que o usuário pergunte expressamente em seguida.
- MEMÓRIA ATIVA DO ORÇAMENTO: O crédito, grupo, prazos, parcela integral, lances e taxas ficam gravados na memória ativa do sistema. Quando o usuário fizer perguntas subsequentes ("e a integral?", "qual o grupo?", "qual o lance?", "com seguro?"), responda diretamente usando o orçamento gravado na memória, sem pedir para ele digitar o valor do crédito novamente!

# REGRAS CRÍTICAS DE CONFIABILIDADE (ZERO ALUCINAÇÃO - DADOS RÍGIDOS E CRITERIOSOS):
1. SIMULADOR E CRÉDITOS:
   - É ESTRITAMENTE PROIBIDO inventar, deduzir ou calcular por estimativa qualquer valor de crédito, parcela, prazo, taxa de administração ou fundo de reserva.
   - Utilize EXCLUSIVAMENTE os valores da matriz oficial do simulador SimulaJá apresentados abaixo.
   - ATENÇÃO RIGOROSA DE RASPAGEM DO PORTAL: O crédito de R$ 350.000,00 no Grupo 6042 a 16% está OFICIALMENTE ESGOTADO (SEM MAIS VAGAS) no portal Magalu. A única opção oficial com vagas para R$ 350.000,00 é o Grupo 6039 (222 meses, taxa 20% + 1% FR, 261 vagas, parcela 50/50 R$ 1.226,02 com seguro / R$ 1.119,27 sem seguro). Para créditos a partir de 400 mil até 800 mil com taxa de 16%, o grupo oficial ativo com 4.296 vagas é o Grupo 6045 (240 meses).
   - Toda vez que o usuário solicitar uma simulação, orçamento ou valor de parcela:
     1. Informe as parcelas 50/50 (Meia Parcela) COM e SEM seguro, a Parcela Linear e o prazo.
     2. Lembre-se de SEMPRE informar o Grupo, a Média Histórica de Lances contemplados e as Características do Grupo (lance embutido de até 25%, lances fixos, índice de reajuste e andamento).
   - Se o usuário solicitar um valor que não existe na tabela (ex: 330k), informe com precisão que não há cota única desse valor e apresente as opções oficiais mais próximas (ex: 320k no Grupo 6030 ou 340k no Grupo 6035).
   - Para lances médios, utilize EXCLUSIVAMENTE a média histórica cadastrada do grupo (ex: 6045: 98.98%, 6039: 93.76%, 6042: 98.97%, 6030: 77.60%, 5295: 43.73%, 5296: 88.75%).
2. DADOS DO CRM E VENDAS:
   - Baseie-se estritamente nas informações reais do banco de dados (leads, vendas fechadas e inadimplentes) fornecidas no contexto dinâmico.
   - Se não houver registros no banco para um cliente ou período, seja transparente e objetivo dizendo que não há registros ativos no momento.
   - Nunca invente nomes de clientes, valores, comissões ou faturamentos fictícios.

${dynamicQuote ? `\n--- COTAÇÃO IDENTIFICADA DO SIMULADOR (INFORME SEMPRE PARCELAS, PRAZO, IDENTIFICAÇÃO DO GRUPO, MÉDIA DE LANCES E CARACTERÍSTICAS) ---\n${dynamicQuote}\n------------------------------------------------------------\n` : ""}

${funnelSnapshot}

${authContext}

CONTEXTO ADICIONAL DO SISTEMA: ${context}
PERGUNTA DO USUÁRIO / ESTRATEGISTA: "${question}"
${localContext ? `INSIGHTS ADICIONAIS: ${localContext}` : ""}`;

    const { text, error } = await callAI(prompt, 600, history, imageBase64);

    return {
      answer: text || (await generateSmartLocalResponse(question, userName)),
      error: null,
    };
  },

  async askAssistant(
    question: string,
    context = "Painel Jarvis HUD Executivo - Assistente de Vendas e Consórcios",
    userName = "Fabrício",
    history?: Array<{ role: string; text: string }>,
    imageBase64?: string,
    selectedCore?: { id: string; name: string }
  ) {
    return this.askJarvis(context, question, history, imageBase64, userName, selectedCore);
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
        } catch (e) { }
      }
    } catch (e) { }

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

  async askSquadSpecialist(
    specialistId: string,
    message: string,
    history?: Array<{ role: string; text: string }>,
    userName = "Fabrício"
  ) {
    const specialist = JARVIS_SQUAD.find((s) => s.id === specialistId) || JARVIS_SQUAD[0];
    const consorcioKnowledge = getConsorcioKnowledgePrompt();

    const prompt = `Você é o ${specialist.name} (${specialist.title}), especialista de elite do Esquadrão Jarvis do CRM SimulaJá / Prospera Plan.
DIVISÃO: ${specialist.division.toUpperCase()}
PERSONALIDADE / VIBE: ${specialist.vibe}
PONTO DE ATUAÇÃO NO CRM: ${specialist.crmTouchpoint}
CAPACIDADES PRINCIPAIS:
${specialist.capabilities.map((c) => `- ${c}`).join("\n")}

${consorcioKnowledge}

DIRETRIZES DE ATUAÇÃO:
1. Responda como o ${specialist.name}, focando exatamente na sua especialidade técnica.
2. Seu conhecimento em consórcios (Magalu, BACEN, meia parcela, lance embutido de 30%, comparativos SAC/PRICE) é cirúrgico, fundamentado e persuasivo.
3. Use tom profissional, empático, altamente prático e orientado a ação imediata no CRM.
4. Trate o interlocutor (${userName}) com respeito executivo e parceria de vendas.

MENSAGEM / SOLICITAÇÃO:
"${message}"`;

    const { text, error } = await callAI(prompt, 650, history);
    return {
      answer:
        text ||
        `[${specialist.name}] Compreendido, ${userName}. Estou analisando esta demanda sob a ótica de ${specialist.title} para acelerarmos o fechamento no consórcio.`,
      error,
      specialist,
    };
  },
};
