import { CheckCircle2, TrendingUp, ShieldCheck, UserCheck, Clock, Eye, Sparkles, ArrowRight } from "lucide-react";

const benefits = [
  {
    title: "Planejamento Financeiro",
    desc: "Estratégia sob medida sem juros bancários, protegendo seu orçamento familiar ou empresarial.",
    icon: TrendingUp,
  },
  {
    title: "Estratégia de Lance",
    desc: "Análise preditiva de lances para acelerar sua contemplação com inteligência e previsibilidade.",
    icon: CheckCircle2,
  },
  {
    title: "Atendimento Consultivo",
    desc: "Foco total na sua necessidade real, orientando sobre as melhores opções de crédito do mercado.",
    icon: UserCheck,
  },
  {
    title: "Acompanhamento Completo",
    desc: "Suporte especializado do início da simulação até a entrega e liberação da carta de crédito.",
    icon: Clock,
  },
  {
    title: "Especialista Dedicado",
    desc: "Atendimento exclusivo diretamente por quem entende profundamente de planejamento patrimonial.",
    icon: ShieldCheck,
  },
  {
    title: "Processo Transparente",
    desc: "Sem letras miúdas, sem promessas falsas. Informações claras para você decidir com segurança.",
    icon: Eye,
  },
];

const WhyPlanning = () => {
  const scrollToSimulator = () => {
    const simElement = document.getElementById("simulator");
    if (simElement) {
      simElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden border-t border-slate-800/60" id="beneficios">
      {/* Soft Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Vantagens Exclusivas
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Por que fazer um consórcio <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">com planejamento?</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Consórcio sem estratégia é depender apenas da sorte. Com consultoria especializada, transformamos seu objetivo em um plano de conquistas concreto.
          </p>
        </div>

        {/* 6 Benefit Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative bg-slate-900/90 backdrop-blur-md rounded-3xl p-8 border border-slate-800 hover:border-amber-400/50 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300/80 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                      ✔ Benefício
                    </span>
                  </div>

                  <h3 className="font-extrabold text-xl text-white group-hover:text-amber-300 transition-colors mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <button
            onClick={scrollToSimulator}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-9 py-4 rounded-2xl text-sm font-black uppercase tracking-wider shadow-xl hover:shadow-amber-500/30 transition-all hover:scale-105"
          >
            Simular Estratégia Agora
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default WhyPlanning;
