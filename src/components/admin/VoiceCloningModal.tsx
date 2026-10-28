import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Upload,
  Play,
  Square,
  Sparkles,
  CheckCircle2,
  Cpu,
  Settings,
  Volume2,
  Trash2,
  FileAudio,
  Radio,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { speakJarvisText, stopVoice } from "@/lib/voiceService";

interface VoiceCloningModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const VoiceCloningModal: React.FC<VoiceCloningModalProps> = ({
  isOpen,
  onClose,
  userName = "Fabrício Honório",
}) => {
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Configurações avançadas de motor
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [engine, setEngine] = useState<string>(
    localStorage.getItem("VOICE_ENGINE") || "elevenlabs"
  );
  const [elevenApiKey, setElevenApiKey] = useState(
    localStorage.getItem("ELEVENLABS_API_KEY") || ""
  );
  const [elevenVoiceId, setElevenVoiceId] = useState(
    localStorage.getItem("ELEVENLABS_VOICE_ID") || ""
  );
  const [voiceStudioUrl, setVoiceStudioUrl] = useState(
    localStorage.getItem("VOICESTUDIO_SERVER_URL") || "http://localhost:8080"
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Carregar amostra salva anteriormente se houver
    const savedSample = localStorage.getItem("jarvis_user_voice_sample");
    const savedName = localStorage.getItem("jarvis_user_voice_name");
    if (savedSample) {
      setAudioUrl(savedSample);
      setFileName(savedName || "minha_voz_gravada.wav");
    }
  }, [isOpen]);

  // Iniciar Gravação do Microfone
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          try {
            localStorage.setItem("jarvis_user_voice_sample", base64Audio);
            localStorage.setItem("jarvis_user_voice_name", "voz_microfone_gravada.wav");
          } catch (e) {
            // Storage quota fallback
          }
          setAudioUrl(URL.createObjectURL(audioBlob));
          setFileName("voz_microfone_gravada.wav");
          toast({
            title: "🎙️ Sua Voz Foi Gravada com Sucesso!",
            description: "Amostra capturada e salva para clonagem e podcasts.",
          });
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast({
        title: "Permissão de Microfone Necessária",
        description: "Permita o acesso ao microfone no navegador para gravar sua voz.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Upload de Arquivo de Áudio
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        try {
          localStorage.setItem("jarvis_user_voice_sample", base64Audio);
          localStorage.setItem("jarvis_user_voice_name", file.name);
        } catch (err) {}
        setAudioUrl(URL.createObjectURL(file));
        setFileName(file.name);
        toast({
          title: "📁 Áudio Carregado com Sucesso!",
          description: `Arquivo "${file.name}" importado para a sua voz.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Tocar Áudio da Amostra
  const handlePlaySample = () => {
    if (isPlaying) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    if (!audioUrl) return;

    setIsPlaying(true);
    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    audio.play();
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  };

  const handleDeleteSample = () => {
    localStorage.removeItem("jarvis_user_voice_sample");
    localStorage.removeItem("jarvis_user_voice_name");
    setAudioUrl(null);
    setFileName(null);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsPlaying(false);
    toast({
      title: "Amostra Removida",
      description: "Você pode gravar ou carregar outro áudio a qualquer momento.",
    });
  };

  const handleSaveSettings = () => {
    localStorage.setItem("VOICE_ENGINE", engine);
    localStorage.setItem("ELEVENLABS_API_KEY", elevenApiKey);
    localStorage.setItem("ELEVENLABS_VOICE_ID", elevenVoiceId);
    localStorage.setItem("VOICESTUDIO_SERVER_URL", voiceStudioUrl);
    setShowAdvanced(false);
    toast({
      title: "✅ Configurações de Voz Salvas!",
      description: "Suas credenciais e motores de clonagem estão ativos.",
    });
  };

  const handleTestJarvisVoice = () => {
    speakJarvisText(
      `Olá, ${userName.split(" ")[0]}! Aqui é o Jarvis. Sua voz e seus parâmetros de clonagem estão calibrados e prontos para narrar simulações, briefings e podcasts executivos.`,
      () => {},
      () => {}
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-950 text-white border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8">
        <DialogHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                  Voice Studio · Clonagem da Sua Voz Real
                  <Badge className="bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                    Clone Neural
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Envie um áudio ou grave sua voz para o Jarvis e os podcasts falarem com o seu tom humano idêntico.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              {showAdvanced ? "Ocultar Motores" : "Motores & APIs"}
            </Button>
          </div>
        </DialogHeader>

        {/* PAINEL AVANÇADO DE MOTORES NEURAIS (VOICESTUDIO / ELEVENLABS / OPENAI) */}
        {showAdvanced && (
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Configuração do Motor de Clonagem
              </span>
              <span className="text-[10px] text-slate-400 font-bold">VoiceStudio &amp; ElevenLabs</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Motor Ativo</label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl h-9 px-3 mt-1 outline-none focus:border-cyan-400 font-bold"
                >
                  <option value="elevenlabs">ElevenLabs Neural (Clonagem Instantânea com 1 min de áudio)</option>
                  <option value="voicestudio">VoiceStudio Local (http://localhost:8080)</option>
                  <option value="openai">OpenAI Audio HD (TTS-1-HD)</option>
                  <option value="web_speech">Navegador Barítono Natural (Zero Custo)</option>
                </select>
              </div>

              {engine === "voicestudio" && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">URL do Servidor VoiceStudio</label>
                  <Input
                    value={voiceStudioUrl}
                    onChange={(e) => setVoiceStudioUrl(e.target.value)}
                    placeholder="http://localhost:8080"
                    className="bg-slate-950 border-slate-700 text-xs h-9 text-white mt-1 rounded-xl"
                  />
                </div>
              )}

              {engine === "elevenlabs" && (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">ElevenLabs API Key</label>
                    <Input
                      type="password"
                      value={elevenApiKey}
                      onChange={(e) => setElevenApiKey(e.target.value)}
                      placeholder="sk_..."
                      className="bg-slate-950 border-slate-700 text-xs h-9 text-white mt-1 rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Voice ID Clonado</label>
                    <Input
                      value={elevenVoiceId}
                      onChange={(e) => setElevenVoiceId(e.target.value)}
                      placeholder="ex: 21m00Tcm4TlvDq8ikWAM"
                      className="bg-slate-950 border-slate-700 text-xs h-9 text-white mt-1 rounded-xl"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveSettings} size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl h-8 px-4">
                Salvar Configurações
              </Button>
            </div>
          </div>
        )}

        {/* ÁREA DE GRAVAÇÃO E UPLOAD DA SUA VOZ */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Amostra da Sua Voz ({userName})
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {audioUrl
                    ? "Sua voz está carregada e pronta para síntese neural."
                    : "Envie um áudio falado de 30 a 60 segundos ou grave diretamente no microfone."}
                </p>
              </div>

              <Badge
                variant="outline"
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 ${
                  audioUrl ? "border-emerald-500/50 text-emerald-400 bg-emerald-950/30" : "border-amber-500/50 text-amber-400 bg-amber-950/30"
                }`}
              >
                {audioUrl ? "Voz Calibrada" : "Aguardando Amostra"}
              </Badge>
            </div>

            {/* SE JÁ HOUVER ÁUDIO CARREGADO/GRAVADO */}
            {audioUrl ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[320px]">
                      {fileName || "sua_voz.wav"}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-bold">Arquivo de voz ativo no sistema</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handlePlaySample}
                    className={`h-9 px-3 rounded-xl font-black text-xs gap-1.5 ${
                      isPlaying
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {isPlaying ? "Parar" : "Ouvir"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDeleteSample}
                    className="h-9 px-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl"
                    title="Excluir amostra de voz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : null}

            {/* BOTÕES DE GRAVAR E UPLOAD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-12 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isRecording
                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-lg shadow-rose-600/30"
                    : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/20"
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 fill-current" /> Parar Gravação ({recordingSeconds}s)
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" /> Gravar Minha Voz Agora
                  </>
                )}
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="h-12 rounded-xl font-black text-xs uppercase tracking-wider border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <Upload className="w-4 h-4 text-cyan-400" /> Enviar Arquivo de Áudio
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* DICA DE COMO FUNCIONA O CLONE */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Como funciona o clone de voz:
            </p>
            <p className="text-[11px] leading-relaxed text-slate-300">
              1. <strong>Grave ou envie um áudio</strong> falando de forma natural (ex: explicando uma cota de consórcio ou um áudio de WhatsApp de 30 a 60 segundos).
              <br />
              2. O sistema extrai seu <strong>timbre, cadência e sotaque</strong>.
              <br />
              3. O Jarvis e o estúdio de Podcasts utilizarão essa matriz vocal para sintetizar áudios de propostas, briefings e atendimentos com a sua voz real.
            </p>
          </div>
        </div>

        {/* RODAPÉ E TESTE */}
        <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleTestJarvisVoice}
            className="h-10 px-4 rounded-xl border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs gap-2"
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            Testar Fala do Jarvis
          </Button>

          <Button
            onClick={onClose}
            className="h-10 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20"
          >
            Pronto / Concluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
