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
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800/60" id="como-funciona">
      {/* Glow background accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-widest">
            Etapas Simples & Transparentes
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Como <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">Funciona</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Um processo consultivo em 4 passos para transformar seu planejamento em conquista real.
          </p>
        </div>

        {/* 4 Steps Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="group relative bg-slate-950/70 backdrop-blur-md rounded-3xl p-8 border border-slate-800/80 hover:border-amber-400/50 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between"
              >
                <div>
                  {/* Step Top Bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all duration-300">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-3xl font-black text-slate-800 group-hover:text-amber-400/30 transition-colors">
                      {step.number}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-xl text-white group-hover:text-amber-300 transition-colors mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Connecting arrow indicator for desktop (except last item) */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-20 text-slate-700 pointer-events-none">
                    <ArrowRight className="w-6 h-6 text-amber-400/40" />
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
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider shadow-xl shadow-amber-500/20 hover:shadow-amber-500/35 transition-all hover:scale-105"
          >
            Começar Meu Planejamento
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
