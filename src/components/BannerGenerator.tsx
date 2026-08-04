import React, { forwardRef } from 'react';
import type { GrupoItem } from '@/constants/simulador';

interface BannerGeneratorProps {
  grupo: GrupoItem;
  categoria: string;
  subCategoria?: string;
  paymentMode: 'linear' | 'reduzido';
  installmentValue: number;
  theme?: 'dia-dos-pais' | 'padrao';
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
  ({ grupo, categoria, subCategoria, paymentMode, installmentValue, theme = 'dia-dos-pais', fathersDayVariation = 1 }, ref) => {
    if (!grupo) return null;

    // Seleção da Imagem de Fundo para o Dia dos Pais por Categoria
    let bgImage = '/dia-dos-pais-1.png';
    let headlineText = 'O melhor presente para um pai é ver a família realizada na casa própria.';
    let categoryIcons = [
      { label: 'Casa', icon: '🏠' },
      { label: 'Apartamento', icon: '🏢' },
      { label: 'Construir', icon: '🧱' },
      { label: 'Reformar', icon: '🖌️' },
      { label: 'Terreno', icon: '📍' },
      { label: 'Sítio', icon: '🏡' },
      { label: 'Quitação de financiamento', icon: '📄' }
    ];

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
      categoryIcons = [
        { label: 'Sedan / SUV', icon: '🚗' },
        { label: 'Utilitário', icon: '🛻' },
        { label: 'Seminovo', icon: '🚙' },
        { label: 'Moto', icon: '🏍️' },
        { label: 'Náutico', icon: '🛥️' },
        { label: 'Zero KM', icon: '✨' },
        { label: 'Quitação de financiamento', icon: '📄' }
      ];
    } else if (categoria === 'pesados') {
      bgImage = (fathersDayVariation === 2) ? '/dia-dos-pais-pesados-2.png' : '/dia-dos-pais-pesados-1.png';
      headlineText = 'Todo pai sonha em construir um futuro forte e um legado próspero para os filhos.';
      categoryIcons = [
        { label: 'Caminhão', icon: '🚛' },
        { label: 'Trator', icon: '🚜' },
        { label: 'Colheitadeira', icon: '🌾' },
        { label: 'Maquinário', icon: '⚙️' },
        { label: 'Implementos', icon: '🛠️' },
        { label: 'Agro', icon: '🌱' },
        { label: 'Quitação de financiamento', icon: '📄' }
      ];
    } else if (categoria === 'servicos') {
      bgImage = '/dia-dos-pais-servicos-1.png';
      headlineText = 'O melhor presente para um pai é vivenciar momentos inesquecíveis em família.';
      categoryIcons = [
        { label: 'Viagens', icon: '✈️' },
        { label: 'Festas', icon: '🎉' },
        { label: 'Estudo', icon: '🎓' },
        { label: 'Cirurgias', icon: '🏥' },
        { label: 'Estética', icon: '✨' },
        { label: 'Reformas', icon: '🏡' },
        { label: 'Eventos', icon: '🥂' }
      ];
    }

    const isLinear = paymentMode === 'linear';
    const badgeText = isLinear ? 'PARCELA FIXA ATÉ A CONTEMPLAÇÃO' : 'PARCELA REDUZIDA ATÉ A CONTEMPLAÇÃO';

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
        {/* Layer 1: Soft top gradient to highlight text */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-transparent to-white/95 pointer-events-none" />

        {/* TOP HEADER SECTION */}
        <div className="relative z-10 pt-[70px] px-[80px] flex flex-col items-center text-center">
          {/* Logo Consórcio Magalu */}
          <div className="flex flex-col items-center mb-[30px]">
            <img 
              src="/logo-consorcio-magalu-black.png" 
              alt="Consórcio Magalu" 
              className="h-[135px] w-auto object-contain drop-shadow-md"
            />
          </div>

          {/* Emotional Father's Day Headline */}
          <h1 className="text-[50px] font-serif font-medium tracking-tight text-[#0F2F57] leading-[1.25] max-w-[920px] mb-[28px] drop-shadow-sm">
            {headlineText}
          </h1>

          {/* Pill Badge */}
          <div className="inline-flex items-center gap-[12px] bg-[#EBF4FC] border border-[#BDE0FE] px-[32px] py-[14px] rounded-full shadow-sm">
            <span className="text-[26px]">🏠</span>
            <span className="text-[22px] font-bold tracking-wider text-[#0F2F57] uppercase">
              {badgeText}
            </span>
          </div>
        </div>

        {/* BOTTOM SECTION: FLOATING CARD & CATEGORY ICONS */}
        <div className="relative z-10 pb-[70px] px-[70px] flex flex-col items-center text-center w-full">
          
          {/* FLOATING CARD DE SIMULAÇÃO */}
          <div className="w-full max-w-[940px] bg-white/95 backdrop-blur-md border-2 border-[#D0E1F5] rounded-[36px] p-[45px] shadow-[0_25px_60px_rgba(15,47,87,0.15)] flex flex-col items-center mb-[45px]">
            
            {/* 2-Column Table (Crédito | Parcela) */}
            <div className="w-full grid grid-cols-2 divide-x-2 divide-[#D0E1F5] mb-[25px]">
              {/* Crédito */}
              <div className="flex flex-col items-center pr-[20px]">
                <span className="text-[28px] font-semibold text-[#0F2F57] mb-[6px]">
                  Crédito
                </span>
                <div className="text-[86px] font-black leading-none tracking-tight text-[#0F2F57]">
                  {fmtNumberOnly(grupo.credito)}
                </div>
              </div>

              {/* Parcela */}
              <div className="flex flex-col items-center pl-[20px]">
                <span className="text-[28px] font-semibold text-[#0F2F57] mb-[6px]">
                  Parcela
                </span>
                <div className="text-[86px] font-black leading-none tracking-tight text-[#0F2F57]">
                  {fmtCurrency(installmentValue)}
                </div>
              </div>
            </div>

            {/* Separator Line */}
            <div className="w-full h-[2px] bg-[#D0E1F5] mb-[20px]" />

            {/* Prazo */}
            <div className="text-[26px] font-extrabold tracking-[0.25em] text-[#0F2F57] uppercase">
              PRAZO {grupo.prazo} MESES
            </div>
          </div>

          {/* CATEGORY ICONS ROW */}
          <div className="w-full flex items-center justify-between px-[10px] max-w-[940px]">
            {categoryIcons.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-[8px] max-w-[110px]">
                <div className="w-[62px] h-[62px] rounded-full bg-[#EBF4FC] border border-[#BDE0FE] flex items-center justify-center text-[30px] shadow-sm">
                  {item.icon}
                </div>
                <span className="text-[16px] font-bold text-[#0F2F57] leading-tight text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }
);

BannerGenerator.displayName = 'BannerGenerator';
