import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  MessageSquare, 
  Bot, 
  User, 
  Send, 
  RefreshCw, 
  Filter, 
  Zap,
  Phone,
  ExternalLink,
  Users,
  ChevronRight,
  ClipboardList,
  Sparkles,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  ArrowLeft
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lead } from "@/types/funil";
import { LeadChat } from "@/components/admin/funil/LeadChat";
import { formatCurrency } from "@/lib/utils";
import { getWhatsAppWebUrl, getWhatsAppDirectUrl, formatWhatsAppNumber, getWhatsAppMode, saveWhatsAppMode, WhatsAppMode } from "@/services/evolutionApiService";

interface ChatLead extends Lead {
  last_message?: string;
  last_message_at?: string;
  has_chat_history?: boolean;
}

export default function WhatsAppInbox() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [allLeads, setAllLeads] = useState<ChatLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<ChatLead | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [inboxTab, setInboxTab] = useState<"conversas" | "todos">("conversas");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [waMode, setWaMode] = useState<WhatsAppMode>(() => getWhatsAppMode());
  const isMobile = useIsMobile();
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const fetchLeads = async (silent = false) => {
    if (!profile?.organizacao_id) return;
    if (!silent) setLoading(true);

    try {
      // 1. Busca todas as mensagens para mapear última conversa
      const { data: messages, error: msgError } = await supabase
        .from("chat_messages")
        .select("lead_id, content, created_at")
        .order("created_at", { ascending: false });

      if (msgError) console.error("Erro ao buscar mensagens:", msgError);

      const leadMsgMap = new Map<string, { last_message: string; last_message_at: string }>();
      (messages || []).forEach(m => {
        if (m.lead_id && !leadMsgMap.has(m.lead_id)) {
          leadMsgMap.set(m.lead_id, {
            last_message: m.content || "",
            last_message_at: m.created_at
          });
        }
      });

      // 2. Busca TODOS os leads da organização no CRM (incluindo possíveis leads recém-criados pelo webhook sem org ou sob responsabilidade do usuário)
      let leadsQuery = supabase.from("leads").select("*");
      if (profile?.organizacao_id) {
        leadsQuery = leadsQuery.or(`organizacao_id.eq.${profile.organizacao_id},responsavel_id.eq.${profile.id},organizacao_id.is.null`);
      }
      const { data: leadsData, error: leadError } = await leadsQuery.order("created_at", { ascending: false });

      if (leadError) throw leadError;

      const formatted: ChatLead[] = (leadsData || []).map(l => {
        const meta = leadMsgMap.get(l.id);
        return {
          ...l,
          last_message: meta?.last_message || "",
          last_message_at: meta?.last_message_at || l.created_at || "",
          has_chat_history: Boolean(meta)
        };
      });

      setAllLeads(formatted);

      // Mantém a seleção atual do usuário sem forçar reset para o primeiro lead a cada polling
      setSelectedLead((prev) => {
        if (prev) {
          const updated = formatted.find(l => l.id === prev.id);
          return updated || prev;
        }

        const params = new URLSearchParams(window.location.search);
        const urlLeadId = params.get("leadId") || params.get("id");
        if (urlLeadId) {
          const fromUrl = formatted.find(l => l.id === urlLeadId);
          if (fromUrl) return fromUrl;
        }

        const firstWithChat = formatted.find(l => l.has_chat_history) || formatted[0];
        return firstWithChat || null;
      });
    } catch (err) {
      console.error("Erro ao carregar dados do WhatsApp Inbox:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.organizacao_id) {
      fetchLeads();

      const channel = supabase
        .channel('inbox-updates-v2')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          (payload) => {
            const raw = payload.new as any;
            fetchLeads(true);
            if (raw.role === 'user' || raw.sender === 'client') {
              toast({
                title: `💬 Nova mensagem no WhatsApp!`,
                description: raw.content?.slice(0, 70)
              });
            }
          }
        )
        .subscribe();

      const pollInterval = setInterval(() => {
        fetchLeads(true);
      }, 5000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(pollInterval);
      };
    }
  }, [profile?.organizacao_id]);

  // Filtros de busca e status
  const displayedLeads = useMemo(() => {
    return allLeads.filter(lead => {
      // Filtro de aba: Conversas Ativas vs Todos os Leads
      if (inboxTab === "conversas" && !lead.has_chat_history) {
        return false;
      }

      // Filtro de status do funil
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }

      // Filtro de busca textual
      const q = searchTerm.toLowerCase();
      const matchName = lead.nome?.toLowerCase().includes(q);
      const matchPhone = lead.celular?.includes(q) || (lead as any).telefone?.includes(q);
      const matchMsg = lead.last_message?.toLowerCase().includes(q);
      return matchName || matchPhone || matchMsg;
    }).sort((a, b) => {
      if (inboxTab === "conversas") {
        return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [allLeads, inboxTab, statusFilter, searchTerm]);

  const toggleWhatsAppMode = () => {
    const nextMode = waMode === "waha" ? "web" : "waha";
    setWaMode(nextMode);
    saveWhatsAppMode(nextMode);
    toast({
      title: "Modo WhatsApp alterado",
      description: nextMode === "waha" ? "Disparo direto (WAHA Local)" : "Abertura direta via WhatsApp Web"
    });
  };

  const activeConversasCount = allLeads.filter(l => l.has_chat_history).length;

  return (
    <div className="h-[calc(100dvh-115px)] md:h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-zinc-950 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-zinc-800">
      {/* BARRA SUPERIOR DE STATUS & CONTROLE GLOBAL WHATSAPP */}
      <div className="px-3.5 py-2.5 sm:px-6 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between flex-wrap gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <WhatsAppIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight">WhatsApp CRM Hub</h1>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] font-black uppercase px-1.5 sm:px-2 py-0.5">
                Multi-Atendimento
              </Badge>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
              Sincronização em tempo real entre o banco de dados do CRM e as conversas de WhatsApp dos seus clientes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleWhatsAppMode}
            className={`px-2.5 py-1 text-[11px] sm:text-xs font-black uppercase rounded-xl border transition-all flex items-center gap-1.5 ${
              waMode === "waha"
                ? "bg-indigo-900/60 border-indigo-500 text-indigo-200"
                : "bg-emerald-900/60 border-emerald-500 text-emerald-200"
            }`}
          >
            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
            <span>{waMode === "waha" ? "Modo: WAHA" : "Modo: Web"}</span>
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchLeads()}
            className="h-7 sm:h-8 px-2 sm:px-2.5 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-[11px] sm:text-xs rounded-xl gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* SIDEBAR: LISTA DE CONVERSAS E LEADS DO CRM */}
        <div className={`${
          isMobile && mobileShowChat ? "hidden" : "flex"
        } w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-zinc-800 flex-col bg-slate-50/70 dark:bg-zinc-900/40 shrink-0`}>
          
          {/* ABAS: CONVERSAS ATIVAS VS TODOS OS LEADS DO CRM */}
          <div className="p-4 space-y-3 border-b border-slate-200/80 dark:border-zinc-800">
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-200/80 dark:bg-zinc-800 text-xs font-black uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setInboxTab("conversas")}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  inboxTab === "conversas"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                <span>Conversas ({activeConversasCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setInboxTab("todos")}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  inboxTab === "todos"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                <Users className="h-3.5 w-3.5 text-emerald-600" />
                <span>Todos Leads ({allLeads.length})</span>
              </button>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={inboxTab === "conversas" ? "Buscar nas conversas..." : "Buscar lead por nome ou celular..."}
                className="pl-9 h-10 rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* FILTROS RÁPIDOS DE FUNIL */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
              {[
                { id: "all", label: "Todos" },
                { id: "novo", label: "Novos" },
                { id: "contato", label: "Contato" },
                { id: "negociacao", label: "Negociação" },
                { id: "proposta", label: "Proposta" },
                { id: "venda_fechada", label: "Fechados" }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2 py-1 rounded-lg font-black uppercase whitespace-nowrap transition-all ${
                    statusFilter === st.id
                      ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                      : "bg-white dark:bg-zinc-800 text-slate-500 hover:text-slate-900 border border-slate-200/60 dark:border-zinc-700"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* LISTAGEM DE LEADS / CONVERSAS */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">Carregando contatos...</span>
                </div>
              ) : displayedLeads.length === 0 ? (
                <div className="text-center py-14 px-4 space-y-2">
                  <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">
                    {inboxTab === "conversas" 
                      ? "Nenhuma conversa ativa com mensagens ainda." 
                      : "Nenhum lead encontrado com estes filtros."}
                  </p>
                  {inboxTab === "conversas" && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setInboxTab("todos")}
                      className="text-xs font-bold rounded-xl mt-2"
                    >
                      Ver Todos os Leads do CRM
                    </Button>
                  )}
                </div>
              ) : (
                displayedLeads.map((lead) => {
                  const isSelected = selectedLead?.id === lead.id;
                  const hasMsg = Boolean(lead.last_message);

                  return (
                    <button
                      key={lead.id}
                      onClick={() => {
                        setSelectedLead(lead);
                        try {
                          const url = new URL(window.location.href);
                          url.searchParams.set("leadId", lead.id);
                          window.history.replaceState(null, "", url.toString());
                        } catch {}
                        if (isMobile) {
                          setMobileShowChat(true);
                        }
                      }}
                      className={`w-full p-3 rounded-2xl flex gap-3 transition-all text-left relative ${
                        isSelected 
                          ? "bg-white dark:bg-zinc-900 shadow-md ring-1 ring-emerald-500/30 border border-emerald-500/20" 
                          : "hover:bg-white/80 dark:hover:bg-zinc-800/60 border border-transparent"
                      }`}
                    >
                      {/* Avatar com inicial */}
                      <div className={`h-11 w-11 rounded-2xl shrink-0 flex items-center justify-center font-black text-sm shadow-sm ${
                        isSelected 
                          ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white" 
                          : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                      }`}>
                        {lead.nome ? lead.nome.charAt(0).toUpperCase() : "?"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {lead.nome}
                          </p>
                          {lead.last_message_at && (
                            <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-1">
                              {(() => {
                                try {
                                  const d = new Date(lead.last_message_at);
                                  return format(d, "HH:mm");
                                } catch {
                                  return "";
                                }
                              })()}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate leading-relaxed">
                          {lead.last_message || (
                            <span className="italic text-emerald-600 dark:text-emerald-400 font-medium">
                              + Clique para iniciar WhatsApp
                            </span>
                          )}
                        </p>

                        <div className="flex items-center justify-between mt-1 pt-0.5">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {formatCurrency(Number(lead.valor_credito || 0))}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${lead.atendimento_ia !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span className="text-[8px] font-black uppercase text-slate-400">
                              {lead.atendimento_ia !== false ? "IA" : "Manual"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ÁREA PRINCIPAL: CONVERSA SELECIONADA + CHAT INTEGRADO */}
        <div className={`${
          isMobile && !mobileShowChat ? "hidden" : "flex"
        } flex-1 flex-col bg-slate-100/50 dark:bg-zinc-950 overflow-hidden`}>
          {selectedLead ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* HEADER DO CLIENTE SELECIONADO */}
              <div className="p-2.5 sm:p-3.5 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 sm:gap-3 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {isMobile && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMobileShowChat(false)}
                      className="h-8 px-2 -ml-1 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl gap-1 shrink-0"
                      title="Voltar para a lista de conversas"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="text-xs font-bold">Voltar</span>
                    </Button>
                  )}
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                    {selectedLead.nome ? selectedLead.nome.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                        {selectedLead.nome}
                      </h3>
                      <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold border-none px-1.5 py-0">
                        {formatCurrency(Number(selectedLead.valor_credito || 0))}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold flex items-center gap-1.5 truncate">
                      <span>📱 {selectedLead.celular || "Sem celular"}</span>
                      {selectedLead.cidade && <span className="hidden sm:inline">• 📍 {selectedLead.cidade}</span>}
                    </p>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO DO CONTATO */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {selectedLead.celular && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const webUrl = getWhatsAppDirectUrl(selectedLead.celular || "", `Olá ${selectedLead.nome}, como posso te ajudar com seu consórcio?`);
                        window.open(webUrl, "_blank");
                      }}
                      className="h-7 sm:h-8 px-2 sm:px-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 rounded-xl gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">wa.me</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant={showLeadDetails ? "default" : "outline"}
                    onClick={() => setShowLeadDetails(!showLeadDetails)}
                    className="h-7 sm:h-8 px-2 sm:px-3 text-xs font-bold rounded-xl gap-1"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{showLeadDetails ? "Ocultar Dados" : "Ficha"}</span>
                  </Button>
                </div>
              </div>

              {/* CONTEÚDO PRINCIPAL: CHAT + DOSSIÊ LATERAL OPCIONAL */}
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 p-1 sm:p-2 md:p-3 overflow-hidden flex flex-col">
                  <LeadChat key={selectedLead.id} lead={selectedLead} className="h-full border-0 rounded-none sm:rounded-2xl shadow-none" />
                </div>

                {/* PAINEL LATERAL DE DETALHES DO LEAD (DOSSIÊ) */}
                {showLeadDetails && (
                  <div className="w-80 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 overflow-y-auto custom-scrollbar space-y-4 animate-in slide-in-from-right-4 duration-200 shrink-0">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Dossiê do Cliente</h4>
                      <p className="text-base font-black text-slate-900 dark:text-white mt-1">{selectedLead.nome}</p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Crédito & Prazo</span>
                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(selectedLead.valor_credito || 0))}</p>
                        <p className="text-slate-500 font-bold mt-0.5">{selectedLead.prazo_meses || 180} meses</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Segmento</span>
                        <p className="font-bold text-slate-800 dark:text-zinc-200 uppercase">{selectedLead.tipo_consorcio || "Consórcio Imobiliário / Veicular"}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Contato Telefônico</span>
                        <p className="font-bold text-slate-800 dark:text-zinc-200">{selectedLead.celular || "Não cadastrado"}</p>
                        <p className="text-slate-500 text-[11px]">{selectedLead.email || "Sem e-mail"}</p>
                      </div>

                      {selectedLead.indicador_nome && (
                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1">
                          <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 block">Indicado por</span>
                          <p className="font-bold text-purple-900 dark:text-purple-200">{selectedLead.indicador_nome}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="h-24 w-24 bg-white dark:bg-zinc-900 rounded-[36px] shadow-xl border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center mb-6">
                <WhatsAppIcon className="h-12 w-12 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Central WhatsApp de Atendimento</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-xs max-w-sm mt-2 leading-relaxed">
                Selecione um cliente à esquerda para interagir em tempo real, aplicar roteiros de conversão de consórcio ou disparar propostas pelo WhatsApp.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
