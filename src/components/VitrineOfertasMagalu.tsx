import React from "react";
import { motion } from "framer-motion";
import { Flame, ArrowRight, Zap, Info } from "lucide-react";
import { getActiveCampaignTheme } from "@/utils/campaignThemeManager";
import brightHouse from "@/assets/bright/bright-house.webp";
import brightCar from "@/assets/bright/bright-car.webp";
import brightMansion from "@/assets/bright/bright-mansion.webp";
import brightPickup from "@/assets/bright/bright-pickup.webp";
import brightMoto from "@/assets/bright/bright-moto.webp";

export interface OfertaConquista {
  id: string;
  categoria: "imovel" | "veiculo" | "moto" | "caminhão";
  categoriaLabel: string;
  titulo: string;
  subtitulo: string;
  imagem: string;
  creditoFormatado: string;
  creditoValor: number;
  parcelaAPartir: string;
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
    imagem: brightHouse,
    creditoFormatado: "R$ 150.000,00",
    creditoValor: 150000,
    parcelaAPartir: "R$ 508,25/mês",
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
    imagem: brightCar,
    creditoFormatado: "R$ 100.000,00",
    creditoValor: 100000,
    parcelaAPartir: "R$ 680,00/mês",
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
    imagem: brightMansion,
    creditoFormatado: "R$ 300.000,00",
    creditoValor: 300000,
    parcelaAPartir: "R$ 1.239,00/mês",
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
    imagem: brightPickup,
    creditoFormatado: "R$ 400.000,00",
    creditoValor: 400000,
    parcelaAPartir: "R$ 1.950,00/mês",
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
    imagem: brightMoto,
    creditoFormatado: "R$ 35.000,00",
    creditoValor: 35000,
    parcelaAPartir: "R$ 295,00/mês",
    comparativoFinanciamento: "Menos de R$ 10 ao dia",
    tagDestaque: "⭐ Liberdade Total",
    tagCor: "bg-pink-400 text-slate-950",
    prazo: "70 meses",
  },
];

export function VitrineOfertasMagalu() {
  getActiveCampaignTheme();

  const handleSelectOffer = (oferta: OfertaConquista) => {
    const simCategory = 
      oferta.categoria === "caminhão" ? "pesados" :
      oferta.categoria === "moto" ? "veiculo" :
      oferta.categoria;

    // Sincroniza o simulador globalmente com categoria e crédito exato da oferta
    window.dispatchEvent(
      new CustomEvent("select-simulator-category", {
        detail: { 
          categoryId: simCategory,
          targetCredit: oferta.creditoValor,
        },
      })
    );

    // Rola suavemente até o simulador no topo
    const sim = document.getElementById("simulator");
    if (sim) {
      sim.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-12 sm:py-16 relative overflow-hidden border-b border-slate-200/80 bg-[#FAF9F5]"> 
      {/* Manchas decorativas suaves */}
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-bl from-blue-100/30 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[200px] bg-gradient-to-tr from-amber-100/30 to-transparent pointer-events-none" />

      <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER DA VITRINE COM APELO DE DESEJO */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-widest shadow-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Cardápio de Oportunidades Magalu</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Escolha o que você vai conquistar hoje{" "}
            <span className="text-[#0086FF]">
              com parcelas que cabem no bolso
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            Valores reais calculados com <strong>parcelas a partir de valores reduzidos</strong>. Toque em qualquer oferta para simular na hora:
          </p>
        </div>

        {/* VITRINE HORIZONTAL DE CARDS DE DESEJO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {OFERTAS_MAGALU.map((oferta) => (
            <motion.div
              key={oferta.id}
              onClick={() => handleSelectOffer(oferta)}
              whileHover={{ y: -5, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="group cursor-pointer rounded-3xl p-3.5 bg-white border border-orange-100/80 hover:border-[#0086FF]/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Imagem do Bem com Tag de Oferta e Feixe de Luz */}
              <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-slate-100">
                <img
                  src={oferta.imagem}
                  alt={oferta.titulo}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Sombra no rodapé para leitura dos badges */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none z-10" />

                {/* Tag de Destaque */}
                <div className="absolute top-2 left-2 z-20">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md ${oferta.tagCor} flex items-center gap-1`}>
                    {oferta.tagDestaque}
                  </span>
                </div>

                {/* Selo Ilustrativo & Prazo */}
                <div className="absolute bottom-2 inset-x-2 z-20 flex items-center justify-between">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 text-[8.5px] text-white font-semibold backdrop-blur-sm border border-white/10">
                    Ilustrativo
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/75 border border-white/15 text-[9px] font-bold text-white backdrop-blur-md">
                    {oferta.prazo}
                  </span>
                </div>
              </div>

              {/* Corpo da Oferta */}
              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#0086FF]">
                    {oferta.categoriaLabel}
                  </div>
                  <h3 className="text-sm font-black text-slate-800 leading-tight group-hover:text-[#0086FF] transition-colors">
                    {oferta.titulo}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                    {oferta.subtitulo}
                  </p>
                </div>

                {/* Bloco de Preço: PARCELAS A PARTIR DE */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Crédito:</span>
                    <span className="text-slate-900 font-black">{oferta.creditoFormatado}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-orange-50/70 border border-orange-100 text-center group-hover:border-blue-300 transition-colors">
                    <div className="text-[9.5px] font-bold uppercase tracking-widest text-slate-500">
                      Parcelas a partir de:
                    </div>
                    <div className="text-base font-black text-[#0086FF] transition-colors font-mono">
                      {oferta.parcelaAPartir}
                    </div>
                  </div>

                  <div className="text-[9.5px] text-emerald-600 font-bold text-center leading-tight">
                    {oferta.comparativoFinanciamento}
                  </div>
                </div>

                {/* Botão de Conquista Imediata */}
                <button
                  type="button"
                  className="w-full mt-2 py-2.5 rounded-xl bg-[#0086FF] hover:bg-[#0074E0] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                >
                  <span>QUERO ESTE</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAIXA INFERIOR COM PERSONALIZAÇÃO */}
        <div className="mt-8 p-4 rounded-2xl bg-white border border-orange-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-[#0086FF]" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Prefere outro valor ou crédito sob medida?
              </div>
              <div className="text-[11px] text-slate-600">
                Você pode simular qualquer crédito de R$ 15 mil até R$ 2 Milhões com taxas oficiais do Consórcio Magalu.
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const sim = document.getElementById("simulator");
              if (sim) sim.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0086FF] hover:bg-[#0074E0] text-white font-bold text-xs transition-all shrink-0 shadow-md shadow-blue-500/20"
          >
            Personalizar no Simulador ➔
          </button>
        </div>

        {/* NOTA DE TRANSPARÊNCIA */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500 text-center font-medium">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>
            * Imagens de bens meramente ilustrativas. Créditos sujeitos a aprovação cadastral e regras do Consórcio Magalu. Valores de parcelas sujeitos a alteração conforme tabela e grupo vigentes.
          </span>
        </div>

      </div>
    </section>
  );
}
