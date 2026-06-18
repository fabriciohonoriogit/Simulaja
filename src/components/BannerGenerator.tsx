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
        className="fixed top-0 left-[-9999px] w-[1080px] h-[1920px] bg-cover bg-center flex flex-col text-white"
        style={{
          backgroundImage: `url(${bgImage})`,
          opacity: 1,
          pointerEvents: 'none',
          zIndex: -9999,
          transform: 'scale(1)'
        }}
      >
        {/* Gradient Overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#003876]/80 via-transparent to-[#003876] pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex flex-col p-[80px]">
          {/* Header */}
          <div className="flex justify-between items-start mb-[40px]">
            <div className="flex flex-col">
              <span className="text-[55px] font-medium tracking-wide">CONSÓRCIO</span>
              <span className="text-[120px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white drop-shadow-md">
                {title.replace('CONSÓRCIO ', '')}
              </span>
            </div>
            {/* Logo placeholder - replace with actual logo if available */}
            <div className="flex flex-col items-end text-[40px] font-bold text-blue-300">
              <span className="text-[30px] font-medium">consórcio</span>
              <span className="text-[60px] font-black tracking-tighter leading-none">MAGALU</span>
            </div>
          </div>

          {/* Credit Value */}
          <div className="flex items-end mb-[80px]">
            <span className="text-[250px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-blue-300 to-blue-600 drop-shadow-2xl" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.2)' }}>
              {Math.floor(grupo.credito / 1000)}
            </span>
            <span className="text-[80px] font-bold text-white mb-[30px] ml-[20px] drop-shadow-lg">
              MIL
            </span>
          </div>

          {/* Glassmorphism Panels */}
          <div className="flex flex-col gap-[40px] w-[600px]">
            {/* Main Installment Panel */}
            <div className="backdrop-blur-xl bg-white/20 border border-white/40 rounded-[40px] p-[50px] shadow-2xl flex flex-col items-center">
              <span className="text-[35px] font-bold uppercase tracking-wider mb-[10px]">
                {paymentMode === 'linear' ? 'Parcela Linear (100%)' : 'Parcela a partir'}
              </span>
              <div className="flex items-start">
                <span className="text-[50px] font-bold mt-[20px] mr-[10px] text-blue-100">R$</span>
                <span className="text-[140px] font-black text-white leading-none drop-shadow-md">
                  {installmentValue?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Minor Info Panels */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-[40px] p-[40px] flex flex-col gap-[30px] shadow-xl">
              
              <div className="flex items-center gap-[30px]">
                <div className="w-[80px] h-[80px] rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-[40px] shadow-inner">
                  %
                </div>
                <div className="flex flex-col">
                  <span className="text-[30px] font-bold text-blue-100">A MENOR</span>
                  <span className="text-[30px] font-bold">TAXA DO MERCADO</span>
                </div>
              </div>

              <div className="w-full h-[2px] bg-white/20" />

              <div className="flex items-center gap-[30px]">
                <div className="w-[80px] h-[80px] rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-[40px] shadow-inner">
                  📈
                </div>
                <div className="flex flex-col">
                  <span className="text-[30px] font-bold text-blue-100">TAXA DE APENAS</span>
                  <span className="text-[55px] font-black text-white leading-none">{taxaValue}%</span>
                </div>
              </div>

              <div className="w-full h-[2px] bg-white/20" />

              <div className="flex items-center gap-[30px]">
                <div className="w-[80px] h-[80px] rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-[40px] shadow-inner">
                  📅
                </div>
                <div className="flex flex-col">
                  <span className="text-[60px] font-black text-white leading-none">{grupo.prazo}</span>
                  <span className="text-[30px] font-bold text-blue-100 uppercase tracking-widest">Meses</span>
                </div>
              </div>

            </div>
          </div>
          
          <div className="flex-grow" />

          {/* Bottom Call to Action and URL */}
          <div className="flex justify-end mb-[40px]">
            <div className="backdrop-blur-md bg-blue-900/60 border border-blue-400/50 rounded-full w-[450px] h-[450px] flex flex-col items-center justify-center text-center p-[40px] shadow-[0_0_50px_rgba(0,100,255,0.4)]">
              <div className="w-[60px] h-[60px] rounded-full border-4 border-blue-300 flex items-center justify-center text-blue-300 text-[35px] font-bold mb-[20px]">
                ✓
              </div>
              <span className="text-[40px] font-bold mb-[10px]">Conquiste o</span>
              <span className="text-[50px] font-normal italic text-blue-200 font-serif mb-[10px]">seu bem</span>
              <span className="text-[30px] font-medium leading-tight">com planejamento<br/>e tranquilidade.</span>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="w-full backdrop-blur-md bg-white/10 border border-white/30 rounded-full py-[30px] flex items-center justify-center gap-[20px]">
            <span className="text-[35px]">🌐</span>
            <span className="text-[35px] font-medium tracking-wider">www.oespecialistaconsorcio.com.br</span>
          </div>

        </div>
      </div>
    );
  }
);

BannerGenerator.displayName = 'BannerGenerator';
