import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { gerarPDF } from "@/lib/pdfGenerator";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Target,
  BarChart3,
  Shield,
  Clock,
  Anchor,
  Award,
  CircleDollarSign,
  TrendingDown,
  Calculator,
  Info,
  Send,
  FileText
} from "lucide-react";
import { WhatsAppIcon } from './SocialIcons';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { generateNotebookLMPdf } from "@/utils/generateNotebookLMPdf";
import { useProfile } from "@/hooks/useProfile";
import { useSimulador } from "@/hooks/useSimulador";
import { useSimuladorStore } from "@/stores/simuladorStore";
import { ResultadosSimulacao } from "./ResultadosSimulacao";
import { SimulacaoData } from "@/schemas/simulacao";
import { BannerGenerator } from "@/components/BannerGenerator";
import { NotebookLMPresentation } from "@/components/NotebookLMPresentation";
import { VoicePodcastModal } from "@/components/admin/VoicePodcastModal";
import { generateNotebookLMPdfFromRef } from "@/utils/generateNotebookLMPdf";
import { JarvisOrb } from "@/components/admin/JarvisOrb";
import { Mic } from "lucide-react";

const sliderThumbStyles = `
  input[type=range].custom-slider {
    height: 38px;
    background: transparent !important;
  }
  input[type=range].custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, #FF7A00, #FFB800);
    border: 6px solid #ffffff;
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 5px 25px rgba(255, 122, 0, 0.5), inset 0 0 4px rgba(0,0,0,0.1);
    margin-top: -13px;
    transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s ease;
  }
  input[type=range].custom-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 8px 35px rgba(255, 122, 0, 0.7), inset 0 0 4px rgba(0,0,0,0.1);
  }
  input[type=range].custom-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: scale(0.95);
  }
  input[type=range].custom-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 14px;
    cursor: pointer;
    border-radius: 7px;
    border: none;
  }
  input[type=range].custom-slider::-moz-range-thumb {
    width: 38px;
    height: 38px;
    background: #FF7A00;
    border: 6px solid #ffffff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 5px 25px rgba(255, 122, 0, 0.5);
  }
  input[type=range].custom-slider::-moz-range-track {
    width: 100%;
    height: 14px;
    cursor: pointer;
    background: #e2e8f0;
    border-radius: 7px;
  }
`;

import { GrupoItem, Category, GRUPOS, CATEGORIAS, ESTATISTICAS_LANCES, GRUPO_CARACTERISTICAS, obterEstatisticasGrupo, MEDIA_LANCES_GRUPOS } from "@/constants/simulador";

const MAX_CONSULTAS = 5;

type HistItem = { credito: number; grupo: string; prazo: number; r50: number; nome: string; ts: string };


interface ConsortiumSimulatorProps {
  overrideConfig?: {
    categorias: Category[];
    grupos: Record<string, GrupoItem[]>;
  };
  isInternal?: boolean;
  onSimulateSubmit?: (leadData: {
    nome: string;
    celular: string;
    categoriaId: string;
    categoriaLabel: string;
    credito: number;
    prazo: number;
    r50: number;
    leadScoreValor: string;
  }) => void;
}

const ConsortiumSimulator = ({ overrideConfig, isInternal, onSimulateSubmit }: ConsortiumSimulatorProps) => {
  const { profile } = useProfile();
  const { toast } = useToast();
  
  const { categorias: hookCategorias, grupos: hookGrupos, isLoading } = useSimulador();
  const salvarSimulacao = useSimuladorStore((state) => state.salvarSimulacao);
  const historicoZustand = useSimuladorStore((state) => state.historico) || [];
  const [searchParams] = useSearchParams();

  const dynamicCategorias = overrideConfig?.categorias || hookCategorias;
  const dynamicGrupos = overrideConfig?.grupos || hookGrupos;

  const [categoria, setCategoria] = useState("imovel");

  useEffect(() => {
    const handleCategorySelect = (e: Event) => {
      const customEvent = e as CustomEvent<{ categoryId: string }>;
      if (customEvent.detail?.categoryId) {
        setCategoria(customEvent.detail.categoryId);
      }
    };
    window.addEventListener("select-simulator-category", handleCategorySelect);
    return () => window.removeEventListener("select-simulator-category", handleCategorySelect);
  }, []);
  const [idx, setIdx] = useState(4);
  const [simNome, setSimNome] = useState("");
  const [simWpp, setSimWpp] = useState("");
  const [errNome, setErrNome] = useState(false);
  const [errWpp, setErrWpp] = useState(false);
  const [consultas, setConsultas] = useState(0);
  const [resultado, setResultado] = useState<GrupoItem | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [simulationMode, setSimulationMode] = useState<"credit" | "installment">("credit");
  const [paymentMode, setPaymentMode] = useState<"linear" | "reduzido">("reduzido");
  const [filterPlanoGold, setFilterPlanoGold] = useState(false);
  
  const [lanceDinheiroPct, setLanceDinheiroPct] = useState(0);
  const [lanceEmbutidoPct, setLanceEmbutidoPct] = useState(25);
  const [parcelasContemplar, setParcelasContemplar] = useState(1);
  const [incluirComp, setIncluirComp] = useState(true);
  const [incluirSeguro, setIncluirSeguro] = useState(true);

  // Drag to scroll
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const isInteractive = (e.target as HTMLElement).closest('button, input, a, textarea, select, label, .custom-slider');
    if (isInteractive) return;

    let container: HTMLElement | null = e.currentTarget as HTMLElement;
    while (container) {
      const style = window.getComputedStyle(container);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll' || container === document.documentElement) {
        break;
      }
      container = container.parentElement;
    }
    if (!container) container = document.documentElement;

    scrollContainerRef.current = container;
    setIsDragging(true);
    setStartY(e.pageY);
    setScrollTop(container.scrollTop);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const y = e.pageY;
    const walk = (y - startY) * 1.5;
    scrollContainerRef.current.scrollTop = scrollTop - walk;
  };

  const resultRef = useRef<HTMLDivElement>(null);

  const [utmParams, setUtmParams] = useState({ origem: "", meio: "", campanha: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtmParams({
      origem: params.get("utm_source") || "",
      meio: params.get("utm_medium") || "",
      campanha: params.get("utm_campaign") || "",
    });
  }, []);

  const rawLista = useMemo(() => {
    const list = dynamicGrupos[categoria] || [];
    if (!isInternal) {
      return list.filter(g => !g.isPlanoGold);
    }
    return list;
  }, [dynamicGrupos, categoria, isInternal]);

  const lista = useMemo(() => {
    let filtered = filterPlanoGold && categoria === 'imovel'
      ? rawLista.filter(g => g.isPlanoGold)
      : rawLista.filter(g => !g.isPlanoGold);

    const seen = new Set<number>();
    filtered = filtered.filter(g => {
      if (seen.has(g.credito)) return false;
      seen.add(g.credito);
      return true;
    });
    return filtered;
  }, [rawLista, filterPlanoGold, categoria]);

  const safeIdx = Math.min(idx, lista.length > 0 ? lista.length - 1 : 0);
  const _g = lista[safeIdx] || { grupo: "—", credito: 0, r50: 0, prazo: 0 };

  useEffect(() => {
    if (lista.length > 0) {
      setIdx(filterPlanoGold ? 0 : Math.min(4, lista.length - 1));
    }
  }, [categoria, lista.length, filterPlanoGold]);

  const hasBothPlans = _g.r100 !== undefined && _g.r50 !== _g.r100;
  const effectiveMode: "linear" | "reduzido" = hasBothPlans ? paymentMode : "linear";
  const isLinear = effectiveMode === "linear";

  const valorSeguroMensal = (_g.credito * (_g.seguro ?? 0)) / 100;

  const g = {
    ..._g,
    prazo: isLinear && _g.prazoLinear ? _g.prazoLinear : _g.prazo,
    grupo: isLinear && _g.grupoLinear ? _g.grupoLinear : _g.grupo,
    r50: incluirSeguro ? _g.r50 : _g.r50 - valorSeguroMensal,
    r100: _g.r100 !== undefined ? (incluirSeguro ? _g.r100 : _g.r100 - valorSeguroMensal) : undefined,
    seguro: incluirSeguro ? _g.seguro : 0,
  };

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const fmtFull = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const mascaraWpp = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7) v = v.replace(/(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d*)/, "($1) $2");
    setSimWpp(v);
  };

  const pct = lista.length > 1 ? (safeIdx / (lista.length - 1)) * 100 : 0;

  const handleExportPDF = () => {
    const res = resultado || (isInternal ? g : null);
    if (!res) return;
    
    const doc = new jsPDF();
    const primaryColor = "#0D214F";
    const accentColor = "#f47920";
    
    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("PROPOSTA DE CONSÓRCIO", 105, 25, { align: "center" });
    
    // Client Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Cliente: ${simNome || "Não informado"}`, 20, 55);
    doc.text(`WhatsApp: ${simWpp || "Não informado"}`, 20, 62);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 150, 55);
    
    // Simulation Box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, 75, 180, 100, 3, 3);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhes da Simulação", 25, 87);

    const resIsLinear = isLinear;
    const resTx = resIsLinear ? (res.txLinear ?? res.tx ?? 20) : (res.tx5050 ?? res.tx ?? 20);
    const resFr = resIsLinear ? (res.frLinear ?? res.fr ?? 1) : (res.fr5050 ?? res.fr ?? 1);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Crédito:", 25, 100);
    doc.setFont("helvetica", "bold");
    doc.text(fmtFull(res.credito), 80, 100);

    doc.setFont("helvetica", "normal");
    doc.text("Prazo:", 25, 110);
    doc.setFont("helvetica", "bold");
    doc.text(`${resIsLinear ? (res.prazoLinear ?? res.prazo) : res.prazo} meses`, 80, 110);

    doc.setFont("helvetica", "normal");
    doc.text(isLinear ? "Parcela Linear:" : "Parcela Reduzida (50%):", 25, 120);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#16a34a");
    doc.text(fmtFull(isLinear ? (res.r100 ?? res.r50) : res.r50), 80, 120);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text("Taxa Administrativa:", 25, 130);
    doc.text(`${resTx}%`, 80, 130);
    doc.text("Fundo de Reserva:", 25, 140);
    doc.text(`${resFr}%`, 80, 140);
    
    if (lanceDinheiroPct > 0 || lanceEmbutidoPct > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Estratégia de Lance:", 25, 155);
        doc.setFont("helvetica", "normal");
        const lanceTotal = res.credito * (lanceDinheiroPct + lanceEmbutidoPct) / 100;
        doc.text(`Total: ${fmtFull(lanceTotal)} (${lanceDinheiroPct + lanceEmbutidoPct}%)`, 80, 155);
    }
    
    // Footer
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 277, 210, 20, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text("oespecialistaconsorcio.com.br", 105, 288, { align: "center" });
    
    doc.save(`simulacao_consorcio_${simNome.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    
    toast({
        title: "PDF Gerado!",
        description: "A proposta foi baixada com sucesso.",
    });
  };

  const notebookRef = useRef<HTMLDivElement>(null);
  const [isPodcastModalOpen, setIsPodcastModalOpen] = useState(false);

  const handleGerarApresentacaoLM = async () => {
    if (!notebookRef.current) return;

    toast({
      title: "Gerando Apresentação...",
      description: "Processando os slides executivos no estilo Notebook LM...",
    });

    await generateNotebookLMPdfFromRef(notebookRef.current, simNome);

    toast({
      title: "Apresentação Notebook LM Gerada!",
      description: "Estudo estratégico executivo em PDF baixado com sucesso.",
    });
  };

  const confirmarSimulacao = async () => {
    const nomeOk = simNome.trim().length > 0;
    const wppOk = simWpp.replace(/\D/g, "").length >= 10;
    setErrNome(!nomeOk);
    setErrWpp(!wppOk);
    if (!nomeOk || !wppOk) return;
    if (consultas >= MAX_CONSULTAS) { setBloqueado(true); return; }

    const novaConsulta = consultas + 1;
    setConsultas(novaConsulta);
    setResultado(g);

    const selectedInstallment = effectiveMode === "linear" ? (g.r100 ?? g.r50) : g.r50;
    // Salvar no estado global do Zustand
    const dadosParaSalvar: SimulacaoData = {
      valor_credito: g.credito,
      tipo: categoria as any,
      com_seguro: incluirSeguro,
      meses: effectiveMode === "linear" ? (g.prazoLinear ?? g.prazo) : g.prazo,
      grupo: effectiveMode === "linear" ? (g.grupoLinear ?? g.grupo) : g.grupo,
      taxa_adm: g.tx ?? 20,
      fundo_reserva: g.fr ?? 1,
      parcela: selectedInstallment,
    };
    salvarSimulacao(dadosParaSalvar);

    // Lead Score Logic
    let leadScoreValor = "baixo";
    if (g.credito >= 500000) leadScoreValor = "premium";
    else if (g.credito >= 200000) leadScoreValor = "alto";
    else if (g.credito >= 80000) leadScoreValor = "medio";

    if (onSimulateSubmit && !isInternal) {
      onSimulateSubmit({
        nome: simNome.trim(),
        celular: simWpp,
        categoriaId: categoria,
        categoriaLabel: dynamicCategorias.find(c => c.id === categoria)?.label || categoria,
        credito: g.credito,
        prazo: effectiveMode === "linear" ? (g.prazoLinear ?? g.prazo) : g.prazo,
        r50: selectedInstallment,
        leadScoreValor
      });
    }

    if (novaConsulta >= MAX_CONSULTAS) setTimeout(() => setBloqueado(true), 700);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
  };

  const wppLockMsg = historicoZustand.map((h, i) => `${i + 1}. ${fmtFull(h.valor_credito)} — ${fmtFull(h.parcela)} / ${h.meses}m`).join("\n");
  const lockWppUrl = `https://wa.me/5541997925357?text=${encodeURIComponent("Olá Fabricio! Fiz simulações:\n\n" + wppLockMsg + "\n\nQuero mais informações!")}`;

  // Lance Cálculos
  const lDinheiroRS = g.credito * (lanceDinheiroPct / 100);
  const lEmbutidoRS = g.credito * (lanceEmbutidoPct / 100);
  const lanceTotalPct = lanceDinheiroPct + lanceEmbutidoPct;
  const lanceTotalRS = lDinheiroRS + lEmbutidoRS;
  const creditoDisponivel = g.credito - lEmbutidoRS;
  const estats = obterEstatisticasGrupo(g.grupo);

  const isSelectedLinear = effectiveMode === "linear";
  const selectedInstallment = isSelectedLinear ? (g.r100 ?? g.r50) : g.r50;

  const tx = isSelectedLinear ? (g.txLinear ?? g.tx ?? 20) : (g.tx5050 ?? g.tx ?? 20);
  const fr = isSelectedLinear ? (g.frLinear ?? g.fr ?? 1) : (g.fr5050 ?? g.fr ?? 1);
  const seguro = g.seguro ?? 0;
  const saldoDevedorBruto = g.credito + (g.credito * (tx / 100)) + (g.credito * (fr / 100));
  
  const saldoDevedorPosLance = saldoDevedorBruto - (parcelasContemplar * selectedInstallment) - lanceTotalRS;
  const prazoRestante = (isSelectedLinear ? (g.prazoLinear ?? g.prazo) : g.prazo) - parcelasContemplar;
  const parcelaPos = prazoRestante > 0 && saldoDevedorPosLance > 0 ? saldoDevedorPosLance / prazoRestante : 0;

  const handleGerarPDF = () => {
    gerarPDF({
      nomeCliente: simNome || 'Cliente',
      tipoAquisicao: dynamicCategorias.find(c => c.id === categoria)?.label || categoria,
      numGrupo: isSelectedLinear ? (g.grupoLinear ?? g.grupo) : g.grupo,
      credito: g.credito,
      taxaAdm: tx,
      fundoReserva: fr,
      seguro: seguro,
      prazo: isSelectedLinear ? (g.prazoLinear ?? g.prazo) : g.prazo,
      tipoParcela: g.tipoVenda ? g.tipoVenda : (g.isPlanoGold ? (isSelectedLinear ? 'Golden Linear' : 'PLANO GOLD') : (isSelectedLinear ? 'Linear' : 'Reduzida 50%')),
      parcelasContemplar: parcelasContemplar,
      lanceDinheiroPct: lanceDinheiroPct,
      lanceEmbutidoPct: lanceEmbutidoPct,
      lanceTotalRS: lanceTotalRS,
      lanceTotalPct: lanceTotalPct,
      valorParcela: g.r50,
      creditoDisponivel: creditoDisponivel,
      saldoDevedor: saldoDevedorPosLance > 0 ? saldoDevedorPosLance : saldoDevedorBruto,
      prazoRestante: prazoRestante,
      parcelaPosContemp: parcelaPos > 0 ? parcelaPos : g.r50,
      consultorNome: profile?.nome || searchParams.get("nome") || 'Fabricio Honório'
    });
  };

  const handleEnviarWpp = () => {
    const dataStr = new Date().toLocaleDateString('pt-BR');
    const segmentLabel = dynamicCategorias.find(c => c.id === categoria)?.label || categoria;
    
    let emojiBem = "🏠";
    if (categoria === "veiculo") emojiBem = "🚗";
    else if (categoria === "pesados") emojiBem = "🚛";
    else if (categoria === "servicos") emojiBem = "🎓";
    else if (categoria === "eletro") emojiBem = "💻";

    const isIm = categoria === 'imovel';
    const tipoParcelaStr = g.tipoVenda ? (isLinear ? g.tipoVenda : `👑 ${g.tipoVenda}`) : (g.isPlanoGold ? (isLinear ? '👑 Golden Linear' : '👑 PLANO GOLD') : (isLinear ? 'Linear' : 'Reduzida 50%'));
    const prazo = isSelectedLinear ? (g.prazoLinear ?? g.prazo) : g.prazo;
    const grupo = isSelectedLinear ? (g.grupoLinear ?? g.grupo) : g.grupo;
    const consultor = profile?.nome || searchParams.get("nome") || 'Fabricio Honório';

    const msg = [
      `📅 ${dataStr}`,
      ``,
      `👤 Cliente: ${simNome || 'Não informado'}`,
      `📋 SIMULAÇÃO DE CONSÓRCIO`,
      `─────────────────────────`,
      `${emojiBem} Bem: ${segmentLabel} | Grupo ${grupo}`,
      `💰 Carta de Crédito: ${fmt(g.credito)}`,
      `⏱️ Prazo: ${prazo} meses`,
      `👑 Tipo de Parcela: ${tipoParcelaStr}`,
      ``,
      `🚀 LANCE`,
      `─────────────────────────`,
      `💵 Dinheiro: ${lanceDinheiroPct}%`,
      `🔄 Embutido: ${lanceEmbutidoPct}%`,
      `🎯 Total do Lance: ${lanceTotalPct}% → ${fmt(lanceTotalRS)}`,
      ``,
      `📊 VALOR PARCELA`,
      `─────────────────────────`,
      `💵 Valor da Parcela Atual: ${fmt(selectedInstallment)}`,
      `💰 Crédito Disponível: ${fmt(creditoDisponivel)}`,
      `📉 Saldo Devedor: ${fmt(saldoDevedorPosLance > 0 ? saldoDevedorPosLance : saldoDevedorBruto)}`,
      `⏱️ Prazo Restante: ${prazoRestante} meses`,
      `📉 Parcela Pós-Contemplação: ${fmt(parcelaPos > 0 ? parcelaPos : selectedInstallment)}`,
      ``,
      `─────────────────────────`,
      `👨‍💼 Simulação realizada por ${consultor}`
    ].join('\n');

    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  };

  const simulatorRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  const handleGerarImagem = async () => {
    const bannerElement = document.getElementById("banner-generator-container") || bannerRef.current;
    
    if (!bannerElement) {
      toast({
        title: "Erro interno",
        description: `Ref null. DOM: ${!!document.getElementById('banner-generator-container')}. Res: ${!!resultado}. Body: ${!!document.body}.`,
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Gerando Imagem",
      description: "Aguarde, processando alta resolução...",
    });

    try {
      const { default: html2canvas } = await import("html2canvas");
      
      // Wait a bit to ensure the offscreen DOM is fully painted
      await new Promise(res => setTimeout(res, 300));
      
      const canvas = await html2canvas(bannerElement, { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: null
      });
      
      const link = document.createElement('a');
      link.download = `Simulacao_Banner_${simNome || 'Consorcio'}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Sucesso",
        description: "Imagem gerada com sucesso!",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro",
        description: err?.message || "Não foi possível gerar a imagem.",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      className={`min-h-screen flex flex-col relative w-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} bg-[#040B16]`}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <style>{sliderThumbStyles}</style>

      {/* Background Deep Gradient matching the image */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#021024] via-[#051f3e] to-[#042817] z-0 pointer-events-none" />
      
      {/* Orbs/Particles in the background */}
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none scale-[1.5] sm:scale-125">
          <JarvisOrb state="idle" />
      </div>

      <section id="simulator" className="relative z-10 flex-1 py-12">
        <div className={`container mx-auto px-4 flex flex-col items-center ${isInternal ? 'max-w-5xl' : 'max-w-2xl sm:max-w-3xl lg:max-w-4xl'}`}>
          
          <div className="relative flex flex-col items-center mb-6 animate-breathe w-full">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
              {/* Core Glow */}
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150" />
              
              {/* CSS Orbit Rings (Atoms) */}
              <div className="absolute w-[220%] h-[70%] border border-blue-400/40 rounded-[100%] animate-[spin_10s_linear_infinite]" />
              <div className="absolute w-[220%] h-[70%] border border-green-400/30 rounded-[100%] animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute w-[220%] h-[70%] border border-blue-400/20 rounded-[100%] animate-[spin_20s_linear_infinite]" />

              {/* Logo Image */}
              <img src="/icon-512.webp" alt="Logo Contemplar" className="h-24 sm:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] relative z-10" />
            </div>

            <div className="flex flex-col items-center leading-tight mt-6 relative z-10">
              <span className="text-[28px] sm:text-[32px] font-black tracking-widest text-white uppercase drop-shadow-lg">CONTEMPLAR</span>
              <span className="text-[18px] sm:text-[20px] font-bold tracking-[0.4em] text-[#84CC16] -mt-1 ml-2 drop-shadow-md">SIMULADOR</span>
            </div>
          </div>

          <div ref={simulatorRef} className="w-full bg-white rounded-[24px] shadow-2xl p-5 sm:p-8 relative z-10 border border-white/10">
            <div className={isInternal ? "grid grid-cols-1 md:grid-cols-2 gap-8" : ""}>
              
              {/* ESQUERDA: Controles da Simulação */}
              <div className="flex flex-col w-full justify-center">
            <div className="flex justify-center mb-5">
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setSimulationMode('credit')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all ${simulationMode === 'credit' ? 'bg-[#0f2044] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Por valor a conquistar
                </button>
                <button 
                  onClick={() => setSimulationMode('installment')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all ${simulationMode === 'installment' ? 'bg-[#0f2044] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Mensalidade
                </button>
              </div>
            </div>

            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center">
              {simulationMode === "credit" ? "Quanto você quer conquistar?" : "Quanto você pode investir por mês?"}
            </p>
            <div className="text-center mb-5">
              <span className="text-sm font-bold mr-1 text-slate-400">R$</span>
              <span className="text-3xl sm:text-4xl font-black text-[#0f2044]">
                {simulationMode === "credit" ? g.credito.toLocaleString("pt-BR") : selectedInstallment.toLocaleString("pt-BR")}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={lista.length - 1}
              step={1}
              value={safeIdx}
              onChange={(e) => setIdx(Number(e.target.value))}
              className="custom-slider w-full h-3 rounded-full cursor-pointer appearance-none mb-2"
              style={{
                background: `linear-gradient(to right, #FF7A00 0%, #FF7A00 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
              }}
            />
            <div className="flex justify-between text-[9px] font-black text-muted-foreground/50 mb-8 uppercase tracking-widest">
              <span className="bg-slate-100 px-2 py-0.5 rounded">
                {lista.length > 0 && (simulationMode === "credit" 
                  ? `MIN: R$ ${lista[0].credito.toLocaleString("pt-BR")}` 
                  : `MIN: R$ ${((effectiveMode === "linear" ? (lista[0].r100 ?? lista[0].r50) : lista[0].r50) - (incluirSeguro ? 0 : (lista[0].credito * (lista[0].seguro ?? 0)) / 100)).toLocaleString("pt-BR", {maximumFractionDigits:0})}`)}
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded">
                {lista.length > 0 && (simulationMode === "credit" 
                  ? `MÁX: R$ ${lista[lista.length - 1].credito.toLocaleString("pt-BR")}` 
                  : `MÁX: R$ ${((effectiveMode === "linear" ? (lista[lista.length - 1].r100 ?? lista[lista.length - 1].r50) : lista[lista.length - 1].r50) - (incluirSeguro ? 0 : (lista[lista.length - 1].credito * (lista[lista.length - 1].seguro ?? 0)) / 100)).toLocaleString("pt-BR", {maximumFractionDigits:0})}`)}
              </span>
            </div>

            {(() => {
              if (!hasBothPlans) return null;
              return (
                <div className="flex justify-center mb-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => {
                        setFilterPlanoGold(false);
                        setPaymentMode('reduzido');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${!filterPlanoGold && effectiveMode === 'reduzido' ? 'bg-[#0f2044] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Reduzido (50%)
                    </button>
                    <button 
                      onClick={() => {
                        setFilterPlanoGold(false);
                        setPaymentMode('linear');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${!filterPlanoGold && effectiveMode === 'linear' ? 'bg-[#0f2044] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Linear
                    </button>
                    {categoria === 'imovel' && isInternal && (
                      <button 
                        onClick={() => {
                          setFilterPlanoGold(true);
                          setPaymentMode('reduzido');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${filterPlanoGold ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-500 hover:bg-amber-50'}`}
                      >
                        ✨ Plano Gold
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-wrap gap-1.5 justify-center mb-5">
              {dynamicCategorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoria(cat.id);
                    setFilterPlanoGold(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${categoria === cat.id
                    ? 'bg-[#0f2044] text-white border-[#0f2044]' 
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-[#0f2044] hover:text-[#0f2044]'
                    }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px]">{cat.icon}</span>
                    {cat.label}
                  </div>
                </button>
              ))}
            </div>

            {isInternal && (
              <div className="mt-2 w-full max-w-[400px] mx-auto">
                {lista[safeIdx]?.seguro ? (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <label
                      htmlFor="chk-seguro"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        cursor: 'pointer', userSelect: 'none',
                        fontSize: '11px', fontWeight: 700,
                        color: incluirSeguro ? '#15803d' : '#64748b',
                        background: incluirSeguro ? '#f0fdf4' : '#f8fafc',
                        border: `1.5px solid ${incluirSeguro ? '#86efac' : '#cbd5e1'}`,
                        borderRadius: '999px', padding: '4px 10px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        id="chk-seguro"
                        type="checkbox"
                        checked={incluirSeguro}
                        onChange={() => setIncluirSeguro(!incluirSeguro)}
                        style={{
                          width: '13px', height: '13px',
                          accentColor: '#16a34a', cursor: 'pointer', flexShrink: 0
                        }}
                      />
                      <Shield style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                      {incluirSeguro ? 'Seguro incluso' : 'Sem seguro'}
                    </label>
                  </div>
                ) : null}
                <div className="rounded-2xl p-5 text-center mb-5 relative overflow-hidden shadow-lg border-2 border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-green-50/60 to-emerald-100/50">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600" />
                  <p className="text-[0.65rem] font-black uppercase tracking-widest mb-1 text-emerald-800">
                    {g.isPlanoGold ? (isLinear ? "Plano Golden Linear" : (g.tipoVenda ?? "PLANO GOLD")) : (isLinear ? "Parcela Linear" : "Parcela reduzida 50%")} <span className="text-emerald-600 font-normal">· {g.isPlanoGold ? "golden" : (isLinear ? "integral" : "até a contemplação")}</span>
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono drop-shadow-sm">
                    {fmtFull(selectedInstallment)}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3">
                    {[
                      { label: "Crédito", value: fmt(g.credito) },
                      { label: "Prazo", value: `${isLinear ? (g.prazoLinear ?? g.prazo) : g.prazo} meses` },
                      { label: "Grupo", value: isLinear ? (g.grupoLinear ?? g.grupo) : g.grupo },
                      { label: "Plano", value: g.tipoVenda ? g.tipoVenda : (g.isPlanoGold ? (isLinear ? "Golden Linear" : "PLANO GOLD") : (isLinear ? "Linear" : "50/50")) },
                      ...(isInternal && tx !== undefined ? [{ label: "Tx Adm", value: `${tx}%` }] : []),
                      ...(isInternal && fr !== undefined ? [{ label: "F. Reserva", value: `${fr}%` }] : [])
                    ].map((m) => (
                      <div key={m.label} className="bg-white/90 backdrop-blur-sm rounded-xl py-2 px-1.5 text-center border border-emerald-200/60 shadow-sm hover:shadow-md transition-all">
                        <p className="text-[0.55rem] font-bold uppercase tracking-wider mb-0.5 text-slate-500 truncate">{m.label}</p>
                        <p className="text-xs font-black text-slate-800 font-mono truncate">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Características do Grupo */}
                {(() => {
                  const c = GRUPO_CARACTERISTICAS[g.grupo];
                  if (!c) return null;
                  const contemResolucao285 = c.caracteristicas.includes("RESOLUÇAO 285") || c.caracteristicas.includes("RESOLUÇÃO 285");
                  return (
                    <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-white text-left space-y-3 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-300" />
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <span>⚙️</span> Características do Grupo {c.grupo} {g.isPlanoGold && "(PLANO GOLDEN)"}
                        </span>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Reajuste: {c.reajuste}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">1ª Assembleia</p>
                          <p className="font-semibold text-foreground">{c.primeiraAssembleia}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Próxima Assembleia</p>
                          <p className="font-semibold text-foreground">{c.proximaAssembleia}</p>
                        </div>
                        {MEDIA_LANCES_GRUPOS[c.grupo] !== undefined && (
                          <div className="col-span-2 sm:col-span-1">
                            <p className="text-[9px] font-bold text-green-600 uppercase">Média Lance Contemplado</p>
                            <p className="font-bold text-green-800 font-mono">{MEDIA_LANCES_GRUPOS[c.grupo].toFixed(2)}%</p>
                          </div>
                        )}
                      </div>

                      <div className="text-xs space-y-2 pt-1 border-t border-slate-50">
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Ordem de Contemplação</p>
                          <p className="text-foreground leading-relaxed italic">{c.ordemContemplacao}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Regras de Lance & Diluição</p>
                          <p className="text-foreground leading-relaxed">{c.opcaoDiluir}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Regra de Reajuste Anual</p>
                          <p className="text-foreground leading-relaxed">{c.regraReajuste}</p>
                        </div>
                      </div>

                      {contemResolucao285 && (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-bold leading-relaxed">
                          ⚠️ DEVIDO À RESOLUÇÃO 285, O GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

              </div> {/* FIM COLUNA ESQUERDA */}

              {/* DIREITA: Resultados & Ações (No CRM) */}
              <div className={`flex flex-col w-full ${isInternal ? 'bg-slate-50/50 rounded-2xl p-4 sm:p-5 border border-slate-100' : ''}`}>
                {isInternal && (
                  <>

                <div className="rounded-[12px] p-4 mb-4 border bg-white shadow-sm border-[#d8e0ee]">
                  <p className="text-[0.6rem] font-bold tracking-[0.15em] text-[#1a4080] uppercase mb-3 flex items-center gap-1.5">
                    <span className="text-sm">🏹</span> Simulação de Lance
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                    <div>
                      <label className="text-[0.55rem] font-bold tracking-wider uppercase text-muted-foreground mb-1 block">Pagos até Contemplar</label>
                      <input 
                        type="number" min="0" value={parcelasContemplar} 
                        onChange={(e) => setParcelasContemplar(Number(e.target.value))}
                        className="w-full bg-[#f8fafd] border border-[#d8e0ee] rounded-md px-2 py-1.5 text-xs font-medium font-mono text-foreground outline-none focus:border-[#1a4080]"
                      />
                    </div>
                    <div>
                      <label className="text-[0.55rem] font-bold tracking-wider uppercase text-muted-foreground mb-1 block">Dinheiro (%)</label>
                      <div className="relative">
                        <input 
                          type="number" min="0" max="100" value={lanceDinheiroPct} 
                          onChange={(e) => setLanceDinheiroPct(Number(e.target.value))}
                          className="w-full bg-[#f8fafd] border border-[#d8e0ee] rounded-md pl-2 pr-6 py-1.5 text-xs font-medium font-mono text-foreground outline-none focus:border-[#1a4080]"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[0.55rem] font-bold tracking-wider uppercase text-muted-foreground mb-1 block">Embutido (%)</label>
                      <div className="relative">
                        <input 
                          type="number" min="0" max="100" value={lanceEmbutidoPct} 
                          onChange={(e) => setLanceEmbutidoPct(Number(e.target.value))}
                          className="w-full bg-[#f8fafd] border border-[#d8e0ee] rounded-md pl-2 pr-6 py-1.5 text-xs font-medium font-mono text-foreground outline-none focus:border-[#1a4080]"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafd] border border-[#d8e0ee] rounded-[10px] p-3">
                    <div className="flex justify-between items-center py-1.5 border-b border-[#d8e0ee]/60">
                      <span className="text-xs font-medium text-muted-foreground">Dinheiro (R$)</span>
                      <span className="text-sm font-mono text-foreground">{fmt(lDinheiroRS)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-[#d8e0ee]/60">
                      <span className="text-xs font-medium text-muted-foreground">Embutido (R$)</span>
                      <span className="text-sm font-mono text-foreground">{fmt(lEmbutidoRS)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5 mt-1">
                      <span className="text-xs font-bold text-[#122040]">TOTAL DO LANCE</span>
                      <div className="text-right">
                        <div className="text-[0.65rem] text-muted-foreground font-bold mb-0.5">{lanceTotalPct.toFixed(1)}%</div>
                        <div className="text-[0.95rem] font-bold text-[#1a4080] font-mono">{fmt(lanceTotalRS)}</div>
                      </div>
                    </div>

                    {/* Estatísticas de Contemplação e Probabilidade */}
                    <div className="mt-3 pt-3 border-t border-[#d8e0ee]/60 space-y-2">
                      {estats ? (
                        <>
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                            <span>Mínimo: <span className="text-[#122040] font-bold">{estats.lanceMenor.toFixed(1)}%</span></span>
                            <span>Média: <span className="text-[#122040] font-bold">{estats.lanceMedia.toFixed(1)}%</span></span>
                            <span>Máximo: <span className="text-[#122040] font-bold">{estats.lanceMaior.toFixed(1)}%</span></span>
                          </div>

                          {lanceTotalPct > 0 && (() => {
                            let probLabel = "Baixa";
                            let probColor = "text-red-600 bg-red-50 border-red-200";
                            let progressColor = "bg-red-500";
                            let percentOfMax = Math.min(100, (lanceTotalPct / estats.lanceMaior) * 100);

                            if (lanceTotalPct >= estats.lanceMaior) {
                              probLabel = "Muito Alta";
                              probColor = "text-green-700 bg-green-50 border-green-200";
                              progressColor = "bg-green-600";
                            } else if (lanceTotalPct >= estats.lanceMedia) {
                              probLabel = "Alta";
                              probColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
                              progressColor = "bg-emerald-500";
                            } else if (lanceTotalPct >= estats.lanceMenor) {
                              probLabel = "Média";
                              probColor = "text-amber-600 bg-amber-50 border-amber-200";
                              progressColor = "bg-amber-500";
                            }

                            return (
                              <div className={`p-2.5 rounded-lg border text-xs font-medium space-y-1.5 ${probColor}`}>
                                <div className="flex justify-between items-center">
                                  <span className="flex items-center gap-1">
                                    {probLabel === "Muito Alta" || probLabel === "Alta" ? "🎯" : probLabel === "Média" ? "⚡" : "⚠️"} 
                                    Probabilidade: <strong>{probLabel}</strong>
                                  </span>
                                  <span className="font-bold">{lanceTotalPct.toFixed(1)}%</span>
                                </div>
                                
                                {/* Mini barra de progresso visual */}
                                <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-300 ${progressColor}`} style={{ width: `${percentOfMax}%` }} />
                                </div>
                                
                                <p className="text-[10px] opacity-90 leading-tight">
                                  {lanceTotalPct >= estats.lanceMenor 
                                    ? `O lance ofertado (${lanceTotalPct.toFixed(1)}%) supera o lance mínimo histórico de ${estats.lanceMenor.toFixed(1)}% deste grupo.`
                                    : `O lance ofertado (${lanceTotalPct.toFixed(1)}%) está abaixo do mínimo histórico de ${estats.lanceMenor.toFixed(1)}% necessário para contemplação.`
                                  }
                                </p>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="text-[10px] text-muted-foreground bg-slate-50 p-2 rounded border border-[#d8e0ee]/50 text-center italic">
                          ℹ️ Sem dados de contemplação cadastrados no sistema para o Grupo {g.grupo}.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[12px] p-4 mb-4 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0c1a30 0%, #122040 100%)", border: "1px solid rgba(26,64,128,0.4)", boxShadow: "0 6px 30px rgba(6,15,30,0.2)" }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #1a4080, #e8aa20, #f5c842, #e8aa20, #1a4080)" }} />
                  <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase text-white/90 mb-3 flex items-center gap-1.5">
                    <span className="text-sm opacity-90">✅</span> Resultados da Simulação
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-md p-2.5 text-center transition-all hover:bg-white/10" style={{ background: "rgba(200,144,10,0.12)", borderColor: "rgba(200,144,10,0.3)" }}>
                      <p className="text-[0.5rem] font-bold tracking-wider uppercase text-white/60 mb-0.5">Parcela Pós-Contemplação</p>
                      <p className="text-base sm:text-lg font-bold font-mono text-[#f5c842]">{fmt(parcelaPos > 0 ? parcelaPos : g.r50)}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-md p-2 text-center transition-all hover:bg-white/10">
                      <p className="text-[0.5rem] font-bold tracking-wider uppercase text-white/60 mb-0.5">Crédito Disponível</p>
                      <p className="text-xs font-medium font-mono text-white/90">{fmt(creditoDisponivel)}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-md p-2 text-center transition-all hover:bg-white/10">
                      <p className="text-[0.5rem] font-bold tracking-wider uppercase text-white/60 mb-0.5">Saldo Devedor</p>
                      <p className="text-xs font-medium font-mono text-white/90">{fmt(saldoDevedorPosLance > 0 ? saldoDevedorPosLance : saldoDevedorBruto)}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-md p-2 text-center transition-all hover:bg-white/10">
                      <p className="text-[0.5rem] font-bold tracking-wider uppercase text-white/60 mb-0.5">Prazo Restante</p>
                      <p className="text-xs font-medium font-mono text-white/90">{prazoRestante} x</p>
                    </div>
                  </div>
                </div>

                {/* BLOCO DE AÇÕES EXECUTIVAS COM 3D DEPTH & ZERO TEXT OVERFLOW */}
                <div className="space-y-2.5 mb-6">
                  {/* Linha 1: Ações Principais */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      onClick={handleExportPDF}
                      className="w-full py-3 px-2 rounded-xl text-[0.7rem] font-extrabold uppercase tracking-wider text-white flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.97] border border-slate-700/50 shadow-[0_8px_20px_-4px_rgba(15,23,42,0.5)]"
                      style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-300">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      <span className="truncate">PDF Proposta</span>
                    </button>

                    <button
                      onClick={handleGerarImagem}
                      className="w-full py-3 px-2 rounded-xl text-[0.7rem] font-extrabold uppercase tracking-wider text-white flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.97] border border-orange-400/30 shadow-[0_8px_20px_-4px_rgba(255,107,0,0.4)]"
                      style={{ background: "linear-gradient(135deg, #FF6B00 0%, #E65100 100%)" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-orange-100">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="truncate">Imagem HD</span>
                    </button>

                    <button
                      onClick={handleEnviarWpp}
                      className="w-full py-3 px-2 rounded-xl text-[0.7rem] font-extrabold uppercase tracking-wider text-white flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.97] border border-emerald-400/30 shadow-[0_8px_20px_-4px_rgba(5,150,105,0.4)]"
                      style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}
                    >
                      <WhatsAppIcon className="w-4 h-4 shrink-0 text-emerald-100" />
                      <span className="truncate">WhatsApp</span>
                    </button>
                  </div>

                  {/* Linha 2 (Apenas Simulador Interno): Ferramentas IA Executivas */}
                  {isInternal && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={handleGerarApresentacaoLM}
                        className="w-full py-3 px-3 rounded-xl text-[0.7rem] font-extrabold uppercase tracking-wider text-amber-300 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.97] border border-amber-500/50 shadow-[0_8px_20px_-4px_rgba(245,158,11,0.3)] group"
                        style={{ background: "linear-gradient(135deg, #0B132B 0%, #1C2541 100%)" }}
                        title="Gerar Estudo Estratégico em PDF no estilo Notebook LM"
                      >
                        <svg className="w-4 h-4 shrink-0 text-amber-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          <path d="M12 6h4" />
                          <path d="M12 10h4" />
                        </svg>
                        <span className="whitespace-nowrap">Apresentação LM</span>
                      </button>

                      <button
                        onClick={() => setIsPodcastModalOpen(true)}
                        className="w-full py-3 px-3 rounded-xl text-[0.7rem] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.97] border border-emerald-500/50 shadow-[0_8px_20px_-4px_rgba(16,185,129,0.3)] group"
                        style={{ background: "linear-gradient(135deg, #064E3B 0%, #022C22 100%)" }}
                        title="Gerar Podcast Executivo com Voz Clonada Voicebox"
                      >
                        <Mic className="w-4 h-4 shrink-0 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="whitespace-nowrap">Podcast Voicebox</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-200 mb-5" />
                  </>
                )}

                <div className={`grid grid-cols-1 ${!isInternal ? 'sm:grid-cols-1' : 'sm:grid-cols-2'} gap-2 mb-4 mt-2`}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-[16px] w-[16px] text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <input 
                      placeholder="Seu nome completo *" 
                      value={simNome} 
                      onChange={e => { setSimNome(e.target.value); setErrNome(false); }}
                      className={`w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-xs focus:border-[#0D214F] outline-none shadow-sm ${errNome ? "border-red-400" : ""}`}
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-[16px] w-[16px] text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                    </div>
                    <input 
                      placeholder="Seu WhatsApp *" 
                      value={simWpp} 
                      onChange={e => { mascaraWpp(e.target.value); setErrWpp(false); }}
                      className={`w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-xs focus:border-[#0D214F] outline-none shadow-sm ${errWpp ? "border-red-400" : ""}`}
                    />
                  </div>
                </div>

                <div className={`flex items-center gap-2 text-xs text-muted-foreground mb-4 ${isInternal ? 'justify-center' : ''}`}>
                  <Clock className="w-3.5 h-3.5 text-primary opacity-75" />
                  {isInternal ? "Finalizar simulação" : "Em segundos você verá sua estratégia."}
                </div>

                <button
                  onClick={confirmarSimulacao}
                  disabled={bloqueado}
                  className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all disabled:opacity-45 disabled:cursor-not-allowed text-white shadow-lg active:scale-95 ${isInternal ? 'bg-[#0f2044] hover:bg-[#1a3266]' : 'bg-[#FF7A00] hover:bg-[#FF8B1F]'}`}
                >
                  <ArrowRight className="w-4 h-4" />
                  {isInternal ? "Registrar Simulação" : "Ver Estratégia"}
                </button>
                
                {!isInternal && (
                  <div className="mt-4 flex flex-col items-center gap-1">
                    <p className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-widest">
                      Leva menos de 30 segundos
                    </p>
                    <p className="text-[10px] text-muted-foreground opacity-60">
                      Sem compromisso. Não enviamos spam.
                    </p>
                  </div>
                )}
                
              </div> {/* FIM COLUNA DIREITA */}
            </div> {/* FIM GRID DA SECTION */}

            {resultado && (
              <div ref={resultRef} className="rounded-[18px] p-0 mt-8 animate-fade-in overflow-hidden border-2 border-primary bg-card shadow-xl">
                <div className="bg-primary p-4 text-white">
                  <div className="text-[0.6rem] uppercase tracking-[0.15em] mb-1 font-bold flex items-center justify-between opacity-80">
                    <span>PROPOSTA GERADA PELO CONSULTOR</span>
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold">Simulação Detalhada</h3>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                    <p className="text-[0.65rem] uppercase tracking-wider mb-1 font-bold text-green-700">{isLinear ? "Parcela Linear (Integral)" : "Parcela Reduzida (50%)"}</p>
                    <p className="text-3xl font-black text-[#16a34a]" style={{ fontFamily: "monospace" }}>{fmtFull(isLinear ? (resultado.r100 ?? resultado.r50) : resultado.r50)}</p>
                    <p className="text-[0.6rem] text-green-600 mt-1 uppercase font-medium">{isLinear ? "Investimento planejado" : "Investimento inteligente até a contemplação"}</p>
                  </div>

                  <div className={`grid gap-3 ${isInternal && (resultado.tx !== undefined || resultado.fr !== undefined) ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
                    <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
                      <p className="text-[0.6rem] uppercase font-bold text-muted-foreground mb-1">Crédito</p>
                      <p className="text-lg font-bold text-foreground">{fmtFull(resultado.credito)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
                      <p className="text-[0.6rem] uppercase font-bold text-muted-foreground mb-1">Prazo</p>
                      <p className="text-lg font-bold text-foreground">{isLinear ? (resultado.prazoLinear ?? resultado.prazo) : resultado.prazo} meses</p>
                    </div>
                    {isInternal && resultado.tx !== undefined && (
                      <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
                        <p className="text-[0.6rem] uppercase font-bold text-muted-foreground mb-1 whitespace-nowrap">Taxa Adm</p>
                        <p className="text-lg font-bold text-foreground">{resultado.tx}%</p>
                      </div>
                    )}
                    {isInternal && resultado.fr !== undefined && (
                      <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
                        <p className="text-[0.6rem] uppercase font-bold text-muted-foreground mb-1 whitespace-nowrap">F. Reserva</p>
                        <p className="text-lg font-bold text-foreground">{resultado.fr}%</p>
                      </div>
                    )}
                  </div>

                  {/* Características do Grupo */}
                  {(() => {
                    const c = GRUPO_CARACTERISTICAS[resultado.grupo];
                    if (!c) return null;
                    const contemResolucao285 = c.caracteristicas.includes("RESOLUÇAO 285") || c.caracteristicas.includes("RESOLUÇÃO 285");
                    return (
                      <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-[#0f2044] flex items-center gap-1.5">
                            <span>⚙️</span> Características do Grupo {c.grupo}
                          </span>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            Reajuste: {c.reajuste}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">1ª Assembleia</p>
                            <p className="font-semibold text-foreground">{c.primeiraAssembleia}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Próxima Assembleia</p>
                            <p className="font-semibold text-foreground">{c.proximaAssembleia}</p>
                          </div>
                        </div>

                        <div className="text-xs space-y-2 pt-1 border-t border-slate-100">
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Ordem de Contemplação</p>
                            <p className="text-foreground leading-relaxed italic">{c.ordemContemplacao}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Regras de Lance & Diluição</p>
                            <p className="text-foreground leading-relaxed">{c.opcaoDiluir}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Regra de Reajuste Anual</p>
                            <p className="text-foreground leading-relaxed">{c.regraReajuste}</p>
                          </div>
                        </div>

                        {contemResolucao285 && (
                          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-bold leading-relaxed">
                            ⚠️ DEVIDO À RESOLUÇÃO 285, O GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {(lanceDinheiroPct > 0 || lanceEmbutidoPct > 0) && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                        <span className="text-[0.7rem] font-bold text-blue-800 uppercase">Estratégia de Lance</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-blue-900">
                        <span>Total do Lance ({lanceDinheiroPct + lanceEmbutidoPct}%)</span>
                        <span>{fmtFull(resultado.credito * (lanceDinheiroPct + lanceEmbutidoPct) / 100)}</span>
                      </div>
                    </div>
                  )}

                  {incluirComp && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="w-4 h-4 text-secondary" />
                        <span className="text-[0.7rem] font-bold text-foreground uppercase">Comparativo com Financiamento</span>
                      </div>
                      
                      {(() => {
                        const isIm = categoria === 'imovel';
                        const taxaM = isIm ? 0.00887 : 0.025;
                        const resPrazo = isLinear ? (resultado.prazoLinear ?? resultado.prazo) : resultado.prazo;
                        const pmtF = resultado.credito * taxaM / (1 - Math.pow(1 + taxaM, -resPrazo));
                        const parcelaAtual = isLinear ? (resultado.r100 ?? resultado.r50) : resultado.r50;
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between text-[11px] text-muted-foreground">
                              <span>Parcela Banco (Price)</span>
                              <span className="font-mono line-through opacity-70">~ {fmtFull(pmtF)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold text-[#16a34a] bg-green-50 p-2 rounded-lg">
                              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sua Parcela Aqui</span>
                              <span className="font-mono">{fmtFull(parcelaAtual)}</span>
                            </div>
                            <div className="flex justify-between text-[12px] font-black text-blue-900 border-t border-dashed border-border pt-2">
                              <span>Economia Mensal:</span>
                              <span className="text-lg">+{fmtFull(pmtF - parcelaAtual)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="pt-2 text-center text-[0.7rem] text-muted-foreground bg-muted/30 p-2 rounded-lg">
                    Para condições especiais e lances personalizados <strong className="text-secondary">fale com o especialista ✉️</strong>
                  </div>

                  <div className={`grid gap-2 pt-4 border-t border-border mt-4 ${isInternal ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
                    <button
                      onClick={handleEnviarWpp}
                      className="py-3 px-2 rounded-[10px] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg transition-all"
                    >
                      <WhatsAppIcon className="w-4 h-4 shrink-0" />
                      <span className="inline-block">Enviar</span>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="py-3 px-2 rounded-[10px] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-all"
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>PDF Proposta</span>
                    </button>
                    <button
                      onClick={handleGerarImagem}
                      className="py-3 px-2 rounded-[10px] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 bg-[#FF7A00] hover:bg-[#FF8B1F] text-white shadow-lg transition-all"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>Imagem</span>
                    </button>
                    <button
                      onClick={() => {
                        const orgId = searchParams.get("org") || searchParams.get("organizacao_id") || profile?.organizacao_id;
                        let url = `/pre-cadastro`;
                        const params = new URLSearchParams();
                        if (orgId) params.append("org", orgId);
                        if (credito) params.append("valor", String(credito));
                        if (categoria) params.append("segmento", categoria);
                        if (params.toString()) url += `?${params.toString()}`;
                        window.open(url, "_blank");
                      }}
                      className="py-3 px-2 rounded-[10px] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg transition-all"
                      title="Abrir Ficha de Pré-Cadastro para Contrato"
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Pré-Cadastro</span>
                    </button>
                    {isInternal && (
                      <button
                        onClick={handleGerarApresentacaoLM}
                        className="py-3 px-2 rounded-[10px] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#0d1b2a] via-[#1b263b] to-[#0f172a] hover:from-[#1b263b] hover:to-[#1e293b] text-white shadow-lg border border-amber-500/40 transition-all group"
                        title="Gerar Estudo Estratégico em PDF no estilo Notebook LM"
                      >
                        <svg className="w-4 h-4 shrink-0 text-amber-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          <path d="M12 6h4" />
                          <path d="M12 10h4" />
                        </svg>
                        <span className="whitespace-nowrap">Apresentação LM</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {historicoZustand.length > 0 && (
              <div className="mt-4">
                <p className="text-[0.64rem] font-bold tracking-[0.1em] uppercase mb-2 text-muted-foreground">Suas simulações (Zustand)</p>
                {historicoZustand.slice(0, 3).map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-[10px] mb-1.5 flex-wrap gap-2 bg-card border border-border" style={{ borderLeft: "3px solid hsl(var(--secondary))" }}>
                    <div>
                      <p className="font-bold text-sm text-foreground">{fmt(h.valor_credito)}</p>
                      <p className="text-[0.67rem] text-muted-foreground">Grupo {h.grupo} · {h.meses} meses · {new Date(h.data_simulacao).toLocaleTimeString("pt-BR")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ fontFamily: "monospace", color: "#16a34a" }}>{fmtFull(h.parcela)}</p>
                      <p className="text-[0.67rem] text-muted-foreground">Valor Mensal</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            

            {bloqueado && (
              <div className="rounded-[14px] p-7 text-center mt-5 animate-fade-in bg-card border-2 border-secondary shadow-lg">
                <p className="text-3xl mb-2">🔐</p>
                <p className="text-lg font-extrabold text-foreground mb-1.5">Limite atingido</p>
                <div className="rounded-lg py-2 px-3.5 mb-3 text-sm font-semibold bg-secondary/10 border border-secondary/30 text-secondary">
                  ⏰ As melhores cotas são contempladas rapidamente!
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Você utilizou suas {MAX_CONSULTAS} simulações gratuitas.<br />Fale agora com o especialista e garanta sua cota!
                </p>
                <a
                  href={lockWppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 py-3.5 px-7 rounded-full text-sm font-extrabold tracking-wider text-white"
                  style={{ background: "#25D366" }}
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  🔥 Falar com Especialista Agora
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* VERSAO INJETADA PARA DEBUG VISUAL */}
      <div className="text-[10px] text-gray-300 text-center mt-2">v_fix_10_color</div>
      
      {/* Hidden Banner Generator placed absolutely to avoid ResizeObserver loops */}
      {(resultado || isInternal) && (
        <div id="offscreen-presentation-wrapper" style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
          <BannerGenerator 
            ref={bannerRef}
            grupo={resultado || g}
            categoria={categoria}
            paymentMode={effectiveMode}
            installmentValue={selectedInstallment}
          />
          <NotebookLMPresentation
            ref={notebookRef}
            grupo={resultado || g}
            categoria={categoria}
            paymentMode={effectiveMode}
            installmentValue={selectedInstallment}
            simNome={simNome}
            simWpp={simWpp}
            consultorNome={profile?.nome || searchParams.get("nome") || 'Fabricio Honório'}
            lanceDinheiroPct={lanceDinheiroPct}
            lanceEmbutidoPct={lanceEmbutidoPct}
            parcelasContemplar={parcelasContemplar}
            incluirSeguro={incluirSeguro}
          />
        </div>
      )}

      {isInternal && (
        <VoicePodcastModal
          isOpen={isPodcastModalOpen}
          onClose={() => setIsPodcastModalOpen(false)}
          grupo={resultado || g}
          categoria={categoria}
          paymentMode={effectiveMode}
          installmentValue={selectedInstallment}
          simNome={simNome}
          simWpp={simWpp}
          consultorNome={profile?.nome || searchParams.get("nome") || 'Fabricio Honório'}
          lanceDinheiroPct={lanceDinheiroPct}
          lanceEmbutidoPct={lanceEmbutidoPct}
          parcelasContemplar={parcelasContemplar}
        />
      )}
    </div>
  );
};

export default ConsortiumSimulator;
