export type Patente = 'STONE' | 'GOLD' | 'CROMO' | 'TITÂNIO' | 'PLATINA' | 'DIAMANTE';

export interface GamificationLimits {
  min: number;
  max: number;
  next: Patente | null;
  cor: string;
  premioBase: number;
  bonusLinear: number;
  bonusSeguro: number;
  bonusAlianca: number;
}

export const PATENTES_CONFIG: Record<Patente, GamificationLimits> = {
  'STONE': { min: 0, max: 499999, next: 'GOLD', cor: 'bg-gradient-to-r from-slate-500 via-neutral-400 to-zinc-500 text-white border border-slate-400', premioBase: 0, bonusLinear: 0, bonusSeguro: 0, bonusAlianca: 0 },
  'GOLD': { min: 500000, max: 1499999, next: 'CROMO', cor: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-white border border-amber-400', premioBase: 0, bonusLinear: 0, bonusSeguro: 0, bonusAlianca: 0 },
  'CROMO': { min: 1500000, max: 2999999, next: 'TITÂNIO', cor: 'bg-gradient-to-r from-slate-400 via-slate-300 to-slate-500 text-slate-900 border border-slate-300', premioBase: 1200, bonusLinear: 800, bonusSeguro: 800, bonusAlianca: 800 },
  'TITÂNIO': { min: 3000000, max: 3999999, next: 'PLATINA', cor: 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 text-white', premioBase: 3000, bonusLinear: 1200, bonusSeguro: 1200, bonusAlianca: 1200 },
  'PLATINA': { min: 4000000, max: 4999999, next: 'DIAMANTE', cor: 'bg-gradient-to-r from-zinc-300 via-slate-100 to-zinc-400 text-slate-900 border border-zinc-300', premioBase: 5000, bonusLinear: 1400, bonusSeguro: 1400, bonusAlianca: 1400 },
  'DIAMANTE': { min: 5000000, max: Infinity, next: null, cor: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white', premioBase: 8000, bonusLinear: 1600, bonusSeguro: 1600, bonusAlianca: 1600 }
};

export interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  desbloqueada: boolean;
  dataDesbloqueio?: string;
}

export interface BossDaSemana {
  id: string;
  titulo: string;
  descricao: string;
  recompensa: string;
  metas: {
    nome: string;
    alvo: number;
    atual: number;
  }[];
  prazo: string;
}

export interface StreakInfo {
  diasAtuais: number;
  maiorSequencia: number;
  ultimaAcao: string | null;
  riscoDePerda: boolean;
}

export interface UserGamificationState {
  patenteAtual: Patente;
  comissaoMensalAtual: number;
  producaoMes: number;
  conquistas: Conquista[];
  streak: StreakInfo;
  xp: number;
}
