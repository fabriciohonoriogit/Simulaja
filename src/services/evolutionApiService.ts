import { supabase } from "@/integrations/supabase/client";

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

export const getEvolutionConfig = (): EvolutionConfig => {
  if (typeof window === "undefined") {
    return { apiUrl: "", apiKey: "", instanceName: "simulaja" };
  }
  const savedUrl = localStorage.getItem("evolution_api_url") || "https://api.simulaja.com.br";
  const savedKey = localStorage.getItem("evolution_api_key") || "";
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
}

export const sendWhatsAppMessage = async ({ number, text }: SendMessageParams) => {
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
      return { success: false, error: errText };
    }
  } catch (error: any) {
    console.error("[Evolution API] Exceção na chamada:", error);
    
    // Tenta fallback via Edge Function caso cliente esteja rodando no Supabase
    try {
      const { data, error: edgeErr } = await supabase.functions.invoke("evolution-send-message", {
        body: { number: cleanNumber, text, instanceName: config.instanceName },
      });
      if (!edgeErr && data) {
        return { success: true, data };
      }
    } catch (e) {
      // ignore fallback error
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
