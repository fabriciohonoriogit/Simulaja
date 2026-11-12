import React, { useState } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building2, Car, Home, Truck, Award } from "lucide-react";
import { OrbitalAssetShowcase } from "@/components/OrbitalAssetShowcase";
import ConsortiumSimulator from "@/components/ConsortiumSimulator";
import { getActiveCampaignTheme } from "@/utils/campaignThemeManager";
import { BlueParticlesBackground } from "@/components/BlueParticlesBackground";

interface HeroProps {
  onSimulateSubmit?: (leadData: any) => Promise<void>;
}

export const Hero: React.FC<HeroProps> = ({ onSimulateSubmit }) => {
  const theme = getActiveCampaignTheme();

  return (
    <section className="relative w-full bg-[#050814] text-white pt-24 pb-12 overflow-hidden border-b border-white/10">
      {/* Luzes e Auroras Cósmicas Futuristas da Campanha Magalu */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />
      
      {/* Partículas sutis de fundo */}
      <BlueParticlesBackground />

      <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* SELO DE AUTORIDADE GESTOR AUTORIZADO NO TOPO */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/40 text-blue-300 text-xs font-black tracking-wider uppercase backdrop-blur-md shadow-[0_0_15px_rgba(0,134,255,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>Gestor autorizado do consórcio magalu</span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-amber-300">O Especialista Consórcio</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Fiscalizado Banco Central
            </span>
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              • ABAC Filiado
            </span>
          </div>
        </div>

        {/* HERO EM 2 COLUNAS: ESQUERDA (PLANETA HOLOGRÁFICO DOS ATIVOS) | DIREITA (SIMULADOR IMEDIATO) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* COLUNA ESQUERDA: HEADLINE & PLANETA HOLOGRÁFICO (Carros, Motos, Casas, Pesados) */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{theme.badgeText}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
                O Futuro do seu Patrimônio{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-amber-300">
                  Sem Juros Bancários
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed mt-2 max-w-xl">
                Planeje seu carro, moto, casa ou caminhão com a garantia do Consórcio Magalu e consultoria de Fabrício Honório. Condição exclusiva de <strong>meia parcela até a contemplação</strong>.
              </p>
            </div>

            {/* PLANETA HOLOGRÁFICO DOS ATIVOS (CARROS, CASAS, MOTOS, PESADOS) */}
            <div className="relative py-2">
              <OrbitalAssetShowcase />
            </div>

            {/* BENEFÍCIOS RÁPIDOS EM BADGES */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <div className="text-xs font-black text-emerald-400">Plano 50/50</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Meia parcela até contemplar</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <div className="text-xs font-black text-cyan-300">Poder de Compra</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Desconto à vista no bem</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <div className="text-xs font-black text-amber-300">Sem Entrada</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Planejamento 100% puro</div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: O SIMULADOR NO TOPO (AÇÃO IMEDIATA) */}
          <div className="lg:col-span-6 flex flex-col justify-center relative">
            {/* Efeito Glow atrás do simulador */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-amber-500 rounded-3xl blur-xl opacity-30 pointer-events-none" />

            <div className="relative z-10 w-full rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl shadow-blue-950/60 bg-[#070D19]/90 backdrop-blur-2xl">
              {/* Header do Simulador com Identidade Magalu */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-blue-900/60 via-slate-900/80 to-blue-900/60 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Simulador Especialista
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Condição Ativa
                </span>
              </div>

              {/* O COMPONENTE DO SIMULADOR (INTACTO COM TODAS AS FÓRMULAS & LEAD CAPTURE) */}
              <div className="p-2 sm:p-4">
                <ConsortiumSimulator compact={true} onSimulateSubmit={onSimulateSubmit} />
              </div>
            </div>
          </div>

        </div>

        {/* FAIXA DE CREDIBILIDADE MAGALU INFERIOR */}
        <div className="mt-12 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-white">+30 Anos</span>
            <span className="text-xs text-slate-400">Tradição Magazine Luiza</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-cyan-300">Banco Central</span>
            <span className="text-xs text-slate-400">100% Regulamentado</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-emerald-400">Zero Juros</span>
            <span className="text-xs text-slate-400">Apenas Taxa Administrativa</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-amber-300">Mais de 400 Mil</span>
            <span className="text-xs text-slate-400">Clientes Contemplados</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
