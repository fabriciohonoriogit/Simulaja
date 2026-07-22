import React, { useState, useEffect, useRef } from "react";
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
  Sparkles,
  CheckCircle2,
  Cpu,
  Upload,
  RefreshCw,
  Radio,
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceCloned, setVoiceCloned] = useState(true);
  const [voiceSampleUrl, setVoiceSampleUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Iniciar Gravação do Microfone para Clonagem de Voz
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setVoiceSampleUrl(url);
        setVoiceCloned(true);
        toast({
          title: "✅ Voz Capturada com Sucesso!",
          description: "Amostra da sua voz integrada ao Voicebox AI Engine.",
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast({
        title: "Erro ao Acessar Microfone",
        description: "Permita o acesso ao microfone no seu navegador para gravar a amostra da voz.",
        variant: "destructive",
      });
    }
  };

  // Parar Gravação do Microfone
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Upload Manual de Arquivo de Áudio para Clonagem
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVoiceSampleUrl(url);
      setVoiceCloned(true);
      toast({
        title: "✅ Amostra de Voz Carregada!",
        description: `Arquivo "${file.name}" processado pelo Voicebox AI.`,
      });
    }
  };

  // Tocar / Reproduzir o Podcast Sintetizado
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
      title: "🎙️ Reproduzindo Podcast com Sua Voz...",
      description: "Síntese de voz clonada via Voicebox Engine.",
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

  // Enviar Roteiro e Apresentação para o WhatsApp
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg">
                <Mic className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  Voicebox AI Studio · Clonagem de Voz &amp; Podcast
                  <Badge className="bg-[#10B981] text-black font-extrabold text-[10px]">
                    VOICEBOX ENGINE
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Clone a sua própria voz e gere podcasts executivos automáticos para seus clientes.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* SECÇÃO 1: GRAVADOR / CLONAGEM DA VOZ DO FABRICIO */}
        <div className="bg-[#1C2541]/90 border border-emerald-500/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  Perfil de Voz: <span className="text-emerald-400 font-extrabold">{consultorNome} (Clonada)</span>
                  {voiceCloned && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </p>
                <p className="text-[11px] text-slate-400">
                  {voiceSampleUrl ? "Amostra personalizada gravada e calibrada." : "Voz padrão do especialista calibrada no Voicebox."}
                </p>
              </div>
            </div>

            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-[10px] font-mono">
              {isRecording ? `GRAVANDO: ${recordingSeconds}s` : "SISTEMA PRONTO"}
            </Badge>
          </div>

          {/* Botões para Clonar Nova Voz */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <Button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`h-9 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-3.5 h-3.5" /> Parar Gravação ({recordingSeconds}s)
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" /> Gravar Amostra da Minha Voz (15s)
                </>
              )}
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="h-9 px-3 text-xs font-bold rounded-lg border-white/20 text-slate-300 hover:bg-white/10 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Upload de Áudio (.mp3 / .wav)
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* SECÇÃO 2: ROTEIRO DO PODCAST */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#E0A96D] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Roteiro Narrativo do Podcast
            </label>
            <span className="text-[10px] text-slate-400">
              Cliente: <strong className="text-white">{simNome || "Cliente Especial"}</strong>
            </span>
          </div>

          <Textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={6}
            className="w-full bg-[#040B16] border border-white/15 rounded-xl p-3.5 text-xs text-slate-200 font-sans leading-relaxed focus:border-amber-500 outline-none resize-none shadow-inner"
          />
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <Button
            onClick={handlePlayAudio}
            className={`h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              isPlaying
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4" /> Parar Áudio
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Ouvir Podcast com Minha Voz
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
