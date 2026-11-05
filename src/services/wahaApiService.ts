/**
 * Serviço de Integração WAHA (WhatsApp HTTP API - devlikeapro/waha)
 * Sistema de mensageria ultraleve, estável e direto para envio pelo CRM.
 */

export interface WahaConfig {
  apiUrl: string;
  apiKey: string;
  sessionName: string;
}

export interface WahaSendParams {
  number: string;
  text: string;
  sessionName?: string;
}

export interface WahaSendFileParams {
  number: string;
  fileUrl: string;
  filename: string;
  caption?: string;
  sessionName?: string;
}

const STORAGE_KEYS = {
  API_URL: "waha_api_url",
  API_KEY: "waha_api_key",
  SESSION: "waha_session_name",
};

export const formatWahaNumber = (number: string): string => {
  let clean = number.replace(/\D/g, "");
  if (!clean.startsWith("55") && clean.length >= 10 && clean.length <= 11) {
    clean = `55${clean}`;
  }
  return clean;
};

export const formatWahaChatId = (number: string): string => {
  const clean = formatWahaNumber(number);
  return clean.includes("@c.us") ? clean : `${clean}@c.us`;
};

export const getWahaConfig = (): WahaConfig => {
  if (typeof window === "undefined") {
    return { apiUrl: "http://localhost:3000", apiKey: "", sessionName: "default" };
  }
  const savedUrl = localStorage.getItem(STORAGE_KEYS.API_URL) || "http://localhost:3000";
  const savedKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || "";
  const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION) || "default";
  return { apiUrl: savedUrl.replace(/\/+$/, ""), apiKey: savedKey, sessionName: savedSession };
};

export const saveWahaConfig = (config: Partial<WahaConfig>) => {
  if (typeof window === "undefined") return;
  if (config.apiUrl !== undefined) localStorage.setItem(STORAGE_KEYS.API_URL, config.apiUrl.replace(/\/+$/, ""));
  if (config.apiKey !== undefined) localStorage.setItem(STORAGE_KEYS.API_KEY, config.apiKey);
  if (config.sessionName !== undefined) localStorage.setItem(STORAGE_KEYS.SESSION, config.sessionName || "default");
};

export const isWahaConfigured = (): boolean => {
  const { apiUrl } = getWahaConfig();
  return Boolean(apiUrl && apiUrl.trim().length > 0);
};

const getWahaHeaders = (apiKey?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json, image/png, */*",
  };
  const key = apiKey !== undefined ? apiKey : getWahaConfig().apiKey;
  if (key && key.trim()) {
    headers["X-Api-Key"] = key.trim();
  }
  return headers;
};

/**
 * Consulta o status da sessão no WAHA
 * Retornos típicos: 'WORKING' (Conectado), 'SCAN_QR_CODE', 'STARTING', 'STOPPED', 'FAILED'
 */
export const checkWahaStatus = async (customSession?: string): Promise<{
  state: "WORKING" | "SCAN_QR_CODE" | "STARTING" | "STOPPED" | "FAILED" | "DISCONNECTED";
  data?: any;
  reason?: string;
}> => {
  const config = getWahaConfig();
  const session = customSession || config.sessionName || "default";

  if (!config.apiUrl) {
    return {
      state: "DISCONNECTED",
      reason: "Configure a URL da API WAHA antes de verificar o status.",
    };
  }

  try {
    const endpoint = `${config.apiUrl}/api/sessions/${session}`;
    const res = await fetch(endpoint, {
      method: "GET",
      headers: getWahaHeaders(config.apiKey),
    });

    if (res.ok) {
      const data = await res.json();
      const status = (data?.status || "STOPPED").toUpperCase();
      return {
        state: status === "WORKING" ? "WORKING" : (status as any),
        data,
      };
    }

    if (res.status === 404) {
      // Sessão ainda não foi iniciada ou criada
      return {
        state: "STOPPED",
        reason: `Sessão '${session}' não encontrada no WAHA. Clique para provisionar ou iniciar.`,
      };
    }

    const errText = await res.text().catch(() => "");
    return {
      state: "DISCONNECTED",
      reason: `Servidor WAHA retornou erro HTTP ${res.status}: ${errText.substring(0, 100)}`,
    };
  } catch (err: any) {
    return {
      state: "DISCONNECTED",
      reason: `Não foi possível conectar ao WAHA em ${config.apiUrl}. Verifique se o container Docker está rodando.`,
    };
  }
};

/**
 * Cria ou inicializa uma sessão WAHA
 */
export const startWahaSession = async (customSession?: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  const config = getWahaConfig();
  const session = customSession || config.sessionName || "default";

  try {
    // 1. Tenta iniciar a sessão caso já exista
    const startRes = await fetch(`${config.apiUrl}/api/sessions/${session}/start`, {
      method: "POST",
      headers: getWahaHeaders(config.apiKey),
    });

    if (startRes.ok) {
      const data = await startRes.json().catch(() => ({}));
      return { success: true, data };
    }

    // 2. Se não existir, tenta criar
    const createRes = await fetch(`${config.apiUrl}/api/sessions`, {
      method: "POST",
      headers: getWahaHeaders(config.apiKey),
      body: JSON.stringify({
        name: session,
        config: {},
      }),
    });

    if (createRes.ok) {
      const data = await createRes.json().catch(() => ({}));
      return { success: true, data };
    }

    const err = await createRes.text().catch(() => "Erro desconhecido");
    return { success: false, error: err };
  } catch (err: any) {
    return { success: false, error: err?.message || "Falha ao iniciar sessão no WAHA" };
  }
};

/**
 * Busca o QR Code gerado pelo WAHA (retorna base64 para exibição direta em <img>)
 */
export const fetchWahaQrCode = async (customSession?: string): Promise<{
  success: boolean;
  connected?: boolean;
  qrcode?: string;
  error?: string;
}> => {
  const config = getWahaConfig();
  const session = customSession || config.sessionName || "default";

  // Primeiro checa status
  const statusRes = await checkWahaStatus(session);
  if (statusRes.state === "WORKING") {
    return { success: true, connected: true };
  }

  // Se a sessão estiver parada, inicia primeiro
  if (statusRes.state === "STOPPED" || statusRes.state === "DISCONNECTED") {
    await startWahaSession(session);
    await new Promise((r) => setTimeout(r, 1200));
  }

  try {
    // WAHA provê QR Code no endpoint /api/{session}/auth/qr como imagem PNG
    const qrEndpoint = `${config.apiUrl}/api/${session}/auth/qr`;
    const res = await fetch(qrEndpoint, {
      method: "GET",
      headers: getWahaHeaders(config.apiKey),
    });

    if (res.ok) {
      const blob = await res.blob();
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      return {
        success: true,
        connected: false,
        qrcode: base64Data,
      };
    }

    // Fallback: tenta obter via screenshot do container
    const screenshotEndpoint = `${config.apiUrl}/api/screenshot?session=${session}`;
    const screenRes = await fetch(screenshotEndpoint, {
      method: "GET",
      headers: getWahaHeaders(config.apiKey),
    });

    if (screenRes.ok) {
      const blob = await screenRes.blob();
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      return {
        success: true,
        connected: false,
        qrcode: base64Data,
      };
    }

    return {
      success: false,
      error: `Aguardando o WAHA gerar o QR Code. Tente novamente em alguns segundos.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Erro ao obter QR Code do WAHA: ${err?.message || "Servidor offline"}`,
    };
  }
};

/**
 * Solicita código de pareamento numérico de 8 dígitos (sem escanear QR Code)
 */
export const requestWahaPairingCode = async (
  phoneNumber: string,
  customSession?: string
): Promise<{ success: boolean; code?: string; error?: string }> => {
  const config = getWahaConfig();
  const session = customSession || config.sessionName || "default";
  const cleanNumber = formatWahaNumber(phoneNumber);

  try {
    const endpoint = `${config.apiUrl}/api/${session}/auth/request-code`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: getWahaHeaders(config.apiKey),
      body: JSON.stringify({ phoneNumber: cleanNumber }),
    });

    if (res.ok) {
      const data = await res.json();
      const code = data?.code || data?.pairingCode || (typeof data === "string" ? data : "");
      return { success: true, code };
    }

    const err = await res.text().catch(() => "");
    return { success: false, error: err || "Não foi possível gerar código de pareamento" };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro de conexão ao solicitar código" };
  }
};

/**
 * Disparo direto de mensagem de texto via WAHA (POST /api/sendText)
 * Não abre WhatsApp Web, dispara 100% silencioso pelo CRM!
 */
export const sendWahaTextMessage = async ({
  number,
  text,
  sessionName,
}: WahaSendParams): Promise<{ success: boolean; data?: any; error?: string }> => {
  const config = getWahaConfig();
  const session = sessionName || config.sessionName || "default";
  const chatId = formatWahaChatId(number);

  try {
    const endpoint = `${config.apiUrl}/api/sendText`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: getWahaHeaders(config.apiKey),
      body: JSON.stringify({
        session,
        chatId,
        text,
      }),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: true, data };
    }

    const errText = await response.text().catch(() => "");
    return {
      success: false,
      error: `WAHA HTTP ${response.status}: ${errText.substring(0, 150)}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Falha de rede ao conectar com WAHA: ${err?.message || "Erro desconhecido"}`,
    };
  }
};

/**
 * Disparo de arquivo ou imagem via WAHA (POST /api/sendFile)
 * Útil para enviar simulações, banners da Black Friday e boletos
 */
export const sendWahaFileMessage = async ({
  number,
  fileUrl,
  filename,
  caption,
  sessionName,
}: WahaSendFileParams): Promise<{ success: boolean; data?: any; error?: string }> => {
  const config = getWahaConfig();
  const session = sessionName || config.sessionName || "default";
  const chatId = formatWahaChatId(number);

  try {
    const endpoint = `${config.apiUrl}/api/sendFile`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: getWahaHeaders(config.apiKey),
      body: JSON.stringify({
        session,
        chatId,
        file: {
          url: fileUrl,
          filename: filename || "proposta.pdf",
        },
        caption: caption || "",
      }),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: true, data };
    }

    const errText = await response.text().catch(() => "");
    return {
      success: false,
      error: `WAHA Arquivo HTTP ${response.status}: ${errText.substring(0, 150)}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Falha ao enviar arquivo via WAHA: ${err?.message || "Erro desconhecido"}`,
    };
  }
};

