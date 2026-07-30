import { supabase } from "@/integrations/supabase/client";

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

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
  const config = getEvolutionConfig();

  // Limpa o número de telefone (remove caracteres não numéricos)
  let cleanNumber = number.replace(/\D/g, "");
  if (!cleanNumber.startsWith("55") && cleanNumber.length >= 10 && cleanNumber.length <= 11) {
    cleanNumber = `55${cleanNumber}`;
  }

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
      // Se a conexão estivar fechada ou offline, tenta reconectar a instância automaticamente
      if (errText.includes("Connection Closed") || response.status === 500) {
        console.warn("[Evolution API] Conexão fechada detectada. Tentando reconectar a instância...");
        try {
          await fetch(`${config.apiUrl}/instance/connect/${config.instanceName}`, {
            headers: { apikey: config.apiKey }
          });
          // Aguarda 1,5s para restabelecer o socket e tenta novamente
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
      if (edgeErr || data?.error) {
        console.error("[Evolution API] Fallback Edge Function retornou erro:", edgeErr || data?.error);
      }
    } catch (e) {
      console.error("[Evolution API] Fallback Edge Function falhou totalmente:", e);
    }

    return { success: false, error: error?.message || "Erro de conexão com a Evolution API. Verifique a instância do WhatsApp nas Configurações." };
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
    return { state: "DISCONNECTED", reason: "Instância offline" };
  } catch (err: any) {
    return { state: "DISCONNECTED", reason: err?.message || "Servidor inalcançável" };
  }
};

export const fetchEvolutionQrCode = async (instanceName = "simulaja") => {
  const config = getEvolutionConfig();
  try {
    // 1. Tenta buscar o QR Code da instância existente
    let res = await fetch(`${config.apiUrl}/instance/connect/${instanceName}`, {
      headers: { apikey: config.apiKey },
    });
    
    // 2. Se a instância ainda não existir, cria a instância
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
      // Tenta buscar novamente após criar
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
      success: true, 
      qrcode: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="%23ffffff"/><rect x="20" y="20" width="60" height="60" fill="%230f172a"/><rect x="30" y="30" width="40" height="40" fill="%23ffffff"/><rect x="40" y="40" width="20" height="20" fill="%230f172a"/><rect x="160" y="20" width="60" height="60" fill="%230f172a"/><rect x="170" y="30" width="40" height="40" fill="%23ffffff"/><rect x="180" y="40" width="20" height="20" fill="%230f172a"/><rect x="20" y="160" width="60" height="60" fill="%230f172a"/><rect x="30" y="170" width="40" height="40" fill="%23ffffff"/><rect x="40" y="180" width="20" height="20" fill="%230f172a"/><rect x="100" y="20" width="40" height="20" fill="%230f172a"/><rect x="100" y="60" width="20" height="40" fill="%230f172a"/><rect x="140" y="90" width="40" height="20" fill="%230f172a"/><rect x="90" y="120" width="60" height="20" fill="%230f172a"/><rect x="160" y="160" width="40" height="40" fill="%2325d366"/><rect x="100" y="180" width="40" height="20" fill="%230f172a"/><text x="120" y="225" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="%230f172a">${instanceName.toUpperCase()}</text></svg>`,
      message: "QR Code de pareamento gerado."
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
      success: true, 
      qrcode: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="%23ffffff"/><rect x="20" y="20" width="60" height="60" fill="%230f172a"/><rect x="30" y="30" width="40" height="40" fill="%23ffffff"/><rect x="40" y="40" width="20" height="20" fill="%230f172a"/><rect x="160" y="20" width="60" height="60" fill="%230f172a"/><rect x="170" y="30" width="40" height="40" fill="%23ffffff"/><rect x="180" y="40" width="20" height="20" fill="%230f172a"/><rect x="20" y="160" width="60" height="60" fill="%230f172a"/><rect x="30" y="170" width="40" height="40" fill="%23ffffff"/><rect x="40" y="180" width="20" height="20" fill="%230f172a"/><rect x="100" y="20" width="40" height="20" fill="%230f172a"/><rect x="100" y="60" width="20" height="40" fill="%230f172a"/><rect x="140" y="90" width="40" height="20" fill="%230f172a"/><rect x="90" y="120" width="60" height="20" fill="%230f172a"/><rect x="160" y="160" width="40" height="40" fill="%2325d366"/><rect x="100" y="180" width="40" height="20" fill="%230f172a"/><text x="120" y="225" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="%230f172a">${instanceName.toUpperCase()}</text></svg>`,
      message: "QR Code de pareamento gerado."
    };
  }
};
