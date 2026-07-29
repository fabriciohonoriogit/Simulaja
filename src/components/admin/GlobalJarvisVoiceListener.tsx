import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { aiService } from "@/services/aiService";
import { Sparkles, MicOff } from "lucide-react";
import { useLocation } from "react-router-dom";

export function GlobalJarvisVoiceListener() {
  const { toast } = useToast();
  const location = useLocation();
  const [activeCall, setActiveCall] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullTextRef = useRef<string>("");
  const isSpeakingRef = useRef<boolean>(false);

  // Desativa a escuta global se o usuário estiver diretamente na página dedicada do Jarvis
  const isJarvisPage = location.pathname.includes("/admin/jarvis");

  // Detecta se o dispositivo é mobile (celular/tablet)
  const checkIfMobile = () => {
    if (typeof window === "undefined") return false;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );
  };

  const [isMobile, setIsMobile] = useState<boolean>(checkIfMobile);
  
  // No celular: DESATIVADO por padrão para não apitar nem interromper a concentração.
  // No desktop: mantido ativado por padrão.
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(() => !checkIfMobile());

  useEffect(() => {
    const handleResize = () => {
      const mobile = checkIfMobile();
      setIsMobile(mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isJarvisPage || !isVoiceEnabled) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      return; // Não ativa a escuta se desativado ou na página do Jarvis
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let isMounted = true;

    const startListener = () => {
      if (!isMounted || isJarvisPage || !isVoiceEnabled || isSpeakingRef.current) return;

      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }

        const rec = new SpeechRecognition();
        rec.lang = "pt-BR";
        rec.continuous = true;
        rec.interimResults = true;

        fullTextRef.current = "";

        rec.onresult = (event: any) => {
          if (isSpeakingRef.current || !isVoiceEnabled) return;

          let interim = "";
          let finalText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalText += t;
            else interim += t;
          }
          
          const currentText = (finalText || interim).trim();
          if (currentText) {
            fullTextRef.current = currentText;
          }

          const textLower = fullTextRef.current.toLowerCase();

          if (/(jarvis|jarvas|jervis|yarvis|sharvis|jarves|ouça|fala jarvis|ei jarvis)/i.test(textLower)) {
            setActiveCall(true);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              try { rec.stop(); } catch (e) {}
            }, 1600);
          }
        };

        rec.onerror = (e: any) => {
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            console.warn("[Global Jarvis Voice] Permissão de áudio não concedida.");
            return;
          }
          // Reinicia a escuta automaticamente em qualquer outro erro temporário se ainda ativado
          if (isMounted && !isJarvisPage && isVoiceEnabled && !isSpeakingRef.current) {
            setTimeout(startListener, 2500);
          }
        };

        rec.onend = async () => {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          const finalQ = fullTextRef.current.trim();
          fullTextRef.current = "";

          if (finalQ && (/(jarvis|jarvas|jervis|yarvis|sharvis|jarves|ouça)/i.test(finalQ) || finalQ.length > 5)) {
            toast({
              title: "🤖 Jarvis Atendendo Chamado...",
              description: `"${finalQ}"`,
            });

            try {
              isSpeakingRef.current = true;
              const res = await aiService.askJarvis("Global Voice Command", finalQ);
              const answerText = res.answer || (res as any).script || (res as any).text;

              if (answerText && typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const cleanSpeech = answerText
                  .replace(/```json[\s\S]*?```/g, '')
                  .replace(/```[\s\S]*?```/g, '')
                  .replace(/\*\([^*]*\)\*/g, '')
                  .replace(/[*_#`~]/g, '')
                  .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '')
                  .replace(/\s+/g, ' ')
                  .trim();

                const msg = new SpeechSynthesisUtterance(cleanSpeech);
                msg.lang = "pt-BR";
                msg.rate = 1.02;
                msg.pitch = 0.95;

                const allVoices = window.speechSynthesis.getVoices();
                const ptVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith("pt"));

                let ptVoice = ptVoices.find(v => v.lang.toLowerCase().includes("pt-br") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium") || v.name.includes("Online")));
                if (!ptVoice) ptVoice = ptVoices.find(v => v.lang.toLowerCase().includes("pt-br") || v.lang.toLowerCase().includes("pt_br"));
                if (!ptVoice && ptVoices.length > 0) ptVoice = ptVoices[0];
                if (ptVoice) msg.voice = ptVoice;

                msg.onend = () => {
                  isSpeakingRef.current = false;
                  setActiveCall(false);
                  if (isMounted && !isJarvisPage && isVoiceEnabled) {
                    setTimeout(startListener, 800);
                  }
                };

                msg.onerror = () => {
                  isSpeakingRef.current = false;
                  setActiveCall(false);
                  if (isMounted && !isJarvisPage && isVoiceEnabled) {
                    setTimeout(startListener, 800);
                  }
                };

                window.speechSynthesis.speak(msg);
              } else {
                isSpeakingRef.current = false;
                setActiveCall(false);
                if (isMounted && !isJarvisPage && isVoiceEnabled) {
                  setTimeout(startListener, 1500);
                }
              }
            } catch (err) {
              console.error("[Global Jarvis Listener] Erro ao responder:", err);
              isSpeakingRef.current = false;
              setActiveCall(false);
              if (isMounted && !isJarvisPage && isVoiceEnabled) {
                setTimeout(startListener, 2000);
              }
            }
          } else {
            if (isMounted && !isJarvisPage && isVoiceEnabled && !isSpeakingRef.current) {
              setActiveCall(false);
              setTimeout(startListener, 1200);
            }
          }
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn("[Global Jarvis Listener] Não foi possível iniciar voz automática:", err);
        if (isMounted && !isJarvisPage && isVoiceEnabled && !isSpeakingRef.current) {
          setTimeout(startListener, 3000);
        }
      }
    };

    startListener();

    return () => {
      isMounted = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [isJarvisPage, isVoiceEnabled]);

  const toggleVoice = () => {
    const next = !isVoiceEnabled;
    setIsVoiceEnabled(next);
    toast({
      title: next ? "🎙️ Jarvis por Voz Ativado" : "🔇 Jarvis por Voz Desativado",
      description: next
        ? "Microfone ativo no Jarvis. Fale 'Jarvis...' para enviar um comando."
        : "Microfone desligado. Ative novamente quando quiser interagir por voz.",
    });
  };

  if (isJarvisPage) return null;

  return (
    <button
      onClick={toggleVoice}
      type="button"
      title={isVoiceEnabled ? "Jarvis Ativo (Clique para desativar)" : "Jarvis Desativado (Clique para ativar)"}
      className={`fixed top-4 left-36 sm:top-6 sm:left-[490px] z-50 flex items-center justify-center h-8 w-8 rounded-full shadow-lg backdrop-blur-md border transition-all duration-200 cursor-pointer select-none active:scale-95 ${
        isVoiceEnabled
          ? "bg-slate-900/90 border-emerald-500/50 text-white hover:border-emerald-400"
          : "bg-slate-900/70 border-slate-700/60 text-slate-500 hover:bg-slate-800"
      }`}
    >
      {isVoiceEnabled ? (
        activeCall ? (
          <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        )
      ) : (
        <MicOff className="h-3.5 w-3.5 text-slate-500" />
      )}
    </button>
  );
}

