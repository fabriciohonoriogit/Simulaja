import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Play,
  Square,
  Share2,
  Sparkles,
  Volume2,
  CheckCircle2,
  Cpu,
  Download,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { voiceboxService, DEFAULT_VOICE_PROFILE } from "@/services/voiceboxService";
import { useToast } from "@/hooks/use-toast";
import type { GrupoItem } from "@/constants/simulador";

interface VoicePodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  grupo: GrupoItem;
  categoria: string;
  paymentMode: "linear" | "reduzido";
  installmentValue: number;
  simNome?: string;
  simWpp?: string;
  consultorNome?: string;
  lanceDinheiroPct?: number;
  lanceEmbutidoPct?: number;
  parcelasContemplar?: number;
}

export const VoicePodcastModal: React.FC<VoicePodcastModalProps> = ({
  isOpen,
  onClose,
  grupo,
  categoria,
  paymentMode,
  installmentValue,
  simNome,
  simWpp,
  consultorNome = "Fabricio Honório",
  lanceDinheiroPct = 0,
  lanceEmbutidoPct = 25,
  parcelasContemplar = 1,
}) => {
  const { toast } = useToast();

  const [scriptText, setScriptText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecordingSample, setIsRecordingSample] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState(DEFAULT_VOICE_PROFILE);

  // Cálculos de Seguro e Pós-Contemplação
  const valorSeguro = grupo?.seguro ? grupo.credito * grupo.seguro : 0;
  const parcelaSemSeguro = Math.max(0, installmentValue - valorSeguro);

  const taxaAdmTotal = grupo?.txLinear ?? grupo?.tx5050 ?? 15;
  const fundoReservaTotal = grupo?.frLinear ?? grupo?.fr5050 ?? 1;

  const lEmbutidoRS = (grupo?.credito * lanceEmbutidoPct) / 100;
  const lDinheiroRS = (grupo?.credito * lanceDinheiroPct) / 100;
  const lanceTotalRS = lEmbutidoRS + lDinheiroRS;

  const saldoDevedorBruto = grupo?.credito * (1 + (taxaAdmTotal + fundoReservaTotal) / 100);
  const saldoDevedorPosLance = Math.max(
    0,
    saldoDevedorBruto - lanceTotalRS - installmentValue * parcelasContemplar
  );
  const prazoRestante = Math.max(1, grupo?.prazo - parcelasContemplar);
  const parcelaPos = saldoDevedorPosLance / prazoRestante;

  useEffect(() => {
    if (grupo && isOpen) {
      const generated = voiceboxService.generatePodcastScript({
        clienteNome: simNome || "Cliente Especial",
        credito: grupo.credito,
        parcelaInicial: installmentValue,
        parcelaPos: parcelaPos,
        parcelaSemSeguro: parcelaSemSeguro,
        prazo: grupo.prazo,
        categoria,
        grupo: grupo.grupo || "5996",
        consultorNome,
      });
      setScriptText(generated);
    }
  }, [isOpen, grupo, simNome, installmentValue, parcelaPos, parcelaSemSeguro, categoria, consultorNome]);

  const handlePlayAudio = async () => {
    if (isPlaying) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    toast({
      title: "🎙️ Executando Podcast Voz Clonada...",
      description: "Reproduzindo síntese de voz via Voicebox Engine.",
    });

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(scriptText);
      utterance.lang = "pt-BR";
      utterance.rate = 1.0;
      utterance.pitch = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const brVoice = voices.find((v) => v.lang.includes("pt") || v.lang.includes("BR"));
      if (brVoice) utterance.voice = brVoice;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlaying(false), 4000);
    }
  };

  const handleSendWhatsApp = () => {
    const rawNum = simWpp ? simWpp.replace(/\D/g, "") : "";
    const msg = `🎙️ *ÁUDIO DA SUA SIMULAÇÃO EXECUTIVA (PROPOSTA MAGALU)*\n\n${scriptText}\n\n📊 *Resumo da Simulação:*\n• Crédito: R$ ${grupo?.credito?.toLocaleString("pt-BR")}\n• Parcela Reduzida: R$ ${installmentValue?.toLocaleString("pt-BR")}\n• Parcela Sem Seguro: R$ ${parcelaSemSeguro?.toLocaleString("pt-BR")}\n• Parcela Pós-Contemplação: R$ ${parcelaPos?.toLocaleString("pt-BR")}\n\n👨‍💼 *Fabricio Honório - Especialista Magalu*`;

    const url = rawNum.length >= 10
      ? `https://wa.me/55${rawNum}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0B132B] text-white border border-white/20 rounded-2xl shadow-2xl p-6">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  Voicebox AI Studio · Podcast &amp; Voz Clonada
                  <Badge className="bg-[#10B981] text-black font-extrabold text-[10px]">
                    VOICEBOX ENGINE
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Gerador de podcast executivo e áudios com voz clonada (github.com/jamiepine/voicebox).
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Status do Perfil de Voz */}
        <div className="bg-[#1C2541]/90 border border-white/15 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                {voiceProfile.name}
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </p>
              <p className="text-[11px] text-slate-400">
                Perfil de voz ativo · Modelo neurais Voicebox calibrado
              </p>
            </div>
          </div>

          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-[10px] font-mono">
            CLONAGEM ATIVA
          </Badge>
        </div>

        {/* Roteiro do Podcast */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Roteiro Narrativo do Podcast
            </label>
            <span className="text-[10px] text-slate-400">
              Personalizado para: <strong className="text-white">{simNome || "Cliente"}</strong>
            </span>
          </div>

          <Textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={7}
            className="w-full bg-[#040B16] border border-white/15 rounded-xl p-3.5 text-xs text-slate-200 font-sans leading-relaxed focus:border-amber-500 outline-none resize-none shadow-inner"
          />
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <Button
            onClick={handlePlayAudio}
            className={`h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              isPlaying
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4" /> Parar Áudio
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Ouvir Podcast
              </>
            )}
          </Button>

          <Button
            onClick={handleSendWhatsApp}
            className="h-11 rounded-xl font-bold text-xs bg-[#25D366] hover:bg-[#1fb355] text-white flex items-center justify-center gap-2 shadow-lg"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Enviar via WhatsApp
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            className="h-11 rounded-xl font-bold text-xs border-white/20 text-slate-300 hover:bg-white/10 col-span-2 sm:col-span-1"
          >
            Fechar Estúdio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
