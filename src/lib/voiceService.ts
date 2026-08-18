// Helper para carregar e selecionar vozes femininas de alta qualidade no Web Speech API

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

  // Nomes de vozes femininas conhecidas em navegadores (Chrome, Edge, Safari, Firefox, Windows, Mac, Android)
  const femaleKeywords = [
    "francisca",
    "thalita",
    "yalda",
    "giovanna",
    "luciana",
    "vitória",
    "vitoria",
    "camila",
    "marcia",
    "maria",
    "leticia",
    "heloisa",
    "heloísa",
    "zira",
    "female",
    "feminina",
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
    "male",
    "masculina",
  ];

  // 1. Procura uma voz explicitamente feminina em Português
  let selected = ptVoices.find((v) =>
    femaleKeywords.some((name) => v.name.toLowerCase().includes(name))
  );

  // 2. Se não achou por nome feminino, pega qualquer voz em PT que NÃO seja explicitamente masculina
  if (!selected) {
    selected = ptVoices.find(
      (v) => !maleKeywords.some((m) => v.name.toLowerCase().includes(m))
    );
  }

  return selected || ptVoices[0] || null;
}

export function speakBellaText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  customVoice?: SpeechSynthesisVoice | null
) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Remove Emojis (incluindo o robô 🚀, ✨, 🏆, etc.), códigos JSON, markdown e palavras de erro
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/🚀|✨|🏆|💡|📊|🤖|✴|●|🟢|⚠️|[\u2000-\u3300]/g, "")
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\{[\s\S]*?\}/g, "")
    .replace(/[*_#`~{}]/g, "")
    .replace(/foguete/gi, "") // Remove a palavra falada "foguete" que o leitor de tela do Chrome lê do emoji 🚀
    .replace(/API key|INVALID_ARGUMENT|Indisponibilidade|Erro interno|status 500/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText || cleanText.length < 2) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(cleanText);
  msg.lang = "pt-BR";

  const voice = customVoice || getBestFemaleVoice();
  if (voice) {
    msg.voice = voice;
  }

  // Ritmo rápido, dinâmico e tom feminino vibrante
  msg.rate = 1.18;
  msg.pitch = 1.30;

  msg.onstart = () => {
    if (onStart) onStart();
  };

  msg.onend = () => {
    if (onEnd) onEnd();
  };

  msg.onerror = () => {
    if (onEnd) onEnd();
  };

  try {
    window.speechSynthesis.speak(msg);
  } catch (e) {
    if (onEnd) onEnd();
  }
}
