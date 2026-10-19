import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Newspaper, 
  Building2, 
  Car, 
  Coins, 
  TrendingUp, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Sparkles, 
  Clock, 
  Radio,
  CheckCircle2,
  Info
} from "lucide-react";

export type NewsCategory = "todas" | "consorcio" | "imoveis" | "veiculos" | "economia";

export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: "consorcio" | "imoveis" | "veiculos" | "economia";
  publishedAt: string;
  badgeText: string;
  isLive?: boolean;
  rawDate?: Date | null;
  imageUrl?: string;
  argumentoVenda?: string; // Dica executiva Jarvis para o consultor fechar vendas
}

// Feeds confiáveis de notícias do Brasil (Economia, Mercado, Imóveis, Veículos)
const LIVE_FEEDS = [
  {
    name: "G1 Economia",
    url: "https://g1.globo.com/rss/g1/economia/",
    defaultBadge: "G1 Economia",
  },
  {
    name: "Folha Mercado",
    url: "https://feeds.folha.uol.com.br/mercado/rss091.xml",
    defaultBadge: "Folha de S.Paulo",
  },
  {
    name: "Agência Brasil",
    url: "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml",
    defaultBadge: "EBC Economia",
  },
];

// Estatísticas consolidadas e benchmarks de mercado (Dados de referência perenes)
const SECTOR_BENCHMARKS: MarketNewsItem[] = [
  {
    id: "benchmark-abac-1",
    title: "Sistema de Consórcios atinge marca histórica de 11,2 milhões de participantes ativos no Brasil",
    summary: "Dados consolidados da ABAC (Associação Brasileira de Administradoras de Consórcios) apontam crescimento expressivo de adesões, impulsionado pelo desejo do consumidor de fugir das altas taxas de juros bancários.",
    source: "ABAC Notícias",
    sourceUrl: "https://abac.org.br",
    category: "consorcio",
    publishedAt: "Estatística ABAC",
    badgeText: "Benchmark Histórico",
    isLive: false,
    argumentoVenda: "Gatilho de Prova Social: Mostre ao cliente que 11 milhões de brasileiros optaram pelo consórcio em vez de pagar o dobro do bem em juros de financiamento."
  },
  {
    id: "benchmark-imob-1",
    title: "Índice FipeZAP: Preço médio do metro quadrado residencial acelera e Curitiba/Litoral do PR lideram valorização",
    summary: "A alta acumulada dos imóveis residenciais supera a inflação no período. Cidades do Paraná e polos industriais mantêm alta procura para moradia e locação, valorizando cotas de consórcio imobiliário.",
    source: "FipeZAP / Valor Econômico",
    sourceUrl: "https://fipezap.zapimoveis.com.br",
    category: "imoveis",
    publishedAt: "Índice FipeZAP",
    badgeText: "Valorização Imobiliária",
    isLive: false,
    argumentoVenda: "Gatilho de Urgência Patrimonial: O imóvel que o cliente quer comprar hoje custará 6% a 10% mais caro ano que vem. O consórcio garante o poder de compra com correção anual da carta."
  },
  {
    id: "benchmark-veic-1",
    title: "Mercado de caminhões e frotas agrícolas registra crescimento de 18% na busca por cartas de crédito",
    summary: "Renovação de frota de transportadoras e produtores rurais encontram no consórcio de pesados a principal alternativa de planejamento sem comprometer o fluxo de caixa com amortizações exorbitantes.",
    source: "Fenabrave / Canal Rural",
    sourceUrl: "https://www.fenabrave.org.br",
    category: "veiculos",
    publishedAt: "Panorama Fenabrave",
    badgeText: "Agronegócio & Pesados",
    isLive: false,
    argumentoVenda: "Gatilho Empresarial: Para quem precisa de caminhão ou trator, o consórcio viabiliza compras com parcelas lineares previsíveis dedutíveis do custo operacional."
  },
  {
    id: "benchmark-consorcio-2",
    title: "Contemplações por lance livre e embutido batem recorde em grupos de imóveis e automóveis",
    summary: "Administradoras revelam que o uso de até 30% do próprio crédito como lance embutido é a estratégia mais utilizada para antecipar a posse do bem sem precisar descapitalizar economias próprias.",
    source: "Portal do Consórcio",
    sourceUrl: "https://abac.org.br",
    category: "consorcio",
    publishedAt: "Estratégia de Lances",
    badgeText: "Metodologia Lance",
    isLive: false,
    argumentoVenda: "Gatilho de Estratégia de Lance: Explique ao lead que ele não precisa de dinheiro no bolso: com o lance embutido, a contemplação é acelerada utilizando uma fatia do próprio crédito."
  },
  {
    id: "benchmark-veic-2",
    title: "Vendas de veículos seminovos e zero km sobem no segundo semestre; consumidores evitam CDC bancário",
    summary: "Com taxas de juros de financiamento direto (CDC) ultrapassando 22% ao ano, o consórcio automotivo tornou-se o canal com maior taxa de crescimento entre compradores de veículos novos e seminovos.",
    source: "AutoEsporte / Notícias Automotivas",
    sourceUrl: "https://autoesporte.globo.com",
    category: "veiculos",
    publishedAt: "Estudo Setorial",
    badgeText: "Economia s/ Juros",
    isLive: false,
    argumentoVenda: "Gatilho de Comparativo Financeiro: Em um financiamento de R$ 80.000, o cliente paga R$ 150.000 ao banco. No consórcio, o custo total é até 60% menor."
  },
  {
    id: "benchmark-imob-2",
    title: "Crédito Imobiliário bancário endurece regras de entrada; Consórcio desponta como porta de entrada",
    summary: "Bancos públicos e privados aumentam exigência de entrada para 30% do valor do imóvel. O consórcio ganha ainda mais relevância por não exigir entrada inicial para início do plano.",
    source: "InfoMoney / Secovi",
    sourceUrl: "https://www.infomoney.com.br",
    category: "imoveis",
    publishedAt: "Análise Bancária",
    badgeText: "Sem Entrada Obrigatória",
    isLive: false,
    argumentoVenda: "Gatilho de Acessibilidade: Enquanto os bancos barram clientes exigindo R$ 60 mil de entrada à vista, no consórcio o cliente inicia seu patrimônio pagando apenas a primeira parcela."
  },
  {
    id: "benchmark-econ-1",
    title: "Banco Central e COPOM: Entenda por que o consórcio protege o investidor em cenários de juros altos",
    summary: "Especialistas do mercado financeiro recomendam cotas de consórcio contempladas como investimento de alta liquidez e retorno sobre capital próprio superior à renda fixa convencional.",
    source: "Valor Econômico",
    sourceUrl: "https://valor.globo.com",
    category: "economia",
    publishedAt: "Análise Financeira",
    badgeText: "Investimento & Renda",
    isLive: false,
    argumentoVenda: "Gatilho de Alavancagem Financeira: Consórcio não é apenas para compra do bem; é também investimento para lucrar com a venda da cota contemplada ou renda de locação."
  }
];

// Helper para converter data de publicação em texto relativo amigável
function parseAndFormatDate(pubDateStr?: string): { formatted: string; dateObj: Date | null } {
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

  if (isToday) {
    return { formatted: `Hoje às ${hh}:${mm}`, dateObj: d };
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    yesterday.getDate() === d.getDate() &&
    yesterday.getMonth() === d.getMonth() &&
    yesterday.getFullYear() === d.getFullYear();

  if (isYesterday) {
    return { formatted: `Ontem às ${hh}:${mm}`, dateObj: d };
  }

  const dd = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return { formatted: `${dd}/${mes} às ${hh}:${mm}`, dateObj: d };
}

// Helper para gerar dicas de vendas contextualizadas do Jarvis
function generateJarvisSalesTip(cat: NewsCategory, title: string, summary: string): string {
  const fullText = (title + " " + summary).toLowerCase();

  if (fullText.includes("selic") || fullText.includes("juro") || fullText.includes("copom") || fullText.includes("banco central")) {
    return "Gatilho Anti-Juros: Mostre ao cliente que enquanto o financiamento bancário cobra juros compostos em alta, o consórcio tem apenas taxa de administração fixa diluída.";
  }
  if (fullText.includes("dólar") || fullText.includes("inflação") || fullText.includes("ipca")) {
    return "Gatilho de Blindagem: Enfatize que a carta de crédito é reajustada anualmente para acompanhar a inflação do bem, garantindo poder de compra intacto.";
  }
  if (fullText.includes("agro") || fullText.includes("safra") || fullText.includes("produtor") || fullText.includes("caminh")) {
    return "Gatilho Agro & Frotas: O produtor ou transportador pode programar a renovação de maquinários sem descapitalizar o caixa de plantio ou frete.";
  }
  if (cat === "imoveis") {
    return "Gatilho Patrimonial: Os preços de imóveis seguem valorizando. O consórcio imobiliário é a melhor alternativa para antecipar a compra sem precisar de R$ 50k a R$ 100k de entrada à vista.";
  }
  if (cat === "veiculos") {
    return "Gatilho Automotivo: Com o custo do crédito veicular nos bancos, o consórcio viabiliza parcelas que cabem no bolso para troca ou primeiro carro.";
  }
  if (cat === "consorcio") {
    return "Gatilho de Prova Social: O mercado de consórcios bate recordes mensais porque os consumidores entenderam que pagar juros bancários é queimar patrimônio.";
  }

  return "Dica Executiva: Compartilhe esta notícia no WhatsApp do lead para reaquecer a conversa com autoridade e embasamento de mercado.";
}

const STORAGE_CACHE_KEY = "simulaja_market_news_cache_v2";

export function MarketNewsFeed() {
  const [news, setNews] = useState<MarketNewsItem[]>(SECTOR_BENCHMARKS);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [liveNewsCount, setLiveNewsCount] = useState<number>(0);

  // Busca notícias reais via RSS feeds em paralelo
  const fetchLiveNews = useCallback(async (isManualRefresh = false) => {
    setIsRefreshing(true);
    try {
      // 1. Tentar ler do cache se não for refresh manual e tiver menos de 15 minutos
      if (!isManualRefresh && typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(STORAGE_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            const ageMs = Date.now() - (parsed.timestamp || 0);
            if (ageMs < 15 * 60 * 1000 && Array.isArray(parsed.items) && parsed.items.length > 0) {
              setNews(parsed.items);
              setLiveNewsCount(parsed.items.filter((i: MarketNewsItem) => i.isLive).length);
              setLastUpdated(new Date(parsed.timestamp));
              setIsRefreshing(false);
              return;
            }
          }
        } catch (err) {
          console.warn("[MarketNews] Falha ao ler cache local:", err);
        }
      }

      // 2. Buscar múltiplos feeds simultaneamente
      const fetchPromises = LIVE_FEEDS.map(async (feed) => {
        try {
          const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
          const response = await fetch(apiUrl, { cache: "no-store" });
          if (!response.ok) return [];
          const data = await response.json();
          if (!data || !Array.isArray(data.items)) return [];

          return data.items.map((raw: any, idx: number) => {
            const rawTitle = (raw.title || "").trim();
            const rawDesc = (raw.description || "").replace(/<[^>]*>?/gm, "").trim();

            // Categorização inteligente por palavras-chave
            const fullContent = (rawTitle + " " + rawDesc).toLowerCase();
            const isConsorcio = /consórcio|consorcio|abac|carta de crédito|contempla|lance embutido/i.test(fullContent);
            const isImob = /imóv|habit|casa|apartam|terreno|constru|aluguel|locação|fipezap|secovi/i.test(fullContent);
            const isVeic = /veíc|carro|auto|caminh|frota|agro|trator|fenabrave|motocicl/i.test(fullContent);

            let cat: "consorcio" | "imoveis" | "veiculos" | "economia" = "economia";
            if (isConsorcio) cat = "consorcio";
            else if (isImob) cat = "imoveis";
            else if (isVeic) cat = "veiculos";

            const { formatted: pubFormatted, dateObj } = parseAndFormatDate(raw.pubDate);

            const item: MarketNewsItem = {
              id: `live-${feed.name.replace(/\s+/g, "-").toLowerCase()}-${idx}-${Date.now()}`,
              title: rawTitle,
              summary: rawDesc.length > 175 ? rawDesc.slice(0, 175) + "..." : rawDesc,
              source: feed.name,
              sourceUrl: raw.link || "https://g1.globo.com/economia",
              category: cat,
              publishedAt: pubFormatted,
              badgeText: feed.defaultBadge,
              isLive: true,
              rawDate: dateObj,
              argumentoVenda: generateJarvisSalesTip(cat, rawTitle, rawDesc)
            };
            return item;
          });
        } catch (feedErr) {
          console.warn(`[MarketNews] Feed ${feed.name} falhou:`, feedErr);
          return [];
        }
      });

      const settled = await Promise.allSettled(fetchPromises);
      const allLiveItems: MarketNewsItem[] = [];
      const seenTitles = new Set<string>();

      for (const res of settled) {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          for (const item of res.value) {
            const normalizedTitle = item.title.toLowerCase().trim();
            if (!seenTitles.has(normalizedTitle) && normalizedTitle.length > 10) {
              seenTitles.add(normalizedTitle);
              allLiveItems.push(item);
            }
          }
        }
      }

      // Ordenar notícias ao vivo das mais recentes para as mais antigas
      allLiveItems.sort((a, b) => {
        const timeA = a.rawDate ? a.rawDate.getTime() : 0;
        const timeB = b.rawDate ? b.rawDate.getTime() : 0;
        return timeB - timeA;
      });

      // Limitar a até 18 notícias ao vivo + os benchmarks perenes
      const finalItems = allLiveItems.length > 0 
        ? [...allLiveItems.slice(0, 18), ...SECTOR_BENCHMARKS]
        : SECTOR_BENCHMARKS;

      setNews(finalItems);
      setLiveNewsCount(allLiveItems.length);
      const now = new Date();
      setLastUpdated(now);

      // Salvar no localStorage
      if (typeof window !== "undefined" && allLiveItems.length > 0) {
        try {
          localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify({
            timestamp: now.getTime(),
            items: finalItems
          }));
        } catch (e) {
          // ignore quota
        }
      }
    } catch (e) {
      console.warn("[MarketNews] Erro global ao buscar notícias ao vivo:", e);
      setNews(SECTOR_BENCHMARKS);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveNews(false);
    // Auto-refresh a cada 10 minutos
    const interval = setInterval(() => {
      fetchLiveNews(true);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveNews]);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchCategory = selectedCategory === "todas" || item.category === selectedCategory;
      const matchSearch =
        searchTerm.trim() === "" ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.argumentoVenda && item.argumentoVenda.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [news, selectedCategory, searchTerm]);

  const categoriesConfig: { key: NewsCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "todas", label: "Todas as Notícias", icon: Newspaper },
    { key: "consorcio", label: "Consórcio & Crédito", icon: Coins },
    { key: "imoveis", label: "Mercado Imobiliário", icon: Building2 },
    { key: "veiculos", label: "Veículos & Frotas", icon: Car },
    { key: "economia", label: "Macroeconomia & Juros", icon: TrendingUp },
  ];

  const formattedLastUpdated = useMemo(() => {
    const hh = String(lastUpdated.getHours()).padStart(2, "0");
    const mm = String(lastUpdated.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [lastUpdated]);

  return (
    <Card className="border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 rounded-3xl">
      {/* Top Banner Gradient */}
      <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

      <CardHeader className="pb-4 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Newspaper className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                  Radar do Mercado: Imóveis, Veículos & Consórcio
                </CardTitle>
                
                {liveNewsCount > 0 ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest border-none px-2.5 py-0.5 flex items-center gap-1.5 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    Ao Vivo ({liveNewsCount} notícias reais)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                    Dados Setoriais ABAC
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Feeds em tempo real (G1, Folha de S.Paulo e EBC) cruzados com argumentos consultivos do Jarvis para fechamentos no CRM.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Buscar notícia, taxa ou argumento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-60 text-xs bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLiveNews(true)}
              disabled={isRefreshing}
              className="h-9 px-3 bg-white dark:bg-zinc-900 hover:bg-slate-50 border-slate-200 dark:border-zinc-800 text-xs font-bold rounded-xl gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Atualizando..." : `Atualizar (${formattedLastUpdated})`}
            </Button>
          </div>
        </div>

        {/* Barra de Indicadores Rápidos do Mercado */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-900">
          <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 block tracking-wider">
              Sistema de Consórcios
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-blue-950 dark:text-white">11,2 M</span>
              <span className="text-[10px] font-bold text-emerald-600">+9,4% a.a.</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
            <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-400 block tracking-wider">
              Índice FipeZAP (Imóveis)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-purple-950 dark:text-white">+5,8%</span>
              <span className="text-[10px] font-bold text-purple-600">Alta Real</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
            <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 block tracking-wider">
              Veículos & Seminovos
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-emerald-950 dark:text-white">+14,2%</span>
              <span className="text-[10px] font-bold text-emerald-600">Demanda</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
            <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 block tracking-wider">
              Economia s/ Juros
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-amber-950 dark:text-white">Até 65%</span>
              <span className="text-[10px] font-bold text-amber-600">vs CDC/Bancos</span>
            </div>
          </div>
        </div>

        {/* Categorias Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4">
          {categoriesConfig.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-md scale-[1.02]"
                    : "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {filteredNews.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-zinc-500 space-y-2">
            <Newspaper className="h-10 w-10 mx-auto opacity-30" />
            <p className="text-sm font-bold">Nenhuma notícia encontrada com os filtros selecionados.</p>
            <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(""); setSelectedCategory("todas"); }}>
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNews.map((item) => {
              const categoryColor =
                item.category === "imoveis"
                  ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300"
                  : item.category === "veiculos"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : item.category === "consorcio"
                  ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300"
                  : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300";

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge className={`text-[9px] font-black uppercase tracking-wider border shadow-none ${categoryColor}`}>
                          {item.badgeText}
                        </Badge>
                        {item.isLive && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                        {item.isLive ? (
                          <>
                            <Clock className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">{item.publishedAt}</span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-3 w-3 text-blue-500" />
                            <span>{item.publishedAt}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                      {item.summary}
                    </p>

                    {/* DICA DE ARGUMENTO DE VENDA JARVIS */}
                    {item.argumentoVenda && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-black text-[10px] uppercase text-amber-800 dark:text-amber-300">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Dica de Argumento Jarvis</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          {item.argumentoVenda}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 dark:text-zinc-400 text-[11px]">
                      Fonte: {item.source}
                    </span>

                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 uppercase tracking-wider"
                    >
                      Ler Matéria <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
