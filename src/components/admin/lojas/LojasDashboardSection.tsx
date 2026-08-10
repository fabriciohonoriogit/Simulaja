import React, { useState, useMemo, useEffect } from "react";
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
  Send,
  Handshake,
  Percent,
  Sparkles,
  UserCheck,
  Search
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
  Cell 
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
import { AuditIndicacoesModal } from "./AuditIndicacoesModal";

interface LojasDashboardSectionProps {
  leads: any[];
  carteira?: any[];
  organizacaoId?: string | null;
}

export const LojasDashboardSection: React.FC<LojasDashboardSectionProps> = ({
  leads,
  carteira = [],
  organizacaoId
}) => {
  const { toast } = useToast();
  const [lojas, setLojas] = useState<LojaConfig[]>(() => getLojasConfig(organizacaoId));

  useEffect(() => {
    if (organizacaoId) {
      setLojas(getLojasConfig(organizacaoId));
    }
  }, [organizacaoId]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("mes");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportModalType, setReportModalType] = useState<"gerencial" | "coordenador">("gerencial");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLojas, setEditingLojas] = useState<LojaConfig[]>([]);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedAuditLoja, setSelectedAuditLoja] = useState<LojaPerformance | null>(null);

  // Intervalo de Datas Personalizado
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().substring(0, 10);
  });

  const customRange = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);

  // Calcular performance das 5 lojas incluindo métricas de indicação e conversão estrita
  const {
    lojasMetrics,
    metaGlobalMensal,
    metaGlobalPeriodo,
    realizadoGlobalPeriodo,
    realizadoGlobalMensal,
    atingimentoGlobalMensal,
    lojaDestaque,
    totalIndicacoesGlobal,
    closedIndicacoesGlobal,
    realizadoIndicacoesGlobal,
    taxaConversaoGlobalIndicacoes,
    taxaConversaoGlobalGeral
  } = useMemo(() => {
    return calculateLojasPerformance(leads, lojas, timeFrame, customRange);
  }, [leads, lojas, timeFrame, customRange]);

  // Preparar dados para o gráfico de Vendas vs Meta
  const chartDataVendas = useMemo(() => {
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

  // Preparar dados para o gráfico de Análise de Conversão por Loja
  const chartDataConversao = useMemo(() => {
    return lojasMetrics.map(m => ({
      name: m.loja.cidade,
      "Conversão Indicações (%)": Number(m.taxaConversaoIndicacoes.toFixed(1)),
      "Conversão Geral Loja (%)": Number(m.taxaConversaoGeral.toFixed(1)),
      "Conversão Demais Leads (%)": Number(m.taxaConversaoOutros.toFixed(1)),
      totalIndicacoes: m.totalIndicacoes,
      closedIndicacoes: m.closedIndicacoesCount
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
    saveLojasConfig(editingLojas, organizacaoId);
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
    <div className="space-y-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden">
      {/* GLOW DISCRETO DE BACKGROUND */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER DA SEÇÃO MULTI-LOJA (LIGHT THEME) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white shadow-lg shadow-blue-500/20">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Acompanhamento Multi-Loja Magalu
              </h2>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 shadow-none">
                5 Unidades Ativas
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Gestão em tempo real de metas, vendas fechadas no funil e taxa de conversão por filial.
            </p>
          </div>
        </div>

        {/* CONTROLES E BOTÕES DE AÇÃO */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Período */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            {(["dia", "semana", "quinzena", "mes", "personalizado"] as TimeFrame[]).map(tf => {
              const labels = { dia: "Dia", semana: "Semana", quinzena: "Quinzena", mes: "Mês", personalizado: "📅 Personalizado" };
              const active = timeFrame === tf;
              return (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all uppercase tracking-wider ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  {labels[tf]}
                </button>
              );
            })}
          </div>

          {/* INPUTS DE DATA PARA PERÍODO PERSONALIZADO */}
          {timeFrame === "personalizado" && (
            <div className="flex items-center gap-2 bg-slate-50 border border-blue-200 p-1.5 rounded-xl shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1">De:</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 w-32 bg-white text-slate-900 font-mono text-xs font-bold border-slate-200 rounded-lg p-1"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Até:</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 w-32 bg-white text-slate-900 font-mono text-xs font-bold border-slate-200 rounded-lg p-1"
                />
              </div>
            </div>
          )}

          {/* Botão de Edição de Metas */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEdit}
            className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Pencil className="h-3.5 w-3.5 text-amber-500" /> Metas
          </Button>

          {/* Botão Gerar Relatório Gerentes */}
          <Button
            size="sm"
            onClick={() => {
              setReportModalType("gerencial");
              setReportModalOpen(true);
            }}
            className="h-10 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" /> Relatório para Gerentes
          </Button>

          {/* Botão Relatório Coordenador Regional Rafael Leder */}
          <Button
            size="sm"
            onClick={() => {
              setReportModalType("coordenador");
              setReportModalOpen(true);
            }}
            className="h-10 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" /> Relatório Coordenador (Rafael Leder)
          </Button>
        </div>
      </div>

      {/* CARDS CONSOLIDADOS DE ALTO IMPACTO (LIGHT THEME) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Meta Global Consolidada */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 text-slate-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Meta Global 5 Lojas
            </p>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">
            {formatCurrency(metaGlobalMensal)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] font-bold">
              5 Lojas Magalu
            </Badge>
          </div>
        </div>

        {/* Card 2: Realizado Global no Período */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 text-slate-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
              Vendas Fechadas no Funil
            </p>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-700 mt-1">
            {formatCurrency(realizadoGlobalMensal)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-700 font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{atingimentoGlobalMensal.toFixed(1)}% da Meta</span>
          </div>
        </div>

        {/* Card 3: Indicações Recebidas e Fechadas */}
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/90 text-slate-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-purple-800 tracking-wider">
              Indicações de Clientes
            </p>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Handshake className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black text-purple-900 mt-1">
            {totalIndicacoesGlobal} <span className="text-xs text-purple-600 font-normal">rec.</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-700 font-bold">
            <span>✅ {closedIndicacoesGlobal} vendas fechadas</span>
          </div>
        </div>

        {/* Card 4: Taxa de Conversão de Indicações */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 text-slate-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-indigo-800 tracking-wider">
              Conversão Indicações
            </p>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black text-indigo-900 mt-1">
            {taxaConversaoGlobalIndicacoes.toFixed(1)}%
          </p>
          <div className="mt-2 text-[10px] text-slate-600">
            <span>Vol: <strong>{formatCurrency(realizadoIndicacoesGlobal)}</strong></span>
          </div>
        </div>

        {/* Card 5: Filial Destaque / 1º Lugar */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-slate-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
              <Trophy className="h-3 w-3 text-amber-600" /> Filial Campeã
            </p>
            <Badge className="bg-amber-500 text-white font-black text-[9px] uppercase px-1.5">
              1º Lugar
            </Badge>
          </div>
          <p className="text-base font-black text-slate-900 mt-1 truncate">
            {lojaDestaque ? lojaDestaque.loja.cidade : "—"}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-black text-amber-900">
              {lojaDestaque ? formatCurrency(lojaDestaque.realizado) : "R$ 0"}
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE GRÁFICOS: VENDAS VS META & ANÁLISE DE CONVERSÃO (LIGHT THEME) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Vendas Realizadas vs Meta Mensal por Filial */}
        <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" /> Vendas Fechadas no Funil vs Meta
              </h3>
              <p className="text-xs text-slate-500">
                Volume de R$ vendido (status 'venda_fechada') em relação à meta de cada unidade.
              </p>
            </div>
            <Badge variant="outline" className="border-slate-300 text-slate-600 text-[10px]">
              Agosto/2026
            </Badge>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataVendas} margin={{ top: 20, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11}
                  fontWeight="bold"
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]}
                  labelFormatter={(label) => `Filial Magalu: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: '#334155' }}
                />
                <Bar dataKey="Meta" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={24} name="Meta R$" />
                <Bar dataKey="Vendas" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={24} name="Vendas R$">
                  {chartDataVendas.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.atingimento >= 100 ? '#10b981' : entry.atingimento >= 75 ? '#2563eb' : '#f59e0b'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Análise de Taxa de Conversão (%) por Filial */}
        <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Percent className="h-4 w-4 text-purple-600" /> Análise de Conversão: Indicações vs Geral
              </h3>
              <p className="text-xs text-slate-500">
                Taxa de fechamento de vendas (%) comparando indicações e leads normais por loja.
              </p>
            </div>
            <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-bold">
              Eficiência
            </Badge>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataConversao} margin={{ top: 20, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11}
                  fontWeight="bold"
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(val) => `${val}%`}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: any, name: string) => [`${value}%`, name]}
                  labelFormatter={(label) => `Filial Magalu: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: '#334155' }}
                />
                <Bar dataKey="Conversão Indicações (%)" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={22} name="Conv. Indicações (%)" />
                <Bar dataKey="Conversão Geral Loja (%)" fill="#0284c7" radius={[6, 6, 0, 0]} barSize={22} name="Conv. Geral Loja (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CARDS INDIVIDUAIS DAS 5 UNIDADES MAGALU (CLEAN LIGHT THEME) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" /> Detalhamento por Loja (Vendas, Metas & Indicações)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Clique no botão do WhatsApp para enviar o relatório da unidade
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {lojasMetrics.map((m) => {
            const isBatida = m.atingimentoMensal >= 100;
            return (
              <div 
                key={m.loja.id}
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden group bg-white shadow-sm hover:shadow-md ${
                  isBatida 
                    ? "border-emerald-300 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header do Card */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 font-mono text-[10px] uppercase font-bold">
                      FILIAL {m.loja.codigo}
                    </Badge>
                    <Badge className={`text-[9px] font-black uppercase px-1.5 ${
                      isBatida 
                        ? "bg-emerald-600 text-white" 
                        : m.atingimentoMensal >= 75 
                        ? "bg-blue-600 text-white" 
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {isBatida ? "🏆 Batida" : `${m.atingimentoMensal.toFixed(0)}% Meta`}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 leading-tight mt-1 line-clamp-1" title={m.loja.nome}>
                    {m.loja.cidade}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    {m.loja.gerente || "Magalu"}
                  </p>
                </div>

                {/* Bloco de Valores */}
                <div className="space-y-2 py-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vendas Fechadas</span>
                    <p className="text-lg font-black text-slate-900">
                      {formatCurrency(m.realizado)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                    <span>Meta:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(m.metaMensal)}</span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-1">
                    <Progress 
                      value={Math.min(100, m.atingimentoMensal)} 
                      className={`h-2 ${isBatida ? 'bg-emerald-100' : 'bg-slate-100'}`}
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                      <span>{m.atingimentoMensal.toFixed(1)}%</span>
                      {m.faltanteMensal > 0 ? (
                        <span className="text-amber-600">Falta {formatCurrency(m.faltanteMensal)}</span>
                      ) : (
                        <span className="text-emerald-600">+{formatCurrency(m.superavitMensal)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* BLOCO DE INDICAÇÕES E CONVERSÃO (CLICKABLE AUDIT) */}
                <div 
                  onClick={() => {
                    setSelectedAuditLoja(m);
                    setAuditModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-purple-50/80 hover:bg-purple-100 border border-purple-200/80 cursor-pointer transition-all space-y-1 group/ind shadow-sm hover:shadow"
                  title="Clique para auditagem completa dos leads de indicação"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-purple-800 flex items-center gap-1">
                      <Handshake className="h-3 w-3 text-purple-600" /> Indicações
                    </span>
                    <span className="text-purple-900 font-black flex items-center gap-1 bg-purple-200/60 px-1.5 py-0.5 rounded-md group-hover/ind:bg-purple-600 group-hover/ind:text-white transition-all">
                      {m.totalIndicacoes} rec. <Search className="h-2.5 w-2.5" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-600">Fechadas:</span>
                    <span className="font-black text-purple-700">{m.closedIndicacoesCount} vds ({m.taxaConversaoIndicacoes.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5 border-t border-purple-100">
                    <span>Vol. Fechado:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(m.realizadoIndicacoes)}</span>
                  </div>
                </div>

                {/* Métricas Secundárias & Ação */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 block font-bold">Conv. Loja</span>
                      <span className="font-black text-slate-900">{m.taxaConversaoGeral.toFixed(1)}%</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 block font-bold">Ticket</span>
                      <span className="font-black text-slate-900">{formatCurrency(m.ticketMedio)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAuditLoja(m);
                        setAuditModalOpen(true);
                      }}
                      className="h-8 text-[9px] font-black uppercase tracking-wider bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-800 border-purple-200 rounded-xl flex items-center justify-center gap-1 transition-all shadow-none"
                    >
                      <Search className="h-3 w-3" /> Conferir
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickCopyStoreReport(m)}
                      className="h-8 text-[9px] font-black uppercase tracking-wider bg-slate-50 hover:bg-blue-600 hover:text-white text-blue-700 border-slate-200 rounded-xl flex items-center justify-center gap-1 transition-all shadow-none"
                    >
                      <Send className="h-3 w-3" /> Copiar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE RELATÓRIOS PARA GERENTES E COORDENADOR REGIONAL */}
      <RelatorioGerentesModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        lojas={lojas}
        lojasMetrics={lojasMetrics}
        metaGlobal={metaGlobalMensal}
        realizadoGlobal={realizadoGlobalMensal}
        currentTimeFrame={timeFrame}
        initialReportType={reportModalType}
        customRange={customRange}
      />

      {/* MODAL DE AUDITORIA DE INDICAÇÕES */}
      <AuditIndicacoesModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        lojaPerformance={selectedAuditLoja}
        timeFrame={timeFrame}
        customRange={customRange}
      />

      {/* MODAL DE EDIÇÃO DE METAS DAS LOJAS (LIGHT THEME) */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900 p-6 rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Pencil className="h-5 w-5 text-amber-500" /> Configuração de Metas das 5 Unidades Magalu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
            {editingLojas.map((loja, idx) => (
              <div key={loja.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-slate-300 text-blue-700 font-bold bg-white">
                    FILIAL {loja.codigo}
                  </Badge>
                  <span className="text-xs font-bold text-slate-700">{loja.cidade}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600">Nome da Unidade</Label>
                    <Input
                      value={loja.nome}
                      onChange={(e) => {
                        const copy = [...editingLojas];
                        copy[idx].nome = e.target.value;
                        setEditingLojas(copy);
                      }}
                      className="bg-white border-slate-200 text-slate-900 text-xs font-bold h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600">Meta Mensal (R$)</Label>
                    <Input
                      type="number"
                      value={loja.metaMensal}
                      onChange={(e) => {
                        const copy = [...editingLojas];
                        copy[idx].metaMensal = Number(e.target.value) || 0;
                        setEditingLojas(copy);
                      }}
                      className="bg-white border-slate-200 text-slate-900 text-xs font-bold h-9 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 rounded-xl"
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
