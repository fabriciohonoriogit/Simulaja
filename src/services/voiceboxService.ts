/**
 * Voicebox & Audio Podcast Service — Neural Voice Cloning Engine
 * Suporta clonagem de voz ultra-realista e humana via:
 * 1. ElevenLabs Neural Voice Engine (Clonagem Perfeita com Voice ID do especialista)
 * 2. OpenAI Audio HD Engine (Voz Humana de Alta Fidelidade)
 * 3. Servidor Local Voicebox (http://localhost:5000)
 * 4. Fallback Web Speech com modulador prosódico
 */

export interface VoiceProfile {
  id: string;
  name: string;
  sampleUrl?: string;
  isCloned: boolean;
  status: "ready" | "recording" | "processing";
  engine: "voicestudio" | "elevenlabs" | "openai" | "voicebox_local" | "web_speech";
  voiceStudioServerUrl?: string;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  openAiApiKey?: string;
  voiceboxServerUrl?: string;
}

export interface PodcastScriptParams {
  clienteNome: string;
  credito: number;
  parcelaInicial: number;
  parcelaPos: number;
  parcelaSemSeguro: number;
  prazo: number;
  categoria: string;
  grupo: string;
  consultorNome?: string;
}

export const DEFAULT_VOICE_PROFILE: VoiceProfile = {
  id: "fabricio-voicebox-master",
  name: "Jarvis & Fabricio (VoiceStudio Neural Engine)",
  sampleUrl: "/audio/fabricio_voice_sample.webm",
  isCloned: true,
  status: "ready",
  engine: "voicestudio",
  voiceStudioServerUrl: localStorage.getItem("VOICESTUDIO_SERVER_URL") || "http://localhost:8080",
  elevenLabsVoiceId: localStorage.getItem("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM", // Voice ID clonado
  elevenLabsApiKey: localStorage.getItem("ELEVENLABS_API_KEY") || "",
  openAiApiKey: localStorage.getItem("OPENAI_API_KEY") || "",
  voiceboxServerUrl: localStorage.getItem("VOICEBOX_SERVER_URL") || "http://localhost:5000",
};

export const voiceboxService = {
  /**
   * Gera o roteiro executivo do podcast narrado com tom consultivo de alta conversão.
   */
  generatePodcastScript(params: PodcastScriptParams): string {
    const nome = params.clienteNome?.trim() || "Cliente";
    const credFmt = params.credito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const parcFmt = params.parcelaInicial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const posFmt = params.parcelaPos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const consultor = params.consultorNome || "Fabricio Honório";

    return `Olá, ${nome}! Aqui é o ${consultor}, Gestor de Negócios e Especialista em Consórcios do Consórcio Magalu.

Preparei um estudo estratégico exclusivo para a sua aquisição no Grupo ${params.grupo}.

Estruturamos a simulação com um crédito de ${credFmt} e uma parcela inicial reduzida de apenas ${parcFmt} até a contemplação.

Vale lembrar que o valor da sua parcela após a contemplação dependerá da modalidade de contemplação:
- Se você for contemplado via sorteio, a sua parcela pós-contemplação fica em aproximadamente ${posFmt}.
- Se a contemplação for realizada via lance fixo ou lance embutido, o valor abatido reduz ainda mais o seu saldo devedor e ajusta a parcela de acordo com a sua estratégia.

Dessa forma, você conquista seu objetivo com total planejamento e sem pagar juros. Estou à disposição para tirar qualquer dúvida e garantir a sua contemplação! Um abraço!`;
  },

  /**
   * Sintetiza áudio ultra-realista e humano utilizando ElevenLabs, OpenAI ou Web Speech
   */
  async synthesizeAudio(
    text: string,
    profile: VoiceProfile = DEFAULT_VOICE_PROFILE
  ): Promise<{ audioUrl: string | null; error?: string }> {
    // 0. VOICESTUDIO NEURAL ENGINE (Servidor Local ou Rede)
    if (profile.engine === "voicestudio") {
      const serverUrl = profile.voiceStudioServerUrl || localStorage.getItem("VOICESTUDIO_SERVER_URL") || "http://localhost:8080";
      try {
        const response = await fetch(`${serverUrl}/v1/audio/speech`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "tts-1-hd",
            input: text,
            voice: "jarvis",
          }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          return { audioUrl: URL.createObjectURL(audioBlob), error: undefined };
        }
      } catch (err: any) {
        console.warn("[VoiceStudio] Servidor local indisponível, alternando para motor fallback:", err);
      }
    }

    // 1. ELEVENLABS NEURAL VOICE ENGINE (Voz Clonada Perfeita)
    if (profile.engine === "elevenlabs" && profile.elevenLabsApiKey && profile.elevenLabsVoiceId) {
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${profile.elevenLabsVoiceId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": profile.elevenLabsApiKey,
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.45,
                similarity_boost: 0.85,
                style: 0.2,
                use_speaker_boost: true,
              },
            }),
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.detail?.message || `Erro ElevenLabs: ${response.statusText}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        return { audioUrl, error: undefined };
      } catch (err: any) {
        console.error("ElevenLabs Voice Error:", err);
        // Fallback para Web Speech
      }
    }

    // 2. OPENAI AUDIO HD ENGINE
    if (profile.engine === "openai" && profile.openAiApiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${profile.openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "tts-1-hd",
            input: text,
            voice: "onyx", // Voz masculina humana e encorpada
            speed: 1.0,
          }),
        });

        if (!response.ok) {
          throw new Error(`Erro OpenAI Audio: ${response.statusText}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        return { audioUrl, error: undefined };
      } catch (err: any) {
        console.error("OpenAI Audio Error:", err);
      }
    }

    // 3. VOICEBOX LOCAL SERVER
    if (profile.engine === "voicebox_local" && profile.voiceboxServerUrl) {
      try {
        const response = await fetch(`${profile.voiceboxServerUrl}/api/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice_id: "fabricio_honorio" }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          return { audioUrl: URL.createObjectURL(audioBlob) };
        }
      } catch (err) {
        console.error("Voicebox Local Server Error:", err);
      }
    }

    // 4. FALLBACK WEB SPEECH COM PROSÓDIA NATURAL BARÍTONO JARVIS
    return new Promise((resolve) => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-BR";
        utterance.rate = 1.02; // Ritmo elegante e seguro de alto executivo
        utterance.pitch = 0.96; // Barítono executivo aveludado e envolvente

        const voices = window.speechSynthesis.getVoices();
        const brVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().includes("pt") &&
            (v.name.toLowerCase().includes("antonio") ||
             v.name.toLowerCase().includes("thomaz") ||
             v.name.toLowerCase().includes("fabio") ||
             v.name.toLowerCase().includes("daniel") ||
             v.name.toLowerCase().includes("google português") ||
             v.name.toLowerCase().includes("natural"))
        ) || voices.find((v) => v.lang.toLowerCase().includes("pt"));

        if (brVoice) utterance.voice = brVoice;
        window.speechSynthesis.speak(utterance);
      }

      resolve({ audioUrl: null });
    });
  },
};
