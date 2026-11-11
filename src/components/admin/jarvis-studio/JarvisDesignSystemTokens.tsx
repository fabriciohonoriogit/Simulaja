import React, { useState } from "react";
import { Copy, Check, Palette, Sparkles, Layers, Sliders, Code2, Eye } from "lucide-react";
import { toast } from "sonner";

export interface DesignToken {
  name: string;
  hex: string;
  rgb: string;
  usage: string;
  textColor: string;
}

export const JARVIS_DESIGN_TOKENS: DesignToken[] = [
  { name: "Cyan Neon", hex: "#00F2FE", rgb: "0, 242, 254", usage: "Acentos principais, pulso holográfico e links ativos", textColor: "#000" },
  { name: "Cyber Purple", hex: "#8B5CF6", rgb: "139, 92, 246", usage: "Orquestração neural, cards de IA e gradientes de fundo", textColor: "#FFF" },
  { name: "Electric Pink", hex: "#EC4899", rgb: "236, 72, 153", usage: "Ações de destaque, micro-interações e badges de urgência", textColor: "#FFF" },
  { name: "Radiant Amber", hex: "#F59E0B", rgb: "245, 158, 11", usage: "Valores financeiros, orçamentos e alertas executivos", textColor: "#000" },
  { name: "Emerald Pulse", hex: "#10B981", rgb: "16, 185, 129", usage: "Status online, envios confirmados e métricas de conversão", textColor: "#FFF" },
  { name: "Obsidian Core", hex: "#050711", rgb: "5, 7, 17", usage: "Superfície de fundo profunda com absorção de luz", textColor: "#FFF" },
];

export function JarvisDesignSystemTokens() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [toggleState, setToggleState] = useState(true);
  const [sliderVal, setSliderVal] = useState(68);
  const [inputValue, setInputValue] = useState("Consórcio Pesados 50/50");
  const [viewMode, setViewMode] = useState<"visual" | "code">("visual");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(label);
    toast.success(`Copiado: ${label}`);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="relative rounded-3xl p-6 bg-slate-950/70 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Glow decorativo de fundo */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-wider text-white uppercase">Design System Jarvis OS</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold">
                Level 3 • Neo Stitch
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tokens atômicos extraídos da metodologia visual (Paleta, Tipografia e Primitivas Reutilizáveis)
            </p>
          </div>
        </div>

        {/* Alternador de visualização */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => setViewMode("visual")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "visual"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Visual
          </button>
          <button
            onClick={() => setViewMode("code")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "code"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Tokens CSS
          </button>
        </div>
      </div>

      {viewMode === "visual" ? (
        <div className="space-y-6 relative z-10">
          {/* Paleta de Cores Atômicas */}
          <div>
            <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-3 flex items-center justify-between">
              <span>Paleta Holográfica & Tokens de Luz</span>
              <span className="text-[10px] text-slate-500">Clique para copiar HEX</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {JARVIS_DESIGN_TOKENS.map((token) => (
                <div
                  key={token.name}
                  onClick={() => copyToClipboard(token.hex, token.name)}
                  className="group relative cursor-pointer rounded-2xl p-3 bg-white/[0.04] border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-7 h-7 rounded-xl shadow-lg border border-white/20 transition-transform group-hover:scale-110 flex items-center justify-center"
                      style={{ backgroundColor: token.hex, boxShadow: `0 0 16px ${token.hex}60` }}
                    >
                      {copiedToken === token.name && <Check className="w-3.5 h-3.5 text-slate-950" />}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-white transition-colors">
                      {token.hex}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {token.name}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight line-clamp-2 mt-0.5">
                      {token.usage}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tipografia & Componentes Vivos */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Bloco de Tipografia */}
            <div className="md:col-span-5 rounded-2xl p-4 bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tipografia Executiva</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  Inter / SF Pro
                </span>
              </div>
              <div className="my-auto py-2 flex items-baseline gap-3">
                <span className="text-4xl font-black tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Aa
                </span>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200">Hierarquia Clara & Alto Contraste</div>
                  <div className="text-[10px] text-slate-400">Headlines 900 • Badges 700 • Corpo 500</div>
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-500 border-t border-white/5 pt-2">
                Letter-spacing: -0.02em • Antialiased Glass
              </div>
            </div>

            {/* Primitivas de Interface (Botão, Toggle, Input, Progress) */}
            <div className="md:col-span-7 rounded-2xl p-4 bg-white/[0.03] border border-white/10 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Componentes Atômicos Vivos
                </span>
                <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  Glassmorphic UI
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Botão Neon com Gradiente */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono">1. Botão de Ação Primária</span>
                  <button
                    onClick={() => toast.success("Ação disparada no Design System")}
                    className="w-full relative group overflow-hidden rounded-xl px-4 py-2.5 font-bold text-xs text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_28px_rgba(236,72,153,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Disparar Ação
                    </span>
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                {/* Toggle Switch Neon */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono">2. Switch Háptico Neon</span>
                  <div
                    onClick={() => setToggleState(!toggleState)}
                    className="cursor-pointer flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all"
                  >
                    <span className="text-xs font-semibold text-slate-300">Autonomia Jarvis</span>
                    <div
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                        toggleState
                          ? "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-[0_0_14px_rgba(0,242,254,0.5)]"
                          : "bg-slate-800"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                          toggleState ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Input Translúcido */}
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 font-mono">3. Input Frosted Glass</span>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Digite um comando para o Jarvis..."
                    className="w-full px-3.5 py-2 text-xs font-medium text-white placeholder-slate-500 rounded-xl bg-slate-900/60 border border-white/10 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 backdrop-blur-md transition-all shadow-inner"
                  />
                </div>

                {/* Slider / Barra de Progresso com Gradiente */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">4. Barra de Progresso / Slider Líquido</span>
                    <span className="text-cyan-400 font-bold">{sliderVal}% Potência Neural</span>
                  </div>
                  <div className="relative w-full h-3 bg-slate-900/80 rounded-full border border-white/10 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(0,242,254,0.6)] transition-all duration-300"
                      style={{ width: `${sliderVal}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={sliderVal}
                    onChange={(e) => setSliderVal(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Modo Tokens CSS para Engenharia */
        <div className="relative z-10 rounded-2xl p-4 bg-slate-950/90 border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <span className="text-cyan-400 font-bold">jarvis-design-tokens.css</span>
            <button
              onClick={() =>
                copyToClipboard(
                  `:root {
  --jarvis-cyan: #00F2FE;
  --jarvis-purple: #8B5CF6;
  --jarvis-pink: #EC4899;
  --jarvis-amber: #F59E0B;
  --jarvis-emerald: #10B981;
  --jarvis-obsidian: #050711;
  --jarvis-glass-bg: rgba(255, 255, 255, 0.03);
  --jarvis-glass-border: rgba(255, 255, 255, 0.1);
  --jarvis-glass-blur: 24px;
}`,
                  "CSS Variables"
                )
              }
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px]"
            >
              <Copy className="w-3 h-3" />
              Copiar CSS
            </button>
          </div>
          <pre className="text-slate-400 leading-relaxed text-[11px]">
{`:root {
  /* Tokens de Luz e Energia */
  --jarvis-cyan: #00F2FE;      /* rgb(0, 242, 254) - Foco & Hologramas */
  --jarvis-purple: #8B5CF6;    /* rgb(139, 92, 246) - Núcleo de Raciocínio */
  --jarvis-pink: #EC4899;      /* rgb(236, 72, 153) - Ações de Fechamento */
  --jarvis-amber: #F59E0B;     /* rgb(245, 158, 11) - Finanças & 50/50 */
  --jarvis-emerald: #10B981;   /* rgb(16, 185, 129) - Conversão & WhatsApp */
  --jarvis-obsidian: #050711;  /* Fundo de absorção profunda */

  /* Glassmorphism & Superfícies */
  --jarvis-surface: rgba(5, 7, 17, 0.75);
  --jarvis-border: rgba(255, 255, 255, 0.10);
  --jarvis-blur: 24px;
  --jarvis-glow-cyan: 0 0 25px rgba(0, 242, 254, 0.25);
  --jarvis-glow-pink: 0 0 25px rgba(236, 72, 153, 0.25);
}`}
          </pre>
        </div>
      )}
    </div>
  );
}

