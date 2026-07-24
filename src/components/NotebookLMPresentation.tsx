import React, { forwardRef } from "react";
import type { GrupoItem } from "@/constants/simulador";

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
        className="fixed top-0 left-[-9999px] w-[1200px] bg-[#0B132B] text-slate-100 font-sans select-none overflow-hidden"
        style={{ opacity: 1, pointerEvents: "none", zIndex: -9999 }}
      >
        {/* SLIDE DE APRESENTAÇÃO EXECUTIVA */}
        <div className="w-[1200px] min-h-[1600px] p-[50px] bg-gradient-to-b from-[#0B132B] via-[#1C2541] to-[#0B132B] flex flex-col justify-between relative">
          
          {/* TOPO: BARRA DE APRESENTAÇÃO */}
          <div className="flex items-center justify-between border-b border-white/15 pb-6 mb-8">
            <div className="flex items-center gap-6">
              <img
                src="/logo-consorcio-magalu.svg"
                alt="Consórcio Magalu"
                className="h-[54px] w-auto object-contain"
              />
              <div className="h-8 w-[1px] bg-white/20" />
              <div className="flex flex-col">
                <span className="text-[12px] font-black tracking-[0.25em] text-[#E0A96D] uppercase">
                  NOTEBOOK LM EXECUTIVE BRIEFING
                </span>
                <span className="text-[16px] font-bold text-white tracking-wide">
                  ESTUDO ESTRATÉGICO DE ALAVANCAGEM PATRIMONIAL
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                DATA: {dataHoje} · GRUPO {grupo.grupo || "5996"}
              </span>
              <span className="text-[12px] font-bold text-[#10B981] mt-0.5">
                STATUS: {grupo.tipoVenda || "DISPONÍVEL"}
              </span>
            </div>
          </div>

          {/* HERO BANNER DESTAQUE DO CLIENTE */}
          <div className="relative rounded-[24px] overflow-hidden mb-8 border border-white/20 shadow-2xl h-[260px] flex items-center p-10">
            <div
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(${bgHeaderImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B132B] via-[#0B132B]/90 to-transparent" />

            <div className="relative z-10 max-w-[800px]">
              <span className="inline-block bg-[#FF5500] text-white text-[11px] font-black uppercase tracking-[0.2em] px-3.5 py-1 rounded-full mb-2">
                {segmentoLabel}
              </span>
              
              <div className="text-[11px] font-black tracking-[0.2em] text-[#E0A96D] uppercase mb-1">
                APRESENTAÇÃO EXECUTIVA PREPARADA ESPECIALMENTE PARA
              </div>
              <h1 className="text-[36px] font-black uppercase tracking-tight text-white leading-tight mb-2 drop-shadow-md">
                {clienteStr}
              </h1>
              <p className="text-[13.5px] font-medium text-slate-200 leading-relaxed">
                Planejamento financeiro de alta performance para aquisição de bens patrimoniais sem incidência de juros bancários remuneratórios.
              </p>
            </div>
          </div>

          {/* RESULTADOS DA SIMULAÇÃO: 6 KPI CARDS */}
          <div className="mb-8">
            <h2 className="text-[13px] font-black tracking-[0.2em] uppercase text-[#E0A96D] mb-3.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E0A96D]" />
              1. RESULTADOS COMPLETO DA SIMULAÇÃO
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Card 1: Crédito */}
              <div className="bg-[#1C2541]/90 border border-white/15 rounded-[18px] p-5 text-center shadow-lg">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  CRÉDITO CONTRATADO
                </span>
                <span className="text-[26px] font-black text-white leading-none block">
                  {fmtFull(grupo.credito)}
                </span>
              </div>

              {/* Card 2: Modalidade & Parcela Inicial */}
              <div className="bg-[#1C2541]/90 border border-[#10B981]/40 rounded-[18px] p-5 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#10B981]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#10B981] block mb-1">
                  {planoLabel}
                </span>
                <span className="text-[26px] font-black text-[#10B981] leading-none block">
                  {fmtFull(installmentValue)}
                </span>
                <span className="text-[10px] font-medium text-slate-400 block mt-1">
                  (Parcela inicial pré-contemplação)
                </span>
              </div>

              {/* Card 3: Parcela Pós-Contemplação */}
              <div className="bg-[#1C2541]/90 border border-[#E0A96D]/40 rounded-[18px] p-5 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#E0A96D]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E0A96D] block mb-1">
                  PARCELA PÓS-CONTEMPLAÇÃO
                </span>
                <span className="text-[26px] font-black text-[#E0A96D] leading-none block">
                  {fmtFull(parcelaPos)}
                </span>
                <span className="text-[10px] font-medium text-slate-400 block mt-1">
                  (Após abate do lance ofertado)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Card 4: Prazo Total */}
              <div className="bg-[#1C2541]/90 border border-white/15 rounded-[18px] p-4 text-center shadow-lg">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  PRAZO DO PLANO
                </span>
                <span className="text-[22px] font-black text-white leading-none block">
                  {grupo.prazo} meses
                </span>
              </div>

              {/* Card 5: Crédito Disponível Líquido */}
              <div className="bg-[#1C2541]/90 border border-white/15 rounded-[18px] p-4 text-center shadow-lg">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  CRÉDITO DISPONÍVEL LÍQUIDO
                </span>
                <span className="text-[22px] font-black text-white leading-none block">
                  {fmtFull(creditoDisponivel)}
                </span>
              </div>

              {/* Card 6: Taxa Adm & Fundo Reserva */}
              <div className="bg-[#1C2541]/90 border border-white/15 rounded-[18px] p-4 text-center shadow-lg">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  TAXA ADM &amp; F. RESERVA
                </span>
                <span className="text-[22px] font-black text-white leading-none block">
                  {taxaAdmTotal}% / {fundoReservaTotal}%
                </span>
              </div>
            </div>
          </div>

          {/* SIMULAÇÃO DE CONTEMPLAÇÃO & BONIFICAÇÃO SEM SEGURO */}
          <div className="grid grid-cols-2 gap-5 mb-8">
            {/* Bloco 1: Estrutura de Contemplação & Lances */}
            <div className="bg-[#1C2541]/90 border border-white/15 rounded-[20px] p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-[13px] font-black tracking-wider uppercase text-[#E0A96D] mb-2 flex items-center gap-1.5">
                  <span>🎯</span> FORMAS DE CONTEMPLAÇÃO
                </h3>
                <p className="text-[11.5px] text-slate-300 mb-3 leading-relaxed">
                  Contemplações mensais por <strong>Sorteio (Loteria Federal)</strong> ou modalidade de <strong>Lances (Livre, Fixo 25% e Fixo 45%)</strong>.
                </p>

                <div className="bg-[#0B132B]/80 rounded-xl p-3.5 border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Lance Embutido (25%):</span>
                    <span className="font-bold font-mono text-white">{fmtFull(lEmbutidoRS)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Lance do Bolso (Recursos Próprios):</span>
                    <span className="font-bold font-mono text-white">{fmtFull(lDinheiroRS)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-1.5 flex justify-between items-center text-[12px]">
                    <span className="font-bold text-[#E0A96D]">TOTAL DO LANCE SIMULADO:</span>
                    <span className="font-black font-mono text-[#E0A96D]">{lanceTotalPct.toFixed(1)}% ({fmtFull(lanceTotalRS)})</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium">Parcela Pós-Contemplação:</span>
                <span className="text-[14px] font-black text-[#10B981]">{fmtFull(parcelaPos)}</span>
              </div>
            </div>

            {/* Bloco 2: Bonificação Exclusiva Sem Seguro */}
            <div className="bg-gradient-to-br from-[#10B981]/15 via-[#1C2541] to-[#1C2541] border border-[#10B981]/40 rounded-[20px] p-5 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#10B981] text-white font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                BONIFICAÇÃO EXCLUSIVA
              </div>

              <div>
                <h3 className="text-[13px] font-black tracking-wider uppercase text-[#10B981] mb-2 flex items-center gap-1.5">
                  <span>🎁</span> PLANO COM BONIFICAÇÃO SEM SEGURO
                </h3>
                <p className="text-[11.5px] text-slate-200 mb-3 leading-relaxed">
                  Ao optar pela contratação com isenção de seguro de vida individual, o seu plano recebe um desconto mensal automático.
                </p>

                <div className="bg-[#0B132B]/80 rounded-xl p-3.5 border border-[#10B981]/30 space-y-2">
                  <div className="flex justify-between items-center text-[11.5px]">
                    <span className="text-slate-300">Parcela com Seguro:</span>
                    <span className="font-bold font-mono text-slate-400 line-through">{fmtFull(installmentValue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="font-bold text-[#10B981]">PARCELA BONIFICADA (SEM SEGURO):</span>
                    <span className="text-[16px] font-black font-mono text-[#10B981]">{fmtFull(parcelaSemSeguro)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-[11px]">
                <span className="text-slate-300 font-medium">Economia Total Acumulada Sem Seguro:</span>
                {economiaSeguroTotal > 0 ? (
                  <span className="text-[13px] font-black text-[#10B981]">{fmtFull(economiaSeguroTotal)}</span>
                ) : (
                  <span className="text-[12px] font-black text-[#10B981]">Bonificação Máxima Aplicada</span>
                )}
              </div>
            </div>
          </div>

          {/* DIVERSOS SEGMENTOS EM LARANJADO, CENTRALIZADO E COM SOMBREAMENTO 3D */}
          <div className="mb-8">
            <h2 className="text-[14px] font-black tracking-[0.2em] uppercase text-[#FF7A00] mb-4 flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF7A00] shadow-[0_0_10px_#FF7A00]" />
              2. POSSIBILIDADES ESTRATÉGICAS DE USO DO CRÉDITO
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {segmentCards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-b from-[#1C2541] via-[#16203D] to-[#0B132B] border-2 border-[#FF7A00]/50 rounded-[24px] p-6 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-[0_12px_32px_-6px_rgba(255,122,0,0.35)]"
                >
                  <div className="w-[110px] h-[110px] rounded-2xl overflow-hidden mb-3.5 relative border-2 border-[#FF7A00]/60 shadow-lg">
                    <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <h3 className="text-[15.5px] font-black text-[#FF7A00] mb-1.5 uppercase tracking-wide flex items-center justify-center gap-1.5">
                    <span>{card.icon}</span> {card.title}
                  </h3>
                  <p className="text-[11.5px] font-medium text-slate-200 leading-relaxed text-center">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* BANNER PERSUASIVO DE ALAVANCAGEM E ESTRATÉGIA PATRIMONIAL */}
          <div className="bg-gradient-to-r from-[#FF5500]/20 via-[#1C2541] to-[#E0A96D]/20 border border-[#E0A96D]/40 rounded-[22px] p-6 mb-8 flex items-center justify-between shadow-2xl">
            <div className="flex flex-col max-w-[820px]">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E0A96D] mb-1">
                PLANEJAMENTO ESTRATÉGICO DE ALTO DESEMPENHO
              </span>
              <span className="text-[20px] font-extrabold text-white leading-snug">
                Conquiste bens de alto valor preservando a liquidez do seu caixa e acelerando a formação de patrimônio com inteligência e previsibilidade.
              </span>
              <span className="text-[11.5px] font-medium text-slate-300 mt-1">
                Consórcio Magalu: A ferramenta financeira definitiva para alavancagem patrimonial sustentável e expansão de frotas.
              </span>
            </div>
            <div className="shrink-0 bg-[#E0A96D] text-[#0B132B] font-black text-[13px] uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg">
              ALAVANCAGEM PATRIMONIAL
            </div>
          </div>

          {/* RODAPÉ SOLICITADO EXACTAMENTE PELO USUÁRIO */}
          <div className="border-t border-white/15 pt-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[17px] font-black text-white tracking-wide">
                FABRICIO HONÓRIO
              </span>
              <span className="text-[12px] font-bold text-[#E0A96D] tracking-wider uppercase">
                GESTOR DE NEGÓCIOS - ESPECIALISTA EM CONSÓRCIOS
              </span>
              <span className="text-[13px] font-extrabold text-white">
                CONSÓRCIO MAGALU
              </span>
            </div>

            <div className="flex flex-col items-end text-right">
              <span className="text-[13px] font-bold text-slate-200">
                www.oespecialistaconsorcio.com.br
              </span>
              <span className="text-[11px] font-medium text-slate-400">
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
