import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import JarvisAvatar from "./JarvisAvatar";

type Step = "welcome" | "sonho_custom" | "realidade" | "velocidade" | "lance_valor" | "insight" | "whatsapp";

interface Message {
  role: "bot" | "user";
  content: string;
  options?: { label: string; value: string }[];
}

const WHATSAPP_NUMBER = "5541997925357";

const AIChatbot = () => {
  const location = useLocation();
  const isIndicacoes = location.pathname.startsWith("/indicacoes") || location.pathname.startsWith("/parceiro");

  if (isIndicacoes) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [leadData, setLeadData] = useState({
    sonho: "",
    realidade: "",
    velocidade: "",
    origem: "Consultoria Inteligente SRV",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = (content: string, options?: { label: string; value: string }[], delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "bot", content, options }]);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setTimeout(() => {
        addBotMessage("Olá! Tudo bem? 👋\nEu sou o Jarvis, assistente virtual da equipe de especialistas.");
        setTimeout(() => {
          setStep("realidade");
          addBotMessage(
            "Para te ajudar de forma estratégica vamos traçar seu planejamento.\n\nAgora vamos entender, qual faixa de parcela mensal cabe de forma confortável no seu orçamento hoje?",
            [
              { label: "💵 Até R$ 500", value: "Até R$ 500" },
              { label: "💵 R$ 500 a R$ 1.000", value: "R$ 500 a R$ 1.000" },
              { label: "💵 R$ 1.000 a R$ 2.000", value: "R$ 1.000 a R$ 2.000" },
              { label: "💵 Acima de R$ 2.000", value: "Acima de R$ 2.000" },
            ]
          );
        }, 1000);
      }, 400);
    }
  };

  const handleOptionClick = (value: string, label: string) => {
    addUserMessage(label);

    switch (step) {
      case "realidade":
        setLeadData((prev) => ({ ...prev, realidade: value }));
        setTimeout(() => {
          setStep("velocidade");
          addBotMessage(
            "Vamos pensar já na sua contemplação como você pretende acelerar essa etapa?",
            [
              { label: "🚀 Ofertar um Lance", value: "Ofertar um Lance" },
              { label: "🎯 Usar Lance Fixo", value: "Usar Lance Fixo" },
              { label: "🎲 Apenas Sorteio", value: "Apenas Sorteio" },
            ]
          );
        }, 800);
        break;

      case "velocidade":
        if (value === "Ofertar um Lance") {
          setTimeout(() => {
            setStep("lance_valor");
            addBotMessage(
              "Ótimo! O lance é o acelerador ideal. E quanto você tem disponível hoje para dar de lance e acelerar o processo?",
              [
                { label: "💰 Até R$ 15.000", value: "Até R$ 15.000" },
                { label: "💰 R$ 15.000 a R$ 40.000", value: "R$ 15.000 a R$ 40.000" },
                { label: "💰 Acima de R$ 40.000", value: "Acima de R$ 40.000" },
                { label: "📊 Lance Embutido", value: "Lance Embutido" },
              ]
            );
          }, 800);
        } else {
          setLeadData((prev) => ({ ...prev, velocidade: value }));
          const finalVelocidade = value;
          setTimeout(() => {
            setStep("insight");
            setLeadData((prev) => {
              addBotMessage(
                `Maravilhoso! Com base nas suas respostas, montamos seu perfil de planejamento inteligente:\n\n` +
                `💰 **REALIDADE:** Parcela ${prev.realidade}\n` +
                `⚡ **VELOCIDADE:** ${finalVelocidade}\n\n` +
                `Já consegui traçar uma estratégia excelente para o seu perfil e encontrar os melhores grupos de consórcios.`
              );
              setTimeout(() => {
                setStep("whatsapp");
                addBotMessage(
                  "Agora, vou te conectar diretamente com um especialista no WhatsApp para te passar a simulação exata baseada nessas opções. Podemos prosseguir?",
                  [
                    { label: "✅ Sim, falar com especialista", value: "Sim" },
                    { label: "⏳ Ver depois", value: "Depois" },
                  ]
                );
              }, 2000);
              return prev;
            });
          }, 800);
        }
        break;

      case "lance_valor":
        const finalVel = value === "Lance Embutido" ? "Lance Embutido" : `Lance de ${value}`;
        setLeadData((prev) => ({ ...prev, velocidade: finalVel }));
        setTimeout(() => {
          setStep("insight");
          setLeadData((prev) => {
            addBotMessage(
              `Maravilhoso! Com base nas suas respostas, montamos seu perfil de planejamento inteligente:\n\n` +
              `💰 **REALIDADE:** Parcela ${prev.realidade}\n` +
              `⚡ **VELOCIDADE:** ${finalVel}\n\n` +
              `Já consegui traçar uma estratégia excelente para o seu perfil e encontrar os melhores grupos de consórcios.`
            );
            setTimeout(() => {
              setStep("whatsapp");
              addBotMessage(
                "Agora, vou te conectar diretamente com um especialista no WhatsApp para te passar a simulação exata baseada nessas opções. Podemos prosseguir?",
                [
                  { label: "✅ Sim, falar com especialista", value: "Sim" },
                  { label: "⏳ Ver depois", value: "Depois" },
                ]
              );
            }, 2000);
            return prev;
          });
        }, 800);
        break;

      case "whatsapp":
        if (value === "Sim" || value === "WhatsApp") {
          handleWhatsApp();
        } else {
          addBotMessage("Sem problemas! Quando estiver pronto, estarei por aqui. Tenha um ótimo dia! 👋");
          setTimeout(() => setIsOpen(false), 2000);
        }
        break;
    }
  };

  const handleSendValue = () => {
    // Esse formulário customizado de sonho não é mais alcançado no novo fluxo direto
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Olá! Completei o planejamento inteligente com o Jarvis no site e gostaria de uma simulação personalizada:\n\n` +
      `💰 *REALIDADE:* Parcela de ${leadData.realidade}\n` +
      `⚡ *VELOCIDADE:* ${leadData.velocidade}\n\n` +
      `Pode me ajudar a encontrar os melhores grupos de consórcio?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 group flex flex-col items-end gap-3">
          {/* Tooltip */}
          <div className="px-4 py-2 bg-foreground text-background text-[11px] font-bold rounded-xl shadow-xl border border-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none">
            Monta seu plano em 1 minuto
          </div>

          <button
            onClick={handleOpen}
            className="relative flex items-center gap-3 bg-foreground hover:bg-slate-900 text-background pl-1.5 pr-5 py-1.5 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 animate-scale-in overflow-hidden border border-white/10"
            aria-label="Falar com o Jarvis"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden relative">
              <JarvisAvatar className="w-full h-full" />
              <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-pulse" />
            </div>
            <span className="font-bold text-sm tracking-tight">Falar com o Jarvis</span>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-96 h-[520px] max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-scale-in border border-border">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 flex items-center gap-3 border-b border-white/5">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-cyan-500/30">
              <JarvisAvatar />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Jarvis AI</p>
              <p className="text-white/70 text-xs">Especialista Virtual</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-background p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content.split("\n").map((line, idx) => (
                    <span key={idx}>
                      {line}
                      {idx < msg.content.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-2xl px-4 py-2.5 text-sm rounded-bl-md flex gap-1">
                  <span className="dot w-1 h-1 bg-slate-400 rounded-full"></span>
                  <span className="dot w-1 h-1 bg-slate-400 rounded-full"></span>
                  <span className="dot w-1 h-1 bg-slate-400 rounded-full"></span>
                </div>
              </div>
            )}

            {/* Options */}
            {messages.length > 0 && messages[messages.length - 1].options && (
              <div className="flex flex-wrap gap-2 pl-1">
                {messages[messages.length - 1].options!.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionClick(opt.value, opt.label)}
                    className="px-4 py-2 rounded-full border border-violet-300 text-violet-700 dark:text-violet-300 dark:border-violet-500 text-sm font-medium hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* WhatsApp Quick Action (Optional, but keeping for UX) */}
            {step === "whatsapp" && messages[messages.length - 1].role === "bot" && (
              <div className="pt-2">
                <Button
                  onClick={handleWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-xl text-base shadow-lg shadow-green-900/20"
                >
                  💬 Falar com especialista agora
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input for open responses */}
          {showInput && (
            <div className="bg-background border-t border-border px-4 py-3 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendValue()}
                placeholder="Escreva aqui..."
                className="flex-1 bg-muted text-foreground rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 border-0"
                autoFocus
              />
              <button
                onClick={handleSendValue}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AIChatbot;
