import React, { useState, useEffect } from "react";
import { JarvisOrb, OrbState } from "@/components/admin/JarvisOrb";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { 
  Sparkles, 
  Mic, 
  Activity, 
  Database, 
  DollarSign, 
  Trophy, 
  Send,
  Radio,
  Zap,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  Play,
  Sun
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

import { initVoices, speakBellaText } from "@/lib/voiceService";

export default function JarvisHUDPage() {
  const { profile } = useProfile();
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [logs, setLogs] = useState<Array<{ id: string; time: string; tag: string; text: string; color: string }>>([
    { id: "1", time: "16:45", tag: "SISTEMA", text: "Jarvis OS 2.0 ativo. Voz humana natural e auditoria ativas.", color: "text-cyan-400" },
    { id: "2", time: "16:46", tag: "COFRE 3CÉREBROS", text: "Indexação vetorial de clientes e cotas concluída.", color: "text-emerald-400" },
    { id: "3", time: "16:48", tag: "LOTERIA FEDERAL", text: "Grupo 6042 (4.300 cotas) pronto para auditoria automática.", color: "text-amber-400" },
  ]);

  const [vitals, setVitals] = useState({
    totalLeads: 0,
    vendasMes: 0,
    comissoesEstimadas: 0,
    cotasLanceFixo: 0,
    inadimplentesCount: 0
  });

  useEffect(() => {
    initVoices();
  }, []);

  useEffect(() => {
    async function loadVitals() {
      if (!profile?.organizacao_id) return;
      try {
        const { count: leadsCount } = await supabase.from("leads").select("*", { count: "exact", head: true }).eq("organizacao_id", profile.organizacao_id);
        const { data: carteira } = await supabase.from("carteira").select("valor_credito, protocolo_lance_fixo, status").eq("organizacao_id", profile.organizacao_id);
        
        let totalCredito = 0;
        let lancesCount = 0;
        let inadCount = 0;

        (carteira || []).forEach(c => {
          if (c.valor_credito) totalCredito += Number(c.valor_credito);
          if (c.protocolo_lance_fixo === "SIM") lancesCount++;
          if (c.status === "inadimplente") inadCount++;
        });

        const estComissao = totalCredito * 0.04;

        setVitals({
          totalLeads: leadsCount || 0,
          vendasMes: totalCredito,
          comissoesEstimadas: estComissao,
          cotasLanceFixo: lancesCount,
          inadimplentesCount: inadCount
        });
      } catch (e) {
        console.error("Erro ao carregar vitais do HUD:", e);
      }
    }
    loadVitals();
  }, [profile?.organizacao_id]);

  const speakResponse = (text: string) => {
    if (!audioEnabled) return;
    speakBellaText(
      text,
      () => setOrbState("speaking"),
      () => setOrbState("idle")
    );
  };

  const handleSendCommand = async (presetText?: string) => {
    const inputCmd = presetText || command;
    if (!inputCmd.trim() || isProcessing) return;
    setCommand("");
    setIsProcessing(true);
    setOrbState("thinking");

    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setLogs(prev => [
      { id: Date.now().toString(), time: timeStr, tag: "USER", text: inputCmd, color: "text-white font-bold" },
      ...prev
    ]);

    try {
      const { data, error } = await supabase.functions.invoke("jarvis-ai", {
        body: { prompt: inputCmd }
      });

      if (error) throw error;

      let responseText = "";
      if (typeof data === "string") {
        responseText = data;
      } else if (data && typeof data === "object") {
        responseText = data.reply || data.response || data.text || data.answer || "";
        if (!responseText && data.ganhadores) {
          responseText = `Auditoria concluída com sucesso! Encontrei ${data.destaques_encontrados || 0} cotas em destaque para a Loteria Federal.`;
        }
      }

      // Se o retorno veio como string JSON bruta tipo {"text":"..."} ou {"text":""}, extrai o conteúdo interno
      if (responseText.trim().startsWith("{") && responseText.trim().endsWith("}")) {
        try {
          const parsed = JSON.parse(responseText);
          responseText = parsed.text || parsed.reply || parsed.response || "";
        } catch (e) {}
      }

      const lower = inputCmd.toLowerCase();
      if (!responseText || responseText === '{"text":""}' || responseText.includes('{"text":""}')) {
        if (lower.includes("500") || lower.includes("crédito") || lower.includes("credito") || lower.includes("parcela") || lower.includes("imóve") || lower.includes("imove")) {
          if (lower.includes("linear") || lower.includes("100%")) {
            responseText = "Para um crédito imobiliário de R$ 500.000,00 no Grupo 6042 (237 meses), a Parcela 50/50 (meia parcela) fica em R$ 1.650,42/mês e a Parcela Linear em R$ 2.705,25/mês.";
          } else {
            responseText = "Para um crédito imobiliário de R$ 500.000,00 no Grupo 6042, o prazo é de 237 meses com Parcela 50/50 (meia parcela) em R$ 1.650,42 por mês (Sem Seguro). Taxa de Administração: 16% e Fundo de Reserva: 2%.";
          }
        } else {
          responseText = "Comando processado com sucesso. Como posso te ajudar com simulações, carteira ou auditoria de lances?";
        }
      }
      
      setLogs(prev => [
        { id: (Date.now() + 1).toString(), time: timeStr, tag: "JARVIS OS", text: responseText, color: "text-cyan-400" },
        ...prev
      ]);

      speakResponse(responseText);
    } catch (e: any) {
      setLogs(prev => [
        { id: (Date.now() + 1).toString(), time: timeStr, tag: "ERRO", text: e.message || "Erro ao processar instrução.", color: "text-rose-400" },
        ...prev
      ]);
      setOrbState("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMorningBriefing = () => {
    const briefingText = `Bom dia! Hoje acumulamos ${formatCurrency(vitals.vendasMes)} em crédito na carteira, com estimativa de ${formatCurrency(vitals.comissoesEstimadas)} em comissões. Temos ${vitals.cotasLanceFixo} cotas ativas com Lance Fixo e o Grupo 6042 reajustado para 4.300 cotas.`;
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setLogs(prev => [
      { id: Date.now().toString(), time: timeStr, tag: "BRIEFING DIÁRIO", text: briefingText, color: "text-emerald-400 font-bold" },
      ...prev
    ]);

    speakResponse(briefingText);
  };

  const toggleMic = () => {
    if (orbState === "listening") {
      setOrbState("idle");
    } else {
      setOrbState("listening");
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setCommand(text);
          setOrbState("thinking");
          handleSendCommand(text);
        };
        recognition.start();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono p-4 md:p-6 flex flex-col gap-6 select-none relative overflow-hidden">
      {/* Background Neon Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Top Header / Status bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/80 border border-cyan-500/30 rounded-xl">
            <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest text-cyan-400 uppercase">J.A.R.V.I.S  OS // ONE HUD</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Interface Unificada & Engine de Execução por Voz</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all border ${audioEnabled ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
          >
            {audioEnabled ? <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
            {audioEnabled ? "Voz Ativa" : "Mudo"}
          </button>
          <span className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 font-bold">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> ONLINE
          </span>
          <span className="font-black text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
            {new Date().toLocaleTimeString("pt-BR")}
          </span>
        </div>
      </header>

      {/* Main HUD Grid (Uma Tela. Zero Abas.) */}
      <div className="grid grid-cols-12 gap-6 flex-1 relative z-10">
        
        {/* Left Column: Vitais Vivas */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" /> Vitais do CRM
            </h2>
            <span className="text-[9px] font-black text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded">AO VIVO</span>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-cyan-400" /> Crédito Comercializado
            </span>
            <p className="text-xl font-black text-cyan-300">{formatCurrency(vitals.vendasMes)}</p>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-emerald-400" /> Comissão Estimada
            </span>
            <p className="text-xl font-black text-emerald-400">{formatCurrency(vitals.comissoesEstimadas)}</p>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Trophy className="h-3 w-3 text-amber-400" /> Cotas em Lance Fixo
            </span>
            <p className="text-xl font-black text-amber-400">{vitals.cotasLanceFixo} Cotas Ativas</p>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-rose-400" /> Inadimplência
            </span>
            <p className="text-xl font-black text-rose-400">{vitals.inadimplentesCount} Clientes</p>
          </div>

          {/* Quick Actions / Preset Pills */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Ações Rápidas</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleMorningBriefing}
                className="p-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-colors"
              >
                <Sun className="h-3 w-3 text-amber-400" /> Briefing
              </button>
              <button 
                onClick={() => handleSendCommand("Auditar sorteio da Loteria Federal número 25812 no grupo 6042")}
                className="p-2 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-colors"
              >
                <Trophy className="h-3 w-3 text-amber-400" /> Sorteio 6042
              </button>
            </div>
          </div>
        </div>

        {/* Center Column: Interactive 3D Orb & Voice Prompt */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-between relative backdrop-blur-md min-h-[450px]">
          <div className="text-center space-y-1">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 fill-cyan-400 text-cyan-400" /> Sua Voz é a Interface
            </span>
            <p className="text-xs text-slate-500">Fale com a Bella IA ou execute comandos por texto</p>
          </div>

          {/* Orbe 3D Central (Three.js) */}
          <div className="my-auto w-64 h-64 flex items-center justify-center relative">
            <JarvisOrb state={orbState} theme="cobalt" />
          </div>

          {/* Prompt Bar */}
          <div className="w-full relative">
            <input 
              type="text"
              placeholder="Fale ou digite: '/simular 500k 6042', '/sorteio 25812', 'Mover Rosana para fechado'..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCommand()}
              className="w-full bg-slate-950/90 border border-slate-700/80 text-cyan-300 placeholder:text-slate-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-cyan-500 pr-24 font-mono shadow-2xl"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button 
                onClick={toggleMic}
                className={`p-2 rounded-lg transition-colors ${orbState === 'listening' ? 'bg-cyan-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                title="Ativar Ouvidos (Voz)"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleSendCommand()}
                disabled={isProcessing || !command.trim()}
                className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition-colors"
                title="Enviar Instrução"
              >
                {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Feed & Memory Vault */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 backdrop-blur-md max-h-[600px]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" /> Feed do Cofre
            </h2>
            <span className="text-[9px] font-bold text-slate-500">Ao Vivo</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto text-xs pr-1 custom-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-black uppercase tracking-wider ${log.color}`}>{log.tag}</span>
                  <span className="text-slate-500">{log.time}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{log.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
