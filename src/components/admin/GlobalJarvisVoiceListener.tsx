import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { aiService } from "@/services/aiService";
import { Sparkles } from "lucide-react";
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

  useEffect(() => {
    if (isJarvisPage) return; // Evita instâncias duplicadas do SpeechRecognition

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let isMounted = true;

    const startListener = () => {
      if (!isMounted || isJarvisPage || isSpeakingRef.current) return;

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
          if (isSpeakingRef.current) return;

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

          if (textLower.includes("jarvis")) {
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
          // Reinicia a escuta automaticamente em qualquer outro erro temporário
          if (isMounted && !isJarvisPage && !isSpeakingRef.current) {
            setTimeout(startListener, 2000);
          }
        };

        rec.onend = async () => {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          const finalQ = fullTextRef.current.trim();
          fullTextRef.current = "";

          if (finalQ && finalQ.toLowerCase().includes("jarvis")) {
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
                const cleanSpeech = answerText.replace(/\*\([^*]*\)\*/g, '').replace(/[*_#`]/g, "").trim();
                const msg = new SpeechSynthesisUtterance(cleanSpeech);
                msg.lang = "pt-BR";
                msg.rate = 1.05;

                msg.onend = () => {
                  isSpeakingRef.current = false;
                  setActiveCall(false);
                  if (isMounted && !isJarvisPage) {
                    setTimeout(startListener, 800);
                  }
                };

                msg.onerror = () => {
                  isSpeakingRef.current = false;
                  setActiveCall(false);
                  if (isMounted && !isJarvisPage) {
                    setTimeout(startListener, 800);
                  }
                };

                window.speechSynthesis.speak(msg);
              } else {
                isSpeakingRef.current = false;
                setActiveCall(false);
                if (isMounted && !isJarvisPage) {
                  setTimeout(startListener, 1500);
                }
              }
            } catch (err) {
              console.error("[Global Jarvis Listener] Erro ao responder:", err);
              isSpeakingRef.current = false;
              setActiveCall(false);
              if (isMounted && !isJarvisPage) {
                setTimeout(startListener, 2000);
              }
            }
          } else {
            if (isMounted && !isJarvisPage && !isSpeakingRef.current) {
              setActiveCall(false);
              setTimeout(startListener, 1200);
            }
          }
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn("[Global Jarvis Listener] Não foi possível iniciar voz automática:", err);
        if (isMounted && !isJarvisPage && !isSpeakingRef.current) {
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
  }, [isJarvisPage]);

  if (isJarvisPage) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-slate-900/90 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-2xl backdrop-blur-md border border-emerald-500/40 animate-pulse">
      <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
      <span>{activeCall ? "🤖 Jarvis Atendendo..." : "🟢 Jarvis Ouvindo (Diga 'Jarvis...')" }</span>
    </div>
  );
}
