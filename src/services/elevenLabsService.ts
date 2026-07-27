export interface ElevenLabsConfig {
  apiKey?: string;
  voiceId?: string;
  modelId?: string;
}

export const getElevenLabsConfig = (): ElevenLabsConfig => {
  if (typeof window === "undefined") return {};
  const apiKey = localStorage.getItem("elevenlabs_api_key") || "";
  const voiceId = localStorage.getItem("elevenlabs_voice_id") || "21m00Tcm4TlvDq8ikWAM";
  return { apiKey, voiceId, modelId: "eleven_multilingual_v2" };
};

export const saveElevenLabsConfig = (config: ElevenLabsConfig) => {
  if (typeof window === "undefined") return;
  if (config.apiKey !== undefined) localStorage.setItem("elevenlabs_api_key", config.apiKey);
  if (config.voiceId !== undefined) localStorage.setItem("elevenlabs_voice_id", config.voiceId);
};

export const generateElevenLabsSpeech = async (text: string): Promise<ArrayBuffer | null> => {
  const config = getElevenLabsConfig();
  if (!config.apiKey) return null;

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId || "21m00Tcm4TlvDq8ikWAM"}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": config.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: config.modelId || "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!res.ok) {
      console.warn("ElevenLabs API Error:", res.statusText);
      return null;
    }

    return await res.arrayBuffer();
  } catch (err) {
    console.error("Erro ao conectar com ElevenLabs:", err);
    return null;
  }
};
