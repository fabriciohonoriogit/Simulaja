import React, { useState, useMemo, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  AlertCircle,
  Copy,
  ExternalLink,
  Bot,
  RefreshCw,
  Sparkles,
  Trash2,
  RotateCcw,
  Save,
  Search,
  Eye,
  Edit3,
  UserX,
  FileText,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Lead } from "@/types/funil";
import {
  CadenciaStep,
  CADENCIA_EMAIL_STEPS,
  calculateOutreachQueue,
  renderOutreachEmail,
  exportLeadsToCSV,
  getCustomEmailTemplates,
  saveCustomEmailTemplates,
  resetCustomEmailTemplates,
  getExcludedLeadIds,
  saveExcludedLeadIds,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showExcludedOnly, setShowExcludedOnly] = useState(false);
  const [previewLeadForModal, setPreviewLeadForModal] = useState<{ lead: Lead; step: number } | null>(null);

  // Estado dos templates editáveis
  const [templates, setTemplates] = useState<Record<number, CadenciaStep>>(() => getCustomEmailTemplates());
  const [currentSubject, setCurrentSubject] = useState(templates[1]?.subject || "");
  const [currentBody, setCurrentBody] = useState(templates[1]?.body || "");
  const [spintaxSeed, setSpintaxSeed] = useState(0);

  // Estado de leads excluídos
  const [excludedIds, setExcludedIds] = useState<string[]>(() => getExcludedLeadIds());

  // Atualiza os campos de edição ao trocar de etapa (Passo 1, 2, 3)
  useEffect(() => {
    if (templates[selectedStep]) {
      setCurrentSubject(templates[selectedStep].subject);
      setCurrentBody(templates[selectedStep].body);
    }
  }, [selectedStep, templates]);

  // Carrega configurações salvas ao abrir o modal
  useEffect(() => {
    if (open) {
      const loadedTemplates = getCustomEmailTemplates();
      setTemplates(loadedTemplates);
      if (loadedTemplates[selectedStep]) {
        setCurrentSubject(loadedTemplates[selectedStep].subject);
        setCurrentBody(loadedTemplates[selectedStep].body);
      }
      setExcludedIds(getExcludedLeadIds());
    }
  }, [open, selectedStep]);

  // Excluir um lead da prospecção
  const handleExcludeLead = (lead: Lead) => {
    const idToExclude = lead.id || lead.email;
    if (!idToExclude) return;

    const newExcluded = Array.from(new Set([...excludedIds, String(idToExclude)]));
    setExcludedIds(newExcluded);
    saveExcludedLeadIds(newExcluded);

    toast.success(`"${lead.nome}" removido da fila de prospecção.`, {
      action: {
        label: "Desfazer",
        onClick: () => handleRestoreLead(idToExclude),
      },
    });
  };

  // Restaurar um lead excluído
  const handleRestoreLead = (idToRestore: string) => {
    const newExcluded = excludedIds.filter((id) => id !== idToRestore);
    setExcludedIds(newExcluded);
    saveExcludedLeadIds(newExcluded);
    toast.success("Lead restaurado com sucesso para a fila!");
  };

  // Restaurar todos os leads excluídos
  const handleRestoreAllExcluded = () => {
    setExcludedIds([]);
    saveExcludedLeadIds([]);
    setShowExcludedOnly(false);
    toast.success("Todos os leads excluídos foram restaurados para a fila!");
  };

  // Salvar alterações na Copy do template atual
  const handleSaveCurrentCopy = () => {
    if (!currentSubject.trim() || !currentBody.trim()) {
      toast.error("O assunto e o corpo do e-mail não podem ficar vazios.");
      return;
    }

    const updated = {
      ...templates,
      [selectedStep]: {
        ...templates[selectedStep],
        subject: currentSubject,
        body: currentBody,
      },
    };

    setTemplates(updated);
    saveCustomEmailTemplates(updated);
    toast.success(`Copy do Passo ${selectedStep} salva com sucesso! O script e o CRM usarão este novo texto.`);
  };

  // Restaurar copy padrão do passo selecionado
  const handleResetCurrentStepCopy = () => {
    const restored = resetCustomEmailTemplates(selectedStep);
    setTemplates(restored);
    setCurrentSubject(CADENCIA_EMAIL_STEPS[selectedStep].subject);
    setCurrentBody(CADENCIA_EMAIL_STEPS[selectedStep].body);
    toast.info(`Texto original padrão do Passo ${selectedStep} restaurado.`);
  };

  // Inserir tag/variável na copy
  const handleInsertVariable = (tag: string) => {
    setCurrentBody((prev) => `${prev} ${tag}`);
    toast.info(`Variável ${tag} inserida no corpo da mensagem.`);
  };

  // Calcula a fila de contatos do dia respeitando exclusões
  const queue = useMemo(() => calculateOutreachQueue(leads, excludedIds), [leads, excludedIds]);

  // Leads excluídos para listagem quando solicitado
  const excludedLeadsList = useMemo(() => {
    const excludedSet = new Set(excludedIds.map((id) => String(id).toLowerCase().trim()));
    return leads.filter(
      (l) =>
        (l.id && excludedSet.has(String(l.id).toLowerCase())) ||
        (l.email && excludedSet.has(l.email.toLowerCase().trim()))
    );
  }, [leads, excludedIds]);

  // Lead de demonstração para preview
  const sampleLead = useMemo(() => {
    const firstActiveWithEmail = leads.find(
      (l) => l.email && l.email.includes("@") && !excludedIds.includes(l.id) && !excludedIds.includes(l.email)
    );
    if (firstActiveWithEmail) return firstActiveWithEmail;
    return {
      id: "preview-1",
      nome: "Carlos Eduardo Mendes",
      email: "carlos.mendes@empresa.com.br",
      cidade: "Curitiba",
      valor_credito: 500000,
      tipo_consorcio: "IMOBILIARIO",
    } as Lead;
  }, [leads, excludedIds]);

  // Download do CSV para a pasta de automação (apenas leads válidos e não excluídos)
  const handleExportCSV = () => {
    try {
      const csvContent = exportLeadsToCSV(leads, excludedIds);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "leads_prospeccao.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(
        `Arquivo leads_prospeccao.csv com ${queue.totalEligible} leads elegíveis baixado com sucesso! Mova-o para a pasta 'scripts/'.`
      );
    } catch (e: any) {
      toast.error(`Erro ao exportar leads: ${e.message}`);
    }
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast.success("Comando copiado para a área de transferência!");
  };

  // Fila combinada para exibição
  const allQueueItems = useMemo(() => {
    return [
      ...queue.step1.map((l) => ({ lead: l, step: 1 })),
      ...queue.step2.map((l) => ({ lead: l, step: 2 })),
      ...queue.step3.map((l) => ({ lead: l, step: 3 })),
    ];
  }, [queue]);

  // Filtro de busca na fila
  const filteredQueueItems = useMemo(() => {
    if (!searchQuery.trim()) return allQueueItems;
    const q = searchQuery.toLowerCase().trim();
    return allQueueItems.filter(
      ({ lead }) =>
        (lead.nome && lead.nome.toLowerCase().includes(q)) ||
        (lead.email && lead.email.toLowerCase().includes(q)) ||
        (lead.cidade && lead.cidade.toLowerCase().includes(q))
    );
  }, [allQueueItems, searchQuery]);

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-slate-800 text-slate-100 p-6 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200 gap-2 shrink-0"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  Exportar para Script
                </Button>
              </div>
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
                ✍️ Editar Copy & Spintax
              </TabsTrigger>
              <TabsTrigger value="agendamento" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs">
                ⚙️ Agendamento Diário
              </TabsTrigger>
              <TabsTrigger value="teste" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs">
                🚀 Disparar Teste
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: FILA DE HOJE COM OPÇÃO DE EXCLUSÃO */}
            <TabsContent value="fila" className="space-y-3 mt-4">
              {/* Barra de Filtros e Status de Excluídos */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por nome, empresa ou e-mail..."
                    className="pl-9 h-9 bg-slate-900/80 border-slate-800 text-xs text-white placeholder:text-slate-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {excludedIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowExcludedOnly(!showExcludedOnly)}
                      className={`h-9 text-xs border-slate-700 ${
                        showExcludedOnly ? "bg-rose-950/50 border-rose-800 text-rose-300" : "bg-slate-900 text-slate-300"
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                      {showExcludedOnly ? "Ver Fila Ativa" : `Excluídos (${excludedIds.length})`}
                    </Button>
                  )}

                  {excludedIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRestoreAllExcluded}
                      className="h-9 text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-900"
                      title="Restaurar todos os leads excluídos para a fila"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Restaurar Todos
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/50">
                <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {showExcludedOnly
                      ? `Mostrando ${excludedLeadsList.length} leads excluídos da prospecção`
                      : `Mostrando ${filteredQueueItems.length} leads prontos para envio`}
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Limite seguro: até 30 envios/dia
                  </span>
                </div>

                {/* VISUALIZAÇÃO DE LEADS EXCLUÍDOS */}
                {showExcludedOnly ? (
                  excludedLeadsList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">Nenhum lead excluído no momento.</div>
                  ) : (
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/60">
                      {excludedLeadsList.map((lead) => (
                        <div key={lead.id} className="p-3 flex items-center justify-between bg-rose-950/10 hover:bg-rose-950/20 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-300 line-through opacity-70">{lead.nome}</span>
                              <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/30">
                                Excluído da Cadência
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-3">
                              <span>{lead.email}</span>
                              {lead.cidade && <span>• {lead.cidade}</span>}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreLead(lead.id || lead.email)}
                            className="h-8 text-xs bg-slate-900 border-emerald-600/50 text-emerald-300 hover:bg-emerald-950/40 gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restaurar Lead
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                ) : filteredQueueItems.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-slate-400">
                      {searchQuery
                        ? "Nenhum lead encontrado com esse filtro."
                        : "Nenhum lead com e-mail cadastrado pendente na cadência hoje."}
                    </p>
                    {excludedIds.length > 0 && (
                      <Button
                        size="sm"
                        variant="link"
                        onClick={handleRestoreAllExcluded}
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        Restaurar os {excludedIds.length} leads excluídos
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/60">
                    {filteredQueueItems.map(({ lead, step }, idx) => (
                      <div
                        key={lead.id || idx}
                        className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors group"
                      >
                        <div className="space-y-0.5 max-w-[70%]">
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
                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                            <span className="text-slate-300 font-mono text-[11px]">{lead.email}</span>
                            {lead.cidade && <span>• {lead.cidade}</span>}
                            <span>• {formatCurrency(Number(lead.valor_credito) || 500000)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right text-xs text-slate-400 hidden sm:block mr-1">
                            {step === 1 && <span className="text-blue-400 font-medium">Abertura</span>}
                            {step === 2 && <span className="text-amber-400 font-medium">D+3 Follow-up</span>}
                            {step === 3 && <span className="text-purple-400 font-medium">D+7 Break-up</span>}
                          </div>

                          {/* Botão de Ver E-mail Personalizado */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewLeadForModal({ lead, step })}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/40"
                            title="Ver e-mail renderizado para este cliente"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Botão de Excluir da Fila */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExcludeLead(lead)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                            title="Remover este lead da prospecção por e-mail"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ABA 2: EDITAR COPY & SPINTAX */}
            <TabsContent value="templates" className="space-y-4 mt-4">
              {/* Barra Superior de Passos e Ações de Salvar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="flex gap-2">
                  {[1, 2, 3].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selectedStep === s ? "default" : "outline"}
                      onClick={() => setSelectedStep(s as 1 | 2 | 3)}
                      className={
                        selectedStep === s
                          ? "bg-indigo-600 text-white font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }
                    >
                      Passo {s} ({CADENCIA_EMAIL_STEPS[s].tag.split(" ")[0]})
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetCurrentStepCopy}
                    className="bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
                    title="Restaurar a copy padrão de fábrica deste passo"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    Restaurar Padrão
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSaveCurrentCopy}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-lg shadow-emerald-950/50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar Alterações
                  </Button>
                </div>
              </div>

              {/* Editor da Copy */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
                {/* Variáveis Dinâmicas para Inserção Rápida */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Variáveis Dinâmicas & Spintax (clique para inserir no texto):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "{{nome_primeiro}}", desc: "Primeiro Nome" },
                      { label: "{{nome}}", desc: "Nome Completo" },
                      { label: "{{cidade}}", desc: "Cidade do Lead" },
                      { label: "{{valor_credito}}", desc: "Valor do Crédito" },
                      { label: "{tudo bem?|como vai?}", desc: "Spintax de Saudação" },
                      { label: "{Um grande abraço|Atenciosamente}", desc: "Spintax Despedida" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleInsertVariable(item.label)}
                        className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-indigo-500 text-[11px] font-mono text-indigo-300 hover:text-white transition-colors"
                        title={item.desc}
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campo de Assunto */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Assunto do E-mail (Suporta Spintax e Variáveis):
                    </label>
                  </div>
                  <Input
                    value={currentSubject}
                    onChange={(e) => setCurrentSubject(e.target.value)}
                    placeholder="Assunto do e-mail..."
                    className="bg-slate-950 border-slate-800 text-white font-medium text-sm focus:border-indigo-500"
                  />
                </div>

                {/* Campo de Corpo do E-mail */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Corpo do E-mail (Texto Editável):
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {currentBody.length} caracteres
                    </span>
                  </div>
                  <Textarea
                    value={currentBody}
                    onChange={(e) => setCurrentBody(e.target.value)}
                    rows={12}
                    className="bg-slate-950 border-slate-800 text-xs sm:text-sm text-slate-200 font-mono leading-relaxed focus:border-indigo-500 resize-y"
                    placeholder="Digite a mensagem do e-mail..."
                  />
                </div>

                {/* Pré-visualização com dados reais em tempo real */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> Pré-visualização com Dados Reais ({sampleLead.nome}):
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSpintaxSeed((prev) => prev + 1)}
                      className="h-7 text-[11px] text-slate-400 hover:text-white"
                      title="Testa outra variação aleatória de palavras do Spintax"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Sortear Outra Variação Spintax
                    </Button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200">
                    <span className="text-slate-400 font-normal">Assunto: </span>
                    {renderOutreachEmail(currentSubject, sampleLead)}
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                    {renderOutreachEmail(currentBody, sampleLead)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Proteção Anti-Spam Ativa:</strong> As variações em Spintax ({`{opção A|opção B}`}) garantem que cada e-mail disparado possua uma impressão digital única, evitando filtros de spam do Gmail e Outlook.
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
                      className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 gap-2 font-medium"
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
                    As mensagens respeitam o limite diário seguro e a cadência consultiva.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* SUB-MODAL: PRÉVIA INDIVIDUAL DO E-MAIL PARA UM LEAD SELECIONADO */}
      {previewLeadForModal && (
        <Dialog open={Boolean(previewLeadForModal)} onOpenChange={() => setPreviewLeadForModal(null)}>
          <DialogContent className="max-w-2xl bg-slate-950 border border-slate-800 text-slate-100 p-6 shadow-2xl">
            <DialogHeader className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-indigo-400" />
                    E-mail Personalizado: {previewLeadForModal.lead.nome}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    Passo {previewLeadForModal.step} • Destinatário: {previewLeadForModal.lead.email}
                  </DialogDescription>
                </div>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  Passo {previewLeadForModal.step}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">Assunto:</span>
                <p className="text-sm font-semibold text-slate-200">
                  {renderOutreachEmail(
                    templates[previewLeadForModal.step]?.subject || CADENCIA_EMAIL_STEPS[previewLeadForModal.step].subject,
                    previewLeadForModal.lead
                  )}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-1 max-h-[300px] overflow-y-auto">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">
                  Corpo do E-mail:
                </span>
                <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {renderOutreachEmail(
                    templates[previewLeadForModal.step]?.body || CADENCIA_EMAIL_STEPS[previewLeadForModal.step].body,
                    previewLeadForModal.lead
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleExcludeLead(previewLeadForModal.lead);
                  setPreviewLeadForModal(null);
                }}
                className="bg-slate-900 border-rose-800 text-rose-300 hover:bg-rose-950/40 text-xs gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Remover este lead da prospecção
              </Button>

              <Button
                size="sm"
                onClick={() => setPreviewLeadForModal(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
              >
                Fechar Prévia
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
