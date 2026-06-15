import { Card } from '../../ui/card';
import { AlertTriangle, Rocket } from 'lucide-react';
import { analisarDinheiroNaMesa } from '../../../lib/gamificationUtils';
import { useEffect, useState } from 'react';

// Na implementação real, os leads viriam de um hook/store (ex: useQuery dos leads do Supabase)
// Vamos simular por agora.
const mockLeads = [
  { status: 'proposta_enviada', valor_estimado: 120000 },
  { status: 'proposta_enviada', valor_estimado: 50000 },
  { status: 'em_negociacao', valor_estimado: 150000 }
];

export function MoneyOnTableCard() {
  const [analise, setAnalise] = useState({ quantidadeLeads: 0, potencialVendas: 0, potencialComissaoMensal: 0 });

  useEffect(() => {
    // Aqui seria a chamada real para calcular baseada nos dados atualizados do consultor
    setAnalise(analisarDinheiroNaMesa(mockLeads));
  }, []);

  if (analise.quantidadeLeads === 0) return null;

  return (
    <Card className="bg-red-500/10 border border-red-500/30 p-5 rounded-xl flex flex-col md:flex-row items-center gap-6 justify-between">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-500/20 rounded-full shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-red-400 mb-1 flex items-center gap-2">
            Dinheiro deixado na mesa
          </h3>
          <p className="text-sm text-zinc-300">
            Você tem <strong className="text-white">{analise.quantidadeLeads} leads quentes</strong> sem contato recente.
          </p>
          <div className="mt-2 text-sm flex items-center gap-4 text-zinc-400">
            <span>Vendas: <strong className="text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(analise.potencialVendas)}</strong></span>
            <span>Comissão Perfilada: <strong className="text-emerald-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(analise.potencialComissaoMensal)}/mês</strong></span>
          </div>
        </div>
      </div>
      
      <button className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap w-full md:w-auto justify-center shadow-[0_0_15px_rgba(220,38,38,0.3)]">
        <Rocket className="w-4 h-4" />
        RECUPERAR AGORA
      </button>
    </Card>
  );
}
