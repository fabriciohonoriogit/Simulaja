import { Card } from '../../ui/card';
import { Trophy, Medal } from 'lucide-react';

interface RankingItem {
  id: string;
  nome: string;
  avatar?: string | null;
  total: number;
  comissao?: number;
}

export function HallOfFame({ ranking = [], profileId }: { ranking?: RankingItem[], profileId?: string }) {
  // Se não houver ninguém com vendas no mês ainda, mostra um estado vazio amigável
  const rankingValido = ranking.length > 0 ? ranking : [];

  return (
    <Card className="bg-card text-card-foreground border-border p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg">
          <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
        </div>
        <h3 className="font-bold text-foreground text-lg">Hall da Fama</h3>
      </div>

      <div className="space-y-3 flex-1">
        {rankingValido.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-50 pb-4">
            <Medal className="w-8 h-8 mb-2" />
            <p className="text-sm">Nenhuma venda registrada este mês.</p>
            <p className="text-xs">Seja o primeiro do Hall da Fama!</p>
          </div>
        ) : (
          rankingValido.map((user, index) => {
            const rank = index + 1;
            const isUser = user.id === profileId;
            // Estima a comissão de 4% se não tivermos o valor exato no ranking (fallback)
            const comissao = user.comissao !== undefined ? user.comissao : user.total * 0.04; 

            return (
              <div 
                key={user.id}
                className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                  isUser ? 'bg-secondary border border-border' : 'hover:bg-secondary/50'
                }`}
              >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
              rank === 1 ? 'bg-yellow-500 text-white dark:text-yellow-950' : 
              rank === 2 ? 'bg-zinc-300 text-zinc-800 dark:text-zinc-900' : 
              rank === 3 ? 'bg-orange-400 text-white dark:text-orange-950' : 
              'bg-muted text-muted-foreground'
            }`}>
              {rank <= 3 ? <Medal className="w-4 h-4" /> : rank}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate ${isUser ? 'text-foreground' : 'text-muted-foreground'}`}>
                {user.nome} {isUser && '(Você)'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(comissao)}
              </p>
            </div>
          </div>
        );
      })
      )}
      </div>
    </Card>
  );
}
