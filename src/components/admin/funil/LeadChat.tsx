import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  ChevronUp, 
  ChevronDown, 
  ExternalLink,
  Copy,
  Sparkles,
  Mic,
  Zap,
  Phone,
  Check,
  CheckCheck,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  X
} from "lucide-react";
import { WhatsAppIcon, TelegramIcon } from "@/components/SocialIcons";
import { format, isValid, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseUTCDate } from "@/lib/formatters";
import { Lead } from "@/types/funil";
import { obterSaudacaoTempo, ajustarSaudacaoPorHorario } from "@/lib/timeGreeting";
import { toast } from "sonner";
import { 
  sendWhatsAppMessage, 
  getWhatsAppMode, 
  saveWhatsAppMode,
  getWhatsAppWebUrl, 
  getWhatsAppDirectUrl,
  formatWhatsAppNumber,
  type WhatsAppMode
} from "@/services/evolutionApiService";
import { generateBudgetProposal } from "@/services/proposalService";
import { formatCurrency, cn } from "@/lib/utils";

interface Message {
  id: string;
  lead_id: string;
  sender: 'client' | 'ai' | 'agent';
  content: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'read';
}

// Templates Rápidos de Alta Conversão de Consórcio
interface QuickTemplate {
  id: string;
  title: string;
  category: "apresentacao" | "lance" | "documentos" | "followup" | "contemplacao" | "cobranca";
  badge: string;
  text: string;
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: "black-das-blacks-magalu",
    title: "⭐ Black das Blacks - Consórcio Magalu (Oficial)",
    category: "apresentacao",
    badge: "Black das Blacks",
    text: `Olá, {saudacao}! Tudo bem?

Aqui é o Fabricio Honório, sou gestor aqui do Consórcio Magalu em Paranaguá.

Estou entrando em contato porque estamos com a Black das Blacks, com nossas condições especiais, e acredito que pode fazer sentido para vocês, seja para renovar frota, adquirir equipamentos, imóveis ou qualquer outro investimento sem precisar pagar juros de capital de giro.

Posso te explicar em 5 minutinhos como funciona? Se fizer sentido, ótimo. Se não, sem problema nenhum. 🙂`,
  },
  {
    id: "apresentacao-1",
    title: "Apresentação & Simulação Personalizada",
    category: "apresentacao",
    badge: "Primeiro Contato",
    text: "Olá, {nome}! Tudo bem? Sou o especialista em consórcios aqui da equipe. Preparei uma simulação exclusiva para o crédito de {credito} com parcelas reduzidas e sem juros bancários. Posso te enviar os detalhes rapidinho?"
  },
  {
    id: "lance-1",
    title: "Estratégia de Lance Embutido",
    category: "lance",
    badge: "Assembleia",
    text: "Oi, {nome}! Nossa assembleia mensal está se aproximando. Calculei uma estratégia de lance embutido de até 30% para a sua cota de {credito}, onde você antecipa a contemplação sem tirar dinheiro do bolso. Quer ver como fica a projeção?"
  },
  {
    id: "documentos-1",
    title: "Documentos para Emissão de Contrato",
    category: "documentos",
    badge: "Fechamento",
    text: "Olá, {nome}! Para formalizarmos a reserva da sua cota de {credito} e garantir as taxas promocionais deste mês, preciso apenas de uma foto do seu RG/CNH e comprovante de endereço. Você consegue me mandar por aqui?"
  },
  {
    id: "followup-1",
    title: "Follow-up Humanizado (Jarvis)",
    category: "followup",
    badge: "Lembrete",
    text: "Oi, {nome}! Passei para te poupar tempo e saber se você conseguiu dar uma olhadinha na simulação que conversamos. Ficou alguma dúvida sobre o valor das parcelas ou sobre as datas de assembleia?"
  },
  {
    id: "contemplacao-1",
    title: "Parabéns por Contemplação",
    category: "contemplacao",
    badge: "Vitória",
    text: "🎉 PARABÉNS, {nome}! Excelente notícia: sua cota de consórcio foi CONTEMPLADA! Seu crédito de {credito} já está disponível para aquisição. Seguem as primeiras orientações para o faturamento do seu bem!"
  },
  {
    id: "boleto-1",
    title: "Segunda Via / Código do Boleto",
    category: "cobranca",
    badge: "Conveniência",
    text: "Olá, {nome}! Para facilitar o seu dia e evitar filas, já acessei o sistema e estou te enviando o código para pagamento da parcela do seu consórcio que vence hoje. Qualquer dúvida, estou à disposição!"
  }
];

export function LeadChat({ lead, className }: { lead: Lead; className?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(lead.atendimento_ia !== false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAudioHelper, setShowAudioHelper] = useState(false);
  const [waMode, setWaMode] = useState<WhatsAppMode>(() => getWhatsAppMode());
  const scrollRef = useRef<HTMLDivElement>(null);

  const targetPhone = lead.celular || (lead as any).telefone || "";
  const formattedCredito = lead.valor_credito ? formatCurrency(Number(lead.valor_credito)) : "R$ 100.000,00";

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel(`chat-${lead.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `lead_id=eq.${lead.id}` },
        (payload) => {
          const raw = payload.new as any;
          const msg: Message = {
            ...raw,
            sender: raw.sender || (raw.role === 'user' || raw.role === 'client' ? 'client' : raw.role === 'ai' || raw.role === 'assistant' ? 'ai' : 'agent'),
            status: 'read'
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            // Deduplica mensagem temporária otimista (temp_...)
            const tempIndex = prev.findIndex(
              (m) => m.id.startsWith("temp_") && m.content?.trim() === msg.content?.trim()
            );
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = msg;
              return updated;
            }
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    // Polling automático de fallback para sincronia em tempo real
    const pollInterval = setInterval(() => {
      fetchMessages(true);
    }, 3500);

    return () => {
      supabase.removeChannel(subscription);
      clearInterval(pollInterval);
    };
  }, [lead.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchMessages(silent = false) {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const formatted = (data as any[]).map((msg) => ({
        ...msg,
        sender: msg.sender ? msg.sender : (msg.role === 'user' || msg.role === 'client' ? 'client' : msg.role === 'agent' ? 'agent' : 'ai'),
        status: 'read'
      }));

      // Filtra mensagens repetidas (mesmo conteúdo e emissor gravadas em intervalo de até 15s)
      const deduplicated: Message[] = [];
      for (const m of formatted) {
        // Blindagem contra contaminação cruzada (ex: mensagem direcionada a Nardo vinculada por engano na Karina)
        if (lead.nome?.toUpperCase().includes("KARINA") && m.content?.toLowerCase().includes("tarde nardo")) {
          continue;
        }

        const isDupe = deduplicated.some(
          (prev) =>
            prev.sender === m.sender &&
            prev.content?.trim() === m.content?.trim() &&
            Math.abs(new Date(prev.created_at).getTime() - new Date(m.created_at).getTime()) < 15000
        );
        if (!isDupe) {
          deduplicated.push(m);
        }
      }

      setMessages(deduplicated);
    }
    if (!silent) setLoading(false);
  }

  const handleToggleAi = async (enabled: boolean) => {
    setAiEnabled(enabled);
    const { error } = await supabase
      .from("leads")
      .update({ atendimento_ia: enabled })
      .eq("id", lead.id);

    if (error) {
      toast.error("Erro ao alterar status da IA");
      setAiEnabled(!enabled);
    } else {
      toast.success(enabled ? "IA Jarvis ativada para este lead" : "Atendimento humano ativado");
    }
  };

  const handleApplyTemplate = (tpl: QuickTemplate) => {
    const textComTempo = ajustarSaudacaoPorHorario(tpl.text);
    const populated = textComTempo
      .replace(/{nome}/g, lead.nome ? lead.nome.split(" ")[0] : "Cliente")
      .replace(/{credito}/g, formattedCredito);
    setNewMessage(populated);
    setShowTemplates(false);
    toast.success(`Modelo "${tpl.title}" aplicado!`);
  };

  const handleHumanizeDraft = () => {
    if (!newMessage.trim()) {
      toast.error("Digite um rascunho primeiro para o Jarvis humanizar.");
      return;
    }
    const info = obterSaudacaoTempo();
    const firstName = lead.nome ? lead.nome.split(" ")[0] : "Cliente";
    const enhanced = `Olá, ${firstName}! ${info.saudacaoCapitalizada}, tudo bem? ${newMessage.trim()} Estou à total disposição para te apoiar e facilitar cada etapa. Conte comigo!`;
    setNewMessage(enhanced);
    toast.success("✨ Mensagem refinada com o tom executivo Jarvis!");
  };

  const handleGenerateOfficialProposal = () => {
    const credNum = Number(lead.valor_credito) || 150000;
    const seg = (lead.tipo_consorcio as any) || "imovel";
    const proposal = generateBudgetProposal({
      clienteNome: lead.nome,
      telefone: lead.celular || undefined,
      email: lead.email || undefined,
      valorCredito: credNum,
      segmento: seg === "veiculo" ? "veiculo" : seg === "pesados" ? "pesados" : seg === "servicos" ? "servicos" : "imovel",
    });
    setNewMessage(proposal.scriptWhatsApp);
    toast.success("📋 Orçamento oficial com emoticons carregado no chat!");
  };

  const handleSendMessage = async (e?: React.FormEvent, forceWeb = false) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage("");

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      lead_id: lead.id,
      sender: 'agent',
      content: messageText,
      created_at: new Date().toISOString(),
      status: 'delivered'
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Envio direto via WhatsApp Web caso forceWeb seja true ou o modo seja "web"
    if (forceWeb || waMode === "web") {
      if (targetPhone) {
        const webUrl = getWhatsAppWebUrl(targetPhone, messageText);
        window.open(webUrl, "_blank");
      }
    }

    let waStatus: any = { success: true };
    if (!forceWeb && waMode !== "web" && targetPhone) {
      waStatus = await sendWhatsAppMessage({
        number: targetPhone,
        text: messageText,
        organizacaoId: lead.organizacao_id,
        leadId: lead.id,
        leadNome: lead.nome
      });
    }

    // Grava no histórico de chat do CRM
    const { data: insertedData, error } = await (supabase.from("chat_messages") as any).insert({
      lead_id: lead.id,
      content: messageText,
      role: 'assistant',
    }).select().single();

    if (error) {
      console.error("Erro ao registrar mensagem no Supabase:", error);
      toast.error("Erro ao registrar mensagem no CRM: " + (error.message || ""));
    } else {
      if (insertedData) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === insertedData.id)) {
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) => (m.id === tempId ? { ...insertedData, sender: 'agent', status: 'read' } : m));
        });
      }

      if (forceWeb || waMode === "web") {
        toast.success("🟢 Mensagem registrada no CRM e aberta no WhatsApp!");
      } else if (waStatus && !waStatus.success) {
        toast.error(`❌ Não entregue via WhatsApp: ${waStatus.error || "Número sem WhatsApp ativo ou servidor offline."}`, {
          duration: 6000
        });
        if (targetPhone) {
          toast.info("💡 Você pode tentar abrir diretamente no WhatsApp Web clicando no ícone do WhatsApp.", { duration: 5000 });
        }
      } else {
        const providerLabel = waStatus?.provider === "waha" ? "WAHA" : "Evolution API";
        toast.success(`🟢 Mensagem enviada direto pelo CRM via ${providerLabel}!`);
      }
    }

    setSending(false);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Mensagem copiada para a área de transferência!");
  };

  const toggleWhatsAppMode = () => {
    const nextMode: WhatsAppMode = waMode === "waha" ? "web" : "waha";
    setWaMode(nextMode);
    saveWhatsAppMode(nextMode);
    toast.info(`Modo de envio alterado para: ${nextMode === "waha" ? "🚀 Envio Direto (WAHA)" : "📱 WhatsApp Direto (wa.me)"}`);
  };

  return (
    <div className={cn("flex flex-col h-full min-h-[460px] bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xl", className)}>
      {/* HEADER DO CHAT: CONTROLE DE IA, STATUS E MODO DE ENVIO */}
      <div className="p-3.5 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-900/60">
            <WhatsAppIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xs text-slate-900 dark:text-white truncate max-w-[180px]">
                {lead.nome}
              </span>
              <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[9px] font-bold border-none px-1.5 py-0">
                {targetPhone || "Sem telefone"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${aiEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                {aiEnabled ? "Jarvis AI Ativo" : "Atendimento Humano"}
              </span>
            </div>
          </div>
        </div>

        {/* BOTOES DE AÇÃO RÁPIDA NO HEADER */}
        <div className="flex items-center gap-2">
          {/* Alternador de Modo: WAHA vs wa.me Direto */}
          <button
            type="button"
            onClick={toggleWhatsAppMode}
            className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border transition-all flex items-center gap-1.5 ${
              waMode === "waha"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                : waMode === "evolution"
                ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-300 dark:border-zinc-700"
            }`}
            title="Clique para alternar entre Envio Direto (WAHA) e WhatsApp Direto (wa.me)"
          >
            <Zap className="h-3 w-3" />
            {waMode === "waha" ? "🚀 Envio Direto (WAHA)" : waMode === "evolution" ? "⚡ Evolution API" : "📱 Whats Direto (wa.me)"}
          </button>

          {/* Botão de Disparo Direto no wa.me */}
          {targetPhone && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const msg = `Olá, ${lead.nome}! Como posso te ajudar com a sua cota de consórcio hoje?`;
                window.open(getWhatsAppDirectUrl(targetPhone, msg), "_blank");
              }}
              className="h-7 px-2.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 gap-1 rounded-lg"
              title="Abrir diretamente no wa.me / Celular"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              wa.me
            </Button>
          )}

          {/* Botão de Disparo Direto no Telegram */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const msg = encodeURIComponent(`Olá, ${lead.nome}! Como posso ajudar com a sua cota de consórcio hoje?`);
              window.open(`https://t.me/share/url?url=${msg}`, "_blank");
            }}
            className="h-7 px-2.5 text-[11px] font-bold text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-100 gap-1 rounded-lg"
            title="Abrir no Telegram"
          >
            <TelegramIcon className="h-3.5 w-3.5" />
            Telegram
          </Button>

          {/* Toggle de IA */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-zinc-800 pl-2">
            <Label htmlFor="ai-toggle" className="text-[10px] font-bold text-slate-400 uppercase">IA</Label>
            <Switch 
              id="ai-toggle" 
              checked={aiEnabled} 
              onCheckedChange={handleToggleAi}
            />
          </div>
        </div>
      </div>

      {/* PAINEL DE MODELOS DE MENSAGEM RÁPIDA (COLLAPSIBLE) */}
      {showTemplates && (
        <div className="p-3 bg-indigo-50/90 dark:bg-zinc-900 border-b border-indigo-100 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-indigo-600" />
              Modelos de Mensagem Rápida (Consórcio de Elite)
            </span>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
            {QUICK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="text-left p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-indigo-200/80 dark:border-zinc-700 hover:border-indigo-500 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate">
                    {tpl.title}
                  </span>
                  <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[8px] font-black uppercase px-1 py-0 border-none shrink-0">
                    {tpl.badge}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {tpl.text.replace(/{nome}/g, lead.nome || "Cliente").replace(/{credito}/g, formattedCredito)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PAINEL DE ROTEIRO DE ÁUDIO EXECUTIVO (JARVIS VOICE) */}
      {showAudioHelper && (
        <div className="p-3 bg-amber-50/95 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 animate-in slide-in-from-top-2 duration-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5 text-amber-600" />
              Roteiro de Áudio Recomendado para Envio pelo WhatsApp
            </span>
            <button
              onClick={() => setShowAudioHelper(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-200 text-xs text-slate-800 dark:text-zinc-200 leading-relaxed font-medium">
            <p className="italic text-[11px]">
              &ldquo;Fala, <strong>{lead.nome ? lead.nome.split(" ")[0] : "amigo"}</strong>! Tudo bem? Estou gravando esse áudio rápido para você porque montei a sua simulação de <strong>{formattedCredito}</strong> e encontrei um grupo que tem uma taxa de administração reduzida neste mês. Como as cotas desse grupo estão quase esgotando, me avisa se prefere que eu te ligue ou te passe o resumo por aqui! Um abraço!&rdquo;
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(`Fala, ${lead.nome ? lead.nome.split(" ")[0] : "amigo"}! Tudo bem? Estou gravando esse áudio rápido para você porque montei a sua simulação de ${formattedCredito} e encontrei um grupo que tem uma taxa de administração reduzida neste mês. Como as cotas desse grupo estão quase esgotando, me avisa se prefere que eu te ligue ou te passe o resumo por aqui! Um abraço!`);
                toast.success("Roteiro copiado para você ler enquanto grava o áudio no WhatsApp!");
              }}
              className="h-7 text-[10px] font-bold text-amber-800 border-amber-300 bg-amber-100 hover:bg-amber-200 rounded-lg gap-1"
            >
              <Copy className="h-3 w-3" /> Copiar Roteiro de Áudio
            </Button>
          </div>
        </div>
      )}

      {/* ÁREA CENTRAL DE MENSAGENS */}
      <div className="flex-1 relative overflow-hidden bg-slate-50/70 dark:bg-zinc-950/70">
        <div 
          ref={scrollRef}
          className="h-full p-4 overflow-y-auto custom-scrollbar space-y-3"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">Carregando histórico do WhatsApp...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-zinc-600 space-y-3">
              <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <MessageSquare className="h-8 w-8 text-emerald-500 opacity-60" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Nenhuma mensagem registrada ainda para este lead.
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Use os <strong>Modelos Rápidos</strong> abaixo para iniciar a conversa com uma abordagem consultiva de alta conversão.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTemplates(true)}
                className="text-xs font-bold rounded-xl gap-1.5 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
              >
                <Zap className="h-3.5 w-3.5" /> Ver Modelos de Mensagem
              </Button>
            </div>
          ) : (
            messages.map((msg) => {
              const isClient = msg.sender === 'client';
              const isAi = msg.sender === 'ai';

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isClient ? 'items-start' : 'items-end'} group`}
                >
                  <div className={`flex items-center gap-1.5 mb-0.5 ${isClient ? 'flex-row' : 'flex-row-reverse'}`}>
                    {isClient ? (
                      <div className="h-4 w-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold">
                        <User className="h-2.5 w-2.5" />
                      </div>
                    ) : isAi ? (
                      <div className="h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">
                        <Bot className="h-2.5 w-2.5" />
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      {isClient ? 'Cliente' : isAi ? 'Jarvis AI' : 'Você (Especialista)'}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {(() => {
                        if (!msg.created_at) return "";
                        try {
                          const date = parseUTCDate(msg.created_at);
                          if (!date || !isValid(date)) return "";
                          if (isToday(date)) return format(date, "HH:mm");
                          if (isYesterday(date)) return `Ontem ${format(date, "HH:mm")}`;
                          return format(date, "dd/MM HH:mm", { locale: ptBR });
                        } catch {
                          return "";
                        }
                      })()}
                    </span>
                  </div>

                  <div className={`relative max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm transition-all ${
                    isClient 
                      ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-tl-none border border-slate-200/80 dark:border-zinc-800' 
                      : isAi
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-emerald-600 text-white rounded-tr-none'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                    <div className="flex items-center justify-end gap-1.5 mt-1 pt-1 opacity-90 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.content)}
                        className="hover:opacity-100 transition-opacity p-0.5 rounded"
                        title="Copiar mensagem"
                      >
                        <Copy className="h-3 w-3" />
                      </button>

                      {/* 🕒 HORA EXATA DO ENVIO (PADRÃO WHATSAPP) */}
                      <span className="font-mono text-[10px] tracking-tight font-medium opacity-90">
                        {(() => {
                          if (!msg.created_at) return "";
                          try {
                            const date = parseUTCDate(msg.created_at);
                            if (!date || !isValid(date)) return "";
                            if (isToday(date)) return format(date, "HH:mm");
                            if (isYesterday(date)) return `Ontem ${format(date, "HH:mm")}`;
                            return format(date, "dd/MM HH:mm", { locale: ptBR });
                          } catch {
                            return "";
                          }
                        })()}
                      </span>

                      {!isClient && (
                        <span title="Mensagem entregue no WhatsApp">
                          <CheckCheck className="h-3.5 w-3.5 text-emerald-200" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CONTROLES DE SCROLL VERTICAL */}
        {messages.length > 3 && (
          <div className="absolute right-3 bottom-3 flex flex-col gap-1 z-10">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-7 w-7 rounded-full shadow-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300"
              onClick={() => scrollRef.current?.scrollBy({ top: -180, behavior: 'smooth' })}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-7 w-7 rounded-full shadow-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300"
              onClick={() => scrollRef.current?.scrollBy({ top: 180, behavior: 'smooth' })}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* BARRA INFERIOR DE FERRAMENTAS & ENTRADA DE MENSAGEM */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 space-y-2">
        {/* CHIPS DE ACESSO RÁPIDO: GATILHOS, HUMANIZAR COM IA E GRAVAÇÃO DE VOZ */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateOfficialProposal}
              className="h-7 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 gap-1 shadow-sm"
              title="Gera o orçamento oficial com emoticons para este lead"
            >
              <FileText className="h-3 w-3 text-emerald-600" /> Orçamento 50/50
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="h-7 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg border-indigo-200 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 gap-1"
            >
              <Zap className="h-3 w-3 text-indigo-600" /> Modelos Rápidos
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleHumanizeDraft}
              className="h-7 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg border-amber-200 text-amber-800 bg-amber-50/60 hover:bg-amber-100 gap-1"
              title="Aprimora a mensagem com empatia e persuasão"
            >
              <Sparkles className="h-3 w-3 text-amber-600" /> Humanizar Jarvis
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAudioHelper(!showAudioHelper)}
              className="h-7 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg border-emerald-200 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 gap-1"
            >
              <Mic className="h-3 w-3 text-emerald-600" /> Roteiro de Áudio
            </Button>
          </div>

          <span className="text-[10px] text-slate-400 font-bold shrink-0">
            Enter para enviar
          </span>
        </div>

        {/* FORMULÁRIO DE DIGITAÇÃO E DISPARO */}
        <form 
          onSubmit={(e) => handleSendMessage(e, false)} 
          className="flex items-center gap-2"
        >
          <div className="flex-1 relative">
            <Input 
              placeholder={`Digite para ${lead.nome ? lead.nome.split(" ")[0] : "o cliente"} via WhatsApp...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="h-11 rounded-2xl bg-slate-100/80 dark:bg-zinc-800 border-none text-xs focus-visible:ring-2 focus-visible:ring-emerald-500 pr-10"
            />
            {newMessage.trim() && (
              <button
                type="button"
                onClick={() => setNewMessage("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Botão de Envio Direto via WhatsApp Web com o texto digitado */}
          {targetPhone && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleSendMessage(undefined, true)}
              className="h-11 w-11 rounded-2xl shrink-0 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 shadow-sm"
              title="Abrir diretamente no WhatsApp Web com este texto"
              disabled={!newMessage.trim()}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          {/* Botão de Envio Principal (Evolution API ou Modo Atual) */}
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-2xl h-11 w-11 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            disabled={!newMessage.trim() || sending}
            title={waMode === "waha" ? "Enviar direto pelo CRM (WAHA)" : waMode === "evolution" ? "Enviar via Evolution API" : "Abrir no WhatsApp Web / wa.me"}
          >
            {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
