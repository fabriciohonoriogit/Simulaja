import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  Building2, 
  Target, 
  TrendingUp, 
  Trophy, 
  DollarSign, 
  Users, 
  Calendar, 
  FileText, 
  Pencil, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  ArrowUpRight, 
  Zap, 
  BarChart3, 
  PieChart, 
  Copy, 
  Send 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  ReferenceLine 
} from "recharts";
import { LojaConfig } from "@/constants/lojas";
import { 
  TimeFrame, 
  LojaPerformance, 
  getLojasConfig, 
  saveLojasConfig, 
  calculateLojasPerformance, 
  getTimeFrameLabel,
  generateWhatsAppManagerReport
} from "@/lib/lojasService";
import { formatCurrency } from "@/lib/utils";
import { RelatorioGerentesModal } from "./RelatorioGerentesModal";

interface LojasDashboardSectionProps {
  leads: any[];
  carteira?: any[];
}

export const LojasDashboardSection: React.FC<LojasDashboardSectionProps> = ({
  leads,
  carteira = []
}) => {
  const { toast } = useToast();
  const [lojas, setLojas] = useState<LojaConfig[]>(() => getLojasConfig());
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("mes");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLojas, setEditingLojas] = useState<LojaConfig[]>([]);

  // Calcular performance das 5 lojas
  const {
    lojasMetrics,
    metaGlobalMensal,
    metaGlobalPeriodo,
    realizadoGlobalPeriodo,
    realizadoGlobalMensal,
    atingimentoGlobalMensal,
    lojaDestaque
  } = useMemo(() => {
    return calculateLojasPerformance(leads, lojas, timeFrame);
  }, [leads, lojas, timeFrame]);

  // Preparar dados para o gráfico de Recharts Vendas vs Meta
  const chartData = useMemo(() => {
    return lojasMetrics.map(m => ({
      name: m.loja.cidade,
      fullName: m.loja.nome,
      codigo: m.loja.codigo,
      Vendas: m.realizado,
      Meta: m.metaMensal,
      atingimento: m.atingimentoMensal,
      faltante: m.faltanteMensal,
      corHex: m.loja.corHex
    }));
  }, [lojasMetrics]);

  // Handler para abrir modal de edição de metas
  const handleOpenEdit = () => {
    setEditingLojas(JSON.parse(JSON.stringify(lojas)));
    setEditModalOpen(true);
  };

  // Salvar edições das metas das lojas
  const handleSaveMetas = () => {
    setLojas(editingLojas);
    saveLojasConfig(editingLojas);
    setEditModalOpen(false);
    toast({
      title: "Metas Atualizadas com Sucesso! 🎯",
      description: "As novas metas das 5 unidades Magalu foram salvas.",
    });
  };

  // Quick copy report for a single store
  const handleQuickCopyStoreReport = (m: LojaPerformance) => {
    const text = generateWhatsAppManagerReport(
      lojasMetrics,
      timeFrame,
      metaGlobalMensal,
      realizadoGlobalMensal,
      m.loja.id
    );
    navigator.clipboard.writeText(text);
    toast({
      title: `Relatório de ${m.loja.cidade} Copiado! 📱`,
      description: "Pronto para colar e enviar no WhatsApp do gerente.",
    });
  };

  return (
    <div className="space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* GLOW DE BACKGROUND */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER DA SEÇÃO MULTI-LOJA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-blue-500/25">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Acompanhamento Multi-Loja Magalu
              </h2>
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-[10px] tracking-wider uppercase border-none px-2.5 py-0.5 shadow-sm">
                5 Unidades Ativas
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Monitoramento em tempo real de metas, vendas e maiores indicadores para envio aos gerentes.
            </p>
          </div>
        </div>

        {/* CONTROLES E BOTÕES DE AÇÃO */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Período */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
            {(["dia", "semana", "quinzena", "mes"] as TimeFrame[]).map(tf => {
              const labels = { dia: "Dia", semana: "Semana", quinzena: "Quinzena", mes: "Mês" };
              const active = timeFrame === tf;
              return (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all uppercase tracking-wider ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                  }`}
                >
                  {labels[tf]}
                </button>
              );
            })}
          </div>

          {/* Botão de Edição de Metas */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEdit}
            className="h-10 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5 text-amber-400" /> Metas
          </Button>

          {/* Botão Gerar Relatório Gerentes */}
          <Button
            size="sm"
            onClick={() => setReportModalOpen(true)}
            className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" /> Relatório para Gerentes
          </Button>
        </div>
      </div>

      {/* CARDS CONSOLIDADOS DE ALTO IMPACTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Meta Global Consolidada */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700/80 text-white shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Meta Global Consolidada
            </p>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-1">
            {formatCurrency(metaGlobalMensal)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-950/60 text-blue-300 border-blue-800 text-[10px]">
              5 Lojas Magalu
            </Badge>
            <span className="text-[11px] text-slate-400">Agosto/2026</span>
          </div>
        </div>

        {/* Card 2: Realizado Global no Período */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700/80 text-white shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Realizado ({getTimeFrameLabel(timeFrame)})
            </p>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(realizadoGlobalMensal)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{atingimentoGlobalMensal.toFixed(1)}% da Meta</span>
          </div>
        </div>

        {/* Card 3: % Atingimento da Meta Global */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700/80 text-white shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Atingimento Global
            </p>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-300 mt-1">
            {atingimentoGlobalMensal.toFixed(1)}%
          </p>
          <div className="mt-2.5">
            <Progress value={Math.min(100, atingimentoGlobalMensal)} className="h-2 bg-slate-700" />
          </div>
        </div>

        {/* Card 4: Filial Destaque / 1º Lugar */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 to-slate-800 border border-amber-500/30 text-white shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
              <Trophy className="h-3 w-3 text-amber-400" /> Filial Campeã
            </p>
            <Badge className="bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-1.5">
              1º Lugar
            </Badge>
          </div>
          <p className="text-base font-black text-white mt-1 truncate">
            {lojaDestaque ? lojaDestaque.loja.cidade : "—"}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-black text-amber-300">
              {lojaDestaque ? formatCurrency(lojaDestaque.realizado) : "R$ 0"}
            </span>
            <span className="text-[10px] text-amber-200 font-bold">
              ({lojaDestaque ? lojaDestaque.atingimentoMensal.toFixed(1) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE GRÁFICOS: VENDAS VS META & RANKING POR LOJA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Comparativo Vendas vs Meta das 5 Lojas */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" /> Vendas Realizadas vs Meta Mensal por Filial
              </h3>
              <p className="text-xs text-slate-400">
                Comparativo direto dos R$ vendidos em relação à meta de cada unidade Magalu.
              </p>
            </div>
            <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
              Agosto/2026
            </Badge>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={11}
                  fontWeight="bold"
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]}
                  labelFormatter={(label) => `Filial Magalu: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                />
                <Bar dataKey="Meta" fill="#475569" radius={[6, 6, 0, 0]} barSize={26} name="Meta R$" />
                <Bar dataKey="Vendas" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={26} name="Vendas R$">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.atingimento >= 100 ? '#10b981' : entry.atingimento >= 75 ? '#3b82f6' : '#f59e0b'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Ranking de Atingimento (%) por Loja */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" /> Atingimento de Meta (%)
            </h3>
            <p className="text-xs text-slate-400">
              Desempenho relativo em % de cada uma das 5 unidades.
            </p>

            <div className="space-y-4 mt-5">
              {lojasMetrics.map((m) => {
                const isLeader = m.posicao === 1;
                return (
                  <div key={m.loja.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white flex items-center gap-1.5 truncate max-w-[170px]">
                        <span className="text-slate-400 font-mono text-[11px]">{m.posicao}º</span>
                        <span className="truncate">{m.loja.cidade}</span>
                        {isLeader && <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                      </span>
                      <span className={`font-black ${m.atingimentoMensal >= 100 ? 'text-emerald-400' : m.atingimentoMensal >= 75 ? 'text-blue-400' : 'text-amber-400'}`}>
                        {m.atingimentoMensal.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          m.atingimentoMensal >= 100 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                            : m.atingimentoMensal >= 75 
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-400'
                        }`}
                        style={{ width: `${Math.min(100, m.atingimentoMensal)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Realizado: {formatCurrency(m.realizado)}</span>
                      <span>Meta: {formatCurrency(m.metaMensal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>🎯 Meta Global: <strong>{formatCurrency(metaGlobalMensal)}</strong></span>
            <span className="text-emerald-400 font-bold">Total: {formatCurrency(realizadoGlobalMensal)}</span>
          </div>
        </div>
      </div>

      {/* CARDS INDIVIDUAIS DAS 5 UNIDADES MAGALU */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-400" /> Detalhamento Individual das 5 Lojas
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Clique no botão do WhatsApp para gerar relatório instantâneo da unidade
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {lojasMetrics.map((m) => {
            const isBatida = m.atingimentoMensal >= 100;
            return (
              <div 
                key={m.loja.id}
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                  isBatida 
                    ? "bg-gradient-to-b from-slate-800 to-emerald-950/30 border-emerald-500/40 hover:border-emerald-500/80 shadow-lg shadow-emerald-500/10"
                    : "bg-slate-800/80 border-slate-700 hover:border-slate-600 shadow-md"
                }`}
              >
                {/* Header do Card */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono text-[10px] uppercase">
                      FILIAL {m.loja.codigo}
                    </Badge>
                    <Badge className={`text-[9px] font-black uppercase px-1.5 ${
                      isBatida 
                        ? "bg-emerald-500 text-slate-950" 
                        : m.atingimentoMensal >= 75 
                        ? "bg-blue-500 text-white" 
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {isBatida ? "🏆 Batida" : `${m.atingimentoMensal.toFixed(0)}% Meta`}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-black text-white leading-tight mt-1 line-clamp-1" title={m.loja.nome}>
                    {m.loja.cidade}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    {m.loja.gerente || "Magalu"}
                  </p>
                </div>

                {/* Bloco de Valores */}
                <div className="space-y-2 py-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vendas</span>
                    <p className="text-lg font-black text-white">
                      {formatCurrency(m.realizado)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Meta:</span>
                    <span className="font-bold text-slate-200">{formatCurrency(m.metaMensal)}</span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-1">
                    <Progress 
                      value={Math.min(100, m.atingimentoMensal)} 
                      className={`h-2 ${isBatida ? 'bg-emerald-950' : 'bg-slate-900'}`}
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                      <span>{m.atingimentoMensal.toFixed(1)}%</span>
                      {m.faltanteMensal > 0 ? (
                        <span className="text-amber-400">Falta {formatCurrency(m.faltanteMensal)}</span>
                      ) : (
                        <span className="text-emerald-400">+{formatCurrency(m.superavitMensal)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Métricas Secundárias & Ação */}
                <div className="space-y-2 pt-2 border-t border-slate-700/60">
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="bg-slate-900/60 p-1.5 rounded-lg">
                      <span className="text-slate-400 block font-bold">Vendas</span>
                      <span className="font-black text-white">{m.closedLeadsCount} contratos</span>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg">
                      <span className="text-slate-400 block font-bold">Ticket</span>
                      <span className="font-black text-white">{formatCurrency(m.ticketMedio)}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickCopyStoreReport(m)}
                    className="w-full h-8 text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-700 text-blue-400 hover:text-white border-slate-700 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Send className="h-3 w-3" /> Copiar p/ Gerente
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE RELATÓRIOS PARA GERENTES */}
      <RelatorioGerentesModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        lojas={lojas}
        lojasMetrics={lojasMetrics}
        metaGlobal={metaGlobalMensal}
        realizadoGlobal={realizadoGlobalMensal}
        currentTimeFrame={timeFrame}
      />

      {/* MODAL DE EDIÇÃO DE METAS DAS LOJAS */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <Pencil className="h-5 w-5 text-amber-400" /> Configuração de Metas das 5 Unidades Magalu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
            {editingLojas.map((loja, idx) => (
              <div key={loja.id} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-slate-600 text-blue-400 font-bold">
                    FILIAL {loja.codigo}
                  </Badge>
                  <span className="text-xs font-bold text-slate-300">{loja.cidade}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-400">Nome da Unidade</Label>
                    <Input
                      value={loja.nome}
                      onChange={(e) => {
                        const copy = [...editingLojas];
                        copy[idx].nome = e.target.value;
                        setEditingLojas(copy);
                      }}
                      className="bg-slate-900 border-slate-700 text-white text-xs font-bold h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-400">Meta Mensal (R$)</Label>
                    <Input
                      type="number"
                      value={loja.metaMensal}
                      onChange={(e) => {
                        const copy = [...editingLojas];
                        copy[idx].metaMensal = Number(e.target.value) || 0;
                        setEditingLojas(copy);
                      }}
                      className="bg-slate-900 border-slate-700 text-white text-xs font-bold h-9 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="border-t border-slate-800 pt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveMetas}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl px-5"
            >
              Salvar Novas Metas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
