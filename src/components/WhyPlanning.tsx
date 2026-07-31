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
    <section className="py-24 bg-white text-slate-900 relative overflow-hidden border-t border-slate-200/60" id="beneficios">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-[#B8860B] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Vantagens Exclusivas
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F172A]">
            Por que fazer um consórcio <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#966F1E]">com planejamento?</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Consórcio sem estratégia é depender apenas da sorte. Com consultoria especializada, transformamos seu objetivo em um plano de conquistas concreto.
          </p>
        </div>

        {/* 6 Benefit Cards Grid - Clean Light Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative bg-slate-50/80 rounded-3xl p-8 border border-slate-200/80 hover:border-amber-300 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100/70 border border-amber-300/60 flex items-center justify-center text-[#B8860B] group-hover:bg-[#0F172A] group-hover:text-white transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/60 px-3 py-1 rounded-full border border-amber-300/50">
                      ✔ Benefício
                    </span>
                  </div>

                  <h3 className="font-extrabold text-xl text-[#0F172A] group-hover:text-[#B8860B] transition-colors mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
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
            className="inline-flex items-center gap-3 bg-[#0F172A] hover:bg-[#1E293B] text-white px-9 py-4 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <span>Simular Estratégia Agora</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default WhyPlanning;
