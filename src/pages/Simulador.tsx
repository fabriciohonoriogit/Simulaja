import { useState, useRef, useEffect } from "react";
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
  CheckCircle2
} from "lucide-react";

import { GRUPOS, CATEGORIAS, GrupoItem } from "@/constants/simulador";
import { createLead } from "@/services/leadService";
import { JarvisOrb } from "@/components/admin/JarvisOrb";

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
    width: 28px;
    height: 28px;
    background: #ffffff;
    border: 4px solid #0057a8;
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
    width: 28px;
    height: 28px;
    background: #ffffff;
    border: 4px solid #0057a8;
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

  const resultRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);

  const lista = GRUPOS[categoria] || GRUPOS["imovel"];
  const g = lista[idx] || lista[0];

  useEffect(() => {
    setIdx(Math.min(4, lista.length - 1));
  }, [categoria, lista]);

  // effectiveMode: respeita a escolha do usuário, força "linear" apenas quando o grupo não tem plano reduzido
  const hasBothPlans = g.r100 !== undefined && g.r50 !== g.r100;
  const effectiveMode: "linear" | "reduzido" = hasBothPlans ? paymentMode : "linear";

  const mascaraWpp = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7) v = v.replace(/(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d*)/, "($1) $2");
    setWpp(v);
  };

  const pct = lista.length > 1 ? (idx / (lista.length - 1)) * 100 : 0;
  const isLinear = effectiveMode === "linear";
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
    const doc = new jsPDF();
    const isIm = categoria === 'imovel';
    const navy = [15, 30, 60];
    
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("O ESPECIALISTA CONSÓRCIO", 20, 25);
    
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(16);
    doc.text("SIMULAÇÃO DE CONSÓRCIO", 20, 55);
    doc.setFontSize(12);
    doc.text(`Cliente: ${nome || 'Não informado'}`, 20, 65);
    
    let y = 80;
    const addRow = (label: string, value: string, isBold = false) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.text(label, 20, y);
      doc.text(value, 120, y);
      y += 10;
    };
    
    addRow("Tipo de Bem:", CATEGORIAS.find(c => c.id === categoria)?.label  || "");
    addRow("Crédito:", fmt(g.credito), true);
    addRow("Prazo:", `${g.prazo} meses`);
    addRow(paymentMode === 'linear' ? "Parcela Linear:" : "Parcela 50%:", fmt(selectedInstallment), true);
    
    doc.save(`simulacao_${nome.split(' ')[0] || 'cliente'}.pdf`);
    toast({ title: "PDF Gerado!" });
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
    const tipoParcelaStr = isLinear ? 'Linear' : 'Reduzida 50%';
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
      `📉 Tipo de Parcela: ${tipoParcelaStr}`,
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-[#040B16]">
      <style>{sliderThumbStyles}</style>
      <style>{customAnimations}</style>
      
      {/* Background Deep Gradient matching the image */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#021024] via-[#051f3e] to-[#042817] z-0" />
      
      {/* Orbs/Particles in the background (using JarvisOrb scaled up and subtle) */}
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none scale-[1.5] sm:scale-125">
         <JarvisOrb state="idle" />
      </div>

      <div className="w-full max-w-[580px] animate-in fade-in duration-1000 z-10 flex flex-col items-center mt-4 sm:mt-8">
        
        {/* Logo Section with Atom Rings */}
        <div className="relative flex flex-col items-center mb-6 animate-breathe w-full">
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
            {/* Core Glow */}
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150" />
            
            {/* CSS Orbit Rings (Atoms) */}
            <div className="absolute w-[220%] h-[70%] border border-blue-400/40 rounded-[100%] animate-orbit-1" />
            <div className="absolute w-[220%] h-[70%] border border-green-400/30 rounded-[100%] animate-orbit-2" />
            <div className="absolute w-[220%] h-[70%] border border-blue-400/20 rounded-[100%] animate-orbit-3" />

            {/* Logo Image */}
            <img src="/icon-512.png" alt="Logo Contemplar" className="h-28 sm:h-32 w-auto object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] relative z-10" />
          </div>

          <div className="flex flex-col items-center leading-tight mt-8 relative z-10">
            <span className="text-[32px] sm:text-[36px] font-black tracking-widest text-white uppercase drop-shadow-lg">CONTEMPLAR</span>
            <span className="text-[20px] sm:text-[22px] font-bold tracking-[0.4em] text-[#84CC16] -mt-1 ml-2 drop-shadow-md">SIMULADOR</span>
          </div>
          
          <p className="text-slate-200 text-[13px] sm:text-sm mt-4 font-medium text-center leading-relaxed max-w-[340px] relative z-10 drop-shadow-md">
            Simule seu Consórcio <span className="text-[#f47920] font-bold">em segundos</span>
          </p>
        </div>

        <div className="w-full bg-white rounded-[22px] p-8 shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-white/10 relative z-10 mb-8">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Crédito Desejado</p>
          <p className="text-4xl font-black text-[#0f2044]">{fmt(g.credito)}</p>
        </div>

        <input
          type="range"
          min={0}
          max={lista.length - 1}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="custom-slider w-full h-2 rounded-full appearance-none mb-8"
          style={{ background: `linear-gradient(to right, #0057a8 ${pct}%, #e2e8f0 ${pct}%)` }}
        />

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoria(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${categoria === cat.id ? 'bg-[#0f2044] text-white' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {hasBothPlans && (
          <div className="flex justify-center mb-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex bg-slate-100/80 backdrop-blur p-1 rounded-2xl border border-slate-200/50">
              <button 
                onClick={() => setPaymentMode('reduzido')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${effectiveMode === 'reduzido' ? 'bg-[#0f2044] text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Reduzido (50/50)
              </button>
              <button 
                onClick={() => setPaymentMode('linear')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${effectiveMode === 'linear' ? 'bg-[#0f2044] text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Linear (Integral)
              </button>
            </div>
          </div>
        )}

        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center mb-8">
          <p className="text-[10px] font-bold text-green-600 uppercase mb-1">
            {effectiveMode === "linear" ? "Parcela Linear (Integral)" : "Parcela Reduzida (50/50)"}
          </p>
          <p className="text-4xl font-mono font-bold text-green-700">{fmt(selectedInstallment)}</p>
        </div>

        <div className="space-y-4 mb-8">
          <Input placeholder="Nome Completo *" value={nome} onChange={e => setNome(e.target.value)} />
          <Input placeholder="WhatsApp *" value={wpp} onChange={e => mascaraWpp(e.target.value)} />
        </div>

        <Button onClick={confirmar} className="w-full h-14 bg-[#f47920] hover:bg-[#e66a10] text-white font-black uppercase text-lg rounded-xl shadow-lg shadow-orange-200">
          Simular Agora <ChevronRight className="ml-2 w-5 h-5" />
        </Button>

        {resultado && (
          <div className="mt-8 p-6 border-2 border-[#0f2044] rounded-2xl animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-[#0f2044] mb-4">Resultado da Simulação</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button onClick={handleExportPDF} variant="outline" className="border-[#0f2044] text-[#0f2044] font-bold">
                <FileText className="mr-2 w-4 h-4" /> PDF
              </Button>
              <Button onClick={handleShareWhatsApp} className="bg-[#25D366] hover:bg-[#1fb355] text-white font-bold">
                <Share2 className="mr-2 w-4 h-4" /> WHATSAPP
              </Button>
            </div>
          </div>
        )}

        {bloqueado && (
          <div className="mt-8 p-8 border-2 border-orange-500 rounded-2xl text-center bg-orange-50">
            <p className="text-2xl mb-2">🔐</p>
            <p className="font-bold text-[#0f2044] mb-4">Limite de Simulações Atingido</p>
            <Button asChild className="bg-[#25D366] hover:bg-[#1fb355] text-white font-bold w-full h-12">
              <a href={lockWppUrl} target="_blank" rel="noreferrer">Falar com Especialista</a>
            </Button>
          </div>
        )}
      </div>

      <CRMDrawer onLoadLead={handleLoadLead} onSaveSim={handleSaveSimToCRM} />

      </div>
    </div>
  );
}
