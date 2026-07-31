import cardImovel from "@/assets/card-imovel.webp";
import cardVeiculo from "@/assets/card-veiculo.webp";
import cardMoto from "@/assets/card-moto.webp";
import cardNautica from "@/assets/card-nautica.webp";
import cardFrotas from "@/assets/segment-truck.webp";
import cardAgro from "@/assets/card-agro.webp";
import cardInvestimento from "@/assets/card-investment-chalets.webp";
import { ArrowRight, Sparkles } from "lucide-react";

const segments = [
  {
    title: "Consórcio Imobiliário",
    desc: "Casas, apartamentos, terrenos, barracões e alavancagem patrimonial sem juros bancários.",
    image: cardImovel,
    tag: "Imóveis",
  },
  {
    title: "Consórcio de Veículos",
    desc: "Carros 100% elétricos, híbridos, sedans e utilitários com poder de compra à vista.",
    image: cardVeiculo,
    tag: "Veículos",
  },
  {
    title: "Consórcio de Motos",
    desc: "Motos urbanas, scooters e alta cilindrada com parcelas planejadas que cabem no seu bolso.",
    image: cardMoto,
    tag: "Motos",
  },
  {
    title: "Consórcio Náutico",
    desc: "Jet ski, lanchas, barcos e equipamentos náuticos com planejamento estratégico.",
    image: cardNautica,
    tag: "Náutica",
  },
  {
    title: "Consórcio de Pesados & Frotas",
    desc: "Caminhões extrapesados, carretas, vans e frotas comerciais para expansão do seu negócio.",
    image: cardFrotas,
    tag: "Pesados",
  },
  {
    title: "Consórcio Agro",
    desc: "Tratores, colheitadeiras, pulverizadores e maquinários para alavancar a sua produção.",
    image: cardAgro,
    tag: "Agronegócio",
  },
  {
    title: "Consórcio para Investimento",
    desc: "Alavancagem patrimonial com galpões comerciais, barracões e renda passiva de aluguel.",
    image: cardInvestimento,
    tag: "Investimentos",
  },
];

const SegmentCards = () => {
  const scrollToSimulator = () => {
    const simElement = document.getElementById("simulator");
    if (simElement) {
      simElement.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "#simulator";
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden" id="segmentos">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portfólio de Soluções</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Tipos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">Consórcio</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Escolha o segmento ideal para o seu momento de vida e receba um planejamento personalizado para atingir seu objetivo.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="group relative bg-slate-900/80 backdrop-blur-md rounded-3xl overflow-hidden border border-slate-800/80 hover:border-amber-400/40 shadow-xl shadow-slate-950/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between"
            >
              {/* Image Container */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={seg.image}
                  alt={seg.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                <span className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                  {seg.tag}
                </span>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-xl text-white group-hover:text-amber-300 transition-colors">
                    {seg.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mt-2.5">
                    {seg.desc}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={scrollToSimulator}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-amber-500/25 transition-all group/btn"
                  >
                    <span>Simular Estratégia</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SegmentCards;
