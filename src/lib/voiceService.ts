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

// Falas de preenchimento (filler phrases) sem repetição consecutiva
export const FILLER_PHRASES = [
  "Um instante, consultando os dados...",
  "Processando com o motor neural...",
  "Analisando os indicadores...",
  "Um momento, cruzando as informações...",
  "Acessando o banco de dados...",
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

  // Conversão de números e unidades para fala espontânea
  cleaned = cleaned
    .replace(/R\$\s*([\d\.]+),(\d{2})/gi, (_, intVal, cents) => {
      const num = intVal.replace(/\./g, "");
      if (cents === "00") return `${num} reais`;
      return `${num} reais e ${cents} centavos`;
    })
    .replace(/R\$\s*([\d\.]+)/gi, (_, intVal) => {
      const num = intVal.replace(/\./g, "");
      return `${num} reais`;
    })
    .replace(/(\d+),(\d+)%/g, "$1 vírgula $2 por cento")
    .replace(/(\d+)%/g, "$1 por cento")
    .replace(/\ba\.a\./gi, "ao ano")
    .replace(/\ba\.a\b/gi, "ao ano")
    .replace(/\ba\.m\./gi, "ao mês")
    .replace(/\ba\.m\b/gi, "ao mês")
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
 * Fallback Web Speech API quando o servidor local de Edge TTS não estiver ativo
 */
function playWebSpeechFallback(
  segments: SpeechSegment[],
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

  let index = 0;

  const playNext = () => {
    if (activePlaybackSessionId !== sessionId || index >= segments.length) {
      isPlaybackRunning = false;
      callbacks?.onEnd?.();
      return;
    }

    const seg = segments[index];
    callbacks?.onSegmentStart?.(seg, index, segments.length);
    callbacks?.onEmotionChange?.(seg.emotion);

    const utterance = new SpeechSynthesisUtterance(seg.text);
    utterance.lang = "pt-BR";
    const voice = customVoice || getBestPtBrVoice();
    if (voice) utterance.voice = voice;

    // Modulação de rate e pitch na Web Speech API
    const prosody = computeProsody(seg.emotion);
    const rateNum = 1.05 + (parseInt(prosody.rate) || 0) * 0.005;
    const pitchNum = 1.0 + (parseInt(prosody.pitch) || 0) * 0.015;

    utterance.rate = Math.max(0.8, Math.min(1.4, rateNum));
    utterance.pitch = Math.max(0.8, Math.min(1.3, pitchNum));

    let utteranceActive = true;
    startSimulatedAudioEnvelope(() => utteranceActive);

    utterance.onend = () => {
      utteranceActive = false;
      index++;
      setTimeout(playNext, seg.pauseAfterMs);
    };

    utterance.onerror = () => {
      utteranceActive = false;
      index++;
      playNext();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      callbacks?.onEnd?.();
    }
  };

  playNext();
}

/**
 * Sintetizador Principal com Pipeline Segmentado, Pré-busca e Web Audio API
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

  const expressiveness = options?.expressiveness || "alta";
  const isExpressiveActive = options?.isExpressiveActive ?? true;
  const customVoice = options?.customVoice || null;

  const segments = parseSpeechSegments(rawText, expressiveness, isExpressiveActive);
  if (segments.length === 0) {
    cb.onEnd?.();
    return;
  }

  // Interrompe reproduções anteriores (barge-in)
  stopVoice();
  const sessionId = ++activePlaybackSessionId;
  isPlaybackRunning = true;

  const ctx = getAudioContext();
  const analyser = getGlobalAnalyser();

  if (!ctx || !analyser) {
    playWebSpeechFallback(segments, cb, customVoice);
    return;
  }

  cb.onStart?.();

  // Fila de pré-busca de AudioBuffers
  const prefetchQueue: Array<Promise<AudioBuffer | null>> = [];
  const voice = "pt-BR-AntonioNeural";

  // Inicia a pré-busca do primeiro e segundo segmentos imediatamente
  for (let i = 0; i < Math.min(2, segments.length); i++) {
    prefetchQueue[i] = fetchAndDecodeSegmentAudio(segments[i], voice, expressiveness);
  }

  for (let i = 0; i < segments.length; i++) {
    if (activePlaybackSessionId !== sessionId || !isPlaybackRunning) break;

    const segment = segments[i];

    // Dispara a pré-busca do próximo segmento à frente (lookahead)
    const nextIdx = i + 2;
    if (nextIdx < segments.length && !prefetchQueue[nextIdx]) {
      prefetchQueue[nextIdx] = fetchAndDecodeSegmentAudio(segments[nextIdx], voice, expressiveness);
    }

    cb.onSegmentStart?.(segment, i, segments.length);
    cb.onEmotionChange?.(segment.emotion);

    // Aguarda o buffer do segmento atual
    let buffer: AudioBuffer | null = null;
    try {
      buffer = await (prefetchQueue[i] || fetchAndDecodeSegmentAudio(segment, voice, expressiveness));
    } catch {}

    if (activePlaybackSessionId !== sessionId || !isPlaybackRunning) break;

    if (buffer) {
      // Reproduz via AudioContext com crossfade de 20ms
      await playAudioBufferWithCrossfade(buffer, ctx, analyser);

      // Aplica a pausa calculada (silêncio sincronizado)
      if (segment.pauseAfterMs > 0 && i < segments.length - 1) {
        await new Promise((r) => setTimeout(r, segment.pauseAfterMs));
      }
    } else {
      // Se falhar a síntese neural, faz fallback do restante para Web Speech API
      const remainingSegments = segments.slice(i);
      playWebSpeechFallback(remainingSegments, cb, customVoice);
      return;
    }
  }

  if (activePlaybackSessionId === sessionId) {
    isPlaybackRunning = false;
    cb.onEnd?.();
  }
}

/**
 * Toca uma fala de preenchimento (filler phrase) quando a resposta demorar > 1.2s
 */
export async function speakFillerPhrase(onStart?: () => void, onEnd?: () => void) {
  const phrase = getRandomFillerPhrase();
  return speakJarvisText(phrase, { onStart, onEnd });
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
