import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Radio, Sparkles, Workflow, Flame, Palette } from "lucide-react";
import { OrbTheme } from "./JarvisOrb";

export type VoiceOperationMode = "passive" | "free" | "flow";

interface BellaVoiceModeSelectorProps {
  currentMode: VoiceOperationMode;
  onModeChange: (mode: VoiceOperationMode) => void;
  currentTheme: OrbTheme;
  onThemeChange: (theme: OrbTheme) => void;
  isListening?: boolean;
}

export function BellaVoiceModeSelector({
  currentMode,
  onModeChange,
  currentTheme,
  onThemeChange,
  isListening,
}: BellaVoiceModeSelectorProps) {
  const modes: { id: VoiceOperationMode; label: string; description: string; icon: any }[] = [
    {
      id: "passive",
      label: "VOZ PASSIVA",
      description: "Ativação por palavra-chave ('Hey Bella')",
      icon: Radio,
    },
    {
      id: "free",
      label: "VOZ LIVRE",
      description: "Conversa viva-voz contínua sem parar",
      icon: Mic,
    },
    {
      id: "flow",
      label: "FLUXO",
      description: "Rotina comercial e workflow guiado",
      icon: Workflow,
    },
  ];

  const themes: { id: OrbTheme; label: string; colorClass: string }[] = [
    { id: "cobalt", label: "Cobalt (Blue)", colorClass: "bg-cyan-500" },
    { id: "flame", label: "Flame (Gold)", colorClass: "bg-amber-500" },
    { id: "emerald", label: "Emerald (Green)", colorClass: "bg-emerald-500" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl shadow-xl">
      {/* Selector de Modos de Voz */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          return (
            <Button
              key={mode.id}
              size="sm"
              variant="ghost"
              onClick={() => onModeChange(mode.id)}
              className={`text-xs font-mono tracking-wide px-3 py-1.5 h-9 rounded-lg transition-all flex items-center gap-2 border ${
                isActive
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10 font-bold"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "animate-pulse text-amber-400" : ""}`} />
              <span>{mode.label}</span>
              {isActive && isListening && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Indicador do Orb Azul Clássico Assinatura */}
      <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3 w-full sm:w-auto justify-end">
        <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/40 text-cyan-300 text-[11px] font-mono py-1 flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_#38bdf8]" />
          ORB AZUL NEURAL
        </Badge>
      </div>
    </div>
  );
}
