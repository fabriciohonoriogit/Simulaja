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
    const isBlackFriday = activeTheme === 'black-friday';

    // Seleção da Imagem de Fundo e Textos por Tema
    let bgImage = '/dia-dos-pais-1.png';
    let headlineText = 'O melhor presente para um pai é ver a família realizada na casa própria.';
    let discountBadge = '20% DE DESCONTO NA TAXA ADMINISTRATIVA';
    let economyPill = '';

    if (isBlackFriday) {
      if (categoria === 'imovel') {
        bgImage = '/images/magalu/bf/bf-imovel.jpg';
        headlineText = 'BLACK DAS BLACKS: O SEU IMÓVEL COM AS MENORES PARCELAS DO ANO';
        discountBadge = '20% DE DESCONTO NA TAXA ADMINISTRATIVA';
        economyPill = 'PARCELA REDUZIDA ATÉ A CONTEMPLAÇÃO';
      } else if (categoria === 'veiculo' || categoria === 'pesados') {
        const val = grupo.credito;
        if (val >= 180000) {
          // Valores acima de 180 mil -> Caminhonete / Picape
          bgImage = '/images/magalu/bf/bf-caminhonete.jpg';
          headlineText = 'BLACK DAS BLACKS: SUA CAMINHONETE NOVA COM AS MENORES PARCELAS';
          discountBadge = '25% DE DESCONTO NA TAXA ADMINISTRATIVA';
          economyPill = 'ECONOMIA: ATÉ R$ 12.000';
        } else if (val >= 70000 && val <= 179999) {
          // De 70 a 179 mil -> Carro / SUV
          bgImage = '/images/magalu/bf/bf-carro.jpg';
          headlineText = 'BLACK DAS BLACKS: CONQUISTE SEU CARRO NOVO COM DESCONTO EXCLUSIVO';
          discountBadge = '25% DE DESCONTO NA TAXA ADMINISTRATIVA';
          economyPill = 'ECONOMIA: ATÉ R$ 7.000';
        } else {
          // De 18 a 39 mil (e até 69 mil ou moto) -> Moto
          bgImage = '/images/magalu/bf/bf-moto.jpg';
          headlineText = 'BLACK DAS BLACKS: SUA MOTO NOVA COM PARCELAS EM ATÉ 100 MESES';
          discountBadge = '30% DE DESCONTO NA TAXA DE ADMINISTRAÇÃO';
          economyPill = 'ECONOMIA: ATÉ R$ 4.800';
        }
      } else {
        bgImage = '/images/magalu/bf/bf-master.jpg';
        headlineText = 'BLACK DAS BLACKS CONSÓRCIO MAGALU: AS MENORES PARCELAS DO ANO';
        discountBadge = 'TAXAS COM DESCONTO ESPECIAL DE BLACK FRIDAY';
        economyPill = 'ECONOMIA HISTÓRICA';
      }
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
    const subBadgeText = isLinear ? 'PLANO LINEAR · PARCELAS INTEGRAIS' : 'PARCELA REDUZIDA (50%) ATÉ A CONTEMPLAÇÃO';

    return (
      <div
        id="banner-generator-container"
        ref={ref}
        className="fixed top-0 left-[-9999px] w-[1080px] h-[1920px] bg-black flex flex-col justify-between overflow-hidden font-sans text-slate-900 select-none"
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
        {/* Layer 1: Degradê suave no topo e fundo escuro profissional */}
        <div className={`absolute inset-0 pointer-events-none ${isBlackFriday
            ? 'bg-gradient-to-b from-[#020617]/85 via-transparent via-45% to-[#020617]/95'
            : 'bg-gradient-to-b from-white/90 via-transparent via-60% to-black/75'
          }`} />

        {/* TOP HEADER SECTION */}
        <div className="relative z-10 pt-[60px] px-[80px] flex flex-col items-center text-center">
          {/* Logo Consórcio Magalu */}
          <div className="flex flex-col items-center mb-[20px]">
            <img
              src={isBlackFriday ? "/logo-consorcio-magalu-white.png" : "/logo-consorcio-magalu-black.png"}
              alt="Consórcio Magalu"
              className="h-[120px] w-auto object-contain drop-shadow-lg"
            />
          </div>

          {/* Headline */}
          <h1 className={`text-[44px] font-black tracking-tight leading-[1.2] max-w-[940px] mb-[20px] drop-shadow-md ${isBlackFriday ? 'text-white uppercase' : 'font-serif font-medium text-[#0F2F57]'
            }`}>
            {isBlackFriday ? (
              <>
                BLACK DAS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-400 to-cyan-300">BLACKS</span>: AS MENORES PARCELAS DO ANO
              </>
            ) : (
              headlineText
            )}
          </h1>

          {/* Pill Badge de Destaque */}
          {isBlackFriday && economyPill && (
            <div className="inline-flex items-center gap-[12px] px-[36px] py-[12px] rounded-full shadow-[0_0_30px_rgba(255,140,0,0.4)] bg-gradient-to-r from-[#030712] via-[#1a0c02] to-[#030712] border-2 border-[#FF7A00] text-amber-300">
              <span className="text-[24px]">🔥</span>
              <span className="text-[22px] font-black tracking-widest uppercase">
                {economyPill}
              </span>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: FLOATING CARD DE OFERTA & CALL TO ACTION */}
        <div className="relative z-10 pb-[50px] px-[70px] flex flex-col items-center text-center w-full">

          {/* FLOATING CARD DE SIMULAÇÃO (Estilo Oficial Black das Blacks) */}
          <div className={`w-full max-w-[940px] backdrop-blur-md rounded-[36px] p-[40px] flex flex-col items-center mb-[25px] ${isBlackFriday
              ? 'bg-[#030712]/92 border-2 border-[#FF7A00] shadow-[0_0_60px_rgba(255,122,0,0.4)] text-white'
              : 'bg-white/75 border-2 border-white/80 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#0F2F57]'
            }`}>

            {/* 2-Column Table (Crédito | Parcela) */}
            <div className={`w-full grid grid-cols-2 divide-x-2 mb-[20px] ${isBlackFriday ? 'divide-[#FF7A00]/40' : 'divide-[#0F2F57]/20'
              }`}>
              {/* Crédito */}
              <div className="flex flex-col items-center pr-[20px]">
                <span className={`text-[28px] font-black mb-[4px] uppercase tracking-wider ${isBlackFriday ? 'text-slate-300' : 'text-[#0F2F57]'}`}>
                  Crédito
                </span>
                <div className={`text-[82px] font-black leading-none tracking-tight font-mono ${isBlackFriday ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-[#0F2F57]'
                  }`}>
                  {fmtNumberOnly(grupo.credito)}
                </div>
                <span className="text-[18px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                  Prazo {grupo.prazo} Meses
                </span>
              </div>

              {/* Parcela */}
              <div className="flex flex-col items-center pl-[20px]">
                <span className={`text-[28px] font-black mb-[4px] uppercase tracking-wider ${isBlackFriday ? 'text-amber-400' : 'text-[#0F2F57]'}`}>
                  Por Apenas
                </span>
                <div className={`text-[82px] font-black leading-none tracking-tight font-mono ${isBlackFriday ? 'text-[#FF8C00] drop-shadow-[0_0_30px_rgba(255,140,0,0.6)]' : 'text-[#0F2F57]'
                  }`}>
                  R$ {fmtCurrency(installmentValue)}
                </div>
                <span className="text-[18px] font-black text-cyan-300 mt-2 uppercase tracking-widest">
                  {subBadgeText}
                </span>
              </div>
            </div>

            {/* Separator Line */}
            <div className={`w-full h-[2px] mb-[18px] ${isBlackFriday ? 'bg-gradient-to-r from-transparent via-[#FF7A00] to-transparent' : 'bg-[#0F2F57]/20'
              }`} />

            {/* Discount Announcement Badge */}
            {isBlackFriday && (
              <div className="flex flex-col items-center gap-1 mb-2">
                <span className="text-[30px] font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 uppercase">
                  {discountBadge}
                </span>
              </div>
            )}

            {/* Saiba Mais Button Style */}
            <div className="mt-2 px-[44px] py-[12px] rounded-full bg-gradient-to-r from-[#030712] via-[#2a1303] to-[#030712] border-2 border-[#FF7A00] shadow-[0_0_25px_rgba(255,122,0,0.4)] flex items-center gap-3">
              <span className="text-[22px] font-black uppercase tracking-widest text-white">
                SAIBA MAIS &gt;
              </span>
            </div>
          </div>

          {/* FOOTER CALL TO ACTION & WEBSITE */}
          <div className="flex flex-col items-center gap-[8px] w-full max-w-[940px]">
            <p className="text-[28px] font-black tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] uppercase">
              Fale com o especialista · Assembleia 25/11/2026 · Válido até 30/11
            </p>
            <p className="text-[22px] font-black tracking-widest text-cyan-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] uppercase">
              www.oespecialistaconsorcio.com.br
            </p>
            <p className="text-[13px] text-slate-400 leading-tight max-w-[900px] mt-1 text-center">
              *Condições promocionais Black das Blacks Consórcio Magalu com desconto sobre taxa de administração. Ofertas válidas enquanto houver vagas nos grupos. Ouvidoria: 0800 340 1214. Imagens meramente ilustrativas.
            </p>
          </div>

        </div>
      </div>
    );
  }
);

BannerGenerator.displayName = 'BannerGenerator';
