import React from "react";
import ConsortiumSimulator from "@/components/ConsortiumSimulator";

export default function SimuladorAdmin() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar w-full h-full bg-[#040B16]">
      <ConsortiumSimulator isInternal={true} />
    </div>
  );
}
