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
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify({
        number: cleanNumber,
        options: {
          delay: 1200,
          presence: "composing",
          linkPreview: true,
        },
        textMessage: {
          text: text,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const errText = await response.text();
      console.error("[Evolution API] Erro ao enviar mensagem:", errText);
      throw new Error(errText);
    }
  } catch (error: any) {
    console.error("[Evolution API] Exceção na chamada direta:", error);
    
    // Tenta fallback via Edge Function caso cliente esteja rodando no celular ou em ambiente remoto
    try {
      const { data, error: edgeErr } = await supabase.functions.invoke("evolution-send-message", {
        body: { 
          number: cleanNumber, 
          text, 
          instanceName: config.instanceName,
          organizacaoId,
          clients: organizacaoId ? [{ id: '1', nome: 'Cliente', celular: cleanNumber }] : undefined,
          template: text
        },
      });
      if (!edgeErr && data && (data.success || !data.error)) {
        return { success: true, data };
      }
    } catch (e) {
      console.error("[Evolution API] Fallback Edge Function também falhou:", e);
    }

    return { success: false, error: error?.message || "Erro de conexão com o servidor Evolution API" };
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
      return { state: data?.instance?.state || "DISCONNECTED", data };
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
      const qrcode = data?.base64 || data?.qrcode?.base64;
      return { success: true, qrcode, code: data?.code, pairingCode: data?.pairingCode };
    }
    return { success: false, error: "Não foi possível obter o QR Code. Certifique-se de que a Evolution API está ativa." };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro de conexão ao buscar QR Code" };
  }
};
