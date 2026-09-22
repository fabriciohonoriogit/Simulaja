import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { aiService } from "@/services/aiService";
import { Sparkles, MicOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function checkIfMobile() {
  if (typeof window === "undefined") return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );
}

export function GlobalJarvisVoiceListener() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCall, setActiveCall] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullTextRef = useRef<string>("");
  const isSpeakingRef = useRef<boolean>(false);

  // Desativa a escuta global se o usuário estiver diretamente na página dedicada do Jarvis
  const isJarvisPage = location.pathname.includes("/admin/jarvis");

  const [isMobile, setIsMobile] = useState<boolean>(checkIfMobile);
  
  // Voz desativada por padrão em todos os dispositivos para evitar disparos automáticos e erros de microfone
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);

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

          if (/(bella|bela|oi bella|ei bella|fala bella|oi bela|ei bela|jarvis|jarvas|jervis|yarvis|sharvis|jarves|ouça|fala jarvis|ei jarvis)/i.test(textLower)) {
            setActiveCall(true);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              try { rec.stop(); } catch (e) {}
            }, 1600);
          }
        };

        rec.onerror = (e: any) => {
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
            console.warn("[Global Jarvis Voice] Permissão de áudio não concedida ou áudio indisponível.");
            setIsVoiceEnabled(false);
            return;
          }
          if (e.error === 'no-speech') {
            return;
          }
          // Reinicia a escuta automaticamente apenas se ativado e montado
          if (isMounted && !isJarvisPage && isVoiceEnabled && !isSpeakingRef.current) {
            setTimeout(startListener, 4000);
          }
        };

        rec.onend = async () => {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          const finalQ = fullTextRef.current.trim();
          fullTextRef.current = "";

          const isCalled = /(bella|bela|oi bella|ei bella|fala bella|oi bela|ei bela|jarvis|jarvas|jervis|yarvis|sharvis|jarves|ouça|fala jarvis|ei jarvis)/i.test(finalQ);

          if (finalQ && isCalled) {
            toast({
              title: "🤖 Jarvis Atendendo Chamado...",
              description: `"${finalQ}"`,
            });

            try {
              isSpeakingRef.current = true;
              const res = await aiService.askJarvis("Comando de Voz do Usuário", finalQ);
              const answerRaw = res ? (res.answer || (res as any).script || (res as any).text) : "";
              const answerText = typeof answerRaw === "string" ? answerRaw : String(answerRaw || "");

              if (answerText.trim()) {
                toast({
                  title: "🤖 Bella Respondeu",
                  description: answerText.length > 150 ? `${answerText.slice(0, 150)}...` : answerText,
                });

                // Verifica se há comando de navegação JSON ou intenção verbal
                const jsonMatch = answerText.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                  try {
                    const cmd = JSON.parse(jsonMatch[1]);
                    if (cmd.function === "abrirPagina" && cmd.params?.rota) {
                      setTimeout(() => navigate(cmd.params.rota), 1800);
                    }
                  } catch (e) {}
                }

                const lowerQ = finalQ.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (lowerQ.includes("inadimplent")) setTimeout(() => navigate("/admin/inadimplentes"), 1800);
                else if (lowerQ.includes("funil") || lowerQ.includes("kanban")) setTimeout(() => navigate("/admin/funil"), 1800);
                else if (lowerQ.includes("meta")) setTimeout(() => navigate("/admin/metas"), 1800);
                else if (lowerQ.includes("carteira")) setTimeout(() => navigate("/admin/carteira"), 1800);
                else if (lowerQ.includes("agendamento") || lowerQ.includes("agenda")) setTimeout(() => navigate("/admin/agendamentos"), 1800);
                else if (lowerQ.includes("comiss")) setTimeout(() => navigate("/admin/comissoes"), 1800);
                else if (lowerQ.includes("simulador")) setTimeout(() => navigate("/admin/simulador"), 1800);
                else if (lowerQ.includes("lead")) setTimeout(() => navigate("/admin/leads"), 1800);
              }
              isSpeakingRef.current = false;
              setActiveCall(false);
              if (isMounted && !isJarvisPage && isVoiceEnabled) {
                setTimeout(startListener, 2000);
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

  // Desativado o botão flutuante para não se sobrepor aos botões da interface
  return null;
}

