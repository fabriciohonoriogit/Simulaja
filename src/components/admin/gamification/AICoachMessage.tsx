import { useGamificationStore } from '../../../stores/gamificationStore';
import { PATENTES_CONFIG } from '../../../types/gamification';
import { Sparkles } from 'lucide-react';

export function AICoachMessage() {
  const { patenteAtual, comissaoMensalAtual } = useGamificationStore();
  const config = PATENTES_CONFIG[patenteAtual];
  const proximaPatente = config.next;
  
  if (!proximaPatente) {
    return (
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 flex gap-4 items-start shadow-inner">
        <div className="p-2 bg-yellow-500/20 rounded-full shrink-0">
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h4 className="font-bold text-zinc-100">Bom dia!</h4>
          <p className="text-zinc-300 text-sm mt-1">
            Você atingiu o nível máximo <strong className="text-yellow-400">LENDA</strong>. Continue fechando vendas para manter seu legado!
          </p>
        </div>
      </div>
    );
  }

  const faltam = PATENTES_CONFIG[proximaPatente].min - comissaoMensalAtual;
  
  return (
    <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 flex gap-4 items-start shadow-inner">
      <div className="p-2 bg-indigo-500/20 rounded-full shrink-0">
        <Sparkles className="w-5 h-5 text-indigo-400" />
      </div>
      <div>
        <h4 className="font-bold text-zinc-100">Bom dia!</h4>
        <p className="text-zinc-300 text-sm mt-1 leading-relaxed">
          Você está a apenas <strong className="text-indigo-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faltam)}/mês</strong> em comissão para alcançar a patente <strong className={`font-bold ${PATENTES_CONFIG[proximaPatente].cor.replace('bg-', 'text-')}`}>{proximaPatente}</strong>.
          <br/>
          Existem 3 propostas abertas que podem cobrir essa diferença. Recomendo entrar em contato com esses clientes hoje.
        </p>
      </div>
    </div>
  );
}
