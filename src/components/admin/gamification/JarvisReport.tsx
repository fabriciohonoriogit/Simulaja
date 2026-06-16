import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, BrainCircuit } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface JarvisReportProps {
  leads: any[];
  carteira: any[];
  inadimplentes: any[];
  realizadoMes: number;
  metaMensal: number;
}

export function JarvisReport({ leads, carteira, inadimplentes, realizadoMes, metaMensal }: JarvisReportProps) {
  const inadimplentesAtivos = inadimplentes.filter(i => i.status !== 'regularizado').length;
  const percentInadimplencia = carteira.length > 0 ? (inadimplentesAtivos / carteira.length) * 100 : 0;
  const faltanteMeta = Math.max(0, metaMensal - realizadoMes);
  const progresso = metaMensal > 0 ? (realizadoMes / metaMensal) * 100 : 0;

  const quentes = leads.filter(l => l.lead_temperatura === 'quente' && l.status !== 'fechado' && l.status !== 'morto').length;
  const semContato = leads.filter(l => (l.status === 'novo' || l.status === 'novo_lead')).length;

  const today = new Date();
  const isMorning = today.getHours() < 12;
  const greeting = isMorning ? "Bom dia, Estrategista." : "Olá, Estrategista.";

  return (
    <Card className="shadow-sm border-indigo-200 bg-gradient-to-br from-slate-900 to-indigo-950 text-white lg:col-span-2 h-full">
      <CardHeader className="pb-2 border-b border-indigo-800/50">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-indigo-100 font-bold uppercase tracking-wide">
          <BrainCircuit className="h-5 w-5 text-indigo-400" /> Relatório Diário J.A.R.V.I.S.
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col justify-center">
        <div className="space-y-4">
          <p className="text-sm text-indigo-200/90 leading-relaxed">
            <strong className="text-white">{greeting}</strong> Aqui está a análise da sua operação focada em metas e retenção:
          </p>
          
          <div className="bg-indigo-900/40 p-4 rounded-xl border border-indigo-700/50 text-sm text-indigo-100 leading-relaxed shadow-inner">
            <div className="space-y-3">
              <p>
                🎯 <strong className="text-white">Meta:</strong> Estamos com <strong className="text-emerald-400">{progresso.toFixed(1)}%</strong> atingida. 
                {faltanteMeta > 0 ? ` Faltam ${formatCurrency(faltanteMeta)} para o objetivo.` : ' Meta batida! Excelente trabalho.'}
              </p>
              <p>
                🔥 <strong className="text-white">CRM:</strong> Temos <strong className="text-amber-400">{quentes} leads quentes</strong> aguardando fechamento e <strong className="text-blue-400">{semContato} novos leads</strong> sem contato. Priorize essas oportunidades hoje.
              </p>
              <p>
                ⚠️ <strong className="text-white">Carteira:</strong> A inadimplência está em <strong className={percentInadimplencia > 5 ? "text-red-400" : "text-emerald-400"}>{percentInadimplencia.toFixed(1)}%</strong> ({inadimplentesAtivos} contratos em risco). 
                {percentInadimplencia > 5 ? ' Ação imediata de cobrança necessária para evitar perdas.' : ' Taxa controlada, mantenha o bom relacionamento.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-indigo-400/80 uppercase font-bold tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Análise atualizada hoje às 08:00</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
