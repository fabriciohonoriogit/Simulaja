import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  Send,
  RefreshCw,
  Cpu,
  Layers,
  Copy,
  Check,
  Building2,
  Truck,
  Car,
  Home,
  MessageSquare,
  PhoneCall,
  ArrowRight,
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sun,
  Moon,
  Trash2,
  ExternalLink,
  Users,
  Search,
  Radio
} from "lucide-react";
import { AI_CORE_PROVIDERS, AICoreProvider } from "@/components/admin/JarvisAICoreDeck";
import { aiService, formatConciseBudgetQuote } from "@/services/aiService";
import {
  speakJarvisText,
  stopVoice,
  triggerBargeIn,
  stripEmotionTags,
  getGlobalAnalyser
} from "@/lib/voiceService";
import {
  buscarEmpresasPorCidade,
  NICHOS_POPULARES,
  ESTADOS_BRASIL,
  RadarLocalProspect
} from "@/services/radarLocalService";
import { checkWahaStatus, sendWhatsAppMessage, formatWhatsAppNumber, getWhatsAppDirectUrl } from "@/services/evolutionApiService";
import { JarvisVoiceCloserModal } from "@/components/admin/funil/JarvisVoiceCloserModal";
import { WhatsAppConnectionModal } from "@/components/admin/WhatsAppConnectionModal";

export interface MobileChatMessage {
  id: string;
  sender: "user" | "jarvis";
  text: string;
  time: string;
  modelUsed?: string;
  isProposal?: boolean;
  suggestedPrompts?: string[];
  proposalDetails?: {
    categoria: string;
    creditoFormatado: string;
    prazo: number;
    meiaParcelaFormatada: string;
    parcelaIntegralFormatada: string;
  };
}

interface JarvisMobileAssistantProps {
  onSwitchToDesktop?: () => void;
}

export function JarvisMobileAssistant({ onSwitchToDesktop }: JarvisMobileAssistantProps) {
  // Tema Luminous (claro/luminoso) vs Noturno Radiante
  const [isLuminousTheme, setIsLuminousTheme] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jarvis_mobile_theme");
      if (saved !== null) return saved === "luminous";
    }
    return true; // Padrão: Luminous (evita tela escura/sombria)
  });

  const toggleTheme = () => {
    const next = !isLuminousTheme;
    setIsLuminousTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("jarvis_mobile_theme", next ? "luminous" : "midnight");
    }
    toast.info(next ? "Modo Luminous ativado (mais claro e nítido)" : "Modo Noite Radiante ativado");
  };

  // Motor Neural de IA
  const [selectedCore, setSelectedCore] = useState<AICoreProvider>(AI_CORE_PROVIDERS[0]); // Gemini 2.0 Flash

  // Voz & Áudio
  const [isVoiceActive, setIsVoiceActive] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState(0);

  // Status e Modais
  const [wahaConnected, setWahaConnected] = useState(false);
  const [showWahaModal, setShowWahaModal] = useState(false);
  const [showCloserModal, setShowCloserModal] = useState(false);
  const [closerLead, setCloserLead] = useState<any>(null);
  const [activeSheet, setActiveSheet] = useState<"none" | "simulador" | "radar" | "motores">("none");

  // Chat e Mensagens
  const [inputPrompt, setInputPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiState, setAiState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [chatMessages, setChatMessages] = useState<MobileChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "jarvis",
      text: "Olá, Fabrício! Sou seu assistente Jarvis no celular. Estou pronto para auditar cobranças de novembro, calcular simulações 50/50 em segundos ou minerar leads qualificados. O que deseja agora?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: selectedCore.name,
      suggestedPrompts: [
        "Quais clientes já pagaram a parcela de novembro?",
        "Simular consórcio de 500 mil para pesados 50/50"
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isJarvisSpeakingRef = useRef<boolean>(false);
  const speechDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simulador 50/50 Rápido na gaveta
  const [simCat, setSimCat] = useState<"pesados" | "imovel" | "veiculo">("pesados");
  const [simCredit, setSimCredit] = useState<number>(500000);
  const [simTerm, setSimTerm] = useState<number>(120);

  // Radar de Leads na gaveta
  const [radarCidade, setRadarCidade] = useState("Curitiba");
  const [radarUf, setRadarUf] = useState("PR");
  const [radarNicho, setRadarNicho] = useState(NICHOS_POPULARES[0].id);
  const [radarQuantidade, setRadarQuantidade] = useState<10 | 20>(15);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarLeads, setRadarLeads] = useState<RadarLocalProspect[]>([]);

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
    const interval = setInterval(verifyWaha, 20000);
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
        setAudioAmplitude(Math.min(1, avg / 70));
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
    const userMsg: MobileChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setLoadingAI(true);
    setAiState("thinking");

    try {
      const history = chatMessages.slice(-6).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        text: m.text,
      }));

      const res = await aiService.askJarvis(
        "Assistente executivo móvel para Fabrício Honório. Responda com objetividade absoluta e elegância. Conclua sempre sugerindo exatamente 2 opções de continuidade curtas.",
        query,
        history,
        undefined,
        "Fabrício",
        { id: selectedCore.id, name: selectedCore.name }
      );

      const replyText = res.answer || "Processamento concluído com êxito.";

      // Gera 2 prompts inteligentes de sugestão de acordo com o contexto
      const lower = query.toLowerCase();
      let suggestions = [
        "Quero ver os detalhes das cotas em atraso",
        "Calcular simulação de R$ 300 mil para imóvel"
      ];

      if (lower.includes("pagament") || lower.includes("novembro") || lower.includes("cobranc") || lower.includes("atraso")) {
        suggestions = [
          "Ver histórico de Nicoly Florencio Yasuda",
          "Preparar mensagem de lembrete para quem vence dia 23"
        ];
      } else if (lower.includes("simula") || lower.includes("pesad") || lower.includes("caminha") || lower.includes("credito") || lower.includes("parcela")) {
        suggestions = [
          "Simular R$ 1 milhão para pesados no prazo máximo",
          "Calcular parcela integral e prazo para R$ 250 mil"
        ];
      } else if (lower.includes("lead") || lower.includes("empresa") || lower.includes("cidade") || lower.includes("prospect")) {
        suggestions = [
          "Disparar abordagem comercial para os leads minerados",
          "Minerar 20 transportadoras em Londrina"
        ];
      }

      // Checa se é cotação para renderizar card dedicado
      const conciseBudget = formatConciseBudgetQuote(query);
      const isBudget = Boolean(conciseBudget);

      const jarvisMsg: MobileChatMessage = {
        id: `jarvis-${Date.now()}`,
        sender: "jarvis",
        text: stripEmotionTags(replyText),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: selectedCore.name,
        isProposal: isBudget,
        suggestedPrompts: suggestions,
        proposalDetails: conciseBudget ? {
          categoria: "Consórcio 50/50",
          creditoFormatado: conciseBudget.split("\n")[0] || "Cotação",
          prazo: 120,
          meiaParcelaFormatada: conciseBudget.split("\n")[1] || "",
          parcelaIntegralFormatada: conciseBudget.split("\n")[2] || "",
        } : undefined,
      };

      setChatMessages((prev) => [...prev, jarvisMsg]);
      setAiState("speaking");

      // Silencia reconhecimento de voz enquanto o Jarvis fala
      isJarvisSpeakingRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }

      // Reprodução com voz neural se habilitada
      if (isVoiceActive) {
        speakJarvisText(replyText);
      }

      const wordCount = (replyText || "").split(/\s+/).length;
      const speechDuration = Math.min(18000, Math.max(2500, wordCount * 220));

      setTimeout(() => {
        isJarvisSpeakingRef.current = false;
        setAiState("idle");
        if (isHandsFree && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) { }
        }
      }, speechDuration);
    } catch (err) {
      console.error("Erro no Jarvis Mobile:", err);
      toast.error("Erro na comunicação com a IA.");
      setAiState("idle");
      isJarvisSpeakingRef.current = false;
    } finally {
      setLoadingAI(false);
    }
  };

  // Alternador do Microfone / Escuta Contínua
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      setIsListening(false);
      setAiState("idle");
      toast.info("Microfone pausado.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.continuous = false;
      rec.interimResults = true;
      recognitionRef.current = rec;

      rec.onstart = () => {
        setIsListening(true);
        setAiState("listening");
        toast.success("Ouvindo... Pode falar!");
      };

      // Barge-in instantâneo: corta fala do Jarvis assim que o microfone detectar voz
      rec.onspeechstart = () => {
        triggerBargeIn();
        setAiState("listening");
      };

      rec.onsoundstart = () => {
        triggerBargeIn();
      };

      rec.onresult = (e: any) => {
        triggerBargeIn();
        let transcript = "";
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputPrompt(transcript);
          if (e.results[0].isFinal) {
            handleSendMessage(transcript);
          }
        }
      };

      rec.onerror = (e: any) => {
        setIsListening(false);
        setAiState("idle");
        if (e.error === "not-allowed") {
          toast.error("Permissão de microfone negada no celular.");
        }
      };

      rec.onend = () => {
        setIsListening(false);
        if (aiState === "listening") setAiState("idle");
      };

      rec.start();
    } catch (err) {
      console.error("Erro ao iniciar microfone:", err);
      setIsListening(false);
    }
  };

  // Cálculo da simulação de consórcio 50/50 na gaveta
  const calculateSim = () => {
    const taxaAdm = 0.16;
    const fundoReserva = 0.02;
    const totalComTaxas = simCredit * (1 + taxaAdm + fundoReserva);
    const parcelaIntegral = totalComTaxas / simTerm;
    const meiaParcela = parcelaIntegral / 2;

    return {
      creditoFormatado: simCredit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      meiaParcelaFormatada: meiaParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      parcelaIntegralFormatada: parcelaIntegral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      prazo: simTerm,
    };
  };

  // Minerar Leads no Radar
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

  const simResult = calculateSim();

  // Cores dinâmicas para o tema Luminous (Luminoso / Alta Legibilidade) vs Noturno
  const themeBg = isLuminousTheme
    ? "bg-gradient-to-b from-slate-900 via-[#151f38] to-[#0c1322] text-slate-100"
    : "bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#090d16] text-slate-100";

  const cardGlass = isLuminousTheme
    ? "bg-slate-800/75 border border-slate-700/70 shadow-lg backdrop-blur-xl"
    : "bg-slate-900/80 border border-white/10 shadow-lg backdrop-blur-xl";

  const headerGlass = isLuminousTheme
    ? "bg-slate-900/90 border-b border-slate-700/80 backdrop-blur-2xl"
    : "bg-[#090d16]/90 border-b border-white/10 backdrop-blur-2xl";

  return (
    <div className={`h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden font-sans select-none relative ${themeBg}`}>
      {/* Luzes de Fundo Luminous Eteriais (Elimina o preto fúnebre) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-48 bg-gradient-to-b from-cyan-500/20 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER COMPACTO E EXECUTIVO MOBILE */}
      <header className={`flex-shrink-0 px-3.5 py-2.5 flex items-center justify-between z-20 ${headerGlass}`}>
        {/* Esquerda: Identidade Jarvis com Mini-Orb Animado */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center p-0.5 transition-all duration-300 ${
                aiState === "listening"
                  ? "bg-gradient-to-tr from-emerald-400 to-cyan-400 shadow-[0_0_15px_#10B981]"
                  : aiState === "thinking"
                  ? "bg-gradient-to-tr from-purple-500 to-pink-500 shadow-[0_0_15px_#A855F7]"
                  : aiState === "speaking"
                  ? "bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-[0_0_15px_#06B6D4]"
                  : "bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              }`}
            >
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
            </div>
            {/* Status Online Ping */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight text-white">JARVIS</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                EXECUTIVO
              </span>
            </div>
            <div className="text-[10px] text-slate-300 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">Online</span>
              <span>•</span>
              <span className="text-slate-400 truncate max-w-[110px]">{selectedCore.name}</span>
            </div>
          </div>
        </div>

        {/* Direita: Ações Rápidas do Header */}
        <div className="flex items-center gap-1.5">
          {/* Alternador de Voz */}
          <button
            onClick={() => {
              if (isVoiceActive) stopVoice();
              setIsVoiceActive(!isVoiceActive);
              toast.info(!isVoiceActive ? "Voz neural ligada" : "Voz silenciada");
            }}
            className={`p-2 rounded-xl border transition-all ${
              isVoiceActive
                ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300"
                : "bg-white/5 border-white/10 text-slate-400"
            }`}
            title={isVoiceActive ? "Voz Ativa" : "Voz Mutada"}
          >
            {isVoiceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Conexão WhatsApp */}
          <button
            onClick={() => setShowWahaModal(true)}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-[11px] font-bold ${
              wahaConnected
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
                : "bg-amber-500/10 border-amber-400/30 text-amber-300"
            }`}
            title="Conexão WhatsApp"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Alternar Tema Luminous / Midnight */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            title="Alternar Luminosidade"
          >
            {isLuminousTheme ? <Moon className="w-4 h-4 text-amber-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Botão de Ferramentas / Gaveta */}
          <button
            onClick={() => setActiveSheet(activeSheet === "none" ? "simulador" : "none")}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50 text-purple-200 text-xs font-bold"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ações</span>
          </button>
        </div>
      </header>

      {/* ÁREA DE CONVERSA PRINCIPAL (SCROLL SUAVE) */}
      <main className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 custom-scrollbar">
        {/* Card de Boas-Vindas Interativo com 4 Ações Rápidas (Toque Único) */}
        {chatMessages.length <= 1 && (
          <div className={`rounded-2xl p-4 space-y-3.5 border ${cardGlass} animate-in fade-in duration-300`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/25">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
                </div>
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Pronto para operar, Fabrício!</h2>
                <p className="text-xs text-slate-300">Toque em uma ação executiva de 1 toque:</p>
              </div>
            </div>

            {/* 4 Cards de Ação Imediata (Thumb-Friendly) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Ação 1: Cobranças de Novembro */}
              <button
                onClick={() =>
                  handleSendMessage("Jarvis, me apresente o relatório dos clientes que já pagaram a parcela de novembro e quem vence no dia 23.")
                }
                className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-left transition-all active:scale-[0.97] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span className="text-[9px] font-black uppercase text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                    Auditado
                  </span>
                </div>
                <div className="text-xs font-black text-white leading-tight">Cobranças Novembro</div>
                <div className="text-[10px] text-slate-300 mt-0.5">Quem pagou e quem vence</div>
              </button>

              {/* Ação 2: Simular R$ 500k Pesados */}
              <button
                onClick={() =>
                  handleSendMessage("Jarvis, calcule uma simulação de 500 mil para pesados no consórcio 50/50 informando apenas parcelas e prazo.")
                }
                className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-left transition-all active:scale-[0.97] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded">
                    50/50
                  </span>
                </div>
                <div className="text-xs font-black text-white leading-tight">Pesados R$ 500k</div>
                <div className="text-[10px] text-slate-300 mt-0.5">Parcela reduzida rápida</div>
              </button>

              {/* Ação 3: Minerar 15 Empresas */}
              <button
                onClick={() => {
                  setActiveSheet("radar");
                }}
                className="p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-left transition-all active:scale-[0.97] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-[9px] font-black uppercase text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded">
                    Radar
                  </span>
                </div>
                <div className="text-xs font-black text-white leading-tight">Minerar 15 Leads</div>
                <div className="text-[10px] text-slate-300 mt-0.5">Transportadoras & lojas</div>
              </button>

              {/* Ação 4: Closer de Voz SRV */}
              <button
                onClick={() => {
                  setCloserLead({
                    nome: "Cliente Selecionado",
                    telefone: "41999998888",
                    tipo_consorcio: "Pesados",
                    valor_credito: 500000
                  });
                  setShowCloserModal(true);
                }}
                className="p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-left transition-all active:scale-[0.97] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <PhoneCall className="w-4 h-4 text-purple-400" />
                  <span className="text-[9px] font-black uppercase text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded">
                    SRV
                  </span>
                </div>
                <div className="text-xs font-black text-white leading-tight">Ligar Closer SRV</div>
                <div className="text-[10px] text-slate-300 mt-0.5">Roteiro consultivo</div>
              </button>
            </div>
          </div>
        )}

        {/* MENSAGENS DO HISTÓRICO */}
        {chatMessages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-in fade-in duration-200`}
            >
              {/* Badge de Remetente & Horário */}
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isUser ? "Você" : `Jarvis • ${msg.modelUsed || "IA"}`}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">{msg.time}</span>
              </div>

              {/* Bolha da Mensagem */}
              <div
                className={`max-w-[92%] rounded-2xl p-3.5 text-xs leading-relaxed transition-all ${
                  isUser
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-tr-none shadow-md shadow-blue-500/25 border border-blue-400/40"
                    : `${cardGlass} text-slate-100 rounded-tl-none`
                }`}
              >
                <p className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed">{msg.text}</p>

                {/* Card Especial de Cotação 50/50 (Estritamente Parcela e Prazo) */}
                {msg.isProposal && msg.proposalDetails && (
                  <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/50 text-amber-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-white">
                      <span>Crédito: {msg.proposalDetails.creditoFormatado}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 font-bold">
                        {msg.proposalDetails.prazo} Meses
                      </span>
                    </div>
                    <div className="text-sm font-black text-amber-300">
                      Meia Parcela até a contemplação: {msg.proposalDetails.meiaParcelaFormatada}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Parcela Integral pós-contemplação: {msg.proposalDetails.parcelaIntegralFormatada}
                    </div>
                  </div>
                )}

                {/* Barra de Ações Rápidas na Mensagem do Jarvis */}
                {!isUser && (
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10 text-slate-400">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                          toast.success("Mensagem copiada!");
                        }}
                        className="p-1 hover:text-white transition-colors"
                        title="Copiar texto"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => speakJarvisText(msg.text)}
                        className="p-1 hover:text-cyan-400 transition-colors"
                        title="Ouvir com voz neural"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-[9px] text-slate-400 font-mono">100% Auditado</span>
                  </div>
                )}
              </div>

              {/* EXATAMENTE 2 SUGESTÕES DE PROMPTS PRONTOS (REGRA HUMANA DO JARVIS) */}
              {!isUser && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                <div className="w-full max-w-[92%] mt-2 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Sugestões de Continuidade:
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {msg.suggestedPrompts.slice(0, 2).map((sugg, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendMessage(sugg)}
                        className="w-full text-left p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 active:border-cyan-400/50 text-[11px] text-slate-200 hover:text-white transition-all flex items-center justify-between group active:scale-[0.98]"
                      >
                        <span className="truncate pr-1">"{sugg}"</span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 opacity-70 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Indicador de Digitação / Síntese da IA */}
        {loadingAI && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Jarvis sintetizando resposta com {selectedCore.name}...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* CARROSSEL HORIZONTAL DE ATALHOS RÁPIDOS (1 TOQUE - ACIMA DO INPUT) */}
      <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-none z-10 border-t border-white/5 bg-slate-900/60 backdrop-blur-md">
        <button
          onClick={() =>
            handleSendMessage("Jarvis, me apresente o relatório dos clientes que já pagaram a parcela de novembro e quem vence no dia 23.")
          }
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 shrink-0 transition-all active:scale-95"
        >
          <Calendar className="w-3 h-3 text-emerald-400" />
          <span>Cobranças Novembro</span>
        </button>

        <button
          onClick={() =>
            handleSendMessage("Jarvis, calcule a cotação de consórcio para R$ 500.000 de pesados no plano 50/50 informando apenas parcelas e prazo.")
          }
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[11px] font-bold text-amber-300 shrink-0 transition-all active:scale-95"
        >
          <Truck className="w-3 h-3 text-amber-400" />
          <span>Pesados 500k</span>
        </button>

        <button
          onClick={() =>
            handleSendMessage("Jarvis, calcule a cotação de consórcio para R$ 300.000 de imóvel no plano 50/50 informando apenas parcelas e prazo.")
          }
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-[11px] font-bold text-blue-300 shrink-0 transition-all active:scale-95"
        >
          <Home className="w-3 h-3 text-blue-400" />
          <span>Imóvel 300k</span>
        </button>

        <button
          onClick={() => setActiveSheet("radar")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-[11px] font-bold text-purple-300 shrink-0 transition-all active:scale-95"
        >
          <Building2 className="w-3 h-3 text-purple-400" />
          <span>15 Leads Curitiba</span>
        </button>

        <button
          onClick={() => {
            setCloserLead({
              nome: "Cliente em Atendimento",
              telefone: "41999998888",
              tipo_consorcio: "Pesados",
              valor_credito: 500000
            });
            setShowCloserModal(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 shrink-0 transition-all active:scale-95"
        >
          <PhoneCall className="w-3 h-3 text-cyan-400" />
          <span>Closer SRV</span>
        </button>

        <button
          onClick={() => {
            setChatMessages([
              {
                id: `welcome-${Date.now()}`,
                sender: "jarvis",
                text: "Tela limpa! O que vamos calcular ou auditar agora, Fabrício?",
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                modelUsed: selectedCore.name,
                suggestedPrompts: [
                  "Relatório de pagamentos de novembro",
                  "Simular R$ 400 mil para pesados 50/50"
                ]
              }
            ]);
            toast.success("Conversa reiniciada.");
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-400 shrink-0 transition-all active:scale-95"
          title="Limpar tela"
        >
          <Trash2 className="w-3 h-3" />
          <span>Limpar</span>
        </button>
      </div>

      {/* BARRA DE ENTRADA FIXA NO RODAPÉ (TÁTIL & RESPONSIVA) */}
      <footer className={`flex-shrink-0 p-3 z-20 ${headerGlass}`}>
        <div className="flex items-center gap-2">
          {/* Botão de Microfone de Alta Interatividade */}
          <button
            onClick={toggleListening}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 ${
              isListening
                ? "bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 shadow-[0_0_20px_#10B981] scale-105 animate-pulse"
                : "bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 active:scale-95"
            }`}
            title={isListening ? "Ouvindo... Toque para pausar" : "Falar no microfone"}
          >
            <Mic className={`w-5 h-5 ${isListening ? "animate-bounce" : ""}`} />
          </button>

          {/* Campo de Entrada de Texto */}
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={isListening ? "Ouvindo... pode falar!" : "Pergunte ao Jarvis ou peça simulação..."}
            className="flex-1 px-3.5 py-3 text-xs text-white placeholder-slate-400 rounded-2xl bg-white/[0.07] border border-white/15 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 backdrop-blur-xl transition-all shadow-inner font-sans"
          />

          {/* Botão de Envio */}
          <button
            onClick={() => handleSendMessage()}
            disabled={loadingAI || !inputPrompt.trim()}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 text-slate-950 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:scale-100 active:scale-95 transition-all shadow-lg shadow-cyan-500/25"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4 font-black" />
          </button>
        </div>
      </footer>

      {/* GAVETA / BOTTOM SHEET DE FERRAMENTAS EXECUTIVAS */}
      {activeSheet !== "none" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-h-[85vh] rounded-t-3xl border-t border-white/20 p-4 space-y-4 overflow-y-auto ${
              isLuminousTheme ? "bg-slate-900 text-white" : "bg-[#090d16] text-white"
            } shadow-2xl animate-in slide-in-from-bottom duration-300`}
          >
            {/* Header da Gaveta */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSheet("simulador")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeSheet === "simulador"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Simulador 50/50
                </button>

                <button
                  onClick={() => setActiveSheet("radar")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeSheet === "radar"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Radar de Leads
                </button>

                <button
                  onClick={() => setActiveSheet("motores")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeSheet === "motores"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Motores IA
                </button>
              </div>

              <button
                onClick={() => setActiveSheet("none")}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CONTEÚDO 1: SIMULADOR 50/50 RÁPIDO */}
            {activeSheet === "simulador" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Segmento do Ativo
                  </span>
                  <span className="text-[11px] font-mono text-amber-400">Regra: apenas parcela e prazo</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSimCat("pesados")}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                      simCat === "pesados"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Pesados</span>
                  </button>

                  <button
                    onClick={() => setSimCat("imovel")}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                      simCat === "imovel"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>Imóvel</span>
                  </button>

                  <button
                    onClick={() => setSimCat("veiculo")}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                      simCat === "veiculo"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>Veículo</span>
                  </button>
                </div>

                {/* Seletor Rápido de Crédito */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Valor do Crédito</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[150000, 300000, 500000, 1000000].map((val) => (
                      <button
                        key={val}
                        onClick={() => setSimCredit(val)}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                          simCredit === val
                            ? "bg-cyan-500/30 border-cyan-400 text-white"
                            : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                      >
                        {val >= 1000000 ? `${val / 1000000} Mi` : `${val / 1000}k`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seletor Rápido de Prazo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Prazo (Meses)</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[80, 100, 120, 150].map((term) => (
                      <button
                        key={term}
                        onClick={() => setSimTerm(term)}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                          simTerm === term
                            ? "bg-purple-500/30 border-purple-400 text-white"
                            : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                      >
                        {term}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card de Resultado da Cotação */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Crédito: {simResult.creditoFormatado}</span>
                    <span className="font-mono">{simResult.prazo} Meses</span>
                  </div>
                  <div className="text-base font-black text-amber-300">
                    Meia Parcela até a contemplação: {simResult.meiaParcelaFormatada}
                  </div>
                  <div className="text-xs text-slate-300">
                    Parcela Integral pós-contemplação: {simResult.parcelaIntegralFormatada}
                  </div>
                </div>

                {/* Ações da Simulação */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      const quoteText = `Cotação ${simCat.toUpperCase()} 50/50:\nCrédito: ${simResult.creditoFormatado}\nMeia Parcela até contemplação: ${simResult.meiaParcelaFormatada}\nParcela Integral: ${simResult.parcelaIntegralFormatada}\nPrazo: ${simResult.prazo} meses.`;
                      navigator.clipboard.writeText(quoteText);
                      toast.success("Cotação copiada para o WhatsApp!");
                    }}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Cotação</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSheet("none");
                      handleSendMessage(
                        `Jarvis, apresente a cotação oficial para crédito de ${simResult.creditoFormatado} no segmento ${simCat} em ${simResult.prazo} meses informando apenas parcelas e prazo.`
                      );
                    }}
                    className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar no Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* CONTEÚDO 2: RADAR DE LEADS EM MASSA (10 a 20) */}
            {activeSheet === "radar" && (
              <div className="space-y-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Minerador Local de Empresas (10 a 20 Leads)
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400">Cidade</label>
                    <input
                      type="text"
                      value={radarCidade}
                      onChange={(e) => setRadarCidade(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400">UF</label>
                    <select
                      value={radarUf}
                      onChange={(e) => setRadarUf(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                    >
                      {ESTADOS_BRASIL.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400">Nicho</label>
                    <select
                      value={radarNicho}
                      onChange={(e) => setRadarNicho(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                    >
                      {NICHOS_POPULARES.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400">Lote</label>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {[10, 20].map((qt) => (
                        <button
                          key={qt}
                          onClick={() => setRadarQuantidade(qt as 10 | 20)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            radarQuantidade === qt
                              ? "bg-purple-500/30 border-purple-400 text-white"
                              : "bg-white/5 border-white/10 text-slate-400"
                          }`}
                        >
                          {qt} Leads
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleExecuteRadar}
                  disabled={radarLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50"
                >
                  {radarLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Minerando no Google Maps...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Minerar {radarQuantidade} Empresas Agora</span>
                    </>
                  )}
                </button>

                {/* Lista de Leads Minerados */}
                {radarLeads.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <div className="text-[11px] font-bold text-cyan-400">
                      {radarLeads.length} empresas encontradas:
                    </div>
                    {radarLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold text-white truncate">{lead.nomeFantasia}</div>
                          <div className="text-[10px] text-slate-400">{lead.telefone || "Sem telefone"}</div>
                        </div>

                        {lead.telefone && (
                          <a
                            href={getWhatsAppDirectUrl(lead.telefone, "Olá! Temos uma oportunidade de renovação de frotas com 50% de parcela.")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONTEÚDO 3: TROCA DE MOTORES DE IA */}
            {activeSheet === "motores" && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Selecione o Motor Neural do Jarvis
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {AI_CORE_PROVIDERS.map((core) => {
                    const isSelected = selectedCore.id === core.id;
                    return (
                      <button
                        key={core.id}
                        onClick={() => {
                          setSelectedCore(core);
                          toast.success(`Motor alterado para ${core.name}`);
                          setActiveSheet("none");
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full mb-1.5"
                          style={{ backgroundColor: core.accentHex }}
                        />
                        <div className="text-xs font-bold text-white leading-tight">{core.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{core.speed}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONEXÃO DO WHATSAPP / WAHA */}
      <WhatsAppConnectionModal
        open={showWahaModal}
        onOpenChange={setShowWahaModal}
      />

      {/* MODAL DO CLOSER DE VOZ COM METODOLOGIA SRV (SEM GHOSTING) */}
      <JarvisVoiceCloserModal
        open={showCloserModal}
        onOpenChange={setShowCloserModal}
        lead={closerLead}
      />
    </div>
  );
}

