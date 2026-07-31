import { supabase } from "@/integrations/supabase/client";

export type WhatsAppMode = "web" | "evolution";

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

export const getWhatsAppMode = (): WhatsAppMode => {
  if (typeof window === "undefined") return "web";
  return (localStorage.getItem("whatsapp_mode") as WhatsAppMode) || "web";
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

export const getWhatsAppWebUrl = (number: string, text?: string): string => {
  const clean = formatWhatsAppNumber(number);
  const encodedText = text ? encodeURIComponent(text) : "";
  return `https://web.whatsapp.com/send?phone=${clean}${encodedText ? `&text=${encodedText}` : ""}`;
};

export const getEvolutionConfig = (): EvolutionConfig => {
  if (typeof window === "undefined") {
    return { apiUrl: "http://localhost:8080", apiKey: "B6D711FCDE4D4FD5936544120E713976", instanceName: "simulaja" };
  }
  const savedUrl = localStorage.getItem("evolution_api_url") || "http://localhost:8080";
  const savedKey = localStorage.getItem("evolution_api_key") || "B6D711FCDE4D4FD5936544120E713976";
  const savedInstance = localStorage.getItem("evolution_instance_name") || "simulaja";
  return { apiUrl: savedUrl, apiKey: savedKey, instanceName: savedInstance };
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
}

export const sendWhatsAppMessage = async ({ number, text, organizacaoId }: SendMessageParams) => {
  const cleanNumber = formatWhatsAppNumber(number);
  const mode = getWhatsAppMode();
  const webUrl = getWhatsAppWebUrl(cleanNumber, text);

  // Se o modo estiver configurado como WhatsApp Web (Direto), abre diretamente a janela
  if (mode === "web") {
    window.open(webUrl, "_blank");
    return { success: true, isWebFallback: true, webUrl };
  }

  const config = getEvolutionConfig();

  if (!config.apiUrl || !config.apiKey) {
    console.warn("[Evolution API] Configurações de API URL ou API Key ausentes.");
  }

  try {
    // 1. Tenta enviar diretamente via API do Evolution
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
      // Se a conexão estiver fechada ou offline, tenta reconectar a instância automaticamente
      if (errText.includes("Connection Closed") || response.status === 500) {
        console.warn("[Evolution API] Conexão fechada detectada. Tentando reconectar a instância...");
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
            body: JSON.stringify({
              number: cleanNumber,
              text: text,
              delay: 1200,
            }),
          });
        } catch (reconnectErr) {
          console.error("[Evolution API] Falha na tentativa de reconexão automática:", reconnectErr);
        }
      }

      if (!response.ok) {
        const retryErrText = await response.text();
        console.error("[Evolution API] Erro ao enviar mensagem:", retryErrText);
        throw new Error(retryErrText);
      }
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.warn("[Evolution API] Chamada direta falhou, acionando Edge Function de fallback:", error);

    try {
      const { data, error: edgeErr } = await supabase.functions.invoke("evolution-send-message", {
        body: { 
          number: cleanNumber, 
          text, 
          instanceName: config.instanceName || "simulaja",
          organizacaoId: organizacaoId || "",
          clients: [{ id: '1', nome: 'Cliente', celular: cleanNumber }],
          template: text
        },
      });
      if (!edgeErr && data && (data.success || !data.error)) {
        return { success: true, data };
      }
    } catch (e) {
      console.error("[Evolution API] Fallback Edge Function falhou totalmente:", e);
    }

    return { 
      success: false, 
      error: `Servidor Evolution API indisponível em ${config.apiUrl}. Caso não possua o servidor rodando, altere para o Modo WhatsApp Web Direto.`, 
      webUrl 
    };
  }
};

export const ensureWebhookConfigured = async (instanceName = "simulaja") => {
  const config = getEvolutionConfig();
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
  if (!config.apiUrl || !config.apiKey) return { state: "DISCONNECTED", reason: "Configurações ausentes" };

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
  try {
    // 1. Tenta buscar o QR Code da instância existente
    let res = await fetch(`${config.apiUrl}/instance/connect/${instanceName}`, {
      headers: { apikey: config.apiKey },
    });
    
    // 2. Se a instância ainda não existir, tenta criar a instância
    if (!res.ok) {
      const createRes = await fetch(`${config.apiUrl}/instance/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: config.apiKey },
        body: JSON.stringify({ instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
      });
      if (createRes.ok) {
        const createData = await createRes.json();
        if (createData?.qrcode?.base64) {
          return { success: true, qrcode: createData.qrcode.base64, code: createData.qrcode.code };
        }
      }
      res = await fetch(`${config.apiUrl}/instance/connect/${instanceName}`, {
        headers: { apikey: config.apiKey },
      });
    }

    if (res.ok) {
      const data = await res.json();
      const state = data?.instance?.state || data?.state;
      const qrcode = data?.base64 || data?.qrcode?.base64;

      if (state === "open" || state === "CONNECTED") {
        return { success: true, connected: true, message: "WhatsApp já está conectado e pronto!" };
      }

      if (qrcode) {
        return { success: true, qrcode, code: data?.code, pairingCode: data?.pairingCode };
      }

      return { success: true, connected: false, message: "Aguardando geração do QR Code..." };
    }

    return { 
      success: false, 
      error: `Não foi possível gerar QR Code. O servidor Evolution API em ${config.apiUrl} não respondeu adequadamente.` 
    };
  } catch (err: any) {
    console.warn("[Evolution API] Chamada direta de QR Code falhou, tentando via Edge Function proxy...", err);

    try {
      const { data, error: edgeErr } = await supabase.functions.invoke("evolution-create-instance", {
        body: { instanceName },
      });
      if (!edgeErr && data) {
        if (data.connected) {
          return { success: true, connected: true, message: "WhatsApp já está conectado!" };
        }
        if (data.qrcode) {
          return { success: true, qrcode: data.qrcode };
        }
      }
    } catch (e) {
      console.error("Fallback de Edge Function para QR Code também falhou:", e);
    }

    return { 
      success: false, 
      error: `Servidor Evolution API não encontrado em ${config.apiUrl}. Verifique se a aplicação/container está em execução ou altere para o Modo WhatsApp Web (Direto).` 
    };
  }
};

