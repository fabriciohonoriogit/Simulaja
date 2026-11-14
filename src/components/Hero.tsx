import React, { useState } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building2, Car, Home, Truck, Award } from "lucide-react";
import { OrbitalAssetShowcase } from "@/components/OrbitalAssetShowcase";
import ConsortiumSimulator from "@/components/ConsortiumSimulator";
import { getActiveCampaignTheme } from "@/utils/campaignThemeManager";

interface HeroProps {
  onSimulateSubmit?: (leadData: any) => Promise<void>;
}

export const Hero: React.FC<HeroProps> = ({ onSimulateSubmit }) => {
  const theme = getActiveCampaignTheme();

  return (
    <section className="relative w-full bg-[#FAF9F5] text-slate-800 pt-10 sm:pt-14 pb-4 overflow-hidden border-b border-slate-200">
      {/* Gradiente decorativo sutil */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-gradient-to-br from-blue-100/60 via-sky-50/40 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-amber-50/40 rounded-full blur-[130px] pointer-events-none" />

      <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* SELO DE AUTORIDADE GESTOR AUTORIZADO NO TOPO */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black tracking-wider uppercase backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Gestor autorizado do consórcio magalu</span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline text-amber-600">O Especialista Consórcio</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
              Fiscalizado Banco Central
            </span>
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              • ABAC Filiado
            </span>
          </div>
        </div>

        {/* HERO EM 2 COLUNAS ALINHADAS NO TOPO: ESQUERDA (HEADLINE & ATIVOS) | DIREITA (SIMULADOR IMEDIATO) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* COLUNA ESQUERDA: HEADLINE & SHOWCASE DOS ATIVOS */}
          <div className="lg:col-span-6 flex flex-col justify-start space-y-5 pt-1">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>{theme.badgeText}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                O Futuro do seu Patrimônio{" "}
                <span className="text-[#0086FF]">
                  Sem Juros Bancários
                </span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed mt-2 max-w-xl">
                Planeje seu carro, moto, casa ou caminhão com a garantia do Consórcio Magalu e consultoria de Fabrício Honório. Condição exclusiva de <strong>meia parcela até a contemplação</strong>.
              </p>
            </div>

            {/* SHOWCASE DOS ATIVOS (CARROS, CASAS, MOTOS, PESADOS) */}
            <div className="relative">
              <OrbitalAssetShowcase />
            </div>

            {/* BENEFÍCIOS RÁPIDOS EM BADGES */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-center">
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="text-xs font-black text-emerald-600">Plano 50/50</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Meia parcela até contemplar</div>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="text-xs font-black text-blue-600">Poder de Compra</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Desconto à vista no bem</div>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="text-xs font-black text-amber-600">Sem Entrada</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Planejamento 100% puro</div>
              </div>
            </div>

            {/* GARANTIAS E DIFERENCIAIS EXECUTIVOS QUE ELIMINAM ESPAÇOS VAGOS */}
            <div className="rounded-2xl p-3.5 bg-blue-50 border border-blue-100 space-y-2 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Diferenciais Estratégicos Magalu</span>
                </div>
                <span className="text-[10px] text-blue-600 font-mono font-bold">100% Regulamentado</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 bg-white rounded-xl px-2.5 py-1.5 border border-blue-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-[11px]">Meia parcela até contemplar</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 bg-white rounded-xl px-2.5 py-1.5 border border-blue-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-semibold text-[11px]">Lance embutido de até 50%</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 bg-white rounded-xl px-2.5 py-1.5 border border-blue-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-semibold text-[11px]">Poder de compra à vista</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 bg-white rounded-xl px-2.5 py-1.5 border border-blue-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-semibold text-[11px]">Assessoria em assembleias</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: O SIMULADOR NO TOPO (AÇÃO IMEDIATA) */}
          <div className="lg:col-span-6 flex flex-col justify-start relative pt-1">
            {/* Efeito Glow discreto atrás do simulador */}
            <div className="absolute -inset-1.5 bg-blue-600/10 rounded-3xl blur-2xl pointer-events-none" />

            <div className="relative z-10 w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white backdrop-blur-2xl">
              {/* Header do Simulador com Identidade Sóbria Magalu */}
              <div className="px-5 py-3.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0086FF]" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Simulador Especialista
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 font-bold">
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
        <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-slate-900">+30 Anos</span>
            <span className="text-xs text-slate-500">Tradição Magazine Luiza</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-blue-600">Banco Central</span>
            <span className="text-xs text-slate-500">100% Regulamentado</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-emerald-600">Zero Juros</span>
            <span className="text-xs text-slate-500">Apenas Taxa Administrativa</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-amber-600">Mais de 400 Mil</span>
            <span className="text-xs text-slate-500">Clientes Contemplados</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
