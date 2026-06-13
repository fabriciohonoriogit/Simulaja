import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    Car as CarIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import jarvisAvatar from "@/assets/jarvis-avatar.png";
import { ESTATISTICAS_LANCES, GRUPOS } from "@/components/ConsortiumSimulator";
import { aiService } from "@/services/aiService";
import { Missao, calcularMissoes } from "@/lib/missoesService";
import { JarvisOrb } from "@/components/admin/JarvisOrb";

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
    const { toast } = useToast();
    const { profile } = useProfile();
    const [question, setQuestion] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [analysis, setAnalysis] = useState<JarvisAnalysis | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>([]);
    const [cotasContempladas, setCotasContempladas] = useState<any[]>([]);
    const [historicoContatos, setHistoricoContatos] = useState<any[]>([]);
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
    const [isListening, setIsListening] = useState(false);
    const [isHandsFree, setIsHandsFree] = useState(false);
    const [orbState, setOrbState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
    const isHandsFreeRef = useRef(false);
    const handsFreeRecognitionRef = useRef<any>(null);
    const analyzeRef = useRef<any>(null);
    const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


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
        msg.rate = 1.0;
        msg.pitch = 1.0;
        
        setOrbState("speaking");
        
        msg.onend = () => {
             setOrbState("idle");
        };
        
        // Fallback timeout case onend fails
        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = setTimeout(() => {
            setOrbState("idle");
        }, Math.max(3000, cleanText.length * 80));

        window.speechSynthesis.speak(msg);
    };

    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef<string>("");

    const startRecording = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({ title: "Voz indisponível", description: "Seu navegador não suporta reconhecimento de voz. Use Chrome/Safari no celular.", variant: "destructive" });
            return;
        }

        try {
            const rec = new SpeechRecognition();
            rec.lang = "pt-BR";
            rec.continuous = false;
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
                setQuestion((finalTranscriptRef.current + " " + interim).trim());
            };

            rec.onstart = () => {
                setIsListening(true);
                setOrbState("listening");
            };
            rec.onerror = () => {
                setIsListening(false);
                setOrbState("idle");
            };
            rec.onend = () => {
                setIsListening(false);
                const finalQ = finalTranscriptRef.current.trim();
                if (finalQ) {
                    setQuestion("");
                    handleAnalyze(finalQ);
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
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { console.error("Error stopping recognition", e); }
        }
    };

    const toggleRecording = () => {
        if (isListening) stopRecording();
        else startRecording();
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
            try {
                const [leadsRes, metaRes, inadRes, cotasRes, histRes] = await Promise.all([
                    supabase.from("leads").select("*"),
                    supabase.from("meta").select("*").eq("ano", new Date().getFullYear()).maybeSingle(),
                    (supabase as any).from("inadimplentes").select("*"),
                    (supabase as any).from("cotas_contempladas").select("*"),
                    supabase.from("historico_contatos").select("*").order("data_contato", { ascending: false })
                ]);

                let allLeads: Lead[] = [];
                if (leadsRes.data) {
                    allLeads = leadsRes.data as Lead[];
                    setLeads(allLeads);
                    
                    if (profile?.id && profile?.organizacao_id) {
                        try {
                            const res = await calcularMissoes(profile.id, profile.organizacao_id, profile.tipo_acesso as any);
                            setMissoes(res.missoes);
                        } catch(e) {
                            console.error("Erro ao carregar missões no Jarvis:", e);
                        }
                    }

                    // Saudação silenciosa no chat (opcional), removido o áudio automático
                    // O texto inicial já fica no array `messages` no estado inicial do componente.
                }

                if (inadRes.data) {
                    setInadimplentes(inadRes.data as Inadimplente[]);
                }
                
                if (cotasRes.data) {
                    setCotasContempladas(cotasRes.data);
                }

                if (histRes.data) {
                    setHistoricoContatos(histRes.data);
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
            } catch (err) {
                console.error("Erro ao carregar dados para o Jarvis:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAnalyze = async (query: string = question) => {
        if (!query.trim()) return;
        
        setIsAnalyzing(true);
        setOrbState("thinking");
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: query, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setQuestion("");

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
            return `Segmento ${tipo.toUpperCase()}:\n` + lista.map(g => {
                return `- Grupo: ${g.grupo}, Crédito: R$ ${g.credito}, Parcela: R$ ${g.r50}, Prazo: ${g.prazo}m`;
            }).join("\n");
        }).join("\n\n");

        // Novo Contexto Reduzido: O Jarvis agora usa Tools (Function Calling)
        // para buscar dados profundos, então mandamos apenas um resumo rápido.
        const contextBuilder = `
--- RESUMO RÁPIDO DA TELA ATUAL ---
DATA DE HOJE: ${new Date().toLocaleDateString('pt-BR')} (Faltam ${Math.max(0, diasNoMes - diaHoje)} dias para o fim do mês)

- Realizado no Mês: ${formatCurrency(realizadoMes)} de uma meta de ${formatCurrency(metaMensal)}.
- Projeção de Fechamento Mês: ${formatCurrency(projecao)}
- Pipeline Total em Negociação: ${formatCurrency(pipelineValue)} (${emNegociacao.length} leads)
- Novos leads hoje: ${novosHoje}
- Total Devendo (Inadimplência): ${formatCurrency(dividaTotal)}

--- VALORES DO SIMULADOR DE CONSÓRCIO (MEMÓRIA) ---
${gruposInfo}

*Nota*: Para detalhes profundos de clientes específicos, inadimplentes, ou histórico, use suas Ferramentas (Tools).
`;

        const history = messages.map(m => ({
            role: m.role,
            text: m.content
        }));

        const response = await aiService.askJarvis(contextBuilder, query, history);
        
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

        const context = leads.slice(0, 15).map(l => {
            const hists = historicoContatos.filter(h => h.lead_id === l.id).slice(0, 3);
            return `Lead: ${l.id}, Nome: ${l.dados_cadastro?.nome || "Sem Nome"}, Status: ${l.status}, Interações: ${hists.map(h => h.observacao).join(" | ")}`;
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

    return (
        <div className="h-[calc(100vh-6rem)] w-full relative overflow-hidden rounded-3xl bg-slate-950 flex flex-col items-center shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-700">
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
            <div className="z-10 flex-1 w-full max-w-5xl mx-auto flex flex-col justify-end p-4 md:p-8">
                {/* Messages Container (glassmorphism) */}
                <ScrollArea className="flex-1 w-full mb-6 pr-2 sm:pr-4">
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
                </ScrollArea>
                
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
            </div>
        </div>
    );
}
