import React from "react";
import {
  Mic,
  Cpu,
  Sparkles,
  SendHorizontal,
  ArrowRight,
  Database,
  Layers,
  CheckCircle2,
  Sliders,
  Palette
} from "lucide-react";

export interface PipelineStep {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  badge: string;
  status: "active" | "ready" | "pending";
}

interface JarvisNodePipelineProps {
  activeStep?: string;
  activeModelName?: string;
  onSelectStep?: (stepId: string) => void;
}

export function JarvisNodePipeline({
  activeStep = "engine",
  activeModelName = "Gemini 2.0 Flash",
  onSelectStep,
}: JarvisNodePipelineProps) {
  const steps: PipelineStep[] = [
    {
      id: "input",
      number: "01",
      title: "Entrada Multimodal",
      subtitle: "Voz, Texto ou Imagem",
      icon: Mic,
      color: "from-cyan-500 to-blue-500",
      badge: "Whisper & Vision",
      status: "ready",
    },
    {
      id: "engine",
      number: "02",
      title: "Orquestrador Neural",
      subtitle: activeModelName,
      icon: Cpu,
      color: "from-purple-500 to-pink-500",
      badge: "LLM Ativo",
      status: "active",
    },
    {
      id: "process",
      number: "03",
      title: "Síntese de Negócio",
      subtitle: "50/50, Radar ou FLUX.1",
      icon: Sparkles,
      color: "from-amber-500 to-orange-500",
      badge: "Cálculo & Design",
      status: "ready",
    },
    {
      id: "action",
      number: "04",
      title: "Execução Operacional",
      subtitle: "WhatsApp, Boleto ou PDF",
      icon: SendHorizontal,
      color: "from-emerald-500 to-teal-500",
      badge: "1-Click Dispatch",
      status: "ready",
    },
  ];

  return (
    <div className="rounded-3xl p-5 bg-slate-950/60 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00F2FE]" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Pipeline Neural em Árvore (Neo Stitch Canvas)
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
          Latência Zero • Fluxo Contínuo
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;

          return (
            <div
              key={step.id}
              onClick={() => onSelectStep?.(step.id)}
              className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-300 group border ${
                isSelected
                  ? "bg-white/[0.08] border-cyan-400/60 shadow-[0_0_25px_rgba(0,242,254,0.25)] scale-[1.02]"
                  : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-cyan-400 transition-colors">
                  PASSO {step.number}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                >
                  {step.badge}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${step.color} text-white shadow-lg shadow-black/40 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white truncate group-hover:text-cyan-300 transition-colors">
                    {step.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {step.subtitle}
                  </div>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-slate-600">
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

