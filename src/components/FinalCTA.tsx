import { ArrowRight, Sparkles } from "lucide-react";

const FinalCTA = () => {
  const scrollToSimulator = () => {
    const simElement = document.getElementById("simulator");
    if (simElement) {
      simElement.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "#simulator";
    }
  };

  return (
    <section className="py-28 bg-[#0F172A] text-white relative overflow-hidden border-t border-slate-800/80">
      {/* Decorative Glow Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container max-w-4xl mx-auto px-4 text-center relative z-10 space-y-8">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
            Sua Conquista Começa Agora
          </span>
        </div>

        {/* Large Text */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
          Planeje hoje. <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
            Conquiste amanhã.
          </span>
        </h2>

        {/* Subtext */}
        <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
          Solicite uma consultoria especializada e descubra a estratégia ideal para realizar seu objetivo.
        </p>

        {/* Action Button */}
        <div className="pt-4">
          <button
            onClick={scrollToSimulator}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 px-10 py-5 rounded-2xl text-lg font-black uppercase tracking-wider shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105 active:scale-95 group"
          >
            SIMULAR AGORA
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <p className="text-xs text-slate-400 font-medium">
          Leva menos de 30 segundos • Sem compromisso • Atendimento exclusivo
        </p>

      </div>
    </section>
  );
};

export default FinalCTA;
