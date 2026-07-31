import { Target, Search, Compass, Award, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Target,
    title: "Você informa seu objetivo",
    desc: "Casa, carro, moto, frota ou investimento. Você define qual é a sua meta patrimonial.",
  },
  {
    number: "02",
    icon: Search,
    title: "Analisamos seu perfil",
    desc: "Avaliamos sua capacidade de parcela, prazos desejados e estratégias financeiras disponíveis.",
  },
  {
    number: "03",
    icon: Compass,
    title: "Definimos a melhor estratégia",
    desc: "Selecionamos os melhores grupos e estruturamos o lance ideal para buscar a contemplação ágil.",
  },
  {
    number: "04",
    icon: Award,
    title: "Acompanhamos até a contemplação",
    desc: "Consultoria contínua mensal, gestão de lances e apoio total na liberação do crédito.",
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
    <section className="py-24 bg-slate-50/70 text-slate-900 relative overflow-hidden border-t border-slate-200/60" id="como-funciona">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-[#B8860B] text-xs font-bold uppercase tracking-widest">
            Etapas Simples & Transparentes
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F172A]">
            Como <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#966F1E]">Funciona</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Um processo consultivo em 4 passos para transformar seu planejamento em conquista real.
          </p>
        </div>

        {/* 4 Steps Horizontal Grid - Clean Light Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white rounded-3xl p-8 border border-slate-200/80 hover:border-amber-300 shadow-md shadow-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  {/* Step Top Bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#B8860B] group-hover:bg-[#0F172A] group-hover:text-white transition-all duration-300">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-3xl font-black text-slate-200 group-hover:text-amber-400/40 transition-colors">
                      {step.number}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-xl text-[#0F172A] group-hover:text-[#B8860B] transition-colors mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Connecting arrow indicator for desktop */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-20 text-slate-300 pointer-events-none">
                    <ArrowRight className="w-6 h-6 text-amber-500/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action button */}
        <div className="mt-16 text-center">
          <button
            onClick={scrollToSimulator}
            className="inline-flex items-center gap-3 bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <span>Começar Meu Planejamento</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
