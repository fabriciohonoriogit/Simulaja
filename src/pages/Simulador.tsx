import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CRMDrawer } from "@/components/admin/CRMDrawer";
import { jsPDF } from "jspdf";
import { 
  Calculator, 
  ChevronRight, 
  TrendingDown, 
  CircleDollarSign,
  FileText,
  Share2,
  CheckCircle2,
  Image as ImageIcon,
  Shield
} from "lucide-react";

import { GRUPOS, CATEGORIAS, GrupoItem, GRUPO_CARACTERISTICAS, MEDIA_LANCES_GRUPOS } from "@/constants/simulador";
import { createLead } from "@/services/leadService";
import { JarvisOrb } from "@/components/admin/JarvisOrb";
import { BannerGenerator } from "@/components/BannerGenerator";
import { BlackFridayBanner } from "@/components/BlackFridayBanner";
import { BlackFridayPromptModal } from "@/components/BlackFridayPromptModal";
import { Sparkles } from "lucide-react";
import { isBlackFridayActive } from "@/utils/blackFridayTheme";
import { generatePromoCardPDF } from "@/lib/promoCardPdfGenerator";

const customAnimations = `
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
.animate-breathe {
  animation: breathe 4s ease-in-out infinite;
}
@keyframes orbit-1 {
  from { transform: rotate(0deg) scale(1); }
  to { transform: rotate(360deg) scale(1); }
}
.animate-orbit-1 {
  animation: orbit-1 12s linear infinite;
}
@keyframes orbit-2 {
  from { transform: rotate(120deg) scale(1); }
  to { transform: rotate(480deg) scale(1); }
}
.animate-orbit-2 {
  animation: orbit-2 15s linear infinite;
}
@keyframes orbit-3 {
  from { transform: rotate(240deg) scale(1); }
  to { transform: rotate(600deg) scale(1); }
}
.animate-orbit-3 {
  animation: orbit-3 18s linear infinite;
}
`;

const sliderThumbStyles = `
  input[type=range].custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    background: #ffffff;
    border: 3px solid #0057a8;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15), inset 0 0 4px rgba(0,0,0,0.1);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  input[type=range].custom-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2), inset 0 0 4px rgba(0,0,0,0.1);
  }
  input[type=range].custom-slider:active::-webkit-slider-thumb {
    transform: scale(0.95);
    background: #0057a8;
    border-color: #ffffff;
  }
  input[type=range].custom-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: #ffffff;
    border: 3px solid #0057a8;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15), inset 0 0 4px rgba(0,0,0,0.1);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
`;

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const MAX_CONSULTAS = 5;

type HistItem = {
  credito: number;
  grupo: string;
  prazo: number;
  r50: number;
  nome: string;
  ts: string;
};

export default function Simulador() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isBF = isBlackFridayActive();
  const refCelular = searchParams.get("ref") || "";
  const refNome = searchParams.get("nome") ? decodeURIComponent(searchParams.get("nome")!) : "";
  const initialSegment = searchParams.get("segmento") || "imovel";
  const orgParam = searchParams.get("org") || searchParams.get("organizacao_id") || undefined;
  const isIndicacao = refCelular.length >= 10;
  const wppDestino = isIndicacao ? refCelular : "5541997925357";

  const [categoria, setCategoria] = useState(initialSegment);
  const [idx, setIdx] = useState(4);
  const [nome, setNome] = useState("");
  const [wpp, setWpp] = useState("");
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("segmento")) {
      setCategoria(searchParams.get("segmento")!);
    }
  }, [searchParams]);

  const [errNome, setErrNome] = useState(false);
  const [errWpp, setErrWpp] = useState(false);
  const [consultas, setConsultas] = useState(0);
  const [resultado, setResultado] = useState<GrupoItem | null>(null);
  const [historico, setHistorico] = useState<HistItem[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  
  const [lanceDinheiroPct, setLanceDinheiroPct] = useState(0);
  const [lanceEmbutidoPct, setLanceEmbutidoPct] = useState(0);
  const [incluirComp, setIncluirComp] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [simulationMode, setSimulationMode] = useState<"credit" | "installment">("credit");
  const [paymentMode, setPaymentMode] = useState<"linear" | "reduzido">("reduzido");
  const [filterPlanoGold, setFilterPlanoGold] = useState(false);
  const [incluirSeguro, setIncluirSeguro] = useState(true);

  const [fathersDayVar, setFathersDayVar] = useState<1 | 2 | 3 | 4>(1);

  const resultRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  const handleGerarImagem = async () => {
    const bannerElement = document.getElementById("banner-generator-container") || bannerRef.current;
    
    if (!bannerElement) {
      toast({
        title: "Aviso",
        description: "Realize uma simulação primeiro para gerar a arte.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Gerando Arte Dia dos Pais 🎁",
      description: "Aguarde, processando arte em alta resolução...",
    });

    try {
      const { default: html2canvas } = await import("html2canvas");
      await new Promise(res => setTimeout(res, 350));
      
      const canvas = await html2canvas(bannerElement, { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: null
      });
      
      const link = document.createElement('a');
      link.download = `Arte_Dia_dos_Pais_${categoria}_${g.credito}k.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Sucesso!",
        description: "Arte de Dia dos Pais baixada com sucesso!",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao gerar arte",
        description: err?.message || "Não foi possível gerar a imagem.",
        variant: "destructive"
      });
    }
  };

  const lista = useMemo(() => {
    const rawLista = GRUPOS[categoria] || GRUPOS["imovel"];
    let filtered = filterPlanoGold && categoria === 'imovel'
      ? rawLista.filter(g => g.isPlanoGold)
      : rawLista.filter(g => !g.isPlanoGold);

    // Ordenar por menor parcela (r50) antes de filtrar por crédito único
    filtered = [...filtered].sort((a, b) => a.r50 - b.r50);

    const seen = new Set<number>();
    filtered = filtered.filter(g => {
      if (seen.has(g.credito)) return false;
      seen.add(g.credito);
      return true;
    });

    return filtered.sort((a, b) => a.credito - b.credito);
  }, [categoria, filterPlanoGold]);

  const _g = lista[idx] || lista[0];

  useEffect(() => {
    setIdx(Math.min(4, lista.length - 1));
  }, [categoria, lista.length]);

  // effectiveMode: respeita a escolha do usuário, força "linear" apenas quando o grupo não tem plano reduzido
  const hasBothPlans = _g.r100 !== undefined && _g.r50 !== _g.r100;
  const effectiveMode: "linear" | "reduzido" = hasBothPlans ? paymentMode : "linear";

  const isLinear = effectiveMode === "linear";
  const txAtual = isLinear ? (_g.txLinear ?? _g.tx ?? 20) : (_g.tx5050 ?? _g.tx ?? 20);
  const frAtual = isLinear ? (_g.frLinear ?? _g.fr ?? 1) : (_g.fr5050 ?? _g.fr ?? 1);
  const saldoTotalContrato = (_g?.credito || 0) * (1 + (txAtual + frAtual) / 100);
  const valorSeguroMensal = _g.r50SemSeguro !== undefined 
    ? Number((_g.r50 - _g.r50SemSeguro).toFixed(2)) 
    : (((_g?.credito || 0) * (_g?.seguro ?? 0)) / 100);

  const g = {
    ..._g,
    prazo: isLinear && _g.prazoLinear ? _g.prazoLinear : _g.prazo,
    grupo: isLinear && _g.grupoLinear ? _g.grupoLinear : _g.grupo,
    r50: incluirSeguro ? _g.r50 : (_g.r50SemSeguro ?? (_g.r50 - valorSeguroMensal)),
    r100: _g.r100 !== undefined ? (incluirSeguro ? _g.r100 : (_g.r100SemSeguro ?? (_g.r100 - valorSeguroMensal))) : undefined,
    seguro: incluirSeguro ? _g.seguro : 0,
  };

  const selectedInstallment = effectiveMode === "linear" ? (g.r100 ?? g.r50) : g.r50;

  const confirmar = async () => {
    const nomeOk = nome.trim().length > 0;
    const wppOk = wpp.replace(/\D/g, "").length >= 10;
    setErrNome(!nomeOk);
    setErrWpp(!wppOk);
    if (!nomeOk || !wppOk) return;
    
    if (consultas >= MAX_CONSULTAS) { 
      setBloqueado(true); 
      return; 
    }

    try {
      const { lead, score } = await createLead({
        nome: nome.trim(),
        celular: wpp,
        tipo_consorcio: `${CATEGORIAS.find(c => c.id === categoria)?.label || categoria} (G: ${g.grupo} - ${paymentMode === 'linear' ? 'Linear' : '50/50'})`,
        valor_credito: g.credito,
        prazo_meses: g.prazo,
        categoria: categoria,
        origem: searchParams.get("utm_source") || (isIndicacao ? "indicacao" : "Página Simulador"),
        indicador_nome: isIndicacao ? refNome : undefined,
        indicador_celular: isIndicacao ? refCelular : undefined,
        organizacao_id: orgParam
      });

      if (lead?.id) {
        setCreatedLeadId(lead.id);
      }

      const novaConsulta = consultas + 1;
      setConsultas(novaConsulta);
      setResultado(g);

      const item: HistItem = {
        credito: g.credito, 
        grupo: g.grupo, 
        prazo: g.prazo, 
        r50: selectedInstallment,
        nome: nome.trim(),
        ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setHistorico(prev => [...prev, item]);

      toast({ 
        title: "✅ Simulação Realizada!", 
        description: `Score calculado: ${score.toUpperCase()}. Nosso especialista entrará em contato.` 
      });

      if (novaConsulta >= MAX_CONSULTAS) {
        setTimeout(() => setBloqueado(true), 700);
      }

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    } catch (error: any) {
      toast({ 
        title: "Erro ao processar", 
        description: error.message || "Tente novamente em instantes.",
        variant: "destructive"
      });
    }
  };

  const handleLoadLead = (lead: any) => {
    setNome(lead.nome || "");
    setWpp(lead.celular || "");
    if (lead.tipo_consorcio) {
      if (lead.tipo_consorcio.toLowerCase().includes("imóvel")) setCategoria("imovel");
      else if (lead.tipo_consorcio.toLowerCase().includes("veículo")) setCategoria("veiculo");
      else if (lead.tipo_consorcio.toLowerCase().includes("pesados")) setCategoria("pesados");
    }
    toast({ title: `Lead ${lead.nome} carregado!` });
  };

  const handleSaveSimToCRM = async (leadId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("leads").update({
        valor_credito: g.credito,
        prazo_meses: g.prazo,
        tipo_consorcio: `${CATEGORIAS.find(c => c.id === categoria)?.label || categoria} (G: ${g.grupo})`,
        updated_at: new Date().toISOString()
      }).eq("id", leadId);

      if (error) throw error;
      toast({ title: "Sincronizado!", description: "Dados salvos no lead selecionado." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    const isLinear = effectiveMode === 'linear';
    const tx = isLinear ? (g.txLinear ?? g.tx ?? 20) : (g.tx5050 ?? g.tx ?? 20);
    const fr = isLinear ? (g.frLinear ?? g.fr ?? 1) : (g.fr5050 ?? g.fr ?? 1);

    const doc = generatePromoCardPDF({
      nomeCliente: nome || 'Cliente Especial',
      whatsappCliente: wpp || '',
      segmento: CATEGORIAS.find(c => c.id === categoria)?.label || categoria,
      grupo: String(isLinear ? (g.grupoLinear ?? g.grupo) : g.grupo),
      credito: g.credito,
      prazo: isLinear ? (g.prazoLinear ?? g.prazo) : g.prazo,
      tipoParcela: g.isPlanoGold ? (isLinear ? 'Golden Linear' : 'PLANO GOLD') : (isLinear ? 'Linear' : 'Reduzida 50%'),
      parcelaValor: selectedInstallment,
      taxaAdm: tx,
      fundoReserva: fr,
      seguro: g.seguro,
      proximaAssembleia: "25/11/2026",
      consultorNome: refNome || 'O Especialista Consórcio',
      consultorTelefone: refCelular || '41997925357'
    });

    const cleanNome = (nome || 'cliente').split(' ')[0].toLowerCase();
    doc.save(`card_promocional_${cleanNome}.pdf`);
    toast({ 
      title: "Card Promocional Gerado!",
      description: "O PDF em formato de card exclusivo foi baixado com sucesso." 
    });
  };

  const handleShareWhatsApp = () => {
    if (!resultado) return;

    const dataStr = new Date().toLocaleDateString('pt-BR');
    const segmentLabel = CATEGORIAS.find(c => c.id === categoria)?.label || categoria;
    
    let emojiBem = "🏠";
    if (categoria === "veiculo") emojiBem = "🚗";
    else if (categoria === "pesados") emojiBem = "🚛";
    else if (categoria === "servicos") emojiBem = "🎓";
    else if (categoria === "eletro") emojiBem = "💻";

    const isLinear = effectiveMode === 'linear';
    const tipoParcelaStr = g.isPlanoGold ? (isLinear ? '👑 Golden Linear' : '👑 PLANO GOLD') : (isLinear ? 'Linear' : 'Reduzida 50%');
    const prazo = isLinear ? (g.prazoLinear ?? g.prazo) : g.prazo;
    const grupo = isLinear ? (g.grupoLinear ?? g.grupo) : g.grupo;
    const consultor = refNome || 'O Especialista Consórcio';

    const tx = isLinear ? (g.txLinear ?? g.tx ?? 20) : (g.tx5050 ?? g.tx ?? 20);
    const fr = isLinear ? (g.frLinear ?? g.fr ?? 1) : (g.fr5050 ?? g.fr ?? 1);
    
    const lDinheiroRS = g.credito * (lanceDinheiroPct / 100);
    const lEmbutidoRS = g.credito * (lanceEmbutidoPct / 100);
    const lanceTotalPct = lanceDinheiroPct + lanceEmbutidoPct;
    const lanceTotalRS = lDinheiroRS + lEmbutidoRS;
    const creditoDisponivel = g.credito - lEmbutidoRS;

    const saldoDevedorBruto = g.credito + (g.credito * (tx / 100)) + (g.credito * (fr / 100));
    
    // We assume 1 portion paid by default for simplistic 'Simulador.tsx' unless modified
    const parcelasContemplar = 1; 
    const saldoDevedorPosLance = saldoDevedorBruto - (parcelasContemplar * selectedInstallment) - lanceTotalRS;
    const prazoRestante = prazo - parcelasContemplar;
    const parcelaPos = prazoRestante > 0 && saldoDevedorPosLance > 0 ? saldoDevedorPosLance / prazoRestante : 0;

    const msg = [
      `📅 ${dataStr}`,
      ``,
      `👤 Cliente: ${nome || 'Não informado'}`,
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

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const wppLockMsg = historico.map((h, i) => `${i + 1}. ${fmt(h.credito)} — ${fmt(h.r50)}`).join("\n");
  const lockWppUrl = `https://wa.me/55${wppDestino}?text=${encodeURIComponent("Simulações:\n" + wppLockMsg)}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#040B16]">
      <style>{sliderThumbStyles}</style>
      <style>{customAnimations}</style>
      
      {/* Background Deep Gradient matching the image */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#021024] via-[#051f3e] to-[#042817] z-0" />
      
      {/* Orbs/Particles in the background (using JarvisOrb scaled up and subtle) */}
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none scale-[1.5] sm:scale-125">
         <JarvisOrb state="idle" />
      </div>

      <div className={`w-full ${isBF ? 'max-w-[520px]' : 'max-w-[420px]'} animate-in fade-in duration-1000 z-10 flex flex-col items-center mt-4 sm:mt-8 pb-16`}>
        
        {/* Logo Section with Atom Rings */}
        <div className="relative flex flex-col items-center mb-6 animate-breathe w-full">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            {/* Core Glow */}
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150" />
            
            {/* CSS Orbit Rings (Atoms) */}
            <div className="absolute w-[220%] h-[70%] border border-blue-400/40 rounded-[100%] animate-orbit-1" />
            <div className="absolute w-[220%] h-[70%] border border-green-400/30 rounded-[100%] animate-orbit-2" />
            <div className="absolute w-[220%] h-[70%] border border-blue-400/20 rounded-[100%] animate-orbit-3" />

            {/* Logo Image */}
            <img src="/icon-512.webp" alt="Logo Contemplar" className="h-24 sm:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] relative z-10" />
          </div>

          <div className="flex flex-col items-center leading-tight mt-6 relative z-10">
            <span className="text-[28px] sm:text-[32px] font-black tracking-widest text-white uppercase drop-shadow-lg">CONTEMPLAR</span>
            <span className="text-[18px] sm:text-[20px] font-bold tracking-[0.4em] text-[#84CC16] -mt-1 ml-2 drop-shadow-md">SIMULADOR</span>
          </div>
          
          <p className="text-slate-200 text-[12px] sm:text-[13px] mt-3 font-medium text-center leading-relaxed max-w-[300px] relative z-10 drop-shadow-md">
            Simule seu Consórcio <span className="text-[#84CC16] font-bold">em segundos</span>
          </p>
        </div>

        {isBF && (
          <BlackFridayBanner className="w-full mb-6" />
        )}

        {/* Card Principal (Idêntico ao Login) */}
        <div className="w-full bg-white rounded-[20px] shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6 sm:p-8 relative z-10 border border-white/10">
          
          <div className="text-center mb-5">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Crédito Desejado</h2>
            <p className="text-3xl sm:text-4xl font-black text-[#0f2044]">{fmt(g.credito)}</p>
          </div>

          <input
            type="range"
            min={0}
            max={lista.length - 1}
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            className="custom-slider w-full h-1.5 rounded-full appearance-none mb-6 bg-slate-100"
            style={{ background: `linear-gradient(to right, #0057a8 ${lista.length > 1 ? (idx / (lista.length - 1)) * 100 : 0}%, #e2e8f0 ${lista.length > 1 ? (idx / (lista.length - 1)) * 100 : 0}%)` }}
          />

          <div className="flex flex-wrap gap-1.5 justify-center mb-4">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoria(cat.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${categoria === cat.id ? 'bg-[#0f2044] text-white border-[#0f2044]' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-[#0f2044] hover:text-[#0f2044]'}`}
            >
              {cat.label}
              </button>
            ))}
          </div>

          {categoria === 'imovel' && (
            <div className="flex justify-center mb-4">
              <div className="flex bg-amber-50/80 p-1 rounded-xl border border-amber-200">
                <button
                  onClick={() => setFilterPlanoGold(false)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${!filterPlanoGold ? 'bg-[#0f2044] text-white shadow-sm' : 'text-amber-800 hover:text-amber-950'}`}
                >
                  50/50 & Linear
                </button>
                <button
                  onClick={() => setFilterPlanoGold(true)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${filterPlanoGold ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-800 hover:text-amber-950'}`}
                >
                  👑 Plano Golden
                </button>
              </div>
            </div>
          )}

          {hasBothPlans && (
            <div className="flex justify-center mb-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setPaymentMode('reduzido')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${effectiveMode === 'reduzido' ? 'bg-[#0f2044] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Reduzido (50%)
                </button>
                <button 
                  onClick={() => setPaymentMode('linear')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${effectiveMode === 'linear' ? 'bg-[#0f2044] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Linear
                </button>
              </div>
            </div>
          )}

          {_g?.seguro ? (
            <div className="flex flex-col items-center justify-center mb-4">
              <label
                htmlFor="chk-seguro-sim"
                className={`inline-flex items-center gap-1.5 cursor-pointer select-none text-xs font-bold px-3 py-1 rounded-full transition-all duration-200 border ${incluirSeguro ? 'bg-green-50 text-green-700 border-green-300' : 'bg-slate-50 text-slate-500 border-slate-300'}`}
              >
                <input
                  id="chk-seguro-sim"
                  type="checkbox"
                  checked={incluirSeguro}
                  onChange={() => setIncluirSeguro(!incluirSeguro)}
                  className="w-3.5 h-3.5 accent-green-600 cursor-pointer shrink-0"
                />
                <Shield className="w-3 h-3 shrink-0" />
                {incluirSeguro ? 'Com Seguro de Vida' : 'Sem Seguro'}
              </label>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                {incluirSeguro 
                  ? `(Sem seguro: ${(_g.r50SemSeguro ?? (_g.r50 - valorSeguroMensal)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})` 
                  : `(Com seguro: ${_g.r50.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`
                }
              </p>
            </div>
          ) : null}

          {/* Card da Parcela Reduzida */}
          <div className={`rounded-2xl p-5 text-center mb-5 relative overflow-hidden shadow-lg border-2 ${
            isBF 
              ? "border-cyan-400/90 bg-gradient-to-br from-cyan-50/70 via-slate-50 to-pink-50/40 shadow-[0_0_25px_rgba(0,229,255,0.2)]" 
              : "border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-green-50/60 to-emerald-100/50"
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-[4px] ${
              isBF ? "bg-gradient-to-r from-cyan-400 via-pink-500 to-cyan-400 animate-pulse" : "bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600"
            }`} />
            <p className={`text-[0.65rem] font-black uppercase tracking-widest mb-1 ${isBF ? "text-cyan-900 flex items-center justify-center gap-1.5 flex-wrap" : "text-emerald-800"}`}>
              {isBF && <span className="text-pink-600 font-extrabold mr-1">🔥 BLACK DAS BLACKS MAGALU ·</span>}
              {g.isPlanoGold ? (effectiveMode === "linear" ? "Plano Golden Linear" : "PLANO GOLD") : (effectiveMode === "linear" ? "Parcela Linear" : "Parcela Reduzida (50%)")}
            </p>
            <p className={`text-3xl sm:text-4xl font-black font-mono drop-shadow-sm ${isBF ? "text-[#0f2044]" : "text-emerald-700"}`}>
              {fmt(selectedInstallment)}
            </p>
          </div>

          {/* Características do Grupo */}
          {(() => {
            const c = GRUPO_CARACTERISTICAS[isLinear ? (g.grupoLinear ?? g.grupo) : g.grupo];
            if (!c) return null;
            const contemResolucao285 = c.caracteristicas.includes("RESOLUÇAO 285") || c.caracteristicas.includes("RESOLUÇÃO 285");
            return (
              <div className="mb-6 p-5 rounded-2xl border border-slate-200/80 bg-white text-left space-y-3 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-500" />
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>⚙️</span> Características do Grupo {c.grupo}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {c.status && (
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${c.status === 'Formação' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                        {c.status}
                      </span>
                    )}
                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Reajuste: {c.reajuste}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase font-sans">1ª Assembleia</p>
                    <p className="font-semibold text-slate-800">{c.primeiraAssembleia}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase font-sans">Próxima Assembleia</p>
                    <p className="font-semibold text-slate-800">{c.proximaAssembleia}</p>
                  </div>
                  {c.cotasVagas !== undefined && (
                    <div>
                      <p className="text-[9px] font-bold text-blue-600 uppercase font-sans">Cotas Vagas</p>
                      <p className="font-bold text-blue-800 font-mono">{c.cotasVagas.toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                  {MEDIA_LANCES_GRUPOS[c.grupo] !== undefined ? (
                    <div>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase font-sans">Média Lance</p>
                      <p className="font-bold text-emerald-700 font-mono">{MEDIA_LANCES_GRUPOS[c.grupo].toFixed(2)}%</p>
                    </div>
                  ) : c.prazoRestante ? (
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-sans">Prazo Restante</p>
                      <p className="font-semibold text-slate-800 font-mono">{c.prazoRestante}m</p>
                    </div>
                  ) : null}
                </div>

                <div className="text-xs space-y-2 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase font-sans">Ordem de Contemplação</p>
                    <p className="text-slate-700 leading-relaxed italic">{c.ordemContemplacao}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase font-sans">Regras de Lance &amp; Diluição</p>
                    <p className="text-slate-700 leading-relaxed">{c.opcaoDiluir}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase font-sans">Regra de Reajuste Anual</p>
                    <p className="text-slate-700 leading-relaxed">{c.regraReajuste}</p>
                  </div>
                </div>

                {contemResolucao285 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 font-bold leading-relaxed">
                    ⚠️ DEVIDO À RESOLUÇÃO 285, O GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA.
                  </div>
                )}
              </div>
            );
          })()}

          <div className="space-y-3 mb-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <Input 
                placeholder="Seu nome completo *" 
                value={nome} 
                onChange={e => setNome(e.target.value)}
                className={`h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 text-sm focus-visible:ring-[#0D214F] shadow-sm ${errNome ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
              </div>
              <Input 
                placeholder="Seu WhatsApp *" 
                value={wpp} 
                onChange={e => setWpp(e.target.value.replace(/\D/g, "").slice(0, 11).replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2"))}
                className={`h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 text-sm focus-visible:ring-[#0D214F] shadow-sm ${errWpp ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
            </div>

            {/* Botão Padronizado de Pré-Cadastro (Abaixo do WhatsApp) */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const orgId = searchParams.get("org") || searchParams.get("organizacao_id");
                let url = `/pre-cadastro`;
                const params = new URLSearchParams();
                if (createdLeadId) params.append("lead_id", createdLeadId);
                if (orgId) params.append("org", orgId);
                if (g?.credito) params.append("valor", String(g.credito));
                if (categoria) params.append("segmento", categoria);
                if (nome.trim()) params.append("nome", nome.trim());
                if (wpp.trim()) params.append("celular", wpp.trim());
                if (params.toString()) url += `?${params.toString()}`;
                window.open(url, "_blank");
              }}
              className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-amber-600 shrink-0" /> Link de Pré-Cadastro (Contrato)
            </Button>
          </div>

          <Button onClick={confirmar} className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#0F172A] to-[#1E293B] hover:from-[#1E293B] hover:to-[#334155] text-white shadow-xl transition-all hover:-translate-y-0.5">
            Simular Agora <ChevronRight className="ml-2 w-4 h-4" />
          </Button>

          {resultado && (
            <div className="mt-6 p-5 border border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-bottom-4 bg-emerald-50/60 shadow-lg">
              <h3 className="font-extrabold text-emerald-900 mb-3 text-center text-xs uppercase tracking-wider">
                Simulação Gerada com Sucesso!
              </h3>

              {/* Seletor de Variação de Imagem do Dia dos Pais */}
              <div className="mb-4 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    {isBF ? "🔥 Campanha Oficial Black das Blacks" : "🎁 Arte Dia dos Pais (Consórcio Magalu)"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{isBF ? "Válido até 30/11" : "Variação da Foto"}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 1, label: "Familia" },
                    { id: 2, label: "No Ombro" },
                    { id: 3, label: "Chaves" },
                    { id: 4, label: "Terreno" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setFathersDayVar(v.id as any)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border ${
                        fathersDayVar === v.id
                          ? "bg-[#0F2F57] text-white border-[#0F2F57] shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <Button onClick={handleExportPDF} variant="outline" className="border-slate-300 text-slate-700 font-bold h-11 text-[11px] bg-white rounded-xl shadow-sm hover:bg-slate-50">
                  <FileText className="mr-1.5 w-4 h-4 text-slate-500" /> PDF Proposta
                </Button>
                <Button onClick={handleShareWhatsApp} className="bg-gradient-to-r from-[#25D366] to-[#1ebd59] hover:from-[#1ebd59] hover:to-[#17a84e] text-white font-extrabold h-11 text-[11px] shadow-lg rounded-xl transition-all hover:-translate-y-0.5">
                  <Share2 className="mr-1.5 w-4 h-4" /> WhatsApp
                </Button>
                <Button onClick={handleGerarImagem} className="bg-gradient-to-r from-[#FF7A00] to-[#FF5500] hover:from-[#FF5500] hover:to-[#E64D00] text-white font-extrabold h-11 text-[11px] shadow-lg rounded-xl transition-all hover:-translate-y-0.5">
                  <ImageIcon className="mr-1.5 w-4 h-4" /> {isBF ? "Gerar Arte Black 🔥" : "Gerar Arte 🎁"}
                </Button>
                <Button 
                  onClick={() => setIsPromptModalOpen(true)} 
                  className="bg-gradient-to-r from-[#030712] to-[#082f49] hover:from-[#082f49] hover:to-[#0c4a6e] text-cyan-200 border border-cyan-400/50 font-extrabold h-11 text-[11px] shadow-lg rounded-xl transition-all hover:-translate-y-0.5"
                  title="Ver Prompts de Inteligência Artificial para gerar imagens no Midjourney/Flux"
                >
                  <Sparkles className="mr-1.5 w-4 h-4 text-pink-400" /> Prompt IA 🎨
                </Button>
                <Button 
                  onClick={() => {
                    const orgId = searchParams.get("org") || searchParams.get("organizacao_id");
                    let url = `/pre-cadastro`;
                    const params = new URLSearchParams();
                    if (createdLeadId) params.append("lead_id", createdLeadId);
                    if (orgId) params.append("org", orgId);
                    if (g?.credito) params.append("valor", String(g.credito));
                    if (categoria) params.append("segmento", categoria);
                    if (nome.trim()) params.append("nome", nome.trim());
                    if (wpp.trim()) params.append("celular", wpp.trim());
                    if (params.toString()) url += `?${params.toString()}`;
                    window.open(url, "_blank");
                  }} 
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black h-11 text-[11px] shadow-lg rounded-xl transition-all hover:-translate-y-0.5"
                >
                  <FileText className="mr-1.5 w-4 h-4" /> Pré-Cadastro
                </Button>
              </div>
            </div>
          )}

          {bloqueado && (
            <div className="mt-6 p-5 border border-orange-200 rounded-xl text-center bg-orange-50">
              <p className="text-xl mb-1">🔐</p>
              <p className="font-bold text-slate-800 mb-3 text-sm">Limite Atingido</p>
              <Button asChild className="bg-[#25D366] hover:bg-[#1fb355] text-white font-bold w-full h-10 text-[11px]">
                <a href={lockWppUrl} target="_blank" rel="noreferrer">Falar com Especialista</a>
              </Button>
            </div>
          )}
        </div>

        {/* Componente Offscreen para Renderizar e Baixar o Banner Dia dos Pais */}
        <div id="offscreen-presentation-wrapper" style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
          <BannerGenerator 
            ref={bannerRef}
            grupo={g}
            categoria={categoria}
            paymentMode={effectiveMode}
            installmentValue={selectedInstallment}
            fathersDayVariation={fathersDayVar}
          />
        </div>

        <CRMDrawer onLoadLead={handleLoadLead} onSaveSim={handleSaveSimToCRM} />

      </div>
      
      {/* Footer Powered by Jarvis & Website Link */}
      <div className="absolute bottom-3 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-3 z-10">
        <a
          href="https://www.oespecialistaconsorcio.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:text-amber-300 text-xs font-bold tracking-wider transition-colors drop-shadow"
        >
          www.oespecialistaconsorcio.com.br
        </a>
        <span className="hidden sm:inline text-white/40">•</span>
        <div className="flex items-center space-x-2 pointer-events-none">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-900/40 border border-blue-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#4ca8e8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
          </div>
          <p className="text-white/70 text-[11px] font-medium uppercase tracking-wider">
            Powered by <span className="text-[#84CC16] font-bold">Jarvis AI</span>
          </p>
        </div>
      </div>

      <BlackFridayPromptModal isOpen={isPromptModalOpen} onClose={() => setIsPromptModalOpen(false)} defaultCategoria={categoria} />
    </div>
  );
}
