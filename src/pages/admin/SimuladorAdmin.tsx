import React from "react";
import ConsortiumSimulator from "@/components/ConsortiumSimulator";
import { BlueParticlesBackground } from "@/components/BlueParticlesBackground";

export default function SimuladorAdmin() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar w-full h-full relative bg-gradient-to-br from-[#021024] via-[#051f3e] to-[#042817] text-slate-100">
      {/* Background com efeito de pequenos pontos azuis como no Jarvis */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <BlueParticlesBackground />
      </div>

      <div className="relative z-10 w-full min-h-full">
        <ConsortiumSimulator isInternal={true} />
      </div>
    </div>
  );
}
