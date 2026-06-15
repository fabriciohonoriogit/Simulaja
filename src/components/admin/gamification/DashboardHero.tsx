import { useGamificationStore } from '../../../stores/gamificationStore';
import { calcularProgressoProximaPatente } from '../../../lib/gamificationUtils';
import { PATENTES_CONFIG } from '../../../types/gamification';
import { Trophy, TrendingUp, Target, Crown } from 'lucide-react';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';

export function DashboardHero() {
  const { patenteAtual, comissaoMensalAtual, producaoMes } = useGamificationStore();
  const config = PATENTES_CONFIG[patenteAtual];
  const proximaPatente = config.next;
  const progresso = calcularProgressoProximaPatente(comissaoMensalAtual, patenteAtual);
  
  const faltam = config.next ? PATENTES_CONFIG[config.next].min - comissaoMensalAtual : 0;

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-zinc-900 to-zinc-800 text-white shadow-xl">
      {/* Decorative background glow */}
      <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-20 ${config.cor}`} />
      
      <div className="relative z-10 p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Patente Atual */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              Patente Atual
            </span>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${config.cor} text-white`}>
                {patenteAtual}
              </span>
            </div>
          </div>

          {/* Comissão Recorrente */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-500" />
              Comissão Recorrente
            </span>
            <span className="text-3xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comissaoMensalAtual)}
              <span className="text-lg text-zinc-500 font-normal">/mês</span>
            </span>
          </div>

          {/* Produção do Mês */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Produção do Mês
            </span>
            <span className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(producaoMes)}
            </span>
          </div>

          {/* Próxima Patente */}
          <div className="flex flex-col gap-3 justify-end">
            {proximaPatente ? (
              <>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    Rumo a {proximaPatente}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">{progresso}%</span>
                </div>
                <Progress value={progresso} className="h-2 bg-zinc-700" indicatorClassName={config.cor} />
                <span className="text-xs text-zinc-400">
                  Faltam <strong className="text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faltam)}/mês</strong>
                </span>
              </>
            ) : (
              <div className="flex flex-col gap-2 items-center justify-center h-full">
                <Crown className="w-8 h-8 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">Nível Máximo Alcançado</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </Card>
  );
}
