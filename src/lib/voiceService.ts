// Motor de Síntese Vocal Humana com Emoção, Prosódia Adaptativa e Áudio Segmentado
// J.A.R.V.I.S OS // Neural Audio Pipeline

export type VoiceEmotion =
  | "neutro"
  | "alegre"
  | "empolgado"
  | "calmo"
  | "sério"
  | "empático"
  | "curioso"
  | "surpreso";

export type ExpressivenessLevel = "baixa" | "media" | "alta";

export interface SpeechSegment {
  id: string;
  text: string;
  rawText: string;
  emotion: VoiceEmotion;
  pauseAfterMs: number;
}

export interface VoicePlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onSegmentStart?: (segment: SpeechSegment, index: number, total: number) => void;
  onEmotionChange?: (emotion: VoiceEmotion) => void;
  onError?: (err: any) => void;
}

// Prosódia padrão do Edge TTS por emoção
export const EMOTION_PROSODY: Record<
  VoiceEmotion,
  { rateDelta: number; pitchHz: number; volumePct: number }
> = {
  neutro: { rateDelta: 15, pitchHz: 0, volumePct: 10 },
  alegre: { rateDelta: 20, pitchHz: 6, volumePct: 15 },
  empolgado: { rateDelta: 25, pitchHz: 10, volumePct: 20 },
  calmo: { rateDelta: 5, pitchHz: -4, volumePct: 0 },
  sério: { rateDelta: 10, pitchHz: -6, volumePct: 10 },
  empático: { rateDelta: 8, pitchHz: -2, volumePct: 5 },
  curioso: { rateDelta: 18, pitchHz: 8, volumePct: 10 },
  surpreso: { rateDelta: 22, pitchHz: 12, volumePct: 18 },
};

// Falas de preenchimento humanizadas (sem jargões robóticos de motores)
export const FILLER_PHRASES = [
  "Um momento, Fabrício...",
  "Perfeito, já estou levantando essas informações...",
  "Com certeza, só um instante...",
  "Certo, já estou preparando a resposta...",
  "Ótimo ponto, um segundo..."
];

let lastFillerIndex = -1;

export function getRandomFillerPhrase(): string {
  let index = Math.floor(Math.random() * FILLER_PHRASES.length);
  if (index === lastFillerIndex) {
    index = (index + 1) % FILLER_PHRASES.length;
  }
  lastFillerIndex = index;
  return FILLER_PHRASES[index];
}

// Cache em memória para AudioBuffers de frases curtas e preenchimento
const audioBufferCache = new Map<string, AudioBuffer>();

// Singleton de Web Audio Context e AnalyserNode
let audioCtx: AudioContext | null = null;
let globalAnalyser: AnalyserNode | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let currentGainNode: GainNode | null = null;

// Controle de sessão e barge-in
let activePlaybackSessionId = 0;
let isPlaybackRunning = false;

// Fallback simulated audio envelope animation
let simulatedEnvelopeAnim: number | null = null;
let simulatedFrequencyListener: ((bass: number, treble: number, amp: number) => void) | null = null;

export function registerSimulatedAudioListener(
  listener: ((bass: number, treble: number, amp: number) => void) | null
) {
  simulatedFrequencyListener = listener;
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function getGlobalAnalyser(): AnalyserNode | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (!globalAnalyser) {
    globalAnalyser = ctx.createAnalyser();
    globalAnalyser.fftSize = 128;
    globalAnalyser.smoothingTimeConstant = 0.8;
    globalAnalyser.connect(ctx.destination);
  }
  return globalAnalyser;
}

// Limpa todas as tags de fala para exibição no front-end, cópia ou WhatsApp
export function stripEmotionTags(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[(?:pausa|pausa longa|respira|emoção:[^\]]+)\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normaliza o texto para pronúncia conversacional brasileira perfeita
 */
export function normalizeTextForSpeech(text: string): string {
  if (!text) return "";

  let cleaned = stripEmotionTags(text)
    // Remove blocos de código e markdown
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\{[\s\S]*?\}/g, "")
    .replace(/[*_#`~{}]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, "")
    .replace(/🚀|✨|🏆|💡|📊|🤖|✴|●|🟢|⚠️|📌|🏛️|📈|📰|🎯|[\u2000-\u3300]/g, "")
    .replace(/API key|INVALID_ARGUMENT|Indisponibilidade|Erro interno|status 500/gi, "")
    // Remove marcadores de lista
    .replace(/^[•\-\*]\s+/gm, "")
    .replace(/\n[•\-\*]\s+/g, ", ")
    .replace(/["“”«»]/g, "")
    .replace(/\s*:\s*/g, ", ");

  // Normalização de valores monetários e números para fala humana 100% fluida
  cleaned = cleaned
    // 1. Abreviações de milhares com 'mil' ou 'k' (ex: "100mil", "100 mil", "100k", "R$ 100 mil", "100 mil reais")
    .replace(/R\$\s*([\d\.,]+)\s*(?:mil|k)\s*(?:de\s*)?reais\b/gi, "$1 mil reais")
    .replace(/R\$\s*([\d\.,]+)\s*(?:mil|k)\b/gi, "$1 mil reais")
    .replace(/\b(\d+)\s*mil\s*(?:de\s*)?reais\b/gi, "$1 mil reais")
    .replace(/\b(\d+)\s*mil\b/gi, "$1 mil reais")
    .replace(/\b(\d+)mil\b/gi, "$1 mil reais")
    .replace(/\b(\d+)\s*k\b/gi, "$1 mil reais")
    .replace(/\b(\d+)k\b/gi, "$1 mil reais")

    // 2. Valores monetários completos: R$ 100.000,00 ou R$ 100.000 (múltiplos de mil viram "X mil reais", ex: 100 mil reais)
    .replace(/R\$\s*([\d\.]+),(\d{2})/gi, (_, intVal, cents) => {
      const rawNum = parseInt(intVal.replace(/\./g, ""), 10);
      let numStr = `${rawNum}`;
      if (rawNum >= 1000 && rawNum % 1000 === 0 && rawNum < 1000000) {
        numStr = `${rawNum / 1000} mil`;
      } else if (rawNum >= 1000000 && rawNum % 1000000 === 0) {
        numStr = `${rawNum / 1000000} milhão`;
      }
      if (cents === "00") return `${numStr} reais`;
      return `${numStr} reais e ${cents} centavos`;
    })
    .replace(/R\$\s*([\d\.]+)/gi, (_, intVal) => {
      const rawNum = parseInt(intVal.replace(/\./g, ""), 10);
      let numStr = `${rawNum}`;
      if (rawNum >= 1000 && rawNum % 1000 === 0 && rawNum < 1000000) {
        numStr = `${rawNum / 1000} mil`;
      } else if (rawNum >= 1000000 && rawNum % 1000000 === 0) {
        numStr = `${rawNum / 1000000} milhão`;
      }
      return `${numStr} reais`;
    })
    // 3. Previne duplicação acidental "reais reais"
    .replace(/\breais\s+reais\b/gi, "reais")
    .replace(/(\d+),(\d+)%/g, "$1 vírgula $2 por cento")
    .replace(/(\d+)%/g, "$1 por cento")
    .replace(/\ba\.a\./gi, "ao ano")
    .replace(/\ba\.a\b/gi, "ao ano")
    .replace(/\ba\.m\./gi, "ao mês")
    .replace(/\ba\.m\b/gi, "ao mês")
    .replace(/\/mês\b/gi, " por mês")
    .replace(/\/mes\b/gi, " por mês")
    .replace(/\/L\b/gi, " por litro")
    .replace(/50\/50/gi, "cinquenta por cinquenta, meia parcela")
    .replace(/\bIPCA\b/gi, "I-P-C-A")
    .replace(/\bIGP-M\b/gi, "I-G-P-M")
    .replace(/\bIGPM\b/gi, "I-G-P-M")
    .replace(/\bINCC\b/gi, "I-N-C-C")
    .replace(/\bBCB\b/gi, "Banco Central")
    .replace(/\bCOPOM\b/gi, "Copom")
    .replace(/\bANP\b/gi, "A-N-P")
    .replace(/\bFIPE\b/gi, "Fipe")
    .replace(/\bCDC\b/gi, "financiamento bancário tradicional")
    .replace(/\bABAC\b/gi, "Ábaque")
    .replace(/\bCNPJ\b/gi, "C-N-P-J")
    .replace(/\bQSA\b/gi, "quadro societário");

  return cleaned.replace(/\s+/g, " ").trim();
}

/**
 * Heurística local para detecção de emoção quando o LLM não enviar tags
 */
export function inferEmotionFromText(text: string): VoiceEmotion {
  const lower = text.toLowerCase();

  if (lower.includes("desculp") || lower.includes("sinto muito") || lower.includes("compreendo") || lower.includes("entendo você") || lower.includes("infelizmente")) {
    return "empático";
  }
  if (lower.includes("atenção") || lower.includes("urgente") || lower.includes("alerta") || lower.includes("crítico") || lower.includes("cuidado")) {
    return "sério";
  }
  if (text.includes("?")) {
    return "curioso";
  }
  if (text.includes("!") || lower.includes("excelente") || lower.includes("ótimo") || lower.includes("fantástico") || lower.includes("sensacional")) {
    return "empolgado";
  }
  if (lower.includes("calma") || lower.includes("tranquil") || lower.includes("sem pressa")) {
    return "calmo";
  }
  return "neutro";
}

/**
 * Parser de texto em segmentos de fala com emoção, pausas orgânicas e prosódia
 */
export function parseSpeechSegments(
  rawText: string,
  expressiveness: ExpressivenessLevel = "alta",
  isExpressiveActive: boolean = true
): SpeechSegment[] {
  if (!rawText || !rawText.trim()) return [];

  const segments: SpeechSegment[] = [];

  // Divide o texto respeitando tags [pausa], [respira], [emoção:...] e pontuação
  // Regex que captura tags ou trechos de frases terminados em pontuação ou quebras
  const regex = /\[(pausa|pausa longa|respira|emoção:[^\]]+)\]|([^\[]+)/gi;
  let match: RegExpExecArray | null;

  let currentEmotion: VoiceEmotion = "neutro";
  let pendingPause = 0;
  let buffer = "";

  const flushBuffer = (pauseAfter: number) => {
    const trimmed = buffer.trim();
    if (!trimmed) return;

    const normalizedText = normalizeTextForSpeech(trimmed);
    if (normalizedText.length >= 2) {
      // Se expressividade estiver desligada, força neutro
      const finalEmotion = isExpressiveActive
        ? currentEmotion || inferEmotionFromText(trimmed)
        : "neutro";

      // Variação humana leve de ±15% na pausa
      const jitter = 0.85 + Math.random() * 0.3;
      const finalPause = Math.round((pauseAfter || 350) * jitter);

      segments.push({
        id: `seg_${Date.now()}_${segments.length}`,
        text: normalizedText,
        rawText: trimmed,
        emotion: finalEmotion,
        pauseAfterMs: finalPause,
      });
    }
    buffer = "";
  };

  while ((match = regex.exec(rawText)) !== null) {
    const tag = match[1];
    const textChunk = match[2];

    if (tag) {
      const lowerTag = tag.toLowerCase();
      if (lowerTag === "pausa") {
        pendingPause += 220;
      } else if (lowerTag === "pausa longa") {
        pendingPause += 600;
      } else if (lowerTag === "respira") {
        pendingPause += 320;
      } else if (lowerTag.startsWith("emoção:")) {
        const emoName = lowerTag.replace("emoção:", "").trim();
        const validEmotions: VoiceEmotion[] = [
          "neutro",
          "alegre",
          "empolgado",
          "calmo",
          "sério",
          "empático",
          "curioso",
          "surpreso",
        ];
        const normalizedEmo = validEmotions.find(
          (e) => e.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === emoName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        );
        if (normalizedEmo) {
          currentEmotion = normalizedEmo;
        }
      }
    } else if (textChunk) {
      // Divide o bloco em sentenças baseadas em pontuação
      const sentences = textChunk.split(/([.!?;]+|\n+)/g);
      for (let i = 0; i < sentences.length; i += 2) {
        const s = sentences[i];
        const punc = sentences[i + 1] || "";

        if (s && s.trim()) {
          buffer += (buffer ? " " : "") + s;
        }

        if (punc) {
          let basePause = 350;
          if (punc.includes("...")) {
            basePause = 600;
          } else if (punc.includes("?") || punc.includes("!")) {
            basePause = 400;
          } else if (punc.includes("\n")) {
            basePause = 700;
          } else if (punc.includes(",")) {
            basePause = 180;
          } else if (punc.includes(";")) {
            basePause = 280;
          }

          const totalPause = (pendingPause > 0 ? pendingPause : basePause);
          pendingPause = 0;
          flushBuffer(totalPause);
        }
      }
    }
  }

  // Descarrega o que sobrou
  if (buffer.trim()) {
    flushBuffer(pendingPause || 350);
  }

  return segments;
}

/**
 * Calcula a prosódia para o Edge TTS com modulação de expressividade e variação humana
 */
export function computeProsody(
  emotion: VoiceEmotion,
  expressiveness: ExpressivenessLevel = "alta"
): { rate: string; pitch: string; volume: string } {
  const base = EMOTION_PROSODY[emotion] || EMOTION_PROSODY.neutro;

  // Fator de escala da expressividade
  const scale = expressiveness === "baixa" ? 0.35 : expressiveness === "media" ? 0.65 : 1.0;

  // Micro-variação orgânica entre frases (±2% rate, ±1Hz pitch)
  const rateJitter = (Math.random() * 4 - 2) * scale;
  const pitchJitter = (Math.random() * 2 - 1) * scale;

  const finalRateDelta = Math.round(base.rateDelta * scale + rateJitter);
  const finalPitchHz = Math.round(base.pitchHz * scale + pitchJitter);
  const finalVolumePct = Math.round(base.volumePct * scale);

  const rateStr = finalRateDelta >= 0 ? `+${finalRateDelta}%` : `${finalRateDelta}%`;
  const pitchStr = finalPitchHz >= 0 ? `+${finalPitchHz}Hz` : `${finalPitchHz}Hz`;
  const volumeStr = finalVolumePct >= 0 ? `+${finalVolumePct}%` : `${finalVolumePct}%`;

  return { rate: rateStr, pitch: pitchStr, volume: volumeStr };
}

/**
 * Busca e decodifica o áudio de um segmento via Edge TTS no servidor local
 */
async function fetchAndDecodeSegmentAudio(
  segment: SpeechSegment,
  voice: string,
  expressiveness: ExpressivenessLevel
): Promise<AudioBuffer | null> {
  const cacheKey = `${voice}_${segment.emotion}_${expressiveness}_${segment.text}`;
  if (audioBufferCache.has(cacheKey)) {
    return audioBufferCache.get(cacheKey)!;
  }

  const ctx = getAudioContext();
  if (!ctx) return null;

  const prosody = computeProsody(segment.emotion, expressiveness);
  const url = `http://localhost:3000/api/tts?voice=${encodeURIComponent(
    voice
  )}&rate=${encodeURIComponent(prosody.rate)}&pitch=${encodeURIComponent(
    prosody.pitch
  )}&volume=${encodeURIComponent(prosody.volume)}&emotion=${encodeURIComponent(
    segment.emotion
  )}&text=${encodeURIComponent(segment.text)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // Salva no cache se for frase curta (< 80 caracteres)
    if (segment.text.length < 80) {
      audioBufferCache.set(cacheKey, audioBuffer);
    }

    return audioBuffer;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Toca um AudioBuffer via AudioContext com crossfade e conexões de análise
 */
function playAudioBufferWithCrossfade(
  buffer: AudioBuffer,
  ctx: AudioContext,
  analyser: AnalyserNode
): Promise<void> {
  return new Promise((resolve) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    currentSourceNode = source;

    const gain = ctx.createGain();
    currentGainNode = gain;

    // Crossfade suave de 20ms
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(1.0, now + 0.02);

    const fadeOutStart = Math.max(now + 0.02, now + buffer.duration - 0.02);
    gain.gain.setValueAtTime(1.0, fadeOutStart);
    gain.gain.linearRampToValueAtTime(0.001, now + buffer.duration);

    source.connect(gain);
    gain.connect(analyser);

    source.onended = () => {
      try {
        source.disconnect();
        gain.disconnect();
      } catch {}
      if (currentSourceNode === source) {
        currentSourceNode = null;
        currentGainNode = null;
      }
      resolve();
    };

    source.start(now);
  });
}

/**
 * BARGE-IN: Interrompe imediatamente qualquer áudio em reprodução com fade-out
 */
export function stopVoice() {
  activePlaybackSessionId++;
  isPlaybackRunning = false;

  // Fade-out imediato se houver nó tocando
  if (currentGainNode && audioCtx) {
    try {
      const now = audioCtx.currentTime;
      currentGainNode.gain.cancelScheduledValues(now);
      currentGainNode.gain.setValueAtTime(currentGainNode.gain.value, now);
      currentGainNode.gain.linearRampToValueAtTime(0.001, now + 0.04);
    } catch {}
  }

  if (currentSourceNode) {
    try {
      setTimeout(() => {
        try {
          currentSourceNode?.stop();
          currentSourceNode?.disconnect();
        } catch {}
        currentSourceNode = null;
      }, 45);
    } catch {}
  }

  if (simulatedEnvelopeAnim) {
    cancelAnimationFrame(simulatedEnvelopeAnim);
    simulatedEnvelopeAnim = null;
  }

  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {}
  }
}

/**
 * Simula um envelope de áudio orgânico caso o fallback Web Speech API seja usado
 */
function startSimulatedAudioEnvelope(onEndCheck: () => boolean) {
  let phase = 0;
  const loop = () => {
    if (!onEndCheck() || !isPlaybackRunning) {
      if (simulatedFrequencyListener) {
        simulatedFrequencyListener(0, 0, 0);
      }
      return;
    }

    phase += 0.15;
    const amp = 0.35 + Math.sin(phase) * 0.2 + (Math.random() * 0.15);
    const bass = 0.3 + Math.cos(phase * 0.8) * 0.25;
    const treble = 0.25 + Math.sin(phase * 1.4) * 0.2;

    if (simulatedFrequencyListener) {
      simulatedFrequencyListener(bass, treble, amp);
    }

    simulatedEnvelopeAnim = requestAnimationFrame(loop);
  };

  loop();
}

/**
 * Fallback nativo do navegador (SpeechSynthesis) caso o servidor local de Edge TTS não esteja ativo
 */
export function speakJarvisLocalSpeech(
  cleanText: string,
  callbacks?: VoicePlaybackCallbacks,
  customVoice?: SpeechSynthesisVoice | null
) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    callbacks?.onEnd?.();
    return;
  }

  stopVoice();
  const sessionId = ++activePlaybackSessionId;
  isPlaybackRunning = true;
  callbacks?.onStart?.();

  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      window.speechSynthesis.resume();
    } catch {}
  }

  const voice = customVoice || getBestPtBrVoice();
  const rawSentences = cleanText.split(/([.!?;:\n]+)/g);
  const chunks: string[] = [];
  let currentChunk = "";

  for (let i = 0; i < rawSentences.length; i++) {
    const part = rawSentences[i];
    if (!part) continue;
    if ((currentChunk + part).length > 140 && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = part;
    } else {
      currentChunk += part;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  let index = 0;
  const playChunk = () => {
    if (activePlaybackSessionId !== sessionId || index >= chunks.length) {
      isPlaybackRunning = false;
      callbacks?.onEnd?.();
      return;
    }

    const chunkText = chunks[index];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = "pt-BR";
    if (voice) utterance.voice = voice;

    utterance.rate = 1.12;
    utterance.pitch = 1.05;

    let utteranceActive = true;
    startSimulatedAudioEnvelope(() => utteranceActive);

    utterance.onend = () => {
      utteranceActive = false;
      index++;
      playChunk();
    };

    utterance.onerror = () => {
      utteranceActive = false;
      index++;
      playChunk();
    };

    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch {
      callbacks?.onEnd?.();
    }
  };

  playChunk();
}

/**
 * Fallback Web Speech API quando o servidor local de Edge TTS não estiver ativo (mantido para compatibilidade)
 */
function playWebSpeechFallback(
  segments: SpeechSegment[],
  callbacks?: VoicePlaybackCallbacks,
  customVoice?: SpeechSynthesisVoice | null
) {
  const fullText = segments.map((s) => s.text).join(" ");
  speakJarvisLocalSpeech(fullText, callbacks, customVoice);
}

/**
 * Sintetizador Jarvis com Voz Humana Ultra-Natural (Microsoft Antonio Neural)
 * Proporciona a fala contínua, executiva, quente e envolvente que o usuário aprovou,
 * eliminando fragmentações artificiais, travamentos ou falhas em números e moedas.
 */
export async function speakJarvisText(
  rawText: string,
  callbacks?: VoicePlaybackCallbacks | (() => void),
  onEndLegacy?: () => void,
  options?: {
    expressiveness?: ExpressivenessLevel;
    isExpressiveActive?: boolean;
    customVoice?: SpeechSynthesisVoice | null;
  }
) {
  // Compatibilidade com callbacks legado: (text, onStart, onEnd)
  const cb: VoicePlaybackCallbacks =
    typeof callbacks === "function"
      ? { onStart: callbacks, onEnd: onEndLegacy }
      : callbacks || {};

  const cleanText = normalizeTextForSpeech(rawText);
  if (!cleanText || cleanText.length < 2) {
    cb.onEnd?.();
    return;
  }

  // Interrompe reproduções anteriores (barge-in instantâneo)
  stopVoice();
  const sessionId = ++activePlaybackSessionId;
  isPlaybackRunning = true;

  const emotion = inferEmotionFromText(cleanText);
  cb.onEmotionChange?.(emotion);

  const ctx = getAudioContext();
  const analyser = getGlobalAnalyser();

  // Tentativa 1: Motor Neural HD Contínuo via Edge TTS (Microsoft Antonio Neural)
  // Velocidade executiva fluida (+18%), tom firme (+4Hz) e volume encorpado (+15%)
  const tryNeuralTTS = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const url = `http://localhost:3000/api/tts?voice=pt-BR-AntonioNeural&rate=%2B18%25&pitch=%2B4Hz&volume=%2B15%25&text=${encodeURIComponent(
        cleanText.slice(0, 1500)
      )}`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`TTS endpoint retornou status ${res.status}`);

      const arrayBuffer = await res.arrayBuffer();
      if (!ctx || !analyser) throw new Error("AudioContext indisponível");

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      if (activePlaybackSessionId !== sessionId || !isPlaybackRunning) return true;

      cb.onStart?.();

      // Toca o áudio completo via AudioBufferSourceNode conectado ao AnalyserNode
      await playAudioBufferWithCrossfade(audioBuffer, ctx, analyser);

      if (activePlaybackSessionId === sessionId) {
        isPlaybackRunning = false;
        cb.onEnd?.();
      }
      return true;
    } catch (err) {
      // Se o servidor local estiver offline ou der timeout, fallback instantâneo sem mudo
      if (activePlaybackSessionId === sessionId && isPlaybackRunning) {
        speakJarvisLocalSpeech(cleanText, cb, options?.customVoice);
      }
      return false;
    }
  };

  tryNeuralTTS();
}

/**
 * Toca uma fala de preenchimento (filler phrase) quando a resposta demorar > 1.2s
 * Desativado: o Jarvis agora responde de forma 100% humanizada sem interrupções robóticas de preenchimento
 */
export async function speakFillerPhrase(_onStart?: () => void, _onEnd?: () => void) {
  return;
}

// Suporte e inicialização de vozes
let availableVoices: SpeechSynthesisVoice[] = [];

export function initVoices(onLoaded?: (voices: SpeechSynthesisVoice[]) => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const load = () => {
    availableVoices = window.speechSynthesis.getVoices();
    if (onLoaded) onLoaded(availableVoices);
  };

  load();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = load;
  }
}

export function getBestPtBrVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  if (availableVoices.length === 0) {
    availableVoices = window.speechSynthesis.getVoices();
  }

  const ptVoices = availableVoices.filter((v) =>
    v.lang.toLowerCase().replace("_", "-").startsWith("pt")
  );

  if (ptVoices.length === 0) return null;

  const priorityVoices = [
    "antonio",
    "fabio",
    "thomaz",
    "google português do brasil",
    "francisca",
    "daniel",
  ];

  for (const keyword of priorityVoices) {
    const found = ptVoices.find((v) => v.name.toLowerCase().includes(keyword));
    if (found) return found;
  }

  return ptVoices[0] || null;
}

export const speakText = speakJarvisText;
export const speakBellaText = speakJarvisText;
