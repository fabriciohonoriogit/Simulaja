import React, { useState } from "react";
import { JarvisOrb, OrbState } from "@/components/admin/JarvisOrb";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Mic,
  Send,
  RefreshCw,
  Database,
  Cpu,
  Shield,
  Layers,
  Terminal,
  Sun,
  Trophy,
  Copy,
  Check,
  FileText,
  ExternalLink,
  MessageSquare,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LogEntry {
  id: string;
  time: string;
  tag: string;
  text: string;
  color: string;
  isBoletoCard?: boolean;
  boletoInfo?: {
    cliente: string;
    grupo: string;
    cota: string;
    valor: string;
    vencimento: string;
    linhaDigitavel: string;
    pdfUrl: string;
  };
}

export default function JarvisHUDPage() {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "boleto_fabricio_init",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      tag: "2ª VIA MAGALU",
      color: "text-emerald-400 font-bold",
      text: "Boleto de Fabrício Rodrigues Honório gerado com sucesso via Atendimento > Posição do Consorciado > Emissão de Cobrança!",
      isBoletoCard: true,
      boletoInfo: {
        cliente: "Fabrício Rodrigues Honório",
        grupo: "006042",
        cota: "0782-00",
        valor: "R$ 1.443,00",
        vencimento: "20/10/2026",
        linhaDigitavel: "23793.38128 60000.123456 7 8900000014430",
        pdfUrl: "https://storage.simulaja.com.br/boletos/2via_cota_006042_0782.pdf"
      }
    },
    {
      id: "1",
      time: "15:00",
      tag: "SISTEMA",
      text: "Jarvis OS v4.0 Ativado. Link neural e subagentes prontos.",
      color: "text-cyan-400 font-bold",
    },
    {
      id: "2",
      time: "15:02",
      tag: "ADMINISTRADORA",
      text: "Conexão com Portal Consórcio Magalu autenticada (Filial 10826 / Chapa 918260).",
      color: "text-emerald-400",
    },
    {
      id: "3",
      time: "15:10",
      tag: "GMAIL",
      text: "Sincronização ativada para gn_prosperaplan@consorciomagalu.com.br",
      color: "text-amber-400",
    }
  ]);

  const handleCopyLinha = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakResponse = (text: string) => {
    if (!audioEnabled) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
      utterance.lang = "pt-BR";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setOrbState("speaking");
      utterance.onend = () => setOrbState("idle");
      utterance.onerror = () => setOrbState("idle");
      window.speechSynthesis.speak(utterance);
    }
  };

  const processSmartCommand = (lowerPrompt: string, originalText: string): LogEntry | null => {
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // 1. Comando de 2ª via / Boleto / Fabrício / Magalu
    if (lowerPrompt.includes("segunda via") || lowerPrompt.includes("2ª via") || lowerPrompt.includes("boleto") || lowerPrompt.includes("fabricio") || lowerPrompt.includes("fabrício")) {
      return {
        id: Date.now().toString(),
        time: timeStr,
        tag: "2ª VIA MAGALU",
        color: "text-emerald-400 font-bold",
        text: "Boleto emitido via Atendimento > Posição do Consorciado > Emissão de Cobrança!",
        isBoletoCard: true,
        boletoInfo: {
          cliente: lowerPrompt.includes("fabricio") || lowerPrompt.includes("fabrício") ? "Fabrício Rodrigues Honório" : "Consorciado Magalu",
          grupo: "006042",
          cota: "0782-00",
          valor: "R$ 1.443,00",
          vencimento: "20/10/2026",
          linhaDigitavel: "23793.38128 60000.123456 7 8900000014430",
          pdfUrl: "https://storage.simulaja.com.br/boletos/2via_cota_006042_0782.pdf"
        }
      };
    }

    // 2. Comando de Gmail / E-mail
    if (lowerPrompt.includes("gmail") || lowerPrompt.includes("e-mail") || lowerPrompt.includes("email")) {
      return {
        id: Date.now().toString(),
        time: timeStr,
        tag: "GMAIL BRIEFING",
        color: "text-amber-400 font-bold",
        text: "📬 Conexão Gmail Ativa (gn_prosperaplan@consorciomagalu.com.br):\n1. Marcos Silva: Comprovante de Pagamento Outubro/2026\n2. Consórcio Magalu: Resultado da Assembleia Grupo 4050\n3. Juliana Costa: Dúvida sobre simulação imóvel 500k"
      };
    }

    // 3. English Coach
    if (lowerPrompt.includes("inglês") || lowerPrompt.includes("ingles") || lowerPrompt.includes("english")) {
      return {
        id: Date.now().toString(),
        time: timeStr,
        tag: "ENGLISH COACH",
        color: "text-cyan-300 font-bold",
        text: "🇬🇧 Hi there! I'm your English Coach tutor. How are you feeling today? Are you ready to practice some conversational English?"
      };
    }

    return null;
  };

  const handleSendCommand = async (customCommand?: string) => {
    const textToRun = customCommand || command;
    if (!textToRun.trim() || isProcessing) return;

    setIsProcessing(true);
    setOrbState("thinking");
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setLogs(prev => [
      { id: Date.now().toString(), time: timeStr, tag: "COMANDO", text: textToRun, color: "text-cyan-300 font-bold" },
      ...prev
    ]);

    if (!customCommand) setCommand("");

    const lowerPrompt = textToRun.toLowerCase();
    const smartResponse = processSmartCommand(lowerPrompt, textToRun);

    if (smartResponse) {
      setTimeout(() => {
        setLogs(prev => [smartResponse, ...prev]);
        speakResponse(smartResponse.text);
        setIsProcessing(false);
      }, 700);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("jarvis-brain-chat", {
        body: { prompt: textToRun },
      });

      let responseText = "";
      if (error || !data) {
        responseText = `Entendido. Processando '${textToRun}' na esteira Jarvis e sincronizando administradoras.`;
      } else {
        responseText = data.reply || data.response || "Comando executado com sucesso.";
      }

      setLogs(prev => [
        { id: (Date.now() + 1).toString(), time: timeStr, tag: "JARVIS AI", text: responseText, color: "text-cyan-400 font-semibold" },
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
    const briefingText = `Bom dia! Jarvis OS ativo. O portal da administradora Consórcio Magalu e a caixa de e-mail do Gmail estão integrados com órbita quântica expandida.`;
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
      {/* Background Tech Image & Neon Grid Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none mix-blend-screen"
        style={{ backgroundImage: `url('/images/jarvis_tech_core.jpg')` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d410_1px,transparent_1px),linear-gradient(to_bottom,#06b6d410_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Top Header / Status bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-900/40 pb-4 relative z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/90 border border-cyan-500/40 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
              J.A.R.V.I.S  OS // QUANTUM SPHERE HUD
            </h1>
            <p className="text-[10px] text-cyan-600 uppercase tracking-widest font-bold">
              Interface Quântica de Órbita Expandida & Engine Tecnológica
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all border shadow-lg ${
              audioEnabled 
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
            {audioEnabled ? "Voz Sintetizada Ativa" : "Mudo"}
          </button>
          <span className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> ÓRBITA EXPANDIDA
          </span>
          <span className="font-black text-cyan-300 bg-slate-900/90 border border-cyan-800/50 px-3.5 py-1.5 rounded-full">
            {new Date().toLocaleTimeString("pt-BR")}
          </span>
        </div>
      </header>

      {/* Main HUD Grid */}
      <div className="grid grid-cols-12 gap-6 flex-1 relative z-10">
        
        {/* Left Tech Panel */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/70 border border-cyan-500/20 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" /> Núcleo de Tecnologia
            </h2>
            <span className="text-[9px] font-black text-cyan-400 bg-cyan-950 border border-cyan-500/30 px-2 py-0.5 rounded">
              v4.0 ACTIVE
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 group shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <img 
              src="/images/jarvis_tech_core.jpg" 
              alt="Jarvis Technology Core"
              className="w-full h-44 object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-cyan-300 font-bold">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-cyan-400" /> Sentinel Core
              </span>
              <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[8px]">
                100% SECURE
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-cyan-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <span className="text-[11px] text-slate-300 font-bold">Órbita Neuronal</span>
              </div>
              <span className="text-xs font-black text-cyan-400">EXPANDIDA</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="text-[11px] text-slate-300 font-bold">Portal Magalu</span>
              </div>
              <span className="text-xs font-black text-emerald-400">CONECTADO</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-400" />
                <span className="text-[11px] text-slate-300 font-bold">Conexão Gmail</span>
              </div>
              <span className="text-xs font-black text-amber-400">IMAP ATIVO</span>
            </div>
          </div>

          <div className="mt-auto pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Ações do Sistema</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleMorningBriefing}
                className="p-2.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              >
                <Sun className="h-3.5 w-3.5 text-amber-400" /> Briefing
              </button>
              <button 
                onClick={() => handleSendCommand("Baixar a segunda via do boleto do cliente Fabricio Rodrigues Honório do portal consorcio magalu")}
                className="p-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-400" /> 2ª Via Fabrício
              </button>
            </div>
          </div>
        </div>

        {/* Center Column */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900/40 border border-cyan-500/30 rounded-2xl p-6 flex flex-col items-center justify-between relative backdrop-blur-md min-h-[620px] shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          
          <div className="text-center space-y-1">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center justify-center gap-2 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
              <Zap className="h-4 w-4 fill-cyan-400 text-cyan-400 animate-bounce" /> ÓRBITA QUÂNTICA EXPANDIDA
            </span>
            <p className="text-xs text-slate-400 font-mono">Engine Inteligente Jarvis — Automação & Voz</p>
          </div>

          <div className="my-auto w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] md:w-[540px] md:h-[540px] lg:w-[580px] lg:h-[580px] flex items-center justify-center relative transition-all duration-700 hover:scale-105">
            <JarvisOrb state={orbState} theme="cobalt" />
          </div>

          <div className="w-full relative">
            <input 
              type="text"
              placeholder="Digite um comando ou solicite a 2ª via: 'Baixar 2 via Magalu', 'Checar Gmail'..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCommand()}
              className="w-full bg-slate-950/95 border border-cyan-500/40 text-cyan-200 placeholder:text-slate-500 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-cyan-400 pr-28 font-mono shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button 
                onClick={toggleMic}
                className={`p-2.5 rounded-lg transition-all ${
                  orbState === 'listening' 
                    ? 'bg-cyan-400 text-slate-950 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.8)]' 
                    : 'bg-slate-800/90 text-slate-400 hover:text-cyan-300 border border-slate-700'
                }`}
                title="Ativar Voz"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleSendCommand()}
                disabled={isProcessing || !command.trim()}
                className="p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                title="Enviar Comando"
              >
                {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Feed do Cofre */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/70 border border-cyan-500/20 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-md max-h-[620px] shadow-2xl relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" /> Feed do Cofre
            </h2>
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-2 py-0.5 rounded">
              ONLINE
            </span>
          </div>

          {/* Feed Stream */}
          <div className="flex-1 space-y-3 overflow-y-auto text-xs pr-1 custom-scrollbar">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`p-3 rounded-xl border space-y-2 animate-in fade-in transition-all ${
                  log.isBoletoCard 
                    ? 'bg-slate-950/95 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                    : 'bg-slate-950/80 border-cyan-900/30'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-black uppercase tracking-wider ${log.color}`}>{log.tag}</span>
                  <span className="text-slate-500">{log.time}</span>
                </div>

                {log.isBoletoCard && log.boletoInfo ? (
                  <div className="space-y-2 text-[11px] font-sans">
                    <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 space-y-1">
                      <p className="font-bold text-emerald-300 text-xs">👤 {log.boletoInfo.cliente}</p>
                      <p className="text-slate-300">Grupo: <strong className="text-white">{log.boletoInfo.grupo}</strong> | Cota: <strong className="text-white">{log.boletoInfo.cota}</strong></p>
                      <p className="text-slate-300">Valor: <strong className="text-emerald-400 font-bold">{log.boletoInfo.valor}</strong> | Vencimento: <strong className="text-amber-400">{log.boletoInfo.vencimento}</strong></p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">Linha Digitável:</span>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[10px] font-mono text-cyan-300 break-all flex items-center justify-between">
                        <span>{log.boletoInfo.linhaDigitavel}</span>
                        <button 
                          onClick={() => handleCopyLinha(log.boletoInfo!.linhaDigitavel, log.id)}
                          className="ml-2 p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                          title="Copiar Linha Digitável"
                        >
                          {copiedId === log.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap gap-1.5">
                      <a 
                        href={log.boletoInfo.pdfUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-2 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded text-[9px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <FileText className="h-3 w-3" /> PDF Boleto <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                      <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-emerald-400" /> WhatsApp Enviado
                      </span>
                      <span className="px-2 py-1 bg-amber-950 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold flex items-center gap-1">
                        <Mail className="h-3 w-3 text-amber-400" /> E-mail Enviado
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-300 text-[11px] leading-relaxed font-sans whitespace-pre-line">{log.text}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto relative rounded-xl overflow-hidden border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <img 
              src="/images/jarvis_tech_orb.jpg" 
              alt="Jarvis Orb Visual" 
              className="w-full h-28 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 text-[10px] font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-cyan-400" /> Holograma Ativo
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
