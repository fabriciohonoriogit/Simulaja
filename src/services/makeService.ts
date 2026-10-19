/**
 * Make.com Service & Evolution WhatsApp Gateway
 * Centraliza e orquestra todas as automações via Webhook no Make.com e Evolution API.
 */

// Webhooks configuráveis via ambiente ou fallbacks padrão
const WEBHOOK_LEADS = import.meta.env.VITE_MAKE_WEBHOOK_LEADS || "https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1";
const WEBHOOK_AGENDAMENTO = import.meta.env.VITE_MAKE_WEBHOOK_AGENDAMENTO || "";
const WEBHOOK_WHATSAPP_DISPARO = import.meta.env.VITE_MAKE_WEBHOOK_WHATSAPP || "";
const WEBHOOK_VENDA_FECHADA = import.meta.env.VITE_MAKE_WEBHOOK_VENDA || "";

export interface AgendamentoNotificacao {
  lead: {
    id: string;
    nome: string;
    celular: string;
    tipo_consorcio: string;
    valor_credito: number;
    status: string | null;
  };
  data: string;
  hora: string;
  nota?: string;
  responsavel_nome?: string;
}

export interface WhatsAppMessagePayload {
  number: string;
  text: string;
  leadId?: string;
  leadNome?: string;
  tipoEnvio?: "boas_vindas" | "lembrete_agendamento" | "proposta" | "pos_venda" | "manual";
}

export interface VendaFechadaPayload {
  leadId: string;
  leadNome: string;
  leadCelular: string;
  valorCredito: number;
  tipoConsorcio: string;
  administradora?: string;
  vendedorNome?: string;
}

export const makeService = {
  /**
   * Envia evento de novo lead para a esteira do Make.com
   */
  async notificarNovoLead(leadData: Record<string, any>): Promise<boolean> {
    if (!WEBHOOK_LEADS) return false;
    try {
      const response = await fetch(WEBHOOK_LEADS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento: "novo_lead",
          timestamp: new Date().toISOString(),
          ...leadData,
        }),
      });
      return response.ok;
    } catch (e) {
      console.warn("[Make.com] Falha no disparo de novo lead:", e);
      return false;
    }
  },

  /**
   * Notifica agendamento para o Make (roteia pro Telegram/WhatsApp do vendedor)
   */
  async notificarAgendamento(payload: AgendamentoNotificacao): Promise<boolean> {
    if (!WEBHOOK_AGENDAMENTO) {
      console.warn("[Make.com] VITE_MAKE_WEBHOOK_AGENDAMENTO não configurado.");
      return false;
    }

    const dataFormatada = new Date(`${payload.data}T${payload.hora}`)
      .toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

    try {
      const res = await fetch(WEBHOOK_AGENDAMENTO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "agendamento_crm",
          lead_id: payload.lead.id,
          lead_nome: payload.lead.nome,
          lead_celular: payload.lead.celular,
          lead_tipo: payload.lead.tipo_consorcio,
          lead_valor: payload.lead.valor_credito,
          lead_status: payload.lead.status,
          data_formatada: dataFormatada,
          hora: payload.hora,
          nota: payload.nota || "",
          responsavel: payload.responsavel_nome || "Vendedor",
          responsavel_telefone: payload.responsavel_nome,
          timestamp: new Date().toISOString(),
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn("[Make.com] Erro ao disparar webhook de agendamento:", e);
      return false;
    }
  },

  /**
   * Dispara mensagem de WhatsApp via webhook do Make.com (Conexão direta com Evolution API no Make)
   */
  async dispararWhatsAppViaMake(payload: WhatsAppMessagePayload): Promise<boolean> {
    const hasDedicatedWebhook = WEBHOOK_WHATSAPP_DISPARO && !WEBHOOK_WHATSAPP_DISPARO.includes("whatsapp_webhook_id");
    if (!hasDedicatedWebhook) {
      // NÃO utilizar WEBHOOK_LEADS como fallback para mensagens de chat, pois WEBHOOK_LEADS é a esteira interna de alertas no Telegram!
      return false;
    }

    try {
      const res = await fetch(WEBHOOK_WHATSAPP_DISPARO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_whatsapp",
          number: payload.number.replace(/\D/g, ""),
          text: payload.text,
          lead_id: payload.leadId,
          lead_nome: payload.leadNome,
          tipo_envio: payload.tipoEnvio || "manual",
          timestamp: new Date().toISOString(),
        }),
      });
      return res.ok;
    } catch (e) {
      console.error("[Make.com] Erro ao disparar WhatsApp via Make:", e);
      return false;
    }
  },

  /**
   * Notifica comemoração de venda fechada para o Make (envia no grupo de WhatsApp da equipe)
   */
  async notificarVendaFechada(payload: VendaFechadaPayload): Promise<boolean> {
    if (!WEBHOOK_VENDA_FECHADA && !WEBHOOK_LEADS) return false;
    const targetUrl = WEBHOOK_VENDA_FECHADA || WEBHOOK_LEADS;

    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento: "venda_fechada",
          lead_id: payload.leadId,
          lead_nome: payload.leadNome,
          lead_celular: payload.leadCelular,
          valor_credito: payload.valorCredito,
          tipo_consorcio: payload.tipoConsorcio,
          administradora: payload.administradora || "MAGALU",
          vendedor_nome: payload.vendedorNome || "Corretor",
          timestamp: new Date().toISOString(),
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn("[Make.com] Falha na notificação de venda fechada:", e);
      return false;
    }
  },
};
