import React, { forwardRef } from 'react';
import type { GrupoItem } from '@/constants/simulador';
import { isBlackFridayActive } from '@/utils/blackFridayTheme';

interface BannerGeneratorProps {
  grupo: GrupoItem;
  categoria: string;
  subCategoria?: string;
  paymentMode: 'linear' | 'reduzido';
  installmentValue: number;
  theme?: 'black-friday' | 'dia-dos-pais' | 'padrao';
  fathersDayVariation?: 1 | 2 | 3 | 4;
}

const fmtNumberOnly = (v: number) => {
  if (v >= 1000) {
    const k = v / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}MIL`;
  }
  return v.toString();
};

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const BannerGenerator = forwardRef<HTMLDivElement, BannerGeneratorProps>(
  ({ grupo, categoria, subCategoria, paymentMode, installmentValue, theme, fathersDayVariation = 1 }, ref) => {
    if (!grupo) return null;

    const activeTheme = theme || (isBlackFridayActive() ? 'black-friday' : 'dia-dos-pais');

    // Seleção da Imagem de Fundo e Textos por Tema
    let bgImage = '/dia-dos-pais-1.png';
    let headlineText = 'O melhor presente para um pai é ver a família realizada na casa própria.';
    let isBlackFriday = activeTheme === 'black-friday';

    if (isBlackFriday) {
      bgImage = '/black-das-blacks.jpg';
      headlineText = 'BLACK DAS BLACKS CONSÓRCIO MAGALU: AS MENORES PARCELAS DO ANO';
    } else {
      if (categoria === 'imovel') {
        const imovelImages = ['/dia-dos-pais-1.png', '/dia-dos-pais-2.png', '/dia-dos-pais-3.png', '/dia-dos-pais-4.png'];
        bgImage = imovelImages[(fathersDayVariation - 1) % imovelImages.length];
        if (fathersDayVariation === 2) {
          headlineText = 'Não há presente maior para um pai do que construir um lar para sua família.';
        } else if (fathersDayVariation === 3) {
          headlineText = 'Nada faz um pai mais feliz do que entregar um lar para a família.';
        } else if (fathersDayVariation === 4) {
          headlineText = 'Todo pai sonha em deixar um futuro melhor para os filhos.';
        }
      } else if (categoria === 'veiculo') {
        bgImage = (subCategoria === 'moto') ? '/dia-dos-pais-moto-1.png' : '/dia-dos-pais-veiculo-1.png';
        headlineText = 'Não há presente maior para um pai do que conquistar a liberdade em família.';
      } else if (categoria === 'pesados') {
        bgImage = (fathersDayVariation === 2) ? '/dia-dos-pais-pesados-2.png' : '/dia-dos-pais-pesados-1.png';
        headlineText = 'Todo pai sonha em construir um futuro forte e um legado próspero para os filhos.';
      } else if (categoria === 'servicos') {
        bgImage = '/dia-dos-pais-servicos-1.png';
        headlineText = 'O melhor presente para um pai é vivenciar momentos inesquecíveis em família.';
      }
    }

    const isLinear = paymentMode === 'linear';
    const badgeText = isBlackFriday
      ? (isLinear ? '🔥 BLACK FRIDAY · PARCELA LINEAR' : '🔥 BLACK FRIDAY · PARCELA 50/50 REDUZIDA')
      : (isLinear ? 'PARCELA FIXA ATÉ A CONTEMPLAÇÃO' : 'PARCELA REDUZIDA ATÉ A CONTEMPLAÇÃO');

    return (
      <div
        id="banner-generator-container"
        ref={ref}
        className="fixed top-0 left-[-9999px] w-[1080px] h-[1920px] bg-white flex flex-col justify-between overflow-hidden font-sans text-slate-900 select-none"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1,
          pointerEvents: 'none',
          zIndex: -9999,
          transform: 'scale(1)',
        }}
      >
        {/* Layer 1: Soft top gradient for headline text & dark bottom gradient for white footer text */}
        <div className={`absolute inset-0 pointer-events-none ${
          isBlackFriday 
            ? 'bg-gradient-to-b from-[#020617]/90 via-transparent via-50% to-[#020617]/95' 
            : 'bg-gradient-to-b from-white/90 via-transparent via-60% to-black/75'
        }`} />

        {/* TOP HEADER SECTION */}
        <div className="relative z-10 pt-[70px] px-[80px] flex flex-col items-center text-center">
          {/* Logo Consórcio Magalu */}
          <div className="flex flex-col items-center mb-[30px]">
            <img 
              src={isBlackFriday ? "/logo-consorcio-magalu-white.png" : "/logo-consorcio-magalu-black.png"} 
              alt="Consórcio Magalu" 
              className="h-[135px] w-auto object-contain drop-shadow-md"
            />
          </div>

          {/* Headline */}
          <h1 className={`text-[46px] font-black tracking-tight leading-[1.2] max-w-[940px] mb-[28px] drop-shadow-md ${
            isBlackFriday ? 'text-white uppercase' : 'font-serif font-medium text-[#0F2F57]'
          }`}>
            {isBlackFriday ? (
              <>
                BLACK DAS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-cyan-300">BLACKS</span>: AS MENORES PARCELAS DO ANO
              </>
            ) : (
              headlineText
            )}
          </h1>

          {/* Pill Badge */}
          <div className={`inline-flex items-center gap-[12px] px-[32px] py-[14px] rounded-full shadow-lg ${
            isBlackFriday 
              ? 'bg-cyan-950/80 border-2 border-cyan-400/80 text-cyan-200' 
              : 'bg-[#EBF4FC] border border-[#BDE0FE] text-[#0F2F57]'
          }`}>
            <span className="text-[26px]">{isBlackFriday ? '⚡' : '🏠'}</span>
            <span className="text-[22px] font-black tracking-wider uppercase">
              {badgeText}
            </span>
          </div>
        </div>

        {/* BOTTOM SECTION: FLOATING CARD & CALL TO ACTION FOOTER */}
        <div className="relative z-10 pb-[65px] px-[70px] flex flex-col items-center text-center w-full">
          
          {/* FLOATING CARD DE SIMULAÇÃO */}
          <div className={`w-full max-w-[940px] backdrop-blur-md rounded-[36px] p-[45px] flex flex-col items-center mb-[35px] ${
            isBlackFriday 
              ? 'bg-[#030712]/90 border-2 border-cyan-400 shadow-[0_0_60px_rgba(0,229,255,0.4)] text-white' 
              : 'bg-white/75 border-2 border-white/80 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#0F2F57]'
          }`}>
            
            {/* 2-Column Table (Crédito | Parcela) */}
            <div className={`w-full grid grid-cols-2 divide-x-2 mb-[25px] ${
              isBlackFriday ? 'divide-cyan-500/40' : 'divide-[#0F2F57]/20'
            }`}>
              {/* Crédito */}
              <div className="flex flex-col items-center pr-[20px]">
                <span className={`text-[28px] font-bold mb-[6px] uppercase ${isBlackFriday ? 'text-slate-300' : 'text-[#0F2F57]'}`}>
                  Crédito
                </span>
                <div className={`text-[86px] font-black leading-none tracking-tight font-mono ${
                  isBlackFriday ? 'text-cyan-300' : 'text-[#0F2F57]'
                }`}>
                  {fmtNumberOnly(grupo.credito)}
                </div>
              </div>

              {/* Parcela */}
              <div className="flex flex-col items-center pl-[20px]">
                <span className={`text-[28px] font-bold mb-[6px] uppercase ${isBlackFriday ? 'text-pink-300' : 'text-[#0F2F57]'}`}>
                  Parcela
                </span>
                <div className={`text-[86px] font-black leading-none tracking-tight font-mono ${
                  isBlackFriday ? 'text-white drop-shadow-[0_0_20px_rgba(0,229,255,0.6)]' : 'text-[#0F2F57]'
                }`}>
                  {fmtCurrency(installmentValue)}
                </div>
              </div>
            </div>

            {/* Separator Line */}
            <div className={`w-full h-[2px] mb-[20px] ${
              isBlackFriday ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent' : 'bg-[#0F2F57]/20'
            }`} />

            {/* Prazo */}
            <div className={`text-[26px] font-black tracking-[0.25em] uppercase ${
              isBlackFriday ? 'text-cyan-300' : 'text-[#0F2F57]'
            }`}>
              PRAZO {grupo.prazo} MESES · ASSEMBLEIA 25/11/2026
            </div>
          </div>

          {/* FOOTER CALL TO ACTION & WEBSITE */}
          <div className="flex flex-col items-center gap-[10px] w-full max-w-[940px]">
            <p className="text-[34px] font-extrabold tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] uppercase">
              Fale com o especialista · Condição Válida até 30/11
            </p>
            <p className="text-[26px] font-black tracking-widest text-cyan-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] uppercase">
              www.oespecialistaconsorcio.com.br
            </p>
          </div>

        </div>
      </div>
    );
  }
);

BannerGenerator.displayName = 'BannerGenerator';
