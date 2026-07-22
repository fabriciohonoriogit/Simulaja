import React, { forwardRef } from 'react';
import type { GrupoItem } from '@/constants/simulador';

interface BannerGeneratorProps {
  grupo: GrupoItem;
  categoria: string;
  subCategoria?: string;
  paymentMode: 'linear' | 'reduzido';
  installmentValue: number;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const BannerGenerator = forwardRef<HTMLDivElement, BannerGeneratorProps>(
  ({ grupo, categoria, subCategoria, paymentMode, installmentValue }, ref) => {
    if (!grupo) return null;

    // Background Image Selection based on category
    let bgImage = '/segment-imovel.webp';
    let headlineVerb = 'INVESTIR';
    let headlineComplement = 'NOS SEUS SONHOS';
    let modalidadeStr = 'CONSTRUÇÃO / REFORMA';
    let categoryTags = 'IMÓVEIS  •  CONSTRUÇÃO  •  REFORMA  •  INVESTIMENTO';

    if (categoria === 'imovel') {
      bgImage = '/segment-imovel.webp';
      headlineVerb = 'INVESTIR';
      headlineComplement = 'NOS SEUS SONHOS';
      modalidadeStr = grupo.tipoVenda || 'AQUISIÇÃO / REFORMA';
      categoryTags = 'IMÓVEIS  •  CONSTRUÇÃO  •  REFORMA  •  INVESTIMENTO';
    } else if (categoria === 'veiculo') {
      bgImage = subCategoria === 'moto' ? '/segment-moto.webp' : (subCategoria === 'jet ski' || subCategoria === 'náutico') ? '/segment-nautico.webp' : '/segment-veiculo.webp';
      headlineVerb = 'CONQUISTAR';
      headlineComplement = 'SEU NOVO VEÍCULO';
      modalidadeStr = subCategoria === 'moto' ? 'MOTOCICLETAS' : 'AUTOMÓVEIS / LEVES';
      categoryTags = 'CARROS  •  MOTOS  •  UTILITÁRIOS  •  LIBERDADE';
    } else if (categoria === 'pesados') {
      bgImage = '/segment-agro.webp';
      headlineVerb = 'ACELERAR';
      headlineComplement = 'SEUS NEGÓCIOS';
      modalidadeStr = 'CAMINHÕES / MÁQUINAS';
      categoryTags = 'CAMINHÕES  •  TRATORES  •  MÁQUINAS  •  AGRO';
    } else if (categoria === 'servicos') {
      bgImage = '/segment-investimento.webp';
      headlineVerb = 'PLANEJAR';
      headlineComplement = 'SEU FUTURO';
      modalidadeStr = 'SERVIÇOS / VIAGENS';
      categoryTags = 'VIAGENS  •  ESTUDOS  •  FESTAS  •  REFORMAS';
    }

    const isLinear = paymentMode === 'linear';
    const parcelaLabel = isLinear ? 'Parcela linear' : 'Parcelas a partir de';
    const subNotaText = isLinear 
      ? 'Plano promocional com parcela fixa linear*' 
      : 'Parcela reduzida até contemplação*';

    // Estimativa de economia para destacar na tarja laranja
    const economiaEstimada = Math.round(grupo.credito * 0.05);

    return (
      <div
        id="banner-generator-container"
        ref={ref}
        className="fixed top-0 left-[-9999px] w-[1080px] h-[1920px] bg-cover bg-center flex flex-col justify-between overflow-hidden font-sans text-white select-none"
        style={{
          backgroundImage: `url(${bgImage})`,
          opacity: 1,
          pointerEvents: 'none',
          zIndex: -9999,
          transform: 'scale(1)',
        }}
      >
        {/* Layer 1: Dark gradients top and bottom to contrast header text and background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/90 pointer-events-none" />

        {/* TOP HEADER SECTION */}
        <div className="relative z-10 pt-[70px] px-[80px] flex flex-col items-center text-center">
          {/* Official Brand Header Logo */}
          <div className="flex flex-col items-center mb-[25px]">
            <img 
              src="/logo-consorcio-magalu.svg" 
              alt="Consórcio Magalu" 
              className="h-[125px] w-auto object-contain drop-shadow-lg"
            />
          </div>

          {/* Headline */}
          <h1 className="text-[44px] font-extrabold tracking-wider uppercase leading-tight text-white drop-shadow-md">
            TODO DIA É DIA DE<br />
            <span className="text-[#FF5500] font-black">{headlineVerb}</span>{' '}
            <span>{headlineComplement}</span>
          </h1>
        </div>

        {/* MIDDLE SECTION: MAIN FLOATING DARK GLASS CARD */}
        <div className="relative z-10 px-[80px] my-auto flex justify-center">
          <div className="w-full max-w-[940px] bg-[#101216]/85 backdrop-blur-xl border border-white/20 rounded-[40px] p-[55px] px-[65px] shadow-[0_30px_90px_rgba(0,0,0,0.8)] flex flex-col items-center text-center relative overflow-hidden">
            {/* Subtle Top Glow line on the card */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF5500]/60 to-transparent" />

            {/* CRÉDITO SECTION */}
            <span className="text-[26px] font-bold tracking-[0.3em] text-white/80 uppercase mb-[6px]">
              CRÉDITO
            </span>
            <div className="text-[92px] font-black leading-none tracking-tight text-[#FF5500] drop-shadow-[0_4px_20px_rgba(255,85,0,0.3)] mb-[24px]">
              {fmt(grupo.credito)}
            </div>

            {/* THIN SEPARATOR LINE */}
            <div className="w-full h-[1px] bg-white/15 mb-[24px]" />

            {/* PARCELA SECTION */}
            <span className="text-[30px] font-semibold text-white/90 mb-[8px]">
              {parcelaLabel}
            </span>
            <div className="text-[126px] font-black leading-none tracking-tighter text-white drop-shadow-lg mb-[32px]">
              {fmt(installmentValue)}
            </div>

            {/* TWO COLUMN FEATURE BAR (Bounded by 2 horizontal lines) */}
            <div className="w-full border-y border-white/15 py-[24px] my-[6px] flex items-center justify-around">
              {/* Column 1: Prazo */}
              <div className="flex items-center gap-[18px]">
                <div className="w-[58px] h-[58px] rounded-xl border-2 border-[#FF5500] flex items-center justify-center text-[#FF5500]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-[32px] h-[32px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[18px] font-bold tracking-wider text-white/70 uppercase">
                    PRAZO DE ATÉ
                  </span>
                  <span className="text-[28px] font-black text-white leading-tight">
                    {grupo.prazo} MESES
                  </span>
                </div>
              </div>

              {/* Middle Separator */}
              <div className="w-[1px] h-[55px] bg-white/20" />

              {/* Column 2: Modalidade */}
              <div className="flex items-center gap-[18px]">
                <div className="w-[58px] h-[58px] rounded-xl border-2 border-[#FF5500] flex items-center justify-center text-[#FF5500]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-[32px] h-[32px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[18px] font-bold tracking-wider text-white/70 uppercase">
                    MODALIDADE
                  </span>
                  <span className="text-[26px] font-black text-white leading-tight">
                    {modalidadeStr}
                  </span>
                </div>
              </div>
            </div>

            {/* SUB NOTE */}
            <p className="text-[23px] font-medium text-white/90 mt-[26px] mb-[24px]">
              {subNotaText}
            </p>

            {/* ORANGE PILL BADGE */}
            <div className="w-full bg-[#FF5500] rounded-full py-[18px] px-[20px] flex items-center justify-center text-center shadow-[0_10px_30px_rgba(255,85,0,0.4)]">
              <span className="text-[21px] font-black uppercase tracking-wide text-white">
                SEM ENTRADA &nbsp;•&nbsp; SEM JUROS &nbsp;•&nbsp; ECONOMIA DE ATÉ R$ {economiaEstimada.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="relative z-10 pb-[65px] px-[80px] flex flex-col items-center text-center gap-[18px]">
          {/* Category Bullet Tags */}
          <div className="text-[21px] font-extrabold tracking-[0.2em] text-white/95 uppercase drop-shadow">
            {categoryTags}
          </div>

          {/* Magalu Brand Footer Logo */}
          <div className="flex items-center justify-center">
            <img 
              src="/logo-consorcio-magalu.svg" 
              alt="Consórcio Magalu" 
              className="h-[55px] w-auto object-contain drop-shadow"
            />
          </div>

          {/* Website URL */}
          <div className="text-[24px] font-semibold text-white/80 tracking-wider font-mono">
            www.oespecialistaconsorcio.com.br
          </div>
        </div>
      </div>
    );
  }
);

BannerGenerator.displayName = 'BannerGenerator';
