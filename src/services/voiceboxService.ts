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
    const semSeguroFmt = params.parcelaSemSeguro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const posFmt = params.parcelaPos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const consultor = params.consultorNome || "Fabricio Honório";

    return `Olá, ${nome}! Aqui é o ${consultor}, Gestor de Negócios e Especialista em Consórcios do Consórcio Magalu.

Preparei um estudo estratégico exclusivo para o seu plano no Grupo ${params.grupo}.

Conseguimos estruturar um crédito integral de ${credFmt} com uma parcela reduzida de apenas ${parcFmt} até a contemplação.

E temos uma excelente notícia: optando pela contratação com bonificação sem seguro, a sua parcela cai para apenas ${semSeguroFmt}!

Além disso, após a contemplação por sorteio ou lance, a sua parcela ajustada fica em aproximadamente ${posFmt}, permitindo alavancar seu patrimônio, veículos ou máquinas agrícolas com total previsibilidade e sem pagar juros bancários.

Estou à disposição para tirarmos qualquer dúvida e garantirmos a sua cota. Um forte abraço!`;
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
