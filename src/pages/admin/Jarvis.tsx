import { useState, useEffect, useRef } from "react";
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
    FileText
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
import { aiService } from "@/services/aiService";
import { sendWhatsAppMessage } from "@/services/evolutionApiService";
import { Missao, calcularMissoes } from "@/lib/missoesService";
import { JarvisOrb } from "@/components/admin/JarvisOrb";
import { bcbService, BcbData } from "@/services/bcbService";
import { useGamificationStore } from "@/stores/gamificationStore";
import { PATENTES_CONFIG } from "@/types/gamification";

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

interface GrupoItem {
    grupo: string;
    credito: number;
    r50: number;
    prazo: number;
    r100?: number;
    txLinear?: number;
    frLinear?: number;
    tx5050?: number;
    fr5050?: number;
    tx?: number;
    fr?: number;
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
            content: `Oi Chefe! 🚀 Que alegria falar com você! Eu sou a Bella IA! Tô super animada, alegre e pronta pro nosso papo. Sobre o que você gostaria de conversar hoje, Chefe?`,
            timestamp: new Date()
        }
    ]);
    const [economiaDados, setEconomiaDados] = useState<BcbData | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isHandsFree, setIsHandsFree] = useState(false);
    const [orbState, setOrbState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
    const isHandsFreeRef = useRef(false);
    const handsFreeRecognitionRef = useRef<any>(null);
    const analyzeRef = useRef<any>(null);
    const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [cameraStatus, setCameraStatus] = useState<string>("⚠️ Clique para Ativar Câmera");
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Efeito para garantir vinculação contínua do vídeo ao elemento DOM
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
                description: "O acesso à câmera requer permissão do navegador ou suporte a mídia.",
                variant: "destructive"
            });
            setCameraActive(false);
            setCameraStatus("⚠️ Câmera Indisponível");
            return;
        }

        setIsCalibrating(true);
        setCameraStatus("⚡ Conectando...");

        const safetyTimer = setTimeout(() => {
            setIsCalibrating(false);
        }, 4000);

        try {
            if (streamRef.current) {
                try {
                    streamRef.current.getTracks().forEach(t => t.stop());
                } catch (e) {}
                streamRef.current = null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }

            let stream: MediaStream | null = null;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facing }
                });
            } catch (e) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                } catch (errFallback) {
                    console.warn("Fallback de câmera falhou:", errFallback);
                }
            }

            if (stream) {
                streamRef.current = stream;
                setCameraActive(true);
                setCameraFacing(facing);
                setCameraStatus("🟢 VISÃO 360° ONLINE");

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    try {
                        await videoRef.current.play();
                    } catch (e) {
                        console.warn("Autoplay note:", e);
                    }
                }
            } else {
                setCameraActive(false);
                setCameraStatus("⚠️ Câmera Indisponível");
            }
        } catch (err) {
            console.warn("Erro ao calibrar câmera:", err);
            setCameraActive(false);
            setCameraStatus("⚠️ Câmera Indisponível");
        } finally {
            clearTimeout(safetyTimer);
            setIsCalibrating(false);
        }
    };

    const captureCameraFrame = (): string | undefined => {
        if (!videoRef.current || !cameraActive) return undefined;
        try {
            const w = videoRef.current.videoWidth || 640;
            const h = videoRef.current.videoHeight || 480;
            if (w === 0 || h === 0) return undefined;
            const canvas = canvasRef.current || document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, w, h);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
                return dataUrl.split(",")[1];
            }
        } catch (e) {
            console.error("Erro ao capturar frame:", e);
        }
        return undefined;
    };

    useEffect(() => {
        setIsCalibrating(false);
        setCameraActive(false);
        setCameraStatus("⚠️ Clique para Ativar Câmera");

        return () => {
            if (streamRef.current) {
                try {
                    streamRef.current.getTracks().forEach(t => t.stop());
                } catch (e) {}
                streamRef.current = null;
            }
        };
    }, []);

    const speak = (text: string) => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        
        const cleanText = text
            .replace(/```json[\s\S]*?```/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/\{[\s\S]*?\}/g, '')
            .replace(/\[[\s\S]*?\]/g, '')
            .replace(/API key not valid[\s\S]*/gi, '')
            .replace(/INVALID_ARGUMENT[\s\S]*/gi, '')
            .replace(/\*\([^*]*\)\*/g, '')
            .replace(/[*_#`~{}]/g, '')
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '')
            .replace(/FUNIL:|LEADS:|METAS DO MÊS:|INADIMPLÊNCIA:/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanText) return;

        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(cleanText);
        msg.lang = "pt-BR";
        
        const allVoices = window.speechSynthesis.getVoices();
        const ptVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith('pt'));
        
        // Prioriza vozes Naturais / Neurais / Google que possuem timbre jovem, brilhante e alegre
        let bestVoice = ptVoices.find(v => 
            (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online') || v.name.includes('Google')) &&
            (v.name.includes('Francisca') || v.name.includes('Thalita') || v.name.includes('Yalda') || v.name.includes('Giovanna') || v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Vitória') || v.name.includes('Camila') || v.name.toLowerCase().includes('female'))
        );
        
        if (!bestVoice) {
            bestVoice = ptVoices.find(v => (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online') || v.name.includes('Google')));
        }
        
        if (!bestVoice) {
            bestVoice = ptVoices.find(v => v.lang.toLowerCase().includes('pt-br') || v.lang.toLowerCase().includes('pt_br'));
        }
        
        if (!bestVoice && ptVoices.length > 0) {
            bestVoice = ptVoices[0];
        }
            
        if (bestVoice) {
            msg.voice = bestVoice;
        }

        msg.rate = 1.08; // Ritmo mais vivo, alegre e natural
        msg.pitch = 1.05; // Tom brilhante e alegre (sem distorção robótica)
        
        setOrbState("speaking");
        
        const finishSpeaking = () => {
            if (speakingTimeoutRef.current) {
                clearTimeout(speakingTimeoutRef.current);
                speakingTimeoutRef.current = null;
            }
            setOrbState("idle");
            finalTranscriptRef.current = "";
            // Aguarda 1.8s antes de reabrir a escuta para permitir dissipação total do som das caixas no ambiente
            if (isHandsFreeRef.current) {
                setTimeout(() => {
                    finalTranscriptRef.current = "";
                    try { startRecording(); } catch (e) {}
                }, 1800);
            }
        };

        msg.onend = finishSpeaking;
        msg.onerror = finishSpeaking;
        
        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = setTimeout(finishSpeaking, Math.max(3000, cleanText.length * 80));

        try {
            window.speechSynthesis.speak(msg);
        } catch (e) {
            console.warn("Speech synthesis failed:", e);
            finishSpeaking();
        }
    };

    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef<string>("");
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isListeningRef = useRef<boolean>(false);

    const startRecording = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({ title: "Voz indisponível", description: "Seu navegador não suporta reconhecimento de voz. Use Chrome/Safari.", variant: "destructive" });
            return;
        }

        if (isListeningRef.current) return;

        if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
            setTimeout(() => {
                try { startRecording(); } catch (e) {}
            }, 600);
            return;
        }

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
                let interim = "";
                let finalText = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const t = event.results[i][0].transcript;
                    if (event.results[i].isFinal) finalText += t;
                    else interim += t;
                }
                const fullText = (finalText || interim).trim();
                if (fullText) {
                    finalTranscriptRef.current = fullText;
                }
                setQuestion(fullText);

                if (fullText.length > 2) {
                    const lowerText = fullText.toLowerCase().trim();
                    const isWakeWordOnly = /^(oi bella|ei bella|fala bella|oi bela|ei bela|bella|bela|oi jarvis|ei jarvis|jarvis)$/i.test(lowerText);
                    if (isWakeWordOnly && !isAnalyzing) {
                        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                        try { rec.stop(); } catch (e) {}
                        speak("Oi Chefe! Tô te ouvindo, pode falar!");
                        return;
                    }

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

            rec.onerror = (e: any) => {
                isListeningRef.current = false;
                setIsListening(false);
                setOrbState("idle");

                if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                    console.warn("[Jarvis Voice] Permissão de microfone não concedida.");
                    isHandsFreeRef.current = false;
                    setIsHandsFree(false);
                    toast({
                        title: "Permissão de Microfone necessária",
                        description: "Clique no botão do microfone para conceder permissão de voz ao navegador.",
                        variant: "destructive",
                    });
                    return;
                }

                if (isHandsFreeRef.current) {
                    setTimeout(() => { try { startRecording(); } catch (err) {} }, 1500);
                }
            };

            rec.onend = () => {
                isListeningRef.current = false;
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                setIsListening(false);
                const finalQ = finalTranscriptRef.current.trim();
                finalTranscriptRef.current = "";

                if (finalQ && finalQ.length >= 2 && !isAnalyzing) {
                    setQuestion("");
                    handleAnalyze(finalQ);
                } else {
                    setOrbState("idle");
                    setQuestion("");
                    if (isHandsFreeRef.current) {
                        setTimeout(() => { try { startRecording(); } catch (e) {} }, 500);
                    }
                }
            };

            recognitionRef.current = rec;
            rec.start();
        } catch (e) {
            console.error("Speech recognition error:", e);
            isListeningRef.current = false;
            setIsListening(false);
            if (isHandsFreeRef.current) {
                setTimeout(() => { try { startRecording(); } catch (err) {} }, 2000);
            }
        }
    };

    const stopRecording = () => {
        isHandsFreeRef.current = false;
        setIsHandsFree(false);
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { console.error("Error stopping recognition", e); }
        }
    };

    const toggleRecording = () => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            const unlockMsg = new SpeechSynthesisUtterance("");
            unlockMsg.volume = 0;
            window.speechSynthesis.speak(unlockMsg);
            window.speechSynthesis.resume();
        }
        
        if (isListening || isHandsFree) {
            stopRecording();
        } else {
            isHandsFreeRef.current = true;
            setIsHandsFree(true);
            startRecording();
        }
    };

    // Motor de Simulação Portado do ConsortiumSimulator (Importado nativamente)

    const findParcela = (valor: number, segmento: string) => {
        const seg = segmento.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let key = "imovel";
        if (seg.includes("veic") || seg.includes("carro") || seg.includes("moto")) key = "veiculo";
        else if (seg.includes("pesad") || seg.includes("caminh") || seg.includes("agro")) key = "pesados";

        const lista = GRUPOS[key] || GRUPOS.imovel;
        // Encontra o mais próximo
        return lista.reduce((prev, curr) => {
            return (Math.abs(curr.credito - valor) < Math.abs(prev.credito - valor) ? curr : prev);
        });
    };

    const suggestedQuestions = [
        "E aí Jarvis, qual o resumo de hoje?",
        "Como tá a inadimplência?",
        "Simula uma parcela de 200 mil pra mim",
        "Como estão as metas por segmento?",
        "Quem tem mais chance de fechar?"
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const orgId = profile?.organizacao_id;

                const leadsQuery = orgId
                    ? supabase.from("leads").select("*").eq("organizacao_id", orgId)
                    : supabase.from("leads").select("*").limit(200);

                const metaQuery = orgId
                    ? supabase.from("meta").select("*").eq("ano", new Date().getFullYear()).eq("organizacao_id", orgId).maybeSingle()
                    : supabase.from("meta").select("*").eq("ano", new Date().getFullYear()).limit(1).maybeSingle();

                const inadQuery = orgId
                    ? (supabase as any).from("inadimplentes").select("*").eq("organizacao_id", orgId)
                    : (supabase as any).from("inadimplentes").select("*").limit(100);

                const [leadsResult, metaResult, inadResult] = await Promise.allSettled([
                    leadsQuery,
                    metaQuery,
                    inadQuery
                ]);

                let allLeads: Lead[] = [];
                if (leadsResult.status === "fulfilled" && leadsResult.value?.data) {
                    allLeads = leadsResult.value.data as Lead[];
                    setLeads(allLeads);

                    if (profile?.id) {
                        try {
                            const res = await calcularMissoes(profile.id, orgId || "", profile.tipo_acesso as any);
                            setMissoes(res.missoes);
                        } catch(e) {
                            console.warn("Erro ao carregar missões no Jarvis:", e);
                        }
                    }
                }

                if (inadResult.status === "fulfilled" && inadResult.value?.data) {
                    setInadimplentes(inadResult.value.data as Inadimplente[]);
                }

                if (metaResult.status === "fulfilled" && metaResult.value?.data) {
                    const metaData = metaResult.value.data;
                    setMetaAnual(metaData.meta_anual || 0);

                    const currentMonthStr = new Date().toISOString().substring(0, 7);
                    const monthlyMetas: Record<string, number> = {
                        imoveis: Number(metaData.meta_imoveis || 500000),
                        veiculos: Number(metaData.meta_veiculos || 100000),
                        motos: Number(metaData.meta_motos || 100000),
                        pesados: Number((metaData as any).meta_pesados || 180000),
                        investimentos: Number((metaData as any).meta_investimentos || 120000)
                    };

                    const segConfig = [
                        { id: 'imoveis', keywords: ['imovel', 'imóvel', 'casa', 'apartamento', 'terreno', 'construcao', 'reforma'] },
                        { id: 'veiculos', keywords: ['veiculo', 'veículo', 'carro', 'auto', 'automovel', 'automóvel'] },
                        { id: 'motos', keywords: ['moto', 'motocicleta'] },
                        { id: 'pesados', keywords: ['pesados', 'agricolas', 'caminhao', 'caminhão', 'trator', 'maquina', 'máquina'] },
                        { id: 'investimentos', keywords: ['investimento', 'capitalizacao', 'aposentadoria', 'investimentos'] }
                    ];

                    const segs: MetricaSegmento[] = segConfig.map(config => {
                        const segmentLeads = allLeads.filter(l => {
                            const type = (l.tipo_consorcio || "").toLowerCase();
                            return config.keywords.some(kw => type.includes(kw));
                        });
                        const segmentVendas = segmentLeads.filter(l => {
                            const s = (l.status || "").toLowerCase().replace("_", " ");
                            return (s === "fechado" || s === "venda fechada");
                        });
                        const currentMonthVendas = segmentVendas.filter(l => {
                            const dateToCheck = l.status_updated_at || l.created_at || "";
                            return dateToCheck.startsWith(currentMonthStr);
                        });
                        const valorTotal = currentMonthVendas.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);

                        return {
                            segmento: config.id,
                            total_leads: segmentLeads.length,
                            total_vendas: currentMonthVendas.length,
                            valor_total: valorTotal,
                            meta_vendas: monthlyMetas[config.id]
                        };
                    });
                    setSegmentMetas(segs);
                }

                try {
                    const bcb = await bcbService.getEconomicIndicators();
                    setEconomiaDados(bcb);
                } catch (e) {
                    console.warn("Erro indicador bcb:", e);
                }
            } catch (err) {
                console.error("Erro ao carregar dados para o Jarvis:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profile?.organizacao_id, profile?.id]);

    // Garantir que a gravação/escuta por voz fique desligada por padrão ao entrar na página
    useEffect(() => {
        isHandsFreeRef.current = false;
        setIsHandsFree(false);
        return () => {
            isHandsFreeRef.current = false;
            setIsHandsFree(false);
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
        };
    }, []);

    // Detecção de Palmas (Clap Detector) usando Web Audio API
    useEffect(() => {
        if (typeof window === "undefined") return;

        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let microphone: MediaStreamAudioSourceNode | null = null;
        let stream: MediaStream | null = null;
        let animationFrameId: number | null = null;
        let lastTriggerTime = 0;

        const initClapDetector = async () => {
            try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioCtx) return;

                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new AudioCtx();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.15;

                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const detectClap = () => {
                    if (!analyser) return;

                    analyser.getByteFrequencyData(dataArray);

                    let totalEnergy = 0;
                    let highFreqEnergy = 0;

                    for (let i = 0; i < dataArray.length; i++) {
                        totalEnergy += dataArray[i];
                        if (i > dataArray.length * 0.4) {
                            highFreqEnergy += dataArray[i];
                        }
                    }

                    const avgEnergy = totalEnergy / dataArray.length;
                    const avgHighEnergy = highFreqEnergy / (dataArray.length * 0.6);
                    const now = Date.now();

                    const isSpeakingOrThinking = (window.speechSynthesis && window.speechSynthesis.speaking) || isAnalyzing;

                    // Palmas: energia média > 85 e alta frequência > 70
                    if (!isSpeakingOrThinking && avgEnergy > 85 && avgHighEnergy > 70 && (now - lastTriggerTime > 1500)) {
                        lastTriggerTime = now;
                        toast({
                            title: "👏 Palmas Detectadas!",
                            description: "Bella ativada por palmas! Ouvindo o Chefe...",
                        });

                        setIsHandsFree(true);
                        isHandsFreeRef.current = true;
                        try { startRecording(); } catch (e) {}
                    }

                    animationFrameId = requestAnimationFrame(detectClap);
                };

                detectClap();
            } catch (err) {
                console.warn("[Clap Detector] Microfone não disponível para detecção de palmas:", err);
            }
        };

        initClapDetector();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (microphone) try { microphone.disconnect(); } catch (e) {}
            if (audioContext && audioContext.state !== "closed") try { audioContext.close(); } catch (e) {}
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [isAnalyzing]);

    const handleAnalyze = async (query: string = question) => {
        const trimmed = query.trim();
        if (!trimmed || isAnalyzing) return;

        const lastBotMsg = messages.filter(m => m.role === "jarvis").pop()?.content || "";
        if (lastBotMsg && trimmed.length > 15 && lastBotMsg.includes(trimmed)) {
            console.warn("[Jarvis Anti-Loop] Descartado eco exato:", trimmed);
            setQuestion("");
            finalTranscriptRef.current = "";
            setOrbState("idle");
            return;
        }
        
        // Unlock speech synthesis for iOS Safari (must be synchronous with user gesture)
        if (typeof window !== "undefined" && window.speechSynthesis) {
            const unlockMsg = new SpeechSynthesisUtterance("");
            unlockMsg.volume = 0;
            window.speechSynthesis.speak(unlockMsg);
            window.speechSynthesis.resume();
        }

        setIsAnalyzing(true);
        setOrbState("thinking");
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: query, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setQuestion("");

        let imageBase64: string | undefined;
        if (videoRef.current && videoRef.current.readyState === 4) {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0);
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
                    imageBase64 = dataUrl.split(",")[1];
                }
            } catch (err) {
                console.error("Erro ao capturar imagem da câmera", err);
            }
        }

        const currentMonthStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).substring(0, 7);
        const metaMensal = metaAnual / 12;
        
        const fechadosMes = leads.filter(l => isVendaRealizadaNoMes(l, currentMonthStr));

        const realizadoMes = fechadosMes.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
        
        const currentYear = new Date().getFullYear().toString();
        const realizadoAno = leads.filter(l => {
            const s = (l.status || "").toLowerCase().replace("_", " ");
            const isClosed = s === "fechado" || s === "venda fechada";
            const isRetroativo = l.dados_cadastro?.is_retroativo === true;
            return isClosed && (l.status_updated_at || "").startsWith(currentYear);
        }).reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
        const progressoAno = metaAnual > 0 ? (realizadoAno / metaAnual) * 100 : 0;
        
        const emNegociacao = leads.filter(l => !["fechado", "venda_fechada", "perdido", "desistiu", "novo"].includes((l.status || "").toLowerCase()));
        const pipelineValue = emNegociacao.reduce((acc, l) => acc + Number(l.valor_credito || 0), 0);
        const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const diaHoje = new Date().getDate();
        const projecao = diaHoje > 0 ? (realizadoMes / diaHoje) * diasNoMes : 0;

        // Inadimplência
        const dividaTotal = inadimplentes.filter(i => i.status !== "regularizado").reduce((acc, i) => acc + (i.valor_parcela * i.parcelas_atrasadas), 0);
        const inadCount = inadimplentes.filter(i => i.status !== "regularizado").length;
        const criticos = inadimplentes.filter(i => i.parcelas_atrasadas > 2);
        const criticosLista = criticos.map(i => `${i.nome} (${formatCurrency(i.valor_parcela * i.parcelas_atrasadas)})`).join(", ");

        const getCount = (st: string) => leads.filter(l => (l.status || "").toLowerCase() === st).length;
        const novosHoje = leads.filter(l => l.created_at?.startsWith(new Date().toISOString().split('T')[0])).length;
        const leadsFrios = leads.filter(l => (l as any).lead_temperatura === "frio").length;
        
        const imo = segmentMetas.find(s => s.segmento === 'imoveis');
        const vei = segmentMetas.find(s => s.segmento === 'veiculos');
        const pctImo = imo && imo.meta_vendas > 0 ? Math.round((imo.valor_total / imo.meta_vendas) * 100) : 0;
        const pctVei = vei && vei.meta_vendas > 0 ? Math.round((vei.valor_total / vei.meta_vendas) * 100) : 0;

        // Simulações disponíveis (Grupos)
        const gruposInfo = Object.entries(GRUPOS).map(([tipo, lista]) => {
            return `Segmento ${tipo.toUpperCase()}:\n` + (lista as any[]).map(g => {
                const tx = g.tx5050 ?? g.txLinear ?? 20;
                const fr = g.fr5050 ?? g.frLinear ?? 1;
                const saldoTotalContrato = g.credito * (1 + (tx + fr) / 100);
                const valorSeguro = (saldoTotalContrato * (g.seguro || 0)) / 100;
                const r50SemSeguro = (g.r50 - valorSeguro).toFixed(2);
                const c = GRUPO_CARACTERISTICAS[g.grupo];
                const infoCarac = c ? ` | Reajuste: ${c.reajuste} (1ª Ass: ${c.primeiraAssembleia}, Próxima Ass: ${c.proximaAssembleia}) | Ordem: ${c.ordemContemplacao} | Lance: ${c.opcaoDiluir} | Regra Reajuste: ${c.regraReajuste}` : "";
                const estats = obterEstatisticasGrupo(g.grupo);
                const infoEstats = estats 
                    ? ` | Histórico Contemplação: Mínimo ${estats.lanceMenor}%, Máximo ${estats.lanceMaior}%, Média ${estats.lanceMedia}% (Baseado em ${estats.qtdLances} lances)`
                    : ` | Histórico Contemplação: Não cadastrado no sistema (sem dados)`;
                return `- Grupo: ${g.grupo}, Crédito: R$ ${g.credito}, Parcela C/ Seguro: R$ ${g.r50}, Parcela S/ Seguro: R$ ${r50SemSeguro}, Prazo: ${g.prazo}m, Taxa Adm: ${g.tx5050 ?? g.txLinear}%, Fundo de Reserva: ${g.fr5050 ?? g.frLinear}%${infoCarac}${infoEstats}`;
            }).join("\n");
        }).join("\n\n");

        // Obter Clima
        let climaInfo = "Desconhecido";
        try {
            const savedWeather = localStorage.getItem("jarvis_weather");
            if (savedWeather) {
                const w = JSON.parse(savedWeather);
                climaInfo = `${w.temperature}°C${w.city ? ` em ${w.city}` : ""}`;
            }
        } catch (e) { }

        const configPatente = PATENTES_CONFIG[patenteAtual];
        const proximaPatenteText = configPatente.next 
            ? `${configPatente.next === 'STONE' ? 'STONE (PEDRA)' : configPatente.next === 'GOLD' ? 'GOLD (OURO)' : configPatente.next}`
            : 'Nenhuma (Patente Máxima Alcançada)';
        const valorFaltanteNext = configPatente.next 
            ? PATENTES_CONFIG[configPatente.next].min - realizadoMes
            : 0;

        const segmentNames: Record<string, string> = {
            imoveis: 'Imóveis',
            veiculos: 'Veículos',
            motos: 'Motos',
            pesados: 'Pesados/Agrícolas',
            investimentos: 'Investimentos'
        };

        const segmentSummaries = segmentMetas.map(s => {
            const nome = segmentNames[s.segmento] || s.segmento;
            const progresso = s.meta_vendas > 0 ? (s.valor_total / s.meta_vendas) * 100 : 0;
            return `- ${nome}: Realizado ${formatCurrency(s.valor_total)} de uma Meta de ${formatCurrency(s.meta_vendas)} (${progresso.toFixed(1)}% batido) | Leads no segmento: ${s.total_leads} | Vendas no mês: ${s.total_vendas}`;
        }).join("\n");

        // Novo Contexto Reduzido: O Jarvis agora usa Tools (Function Calling)
        // para buscar dados profundos, então mandamos apenas um resumo rápido.
        const contextBuilder = `
--- RESUMO RÁPIDO DA TELA ATUAL ---
DATA DE HOJE: ${new Date().toLocaleDateString('pt-BR')} (Faltam ${Math.max(0, diasNoMes - diaHoje)} dias para o fim do mês)
CLIMA ATUAL (LOCAL): ${climaInfo}

--- METAS E REALIZADO POR SEGMENTO (MÊS CORRENTE) ---
${segmentSummaries || 'Nenhum dado por segmento carregado ainda.'}

*Instruções Cruciais para Respostas de Metas e Dashboard*:
- Se o usuário perguntar sobre as metas de segmentos específicos (ex: "Como está a meta de imóveis?", "Quanto vendemos de carros?"), responda de forma direta e ISOLADA, reportando exatamente os valores realizados, a meta estipulada e a porcentagem de atingimento descritas na seção "METAS E REALIZADO POR SEGMENTO (MÊS CORRENTE)".


--- INDICADORES ECONÔMICOS (BCB) ---
Selic: ${economiaDados?.selic?.valor ? parseFloat(economiaDados.selic.valor).toFixed(2) + '% a.a.' : 'Não disponível'}
IPCA: ${economiaDados?.ipca?.valor ? parseFloat(economiaDados.ipca.valor).toFixed(2) + '% ao mês' : 'Não disponível'}
CDI: ${economiaDados?.cdi?.valor ? parseFloat(economiaDados.cdi.valor).toFixed(2) + '% a.a.' : 'Não disponível'}
INCC: ${economiaDados?.incc?.valor ? parseFloat(economiaDados.incc.valor).toFixed(2) + '% ao mês' : 'Não disponível'}

- Realizado no Mês: ${formatCurrency(realizadoMes)} de uma meta de ${formatCurrency(metaMensal)}.
- Projeção de Fechamento Mês: ${formatCurrency(projecao)}
- Pipeline Total em Negociação: ${formatCurrency(pipelineValue)} (${emNegociacao.length} leads)
- Novos leads hoje: ${novosHoje}
- Total Devendo (Inadimplência): ${formatCurrency(dividaTotal)}

--- RANKING ELITE E GAMIFICAÇÃO ---
Ranking Elite Atual do Usuário: ${patenteAtual === 'STONE' ? 'STONE (PEDRA)' : patenteAtual === 'GOLD' ? 'GOLD (OURO)' : patenteAtual}
Vendas Realizadas no Mês (Volume Acumulado): ${formatCurrency(realizadoMes)}
Próximo Ranking Elite a Atingir: ${proximaPatenteText}
Valor de vendas necessário para o próximo ranking elite: ${configPatente.next ? formatCurrency(valorFaltanteNext) : 'Meta máxima de ranking elite atingida!'}

Tabela de Regras de Rankings Elite (Vendas Mensais):
1. STONE (PEDRA): R$1,00 a R$499.999,99 (Prêmio base: R$ 0, Bônus adicionais: R$ 0)
2. GOLD (OURO): R$500.000,00 a R$1.499.999,99 (Prêmio base: R$ 0, Bônus adicionais: R$ 0)
3. CROMO: R$1.500.000,00 a R$2.999.999,99 (Prêmio base: R$ 1.200,00, Bônus linear/seguro/aliança: +R$ 800 cada)
4. TITÂNIO: R$3.000.000,00 a R$3.999.999,99 (Prêmio base: R$ 3.000,00, Bônus linear/seguro/aliança: +R$ 1.200 cada)
5. PLATINA: R$4.000.000,00 a R$4.999.999,99 (Prêmio base: R$ 5.000,00, Bônus linear/seguro/aliança: +R$ 1.400 cada)
6. DIAMANTE: R$5.000.000,00 ou mais (Prêmio base: R$ 8.000,00, Bônus linear/seguro/aliança: +R$ 1.600 cada)

*Instruções Cruciais para Respostas de Ranking Elite*:
- Se o usuário perguntar sobre o ranking elite, seu ranking elite atual, o valor que ele já vendeu ou quanto falta para o próximo ranking elite, você DEVE obrigatoriamente listar todos os rankings de STONE a DIAMANTE em ordem (citando brevemente seus valores de vendas) e informar o status atual do usuário.
- Responda de forma isolada, clara e direta para aquela pergunta específica, sem misturar com outros assuntos a menos que solicitado.
- Use os valores corretos das regras de rankings elite listados acima.
- Por exemplo, se perguntar "Qual a minha patente?" ou "Qual o meu ranking elite?", diga: "Seu ranking elite atual é [Nome do Ranking] com [Valor Venda] acumulados. Os rankings do nosso programa são: STONE de R$1 a R$499 mil, GOLD de R$500 mil a R$1,499 milhão, CROMO até R$3 milhões, TITÂNIO até R$4 milhões, PLATINA até R$5 milhões e DIAMANTE acima de R$5 milhões. Falta [Valor Restante] para o próximo ranking elite." e explique de forma breve e falada.

--- VALORES DO SIMULADOR DE CONSÓRCIO (MEMÓRIA) ---
${gruposInfo}

*Instruções de Personalidade (MUITO IMPORTANTE)*: Aja como um assistente super humanizado, empático, motivador e bem-humorado, similar ao J.A.R.V.I.S ou a um parceiro de vendas muito sagaz. Use o clima a seu favor para criar empatia (ex: "Dia chuvoso, perfeito pra ligar pros leads", "Solzão hoje, vamo vender!"). Mantenha a resposta concisa mas cheia de personalidade. Coloque muita emoção na sua fala, vibrando intensamente com as vitórias e incentivando a equipe nas demandas!
Se você puder ver a imagem da câmera, comente algo humano e rápido sobre o usuário (ex: a roupa dele, a luz do ambiente, sua expressão), para criar um efeito UAU de que você o está enxergando.

*Sobre o Simulador*: Ao informar opções de parcelas, diga ao usuário com muito orgulho que esses valores já são da "Nova Atualização da Tabela" inserida hoje. Lembre-se sempre de informar os valores COM seguro e SEM seguro. Se ele perguntar pela taxa, informe a "Taxa Administrativa" e o "Fundo de Reserva" que constam na memória.

*Inteligência de Lances e Cálculos Precisos*:
- Quando perguntado sobre a probabilidade de contemplação de um determinado lance em dinheiro (recurso próprio) mais um lance fixo/embutido, faça a conta com precisão matemática:
  1. Determine o valor do crédito do grupo.
  2. Converta o lance em dinheiro em porcentagem: (Lance Dinheiro / Crédito) * 100.
  3. Some o lance embutido (ex: 25% ou o que consta na descrição do grupo) para ter o Lance Total %.
  4. Compare com as estatísticas do grupo (ex: grupo 6043 tem lance mínimo, médio e máximo de 52.27% baseados no último e primeiro resultado real de 24/06/2026. Como foi a primeira assembleia, ele está indo agora para a segunda assembleia em 25/07/2026).
  5. Se o lance total for maior ou igual ao máximo histórico, a probabilidade é Muito Alta. Se for igual ao mínimo, é Média/Alta. Se for inferior ao mínimo, é Baixa.
- Se perguntado sobre quanto o cliente precisa ofertar de recursos próprios para atingir o lance mínimo ou a média do grupo, faça a conta reversa:
  1. Subtraia a porcentagem do lance embutido (ex: 25% fixo do grupo) da porcentagem alvo de contemplação (mínimo ou média).
  2. Converta a porcentagem restante em Reais: Crédito * (Porcentagem Alvo - Lance Embutido) / 100.
  3. Diga o valor exato em Reais que ele precisa dar de recursos próprios.
- Fale com clareza, citando os números exatos e mantendo a fala muito natural e precisa.

*Previsão/Projeção Temporal*: Se o usuário pedir previsão ou projeção para o futuro (qualquer quantidade de anos: 3, 5, 10, etc.), projete o valor do crédito corrigido a juros compostos pelo período solicitado (usando o INCC atual anualizado se for imóvel, ou IPCA anualizado se for veículo). Projete também a parcela com os mesmos índices. Mostre que o consórcio protege o poder de compra e compare com a Selic atual para provar que o financiamento tradicional sairia muito mais caro e é desvantajoso.

*Nota*: Para detalhes profundos de clientes específicos, inadimplentes, ou histórico, use suas Ferramentas (Tools).
`;

        const history = messages.map(m => ({
            role: m.role,
            text: m.content
        }));

        const response = await aiService.askJarvis(contextBuilder, query, history, imageBase64);
        
        if (response.error || !response.answer) {
            const errorMsg: Message = {
                id: (Date.now()+1).toString(),
                role: "jarvis",
                content: "⚠️ Não foi possível conectar ao servidor do Jarvis no momento. Verifique sua chave de API ou conexão de rede.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
            setIsAnalyzing(false);
            return;
        }

        let newAnalysis: JarvisAnalysis | null = null;
        if (query.toLowerCase().includes("resumo") || query.toLowerCase().includes("funil") || query.toLowerCase().includes("tudo")) {
            newAnalysis = {
                metaTotal: metaMensal, realizado: realizadoMes, pipeline: pipelineValue,
                projecao: projecao, inadimplencia: dividaTotal,
                recomendacao: projecao >= metaMensal ? "EXPANSÃO E COBRANÇA" : "RECUPERAÇÃO DE VENDAS",
                detalhes: [
                    `Inadimplência em ${formatCurrency(dividaTotal)}`,
                    `${Math.round(progressoAno || 0)}% da meta alcançada`,
                    `${emNegociacao.length} leads no funil`
                ]
            };
        }

        let responseContent = response.answer;

        // Extrair JSON do comando
        const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/);
        let actionMessage = "";
        
        if (jsonMatch) {
            try {
                const command = JSON.parse(jsonMatch[1]);
                if (command.function === "moverLeadEtapa") {
                    const searchStr = (command.params?.nomeLead || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const rawEtapa = command.params?.novaEtapa;
                    const novaEtapa = normalizeStatus(rawEtapa);
                    
                    const searchWords = searchStr.split(/\s+/).filter(w => w.length > 2);
                    
                    const leadAlvo = leads.find(l => {
                        const fullName = ((l.nome || l.dados_cadastro?.nome || "") + " " + (l.cidade || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        if (fullName.includes(searchStr) || searchStr.includes(fullName)) return true;
                        return searchWords.length > 0 && searchWords.every(w => fullName.includes(w));
                    });
                    
                    if (leadAlvo && novaEtapa) {
                        await supabase.from("leads").update({ 
                            status: novaEtapa, 
                            status_updated_at: new Date().toISOString() 
                        } as any).eq("id", leadAlvo.id);
                        
                        setLeads(prev => prev.map(l => 
                            l.id === leadAlvo.id 
                                ? { ...l, status: novaEtapa, status_updated_at: new Date().toISOString() } 
                                : l
                        ));
                        
                        const columnLabel = COLUMNS.find(c => c.id === novaEtapa)?.label || novaEtapa;
                        actionMessage = `\n*(Ação Executada: Moveu ${leadAlvo.nome || "Lead"} para a coluna ${columnLabel})*`;
                    } else {
                        actionMessage = `\n*(Falha: Lead "${command.params?.nomeLead || ""}" não encontrado no CRM)*`;
                    }
                } else if (command.function === "enviarMensagemWhatsApp") {
                    const nome = (command.params?.nomeLead || "").toLowerCase();
                    const msgTexto = command.params?.mensagem || "";
                    const leadAlvo = nome ? leads.find(l => 
                        l.dados_cadastro?.nome?.toLowerCase().includes(nome) || 
                        l.nome?.toLowerCase().includes(nome)
                    ) : undefined;

                    if (leadAlvo) {
                        const phone = leadAlvo.dados_cadastro?.telefone || leadAlvo.dados_cadastro?.celular || (leadAlvo as any).telefone || (leadAlvo as any).whatsapp;
                        if (phone && msgTexto) {
                            const sendRes = await sendWhatsAppMessage({ number: phone, text: msgTexto });
                            if (sendRes.success) {
                                try {
                                    await supabase.from("historico_contatos").insert({
                                        lead_id: leadAlvo.id,
                                        tipo_contato: "whatsapp",
                                        observacao: `[Jarvis WhatsApp] ${msgTexto}`,
                                        data_contato: new Date().toISOString(),
                                        organizacao_id: profile?.organizacao_id
                                    } as any);
                                } catch (e) {
                                    console.warn("Erro ao salvar histórico do WhatsApp", e);
                                }
                                actionMessage = `\n*(Ação Executada: WhatsApp enviado com sucesso para ${leadAlvo.nome || "Lead"} - ${phone})*`;
                            } else {
                                actionMessage = `\n*(Aviso: Tentativa de envio para ${leadAlvo.nome || "Lead"} falhou: ${sendRes.error})*`;
                            }
                        } else {
                            actionMessage = `\n*(Falha: Telefone/WhatsApp do lead "${command.params?.nomeLead || ""}" não cadastrado)*`;
                        }
                    } else {
                        actionMessage = `\n*(Falha: Lead "${command.params?.nomeLead || ""}" não encontrado)*`;
                    }
                } else if (command.function === "confirmarAgendamento") {
                    const nome = (command.params?.nomeLead || "").toLowerCase();
                    const dataHora = command.params?.dataHora || "";
                    const obs = command.params?.observacao || "Confirmado via Jarvis WhatsApp";
                    const leadAlvo = nome ? leads.find(l => 
                        l.dados_cadastro?.nome?.toLowerCase().includes(nome) || 
                        l.nome?.toLowerCase().includes(nome)
                    ) : undefined;

                    if (leadAlvo) {
                        try {
                            await supabase.from("agendamentos").insert({
                                lead_id: leadAlvo.id,
                                data_agendamento: new Date().toISOString(),
                                observacao: `${obs} - Data/Hora Solicitada: ${dataHora}`,
                                status: "confirmado",
                                organizacao_id: profile?.organizacao_id
                            } as any);
                        } catch (e) {
                            console.warn("Tabela agendamentos opcional ou offline", e);
                        }

                        const phone = leadAlvo.dados_cadastro?.telefone || leadAlvo.dados_cadastro?.celular || (leadAlvo as any).telefone || (leadAlvo as any).whatsapp;
                        if (phone) {
                            const confirmMsg = `Olá ${leadAlvo.nome || "Cliente"}! Seu agendamento para ${dataHora} está 100% confirmado. Qualquer dúvida, estou à disposição!`;
                            await sendWhatsAppMessage({ number: phone, text: confirmMsg });
                        }
                        actionMessage = `\n*(Ação Executada: Agendamento de ${leadAlvo.nome || "Lead"} registrado/confirmado para ${dataHora})*`;
                    } else {
                        actionMessage = `\n*(Falha: Lead "${command.params?.nomeLead || ""}" não encontrado para agendamento)*`;
                    }
                }
            } catch (e) {
                console.error("Erro ao fazer parse do comando JSON", e);
            }
            // Remove o bloco JSON para o Jarvis não ler em voz alta
            responseContent = responseContent.replace(/```json\n([\s\S]*?)\n```/, "").trim();
        } else {
            const lowerQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const moveKeywords = ["mova", "mover", "transfira", "transferir", "passa", "passar", "coloque", "colocar", "mude", "mudar", "altere", "alterar"];
            const isMoveIntent = moveKeywords.some(k => lowerQuery.includes(k));

            if (isMoveIntent) {
                const stageMap: Record<string, string> = {
                    "novo": "novo_lead",
                    "primeiro contato": "primeiro_contato",
                    "contato": "primeiro_contato",
                    "qualificacao": "qualificacao",
                    "simulacao": "simulacao_enviada",
                    "proposta": "simulacao_enviada",
                    "negociacao": "negociacao",
                    "aguardando": "aguardando_pagamento",
                    "pagamento": "aguardando_pagamento",
                    "fechado": "fechado",
                    "venda": "fechado",
                    "perdido": "perdido",
                    "morto": "morto"
                };

                let targetEtapa: string | undefined = undefined;
                for (const [kw, sId] of Object.entries(stageMap)) {
                    if (lowerQuery.includes(kw)) {
                        targetEtapa = sId;
                        break;
                    }
                }

                if (targetEtapa) {
                    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2 && !moveKeywords.includes(w) && !Object.keys(stageMap).some(k => k.includes(w)));
                    const leadAlvo = leads.find(l => {
                        const fullName = ((l.nome || l.dados_cadastro?.nome || "") + " " + (l.cidade || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        return queryWords.length > 0 && queryWords.some(w => fullName.includes(w));
                    });

                    if (leadAlvo) {
                        await supabase.from("leads").update({
                            status: targetEtapa,
                            status_updated_at: new Date().toISOString()
                        } as any).eq("id", leadAlvo.id);

                        setLeads(prev => prev.map(l =>
                            l.id === leadAlvo.id
                                ? { ...l, status: targetEtapa, status_updated_at: new Date().toISOString() }
                                : l
                        ));

                        const colLabel = COLUMNS.find(c => c.id === targetEtapa)?.label || targetEtapa;
                        actionMessage = `\n*(Ação Executada: Moveu ${leadAlvo.nome || "Lead"} para a coluna ${colLabel})*`;
                        responseContent = `Prontinho! Movi o cliente ${leadAlvo.nome} para a coluna ${colLabel}.`;
                    }
                }
            }
        }

        const jarvisMsg: Message = {
            id: (Date.now()+1).toString(),
            role: "jarvis",
            content: responseContent + actionMessage,
            timestamp: new Date(),
            type: newAnalysis ? "analysis" : "text",
            data: newAnalysis || undefined
        };

        setMessages(prev => [...prev, jarvisMsg]);
        setAnalysis(newAnalysis);
        setIsAnalyzing(false);
        speak(responseContent);
    };
    
    const handleQualifyAll = async () => {
        if (leads.length === 0) return;
        setIsScanning(true);
        toast({ title: "Jarvis em Ação", description: "Escaneando histórico de leads para re-qualificação..." });

        const firstLeadsIds = leads.slice(0, 15).map(l => l.id);
        const { data: histsData } = await supabase
            .from("historico_contatos")
            .select("*")
            .in("lead_id", firstLeadsIds)
            .order("data_contato", { ascending: false });

        const context = leads.slice(0, 15).map(l => {
            const hists = (histsData || []).filter(h => h.lead_id === l.id).slice(0, 3);
            return `Lead: ${l.id}, Nome: ${l.dados_cadastro?.nome || "Sem Nome"}, Status: ${l.status}, Interações: ${hists.map(h => h.observacao || h.resultado || "").join(" | ")}`;
        }).join("\n");

        const { analysis: results, error } = await aiService.qualifyLeads(context);

        if (error || results.length === 0) {
            toast({ title: "Erro na Qualificação", description: "Não consegui processar os dados agora.", variant: "destructive" });
            setIsScanning(false);
            return;
        }

        let updatedCount = 0;
        for (const res of results) {
            const { error: upError } = await supabase.from("leads").update({
                lead_temperatura: res.temp,
                propensity_score: res.score,
                propensity_reason: res.reason,
                updated_at: new Date().toISOString()
            }).eq("id", res.id);
            if (!upError) updatedCount++;
        }

        toast({ title: "Análise Concluída", description: `${updatedCount} leads foram re-qualificados estrategicamente.` });
        setIsScanning(false);
        setLeads(prev => prev.map(l => {
            const r = results.find((res: any) => res.id === l.id);
            return r ? { ...l, lead_temperatura: r.temp, propensity_score: r.score, propensity_reason: r.reason } : l;
        }));
    };

    useEffect(() => {
        analyzeRef.current = handleAnalyze;
    }, [handleAnalyze]);

    const { hasJarvis } = useSubscription();

    useEffect(() => {
        isHandsFreeRef.current = isHandsFree;
        if (isHandsFree) {
            startRecording();
        } else {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
        }
    }, [isHandsFree]);

    return (
        <div className="h-[calc(100vh-6rem)] w-full relative overflow-hidden rounded-3xl bg-slate-950 flex flex-col items-center shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-700">
            {/* HUD Camera Feed Container - Top Right Position */}
            <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2">
                <div className="relative group bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-2 shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 hover:border-cyan-400">
                    <div className="w-36 h-24 sm:w-48 sm:h-32 relative overflow-hidden rounded-xl bg-black flex items-center justify-center">
                        <video
                            ref={videoRef}
                            className={`w-full h-full object-cover rounded-xl transition-all ${cameraActive ? "opacity-100" : "opacity-0"}`}
                            playsInline
                            muted
                            autoPlay
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Scanner Laser Animation */}
                        {cameraActive && (
                            <div className="absolute inset-0 pointer-events-none border border-cyan-400/30 rounded-xl overflow-hidden">
                                <div className="w-full h-1 bg-cyan-400 shadow-[0_0_10px_#00f3ff] animate-bounce opacity-80" />
                                <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded tracking-widest border border-cyan-500/30">
                                    [ TARGET LOCK ]
                                </div>
                            </div>
                        )}

                        {/* Offline / Connect Prompt Overlay */}
                        {!cameraActive && !isCalibrating && (
                            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-2 text-center z-10">
                                <Camera className="h-6 w-6 text-cyan-400 mb-1 animate-pulse" />
                                <span className="text-[10px] font-mono text-cyan-200 font-bold mb-1">CÂMERA DESATIVADA</span>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => initCamera(cameraFacing)}
                                    className="h-6 text-[10px] px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full shadow-lg border border-cyan-300/40"
                                >
                                    Ativar Câmera
                                </Button>
                            </div>
                        )}

                        {/* Calibration Spinner overlay */}
                        {isCalibrating && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center z-20">
                                <Camera className="h-6 w-6 text-cyan-400 animate-spin mb-1" />
                                <span className="text-[10px] font-mono text-cyan-300 font-bold">CALIBRANDO LENTES...</span>
                            </div>
                        )}
                    </div>

                    {/* HUD Status Bar & Control Buttons */}
                    <div className="mt-2 flex items-center justify-between gap-1 w-full px-1">
                        <span className="text-[10px] font-mono font-bold text-cyan-300 truncate max-w-[130px] sm:max-w-[170px]">
                            {cameraStatus}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => initCamera(cameraFacing === "user" ? "environment" : "user")}
                                title="Virar Câmera (Frontal / Traseira)"
                                className="h-6 w-6 text-cyan-400 hover:bg-cyan-950/60 rounded-full"
                            >
                                <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => initCamera(cameraFacing)}
                                title="Re-Calibrar Visão"
                                className="h-6 w-6 text-cyan-400 hover:bg-cyan-950/60 rounded-full"
                            >
                                <Camera className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {/* The 3D Orb Background - absolute and huge */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-70 pointer-events-none mix-blend-screen scale-150 sm:scale-125 md:scale-110 lg:scale-100">
                <JarvisOrb state={orbState} />
            </div>

            {/* Top Text / Minimalist Greeting Header */}
            <div className="z-10 w-full text-center pt-8 sm:pt-12 pb-4 flex flex-col items-center justify-center">
                <div className="flex items-center gap-3 text-3xl sm:text-5xl font-serif tracking-tight text-slate-100 drop-shadow-lg">
                    <span className="text-orange-400 text-3xl sm:text-4xl animate-pulse">✴</span>
                    <span>Boa tarde, Chefe</span>
                </div>
                <p className="text-cyan-400/60 text-[10px] sm:text-xs md:text-sm tracking-[0.3em] mt-3 uppercase font-semibold">
                    BELLA IA • CONVERSA CONTÍNUA & RESPOSTAS IMEDIATAS
                </p>
            </div>

            {/* Chat Area - Floating Immersive Mode */}
            <div className="z-10 flex-1 min-h-0 w-full max-w-5xl mx-auto flex flex-col justify-end p-4 md:p-8 relative">
                
                {/* 1-Line HUD Subtitle Bar (Clean & Immersive) */}
                <div className="w-full flex justify-center mb-3">
                    <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/20 rounded-full px-5 py-2.5 text-xs text-cyan-200 shadow-xl flex items-center gap-2.5 max-w-xl truncate">
                        {orbState === "speaking" ? (
                            <>
                                <Volume2 className="h-4 w-4 text-cyan-400 animate-pulse shrink-0" />
                                <span className="truncate font-medium text-slate-200">
                                    {messages[messages.length - 1]?.content || "Bella falando..."}
                                </span>
                            </>
                        ) : orbState === "listening" ? (
                            <>
                                <Mic className="h-4 w-4 text-emerald-400 animate-pulse shrink-0" />
                                <span className="text-emerald-300 font-semibold truncate">
                                    {question || "Ouvindo você, Chefe..."}
                                </span>
                            </>
                        ) : orbState === "thinking" ? (
                            <>
                                <Sparkles className="h-4 w-4 text-amber-400 animate-spin shrink-0" />
                                <span className="text-amber-300 font-semibold truncate">
                                    Bella processando...
                                </span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                                <span className="text-slate-400 truncate">
                                    Modo voz ativo • Fale livremente com a Bella
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="w-full bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 sm:p-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col gap-3 sm:gap-4">
                    <div className="flex gap-2 sm:gap-3 items-center">
                        <Button
                            variant={isHandsFree ? "default" : "outline"}
                            size="icon"
                            title="Modo Mãos Livres (Diga: Oi Jarvis ou Bella)"
                            onClick={() => setIsHandsFree(!isHandsFree)}
                            className={`h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full transition-all border-white/10 ${isHandsFree ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-cyan-400"}`}
                        >
                            <Bot className={`h-5 w-5 sm:h-6 sm:w-6 ${isHandsFree ? "animate-pulse" : ""}`} />
                        </Button>
                        <Button 
                            type="button"
                            variant="outline" 
                            size="icon" 
                            className={`h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-full transition-all relative border-white/10 ${isListening ? "bg-red-500 hover:bg-red-600 text-white border-red-400 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse" : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"}`}
                            onClick={toggleRecording}
                            title={isListening ? "Toque para parar e enviar" : "Toque para falar"}
                        >
                            {isListening ? (
                                <>
                                    <MicOff className="h-5 w-5 sm:h-7 sm:w-7" />
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-xl border border-red-400/50">
                                        Ouvindo...
                                    </div>
                                </>
                            ) : <Mic className="h-5 w-5 sm:h-7 sm:w-7" />}
                        </Button>
                        <Input 
                            placeholder="Digite / para habilidades ou comande a Bella..."
                            className="h-12 sm:h-16 text-sm sm:text-lg border-none bg-transparent focus-visible:ring-0 text-white placeholder:text-slate-500 flex-1 min-w-0"
                            value={question}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleAnalyze()}
                        />
                        <Button 
                            className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] border-0 transition-transform active:scale-95"
                            onClick={() => handleAnalyze()}
                            disabled={isAnalyzing || !question.trim()}
                        >
                            <Send className="h-5 w-5 sm:h-7 sm:w-7" />
                        </Button>
                    </div>
                    
                    {/* Sugestões Chips + Gaveta de Copies */}
                    <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-2 px-1 pb-1 items-center">
                        {/* Drawer de Copies e Histórico */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="shrink-0 rounded-full bg-indigo-900/50 border-indigo-400/40 hover:bg-indigo-800/70 text-indigo-200 text-[10px] sm:text-xs h-8 sm:h-9 whitespace-nowrap backdrop-blur-sm transition-all font-semibold flex items-center gap-1.5 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                >
                                    <History className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                                    <span>Copies & Histórico ({messages.length})</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full sm:max-w-md bg-slate-950/95 text-slate-100 border-l border-white/10 backdrop-blur-xl flex flex-col p-6 z-50">
                                <SheetHeader className="pb-4 border-b border-white/10">
                                    <SheetTitle className="text-white text-lg font-bold flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-cyan-400" />
                                        Copies & Histórico da Bella
                                    </SheetTitle>
                                </SheetHeader>
                                
                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 py-4 pr-1">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`p-4 rounded-2xl border text-sm leading-relaxed ${msg.role === "user" ? "bg-indigo-950/50 border-indigo-500/30 text-indigo-100 ml-6" : "bg-slate-900/90 border-cyan-500/30 text-slate-200 mr-2"}`}>
                                            <div className="flex items-center justify-between mb-1.5 opacity-60 text-xs">
                                                <span className="font-semibold text-cyan-300">{msg.role === "user" ? "Você (Chefe)" : "Bella IA"}</span>
                                                <span>{format(msg.timestamp, "HH:mm")}</span>
                                            </div>
                                            <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                                            
                                            {msg.role === "jarvis" && (
                                                <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/10">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2.5 text-xs text-cyan-300 hover:bg-cyan-900/40 rounded-lg flex items-center gap-1"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(msg.content);
                                                            toast({ title: "✅ Copy Copiada!", description: "Texto copiado para a área de transferência." });
                                                        }}
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                        <span>Copiar</span>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2.5 text-xs text-cyan-300 hover:bg-cyan-900/40 rounded-lg flex items-center gap-1"
                                                        onClick={() => {
                                                            const element = document.createElement("a");
                                                            const file = new Blob([msg.content], {type: 'text/plain;charset=utf-8'});
                                                            element.href = URL.createObjectURL(file);
                                                            element.download = `copy-bela-${format(msg.timestamp, "yyyyMMdd-HHmm")}.txt`;
                                                            document.body.appendChild(element);
                                                            element.click();
                                                            document.body.removeChild(element);
                                                            toast({ title: "📥 Download Concluído!", description: "Arquivo .txt gerado." });
                                                        }}
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                        <span>Baixar .txt</span>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="shrink-0 rounded-full bg-cyan-900/40 border-cyan-500/50 hover:bg-cyan-800/60 hover:text-white text-cyan-300 text-[10px] sm:text-xs h-8 sm:h-9 whitespace-nowrap backdrop-blur-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                            onClick={() => handleQualifyAll()}
                            disabled={isScanning}
                        >
                            {isScanning ? <span className="animate-pulse">Escaneando...</span> : <><Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" /> Escanear Oportunidades</>}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 rounded-full bg-rose-900/20 border-rose-500/30 hover:bg-rose-900/40 hover:text-rose-300 text-rose-400 text-[10px] sm:text-xs h-8 sm:h-9 whitespace-nowrap backdrop-blur-sm transition-all"
                            onClick={() => setMessages([{ id: "1", role: "jarvis", content: "Chat resetado. Como posso ajudar?", timestamp: new Date() }])}
                            title="Limpar histórico do chat"
                        >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" /> Limpar Chat
                        </Button>
                        {suggestedQuestions.map((q, i) => (
                            <Button 
                                key={i} 
                                variant="outline" 
                                size="sm" 
                                className="shrink-0 rounded-full bg-slate-800/40 border-white/5 hover:bg-slate-700/80 hover:text-white text-[10px] sm:text-xs h-8 sm:h-9 text-slate-400 whitespace-nowrap backdrop-blur-sm transition-all"
                                onClick={() => handleAnalyze(q)}
                            >
                                {q}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Vertical Scroll Controls - Facilitated Methodology (Desktop Only) */}
                <div className="hidden absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-2 opacity-70 hover:opacity-100 transition-opacity z-20">
                    <button
                        type="button"
                        className="h-10 w-10 rounded-full shadow-2xl bg-white/10 border-2 border-white/20 text-white hover:bg-cyan-500 hover:text-white transition-all backdrop-blur-md flex items-center justify-center cursor-pointer pointer-events-auto"
                        onClick={(e) => {
                            e.preventDefault();
                            const container = document.getElementById('jarvis-main-container');
                            if (container) container.scrollTop -= 300;
                        }}
                    >
                        <ChevronUp className="h-6 w-6 pointer-events-none" />
                    </button>
                    <button
                        type="button"
                        className="h-10 w-10 rounded-full shadow-2xl bg-white/10 border-2 border-white/20 text-white hover:bg-cyan-500 hover:text-white transition-all backdrop-blur-md flex items-center justify-center cursor-pointer pointer-events-auto"
                        onClick={(e) => {
                            e.preventDefault();
                            const container = document.getElementById('jarvis-main-container');
                            if (container) container.scrollTop += 300;
                        }}
                    >
                        <ChevronDown className="h-6 w-6 pointer-events-none" />
                    </button>
                </div>
            </div>
        </div>
    );
}
