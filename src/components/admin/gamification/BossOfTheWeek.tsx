import { useGamificationStore } from '../../../stores/gamificationStore';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Gift } from 'lucide-react';

export function BossOfTheWeek() {
  const { bossDaSemanaAtual } = useGamificationStore();

  if (!bossDaSemanaAtual) return null;

  return (
    <Card className="bg-card text-card-foreground border-purple-200 dark:border-purple-500/30 overflow-hidden relative shadow-sm group">
      {/* Background Boss effects */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-100 dark:bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-200 dark:group-hover:bg-purple-600/20 transition-all duration-700" />
      
      <div className="p-5 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h3 className="font-extrabold text-foreground tracking-wide uppercase flex items-center gap-2">
              <span className="text-xl">👾</span> {bossDaSemanaAtual.titulo.replace(/👹/g, '').trim()}
            </h3>
            <p className="text-xs text-muted-foreground">{bossDaSemanaAtual.descricao}</p>
          </div>
        </div>

        <div className="space-y-4">
          {bossDaSemanaAtual.metas.map((meta, idx) => {
            const percentage = Math.min(100, Math.round((meta.atual / meta.alvo) * 100));
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">{meta.nome}</span>
                  <span className="text-muted-foreground font-mono text-xs">{meta.atual} / {meta.alvo}</span>
                </div>
                <Progress value={percentage} className="h-1.5 bg-secondary" indicatorClassName="bg-purple-500" />
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Recompensa:</span>
          </div>
          <span className="text-xs font-bold text-foreground bg-secondary px-2 py-1 rounded">{bossDaSemanaAtual.recompensa}</span>
        </div>
      </div>
    </Card>
  );
}
