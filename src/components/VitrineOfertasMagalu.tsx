import React from "react";
import { Sparkles, Flame, CheckCircle2, ArrowRight, ShieldCheck, Heart, Zap } from "lucide-react";
import { getActiveCampaignTheme } from "@/utils/campaignThemeManager";

export interface OfertaConquista {
  id: string;
  categoria: "imovel" | "veiculo" | "moto" | "caminhão";
  categoriaLabel: string;
  titulo: string;
  subtitulo: string;
  imagem: string;
  creditoFormatado: string;
  creditoValor: number;
  meiaParcela: string;
  comparativoFinanciamento: string;
  tagDestaque: string;
  tagCor: string;
  prazo: string;
}

export const OFERTAS_MAGALU: OfertaConquista[] = [
  {
    id: "oferta_imovel_150k",
    categoria: "imovel",
    categoriaLabel: "Imóveis",
    titulo: "Casa Própria & Terreno",
    subtitulo: "Saia do aluguel ou construa a casa da família com escritura própria",
    imagem: "/images/magalu/bf/bf-imovel.jpg",
    creditoFormatado: "R$ 150.000,00",
    creditoValor: 150000,
    meiaParcela: "R$ 508,25/mês",
    comparativoFinanciamento: "Financiamento cobraria ~R$ 1.850/mês",
    tagDestaque: "🔥 A Mais Desejada",
    tagCor: "bg-amber-500 text-slate-950",
    prazo: "220 meses",
  },
  {
    id: "oferta_carro_100k",
    categoria: "veiculo",
    categoriaLabel: "Veículos",
    titulo: "SUV Zero KM ou Sedan",
    subtitulo: "Cheiro de carro novo na garagem com poder de compra à vista na loja",
    imagem: "/images/magalu/bf/bf-carro.jpg",
    creditoFormatado: "R$ 100.000,00",
    creditoValor: 100000,
    meiaParcela: "R$ 680,00/mês",
    comparativoFinanciamento: "Sem pagar R$ 25 mil de entrada",
    tagDestaque: "⚡ Destaque Black",
    tagCor: "bg-cyan-400 text-slate-950",
    prazo: "100 meses",
  },
  {
    id: "oferta_imovel_300k",
    categoria: "imovel",
    categoriaLabel: "Imóveis",
    titulo: "Sobrado Moderno & Alto Padrão",
    subtitulo: "Espaço gourmet, suíte e segurança que a sua família merece",
    imagem: "/images/magalu/banner_casa_300k.jpg",
    creditoFormatado: "R$ 300.000,00",
    creditoValor: 300000,
    meiaParcela: "R$ 1.239,00/mês",
    comparativoFinanciamento: "Menos que o aluguel de um apto comum",
    tagDestaque: "💎 Alto Padrão",
    tagCor: "bg-purple-400 text-slate-950",
    prazo: "200 meses",
  },
  {
    id: "oferta_caminhonete_400k",
    categoria: "caminhão",
    categoriaLabel: "Pesados",
    titulo: "Caminhonete 4x4 ou Caminhão",
    subtitulo: "Expansão de frotas e ativos comerciais que geram renda no primeiro mês",
    imagem: "/images/magalu/bf/bf-caminhonete.jpg",
    creditoFormatado: "R$ 400.000,00",
    creditoValor: 400000,
    meiaParcela: "R$ 1.950,00/mês",
    comparativoFinanciamento: "O próprio trabalho do veículo paga a cota",
    tagDestaque: "🚛 Rentabilidade Pura",
    tagCor: "bg-emerald-400 text-slate-950",
    prazo: "120 meses",
  },
  {
    id: "oferta_moto_35k",
    categoria: "moto",
    categoriaLabel: "Motos",
    titulo: "Moto Alta Cilindrada 0km",
    subtitulo: "Liberdade nos finais de semana e agilidade no dia a dia",
    imagem: "/images/magalu/bf/bf-moto.jpg",
    creditoFormatado: "R$ 35.000,00",
    creditoValor: 350000,
    meiaParcela: "R$ 295,00/mês",
    comparativoFinanciamento: "Menos de R$ 10 ao dia",
    tagDestaque: "⭐ Liberdade Total",
    tagCor: "bg-pink-400 text-slate-950",
    prazo: "70 meses",
  },
];

export function VitrineOfertasMagalu() {
  const theme = getActiveCampaignTheme();

  const handleSelectOffer = (oferta: OfertaConquista) => {
    // Sincroniza o simulador globalmente
    window.dispatchEvent(
      new CustomEvent("select-simulator-category", {
        detail: { categoryId: oferta.categoria },
      })
    );

    // Rola suavemente até o simulador no topo
    const sim = document.getElementById("simulator");
    if (sim) {
      sim.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 bg-[#070D19] text-white relative overflow-hidden border-b border-white/10">
      {/* Luzes de Fundo Sazonais Magalu */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER DA VITRINE COM APELO DE DESEJO (ESTILO IFOOD DAS CONQUISTAS) */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600/30 to-amber-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-lg shadow-cyan-500/20">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>Cardápio de Conquistas Magalu</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
            Escolha o que você vai conquistar hoje{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
              com parcelas que cabem no bolso
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            Valores reais calculados com a metodologia de <strong>50% de parcela até a contemplação</strong>. Toque em qualquer oferta para simular na hora:
          </p>
        </div>

        {/* VITRINE HORIZONTAL DE CARDS DE DESEJO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {OFERTAS_MAGALU.map((oferta) => (
            <div
              key={oferta.id}
              onClick={() => handleSelectOffer(oferta)}
              className="group cursor-pointer rounded-3xl p-3 bg-gradient-to-b from-[#0a1226] to-[#060b18] border border-white/10 hover:border-cyan-400/60 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Imagem Desejável do Bem com Tag de Oferta */}
              <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-3 bg-slate-950">
                <img
                  src={oferta.imagem}
                  alt={oferta.titulo}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

                {/* Tag de Destaque */}
                <div className="absolute top-2 left-2 z-10">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md ${oferta.tagCor}`}>
                    {oferta.tagDestaque}
                  </span>
                </div>

                {/* Prazo */}
                <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-[9px] font-bold text-slate-300 backdrop-blur-md">
                  {oferta.prazo}
                </div>
              </div>

              {/* Corpo da Oferta */}
              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    {oferta.categoriaLabel}
                  </div>
                  <h3 className="text-sm font-black text-white leading-tight group-hover:text-cyan-300 transition-colors">
                    {oferta.titulo}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {oferta.subtitulo}
                  </p>
                </div>

                {/* Bloco de Preço & Parcela Reduzida */}
                <div className="pt-2 border-t border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Crédito:</span>
                    <span className="text-white font-black">{oferta.creditoFormatado}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-amber-300">
                      Meia Parcela 50/50:
                    </div>
                    <div className="text-base font-black text-amber-400">
                      {oferta.meiaParcela}
                    </div>
                  </div>

                  <div className="text-[9.5px] text-emerald-400 font-bold text-center">
                    {oferta.comparativoFinanciamento}
                  </div>
                </div>

                {/* Botão de Conquista Imediata */}
                <button
                  type="button"
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/25 transition-all group-hover:scale-105"
                >
                  <span>QUERO ESTE</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAIXA INFERIOR COM COMPARATIVO RÁPIDO */}
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-slate-900/40 to-blue-900/30 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider">
                Prefere outro valor ou outro bem?
              </div>
              <div className="text-[11px] text-slate-300">
                Você pode simular qualquer crédito de R$ 15 mil até R$ 2 Milhões no topo da página.
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const sim = document.getElementById("simulator");
              if (sim) sim.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all shrink-0"
          >
            Personalizar no Simulador ➔
          </button>
        </div>

      </div>
    </section>
  );
}

