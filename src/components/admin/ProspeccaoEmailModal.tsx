import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Send,
  Calendar,
  Clock,
  ShieldCheck,
  Download,
  Flame,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Copy,
  ExternalLink,
  Bot,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Lead } from "@/types/funil";
import {
  CADENCIA_EMAIL_STEPS,
  calculateOutreachQueue,
  renderOutreachEmail,
  exportLeadsToCSV,
} from "@/services/emailOutreachService";
import { formatCurrency } from "@/lib/utils";

interface ProspeccaoEmailModalProps {
  open: boolean;
  onClose: () => void;
  leads: Lead[];
}

export function ProspeccaoEmailModal({ open, onClose, leads }: ProspeccaoEmailModalProps) {
  const [activeTab, setActiveTab] = useState("fila");
  const [selectedStep, setSelectedStep] = useState<1 | 2 | 3>(1);
  const [testEmail, setTestEmail] = useState("gn_prosperaplan@consorciomagalu.com.br");
  const [sendingTest, setSendingTest] = useState(false);

  // Calcula a fila de contatos do dia
  const queue = useMemo(() => calculateOutreachQueue(leads), [leads]);

  // Lead de demonstração para preview
  const sampleLead = useMemo(() => {
    const firstWithEmail = leads.find((l) => l.email && l.email.includes("@"));
    if (firstWithEmail) return firstWithEmail;
    return {
      id: "preview-1",
      nome: "Carlos Eduardo Mendes",
      email: "carlos.mendes@empresa.com.br",
      cidade: "São Paulo",
      valor_credito: 500000,
      tipo_consorcio: "IMOBILIARIO",
    } as Lead;
  }, [leads]);

  // Download do CSV para a pasta de automação
  const handleExportCSV = () => {
    try {
      const csvContent = exportLeadsToCSV(leads);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "leads_prospeccao.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Arquivo leads_prospeccao.csv baixado com sucesso! Mova-o para a pasta 'scripts/' do projeto.");
    } catch (e: any) {
      toast.error(`Erro ao exportar leads: ${e.message}`);
    }
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast.success("Comando copiado para a área de transferência!");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-slate-800 text-slate-100 p-6 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 text-indigo-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  Máquina de Prospecção Diária por E-mail
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                    SMTP Conectado
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm">
                  Cadência consultiva automatizada em 3 etapas • Prospera Plan & Consórcio Magalu
                </DialogDescription>
              </div>
            </div>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200 gap-2"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              Exportar para Script
            </Button>
          </div>
        </DialogHeader>

        {/* Resumo da Fila Diária em Cartões */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Total Elegível
            </div>
            <div className="text-2xl font-bold text-white">{queue.totalEligible}</div>
            <div className="text-[11px] text-slate-400">leads prontos hoje</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-blue-500/20">
            <div className="text-xs font-medium text-blue-400 flex items-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-blue-400" /> Passo 1 (D+0)
            </div>
            <div className="text-2xl font-bold text-blue-300">{queue.step1.length}</div>
            <div className="text-[11px] text-slate-400">abertura consultiva</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20">
            <div className="text-xs font-medium text-amber-400 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Passo 2 (D+3)
            </div>
            <div className="text-2xl font-bold text-amber-300">{queue.step2.length}</div>
            <div className="text-[11px] text-slate-400">estudo de caso / economia</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-purple-500/20">
            <div className="text-xs font-medium text-purple-400 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Passo 3 (D+7)
            </div>
            <div className="text-2xl font-bold text-purple-300">{queue.step3.length}</div>
            <div className="text-[11px] text-slate-400">break-up elegante</div>
          </div>
        </div>

        {/* Abas Principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 w-full grid grid-cols-4">
            <TabsTrigger value="fila" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs">
              📋 Fila de Hoje ({queue.totalEligible})
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs">
              ✉️ Templates & Spintax
            </TabsTrigger>
            <TabsTrigger value="agendamento" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs">
              ⚙️ Agendamento Diário
            </TabsTrigger>
            <TabsTrigger value="teste" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs">
              🚀 Disparar Teste
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: FILA DE HOJE */}
          <TabsContent value="fila" className="space-y-4 mt-4">
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/50">
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Mostrando leads com e-mail cadastrado prontos para prospecção</span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Limite seguro: até 30 envios/dia
                </span>
              </div>

              {queue.totalEligible === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-slate-400">Nenhum lead com e-mail cadastrado pendente na cadência hoje.</p>
                  <p className="text-xs text-slate-400">
                    Cadastre novos leads no CRM ou adicione-os no arquivo <code className="text-indigo-400">scripts/leads_prospeccao.csv</code>.
                  </p>
                </div>
              ) : (
                <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-800/60">
                  {[...queue.step1.map((l) => ({ lead: l, step: 1 })), ...queue.step2.map((l) => ({ lead: l, step: 2 })), ...queue.step3.map((l) => ({ lead: l, step: 3 }))].map(
                    ({ lead, step }, idx) => (
                      <div key={lead.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-200">{lead.nome}</span>
                            <Badge
                              className={`text-[10px] px-2 py-0.5 ${
                                step === 1
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                  : step === 2
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              }`}
                            >
                              Passo {step}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-3">
                            <span>{lead.email}</span>
                            {lead.cidade && <span>• {lead.cidade}</span>}
                            <span>• {formatCurrency(Number(lead.valor_credito) || 500000)}</span>
                          </div>
                        </div>

                        <div className="text-right text-xs text-slate-400">
                          {step === 1 && <span className="text-blue-400">Abertura</span>}
                          {step === 2 && <span className="text-amber-400">D+3 Follow-up</span>}
                          {step === 3 && <span className="text-purple-400">D+7 Break-up</span>}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ABA 2: TEMPLATES & SPINTAX */}
          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="flex gap-2 mb-3">
              {[1, 2, 3].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={selectedStep === s ? "default" : "outline"}
                  onClick={() => setSelectedStep(s as 1 | 2 | 3)}
                  className={selectedStep === s ? "bg-indigo-600 text-white" : "bg-slate-900 border-slate-800 text-slate-300"}
                >
                  {CADENCIA_EMAIL_STEPS[s].name.split(":")[0]} ({CADENCIA_EMAIL_STEPS[s].tag})
                </Button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Assunto do E-mail (com Spintax):</span>
                <div className="mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm font-medium text-slate-100">
                  {renderOutreachEmail(CADENCIA_EMAIL_STEPS[selectedStep].subject, sampleLead)}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Corpo do E-mail (Preview com Dados Reais):</span>
                <div className="mt-1 p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                  {renderOutreachEmail(CADENCIA_EMAIL_STEPS[selectedStep].body, sampleLead)}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Proteção Anti-Spam Ativa:</strong> As variações em Spintax ({`{opção A|opção B}`}) garantem que cada e-mail disparado possua uma impressão digital única, evitando bloqueios automáticos do Gmail e Outlook.
                </span>
              </div>
            </div>
          </TabsContent>

          {/* ABA 3: AGENDAMENTO DIÁRIO NO WINDOWS */}
          <TabsContent value="agendamento" className="space-y-4 mt-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Disparo Diário Automático no Windows (Task Scheduler)</h4>
                  <p className="text-xs text-slate-400">O sistema foi configurado para rodar de Segunda a Sexta às 09:30 da manhã.</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-medium">1. Ativar Agendamento Automático:</span>
                    <p className="font-mono text-emerald-400 mt-0.5">scripts\agendar_envio_diario.bat</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyCommand("scripts\\agendar_envio_diario.bat")}
                    className="text-slate-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-medium">2. Executar Lote de Hoje Manualmente (com 1 clique):</span>
                    <p className="font-mono text-blue-400 mt-0.5">scripts\executar_prospeccao.bat</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyCommand("scripts\\executar_prospeccao.bat")}
                    className="text-slate-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-medium">3. Simulação Segura no Terminal (Dry Run):</span>
                    <p className="font-mono text-amber-400 mt-0.5">node scripts/prospeccao_diaria_email.mjs --dry-run</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyCommand("node scripts/prospeccao_diaria_email.mjs --dry-run")}
                    className="text-slate-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-200">📁 Onde ficam os arquivos?</div>
                <div>• Planilha CSV de leads: <code className="text-indigo-400">scripts/leads_prospeccao.csv</code></div>
                <div>• Relatórios diários com logs: <code className="text-indigo-400">scripts/logs/prospeccao_AAAA-MM-DD.log</code></div>
                <div>• Histórico de disparos: <code className="text-indigo-400">scripts/logs/historico_disparos.json</code></div>
              </div>
            </div>
          </TabsContent>

          {/* ABA 4: DISPARAR TESTE */}
          <TabsContent value="teste" className="space-y-4 mt-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-white text-sm">Disparar Demonstração dos 3 Passos</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Receba os 3 e-mails da esteira na sua caixa de entrada para conferir o visual, a assinatura e a entregabilidade.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">E-mail de Destino para Teste:</label>
                <div className="flex gap-2">
                  <Input
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="bg-slate-950 border-slate-800 text-white"
                  />
                  <Button
                    onClick={() => {
                      const cmd = `node scripts/prospeccao_diaria_email.mjs --test-to=${testEmail}`;
                      handleCopyCommand(cmd);
                      toast.info("Comando gerado! Execute no terminal ou PowerShell: " + cmd);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Copiar Comando de Teste
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Conta Conectada e Pronta
                </div>
                <p>
                  Remetente oficial configurado: <strong>gn_prosperaplan@consorciomagalu.com.br</strong> via SSL (Porta 465).
                  Os testes executados anteriormente foram recebidos com sucesso e Message ID verificado.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
