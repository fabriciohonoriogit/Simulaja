import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Users, 
  Zap, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  UserCheck, 
  Building2, 
  Clock, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { LojaPerformance, getAnaliseConversaoEspecialista, getTimeFrameLabel, TimeFrame, CustomDateRange } from "@/lib/lojasService";
import { formatCurrency } from "@/lib/utils";

interface AnaliseConversaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lojasMetrics: LojaPerformance[];
  timeFrame: TimeFrame;
  customRange?: CustomDateRange;
  initialLojaId?: string;
}

export const AnaliseConversaoModal: React.FC<AnaliseConversaoModalProps> = ({
  open,
  onOpenChange,
  lojasMetrics,
  timeFrame,
  customRange,
  initialLojaId
}) => {
  const [selectedLojaId, setSelectedLojaId] = useState<string>(initialLojaId || (lojasMetrics[0]?.loja.id ?? ""));

  const activeMetric = lojasMetrics.find(m => m.loja.id === selectedLojaId) || lojasMetrics[0];

  if (!activeMetric) return null;

  const analise = getAnaliseConversaoEspecialista(activeMetric);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden bg-white border border-slate-200 text-slate-900 p-6 shadow-2xl rounded-3xl">
        <DialogHeader className="border-b border-slate-100 pb-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                  Análise de Conversão — Indicações Internas
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 uppercase text-[10px] font-bold">
                    Loja x Especialista
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Análise separada entre quem GERA o lead (Equipe da Loja) e quem CONVERTE o lead (Especialista).
                </p>
              </div>
            </div>

            {/* SELETOR DE UNIDADE */}
            <div className="w-full sm:w-64">
              <Select value={selectedLojaId} onValueChange={setSelectedLojaId}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 font-bold h-10 rounded-xl">
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {lojasMetrics.map(m => (
                    <SelectItem key={m.loja.id} value={m.loja.id} className="font-bold">
                      🏬 {m.loja.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-3 custom-scrollbar pr-1">
          {/* CABEÇALHO DA UNIDADE SELECIONADA */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-slate-300 bg-white text-slate-800 font-mono text-[10px] uppercase font-bold">
                  FILIAL {activeMetric.loja.codigo}
                </Badge>
                <h3 className="text-lg font-black text-slate-900">{activeMetric.loja.nome}</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Período: <strong>{getTimeFrameLabel(timeFrame, customRange)}</strong> • Equipe da Loja: <strong>{activeMetric.loja.qtdFuncionarios || 10} funcionários ativos</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Meta Mensal</span>
                <span className="text-base font-black text-slate-900">{formatCurrency(activeMetric.metaMensal)}</span>
              </div>
            </div>
          </div>

          {/* 1. VENDAS NECESSÁRIAS PARA BATER A META */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-blue-900 flex items-center gap-1.5">
                <Target className="h-4 w-4 text-blue-600" /> Cálculo de Vendas Necessárias para Bater a Meta
              </h4>
              <Badge className="bg-blue-600 text-white font-black text-[10px]">
                {analise.vendasNecessarias} vendas necessárias
              </Badge>
            </div>
            <p className="text-xs text-blue-950 leading-relaxed font-medium">
              Considerando a meta de <strong>{formatCurrency(activeMetric.metaMensal)}</strong> e o ticket médio de <strong>{formatCurrency(activeMetric.ticketMedio > 0 ? activeMetric.ticketMedio : 100000)}</strong>, a unidade precisa fechar <strong>{analise.vendasNecessarias} contratos</strong> no período.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white/80 p-2 rounded-xl border border-blue-100 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Indicações Recebidas</span>
                <span className="text-sm font-black text-slate-900">{activeMetric.totalIndicacoes} rec.</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-blue-100 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Vendas Fechadas Ind.</span>
                <span className="text-sm font-black text-emerald-700">{activeMetric.closedIndicacoesCount} fechadas</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-blue-100 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Potencial 25% Conv.</span>
                <span className="text-sm font-black text-indigo-700">{Math.floor(activeMetric.totalIndicacoes * 0.25)} vendas</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-blue-100 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Vendas Faltantes</span>
                <span className="text-sm font-black text-amber-700">{Math.max(0, analise.vendasNecessarias - activeMetric.closedIndicacoesCount)} vendas</span>
              </div>
            </div>
          </div>

          {/* 2. INDICADORES SEPARADOS POR RESPONSABILIDADE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Responsabilidade da LOJA (Geração) */}
            <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">1. Taxa de Geração de Indicação</h4>
                    <p className="text-[10px] text-purple-700 font-bold uppercase">Responsabilidade: Equipe da Loja</p>
                  </div>
                </div>
                <Badge className={`text-[10px] font-black uppercase ${
                  analise.classificacaoGeracao === "ACIMA"
                    ? "bg-emerald-600 text-white"
                    : analise.classificacaoGeracao === "NA MÉDIA"
                    ? "bg-blue-600 text-white"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}>
                  {analise.classificacaoGeracao}
                </Badge>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-900">{analise.taxaGeracaoIndicao}</span>
                  <span className="text-xs text-slate-500 font-medium ml-1">indicações / funcionário</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {activeMetric.totalIndicacoes} ind. ÷ {activeMetric.loja.qtdFuncionarios || 10} func.
                </span>
              </div>

              <div className="text-[10px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span>Abaixo de 0,5 ind./func:</span>
                  <span className="font-bold text-amber-700">ABAIXO</span>
                </div>
                <div className="flex justify-between">
                  <span>0,5 a 1,5 ind./func:</span>
                  <span className="font-bold text-blue-700">NA MÉDIA</span>
                </div>
                <div className="flex justify-between">
                  <span>Acima de 1,5 ind./func:</span>
                  <span className="font-bold text-emerald-700">EXCELENTE</span>
                </div>
              </div>
            </div>

            {/* Card Responsabilidade do ESPECIALISTA (Conversão) */}
            <div className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">2. Conversão do Especialista</h4>
                    <p className="text-[10px] text-indigo-700 font-bold uppercase">Responsabilidade: Especialista Consórcio</p>
                  </div>
                </div>
                <Badge className={`text-[10px] font-black uppercase ${
                  analise.classificacaoConversao === "ACIMA"
                    ? "bg-emerald-600 text-white"
                    : analise.classificacaoConversao === "NA MÉDIA"
                    ? "bg-blue-600 text-white"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}>
                  {analise.classificacaoConversao}
                </Badge>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-indigo-950">{analise.taxaConversaoEspecialista}%</span>
                  <span className="text-xs text-slate-500 font-medium ml-1">conversão de indicações</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {activeMetric.closedIndicacoesCount} vendas ÷ {activeMetric.totalIndicacoes} ind.
                </span>
              </div>

              <div className="text-[10px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span>Abaixo de 20%:</span>
                  <span className="font-bold text-amber-700">ABAIXO</span>
                </div>
                <div className="flex justify-between">
                  <span>20% a 40%:</span>
                  <span className="font-bold text-blue-700">NA MÉDIA</span>
                </div>
                <div className="flex justify-between">
                  <span>Acima de 40%:</span>
                  <span className="font-bold text-emerald-700">EXCELENTE</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. DIAGNÓSTICO DO FUNIL (VOLUME VS CONVERSÃO) */}
          <div className={`p-4 rounded-2xl border ${
            analise.diagnostico === "EXCELENTE DESEMPENHO"
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : analise.diagnostico === "GARGALO DE CONVERSÃO"
              ? "bg-purple-50 border-purple-200 text-purple-950"
              : "bg-amber-50 border-amber-200 text-amber-950"
          }`}>
            <div className="flex items-center gap-2">
              {analise.diagnostico === "EXCELENTE DESEMPENHO" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
              <h4 className="text-sm font-black uppercase tracking-wider">
                DIAGNÓSTICO OPERACIONAL: {analise.diagnostico}
              </h4>
            </div>
            <p className="text-xs font-medium mt-1 leading-relaxed">
              {analise.diagnosticoDetalhado}
            </p>
          </div>

          {/* 4. PLANO DE AÇÃO ESTRUTURADO POR RESPONSÁVEL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Ações para o Gestor da Loja */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h5 className="text-xs font-black uppercase text-purple-900 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-purple-600" /> Plano de Ação para o Gestor da Loja
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                {analise.acoesGestorLoja.map((acao, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
                    <ArrowRight className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span>{acao}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ações para o Especialista de Consórcio */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h5 className="text-xs font-black uppercase text-indigo-900 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-indigo-600" /> Plano de Ação para o Especialista de Consórcio
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                {analise.acoesEspecialista.map((acao, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{acao}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
