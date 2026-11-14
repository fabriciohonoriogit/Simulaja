import React from "react";
import ConsortiumSimulator from "@/components/ConsortiumSimulator";

export default function SimuladorAdmin() {
  return (
    <div
      className="flex-1 overflow-y-auto custom-scrollbar w-full h-full bg-[#FAF9F5] text-slate-800"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0, 134, 255, 0.035) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 134, 255, 0.035) 1px, transparent 1px)
        `,
        backgroundSize: "36px 36px"
      }}
    >
      <ConsortiumSimulator isInternal={true} />
    </div>
  );
}
