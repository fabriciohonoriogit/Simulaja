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
  Square,
  Zap,
  BarChart3,
  Bot
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
    { 
      key: "todas" as DailyNewsCategory, 
      label: "Todas", 
      icon: Newspaper, 
      count: news.length,
      activeColor: "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg shadow-indigo-900/20" 
    },
    { 
      key: "politica" as DailyNewsCategory, 
      label: "🏛️ Política & Congresso", 
      icon: Landmark, 
      count: news.filter(n => n.category === "politica").length,
      activeColor: "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
    },
    { 
      key: "precos" as DailyNewsCategory, 
      label: "📈 Preços, Inflação & Combustíveis", 
      icon: TrendingUp, 
      count: news.filter(n => n.category === "precos").length,
      activeColor: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
    },
    { 
      key: "geral" as DailyNewsCategory, 
      label: "📰 Geral / Principais Jornais", 
      icon: Scale, 
      count: news.filter(n => n.category === "geral").length,
      activeColor: "bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white shadow-lg shadow-purple-500/25"
    },
    { 
      key: "consorcio" as DailyNewsCategory, 
      label: "🎯 Impacto no Consórcio", 
      icon: Coins, 
      count: news.filter(n => n.category === "consorcio").length,
      activeColor: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg shadow-amber-500/25"
    },
  ];

  const formattedLastUpdated = useMemo(() => {
    const hh = String(lastUpdated.getHours()).padStart(2, "0");
    const mm = String(lastUpdated.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [lastUpdated]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BANNER PRINCIPAL COM ÁUDIO BRIEFING JARVIS - VISUAL MODERNO, CORES VIVAS E ALTA ENERGIA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 border border-slate-200/90 dark:border-zinc-800 shadow-xl shadow-indigo-500/5 p-6 sm:p-8 backdrop-blur-xl">
        {/* Glows decorativos de fundo */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/20 via-cyan-400/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-400/20 via-teal-400/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-gradient-to-r from-red-500 via-rose-600 to-red-600 text-white font-black uppercase text-[10px] tracking-widest px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md shadow-red-500/25 animate-pulse">
                <Radio className="h-3.5 w-3.5 text-white animate-spin-slow" />
                AO VIVO NO AR
              </span>

              <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <Clock className="h-3 w-3 text-cyan-600" /> Atualizado às {formattedLastUpdated}
              </Badge>

              <Badge variant="outline" className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 text-[10px] font-black px-3 py-1 rounded-full shadow-xs">
                G1 • Folha • Valor • Agência Brasil • BCB
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-900 dark:from-white dark:via-blue-200 dark:to-indigo-300 bg-clip-text text-transparent flex items-center gap-2.5">
              Briefing Executivo & Radar do Mercado
            </h2>

            <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
              Monitore movimentações de <strong className="text-blue-600 dark:text-cyan-400 font-bold">política econômica</strong>, taxas de juros, <strong className="text-emerald-600 dark:text-emerald-400 font-bold">inflação e combustíveis</strong> com insights neurais do <strong className="text-indigo-600 dark:text-indigo-400 font-bold">Jarvis</strong> para fechar vendas no dia.
            </p>
          </div>

          {/* CARD DE CONTROLE DE ÁUDIO DO JARVIS - STUDIO DE VOZ NEURAL */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-zinc-700 shadow-xl shadow-indigo-500/10 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-2xl transition-all ${
                isSpeaking 
                  ? "bg-gradient-to-tr from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/40 animate-pulse scale-105" 
                  : "bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-md shadow-indigo-500/25"
              }`}>
                <Volume2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-cyan-300 flex items-center gap-1.5">
                  Voz do Jarvis
                  {isSpeaking && (
                    <span className="flex gap-0.5 items-end h-3.5 ml-1">
                      <span className="w-1 bg-cyan-500 rounded-full animate-[bounce_0.6s_infinite] h-2.5" />
                      <span className="w-1 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite] h-3.5" />
                      <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_0.5s_infinite] h-2" />
                      <span className="w-1 bg-blue-500 rounded-full animate-[bounce_0.7s_infinite] h-3" />
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {isSpeaking ? (activeSpeakingTitle || "Narrando briefing diário...") : "Síntese executiva em alta fidelidade"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-zinc-700 sm:pl-4">
              <Button
                onClick={handlePlayBriefing}
                className={`h-11 px-5 font-black uppercase text-xs tracking-wider rounded-xl transition-all flex items-center gap-2 ${
                  isSpeaking
                    ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg shadow-rose-500/30 animate-pulse"
                    : "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:scale-[1.03] active:scale-[0.98]"
                }`}
              >
                {isSpeaking ? (
                  <>
                    <Square className="h-4 w-4 fill-current" /> Pausar Narração
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

        {/* TICKER DE COTAÇÕES & TAXAS EM TEMPO REAL - 6 CARDS VIBRANTES E COLORIDOS */}
        <div className="mt-7 pt-6 border-t border-slate-200/80 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. SELIC - VERDE ESMERALDA */}
          <div className="group relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-emerald-950/10 border border-emerald-200/90 dark:border-emerald-800/70 shadow-sm hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="p-1 rounded-md bg-emerald-500 text-white shadow-xs">
                  <TrendingUp className="h-3 w-3" />
                </span>
                Selic (BCB)
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                a.a.
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-emerald-950 dark:text-white tracking-tight">
                {rates.selic.toFixed(2).replace(".", ",")}%
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 block truncate">
              Crédito bancário caro
            </span>
          </div>

          {/* 2. DÓLAR COMERCIAL - CIANO / AZUL */}
          <div className="group relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-cyan-50/90 via-white to-sky-50/50 dark:from-cyan-950/30 dark:via-zinc-900 dark:to-cyan-950/10 border border-cyan-200/90 dark:border-cyan-800/70 shadow-sm hover:shadow-xl hover:shadow-cyan-500/15 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                <span className="p-1 rounded-md bg-cyan-500 text-white shadow-xs">
                  <DollarSign className="h-3 w-3" />
                </span>
                Dólar Comercial
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200">
                PTAX
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-cyan-950 dark:text-white tracking-tight">
                R$ {rates.dolar.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 mt-1 block truncate">
              Euro: R$ {rates.euro.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* 3. INFLAÇÃO IPCA - ROXO / VIOLETA */}
          <div className="group relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/50 dark:from-purple-950/30 dark:via-zinc-900 dark:to-purple-950/10 border border-purple-200/90 dark:border-purple-800/70 shadow-sm hover:shadow-xl hover:shadow-purple-500/15 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                <span className="p-1 rounded-md bg-purple-500 text-white shadow-xs">
                  <Scale className="h-3 w-3" />
                </span>
                Inflação (IPCA)
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
                12m
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-purple-950 dark:text-white tracking-tight">
                {rates.ipca.toFixed(2).replace(".", ",")}%
              </span>
            </div>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 mt-1 block truncate">
              Reajuste de bens
            </span>
          </div>

          {/* 4. GASOLINA & COMBUSTÍVEIS - ÂMBAR / LARANJA */}
          <div className="group relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 dark:from-amber-950/30 dark:via-zinc-900 dark:to-amber-950/10 border border-amber-200/90 dark:border-amber-800/70 shadow-sm hover:shadow-xl hover:shadow-amber-500/15 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span className="p-1 rounded-md bg-amber-500 text-white shadow-xs">
                  <Fuel className="h-3 w-3" />
                </span>
                Gasolina Comum
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                /L
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-amber-950 dark:text-white tracking-tight">
                R$ {rates.gasolinaMedia.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 mt-1 block truncate">
              Etanol: R$ {rates.etanolMedio.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* 5. TABELA FIPE - AZUL ROYAL / ÍNDIGO */}
          <div className="group relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/50 dark:from-blue-950/30 dark:via-zinc-900 dark:to-blue-950/10 border border-blue-200/90 dark:border-blue-800/70 shadow-sm hover:shadow-xl hover:shadow-blue-500/15 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <span className="p-1 rounded-md bg-blue-600 text-white shadow-xs">
                  <Car className="h-3 w-3" />
                </span>
                Tabela FIPE
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                Valoriz.
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-blue-950 dark:text-white tracking-tight">
                {rates.fipeVariacaoSemestral}
              </span>
            </div>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 mt-1 block truncate">
              Veículos novos e seminovos
            </span>
          </div>

          {/* 6. INCC IMÓVEIS - ROSA / CARMIM */}
          <div className="group relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-rose-50/90 via-white to-pink-50/50 dark:from-rose-950/30 dark:via-zinc-900 dark:to-rose-950/10 border border-rose-200/90 dark:border-rose-800/70 shadow-sm hover:shadow-xl hover:shadow-rose-500/15 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <span className="p-1 rounded-md bg-rose-500 text-white shadow-xs">
                  <Building className="h-3 w-3" />
                </span>
                INCC (Imóveis)
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                a.a.
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-rose-950 dark:text-white tracking-tight">
                {rates.incc.toFixed(2).replace(".", ",")}%
              </span>
            </div>
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 mt-1 block truncate">
              Correção de cartas
            </span>
          </div>
        </div>
      </div>

      {/* FILTROS DE CATEGORIA, BUSCA E ATUALIZAÇÃO - DESIGN VIBRANTE E TÁTIL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Pills de Categoria Coloridas */}
        <div className="flex flex-wrap items-center gap-2">
          {categoriesConfig.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm ${
                  active
                    ? `${cat.activeColor} scale-[1.03] ring-2 ring-indigo-500/20`
                    : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:border-slate-300 hover:scale-[1.01]"
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  active 
                    ? "bg-white/25 text-white" 
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Busca e Atualizar */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar notícias, inflação, fontes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl focus-visible:ring-indigo-500 font-medium shadow-xs"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => loadNews(true)}
            disabled={isRefreshing}
            className="h-10 px-4 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl font-black text-xs uppercase tracking-wider text-slate-800 dark:text-zinc-200 gap-2 hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:border-indigo-300 transition-all shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 text-indigo-600 dark:text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* FEED DE NOTÍCIAS CARDS - VISUAL MODERNO, ALTO CONTRASTE E INSIGHTS DO JARVIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNews.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 space-y-3 shadow-sm">
            <Newspaper className="h-12 w-12 text-slate-400 mx-auto animate-pulse" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">Nenhuma notícia encontrada</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              Nenhum item corresponde ao termo pesquisado. Tente outra palavra-chave ou clique em Atualizar.
            </p>
            <Button size="sm" variant="outline" className="rounded-xl font-bold" onClick={() => { setSearchTerm(""); setSelectedCategory("todas"); }}>
              Limpar Filtros
            </Button>
          </div>
        ) : (
          filteredNews.map((item) => {
            const isCurrentlyReading = isSpeaking && activeSpeakingTitle === item.title;

            // Cores e Badges temáticas por categoria
            let catTheme = {
              label: "Geral",
              badgeColor: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
              topStripe: "from-purple-500 to-indigo-500",
              sourceColor: "text-purple-600 dark:text-purple-400"
            };

            if (item.category === "politica") {
              catTheme = {
                label: "🏛️ Política",
                badgeColor: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
                topStripe: "from-blue-500 to-cyan-500",
                sourceColor: "text-blue-600 dark:text-blue-400"
              };
            } else if (item.category === "precos") {
              catTheme = {
                label: "📈 Preços & Economia",
                badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
                topStripe: "from-emerald-500 to-teal-500",
                sourceColor: "text-emerald-600 dark:text-emerald-400"
              };
            } else if (item.category === "consorcio") {
              catTheme = {
                label: "🎯 Consórcio & Crédito",
                badgeColor: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
                topStripe: "from-amber-500 to-orange-500",
                sourceColor: "text-amber-600 dark:text-amber-400"
              };
            }

            return (
              <Card
                key={item.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-white dark:bg-zinc-900/90 ${
                  isCurrentlyReading
                    ? "border-cyan-500 ring-2 ring-cyan-500/30 shadow-xl shadow-cyan-500/15"
                    : "border-slate-200/90 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-zinc-700"
                }`}
              >
                {/* Linha de acento decorativa superior */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${catTheme.topStripe}`} />

                {/* Indicador de leitura de áudio em tempo real */}
                {isCurrentlyReading && (
                  <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 animate-pulse" />
                )}

                <CardHeader className="pb-3 pt-4 px-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${catTheme.badgeColor}`}>
                      {catTheme.label}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 font-bold">
                      <Clock className="h-3 w-3" />
                      <span>{item.publishedAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-black uppercase tracking-wider ${catTheme.sourceColor}`}>
                      {item.source}
                    </span>
                    {item.isLive && (
                      <span className="flex h-2 w-2 relative" title="Feed em tempo real">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>

                  <CardTitle className="text-[15px] font-black text-slate-950 dark:text-white leading-snug line-clamp-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal line-clamp-3">
                    {item.summary}
                  </p>

                  {/* BOX DE INSIGHT EXECUTIVO DO JARVIS - DESIGN DOURADO / ÂMBAR DE ALTO VALOR */}
                  {item.argumentoVenda && (
                    <div className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-yellow-500/10 border border-amber-200/90 dark:border-amber-800/70 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <span className="p-1 rounded-md bg-amber-500 text-white shadow-xs">
                            <Sparkles className="h-3 w-3" />
                          </span>
                          Insight Estratégico do Jarvis
                        </span>

                        <button
                          onClick={() => handleCopyArgument(item.argumentoVenda!, item.id)}
                          className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                            copiedId === item.id
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200"
                          }`}
                          title="Copiar argumento para enviar no WhatsApp do cliente"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="h-3 w-3" /> Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copiar Dica
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-amber-950 dark:text-amber-100 italic font-semibold leading-relaxed">
                        “{item.argumentoVenda}”
                      </p>
                    </div>
                  )}

                  {/* AÇÕES DE LEITURA EM ÁUDIO E LINK EXTERNO */}
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReadSingleNews(item)}
                      className={`h-8 px-3 rounded-xl text-[11px] font-bold gap-1.5 transition-all ${
                        isCurrentlyReading
                          ? "bg-cyan-500 hover:bg-cyan-600 text-white font-black shadow-md shadow-cyan-500/30"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <Volume2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                      {isCurrentlyReading ? "Parar Leitura" : "Ouvir Notícia"}
                    </Button>

                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-black text-indigo-600 dark:text-cyan-400 hover:text-indigo-800 dark:hover:text-cyan-300 hover:underline flex items-center gap-1"
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
