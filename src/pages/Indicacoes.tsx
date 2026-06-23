import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jsPDF } from "jspdf";
import { 
  ChevronRight, 
  FileText,
  Share2,
  UserCheck
} from "lucide-react";

import { GRUPOS, CATEGORIAS, GrupoItem } from "@/constants/simulador";
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
  nomeCliente: string;
  ts: string;
};

export default function Indicacoes() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const orgParam = searchParams.get("org") || searchParams.get("organizacao_id") || undefined;

  // Partner
  const [pNome, setPNome] = useState("");
  const [pWpp, setPWpp] = useState("");
  const [errPNome, setErrPNome] = useState(false);
  const [errPWpp, setErrPWpp] = useState(false);

  // Simulator
  const [categoria, setCategoria] = useState("imovel");
  const [idx, setIdx] = useState(4);
  const [nomeCliente, setNomeCliente] = useState("");
  const [wppCliente, setWppCliente] = useState("");
  const [errNomeC, setErrNomeC] = useState(false);
  const [errWppC, setErrWppC] = useState(false);
  
  const [consultas, setConsultas] = useState(0);
  const [resultado, setResultado] = useState<GrupoItem | null>(null);
  const [historico, setHistorico] = useState<HistItem[]>([]);
  const [bloqueado, setBloqueado] = useState(false);

  const [paymentMode, setPaymentMode] = useState<"linear" | "reduzido">("reduzido");
  const [incluirSeguro, setIncluirSeguro] = useState(true);
  const [lanceDinheiroPct, setLanceDinheiroPct] = useState(0);
  const [lanceEmbutidoPct, setLanceEmbutidoPct] = useState(25);
  const [parcelasContemplar, setParcelasContemplar] = useState(1);
  const resultRef = useRef<HTMLDivElement>(null);

  const lista = GRUPOS[categoria] || GRUPOS["imovel"];
  const _g = lista[idx] || lista[0];

  useEffect(() => {
    setIdx(Math.min(4, lista.length - 1));
  }, [categoria, lista]);

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

  const selectedInstallment = isLinear ? (g.r100 ?? g.r50) : g.r50;

  const lDinheiroRS = g.credito * (lanceDinheiroPct / 100);
  const lEmbutidoRS = g.credito * (lanceEmbutidoPct / 100);
  const lanceTotalPct = lanceDinheiroPct + lanceEmbutidoPct;
  const lanceTotalRS = lDinheiroRS + lEmbutidoRS;
  const creditoDisponivel = g.credito - lEmbutidoRS;

  const tx = isLinear ? (g.txLinear ?? g.tx ?? 20) : (g.tx5050 ?? g.tx ?? 20);
  const fr = isLinear ? (g.frLinear ?? g.fr ?? 1) : (g.fr5050 ?? g.fr ?? 1);
  const seguro = g.seguro ?? 0;
  const saldoDevedorBruto = g.credito + (g.credito * (tx / 100)) + (g.credito * (fr / 100));
  
  const saldoDevedorPosLance = saldoDevedorBruto - (parcelasContemplar * selectedInstallment) - lanceTotalRS;
  const prazoRestante = g.prazo - parcelasContemplar;
  const parcelaPos = prazoRestante > 0 && saldoDevedorPosLance > 0 ? saldoDevedorPosLance / prazoRestante : 0;

  const mascaraWpp = (value: string, setter: (v: string) => void) => {
    let v = value.replace(/D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7) v = v.replace(/(d{2})(d{5})(d*)/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/(d{2})(d*)/, "($1) $2");
    setter(v);
  };

  const pct = lista.length > 1 ? (idx / (lista.length - 1)) * 100 : 0;

  const simular = async () => {
    // Validate partner
    const pNomeOk = pNome.trim().length > 0;
    const pWppOk = pWpp.replace(/D/g, "").length >= 10;
    setErrPNome(!pNomeOk);
    setErrPWpp(!pWppOk);

    // Validate client
    const nomeOk = nomeCliente.trim().length > 0;
    const wppOk = wppCliente.replace(/D/g, "").length >= 10;
    setErrNomeC(!nomeOk);
    setErrWppC(!wppOk);

    if (!pNomeOk || !pWppOk || !nomeOk || !wppOk) return;
    if (consultas >= MAX_CONSULTAS) { setBloqueado(true); return; }

    const novaConsulta = consultas + 1;
    setConsultas(novaConsulta);
    setResultado(g);

    setHistorico(prev => [...prev, {
      credito: g.credito, grupo: g.grupo, prazo: g.prazo, r50: selectedInstallment,
      nomeCliente: nomeCliente.trim(),
      ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }]);

    let leadScoreValor = "baixo";
    if (g.credito >= 500000) leadScoreValor = "premium";
    else if (g.credito >= 200000) leadScoreValor = "alto";
    else if (g.credito >= 80000) leadScoreValor = "medio";

    try {
      await supabase.from("leads").insert({
        nome: nomeCliente.trim(),
        celular: wppCliente.replace(/D/g, ""),
        tipo_consorcio: `${CATEGORIAS.find(c => c.id === categoria)?.label || categoria} (G: ${g.grupo} - ${isLinear ? 'Linear' : '50/50'})`,
        valor_credito: g.credito,
        prazo_meses: g.prazo,
        status: "novo",
        lead_score_valor: leadScoreValor,
        lead_temperatura: "quente",
        organizacao_id: orgParam,
        indicador_nome: pNome.trim(),
        indicador_celular: pWpp.replace(/D/g, ""),
        origem: "indicacao"
      });
    } catch (e) { console.warn("Supabase:", e); }

    try {
      await fetch("https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeCliente.trim(),
          celular: wppCliente,
          valor_credito: fmt(g.credito),
          tipo_consorcio: `${CATEGORIAS.find(c => c.id === categoria)?.label || categoria} (G: ${g.grupo} - ${isLinear ? 'Linear' : '50/50'})`,
          pagina: window.location.href,
          origem: "indicacao",
          score: leadScoreValor,
          indicador_celular: pWpp.replace(/D/g, ""),
          indicador_nome: pNome.trim(),
        }),
      });
    } catch (e) { console.warn("Webhook:", e); }

    toast({ 
      title: "✅ Simulação Realizada!", 
      description: "Em breve o especialista entrará em contato com o cliente." 
    });

    if (novaConsulta >= MAX_CONSULTAS) setTimeout(() => setBloqueado(true), 700);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const navy = [15, 30, 60];
    
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("PROPOSTA DE CONSÓRCIO", 20, 25);
    
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(16);
    doc.text("SIMULAÇÃO DE CONSÓRCIO", 20, 55);
    doc.setFontSize(12);
    doc.text(`Cliente: ${nomeCliente || 'Não informado'}`, 20, 65);
    doc.text(`Indicado por: ${pNome || 'Não informado'}`, 20, 75);
    
    let y = 90;
    const addRow = (label: string, value: string, isBold = false) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.text(label, 20, y);
      doc.text(value, 120, y);
      y += 10;
    };
    
    addRow("Tipo de Bem:", CATEGORIAS.find(c => c.id === categoria)?.label  || "");
    addRow("Crédito:", fmt(g.credito), true);
    addRow("Prazo:", `${g.prazo} meses`);
    addRow(isLinear ? "Parcela Linear:" : "Parcela 50%:", fmt(selectedInstallment), true);
    
    doc.save(`simulacao_${nomeCliente.split(' ')[0] || 'cliente'}.pdf`);
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

    const tipoParcelaStr = isLinear ? 'Linear' : 'Reduzida 50%';
    const prazo = isLinear ? (g.prazoLinear ?? g.prazo) : g.prazo;
    const grupo = isLinear ? (g.grupoLinear ?? g.grupo) : g.grupo;
    const consultor = pNome || 'O Especialista Consórcio';

    const msg = [
      `📅 ${dataStr}`,
      ``,
      `👤 Cliente: ${nomeCliente || 'Não informado'}`,
      `📋 SIMULAÇÃO DE CONSÓRCIO`,
      `─────────────────────────`,
      `${emojiBem} Bem: ${segmentLabel} | Grupo ${grupo}`,
      `💰 Carta de Crédito: ${fmt(g.credito)}`,
      `⏱️ Prazo: ${prazo} meses`,
      `📉 Tipo de Parcela: ${tipoParcelaStr}`,
      ``,
      `📊 VALOR PARCELA`,
      `─────────────────────────`,
      `💵 Valor da Parcela Atual: ${fmt(selectedInstallment)}`,
      `💰 Crédito Disponível: ${fmt(creditoDisponivel)}`,
      `📉 Saldo Devedor: ${fmt(saldoDevedorPosLance > 0 ? saldoDevedorPosLance : saldoDevedorBruto)}`,
      `⏱️ Prazo Restante: ${prazoRestante} meses`,
      `📉 Parcela Pós-Contemplação: ${fmt(parcelaPos > 0 ? parcelaPos : g.r50)}`,
      ``,
      `─────────────────────────`,
      `👨‍💼 Simulação indicada por ${consultor}`
    ].join('n');

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const wppLockMsg = historico.map((h, i) => `${i + 1}. ${fmt(h.credito)} — ${fmt(h.r50)} / ${h.prazo}m (${h.nomeCliente})`).join("n");
  const lockWppUrl = `https://wa.me/55${pWpp.replace(/D/g, "") || "5541997925357"}?text=${encodeURIComponent("Olá! Simulei para clientes:nn" + wppLockMsg + "nnQuero dar andamento!")}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#040B16]">
      <style>{sliderThumbStyles}</style>
      <style>{customAnimations}</style>
      
      {/* Background Deep Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#021024] via-[#051f3e] to-[#042817] z-0" />
      
      {/* Orbs/Particles in the background */}
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none scale-[1.5] sm:scale-125">
         <JarvisOrb state="idle" />
      </div>

      <div className="w-full max-w-[480px] animate-in fade-in duration-1000 z-10 flex flex-col items-center mt-4 sm:mt-8 pb-16 px-4">
        
        {/* Logo Section */}
        <div className="relative flex flex-col items-center mb-6 animate-breathe w-full">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150" />
            <div className="absolute w-[220%] h-[70%] border border-blue-400/40 rounded-[100%] animate-orbit-1" />
            <div className="absolute w-[220%] h-[70%] border border-green-400/30 rounded-[100%] animate-orbit-2" />
            <div className="absolute w-[220%] h-[70%] border border-blue-400/20 rounded-[100%] animate-orbit-3" />
            <img src="/icon-512.webp" alt="Logo Contemplar" className="h-24 sm:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] relative z-10" />
          </div>

          <div className="flex flex-col items-center leading-tight mt-6 relative z-10">
            <span className="text-[28px] sm:text-[32px] font-black tracking-widest text-white uppercase drop-shadow-lg">CONTEMPLAR</span>
            <span className="text-[18px] sm:text-[20px] font-bold tracking-[0.4em] text-[#84CC16] -mt-1 ml-2 drop-shadow-md">ÁREA DO PARCEIRO</span>
          </div>
          
          <p className="text-slate-200 text-[12px] sm:text-[13px] mt-3 font-medium text-center leading-relaxed max-w-[300px] relative z-10 drop-shadow-md">
            Simule para seus <span className="text-[#84CC16] font-bold">Clientes</span>
          </p>
        </div>

        {/* Card Principal */}
        <div className="w-full bg-white rounded-[20px] shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6 sm:p-8 relative z-10 border border-white/10">
          
          {/* Partner identification */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-orange-100">
                <UserCheck className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Seus dados (Indicador)</p>
            </div>
            
            <div className="space-y-2.5">
              <div className="relative">
                <Input 
                  placeholder="Seu nome completo *" 
                  value={pNome} 
                  onChange={e => { setPNome(e.target.value); setErrPNome(false); }}
                  className={`h-11 rounded-lg bg-white border-slate-200 text-sm focus-visible:ring-orange-500 shadow-sm ${errPNome ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
              </div>
              <div className="relative">
                <Input 
                  type="tel"
                  placeholder="Seu WhatsApp *" 
                  value={pWpp} 
                  onChange={e => { mascaraWpp(e.target.value, setPWpp); setErrPWpp(false); }}
                  className={`h-11 rounded-lg bg-white border-slate-200 text-sm focus-visible:ring-orange-500 shadow-sm ${errPWpp ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-200 mb-6" />

          {/* Simulator */}
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
            style={{ background: `linear-gradient(to right, #0057a8 ${pct}%, #e2e8f0 ${pct}%)` }}
          />

          <div className="flex flex-wrap gap-1.5 justify-center mb-5">
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

          
          {hasBothPlans && (
            <div className="flex justify-center mb-5 animate-in fade-in zoom-in-95 duration-200">
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

          <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl p-4 flex flex-col items-center justify-center mb-6">
            <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mb-1">
              {isLinear ? "Parcela Linear" : "Parcela Reduzida (50%)"}
            </p>
            <p className="text-2xl font-mono font-bold text-green-700">{fmt(selectedInstallment)}</p>
          </div>

          {/* Lance Box */}
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


          <div className="space-y-3 mb-5">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">📋 Dados do Cliente</p>
            <div className="relative">
              <Input 
                placeholder="Nome do cliente *" 
                value={nomeCliente} 
                onChange={e => { setNomeCliente(e.target.value); setErrNomeC(false); }}
                className={`h-12 rounded-xl bg-slate-50 border-slate-200 text-sm focus-visible:ring-[#0D214F] shadow-sm ${errNomeC ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
            </div>
            
            <div className="relative">
              <Input 
                type="tel"
                placeholder="WhatsApp do cliente *" 
                value={wppCliente} 
                onChange={e => { mascaraWpp(e.target.value, setWppCliente); setErrWppC(false); }}
                className={`h-12 rounded-xl bg-slate-50 border-slate-200 text-sm focus-visible:ring-[#0D214F] shadow-sm ${errWppC ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
            </div>
          </div>

          <Button onClick={simular} disabled={bloqueado} className="w-full h-12 rounded-xl font-bold text-[15px] bg-[#f47920] hover:bg-[#e06a1b] text-white shadow-lg transition-all disabled:opacity-50">
            Simule Já <ChevronRight className="ml-2 w-4 h-4" />
          </Button>

          {resultado && (
            <div ref={resultRef} className="mt-6 p-5 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-bottom-4 bg-slate-50">
              <h3 className="font-bold text-slate-800 mb-4 text-center text-sm">Resultado Gerado</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleExportPDF} variant="outline" className="border-slate-300 text-slate-700 font-bold h-10 text-[11px] bg-white">
                  <FileText className="mr-2 w-3.5 h-3.5" /> Baixar PDF
                </Button>
                <Button onClick={handleShareWhatsApp} className="bg-[#25D366] hover:bg-[#1fb355] text-white font-bold h-10 text-[11px] shadow-sm">
                  <Share2 className="mr-2 w-3.5 h-3.5" /> Enviar
                </Button>
              </div>
            </div>
          )}

          {bloqueado && (
            <div className="mt-6 p-5 border border-orange-200 rounded-xl text-center bg-orange-50 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-xl mb-1">🔐</p>
              <p className="font-bold text-slate-800 mb-3 text-sm">Limite Atingido</p>
              <Button asChild className="bg-[#25D366] hover:bg-[#1fb355] text-white font-bold w-full h-10 text-[11px]">
                <a href={lockWppUrl} target="_blank" rel="noreferrer">
                  <WhatsAppIcon className="w-4 h-4 mr-2" />
                  Dar andamento
                </a>
              </Button>
            </div>
          )}
        </div>

      </div>
      
      {/* Footer Powered by Jarvis */}
      <div className="absolute bottom-4 flex items-center justify-center space-x-2 z-10 pointer-events-none">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-900/40 border border-blue-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(59,130,246,0.3)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#4ca8e8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
        </div>
        <p className="text-white/70 text-[12px] font-medium uppercase tracking-wider">
          Powered by <span className="text-[#84CC16] font-bold">Jarvis AI</span>
        </p>
      </div>

    </div>
  );
}
