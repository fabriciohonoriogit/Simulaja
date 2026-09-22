import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Folder, 
  Download, 
  Share2, 
  UserCheck, 
  Search, 
  Building2, 
  User, 
  CreditCard, 
  FileCheck2, 
  CheckCircle2, 
  Send,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
  Save
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  gerarPDFAlteracaoBem, 
  gerarPDFFichaCadastralImovel, 
  AlteracaoBemData, 
  FichaCadastralImovelData 
} from "@/lib/formulariosPdfGenerator";
import { formatCurrency, parseBRLValue } from "@/lib/utils";

interface LeadOption {
  id: string;
  nome: string;
  celular: string | null;
  dados_cadastro?: any;
  valor_credito?: number;
}

export default function CentralFormularios() {
  const [activeTab, setActiveTab] = useState<string>("central");
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [searchLead, setSearchLead] = useState<string>("");

  // Form State: Alteração do Bem
  const [alteracaoForm, setAlteracaoForm] = useState<AlteracaoBemData>({
    proposta: "",
    grupo: "",
    cota: "",
    nomeCliente: "",
    cpfCnpj: "",
    telefone: "",
    email: "",
    cidadeUf: "",
    bemAtual: "",
    novoBem: "",
    valorCredito: 0,
    justificativa: "Solicitação de alteração do bem/crédito indicado na proposta de participação do Consórcio Magalu para adequação do plano do cliente."
  });

  // Form State: Ficha Cadastral Imóvel
  const [fichaForm, setFichaForm] = useState<FichaCadastralImovelData>({
    grupo: "",
    cota: "",
    aquisicaoImovelUrbano: true,
    reformaConstrucao: false,
    aquisicaoQuitacaoFinanciamento: false,
    aquisicaoImovelRural: false,
    energiaFotovoltaica: false,
    quitacaoFinanciamentoProprio: false,

    nomeCliente: "",
    sexo: "M",
    cpf: "",
    rg: "",
    orgaoEmissor: "SSP",
    dataNascimento: "",
    localNascimento: "",
    nacionalidade: "Brasileira",
    estadoCivil: "Solteiro(a)",
    profissao: "",
    rendaMensal: 0,
    rendaBruta: 0,
    outraRenda: "",
    tempoServico: "",
    nomeEmpresa: "",
    empresaEndereco: "",
    empresaBairro: "",
    empresaCidade: "",
    empresaEstado: "",
    empresaCep: "",
    empresaTelCom: "",
    telFixo: "",
    telCel: "",
    telCom: "",
    celular: "",
    email: "",
    declaraIR: "Sim",
    regimeTrabalho: "Funcionário(a) Empresa Privada",
    aposentadoNumero: "",
    endereco: "",
    bairro: "",
    cep: "",
    cidade: "",
    uf: "PR",

    temConjuge: false,
    conjugeNome: "",
    conjugeCpf: "",
    conjugeRg: "",
    conjugeOrgaoEmissor: "SSP",
    conjugeDataNasc: "",
    conjugeLocalNascimento: "",
    conjugeNacionalidade: "Brasileira",
    conjugeProfissao: "",
    conjugeRenda: 0,
    conjugeEmail: "",
    conjugeRegimeTrabalho: "Funcionário(a) Empresa Privada",
    conjugeAposentadoNumero: "",

    isPessoaJuridica: false,
    razaoSocial: "",
    cnpj: "",
    inscricaoEstadual: "",
    ramoAtuacao: "",
    dataFundacao: "",
    formaConstituicao: "",
    faturamentoMensal: 0,
    pjEndereco: "",
    pjBairro: "",
    pjCidade: "",
    pjEstado: "PR",
    pjCep: "",
    pjTelFixo: "",
    pjTelCel: "",

    valorCredito: 0,
    tipoImovel: "Residencial",
    enderecoImovel: "",
    banco: "Itaú / Magalu Pay",
    agencia: "",
    conta: "",
    tipoConta: "Corrente",
    chavePix: "",
    titularConta: "",
    cpfTitularConta: "",

    sobraAbatimento: true,
    sobraReembolso10: false,
    valorTotalImovel: 0,
    valorPagoConsorcio: 0,

    localAssinatura: "Curitiba - PR",
    dataAssinatura: new Date().toLocaleDateString('pt-BR')
  });

  useEffect(() => {
    let isMounted = true;
    const loadLeads = async () => {
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("id, nome, celular, valor_credito, dados_cadastro")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && data && isMounted) {
          setLeads(data as LeadOption[]);
        }
      } catch (e) {
        console.error("Erro ao carregar leads:", e);
      }
    };
    loadLeads();
    return () => { isMounted = false; };
  }, []);

  const handleSelectLeadForAlteracao = (leadId: string) => {
    const found = leads.find(l => l.id === leadId);
    if (!found) return;
    const dc = found.dados_cadastro || {};

    setAlteracaoForm(prev => ({
      ...prev,
      nomeCliente: found.nome || "",
      cpfCnpj: dc.cpf || dc.cnpj || "",
      telefone: found.celular || "",
      email: dc.email || "",
      cidadeUf: `${dc.cidade || ''} ${dc.uf || ''}`.trim(),
      grupo: dc.grupo || "",
      cota: dc.cota || "",
      proposta: dc.proposta || "",
      bemAtual: dc.bem_atual || prev.bemAtual,
      valorCredito: found.valor_credito || parseBRLValue(dc.valor_credito || 0)
    }));

    toast.success(`Dados de ${found.nome} carregados no formulário!`);
  };

  const handleSelectLeadForFicha = (leadId: string) => {
    const found = leads.find(l => l.id === leadId);
    if (!found) return;
    const dc = found.dados_cadastro || {};

    // Tentar carregar do localStorage se salvo previamente
    const savedLocal = localStorage.getItem(`ficha_cadastral_${leadId}`);
    let localParsed: any = null;
    if (savedLocal) {
      try { localParsed = JSON.parse(savedLocal); } catch (e) {}
    }

    setFichaForm(prev => ({
      ...prev,
      ...dc,
      ...(localParsed || {}),
      nomeCliente: dc.nomeCliente || found.nome || prev.nomeCliente,
      cpf: dc.cpf || prev.cpf,
      rg: dc.rg || prev.rg,
      celular: found.celular || prev.celular || prev.telCel,
      telCel: found.celular || prev.telCel,
      email: dc.email || prev.email,
      endereco: dc.endereco || prev.endereco,
      bairro: dc.bairro || prev.bairro,
      cep: dc.cep || prev.cep,
      cidade: dc.cidade || prev.cidade,
      uf: dc.uf || prev.uf || "PR",
      profissao: dc.profissao || prev.profissao,
      rendaMensal: dc.rendaMensal || parseBRLValue(dc.renda || 0) || prev.rendaMensal,
      valorCredito: found.valor_credito || parseBRLValue(dc.valor_credito || 0) || prev.valorCredito,
      banco: dc.banco || prev.banco || "Itaú / Magalu Pay",
      agencia: dc.agencia || prev.agencia,
      conta: dc.conta || prev.conta,
      chavePix: dc.chavePix || dc.chave_pix || found.celular || prev.chavePix,
      titularConta: dc.titularConta || found.nome || prev.titularConta,
      cpfTitularConta: dc.cpfTitularConta || dc.cpf || prev.cpfTitularConta
    }));

    toast.success(`Ficha cadastral carregada para ${found.nome}!`);
  };

  const handleSaveFichaForm = async () => {
    try {
      // 1. Salva em localStorage
      const storageKey = `ficha_cadastral_${selectedLeadId || 'draft'}`;
      localStorage.setItem(storageKey, JSON.stringify(fichaForm));

      // 2. Se houver lead selecionado do CRM, salva no Supabase
      if (selectedLeadId) {
        const found = leads.find(l => l.id === selectedLeadId);
        const existingData = found?.dados_cadastro || {};
        const updatedDados = {
          ...existingData,
          ...fichaForm,
          cpf: fichaForm.cpf,
          rg: fichaForm.rg,
          email: fichaForm.email,
          cidade: fichaForm.cidade,
          uf: fichaForm.uf,
          bairro: fichaForm.bairro,
          endereco: fichaForm.endereco,
          cep: fichaForm.cep,
          profissao: fichaForm.profissao,
          renda: fichaForm.rendaMensal,
          banco: fichaForm.banco,
          agencia: fichaForm.agencia,
          conta: fichaForm.conta,
          grupo: fichaForm.grupo,
          cota: fichaForm.cota,
          ultima_atualizacao_ficha: new Date().toISOString()
        };

        const { error } = await supabase
          .from("leads")
          .update({ dados_cadastro: updatedDados })
          .eq("id", selectedLeadId);

        if (error) {
          console.error("Erro ao salvar ficha no Supabase:", error);
          toast.error("Erro ao salvar no banco de dados.");
          return;
        }

        // Atualiza a lista local de leads
        setLeads(prev => prev.map(l => l.id === selectedLeadId ? { ...l, dados_cadastro: updatedDados } : l));
      }

      toast.success("Formulário pré-preenchido salvo com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar formulário.");
    }
  };

  const handleGenerateAlteracaoPdf = () => {
    if (!alteracaoForm.nomeCliente) {
      toast.error("Por favor, preencha o Nome do Consorciado.");
      return;
    }
    try {
      gerarPDFAlteracaoBem(alteracaoForm);
      toast.success("PDF de Alteração do Bem gerado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF.");
    }
  };

  const handleGenerateFichaPdf = () => {
    if (!fichaForm.nomeCliente || !fichaForm.cpf) {
      toast.error("Por favor, preencha o Nome e CPF do Consorciado.");
      return;
    }
    try {
      gerarPDFFichaCadastralImovel(fichaForm);
      toast.success("Ficha Cadastral em PDF gerada com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF.");
    }
  };

  const handleSendWhatsAppAlteracao = () => {
    if (!alteracaoForm.telefone) {
      toast.error("Telefone não informado.");
      return;
    }
    const cleanPhone = alteracaoForm.telefone.replace(/\D/g, "");
    const msg = `Olá, *${alteracaoForm.nomeCliente}*! Conforme solicitado, geramos o seu formulário oficial de *Alteração do Bem / Crédito* do Consórcio Magalu.\n\n*Proposta:* ${alteracaoForm.proposta || '—'}\n*Novo Crédito:* ${formatCurrency(alteracaoForm.valorCredito)}\n\nO documento oficial em PDF foi emitido e está pronto para assinatura! 📄✨`;
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleSendWhatsAppFicha = () => {
    const phone = fichaForm.telCel || fichaForm.celular;
    if (!phone) {
      toast.error("Telefone não informado.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = `Olá, *${fichaForm.nomeCliente}*! Sua *Ficha Cadastral de Imóvel* do Consórcio Magalu foi preenchida com sucesso.\n\n*Valor do Crédito:* ${formatCurrency(fichaForm.valorCredito || 0)}\n*Cidade:* ${fichaForm.cidade}/${fichaForm.uf}\n\nVocê receberá o PDF formatado para simples conferência e assinatura. Se precisar de algum ajuste, estamos à disposição! 🏠📄`;
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const filteredLeads = leads.filter(l => 
    l.nome.toLowerCase().includes(searchLead.toLowerCase()) || 
    (l.celular && l.celular.includes(searchLead))
  );

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-blue-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 uppercase tracking-widest text-[10px]">
              Central de Documentos Magalu
            </Badge>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
              PDF Automático Fidedigno ⚡
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Formulários & Fichas Oficiais</h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
            Preencha, salve os dados no CRM e gere em PDF a Ficha Cadastral e a Solicitação de Alteração do Bem idênticas às originais do Consórcio Magalu.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button 
            onClick={() => setActiveTab("alteracao")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 shadow-lg shadow-blue-900/30 rounded-xl"
          >
            <FileText className="h-4 w-4" /> Alteração do Bem
          </Button>
          <Button 
            onClick={() => setActiveTab("ficha")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 shadow-lg shadow-emerald-900/30 rounded-xl"
          >
            <Folder className="h-4 w-4" /> Ficha Cadastral
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1.5 rounded-2xl w-full justify-start overflow-x-auto shadow-sm">
          <TabsTrigger value="central" className="rounded-xl font-bold text-xs gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Folder className="h-4 w-4" /> Central de Documentos
          </TabsTrigger>
          <TabsTrigger value="alteracao" className="rounded-xl font-bold text-xs gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4" /> Alteração do Bem
          </TabsTrigger>
          <TabsTrigger value="ficha" className="rounded-xl font-bold text-xs gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <UserCheck className="h-4 w-4" /> Ficha Cadastral Imóvel
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CENTRAL DE DOCUMENTOS */}
        <TabsContent value="central" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Alteração do Bem */}
            <Card className="border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-blue-200 text-blue-700 bg-blue-50/50">
                    Oficial Magalu
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">Alteração do Bem / Crédito</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Troca de crédito ou alteração do bem indicado na proposta de participação do consórcio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Campos inclusos:</p>
                  <p>• Número de Proposta, Grupo e Cota</p>
                  <p>• Bem Atual vs Novo Bem Solicitado</p>
                  <p>• Justificativa e Termo com Assinatura</p>
                </div>
                <Button 
                  onClick={() => setActiveTab("alteracao")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 rounded-xl"
                >
                  Preencher Formulário <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Card 2: Ficha Cadastral Imóvel */}
            <Card className="border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-emerald-200 text-emerald-700 bg-emerald-50/50">
                    Layout Idêntico ao Anexo
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">Ficha Cadastral - Imóvel</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Cadastro completo do consorciado, cônjuge, PJ e dados bancários para liberação de crédito.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Recursos Exclusivos:</p>
                  <p>• Faixas Laranjas e Logo Consórcio Magalu</p>
                  <p>• Salvamento dos Dados Preenchidos no CRM</p>
                  <p>• PDF de 2 Páginas em Grade Fidedigna</p>
                </div>
                <Button 
                  onClick={() => setActiveTab("ficha")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl"
                >
                  Preencher Ficha <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Card 3: Link Rápido de Envio ao Cliente */}
            <Card className="border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group bg-gradient-to-br from-slate-900 to-blue-950 text-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 rounded-2xl bg-white/10 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Share2 className="h-6 w-6" />
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
                    Atendimento Rápido
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold">Gerador Instantâneo</CardTitle>
                <CardDescription className="text-xs text-slate-300">
                  Selecione um cliente cadastrado no seu CRM para pré-preencher a proposta em segundos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
                  <p className="font-semibold text-white">Praticidade:</p>
                  <p>Os dados do cliente (CPF, Renda, Cidade, Crédito) são puxados do CRM automaticamente!</p>
                </div>
                <Button 
                  onClick={() => setActiveTab("ficha")}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 font-bold gap-2 rounded-xl"
                >
                  <Sparkles className="h-4 w-4 text-cyan-400" /> Usar Leads do CRM
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: FORMULÁRIO DE ALTERAÇÃO DO BEM */}
        <TabsContent value="alteracao" className="mt-6">
          <Card className="border-slate-200 shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                    Formulário de Alteração do Bem Solicitado
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Preencha ou selecione um Lead do CRM para emitir o documento oficial em PDF.
                  </CardDescription>
                </div>

                {/* Integrador de Lead */}
                <div className="flex items-center gap-2 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                    <select
                      value={selectedLeadId}
                      onChange={(e) => {
                        setSelectedLeadId(e.target.value);
                        handleSelectLeadForAlteracao(e.target.value);
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Importar do CRM --</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.nome} ({l.celular || 'Sem cel'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Seção 1: Dados da Proposta & Consorciado */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <User className="h-4 w-4" /> 1. Dados da Proposta & Consorciado
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Proposta Nº</Label>
                    <Input 
                      value={alteracaoForm.proposta} 
                      onChange={e => setAlteracaoForm({...alteracaoForm, proposta: e.target.value})}
                      placeholder="Ex: 123456" 
                      className="rounded-xl text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Grupo</Label>
                    <Input 
                      value={alteracaoForm.grupo} 
                      onChange={e => setAlteracaoForm({...alteracaoForm, grupo: e.target.value})}
                      placeholder="Ex: 6041" 
                      className="rounded-xl text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Cota</Label>
                    <Input 
                      value={alteracaoForm.cota} 
                      onChange={e => setAlteracaoForm({...alteracaoForm, cota: e.target.value})}
                      placeholder="Ex: 142" 
                      className="rounded-xl text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">CPF / CNPJ</Label>
                    <Input 
                      value={alteracaoForm.cpfCnpj} 
                      onChange={e => setAlteracaoForm({...alteracaoForm, cpfCnpj: e.target.value})}
                      placeholder="Ex: 000.000.000-00" 
                      className="rounded-xl text-xs" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Nome do Consorciado</Label>
                    <Input 
                      value={alteracaoForm.nomeCliente} 
                      onChange={e => setAlteracaoForm({...alteracaoForm, nomeCliente: e.target.value})}
                      placeholder="Nome completo do titular" 
                      className="rounded-xl text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Telefone / WhatsApp</Label>
                    <Input 
                      value={alteracaoForm.telefone} 
                      onChange={e => setAlteracaoForm({...alteracaoForm, telefone: e.target.value})}
                      placeholder="Ex: 41 99999-9999" 
                      className="rounded-xl text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Cidade / UF</Label>
                    <Input 
                      value={alteracaoForm.cidadeUf} 
                      onChange={e => setAlteracaoForm({...alteracaoForm, cidadeUf: e.target.value})}
                      placeholder="Ex: Curitiba / PR" 
                      className="rounded-xl text-xs" 
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Comparativo dos Bens */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> 2. Alteração Solicitada (Bem Atual vs Novo Bem)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-3">
                    <Label className="text-xs font-bold text-rose-800">Bem / Crédito Atual Indicado</Label>
                    <Input 
                      value={alteracaoForm.bemAtual} 
                      onChange={e => setAlteracaoForm({...alteracaoForm, bemAtual: e.target.value})}
                      placeholder="Ex: Crédito Imobiliário R$ 200.000,00" 
                      className="rounded-xl text-xs bg-white" 
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
                    <Label className="text-xs font-bold text-emerald-800">Novo Bem / Crédito Solicitado</Label>
                    <Input 
                      value={alteracaoForm.novoBem} 
                      onChange={e => setAlteracaoForm({...alteracaoForm, novoBem: e.target.value})}
                      placeholder="Ex: Crédito Imobiliário R$ 150.000,00" 
                      className="rounded-xl text-xs bg-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Novo Valor do Crédito (R$)</Label>
                    <Input 
                      type="number"
                      value={alteracaoForm.valorCredito || ""} 
                      onChange={e => setAlteracaoForm({...alteracaoForm, valorCredito: Number(e.target.value)})}
                      placeholder="Ex: 150000" 
                      className="rounded-xl text-xs font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">E-mail do Consorciado</Label>
                    <Input 
                      value={alteracaoForm.email} 
                      onChange={e => setAlteracaoForm({...alteracaoForm, email: e.target.value})}
                      placeholder="cliente@email.com" 
                      className="rounded-xl text-xs" 
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Justificativa da Troca</Label>
                  <Textarea 
                    value={alteracaoForm.justificativa}
                    onChange={e => setAlteracaoForm({...alteracaoForm, justificativa: e.target.value})}
                    rows={3}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  onClick={handleSendWhatsAppAlteracao}
                  variant="outline"
                  className="w-full sm:w-auto border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 rounded-xl"
                >
                  <Send className="h-4 w-4" /> Enviar Resumo via WhatsApp
                </Button>
                <Button
                  onClick={handleGenerateAlteracaoPdf}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg shadow-blue-900/20 rounded-xl"
                >
                  <Download className="h-4 w-4" /> Gerar PDF Oficial Magalu
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: FICHA CADASTRAL DE IMÓVEL */}
        <TabsContent value="ficha" className="mt-6">
          <Card className="border-slate-200 shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px] font-bold">
                      Fidedigno ao Modelo Magalu
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <UserCheck className="h-6 w-6 text-emerald-600" />
                    Ficha Cadastral — Imóvel Consorciado
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Preencha todos os campos do consorciado, cônjuge e PJ. Os dados podem ser salvos no CRM e emitidos em PDF de 2 páginas.
                  </CardDescription>
                </div>

                {/* Importador do CRM */}
                <div className="flex items-center gap-2 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                    <select
                      value={selectedLeadId}
                      onChange={(e) => {
                        setSelectedLeadId(e.target.value);
                        handleSelectLeadForFicha(e.target.value);
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Selecionar Lead do CRM --</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.nome} ({l.celular || 'Sem cel'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Seção 0: Proposta & Finalidade */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Proposta & Finalidade do Imóvel Consorciado
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Grupo</Label>
                    <Input 
                      value={fichaForm.grupo || ""}
                      onChange={e => setFichaForm({...fichaForm, grupo: e.target.value})}
                      placeholder="Ex: 6041"
                      className="rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Cota</Label>
                    <Input 
                      value={fichaForm.cota || ""}
                      onChange={e => setFichaForm({...fichaForm, cota: e.target.value})}
                      placeholder="Ex: 142"
                      className="rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Valor do Crédito (R$)</Label>
                    <Input 
                      type="number"
                      value={fichaForm.valorCredito || ""}
                      onChange={e => setFichaForm({...fichaForm, valorCredito: Number(e.target.value)})}
                      placeholder="Ex: 250000"
                      className="rounded-xl text-xs font-mono font-bold bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Finalidade do Crédito (Selecione as aplicáveis)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={!!fichaForm.aquisicaoImovelUrbano} 
                        onChange={e => setFichaForm({...fichaForm, aquisicaoImovelUrbano: e.target.checked})}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Aquisição de Imóvel Urbano
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={!!fichaForm.reformaConstrucao} 
                        onChange={e => setFichaForm({...fichaForm, reformaConstrucao: e.target.checked})}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Reforma e Construção
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={!!fichaForm.aquisicaoQuitacaoFinanciamento} 
                        onChange={e => setFichaForm({...fichaForm, aquisicaoQuitacaoFinanciamento: e.target.checked})}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Aquisição e Quitação Financiamento
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={!!fichaForm.aquisicaoImovelRural} 
                        onChange={e => setFichaForm({...fichaForm, aquisicaoImovelRural: e.target.checked})}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Aquisição de Imóvel Rural
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={!!fichaForm.energiaFotovoltaica} 
                        onChange={e => setFichaForm({...fichaForm, energiaFotovoltaica: e.target.checked})}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Aquisição de Energia Fotovoltaica
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={!!fichaForm.quitacaoFinanciamentoProprio} 
                        onChange={e => setFichaForm({...fichaForm, quitacaoFinanciamentoProprio: e.target.checked})}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Quitação de Financiamento Próprio
                    </label>
                  </div>
                </div>
              </div>

              {/* 1. Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                  <User className="h-4 w-4" /> 1. Dados Pessoais do Consorciado
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-700">Nome Completo</Label>
                    <Input 
                      value={fichaForm.nomeCliente}
                      onChange={e => setFichaForm({...fichaForm, nomeCliente: e.target.value})}
                      placeholder="Nome do cliente"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Sexo</Label>
                    <select
                      value={fichaForm.sexo || "M"}
                      onChange={e => setFichaForm({...fichaForm, sexo: e.target.value as 'M' | 'F'})}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    >
                      <option value="M">Masculino (M)</option>
                      <option value="F">Feminino (F)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">CPF</Label>
                    <Input 
                      value={fichaForm.cpf}
                      onChange={e => setFichaForm({...fichaForm, cpf: e.target.value})}
                      placeholder="000.000.000-00"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Nº RG</Label>
                    <Input 
                      value={fichaForm.rg}
                      onChange={e => setFichaForm({...fichaForm, rg: e.target.value})}
                      placeholder="12.345.678-9"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Orgão Exp.</Label>
                    <Input 
                      value={fichaForm.orgaoEmissor || "SSP"}
                      onChange={e => setFichaForm({...fichaForm, orgaoEmissor: e.target.value})}
                      placeholder="SSP/PR"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Data de Nascimento</Label>
                    <Input 
                      value={fichaForm.dataNascimento}
                      onChange={e => setFichaForm({...fichaForm, dataNascimento: e.target.value})}
                      placeholder="DD/MM/AAAA"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Local Nascimento</Label>
                    <Input 
                      value={fichaForm.localNascimento || ""}
                      onChange={e => setFichaForm({...fichaForm, localNascimento: e.target.value})}
                      placeholder="Cidade/UF Nasc."
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Nacionalidade</Label>
                    <Input 
                      value={fichaForm.nacionalidade || "Brasileira"}
                      onChange={e => setFichaForm({...fichaForm, nacionalidade: e.target.value})}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Estado Civil</Label>
                    <select
                      value={fichaForm.estadoCivil}
                      onChange={e => setFichaForm({...fichaForm, estadoCivil: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    >
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="União Estável">União Estável</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Declara IR?</Label>
                    <select
                      value={fichaForm.declaraIR || "Sim"}
                      onChange={e => setFichaForm({...fichaForm, declaraIR: e.target.value as 'Sim' | 'Não'})}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    >
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">E-mail</Label>
                    <Input 
                      value={fichaForm.email}
                      onChange={e => setFichaForm({...fichaForm, email: e.target.value})}
                      placeholder="cliente@email.com"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Endereço Residencial */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-700">Endereço Residencial</Label>
                    <Input 
                      value={fichaForm.endereco}
                      onChange={e => setFichaForm({...fichaForm, endereco: e.target.value})}
                      placeholder="Rua, Número, Comp."
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Bairro</Label>
                    <Input 
                      value={fichaForm.bairro}
                      onChange={e => setFichaForm({...fichaForm, bairro: e.target.value})}
                      placeholder="Bairro"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">CEP</Label>
                    <Input 
                      value={fichaForm.cep}
                      onChange={e => setFichaForm({...fichaForm, cep: e.target.value})}
                      placeholder="00000-000"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-700">Cidade / UF</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={fichaForm.cidade}
                        onChange={e => setFichaForm({...fichaForm, cidade: e.target.value})}
                        placeholder="Cidade"
                        className="rounded-xl text-xs flex-1"
                      />
                      <Input 
                        value={fichaForm.uf}
                        onChange={e => setFichaForm({...fichaForm, uf: e.target.value})}
                        placeholder="PR"
                        className="rounded-xl text-xs w-14"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Tel Fixo</Label>
                    <Input 
                      value={fichaForm.telFixo || ""}
                      onChange={e => setFichaForm({...fichaForm, telFixo: e.target.value})}
                      placeholder="(41) 3333-0000"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Tel Celular</Label>
                    <Input 
                      value={fichaForm.telCel || fichaForm.celular || ""}
                      onChange={e => setFichaForm({...fichaForm, telCel: e.target.value, celular: e.target.value})}
                      placeholder="(41) 99999-9999"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Ocupação & Renda */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> 2. Ocupação & Regime de Trabalho
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Regime de Trabalho</Label>
                    <select
                      value={fichaForm.regimeTrabalho || "Funcionário(a) Empresa Privada"}
                      onChange={e => setFichaForm({...fichaForm, regimeTrabalho: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    >
                      <option value="Funcionário(a) Empresa Privada">Empresa Privada</option>
                      <option value="Funcionário(a) Empresa Pública">Empresa Pública</option>
                      <option value="Autônomo">Autônomo</option>
                      <option value="Profissional Liberal">Profissional Liberal</option>
                      <option value="Aposentado">Aposentado</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  {fichaForm.regimeTrabalho?.includes('Aposentad') && (
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Nº Benefício Aposentadoria</Label>
                      <Input 
                        value={fichaForm.aposentadoNumero || ""}
                        onChange={e => setFichaForm({...fichaForm, aposentadoNumero: e.target.value})}
                        placeholder="Ex: 123.456.789-0"
                        className="rounded-xl text-xs"
                      />
                    </div>
                  )}
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Profissão</Label>
                    <Input 
                      value={fichaForm.profissao}
                      onChange={e => setFichaForm({...fichaForm, profissao: e.target.value})}
                      placeholder="Ex: Gerente Comercial"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Tempo de Serviço</Label>
                    <Input 
                      value={fichaForm.tempoServico || ""}
                      onChange={e => setFichaForm({...fichaForm, tempoServico: e.target.value})}
                      placeholder="Ex: 5 anos"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Nome da Empresa</Label>
                    <Input 
                      value={fichaForm.nomeEmpresa || ""}
                      onChange={e => setFichaForm({...fichaForm, nomeEmpresa: e.target.value})}
                      placeholder="Razão Social / Nome Fantasia"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Renda Bruta (R$)</Label>
                    <Input 
                      type="number"
                      value={fichaForm.rendaBruta || ""}
                      onChange={e => setFichaForm({...fichaForm, rendaBruta: Number(e.target.value)})}
                      placeholder="Ex: 12000"
                      className="rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Renda Líquida (R$)</Label>
                    <Input 
                      type="number"
                      value={fichaForm.rendaMensal || ""}
                      onChange={e => setFichaForm({...fichaForm, rendaMensal: Number(e.target.value)})}
                      placeholder="Ex: 8500"
                      className="rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Cônjuge (Opcional) */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> 3. Dados do Cônjuge / Companheiro(a)
                  </h3>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={fichaForm.temConjuge} 
                      onCheckedChange={v => setFichaForm({...fichaForm, temConjuge: v})} 
                    />
                    <span className="text-xs font-bold text-slate-600">Possui Cônjuge</span>
                  </div>
                </div>

                {fichaForm.temConjuge && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-700">Nome do Cônjuge</Label>
                        <Input 
                          value={fichaForm.conjugeNome || ""}
                          onChange={e => setFichaForm({...fichaForm, conjugeNome: e.target.value})}
                          placeholder="Nome completo do cônjuge"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700">CPF Cônjuge</Label>
                        <Input 
                          value={fichaForm.conjugeCpf || ""}
                          onChange={e => setFichaForm({...fichaForm, conjugeCpf: e.target.value})}
                          placeholder="000.000.000-00"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700">RG Cônjuge</Label>
                        <Input 
                          value={fichaForm.conjugeRg || ""}
                          onChange={e => setFichaForm({...fichaForm, conjugeRg: e.target.value})}
                          placeholder="12.345.678-9"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-slate-700">Data Nasc. Cônjuge</Label>
                        <Input 
                          value={fichaForm.conjugeDataNasc || ""}
                          onChange={e => setFichaForm({...fichaForm, conjugeDataNasc: e.target.value})}
                          placeholder="DD/MM/AAAA"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700">Profissão Cônjuge</Label>
                        <Input 
                          value={fichaForm.conjugeProfissao || ""}
                          onChange={e => setFichaForm({...fichaForm, conjugeProfissao: e.target.value})}
                          placeholder="Profissão"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700">Renda Líquida Cônjuge (R$)</Label>
                        <Input 
                          type="number"
                          value={fichaForm.conjugeRenda || ""}
                          onChange={e => setFichaForm({...fichaForm, conjugeRenda: Number(e.target.value)})}
                          placeholder="Ex: 5000"
                          className="rounded-xl text-xs font-mono font-bold bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700">E-mail Cônjuge</Label>
                        <Input 
                          value={fichaForm.conjugeEmail || ""}
                          onChange={e => setFichaForm({...fichaForm, conjugeEmail: e.target.value})}
                          placeholder="conjuge@email.com"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Pessoa Jurídica (Opcional) */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> 4. Dados da Pessoa Jurídica (PJ)
                  </h3>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={fichaForm.isPessoaJuridica} 
                      onCheckedChange={v => setFichaForm({...fichaForm, isPessoaJuridica: v})} 
                    />
                    <span className="text-xs font-bold text-slate-600">Possui Empresa (PJ)</span>
                  </div>
                </div>

                {fichaForm.isPessoaJuridica && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-700">Razão Social</Label>
                        <Input 
                          value={fichaForm.razaoSocial || ""}
                          onChange={e => setFichaForm({...fichaForm, razaoSocial: e.target.value})}
                          placeholder="Razão Social da Empresa"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700">CNPJ</Label>
                        <Input 
                          value={fichaForm.cnpj || ""}
                          onChange={e => setFichaForm({...fichaForm, cnpj: e.target.value})}
                          placeholder="00.000.000/0001-00"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-slate-700">Inscrição Estadual/Municipal</Label>
                        <Input 
                          value={fichaForm.inscricaoEstadual || ""}
                          onChange={e => setFichaForm({...fichaForm, inscricaoEstadual: e.target.value})}
                          placeholder="Ex: 123.456.789"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700">Ramo de Atuação</Label>
                        <Input 
                          value={fichaForm.ramoAtuacao || ""}
                          onChange={e => setFichaForm({...fichaForm, ramoAtuacao: e.target.value})}
                          placeholder="Ex: Comércio / Serviços"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700">Faturamento Mensal (R$)</Label>
                        <Input 
                          type="number"
                          value={fichaForm.faturamentoMensal || ""}
                          onChange={e => setFichaForm({...fichaForm, faturamentoMensal: Number(e.target.value)})}
                          placeholder="Ex: 50000"
                          className="rounded-xl text-xs font-mono font-bold bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Dados Bancários */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> 5. Dados Bancários para Liberação do Crédito
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-700">Titular da Conta</Label>
                    <Input 
                      value={fichaForm.titularConta || fichaForm.nomeCliente}
                      onChange={e => setFichaForm({...fichaForm, titularConta: e.target.value})}
                      placeholder="Nome do Titular"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">CPF do Titular</Label>
                    <Input 
                      value={fichaForm.cpfTitularConta || fichaForm.cpf}
                      onChange={e => setFichaForm({...fichaForm, cpfTitularConta: e.target.value})}
                      placeholder="000.000.000-00"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Banco</Label>
                    <Input 
                      value={fichaForm.banco}
                      onChange={e => setFichaForm({...fichaForm, banco: e.target.value})}
                      placeholder="Ex: Itaú / Magalu Pay"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Agência</Label>
                    <Input 
                      value={fichaForm.agencia}
                      onChange={e => setFichaForm({...fichaForm, agencia: e.target.value})}
                      placeholder="Ex: 1234"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Nº da Conta</Label>
                    <Input 
                      value={fichaForm.conta}
                      onChange={e => setFichaForm({...fichaForm, conta: e.target.value})}
                      placeholder="Ex: 56789-0"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Chave PIX</Label>
                    <Input 
                      value={fichaForm.chavePix}
                      onChange={e => setFichaForm({...fichaForm, chavePix: e.target.value})}
                      placeholder="CPF / Celular / E-mail"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Sobra de Crédito & Compra e Venda */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> 6. Sobra de Crédito & Valor de Compra e Venda
                </h3>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <Label className="text-xs font-bold text-slate-800">Opções de Sobra de Crédito</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!fichaForm.sobraAbatimento} 
                        onChange={e => setFichaForm({...fichaForm, sobraAbatimento: e.target.checked})}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Autorizo o abatimento automático da sobra de crédito no saldo devedor.
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!fichaForm.sobraReembolso10} 
                        onChange={e => setFichaForm({...fichaForm, sobraReembolso10: e.target.checked})}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Reservo até 10% do valor do crédito para reembolso de documentação.
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Valor Total Negociado do Imóvel (R$)</Label>
                    <Input 
                      type="number"
                      value={fichaForm.valorTotalImovel || ""}
                      onChange={e => setFichaForm({...fichaForm, valorTotalImovel: Number(e.target.value)})}
                      placeholder="Ex: 300000"
                      className="rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Valor Pago com Recursos do Consórcio (R$)</Label>
                    <Input 
                      type="number"
                      value={fichaForm.valorPagoConsorcio || fichaForm.valorCredito || ""}
                      onChange={e => setFichaForm({...fichaForm, valorPagoConsorcio: Number(e.target.value)})}
                      placeholder="Ex: 250000"
                      className="rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 7. Declaração de Veracidade (Local e Data da Assinatura) */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4" /> 7. Declaração de Veracidade (Local e Data da Emissão/Assinatura)
                </h3>

                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-3">
                  <p className="text-xs font-semibold text-slate-700">
                    "Declaro que as informações acima são a pura expressão de verdade responsabilizando-me por estas."
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Local da Assinatura (Cidade - UF)</Label>
                      <Input 
                        value={fichaForm.localAssinatura || ""}
                        onChange={e => setFichaForm({...fichaForm, localAssinatura: e.target.value})}
                        placeholder="Ex: Curitiba - PR"
                        className="rounded-xl text-xs bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Data da Assinatura</Label>
                      <Input 
                        value={fichaForm.dataAssinatura || ""}
                        onChange={e => setFichaForm({...fichaForm, dataAssinatura: e.target.value})}
                        placeholder="Ex: 22/09/2026"
                        className="rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Principais */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100">
                <Button
                  onClick={handleSaveFichaForm}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 shadow-md rounded-xl px-6"
                >
                  <Save className="h-4 w-4 text-emerald-400" /> Salvar Formulário no CRM
                </Button>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleSendWhatsAppFicha}
                    variant="outline"
                    className="w-full sm:w-auto border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 rounded-xl"
                  >
                    <Send className="h-4 w-4" /> WhatsApp Cliente
                  </Button>
                  <Button
                    onClick={handleGenerateFichaPdf}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-900/20 rounded-xl px-6"
                  >
                    <Download className="h-4 w-4" /> Gerar Ficha Cadastral em PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

