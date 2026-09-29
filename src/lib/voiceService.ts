// Helper para carregar e selecionar vozes humanas de altíssima qualidade (Neural/Natural) no Web Speech API

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

  // Vozes com tecnologia Neural / Natural no Windows, Chrome, Edge, Safari e Android
  const priorityVoices = [
    "francisca",       // Microsoft Francisca Online (Natural) - PT-BR (Empática e aveludada)
    "thalita",         // Microsoft Thalita Online (Natural) - PT-BR
    "antonio",         // Microsoft Antonio Online (Natural) - PT-BR (Masculino Humano)
    "fabio",           // Microsoft Fabio Online (Natural) - PT-BR
    "giovanna",
    "luciana",
    "vitória",
    "vitoria",
    "google português do brasil",
    "brazil female",
    "leticia",
    "letícia",
    "heloisa",
    "heloísa",
    "daniel"
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

export function normalizeTextForSpeech(text: string): string {
  if (!text) return "";

  let cleaned = text
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\{[\s\S]*?\}/g, "")
    .replace(/[*_#`~{}]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/🚀|✨|🏆|💡|📊|🤖|✴|●|🟢|⚠️|[\u2000-\u3300]/g, "")
    .replace(/API key|INVALID_ARGUMENT|Indisponibilidade|Erro interno|status 500/gi, "");

  // Converte valores monetários, porcentagens e jargões para pronúncia humana fluida
  cleaned = cleaned
    .replace(/R\$\s*500\.000,00/gi, "quinhentos mil reais")
    .replace(/R\$\s*500\.000/gi, "quinhentos mil reais")
    .replace(/R\$\s*500mil/gi, "quinhentos mil reais")
    .replace(/R\$\s*1\.650,42/gi, "mil seiscentos e cinquenta reais e quarenta e dois centavos")
    .replace(/R\$\s*2\.705,25/gi, "dois mil setecentos e cinco reais e vinte e cinco centavos")
    .replace(/50\/50/gi, "cinquenta por cinquenta, meia parcela,")
    .replace(/237\s*meses/gi, "duzentos e trinta e sete meses")
    .replace(/R\$\s*([\d\.]+),(\d{2})/gi, (_, intVal, cents) => {
      const num = intVal.replace(/\./g, "");
      return `${num} reais e ${cents} centavos`;
    })
    .replace(/R\$\s*([\d\.]+)/gi, (_, intVal) => {
      const num = intVal.replace(/\./g, "");
      return `${num} reais`;
    });

  return cleaned.replace(/\s+/g, " ").trim();
}

export function speakBellaText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  customVoice?: SpeechSynthesisVoice | null
) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  const cleanText = normalizeTextForSpeech(text);

  if (!cleanText || cleanText.length < 2) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
  } catch (e) {}

  // Divide o texto em frases com pontuação para respiração natural
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  if (sentences.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  const voice = customVoice || getBestPtBrVoice();
  let currentIndex = 0;

  const speakNextSentence = () => {
    if (currentIndex >= sentences.length) {
      if (onEnd) onEnd();
      return;
    }

    const sentence = sentences[currentIndex];
    const msg = new SpeechSynthesisUtterance(sentence);
    msg.lang = "pt-BR";

    if (voice) {
      msg.voice = voice;
    }

    // Parâmetros para voz humana aveludada, ritmada e calorosa
    msg.rate = 1.0;   // Velocidade natural de conversa humana
    msg.pitch = 1.02; // Tom equilibrado e agradável

    if (currentIndex === 0 && onStart) {
      msg.onstart = () => onStart();
    }

    msg.onend = () => {
      currentIndex++;
      // Micro-pausa de respiração de 100ms entre frases
      setTimeout(speakNextSentence, 100);
    };

    msg.onerror = () => {
      currentIndex++;
      speakNextSentence();
    };

    try {
      window.speechSynthesis.speak(msg);
    } catch (e) {
      if (onEnd) onEnd();
    }
  };

  speakNextSentence();
}
