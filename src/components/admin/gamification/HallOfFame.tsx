import { Card } from '../../ui/card';
import { Trophy, Medal } from 'lucide-react';

const mockRanking = [
  { rank: 1, name: 'João Silva', comissao: 12500, avatar: 'JS' },
  { rank: 2, name: 'Você', comissao: 8400, avatar: 'EU', isUser: true },
  { rank: 3, name: 'Maria Santos', comissao: 7200, avatar: 'MS' },
  { rank: 4, name: 'Pedro Costa', comissao: 4100, avatar: 'PC' },
  { rank: 5, name: 'Ana Oliveira', comissao: 3200, avatar: 'AO' },
];

export function HallOfFame() {
  return (
    <Card className="bg-card text-card-foreground border-border p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg">
          <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
        </div>
        <h3 className="font-bold text-foreground text-lg">Hall da Fama</h3>
      </div>

      <div className="space-y-3 flex-1">
        {mockRanking.map((user) => (
          <div 
            key={user.rank}
            className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
              user.isUser ? 'bg-secondary border border-border' : 'hover:bg-secondary/50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
              user.rank === 1 ? 'bg-yellow-500 text-white dark:text-yellow-950' : 
              user.rank === 2 ? 'bg-zinc-300 text-zinc-800 dark:text-zinc-900' : 
              user.rank === 3 ? 'bg-orange-400 text-white dark:text-orange-950' : 
              'bg-muted text-muted-foreground'
            }`}>
              {user.rank <= 3 ? <Medal className="w-4 h-4" /> : user.rank}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate ${user.isUser ? 'text-foreground' : 'text-muted-foreground'}`}>
                {user.name} {user.isUser && '(Você)'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(user.comissao)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
