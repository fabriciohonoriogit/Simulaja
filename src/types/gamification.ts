export type Patente = 'BABY' | 'JÚNIOR' | 'PRO' | 'ESPECIALISTA' | 'ELITE' | 'LENDA';

export interface GamificationLimits {
  min: number;
  max: number;
  next: Patente | null;
  cor: string;
}

export const PATENTES_CONFIG: Record<Patente, GamificationLimits> = {
  'BABY': { min: 200, max: 500, next: 'JÚNIOR', cor: 'bg-blue-400' },
  'JÚNIOR': { min: 501, max: 1000, next: 'PRO', cor: 'bg-indigo-500' },
  'PRO': { min: 1001, max: 2000, next: 'ESPECIALISTA', cor: 'bg-orange-500' },
  'ESPECIALISTA': { min: 2001, max: 5000, next: 'ELITE', cor: 'bg-red-500' },
  'ELITE': { min: 5001, max: 10000, next: 'LENDA', cor: 'bg-purple-500' },
  'LENDA': { min: 10001, max: Infinity, next: null, cor: 'bg-yellow-400' }
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
