import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGamificationStore } from '../../../stores/gamificationStore';
import { Crown } from 'lucide-react';
import { PATENTES_CONFIG } from '../../../types/gamification';

export function LevelUpModal() {
  const { showLevelUpModal, patenteAtual, closeLevelUpModal, previousPatente } = useGamificationStore();

  useEffect(() => {
    if (showLevelUpModal) {
      // Fire confetti
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#eab308', '#a855f7', '#3b82f6']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#eab308', '#a855f7', '#3b82f6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      // Play a sound (if available in public/assets or base64)
      // const audio = new Audio('/assets/level-up.mp3');
      // audio.play().catch(e => console.log('Audio play failed', e));

      frame();
    }
  }, [showLevelUpModal]);

  const config = PATENTES_CONFIG[patenteAtual];

  return (
    <AnimatePresence>
      {showLevelUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeLevelUpModal}
          />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -50 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -inset-10 opacity-20 blur-3xl rounded-full ${config?.cor || 'bg-yellow-500'}`} />

            <div className="relative z-10 flex flex-col items-center">
              <motion.div 
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`p-4 rounded-full bg-zinc-800/50 mb-6 border-2 border-zinc-700`}
              >
                <Crown className="w-16 h-16 text-yellow-500" />
              </motion.div>

              <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">PARABÉNS!</h2>
              <p className="text-xl text-zinc-300 mb-6">
                Você evoluiu para <span className={`inline-block px-3.5 py-1.5 rounded-md text-white font-black uppercase ${config?.cor || 'bg-yellow-500'}`}>{patenteAtual === 'STONE' ? 'STONE (PEDRA)' : patenteAtual === 'GOLD' ? 'GOLD (OURO)' : patenteAtual}</span>.
              </p>

              <div className="bg-black/30 rounded-lg p-6 mb-8 w-full border border-zinc-800/50">
                <p className="text-zinc-400 mb-2">
                  Suas vendas mensais superaram a meta anterior!
                </p>
                {config?.next && (
                  <p className="text-sm font-medium text-white">
                    Continue avançando rumo ao nível <span className="text-orange-500 font-bold">{config.next === 'STONE' ? 'STONE (PEDRA)' : config.next === 'GOLD' ? 'GOLD (OURO)' : config.next}</span>.
                  </p>
                )}
              </div>

              <button
                onClick={closeLevelUpModal}
                className={`px-8 py-4 rounded-xl font-bold text-white text-lg transition-transform hover:scale-105 active:scale-95 shadow-lg ${config?.cor || 'bg-yellow-500'}`}
              >
                Continuar Jornada
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
