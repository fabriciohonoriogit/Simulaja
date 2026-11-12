import React, { useState, useEffect } from "react";
import { Sparkles, Clock, Flame, ShieldAlert, Zap } from "lucide-react";
import { getBlackFridayRemainingTime, BlackFridayRemaining } from "@/utils/blackFridayTheme";

interface BlackFridayBannerProps {
  compact?: boolean;
  className?: string;
  showPosterThumbnail?: boolean;
}

export const BlackFridayBanner: React.FC<BlackFridayBannerProps> = ({
  compact = false,
  className = "",
  showPosterThumbnail = true,
}) => {
  const [remaining, setRemaining] = useState<BlackFridayRemaining>(getBlackFridayRemainingTime());
  const [showPosterModal, setShowPosterModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getBlackFridayRemainingTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (remaining.isExpired) {
    return null;
  }

  if (compact) {
    return (
      <div
        className={`w-full bg-gradient-to-r from-[#030712] via-[#0b1329] to-[#030712] border-y border-cyan-500/30 text-white py-2 px-3 flex flex-wrap items-center justify-between gap-2 shadow-[0_0_20px_rgba(0,229,255,0.15)] ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-pink-400">
            Black das Blacks Magalu
          </span>
          <span className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Menores Parcelas do Ano
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold text-cyan-300">
          <Clock className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span className="text-slate-400 font-sans text-[10px] uppercase tracking-wider hidden xs:inline">Encerra em:</span>
          <span className="bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-200">
            {remaining.days}d {String(remaining.hours).padStart(2, "0")}h {String(remaining.minutes).padStart(2, "0")}m {String(remaining.seconds).padStart(2, "0")}s
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`w-full rounded-2xl relative overflow-hidden border border-cyan-500/40 bg-gradient-to-br from-[#020617] via-[#091534] to-[#020617] text-white p-4 sm:p-5 shadow-[0_0_30px_rgba(0,229,255,0.2)] mb-6 ${className}`}
      >
        {/* Neon Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-pink-500 to-cyan-400 animate-pulse" />

        {/* Ambient Glow Orbs */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left: Branding & Headline */}
          <div className="flex items-center gap-3 sm:gap-4 text-center md:text-left">
            {showPosterThumbnail && (
              <div
                onClick={() => setShowPosterModal(true)}
                className="cursor-pointer group relative shrink-0 rounded-xl overflow-hidden border border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-transform hover:scale-105 active:scale-95"
                title="Ver cartaz Black das Blacks"
              >
                <img
                  src="/black-das-blacks.jpg"
                  alt="Black das Blacks Consórcio Magalu"
                  className="w-14 h-20 sm:w-16 sm:h-24 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[9px] font-bold text-cyan-300">
                  Ampliar
                </div>
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  <Flame className="w-3 h-3 text-pink-400" />
                  Consórcio Magalu
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-400/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  Edição Limitada 2026
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase leading-none drop-shadow-md">
                BLACK DAS{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-cyan-300">
                  BLACKS
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 leading-snug max-w-xl">
                Simulador operando com as <strong className="text-cyan-300 font-bold">menores parcelas do ano</strong> (Promocional, 50/50, Linear e Golden).
              </p>
            </div>
          </div>

          {/* Right: Countdown Counter */}
          <div className="flex flex-col items-center md:items-end shrink-0 w-full md:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-pink-400" />
              Oferta Válida Até 30/11:
            </span>

            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl px-2.5 py-1.5 min-w-[50px] shadow-inner">
                <span className="block text-base sm:text-lg font-black font-mono text-cyan-300 leading-none">
                  {remaining.days}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Dias</span>
              </div>
              <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl px-2.5 py-1.5 min-w-[50px] shadow-inner">
                <span className="block text-base sm:text-lg font-black font-mono text-cyan-300 leading-none">
                  {String(remaining.hours).padStart(2, "0")}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Horas</span>
              </div>
              <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl px-2.5 py-1.5 min-w-[50px] shadow-inner">
                <span className="block text-base sm:text-lg font-black font-mono text-cyan-300 leading-none">
                  {String(remaining.minutes).padStart(2, "0")}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Min</span>
              </div>
              <div className="bg-slate-900/90 border border-pink-500/50 rounded-xl px-2.5 py-1.5 min-w-[50px] shadow-inner">
                <span className="block text-base sm:text-lg font-black font-mono text-pink-400 leading-none animate-pulse">
                  {String(remaining.seconds).padStart(2, "0")}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Seg</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Poster Modal */}
      {showPosterModal && (
        <div
          onClick={() => setShowPosterModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm sm:max-w-md w-full bg-[#040B16] border border-cyan-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.4)]"
          >
            <button
              onClick={() => setShowPosterModal(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/70 text-white font-bold flex items-center justify-center hover:bg-black/90 border border-white/20"
            >
              ✕
            </button>
            <img
              src="/black-das-blacks.jpg"
              alt="Cartaz Black das Blacks Consórcio Magalu"
              className="w-full h-auto object-contain max-h-[80vh]"
            />
            <div className="p-3 text-center bg-slate-950 border-t border-cyan-500/30">
              <p className="text-xs font-bold text-cyan-300">Consórcio Magalu · Campanha Black das Blacks</p>
              <p className="text-[10px] text-slate-400">Condições promocionais válidas até 30 de Novembro de 2026</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

