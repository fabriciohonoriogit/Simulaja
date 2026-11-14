import React from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building2, Car, Home, Truck, Award } from "lucide-react";
import { OrbitalAssetShowcase } from "@/components/OrbitalAssetShowcase";
import ConsortiumSimulator from "@/components/ConsortiumSimulator";
import { getActiveCampaignTheme } from "@/utils/campaignThemeManager";
import magaluLogo from "@/assets/logo-consorcio-magalu-transparent.png";

interface HeroProps {
  onSimulateSubmit?: (leadData: any) => Promise<void>;
}

export const Hero: React.FC<HeroProps> = ({ onSimulateSubmit }) => {
  const theme = getActiveCampaignTheme();

  return (
    <section 
      className="relative w-full text-slate-800 pt-10 sm:pt-14 pb-8 overflow-hidden border-b border-slate-200/80 bg-[#FAF9F5]"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0, 134, 255, 0.035) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 134, 255, 0.035) 1px, transparent 1px)
        `,
        backgroundSize: "36px 36px"
      }}
    >
      {/* Luzes decorativas ambientais sutis com animação de respiração */}
      <div className="absolute top-0 right-10 w-[550px] h-[450px] bg-gradient-to-bl from-blue-200/35 via-sky-100/20 to-transparent rounded-full blur-3xl pointer-events-none animate-breath" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[350px] bg-gradient-to-tr from-amber-100/30 via-orange-50/20 to-transparent rounded-full blur-3xl pointer-events-none animate-breath" />

      {/* Linha de luz sutil no topo */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0086FF]/20 to-transparent" />

      <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* SELO DE AUTORIDADE INSTITUCIONAL NO TOPO COM LOGOS OFICIAIS */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/70">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-blue-200 text-slate-800 text-xs font-black tracking-wider uppercase shadow-sm shadow-blue-100">
            <div className="bg-[#0086FF] px-2 py-0.5 rounded-md flex items-center shadow-xs">
              <img src={magaluLogo} alt="Consórcio Magalu" className="h-3.5 w-auto object-contain" />
            </div>
            <span className="text-[#0086FF] text-[11px]">Representante Autorizado</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-slate-700 text-[11px]">O Especialista Consórcio</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
            <a 
              href="https://www.bcb.gov.br/estabilidadefinanceira/consorcios" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-[#0086FF] transition-colors"
              title="Fiscalizado pelo Banco Central do Brasil"
            >
              <img src="/logo-bacen.svg" alt="Banco Central" className="h-4 w-auto object-contain" />
              <span>Fiscalizado Bacen</span>
            </a>
            <span className="text-slate-300">•</span>
            <a 
              href="https://www.abac.org.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-[#0086FF] transition-colors"
              title="Filiado à ABAC"
            >
              <img src="/logo-abac.svg" alt="ABAC" className="h-4 w-auto object-contain" />
              <span>Filiado ABAC</span>
            </a>
          </div>
        </div>

        {/* HERO EM 2 COLUNAS: ESQUERDA (HEADLINE & ATIVOS) | DIREITA (SIMULADOR IMEDIATO) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* COLUNA ESQUERDA: HEADLINE & SHOWCASE DOS ATIVOS */}
          <div className="lg:col-span-6 flex flex-col justify-start space-y-5 pt-1">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0086FF] text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                <span>{theme.badgeText}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                <span className="block">O Futuro do seu Patrimônio</span>
                <span className="text-[#0086FF] relative inline-block mt-1">
                  com Planejamento
                  {/* Linha decorativa animada sob o destaque */}
                  <span className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#0086FF] to-cyan-400 rounded-full" />
                </span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed mt-2 max-w-xl">
                Planeje seu carro, moto, casa ou caminhão com inteligência financeira e taxas reduzidas. Condição exclusiva de <strong>meia parcela até a contemplação</strong>.
              </p>
            </div>

            {/* SHOWCASE DOS ATIVOS (CARROS, CASAS, MOTOS, PESADOS) */}
            <div className="relative">
              <OrbitalAssetShowcase />
            </div>

            {/* BENEFÍCIOS RÁPIDOS EM BADGES */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/80 text-center">
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all group">
                <div className="text-xs font-black text-emerald-600 group-hover:scale-105 transition-transform">Plano 50/50</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Meia parcela até contemplar</div>
              </div>

              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all group">
                <div className="text-xs font-black text-[#0086FF] group-hover:scale-105 transition-transform">Poder de Compra</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Desconto à vista no bem</div>
              </div>

              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all group">
                <div className="text-xs font-black text-amber-600 group-hover:scale-105 transition-transform">Sem Entrada</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Planejamento 100% puro</div>
              </div>
            </div>

            {/* GARANTIAS E DIFERENCIAIS EXECUTIVOS */}
            <div className="rounded-2xl p-4 bg-white border border-blue-100 space-y-2.5 shadow-sm shadow-blue-50">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Diferenciais Estratégicos Magalu</span>
                </div>
                <span className="text-[10px] text-[#0086FF] font-mono font-bold">100% Regulamentado</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 bg-[#FAF9F5] rounded-xl px-2.5 py-1.5 border border-slate-200/70 hover:border-blue-200 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-[11px]">Meia parcela até contemplar</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 bg-[#FAF9F5] rounded-xl px-2.5 py-1.5 border border-slate-200/70 hover:border-blue-200 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0086FF] shrink-0" />
                  <span className="font-semibold text-[11px]">Lance embutido de até 50%</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 bg-[#FAF9F5] rounded-xl px-2.5 py-1.5 border border-slate-200/70 hover:border-blue-200 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0086FF] shrink-0" />
                  <span className="font-semibold text-[11px]">Poder de compra à vista</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 bg-[#FAF9F5] rounded-xl px-2.5 py-1.5 border border-slate-200/70 hover:border-blue-200 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0086FF] shrink-0" />
                  <span className="font-semibold text-[11px]">Assessoria em assembleias</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: O SIMULADOR NO TOPO (AÇÃO IMEDIATA) */}
          <div className="lg:col-span-6 flex flex-col justify-start relative pt-1">
            {/* Efeito Glow discreto atrás do simulador */}
            <div className="absolute -inset-1.5 bg-[#0086FF]/10 rounded-3xl blur-2xl pointer-events-none" />

            <div className="relative z-10 w-full rounded-3xl overflow-hidden border border-blue-200 shadow-xl shadow-blue-100/50 bg-white">
              {/* Header do Simulador — Azul Magalu sólido com animação de pulso no indicador */}
              <div className="px-5 py-3.5 bg-[#0086FF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Simulador Especialista Magalu
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/20 text-white border border-white/30 font-bold">
                  Condição Ativa
                </span>
              </div>

              {/* O COMPONENTE DO SIMULADOR */}
              <div className="p-2 sm:p-4">
                <ConsortiumSimulator compact={true} onSimulateSubmit={onSimulateSubmit} />
              </div>
            </div>
          </div>

        </div>

        {/* FAIXA DE CREDIBILIDADE INSTITUCIONAL INFERIOR COM LOGOS OFICIAIS */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl py-3 px-3 shadow-xs border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="bg-[#0086FF] px-2.5 py-1 rounded-xl mb-1 flex items-center justify-center">
              <img src={magaluLogo} alt="Consórcio Magalu" className="h-5 w-auto object-contain" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Tradição & Solidez Magalu</span>
          </div>

          <a 
            href="https://www.bcb.gov.br/estabilidadefinanceira/consorcios" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center bg-white rounded-2xl py-3 px-3 shadow-xs border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <img src="/logo-bacen.svg" alt="Banco Central do Brasil" className="h-6 w-auto object-contain mb-1 group-hover:scale-105 transition-transform" />
            <span className="text-xs text-slate-500 font-medium">100% Fiscalizado pelo Bacen</span>
          </a>

          <div className="flex flex-col items-center justify-center bg-white rounded-2xl py-3 px-3 shadow-xs border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all">
            <span className="text-lg font-black text-emerald-600">Zero Juros</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5">Sem cobrança bancária abusiva</span>
          </div>

          <a 
            href="https://www.abac.org.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center bg-white rounded-2xl py-3 px-3 shadow-xs border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <img src="/logo-abac.svg" alt="ABAC" className="h-6 w-auto object-contain mb-1 group-hover:scale-105 transition-transform" />
            <span className="text-xs text-slate-500 font-medium">Filiado Oficial ABAC</span>
          </a>
        </div>

      </div>
    </section>
  );
};

export default Hero;