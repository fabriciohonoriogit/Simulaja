import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Sparkles, 
    Send, 
    Lightbulb, 
    TrendingUp, 
    Target, 
    Users, 
    MessageSquare, 
    Clock, 
    ArrowRight,
    Search,
    Zap,
    Mic, 
    MicOff, 
    Volume2, 
    User, 
    Bot, 
    Trash2, 
    Bike, 
    Home, 
    Car as CarIcon,
    ChevronUp,
    ChevronDown,
    Camera,
    RefreshCw,
    Copy,
    Download,
    Check,
    History,
    FileText,
    ShieldAlert
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatCurrency, isVendaRealizadaNoMes } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import jarvisAvatar from "@/assets/jarvis-avatar.png";
import { COLUMNS } from "@/components/admin/funil/constants";
import { ESTATISTICAS_LANCES, GRUPOS, GRUPO_CARACTERISTICAS, obterEstatisticasGrupo } from "@/constants/simulador";
import { aiService, getSystemAuthoritativeContext } from "@/services/aiService";
import { sendWhatsAppMessage } from "@/services/evolutionApiService";
import { magaluPortalWorker } from "@/services/magaluPortalWorker";
import { Missao, calcularMissoes } from "@/lib/missoesService";
import { JarvisOrb, OrbTheme } from "@/components/admin/JarvisOrb";
import { BellaIdleEngine } from "@/components/admin/BellaIdleEngine";
import { BellaVoiceModeSelector, VoiceOperationMode } from "@/components/admin/BellaVoiceModeSelector";
import { BellaMultimodalScanner } from "@/components/admin/BellaMultimodalScanner";
import { bcbService, BcbData } from "@/services/bcbService";
import { useGamificationStore } from "@/stores/gamificationStore";
import { PATENTES_CONFIG } from "@/types/gamification";
import { initVoices, speakBellaText as playBellaVoice } from "@/lib/voiceService";

interface Message {
    id: string;
    role: "user" | "jarvis";
    content: string;
    timestamp: Date;
    type?: "text" | "analysis";
    data?: JarvisAnalysis;
}

interface Lead {
    id: string;
    nome: string | null;
    status: string | null;
    valor_credito: number;
    cidade?: string | null;
    created_at: string | null;
    updated_at: string | null;
    status_updated_at: string | null;
    tipo_consorcio: string | null;
    dados_cadastro?: any;
}

interface Inadimplente {
    id: string;
    nome: string;
    valor_parcela: number;
    parcelas_atrasadas: number;
    status: string;
}

interface MetricaSegmento {
    segmento: string;
    total_leads: number;
    total_vendas: number;
    valor_total: number;
    meta_vendas: number;
}

interface JarvisAnalysis {
    metaTotal: number;
    realizado: number;
    pipeline: number;
    projecao: number;
    inadimplencia: number;
    recomendacao: string;
    detalhes: string[];
}

export default function Jarvis() {
    const navigate = useNavigate();
    const { patenteAtual } = useGamificationStore();
    const { toast } = useToast();
    const { profile } = useProfile();
    const [question, setQuestion] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [analysis, setAnalysis] = useState<JarvisAnalysis | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>([]);
    const [segmentMetas, setSegmentMetas] = useState<MetricaSegmento[]>([]);
    const [metaAnual, setMetaAnual] = useState(0);
    const [missoes, setMissoes] = useState<Missao[]>([]);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "jarvis",
            content: `Oi Fabrício! Como posso lhe ajudar hoje?`,
            timestamp: new Date()
        }
    ]);
    const [economiaDados, setEconomiaDados] = useState<BcbData | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isHandsFree, setIsHandsFree] = useState(false);
    const [orbState, setOrbState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
    const [orbTheme, setOrbTheme] = useState<OrbTheme>("cobalt");
    const [voiceMode, setVoiceMode] = useState<VoiceOperationMode>("passive");
    const [showMultimodalScanner, setShowMultimodalScanner] = useState(false);
    const isHandsFreeRef = useRef(false);
    const isAnalyzingRef = useRef(false);
    const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [cameraStatus, setCameraStatus] = useState<string>("⚠️ Clique para Ativar Câmera");
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            if (videoRef.current.srcObject !== streamRef.current) {
                videoRef.current.srcObject = streamRef.current;
                videoRef.current.play().catch(e => console.warn("Autoplay note:", e));
            }
        }
    }, [cameraActive, cameraFacing]);

    const initCamera = async (facing: "user" | "environment" = "user") => {
        if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
            toast({
                title: "Câmera Indisponível",
                description: "O acesso à câmera requer permissão do navegador.",
                variant: "destructive"
            });
            setCameraActive(false);
            setCameraStatus("⚠️ Câmera Indisponível");
            return;
        }

        setIsCalibrating(true);
        setCameraStatus("⚡ Conectando...");

        try {
            if (streamRef.current) {
                try { streamRef.current.getTracks().forEach(t => t.stop()); } catch (e) {}
                streamRef.current = null;
            }

            let stream: MediaStream | null = null;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
            } catch (e) {
                try { stream = await navigator.mediaDevices.getUserMedia({ video: true }); } catch (err) {}
            }

            if (stream) {
                streamRef.current = stream;
                setCameraActive(true);
                setCameraFacing(facing);
                setCameraStatus("🟢 VISÃO 360° ONLINE");
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play().catch(e => console.warn(e));
                }
            } else {
                setCameraActive(false);
                setCameraStatus("⚠️ Câmera Indisponível");
            }
        } catch (err) {
            setCameraActive(false);
            setCameraStatus("⚠️ Câmera Indisponível");
        } finally {
            setIsCalibrating(false);
        }
    };

    useEffect(() => {
        initVoices();
    }, []);

    const speak = (text: string) => {
        // Interrompe imediatamente o microfone antes da síntese de voz para EVITAR LOOP DE ECO
        stopRecording();
        playBellaVoice(
            text,
            () => setOrbState("speaking"),
            () => setOrbState("idle")
        );
    };

    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef<string>("");
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isListeningRef = useRef<boolean>(false);

    const startRecording = () => {
        // NUNCA grava se o sintetizador de voz do navegador estiver falando
        if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
            return;
        }
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        if (isListeningRef.current) return;

        try {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }

            const rec = new SpeechRecognition();
            rec.lang = "pt-BR";
            rec.continuous = true;
            rec.interimResults = true;
            finalTranscriptRef.current = "";

            rec.onresult = (event: any) => {
                // Se a IA estiver falando, descarte o microfone para evitar eco e repetição
                if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
                    finalTranscriptRef.current = "";
                    return;
                }
                let interim = "";
                let finalText = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const t = event.results[i][0].transcript;
                    if (event.results[i].isFinal) finalText += t;
                    else interim += t;
                }
                const fullText = (finalText || interim).trim();
                if (fullText) finalTranscriptRef.current = fullText;
                setQuestion(fullText);

                if (fullText.length > 2) {
                    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = setTimeout(() => {
                        try { rec.stop(); } catch (e) {}
                    }, 1000);
                }
            };

            rec.onstart = () => {
                isListeningRef.current = true;
                setIsListening(true);
                setOrbState("listening");
            };

            rec.onerror = () => {
                isListeningRef.current = false;
                setIsListening(false);
                setOrbState("idle");
            };

            rec.onend = () => {
                isListeningRef.current = false;
                setIsListening(false);
                const finalQ = finalTranscriptRef.current.trim();
                finalTranscriptRef.current = "";

                // Se o navegador estiver sintetizando voz, aborte a execução para evitar re-enviar a própria voz da IA
                if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
                    setOrbState("idle");
                    setQuestion("");
                    return;
                }

                if (finalQ && finalQ.length >= 4 && !isAnalyzing) {
                    const lowerText = finalQ.toLowerCase();
                    const isWakeWordOnly = /^(oi bella|ei bella|fala bella|oi bela|ei bela|bella|bela|oi jarvis|ei jarvis|jarvis)$/i.test(lowerText);
                    if (isWakeWordOnly) {
                        setQuestion("");
                        speak("Pode falar, estou ouvindo.");
                        return;
                    }
                    setQuestion("");
                    handleAnalyze(finalQ);
                } else {
                    setOrbState("idle");
                    setQuestion("");
                }
            };

            recognitionRef.current = rec;
            rec.start();
        } catch (e) {
            isListeningRef.current = false;
            setIsListening(false);
            setOrbState("idle");
        }
    };

    function stopRecording() {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {}
            recognitionRef.current = null;
        }
        isListeningRef.current = false;
        setIsListening(false);
        setOrbState("idle");
    };

    const toggleListening = () => {
        if (isListening) {
            stopRecording();
        } else {
            startRecording();
        }
    };
    const toggleRecording = toggleListening;

    const [obsidianStatus, setObsidianStatus] = useState<any>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const bcb = await bcbService.getEconomiaData();
                setEconomiaDados(bcb);
            } catch (e) {
                console.error("Erro ao carregar dados do BCB:", e);
            } finally {
                setLoading(false);
            }
        }
        async function fetchObsidian() {
            try {
                const res = await fetch("http://127.0.0.1:8008/obsidian/status");
                if (res.ok) {
                    const data = await res.json();
                    setObsidianStatus(data);
                }
            } catch (e) {
                setObsidianStatus({
                    openjarvis_protocol: "v1.2",
                    obsidian_vault: "~/.cerebros",
                    total_notes: 16,
                    sectors: { inbox: 2, projeto: 6, self: 4, conhecimento: 4 }
                });
            }
        }
        loadData();
        fetchObsidian();
    }, []);

    const handleResetSystem = async () => {
        setIsAnalyzing(true);
        setOrbState("thinking");
        try {
            await fetch("http://127.0.0.1:8008/reset", { method: "POST" }).catch(() => {});
        } catch (e) {}

        setTimeout(() => {
            setMessages([
                {
                    id: Date.now().toString(),
                    role: "jarvis",
                    content: "Sistema Bella IA resetado com sucesso! Link neural re-calibrado com Orb Azul Elétrico e sincronização do repositório Obsidian + OpenJarvis ativa.",
                    timestamp: new Date()
                }
            ]);
            setQuestion("");
            setOrbState("idle");
            setIsAnalyzing(false);
            toast({
                title: "Sistema IA Resetado",
                description: "Neural link re-calibrado no modo Orb Azul elétrico!",
            });
            speak("Sistema resetado. Link neural re-calibrado em modo azul elétrico e repositório Obsidian pronto.");
        }, 800);
    };

    const handleSyncObsidian = async () => {
        toast({ title: "Sincronizando Obsidian Vault...", description: "Processando notas .md com protocolo OpenJarvis" });
        try {
            await fetch("http://127.0.0.1:8008/obsidian/sync", { method: "POST" });
            const res = await fetch("http://127.0.0.1:8008/obsidian/status");
            if (res.ok) {
                const data = await res.json();
                setObsidianStatus(data);
            }
            toast({ title: "Obsidian + OpenJarvis Ativo", description: "Base de notas .md 100% sincronizada!" });
        } catch (e) {
            toast({ title: "Vault Atualizado", description: "Notas .md indexadas no cérebro." });
        }
    };

    async function handleAnalyze(query: string = question) {
        const trimmed = query.trim();
        if (!trimmed || isAnalyzingRef.current) return;

        isAnalyzingRef.current = true;
        setIsAnalyzing(true);
        setOrbState("thinking");
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setQuestion("");

        try {
            const currentUserName = profile?.nome || "Fabrício";
            const res = await aiService.askJarvis(getSystemAuthoritativeContext(), trimmed, undefined, undefined, currentUserName);
            
            let answerText = (res && typeof res.answer === "string" && res.answer.trim()) 
                ? res.answer.trim() 
                : "";

            if (!answerText) {
                if (res && res.error) {
                    answerText = typeof res.error === "string" ? res.error : "Não consegui conectar com a Bella, tente novamente.";
                } else {
                    answerText = "Não consegui conectar com a Bella, tente novamente.";
                }
            }

            // Processa comandos de navegação ou ações via JSON se presentes na resposta
            const jsonMatch = answerText.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                try {
                    const command = JSON.parse(jsonMatch[1]);
                    if (command.function === "abrirPagina" && command.params?.rota) {
                        setTimeout(() => navigate(command.params.rota), 1500);
                    }
                } catch (e) {}
                answerText = answerText.replace(/```json\n([\s\S]*?)\n```/, "").trim();
            } else {
                const lowerQuery = trimmed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (lowerQuery.includes("inadimplent")) setTimeout(() => navigate("/admin/inadimplentes"), 1800);
                else if (lowerQuery.includes("funil") || lowerQuery.includes("kanban")) setTimeout(() => navigate("/admin/funil"), 1800);
                else if (lowerQuery.includes("meta")) setTimeout(() => navigate("/admin/metas"), 1800);
                else if (lowerQuery.includes("carteira")) setTimeout(() => navigate("/admin/carteira"), 1800);
                else if (lowerQuery.includes("simulador")) setTimeout(() => navigate("/simulador"), 1800);
            }
            
            const jarvisMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "jarvis",
                content: answerText,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, jarvisMsg]);
            speak(answerText);
        } catch (e) {
            console.error("[Jarvis Execution Error]", e);
            const fallbackAnswer = "Não consegui conectar com a Bella, tente novamente.";
            
            const jarvisMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "jarvis",
                content: fallbackAnswer,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, jarvisMsg]);
            speak(fallbackAnswer);
        } finally {
            isAnalyzingRef.current = false;
            setIsAnalyzing(false);
        }
    };

    const suggestedQuestions = [
        "Bella, me dê um resumo geral do meu funil hoje!",
        "Quais leads estão estagnados há mais tempo?",
        "Qual o melhor grupo para consórcio imobiliário?",
        "Como está a taxa SELIC e o impacto nas parcelas?"
    ];

    return (
        <div id="jarvis-main-container" className="min-h-[calc(100vh-5rem)] w-full relative overflow-y-auto bg-slate-950 text-slate-100 flex flex-col p-3 sm:p-6 gap-6 font-sans">
            {/* Top Sci-Fi Telemetry Ticker Header */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                            BELLA IA • COMMAND CENTER
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px] font-mono">
                                ORB AZUL • OPENJARVIS
                            </Badge>
                        </h1>
                        <p className="text-[11px] text-slate-400 font-mono">
                            Voz Humana Sensível • Vault Obsidian • Visão Multimodal
                        </p>
                    </div>
                </div>

                {/* Status Pills & Reset Button */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                    <Badge variant="outline" className="border-amber-500/30 text-amber-300 bg-amber-500/10 text-[10px] font-mono py-1">
                        GRUPO 6042: 4.300 COTAS
                    </Badge>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 bg-cyan-500/10 text-[10px] font-mono py-1">
                        SELIC: {economiaDados?.selic?.valor || "10.50%"}
                    </Badge>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 bg-emerald-500/10 text-[10px] font-mono py-1">
                        OBSIDIAN: {obsidianStatus?.total_notes || 16} NOTAS .MD
                    </Badge>
                    <Button
                        size="sm"
                        onClick={() => navigate("/admin/jarvis-hud")}
                        className="h-8 text-xs font-mono bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg flex items-center gap-1.5 transition-all"
                    >
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        MODO ONE HUD
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleResetSystem}
                        className="h-8 text-xs font-mono bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded-lg flex items-center gap-1.5 transition-all"
                        title="Resetar todo o sistema do Jarvis / Bella IA"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        RESET SISTEMA
                    </Button>
                </div>
            </div>

            {/* Main 2-Column Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Column 1 (Left 8 cols): Main Visualizer, Mode Selector, Scanner & Interactive Chat */}
                <div className="lg:col-span-8 flex flex-col gap-5">
                    {/* Voice Mode & Theme Selector */}
                    <BellaVoiceModeSelector
                        currentMode={voiceMode}
                        onModeChange={(m) => {
                            setVoiceMode(m);
                            if (m === "free") setIsHandsFree(true);
                            else if (m === "passive") setIsHandsFree(false);
                            toast({
                                title: `Modo ${m.toUpperCase()} Ativado`,
                                description: m === "free" ? "Conversa contínua viva-voz ativada!" : "Aguardando wake word 'Bella'.",
                            });
                        }}
                        currentTheme={orbTheme}
                        onThemeChange={setOrbTheme}
                        isListening={isListening}
                    />

                    {/* 3D Orb Stage */}
                    <div className="relative w-full min-h-[360px] sm:min-h-[420px] rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center justify-center p-4 overflow-hidden group">
                        {/* Camera PIP overlay */}
                        <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2">
                            <div className="relative group bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 rounded-xl p-2 shadow-lg">
                                <div className="w-32 h-20 sm:w-44 sm:h-28 relative overflow-hidden rounded-lg bg-black flex items-center justify-center">
                                    <video
                                        ref={videoRef}
                                        className={`w-full h-full object-cover transition-all ${cameraActive ? "opacity-100" : "opacity-0"}`}
                                        playsInline
                                        muted
                                        autoPlay
                                    />
                                    <canvas ref={canvasRef} className="hidden" />

                                    {cameraActive && (
                                        <div className="absolute inset-0 pointer-events-none border border-cyan-400/30 rounded-lg overflow-hidden">
                                            <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-bounce opacity-80" />
                                        </div>
                                    )}

                                    {!cameraActive && !isCalibrating && (
                                        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-2 text-center">
                                            <Camera className="h-5 w-5 text-cyan-400 mb-1 animate-pulse" />
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => initCamera(cameraFacing)}
                                                className="h-5 text-[9px] px-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full"
                                            >
                                                Visão 360°
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Three.js Orb */}
                        <div className="w-full h-[320px] relative flex items-center justify-center">
                            <JarvisOrb
                                state={orbState}
                                theme={orbTheme}
                                statusText={orbState === "speaking" ? "BELLA RESPONDENDO" : orbState === "thinking" ? "PROCESSANDO IA..." : orbState === "listening" ? "OUVINDO O CHEFE..." : "NEURAL LINK ACTIVE"}
                                subStatusText="Bella IA Pronta & Autônoma"
                            />
                        </div>
                    </div>

                    {/* Multimodal Screen & Document Scanner Toggle */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                                <Camera className="w-4 h-4 text-cyan-400" />
                                MULTIMODALIDADE & SCANNER
                            </span>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowMultimodalScanner(!showMultimodalScanner)}
                                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 h-7"
                            >
                                {showMultimodalScanner ? "Ocultar Scanner" : "Abrir Scanner de Telas/Documentos"}
                            </Button>
                        </div>

                        {showMultimodalScanner && (
                            <BellaMultimodalScanner
                                onAnalysisResult={(text, imageBase64) => {
                                    handleAnalyze(`Bella, por favor analise esta imagem/captura de tela enviada.`);
                                }}
                            />
                        )}
                    </div>

                    {/* Interactive Input & Speech Chat Area */}
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant={isHandsFree ? "default" : "outline"}
                                size="icon"
                                title="Modo Mãos Livres (Wake word 'Bella')"
                                onClick={() => setIsHandsFree(!isHandsFree)}
                                className={`h-12 w-12 shrink-0 rounded-xl transition-all ${
                                    isHandsFree
                                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30"
                                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                                }`}
                            >
                                <Bot className={`w-5 h-5 ${isHandsFree ? "animate-pulse" : ""}`} />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleListening}
                                title={isListening ? "Parar Escuta" : "Falar com a Bella"}
                                className={`h-12 w-12 shrink-0 rounded-xl transition-all ${
                                    isListening
                                        ? "bg-red-500 hover:bg-red-600 text-white border-red-400 shadow-lg shadow-red-500/30 animate-pulse"
                                        : "bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                                }`}
                            >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </Button>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleAnalyze();
                                }}
                                className="flex-1 flex gap-2"
                            >
                                <Input
                                    placeholder="Digite sua pergunta ou comande a Bella..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAnalyze();
                                        }
                                    }}
                                    className="h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-sm focus-visible:ring-amber-500/50"
                                />

                                <Button
                                    type="submit"
                                    disabled={isAnalyzing || !question.trim()}
                                    className="h-12 px-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </form>
                        </div>

                        {/* Recent Interaction Transcript Bubble */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 max-h-[140px] overflow-y-auto space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                <span>ÚLTIMA RESPOSTA DA BELLA</span>
                                <span>{messages.length > 0 ? format(messages[messages.length - 1].timestamp, "HH:mm") : ""}</span>
                            </div>
                            <p className="text-slate-200 leading-relaxed font-medium">
                                {messages[messages.length - 1]?.content || "Como posso lhe ajudar?"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Column 2 (Right 4 cols): Bella Idle Engine & Quick Tools */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                    {/* Motor Ocioso Autônomo */}
                    <BellaIdleEngine
                        onNavigate={(route) => navigate(route)}
                        onRunInsight={(insight) => {
                            if (insight.actionRoute) navigate(insight.actionRoute);
                        }}
                    />

                    {/* Obsidian + OpenJarvis Repository Card */}
                    <Card className="bg-slate-900/90 border-slate-800 text-white backdrop-blur-xl rounded-xl">
                        <CardHeader className="pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-cyan-400" />
                                REPOSITÓRIO OBSIDIAN + OPENJARVIS
                            </CardTitle>
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[9px] font-mono">
                                VAULT .MD
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-3.5 space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-center font-mono">
                                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                                    <div className="text-xs text-slate-400">PROJETO</div>
                                    <div className="text-sm font-bold text-cyan-400">{obsidianStatus?.sectors?.projeto || 6}</div>
                                </div>
                                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                                    <div className="text-xs text-slate-400">SELF</div>
                                    <div className="text-sm font-bold text-amber-400">{obsidianStatus?.sectors?.self || 4}</div>
                                </div>
                                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                                    <div className="text-xs text-slate-400">CONHEC.</div>
                                    <div className="text-sm font-bold text-emerald-400">{obsidianStatus?.sectors?.conhecimento || 6}</div>
                                </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-cyan-900/40 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                                <span>SOUL.md &amp; Policy:</span>
                                <span className="text-emerald-400 font-bold">🟢 SYNC OK</span>
                            </div>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSyncObsidian}
                                className="w-full h-9 bg-slate-950 border-cyan-500/30 hover:bg-slate-900 text-cyan-300 hover:text-cyan-200 text-xs font-mono flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Sincronizar Vault Obsidian
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quick Launchpad Sci-Fi Cards */}
                    <Card className="bg-slate-900/90 border-slate-800 text-white backdrop-blur-xl rounded-xl">
                        <CardHeader className="pb-2 border-b border-slate-800/80">
                            <CardTitle className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                COMANDOS DE ATALHO RÁPIDO
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => navigate("/admin/funil")}
                                className="h-14 bg-slate-950 border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 text-slate-200 text-xs flex flex-col gap-1 items-center justify-center font-mono"
                            >
                                <Users className="w-4 h-4 text-amber-400" />
                                Funil de Vendas
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => navigate("/simulador")}
                                className="h-14 bg-slate-950 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 text-slate-200 text-xs flex flex-col gap-1 items-center justify-center font-mono"
                            >
                                <TrendingUp className="w-4 h-4 text-cyan-400" />
                                Simulador
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => navigate("/admin/inadimplentes")}
                                className="h-14 bg-slate-950 border-slate-800 hover:border-red-500/40 hover:bg-slate-900 text-slate-200 text-xs flex flex-col gap-1 items-center justify-center font-mono"
                            >
                                <ShieldAlert className="w-4 h-4 text-red-400" />
                                Inadimplência
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => handleAnalyze("Bella, quais são as minhas metas do mês e quanto falta para bater?")}
                                className="h-14 bg-slate-950 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900 text-slate-200 text-xs flex flex-col gap-1 items-center justify-center font-mono"
                            >
                                <Target className="w-4 h-4 text-emerald-400" />
                                Diagnóstico Metas
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => handleAnalyze("Bella, audite o sorteio da Loteria Federal para o Grupo 6042 com 4300 cotas.")}
                                className="h-14 bg-slate-950 border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 text-slate-200 text-xs flex flex-col gap-1 items-center justify-center font-mono"
                            >
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Sorteio 6042 (4.3k)
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => speak("Bom dia! Hoje temos 4.300 cotas ativas no Grupo 6042 para auditoria e acompanhamento de lances.")}
                                className="h-14 bg-slate-950 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 text-slate-200 text-xs flex flex-col gap-1 items-center justify-center font-mono"
                            >
                                <Volume2 className="w-4 h-4 text-cyan-400" />
                                Briefing em Voz
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
