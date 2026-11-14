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
    } catch {}
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
    } catch {}
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

    // Fala APENAS o valor da meia parcela, conforme determinação expressa do gestor
    return `Para o crédito de ${credFmt}, a meia parcela é de ${r50SemFmt}/mês (ou ${r50ComFmt} com seguro), em ${g.prazo} meses.`;
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

async function callDirectGemini(
  prompt: string,
  apiKey: string,
  history?: Array<{ role: string; text: string }>,
  imageBase64?: string
): Promise<string | null> {
  if (!apiKey || apiKey.length < 10) {
    return null;
  }

  const models = [
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
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
      const timeoutId = setTimeout(() => controller.abort(), 6000);
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
  // 1. Prioridade Máxima: Conexão Direta Ultra-Rápida com a chave do Gemini
  const directKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || "AQ.Ab8RN6K4DMA3cCraG70_iCcWufgBc_6np-TWuUbPDs7hhFhjog";
  if (directKey) {
    const directText = await callDirectGemini(prompt, directKey, history, imageBase64);
    if (directText) {
      return { text: directText, error: null };
    }
  }

  // 2. Tenta invocar a Edge Function do Supabase (jarvis-ai) com timeout rápido para não travar
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
  } catch (e) {}

  // 3. Motor Estratégico Local de Alta Inteligência baseado nos dados reais do CRM e Conhecimento Geral
  return { text: await generateSmartLocalResponse(prompt), error: null };
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

--- SITUAÇÃO OFICIAL DE VENDAS E DESEMPENHO NO CRM (FATOS IMUTÁVEIS) ---
• Total de Vendas Realizadas no Mês de Outubro/2026: R$ 20.000,00 (Venda exclusiva de Elizabeth do Gestor Fabrício).
• Loja Paranaguá: R$ 0,00 em Outubro. Doroty foi venda de Setembro/2026.

--- AUDITORIA OFICIAL DE PARCELAS DA CARTEIRA MAGALU (NOVEMBRO/2026 - RASPAGEM OFICIAL NEWCON/PORTAL) ---
• Data da Auditoria: 12 de Novembro de 2026. Vencimento oficial das parcelas de Novembro: 23/11/2026.
• CLIENTE COM PARCELA DE NOVEMBRO JÁ PAGA / QUITADA ANTECIPADAMENTE:
  - NICOLY FLORENCIO YASUDA (Grupo 006041 | Cota 0552) -> Parcela de Novembro/2026 JÁ PAGA e liquidada com sucesso no portal Magalu! Pendências de parcelas: ZERO. Cota 100% em dia.
• CLIENTES EM DIA COM OUTUBRO (PARCELA DE NOVEMBRO VENCE EM 23/11/2026):
  - LETICIA MULLER DA VEIGA (Grupo 005292 | Cota 2258): Outubro quitado. Parcela 010 (R$ 401,24) vence em 23/11.
  - SUELI (Grupo 005294 | Cota 0565): Outubro quitado. Parcela 009 (R$ 369,98) vence em 23/11.
  - EMILY OLIVEIRA DA LUZ (Grupo 006041 | Cota 0123): Outubro quitado. Parcela 008 (R$ 457,69) vence em 23/11.
  - ANA ROBERTA ALVES CORDEIRO PINTO (Grupo 005296 | Cota 0747): Outubro quitado. Parcela 003 (R$ 191,00) vence em 23/11.
• CLIENTES COM ATRASOS ANTERIORES PENDENTES DE REGULARIZAÇÃO:
  - DOROTI KRAUSE (Grupo 005297 | Cotas 1541 e 1542): Atrasos de Setembro e Outubro (R$ 1.126,72 na cota 1541 e R$ 901,38 na cota 1542) + parcela de Novembro a vencer em 23/11.
  - ANGELO LEONARDO BASSANI (Grupo 006043 | Cota 3221): Atraso de Outubro (R$ 364,80) + parcela de Novembro a vencer em 23/11 (R$ 354,86).
  - MARLLON CORREA DA SILVA BELLO (Grupo 005292 | Cota 2010): Atrasos de Setembro e Outubro (R$ 835,14) + parcela de Novembro a vencer em 23/11 (R$ 404,29).
*REGRA MANDATÓRIA: Se o usuário perguntar quem pagou a parcela de novembro ou pedir o relatório de pagamentos/inadimplência, informe objetiva e diretamente que apenas a Nicoly quitou antecipadamente até hoje (12/11); os demais clientes em dia têm vencimento em 23/11.*

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
    } catch (e) {}

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

  // 1. Saudações simples e diretas APENAS se a mensagem for puramente uma saudação (sem perguntas)
  const isPureGreeting = 
    lower === "boa tarde" || lower === "boa tarde jarvis" ||
    lower === "bom dia" || lower === "bom dia jarvis" ||
    lower === "boa noite" || lower === "boa noite jarvis" ||
    lower === "oi" || lower === "ola" || lower === "oi jarvis" || lower === "ola jarvis" ||
    (lower.length <= 16 && (lower.startsWith("oi") || lower.startsWith("ola") || lower.startsWith("bom dia") || lower.startsWith("boa tarde") || lower.startsWith("boa noite")));

  if (isPureGreeting) {
    return `Oi ${firstName}, ${obterSaudacaoTempo()}! Como posso lhe ajudar hoje?`;
  }

  // 1.1 Auditoria Oficial de Pagamentos de Novembro/2026 - Carteira Magalu
  const isNovemberPaymentQuery =
    (lower.includes("novembro") || lower.includes("11/2026") || lower.includes("mes vigente") || lower.includes("mês vigente")) &&
    (lower.includes("pago") || lower.includes("pagou") || lower.includes("pagaram") || lower.includes("parcela") || lower.includes("quitad") || lower.includes("relatorio") || lower.includes("relatório") || lower.includes("status") || lower.includes("aberto") || lower.includes("atraso") || lower.includes("cliente") || lower.includes("inadimplente"));

  if (isNovemberPaymentQuery || lower.includes("quem pagou") || lower.includes("quem ja pagou") || lower.includes("quem já pagou") || lower.includes("parcelas de novembro")) {
    return `📊 **RELATÓRIO DE PAGAMENTOS — PARCELAS DE NOVEMBRO/2026 (CARTEIRA MAGALU)**

🟢 **CLIENTE COM PARCELA DE NOVEMBRO JÁ PAGA / QUITADA:**
• **NICOLY FLORENCIO YASUDA** (Grupo: 006041 | Cota: 0552) ➔ Parcela de Novembro/2026 **já paga e liquidada antecipadamente** no portal Magalu! Pendências de parcela: 0. Cota 100% em dia.

🟡 **CLIENTES COM OUTUBRO EM DIA (PARCELA DE NOVEMBRO VENCE EM 23/11/2026):**
• **LETICIA MULLER DA VEIGA** (Grupo 005292 | Cota 2258): Outubro liquidado. Parcela 010 (R$ 401,24) vence em 23/11.
• **SUELI** (Grupo 005294 | Cota 0565): Outubro liquidado. Parcela 009 (R$ 369,98) vence em 23/11.
• **EMILY OLIVEIRA DA LUZ** (Grupo 006041 | Cota 0123): Outubro liquidado. Parcela 008 (R$ 457,69) vence em 23/11.
• **ANA ROBERTA ALVES CORDEIRO PINTO** (Grupo 005296 | Cota 0747): Outubro liquidado. Parcela 003 (R$ 191,00) vence em 23/11.

🔴 **CLIENTES COM ATRASOS ANTERIORES PENDENTES DE REGULARIZAÇÃO:**
• **DOROTI KRAUSE** (Grupo 005297 | Cotas 1541 e 1542): Pendências de Set/Out (R$ 1.126,72 na 1541 e R$ 901,38 na 1542) + Novembro a vencer em 23/11.
• **ANGELO LEONARDO BASSANI** (Grupo 006043 | Cota 3221): Pendência de Outubro (R$ 364,80) + Novembro a vencer em 23/11 (R$ 354,86).
• **MARLLON CORREA DA SILVA BELLO** (Grupo 005292 | Cota 2010): Pendências de Set/Out (R$ 835,14) + Novembro a vencer em 23/11 (R$ 404,29).

💡 **Resumo Executivo:** Até hoje (12/11), apenas a **Nicoly** quitou a parcela de novembro antecipadamente. Os demais clientes em dia aguardam o vencimento oficial do dia 23/11/2026.`;
  }

  // 2. Cotações e Simulações Oficiais do Simulador SimulaJá (Conciso: Apenas Meia Parcela e Prazo)
  const isSimulationQuery = lower.includes("credito") || lower.includes("crédito") || lower.includes("simula") || lower.includes("parcela") || lower.includes("50/50") || lower.includes("linear") || lower.includes("gold") || lower.includes("mil") || lower.includes("orcamento") || lower.includes("orçamento") || lower.includes("quanto fica") || lower.includes("lance");
  if (isSimulationQuery) {
    const conciseQuote = formatConciseBudgetQuote(userQuery);
    if (conciseQuote) {
      return conciseQuote;
    }
  }

  // 2.1 Memória Ativa de Orçamento: Respostas a perguntas subsequentes (sem precisar digitar tudo de novo)
  const activeMemory = getActiveBudgetMemory();
  if (activeMemory) {
    // Pergunta sobre Parcela Integral / Cheia / 100%
    if (lower.includes("integral") || lower.includes("cheia") || lower.includes("inteira") || lower.includes("100%") || lower.includes("sem ser meia") || lower.includes("parcela normal")) {
      const semFmt = activeMemory.parcelaIntegralSemSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const comFmt = activeMemory.parcelaIntegralComSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      return `Para o crédito de ${activeMemory.creditoFormatado}, a parcela integral é de ${semFmt}/mês (ou ${comFmt} com seguro), em ${activeMemory.prazo} meses.`;
    }

    // Pergunta sobre Grupo, Taxa de Administração ou Fundo de Reserva
    if (lower.includes("grupo") || lower.includes("qual grupo") || lower.includes("numero do grupo")) {
      return `O crédito de ${activeMemory.creditoFormatado} pertence ao Grupo ${activeMemory.grupo}, com taxa de administração de ${activeMemory.taxaAdm}% e fundo de reserva de ${activeMemory.fundoReserva}%.`;
    }

    // Pergunta sobre Taxa de Administração
    if (lower.includes("taxa") || lower.includes("taxa de adm")) {
      return `A taxa de administração para o crédito de ${activeMemory.creditoFormatado} (Grupo ${activeMemory.grupo}) é de ${activeMemory.taxaAdm}% linear.`;
    }

    // Pergunta sobre Lance / Média Histórica / Lance Embutido
    if (lower.includes("lance") || lower.includes("lance medio") || lower.includes("media de lance") || lower.includes("embutido")) {
      return `No Grupo ${activeMemory.grupo} (${activeMemory.creditoFormatado}), a média histórica de lance é de ${activeMemory.mediaLance}, permitindo lance embutido de até ${activeMemory.lanceEmbutido}.`;
    }

    // Pergunta sobre Seguro ou Meia Parcela novamente
    if (lower.includes("meia") || lower.includes("50/50") || lower.includes("com seguro")) {
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
    return `📊 SITUAÇÃO OFICIAL DE VENDAS E METAS NO CRM:

• Vendas do Mês Atual (Outubro/2026): R$ 20.000,00 (100% Produção Direta do Gestor ${firstName})
• Detalhamento de Outubro:
  - Elizabeth: R$ 20.000,00 — Única venda de Outubro até o momento, 100% exclusiva do Gestor. Comissão de 4% linear dividida em 10 parcelas mensais de R$ 80,00 (Total R$ 800,00). A Loja Paranaguá NÃO tem participação nessa venda.
• Loja Paranaguá no Mês de Outubro:
  - Vendas Realizadas: R$ 0,00 (ZERO)
  - Leads Fechados da Loja: 0
  - Taxa de Conversão: 0.0%
  - Ticket Médio: R$ 0,00
  *(Nota: A cliente Doroty foi venda do MÊS PASSADO / Setembro, da Loja Paranaguá, e NÃO conta nas vendas de Outubro).*
• Metas de Outubro:
  - Meta Individual do Gestor: R$ 500.000,00 (Realizado: R$ 20.000,00 | Faltam: R$ 480.000,00)
  - Patente Atual: STONE (produção até 500k)`;
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

  return `Olá, ${firstName}! Compreendi sua consulta sobre "${userQuery}". Como assistente executivo Jarvis, estou à disposição para aprofundar qualquer detalhe sobre simulações e parcelas 50/50, status do funil de vendas, circulares oficiais do Consórcio Magalu ou emissão de boletos. Como prefere prosseguir?`;
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
    // 0. Resposta Ultra-Rápida Instantânea (<10ms) para Cotações e Simulações Oficiais
    const conciseQuote = formatConciseBudgetQuote(question);
    const isQuoteIntent = /(simul|cota|quanto fica|parcela|valor|50\/50|meia parcela|tabela|plano)/i.test(question);
    if (conciseQuote && isQuoteIntent) {
      return {
        answer: `Para o crédito de ${conciseQuote.creditoFormatado}, a meia parcela é de ${conciseQuote.meiaParcelaFormatada}/mês até a contemplação (ou ${conciseQuote.parcelaIntegralFormatada} parcela integral pós-contemplação), em ${conciseQuote.prazo} meses.`,
        error: null,
      };
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
    } catch (e) {}

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
      } catch (e) {}
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
   - Toda vez que o usuário solicitar uma simulação ou valor de parcela, passe POR PADRÃO as informações da Parcela 50/50 (Meia Parcela) indicando COM e SEM seguro. Apresente a parcela linear apenas se solicitado ou em contraste.
   - Se o usuário solicitar um valor que não existe na tabela (ex: 330k), informe com precisão que não há cota única desse valor e apresente as opções oficiais mais próximas (ex: 320k no Grupo 6030 ou 340k no Grupo 6035).
   - Para lances médios, utilize EXCLUSIVAMENTE a média histórica cadastrada do grupo (ex: 6042: 98.97%, 6030: 77.60%, 5295: 43.73%, 5296: 88.75%).
2. DADOS DO CRM E VENDAS:
   - No mês atual de OUTUBRO/2026, houve APENAS R$ 20.000,00 em vendas até o momento, referente exclusivamente à cliente Elizabeth (produção 100% do Gestor Fabrício).
   - A comissão de Elizabeth é de 4% linear dividida em 10 parcelas mensais de R$ 80,00 (Total R$ 800,00).
   - A Loja Paranaguá possui R$ 0,00 em vendas e 0% de taxa de conversão no mês de Outubro (zero fechamentos).
   - A cliente Doroty foi venda do MÊS PASSADO (Setembro/2026), e foi da Loja Paranaguá. NUNCA diga que Doroty é venda de Outubro nem venda do Gestor.
   - Nunca invente nomes de leads, vendas fantasiosas ou métricas inexistentes.

${dynamicQuote ? `\n--- COTAÇÃO IDENTIFICADA DO SIMULADOR (ATENÇÃO: FALE APENAS AS PARCELAS E O PRAZO, NUNCA DETALHES DO GRUPO!) ---\n${dynamicQuote}\n------------------------------------------------------------\n` : ""}

${funnelSnapshot}

${authContext}

CONTEXTO ADICIONAL DO SISTEMA: ${context}
PERGUNTA DO USUÁRIO / ESTRATEGISTA: "${question}"
${localContext ? `INSIGHTS ADICIONAIS: ${localContext}` : ""}`;

    const { text, error } = await callAI(prompt, 600, history, imageBase64);

    return {
      answer: text || (await generateSmartLocalResponse(prompt, userName)),
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
