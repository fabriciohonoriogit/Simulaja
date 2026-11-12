import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  PhoneOff,
  Mic,
  Volume2,
  Send,
  Sparkles,
  Heart,
  DollarSign,
  CheckCircle2,
  ExternalLink,
  Flame
} from "lucide-react";
import {
  jarvisVoiceCloser,
  CloserLeadContext,
  CloserMessage,
  FaseSRV
} from "@/services/jarvisVoiceCloserService";
import { toast } from "sonner";
import { formatWhatsAppNumber, getWhatsAppDirectUrl } from "@/services/evolutionApiService";

interface JarvisVoiceCloserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: {
    id?: string;
    nome?: string;
    telefone?: string;
    celular?: string;
    tipo_consorcio?: string;
    valor_credito?: number | string;
    segmento?: string;
  } | null;
}

export const JarvisVoiceCloserModal: React.FC<JarvisVoiceCloserModalProps> = ({
  open,
  onOpenChange,
  lead
}) => {
  const [isCalling, setIsCalling] = useState(false);
  const [faseSRV, setFaseSRV] = useState<FaseSRV>("sonho");
  const [messages, setMessages] = useState<CloserMessage[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const leadNome = lead?.nome || "Cliente";
  const rawPhone = lead?.celular || lead?.telefone || "";
  const targetPhone = rawPhone ? formatWhatsAppNumber(rawPhone) : "";

  useEffect(() => {
    if (!open) return;
    const unsubMsg = jarvisVoiceCloser.subscribeMessages((newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    const unsubState = jarvisVoiceCloser.subscribeState((active) => {
      setIsCalling(active);
    });

    const unsubFase = jarvisVoiceCloser.subscribeFase((fase) => {
      setFaseSRV(fase);
    });

    return () => {
      unsubMsg();
      unsubState();
      unsubFase();
    };
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!open) return null;

  const handleStartCall = async () => {
    const context: CloserLeadContext = {
      id: lead?.id,
      nome: leadNome,
      telefone: targetPhone,
      valor_credito: lead?.valor_credito,
      tipo_consorcio: lead?.tipo_consorcio || lead?.segmento,
    };
    await jarvisVoiceCloser.startVoiceCall(context);
    toast.success("Chamada de voz consultiva iniciada com o Jarvis Closer!");
  };

  const handleEndCall = () => {
    jarvisVoiceCloser.endVoiceCall();
    toast.info("Chamada encerrada.");
  };

  const handleSendManualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const text = customInput;
    setCustomInput("");
    await jarvisVoiceCloser.handleClientSpeech(text);
  };

  const handleSendWhatsAppAudio = async () => {
    if (!targetPhone) {
      toast.error("Lead sem telefone cadastrado.");
      return;
    }
    setIsSendingAudio(true);
    toast.info("Sintetizando e disparando áudio consultivo SRV no WhatsApp...");
    const ok = await jarvisVoiceCloser.sendWhatsAppSRVAudio(targetPhone, leadNome);
    setIsSendingAudio(false);
    if (ok) {
      toast.success("Áudio de voz consultiva enviado com sucesso no WhatsApp!");
    } else {
      toast.warning("Áudio reproduzido localmente. O envio via WhatsApp requer servidor WAHA ativo.");
    }
  };

  const handleOpenWhatsAppCall = () => {
    if (!targetPhone) {
      toast.error("Lead sem telefone cadastrado.");
      return;
    }
    const clean = targetPhone.replace(/\D/g, "");
    
    // Tenta abrir o protocolo nativo do WhatsApp Desktop e fallback para web
    const nativeUrl = `whatsapp://send?phone=${clean}`;
    const webUrl = getWhatsAppDirectUrl(clean, `Olá, ${leadNome}! Aqui é o Fabrício Honório do Consórcio Magalu. Estou te chamando por aqui para batermos aquele papo leve sobre o seu projeto!`);
    
    try {
      window.location.href = nativeUrl;
      setTimeout(() => {
        window.open(webUrl, "_blank");
      }, 800);
    } catch (e) {
      window.open(webUrl, "_blank");
    }

    toast.success("WhatsApp aberto para chamada com o cliente!");
  };

  const handleOpenPhoneCall = () => {
    if (!targetPhone) {
      toast.error("Lead sem telefone cadastrado.");
      return;
    }
    const clean = targetPhone.replace(/\D/g, "");
    window.location.href = `tel:+${clean}`;
    toast.info("Discador do telefone acionado!");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && isCalling) {
        jarvisVoiceCloser.endVoiceCall();
      }
      onOpenChange(val);
    }}>
      <DialogContent className="max-w-2xl bg-slate-950 text-white border-cyan-900/60 shadow-2xl p-0 overflow-hidden flex flex-col h-[85vh] max-h-[750px]">
        {/* HEADER EXECUTIVO COM HUD DE FASES SRV */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-cyan-800/40 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-cyan-950 border border-cyan-500/50 shadow-inner">
                <Mic className={`w-5 h-5 ${isCalling ? "text-cyan-400 animate-pulse" : "text-slate-400"}`} />
                {isCalling && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                )}
              </div>
              <div>
                <DialogTitle className="text-base font-black tracking-wide text-white flex items-center gap-2">
                  <span>JARVIS CLOSER DE VOZ</span>
                  <Badge variant="outline" className="text-[10px] bg-cyan-950/80 text-cyan-300 border-cyan-700/60 uppercase font-mono">
                    Metodologia SRV
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 font-medium mt-0.5">
                  Negociando com <span className="text-cyan-300 font-bold">{leadNome}</span> ({targetPhone || "Sem telefone"})
                </DialogDescription>
              </div>
            </div>

            {/* STATUS DA LIGAÇÃO */}
            <div className="text-right">
              <Badge className={`text-xs px-3 py-1 font-bold ${
                isCalling ? "bg-emerald-600 text-white animate-pulse" : "bg-slate-800 text-slate-300 border-slate-700"
              }`}>
                {isCalling ? "Chamada Ativa" : "Pronto para Iniciar"}
              </Badge>
            </div>
          </div>

          {/* BARRA DE PROGRESSÃO DA METODOLOGIA SRV */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/60">
            <div 
              onClick={() => jarvisVoiceCloser.setFase("sonho")}
              className={`cursor-pointer rounded-xl p-2 border transition-all text-center ${
                faseSRV === "sonho"
                  ? "bg-purple-950/60 border-purple-500 text-purple-200 shadow-lg shadow-purple-900/30"
                  : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase">
                <Heart className="w-3.5 h-3.5" />
                <span>1. Sonho</span>
              </div>
              <p className="text-[9px] mt-0.5 line-clamp-1 opacity-80">Conexão & Visão</p>
            </div>

            <div 
              onClick={() => jarvisVoiceCloser.setFase("realidade")}
              className={`cursor-pointer rounded-xl p-2 border transition-all text-center ${
                faseSRV === "realidade"
                  ? "bg-amber-950/60 border-amber-500 text-amber-200 shadow-lg shadow-amber-900/30"
                  : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase">
                <DollarSign className="w-3.5 h-3.5" />
                <span>2. Realidade</span>
              </div>
              <p className="text-[9px] mt-0.5 line-clamp-1 opacity-80">Capacidade Financeira</p>
            </div>

            <div 
              onClick={() => jarvisVoiceCloser.setFase("viabilidade")}
              className={`cursor-pointer rounded-xl p-2 border transition-all text-center ${
                faseSRV === "viabilidade"
                  ? "bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-900/30"
                  : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Viabilidade</span>
              </div>
              <p className="text-[9px] mt-0.5 line-clamp-1 opacity-80">Crédito Sob Medida</p>
            </div>

            <div 
              onClick={() => jarvisVoiceCloser.setFase("fechamento")}
              className={`cursor-pointer rounded-xl p-2 border transition-all text-center ${
                faseSRV === "fechamento"
                  ? "bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-900/30"
                  : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4. Fechamento</span>
              </div>
              <p className="text-[9px] mt-0.5 line-clamp-1 opacity-80">Reserva de Cota</p>
            </div>
          </div>
        </div>

        {/* FEED DE TRANSCRIÇÃO E DIÁLOGO EM TEMPO REAL */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-slate-950/60">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
                <Flame className="w-8 h-8 animate-pulse" />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-white">Negociação Consultiva sem Pressão</h4>
                <p className="text-xs text-slate-400 mt-1">
                  O Jarvis Closer conduzirá a conversa investigando primeiro o verdadeiro sonho do cliente, sua capacidade real de aporte, e por fim apresentará o consórcio como a solução mais inteligente do mercado.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              if (m.sender === "sistema") {
                return (
                  <div key={m.id} className="text-center my-2">
                    <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 border border-cyan-900/40 px-2.5 py-1 rounded-full">
                      {m.text}
                    </span>
                  </div>
                );
              }

              const isJarvis = m.sender === "jarvis";
              return (
                <div key={m.id} className={`flex flex-col ${isJarvis ? "items-start" : "items-end"}`}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-slate-400">
                      {isJarvis ? "🤖 Jarvis Closer" : `👤 ${leadNome}`}
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono">{m.timestamp}</span>
                    {m.emotion && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-cyan-400 border-cyan-800/50">
                        {m.emotion}
                      </Badge>
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                      isJarvis
                        ? "bg-slate-900 border border-cyan-900/50 text-slate-100 rounded-tl-sm"
                        : "bg-emerald-950/80 border border-emerald-700/60 text-emerald-100 rounded-tr-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* INPUT DE RESPOSTA DO CLIENTE OU SIMULAÇÃO */}
        <div className="p-3 bg-slate-900 border-t border-slate-800/80">
          <form onSubmit={handleSendManualMessage} className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Digite o que o cliente respondeu (ou fale no microfone)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl px-3">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>

          {/* BOTÕES DE AÇÃO PRINCIPAIS */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800/60">
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. LIGAR REAL NO WHATSAPP */}
              {targetPhone && (
                <Button
                  type="button"
                  onClick={handleOpenWhatsAppCall}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 gap-1.5 rounded-xl shadow-lg shadow-emerald-900/30"
                  title="Abrir WhatsApp para ligação direta com o cliente"
                >
                  <Phone className="w-4 h-4 text-emerald-200" />
                  Ligar no WhatsApp
                </Button>
              )}

              {/* 2. LIGAR REAL NO CELULAR / LINHA */}
              {targetPhone && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenPhoneCall}
                  className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs h-9 gap-1.5 rounded-xl"
                  title="Discar diretamente para o telefone celular do lead"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ligar Celular
                </Button>
              )}

              {/* 3. SIMULAÇÃO / COPILOTO DE VOZ */}
              {!isCalling ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleStartCall}
                  className="border-cyan-700/60 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 font-bold text-xs h-9 gap-2 rounded-xl"
                  title="Simular ou acompanhar no viva-voz com o Jarvis respondendo em tempo real"
                >
                  <Mic className="w-4 h-4 text-cyan-400" />
                  Simular Fala com IA
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleEndCall}
                  className="font-bold text-xs h-9 gap-2 rounded-xl"
                >
                  <PhoneOff className="w-4 h-4" />
                  Pausar Microfone IA
                </Button>
              )}
            </div>

            {/* 4. DISPARO DE ÁUDIO REAL NO WHATSAPP */}
            <Button
              type="button"
              variant="outline"
              onClick={handleSendWhatsAppAudio}
              disabled={isSendingAudio}
              className="border-purple-700/60 bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 font-bold text-xs h-9 gap-1.5 rounded-xl"
              title="Disparar mensagem de voz consultiva gravada pelo Jarvis no WhatsApp do cliente"
            >
              <Volume2 className="w-3.5 h-3.5" />
              {isSendingAudio ? "Enviando Áudio..." : "Enviar Áudio de Voz SRV"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
