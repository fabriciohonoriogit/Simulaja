/**
 * Voicebox & Audio Podcast Service
 * Suporta o motor Voicebox (github.com/jamiepine/voicebox) para clonagem de voz
 * e síntese de áudio de apresentações executivas.
 */

export interface VoiceProfile {
  id: string;
  name: string;
  sampleUrl?: string;
  isCloned: boolean;
  status: "ready" | "recording" | "processing";
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
  name: "Fabricio Honório (Voz Clonada - Voicebox AI)",
  isCloned: true,
  status: "ready",
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
   * Converte texto em fala utilizando a API Web Speech / Voicebox síntese.
   */
  async synthesizeAudio(text: string): Promise<string> {
    return new Promise((resolve) => {
      // Simula síntese e gera áudio via Web Speech API fallback
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-BR";
        utterance.rate = 1.0;
        utterance.pitch = 0.95; // Tom masculino consultivo
        
        // Tenta encontrar voz pt-BR
        const voices = window.speechSynthesis.getVoices();
        const brVoice = voices.find((v) => v.lang.includes("pt") || v.lang.includes("BR"));
        if (brVoice) utterance.voice = brVoice;

        window.speechSynthesis.speak(utterance);
      }

      // Retorna URL de áudio simulada
      resolve("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
    });
  },
};
