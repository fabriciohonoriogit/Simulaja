import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Mic,
  Send,
  RefreshCw,
  Cpu,
  Layers,
  Terminal,
  Copy,
  Check,
  FileText,
  MessageSquare,
  Building2,
  Truck,
  Car,
  MapPin,
  Palette,
  Bot,
  Image as ImageIcon,
  Activity,
  Sliders,
  Play,
  Pause,
  ExternalLink,
  Download,
  Flame,
  ArrowRight
} from "lucide-react";
import { JarvisOrb, OrbState, OrbEmotion } from "@/components/admin/JarvisOrb";
import { JarvisSaturnNebula } from "@/components/admin/jarvis-studio/JarvisSaturnNebula";
import { JarvisMobileAssistant } from "@/components/admin/jarvis/JarvisMobileAssistant";
import { AI_CORE_PROVIDERS, AICoreProvider } from "@/components/admin/JarvisAICoreDeck";
import { JarvisDesignSystemTokens } from "@/components/admin/jarvis-studio/JarvisDesignSystemTokens";
import { JarvisNodePipeline } from "@/components/admin/jarvis-studio/JarvisNodePipeline";
import { aiService, formatConciseBudgetQuote } from "@/services/aiService";
import {
  speakJarvisText,
  stopVoice,
  stripEmotionTags,
  getGlobalAnalyser
} from "@/lib/voiceService";
import { buscarEmpresasPorCidade, NICHOS_POPULARES, ESTADOS_BRASIL, RadarLocalProspect } from "@/services/radarLocalService";
import { checkWahaStatus, sendWhatsAppMessage } from "@/services/evolutionApiService";
import { VoiceCloningModal } from "@/components/admin/VoiceCloningModal";
import { WhatsAppConnectionModal } from "@/components/admin/WhatsAppConnectionModal";

interface ChatMessage {
  id: string;
  sender: "user" | "jarvis";
  text: string;
  time: string;
  modelUsed?: string;
  imageUrl?: string;
  isProposal?: boolean;
  proposalDetails?: {
    categoria: string;
    creditoFormatado: string;
    prazo: number;
    meiaParcelaFormatada: string;
    parcelaIntegralFormatada: string;
  };
}

export default function JarvisStudio() {
  const navigate = useNavigate();

  // Estados do Motor e da IA
  const [selectedCore, setSelectedCore] = useState<AICoreProvider>(AI_CORE_PROVIDERS[0]); // Gemini 2.0 Flash
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [orbEmotion, setOrbEmotion] = useState<OrbEmotion>("neutro");
  const [activeTab, setActiveTab] = useState<"chat" | "radar" | "budget" | "flux" | "design">("chat");
  const [activePipelineStep, setActivePipelineStep] = useState<string>("engine");

  // Voz & Áudio
  const [isVoiceActive, setIsVoiceActive] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jarvis_hands_free");
      return saved === "true";
    }
    return true; // Ativado por padrão para permitir que qualquer palavra seja ouvida!
  });
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showWahaModal, setShowWahaModal] = useState(false);
  const [wahaConnected, setWahaConnected] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isJarvisSpeakingRef = useRef<boolean>(false);
  const speechDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chat e Interações
  const [inputPrompt, setInputPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "jarvis",
      text: "Olá, Fabrício! Jarvis Studio OS ativo e calibrado. Todos os 10 motores neurais, simulador 50/50 e prospecção de alta conversão estão operacionais sob o novo Design System.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: "Gemini 2.5 Flash Lite",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Radar de Prospecção em Massa (10 a 20 Leads)
  const [radarCidade, setRadarCidade] = useState("Curitiba");
  const [radarUf, setRadarUf] = useState("PR");
  const [radarNicho, setRadarNicho] = useState(NICHOS_POPULARES[0].id);
  const [radarQuantidade, setRadarQuantidade] = useState<10 | 20>(15);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarLeads, setRadarLeads] = useState<RadarLocalProspect[]>([]);
  const [sendingBatch, setSendingBatch] = useState(false);

  // Simulador 50/50 Rápido (Apenas parcelas e prazos)
  const [budgetCategory, setBudgetCategory] = useState<"pesados" | "imovel" | "veiculo">("pesados");
  const [budgetCredit, setBudgetCredit] = useState<number>(300000);
  const [budgetTerm, setBudgetTerm] = useState<number>(120);

  // Gerador FLUX.1
  const [fluxPrompt, setFluxPrompt] = useState("Caminhão Scania R540 azul meia-noite em rodovia moderna, fotografia cinematográfica 8k");
  const [generatingFlux, setGeneratingFlux] = useState(false);
  const [generatedFluxUrl, setGeneratedFluxUrl] = useState<string | null>(null);

  // Rolagem suave nas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, loadingAI]);

  // Checagem de conectividade do WAHA WhatsApp
  useEffect(() => {
    const verifyWaha = async () => {
      try {
        const status = await checkWahaStatus();
        setWahaConnected(Boolean(status.connected));
      } catch {
        setWahaConnected(false);
      }
    };
    verifyWaha();
    const interval = setInterval(verifyWaha, 15000);
    return () => clearInterval(interval);
  }, []);

  // Monitor de espectro de áudio para pulso do Orb
  useEffect(() => {
    let animId: number;
    const checkAudio = () => {
      const analyser = getGlobalAnalyser();
      if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioAmplitude(Math.min(1, avg / 80));
      } else {
        setAudioAmplitude(0);
      }
      animId = requestAnimationFrame(checkAudio);
    };
    animId = requestAnimationFrame(checkAudio);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Enviar Mensagem para o Jarvis
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || loadingAI) return;

    setInputPrompt("");
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setLoadingAI(true);
    setOrbState("thinking");
    setOrbEmotion("curioso");
    setActivePipelineStep("engine");

    try {
      const history = chatMessages.slice(-6).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        text: m.text,
      }));

      const res = await aiService.askJarvis(
        "Jarvis Studio Next-Gen Dashboard. Focado em agilidade executiva e consórcio 50/50.",
        query,
        history,
        undefined,
        "Fabrício",
        { id: selectedCore.id, name: selectedCore.name }
      );

      const replyText = res.answer || "Processamento concluído com êxito.";

      // Checa se é cotação para renderizar card dedicado
      const conciseBudget = formatConciseBudgetQuote(query);
      const isBudget = Boolean(conciseBudget);

      const jarvisMsg: ChatMessage = {
        id: `jarvis-${Date.now()}`,
        sender: "jarvis",
        text: stripEmotionTags(replyText),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: selectedCore.name,
        isProposal: isBudget,
        proposalDetails: conciseBudget || undefined,
      };

      setChatMessages((prev) => [...prev, jarvisMsg]);
      setOrbState("speaking");
      setOrbEmotion("alegre");
      setActivePipelineStep("action");

      // Marca que o Jarvis está falando para evitar que ele ouça a própria voz
      isJarvisSpeakingRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }

      // Reprodução com voz neural se habilitada
      if (isVoiceActive) {
        speakJarvisText(replyText);
      }

      // Tempo de fala aproximado para reativar escuta contínua de forma transparente
      const wordCount = (replyText || "").split(/\s+/).length;
      const speechDuration = Math.min(20000, Math.max(2500, wordCount * 220));

      setTimeout(() => {
        isJarvisSpeakingRef.current = false;
        setOrbState("idle");
        setOrbEmotion("neutro");
        if (isHandsFree && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) { }
        }
      }, speechDuration);
    } catch (err) {
      console.error("Erro na resposta do Jarvis:", err);
      toast.error("Erro na comunicação com o motor de IA.");
      setOrbState("idle");
      isJarvisSpeakingRef.current = false;
    } finally {
      setLoadingAI(false);
    }
  };

  // Alternador da Escuta Contínua (Hands-Free: qualquer palavra dita aciona o Jarvis)
  const toggleHandsFree = () => {
    const nextVal = !isHandsFree;
    setIsHandsFree(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("jarvis_hands_free", String(nextVal));
    }
    if (nextVal) {
      toast.success("Escuta Contínua ATIVA: Pode falar a qualquer momento sem clicar!");
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      setIsListening(false);
      setOrbState("idle");
      toast.info("Escuta Contínua pausada.");
    }
  };

  // Ciclo de Vida da Escuta Contínua Hands-Free
  useEffect(() => {
    if (!isHandsFree) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition não suportado neste navegador.");
      return;
    }

    let isMounted = true;

    const startContinuousListener = () => {
      if (!isMounted || !isHandsFree || isJarvisSpeakingRef.current || loadingAI) return;

      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) { }
        }

        const rec = new SpeechRecognition();
        rec.lang = "pt-BR";
        rec.continuous = true;
        rec.interimResults = true;
        recognitionRef.current = rec;

        rec.onstart = () => {
          if (!isMounted) return;
          setIsListening(true);
          setOrbState("listening");
        };

        rec.onresult = (e: any) => {
          if (isJarvisSpeakingRef.current || loadingAI) return;

          let interim = "";
          let final = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) final += t;
            else interim += t;
          }

          const currentSpeech = (final || interim).trim();
          if (!currentSpeech) return;

          setInputPrompt(currentSpeech);
          setOrbState("listening");
          setOrbEmotion("empatico");

          // Disparo automático e inteligente após pausa natural de 900ms na fala do usuário
          if (speechDebounceTimer.current) clearTimeout(speechDebounceTimer.current);
          speechDebounceTimer.current = setTimeout(() => {
            if (currentSpeech.length >= 2 && !isJarvisSpeakingRef.current && !loadingAI) {
              handleSendMessage(currentSpeech);
            }
          }, 900);
        };

        rec.onerror = (e: any) => {
          if (e.error === "not-allowed") {
            setIsHandsFree(false);
            setIsListening(false);
            toast.error("Permissão de microfone necessária para escuta contínua.");
          }
        };

        rec.onend = () => {
          if (!isMounted) return;
          setIsListening(false);
          // Reinicia automaticamente para garantir que qualquer palavra dita seja capturada sem clicar
          if (isHandsFree && !isJarvisSpeakingRef.current && !loadingAI) {
            setTimeout(() => {
              if (isMounted && isHandsFree && !isJarvisSpeakingRef.current && !loadingAI) {
                try { rec.start(); } catch (err) { }
              }
            }, 250);
          }
        };

        rec.start();
      } catch (err) {
        console.warn("Erro ao iniciar escuta contínua:", err);
      }
    };

    startContinuousListener();

    return () => {
      isMounted = false;
      if (speechDebounceTimer.current) clearTimeout(speechDebounceTimer.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
        recognitionRef.current = null;
      }
    };
  }, [isHandsFree, loadingAI]);

  // Executar Prospecção em Massa
  const handleExecuteRadar = async () => {
    setRadarLoading(true);
    try {
      const nichoObj = NICHOS_POPULARES.find((n) => n.id === radarNicho) || NICHOS_POPULARES[0];
      const results = await buscarEmpresasPorCidade({
        cidade: radarCidade,
        uf: radarUf,
        nicho: nichoObj.label,
        segmento: nichoObj.segmento,
        quantidade: radarQuantidade,
      });

      setRadarLeads(results);
      toast.success(`${results.length} empresas mineradas em ${radarCidade}/${radarUf}!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao minerar leads.");
    } finally {
      setRadarLoading(false);
    }
  };

  // Disparo em Lote para WhatsApp
  const handleBatchWhatsAppSend = async () => {
    const selected = radarLeads.filter((l) => l.selecionado && l.telefone);
    if (selected.length === 0) {
      toast.error("Selecione ao menos um lead com telefone.");
      return;
    }

    setSendingBatch(true);
    let sentCount = 0;

    for (const lead of selected) {
      try {
        const msg = `Olá, ${lead.decisorPrincipal || "gestor"}! Tudo bem? Aqui é da Prospera Planejamento. Desenvolvemos uma condição de meia parcela até a contemplação para expansão de frotas e ativos em ${lead.cidade}. Podemos enviar um comparativo de 2 minutos sem compromisso?`;
        await sendWhatsAppMessage(lead.telefone, msg);
        sentCount++;
      } catch (e) {
        console.warn("Falha no disparo para lead:", lead.nomeFantasia);
      }
    }

    setSendingBatch(false);
    toast.success(`Disparo concluído: ${sentCount} mensagens enviadas com sucesso!`);
  };

  // Geração de Imagem FLUX.1
  const handleGenerateFlux = async () => {
    if (!fluxPrompt.trim() || generatingFlux) return;
    setGeneratingFlux(true);
    setOrbState("thinking");

    try {
      const cleanPrompt = encodeURIComponent(fluxPrompt.trim());
      const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1280&height=720&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

      // Pré-carrega a imagem
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        setGeneratedFluxUrl(imageUrl);
        setGeneratingFlux(false);
        setOrbState("idle");
        toast.success("Imagem gerada em alta definição pelo FLUX.1!");
      };
      img.onerror = () => {
        setGeneratedFluxUrl(imageUrl); // fallback
        setGeneratingFlux(false);
        setOrbState("idle");
      };
    } catch (e) {
      setGeneratingFlux(false);
      setOrbState("idle");
      toast.error("Falha ao gerar imagem.");
    }
  };

  // Cálculo Dinâmico de Consórcio 50/50 (Apenas parcelas e prazos)
  const calculate5050 = () => {
    const taxaAdm = 0.16; // 16% padrão
    const fundoReserva = 0.02; // 2%
    const totalComTaxas = budgetCredit * (1 + taxaAdm + fundoReserva);
    const parcelaIntegral = totalComTaxas / budgetTerm;
    const meiaParcela = parcelaIntegral / 2;

    return {
      creditoFormatado: budgetCredit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      meiaParcelaFormatada: meiaParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      parcelaIntegralFormatada: parcelaIntegral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      prazo: budgetTerm,
    };
  };

  const calculatedQuote = calculate5050();

  return (
    <>
      {/* Visualização Mobile Executiva Nativa (Sem poluição de tela) */}
      <div className="block lg:hidden h-full">
        <JarvisMobileAssistant />
      </div>

      {/* Visualização Desktop Studio Completa */}
      <div className="hidden lg:block min-h-screen bg-[#05060d] text-slate-100 relative overflow-hidden font-sans pb-16">
        {/* Auroras Cósmicas Eteriais Suaves (Substitui o azul pesado por transparência profunda) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-purple-500/[0.04] via-transparent to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-[-10%] w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-20 left-[-10%] w-[500px] h-[500px] bg-pink-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

        {/* Top Bar Executiva com Glassmorphism 80% Translúcido */}
        <header className="sticky top-0 z-50 px-4 lg:px-8 py-3.5 bg-black/20 border-b border-white/[0.08] backdrop-blur-3xl flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_30px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-600 to-pink-500 p-0.5 shadow-[0_0_20px_rgba(0,242,254,0.35)]">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_8px_#10B981]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  JARVIS STUDIO <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40">NEXT-GEN OS</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Motor: <strong className="text-cyan-300">{selectedCore.name}</strong>
                </span>
                <span>•</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {selectedCore.speed}
                </span>
                <span>•</span>
                <span className={wahaConnected ? "text-emerald-400" : "text-amber-400"}>
                  {wahaConnected ? "WhatsApp Ativo" : "WhatsApp Standby"}
                </span>
                <span>•</span>
                <span className={isHandsFree ? "text-emerald-400 font-bold flex items-center gap-1" : "text-slate-500"}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isHandsFree ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                  {isHandsFree ? "Escuta Contínua Ativa" : "Voz Manual"}
                </span>
              </div>
            </div>
          </div>

          {/* Ações do Topo */}
          <div className="flex items-center gap-2">
            {/* Alternador de Voz */}
            <button
              onClick={() => {
                if (isVoiceActive) stopVoice();
                setIsVoiceActive(!isVoiceActive);
              }}
              className={`p-2.5 rounded-xl border transition-all ${isVoiceActive
                ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.2)]"
                : "bg-white/5 border-white/10 text-slate-500"
                }`}
              title={isVoiceActive ? "Voz HD Ativa" : "Voz Mutada"}
            >
              {isVoiceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Modal de Conexão WhatsApp */}
            <button
              onClick={() => setShowWahaModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Clonagem de Voz */}
            <button
              onClick={() => setShowVoiceModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-bold text-purple-300 transition-all shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            >
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Voz Neural</span>
            </button>

            {/* Alternar para HUD Clássico */}
            <button
              onClick={() => navigate("/admin/jarvis-hud")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-cyan-400 transition-all"
              title="Abrir versão HUD Clássica"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Modo HUD</span>
            </button>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
          {/* Seletor Rápido de Motores de IA (Multi-Engine Deck) com 80% Glass */}
          <section className="rounded-2xl p-3 bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Núcleo Neural Ativo (10 Motores Conectados)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Troca instantânea sem recarregar</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {AI_CORE_PROVIDERS.map((core) => {
                const isSelected = selectedCore.id === core.id;
                return (
                  <button
                    key={core.id}
                    onClick={() => {
                      setSelectedCore(core);
                      toast.info(`Motor alterado para ${core.name}`);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 border transition-all text-left ${isSelected
                        ? "bg-white/[0.08] border-cyan-400/80 shadow-[0_0_15px_rgba(0,242,254,0.3)] text-white scale-[1.02]"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/20 text-slate-400 hover:text-white"
                      }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: core.accentHex, boxShadow: `0 0 8px ${core.accentHex}` }}
                    />
                    <div>
                      <div className="text-xs font-bold leading-none">{core.name}</div>
                      <div className="text-[9px] font-mono text-slate-400 mt-1">{core.speed}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Hero Holográfico: Saturno 3D com Luas Orbitais & Rotinas Interativas (80% Glass) */}
          <section className="relative rounded-3xl p-6 bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Planeta 3D WebGL (Saturno, Anéis & Luas Orbitais Interativas) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[320px]">
                <div className="w-full h-72 relative flex items-center justify-center">
                  <JarvisSaturnNebula
                    state={orbState}
                    emotion={orbEmotion}
                    audioAmplitude={audioAmplitude}
                    audioBass={audioAmplitude * 1.2}
                    audioTreble={audioAmplitude * 0.9}
                    mode="saturn"
                    onSelectRoutine={(routineId) => {
                      if (routineId === "whatsapp") {
                        setShowWahaModal(true);
                        toast.success("Rotina Reia: Conexão WhatsApp / WAHA aberta!");
                      } else {
                        setActiveTab(routineId);
                        toast.success(`Rotina orbital ativada: ${routineId.toUpperCase()}`);
                      }
                    }}
                  />
                </div>

                {/* Status Text do Planeta */}
                <div className="text-center mt-2">
                  <div className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    {orbState === "thinking"
                      ? "Sintetizando Raciocínio..."
                      : orbState === "listening"
                        ? "Captando Áudio..."
                        : orbState === "speaking"
                          ? "Transmitindo Voz..."
                          : "Em Prontidão"}
                  </div>
                </div>
              </div>

              {/* Informações Centrais & Botão de Voz */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Controle por Voz & Inteligência Executiva
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Simulação 50/50, Prospecção e Gestão Autônoma
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Comande o Jarvis por áudio ou texto para calcular orçamentos objetivos, minerar lotes de 10 a 20 empresas por cidade ou gerar propostas com design cinematográfico.
                  </p>
                </div>

                {/* Botões Rápidos de Ação */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={toggleHandsFree}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all duration-300 shadow-lg ${isHandsFree
                      ? "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400 text-slate-950 font-black shadow-emerald-500/40 border border-emerald-300 hover:scale-[1.03] active:scale-[0.98]"
                      : "bg-white/10 hover:bg-white/20 text-slate-300 border border-white/20"
                      }`}
                  >
                    <Radio className={`w-4 h-4 ${isHandsFree ? "animate-pulse" : ""}`} />
                    {isHandsFree ? "🟢 Escuta Contínua (Hands-Free Ativo)" : "Ativar Escuta Contínua (Sem Clicar)"}
                  </button>

                  <button
                    onClick={() => {
                      handleSendMessage("Jarvis, calcule uma simulação de 500 mil para pesados no consórcio 50/50.");
                    }}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all"
                  >
                    <Truck className="w-4 h-4 text-amber-400" />
                    Simular R$ 500k Pesados
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("radar");
                    }}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all"
                  >
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    Minerar 15 Empresas
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Pipeline Visual em Árvore (Neo Stitch Canvas) */}
          <JarvisNodePipeline
            activeStep={activePipelineStep}
            activeModelName={selectedCore.name}
            onSelectStep={(stepId) => {
              setActivePipelineStep(stepId);
              if (stepId === "input") setActiveTab("chat");
              if (stepId === "process") setActiveTab("budget");
              if (stepId === "action") setActiveTab("radar");
            }}
          />

          {/* Abas dos Espaços de Trabalho */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === "chat"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <Terminal className="w-4 h-4" />
              Nexus de Conversação
            </button>

            <button
              onClick={() => setActiveTab("radar")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === "radar"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <Building2 className="w-4 h-4" />
              Radar de Prospecção (10 a 20 Leads)
            </button>

            <button
              onClick={() => setActiveTab("budget")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === "budget"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <Truck className="w-4 h-4" />
              Simulador 50/50 Objetivo
            </button>

            <button
              onClick={() => setActiveTab("flux")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === "flux"
                ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <ImageIcon className="w-4 h-4" />
              Estúdio FLUX.1 Neural
            </button>

            <button
              onClick={() => setActiveTab("design")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === "design"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <Palette className="w-4 h-4" />
              Design System Tokens
            </button>
          </div>

          {/* CONTEÚDO DAS ABAS */}

          {/* ABA 1: CHAT & TERMINAL NEURAL */}
          {activeTab === "chat" && (
            <div className="rounded-3xl p-5 bg-white/[0.025] border border-white/[0.08] backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] flex flex-col h-[650px]">
              {/* Histórico de Mensagens */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {chatMessages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {isUser ? "Você" : `Jarvis • ${msg.modelUsed || "AI"}`}
                        </span>
                        <span className="text-[9px] text-slate-500">{msg.time}</span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${isUser
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30 rounded-tr-none border border-blue-400/30"
                          : "bg-white/[0.04] text-slate-200 border border-white/10 shadow-lg rounded-tl-none backdrop-blur-xl"
                          }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* Card de Orçamento Conciso (Regra de Humanização: estritamente parcela e prazo) */}
                        {msg.isProposal && msg.proposalDetails && (
                          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span>Crédito: {msg.proposalDetails.creditoFormatado}</span>
                              <span className="font-mono">{msg.proposalDetails.prazo} Meses</span>
                            </div>
                            <div className="text-xs font-black text-amber-400">
                              Meia Parcela até contemplação: {msg.proposalDetails.meiaParcelaFormatada}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Parcela Integral pós-contemplação: {msg.proposalDetails.parcelaIntegralFormatada}
                            </div>
                          </div>
                        )}

                        {/* Botões de Ação na Resposta do Jarvis */}
                        {!isUser && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text);
                                toast.success("Copiado para a área de transferência!");
                              }}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="Copiar texto"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => speakJarvisText(msg.text)}
                              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                              title="Ouvir com Voz Neural"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loadingAI && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400 p-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Jarvis sintetizando resposta com {selectedCore.name}...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Prompts Sugeridos Prontos (Regra Fundamental 5: Exatamente 2 Prompts Prontos) */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest px-1">
                  <span>Sugestões Prontas para Ação Imediata</span>
                  <span className="text-cyan-400">1-Click Run</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      handleSendMessage("Jarvis, calcule a cotação de consórcio para R$ 400.000 de pesados no plano 50/50 informando apenas parcelas e prazo.")
                    }
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left text-[11px] text-slate-300 hover:text-cyan-300 transition-all flex items-center justify-between group"
                  >
                    <span className="truncate">"Jarvis, calcule cotação de R$ 400k pesados no plano 50/50"</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 shrink-0 ml-1" />
                  </button>

                  <button
                    onClick={() =>
                      handleSendMessage("Jarvis, monte uma mensagem de abordagem para 10 transportadoras de Curitiba focada na renovação de frota com meia parcela.")
                    }
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left text-[11px] text-slate-300 hover:text-purple-300 transition-all flex items-center justify-between group"
                  >
                    <span className="truncate">"Jarvis, monte abordagem para transportadoras com meia parcela"</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 shrink-0 ml-1" />
                  </button>
                </div>

                {/* Caixa de Entrada de Texto */}
                <div className="relative flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={toggleHandsFree}
                    className={`p-3 rounded-2xl border transition-all ${isHandsFree
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                      }`}
                    title={isHandsFree ? "Escuta Contínua Ativa (Pode falar sem clicar - clique para pausar)" : "Ativar Escuta Contínua"}
                  >
                    <Mic className={`w-4 h-4 ${isHandsFree ? "text-emerald-400 animate-pulse" : ""}`} />
                  </button>

                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={
                      isHandsFree
                        ? "Escuta contínua ativa... Pode falar qualquer palavra ou digitar aqui!"
                        : "Pergunte ao Jarvis ou digite um comando executivo..."
                    }
                    className="flex-1 px-4 py-3 text-xs text-white placeholder-slate-500 rounded-2xl bg-slate-900/80 border border-white/10 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 backdrop-blur-xl transition-all shadow-inner"
                  />

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={loadingAI || !inputPrompt.trim()}
                    className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md shadow-cyan-500/30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: RADAR DE PROSPECÇÃO EM MASSA (10 A 20 LEADS) */}
          {activeTab === "radar" && (
            <div className="rounded-3xl p-6 bg-white/[0.025] border border-white/[0.08] backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-400" />
                    Radar Local & Mineração em Lote (10 a 20 Empresas)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Localize empresas ativas via Google Places e CNPJ para abordagem com plano 50/50.
                  </p>
                </div>

                {radarLeads.length > 0 && (
                  <button
                    onClick={handleBatchWhatsAppSend}
                    disabled={sendingBatch}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {sendingBatch ? "Disparando..." : `Disparar WhatsApp (${radarLeads.filter((l) => l.selecionado).length})`}
                  </button>
                )}
              </div>

              {/* Filtros de Busca */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Cidade</label>
                  <input
                    type="text"
                    value={radarCidade}
                    onChange={(e) => setRadarCidade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    placeholder="Ex: Curitiba"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Estado (UF)</label>
                  <select
                    value={radarUf}
                    onChange={(e) => setRadarUf(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {ESTADOS_BRASIL.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Nicho de Mercado</label>
                  <select
                    value={radarNicho}
                    onChange={(e) => setRadarNicho(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {NICHOS_POPULARES.map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Quantidade do Lote</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRadarQuantidade(10)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${radarQuantidade === 10
                        ? "bg-purple-600 text-white border-purple-400 shadow-md"
                        : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                    >
                      10 Empresas
                    </button>
                    <button
                      onClick={() => setRadarQuantidade(20)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${radarQuantidade === 20
                        ? "bg-purple-600 text-white border-purple-400 shadow-md"
                        : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                    >
                      20 Empresas
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExecuteRadar}
                disabled={radarLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                {radarLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Minerando Empresas na Região...
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    Iniciar Mineração no Radar Local
                  </>
                )}
              </button>

              {/* Lista de Resultados */}
              {radarLeads.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>{radarLeads.length} Empresas encontradas</span>
                    <button
                      onClick={() => {
                        const allSelected = radarLeads.every((l) => l.selecionado);
                        setRadarLeads(radarLeads.map((l) => ({ ...l, selecionado: !allSelected })));
                      }}
                      className="text-cyan-400 hover:underline"
                    >
                      Alternar Seleção
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                    {radarLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => {
                          setRadarLeads(
                            radarLeads.map((l) => (l.id === lead.id ? { ...l, selecionado: !l.selecionado } : l))
                          );
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${lead.selecionado
                          ? "bg-purple-950/40 border-purple-500/60 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-white truncate">{lead.nomeFantasia}</div>
                            <div className="text-[10px] text-slate-400 truncate">{lead.razaoSocial}</div>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400 shrink-0">
                            {lead.telefone || "Sem Tel"}
                          </span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Decisor: <strong>{lead.decisorPrincipal}</strong></span>
                          <span className="text-amber-400 font-bold">50/50: R$ {lead.parcela5050.toLocaleString("pt-BR")}/mês</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: SIMULADOR 50/50 RÁPIDO */}
          {activeTab === "budget" && (
            <div className="rounded-3xl p-6 bg-white/[0.025] border border-white/[0.08] backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-400" />
                  Simulador de Orçamento 50/50 Objetivo
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Em conformidade estrita com as regras de humanização: informa estritamente valores de parcelas e prazo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Categoria</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        setBudgetCategory("pesados");
                        setBudgetTerm(120);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${budgetCategory === "pesados" ? "bg-amber-500/20 text-amber-300 border-amber-500/50" : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                    >
                      <Truck className="w-4 h-4" />
                      Pesados
                    </button>

                    <button
                      onClick={() => {
                        setBudgetCategory("imovel");
                        setBudgetTerm(200);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${budgetCategory === "imovel" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50" : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                    >
                      <Building2 className="w-4 h-4" />
                      Imóvel
                    </button>

                    <button
                      onClick={() => {
                        setBudgetCategory("veiculo");
                        setBudgetTerm(80);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${budgetCategory === "veiculo" ? "bg-purple-500/20 text-purple-300 border-purple-500/50" : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                    >
                      <Car className="w-4 h-4" />
                      Veículo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Valor do Crédito</label>
                  <select
                    value={budgetCredit}
                    onChange={(e) => setBudgetCredit(Number(e.target.value))}
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value={150000}>R$ 150.000 (Leves / Utilitários)</option>
                    <option value={250000}>R$ 250.000 (Cavalo Mecânico Semi-novo)</option>
                    <option value={300000}>R$ 300.000 (Caminhão Médio / Terreno)</option>
                    <option value={400000}>R$ 400.000 (Scania / Trator Agrícola)</option>
                    <option value={500000}>R$ 500.000 (Scania R540 / Volvo FH)</option>
                    <option value={800000}>R$ 800.000 (Imóvel Alto Padrão / Frota)</option>
                    <option value={1000000}>R$ 1.000.000 (1 Milhão / Grande Porte)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Prazo de Pagamento</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="60"
                      max="240"
                      step="10"
                      value={budgetTerm}
                      onChange={(e) => setBudgetTerm(Number(e.target.value))}
                      className="flex-1 accent-amber-400"
                    />
                    <span className="text-xs font-mono font-bold text-amber-400 w-16 text-right">
                      {budgetTerm}m
                    </span>
                  </div>
                </div>
              </div>

              {/* Resultado do Orçamento (Card Limpo) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.15)] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                    Orçamento Pronto para Cliente
                  </span>
                  <div className="text-2xl font-black text-white mt-1">
                    Crédito: {calculatedQuote.creditoFormatado}
                  </div>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">
                    Meia Parcela até a contemplação: {calculatedQuote.meiaParcelaFormatada} / mês
                  </div>
                  <div className="text-xs text-slate-400">
                    Parcela Integral pós-contemplação: {calculatedQuote.parcelaIntegralFormatada} / mês • Prazo: {calculatedQuote.prazo} meses
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const text = `Simulação de Consórcio 50/50:\nCrédito: ${calculatedQuote.creditoFormatado}\nPrazo: ${calculatedQuote.prazo} meses\nMeia Parcela até contemplação: ${calculatedQuote.meiaParcelaFormatada}\nParcela Integral: ${calculatedQuote.parcelaIntegralFormatada}`;
                      navigator.clipboard.writeText(text);
                      toast.success("Orçamento copiado para WhatsApp!");
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Orçamento
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: ESTÚDIO FLUX.1 NEURAL */}
          {activeTab === "flux" && (
            <div className="rounded-3xl p-6 bg-white/[0.025] border border-white/[0.08] backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-pink-400" />
                  Estúdio Visual FLUX.1 Neural
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gere imagens cinematográficas para ilustrar propostas comerciais de caminhões, tratores e imóveis.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-slate-400">Prompt Visual</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fluxPrompt}
                    onChange={(e) => setFluxPrompt(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-white/10 text-xs text-white focus:border-pink-400 focus:outline-none"
                    placeholder="Descreva o veículo ou imóvel..."
                  />
                  <button
                    onClick={handleGenerateFlux}
                    disabled={generatingFlux}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-xs shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {generatingFlux ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gerar com FLUX.1
                  </button>
                </div>

                {/* Botões de Estilo Rápido */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setFluxPrompt("Caminhão Scania R540 azul escuro metálico, carreta graneleira em rodovia, luz de fim de tarde, fotografia 8k")}
                    className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 border border-white/10"
                  >
                    🚛 Scania R540
                  </button>
                  <button
                    onClick={() => setFluxPrompt("Mansão moderna com fachada de vidro, piscina de borda infinita, iluminação noturna sofisticada, arquitetura de luxo")}
                    className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 border border-white/10"
                  >
                    🏡 Mansão de Luxo
                  </button>
                  <button
                    onClick={() => setFluxPrompt("Trator moderno colheitadeira John Deere em lavoura de soja ao entardecer, poeira dourada, fotografia 8k")}
                    className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 border border-white/10"
                  >
                    🚜 Máquinas Agrícolas
                  </button>
                </div>
              </div>

              {/* Imagem Gerada */}
              {generatedFluxUrl && (
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 relative group">
                  <img src={generatedFluxUrl} alt="FLUX Generated" className="w-full max-h-[450px] object-cover" />
                  <div className="p-3 bg-slate-950/90 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-pink-400">Resolução 1280x720 • FLUX.1 Schnell</span>
                    <a
                      href={generatedFluxUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar Imagem
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA 5: DESIGN SYSTEM TOKENS (NEO STITCH) */}
          {activeTab === "design" && <JarvisDesignSystemTokens />}
        </main>

        {/* Modais Suporte */}
        <VoiceCloningModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} />
        <WhatsAppConnectionModal isOpen={showWahaModal} onClose={() => setShowWahaModal(false)} />
      </div>
    </>
  );
}

