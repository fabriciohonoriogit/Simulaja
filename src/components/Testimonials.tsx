import React from "react";
import { CheckCircle2, ShieldCheck, Quote, Info } from "lucide-react";
import { BlueParticlesBackground } from "@/components/BlueParticlesBackground";

const testimonials = [
  {
    author: "João Pereira",
    role: "Construtor Civil",
    city: "Paranaguá/PR",
    quote: "Confesso que no início eu tinha receio de consórcio, achava que demorava muito. O Fabrício estruturou uma estratégia de lance calculada para o meu orçamento e fui contemplado já no 3º mês. Consegui antecipar a compra do maquinário para as minhas obras sem pagar nenhum juro bancário.",
    conquista: "Maquinário & Construção Civil",
    initials: "JP",
    badge: "Contemplação Planejada",
  },
  {
    author: "Zilma Gomes",
    role: "Aposentada",
    city: "Guaratuba/PR",
    quote: "Meu sonho sempre foi ter um imóvel próprio no litoral para reunir a família nos fins de semana. O Fabrício cuidou de cada detalhe com muita paciência e respeito. No 6º mês veio a contemplação e hoje minha casa na praia é uma realidade.",
    conquista: "Imóvel no Litoral",
    initials: "ZG",
    badge: "Casa Própria",
  },
  {
    author: "Elias Jr.",
    role: "Comerciante & Autônomo",
    city: "Paranaguá/PR",
    quote: "Queria trocar de veículo, mas o financiamento bancário pedia uma entrada absurda e quase o dobro do valor em juros. Conheci a consultoria do Fabrício por indicação de um amigo: entrei no plano com meia parcela e conquistei meu veículo sem me descapitalizar.",
    conquista: "Veículo 0km",
    initials: "EJ",
    badge: "Aquisição Sem Entrada",
  },
];

const Testimonials = () => {
  return (
    <section className="py-14 sm:py-20 bg-[#070D19] text-white relative overflow-hidden border-t border-white/10" id="depoimentos">
      {/* Partículas Espaciais Contínuas */}
      <BlueParticlesBackground />

      {/* Luzes e Auroras Cósmicas Suaves */}
      <div className="absolute top-10 right-10 w-[500px] h-[350px] bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[350px] bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Casos Reais de Sucesso</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Histórias de quem planejou e{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
              conquistou seu patrimônio
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Experiências de clientes que transformaram metas em conquistas concretas com a assessoria executiva de Fabrício Honório.
          </p>
        </div>

        {/* Grid de Depoimentos Alinhados com Design Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="relative bg-gradient-to-b from-[#0B1528]/95 to-[#070D19]/95 rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-cyan-400/50 shadow-2xl shadow-blue-950/60 hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between backdrop-blur-xl h-full"
            >
              {/* Top: Ícone Quote & Badge da Conquista */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center justify-center">
                    <Quote className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/[0.04] text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                {/* Depoimento Textual */}
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-medium mb-6">
                  "{item.quote}"
                </p>
              </div>

              {/* Bottom: Perfil do Cliente */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
                    {item.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white leading-tight flex items-center gap-1.5">
                      {item.author}
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {item.role} • <span className="text-slate-300">{item.city}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AVISO REGULATÓRIO BANCO CENTRAL & LEI 11.795/2008 */}
        <div className="mt-10 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-400 flex items-start gap-3 max-w-4xl mx-auto backdrop-blur-md">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-slate-200">Aviso Regulatório (Lei Federal nº 11.795/2008 / Banco Central do Brasil):</strong> Os depoimentos acima representam experiências individuais de clientes consorciados. No sistema de consórcios, a contemplação ocorre exclusivamente por meio de sorteio ou lance nas assembleias oficiais mensais da administradora, não havendo garantia de data prévia de contemplação.
          </p>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
