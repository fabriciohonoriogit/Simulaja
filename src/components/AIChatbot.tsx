import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, Send, Sparkles, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import JarvisAvatar from "./JarvisAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Step = "welcome" | "sonho" | "velocidade" | "realidade" | "nome" | "telefone" | "final";

interface Message {
  role: "bot" | "user";
  content: string;
  options?: { label: string; value: string }[];
}

const WHATSAPP_NUMBER = "5541997925357";

const AIChatbot = () => {
  const location = useLocation();
  const { toast } = useToast();
  const isIndicacoes = location.pathname.startsWith("/indicacoes") || location.pathname.startsWith("/parceiro");

  if (isIndicacoes) {
    return null;
  }

  // Captura organizacao_id da URL (caso acessado via Link de Operação do CRM)
  const searchParams = new URLSearchParams(window.location.search);
  const orgParam = searchParams.get("org") || searchParams.get("organizacao_id") || undefined;
  const autoOpenParam = searchParams.get("srv") === "true" || searchParams.get("open_jarvis") === "true";

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState("Escreva sua resposta...");
  const [isTyping, setIsTyping] = useState(false);
  const [leadData, setLeadData] = useState({
    sonho: "",
    velocidade: "",
    realidade: "",
    nome: "",
    telefone: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoOpenParam && !isOpen && messages.length === 0) {
      const timer = setTimeout(() => {
        handleOpen();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoOpenParam]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addBotMessage = (content: string, options?: { label: string; value: string }[], delay = 800) => {
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
        addBotMessage(
          "Olá! Tudo bem? 👋\nEu sou o **Jarvis**, seu consultor inteligente! 🤖✨\n\nVamos traçar o seu planejamento estratégico usando a metodologia **SRV (Sonho, Realidade e Velocidade)** 🚀."
        );
        setTimeout(() => {
          setStep("sonho");
          setShowInput(false);
          addBotMessage(
            "Para começarmos: **Qual é o seu Sonho hoje?** 💭",
            [
              { label: "🏠 IMÓVEL", value: "IMÓVEL" },
              { label: "🚗 CARRO / MOTO", value: "CARRO / MOTO" },
              { label: "🚜 PESADOS / AGRÍCOLA", value: "PESADOS / AGRÍCOLA" },
              { label: "🏥 SERVIÇOS / CIRURGIA", value: "SERVIÇOS / CIRURGIA" },
            ]
          );
        }, 1000);
      }, 300);
    }
  };

  const handleOptionClick = (value: string, label: string) => {
    addUserMessage(label);

    switch (step) {
      case "sonho": {
        setLeadData((prev) => ({ ...prev, sonho: value }));
        setStep("velocidade");
        setShowInput(false);
        setTimeout(() => {
          addBotMessage(
            `Incrível! 🎯 **${value}** é um excelente objetivo!\n\nNa etapa de **Velocidade ⚡**:\n**Tem algum recurso para dar de lance, ou FGTS?** 💰`,
            [
              { label: "💵 Recursos Próprios", value: "Recursos Próprios" },
              { label: "📄 Usar FGTS", value: "Usar FGTS" },
              { label: "💥 Recursos + FGTS", value: "Recursos + FGTS" },
              { label: "🎲 Apenas Sorteio", value: "Apenas Sorteio" },
            ]
          );
        }, 600);
        break;
      }

      case "velocidade": {
        setLeadData((prev) => ({ ...prev, velocidade: value }));
        setStep("realidade");
        setShowInput(true);
        setInputPlaceholder("Ou digite um valor de parcela...");
        setTimeout(() => {
          addBotMessage(
            `Perfeito! O planejamento de contemplação com **${value}** acelera muito o resultado! ⚡🎯\n\nAgora vamos alinhar a sua **Realidade 📊**:\n**Que valor de parcela ficaria bom para você?** 💳`,
            [
              { label: "💵 Até R$ 500/mês", value: "Até R$ 500/mês" },
              { label: "💵 R$ 500 a R$ 1.000/mês", value: "R$ 500 a R$ 1.000/mês" },
              { label: "💵 R$ 1.000 a R$ 2.500/mês", value: "R$ 1.000 a R$ 2.500/mês" },
              { label: "💵 R$ 2.500 a R$ 5.000/mês", value: "R$ 2.500 a R$ 5.000/mês" },
              { label: "💵 Acima de R$ 5.000/mês", value: "Acima de R$ 5.000/mês" },
            ]
          );
        }, 600);
        break;
      }

      case "realidade": {
        setLeadData((prev) => ({ ...prev, realidade: value }));
        setStep("nome");
        setShowInput(true);
        setInputPlaceholder("Digite seu nome completo...");
        setTimeout(() => {
          addBotMessage(
            `Ótimo! Já mapeei a melhor estratégia SRV para o seu perfil! 📋✨\n\nPara eu personalizar sua proposta:\n**Qual o seu Nome?** 👤`
          );
        }, 600);
        break;
      }
    }
  };

  const handleSendText = () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue("");

    addUserMessage(text);

    if (step === "realidade") {
      setLeadData((prev) => ({ ...prev, realidade: text }));
      setStep("nome");
      setShowInput(true);
      setInputPlaceholder("Digite seu nome completo...");
      setTimeout(() => {
        addBotMessage(
          `Ótimo! Mapeei essa parcela ideal para você. 📋✨\n\nPara eu personalizar a proposta:\n**Qual o seu Nome?** 👤`
        );
      }, 600);
    } else if (step === "nome") {
      const nomeDigitado = text;
      setLeadData((prev) => ({ ...prev, nome: nomeDigitado }));
      setStep("telefone");
      setShowInput(true);
      setInputPlaceholder("(00) 00000-0000");
      setTimeout(() => {
        addBotMessage(
          `Prazer em te conhecer, **${nomeDigitado}**! 😊\n\nPara enviarmos a proposta completa com os melhores grupos:\n**Qual o seu Telefone com DDD?** 📱`
        );
      }, 600);
    } else if (step === "telefone") {
      const telefoneDigitado = text;
      const updatedLead = { ...leadData, telefone: telefoneDigitado };
      setLeadData(updatedLead);
      setStep("final");
      setShowInput(false);

      // Salvar lead no Supabase CRM
      saveLeadToCrm(updatedLead.nome, telefoneDigitado, updatedLead);

      setTimeout(() => {
        addBotMessage(
          `Muito obrigado, **${updatedLead.nome}**! 🙏✨\n\n**Em segundos retornaremos com a melhor proposta!** 🚀🔥\n\nSummary do seu planejamento **SRV**:\n💭 **Sonho:** ${updatedLead.sonho}\n⚡ **Velocidade:** ${updatedLead.velocidade}\n📊 **Realidade (Parcela):** ${updatedLead.realidade}\n\nNosso consultor sênior já está selecionando as melhores cotas para você!`
        );
      }, 600);
    }
  };

  const formatPhoneInput = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length <= 2) return digits ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (step === "telefone") {
      setInputValue(formatPhoneInput(val));
    } else {
      setInputValue(val);
    }
  };

  const saveLeadToCrm = async (nome: string, telefone: string, currentLead: typeof leadData) => {
    try {
      const rawPhone = telefone.replace(/\D/g, "");
      const { error } = await (supabase.from("leads") as any).insert({
        nome: nome.trim(),
        celular: rawPhone,
        tipo_consorcio: currentLead.sonho,
        status: "novo_lead",
        lead_temperatura: "quente",
        organizacao_id: orgParam || null,
        origem: "Operação Jarvis SRV",
        observacao: `SRV -> Sonho: ${currentLead.sonho} | Velocidade (Lance/FGTS): ${currentLead.velocidade} | Realidade (Parcela): ${currentLead.realidade}`,
      });

      if (error) {
        console.error("Erro ao registrar lead do Jarvis:", error);
      } else {
        toast({ title: "✅ Proposta registrada no CRM!", description: "Lead salvo na Operação Jarvis SRV." });
      }
    } catch (err) {
      console.error("Exceção ao salvar lead:", err);
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Olá! Fiz minha consultoria SRV com o Jarvis no site e quero receber a minha proposta personalizada:\n\n` +
      `👤 *Nome:* ${leadData.nome}\n` +
      `📱 *Telefone:* ${leadData.telefone}\n` +
      `💭 *Sonho:* ${leadData.sonho}\n` +
      `⚡ *Velocidade (Lance/FGTS):* ${leadData.velocidade}\n` +
      `📊 *Realidade (Parcela):* ${leadData.realidade}\n\n` +
      `Pode me enviar as melhores opções disponíveis?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 group flex flex-col items-end gap-3">
          {/* Tooltip Badge */}
          <div className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl border border-cyan-500/30 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Consultoria SRV Inteligente 🚀</span>
          </div>

          <button
            onClick={handleOpen}
            className="relative flex items-center gap-3 bg-slate-950 hover:bg-slate-900 text-white pl-2 pr-5 py-2 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border border-cyan-500/40"
            aria-label="Falar com o Jarvis"
          >
            <div className="w-11 h-11 rounded-full overflow-hidden relative border border-cyan-400/50">
              <JarvisAvatar className="w-full h-full" />
              <span className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
                Falar com o Jarvis <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <span className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider">Metodologia SRV</span>
            </div>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-96 h-[540px] max-h-[82vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-scale-in border border-slate-700/80 bg-slate-950 text-white">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-3.5 flex items-center gap-3 border-b border-cyan-500/20">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-cyan-400/40 relative">
              <JarvisAvatar />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-white font-bold text-sm">Jarvis AI</p>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                  SRV
                </span>
              </div>
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sonho • Realidade • Velocidade
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors rounded-full p-1.5 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-900/60 backdrop-blur-sm">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none font-medium"
                      : "bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none"
                  }`}
                >
                  {msg.content.split("\n").map((line, idx) => {
                    // Trata negrito simples **texto**
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <span key={idx} className="block min-h-[1rem]">
                        {parts.map((part, pIdx) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return (
                              <strong key={pIdx} className="font-bold text-cyan-300">
                                {part.slice(2, -2)}
                              </strong>
                            );
                          }
                          return part;
                        })}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-cyan-400 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs rounded-bl-none flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></span>
                  <span className="ml-1 text-slate-400 font-mono text-[11px]">Jarvis está digitando...</span>
                </div>
              </div>
            )}

            {/* Option Buttons */}
            {messages.length > 0 && messages[messages.length - 1].options && !isTyping && (
              <div className="flex flex-col gap-2 pt-1 pl-1">
                {messages[messages.length - 1].options!.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionClick(opt.value, opt.label)}
                    className="w-full text-left px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-slate-800/80 hover:bg-cyan-950/60 hover:border-cyan-400 text-cyan-100 text-xs font-semibold transition-all duration-200 shadow-md hover:translate-x-1 flex items-center justify-between group"
                  >
                    <span>{opt.label}</span>
                    <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">➔</span>
                  </button>
                ))}
              </div>
            )}

            {/* WhatsApp Final Action */}
            {step === "final" && !isTyping && (
              <div className="pt-2 animate-fade-in">
                <Button
                  onClick={handleWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-xl text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 border border-emerald-400/30"
                >
                  <Phone className="w-4 h-4 fill-white" />
                  Receber Proposta no WhatsApp Agora
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Text Input Footer */}
          {(showInput || step === "nome" || step === "telefone" || step === "realidade") && (
            <div className="bg-slate-950 border-t border-slate-800 px-3 py-3 flex gap-2 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                placeholder={inputPlaceholder}
                className="flex-1 bg-slate-900 text-white text-xs rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-800 placeholder:text-slate-500"
                autoFocus
              />
              <button
                onClick={handleSendText}
                disabled={!inputValue.trim()}
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-40 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-md flex-shrink-0"
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

