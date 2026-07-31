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
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800/60" id="depoimentos">
      {/* Background accents */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-widest">
            Prova Social & Avaliações
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Histórias de <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">Conquista</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Veja o depoimento de clientes que planejaram e conquistaram seus patrimônios com a nossa consultoria.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="group relative bg-slate-950/80 backdrop-blur-md rounded-3xl p-8 border border-slate-800 hover:border-amber-400/50 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between"
            >
              <div>
                {/* Header Stars & Quote icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-amber-400/20 group-hover:text-amber-400/40 transition-colors" />
                </div>

                {/* Main Highlight Quote */}
                <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors mb-3 leading-snug">
                  "{rev.quote}"
                </h3>

                {/* Detail */}
                <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">
                  "{rev.detail}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-white text-sm">{rev.name}</h4>
                  <p className="text-slate-400 text-xs">{rev.role} • {rev.city}</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" />
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
