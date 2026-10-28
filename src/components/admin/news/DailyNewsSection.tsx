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
  Building2,
  RefreshCw,
  Search,
  Sparkles,
  Volume2,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Coins,
  ArrowUpRight,
  Clock,
  Play,
  Square,
  BarChart3,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Percent,
  Sliders,
  ArrowRight
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

  // Simulador na aba "Valores do Mercado"
  const [simSegment, setSimSegment] = useState<"veiculos" | "imobiliario">("imobiliario");
  const [simCreditValue, setSimCreditValue] = useState<number>(250000);
  const [copiedPitch, setCopiedPitch] = useState(false);

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

  // Briefing Executivo adaptado à aba selecionada pelo Jarvis
  const handlePlayBriefing = () => {
    if (isSpeaking) {
      stopVoice();
      setIsSpeaking(false);
      setActiveSpeakingTitle(null);
      return;
    }

    const script = getDailyBriefingScript(news, rates, userName, selectedCategory);
    let briefingLabel = "Briefing Executivo Geral do Dia";
    if (selectedCategory === "imobiliario") briefingLabel = "Briefing do Mercado Imobiliário";
    if (selectedCategory === "veiculos") briefingLabel = "Briefing do Setor Automotivo";
    if (selectedCategory === "politica") briefingLabel = "Radar Político de Brasília";
    if (selectedCategory === "financas") briefingLabel = "Radar Financeiro & Juros";
    if (selectedCategory === "valores") briefingLabel = "Boletim de Valores e Cotações";

    setActiveSpeakingTitle(briefingLabel);
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

    const textToSpeak = `Notícia do portal ${item.source}. Manchete: ${item.title}. Resumo: ${item.summary}. Insight do Jarvis para vendas: ${
      item.argumentoVenda || "Utilize este cenário para reforçar o valor do consórcio sem juros."
    }`;

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

  // Cálculos do simulador comparativo de mercado
  const simulationResults = useMemo(() => {
    const isAuto = simSegment === "veiculos";
    // Taxas médias do mercado financeiro brasileiro
    const jurosBancoAno = isAuto ? 0.24 : 0.12; // CET 24% a.a. veículos / 12% a.a. imóveis
    const prazoAnos = isAuto ? 5 : 20; // 60 meses veículos / 240 meses imóveis
    const taxaAdmConsorcio = isAuto ? 0.15 : 0.18; // 15% taxa total veículos / 18% imóveis

    // No banco (juros compostos aproximados na Tabela SAC / Price)
    const custoJurosBanco = simCreditValue * (jurosBancoAno * (prazoAnos * 0.55));
    const totalBanco = simCreditValue + custoJurosBanco;

    // No consórcio (taxa administrativa linear)
    const custoConsorcio = simCreditValue * taxaAdmConsorcio;
    const totalConsorcio = simCreditValue + custoConsorcio;

    // Economia líquida
    const economia = Math.max(0, totalBanco - totalConsorcio);

    // Parcela cheia e meia parcela no consórcio
    const meses = prazoAnos * 12;
    const parcelaCheia = totalConsorcio / meses;
    const meiaParcela = parcelaCheia * 0.5;

    return {
      totalBanco,
      totalConsorcio,
      economia,
      parcelaCheia,
      meiaParcela,
      prazoMeses: meses,
      jurosPercent: (jurosBancoAno * 100).toFixed(0),
      taxaAdmPercent: (taxaAdmConsorcio * 100).toFixed(0)
    };
  }, [simSegment, simCreditValue]);

  const handleCopySimulatorPitch = () => {
    const segmentName = simSegment === "veiculos" ? "veículo" : "imóvel";
    const creditStr = simCreditValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const economiaStr = simulationResults.economia.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const meiaParcelaStr = simulationResults.meiaParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const pitch = `Fala meu amigo! Fiz uma simulação aqui comparando o seu ${segmentName} de ${creditStr} no financiamento tradicional dos bancos com a nossa carta de crédito do Consórcio SimulaJá Magalu.
    
No financiamento bancário com as taxas Selic atuais, você pagaria mais de ${simulationResults.totalBanco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} por conta dos juros compostos.
    
Já no nosso consórcio, você paga apenas ${simulationResults.totalConsorcio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} e começa com o plano de MEIA PARCELA a partir de ${meiaParcelaStr}/mês até a contemplação!
    
São ${economiaStr} que continuam no seu bolso em vez de irem para o banco. Vamos bater o martelo nessa proposta hoje?`;

    navigator.clipboard.writeText(pitch);
    setCopiedPitch(true);
    toast({
      title: "Pitch Copiado com Sucesso! 🚀",
      description: "Mensagem personalizada pronta para o WhatsApp do seu cliente."
    });
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchCategory =
        selectedCategory === "todas"
          ? true
          : item.category === selectedCategory;

      const matchSearch =
        searchTerm.trim() === "" ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.argumentoVenda && item.argumentoVenda.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchCategory && matchSearch;
    });
  }, [news, selectedCategory, searchTerm]);

  // Configuração das 5 abas principais solicitadas pelo usuário + visão consolidada "Todas"
  const categoriesConfig = [
    {
      key: "todas" as DailyNewsCategory,
      label: "Todas as Notícias",
      shortLabel: "Todas",
      icon: Newspaper,
      count: news.length,
      activeColor: "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg shadow-indigo-900/20"
    },
    {
      key: "imobiliario" as DailyNewsCategory,
      label: "Mercado Imobiliário",
      shortLabel: "🏠 Imobiliário",
      icon: Building2,
      count: news.filter((n) => n.category === "imobiliario").length,
      activeColor: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
    },
    {
      key: "veiculos" as DailyNewsCategory,
      label: "Veículos & Frotas",
      shortLabel: "🚗 Veículos",
      icon: Car,
      count: news.filter((n) => n.category === "veiculos").length,
      activeColor: "bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
    },
    {
      key: "politica" as DailyNewsCategory,
      label: "Política & Brasília",
      shortLabel: "🏛️ Política",
      icon: Landmark,
      count: news.filter((n) => n.category === "politica").length,
      activeColor: "bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
    },
    {
      key: "financas" as DailyNewsCategory,
      label: "Finanças & Economia",
      shortLabel: "💰 Finanças",
      icon: Coins,
      count: news.filter((n) => n.category === "financas").length,
      activeColor: "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-lg shadow-amber-500/25"
    },
    {
      key: "valores" as DailyNewsCategory,
      label: "Valores do Mercado",
      shortLabel: "📊 Valores do Mercado",
      icon: BarChart3,
      count: news.filter((n) => n.category === "valores").length,
      activeColor: "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/25"
    }
  ];

  const formattedLastUpdated = useMemo(() => {
    const hh = String(lastUpdated.getHours()).padStart(2, "0");
    const mm = String(lastUpdated.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [lastUpdated]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BANNER PRINCIPAL COM ÁUDIO BRIEFING JARVIS */}
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

              <Badge
                variant="outline"
                className="bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs"
              >
                <Clock className="h-3 w-3 text-cyan-600" /> Atualizado às {formattedLastUpdated}
              </Badge>

              <Badge
                variant="outline"
                className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 text-[10px] font-black px-3 py-1 rounded-full shadow-xs"
              >
                EBC • Câmara • BCB • FIPE • ANP • G1 • Folha
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-900 dark:from-white dark:via-blue-200 dark:to-indigo-300 bg-clip-text text-transparent flex items-center gap-2.5">
              Briefing Executivo & Radar do Mercado
            </h2>

            <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
              Acompanhe as notícias de{" "}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Mercado Imobiliário</strong>,{" "}
              <strong className="text-blue-600 dark:text-sky-400 font-bold">Veículos & Frotas</strong>,{" "}
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">Política de Brasília</strong> e{" "}
              <strong className="text-amber-600 dark:text-amber-400 font-bold">Finanças & Valores</strong> com insights
              estratégicos prontos do <strong className="text-indigo-600 dark:text-indigo-400 font-bold">Jarvis</strong>.
            </p>
          </div>

          {/* CONTROLE DE VOZ NEURAL DO JARVIS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-zinc-700 shadow-xl shadow-indigo-500/10 shrink-0">
            <div className="flex items-center gap-3.5">
              <div
                className={`p-3 rounded-2xl transition-all ${
                  isSpeaking
                    ? "bg-gradient-to-tr from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/40 animate-pulse scale-105"
                    : "bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-md shadow-indigo-500/25"
                }`}
              >
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
                  {isSpeaking ? activeSpeakingTitle || "Narrando briefing diário..." : "Síntese executiva inteligente"}
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

        {/* TICKER DE INDICADORES RÁPIDOS */}
        <div className="mt-7 pt-6 border-t border-slate-200/80 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. SELIC */}
          <div className="group relative overflow-hidden rounded-2xl p-3 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-emerald-950/10 border border-emerald-200/90 dark:border-emerald-800/70 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-600" /> Selic (BCB)
            </span>
            <p className="text-xl font-black text-emerald-950 dark:text-white mt-1">
              {rates.selic.toFixed(2).replace(".", ",")}%
            </p>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Juros de balcão caros</span>
          </div>

          {/* 2. DÓLAR */}
          <div className="group relative overflow-hidden rounded-2xl p-3 bg-gradient-to-br from-cyan-50/90 via-white to-sky-50/50 dark:from-cyan-950/30 dark:via-zinc-900 dark:to-cyan-950/10 border border-cyan-200/90 dark:border-cyan-800/70 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300 flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-cyan-600" /> Dólar Comercial
            </span>
            <p className="text-xl font-black text-cyan-950 dark:text-white mt-1">
              R$ {rates.dolar.toFixed(2).replace(".", ",")}
            </p>
            <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400">
              Euro: R$ {rates.euro.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* 3. INFLAÇÃO IPCA */}
          <div className="group relative overflow-hidden rounded-2xl p-3 bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/50 dark:from-purple-950/30 dark:via-zinc-900 dark:to-purple-950/10 border border-purple-200/90 dark:border-purple-800/70 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1">
              <Scale className="h-3 w-3 text-purple-600" /> Inflação (IPCA)
            </span>
            <p className="text-xl font-black text-purple-950 dark:text-white mt-1">
              {rates.ipca.toFixed(2).replace(".", ",")}%
            </p>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400">Acumulado 12 meses</span>
          </div>

          {/* 4. INCC IMÓVEIS */}
          <div className="group relative overflow-hidden rounded-2xl p-3 bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/50 dark:from-teal-950/30 dark:via-zinc-900 dark:to-teal-950/10 border border-teal-200/90 dark:border-teal-800/70 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1">
              <Building2 className="h-3 w-3 text-teal-600" /> INCC (Imóveis)
            </span>
            <p className="text-xl font-black text-teal-950 dark:text-white mt-1">
              {rates.incc.toFixed(2).replace(".", ",")}%
            </p>
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400">Correção anual de cartas</span>
          </div>

          {/* 5. TABELA FIPE */}
          <div className="group relative overflow-hidden rounded-2xl p-3 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/50 dark:from-blue-950/30 dark:via-zinc-900 dark:to-blue-950/10 border border-blue-200/90 dark:border-blue-800/70 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1">
              <Car className="h-3 w-3 text-blue-600" /> Tabela FIPE
            </span>
            <p className="text-xl font-black text-blue-950 dark:text-white mt-1">{rates.fipeVariacaoSemestral}</p>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">Seminovos em alta</span>
          </div>

          {/* 6. GASOLINA ANP */}
          <div className="group relative overflow-hidden rounded-2xl p-3 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 dark:from-amber-950/30 dark:via-zinc-900 dark:to-amber-950/10 border border-amber-200/90 dark:border-amber-800/70 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <Fuel className="h-3 w-3 text-amber-600" /> Gasolina Comum
            </span>
            <p className="text-xl font-black text-amber-950 dark:text-white mt-1">
              R$ {rates.gasolinaMedia.toFixed(2).replace(".", ",")}
            </p>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
              Etanol: R$ {rates.etanolMedio.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      </div>

      {/* ABAS SETORIAIS REQUERIDAS: TODAS, MERCADO IMOBILIÁRIO, VEÍCULOS, POLÍTICA, FINANÇAS E VALORES DO MERCADO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Pills de Categoria */}
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
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    active ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                  }`}
                >
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
              placeholder="Buscar em notícias, inflação, fontes..."
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

      {/* SEÇÃO ESPECIAL DA ABA: "VALORES DO MERCADO" (PAINEL MACRO + SIMULADOR BANCO X CONSÓRCIO) */}
      {selectedCategory === "valores" && (
        <div className="space-y-6">
          {/* 1. PAINEL DE INDICADORES MACROECONÔMICOS COMPLETOS */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-lg space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-500 text-white">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Painel Geral de Cotações & Indicadores do Mercado
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dados ao vivo via Banco Central do Brasil, FGV, FIPE, ANP e AwesomeAPI
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200">
                ● Cotações em Tempo Real
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">Taxa Selic (Meta BCB)</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {rates.selic.toFixed(2).replace(".", ",")}% <span className="text-[10px] font-normal text-slate-500">a.a.</span>
                </p>
                <p className="text-[10px] text-slate-500">Juros básicos</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">Taxa CDI (DI)</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {rates.cdi.toFixed(2).replace(".", ",")}% <span className="text-[10px] font-normal text-slate-500">a.a.</span>
                </p>
                <p className="text-[10px] text-slate-500">Custo interbancário</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">Inflação IPCA (IBGE)</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {rates.ipca.toFixed(2).replace(".", ",")}%
                </p>
                <p className="text-[10px] text-slate-500">Índice oficial</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">INCC (Construção)</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {rates.incc.toFixed(2).replace(".", ",")}% <span className="text-[10px] font-normal text-slate-500">a.a.</span>
                </p>
                <p className="text-[10px] text-slate-500">Reajuste de imóveis</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">IGP-M (Aluguel/FGV)</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {rates.igpm.toFixed(2).replace(".", ",")}%
                </p>
                <p className="text-[10px] text-slate-500">Locações</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">Dólar Comercial PTAX</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  R$ {rates.dolar.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-slate-500">Câmbio de balcão</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">Euro Comercial</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  R$ {rates.euro.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-slate-500">Moeda europeia</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">Bitcoin (BTC/BRL)</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1 truncate" title={`R$ ${rates.bitcoin.toLocaleString("pt-BR")}`}>
                  R$ {(rates.bitcoin / 1000).toFixed(0)}k
                </p>
                <p className="text-[10px] text-slate-500">Criptoativo</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">Ibovespa (B3)</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {(rates.ibovespa / 1000).toFixed(1)}k <span className="text-[10px] font-normal text-slate-500">pts</span>
                </p>
                <p className="text-[10px] text-slate-500">Bolsa brasileira</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">Gasolina Comum</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  R$ {rates.gasolinaMedia.toFixed(2).replace(".", ",")} <span className="text-[10px] font-normal text-slate-500">/L</span>
                </p>
                <p className="text-[10px] text-slate-500">Média ANP</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">Diesel S10</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  R$ {rates.dieselMedio.toFixed(2).replace(".", ",")} <span className="text-[10px] font-normal text-slate-500">/L</span>
                </p>
                <p className="text-[10px] text-slate-500">Transporte & Frotas</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700">
                <p className="text-[10px] font-black uppercase text-slate-500">Tabela FIPE (Semestral)</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {rates.fipeVariacaoSemestral}
                </p>
                <p className="text-[10px] text-slate-500">Veículos seminovos</p>
              </div>
            </div>
          </div>

          {/* 2. SIMULADOR COMPARATIVO INTERATIVO: JUROS BANCÁRIOS VS CONSÓRCIO MAGALU */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-2xl space-y-6 relative overflow-hidden border border-indigo-800">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  Arma Secreta de Fechamento
                </span>
                <h3 className="text-2xl font-black text-white">
                  Simulador de Economia: Financiamento no Banco vs Consórcio SimulaJá
                </h3>
                <p className="text-xs text-indigo-200 max-w-2xl">
                  Mostre ao seu cliente na ponta do lápis quanto ele economiza fugindo dos juros compostos dos bancos tradicionais.
                </p>
              </div>

              {/* Botões de Seleção de Segmento */}
              <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md">
                <button
                  onClick={() => {
                    setSimSegment("imobiliario");
                    if (simCreditValue < 100000) setSimCreditValue(250000);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    simSegment === "imobiliario" ? "bg-emerald-500 text-white shadow-md" : "text-indigo-200 hover:text-white"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" /> Imóveis
                </button>
                <button
                  onClick={() => {
                    setSimSegment("veiculos");
                    if (simCreditValue > 200000) setSimCreditValue(90000);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    simSegment === "veiculos" ? "bg-blue-500 text-white shadow-md" : "text-indigo-200 hover:text-white"
                  }`}
                >
                  <Car className="h-3.5 w-3.5" /> Veículos
                </button>
              </div>
            </div>

            {/* Presets Rápidos e Input de Valor de Crédito */}
            <div className="relative z-10 space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-xs font-black uppercase tracking-wider text-indigo-200">
                  Valor do Bem / Carta de Crédito Desejada:
                </label>
                <div className="flex flex-wrap gap-2">
                  {simSegment === "veiculos" ? (
                    <>
                      {[50000, 80000, 120000, 180000].map((val) => (
                        <button
                          key={val}
                          onClick={() => setSimCreditValue(val)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            simCreditValue === val ? "bg-cyan-400 text-cyan-950 font-black shadow-xs" : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          R$ {val / 1000}k
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {[150000, 250000, 400000, 700000].map((val) => (
                        <button
                          key={val}
                          onClick={() => setSimCreditValue(val)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            simCreditValue === val ? "bg-emerald-400 text-emerald-950 font-black shadow-xs" : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          R$ {val / 1000}k
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={simSegment === "veiculos" ? 30000 : 100000}
                  max={simSegment === "veiculos" ? 350000 : 1500000}
                  step={5000}
                  value={simCreditValue}
                  onChange={(e) => setSimCreditValue(Number(e.target.value))}
                  className="flex-1 h-2 bg-indigo-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-xl font-black text-cyan-300 min-w-32 text-right">
                  {simCreditValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>

            {/* Comparativo de Custo Total */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card Banco Tradicional */}
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                  🏦 Financiamento no Banco (CET ~{simulationResults.jurosPercent}% a.a.)
                </span>
                <p className="text-2xl font-black text-rose-200">
                  {simulationResults.totalBanco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p className="text-xs text-rose-300/80">
                  O cliente paga o bem + {(simulationResults.totalBanco - simCreditValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em puro juro bancário.
                </p>
              </div>

              {/* Card Consórcio SimulaJá */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  🎯 Consórcio SimulaJá Magalu (Taxa Adm ~{simulationResults.taxaAdmPercent}%)
                </span>
                <p className="text-2xl font-black text-emerald-200">
                  {simulationResults.totalConsorcio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p className="text-xs text-emerald-300/80">
                  Meia Parcela até contemplar:{" "}
                  <strong className="text-emerald-300 font-black">
                    {simulationResults.meiaParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
                  </strong>
                </p>
              </div>

              {/* Card Economia no Bolso do Cliente */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-950 bg-white/70 px-2 py-0.5 rounded-md">
                  💰 Economia Líquida no Bolso
                </span>
                <p className="text-2xl font-black text-white">
                  + {simulationResults.economia.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p className="text-xs text-cyan-100 font-medium">
                  Dinheiro que sobra para o cliente mobiliar o imóvel ou investir na empresa!
                </p>
              </div>
            </div>

            {/* Ação: Copiar Pitch do Jarvis */}
            <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
              <p className="text-xs text-indigo-200">
                Copie a mensagem matemática pronta do Jarvis para fechar este cliente no WhatsApp agora mesmo:
              </p>
              <Button
                onClick={handleCopySimulatorPitch}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider px-5 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2"
              >
                {copiedPitch ? (
                  <>
                    <Check className="h-4 w-4" /> Mensagem Copiada!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copiar Proposta no WhatsApp
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ALERTAS CONTEXTUAIS DO JARVIS PARA ABAS ESPECÍFICAS */}
      {selectedCategory === "imobiliario" && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-300">
                Estratégia do Jarvis para Imóveis:
              </h4>
              <p className="text-xs text-emerald-900/90 dark:text-emerald-200">
                Os bancos aumentaram a exigência de entrada para até 30% à vista. Use o argumento de que no consórcio o cliente não precisa de entrada inicial e protege o poder de compra da casa própria via correção anual pelo INCC ({rates.incc}% a.a.).
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedCategory === "veiculos" && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-blue-500/5 border border-blue-300 dark:border-blue-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
              <Car className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 dark:text-blue-300">
                Estratégia do Jarvis para Veículos & Frotas:
              </h4>
              <p className="text-xs text-blue-900/90 dark:text-blue-200">
                Com o financiamento bancário CDC cobrando mais de 24% ao ano, apresente o plano de Meia Parcela: o cliente paga metade da parcela até ser contemplado, trocando de carro ou renovando a frota pesada sem comprometer o fluxo de caixa.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedCategory === "politica" && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/5 border border-indigo-300 dark:border-indigo-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
              <Landmark className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-300">
                Estratégia Institucional do Jarvis:
              </h4>
              <p className="text-xs text-indigo-900/90 dark:text-indigo-200">
                Destaque a segurança máxima: o Sistema de Consórcios é regido pela Lei Federal 11.795/08 e fiscalizado pelo Banco Central do Brasil. O dinheiro do grupo é patrimônio de afetação protegido, imune a oscilações políticas ou partidárias.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedCategory === "financas" && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-600 text-white shrink-0">
              <Coins className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 dark:text-amber-300">
                Estratégia Financeira do Jarvis:
              </h4>
              <p className="text-xs text-amber-900/90 dark:text-amber-200">
                Com a Selic em {rates.selic.toFixed(2).replace(".", ",")}% a.a., o consórcio é a alavanca matemática perfeita para construção patrimonial planejada e fuga do superendividamento que atinge mais de 78% das famílias brasileiras.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FEED DE NOTÍCIAS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNews.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 space-y-3 shadow-sm">
            <Newspaper className="h-12 w-12 text-slate-400 mx-auto animate-pulse" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">Nenhuma notícia encontrada nesta aba</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              Nenhum item corresponde ao termo pesquisado. Tente outra palavra-chave ou clique em Atualizar.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl font-bold"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("todas");
              }}
            >
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

            if (item.category === "imobiliario") {
              catTheme = {
                label: "🏠 Imobiliário",
                badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
                topStripe: "from-emerald-500 to-teal-500",
                sourceColor: "text-emerald-600 dark:text-emerald-400"
              };
            } else if (item.category === "veiculos") {
              catTheme = {
                label: "🚗 Veículos",
                badgeColor: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
                topStripe: "from-blue-500 to-sky-500",
                sourceColor: "text-blue-600 dark:text-blue-400"
              };
            } else if (item.category === "politica") {
              catTheme = {
                label: "🏛️ Política",
                badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300",
                topStripe: "from-indigo-500 to-violet-500",
                sourceColor: "text-indigo-600 dark:text-indigo-400"
              };
            } else if (item.category === "financas") {
              catTheme = {
                label: "💰 Finanças",
                badgeColor: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
                topStripe: "from-amber-500 to-orange-500",
                sourceColor: "text-amber-600 dark:text-amber-400"
              };
            } else if (item.category === "valores") {
              catTheme = {
                label: "📊 Valores do Mercado",
                badgeColor: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
                topStripe: "from-fuchsia-500 to-pink-500",
                sourceColor: "text-fuchsia-600 dark:text-fuchsia-400"
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
                {/* Linha decorativa superior */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${catTheme.topStripe}`} />

                {/* Indicador de leitura em tempo real */}
                {isCurrentlyReading && (
                  <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 animate-pulse" />
                )}

                <CardHeader className="pb-3 pt-4 px-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${catTheme.badgeColor}`}
                    >
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
                  {/* Imagem de Destaque se existir */}
                  {item.imageUrl && (
                    <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal line-clamp-3">
                    {item.summary}
                  </p>

                  {/* INSIGHT CONSULTIVO DO JARVIS */}
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
                          title="Copiar dica para WhatsApp"
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

                  {/* AÇÕES DE LEITURA E LINK EXTERNO */}
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
