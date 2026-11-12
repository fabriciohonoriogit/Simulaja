import React, { useState } from "react";
import JarvisStudio from "./JarvisStudio";
import JarvisHUDPage from "./JarvisHUDPage";
import { JarvisMobileAssistant } from "@/components/admin/jarvis/JarvisMobileAssistant";
import { Sparkles, Layers, Zap, Smartphone, Monitor } from "lucide-react";

export default function Jarvis() {
  const [currentMode, setCurrentMode] = useState<"studio" | "hud">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jarvis_dashboard_mode");
      if (saved === "hud" || saved === "studio") return saved;
    }
    return "studio";
  });

  const [forceDesktopOnMobile, setForceDesktopOnMobile] = useState<boolean>(false);

  const handleSwitchMode = (mode: "studio" | "hud") => {
    setCurrentMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("jarvis_dashboard_mode", mode);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Visualização Mobile Executiva Nativa (Celular & Telas Pequenas) */}
      {!forceDesktopOnMobile && (
        <div className="block lg:hidden h-full">
          <JarvisMobileAssistant onSwitchToDesktop={() => setForceDesktopOnMobile(true)} />
        </div>
      )}

      {/* Visualização Desktop Studio & HUD (Telas Grandes ou Modo Forçado) */}
      <div className={forceDesktopOnMobile ? "block" : "hidden lg:block"}>
        {/* Botão de Alternância Flutuante de Modo (Apenas Desktop) */}
        <div className="fixed bottom-4 right-4 z-50 hidden lg:flex items-center p-1 rounded-2xl bg-slate-900/90 border border-white/20 backdrop-blur-2xl shadow-2xl">
          <button
            onClick={() => handleSwitchMode("studio")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentMode === "studio"
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-slate-950 font-black shadow-lg shadow-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Studio (Next-Gen)
          </button>

          <button
            onClick={() => handleSwitchMode("hud")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentMode === "hud"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black shadow-lg shadow-purple-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            HUD Clássico
          </button>
        </div>

        {currentMode === "studio" ? <JarvisStudio /> : <JarvisHUDPage />}
      </div>
    </div>
  );
}

