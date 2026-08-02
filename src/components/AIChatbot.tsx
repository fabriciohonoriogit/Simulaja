import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, Send, Sparkles, Phone, MessageSquare, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import JarvisAvatar from "./JarvisAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Step = 
  | "welcome" 
  | "sonho" 
  | "realidade" 
  | "velocidade" 
  | "nome" 
  | "telefone" 
  | "final"
  | "parceiro_faq";

interface Message {
  role: "bot" | "user";
  content: string;
  options?: { label: string; value: string }[];
}

const WHATSAPP_NUMBER = "5541997925357";

const PARCEIRO_FAQ_OPTIONS = [
  { label: "❓ Afinal o que é o consórcio?", value: "o_que_e" },
  { label: "🏥 Que tipo de serviços?", value: "tipos_servicos" },
  { label: "💡 Como posso vender o consórcio?", value: "como_vender" },
  { label: "📊 Qual a diferença do consórcio para o financiamento?", value: "diferenca_financiamento" },
  { label: "🏆 Como posso ser contemplado?", value: "como_contemplar" },
  { label: "💬 Mais alguma dúvida? Fale com nosso especialista", value: "falar_especialista" },
];

const AIChatbot = () => {
  const location = useLocation();
  const { toast } = useToast();
  const isIndicacoes = location.pathname.startsWith("/indicacoes") || location.pathname.startsWith("/parceiro");

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
  const [showSpecialistButton, setShowSpecialistButton] = useState(false);

  const [leadData, setLeadData] = useState({
    sonho: "",
    realidade: "",
    velocidade: "",
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

  const addBotMessage = (content: string, options?: { label: string; value: string }[], delay = 700) => {
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
      if (isIndicacoes) {
        // FLUXO DO PARCEIRO / SIMULADOR EXTERNO (Perguntas e Respostas)
        setStep("parceiro_faq");
        setShowInput(false);
        setTimeout(() => {
          addBotMessage(
            "Olá, Parceiro(a)! 🚀 Bem-vindo ao Simulador de Indicações!\nEu sou o **Jarvis**, seu copiloto de vendas de consórcios. 🤖💡\n\n**Como posso ajudar você a fechar mais negócios hoje?** Escolha uma dúvida abaixo:",
            PARCEIRO_FAQ_OPTIONS
          );
        }, 300);
      } else {
        // FLUXO PÚBLICO (LANDING PAGE - METODOLOGIA SRV)
        setTimeout(() => {
          addBotMessage(
            "Olá! Seja muito bem-vindo(a)! 👋✨\nEu sou o **Jarvis**, seu consultor inteligente! 🤖\n\n**Qual é o seu sonho e como posso lhe ajudar hoje?** 💭"
          );
          setTimeout(() => {
            setStep("sonho");
            setShowInput(false);
            addBotMessage(
              "Selecione a categoria do seu objetivo para começarmos:",
              [
                { label: "🚗 CARRO", value: "CARRO" },
                { label: "🏍️ MOTO", value: "MOTO" },
                { label: "🏠 CASA / INVESTIMENTO", value: "CASA / INVESTIMENTO" },
                { label: "🚜 PESADOS / AGRO", value: "PESADOS / AGRO" },
                { label: "🏥 SERVIÇOS / CIRURGIA PLÁSTICA", value: "SERVIÇOS / CIRURGIA PLÁSTICA" },
              ]
            );
          }, 900);
        }, 300);
      }
    }
  };

  const handleOptionClick = (value: string, label: string) => {
    addUserMessage(label);

    // FLUXO PARCEIRO
    if (isIndicacoes) {
      switch (value) {
        case "o_que_e":
          addBotMessage(
            "**Consórcio é uma compra planejada de bens ou serviços.** 🛒🏠🚗\n\nVocê pode adquirir **Carro, moto, casa e/ou investimentos e alavancagem patrimonial** de forma inteligente e sem juros!",
            PARCEIRO_FAQ_OPTIONS
          );
          break;
        case "tipos_servicos":
          addBotMessage(
            "**Serviços abrange diversas categorias!** 🛠️✈️🏥\n\nVocê pode utilizar para **Reforma da casa, cirurgias plásticas, viagens, festas, cursos e outros.**",
            PARCEIRO_FAQ_OPTIONS
          );
          break;
        case "como_vender":
          addBotMessage(
            "**Você não vende o consórcio, você vende o sonho e a ideia!** 💡✨\n\nO consórcio é apenas a **ferramenta de aquisição**. Assim como ninguém vai ao banco querendo comprar um financiamento, mas sim o imóvel ou veículo, o consórcio é o formato inteligente de entrega.",
            PARCEIRO_FAQ_OPTIONS
          );
          break;
        case "diferenca_financiamento":
          addBotMessage(
            "**Consórcio x Financiamento:** 📊\n\n• **Consórcio:** É um planejamento, **não possui juros** (apenas uma taxa administrativa diluída) e a entrega pode acontecer a qualquer momento.\n• **Financiamento:** A entrega é imediata, porém possui **juros compostos** que podem encarecer até **3x mais** o valor do bem!",
            PARCEIRO_FAQ_OPTIONS
          );
          break;
        case "como_contemplar":
          addBotMessage(
            "**A contemplação acontece por Sorteio ou por Lances:** 🏆\n\n• **Sorteio:** Realizado mensalmente pela Loteria Federal.\n• **Lance Livre:** Com recursos próprios (dinheiro do bolso). Funciona como um leilão: as maiores ofertas levam o crédito.\n• **Lance Fixo:** Utilizar parte do próprio crédito (em média de 25% a 30% conforme o grupo). A contemplação no lance fixo é por aproximação do número sorteado.",
            PARCEIRO_FAQ_OPTIONS
          );
          break;
        case "falar_especialista":
          setShowSpecialistButton(true);
          addBotMessage(
            "Ficou com alguma dúvida específica sobre uma simulação, cota ou comissão? 🤝\n\nClique no botão abaixo para conversar diretamente com nosso **Especialista de Suporte ao Parceiro** pelo WhatsApp!",
            PARCEIRO_FAQ_OPTIONS
          );
          break;
        default:
          addBotMessage("Escolha uma das opções acima para visualizar a explicação completa:", PARCEIRO_FAQ_OPTIONS);
      }
      return;
    }

    // FLUXO PÚBLICO (SRV)
    switch (step) {
      case "sonho": {
        setLeadData((prev) => ({ ...prev, sonho: value }));
        setStep("realidade");
        setShowInput(false);
        setTimeout(() => {
          addBotMessage(
            `Incrível! 🎯 **${value}** é um excelente objetivo!\n\nNa etapa de **Realidade 📊**:\n**Possui Recursos Próprios, FGTS ou outro recurso para dar de lance? Vai usar o lance fixo da carta ou preferir usar o sorteio?** 💰`,
            [
              { label: "💵 Recursos Próprios", value: "Recursos Próprios" },
              { label: "📄 Usar FGTS", value: "Usar FGTS" },
              { label: "💥 Recursos Próprios + FGTS", value: "Recursos Próprios + FGTS" },
              { label: "📌 Usar Lance Fixo da Carta", value: "Usar Lance Fixo da Carta" },
              { label: "🎲 Preferir usar Sorteio", value: "Preferir usar Sorteio" },
            ]
          );
        }, 600);
        break;
      }

      case "realidade": {
        setLeadData((prev) => ({ ...prev, realidade: value }));
        setStep("velocidade");
        setShowInput(false);
        setTimeout(() => {
          addBotMessage(
            `Perfeito! Mapeamos que você pretende utilizar: **${value}** ⚡🎯\n\nAgora vamos alinhar a sua **Velocidade 🚀**:\n**Seu planejamento é a curto, médio ou longo prazo? Qual a urgência da entrega?** ⏱️`,
            [
              { label: "⚡ Curto Prazo (Urgência Imediata)", value: "Curto Prazo (Urgência Imediata)" },
              { label: "⏳ Médio Prazo (Planejamento Progressivo)", value: "Médio Prazo (Planejamento Progressivo)" },
              { label: "🎯 Longo Prazo (Construção Patrimonial)", value: "Longo Prazo (Construção Patrimonial)" },
            ]
          );
        }, 600);
        break;
      }

      case "velocidade": {
        setLeadData((prev) => ({ ...prev, velocidade: value }));
        setStep("nome");
        setShowInput(true);
        setInputPlaceholder("Digite seu nome completo...");
        setTimeout(() => {
          addBotMessage(
            `Ótimo! Mapeei a melhor estratégia SRV para o seu perfil! 📋✨\n\nPara eu personalizar sua proposta:\n**Qual o seu Nome?** 👤`
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

    if (step === "nome") {
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
          `Muito obrigado, **${updatedLead.nome}**! 🙏✨\n\n**Em segundos retornaremos com a melhor proposta!** 🚀🔥\n\nResumo do seu planejamento **SRV**:\n💭 **Sonho:** ${updatedLead.sonho}\n📊 **Realidade (Lance/Recursos):** ${updatedLead.realidade}\n⚡ **Velocidade (Prazo/Urgência):** ${updatedLead.velocidade}\n\nNosso consultor sênior já está selecionando as melhores cotas para você!`
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
        observacao: `SRV -> Sonho: ${currentLead.sonho} | Realidade (Lance/Recursos): ${currentLead.realidade} | Velocidade (Prazo/Urgência): ${currentLead.velocidade}`,
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

  const handleWhatsAppLead = () => {
    const msg = encodeURIComponent(
      `Olá! Fiz minha consultoria SRV com o Jarvis no site e quero receber a minha proposta personalizada:\n\n` +
      `👤 *Nome:* ${leadData.nome}\n` +
      `📱 *Telefone:* ${leadData.telefone}\n` +
      `💭 *Sonho:* ${leadData.sonho}\n` +
      `📊 *Realidade (Lance/Recursos):* ${leadData.realidade}\n` +
      `⚡ *Velocidade (Prazo/Urgência):* ${leadData.velocidade}\n\n` +
      `Pode me enviar as melhores opções disponíveis?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  const handleWhatsAppPartnerSpecialist = () => {
    const msg = encodeURIComponent(
      `Olá! Sou parceiro/indicador no Simulador Externo e gostaria de tirar uma dúvida sobre consórcio com o especialista.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 group flex flex-col items-end gap-2">
          {/* Tooltip Badge */}
          <div className="px-3 py-1 bg-slate-900/90 text-slate-200 text-[11px] font-medium rounded-lg shadow-xl border border-slate-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>
              {isIndicacoes ? "Ajuda ao Parceiro" : "Consultoria de Consórcio"}
            </span>
          </div>

          <button
            onClick={handleOpen}
            className="flex items-center gap-2.5 bg-slate-950/90 hover:bg-slate-900 text-white pl-1.5 pr-4 py-1.5 rounded-full shadow-lg hover:shadow-cyan-500/10 border border-slate-700/80 hover:border-cyan-500/50 transition-all duration-200 backdrop-blur-md"
            aria-label="Falar com o Jarvis"
          >
            <JarvisAvatar className="w-8 h-8" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-xs tracking-tight text-slate-100 flex items-center gap-1">
                Falar com Jarvis <Sparkles className="w-3 h-3 text-cyan-400" />
              </span>
              <span className="text-[9px] text-slate-400 font-medium">
                {isIndicacoes ? "Dúvidas Rápidas" : "Assistente IA"}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-96 h-[560px] max-h-[84vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-scale-in border border-slate-700/80 bg-slate-950 text-white">
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
                  {isIndicacoes ? "PARCEIRO" : "SRV"}
                </span>
              </div>
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isIndicacoes ? "Guia & Treinamento de Vendas" : "Sonho • Realidade • Velocidade"}
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
                    <span className="pr-2">{opt.label}</span>
                    <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">➔</span>
                  </button>
                ))}
              </div>
            )}

            {/* WhatsApp Public Lead Action */}
            {!isIndicacoes && step === "final" && !isTyping && (
              <div className="pt-2 animate-fade-in">
                <Button
                  onClick={handleWhatsAppLead}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-xl text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 border border-emerald-400/30"
                >
                  <Phone className="w-4 h-4 fill-white" />
                  Receber Proposta no WhatsApp Agora
                </Button>
              </div>
            )}

            {/* WhatsApp Partner Specialist Action */}
            {isIndicacoes && showSpecialistButton && !isTyping && (
              <div className="pt-2 animate-fade-in">
                <Button
                  onClick={handleWhatsAppPartnerSpecialist}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-xl text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 border border-emerald-400/30"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  Falar com nosso Especialista no WhatsApp
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Text Input Footer (Only in Public SRV Mode for Nome / Telefone) */}
          {!isIndicacoes && (showInput || step === "nome" || step === "telefone") && (
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
