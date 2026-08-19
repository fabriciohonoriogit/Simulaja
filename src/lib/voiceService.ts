// Helper para carregar e selecionar vozes femininas de alta qualidade e entusiasmadas no Web Speech API

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

  // Nomes de vozes femininas prioritárias em navegadores e sistemas operacionais (Windows, Edge, Chrome, Mac, iOS, Android)
  const priorityFemaleVoices = [
    "francisca", // Microsoft Francisca Online (Natural) - PT-BR
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

  // 1. Procura primeiro pelas vozes femininas prioritárias em português
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

  // Limpa Emojis, caracteres especiais e palavras que leitores de tela pronunciam
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/🚀|✨|🏆|💡|📊|🤖|✴|●|🟢|⚠️|[\u2000-\u3300]/g, "")
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\{[\s\S]*?\}/g, "")
    .replace(/[*_#`~{}]/g, "")
    .replace(/foguete|emoji/gi, "")
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

  // Configuração de voz feminina vibrante, alegre e dinâmica
  msg.rate = 1.15;  // Ritmo alegre e fluído
  msg.pitch = 1.30; // Tom feminino elevado e entusiasmado

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
