import { useGamificationStore } from '../../../stores/gamificationStore';
import { calcularProgressoProximaPatente } from '../../../lib/gamificationUtils';
import { PATENTES_CONFIG } from '../../../types/gamification';
import { Trophy, TrendingUp, Target } from 'lucide-react';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';

const PATENTE_EMOJIS: Record<string, string> = {
  'STONE': '🪨',
  'GOLD': '👑',
  'CROMO': '🥈',
  'TITÂNIO': '🛡️',
  'PLATINA': '💿',
  'DIAMANTE': '💎'
};

export function DashboardHero() {
  const { patenteAtual, comissaoMensalAtual, producaoMes } = useGamificationStore();
  const config = PATENTES_CONFIG[patenteAtual] || PATENTES_CONFIG['STONE'];
  const proximaPatente = config.next;
  const progresso = calcularProgressoProximaPatente(producaoMes, patenteAtual);
  
  const faltam = config.next && PATENTES_CONFIG[config.next] ? PATENTES_CONFIG[config.next].min - producaoMes : 0;

  return (
    <Card className="relative overflow-hidden border border-border bg-card text-card-foreground shadow-sm">
      {/* Decorative background glow */}
      <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-10 ${config.cor}`} />
      
      <div className="relative z-10 p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Patente Atual */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Ranking Elite Atual
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-md text-sm font-black uppercase tracking-wider ${config.cor} flex items-center gap-2 shadow-sm`}>
                <span className="text-lg leading-none">{PATENTE_EMOJIS[patenteAtual] || '⭐'}</span> {patenteAtual === 'STONE' ? 'STONE (PEDRA)' : patenteAtual === 'GOLD' ? 'GOLD (OURO)' : patenteAtual}
              </span>
            </div>
          </div>

          {/* Comissão Recorrente */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-500" />
              Comissão Recorrente
            </span>
            <span className="text-3xl font-black text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comissaoMensalAtual)}
              <span className="text-lg text-muted-foreground font-normal">/mês</span>
            </span>
          </div>

          {/* Produção do Mês */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Vendas do Mês (Realizado)
            </span>
            <span className="text-2xl font-bold text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(producaoMes)}
            </span>
          </div>

          {/* Próxima Patente */}
          <div className="flex flex-col gap-3 justify-end">
            {proximaPatente ? (
              <>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    Rumo a {proximaPatente === 'STONE' ? 'STONE (PEDRA)' : proximaPatente === 'GOLD' ? 'GOLD (OURO)' : proximaPatente}
                  </span>
                  <span className="text-xs text-muted-foreground font-bold">{progresso}%</span>
                </div>
                <Progress value={progresso} className="h-2 bg-secondary" indicatorClassName={config.cor} />
                <span className="text-xs text-muted-foreground">
                  Faltam <strong className="text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faltam)} em Vendas</strong>
                </span>
              </>
            ) : (
              <div className="flex flex-col gap-2 items-center justify-center h-full">
                <span className="text-3xl">💎</span>
                <span className="text-sm font-bold text-amber-600">Nível Máximo Alcançado</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </Card>
  );
}
