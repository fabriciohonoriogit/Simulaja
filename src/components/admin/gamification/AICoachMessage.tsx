import { useGamificationStore } from '../../../stores/gamificationStore';
import { PATENTES_CONFIG } from '../../../types/gamification';
import { Sparkles } from 'lucide-react';

export function AICoachMessage() {
  const { patenteAtual, producaoMes } = useGamificationStore();
  const config = PATENTES_CONFIG[patenteAtual] || PATENTES_CONFIG['STONE'];
  const proximaPatente = config.next;
  
  if (!proximaPatente) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex gap-4 items-start shadow-sm">
        <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-full shrink-0">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 dark:text-amber-100">Parabéns!</h4>
          <p className="text-amber-800 dark:text-amber-200 text-sm mt-1">
            Você atingiu o nível máximo <strong className="text-amber-900 dark:text-amber-400">DIAMANTE</strong> no Ranking de Excelência Varejo! Continue mantendo esse padrão de excelência nas suas entregas.
          </p>
        </div>
      </div>
    );
  }

  const configProxima = PATENTES_CONFIG[proximaPatente] || PATENTES_CONFIG['GOLD'];
  const faltam = configProxima.min - producaoMes;
  const corTextColor = configProxima.cor ? configProxima.cor.split(' ')[0].replace('bg-', 'text-').replace('from-', 'text-') : 'text-slate-500';
  
  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 flex gap-4 items-start shadow-sm">
      <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-full shrink-0">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <h4 className="font-bold text-indigo-950 dark:text-zinc-100">Insights do Jarvis</h4>
        <p className="text-indigo-900/80 dark:text-zinc-300 text-sm mt-1 leading-relaxed">
          Você está a apenas <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faltam)}</strong> em vendas para alcançar o patamar <strong className={`font-bold uppercase ${corTextColor}`}>{proximaPatente === 'STONE' ? 'STONE (PEDRA)' : proximaPatente === 'GOLD' ? 'GOLD (OURO)' : proximaPatente}</strong>.
          <br/>
          Foque em alavancar o RPC e a venda de Seguro para garantir também as premiações adicionais neste mês.
        </p>
      </div>
    </div>
  );
}
