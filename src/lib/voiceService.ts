// Helper de voz humana ultra-natural (Neural/Natural) com modulação prosódica e respiração fluida para o Jarvis

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

  // Prioridade para vozes com tecnologia Natural/Neural (Microsoft e Google)
  // Tom barítono humano, seguro, caloroso, enérgico e envolvente
  const priorityVoices = [
    "antonio",                  // Microsoft Antonio Online (Natural) - PT-BR (Barítono Executivo Perfeito)
    "fabio",                    // Microsoft Fabio Online (Natural) - PT-BR (Dinâmico e Confiante)
    "thomaz",                   // Microsoft Thomaz Online (Natural) - PT-BR (Aveludado e Suave)
    "google português do brasil", // Google PT-BR (Natural Chrome)
    "francisca",                // Microsoft Francisca Online (Natural)
    "daniel",                   // Voz Daniel (Windows SAPI)
    "ricardo",
    "thalita",
    "giovanna",
    "luciana",
  ];

  for (const keyword of priorityVoices) {
    const found = ptVoices.find((v) => v.name.toLowerCase().includes(keyword));
    if (found) return found;
  }

  return ptVoices[0] || null;
}

export function getBestFemaleVoice(): SpeechSynthesisVoice | null {
  return getBestPtBrVoice();
}

/**
 * Normaliza o texto para que a pronúncia soe 100% como uma pessoa conversando ao vivo
 * Eliminando jargões truncados, siglas estranhas e pausas artificiais.
 */
export function normalizeTextForSpeech(text: string): string {
  if (!text) return "";

  let cleaned = text
    // Remove blocos de código e markdown
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\{[\s\S]*?\}/g, "")
    .replace(/[*_#`~{}]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/🚀|✨|🏆|💡|📊|🤖|✴|●|🟢|⚠️|📌|🏛️|📈|📰|🎯|[\u2000-\u3300]/g, "")
    .replace(/API key|INVALID_ARGUMENT|Indisponibilidade|Erro interno|status 500/gi, "")
    // Remove marcadores de lista que causam pausas secas
    .replace(/^[•\-\*]\s+/gm, "")
    .replace(/\n[•\-\*]\s+/g, ", ")
    .replace(/["“”«»]/g, "") // aspas causam pausas duras
    .replace(/\s*:\s*/g, ", "); // dois pontos substituídos por vírgula para fluidez

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

  // Limpa espaços duplicados
  return cleaned.replace(/\s+/g, " ").trim();
}

/**
 * Sintetizador Jarvis com respiração fluida e cadência contínua
 * Sem cortes secos entre frases, mantendo a melodia vocal humana.
 */
let currentAudioPlayer: HTMLAudioElement | null = null;

/**
 * Sintetizador Jarvis com áudio Neural HD (Edge-TTS) e Fallback Instantâneo
 * Proporciona voz humana de cinema com timbre barítono natural, respiração e modulação.
 */
export function speakJarvisText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  customVoice?: SpeechSynthesisVoice | null
) {
  const cleanText = normalizeTextForSpeech(text);

  if (!cleanText || cleanText.length < 2) {
    if (onEnd) onEnd();
    return;
  }

  // Interrompe reproduções anteriores
  stopVoice();

  // Tentativa 1: Motor Neural HD via Servidor Local (/api/tts - Microsoft Antonio Neural com Modulação Dinâmica)
  // Se o servidor local estiver ativo, reproduz com velocidade executiva (+18%) e tom dinâmico (+4Hz)
  const tryNeuralTTS = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const url = `http://localhost:3000/api/tts?voice=pt-BR-AntonioNeural&rate=%2B18%25&pitch=%2B4Hz&volume=%2B15%25&text=${encodeURIComponent(cleanText.slice(0, 1000))}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("TTS endpoint não retornou 200");

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudioPlayer = audio;

      audio.onplay = () => {
        if (onStart) onStart();
      };

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioPlayer = null;
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioPlayer = null;
        speakJarvisLocalSpeech(cleanText, onStart, onEnd, customVoice);
      };

      await audio.play();
      return true;
    } catch (e) {
      // Se der timeout ou o servidor local não estiver rodando, faz fallback instantâneo
      speakJarvisLocalSpeech(cleanText, onStart, onEnd, customVoice);
      return false;
    }
  };

  tryNeuralTTS();
}

/**
 * Fallback local nativo de síntese vocal para garantir que nunca fique mudo
 */
export function speakJarvisLocalSpeech(
  cleanText: string,
  onStart?: () => void,
  onEnd?: () => void,
  customVoice?: SpeechSynthesisVoice | null
) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
  } catch (e) {}

  const voice = customVoice || getBestPtBrVoice();

  const chunks: string[] = [];
  const words = cleanText.split(" ");
  let currentChunk = "";

  for (const word of words) {
    if ((currentChunk + " " + word).length > 200 && /[.,;!?]$/.test(currentChunk)) {
      chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk += (currentChunk ? " " : "") + word;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  if (chunks.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  let index = 0;

  const playChunk = () => {
    if (index >= chunks.length) {
      if (onEnd) onEnd();
      return;
    }

    const chunkText = chunks[index];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = "pt-BR";

    if (voice) {
      utterance.voice = voice;
    }

    // Taxa e tom ajustados para cadência ágil, confiante, expressiva e dinâmica (adeus lentidão e robotização!)
    utterance.rate = 1.18;
    utterance.pitch = 1.08;

    if (index === 0 && onStart) {
      utterance.onstart = () => onStart();
    }

    utterance.onend = () => {
      index++;
      playChunk();
    };

    utterance.onerror = () => {
      index++;
      playChunk();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (onEnd) onEnd();
    }
  };

  playChunk();
}

export function stopVoice() {
  if (currentAudioPlayer) {
    try {
      currentAudioPlayer.pause();
      currentAudioPlayer.currentTime = 0;
    } catch (e) {}
    currentAudioPlayer = null;
  }

  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

export const speakText = speakJarvisText;
export const speakBellaText = speakJarvisText;
