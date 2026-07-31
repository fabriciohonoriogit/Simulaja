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
    <section className="relative w-full bg-[#0B132B] text-slate-900 pt-20 overflow-hidden">
      
      {/* Full Image Banner (Cheia na tela de borda a borda) */}
      <div className="relative w-full bg-[#0B132B] flex items-center justify-center overflow-hidden">
        <img
          src={heroBg}
          alt="Fabrício Honório — O Especialista Consórcio"
          className="w-full h-auto block min-w-full object-cover sm:object-fill lg:object-cover"
        />
      </div>

      {/* Navy Accent Bar separating banner and interactive card */}
      <div className="w-full h-2 bg-[#B8860B]" />

      {/* Interactive Overlay Box for Categories & Simulator Button (Posicionado logo abaixo para não cobrir o texto da arte) */}
      <div className="relative bg-[#0F172A] border-t border-slate-800 py-10 px-4 sm:px-6 z-20">
        <div className="max-w-4xl mx-auto">
          
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-950/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#0F172A]">
                  Selecione seu objetivo para montar sua estratégia:
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Simulação 100% Gratuita & Sem Compromisso</span>
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {services.map((service, i) => (
                <li
                  key={i}
                  onMouseEnter={() => setActiveId(service.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onClick={() => scrollToSimulator(service.id)}
                  className={`flex items-center gap-2.5 text-slate-700 hover:text-[#0F172A] cursor-pointer transition-all duration-200 p-3 rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:bg-amber-50/80 bg-white shadow-sm ${
                    activeId === service.id ? "bg-amber-50 border-amber-400 translate-x-1" : ""
                  }`}
                >
                  <CheckCircle2
                    className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                      activeId === service.id ? "text-amber-600" : "text-amber-500"
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{service.label}</span>
                </li>
              ))}
            </ul>

            {/* Action Button inside container */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <button
                onClick={() => scrollToSimulator()}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-95 group"
              >
                <span>SIMULAR ESTRATÉGIA AGORA</span>
                <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform text-amber-400" />
              </button>
            </div>
          </div>

        </div>
      </div>

    </section>
  );
};

export default Hero;



