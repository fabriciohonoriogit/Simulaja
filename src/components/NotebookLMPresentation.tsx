import React, { forwardRef } from "react";
import { GRUPO_CARACTERISTICAS, type GrupoItem } from "@/constants/simulador";

interface NotebookLMPresentationProps {
  grupo: GrupoItem;
  categoria: string;
  paymentMode: "linear" | "reduzido";
  installmentValue: number;
  simNome?: string;
  simWpp?: string;
  consultorNome?: string;
  lanceDinheiroPct?: number;
  lanceEmbutidoPct?: number;
  parcelasContemplar?: number;
  incluirSeguro?: boolean;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtFull = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const NotebookLMPresentation = forwardRef<HTMLDivElement, NotebookLMPresentationProps>(
  (
    {
      grupo,
      categoria,
      paymentMode,
      installmentValue,
      simNome,
      simWpp,
      consultorNome,
      lanceDinheiroPct = 0,
      lanceEmbutidoPct = 25,
      parcelasContemplar = 1,
      incluirSeguro = true,
    },
    ref
  ) => {
    if (!grupo) return null;

    const clienteStr = simNome?.trim() ? simNome.trim() : "CLIENTE ESPECIAL";
    const dataHoje = new Date().toLocaleDateString("pt-BR");

    // Modalidade do Plano
    let planoLabel = "PARCELA REDUZIDA (50%)";
    if (grupo.isPlanoGold) {
      planoLabel = "PLANO GOLD";
    } else if (paymentMode === "linear") {
      planoLabel = "PARCELA LINEAR (100%)";
    }

    // Cálculos de Seguro e Bonificação
    const valorSeguro = grupo.seguro ? grupo.credito * grupo.seguro : 0;
    const parcelaSemSeguro = Math.max(0, installmentValue - valorSeguro);
    const economiaSeguroTotal = valorSeguro * grupo.prazo;

    // Taxas
    const taxaAdmTotal = grupo.txLinear ?? grupo.tx5050 ?? grupo.tx ?? 15;
    const fundoReservaTotal = grupo.frLinear ?? grupo.fr5050 ?? grupo.fr ?? 1;

    // Lances e Pós-Contemplação
    const lEmbutidoRS = (grupo.credito * lanceEmbutidoPct) / 100;
    const lDinheiroRS = (grupo.credito * lanceDinheiroPct) / 100;
    const lanceTotalRS = lEmbutidoRS + lDinheiroRS;
    const lanceTotalPct = lanceEmbutidoPct + lanceDinheiroPct;
    const creditoDisponivel = Math.max(0, grupo.credito - lEmbutidoRS);

    const saldoDevedorBruto = grupo.credito * (1 + (taxaAdmTotal + fundoReservaTotal) / 100);
    const saldoDevedorPosLance = Math.max(
      0,
      saldoDevedorBruto - lanceTotalRS - installmentValue * parcelasContemplar
    );
    const prazoRestante = Math.max(1, grupo.prazo - parcelasContemplar);
    const parcelaPos = saldoDevedorPosLance / prazoRestante;

    const grupoNum = grupo.grupo || "";
    const grupoChar = GRUPO_CARACTERISTICAS[grupoNum];
    const ordemContemplacaoText =
      grupoChar?.ordemContemplacao ||
      "Sorteio (Loteria Federal), Lance Livre, Lance Fixo 25% e Lance Fixo 45% conforme saldo disponível do grupo.";

    // Imagem do Banner do Topo
    let bgHeaderImage = "/segment-agro.webp";
    let segmentoLabel = "MULTISEGMENTO, AGRO & FROTAS";

    // Cards do Segmento para a Seção 2 (Padrão: Imóvel)
    let segmentCards = [
      {
        title: "Casas Residenciais",
        icon: "🏡",
        image: "/segment-imovel.webp",
        desc: "Aquisição ou construção da casa dos seus sonhos em bairro nobre ou condomínio fechado sem juros bancários.",
      },
      {
        title: "Apartamentos & Studios",
        icon: "🏙️",
        image: "/segment-apartamento.png",
        desc: "Apartamentos na planta, prontos para morar ou unidades para locação com alta rentabilidade patrimonial.",
      },
      {
        title: "Terrenos & Lotes",
        icon: "🏞️",
        image: "/segment-terreno.png",
        desc: "Compra de terrenos e lotes em áreas de alta valorização para construção futura ou reserva de valor.",
      },
      {
        title: "Barracões & Alavancagem Patrimonial",
        icon: "🏗️",
        image: "/segment-investimento.webp",
        desc: "Alavancagem patrimonial com imóveis, barracões industriais, galpões comerciais e imóveis de renda.",
      },
    ];

    if (categoria === "imovel") {
      bgHeaderImage = "/segment-imovel.webp";
      segmentoLabel = "ESTRUTURAÇÃO IMOBILIÁRIA & PATRIMONIAL";
      segmentCards = [
        {
          title: "Casas Residenciais",
          icon: "🏡",
          image: "/segment-imovel.webp",
          desc: "Aquisição ou construção da casa dos seus sonhos em bairro nobre ou condomínio fechado sem juros bancários.",
        },
        {
          title: "Apartamentos & Studios",
          icon: "🏙️",
          image: "/segment-apartamento.png",
          desc: "Apartamentos na planta, prontos para morar ou unidades para locação com alta rentabilidade patrimonial.",
        },
        {
          title: "Terrenos & Lotes",
          icon: "🏞️",
          image: "/segment-terreno.png",
          desc: "Compra de terrenos e lotes em áreas de alta valorização para construção futura ou reserva de valor.",
        },
        {
          title: "Barracões & Alavancagem Patrimonial",
          icon: "🏗️",
          image: "/segment-investimento.webp",
          desc: "Alavancagem patrimonial com imóveis, barracões industriais, galpões comerciais e imóveis de renda.",
        },
      ];
    } else if (categoria === "veiculo") {
      bgHeaderImage = "/segment-veiculo.webp";
      segmentoLabel = "VEÍCULOS, MOTOS & NÁUTICO";
      segmentCards = [
        {
          title: "Veículos Híbridos & Elétricos",
          icon: "⚡",
          image: "/segment-veiculo.webp",
          desc: "Aquisição de carros 100% elétricos, híbridos plug-in e tecnologia automotiva de ponta sem juros bancários.",
        },
        {
          title: "Carros & Utilitários",
          icon: "🚗",
          image: "/segment-veiculo.webp",
          desc: "Automóveis 0km ou seminovos, sedans e utilitários de passeio com parcelas previsíveis.",
        },
        {
          title: "Motos & Scooters",
          icon: "🏍️",
          image: "/segment-moto.webp",
          desc: "Conquiste sua moto urbana, scooter ou modelos de alta cilindrada para lazer e mobilidade com economia total.",
        },
        {
          title: "Barcos & Jet Ski",
          icon: "🛥️",
          image: "/segment-jetski.webp",
          desc: "Adquira seu Jet Ski, lanchas, barcos e equipamentos náuticos de lazer sem incidir juros abusivos de financiamento.",
        },
      ];
    } else if (categoria === "servicos" || categoria === "eletro") {
      bgHeaderImage = "/segment-investimento.webp";
      segmentoLabel = "ELETRO, SERVIÇOS & SAÚDE ESTRATÉGICA";
      segmentCards = [
        {
          title: "Eletrodomésticos & Ponta",
          icon: "🧺",
          image: "/segment-eletrodomesticos.png",
          desc: "Equipe sua casa ou empresa com eletrodomésticos modernos, TVs, geladeiras side-by-side e tecnologia.",
        },
        {
          title: "Moto Elétrica & Mobilidade",
          icon: "⚡",
          image: "/segment-moto-eletrica.png",
          desc: "Adquira motos elétricas e soluções de mobilidade urbana sustentável economizando com combustível.",
        },
        {
          title: "Cirurgias Plásticas & Estética",
          icon: "✨",
          image: "/segment-cirurgia-plastica.png",
          desc: "Realize procedimentos estéticos, cirurgias plásticas e tratamentos de saúde com parcelas leves e planejadas.",
        },
        {
          title: "Serviços & Investimento",
          icon: "🎯",
          image: "/segment-investimento.webp",
          desc: "Financie festas de casamento, formaturas, viagens internacionais, estudos e grandes projetos corporativos.",
        },
      ];
    } else if (categoria === "pesados") {
      bgHeaderImage = "/segment-agro.webp";
      segmentoLabel = "PESADOS, MÁQUINAS AGRÍCOLAS & CAMINHÕES";
      segmentCards = [
        {
          title: "Carros SUV & Esportivos",
          icon: "🚙",
          image: "/segment-veiculo.webp",
          desc: "SUVs premium, utilitários esportivos e veículos de alto desempenho para uso pessoal ou executivo.",
        },
        {
          title: "Caminhões & Frotas Pesadas",
          icon: "🚛",
          image: "/segment-truck.webp",
          desc: "Caminhões extrapesados, cavalos mecânicos, carretas graneleiras e frotas comerciais sem juros bancários.",
        },
        {
          title: "Tratores & Máquinas Agrícolas",
          icon: "🚜",
          image: "/segment-agro.webp",
          desc: "Tratores, colheitadeiras, pulverizadores e implementos do campo para alavancar a produção mantendo a saúde do caixa.",
        },
        {
          title: "Maquinário & Alavancagem Pesada",
          icon: "🏗️",
          image: "/segment-investimento.webp",
          desc: "Retroescavadeiras, máquinas amarela e equipamentos pesados preservando o capital de giro para operações.",
        },
      ];
    }

    return (
      <div
        id="notebook-lm-presentation-container"
        ref={ref}
        className="w-[1200px] bg-slate-50 text-slate-900 font-sans select-none"
      >
        {/* SLIDE DE APRESENTAÇÃO EXECUTIVA (100% CLEAN, VIBRANTE & ALTO CONTRASTE) */}
        <div className="w-[1200px] p-[50px] pb-[100px] bg-gradient-to-b from-white via-slate-50 to-slate-100 flex flex-col gap-6 relative shadow-2xl border border-slate-200">
          
          {/* TOPO: BARRA DE APRESENTAÇÃO */}
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-5">
            <div className="flex items-center gap-6">
              <img
                src="/logo-consorcio-magalu.svg"
                alt="Consórcio Magalu"
                className="h-[54px] w-auto object-contain"
              />
              <div className="h-8 w-[2px] bg-slate-300" />
              <div className="flex flex-col">
                <span className="text-[12px] font-black tracking-[0.25em] text-[#FF5500] uppercase">
                  NOTEBOOK LM EXECUTIVE BRIEFING
                </span>
                <span className="text-[17px] font-extrabold text-slate-900 tracking-wide">
                  ESTUDO ESTRATÉGICO DE ALAVANCAGEM PATRIMONIAL
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end text-right">
              <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-widest">
                DATA: {dataHoje} · GRUPO {grupo.grupo || "5996"}
              </span>
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3.5 py-1 rounded-full mt-1 uppercase tracking-wider shadow-sm">
                STATUS: {grupo.tipoVenda || "DISPONÍVEL"}
              </span>
            </div>
          </div>

          {/* HERO BANNER DESTAQUE DO CLIENTE */}
          <div className="relative rounded-[24px] overflow-hidden border-2 border-slate-200 shadow-xl h-[240px] flex items-center p-8">
            <div
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(${bgHeaderImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/30" />

            <div className="relative z-10 max-w-[800px]">
              <span className="inline-block bg-[#FF5500] text-white text-[11px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-2 shadow-md">
                {segmentoLabel}
              </span>
              
              <div className="text-[11px] font-black tracking-[0.2em] text-[#E0A96D] uppercase mb-1">
                APRESENTAÇÃO EXECUTIVA PREPARADA ESPECIALMENTE PARA
              </div>
              <h1 className="text-[34px] font-black uppercase tracking-tight text-white leading-tight mb-2 drop-shadow-md">
                {clienteStr}
              </h1>
              <p className="text-[13px] font-semibold text-slate-100 leading-relaxed">
                Planejamento financeiro de alta performance para aquisição de bens patrimoniais sem incidência de juros bancários remuneratórios.
              </p>
            </div>
          </div>

          {/* RESULTADOS DA SIMULAÇÃO: 6 KPI CARDS */}
          <div>
            <h2 className="text-[14px] font-black tracking-[0.2em] uppercase text-slate-900 mb-3.5 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5500]" />
              1. RESULTADOS COMPLETO DA SIMULAÇÃO
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Card 1: Crédito */}
              <div className="bg-white border-2 border-slate-200 rounded-[20px] p-4.5 text-center shadow-md">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  CRÉDITO CONTRATADO
                </span>
                <span className="text-[27px] font-black text-slate-900 leading-none block">
                  {fmtFull(grupo.credito)}
                </span>
              </div>

              {/* Card 2: Modalidade & Parcela Inicial */}
              <div className="bg-white border-2 border-emerald-500 rounded-[20px] p-4.5 text-center shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block mb-1">
                  {planoLabel}
                </span>
                <span className="text-[27px] font-black text-emerald-600 leading-none block">
                  {fmtFull(installmentValue)}
                </span>
                <span className="text-[10.5px] font-bold text-slate-500 block mt-1">
                  (Parcela inicial pré-contemplação)
                </span>
              </div>

              {/* Card 3: Parcela Pós-Contemplação */}
              <div className="bg-white border-2 border-[#FF5500] rounded-[20px] p-4.5 text-center shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#FF5500]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF5500] block mb-1">
                  PARCELA PÓS-CONTEMPLAÇÃO
                </span>
                <span className="text-[27px] font-black text-[#FF5500] leading-none block">
                  {fmtFull(parcelaPos)}
                </span>
                <span className="text-[10.5px] font-bold text-slate-500 block mt-1">
                  (Após abate do lance ofertado)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Card 4: Prazo Total */}
              <div className="bg-white border-2 border-slate-200 rounded-[20px] p-3.5 text-center shadow-sm">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  PRAZO DO PLANO
                </span>
                <span className="text-[22px] font-black text-slate-900 leading-none block">
                  {grupo.prazo} meses
                </span>
              </div>

              {/* Card 5: Crédito Disponível Líquido */}
              <div className="bg-white border-2 border-slate-200 rounded-[20px] p-3.5 text-center shadow-sm">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  CRÉDITO DISPONÍVEL LÍQUIDO
                </span>
                <span className="text-[22px] font-black text-slate-900 leading-none block">
                  {fmtFull(creditoDisponivel)}
                </span>
              </div>

              {/* Card 6: Taxa Adm & Fundo Reserva */}
              <div className="bg-white border-2 border-slate-200 rounded-[20px] p-3.5 text-center shadow-sm">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  TAXA ADM &amp; F. RESERVA
                </span>
                <span className="text-[22px] font-black text-slate-900 leading-none block">
                  {taxaAdmTotal}% / {fundoReservaTotal}%
                </span>
              </div>
            </div>
          </div>

          {/* SIMULAÇÃO DE CONTEMPLAÇÃO & BONIFICAÇÃO SEM SEGURO */}
          <div className="grid grid-cols-2 gap-5">
            {/* Bloco 1: Estrutura de Contemplação & Lances */}
            <div className="bg-white border-2 border-slate-200 rounded-[22px] p-5.5 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-[13.5px] font-black tracking-wider uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                  <span>🎯</span> FORMAS DE CONTEMPLAÇÃO
                </h3>
                <p className="text-[12px] font-medium text-slate-700 mb-3 leading-relaxed">
                  Contemplações mensais por <strong>Sorteio (Loteria Federal)</strong> ou modalidade de <strong>Lances (Livre, Fixo 25% e Fixo 45%)</strong>.
                </p>

                <div className="bg-slate-100 rounded-xl p-4 border border-slate-300 space-y-2">
                  <div className="flex justify-between items-center text-[11.5px]">
                    <span className="text-slate-600 font-semibold">Lance Embutido (25%):</span>
                    <span className="font-black font-mono text-slate-900 text-[12px]">{fmtFull(lEmbutidoRS)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11.5px]">
                    <span className="text-slate-600 font-semibold">Lance do Bolso (Recursos Próprios):</span>
                    <span className="font-black font-mono text-slate-900 text-[12px]">{fmtFull(lDinheiroRS)}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[13px]">
                    <span className="font-black text-[#FF5500]">TOTAL DO LANCE SIMULADO:</span>
                    <span className="font-black font-mono text-[#FF5500]">{lanceTotalPct.toFixed(1)}% ({fmtFull(lanceTotalRS)})</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-300 flex justify-between items-center text-[11.5px]">
                <span className="text-slate-600 font-bold">Parcela Pós-Contemplação:</span>
                <span className="text-[15px] font-black text-emerald-600">{fmtFull(parcelaPos)}</span>
              </div>
            </div>

            {/* Bloco 2: Bonificação Exclusiva Sem Seguro */}
            <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border-2 border-emerald-400 rounded-[22px] p-5.5 shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-bl-xl shadow-sm">
                BONIFICAÇÃO EXCLUSIVA
              </div>

              <div>
                <h3 className="text-[13.5px] font-black tracking-wider uppercase text-emerald-800 mb-2 flex items-center gap-1.5">
                  <span>🎁</span> PLANO COM BONIFICAÇÃO SEM SEGURO
                </h3>
                <p className="text-[12px] font-medium text-slate-700 mb-3 leading-relaxed">
                  Ao optar pela contratação com isenção de seguro de vida individual, o seu plano recebe um desconto mensal automático.
                </p>

                <div className="bg-white rounded-xl p-4 border border-emerald-300 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-[11.5px]">
                    <span className="text-slate-500 font-semibold">Parcela com Seguro:</span>
                    <span className="font-bold font-mono text-slate-400 line-through">{fmtFull(installmentValue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12.5px]">
                    <span className="font-black text-emerald-800">PARCELA BONIFICADA (SEM SEGURO):</span>
                    <span className="text-[18px] font-black font-mono text-emerald-600">{fmtFull(parcelaSemSeguro)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-emerald-300 flex justify-between items-center text-[11.5px]">
                <span className="text-slate-700 font-bold">Economia Total Acumulada Sem Seguro:</span>
                {economiaSeguroTotal > 0 ? (
                  <span className="text-[14px] font-black text-emerald-700">{fmtFull(economiaSeguroTotal)}</span>
                ) : (
                  <span className="text-[12.5px] font-black text-emerald-700">Bonificação Máxima Aplicada</span>
                )}
              </div>
            </div>
          </div>

          {/* DIVERSOS SEGMENTOS EM LARANJADO */}
          <div>
            <h2 className="text-[15px] font-black tracking-[0.2em] uppercase text-[#FF5500] mb-4 flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5500]" />
              2. POSSIBILIDADES ESTRATÉGICAS DE USO DO CRÉDITO
            </h2>

            <div className="grid grid-cols-2 gap-5">
              {segmentCards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-[#FF5500] rounded-[22px] p-5 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-lg shadow-orange-500/10 hover:shadow-xl transition-all"
                >
                  <div className="w-[100px] h-[100px] rounded-2xl overflow-hidden mb-3 relative border-2 border-[#FF5500] shadow-md">
                    <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-[15.5px] font-black text-[#FF5500] mb-1 uppercase tracking-wide flex items-center justify-center gap-1.5">
                    <span>{card.icon}</span> {card.title}
                  </h3>
                  <p className="text-[11.5px] font-bold text-slate-700 leading-relaxed text-center">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CARD DE PLANEJAMENTO ESTRATÉGICO 100% VIBRANTE, CLARO E DE ALTO CONTRASTE */}
          <div className="bg-gradient-to-r from-[#FF5500] via-[#FF6600] to-[#E0A96D] border-2 border-orange-400 rounded-[24px] p-6 shadow-2xl flex flex-col gap-3.5 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white drop-shadow-sm">
                PLANEJAMENTO ESTRATÉGICO DE ALTO DESEMPENHO
              </span>
              <div className="shrink-0 bg-white text-[#FF5500] font-black text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-xl shadow-md">
                GRUPO {grupoNum} · ALAVANCAGEM PATRIMONIAL
              </div>
            </div>

            <p className="text-[20px] font-black text-white leading-snug drop-shadow-sm">
              Conquiste bens de alto valor preservando a liquidez do seu caixa e acelerando a formação de patrimônio com inteligência e previsibilidade.
            </p>

            {/* REGRAS E ORDEM DE CONTEMPLAÇÃO DO GRUPO EM CAIXA BRANCA CRISTALINA */}
            <div className="bg-white/95 backdrop-blur-md rounded-xl p-4.5 border border-white shadow-xl flex flex-col gap-1.5">
              <span className="text-[12px] font-black text-[#FF5500] uppercase tracking-wider flex items-center gap-2">
                <span>🎯</span> REGRAS DE CONTEMPLAÇÃO DO GRUPO {grupoNum}:
              </span>
              <p className="text-[13px] font-bold text-slate-900 leading-relaxed">
                "{ordemContemplacaoText}"
              </p>
            </div>
          </div>

          {/* RODAPÉ SOLICITADO EXACTAMENTE PELO USUÁRIO */}
          <div className="border-t-2 border-slate-300 pt-6 pb-2 mt-2 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[19px] font-black text-slate-900 tracking-wide">
                FABRICIO HONÓRIO
              </span>
              <span className="text-[12.5px] font-black text-[#FF5500] tracking-wider uppercase">
                GESTOR DE NEGÓCIOS - ESPECIALISTA EM CONSÓRCIOS
              </span>
              <span className="text-[13.5px] font-black text-slate-900">
                CONSÓRCIO MAGALU
              </span>
            </div>

            <div className="flex flex-col items-end text-right">
              <span className="text-[13.5px] font-black text-slate-900">
                www.oespecialistaconsorcio.com.br
              </span>
              <span className="text-[11px] font-bold text-slate-600">
                Documento Executivo Gerado via Notebook LM Engine
              </span>
            </div>
          </div>

        </div>
      </div>
    );
  }
);

NotebookLMPresentation.displayName = "NotebookLMPresentation";
