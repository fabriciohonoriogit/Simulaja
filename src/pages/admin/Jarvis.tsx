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
    RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import jarvisAvatar from "@/assets/jarvis-avatar.png";
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
            content: `Fala ${profile?.nome_completo?.split(' ')[0] || 'Parceiro'}! Sou o Jarvis, seu estrategista comercial. O que vamos atacar hoje?`,
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
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [cameraStatus, setCameraStatus] = useState<string>("⚠️ Clique para Ativar Câmera");
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const initCamera = async (facing: "user" | "environment" = "user") => {
        setIsCalibrating(true);
        setCameraStatus("⚡ Conectando...");

        // Timer de segurança de 3s para garantir que NUNCA fique travado em calibrando
        const safetyTimer = setTimeout(() => {
            setIsCalibrating(false);
        }, 3000);

        try {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(t => t.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.warn("Autoplay note:", e));
                setCameraActive(true);
                setCameraFacing(facing);
                setCameraStatus("🟢 VISÃO 360° ONLINE");
            }
        } catch (err) {
            console.warn("Erro ao calibrar câmera:", err);
            setCameraActive(false);
            setCameraStatus("⚠️ Clique para Ativar Câmera");
        } finally {
            clearTimeout(safetyTimer);
            setIsCalibrating(false);
        }
    };

    const captureCameraFrame = (): string | undefined => {
        if (!videoRef.current || !cameraActive) return undefined;
        try {
            const canvas = canvasRef.current || document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
                return dataUrl.split(",")[1];
            }
        } catch (e) {
            console.error("Erro ao capturar frame:", e);
        }
        return undefined;
    };

    useEffect(() => {
        // Câmera desativada por padrão no carregamento para evitar travamentos de navegador/dispositivo
        setIsCalibrating(false);
        setCameraActive(false);
        setCameraStatus("⚠️ Clique para Ativar Câmera");

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(t => t.stop());
            }
        };
    }, []);


    const speak = (text: string) => {
        if (typeof window === "undefined") return;
        
        // Humanização: remover markdown (ex: *bold*, _italic_), emojis e caracteres especiais, além de adaptar espaços
        const cleanText = text
            .replace(/\*|_|#|\[|\]/g, '') // Remove md symbols
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '') // Remove emojis
            .replace(/FUNIL:|LEADS:|METAS DO MÊS:|INADIMPLÊNCIA:/g, '') // Remove headers para fala mais fluida
            .replace(/\s+/g, ' ') // Remove double spaces
            .trim();

        const msg = new SpeechSynthesisUtterance(cleanText);
        msg.lang = "pt-BR";
        
        // Selecionar uma voz mais natural e humanizada
        const voices = window.speechSynthesis.getVoices();
        
        // No iOS as vozes básicas são robóticas. Vamos priorizar Premium/Enhanced ou Google/Online.
        let ptVoice = voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Online') || v.name.includes('Natural') || v.name.includes('Google')));
        
        if (!ptVoice) {
            ptVoice = voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Luciana') || v.name.includes('Daniel') || v.name.includes('Thiago') || v.name.includes('Felipe') || v.name.includes('Letícia')));
        }
        
        if (!ptVoice) {
            ptVoice = voices.find(v => v.lang.includes('pt-BR'));
        }
            
        if (ptVoice) {
            msg.voice = ptVoice;
        }

        // Emoção e energia (Ajustado para evitar robotização no iOS)
        msg.rate = window.navigator.userAgent.match(/iPad|iPhone|iPod/) ? 1.0 : 1.0; 
        msg.pitch = window.navigator.userAgent.match(/iPad|iPhone|iPod/) ? 1.0 : 1.05;
        
        setOrbState("speaking");
        
        msg.onend = () => {
             setOrbState("idle");
             // Reinicia a escuta contínua Hands-Free automaticamente após terminar de falar
             if (isHandsFreeRef.current) {
                 setTimeout(() => {
                     try { startRecording(); } catch (e) {}
                 }, 600);
             }
        };
        
        // Fallback timeout case onend fails
        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = setTimeout(() => {
            setOrbState("idle");
            if (isHandsFreeRef.current) {
                setTimeout(() => {
                    try { startRecording(); } catch (e) {}
                }, 600);
            }
        }, Math.max(3000, cleanText.length * 80));

        window.speechSynthesis.speak(msg);
    };

    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef<string>("");
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startRecording = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({ title: "Voz indisponível", description: "Seu navegador não suporta reconhecimento de voz. Use Chrome/Safari no celular.", variant: "destructive" });
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
                if (finalText) finalTranscriptRef.current += finalText;
                const fullText = (finalTranscriptRef.current + " " + interim).trim();
                setQuestion(fullText);

                // Quando a palavra 'jarvis' for falada, encerra a captação e dispara a resposta imediata
                if (fullText.toLowerCase().includes("jarvis") && fullText.length > 8) {
                    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = setTimeout(() => {
                        try { rec.stop(); } catch (e) {}
                    }, 1200);
                } else if (fullText.length > 2) {
                    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = setTimeout(() => {
                        try { rec.stop(); } catch (e) {}
                    }, 2200);
                }
            };

            rec.onstart = () => {
                setIsListening(true);
                setOrbState("listening");
            };

            rec.onerror = (e: any) => {
                if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
                    console.warn("[Jarvis Voice] Permissão de microfone bloqueada ou pendente no navegador.");
                    isHandsFreeRef.current = false;
                    setIsHandsFree(false);
                    setIsListening(false);
                    setOrbState("idle");
                    toast({
                        title: "Permissão de Microfone necessária",
                        description: "Clique no botão do microfone uma vez para conceder permissão ao seu navegador.",
                        variant: "destructive",
                    });
                    return;
                }

                if (e.error === 'no-speech' && finalTranscriptRef.current.trim()) {
                    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                    setIsListening(false);
                    const finalQ = finalTranscriptRef.current.trim();
                    if (finalQ && finalQ.toLowerCase().includes("jarvis")) {
                        setQuestion("");
                        handleAnalyze(finalQ);
                    } else {
                        setOrbState("idle");
                        setQuestion("");
                        if (isHandsFreeRef.current) {
                            setTimeout(() => { try { startRecording(); } catch (err) {} }, 1500);
                        }
                    }
                    return;
                }
                setIsListening(false);
                setOrbState("idle");
                if (isHandsFreeRef.current && e.error !== 'aborted') {
                    setTimeout(() => { try { startRecording(); } catch (err) {} }, 2500);
                }
            };

            rec.onend = () => {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                setIsListening(false);
                const finalQ = finalTranscriptRef.current.trim();
                
                if (finalQ && finalQ.toLowerCase().includes("jarvis")) {
                    setQuestion("");
                    handleAnalyze(finalQ);
                } else {
                    setOrbState("idle");
                    setQuestion("");
                    // Reinicia a escuta com intervalo seguro para o navegador
                    if (isHandsFreeRef.current) {
                        setTimeout(() => { try { startRecording(); } catch (e) {} }, 1000);
                    }
                }
            };

            recognitionRef.current = rec;
            rec.start();
        } catch (e) {
            console.error("Speech recognition error:", e);
            setIsListening(false);
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
        if (!profile?.organizacao_id) return;
        const fetchData = async () => {
            try {
                const [leadsRes, metaRes, inadRes] = await Promise.all([
                    supabase.from("leads").select("*").eq("organizacao_id", profile.organizacao_id),
                    supabase.from("meta").select("*").eq("ano", new Date().getFullYear()).eq("organizacao_id", profile.organizacao_id).maybeSingle(),
                    (supabase as any).from("inadimplentes").select("*").eq("organizacao_id", profile.organizacao_id)
                ]);

                let allLeads: Lead[] = [];
                if (leadsRes.data) {
                    allLeads = leadsRes.data as Lead[];
                    setLeads(allLeads);
                    
                    try {
                        const res = await calcularMissoes(profile.id, profile.organizacao_id, profile.tipo_acesso as any);
                        setMissoes(res.missoes);
                    } catch(e) {
                        console.error("Erro ao carregar missões no Jarvis:", e);
                    }
                }

                if (inadRes.data) {
                    setInadimplentes(inadRes.data as Inadimplente[]);
                }

                if (metaRes.data) {
                    setMetaAnual(metaRes.data.meta_anual || 0);
                    
                    // Calcular métricas por segmento baseadas no Metas.tsx
                    const currentMonthStr = new Date().toISOString().substring(0, 7);
                    const monthlyMetas: Record<string, number> = {
                        imoveis: Number(metaRes.data.meta_imoveis || 500000),
                        veiculos: Number(metaRes.data.meta_veiculos || 100000),
                        motos: Number(metaRes.data.meta_motos || 100000),
                        pesados: Number((metaRes.data as any).meta_pesados || 180000),
                        investimentos: Number((metaRes.data as any).meta_investimentos || 120000)
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

                const bcb = await bcbService.getEconomicIndicators();
                setEconomiaDados(bcb);
            } catch (err) {
                console.error("Erro ao carregar dados para o Jarvis:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profile?.organizacao_id]);

    // Inicialização automática da escuta contínua por palavra-chave ("Jarvis") sem necessidade de apertar botão
    useEffect(() => {
        isHandsFreeRef.current = true;
        setIsHandsFree(true);
        const timer = setTimeout(() => {
            try { startRecording(); } catch (e) {}
        }, 800);

        return () => {
            clearTimeout(timer);
            isHandsFreeRef.current = false;
            setIsHandsFree(false);
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
        };
    }, []);

    const handleAnalyze = async (query: string = question) => {
        if (!query.trim()) return;
        
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
        
        const fechados = leads.filter(l => {
            const s = (l.status || "").toLowerCase().replace("_", " ");
            return s === "fechado" || s === "venda fechada";
        });

        const fechadosMes = fechados.filter(l => {
            const dateToCheck = l.status_updated_at || l.created_at || "";
            return dateToCheck.startsWith(currentMonthStr);
        });

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
                const valorSeguro = (g.credito * (g.seguro || 0)) / 100;
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
                    const nome = command.params.nomeLead.toLowerCase();
                    const novaEtapa = command.params.novaEtapa;
                    const leadAlvo = leads.find(l => 
                        l.dados_cadastro?.nome?.toLowerCase().includes(nome) || 
                        l.nome?.toLowerCase().includes(nome)
                    );
                    
                    if (leadAlvo) {
                        await supabase.from("leads").update({ 
                            status: novaEtapa, 
                            status_updated_at: new Date().toISOString() 
                        } as any).eq("id", leadAlvo.id);
                        
                        setLeads(prev => prev.map(l => 
                            l.id === leadAlvo.id 
                                ? { ...l, status: novaEtapa, status_updated_at: new Date().toISOString() } 
                                : l
                        ));
                        actionMessage = `\n*(Ação Executada: Moveu ${leadAlvo.nome || "Lead"} para ${novaEtapa})*`;
                    } else {
                        actionMessage = `\n*(Falha: Lead "${command.params.nomeLead}" não encontrado)*`;
                    }
                } else if (command.function === "enviarMensagemWhatsApp") {
                    const nome = command.params.nomeLead.toLowerCase();
                    const msgTexto = command.params.mensagem;
                    const leadAlvo = leads.find(l => 
                        l.dados_cadastro?.nome?.toLowerCase().includes(nome) || 
                        l.nome?.toLowerCase().includes(nome)
                    );

                    if (leadAlvo) {
                        const phone = leadAlvo.dados_cadastro?.telefone || leadAlvo.dados_cadastro?.celular || (leadAlvo as any).telefone || (leadAlvo as any).whatsapp;
                        if (phone) {
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
                            actionMessage = `\n*(Falha: Telefone/WhatsApp do lead "${command.params.nomeLead}" não cadastrado)*`;
                        }
                    } else {
                        actionMessage = `\n*(Falha: Lead "${command.params.nomeLead}" não encontrado)*`;
                    }
                } else if (command.function === "confirmarAgendamento") {
                    const nome = command.params.nomeLead.toLowerCase();
                    const dataHora = command.params.dataHora;
                    const obs = command.params.observacao || "Confirmado via Jarvis WhatsApp";
                    const leadAlvo = leads.find(l => 
                        l.dados_cadastro?.nome?.toLowerCase().includes(nome) || 
                        l.nome?.toLowerCase().includes(nome)
                    );

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
                        actionMessage = `\n*(Falha: Lead "${command.params.nomeLead}" não encontrado para agendamento)*`;
                    }
                }
            } catch (e) {
                console.error("Erro ao fazer parse do comando JSON", e);
            }
            // Remove o bloco JSON para o Jarvis não ler em voz alta
            responseContent = responseContent.replace(/```json\n([\s\S]*?)\n```/, "").trim();
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
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) return;

        if (isHandsFree) {
            if (!handsFreeRecognitionRef.current) {
                handsFreeRecognitionRef.current = new SpeechRecognition();
                handsFreeRecognitionRef.current.lang = "pt-BR";
                handsFreeRecognitionRef.current.continuous = true;
                handsFreeRecognitionRef.current.interimResults = false;

                handsFreeRecognitionRef.current.onresult = (event: any) => {
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            const transcript = event.results[i][0].transcript.toLowerCase();
                            console.log("Wake Word log:", transcript);
                            
                            if (transcript.includes("jarvis")) {
                                toast({ title: "Comando de Voz Detectado", description: "Jarvis está pensando...", variant: "default" });
                                setTimeout(() => {
                                    if (analyzeRef.current) {
                                        analyzeRef.current(transcript);
                                    }
                                }, 500);
                            }
                        }
                    }
                };

                handsFreeRecognitionRef.current.onend = () => {
                    if (isHandsFreeRef.current) {
                        try {
                            handsFreeRecognitionRef.current.start();
                        } catch (e) {
                            console.error("Failed to restart hands free", e);
                        }
                    }
                };
            }

            try {
                handsFreeRecognitionRef.current.start();
                toast({ title: "Modo Mãos Livres Ativado", description: "Diga 'Oi Jarvis' para acionar o microfone automaticamente." });
            } catch (e) {
                console.error(e);
            }
        } else {
            if (handsFreeRecognitionRef.current) {
                handsFreeRecognitionRef.current.stop();
            }
        }

        return () => {
            if (handsFreeRecognitionRef.current) {
                handsFreeRecognitionRef.current.stop();
            }
        };
    }, [isHandsFree, toast]);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

    if (!hasJarvis) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-8">
                <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-slate-400" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h2 className="text-2xl font-black text-slate-900">J.A.R.V.I.S indisponível</h2>
                    <p className="text-slate-600">
                        O assistente inteligente não está incluído no seu plano atual. Faça o upgrade para o <strong>Plano Pro</strong> para acessar as análises de sentimento e a IA comercial.
                    </p>
                </div>
                <Button onClick={() => window.location.href = '/admin/assinatura'} className="h-12 px-8 rounded-full font-bold">
                    Fazer Upgrade
                </Button>
            </div>
        );
    }

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
                                size="icon"
                                variant="ghost"
                                onClick={() => initCamera(cameraFacing === "user" ? "environment" : "user")}
                                title="Virar Câmera (Frontal / Traseira)"
                                className="h-6 w-6 text-cyan-400 hover:bg-cyan-950/60 rounded-full"
                            >
                                <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button
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

            {/* Top Text */}
            <div className="z-10 w-full text-center pt-8 sm:pt-12 pb-4">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-[0.2em] md:tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 drop-shadow-[0_0_20px_rgba(56,189,248,0.4)] uppercase">
                    J.A.R.V.I.S STRATEGIST
                </h1>
                <p className="text-blue-400/60 text-[10px] sm:text-xs md:text-sm tracking-[0.4em] mt-3 uppercase font-semibold">
                    Sistema Central de Inteligência
                </p>
            </div>

            {/* Chat Area - Floating */}
            <div className="z-10 flex-1 min-h-0 w-full max-w-5xl mx-auto flex flex-col justify-end p-4 md:p-8 relative">
                {/* Messages Container (glassmorphism) */}
                <div id="jarvis-main-container" className="hidden">
                    <div className="space-y-6 pb-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start animate-in slide-in-from-bottom-4 duration-500"}`}>
                                <div className={`max-w-[85%] sm:max-w-[75%] flex gap-3 sm:gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0 shadow-lg border border-white/10 ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-900/80 text-cyan-400 backdrop-blur-md"}`}>
                                        {msg.role === "user" ? <User className="h-4 w-4 sm:h-5 sm:w-5" /> : <Bot className="h-4 w-4 sm:h-5 sm:w-5" />}
                                    </div>
                                    <div className={`p-4 sm:p-5 rounded-3xl shadow-xl text-sm sm:text-base leading-relaxed backdrop-blur-md border border-white/5 ${msg.role === "user" ? "bg-indigo-600/90 text-white rounded-tr-sm" : "bg-slate-900/70 text-slate-200 rounded-tl-sm"}`}>
                                        <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                                        <p className={`text-[10px] sm:text-xs mt-3 opacity-50 ${msg.role === "user" ? "text-right text-indigo-200" : "text-cyan-200"}`}>
                                            {format(msg.timestamp, "HH:mm")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isAnalyzing && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-slate-900/70 backdrop-blur-md border border-white/5 p-5 rounded-3xl rounded-tl-sm flex gap-3 items-center shadow-xl">
                                    <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 bg-cyan-400 rounded-full animate-bounce" />
                                    <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Input Area */}
                <div className="w-full bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 sm:p-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col gap-3 sm:gap-4">
                    <div className="flex gap-2 sm:gap-3 items-center">
                        <Button
                            variant={isHandsFree ? "default" : "outline"}
                            size="icon"
                            title="Modo Mãos Livres (Diga: Oi Jarvis)"
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
                            placeholder="Comande o Jarvis..."
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
                    
                    {/* Sugestões Chips */}
                    <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-2 px-1 pb-1">
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
