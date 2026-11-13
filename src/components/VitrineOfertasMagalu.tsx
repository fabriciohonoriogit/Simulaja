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
  meiaParcela: string;
  parcelaPosContemplacao: string;
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
    meiaParcela: "R$ 508,25/mês",
    parcelaPosContemplacao: "R$ 1.016,50/mês",
    comparativoFinanciamento: "Financiamento bancário cobraria ~R$ 1.850/mês¹",
    tagDestaque: "🔥 A Mais Desejada",
    tagCor: "bg-amber-500 text-slate-950",
    prazo: "220 meses",
  },
  {
    id: "oferta_carro_100k",
    categoria: "veiculo",
    categoriaLabel: "Veículos",
    titulo: "SUV Zero KM ou Sedan",
    subtitulo: "Carro novo na garagem com poder de compra à vista na concessionária",
    imagem: brightCar,
    creditoFormatado: "R$ 100.000,00",
    creditoValor: 100000,
    meiaParcela: "R$ 680,00/mês",
    parcelaPosContemplacao: "R$ 1.360,00/mês",
    comparativoFinanciamento: "Sem pagar R$ 25 mil de entrada bancária",
    tagDestaque: "⚡ Destaque Black",
    tagCor: "bg-cyan-400 text-slate-950",
    prazo: "100 meses",
  },
  {
    id: "oferta_imovel_300k",
    categoria: "imovel",
    categoriaLabel: "Imóveis",
    titulo: "Sobrado Moderno & Família",
    subtitulo: "Espaço gourmet, suíte e segurança que a sua família merece",
    imagem: brightMansion,
    creditoFormatado: "R$ 300.000,00",
    creditoValor: 300000,
    meiaParcela: "R$ 1.239,00/mês",
    parcelaPosContemplacao: "R$ 2.478,00/mês",
    comparativoFinanciamento: "Menos que o aluguel de um apartamento comum",
    tagDestaque: "💎 Alto Padrão",
    tagCor: "bg-purple-400 text-slate-950",
    prazo: "200 meses",
  },
  {
    id: "oferta_caminhonete_400k",
    categoria: "caminhão",
    categoriaLabel: "Pesados",
    titulo: "Caminhonete 4x4 ou Caminhão",
    subtitulo: "Expansão de frotas e ativos comerciais para geração de receita",
    imagem: brightPickup,
    creditoFormatado: "R$ 400.000,00",
    creditoValor: 400000,
    meiaParcela: "R$ 1.950,00/mês",
    parcelaPosContemplacao: "R$ 3.900,00/mês",
    comparativoFinanciamento: "Faturamento do bem auxilia na quitação da cota",
    tagDestaque: "🚛 Rentabilidade Pura",
    tagCor: "bg-emerald-400 text-slate-950",
    prazo: "120 meses",
  },
  {
    id: "oferta_moto_35k",
    categoria: "moto",
    categoriaLabel: "Motos",
    titulo: "Moto Média/Alta Cilindrada",
    subtitulo: "Mobilidade diária e viagens de fim de semana com economia",
    imagem: brightMoto,
    creditoFormatado: "R$ 35.000,00",
    creditoValor: 35000,
    meiaParcela: "R$ 295,00/mês",
    parcelaPosContemplacao: "R$ 590,00/mês",
    comparativoFinanciamento: "Menos de R$ 10 ao dia até contemplar",
    tagDestaque: "⭐ Mobilidade Total",
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
    <section className="py-12 sm:py-16 bg-[#070D19] text-white relative overflow-hidden border-b border-white/10">
      {/* Luzes de Fundo Sazonais Magalu com Pulso Lento */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-blue-600/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER DA VITRINE COM APELO DE DESEJO */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600/30 to-amber-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-lg shadow-cyan-500/20">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>Cardápio de Oportunidades Magalu</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
            Escolha o que você vai conquistar hoje{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
              com parcelas planejadas
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            Exemplos reais com a modalidade de <strong>50% de parcela até a contemplação</strong>. Toque em qualquer oferta para carregar no simulador:
          </p>
        </div>

        {/* VITRINE HORIZONTAL DE CARDS DE DESEJO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {OFERTAS_MAGALU.map((oferta) => (
            <motion.div
              key={oferta.id}
              onClick={() => handleSelectOffer(oferta)}
              whileHover={{ y: -7, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group cursor-pointer rounded-3xl p-3.5 bg-gradient-to-b from-[#0a1226] to-[#060b18] border border-white/10 hover:border-cyan-400/80 shadow-xl hover:shadow-[0_12px_35px_rgba(0,242,254,0.22)] transition-all duration-300 flex flex-col justify-between"
            >
              {/* Imagem do Bem com Tag de Oferta e Feixe de Luz */}
              <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-slate-900/30">
                <img
                  src={oferta.imagem}
                  alt={oferta.titulo}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 brightness-[1.03] contrast-[1.02]"
                />

                {/* Feixe de Luz Reflexivo ao Passar o Mouse */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-[-150%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                </div>

                {/* Sombra no rodapé para leitura dos badges */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none z-10" />

                {/* Tag de Destaque */}
                <div className="absolute top-2 left-2 z-20">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md ${oferta.tagCor} flex items-center gap-1`}>
                    {oferta.tagDestaque}
                  </span>
                </div>

                {/* Selo Ilustrativo & Prazo */}
                <div className="absolute bottom-2 inset-x-2 z-20 flex items-center justify-between">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 text-[8.5px] text-slate-300 font-semibold backdrop-blur-sm border border-white/10">
                    Ilustrativo
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/75 border border-white/15 text-[9px] font-bold text-slate-300 backdrop-blur-md">
                    {oferta.prazo}
                  </span>
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

                {/* Bloco de Preço & Parcela com Transparência Pré/Pós Contemplação */}
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Crédito:</span>
                    <span className="text-white font-black">{oferta.creditoFormatado}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center group-hover:border-amber-400/60 transition-colors">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-amber-300">
                      Meia Parcela (até contemplar):
                    </div>
                    <div className="text-base font-black text-amber-400 group-hover:scale-105 transition-transform font-mono">
                      {oferta.meiaParcela}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                      Pós-contemplação: <span className="text-slate-300 font-bold">{oferta.parcelaPosContemplacao}</span>
                    </div>
                  </div>

                  <div className="text-[9.5px] text-emerald-400 font-bold text-center leading-tight">
                    {oferta.comparativoFinanciamento}
                  </div>
                </div>

                {/* Botão de Conquista Imediata */}
                <button
                  type="button"
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 hover:from-cyan-400 hover:to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/25 transition-all group-hover:shadow-[0_0_20px_rgba(0,242,254,0.4)]"
                >
                  <span>SIMULAR ESTA COTA</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAIXA INFERIOR COM NOTA REGULATÓRIA & LINK DE PERSONALIZAÇÃO */}
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-slate-900/40 to-blue-900/30 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider">
                Prefere outro valor ou crédito sob medida?
              </div>
              <div className="text-[11px] text-slate-300">
                Você pode simular qualquer crédito de R$ 15 mil até R$ 2 Milhões com taxas oficiais do Consórcio Magalu.
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const sim = document.getElementById("simulator");
              if (sim) sim.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all shrink-0 hover:scale-105 shadow-md shadow-amber-500/20"
          >
            Personalizar no Simulador ➔
          </button>
        </div>

        {/* NOTA DE TRANSPARÊNCIA E COMPLIANCE ABAC / BACEN */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 text-center font-medium">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            * Imagens de bens meramente ilustrativas. Créditos sujeitos a aprovação cadastral. A meia parcela (Plano 50/50) vigora até a contemplação por sorteio ou lance; após, aplica-se a recomposição ou amortização conforme contrato oficial Magalu. ¹ Base comparativa estimada calculada sobre CET médio de 11,5% a.a. na tabela SAC.
          </span>
        </div>

      </div>
    </section>
  );
}
