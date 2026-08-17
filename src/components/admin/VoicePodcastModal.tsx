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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Play,
  Square,
  Sparkles,
  CheckCircle2,
  Cpu,
  Upload,
  Radio,
  Settings,
  Zap,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { voiceboxService, DEFAULT_VOICE_PROFILE, VoiceProfile } from "@/services/voiceboxService";
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
  const [voiceSampleUrl, setVoiceSampleUrl] = useState<string | null>(null);

  // Configurações de Clonagem Neural
  const [showSettings, setShowSettings] = useState(false);
  const [engine, setEngine] = useState<VoiceProfile["engine"]>(
    (localStorage.getItem("VOICE_ENGINE") as VoiceProfile["engine"]) || "elevenlabs"
  );
  const [elevenApiKey, setElevenApiKey] = useState(localStorage.getItem("ELEVENLABS_API_KEY") || "");
  const [elevenVoiceId, setElevenVoiceId] = useState(localStorage.getItem("ELEVENLABS_VOICE_ID") || "");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

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

  const saveSettings = () => {
    localStorage.setItem("VOICE_ENGINE", engine);
    localStorage.setItem("ELEVENLABS_API_KEY", elevenApiKey);
    localStorage.setItem("ELEVENLABS_VOICE_ID", elevenVoiceId);
    setShowSettings(false);
    toast({
      title: "✅ Configurações de Voz Neural Salvas!",
      description: "Sua chave e Voice ID foram calibrados para clonagem perfeita.",
    });
  };

  // Iniciar Gravação do Microfone para Amostra de Voz Real
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
        toast({
          title: "✅ Sua Voz Foi Capturada com Sucesso!",
          description: "Áudio humano gravado e calibrado no estúdio.",
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
        description: "Permita o acesso ao microfone no seu navegador para gravar a amostra de voz.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVoiceSampleUrl(url);
      toast({
        title: "✅ Arquivo de Voz Carregado!",
        description: `Arquivo "${file.name}" carregado.`,
      });
    }
  };

  // Tocar Áudio Sintetizado (Neural Voice ou Gravação)
  const handlePlayAudio = async () => {
    if (isPlaying) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);

    // Se houver uma gravação de voz direta do microfone do usuário:
    if (voiceSampleUrl) {
      const audio = new Audio(voiceSampleUrl);
      audioPlayerRef.current = audio;
      audio.play();
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      toast({
        title: "🎙️ Reproduzindo Sua Gravação Real de Voz...",
        description: "Tocando o áudio gravado no microfone.",
      });
      return;
    }

    // Caso contrário, gera fala usando o Motor Neural de Clonagem selecionado (ElevenLabs / WebSpeech)
    toast({
      title: "⚡ Gerando Voz Clonada Humana...",
      description: engine === "elevenlabs" && elevenApiKey ? "Processando via ElevenLabs Neural Engine." : "Sintetizando áudio.",
    });

    const activeProfile: VoiceProfile = {
      ...DEFAULT_VOICE_PROFILE,
      engine,
      elevenLabsApiKey: elevenApiKey,
      elevenLabsVoiceId: elevenVoiceId,
    };

    const res = await voiceboxService.synthesizeAudio(scriptText, activeProfile);

    if (res.audioUrl) {
      const audio = new Audio(res.audioUrl);
      audioPlayerRef.current = audio;
      audio.play();
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
    } else {
      // Fallback
      setTimeout(() => setIsPlaying(false), 5000);
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg">
                <Mic className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  Voicebox AI Studio · Clonagem Humana de Voz
                  <Badge className="bg-[#10B981] text-black font-extrabold text-[10px]">
                    NEURAL VOICE 3.0
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Gere podcasts e mensagens narradas com a sua voz real idêntica e sem som robótico.
                </DialogDescription>
              </div>
            </div>

            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
              className="border-white/20 text-slate-300 hover:bg-white/10 flex items-center gap-1 text-xs"
            >
              <Settings className="w-3.5 h-3.5" />
              {showSettings ? "Ocultar Chaves" : "Clonagem Neural (ElevenLabs)"}
            </Button>
          </div>
        </DialogHeader>

        {/* PAINEL DE CONFIGURAÇÃO DE CLONAGEM NEURAL (ELEVENLABS / OPENAI) */}
        {showSettings && (
          <div className="bg-[#16203D] border border-amber-500/40 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Configurar Motor de Voz Humana Ultra-Realista
              </span>
              <Badge variant="outline" className="text-[9px] border-amber-400/50 text-amber-300">
                100% IDÊNTICO À SUA VOZ
              </Badge>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Para ter a sua voz <strong>100% humanizada, com respiração e entonação idênticas às suas</strong>, insira sua chave do <strong>ElevenLabs AI</strong> e o seu <strong>Voice ID</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Chave da API (ElevenLabs API Key)</label>
                <Input
                  type="password"
                  placeholder="ex: sk_..."
                  value={elevenApiKey}
                  onChange={(e) => setElevenApiKey(e.target.value)}
                  className="bg-[#0B132B] border-white/20 text-xs h-9 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">ID da Sua Voz Clonada (Voice ID)</label>
                <Input
                  placeholder="ex: 21m00Tcm4TlvDq8ikWAM"
                  value={elevenVoiceId}
                  onChange={(e) => setElevenVoiceId(e.target.value)}
                  className="bg-[#0B132B] border-white/20 text-xs h-9 text-white mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={saveSettings} className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-8 px-4 rounded-lg">
                Salvar Chave &amp; Ativar Voz Neural
              </Button>
            </div>
          </div>
        )}

        {/* SECÇÃO 1: PAINEL DO PERFIL E GRAVAÇÃO DIRETA */}
        <div className="bg-[#1C2541]/90 border border-emerald-500/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  Voz Ativa: <span className="text-emerald-400 font-extrabold">{consultorNome}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </p>
                <p className="text-[11px] text-slate-400">
                  {voiceSampleUrl
                    ? "Áudio humano real gravado diretamente no microfone."
                    : elevenApiKey
                    ? "Motor Neural ElevenLabs ativo (Voz Clonada Perfeita)."
                    : "Gravador direto / Sintetizador de voz ativo."}
                </p>
              </div>
            </div>

            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-[10px] font-mono">
              {isRecording ? `GRAVANDO: ${recordingSeconds}s` : "Voz Humana Pronta"}
            </Badge>
          </div>

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
                  <Radio className="w-3.5 h-3.5" /> Gravar Minha Voz no Microfone
                </>
              )}
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="h-9 px-3 text-xs font-bold rounded-lg border-white/20 text-slate-300 hover:bg-white/10 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Áudio (.mp3 / .wav)
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
            rows={5}
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
