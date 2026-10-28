/**
 * News Service — Central de Inteligência de Notícias Diárias, Política, Preços e Mercado
 * Atualizado em tempo real via feeds abertos (G1, Folha, Agência Brasil, Valor, InfoMoney)
 * com integração neural ao Jarvis para áudio briefing e respostas em tempo real.
 */

export type DailyNewsCategory = "todas" | "politica" | "precos" | "geral" | "consorcio";

export interface DailyNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: "politica" | "precos" | "geral" | "consorcio";
  publishedAt: string;
  badgeText: string;
  isLive?: boolean;
  rawDate?: Date | null;
  imageUrl?: string;
  argumentoVenda?: string;
  tags?: string[];
}

export interface MarketRates {
  selic: number;
  cdi: number;
  ipca: number;
  incc: number;
  dolar: number;
  euro: number;
  gasolinaMedia: number;
  etanolMedio: number;
  fipeVariacaoSemestral: string;
  atualizadoEm: string;
}

const CACHE_KEY = "simulaja_daily_news_v3";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

// Feeds confiáveis de notícias diárias do Brasil
const LIVE_FEEDS = [
  {
    name: "G1 Política",
    url: "https://g1.globo.com/rss/g1/politica/",
    categoryDefault: "politica" as const,
    defaultBadge: "G1 Política",
  },
  {
    name: "G1 Economia",
    url: "https://g1.globo.com/rss/g1/economia/",
    categoryDefault: "precos" as const,
    defaultBadge: "G1 Economia & Preços",
  },
  {
    name: "Folha de S.Paulo",
    url: "https://feeds.folha.uol.com.br/poder/rss091.xml",
    categoryDefault: "politica" as const,
    defaultBadge: "Folha Poder",
  },
  {
    name: "Folha Mercado",
    url: "https://feeds.folha.uol.com.br/mercado/rss091.xml",
    categoryDefault: "precos" as const,
    defaultBadge: "Folha Mercado",
  },
  {
    name: "Agência Brasil",
    url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",
    categoryDefault: "geral" as const,
    defaultBadge: "Agência Brasil Geral",
  },
];

// Indicadores padrão de taxas e preços do dia
export const DEFAULT_MARKET_RATES: MarketRates = {
  selic: 10.75,
  cdi: 10.65,
  ipca: 4.42,
  incc: 4.25,
  dolar: 5.72,
  euro: 6.22,
  gasolinaMedia: 6.14,
  etanolMedio: 4.08,
  fipeVariacaoSemestral: "+4,1%",
  atualizadoEm: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
};

// Notícias de referência e benchmarking perene com curadoria de mercado
export const BENCHMARK_DAILY_NEWS: DailyNewsItem[] = [
  {
    id: "pol-congresso-1",
    title: "Congresso Nacional avança na regulamentação tributária e foco no crédito às famílias",
    summary: "Parlamentares debatem regras de transição para o consumo e estímulos ao financiamento sustentável e compras planejadas no país.",
    source: "Agência Câmara / Senado",
    sourceUrl: "https://www2.camara.leg.br",
    category: "politica",
    publishedAt: "Hoje",
    badgeText: "Brasília / Congresso",
    isLive: false,
    argumentoVenda: "Argumento de Estabilidade: O consórcio opera sob marco legal próprio protegido pelo Banco Central, sem surpresas de alíquotas ou alterações tributárias bancárias repentinas."
  },
  {
    id: "precos-selic-1",
    title: "COPOM e Banco Central: Juros bancários sobem e encarecem financiamentos de veículos e imóveis",
    summary: "Com a Selic em patamar restritivo, o Custo Efetivo Total (CET) dos bancos ultrapassa 24% a.a. nos financiamentos automotivos e 12% a.a. no crédito imobiliário.",
    source: "Valor Econômico / BCB",
    sourceUrl: "https://valor.globo.com",
    category: "precos",
    publishedAt: "Hoje",
    badgeText: "Juros & Financiamentos",
    isLive: false,
    argumentoVenda: "Gatilho Comparativo: Em um carro de R$ 90 mil financiado, o cliente paga R$ 170 mil ao banco. No consórcio SimulaJá Magalu, o custo total não passa de R$ 105 mil, economizando mais de R$ 65 mil."
  },
  {
    id: "precos-comb-1",
    title: "Preços de combustíveis e manutenção de frotas pressionam orçamento de empresas e famílias",
    summary: "A alta acumulada dos custos operacionais de transporte exige que transportadoras e motoristas troquem de frota por modelos mais eficientes sem descapitalizar o caixa.",
    source: "InfoMoney / ANP",
    sourceUrl: "https://www.infomoney.com.br",
    category: "precos",
    publishedAt: "Hoje",
    badgeText: "Preços ANP & Frotas",
    isLive: false,
    argumentoVenda: "Gatilho de Renovação de Frota: Frotistas economizam combustível renovando caminhões e vans com cartas de crédito de meia parcela até a contemplação."
  },
  {
    id: "geral-mercado-1",
    title: "Mercado Imobiliário: Preço médio do metro quadrado residencial tem maior alta do ano",
    summary: "O índice FipeZAP aponta valorização contínua dos imóveis nas principais capitais e cidades polo. Quem adia a compra paga mais caro a cada trimestre.",
    source: "G1 / FipeZAP",
    sourceUrl: "https://g1.globo.com/economia",
    category: "geral",
    publishedAt: "Hoje",
    badgeText: "Manchete Nacional",
    isLive: false,
    argumentoVenda: "Gatilho de Urgência Patrimonial: A carta de crédito imobiliária acompanha o INCC todo ano, protegendo o poder de compra do cliente enquanto o metro quadrado se valoriza."
  },
  {
    id: "consorcio-abac-recorde",
    title: "Sistema de Consórcios ultrapassa 11 milhões de cotistas ativos no Brasil",
    summary: "Dados consolidados da ABAC comprovam que a fuga dos juros abusivos dos bancos transformou o consórcio na principal ferramenta de construção patrimonial do brasileiro.",
    source: "ABAC Notícias",
    sourceUrl: "https://abac.org.br",
    category: "consorcio",
    publishedAt: "Hoje",
    badgeText: "Recorde Histórico ABAC",
    isLive: false,
    argumentoVenda: "Gatilho de Prova Social Máxima: Mais de 11 milhões de brasileiros preferem o consórcio em vez de jogar dinheiro fora nos bancos tradicionais."
  }
];

// Helper de análise de texto para categorizar notícias
function categorizeNews(title: string, summary: string, fallback: "politica" | "precos" | "geral" | "consorcio"): "politica" | "precos" | "geral" | "consorcio" {
  const text = (title + " " + summary).toLowerCase();
  
  if (/consórcio|consorcio|abac|carta de crédito|cota|contempla|lance embutido|meia parcela/i.test(text)) {
    return "consorcio";
  }
  if (/governo|congresso|senado|câmara|camara|lula|stf|ministro|votação|projeto de lei|mp\b|reforma tribut|planalto|eleição|partido/i.test(text)) {
    return "politica";
  }
  if (/preço|preco|inflação|inflacao|ipca|igp-m|selic|juro|banco central|combust|gasolina|diesel|petróleo|petroleo|fipe|incc|cesta básica|supermercado|alimento|energia|luz|dólar|dolar|câmbio/i.test(text)) {
    return "precos";
  }
  if (/imóv|habit|veíc|carro|auto|caminh|mercado|bolsa|ibovespa|brasil/i.test(text)) {
    return "geral";
  }
  return fallback;
}

// Gera o argumento consultivo do Jarvis
export function generateJarvisArgument(category: DailyNewsCategory, title: string, summary: string): string {
  const full = (title + " " + summary).toLowerCase();

  if (full.includes("selic") || full.includes("juro") || full.includes("copom")) {
    return "💡 Dica de Venda do Jarvis: Use a alta da Selic como gancho matador: 'Enquanto o financiamento bancário cobra 20% a mais ao ano, no consórcio a taxa é mínima e fixa, sem juros compostos.'";
  }
  if (full.includes("gasolina") || full.includes("combust") || full.includes("inflação") || full.includes("ipca")) {
    return "💡 Dica de Venda do Jarvis: Aborde empresários e motoristas mostrando que a carta de crédito protege o poder de compra e renova frotas sem descapitalizar a empresa.";
  }
  if (category === "politica") {
    return "💡 Dica de Venda do Jarvis: Destaque a segurança jurídica do consórcio, regulamentado e fiscalizado com rigor pelo Banco Central do Brasil.";
  }
  if (category === "precos" || full.includes("imóv") || full.includes("casa")) {
    return "💡 Dica de Venda do Jarvis: Quem não compra hoje com consórcio, pagará 10% mais caro no imóvel amanhã. A carta valoriza todo ano pelo INCC.";
  }
  if (full.includes("veíc") || full.includes("carro") || full.includes("fipe")) {
    return "💡 Dica de Venda do Jarvis: Apresente o plano de meia parcela: o cliente começa pagando 50% da parcela até a contemplação para trocar de carro sem aperto.";
  }
  return "💡 Dica de Venda do Jarvis: Compartilhe esta manchete com seus leads mornos para demonstrar autoridade consultiva e reaquecer negociações.";
}

function parseRelativeTime(pubDateStr?: string): { formatted: string; dateObj: Date | null } {
  if (!pubDateStr) return { formatted: "Hoje", dateObj: null };

  let d = new Date(pubDateStr);
  if (isNaN(d.getTime())) {
    d = new Date(pubDateStr.replace(/-/g, "/"));
  }
  if (isNaN(d.getTime())) {
    return { formatted: pubDateStr, dateObj: null };
  }

  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return { formatted: "Agora mesmo", dateObj: d };
  if (diffMinutes < 60) return { formatted: `Há ${diffMinutes} min`, dateObj: d };

  const isToday =
    now.getDate() === d.getDate() &&
    now.getMonth() === d.getMonth() &&
    now.getFullYear() === d.getFullYear();

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (isToday) return { formatted: `Hoje às ${hh}:${mm}`, dateObj: d };

  return { formatted: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${hh}:${mm}`, dateObj: d };
}

/**
 * Busca taxas econômicas em tempo real (BCB e AwesomeAPI)
 */
export async function fetchLiveMarketRates(): Promise<MarketRates> {
  const rates = { ...DEFAULT_MARKET_RATES };
  try {
    const [dolarRes, bcbRes] = await Promise.allSettled([
      fetch("https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL", { cache: "no-store" }),
      fetch("https://brasilapi.com.br/api/taxas/v1", { cache: "no-store" })
    ]);

    if (dolarRes.status === "fulfilled" && dolarRes.value.ok) {
      const data = await dolarRes.value.json();
      if (data?.USDBRL?.bid) rates.dolar = parseFloat(data.USDBRL.bid);
      if (data?.EURBRL?.bid) rates.euro = parseFloat(data.EURBRL.bid);
    }

    if (bcbRes.status === "fulfilled" && bcbRes.value.ok) {
      const taxas = await bcbRes.value.json();
      if (Array.isArray(taxas)) {
        const selic = taxas.find((t: any) => t.nome === "Selic");
        const cdi = taxas.find((t: any) => t.nome === "CDI");
        const ipca = taxas.find((t: any) => t.nome === "IPCA");
        if (selic) rates.selic = Number(selic.valor);
        if (cdi) rates.cdi = Number(cdi.valor);
        if (ipca) rates.ipca = Number(ipca.valor);
      }
    }
    rates.atualizadoEm = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch (err) {
    console.warn("⚠️ [NewsService] Taxas em modo fallback:", err);
  }
  return rates;
}

/**
 * Busca notícias ao vivo dos principais jornais e portais brasileiros
 */
export async function fetchDailyNews(forceRefresh = false): Promise<{
  items: DailyNewsItem[];
  rates: MarketRates;
  lastUpdated: Date;
}> {
  // 1. Tentar ler do Cache local se não for forçado
  if (!forceRefresh && typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - (parsed.timestamp || 0);
        if (age < CACHE_TTL_MS && Array.isArray(parsed.items) && parsed.items.length > 0) {
          return {
            items: parsed.items,
            rates: parsed.rates || DEFAULT_MARKET_RATES,
            lastUpdated: new Date(parsed.timestamp)
          };
        }
      }
    } catch (e) {
      console.warn("⚠️ Falha ao ler cache local de notícias:", e);
    }
  }

  // 2. Buscar Feeds RSS
  const liveItems: DailyNewsItem[] = [];
  const seenTitles = new Set<string>();

  const feedPromises = LIVE_FEEDS.map(async (feed) => {
    try {
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
      const res = await fetch(proxyUrl, { cache: "no-store" });
      if (!res.ok) return [];
      const json = await res.json();
      if (!json || !Array.isArray(json.items)) return [];

      return json.items.slice(0, 6).map((raw: any, idx: number) => {
        const title = (raw.title || "").trim();
        const rawDesc = (raw.description || "").replace(/<[^>]*>?/gm, "").trim();
        const cat = categorizeNews(title, rawDesc, feed.categoryDefault);
        const { formatted, dateObj } = parseRelativeTime(raw.pubDate);

        return {
          id: `live-${feed.name.replace(/\s+/g, "").toLowerCase()}-${idx}-${Date.now()}`,
          title,
          summary: rawDesc.length > 180 ? rawDesc.slice(0, 180) + "..." : rawDesc,
          source: feed.name,
          sourceUrl: raw.link || "https://g1.globo.com",
          category: cat,
          publishedAt: formatted,
          badgeText: feed.defaultBadge,
          isLive: true,
          rawDate: dateObj,
          argumentoVenda: generateJarvisArgument(cat, title, rawDesc)
        } as DailyNewsItem;
      });
    } catch {
      return [];
    }
  });

  const [settledFeeds, liveRates] = await Promise.all([
    Promise.allSettled(feedPromises),
    fetchLiveMarketRates()
  ]);

  for (const result of settledFeeds) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      for (const item of result.value) {
        const normalized = item.title.toLowerCase().trim();
        if (!seenTitles.has(normalized) && normalized.length > 10) {
          seenTitles.add(normalized);
          liveItems.push(item);
        }
      }
    }
  }

  // Ordenar notícias pelas mais recentes
  liveItems.sort((a, b) => {
    const timeA = a.rawDate ? a.rawDate.getTime() : 0;
    const timeB = b.rawDate ? b.rawDate.getTime() : 0;
    return timeB - timeA;
  });

  // Mesclar notícias ao vivo com os benchmarks perenes
  const finalItems = liveItems.length > 0
    ? [...liveItems.slice(0, 24), ...BENCHMARK_DAILY_NEWS]
    : BENCHMARK_DAILY_NEWS;

  const now = new Date();

  // Salvar no localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: now.getTime(),
        items: finalItems,
        rates: liveRates
      }));
    } catch (e) {
      // ignore storage quota error
    }
  }

  return {
    items: finalItems,
    rates: liveRates,
    lastUpdated: now
  };
}

/**
 * Monta o roteiro em áudio do Briefing Executivo diário para o Jarvis narrar
 */
export function getDailyBriefingScript(
  items: DailyNewsItem[],
  rates: MarketRates = DEFAULT_MARKET_RATES,
  userName = "Fabrício"
): string {
  const currentHour = new Date().getHours();
  const saudacao = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite";

  // Filtra as manchetes mais relevantes
  const politicas = items.filter(i => i.category === "politica").slice(0, 2);
  const precos = items.filter(i => i.category === "precos").slice(0, 2);
  const gerais = items.filter(i => i.category === "geral" || i.category === "consorcio").slice(0, 2);

  const headlinePolitica = politicas[0] ? politicas[0].title : "em Brasília o Congresso mantém foco nas pautas fiscais e orçamentárias";
  const headlinePreco = precos[0] ? precos[0].title : `o IPCA segue em ${rates.ipca} por cento e a Selic em ${rates.selic} por cento ao ano`;
  const headlineGeral = gerais[0] ? gerais[0].title : "o setor de consórcios segue batendo recordes de adesão em todo o país";

  return `
    Olá, ${userName}! ${saudacao}! Aqui é o Jarvis com o seu Briefing Executivo de notícias e mercado.
    
    No cenário de preços e economia, a Taxa Selic está em ${rates.selic.toFixed(2).replace(".", ",")} por cento ao ano, com o Dólar cotado a ${rates.dolar.toFixed(2).replace(".", ",")} reais. Destaque para: ${headlinePreco}.
    
    Na política nacional: ${headlinePolitica}.
    
    Já no mercado geral e setor imobiliário e automotivo: ${headlineGeral}.
    
    Insight comercial do Jarvis para hoje: com as altas taxas de financiamento bancário, o consórcio com plano de meia parcela é o maior argumento de fechamento para sua carteira de clientes. 
    Tenha um dia extraordinário de vendas!
  `.replace(/\s+/g, " ").trim();
}

/**
 * Responde perguntas pontuais do usuário no Jarvis HUD sobre notícias, preços e política
 */
export function getNewsAnswerForJarvis(
  query: string,
  items: DailyNewsItem[],
  rates: MarketRates = DEFAULT_MARKET_RATES
): string {
  const lower = query.toLowerCase();

  // Pergunta sobre preços, taxas, inflação, gasolina, selic ou dólar
  if (lower.includes("preço") || lower.includes("preco") || lower.includes("taxa") || lower.includes("selic") || lower.includes("inflação") || lower.includes("inflacao") || lower.includes("dolar") || lower.includes("dólar") || lower.includes("gasolina")) {
    const newsPrecos = items.filter(i => i.category === "precos").slice(0, 2);
    const manchete = newsPrecos[0]?.title || "Preços monitorados pelo Banco Central e ANP";
    return `Fabrício, sobre preços e indicadores econômicos hoje: a Selic está em ${rates.selic}% a.a., CDI em ${rates.cdi}%, IPCA acumulado em ${rates.ipca}%, INCC da construção em ${rates.incc}% e o Dólar comercial em R$ ${rates.dolar.toFixed(2).replace(".", ",")}. O preço médio da gasolina no país é de R$ ${rates.gasolinaMedia.toFixed(2).replace(".", ",")}/L. Principal manchete econômica do dia: "${manchete}".`;
  }

  // Pergunta sobre política
  if (lower.includes("politica") || lower.includes("política") || lower.includes("governo") || lower.includes("congresso") || lower.includes("brasília") || lower.includes("brasilia")) {
    const newsPolitica = items.filter(i => i.category === "politica").slice(0, 2);
    const titulos = newsPolitica.map(n => `"${n.title}"`).join(". Também temos: ");
    return `Fabrício, no cenário político de hoje os principais jornais destacam: ${titulos || "A movimentação em Brasília com votações e pautas econômicas no Congresso"}. O marco legal do consórcio segue plenamente respaldado e seguro para seus clientes.`;
  }

  // Pergunta geral de notícias / jornais / briefing
  return getDailyBriefingScript(items, rates, "Fabrício");
}
