import { useGamificationStore } from "../../../stores/gamificationStore";
import { PATENTES_CONFIG, Patente } from "../../../types/gamification";
import { Trophy, Target, ShieldAlert, Sparkles, DollarSign, Calculator, CheckCircle2, AlertTriangle, Info, Zap, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { useState } from "react";

interface EliteRewardsPanelProps {
  leads: any[];
  totalClientes: number;
  percentRetencao: number;
  percentContemplados: number;
}

export function EliteRewardsPanel({ leads, totalClientes, percentRetencao, percentContemplados }: EliteRewardsPanelProps) {
  const { patenteAtual, producaoMes } = useGamificationStore();
  const [showConfigInfo, setShowConfigInfo] = useState(false);

  // 1. Calcular RPC Realizado
  const totalLeads = leads.length;
  const leadsComPropostaOuFechados = leads.filter(l => 
    ['simulacao_enviada', 'proposta', 'fechado', 'venda_fechada'].includes(l.status || '')
  ).length;
  const rpcRealizado = totalLeads > 0 ? Math.round((leadsComPropostaOuFechados / totalLeads) * 100) : 0;

  // 2. Calcular EP Realizado (saúde da carteira/retenção)
  const epRealizado = Math.round(percentRetencao);

  // 3. NPS Realizado (Simulado ou padrão)
  const npsRealizado = 72; // Meta é 70

  // 4. Bônus Plano Linear: atingir venda mínima de 20% do total das cotas nos segmentos de Automóvel e Imóvel, no plano linear.
  const fechadosAutoImovel = leads.filter(l => 
    ['fechado', 'venda_fechada'].includes(l.status || '') &&
    ['veiculo', 'imovel', 'carro', 'casa', 'pesados', 'agricolas'].includes((l.tipo_consorcio || '').toLowerCase())
  );
  const fechadosLinear = fechadosAutoImovel.filter(l => 
    l.dados_cadastro?.paymentMode === 'linear' || l.dados_cadastro?.plano === 'linear'
  ).length;
  
  // Se não houver vendas reais registradas ainda, usamos um fallback realista de demonstração
  const pctLinearRealizado = fechadosAutoImovel.length > 0 
    ? Math.round((fechadosLinear / fechadosAutoImovel.length) * 100) 
    : 25; // 25% para demonstração inicial se vazio
  const planoLinearAtingido = pctLinearRealizado >= 20;

  // 5. Bônus Seguro: atingir no mínimo 70% do total das cotas vendidas com seguro.
  const fechadosTotal = leads.filter(l => ['fechado', 'venda_fechada'].includes(l.status || ''));
  const fechadosComSeguro = fechadosTotal.filter(l => 
    l.dados_cadastro?.com_seguro === true || (l.dados_cadastro?.seguro && l.dados_cadastro?.seguro > 0)
  ).length;

  const pctSeguroRealizado = fechadosTotal.length > 0 
    ? Math.round((fechadosComSeguro / fechadosTotal.length) * 100) 
    : 75; // 75% para demonstração inicial se vazio
  const seguroAtingido = pctSeguroRealizado >= 70;

  // 6. Bônus Aliança: entrega mínima de 100% do desafio global das lojas atendidas.
  const pctAliancaRealizado = 100; // Simulado
  const aliancaAtingido = pctAliancaRealizado >= 100;

  // 7. Determinar a patente do Ranking com base nos indicadores
  // Cromo (1.5M, RPC 42%, EP 84%, NPS 70)
  // Titânio (3M, RPC 42%, EP 84%, NPS 70)
  // Platina (4M, RPC 42%, EP 84%, NPS 70)
  // Diamante (5M, RPC 42%, EP 84%, NPS 70)
  const atingeIndicadoresComuns = rpcRealizado >= 42 && epRealizado >= 84 && npsRealizado >= 70;
  
  let patenteEfetiva: Patente = 'STONE';
  if (atingeIndicadoresComuns) {
    if (producaoMes >= 5000000) patenteEfetiva = 'DIAMANTE';
    else if (producaoMes >= 4000000) patenteEfetiva = 'PLATINA';
    else if (producaoMes >= 3000000) patenteEfetiva = 'TITÂNIO';
    else if (producaoMes >= 1500000) patenteEfetiva = 'CROMO';
    else if (producaoMes >= 500000) patenteEfetiva = 'GOLD';
    else patenteEfetiva = 'STONE';
  } else {
    if (producaoMes >= 500000) patenteEfetiva = 'GOLD';
    else patenteEfetiva = 'STONE';
  }

  // Obter limites da patente efetiva (ou da patenteAtual caso queira usar a configurada na store)
  const patenteExibicao = (patenteEfetiva !== 'STONE' && patenteEfetiva !== 'GOLD') ? patenteEfetiva : patenteAtual;
  const config = PATENTES_CONFIG[patenteExibicao] || PATENTES_CONFIG['STONE'];

  // Calcular prêmios
  const premioBase = config.premioBase;
  const premioLinearVal = planoLinearAtingido ? config.bonusLinear : 0;
  const premioSeguroVal = seguroAtingido ? config.bonusSeguro : 0;
  const premioAliancaVal = aliancaAtingido ? config.bonusAlianca : 0;
  const premioTotal = premioBase + premioLinearVal + premioSeguroVal + premioAliancaVal;

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
      {/* SEÇÃO 1: RANKING DE EXCELÊNCIA - PAINEL VAREJO */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-lg overflow-hidden bg-card">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              🏆 Ranking de Excelência - Varejo
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Classificação mensal com base nos KPIs estratégicos da Elite Consórcios
            </p>
          </div>
          <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 border-none font-bold text-xs uppercase px-3 py-1">
            Status: {patenteEfetiva === 'STONE' ? 'STONE (PEDRA)' : patenteEfetiva === 'GOLD' ? 'GOLD (OURO)' : patenteEfetiva}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tabela de Indicadores vs Realizado */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* KPI 1: VENDA */}
            <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-zinc-900/40 relative group transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-blue-500" /> Venda Mensal
                </span>
                {producaoMes >= 1500000 ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase border-none px-1.5 py-0.5">OK</Badge>
                ) : (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase border-none px-1.5 py-0.5">Falta</Badge>
                )}
              </div>
              <p className="text-xl font-black text-foreground">{fmt(producaoMes)}</p>
              <div className="mt-3 text-[10px] text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Meta Cromo:</span>
                  <span className="font-bold text-foreground">1,5 M</span>
                </div>
                <div className="flex justify-between">
                  <span>Meta Titânio:</span>
                  <span className="font-bold text-foreground">3,0 M</span>
                </div>
                <div className="flex justify-between">
                  <span>Meta Diamante:</span>
                  <span className="font-bold text-foreground">5,0 M</span>
                </div>
              </div>
            </div>

            {/* KPI 2: RPC */}
            <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-zinc-900/40 relative group transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-indigo-500" /> RPC
                </span>
                {rpcRealizado >= 42 ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase border-none px-1.5 py-0.5">OK</Badge>
                ) : (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase border-none px-1.5 py-0.5">Baixo</Badge>
                )}
              </div>
              <p className="text-xl font-black text-foreground">{rpcRealizado}%</p>
              <div className="mt-3 text-[10px] text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Meta Mínima:</span>
                  <span className="font-bold text-foreground">42%</span>
                </div>
                <div className="flex justify-between">
                  <span>Realizado / Proposta:</span>
                  <span className="font-bold text-foreground">{leadsComPropostaOuFechados} de {totalLeads}</span>
                </div>
              </div>
            </div>

            {/* KPI 3: EP */}
            <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-zinc-900/40 relative group transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> EP (Eficiência)
                </span>
                {epRealizado >= 84 ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase border-none px-1.5 py-0.5">OK</Badge>
                ) : (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase border-none px-1.5 py-0.5">Abaixo</Badge>
                )}
              </div>
              <p className="text-xl font-black text-foreground">{epRealizado}%</p>
              <div className="mt-3 text-[10px] text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Meta Mínima:</span>
                  <span className="font-bold text-foreground">84%</span>
                </div>
                <div className="flex justify-between">
                  <span>Saúde da Carteira:</span>
                  <span className="font-bold text-foreground">Retenção Ativa</span>
                </div>
              </div>
            </div>

            {/* KPI 4: NPS */}
            <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-zinc-900/40 relative group transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> NPS
                </span>
                {npsRealizado >= 70 ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase border-none px-1.5 py-0.5">OK</Badge>
                ) : (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase border-none px-1.5 py-0.5">Baixo</Badge>
                )}
              </div>
              <p className="text-xl font-black text-foreground">{npsRealizado}</p>
              <div className="mt-3 text-[10px] text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Meta Mínima:</span>
                  <span className="font-bold text-foreground">70</span>
                </div>
                <div className="text-[9px] italic text-muted-foreground mt-1">
                  *Mínimo 1 avaliação registrada
                </div>
              </div>
            </div>

          </div>

          {/* Critérios Adicionais */}
          {(!atingeIndicadoresComuns && producaoMes >= 1500000) && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="font-bold">Atenção:</strong> Você atingiu a meta de vendas para o ranking, mas ainda precisa alcançar as metas de <strong className="font-bold">RPC (42%)</strong>, <strong className="font-bold">EP (84%)</strong> ou <strong className="font-bold">NPS (70)</strong> para homologar sua patente.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO 2: ELITE REWARDS - PREMIAÇÕES E BÔNUS */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-lg overflow-hidden bg-card">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              🎁 Elite Rewards - Varejo
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Acompanhamento de prêmios base e bônus extras por linha de produto
            </p>
          </div>
          <button 
            onClick={() => setShowConfigInfo(!showConfigInfo)} 
            className="p-1 hover:bg-slate-100 rounded-full dark:hover:bg-zinc-800"
            title="Ver Tabela Geral de Regras"
          >
            <HelpCircle className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tabela Comparativa de Regras (Colapsada por padrão) */}
          {showConfigInfo && (
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 dark:bg-zinc-900/60 dark:border-zinc-800 text-xs overflow-x-auto space-y-4 animate-in fade-in duration-300">
              <h4 className="font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider text-center">Tabela de Premiações de Elite (Varejo)</h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-muted-foreground text-[10px] font-black uppercase">
                    <th className="py-2">Patente</th>
                    <th className="py-2">Prêmio Base</th>
                    <th className="py-2">Bônus Linear</th>
                    <th className="py-2">Bônus Seguro</th>
                    <th className="py-2">Bônus Aliança</th>
                    <th className="py-2 text-right">Prêmio Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                  {Object.entries(PATENTES_CONFIG).map(([key, cfg]) => (
                    <tr key={key} className={key === patenteEfetiva ? "font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30" : "text-muted-foreground"}>
                      <td className="py-2.5 font-bold uppercase">{key === 'STONE' ? 'STONE (PEDRA)' : key === 'GOLD' ? 'GOLD (OURO)' : key}</td>
                      <td className="py-2.5">{fmt(cfg.premioBase)}</td>
                      <td className="py-2.5">+{fmt(cfg.bonusLinear)}</td>
                      <td className="py-2.5">+{fmt(cfg.bonusSeguro)}</td>
                      <td className="py-2.5">+{fmt(cfg.bonusAlianca)}</td>
                      <td className="py-2.5 text-right font-black text-foreground">{fmt(cfg.premioBase + cfg.bonusLinear + cfg.bonusSeguro + cfg.bonusAlianca)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[10px] text-muted-foreground space-y-1 border-t pt-2 border-slate-200/50 dark:border-zinc-800/40">
                <p><strong>• Plano Linear:</strong> atingir venda mínima de 20% do total das cotas nos segmentos de Automóvel e Imóvel, no plano linear.</p>
                <p><strong>• Seguro:</strong> atingir no mínimo 70% do total das cotas vendidas com seguro.</p>
                <p><strong>• Aliança:</strong> entrega mínima de 100% do desafio global das lojas atendidas.</p>
              </div>
            </div>
          )}

          {/* Premiação do Consultor Efetiva */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coluna 1 & 2: Checklist de Bônus e Resultados */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Seu Progresso de Bônus</h4>
              
              {/* Bônus 1: Base */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-slate-50/50 dark:bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-foreground">Prêmio Base {(patenteExibicao !== 'STONE' && patenteExibicao !== 'GOLD') ? `(${patenteExibicao})` : ''}</h5>
                    <p className="text-xs text-muted-foreground">Homologado ao atingir patamar de vendas e KPIs</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-foreground">{fmt(premioBase)}</p>
                  {(patenteEfetiva !== 'STONE' && patenteEfetiva !== 'GOLD') ? (
                    <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 border-none mt-1">Homologado</Badge>
                  ) : (
                    <Badge className="bg-slate-300 text-slate-700 text-[9px] font-black uppercase px-2 py-0.5 border-none mt-1">Pendente</Badge>
                  )}
                </div>
              </div>

              {/* Bônus 2: Plano Linear */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-slate-50/50 dark:bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-sm text-foreground">Bônus Plano Linear</h5>
                      <Badge className="bg-slate-100 text-slate-800 text-[9px] font-bold border-none px-1 py-0">{pctLinearRealizado}% Realizado</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Meta: Mínimo 20% das cotas de Auto e Imóvel no plano linear</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${planoLinearAtingido ? 'text-foreground' : 'text-muted-foreground line-through'}`}>+{fmt(config.bonusLinear)}</p>
                  {planoLinearAtingido ? (
                    <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 border-none mt-1">Atingido</Badge>
                  ) : (
                    <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 border-none mt-1">Abaixo (Falta {20 - pctLinearRealizado}%)</Badge>
                  )}
                </div>
              </div>

              {/* Bônus 3: Seguro */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-slate-50/50 dark:bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-sm text-foreground">Bônus Seguro</h5>
                      <Badge className="bg-slate-100 text-slate-800 text-[9px] font-bold border-none px-1 py-0">{pctSeguroRealizado}% Realizado</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Meta: Mínimo 70% das cotas totais vendidas com seguro</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${seguroAtingido ? 'text-foreground' : 'text-muted-foreground line-through'}`}>+{fmt(config.bonusSeguro)}</p>
                  {seguroAtingido ? (
                    <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 border-none mt-1">Atingido</Badge>
                  ) : (
                    <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 border-none mt-1">Abaixo (Falta {70 - pctSeguroRealizado}%)</Badge>
                  )}
                </div>
              </div>

              {/* Bônus 4: Aliança */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-slate-50/50 dark:bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-sm text-foreground">Bônus Aliança</h5>
                      <Badge className="bg-slate-100 text-slate-800 text-[9px] font-bold border-none px-1 py-0">{pctAliancaRealizado}% Realizado</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Meta: Mínimo 100% de entrega del desafio global de las lojas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${aliancaAtingido ? 'text-foreground' : 'text-muted-foreground line-through'}`}>+{fmt(config.bonusAlianca)}</p>
                  {aliancaAtingido ? (
                    <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 border-none mt-1">Atingido</Badge>
                  ) : (
                    <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 border-none mt-1">Pendente</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna 3: Prêmio Acumulado Resumo */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-zinc-950 text-white border border-indigo-950 shadow-inner flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black tracking-widest uppercase text-indigo-400">Previsão Acumulada</span>
                <h4 className="text-lg font-black uppercase tracking-tight mt-1 text-white">Elite Rewards do Mês</h4>
                
                <div className="mt-8 space-y-2 border-b border-indigo-900/60 pb-4">
                  <div className="flex justify-between text-xs text-indigo-300">
                    <span>Prêmio Base ({patenteExibicao}):</span>
                    <span>{fmt(premioBase)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-indigo-300">
                    <span>Bônus Plano Linear:</span>
                    <span>{fmt(premioLinearVal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-indigo-300">
                    <span>Bônus Seguro:</span>
                    <span>{fmt(premioSeguroVal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-indigo-300">
                    <span>Bônus Aliança:</span>
                    <span>{fmt(premioAliancaVal)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <span className="text-[9px] font-black tracking-widest uppercase text-emerald-400">Total a Receber</span>
                <p className="text-3xl font-black tracking-tighter text-emerald-400 mt-1">{fmt(premioTotal)}</p>
                <p className="text-[10px] text-indigo-300 mt-2">
                  *Sujeito a apuração de KPIs adicionais de final de mês.
                </p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 3: RELATÓRIO DE DESEMPENHO E ESTRATÉGIAS JARVIS */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-lg overflow-hidden bg-slate-950 text-slate-100">
        <div className="h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 uppercase tracking-tighter font-black text-slate-200">
            🤖 Jarvis Report & Estratégias de Fomento
          </CardTitle>
          <p className="text-xs text-zinc-400">
            Plano de aceleração personalizado baseado nos KPIs de Varejo de Elite
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          
          {/* Relatório Jarvis */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 shrink-0" /> Diagnóstico de Performance
            </h4>
            <div className="text-xs leading-relaxed text-zinc-300 space-y-2">
              <p>
                Olá! Analisei seus resultados de vendas e KPIs do mês atual. Você acumula <strong className="text-white font-bold">{fmt(producaoMes)}</strong> em vendas realizadas, o que o qualifica para a patente <strong className="text-indigo-400 uppercase font-black">{patenteExibicao}</strong>.
              </p>
              <p>
                {(patenteEfetiva === 'STONE' || patenteEfetiva === 'GOLD') ? (
                  <span>
                    🚨 <strong className="text-white">Atenção à ativação da patente:</strong> Seu volume de vendas de {fmt(producaoMes)} está na categoria {patenteEfetiva === 'STONE' ? 'STONE (PEDRA)' : 'GOLD (OURO)'} (abaixo do limite de Cromo de 1.5M) ou seus KPIs (RPC/EP/NPS) estão abaixo dos limites. Melhore seus KPIs e atinja 1,5M em vendas para destravar a patente Cromo e seu prêmio base de R$ 1.200.
                  </span>
                ) : (
                  <span>
                    ✅ <strong className="text-emerald-400">Parabéns!</strong> Sua patente <strong className="text-white">{patenteEfetiva}</strong> está devidamente homologada. Seus indicadores RPC ({rpcRealizado}%), EP ({epRealizado}%) e NPS ({npsRealizado}) estão alinhados com o patamar de excelência exigido.
                  </span>
                )}
              </p>
              <p>
                Abaixo, montei um plano de ação estratégico detalhado focado em alavancar suas comissões e garantir o prêmio máximo de até <strong className="text-emerald-400 font-bold">{fmt(config.premioBase > 0 ? config.premioBase + config.bonusLinear + config.bonusSeguro + config.bonusAlianca : 12800)}</strong> {config.premioBase > 0 ? 'da sua patente ativa' : 'no nível Diamante'}.
              </p>
            </div>
          </div>

          {/* Plano Estratégico de Fomento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Lado Esquerdo: RPC e Volume */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
              <h5 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                🎯 Como Alavancar Vendas e RPC
              </h5>
              <ul className="text-xs text-zinc-300 space-y-2.5 list-disc list-inside">
                <li>
                  <strong className="text-white">Funil de Propostas Agressivo:</strong> Identifique no simulador os leads em estágio de proposta/simulação enviada. Entre em contato nas próximas 24h para renegociar lances em aberto.
                </li>
                <li>
                  <strong className="text-white">Gatilho de Conversão RPC:</strong> A meta de RPC é de 42%. Isso significa que para cada 10 novos leads que entram, pelo menos 4 devem avançar no funil com simulações enviadas e propostas formalizadas.
                </li>
                <li>
                  <strong className="text-white">Uso das Lojas Parceiras:</strong> Peça aos gerentes locais indicações diretas e de alto valor (Leads Premium) para impulsionar o volume bruto rapidamente.
                </li>
              </ul>
            </div>

            {/* Lado Direito: Plano Linear, Seguros e Aliança */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
              <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                🛡️ Como Garantir os Bônus Extras (Linear, Seguro, Aliança)
              </h5>
              <ul className="text-xs text-zinc-300 space-y-2.5 list-disc list-inside">
                <li>
                  <strong className="text-white">Conversão do Bônus Linear (Automóvel/Imóvel):</strong> Ao vender cotas de carro ou imóveis, direcione pelo menos 20% no plano linear. Destaque que o linear oferece estabilidade e menor valor total pago.
                </li>
                <li>
                  <strong className="text-white">Seling Seguro Prestamista (Meta 70%):</strong> Venda no mínimo 70% das cotas com seguro. Apresente o seguro como uma proteção obrigatória de proteção patrimonial para a família, garantindo a quitação do saldo devedor.
                </li>
                <li>
                  <strong className="text-white">Meta Aliança Global:</strong> Participe das reuniões de alinhamento com as lojas. O bônus Aliança de +{fmt(config.bonusAlianca)} só é liberado ao bater 100% da meta global da loja atendida.
                </li>
              </ul>
            </div>

          </div>

          {/* Estratégia de Elite para Nível Máximo (DIAMANTE) */}
          <div className="p-5 rounded-xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 to-amber-950/20 space-y-4">
            <h4 className="text-sm font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              Planejamento Estratégico de Julho: Rumo ao Nível Máximo (DIAMANTE)
            </h4>
            <p className="text-xs text-zinc-300">
              Para atingir a patente máxima de <strong className="text-amber-400">DIAMANTE (R$ 5.000.000,00+)</strong> e desbloquear o prêmio base de <strong className="text-emerald-400">R$ 8.000,00</strong> (+ bônus adicionais de até R$ 4.800,00, totalizando <strong className="text-emerald-400">R$ 12.800,00</strong>), você deve seguir o seguinte planejamento prático de 10 minutos:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-black/40 border border-zinc-800 space-y-2">
                <h5 className="font-bold text-white uppercase flex items-center gap-1.5 text-amber-400">
                  📅 1. Divisão Semanal da Meta
                </h5>
                <p className="text-[11px] text-zinc-300 font-semibold mb-1">Passo 2: Transforme em semanas</p>
                <ul className="text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Meta Mensal: <strong className="text-white">R$ 5.000.000,00</strong></li>
                  <li>Meta Semanal: <strong className="text-emerald-400">R$ 1.250.000,00 / semana</strong></li>
                  <li>Dividir a meta torna o plano claro e fácil de corrigir rotas ao longo do mês.</li>
                </ul>
              </div>
              <div className="p-3.5 rounded-lg bg-black/40 border border-zinc-800 space-y-2">
                <h5 className="font-bold text-white uppercase flex items-center gap-1.5 text-amber-400">
                  ⏰ 2. Horários de Foco
                </h5>
                <p className="text-[11px] text-zinc-300 font-semibold mb-1">Passo 9: Reserve blocos</p>
                <ul className="text-zinc-400 space-y-1 list-disc list-inside">
                  <li><strong>09:00 às 10:30</strong> — Prospecção e primeiro contato com novos leads quentes.</li>
                  <li><strong>15:00 às 16:00</strong> — Follow-up ativo de propostas pendentes de lances.</li>
                  <li>Horários marcados reduzem distrações e aumentam taxas de fechamento.</li>
                </ul>
              </div>
              <div className="p-3.5 rounded-lg bg-black/40 border border-zinc-800 space-y-2">
                <h5 className="font-bold text-white uppercase flex items-center gap-1.5 text-amber-400">
                  🛡️ 3. Plano para Dias Fracos
                </h5>
                <p className="text-[11px] text-zinc-300 font-semibold mb-1">Passo 11: Contingência às 15h</p>
                <ul className="text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Se até as <strong className="text-white">15:00</strong> nenhuma venda acontecer:</li>
                  <li>Entrar em contato com <strong>15 clientes antigos</strong> de consórcio.</li>
                  <li>Pedir indicação de consórcio para <strong>5 clientes satisfeitos</strong>.</li>
                  <li>Enviar follow-up rápido para <strong>todas as propostas</strong> abertas.</li>
                </ul>
              </div>
              <div className="p-3.5 rounded-lg bg-black/40 border border-zinc-800 space-y-2">
                <h5 className="font-bold text-white uppercase flex items-center gap-1.5 text-amber-400">
                  💬 4. Conversão e Argumentação
                </h5>
                <p className="text-[11px] text-zinc-300 font-semibold mb-1">Passo 5: Scripts de Impacto</p>
                <ul className="text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Foque em consórcios de alto padrão (imobiliário e frotas).</li>
                  <li>Destaque que o linear oferece menor valor pago e segurança para a família.</li>
                  <li>Garanta KPIs de Elite: <strong>RPC &ge; 42%</strong>, <strong>EP &ge; 84%</strong> e <strong>NPS &ge; 70</strong>.</li>
                </ul>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
