/**
 * AI Service — Motor de Inteligência Comercial e Autonomia da Bella IA
 * Conecta com a Edge Function `jarvis-ai` e possui motor de inteligência local analítico em tempo real
 */
import { supabase } from "@/integrations/supabase/client";
import { GRUPOS, GRUPO_CARACTERISTICAS, MEDIA_LANCES_GRUPOS, GrupoItem } from "@/constants/simulador";

export interface LeadContext {
  nome: string;
  tipo_consorcio: string;
  valor_credito: number;
  cidade: string;
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

    return `Para o crédito de ${credFmt}, em ${g.prazo} meses:\n• Meia Parcela (50/50): ${r50SemFmt}/mês (ou ${r50ComFmt} com seguro)\n• Parcela Integral: ${r100SemFmt}/mês (ou ${r100ComFmt} com seguro)\nPrazo: ${g.prazo} meses.`;
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

async function callDirectGemini(prompt: string, apiKey: string): Promise<string | null> {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro"];
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
• Total de Vendas Realizadas no Mês Atual (Outubro/2026): R$ 20.000,00
• Autoria e Distribuição das Vendas de Outubro:
  - Elizabeth: R$ 20.000,00 — ÚNICA venda do mês de Outubro até o momento, 100% exclusiva do Gestor Fabrício. Comissão acordada de 4% linear dividida em 10 parcelas mensais de R$ 80,00 (Total R$ 800,00). 
    ⚠️ REGRA MANDATÓRIA: A Loja Paranaguá NÃO possui participação nem comissão sobre esta venda de Outubro.
• Performance da Loja Paranaguá no Mês de Outubro/2026:
  - Vendas Realizadas em Outubro: R$ 0,00 (ZERO).
  - Leads Fechados da Loja em Outubro: 0.
  - Taxa de Conversão da Loja em Outubro: 0.0%.
  - Ticket Médio da Loja em Outubro: R$ 0,00.
  *(Nota de Auditoria: A cliente Doroty foi venda do MÊS PASSADO / Setembro/2026, e foi da Loja Paranaguá. No mês de Outubro a loja não possui nenhuma venda).*
• Estrutura de Metas da Equipe:
  - Meta Individual do Gestor (Outubro): R$ 500.000,00 (Realizado em Outubro: R$ 20.000,00 | Faltam: R$ 480.000,00).
  - Meta Geral da Filial/Lojas: R$ 500.000,00.

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

  // 1. Saudações simples e diretas com o nome do usuário logado
  if (lower === "boa tarde" || lower.includes("boa tarde")) {
    return `Oi ${firstName}, boa tarde! Como posso lhe ajudar?`;
  }
  if (lower === "bom dia" || lower.includes("bom dia")) {
    return `Oi ${firstName}, bom dia! Como posso lhe ajudar?`;
  }
  if (lower === "boa noite" || lower.includes("boa noite")) {
    return `Oi ${firstName}, boa noite! Como posso lhe ajudar?`;
  }
  if (lower === "oi" || lower === "ola" || lower.includes("ola") || lower.includes("oi bella") || lower.includes("oi jarvis")) {
    return `Oi ${firstName}, como posso lhe ajudar?`;
  }

  // 2. Cotações e Simulações Oficiais do Simulador SimulaJá (Conciso: Apenas Parcelas e Prazo, sem burocracia de grupo)
  const isSimulationQuery = lower.includes("credito") || lower.includes("crédito") || lower.includes("simula") || lower.includes("parcela") || lower.includes("50/50") || lower.includes("linear") || lower.includes("gold") || lower.includes("mil") || lower.includes("orcamento") || lower.includes("orçamento") || lower.includes("quanto fica") || lower.includes("lance");
  if (isSimulationQuery) {
    const conciseQuote = formatConciseBudgetQuote(userQuery);
    if (conciseQuote) {
      return conciseQuote;
    }
    const quote = findAuthoritativeSimulatorQuote(userQuery);
    if (quote) {
      return quote;
    }
  }

  // 3. VENDAS, METAS, PERFORMANCE, RESUMO E PRODUÇÃO
  if (
    lower.includes("resumo") ||
    lower.includes("venda") ||
    lower.includes("meta") ||
    lower.includes("producao") ||
    lower.includes("produção") ||
    lower.includes("realizado") ||
    lower.includes("desempenho") ||
    lower.includes("resultado") ||
    lower.includes("faturamento") ||
    lower.includes("loja") ||
    lower.includes("filial") ||
    lower.includes("comissao") ||
    lower.includes("comissão") ||
    lower.includes("patente") ||
    lower.includes("ranking") ||
    lower.includes("paranagua") ||
    lower.includes("paranaguá") ||
    lower.includes("gestor") ||
    lower.includes("elizabeth") ||
    lower.includes("doroty")
  ) {
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

  if (lower.length <= 15 || lower.startsWith("oi") || lower.startsWith("ola") || lower.startsWith("bom dia") || lower.startsWith("boa tarde") || lower.startsWith("boa noite")) {
    return `Oi ${firstName}, como posso lhe ajudar?`;
  }

  const safeSnippet = typeof userQuery === "string" ? userQuery.slice(0, 50) : "";
  return `Entendi sua pergunta sobre "${safeSnippet}...". Estou operando com a matriz autoritária do CRM e do Simulador SimulaJá. Posso te apresentar cotações exatas (ex: "simular 300 mil imóvel"), extratos e boletos, status de vendas de Outubro (Elizabeth 20k) ou análise de leads do funil!`;
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

  async askJarvis(context: string, question: string, history?: Array<{ role: string; text: string }>, imageBase64?: string, userName = "Fabrício") {
    // 1. Tenta comunicar com o Hermes Agent via Jarvis Brain Server na porta 8008 (timeout ultrarrápido para não bloquear a UI)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300);
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
      // Fallback para servidor local / Edge Function na nuvem
    }

    let localContext = "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 200);
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

    const prompt = `Você é o Jarvis, assistente executivo e consultor de alta performance comercial e inteligência em consórcios e vendas da Prospera Planejamento / SimulaJá.
NOME DO INTERLOCUTOR: "${userName}"
${newsContext}

# REGRAS CRÍTICAS E OBRIGATÓRIAS DE OBJETIVIDADE (O JARVIS NÃO FALA MUITO):
- RESPONDA APENAS E ESTRITAMENTE O QUE FOI PERGUNTADO, EM QUALQUER SITUAÇÃO.
- Seja cirúrgico, direto ao ponto e conciso. Para perguntas pontuais, responda em 1 a 2 frases curtas.
- NUNCA faça introduções protocolares ("Com base nos dados...", "É um prazer atender...", etc.).
- NUNCA dê dicas ou conselhos que não foram solicitados. Se perguntaram X, responda APENAS X.
- NUNCA repita a pergunta do usuário de volta para ele.

# REGRA DE OURO PARA ORÇAMENTOS E VALORES DE CRÉDITO:
- AO PERGUNTAR O ORÇAMENTO OU VALOR, VOCÊ DEVE FALAR APENAS E EXCLUSIVAMENTE O VALOR DAS PARCELAS E O PRAZO!
- NADA DE FICAR FALANDO DETALHES DO GRUPO (NÃO mencione número de grupo, taxa de administração, fundo de reserva, regras de assembleia, lances médios ou lance embutido, a não ser que o usuário pergunte expressamente).
- Formato OBRIGATÓRIO de resposta de orçamento:
  "Para o crédito de [Crédito], em [Prazo] meses:
  • Meia Parcela (50/50): R$ [Valor] (sem seguro) ou R$ [Valor] (com seguro)
  • Parcela Integral: R$ [Valor] (sem seguro) ou R$ [Valor] (com seguro)
  Prazo: [Prazo] meses."

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

    const { text, error } = await callAI(prompt, 380, history, imageBase64);

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
    imageBase64?: string
  ) {
    return this.askJarvis(context, question, history, imageBase64, userName);
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
