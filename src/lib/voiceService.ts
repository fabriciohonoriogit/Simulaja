// Helper para carregar e selecionar vozes humanas com sensibilidade e alta naturalidade no Web Speech API

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

export function getBestFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  
  if (availableVoices.length === 0) {
    availableVoices = window.speechSynthesis.getVoices();
  }

  const ptVoices = availableVoices.filter((v) =>
    v.lang.toLowerCase().replace("_", "-").startsWith("pt")
  );

  if (ptVoices.length === 0) return null;

  // Nomes de vozes femininas neurais prioritárias com alta sensibilidade e dicção humana natural
  const priorityFemaleVoices = [
    "francisca", // Microsoft Francisca Online (Natural) - PT-BR (Altíssima qualidade e empatia)
    "thalita",   // Microsoft Thalita Online (Natural) - PT-BR
    "giovanna",
    "luciana",
    "vitória",
    "vitoria",
    "camila",
    "leticia",
    "letícia",
    "heloisa",
    "heloísa",
    "maria",
    "yalda",
    "fernanda",
    "google português do brasil",
    "brazil female",
    "female",
    "zira",
  ];

  const maleKeywords = [
    "daniel",
    "ricardo",
    "helder",
    "antonio",
    "antônio",
    "thiago",
    "guilherme",
    "felipe",
    "humberto",
    "julio",
    "júlio",
    "david",
    "george",
    "male",
    "masculino",
  ];

  // 1. Procura pelas vozes neurais prioritárias em português
  for (const keyword of priorityFemaleVoices) {
    const found = ptVoices.find((v) => v.name.toLowerCase().includes(keyword));
    if (found) return found;
  }

  // 2. Se não achou na lista prioritária, seleciona qualquer voz em PT que NÃO seja masculina
  const nonMale = ptVoices.find(
    (v) => !maleKeywords.some((m) => v.name.toLowerCase().includes(m))
  );
  if (nonMale) return nonMale;

  // 3. Fallback: primeira voz em português
  return ptVoices[0] || null;
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

  // Limpa Emojis, caracteres técnicos, blocos JSON, URLs e formatações markdown
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/🚀|✨|🏆|💡|📊|🤖|✴|●|🟢|⚠️|[\u2000-\u3300]/g, "")
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\{[\s\S]*?\}/g, "")
    .replace(/[*_#`~{}]/g, "")
    .replace(/foguete|emoji/gi, "")
    .replace(/API key|INVALID_ARGUMENT|Indisponibilidade|Erro interno|status 500/gi, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText || cleanText.length < 2) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  // Divide o texto em frases para permitir entonação suave, sensível e pausas humanas naturais
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  if (sentences.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  const voice = customVoice || getBestFemaleVoice();
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

    // Configuração de tom humano quente, natural e sensível (prosódia orgânica)
    // Ritmo próximo ao da fala humana empática (1.02) e tom de voz aveludado (1.12)
    msg.rate = 1.02;
    msg.pitch = 1.12;

    if (currentIndex === 0 && onStart) {
      msg.onstart = () => onStart();
    }

    msg.onend = () => {
      currentIndex++;
      // Adiciona uma micro-pausa sensível entre frases (120ms) para respiro natural
      setTimeout(speakNextSentence, 120);
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

  try {
    window.speechSynthesis.cancel();
  } catch (e) {}

  speakNextSentence();
}

