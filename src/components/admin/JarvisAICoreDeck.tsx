import React from "react";
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
  Radio
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
    name: "Gemini 2.0 Flash",
    provider: "Google AI Studio",
    model: "gemini-2.0-flash",
    speed: "120ms",
    freeTier: "15 RPM / 1M Context",
    category: "llm",
    color: "text-purple-400",
    badgeBg: "bg-purple-950/70",
    borderColor: "border-purple-500/50",
    accentHex: "#A855F7",
    description: "Multimodal nativo com janela de 1 milhão de tokens. Análise completa de PDFs e dados.",
    iconName: "gemini",
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
  const currentCore = AI_CORE_PROVIDERS.find((c) => c.id === selectedCoreId) || AI_CORE_PROVIDERS[0];

  return (
    <div className="w-full bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-3 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.12)] space-y-2.5">
      {/* Top Header do Hub Neural */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <Cpu className="h-4 w-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-widest text-slate-200 uppercase flex items-center gap-1.5 font-mono">
                QUANTUM AI MATRIX // FREELLM ECOSYSTEM
              </span>
              <span className="text-[8.5px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                8 MOTORES CONECTADOS
              </span>
            </div>
            <p className="text-[9.5px] text-slate-400">
              Provedores abertos, sem custo e integrados em cascata com tolerância zero a quedas.
            </p>
          </div>
        </div>

        {/* Botão de Auto-Fallback */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleAutoFallback}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
              autoFallback
                ? "bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
            title="Alterna automaticamente de provedor se houver qualquer limite de taxa ou oscilação"
          >
            <RefreshCw className={`h-3 w-3 ${autoFallback ? "animate-spin text-cyan-400" : ""}`} />
            {autoFallback ? "Auto-Fallback Ativo" : "Modo Manual Fixo"}
          </button>
        </div>
      </div>

      {/* Grid de Ícones das IAs Mapeadas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {AI_CORE_PROVIDERS.map((core) => {
          const isSelected = core.id === selectedCoreId;

          return (
            <button
              key={core.id}
              type="button"
              onClick={() => onSelectCore(core)}
              className={`p-2 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-1.5 group cursor-pointer relative overflow-hidden ${
                isSelected
                  ? `${core.badgeBg} ${core.borderColor} shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50`
                  : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {isSelected && (
                <div
                  className="absolute top-0 right-0 w-8 h-8 opacity-20 pointer-events-none rounded-bl-full"
                  style={{ backgroundColor: core.accentHex }}
                />
              )}

              {/* Ícone e Nome */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs border ${
                      isSelected
                        ? "bg-slate-950 text-white border-white/20"
                        : "bg-slate-950/80 text-slate-300 border-slate-800 group-hover:scale-105"
                    }`}
                  >
                    {core.id === "gemini" && <span className="text-purple-400">✦</span>}
                    {core.id === "groq" && <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />}
                    {core.id === "deepseek" && <span className="text-blue-400 font-black">🐋</span>}
                    {core.id === "cerebras" && <span className="text-rose-400 font-bold">⚡</span>}
                    {core.id === "nvidia" && <span className="text-emerald-400 font-black">👁️</span>}
                    {core.id === "mistral" && <span className="text-orange-400 font-bold">🌪️</span>}
                    {core.id === "flux" && <Palette className="h-3 w-3 text-pink-400" />}
                    {core.id === "edge_voice" && <Mic className="h-3 w-3 text-cyan-400" />}
                  </div>
                  <span className={`text-[10px] font-bold truncate ${isSelected ? "text-white" : "text-slate-300"}`}>
                    {core.name.split(" ")[0]}
                  </span>
                </div>

                {isSelected && <CheckCircle2 className="h-3 w-3 text-cyan-400 shrink-0" />}
              </div>

              {/* Subtítulo / Provedor */}
              <div className="space-y-0.5">
                <p className="text-[8px] text-slate-400 truncate">{core.provider}</p>
                <div className="flex items-center justify-between text-[7.5px] font-mono">
                  <span className={core.color}>{core.speed.split(" ")[0]}</span>
                  <span className="text-slate-500">FREE</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

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

