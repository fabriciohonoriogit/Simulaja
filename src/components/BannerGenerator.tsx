import React, { forwardRef } from 'react';
import type { GrupoItem } from '@/constants/simulador';

interface BannerGeneratorProps {
  grupo: GrupoItem;
  categoria: string;
  subCategoria?: string;
  paymentMode: 'linear' | 'reduzido';
  installmentValue: number;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const BannerGenerator = forwardRef<HTMLDivElement, BannerGeneratorProps>(
  ({ grupo, categoria, subCategoria, paymentMode, installmentValue }, ref) => {
    // Determine background and title based on category and subCategory
    let bgImage = '/segment-imovel.webp';
    let title = 'CONSÓRCIO IMÓVEL';
    
    if (categoria === 'imovel') {
      bgImage = '/segment-imovel.webp'; // Casa
      title = 'CONSÓRCIO IMÓVEL';
    } else if (categoria === 'veiculo') {
      const veiculoOptions = [
        { bg: '/segment-veiculo.webp', title: 'CONSÓRCIO DE VEÍCULOS' },
        { bg: '/segment-moto.webp', title: 'CONSÓRCIO DE MOTOS' },
        { bg: '/segment-nautico.webp', title: 'CONSÓRCIO NÁUTICO' }
      ];
      let selectedOption = veiculoOptions[0];
      
      if (subCategoria === 'moto') selectedOption = veiculoOptions[1];
      else if (subCategoria === 'jet ski' || subCategoria === 'náutico') selectedOption = veiculoOptions[2];
      else if (!subCategoria) {
        // Randomly pick one to provide variety
        selectedOption = veiculoOptions[Math.floor(Math.random() * veiculoOptions.length)];
      }

      bgImage = selectedOption.bg;
      title = selectedOption.title;
      
    } else if (categoria === 'pesados') {
      const pesadosOptions = [
        { bg: '/segment-agro.webp', title: 'CONSÓRCIO DE PESADOS' },
        { bg: '/segment-veiculo.webp', title: 'CONSÓRCIO DE VANS' },
        { bg: '/segment-agro.webp', title: 'CONSÓRCIO AGRÍCOLA' }
      ];
      let selectedOption = pesadosOptions[0];

      if (subCategoria === 'caminhão') selectedOption = pesadosOptions[0];
      else if (subCategoria === 'vans') selectedOption = pesadosOptions[1];
      else if (subCategoria === 'tratores') selectedOption = pesadosOptions[2];
      else if (!subCategoria) {
        selectedOption = pesadosOptions[Math.floor(Math.random() * pesadosOptions.length)];
      }

      bgImage = selectedOption.bg;
      title = selectedOption.title;
    } else if (categoria === 'servicos') {
      bgImage = '/segment-investimento.webp';
      title = 'CONSÓRCIO DE SERVIÇOS';
    }

    // Determine values to show
    if (!grupo) return null;
    const taxaValue = grupo.txLinear || grupo.tx5050 || 18;

    return (
      <div
        id="banner-generator-container"
        ref={ref}
        className="fixed top-0 left-[-9999px] w-[1080px] h-[1920px] bg-cover bg-center flex flex-col overflow-hidden"
        style={{
          backgroundImage: `url(${bgImage})`,
          opacity: 1,
          pointerEvents: 'none',
          zIndex: -9999,
          transform: 'scale(1)'
        }}
      >
        {/* Soft light overlay on the left to make text pop, and a bottom gradient for the footer */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#003876]/90 via-transparent to-transparent pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 w-full h-full p-[80px]">
          {/* Header */}
          <div className="flex justify-between items-start mb-[10px]">
            <div className="flex flex-col mt-[40px]">
              <span className="text-[45px] font-medium text-[#1e3a8a] tracking-widest uppercase">CONSÓRCIO</span>
              <span className="text-[130px] font-black leading-none text-[#1e40af] drop-shadow-sm uppercase">
                {title.replace('CONSÓRCIO ', '')}
              </span>
            </div>
            {/* Logo */}
            <div className="flex flex-col items-end text-[#1e40af]">
              <span className="text-[35px] font-medium leading-none tracking-wide">consórcio</span>
              <span className="text-[75px] font-black tracking-tighter leading-none">MAGALU</span>
            </div>
          </div>

          {/* Credit Value */}
          <div className="flex items-end mb-[60px] drop-shadow-2xl">
            <span className="text-[280px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-[#60a5fa] to-[#1e40af]" style={{ WebkitTextStroke: '3px white' }}>
              {Math.floor(grupo.credito / 1000)}
            </span>
            <span className="text-[90px] font-black text-[#1e40af] mb-[45px] ml-[20px] drop-shadow-md">
              MIL
            </span>
          </div>

          {/* Glassmorphism Panels */}
          <div className="flex flex-col gap-[30px] w-[580px]">
            {/* Main Installment Panel */}
            <div className="backdrop-blur-xl bg-white/60 border border-white/80 rounded-[40px] p-[45px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col items-start relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent"></div>
              <div className="relative z-10 w-full">
                <span className="text-[32px] font-black uppercase tracking-wider mb-[10px] text-gray-800">
                  {paymentMode === 'linear' ? 'PARCELA LINEAR' : 'PARCELA A PARTIR'}
                </span>
                <div className="flex items-start">
                  <span className="text-[50px] font-black mt-[15px] mr-[15px] text-[#1e40af]">R$</span>
                  <span className="text-[140px] font-black text-[#1e40af] leading-none tracking-tighter drop-shadow-sm">
                    {installmentValue?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Minor Info Panels - Unified in one card */}
            <div className="backdrop-blur-xl bg-white/50 border border-white/70 rounded-[40px] p-[45px] flex flex-col gap-[35px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/70 to-transparent"></div>
              <div className="relative z-10 flex flex-col gap-[35px] w-full">
                
                <div className="flex items-center gap-[30px]">
                  <div className="w-[85px] h-[85px] rounded-full bg-white flex items-center justify-center text-[#1e40af] font-black text-[45px] shadow-md border border-gray-100">
                    %
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[28px] font-bold text-gray-800 leading-tight">A MENOR</span>
                    <span className="text-[28px] font-bold text-[#1e40af] leading-tight">TAXA DO MERCADO</span>
                  </div>
                </div>

                <div className="w-full h-[2px] bg-white/80" />

                <div className="flex items-center gap-[30px]">
                  <div className="w-[85px] h-[85px] rounded-full bg-white flex items-center justify-center text-[#1e40af] font-black text-[40px] shadow-md border border-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[28px] font-bold text-gray-800 leading-tight">TAXA DE APENAS</span>
                    <span className="text-[60px] font-black text-[#1e40af] leading-none">{taxaValue}%</span>
                  </div>
                </div>

                <div className="w-full h-[2px] bg-white/80" />

                <div className="flex items-center gap-[30px]">
                  <div className="w-[85px] h-[85px] rounded-full bg-white flex items-center justify-center text-[#1e40af] font-black text-[40px] shadow-md border border-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[65px] font-black text-[#1e40af] leading-none">{grupo.prazo}</span>
                    <span className="text-[28px] font-bold text-gray-800 uppercase tracking-widest leading-tight">MESES</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Bottom Call to Action and URL */}
          <div className="absolute bottom-[230px] right-[80px]">
            <div className="bg-gradient-to-br from-[#003876] to-[#00183b] border border-[#3b82f6]/40 rounded-full w-[420px] h-[420px] flex flex-col items-center justify-center text-center p-[45px] shadow-[0_20px_60px_rgba(0,20,50,0.6)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-[65px] h-[65px] rounded-full border-[3px] border-white/90 flex items-center justify-center text-white text-[35px] font-bold mb-[25px] shadow-sm">
                  ✓
                </div>
                <span className="text-[38px] font-medium text-white mb-[8px] leading-tight">Conquiste o</span>
                <span className="text-[48px] font-serif italic text-[#93c5fd] mb-[8px] leading-tight">seu imóvel</span>
                <span className="text-[32px] font-light text-white leading-tight">com planejamento<br/>e tranquilidade.</span>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="absolute bottom-[70px] left-[80px] right-[80px] backdrop-blur-xl bg-gradient-to-r from-transparent via-[#003876]/80 to-transparent border border-white/20 rounded-full py-[25px] flex items-center justify-center gap-[20px] text-white shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            <span className="text-[32px] font-medium tracking-wider">www.oespecialistaconsorcio.com.br</span>
          </div>

        </div>
      </div>
    );
  }
);

BannerGenerator.displayName = 'BannerGenerator';
