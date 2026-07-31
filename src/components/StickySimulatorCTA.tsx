import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Sticky header with CTA for the simulator.
 * Appears after 600px of scroll to encourage conversion.
 */
export const StickySimulatorCTA = () => {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 600);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSimulator = () => {
    const simElement = document.getElementById("simulator");
    if (simElement) {
      simElement.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "#simulator";
    }
  };

  if (!showSticky) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-[69px] left-0 right-0 z-[40] bg-[#0F172A]/95 backdrop-blur-md border-b border-amber-500/20 shadow-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider hidden sm:block">Simulador Inteligente</p>
            <p className="text-white font-extrabold text-xs sm:text-sm">Pronto para encontrar a melhor estratégia de consórcio?</p>
          </div>
        </div>
        
        <button 
          onClick={scrollToSimulator}
          className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          <span>Simular Agora</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

