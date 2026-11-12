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
  consultorNome?: string;
  consultorTelefone?: string;
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
  ({ 
    grupo, 
    categoria, 
    subCategoria, 
    paymentMode, 
    installmentValue, 
    theme, 
    fathersDayVariation = 1,
    consultorNome = 'Fabricio Honório',
    consultorTelefone = '(41) 99792-5357'
  }, ref) => {
    if (!grupo) return null;

    const activeTheme = theme || (isBlackFridayActive() ? 'black-friday' : 'dia-dos-pais');
    const isBlackFriday = activeTheme === 'black-friday';

    // Regra de Seleção de Background e Títulos
    let bgImage = '/dia-dos-pais-1.png';
    let headlineText = 'O melhor presente para um pai é ver a família realizada na casa própria.';
    let discountBadge = '20% DE DESCONTO NA TAXA ADMINISTRATIVA';
    let economyPill = 'ECONOMIA HISTÓRICA';
    let isPreBaked = false;

    if (isBlackFriday) {
      if (categoria === 'imovel') {
        bgImage = '/images/magalu/bf/bf-imovel.jpg';
        discountBadge = '20% DE DESCONTO NA TAXA ADMINISTRATIVA';
        economyPill = 'ECONOMIA GARANTIDA';
        isPreBaked = true;
      } else if (categoria === 'veiculo' || categoria === 'pesados') {
        const val = grupo.credito;
        if (val >= 180000) {
          // Valores acima de 180 mil -> Caminhonete / Picape
          bgImage = '/images/magalu/bf/bf-caminhonete.jpg';
          headlineText = 'BLACK DAS BLACKS: SUA CAMINHONETE NOVA COM AS MENORES PARCELAS';
          discountBadge = '25% DE DESCONTO NA TAXA ADMINISTRATIVA';
          economyPill = 'ECONOMIA: ATÉ R$ 12.000';
          isPreBaked = false; // Gerada via IA, não tem textos gravados na imagem
        } else if (val >= 70000 && val <= 179999) {
          // De 70 a 179 mil -> Carro / SUV
          bgImage = '/images/magalu/bf/bf-carro.jpg';
          discountBadge = '25% DE DESCONTO NA TAXA ADMINISTRATIVA';
          economyPill = 'ECONOMIA: ATÉ R$ 7.000';
          isPreBaked = true;
        } else {
          // De 18 a 39 mil (e até 69 mil ou moto) -> Moto
          bgImage = '/images/magalu/bf/bf-moto.jpg';
          discountBadge = '30% DE DESCONTO NA TAXA DE ADMINISTRAÇÃO';
          economyPill = 'ECONOMIA: ATÉ R$ 4.800';
          isPreBaked = true;
        }
      } else {
        bgImage = '/images/magalu/bf/bf-master.jpg';
        discountBadge = 'TAXAS COM DESCONTO ESPECIAL DE BLACK FRIDAY';
        economyPill = 'CONDIÇÃO EXCLUSIVA';
        isPreBaked = true;
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
    const subBadgeText = isLinear ? 'PLANO LINEAR · 100% DO CRÉDITO' : 'PARCELA REDUZIDA (50%) ATÉ A CONTEMPLAÇÃO';

    // RENDERIZAÇÃO ESPECIAL BLACK FRIDAY (COM OVERLAY SÓLIDO PARA ZERO TRUNCAMENTO)
    if (isBlackFriday) {
      return (
        <div
          id="banner-generator-container"
          ref={ref}
          className="fixed top-0 left-[-9999px] w-[1080px] h-[1920px] bg-black flex flex-col justify-between overflow-hidden font-sans text-slate-900 select-none"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            opacity: 1,
            pointerEvents: 'none',
            zIndex: -9999,
          }}
        >
          {/* HEADER SEPARADO SE NÃO FOR PRE-BAKED (Ex: Caminhonete AI) */}
          {!isPreBaked ? (
            <div className="relative z-10 pt-[55px] px-[80px] flex flex-col items-center text-center">
              <img
                src="/logo-consorcio-magalu-white.png"
                alt="Consórcio Magalu"
                className="h-[110px] w-auto object-contain drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)] mb-[15px]"
              />
              <div className="text-[52px] font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(0,229,255,0.7)] uppercase mb-2">
                BLACK DAS <span className="text-[#00E5FF]">BLACKS</span>
              </div>
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-black/80 border-2 border-[#FF7A00] text-[#FFB703] font-black text-[22px] tracking-wider uppercase shadow-[0_0_20px_rgba(255,122,0,0.5)]">
                🔥 {economyPill}
              </div>
            </div>
          ) : (
            // Spacer para deixar o cabeçalho original e o veículo 100% visíveis sem sobreposição
            <div className="h-[840px] w-full pointer-events-none" />
          )}

          {/* PAINEL SÓLIDO 100% OPACO PARA A OFERTA DO CLIENTE (COBRE QUALQUER NÚMERO ANTIGO) */}
          <div 
            className="w-full relative z-20 flex flex-col items-center text-center px-[60px] pb-[40px] pt-[30px]"
            style={{ 
              backgroundColor: '#020617', 
              boxShadow: '0 -25px 60px rgba(0, 0, 0, 0.95)',
              borderTop: '3px solid #FF7A00'
            }}
          >
            {/* Linha Néon de Destaque no topo da transição */}
            <div className="absolute -top-[3px] left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent shadow-[0_0_20px_#00E5FF]" />

            {/* Pill Badge Oficial da Oferta */}
            <div className="inline-flex items-center gap-[10px] px-[32px] py-[10px] rounded-full bg-black border-2 border-[#FF7A00] shadow-[0_0_30px_rgba(255,122,0,0.6)] mb-[24px]">
              <span className="text-[24px]">🔥</span>
              <span className="text-[24px] font-black tracking-widest text-[#FFB703] uppercase">
                {economyPill}
              </span>
            </div>

            {/* CARD PRINCIPAL DE OFERTA EXECUTIVA (Estilo Oficial Black das Blacks) */}
            <div 
              className="w-full max-w-[960px] rounded-[32px] p-[38px] flex flex-col items-center mb-[20px]"
              style={{
                backgroundColor: '#000000',
                border: '3px solid #FF8C00',
                boxShadow: '0 0 50px rgba(255, 140, 0, 0.45)',
              }}
            >
              {/* Tabela de 2 Colunas: Crédito | Parcela */}
              <div className="w-full grid grid-cols-2 divide-x-2 divide-[#FF7A00]/40 mb-[18px]">
                
                {/* Coluna 1: Crédito */}
                <div className="flex flex-col items-center pr-[25px]">
                  <span className="text-[26px] font-black text-slate-400 mb-[4px] uppercase tracking-widest">
                    Crédito
                  </span>
                  <div className="text-[82px] font-black leading-none font-mono text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                    {fmtNumberOnly(grupo.credito)}
                  </div>
                  <span className="text-[20px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                    Prazo {grupo.prazo} Meses
                  </span>
                </div>

                {/* Coluna 2: Parcela Promocional */}
                <div className="flex flex-col items-center pl-[25px]">
                  <span className="text-[26px] font-black text-[#FFB703] mb-[4px] uppercase tracking-widest">
                    Por Apenas
                  </span>
                  <div className="text-[82px] font-black leading-none font-mono text-[#FF8C00] drop-shadow-[0_0_35px_rgba(255,140,0,0.7)]">
                    R$ {fmtCurrency(installmentValue)}
                  </div>
                  <span className="text-[19px] font-black text-[#00E5FF] mt-2 uppercase tracking-widest">
                    {subBadgeText}
                  </span>
                </div>

              </div>

              {/* Linha Divisória Néon */}
              <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00] to-transparent mb-[16px]" />

              {/* Anúncio do Desconto na Taxa Adm */}
              <div className="text-[30px] font-black tracking-wide text-[#FFB703] uppercase mb-3">
                {discountBadge}
              </div>

              {/* Botão Oficial Saiba Mais */}
              <div className="px-[50px] py-[12px] rounded-full bg-gradient-to-r from-black via-[#1a0800] to-black border-2 border-[#FF7A00] shadow-[0_0_25px_rgba(255,122,0,0.5)] flex items-center gap-2">
                <span className="text-[24px] font-black uppercase tracking-widest text-white">
                  SAIBA MAIS &gt;
                </span>
              </div>
            </div>

            {/* RODAPÉ DO CONSULTOR & REGRAS OFICIAIS */}
            <div className="w-full max-w-[960px] flex flex-col items-center gap-[6px]">
              <p className="text-[26px] font-black tracking-wide text-white uppercase drop-shadow-md">
                Consultor Autorizado: {consultorNome} · WhatsApp: {consultorTelefone}
              </p>
              <p className="text-[20px] font-black tracking-widest text-[#00E5FF] uppercase">
                Assembleia 25/11/2026 · Válido até 30/11
              </p>
              <p className="text-[12px] text-slate-400 leading-tight max-w-[920px] mt-1 text-center font-normal">
                *Ofertas Black das Blacks Consórcio Magalu com taxa de administração reduzida promocional válida enquanto houver vagas disponíveis nos grupos. Sujeito a alteração conforme regras da administradora. Ouvidoria: 0800 340 1214.
              </p>
            </div>

          </div>
        </div>
      );
    }

    // RENDERIZAÇÃO PADRÃO (Tema Dia dos Pais ou Clássico)
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
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/90 via-transparent via-60% to-black/75" />

        {/* TOP HEADER SECTION */}
        <div className="relative z-10 pt-[70px] px-[80px] flex flex-col items-center text-center">
          <div className="flex flex-col items-center mb-[30px]">
            <img
              src="/logo-consorcio-magalu-black.png"
              alt="Consórcio Magalu"
              className="h-[135px] w-auto object-contain drop-shadow-md"
            />
          </div>

          <h1 className="text-[46px] font-medium font-serif text-[#0F2F57] tracking-tight leading-[1.2] max-w-[940px] mb-[28px] drop-shadow-md">
            {headlineText}
          </h1>

          <div className="inline-flex items-center gap-[12px] px-[32px] py-[14px] rounded-full shadow-lg bg-[#EBF4FC] border border-[#BDE0FE] text-[#0F2F57]">
            <span className="text-[26px]">🏠</span>
            <span className="text-[22px] font-black tracking-wider uppercase">
              {isLinear ? 'PARCELA FIXA ATÉ A CONTEMPLAÇÃO' : 'PARCELA REDUZIDA ATÉ A CONTEMPLAÇÃO'}
            </span>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="relative z-10 pb-[65px] px-[70px] flex flex-col items-center text-center w-full">
          <div className="w-full max-w-[940px] backdrop-blur-md rounded-[36px] p-[45px] flex flex-col items-center mb-[35px] bg-white/75 border-2 border-white/80 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#0F2F57]">
            <div className="w-full grid grid-cols-2 divide-x-2 divide-[#0F2F57]/20 mb-[25px]">
              <div className="flex flex-col items-center pr-[20px]">
                <span className="text-[28px] font-bold mb-[6px] uppercase text-[#0F2F57]">
                  Crédito
                </span>
                <div className="text-[86px] font-black leading-none tracking-tight font-mono text-[#0F2F57]">
                  {fmtNumberOnly(grupo.credito)}
                </div>
              </div>

              <div className="flex flex-col items-center pl-[20px]">
                <span className="text-[28px] font-bold mb-[6px] uppercase text-[#0F2F57]">
                  Parcela
                </span>
                <div className="text-[86px] font-black leading-none tracking-tight font-mono text-[#0F2F57]">
                  {fmtCurrency(installmentValue)}
                </div>
              </div>
            </div>

            <div className="w-full h-[2px] mb-[20px] bg-[#0F2F57]/20" />

            <div className="text-[26px] font-black tracking-[0.25em] uppercase text-[#0F2F57]">
              PRAZO {grupo.prazo} MESES · ASSEMBLEIA 25/11/2026
            </div>
          </div>

          <div className="flex flex-col items-center gap-[10px] w-full max-w-[940px]">
            <p className="text-[34px] font-extrabold tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] uppercase">
              Fale com o especialista · Condição Especial
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
