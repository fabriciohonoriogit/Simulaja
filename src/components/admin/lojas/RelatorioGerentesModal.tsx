import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  FileText, 
  Copy, 
  Printer, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  TrendingUp, 
  Flame 
} from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { LojaConfig } from "@/constants/lojas";
import { 
  TimeFrame, 
  LojaPerformance, 
  generateWhatsAppManagerReport, 
  getTimeFrameLabel 
} from "@/lib/lojasService";
import { formatCurrency } from "@/lib/utils";

interface RelatorioGerentesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lojas: LojaConfig[];
  lojasMetrics: LojaPerformance[];
  metaGlobal: number;
  realizadoGlobal: number;
  currentTimeFrame?: TimeFrame;
}

export const RelatorioGerentesModal: React.FC<RelatorioGerentesModalProps> = ({
  open,
  onOpenChange,
  lojas,
  lojasMetrics,
  metaGlobal,
  realizadoGlobal,
  currentTimeFrame = "mes"
}) => {
  const { toast } = useToast();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(currentTimeFrame);
  const [selectedLojaId, setSelectedLojaId] = useState<string>("all");
  const [copied, setCopied] = useState(false);

  const reportText = generateWhatsAppManagerReport(
    lojasMetrics,
    timeFrame,
    metaGlobal,
    realizadoGlobal,
    selectedLojaId
  );

  const totalIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.totalIndicacoes, 0);
  const closedIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.closedIndicacoesCount, 0);
  const realizadoIndicacoesGlobal = lojasMetrics.reduce((acc, l) => acc + l.realizadoIndicacoes, 0);
  const taxaConversaoIndicacoesGlobal = totalIndicacoesGlobal > 0 ? (closedIndicacoesGlobal / totalIndicacoesGlobal) * 100 : 0;

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    toast({
      title: "Relatório Copiado com Sucesso! 📱",
      description: "O texto formatado para envio via WhatsApp aos gerentes foi copiado.",
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenDirectWhatsApp = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Gerencial Multi-Lojas Magalu & Indicações</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
            h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 10px; }
            h2 { color: #334155; margin-top: 25px; }
            .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; margin-bottom: 15px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
            .kpi-value { font-size: 20px; font-weight: bold; color: #0f172a; }
            .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 9px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; color: #334155; font-weight: bold; }
            .highlight { font-weight: bold; color: #16a34a; }
            .highlight-purple { font-weight: bold; color: #7c3aed; }
            footer { margin-top: 40px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>📊 RELATÓRIO DE DESEMPENHO, INDICAÇÕES E CONVERSÃO MAGALU</h1>
          <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString("pt-BR")} | <strong>Período:</strong> ${getTimeFrameLabel(timeFrame)}</p>
          
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Meta Consolidada</div>
              <div class="kpi-value">${formatCurrency(metaGlobal)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Vendas Realizadas</div>
              <div class="kpi-value">${formatCurrency(realizadoGlobal)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Indicações Recebidas</div>
              <div class="kpi-value">${totalIndicacoesGlobal} (${closedIndicacoesGlobal} conv.)</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Conversão de Indicações</div>
              <div class="kpi-value" style="color: #7c3aed;">${taxaConversaoIndicacoesGlobal.toFixed(1)}%</div>
            </div>
          </div>

          <h2>🏬 Análise Detalhada de Vendas, Indicações e Conversão por Filial</h2>
          <table>
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Unidade Magalu</th>
                <th>Vendas R$</th>
                <th>Atingimento</th>
                <th>Indicações (Rec. / Fech.)</th>
                <th>Vol. Indicações R$</th>
                <th>Conv. Indicações (%)</th>
                <th>Conv. Geral (%)</th>
              </tr>
            </thead>
            <tbody>
              ${lojasMetrics.map(m => `
                <tr>
                  <td><strong>${m.posicao}º</strong></td>
                  <td><strong>${m.loja.nome}</strong></td>
                  <td><strong>${formatCurrency(m.realizado)}</strong></td>
                  <td class="highlight">${m.atingimentoMensal.toFixed(1)}%</td>
                  <td>${m.totalIndicacoes} rec. / <strong>${m.closedIndicacoesCount} fech.</strong></td>
                  <td>${formatCurrency(m.realizadoIndicacoes)}</td>
                  <td class="highlight-purple">${m.taxaConversaoIndicacoes.toFixed(1)}%</td>
                  <td><strong>${m.taxaConversaoGeral.toFixed(1)}%</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <footer>Relatório emitido via SimulaJá CRM - Acompanhamento Multi-Loja Magalu</footer>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden bg-slate-900 border-slate-800 text-white p-6 shadow-2xl rounded-3xl">
        <DialogHeader className="border-b border-slate-800/80 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Relatório para Gerentes (Vendas, Indicações & Conversão)
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 uppercase text-[10px] font-bold tracking-wider">
                    WhatsApp & PDF
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-slate-400 font-medium">
                  Selecione o período (Dia, Semana, Quinzena, Mês) e a unidade para envio dos maiores indicadores e análise de indicações.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-4 custom-scrollbar pr-1">
          {/* SELETORES DE FILTRO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            {/* Filtro de Período */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-400" /> Período dos Indicadores
              </Label>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-700/50">
                {(["dia", "semana", "quinzena", "mes"] as TimeFrame[]).map(tf => {
                  const labels = { dia: "Dia", semana: "Semana", quinzena: "Quinzena", mes: "Mês" };
                  const active = timeFrame === tf;
                  return (
                    <button
                      key={tf}
                      onClick={() => setTimeFrame(tf)}
                      className={`py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider ${
                        active
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {labels[tf]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro de Loja / Filial */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-400" /> Unidade / Loja Destino
              </Label>
              <Select value={selectedLojaId} onValueChange={setSelectedLojaId}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white font-bold h-10 rounded-xl">
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="all" className="font-bold text-amber-400">
                    🌐 TODAS AS 5 LOJAS (Relatório Consolidado)
                  </SelectItem>
                  {lojas.map(l => (
                    <SelectItem key={l.id} value={l.id} className="font-medium">
                      🏬 {l.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* VISUALIZAÇÃO PREVIEW DO TEXTO DO RELATÓRIO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Pré-visualização do Relatório (Pronto para WhatsApp)
              </Label>
              <span className="text-[11px] text-slate-400 font-medium">
                {reportText.length} caracteres
              </span>
            </div>
            <Textarea
              value={reportText}
              readOnly
              rows={11}
              className="font-mono text-xs bg-slate-950/90 border-slate-800 text-slate-200 p-4 rounded-2xl resize-none focus:outline-none custom-scrollbar leading-relaxed shadow-inner"
            />
          </div>

          {/* RESUMO DOS PRINCIPAIS INDICADORES DO PERÍODO & ANÁLISE DE INDICAÇÕES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/40 text-blue-200">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Período Selecionado</p>
              <p className="text-base font-black capitalize text-white">{getTimeFrameLabel(timeFrame)}</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-emerald-200">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Vendas Realizadas</p>
              <p className="text-base font-black text-white">{formatCurrency(realizadoGlobal)}</p>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/40 text-purple-200">
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Indicações Recebidas</p>
              <p className="text-base font-black text-white">
                {totalIndicacoesGlobal} <span className="text-xs text-purple-300 font-normal">({closedIndicacoesGlobal} fechadas)</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-200">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Conversão Indicações</p>
              <p className="text-base font-black text-amber-300">
                {taxaConversaoIndicacoesGlobal.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* BOTOES DE AÇÃO */}
        <DialogFooter className="border-t border-slate-800/80 pt-4 shrink-0 flex flex-col sm:flex-row gap-2 sm:justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 rounded-xl h-11 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <Printer className="h-4 w-4 text-slate-400" /> Imprimir / Exportar PDF
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyWhatsApp}
              className={`w-full sm:w-auto h-11 px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                copied
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-white" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-blue-400" /> Copiar para WhatsApp
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleOpenDirectWhatsApp}
              className="w-full sm:w-auto h-11 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <WhatsAppIcon className="h-4 w-4 fill-current" /> Enviar Direct no WhatsApp
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
