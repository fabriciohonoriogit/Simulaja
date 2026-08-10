import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Handshake, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Building2,
  FileSpreadsheet
} from "lucide-react";
import { LojaPerformance, getTimeFrameLabel, TimeFrame, CustomDateRange } from "@/lib/lojasService";
import { formatCurrency } from "@/lib/utils";

interface AuditIndicacoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lojaPerformance: LojaPerformance | null;
  timeFrame: TimeFrame;
  customRange?: CustomDateRange;
}

export const AuditIndicacoesModal: React.FC<AuditIndicacoesModalProps> = ({
  open,
  onOpenChange,
  lojaPerformance,
  timeFrame,
  customRange
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!lojaPerformance) return null;

  const { loja, totalIndicacoes, closedIndicacoesCount, realizadoIndicacoes, indicacoesLeadsList } = lojaPerformance;

  const filteredLeads = (indicacoesLeadsList || []).filter(lead => {
    const term = searchTerm.toLowerCase();
    const dc = lead.dados_cadastro || {};
    const nameMatch = (lead.nome || "").toLowerCase().includes(term);
    const indNameMatch = (lead.indicador_nome || dc.indicador_nome || dc.indicador || "").toLowerCase().includes(term);
    const origemMatch = (lead.origem || dc.origem || "").toLowerCase().includes(term);
    const statusMatch = (lead.status || "").toLowerCase().includes(term);
    return nameMatch || indNameMatch || origemMatch || statusMatch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden bg-white border border-slate-200 text-slate-900 p-6 shadow-2xl rounded-3xl">
        <DialogHeader className="border-b border-slate-100 pb-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 text-white shadow-lg shadow-purple-500/20">
                <Handshake className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                  Auditoria de Indicações — {loja.cidade}
                  <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-800 text-[10px] font-bold uppercase">
                    Filial {loja.codigo}
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Conferência linha a linha dos leads com indicação registrados no período {getTimeFrameLabel(timeFrame, customRange)}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600 text-white font-black text-xs px-3 py-1 rounded-xl">
                {totalIndicacoes} Indicações no Período
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-3 custom-scrollbar pr-1">
          {/* KPI BARRA DE RESUMO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-purple-700">Total Recebidas ({getTimeFrameLabel(timeFrame, customRange)})</p>
                <p className="text-lg font-black text-purple-950">{totalIndicacoes} cadastros</p>
              </div>
              <Handshake className="h-5 w-5 text-purple-600" />
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-700">Vendas Fechadas no Funil</p>
                <p className="text-lg font-black text-emerald-950">{closedIndicacoesCount} vendas</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-blue-700">Volume R$ Fechado</p>
                <p className="text-lg font-black text-blue-950">{formatCurrency(realizadoIndicacoes)}</p>
              </div>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          {/* INPUT DE BUSCA */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente, nome do indicador, origem ou status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-slate-200 text-slate-900 text-xs font-bold rounded-xl"
            />
          </div>

          {/* TABELA DE LEADS */}
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
              <Handshake className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhuma indicação encontrada no filtro selecionado</p>
              <p className="text-xs text-slate-400">Verifique a busca ou altere o período no painel principal.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Cliente (Lead)</th>
                      <th className="p-3">Indicador / Origem</th>
                      <th className="p-3">Data de Cadastro</th>
                      <th className="p-3">Valor Crédito</th>
                      <th className="p-3">Status Funil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredLeads.map((lead, idx) => {
                      const dc = lead.dados_cadastro || {};
                      const indicadorNome = lead.indicador_nome || dc.indicador_nome || dc.indicador || "—";
                      const indicadorCel = lead.indicador_celular || dc.indicador_celular || "";
                      const status = (lead.status || "").toLowerCase().replace("_", " ").trim();
                      const isClosed = status === "fechado" || status === "venda fechada";

                      const dateFormatted = lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—";

                      return (
                        <tr key={lead.id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3">
                            <p className="font-black text-slate-900 line-clamp-1">{lead.nome || "Cliente sem nome"}</p>
                            <p className="text-[10px] text-slate-500">{lead.celular || lead.telefone || "Sem contato"}</p>
                          </td>
                          <td className="p-3">
                            <div className="space-y-0.5">
                              {indicadorNome !== "—" ? (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold">
                                  👤 {indicadorNome} {indicadorCel ? `(${indicadorCel})` : ""}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-slate-200 text-slate-600 text-[10px]">
                                  Origem: {lead.origem || dc.origem || "Indicação"}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 font-mono text-[11px]">
                            {dateFormatted}
                          </td>
                          <td className="p-3 font-black text-slate-900">
                            {formatCurrency(Number(lead.valor_credito || 0))}
                          </td>
                          <td className="p-3">
                            <Badge className={`text-[10px] font-black uppercase ${
                              isClosed 
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}>
                              {isClosed ? "✅ Venda Fechada" : lead.status || "Novo"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
