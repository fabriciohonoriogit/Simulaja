import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-premium-desk.webp";
import DreamInteraction from "./DreamInteraction";
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
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden bg-slate-950">
      {/* Background Image with Consultants, Family, Modern House, Car, Motorcycle */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url(${heroBg})`, backgroundPosition: "center right" }}
      />

      {/* Premium Gradient Overlay - Navy Blue Theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent sm:to-slate-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

      {/* Dimmer overlay for hover interaction */}
      <div
        className={`absolute inset-0 bg-slate-950/60 transition-opacity duration-700 pointer-events-none ${
          activeId ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="relative container max-w-7xl mx-auto px-4 sm:px-6 py-28 lg:py-36 z-20">
        <div className="max-w-2xl space-y-8">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Consultoria Financeira Premium
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Qual é o seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">próximo sonho?</span>
          </h1>

          {/* Main Description */}
          <p className="text-slate-200 text-base sm:text-lg lg:text-xl font-medium leading-relaxed max-w-xl">
            Da casa própria ao carro novo, eu ajudo você a encontrar o <strong className="text-white font-bold">consórcio ideal</strong> para conquistar seus objetivos com segurança, planejamento e consultoria especializada que atenda sua necessidade.
          </p>

          {/* Interactive Categories checklist */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {services.map((service, i) => (
              <li
                key={i}
                onMouseEnter={() => setActiveId(service.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={scrollToSimulator}
                className={`flex items-center gap-3 text-slate-300 hover:text-white cursor-pointer transition-all duration-300 p-2 rounded-xl border border-transparent hover:border-amber-400/30 hover:bg-white/5 backdrop-blur-sm ${
                  activeId === service.id ? "text-amber-300 translate-x-1 border-amber-400/40 bg-white/10" : ""
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    activeId === service.id ? "text-amber-400" : "text-amber-400/70"
                  }`}
                />
                <span className="text-sm font-semibold">{service.label}</span>
              </li>
            ))}
          </ul>

          {/* Consultant Signature Branding Block */}
          <div className="pt-2 flex items-center gap-4">
            <div className="h-12 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
            <div>
              <h3 className="text-lg font-black tracking-wider text-amber-400 uppercase">
                FABRICIO HONÓRIO
              </h3>
              <p className="text-xs font-bold text-slate-300 tracking-widest uppercase">
                O Especialista Consórcio
              </p>
            </div>
          </div>

          {/* CTA Principal */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={scrollToSimulator}
              className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 px-9 py-4 rounded-2xl text-base font-black uppercase tracking-wider shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:scale-[1.03] active:scale-95 group"
            >
              Simular Agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="flex items-center gap-2 px-3 py-2 text-slate-400 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sem compromisso. Resposta em 30 segundos.</span>
            </div>
          </div>

        </div>
      </div>

      {/* Dream Interaction Layer for visual effects */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        <DreamInteraction activeId={activeId} />
      </div>
    </section>
  );
};

export default Hero;
