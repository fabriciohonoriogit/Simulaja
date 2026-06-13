import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SimulacaoData, SimulacaoSchema } from "@/schemas/simulacao";
import { GRUPOS, CATEGORIAS, Category, GrupoItem } from "@/constants/simulador";

// Tipagem para simulação registrada no histórico
export interface HistoricoItem extends SimulacaoData {
  id: string;
  data_simulacao: string;
}

interface SimuladorState {
  categorias: Category[];
  grupos: Record<string, GrupoItem[]>;
  simulacao_atual: SimulacaoData | null;
  historico: HistoricoItem[];
  
  // Actions
  setValoresTabela: (categorias: Category[], grupos: Record<string, GrupoItem[]>) => void;
  salvarSimulacao: (simulacao: SimulacaoData) => void;
  validarSimulacao: (simulacaoRaw: any) => SimulacaoData | null;
  limparHistorico: () => void;
}

export const useSimuladorStore = create<SimuladorState>()(
  persist(
    (set, get) => ({
      // Estado Inicial (usando fallback dos dados locais)
      categorias: CATEGORIAS,
      grupos: GRUPOS,
      simulacao_atual: null,
      historico: [],

      setValoresTabela: (categorias, grupos) => set({ categorias, grupos }),

      validarSimulacao: (simulacaoRaw) => {
        try {
          const dadosValidados = SimulacaoSchema.parse(simulacaoRaw);
          set({ simulacao_atual: dadosValidados });
          return dadosValidados;
        } catch (error) {
          console.error("Erro de Validação Zod na Simulação:", error);
          return null;
        }
      },

      salvarSimulacao: (simulacao) => {
        const item: HistoricoItem = {
          ...simulacao,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 10),
          data_simulacao: new Date().toISOString(),
        };
        set((state) => ({
          historico: [item, ...state.historico].slice(0, 50), // guarda os últimos 50
        }));
      },

      limparHistorico: () => set({ historico: [] }),
    }),
    {
      name: "simulador-storage",
      partialize: (state) => ({ historico: state.historico }), // persiste apenas o histórico
    }
  )
);
