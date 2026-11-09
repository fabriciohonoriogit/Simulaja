import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  Bot,
  Sparkles,
  Send,
  MessageSquare,
  Zap,
  Target,
  Flame,
  Shield,
  TrendingUp,
  Cpu,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Copy,
  ExternalLink,
  Layers,
  ArrowRight,
  CornerDownLeft,
  X,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { JARVIS_SQUAD, JarvisAgent, AgentDivision } from "@/data/jarvisSquad";
import { aiService } from "@/services/aiService";
import { speakJarvisText, stopVoice } from "@/lib/voiceService";

interface SquadChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  time: string;
  specialistName?: string;
}

export default function JarvisSquadPage() {
  const [selectedDivision, setSelectedDivision] = useState<AgentDivision | "todos">("todos");
  const [activeSpecialist, setActiveSpecialist] = useState<JarvisAgent>(JARVIS_SQUAD[0]);
  const [messages, setMessages] = useState<Record<string, SquadChatMessage[]>>({});
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Filtra especialistas por divisão
  const filteredSquad = JARVIS_SQUAD.filter(
    (agent) => selectedDivision === "todos" || agent.division === selectedDivision
  );

  // Mensagens do especialista ativo
  const activeChat = messages[activeSpecialist.id] || [
    {
      id: "initial",
      sender: "agent",
      text: `Olá, Fabrício! Sou o **${activeSpecialist.name}**, especialista em **${activeSpecialist.title}** focado em Consórcios e Vendas de Alta Performance.\n\nMinha missão no CRM: *${activeSpecialist.description}*\n\nComo posso acelerar sua produção hoje? Escolha um dos prompts rápidos abaixo ou me envie sua dúvida diretamente!`,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      specialistName: activeSpecialist.name,
    },
  ];

  // Auto-scroll
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeChat, isProcessing]);

  // Enviar mensagem para o especialista ativo
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isProcessing) return;

    const userMsg: SquadChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => ({
      ...prev,
      [activeSpecialist.id]: [...(prev[activeSpecialist.id] || activeChat), userMsg],
    }));

    if (!customPrompt) setInputText("");
    setIsProcessing(true);

    try {
      const history = (messages[activeSpecialist.id] || []).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      }));

      const res = await aiService.askSquadSpecialist(
        activeSpecialist.id,
        textToSend,
        history,
        "Fabrício"
      );

      const agentMsg: SquadChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: res.answer,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        specialistName: activeSpecialist.name,
      };

      setMessages((prev) => ({
        ...prev,
        [activeSpecialist.id]: [...(prev[activeSpecialist.id] || []), agentMsg],
      }));

      if (voiceEnabled) {
        speakJarvisText(res.answer.slice(0, 300));
      }
    } catch (err: any) {
      toast.error(`Erro ao consultar especialista: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Resposta copiada para a área de transferência!");
  };

  // Prompts rápidos de demonstração por especialista
  const getSpecialistQuickPrompts = (agent: JarvisAgent): string[] => {
    switch (agent.id) {
      case "sdr_qualificador":
        return [
          "Como qualificar no WhatsApp um lead de caminhão sem parecer invasivo?",
          "Crie uma abordagem em 3 perguntas para descobrir a faixa de parcela confortável do lead.",
          "O lead disse que tem pressa para adquirir o bem. Qual a melhor resposta?",
        ];
      case "closer_negociador":
        return [
          "Compare um consórcio imobiliário de R$ 500k vs financiamento Caixa SAC em 35 anos.",
          "Como quebrar a objeção 'consórcio demora muito e não sei quando serei contemplado'?",
          "Apresente a estratégia de Lance Embutido de 30% para acelerar a retirada do crédito.",
        ];
      case "reativador_leads":
        return [
          "Crie um e-mail/WhatsApp de 9 palavras (Dean Jackson) para reativar um lead sumido há 12 dias.",
          "Crie uma mensagem usando o gancho da assembleia desta semana do Consórcio Magalu.",
          "Como reabrir diálogo com um lead que cancelou a reunião de apresentação?",
        ];
      case "copywriter_conversao":
        return [
          "Escreva um post magnético para Instagram sobre compra de imóvel com custo de 1,2% a.a.",
          "Roteiro de 3 Stories interativos com enquete sobre alavancagem de frotas.",
          "Copy de alta conversão para disparo de WhatsApp de meio de mês.",
        ];
      case "estrategista_campanhas":
        return [
          "Estruture a campanha de vendas para a semana da assembleia de Novembro.",
          "Como aproveitar a sazonalidade do 13º salário para vender consórcio de investimento?",
          "Calendário de 4 semanas para aquecer leads frios até o sorteio da Loteria Federal.",
        ];
      case "analista_fpa":
        return [
          "Explique com números simples por que a taxa de administração do consórcio é infinitamente mais barata que juros bancários.",
          "Como calcular a projeção de comissões do gestor para meta mensal de R$ 500k em cotas?",
          "Qual o impacto do reajuste do INCC na cota imobiliária e como explicar isso como benefício patrimonial?",
        ];
      case "guardiao_retencao":
        return [
          "Como abordar um cliente com parcela a vencer hoje para enviar a 2ª via do boleto de forma amigável?",
          "O que dizer ao cliente que está no 5º mês sem contemplação e pensa em cancelar a cota?",
          "Script preventivo pré-assembleia para alinhar expectativas e manter o cliente engajado.",
        ];
      case "coach_gamificacao":
        return [
          "Defina 3 missões diárias de alto impacto para bater a meta de fechamento hoje.",
          "Como manter o foco e a energia alta em dias de baixa conversão no funil?",
          "Crie um desafio comercial de 48 horas para movimentar todas as oportunidades da coluna Morno.",
        ];
      case "auditor_qualidade":
        return [
          "Quais critérios checar antes de submeter uma proposta de consórcio para evitar pendências no portal?",
          "Como auditar a higienização da base de contatos para maximizar entregabilidade no WhatsApp e e-mail?",
          "Checklist de consistência para cartas de crédito contempladas e ágio.",
        ];
      case "engenheiro_frontend":
        return [
          "Como tornar o formulário de simulação do site ainda mais intuitivo e rápido para o cliente?",
          "Ideias de melhoria visual e micro-interações para a visualização de cartas de crédito.",
          "Como destacar a economia real do consórcio em dispositivos móveis.",
        ];
      default:
        return [
          "Qual a melhor estratégia para o momento atual do mercado de consórcios?",
          "Como posicionar o Consórcio Magalu com vantagem imbatível perante os grandes bancos?",
          "Me dê um conselho estratégico para acelerar o fechamento de vendas nesta semana.",
        ];
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* HEADER DA PÁGINA */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-950/50">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Jarvis Squad</h1>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold">
                11 Especialistas Ativos 🟢
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Esquadrão Executivo de Especialistas de IA altamente capacitados em Consórcios, Vendas, Retenção e Estratégia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`border-slate-800 text-xs gap-1.5 ${
              voiceEnabled ? "bg-indigo-950/60 text-indigo-300 border-indigo-700/50" : "bg-slate-900 text-slate-400"
            }`}
          >
            <Volume2 className={`h-3.5 w-3.5 ${voiceEnabled ? "text-indigo-400 animate-pulse" : "text-slate-500"}`} />
            Voz do Jarvis: {voiceEnabled ? "Ligada" : "Muda"}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              stopVoice();
              setMessages({});
              toast.info("Históricos de conversas reiniciados.");
            }}
            variant="ghost"
            className="text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Limpar Conversas
          </Button>
        </div>
      </div>

      {/* FILTRO DE DIVISÕES */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {[
          { id: "todos", label: "Todos os Especialistas (11)", icon: Users },
          { id: "vendas", label: "Vendas & Negociação (3)", icon: Target },
          { id: "marketing", label: "Marketing & Copywriting (2)", icon: Sparkles },
          { id: "financeiro", label: "Financeiro & Retenção (2)", icon: TrendingUp },
          { id: "estrategia", label: "Estratégia & Coaching (2)", icon: Zap },
          { id: "tecnologia", label: "Tecnologia & Qualidade (2)", icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedDivision === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedDivision(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/60 scale-[1.02]"
                  : "bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* GRID PRINCIPAL: LISTA DE AGENTES (ESQUERDA) + CHAT INTERATIVO (DIREITA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: CARDS DOS ESPECIALISTAS (5 COLUNAS) */}
        <div className="lg:col-span-5 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {filteredSquad.map((agent) => {
            const isSelected = activeSpecialist.id === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => {
                  setActiveSpecialist(agent);
                  stopVoice();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? "bg-gradient-to-r from-indigo-950/80 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50"
                    : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-850/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 border border-white/10 shadow-md"
                    style={{ backgroundColor: `${agent.color}25` }}
                  >
                    {agent.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                        {agent.name}
                        {isSelected && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0 border-slate-700 text-slate-300 shrink-0"
                      >
                        {agent.division}
                      </Badge>
                    </div>

                    <p className="text-xs text-indigo-300 font-medium truncate mt-0.5">{agent.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {agent.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[200px]">📍 {agent.crmTouchpoint.split("/")[0]}</span>
                      <span className="text-indigo-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        Conversar <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* COLUNA DIREITA: SALA DE OPERAÇÃO & CHAT DO ESPECIALISTA SELECIONADO (7 COLUNAS) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-220px)] shadow-2xl">
          {/* TOPO DO CHAT COM PERFIL DO AGENTE */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-white/10"
                style={{ backgroundColor: `${activeSpecialist.color}30` }}
              >
                {activeSpecialist.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm sm:text-base text-white">{activeSpecialist.name}</h2>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                    Especialista em Consórcio
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">
                  {activeSpecialist.title} • {activeSpecialist.vibe}
                </p>
              </div>
            </div>

            <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-400 hidden sm:inline-flex">
              {activeSpecialist.division.toUpperCase()}
            </Badge>
          </div>

          {/* CAPACIDADES & REGRAS DO ESPECIALISTA */}
          <div className="bg-slate-950/70 p-2.5 px-4 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 overflow-x-auto">
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-bold text-slate-300">Capacidades:</span>
              {activeSpecialist.capabilities.slice(0, 2).map((cap, idx) => (
                <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-[10px] text-slate-300">
                  ✓ {cap}
                </span>
              ))}
            </div>
            <span className="text-[10px] font-mono text-cyan-400 shrink-0 ml-2">Base Magalu 2026</span>
          </div>

          {/* STREAM DE MENSAGENS */}
          <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/50">
            {activeChat.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 shadow-lg ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1">
                        <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                          {activeSpecialist.emoji} {activeSpecialist.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(msg.text)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copiar resposta"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                      {msg.text}
                    </div>

                    <div
                      className={`text-[10px] text-right font-mono ${
                        isUser ? "text-indigo-200" : "text-slate-500"
                      }`}
                    >
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none p-3.5 flex items-center gap-2 text-xs text-indigo-400">
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-ping"></div>
                  <span>{activeSpecialist.name} está analisando os dados e formulando a estratégia...</span>
                </div>
              </div>
            )}
          </div>

          {/* PROMPTS RÁPIDOS SUGERIDOS PARA ESTE AGENTE */}
          <div className="p-2.5 bg-slate-900/95 border-t border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-400" /> Ações Prontas Recomendadas para {activeSpecialist.name}:
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {getSpecialistQuickPrompts(activeSpecialist).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isProcessing}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
                >
                  <ArrowRight className="h-2.5 w-2.5 text-indigo-400" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* BARRA DE INPUT E DISPARO */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Pergunte algo ou solicite uma ação para ${activeSpecialist.name}...`}
                disabled={isProcessing}
                className="bg-slate-950 border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-indigo-500"
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 px-4 shrink-0 gap-1.5 shadow-lg shadow-indigo-950/60"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Enviar</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
