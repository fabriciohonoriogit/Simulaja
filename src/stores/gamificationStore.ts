import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Patente, UserGamificationState, BossDaSemana } from '../types/gamification';
import { obterPatentePorVenda } from '../lib/gamificationUtils';

interface GamificationStore extends UserGamificationState {
  showLevelUpModal: boolean;
  previousPatente: Patente | null;
  setComissaoAtual: (comissao: number) => void;
  setProducaoMes: (producao: number) => void;
  closeLevelUpModal: () => void;
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  desbloquearConquista: (id: string) => void;
  bossDaSemanaAtual: BossDaSemana | null;
}

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => ({
      patenteAtual: 'STONE',
      previousPatente: null,
      comissaoMensalAtual: 0,
      producaoMes: 0,
      showLevelUpModal: false,
      xp: 0,
      streak: {
        diasAtuais: 0,
        maiorSequencia: 0,
        ultimaAcao: null,
        riscoDePerda: false,
      },
      conquistas: [],
      bossDaSemanaAtual: {
        id: 'boss_1',
        titulo: 'BOSS DA SEMANA',
        descricao: 'Semana do Fechamento Agressivo',
        recompensa: '+20% de XP e Badge Especialista em Lances',
        prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metas: [
          { nome: 'Novos Contatos', alvo: 30, atual: 12 },
          { nome: 'Simulações', alvo: 10, atual: 4 },
          { nome: 'Propostas', alvo: 3, atual: 1 },
          { nome: 'Vendas', alvo: 1, atual: 0 },
        ]
      },

      setComissaoAtual: (comissao: number) => {
        set({ comissaoMensalAtual: comissao });
      },

      setProducaoMes: (producao: number) => {
        const { patenteAtual } = get();
        const novaPatente = obterPatentePorVenda(producao);
        
        let showModal = false;
        let previous = patenteAtual;

        // Se subiu de patente
        if (novaPatente !== patenteAtual && producao > get().producaoMes) {
          const order: Patente[] = ['STONE', 'GOLD', 'CROMO', 'TITÂNIO', 'PLATINA', 'DIAMANTE'];
          if (order.indexOf(novaPatente) > order.indexOf(patenteAtual)) {
            showModal = true;
          }
        }

        set({
          producaoMes: producao,
          patenteAtual: novaPatente,
          showLevelUpModal: showModal,
          previousPatente: showModal ? previous : get().previousPatente
        });
      },
      
      closeLevelUpModal: () => set({ showLevelUpModal: false, previousPatente: null }),
      
      addXP: (amount: number) => set((state) => ({ xp: state.xp + amount })),
      
      incrementStreak: () => set((state) => {
        const hoje = new Date().toISOString().split('T')[0];
        if (state.streak.ultimaAcao === hoje) return state; // Já prospectou hoje
        
        const novosDias = state.streak.diasAtuais + 1;
        return {
          streak: {
            ...state.streak,
            diasAtuais: novosDias,
            maiorSequencia: Math.max(state.streak.maiorSequencia, novosDias),
            ultimaAcao: hoje,
            riscoDePerda: false
          }
        };
      }),
      
      resetStreak: () => set((state) => ({
        streak: {
          ...state.streak,
          diasAtuais: 0,
          riscoDePerda: false
        }
      })),

      desbloquearConquista: (id: string) => set((state) => {
        const conquistas = state.conquistas.map(c => 
          c.id === id ? { ...c, desbloqueada: true, dataDesbloqueio: new Date().toISOString() } : c
        );
        return { conquistas };
      }),
    }),
    {
      name: 'contemplar-gamification-storage',
      version: 2,
      partialize: (state) => ({
        patenteAtual: state.patenteAtual,
        previousPatente: state.previousPatente,
        xp: state.xp,
        streak: state.streak,
        conquistas: state.conquistas,
        bossDaSemanaAtual: state.bossDaSemanaAtual,
      }),
      migrate: (persistedState: any, version: number) => {
        if (persistedState) {
          persistedState.producaoMes = 0;
          persistedState.comissaoMensalAtual = 0;
          if (persistedState.patenteAtual === 'INICIANTE' || !persistedState.patenteAtual) {
            persistedState.patenteAtual = 'STONE';
          }
          if (persistedState.previousPatente === 'INICIANTE') {
            persistedState.previousPatente = null;
          }
        }
        return persistedState;
      }
    }
  )
);

// Auto-correction timeout to clean legacy local storage states on load
setTimeout(() => {
  try {
    const state = useGamificationStore.getState();
    const legacyValue = 'INICIANTE' as any;
    const updates: Partial<GamificationStore> = {};
    if (state.patenteAtual === legacyValue) {
      updates.patenteAtual = 'STONE';
    }
    if (state.previousPatente === legacyValue) {
      updates.previousPatente = null;
    }
    if (Object.keys(updates).length > 0) {
      useGamificationStore.setState(updates);
    }
  } catch (e) {
    console.error("Migration error:", e);
  }
}, 50);
