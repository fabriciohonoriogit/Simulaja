import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { aiService } from "@/services/aiService";
import { Sparkles, Mic, MicOff } from "lucide-react";

export function GlobalJarvisVoiceListener() {
  const { toast } = useToast();
  const [listening, setListening] = useState(false);
  const [activeCall, setActiveCall] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let isMounted = true;

    const startListener = () => {
      if (!isMounted) return;
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }

        const rec = new SpeechRecognition();
        rec.lang = "pt-BR";
        rec.continuous = true;
        rec.interimResults = true;

        finalTranscriptRef.current = "";

        rec.onstart = () => {
          if (isMounted) setListening(true);
        };

        rec.onresult = (event: any) => {
          let interim = "";
          let finalText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalText += t;
            else interim += t;
          }
          if (finalText) finalTranscriptRef.current += finalText;
          const fullText = (finalTranscriptRef.current + " " + interim).trim();

          // Palavra-chave de ativação sem toque
          if (fullText.toLowerCase().includes("jarvis") && fullText.length > 6) {
            setActiveCall(true);
            rec.stop();
          }
        };

        rec.onerror = (e: any) => {
          if (isMounted && e.error !== 'aborted') {
            setTimeout(startListener, 1500);
          }
        };

        rec.onend = async () => {
          const finalQ = finalTranscriptRef.current.trim();
          if (finalQ && finalQ.toLowerCase().includes("jarvis")) {
            console.log("[Global Jarvis Listener] Palavra de ativação detectada:", finalQ);
            
            // Atende a chamada por voz sem apertar botão
            toast({
              title: "🤖 Jarvis Atendendo Chamado...",
              description: `"${finalQ}"`,
            });

            try {
              const res = await aiService.askJarvis("Global Voice Command", finalQ);
              if (res.script || (res as any).text) {
                const answerText = res.script || (res as any).text;
                if (typeof window !== "undefined" && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                  const msg = new SpeechSynthesisUtterance(answerText.replace(/[*_#`]/g, ""));
                  msg.lang = "pt-BR";
                  window.speechSynthesis.speak(msg);
                }
              }
            } catch (err) {
              console.error("[Global Jarvis Listener] Erro ao responder:", err);
            }
          }
          
          if (isMounted) {
            setActiveCall(false);
            setTimeout(startListener, 800);
          }
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn("[Global Jarvis Listener] Não foi possível iniciar voz automática:", err);
      }
    };

    startListener();

    return () => {
      isMounted = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-slate-900/90 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-2xl backdrop-blur-md border border-emerald-500/40 animate-pulse">
      <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
      <span>{activeCall ? "🤖 Jarvis Atendendo..." : "🟢 Jarvis Ouvindo (Diga 'Jarvis...')" }</span>
    </div>
  );
}
