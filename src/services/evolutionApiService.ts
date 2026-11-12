import { supabase } from "@/integrations/supabase/client";
import { makeService } from "@/services/makeService";
import {
  getWahaConfig,
  saveWahaConfig,
  isWahaConfigured,
  sendWahaTextMessage,
  sendWahaFileMessage,
  checkWahaStatus,
  fetchWahaQrCode,
  requestWahaPairingCode,
  restartWahaSession,
  formatWahaNumber,
  formatWahaChatId,
  type WahaConfig,
  type WahaSendParams,
  type WahaSendFileParams,
} from "@/services/wahaApiService";

// Re-exporta funções do WAHA para uso centralizado
export {
  getWahaConfig,
  saveWahaConfig,
  isWahaConfigured,
  sendWahaTextMessage,
  sendWahaFileMessage,
  checkWahaStatus,
  fetchWahaQrCode,
  requestWahaPairingCode,
  restartWahaSession,
  formatWahaNumber,
  formatWahaChatId,
  type WahaConfig,
  type WahaSendParams,
  type WahaSendFileParams,
};

export type WhatsAppMode = "waha" | "web";

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

export const getWhatsAppMode = (): WhatsAppMode => {
  if (typeof window === "undefined") return "waha";
  const saved = localStorage.getItem("whatsapp_mode");
  if (saved === "web") {
    return "web";
  }
  // Padrão oficial: WAHA (Servidor local WhatsApp)
  return "waha";
};

export const saveWhatsAppMode = (mode: WhatsAppMode) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("whatsapp_mode", mode);
};

export const formatWhatsAppNumber = (number: string): string => {
  let clean = number.replace(/\D/g, "");
  if (!clean.startsWith("55") && clean.length >= 10 && clean.length <= 11) {
    clean = `55${clean}`;
  }
  return clean;
};

/**
 * URL universal wa.me para abertura direta do WhatsApp Web ou App
 */
export const getWhatsAppDirectUrl = (number: string, text?: string): string => {
  const clean = formatWhatsAppNumber(number);
  const encodedText = text ? encodeURIComponent(text) : "";
  return `https://wa.me/${clean}${encodedText ? `?text=${encodedText}` : ""}`;
};

export const getWhatsAppWebUrl = (number: string, text?: string): string => {
  const clean = formatWhatsAppNumber(number);
  const encodedText = text ? encodeURIComponent(text) : "";
  if (typeof window !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return `https://api.whatsapp.com/send?phone=${clean}${encodedText ? `&text=${encodedText}` : ""}`;
  }
  return `https://web.whatsapp.com/send?phone=${clean}${encodedText ? `&text=${encodedText}` : ""}`;
};

export const getEvolutionConfig = (): EvolutionConfig => {
  if (typeof window === "undefined") {
    return { apiUrl: "", apiKey: "", instanceName: "simulaja" };
  }
  const savedUrl = localStorage.getItem("evolution_api_url") || "";
  const savedKey = localStorage.getItem("evolution_api_key") || "";
  const savedInstance = localStorage.getItem("evolution_instance_name") || "simulaja";
  return { apiUrl: savedUrl, apiKey: savedKey, instanceName: savedInstance };
};

export const isEvolutionConfigured = (): boolean => {
  const { apiUrl, apiKey } = getEvolutionConfig();
  return Boolean(apiUrl && apiKey && !apiUrl.includes("localhost"));
};

export const saveEvolutionConfig = (config: Partial<EvolutionConfig>) => {
  if (typeof window === "undefined") return;
  if (config.apiUrl !== undefined) localStorage.setItem("evolution_api_url", config.apiUrl.replace(/\/+$/, ""));
  if (config.apiKey !== undefined) localStorage.setItem("evolution_api_key", config.apiKey);
  if (config.instanceName !== undefined) localStorage.setItem("evolution_instance_name", config.instanceName);
};

export interface SendMessageParams {
  number: string;
  text: string;
  organizacaoId?: string;
  leadId?: string;
  leadNome?: string;
}

export const sendWhatsAppMessage = async ({ number, text, organizacaoId, leadId, leadNome }: SendMessageParams) => {
  const cleanNumber = formatWhatsAppNumber(number);
  const mode = getWhatsAppMode();
  const webUrl = getWhatsAppWebUrl(cleanNumber, text);
  const directUrl = getWhatsAppDirectUrl(cleanNumber, text);

  // 1. Modo WhatsApp Web / wa.me Direto (Abre guia no navegador)
  if (mode === "web") {
    window.open(webUrl, "_blank");
    return { success: true, isWebFallback: true, webUrl, directUrl };
  }

  // 2. Modo WAHA (Envio Direto pelo CRM sem abrir novas abas)
  if (mode === "waha") {
    try {
      const wahaRes = await sendWahaTextMessage({ number: cleanNumber, text });
      if (wahaRes.success) {
        return { success: true, provider: "waha", data: wahaRes.data };
      }
      console.warn("[WAHA] Envio direto retornou erro:", wahaRes.error);
      return { success: false, error: wahaRes.error || "Erro no envio via WAHA Local", provider: "waha" };
    } catch (err: any) {
      console.warn("[WAHA] Erro de rede ao conectar:", err);
      return { success: false, error: err.message || "Erro de conexão com o WAHA Local", provider: "waha" };
    }
  }

  // 3. Modo Evolution API (se configurado e selecionado)
  if (mode === "evolution" && isEvolutionConfigured()) {
    const config = getEvolutionConfig();
    try {
      const endpoint = `${config.apiUrl}/message/sendText/${config.instanceName}`;
      let response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.apiKey,
        },
        body: JSON.stringify({
          number: cleanNumber,
          text: text,
          delay: 1200,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (errText.includes("Connection Closed") || response.status === 500) {
          console.warn("[Evolution API] Conexão fechada. Tentando auto-reconectar instância...");
          try {
            await fetch(`${config.apiUrl}/instance/connect/${config.instanceName}`, {
              headers: { apikey: config.apiKey }
            });
            await new Promise(r => setTimeout(r, 1500));
            response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: config.apiKey,
              },
              body: JSON.stringify({ number: cleanNumber, text: text, delay: 1200 }),
            });
          } catch (reconnectErr) {
            console.error("[Evolution API] Erro ao reconectar:", reconnectErr);
          }
        }
      }

      if (response.ok) {
        const data = await response.json();
        return { success: true, provider: "evolution", data };
      }
    } catch (error: any) {
      console.warn("[Evolution API] Envio direto falhou. Tentando fallbacks via Make & Edge Function...", error);
    }
  }

  // 4. Fallback via Webhook do Make.com (se configurado)
  try {
    const makeSuccess = await makeService.dispararWhatsAppViaMake({
      number: cleanNumber,
      text,
      leadId,
      leadNome,
      tipoEnvio: "manual"
    });
    if (makeSuccess) {
      return { success: true, viaMake: true };
    }
  } catch (e) {
    console.warn("[Make.com Fallback] Erro ao enviar por webhook do Make:", e);
  }

  // 5. Fallback via Edge Function do Supabase
  try {
    const evolutionConfig = getEvolutionConfig();
    const { data, error: edgeErr } = await supabase.functions.invoke("evolution-send-message", {
      body: { 
        number: cleanNumber, 
        text, 
        instanceName: evolutionConfig.instanceName || "simulaja",
        organizacaoId: organizacaoId || "",
        clients: [{ id: '1', nome: leadNome || 'Cliente', celular: cleanNumber }],
        template: text
      },
    });
    if (!edgeErr && data && (data.success || !data.error)) {
      return { success: true, data };
    }
  } catch (e) {
    console.error("[Edge Function Fallback] Erro total:", e);
  }

  // 6. Última contingência: Disponibiliza link direto do WhatsApp Web / wa.me
  return { 
    success: false, 
    error: `Servidor de WhatsApp não respondeu. Clique para abrir no WhatsApp Web.`, 
    webUrl,
    directUrl
  };
};

export const ensureWebhookConfigured = async (instanceName = "simulaja") => {
  const config = getEvolutionConfig();
  if (!isEvolutionConfigured()) return;
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pfedvdqpnpbrlhfbzjcj.supabase.co";
    const webhookUrl = `${supabaseUrl}/functions/v1/webhook-evolution`;
    await fetch(`${config.apiUrl}/webhook/set/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.apiKey },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          events: ["MESSAGES_UPSERT", "SEND_MESSAGE"]
        }
      })
    });
  } catch (e) {
    console.warn("[Evolution API] Falha ao configurar webhook automático:", e);
  }
};

export const checkEvolutionStatus = async () => {
  const config = getEvolutionConfig();
  if (!isEvolutionConfigured()) {
    return {
      state: "DISCONNECTED",
      reason: "Configure a URL pública e a chave da Evolution API em Configurações antes de conectar.",
    };
  }

  try {
    const endpoint = `${config.apiUrl}/instance/connectionState/${config.instanceName}`;
    const res = await fetch(endpoint, {
      headers: { apikey: config.apiKey },
    });
    if (res.ok) {
      const data = await res.json();
      const state = data?.instance?.state || "DISCONNECTED";
      if (state === "open" || state === "CONNECTED") {
        ensureWebhookConfigured(config.instanceName);
      }
      return { state, data };
    }
    return { state: "DISCONNECTED", reason: `Instância offline no servidor (${config.apiUrl})` };
  } catch (err: any) {
    return { state: "DISCONNECTED", reason: `Servidor inalcançável em ${config.apiUrl}` };
  }
};

export const fetchEvolutionQrCode = async (instanceName = "simulaja") => {
  const config = getEvolutionConfig();

  if (!isEvolutionConfigured()) {
    return {
      success: false,
      error: "A Evolution API não está configurada. Preencha a URL pública e a chave da API em Configurações antes de gerar o QR Code, ou use o Modo WhatsApp Web Direto.",
    };
  }

  try {
    let res = await fetch(`${config.apiUrl}/instance/connect/${instanceName}`, {
      headers: { apikey: config.apiKey },
    });
    
    let data: any = null;
    if (res.ok) {
      data = await res.json();
    } else {
      const createRes = await fetch(`${config.apiUrl}/instance/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: config.apiKey },
        body: JSON.stringify({ instanceName, token: instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
      });
      if (createRes.ok) {
        data = await createRes.json();
      } else {
        res = await fetch(`${config.apiUrl}/instance/connect/${instanceName}`, {
          headers: { apikey: config.apiKey },
        });
        if (res.ok) data = await res.json();
      }
    }

    if (data) {
      const state = data?.instance?.state || data?.state || data?.status;
      const rawQr = data?.base64 || data?.qrcode?.base64 || data?.code || data?.qrcode?.code;

      if (state === "open" || state === "CONNECTED") {
        return { success: true, connected: true, message: "WhatsApp já está conectado e pronto!" };
      }

      if (rawQr) {
        const qrcode = rawQr.startsWith("data:") 
          ? rawQr 
          : `data:image/png;base64,${rawQr.replace(/^data:image\/png;base64,/, "")}`;
        return { success: true, qrcode, code: data?.code, pairingCode: data?.pairingCode };
      }

      return { success: true, connected: false, message: "Aguardando geração do QR Code..." };
    }

    return { 
      success: false, 
      error: `Não foi possível gerar QR Code em ${config.apiUrl}.` 
    };
  } catch (err: any) {
    console.warn("[Evolution API] Chamada direta de QR Code falhou...", err);
    return { 
      success: false, 
      error: `Servidor Evolution API indisponível em ${config.apiUrl}.` 
    };
  }
};
