import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-premium-desk.webp";
import { useState } from "react";

const Hero = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const services = [
    { label: "Consórcio Imobiliário", id: "imovel" },
    { label: "Consórcio de Veículos", id: "veiculo" },
    { label: "Consórcio de Motos", id: "moto" },
    { label: "Consórcio Agro & Pesados", id: "caminhão" },
    { label: "Consórcio para Investimento", id: "investimento" },
    { label: "Consórcio Náutico", id: "nautica" },
  ];

  const scrollToSimulator = () => {
    const simElement = document.getElementById("simulator");
    if (simElement) {
      simElement.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "#simulator";
    }
  };

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-white text-slate-900 border-b border-slate-100">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-no-repeat bg-right sm:bg-center lg:bg-right transition-all duration-700"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* Soft, clean gradient overlay to ensure perfect text readability on white/off-white */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/90 to-transparent lg:w-[65%] w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/40 lg:hidden" />
      </div>

      <div className="relative container max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-36 z-10">
        <div className="max-w-2xl space-y-7">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#B8860B] font-bold text-xs uppercase tracking-widest backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Consultoria Especializada em Consórcio</span>
          </div>

          {/* Main Title - Serif / Elegant style matching image */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] tracking-tight leading-[1.15]">
            Qual é o seu <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#966F1E]">
              próximo sonho?
            </span>
          </h1>

          {/* Description matching exact text */}
          <p className="text-slate-700 text-base sm:text-lg lg:text-xl font-medium leading-relaxed max-w-xl">
            Da casa própria ao carro novo, eu ajudo você a encontrar o <strong className="text-[#0F172A] font-bold">consórcio ideal</strong> para conquistar seus objetivos com segurança, planejamento e consultoria especializada que atenda sua necessidade.
          </p>

          {/* Services Checklist */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {services.map((service, i) => (
              <li
                key={i}
                onMouseEnter={() => setActiveId(service.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={scrollToSimulator}
                className={`flex items-center gap-3 text-slate-700 hover:text-[#0F172A] cursor-pointer transition-all duration-200 p-2 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 ${
                  activeId === service.id ? "bg-amber-50 border-amber-400/60 translate-x-1" : "bg-white/80"
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    activeId === service.id ? "text-amber-600" : "text-amber-500"
                  }`}
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">{service.label}</span>
              </li>
            ))}
          </ul>

          {/* Specialist Signature Block matching exact image layout */}
          <div className="pt-3 border-t border-slate-200/80 space-y-1">
            <div className="w-10 h-1 bg-[#B8860B] rounded-full mb-2" />
            <h3 className="text-base sm:text-lg font-black tracking-widest text-[#B8860B] uppercase">
              FABRICIO HONÓRIO
            </h3>
            <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              O Especialista Consórcio
            </p>
          </div>

          {/* Main CTA Button */}
          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={scrollToSimulator}
              className="inline-flex items-center justify-center gap-3 bg-[#0F172A] hover:bg-[#1E293B] text-white px-9 py-4 rounded-2xl text-base font-black uppercase tracking-wider shadow-xl shadow-slate-900/15 hover:shadow-slate-900/30 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <span>Simular Agora</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-amber-400" />
            </button>
            
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Resposta em 30s • Sem compromisso</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
