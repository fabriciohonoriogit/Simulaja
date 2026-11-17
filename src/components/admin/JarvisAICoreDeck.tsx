import React, { useState } from "react";
import {
  Zap,
  Cpu,
  Sparkles,
  Bot,
  Activity,
  Palette,
  Mic,
  Gauge,
  CheckCircle2,
  RefreshCw,
  Layers,
  Radio,
  ChevronUp,
  ChevronDown
} from "lucide-react";

export interface AICoreProvider {
  id: string;
  name: string;
  provider: string;
  model: string;
  speed: string;
  freeTier: string;
  category: "llm" | "image" | "voice";
  color: string;
  badgeBg: string;
  borderColor: string;
  accentHex: string;
  description: string;
  iconName: string;
}

export const AI_CORE_PROVIDERS: AICoreProvider[] = [
  {
    id: "gemini",
    name: "Gemini 2.5 Flash Lite",
    provider: "Google AI Studio",
    model: "gemini-2.5-flash-lite",
    speed: "95ms",
    freeTier: "15 RPM / 1M Context",
    category: "llm",
    color: "text-purple-400",
    badgeBg: "bg-purple-950/70",
    borderColor: "border-purple-500/50",
    accentHex: "#A855F7",
    description: "Multimodal nativo com latência ultra-rápida e raciocínio analítico em tempo real.",
    iconName: "gemini",
  },
  {
    id: "chatgpt",
    name: "ChatGPT (GPT-4o)",
    provider: "OpenAI / FreeLLM",
    model: "gpt-4o-mini",
    speed: "130ms",
    freeTier: "OpenAI Live",
    category: "llm",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-950/70",
    borderColor: "border-emerald-500/50",
    accentHex: "#10A37F",
    description: "Modelo oficial da OpenAI. Clareza executiva, alta persuasão comercial e redação avançada.",
    iconName: "chatgpt",
  },
  {
    id: "claude",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic / FreeLLM",
    model: "claude-3-5-sonnet",
    speed: "160ms",
    freeTier: "OpenRouter / Anthropic",
    category: "llm",
    color: "text-amber-500",
    badgeBg: "bg-amber-950/70",
    borderColor: "border-amber-500/50",
    accentHex: "#D97706",
    description: "Inteligência refinada da Anthropic. Redação humana natural, alta empatia e análise profunda de negócios.",
    iconName: "claude",
  },
  {
    id: "groq",
    name: "Groq LPU",
    provider: "Groq Cloud",
    model: "llama-3.3-70b-versatile",
    speed: "45ms (500 tok/s)",
    freeTier: "30 RPM Permanente",
    category: "llm",
    color: "text-amber-400",
    badgeBg: "bg-amber-950/70",
    borderColor: "border-amber-500/50",
    accentHex: "#F59E0B",
    description: "Aceleração por hardware LPU. Respostas ultra-rápidas e copies instantâneas.",
    iconName: "groq",
  },
  {
    id: "deepseek",
    name: "DeepSeek R1",
    provider: "OpenRouter Free",
    model: "deepseek/deepseek-r1:free",
    speed: "280ms",
    freeTier: "Cota Livre 100%",
    category: "llm",
    color: "text-blue-400",
    badgeBg: "bg-blue-950/70",
    borderColor: "border-blue-500/50",
    accentHex: "#3B82F6",
    description: "Raciocínio profundo e cadeias de pensamento para estratégias e objeções complexas.",
    iconName: "deepseek",
  },
  {
    id: "cerebras",
    name: "Cerebras Wafer",
    provider: "Cerebras Cloud",
    model: "llama-3.3-70b",
    speed: "30ms (2.000 tok/s)",
    freeTier: "30 RPM Grátis",
    category: "llm",
    color: "text-rose-400",
    badgeBg: "bg-rose-950/70",
    borderColor: "border-rose-500/50",
    accentHex: "#F43F5E",
    description: "O maior chip de IA do mundo com inferência instantânea sem latência percebida.",
    iconName: "cerebras",
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    provider: "NVIDIA Enterprise",
    model: "meta/llama-3.1-405b",
    speed: "220ms",
    freeTier: "1.000 Chamadas Grátis",
    category: "llm",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-950/70",
    borderColor: "border-emerald-500/50",
    accentHex: "#10B981",
    description: "O maior modelo aberto do planeta (405 bilhões de parâmetros) com precisão de elite.",
    iconName: "nvidia",
  },
  {
    id: "mistral",
    name: "Mistral Codestral",
    provider: "Mistral AI",
    model: "codestral-latest",
    speed: "160ms",
    freeTier: "Free Tier Dev",
    category: "llm",
    color: "text-orange-400",
    badgeBg: "bg-orange-950/70",
    borderColor: "border-orange-500/50",
    accentHex: "#F97316",
    description: "Especialista em automação, extração estruturada de JSONs e lógica de funil.",
    iconName: "mistral",
  },
  {
    id: "dewiar",
    name: "Dewiar / Jarvis OS",
    provider: "Dewiar Local / MCP",
    model: "jarvis-squad-local",
    speed: "15ms",
    freeTier: "100% Ilimitado & Local",
    category: "llm",
    color: "text-cyan-400",
    badgeBg: "bg-cyan-950/70",
    borderColor: "border-cyan-500/50",
    accentHex: "#06B6D4",
    description: "Motor nativo local e integrado ao Dewiar App e MCP. Respostas instantâneas e sem custo de nuvem.",
    iconName: "dewiar",
  },
  {
    id: "flux",
    name: "FLUX.1 Generator",
    provider: "Pollinations.ai",
    model: "flux-schnell",
    speed: "2.8s / imagem",
    freeTier: "Ilimitado Sem Chave",
    category: "image",
    color: "text-pink-400",
    badgeBg: "bg-pink-950/70",
    borderColor: "border-pink-500/50",
    accentHex: "#EC4899",
    description: "Geração fotográfica de caminhões, tratores, imóveis e carros para ilustrar propostas.",
    iconName: "flux",
  },
  {
    id: "edge_voice",
    name: "Neural Voice HD",
    provider: "Microsoft Edge Audio",
    model: "pt-BR-AntonioNeural",
    speed: "180ms streaming",
    freeTier: "Ilimitado 100% Free",
    category: "voice",
    color: "text-cyan-400",
    badgeBg: "bg-cyan-950/70",
    borderColor: "border-cyan-500/50",
    accentHex: "#06B6D4",
    description: "Voz humana de cinema: barítono executivo elegante, respiração fluida e cadência natural.",
    iconName: "edge_voice",
  },
];

interface JarvisAICoreDeckProps {
  selectedCoreId: string;
  onSelectCore: (core: AICoreProvider) => void;
  autoFallback: boolean;
  onToggleAutoFallback: () => void;
}

export function JarvisAICoreDeck({
  selectedCoreId,
  onSelectCore,
  autoFallback,
  onToggleAutoFallback,
}: JarvisAICoreDeckProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentCore = AI_CORE_PROVIDERS.find((c) => c.id === selectedCoreId) || AI_CORE_PROVIDERS[0];

  return (
    <div className="w-full bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-2 sm:p-2.5 backdrop-blur-xl shadow-[0_0_25px_rgba(6,182,212,0.1)] space-y-1.5 transition-all duration-300">
      {/* Top Header do Hub Neural */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-950/80 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.25)]">
            <Cpu className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-black tracking-widest text-slate-200 uppercase flex items-center gap-1.5 font-mono">
                QUANTUM AI MATRIX
              </span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
                10 MOTORES
              </span>
            </div>
            {isCollapsed ? (
              <p className="text-[9px] text-cyan-300 font-mono flex items-center gap-1.5">
                <span>Motor Ativo:</span>
                <span className={`font-bold ${currentCore.color}`}>{currentCore.name}</span>
                <span className="text-slate-500">• {currentCore.speed}</span>
              </p>
            ) : (
              <p className="text-[9px] text-slate-400">
                Provedores abertos, sem custo e integrados em cascata com tolerância zero a quedas.
              </p>
            )}
          </div>
        </div>

        {/* Botão de Chave API, Auto-Fallback e Recolher/Expandir */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const current = typeof window !== "undefined" ? localStorage.getItem("jarvis_gemini_api_key") || "" : "";
              const input = window.prompt("Insira sua chave Google AI Studio (Gemini API):\nObtenha grátis em: https://aistudio.google.com/apikey\n(A chave oficial sempre começa com AIzaSy...)", current);
              if (input !== null) {
                const clean = input.trim();
                if (clean) {
                  localStorage.setItem("jarvis_gemini_api_key", clean);
                  window.alert("Chave Gemini salva com sucesso no navegador!");
                } else {
                  localStorage.removeItem("jarvis_gemini_api_key");
                  window.alert("Chave personalizada removida.");
                }
              }
            }}
            className="px-2 py-1 rounded-lg text-[9.5px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 hover:bg-amber-900/60 transition-all flex items-center gap-1 cursor-pointer"
            title="Configurar ou alterar Chave Gemini API (Google AI Studio)"
          >
            <span>🔑</span>
            <span className="hidden sm:inline">Chave</span> Gemini
          </button>

          <button
            type="button"
            onClick={onToggleAutoFallback}
            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
              autoFallback
                ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
            title="Alterna automaticamente de provedor se houver qualquer limite de taxa ou oscilação"
          >
            <RefreshCw className={`h-2.5 w-2.5 ${autoFallback ? "animate-spin text-cyan-400" : ""}`} />
            {autoFallback ? "Fallback Ativo" : "Modo Fixo"}
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer"
            title={isCollapsed ? "Expandir Provedores" : "Recolher Provedores (Liberar Espaço para o Orb)"}
          >
            {isCollapsed ? <ChevronDown className="h-3.5 w-3.5 text-cyan-400" /> : <ChevronUp className="h-3.5 w-3.5 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Grid Compacto de Ícones das IAs Mapeadas (Oculto se recolhido) */}
      {!isCollapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1 animate-in fade-in duration-200">
          {AI_CORE_PROVIDERS.map((core) => {
            const isSelected = core.id === selectedCoreId;

            return (
              <button
                key={core.id}
                type="button"
                onClick={() => onSelectCore(core)}
                className={`p-1.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-1 group cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? `${core.badgeBg} ${core.borderColor} shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50`
                    : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                {isSelected && (
                  <div
                    className="absolute top-0 right-0 w-6 h-6 opacity-20 pointer-events-none rounded-bl-full"
                    style={{ backgroundColor: core.accentHex }}
                  />
                )}

                {/* Ícone e Nome */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] border ${
                        isSelected
                          ? "bg-slate-950 text-white border-white/20"
                          : "bg-slate-950/80 text-slate-300 border-slate-800 group-hover:scale-105"
                      }`}
                    >
                      {core.id === "gemini" && <span className="text-purple-400">✦</span>}
                      {core.id === "chatgpt" && (
                        <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.0201-1.1635a.0804.0804 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.3921-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L8.907 9.2297V6.8974a.0662.0662 0 0 1 .0331-.0615l4.8777-2.8151a4.504 4.504 0 0 1 6.6343 4.6738zM12 14.7756l-3.3685-1.9443 3.3685-1.9443 3.3685 1.9443z"/>
                        </svg>
                      )}
                      {core.id === "claude" && <span className="text-amber-500 font-black text-xs">✳</span>}
                      {core.id === "groq" && <Zap className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />}
                      {core.id === "deepseek" && <span className="text-blue-400 font-black text-[9px]">🐋</span>}
                      {core.id === "cerebras" && <span className="text-rose-400 font-bold text-[9px]">⚡</span>}
                      {core.id === "nvidia" && <span className="text-emerald-400 font-black text-[9px]">👁️</span>}
                      {core.id === "mistral" && <span className="text-orange-400 font-bold text-[9px]">🌪️</span>}
                      {core.id === "flux" && <Palette className="h-2.5 w-2.5 text-pink-400" />}
                      {core.id === "edge_voice" && <Mic className="h-2.5 w-2.5 text-cyan-400" />}
                    </div>
                    <span className={`text-[9.5px] font-bold truncate ${isSelected ? "text-white" : "text-slate-300"}`}>
                      {core.name.split(" ")[0]}
                    </span>
                  </div>

                  {isSelected && <CheckCircle2 className="h-2.5 w-2.5 text-cyan-400 shrink-0" />}
                </div>

                {/* Subtítulo / Provedor */}
                <div className="space-y-0.5">
                  <p className="text-[7.5px] text-slate-400 truncate">{core.provider}</p>
                  <div className="flex items-center justify-between text-[7px] font-mono">
                    <span className={core.color}>{core.speed.split(" ")[0]}</span>
                    <span className="text-slate-500">FREE</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Telemetria da IA Ativa no Momento */}
      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono">CÉREBRO ATIVO:</span>
          <span className={`font-black flex items-center gap-1 uppercase ${currentCore.color}`}>
            <span className="h-2 w-2 rounded-full animate-ping" style={{ backgroundColor: currentCore.accentHex }} />
            {currentCore.name} ({currentCore.provider})
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 text-[9px]">{currentCore.description}</span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[9px]">
          <span className="text-slate-400">
            Latência: <strong className="text-emerald-400">{currentCore.speed}</strong>
          </span>
          <span className="text-slate-400">
            Cota: <strong className="text-cyan-300">{currentCore.freeTier}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

