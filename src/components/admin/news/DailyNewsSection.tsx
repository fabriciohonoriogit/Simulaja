import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Newspaper,
  TrendingUp,
  DollarSign,
  Landmark,
  Scale,
  Fuel,
  Car,
  Building,
  RefreshCw,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Coins,
  ShieldCheck,
  Flame,
  ArrowUpRight,
  Clock,
  Play,
  Square
} from "lucide-react";
import {
  DailyNewsCategory,
  DailyNewsItem,
  MarketRates,
  DEFAULT_MARKET_RATES,
  fetchDailyNews,
  getDailyBriefingScript
} from "@/services/newsService";
import { speakJarvisText, stopVoice } from "@/lib/voiceService";
import { useToast } from "@/components/ui/use-toast";

interface DailyNewsSectionProps {
  userName?: string;
}

export function DailyNewsSection({ userName = "Fabrício" }: DailyNewsSectionProps) {
  const [news, setNews] = useState<DailyNewsItem[]>([]);
  const [rates, setRates] = useState<MarketRates>(DEFAULT_MARKET_RATES);
  const [selectedCategory, setSelectedCategory] = useState<DailyNewsCategory>("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Áudio do Jarvis
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakingTitle, setActiveSpeakingTitle] = useState<string | null>(null);
  const { toast } = useToast();

  const loadNews = useCallback(async (force = false) => {
    setIsRefreshing(true);
    try {
      const data = await fetchDailyNews(force);
      setNews(data.items);
      setRates(data.rates);
      setLastUpdated(data.lastUpdated);
    } catch (e) {
      console.warn("⚠️ Erro ao atualizar notícias:", e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNews(false);
    // Atualização automática a cada 10 minutos
    const timer = setInterval(() => {
      loadNews(true);
    }, 10 * 60 * 1000);
    return () => {
      clearInterval(timer);
      stopVoice();
    };
  }, [loadNews]);

  // Briefing Executivo Geral narrado pelo Jarvis
  const handlePlayBriefing = () => {
    if (isSpeaking) {
      stopVoice();
      setIsSpeaking(false);
      setActiveSpeakingTitle(null);
      return;
    }

    const script = getDailyBriefingScript(news, rates, userName);
    setActiveSpeakingTitle("Briefing Executivo Geral do Dia");
    setIsSpeaking(true);

    speakJarvisText(
      script,
      () => {
        setIsSpeaking(true);
      },
      () => {
        setIsSpeaking(false);
        setActiveSpeakingTitle(null);
      }
    );
  };

  // Leitura de uma notícia individual pelo Jarvis
  const handleReadSingleNews = (item: DailyNewsItem) => {
    if (isSpeaking && activeSpeakingTitle === item.title) {
      stopVoice();
      setIsSpeaking(false);
      setActiveSpeakingTitle(null);
      return;
    }

    stopVoice();
    setActiveSpeakingTitle(item.title);
    setIsSpeaking(true);

    const textToSpeak = `Notícia do portal ${item.source}. Manchete: ${item.title}. Resumo: ${item.summary}. Insight do Jarvis para vendas: ${item.argumentoVenda || "Utilize este cenário para reforçar o valor do consórcio sem juros."}`;

    speakJarvisText(
      textToSpeak,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        setActiveSpeakingTitle(null);
      }
    );
  };

  const handleCopyArgument = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Argumento Copiado! 📋",
      description: "Pronto para colar no WhatsApp do seu cliente ou lead."
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

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

  const categoriesConfig = [
    { key: "todas" as DailyNewsCategory, label: "Todas", icon: Newspaper, count: news.length },
    { key: "politica" as DailyNewsCategory, label: "🏛️ Política & Congresso", icon: Landmark, count: news.filter(n => n.category === "politica").length },
    { key: "precos" as DailyNewsCategory, label: "📈 Preços, Inflação & Combustíveis", icon: TrendingUp, count: news.filter(n => n.category === "precos").length },
    { key: "geral" as DailyNewsCategory, label: "📰 Geral / Principais Jornais", icon: Scale, count: news.filter(n => n.category === "geral").length },
    { key: "consorcio" as DailyNewsCategory, label: "🎯 Impacto no Consórcio", icon: Coins, count: news.filter(n => n.category === "consorcio").length },
  ];

  const formattedLastUpdated = useMemo(() => {
    const hh = String(lastUpdated.getHours()).padStart(2, "0");
    const mm = String(lastUpdated.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [lastUpdated]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BANNER PRINCIPAL COM ÁUDIO BRIEFING JARVIS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-[10px] tracking-widest border-none px-3 py-1 flex items-center gap-1.5 shadow-lg shadow-blue-500/30">
                <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-300" />
                AO VIVO NO AR
              </Badge>
              <Badge variant="outline" className="text-cyan-300 border-cyan-800/80 bg-cyan-950/40 text-[10px] font-bold">
                Atualizado às {formattedLastUpdated}
              </Badge>
              <Badge variant="outline" className="text-emerald-300 border-emerald-800/80 bg-emerald-950/40 text-[10px] font-bold">
                G1 • Folha • Valor • Agência Brasil • BCB
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Briefing Executivo & Notícias do Dia
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Acompanhe as principais movimentações de <strong className="text-cyan-300">política</strong>, oscilações de <strong className="text-emerald-300">preços e inflação</strong>, manchetes dos maiores jornais e argumentos estratégicos do <strong className="text-indigo-300">Jarvis</strong> para fechar vendas no dia.
            </p>
          </div>

          {/* CARD DE CONTROLE DE ÁUDIO DO JARVIS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-xl shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${isSpeaking ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40 animate-pulse" : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"}`}>
                <Volume2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                  Voz do Jarvis
                  {isSpeaking && (
                    <span className="flex gap-0.5 items-end h-3 ml-1">
                      <span className="w-1 bg-cyan-300 animate-[bounce_0.6s_infinite] h-2" />
                      <span className="w-1 bg-cyan-300 animate-[bounce_0.8s_infinite] h-3" />
                      <span className="w-1 bg-cyan-300 animate-[bounce_0.5s_infinite] h-2.5" />
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isSpeaking ? (activeSpeakingTitle || "Narrando briefing...") : "Síntese executiva em alta fidelidade"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-3">
              <Button
                onClick={handlePlayBriefing}
                className={`h-11 px-5 font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 ${
                  isSpeaking
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black shadow-emerald-500/20 hover:scale-105"
                }`}
              >
                {isSpeaking ? (
                  <>
                    <Square className="h-4 w-4 fill-current" /> Pausar Áudio
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" /> Ouvir Briefing do Jarvis
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* TICKER DE COTAÇÕES & PREÇOS EM TEMPO REAL */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Selic */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" /> Selic (BCB)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-white">{rates.selic.toFixed(2).replace(".", ",")}%</span>
              <span className="text-[10px] font-bold text-amber-400">a.a.</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5">Crédito bancário caro</span>
          </div>

          {/* Dólar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-cyan-400" /> Dólar Comercial
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-white">R$ {rates.dolar.toFixed(2).replace(".", ",")}</span>
              <span className="text-[10px] font-bold text-cyan-400">PTAX</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5">Euro: R$ {rates.euro.toFixed(2).replace(".", ",")}</span>
          </div>

          {/* IPCA */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Scale className="h-3 w-3 text-purple-400" /> Inflação (IPCA)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-white">{rates.ipca.toFixed(2).replace(".", ",")}%</span>
              <span className="text-[10px] font-bold text-purple-400">12m</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5">Reajuste de bens</span>
          </div>

          {/* Combustíveis */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Fuel className="h-3 w-3 text-amber-400" /> Gasolina Comum
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-white">R$ {rates.gasolinaMedia.toFixed(2).replace(".", ",")}</span>
              <span className="text-[10px] font-bold text-amber-400">/L</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5">Etanol: R$ {rates.etanolMedio.toFixed(2).replace(".", ",")}</span>
          </div>

          {/* Tabela FIPE */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Car className="h-3 w-3 text-blue-400" /> Tabela FIPE
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-white">{rates.fipeVariacaoSemestral}</span>
              <span className="text-[10px] font-bold text-emerald-400">Valoriz.</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5">Veículos novos e seminovos</span>
          </div>

          {/* INCC Construção Civil */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Building className="h-3 w-3 text-indigo-400" /> INCC (Imóveis)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-white">{rates.incc.toFixed(2).replace(".", ",")}%</span>
              <span className="text-[10px] font-bold text-indigo-400">a.a.</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5">Correção de cartas</span>
          </div>
        </div>
      </div>

      {/* FILTROS DE CATEGORIA, BUSCA E ATUALIZAÇÃO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Pills de Categoria */}
        <div className="flex flex-wrap items-center gap-2">
          {categoriesConfig.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 scale-[1.02] shadow-md"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  active ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-950" : "bg-slate-100 dark:bg-zinc-800 text-slate-500"
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Busca e Atualizar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Buscar em política, preços ou jornais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => loadNews(true)}
            disabled={isRefreshing}
            className="h-10 px-3.5 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl font-black text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300 gap-1.5 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* FEED DE NOTÍCIAS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNews.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 space-y-3">
            <Newspaper className="h-10 w-10 text-slate-400 mx-auto animate-pulse" />
            <h3 className="text-base font-black text-slate-800 dark:text-white">Nenhuma notícia encontrada</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Nenhum item corresponde ao termo pesquisado. Tente outra palavra-chave ou clique em Atualizar.
            </p>
            <Button size="sm" variant="outline" onClick={() => { setSearchTerm(""); setSelectedCategory("todas"); }}>
              Limpar Filtros
            </Button>
          </div>
        ) : (
          filteredNews.map((item) => {
            const isCurrentlyReading = isSpeaking && activeSpeakingTitle === item.title;

            // Badges por categoria
            let catBadge = { label: "Geral", color: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-zinc-800 dark:text-zinc-300" };
            if (item.category === "politica") {
              catBadge = { label: "🏛️ Política", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300" };
            } else if (item.category === "precos") {
              catBadge = { label: "📈 Preços & Economia", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300" };
            } else if (item.category === "consorcio") {
              catBadge = { label: "🎯 Consórcio & Crédito", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300" };
            }

            return (
              <Card
                key={item.id}
                className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-zinc-950 ${
                  isCurrentlyReading
                    ? "border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10"
                    : "border-slate-200/90 dark:border-zinc-800/90 hover:border-slate-300 dark:hover:border-zinc-700"
                }`}
              >
                {/* Indicador de leitura em áudio */}
                {isCurrentlyReading && (
                  <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 animate-pulse" />
                )}

                <CardHeader className="pb-3 pt-4 px-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 ${catBadge.color}`}>
                      {catBadge.label}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                      <Clock className="h-3 w-3" />
                      <span>{item.publishedAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {item.source}
                    </span>
                    {item.isLive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Feed em tempo real" />
                    )}
                  </div>

                  <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-3">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>

                  {/* BOX DE INSIGHT EXECUTIVO DO JARVIS */}
                  {item.argumentoVenda && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-amber-500" /> Insight do Jarvis
                        </span>
                        <button
                          onClick={() => handleCopyArgument(item.argumentoVenda!, item.id)}
                          className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-bold transition-colors"
                          title="Copiar dica para WhatsApp"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" /> Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copiar Dica
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-zinc-300 italic font-medium leading-normal">
                        {item.argumentoVenda}
                      </p>
                    </div>
                  )}

                  {/* AÇÕES DE LEITURA E LINK EXTERNO */}
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReadSingleNews(item)}
                      className={`h-8 px-2.5 rounded-lg text-[11px] font-bold gap-1.5 transition-all ${
                        isCurrentlyReading
                          ? "bg-cyan-500 text-slate-950 font-black hover:bg-cyan-600"
                          : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Volume2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                      {isCurrentlyReading ? "Parar Leitura" : "Ouvir Notícia"}
                    </Button>

                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Ler no portal <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
