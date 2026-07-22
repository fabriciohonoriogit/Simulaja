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
  incluirSeguro?: boolean;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtFull = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const NotebookLMPresentation = forwardRef<HTMLDivElement, NotebookLMPresentationProps>(
  ({ grupo, categoria, paymentMode, installmentValue, simNome, simWpp, consultorNome }, ref) => {
    if (!grupo) return null;

    const isLinear = paymentMode === "linear";
    const clienteStr = simNome?.trim() ? simNome.trim() : "Cliente Especial";
    const consultorStr = consultorNome?.trim() ? consultorNome.trim() : "Fabricio Honório - Especialista Magalu";
    const dataHoje = new Date().toLocaleDateString("pt-BR");

    // Cálculo exato de seguro e parcela sem seguro
    const valorSeguro = grupo.seguro ? (grupo.credito * grupo.seguro) : 0;
    const parcelaSemSeguro = Math.max(0, installmentValue - valorSeguro);

    // Background Image & Accent Colors based on category
    let bgHeaderImage = "/segment-agro.webp";
    let segmentoLabel = "PESADOS, AGRO & FROTAS";

    if (categoria === "imovel") {
      bgHeaderImage = "/segment-imovel.webp";
      segmentoLabel = "IMOBILIÁRIO & PATRIMONIAL";
    } else if (categoria === "veiculo") {
      bgHeaderImage = "/segment-veiculo.webp";
      segmentoLabel = "VEÍCULOS, ELÉTRICOS & HÍBRIDOS";
    } else if (categoria === "pesados") {
      bgHeaderImage = "/segment-agro.webp";
      segmentoLabel = "PESADOS, MÁQUINAS AGRÍCOLAS & CAMINHÕES";
    } else if (categoria === "servicos") {
      bgHeaderImage = "/segment-investimento.webp";
      segmentoLabel = "SERVIÇOS & INVESTIMENTO ESTRATÉGICO";
    }

    const taxaAdmTotal = (grupo.txLinear ?? grupo.tx5050 ?? 15);
    const fundoReservaTotal = (grupo.frLinear ?? grupo.fr5050 ?? 1);
    const custoTotalConsorcio = grupo.credito * (1 + (taxaAdmTotal + fundoReservaTotal) / 100);
    const custoTotalFinanciamento = grupo.credito * 2.10;
    const economiaEstimada = Math.max(0, custoTotalFinanciamento - custoTotalConsorcio);

    return (
      <div
        id="notebook-lm-presentation-container"
        ref={ref}
        className="fixed top-0 left-[-9999px] w-[1200px] bg-[#0B132B] text-slate-100 font-sans select-none overflow-hidden"
        style={{ opacity: 1, pointerEvents: "none", zIndex: -9999 }}
      >
        {/* SLIDE / PAGE 1: EXECUTIVE BRIEFING */}
        <div className="w-[1200px] min-h-[1600px] p-[50px] bg-gradient-to-b from-[#0B132B] via-[#1C2541] to-[#0B132B] flex flex-col justify-between relative">
          
          {/* HEADER STRIP */}
          <div className="flex items-center justify-between border-b border-white/15 pb-6 mb-8">
            <div className="flex items-center gap-6">
              <img
                src="/logo-consorcio-magalu.svg"
                alt="Consórcio Magalu"
                className="h-[52px] w-auto object-contain"
              />
              <div className="h-8 w-[1px] bg-white/20" />
              <div className="flex flex-col">
                <span className="text-[12px] font-black tracking-[0.25em] text-[#E0A96D] uppercase">
                  NOTEBOOK LM EXECUTIVE
                </span>
                <span className="text-[16px] font-bold text-white tracking-wide">
                  ESTUDO ESTRATÉGICO PATRIMONIAL &amp; FROTAS
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end text-right">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-4 py-1.5 text-[13px] font-bold text-white mb-1">
                Apresentação para: <span className="text-[#E0A96D]">{clienteStr}</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Data: {dataHoje} · Grupo {grupo.grupo || "5996"}</span>
            </div>
          </div>

          {/* HERO BANNER CARD WITH BACKGROUND IMAGE */}
          <div className="relative rounded-[24px] overflow-hidden mb-10 border border-white/20 shadow-2xl h-[280px] flex items-center p-12">
            <div
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(${bgHeaderImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B132B] via-[#0B132B]/85 to-transparent" />

            <div className="relative z-10 max-w-[750px]">
              <span className="inline-block bg-[#FF5500] text-white text-[11px] font-black uppercase tracking-[0.2em] px-3.5 py-1 rounded-full mb-3">
                {segmentoLabel}
              </span>
              <h1 className="text-[34px] font-black uppercase tracking-tight leading-tight text-white mb-3">
                PLANEJAMENTO ESTRATÉGICO MULTISEGMENTO &amp; FROTAS
              </h1>
              <p className="text-[14.5px] font-medium text-slate-200 leading-relaxed">
                Estudo executivo de viabilidade para aquisição de Caminhões, Máquinas Agrícolas, Veículos Híbridos/Elétricos, Imóveis e Alavancagem com custo financeiro otimizado.
              </p>
            </div>
          </div>

          {/* FINANCIAL SUMMARY: 4 EXECUTIVE KPI CARDS */}
          <div className="mb-10">
            <h2 className="text-[14px] font-black tracking-[0.2em] uppercase text-[#E0A96D] mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E0A96D]" />
              1. RESUMO EXECUTIVO DA PROPOSTA DE CRÉDITO
            </h2>

            <div className="grid grid-cols-4 gap-5">
              {/* Card 1 */}
              <div className="bg-[#1C2541]/90 backdrop-blur-md border border-white/15 rounded-[20px] p-6 text-center shadow-lg">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                  CRÉDITO CONTRATADO
                </span>
                <span className="text-[28px] font-black text-white leading-none block">
                  {fmtFull(grupo.credito)}
                </span>
              </div>

              {/* Card 2 */}
              <div className="bg-[#1C2541]/90 backdrop-blur-md border border-[#10B981]/40 rounded-[20px] p-5 text-center shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#10B981]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  {isLinear ? "PARCELA LINEAR" : "PARCELA REDUZIDA 50%"}
                </span>
                <span className="text-[26px] font-black text-[#10B981] leading-none block mb-1">
                  {fmtFull(installmentValue)}
                </span>
                <div className="bg-[#10B981]/15 border border-[#10B981]/30 rounded-lg py-1 px-2 text-[11px] font-bold text-[#10B981]">
                  Sem seguro: <span className="text-white font-extrabold">{fmtFull(parcelaSemSeguro)}</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#1C2541]/90 backdrop-blur-md border border-white/15 rounded-[20px] p-6 text-center shadow-lg">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                  PRAZO DO PLANO
                </span>
                <span className="text-[28px] font-black text-white leading-none block">
                  {grupo.prazo} meses
                </span>
              </div>

              {/* Card 4 */}
              <div className="bg-[#1C2541]/90 backdrop-blur-md border border-[#E0A96D]/40 rounded-[20px] p-6 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#E0A96D]" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                  TAXA ADM TOTAL
                </span>
                <span className="text-[28px] font-black text-[#E0A96D] leading-none block">
                  {taxaAdmTotal}%
                </span>
              </div>
            </div>
          </div>

          {/* ALL SEGMENTS STRATEGIC USE CASES (4 FULL CARDS) */}
          <div className="mb-10">
            <h2 className="text-[14px] font-black tracking-[0.2em] uppercase text-[#E0A96D] mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E0A96D]" />
              2. APLICAÇÃO ESTRATÉGICA NOS DIVERSOS SEGMENTOS
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Segment 1: Caminhões & Pesados */}
              <div className="bg-[#1C2541]/80 border border-white/15 rounded-[20px] p-6 flex gap-5 relative overflow-hidden shadow-xl">
                <div className="w-[110px] h-[110px] rounded-xl overflow-hidden shrink-0 relative border border-white/20">
                  <img src="/segment-agro.webp" alt="Caminhões" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-blue-900/40" />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-[15.5px] font-extrabold text-white mb-1.5 flex items-center gap-2">
                    <span>🚛</span> Caminhões Extrapesados &amp; Frotas
                  </h3>
                  <p className="text-[12px] font-normal text-slate-300 leading-relaxed">
                    Aquisição e renovação de frotas de caminhões, cavalos mecânicos, carretas e utilitários pesados de transporte com parcelas pré-fixadas e sem juros bancários.
                  </p>
                </div>
              </div>

              {/* Segment 2: Máquinas Agrícolas */}
              <div className="bg-[#1C2541]/80 border border-white/15 rounded-[20px] p-6 flex gap-5 relative overflow-hidden shadow-xl">
                <div className="w-[110px] h-[110px] rounded-xl overflow-hidden shrink-0 relative border border-white/20">
                  <img src="/segment-agro.webp" alt="Máquinas Agrícolas" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-emerald-900/40" />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-[15.5px] font-extrabold text-white mb-1.5 flex items-center gap-2">
                    <span>🚜</span> Máquinas Agrícolas &amp; Agrobusiness
                  </h3>
                  <p className="text-[12px] font-normal text-slate-300 leading-relaxed">
                    Recursos para tratores, colheitadeiras, pulverizadores e implementos agrícolas modernos, impulsionando a produtividade do campo sem comprometer o fluxo de caixa.
                  </p>
                </div>
              </div>

              {/* Segment 3: Veículos Elétricos & Híbridos */}
              <div className="bg-[#1C2541]/80 border border-white/15 rounded-[20px] p-6 flex gap-5 relative overflow-hidden shadow-xl">
                <div className="w-[110px] h-[110px] rounded-xl overflow-hidden shrink-0 relative border border-white/20">
                  <img src="/segment-veiculo.webp" alt="Elétricos e Híbridos" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-cyan-900/40" />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-[15.5px] font-extrabold text-white mb-1.5 flex items-center gap-2">
                    <span>⚡</span> Veículos Elétricos, Híbridos &amp; Automóveis
                  </h3>
                  <p className="text-[12px] font-normal text-slate-300 leading-relaxed">
                    Tecnologia e sustentabilidade: compra de automóveis 100% elétricos, híbridos plug-in e veículos leves com custo de aquisição significativamente menor.
                  </p>
                </div>
              </div>

              {/* Segment 4: Imóveis & Alavancagem */}
              <div className="bg-[#1C2541]/80 border border-white/15 rounded-[20px] p-6 flex gap-5 relative overflow-hidden shadow-xl">
                <div className="w-[110px] h-[110px] rounded-xl overflow-hidden shrink-0 relative border border-white/20">
                  <img src="/segment-imovel.webp" alt="Imóveis & Alavancagem" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-amber-900/40" />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-[15.5px] font-extrabold text-white mb-1.5 flex items-center gap-2">
                    <span>🏢</span> Imóveis, Galpões &amp; Alavancagem
                  </h3>
                  <p className="text-[12px] font-normal text-slate-300 leading-relaxed">
                    Estruturação patrimonial: aquisição de galpões comerciais, terrenos, imóveis residenciais ou industriais, além de quitação de financiamentos de juros altos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FINANCIAL COMPARISON BANNER */}
          <div className="bg-gradient-to-r from-[#10B981]/20 via-[#1C2541] to-[#E0A96D]/20 border border-[#10B981]/40 rounded-[24px] p-7 mb-10 flex items-center justify-between shadow-2xl">
            <div className="flex flex-col">
              <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#10B981] mb-1">
                ESTUDO COMPARATIVO DE ECONOMIA REAL
              </span>
              <span className="text-[22px] font-extrabold text-white">
                Economia estimada de <span className="text-[#10B981] font-black">{fmtFull(economiaEstimada)}</span> em relação ao financiamento tradicional.
              </span>
              <span className="text-[12px] font-normal text-slate-300 mt-1">
                Custo total do consórcio: <strong>{fmtFull(custoTotalConsorcio)}</strong> versus <strong>{fmtFull(custoTotalFinanciamento)}</strong> no financiamento bancário.
              </span>
            </div>
            <div className="shrink-0 bg-[#10B981] text-white font-black text-[14px] uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg">
              SEM JUROS COMPOSTOS
            </div>
          </div>

          {/* FOOTER & CONSULTANT SIGNATURE BLOCK */}
          <div className="border-t border-white/15 pt-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                ESTUDO ELABORADO POR
              </span>
              <span className="text-[16px] font-black text-white">
                {consultorStr}
              </span>
              <span className="text-[12px] font-medium text-[#E0A96D]">
                Consórcio Magalu · Especialista em Estratégias Patrimoniais &amp; Frotas
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
