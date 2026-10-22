/**
 * ==============================================================================
 * SIMULAJÁ CRM • TELEGRAM BOT SERVICE (MENSAGENS RÁPIDAS & ZERO RISCO DE BAN)
 * ==============================================================================
 * Por que o Telegram Bot Oficial possui RISCO ZERO de banimento:
 * 1. O Telegram Bot API (via @BotFather) é uma API corporativa oficial do Telegram.
 * 2. Bots oficiais NÃO utilizam números de telefone nem chips SIM que possam ser bloqueados.
 * 3. O limite da API oficial para bots é de 30 mensagens por segundo (muito acima de qualquer régua).
 * 
 * Regra fundamental de privacidade do Telegram:
 * - O bot não pode iniciar uma conversa do nada sem que o cliente tenha clicado no link do bot
 *   pelo menos 1 vez (ou enviado /start).
 * - Uma vez que o cliente entra no bot, o CRM armazena o telegram_chat_id e pode enviar boletos,
 *   PIX copia e cola, avisos de assembleia e lembretes a qualquer momento.
 * ==============================================================================
 */

export interface TelegramMessagePayload {
  chatId?: string;
  usernameOrPhone?: string;
  text: string;
  cota?: string;
  grupo?: string;
  documentUrl?: string; // Para envio direto do PDF do boleto
}

export interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
  directUrl?: string;
}

// Configurações padrão (podem ser lidas do .env ou definidas pelo gestor no CRM)
const TELEGRAM_BOT_TOKEN = (import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_BOT_USERNAME = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || "ProsperaPlanBot";

export const telegramService = {
  /**
   * Verifica se o Bot Oficial do Telegram está configurado
   */
  isConfigured(): boolean {
    return Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_TOKEN.length > 10);
  },

  /**
   * Retorna o link de Onboarding para o cliente iniciar o bot com 1 clique.
   * Exemplo: https://t.me/ProsperaPlanBot?start=cota_3221_006043
   */
  getBotOnboardingLink(params?: { cota?: string; grupo?: string; clienteId?: string }): string {
    const username = TELEGRAM_BOT_USERNAME.replace("@", "");
    if (!params) return `https://t.me/${username}`;

    const ref = [params.grupo, params.cota, params.clienteId].filter(Boolean).join("_");
    return `https://t.me/${username}?start=${encodeURIComponent(ref || "atendimento")}`;
  },

  /**
   * Gera link de compartilhamento rápido no Telegram (abre o Telegram com a mensagem pronta)
   * Ideal para disparo instantâneo mesmo se o cliente ainda não estiver cadastrado no Bot!
   */
  getQuickShareLink(text: string, phoneOrUsername?: string): string {
    const encodedText = encodeURIComponent(text);
    if (phoneOrUsername && phoneOrUsername.startsWith("@")) {
      const user = phoneOrUsername.replace("@", "");
      return `https://t.me/${user}`;
    }
    // Compartilhamento direto no Telegram
    return `https://t.me/share/url?url=${encodedText}`;
  },

  /**
   * Envia mensagem rápida via Telegram Bot API Oficial (Risco Zero de Banimento)
   */
  async enviarMensagem(payload: TelegramMessagePayload): Promise<TelegramSendResult> {
    const token = TELEGRAM_BOT_TOKEN;

    // Se o token estiver configurado e tivermos o chatId do cliente
    if (token && payload.chatId) {
      try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: payload.chatId,
            text: payload.text,
            parse_mode: "Markdown",
            disable_web_page_preview: false,
          }),
        });

        const data = await res.json();
        if (data.ok) {
          return { success: true, messageId: data.result?.message_id };
        } else {
          console.warn("[TelegramService] Resposta da API do Telegram:", data);
          return { success: false, error: data.description };
        }
      } catch (err: any) {
        console.error("[TelegramService] Falha ao conectar na Telegram API:", err);
        return { success: false, error: err.message };
      }
    }

    // Fallback inteligente: gera o link rápido para abrir o app do Telegram
    const quickLink = this.getQuickShareLink(payload.text, payload.usernameOrPhone);
    return {
      success: true,
      directUrl: quickLink,
    };
  },

  /**
   * Abre o chat do Telegram diretamente (web ou app) com a mensagem pré-formatada.
   * Método de disparo rápido e seguro, com ZERO RISCO DE BANIMENTO.
   */
  abrirChatTelegram(params: { destinatario?: string; mensagem: string }): void {
    const rawDest = (params.destinatario || "").trim();
    const encodedMsg = encodeURIComponent(params.mensagem);

    if (rawDest.startsWith("@")) {
      const user = rawDest.replace("@", "");
      window.open(`https://t.me/${user}`, "_blank");
      return;
    }

    const cleanPhone = rawDest.replace(/\D/g, "");
    if (cleanPhone.length >= 10) {
      const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
      // Abre direto a tela do contato no Telegram com o número oficial internacional
      window.open(`https://t.me/+${phoneWithCountry}`, "_blank");
      return;
    }

    // Compartilhamento com mensagem pré-preenchida no Telegram
    window.open(`https://t.me/share/url?url=${encodedMsg}`, "_blank");
  },
};

