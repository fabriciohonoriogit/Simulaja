
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Send, Bot, User, MessageSquare, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { format, parseISO, isValid, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseUTCDate } from "@/lib/formatters";
import { Lead } from "@/types/funil";
import { toast } from "sonner";
import { sendWhatsAppMessage, getWhatsAppMode, getWhatsAppWebUrl, formatWhatsAppNumber } from "@/services/evolutionApiService";

interface Message {
  id: string;
  lead_id: string;
  sender: 'client' | 'ai' | 'agent';
  content: string;
  created_at: string;
}

export function LeadChat({ lead }: { lead: Lead }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(lead.atendimento_ia !== false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
            sender: raw.sender || (raw.role === 'user' || raw.role === 'client' ? 'client' : raw.role === 'ai' || raw.role === 'assistant' ? 'ai' : 'agent')
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    // Polling automático a cada 3 segundos para garantir atualização em tempo real sem F5
    const pollInterval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

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
        sender: msg.sender ? msg.sender : (msg.role === 'user' || msg.role === 'client' ? 'client' : msg.role === 'agent' ? 'agent' : 'ai')
      }));
      setMessages(formatted as Message[]);
    }
    if (!silent) setLoading(false);
  };

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
      toast.success(enabled ? "IA ativada para este lead" : "Atendimento humano ativado");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // 1. Dispara a mensagem via WhatsApp (Evolution API ou WhatsApp Web)
    let waStatus: { success?: boolean; error?: string; isWebFallback?: boolean; webUrl?: string } = { success: true };
    const targetPhone = lead.celular || (lead as any).telefone;
    const mode = getWhatsAppMode();

    if (targetPhone) {
      waStatus = await sendWhatsAppMessage({ 
        number: targetPhone, 
        text: messageText,
        organizacaoId: lead.organizacao_id 
      });
    } else {
      waStatus = { success: false, error: "Lead sem número de telefone cadastrado." };
    }

    // 2. Registra a mensagem no banco do CRM (role aceita apenas: 'user', 'assistant', 'system')
    let { data: insertedData, error } = await (supabase.from("chat_messages") as any).insert({
      lead_id: lead.id,
      content: messageText,
      role: 'assistant',
    }).select().single();

    if (error) {
      console.error("Erro ao registrar mensagem no Supabase:", error);
      toast.error("Erro ao registrar mensagem no CRM: " + (error.message || ""));
    } else {
      if (insertedData) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...insertedData, sender: 'agent' } : m)));
      }
      
      if (waStatus.isWebFallback) {
        toast.success("🟢 Mensagem salva no CRM e aberta no WhatsApp Web!", { duration: 4000 });
      } else if (!waStatus.success) {
        toast.error(`⚠️ Mensagem salva no CRM, mas não enviada via API (${waStatus.error || "Servidor offline"}).`, {
          duration: 6000,
          action: targetPhone ? {
            label: "Abrir WhatsApp Web",
            onClick: () => window.open(getWhatsAppWebUrl(targetPhone, messageText), "_blank")
          } : undefined
        });
      } else {
        toast.success("🟢 Mensagem enviada ao WhatsApp e registrada no CRM!", { duration: 4000 });
      }
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const targetPhone = lead.celular || (lead as any).telefone;

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
      {/* Header com Toggle IA e Botão WhatsApp Web */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${aiEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">
            {aiEnabled ? "IA Ativa" : "Atendimento Humano"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {targetPhone && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(getWhatsAppWebUrl(targetPhone), "_blank")}
              className="h-7 text-[11px] font-bold text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 gap-1 rounded-lg shadow-sm"
              title="Abrir bate-papo direto no WhatsApp Web / App"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
              Abrir no WhatsApp
            </Button>
          )}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <Label htmlFor="ai-toggle" className="text-[10px] font-bold uppercase text-slate-400">Automação IA</Label>
            <Switch 
              id="ai-toggle" 
              checked={aiEnabled} 
              onCheckedChange={handleToggleAi}
            />
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={scrollRef}
          className="h-full p-4 overflow-y-auto custom-scrollbar bg-slate-50/50"
        >
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                <MessageSquare className="h-12 w-12 opacity-10 mb-2" />
                <p className="text-xs font-medium">Nenhuma mensagem no histórico do WhatsApp.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === 'client' ? 'items-start' : 'items-end'}`}
                >
                  <div className={`flex items-center gap-1.5 mb-1 ${msg.sender === 'client' ? 'flex-row' : 'flex-row-reverse'}`}>
                    {msg.sender === 'ai' ? <Bot className="h-3 w-3 text-indigo-500" /> : <User className="h-3 w-3 text-slate-400" />}
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                      {msg.sender === 'client' ? 'Cliente' : msg.sender === 'ai' ? 'Jarvis AI' : 'Consultor'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {(() => {
                        if (!msg.created_at) return "";
                        try {
                          const date = parseUTCDate(msg.created_at);
                          if (!date || !isValid(date)) return "";
                          if (isToday(date)) {
                            return `Hoje, ${format(date, "HH:mm")}`;
                          }
                          if (isYesterday(date)) {
                            return `Ontem, ${format(date, "HH:mm")}`;
                          }
                          return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
                        } catch (e) {
                          return "";
                        }
                      })()}
                    </span>
                  </div>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                    msg.sender === 'client' 
                      ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' 
                      : msg.sender === 'ai'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-emerald-600 text-white rounded-tr-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vertical Scroll Controls */}
        {messages.length > 0 && (
          <div className="absolute right-4 bottom-4 flex flex-col gap-1.5 z-20">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollBy({ top: -200, behavior: 'smooth' });
                }
              }}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollBy({ top: 200, behavior: 'smooth' });
                }
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Input de Mensagem */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <Input 
          placeholder={aiEnabled ? "IA está respondendo... Desative para assumir." : "Digite sua mensagem humana..."}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 rounded-full bg-slate-50 border-slate-100 focus:bg-white transition-all"
          disabled={aiEnabled && false} // Opcional: deixar habilitado mesmo com IA se quiser intervir
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-full h-10 w-10 shrink-0 bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-90"
          disabled={!newMessage.trim() || sending}
        >
          {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
