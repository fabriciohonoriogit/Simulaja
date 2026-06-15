import { useGamificationStore } from '../../../stores/gamificationStore';
import { Card } from '../../ui/card';
import { Flame, AlertCircle } from 'lucide-react';

export function StreakCard() {
  const { streak } = useGamificationStore();
  
  const dias = streak.diasAtuais;
  const emRisco = streak.riscoDePerda || (dias > 0 && streak.ultimaAcao !== new Date().toISOString().split('T')[0]);

  let corChama = 'text-zinc-600';
  let bgChama = 'bg-zinc-800';
  let mensagem = 'Inicie sua jornada hoje!';

  if (dias >= 100) {
    corChama = 'text-blue-500';
    bgChama = 'bg-blue-500/20';
    mensagem = 'Lenda Viva!';
  } else if (dias >= 30) {
    corChama = 'text-purple-500';
    bgChama = 'bg-purple-500/20';
    mensagem = 'Inabalável!';
  } else if (dias >= 7) {
    corChama = 'text-orange-500';
    bgChama = 'bg-orange-500/20';
    mensagem = 'Pegando Fogo!';
  } else if (dias > 0) {
    corChama = 'text-yellow-500';
    bgChama = 'bg-yellow-500/20';
    mensagem = 'No Caminho Certo';
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-5 shadow-lg relative overflow-hidden">
      {/* Glow Effect */}
      {dias > 0 && (
        <div className={`absolute -right-8 -top-8 w-32 h-32 blur-3xl opacity-20 rounded-full ${bgChama.replace('/20', '')}`} />
      )}

      <div className="flex items-center justify-between relative z-10">
        <div>
          <h3 className="font-bold text-white mb-1">Sequência Ativa</h3>
          <p className="text-sm text-zinc-400">{mensagem}</p>
        </div>
        
        <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl ${bgChama} border border-zinc-700/50`}>
          <Flame className={`w-8 h-8 ${corChama} ${dias > 0 ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`} />
          <span className={`text-sm font-black ${corChama}`}>{dias}</span>
        </div>
      </div>

      {emRisco && dias > 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">
            Você ainda não prospectou hoje. Prospecte agora para não perder sua sequência de {dias} dias!
          </p>
        </div>
      )}
    </Card>
  );
}
