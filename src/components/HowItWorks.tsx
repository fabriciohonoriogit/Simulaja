import React from "react";
import { ArrowRight, ShieldCheck, CheckCircle2, Award } from "lucide-react";
import { BlueParticlesBackground } from "@/components/BlueParticlesBackground";

const steps = [
  {
    number: "01",
    tag: "Diagnóstico",
    title: "Definição da Meta",
    desc: "Você define o seu objetivo patrimonial: imóvel, automóvel, moto ou frota pesada, e o valor do crédito ideal para a conquista.",
  },
  {
    number: "02",
    tag: "Estatísticas",
    title: "Inteligência de Grupos",
    desc: "Mapeamos os grupos ativos do Consórcio Magalu com as menores médias históricas de lances e maior índice de contemplações mensais.",
  },
  {
    number: "03",
    tag: "Planejamento",
    title: "Estratégia 50/50 & Lances",
    desc: "Estruturamos o pagamento de meia parcela até a contemplação e desenhamos a melhor estratégia de lance livre ou embutido.",
  },
  {
    number: "04",
    tag: "Conquista",
    title: "Contemplação & Crédito",
    desc: "Assessoria executiva contínua de Fabrício Honório em todas as assembleias até a liberação do crédito com poder de compra à vista.",
  },
];

const HowItWorks = () => {
  const scrollToSimulator = () => {
    const simElement = document.getElementById("simulator");
    if (simElement) {
      simElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-[#050814] text-white relative overflow-hidden border-t border-white/10" id="como-funciona">
      {/* Partículas Espaciais Contínuas */}
      <BlueParticlesBackground />

      {/* Luzes e Auroras Cósmicas Suaves */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[350px] bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Metodologia Consultiva & Transparente</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Como Funciona o{" "}
            <span className="text-[#0086FF]">
              Planejamento Estratégico
            </span>
          </h2>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Um processo consultivo e seguro em 4 etapas para transformar seu objetivo em conquista real com a garantia do Consórcio Magalu.
          </p>
        </div>

        {/* 4 Steps Grid em Glassmorphism Noturno Espacial */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="group relative bg-[#0B1528] rounded-3xl p-7 border border-slate-800 hover:border-blue-500/50 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
            >
              <div>
                {/* Step Top Bar */}
                <div className="flex items-center justify-between mb-5">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-blue-300">
                    {step.tag}
                  </span>
                  <span className="text-3xl font-black text-[#0086FF]">
                    {step.number}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="font-black text-lg sm:text-xl text-white group-hover:text-blue-300 transition-colors mb-2.5 leading-snug">
                  {step.title}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>

              {/* Connecting indicator */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Garantia Magalu
                </span>
                <span className="text-slate-500 font-mono">Etapa {step.number}/04</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-14 text-center">
          <button
            onClick={scrollToSimulator}
            className="inline-flex items-center gap-3 bg-[#0086FF] hover:bg-[#0074E0] text-white px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <span>Começar Meu Planejamento</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;