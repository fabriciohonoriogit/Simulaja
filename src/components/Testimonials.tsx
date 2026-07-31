import { Star, Quote, CheckCircle } from "lucide-react";

const reviews = [
  {
    name: "Ricardo M.",
    role: "Empresário",
    quote: "Excelente atendimento.",
    detail: "O Fabrício estruturou uma estratégia de lance precisa e consegui contemplar a carta para expandir a frota da minha empresa muito antes do esperado.",
    city: "Curitiba - PR",
    rating: 5,
  },
  {
    name: "Patricia & Gustavo K.",
    role: "Engenheiros",
    quote: "Consegui conquistar meu imóvel.",
    detail: "Queríamos sair do aluguel sem pagar os juros abusivos do financiamento bancário. A consultoria nos deu total clareza e segurança no processo.",
    city: "São José dos Pinhais - PR",
    rating: 5,
  },
  {
    name: "Marcos V.",
    role: "Investidor",
    quote: "Muito mais barato que financiamento.",
    detail: "Fiz o planejamento para aquisição de imóveis de locação. Economia absurda de custos financeiros e acompanhamento exemplar até a liberação.",
    city: "Londrina - PR",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-slate-50/70 text-slate-900 relative overflow-hidden border-t border-slate-200/60" id="depoimentos">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-[#B8860B] text-xs font-bold uppercase tracking-widest">
            Prova Social & Avaliações
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F172A]">
            Histórias de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#966F1E]">Conquista</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Veja o depoimento de clientes que planejaram e conquistaram seus patrimônios com a nossa consultoria.
          </p>
        </div>

        {/* Reviews Grid - Clean Light Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="group relative bg-white rounded-3xl p-8 border border-slate-200/80 hover:border-amber-300 shadow-md shadow-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
            >
              <div>
                {/* Header Stars & Quote icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-amber-500/20 group-hover:text-amber-500/40 transition-colors" />
                </div>

                {/* Main Highlight Quote */}
                <h3 className="text-xl font-black text-[#0F172A] group-hover:text-[#B8860B] transition-colors mb-3 leading-snug">
                  "{rev.quote}"
                </h3>

                {/* Detail */}
                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                  "{rev.detail}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-[#0F172A] text-sm">{rev.name}</h4>
                  <p className="text-slate-500 text-xs">{rev.role} • {rev.city}</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verificado</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
