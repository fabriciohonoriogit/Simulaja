import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-premium-desk.webp";
import { useState } from "react";

const Hero = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const services = [
    { label: "Consórcio Imobiliário", id: "imovel" },
    { label: "Consórcio de Veículos", id: "veiculo" },
    { label: "Consórcio de Motos", id: "moto" },
    { label: "Consórcio Náutico", id: "nautica" },
    { label: "Consórcio Pesados & Frotas", id: "caminhão" },
    { label: "Consórcio Agro", id: "agro" },
    { label: "Consórcio para Investimento", id: "investimento" },
  ];

  const scrollToSimulator = (categoryId?: string) => {
    if (categoryId) {
      window.dispatchEvent(new CustomEvent("select-simulator-category", { detail: { categoryId } }));
    }
    const simElement = document.getElementById("simulator");
    if (simElement) {
      simElement.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "#simulator";
    }
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-between overflow-hidden bg-white text-slate-900 pt-20">
      
      {/* Main Content Area with Original Banner Image */}
      <div className="relative flex-1 flex items-center min-h-[680px]">
        
        {/* Full Image Banner (Contains Title, House, Family & Specialist) */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Fabrício Honório — O Especialista Consórcio"
            className="w-full h-full object-cover object-left lg:object-center transition-all duration-700"
          />
        </div>

        {/* Interactive Overlay Box for Categories & Simulator Button */}
        <div className="relative container max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 z-10">
          <div className="max-w-xl mt-20 sm:mt-24 lg:mt-28 space-y-6">
            
            {/* Interactive Services Checklist */}
            <div className="bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                  Selecione seu objetivo para montar sua estratégia:
                </p>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {services.map((service, i) => (
                  <li
                    key={i}
                    onMouseEnter={() => setActiveId(service.id)}
                    onMouseLeave={() => setActiveId(null)}
                    onClick={() => scrollToSimulator(service.id)}
                    className={`flex items-center gap-2.5 text-slate-700 hover:text-[#0F172A] cursor-pointer transition-all duration-200 p-2.5 rounded-xl border border-slate-200/70 hover:border-amber-400 hover:bg-amber-50/70 bg-white/90 shadow-sm ${
                      activeId === service.id ? "bg-amber-50 border-amber-400 translate-x-1" : ""
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

              {/* Action Button inside container */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-slate-100 mt-4">
                <button
                  onClick={() => scrollToSimulator()}
                  className="w-full inline-flex items-center justify-center gap-3 bg-[#0F172A] hover:bg-[#1E293B] text-white px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-95 group"
                >
                  <span>SIMULAR ESTRATÉGIA AGORA</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-400" />
                </button>

                <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[11px] font-medium shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sem compromisso</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Navy Accent Bar matching bottom of image */}
      <div className="w-full h-4 bg-[#0F172A] border-t-2 border-[#B8860B] relative z-20" />
    </section>
  );
};

export default Hero;



