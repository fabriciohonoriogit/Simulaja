import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-premium-desk.webp";
import { 
  FileText, 
  User, 
  MapPin, 
  Briefcase, 
  Building2, 
  CheckCircle2, 
  Send, 
  ShieldCheck, 
  Sparkles,
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

export default function PreCadastro() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("lead_id") || searchParams.get("id") || searchParams.get("lead");
  const orgId = searchParams.get("org") || searchParams.get("organizacao_id") || searchParams.get("org_id");
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetchingLead, setFetchingLead] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Dados do formulário
  const [formData, setFormData] = useState({
    // Dados Pessoais
    nome: "",
    cpf: "",
    rg: "",
    orgaoEmissor: "",
    dataEmissao: "",
    dataNascimento: "",
    sexo: "",
    estadoCivil: "",
    nomeMae: "",
    nomePai: "",
    nacionalidade: "Brasileira",
    naturalidade: "",
    celular: "",
    email: "",
    nomeConjuge: "",
    cpfConjuge: "",

    // Endereço
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",

    // Ocupação & Financeiro
    profissao: "",
    empresa: "",
    rendaMensal: "",
    patrimonio: "",

    // Dados Bancários
    banco: "",
    agencia: "",
    conta: "",
    tipoConta: "Corrente",

    // Consórcio
    tipoConsorcio: "Imóvel",
    valorCredito: "",
    prazoMeses: "",
  });

  const fetchLeadData = async (id: string) => {
    try {
      setFetchingLead(true);
      const { data: lead, error } = await (supabase.from("leads") as any)
        .select("*")
        .eq("id", id)
        .single();

      if (!error && lead) {
        const dc = lead.dados_cadastro || {};
        setFormData(prev => ({
          ...prev,
          nome: lead.nome || prev.nome,
          celular: lead.celular || prev.celular,
          email: dc.email || prev.email,
          cpf: dc.cpfCnpj || dc.cpf || dc.cnpj || prev.cpf,
          rg: dc.rg || prev.rg,
          dataNascimento: dc.dataNascimento || prev.dataNascimento,
          estadoCivil: dc.estadoCivil || prev.estadoCivil,
          profissao: dc.profissao || prev.profissao,
          rendaMensal: dc.rendaMensal || prev.rendaMensal,
          cep: dc.cep || prev.cep,
          logradouro: dc.logradouro || dc.endereco || prev.logradouro,
          numero: dc.numero || prev.numero,
          complemento: dc.complemento || prev.complemento,
          bairro: dc.bairro || prev.bairro,
          cidade: dc.cidade || prev.cidade,
          uf: dc.uf || prev.uf,
          tipoConsorcio: dc.tipoConsorcio || lead.tipo_consorcio || prev.tipoConsorcio,
          valorCredito: lead.valor_credito ? String(lead.valor_credito) : prev.valorCredito,
          prazoMeses: dc.prazoMeses || prev.prazoMeses,
        }));
      }
    } catch (e) {
      console.error("Erro ao carregar dados do lead:", e);
    } finally {
      setFetchingLead(false);
    }
  };

  // Carrega os dados existentes do lead se houver lead_id ou preenche da URL
  useEffect(() => {
    if (leadId) {
      fetchLeadData(leadId);
    } else {
      // Pre-fill from URL parameters if available (e.g. from simulator)
      const paramValor = searchParams.get("valor");
      const paramSegmento = searchParams.get("segmento");
      const paramNome = searchParams.get("nome");
      const paramCelular = searchParams.get("celular") || searchParams.get("wpp");
      const paramEmail = searchParams.get("email");

      if (paramValor || paramSegmento || paramNome || paramCelular || paramEmail) {
        setFormData((prev) => ({
          ...prev,
          nome: paramNome ? decodeURIComponent(paramNome) : prev.nome,
          celular: paramCelular ? decodeURIComponent(paramCelular) : prev.celular,
          email: paramEmail ? decodeURIComponent(paramEmail) : prev.email,
          valorCredito: paramValor ? paramValor : prev.valorCredito,
          tipoConsorcio: paramSegmento ? (paramSegmento.charAt(0).toUpperCase() + paramSegmento.slice(1)) : prev.tipoConsorcio,
        }));
      }
    }
  }, [leadId, searchParams]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Busca CEP via API ViaCEP
  const handleCepBlur = async () => {
    const cleanCep = formData.cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            uf: data.uf || prev.uf,
          }));
        }
      } catch (err) {
        console.warn("Erro ao buscar CEP:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payloadDadosCadastro = { ...formData };
      const rawPhone = formData.celular.replace(/\D/g, "");
      const rawCredit = parseFloat(formData.valorCredito.replace(/[^\d.]/g, "")) || null;
      const rawPrazo = parseInt(formData.prazoMeses.replace(/\D/g, ""), 10) || null;

      let targetLeadId = leadId;

      // Se não recebemos lead_id na URL, tentamos buscar se já existe um lead com o mesmo número de celular
      if (!targetLeadId && rawPhone && rawPhone.length >= 10) {
        try {
          const { data: existingLead } = await (supabase.from("leads") as any)
            .select("id")
            .eq("celular", rawPhone)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingLead?.id) {
            targetLeadId = existingLead.id;
          }
        } catch (findErr) {
          console.warn("Aviso: Falha ao buscar lead por celular existente:", findErr);
        }
      }

      if (targetLeadId) {
        // Atualiza lead existente no CRM e faz avançar de etapa automaticamente no funil (para 'negociacao')
        const { error } = await (supabase.from("leads") as any)
          .update({
            nome: formData.nome.trim(),
            celular: rawPhone,
            email: formData.email.trim(),
            cidade: formData.cidade,
            tipo_consorcio: formData.tipoConsorcio,
            valor_credito: rawCredit,
            prazo_meses: rawPrazo,
            status: "negociacao",
            lead_temperatura: "quente",
            lead_score_valor: "alto",
            dados_cadastro: payloadDadosCadastro,
            updated_at: new Date().toISOString(),
            observacao: `Ficha de Pré-Cadastro concluída pelo cliente em ${new Date().toLocaleDateString("pt-BR")}. Contrato em fase de geração.`,
          })
          .eq("id", targetLeadId);

        if (error) throw error;
      } else {
        // Se não houver lead_id nem lead existente por telefone, insere como novo pré-cadastro no CRM na etapa de negociacao
        const orgToUse = orgId || "8b1a2dcc-83cd-4985-a828-f3870dcbc2a4";
        const { error } = await (supabase.from("leads") as any).insert({
          nome: formData.nome.trim(),
          celular: rawPhone,
          email: formData.email.trim(),
          cidade: formData.cidade,
          tipo_consorcio: formData.tipoConsorcio,
          valor_credito: rawCredit,
          prazo_meses: rawPrazo,
          status: "negociacao",
          lead_temperatura: "quente",
          lead_score_valor: "alto",
          origem: "Ficha de Pré-Cadastro Contrato",
          dados_cadastro: payloadDadosCadastro,
          organizacao_id: orgToUse,
        });

        if (error) throw error;
      }

      setSubmitted(true);
      toast({
        title: "✅ Pré-Cadastro Concluído!",
        description: "Seus dados foram salvos com sucesso e o contrato já está em fase de geração.",
      });
    } catch (err: any) {
      console.error("Erro ao salvar pré-cadastro:", err);
      toast({
        title: "Erro ao enviar",
        description: err.message || "Ocorreu um erro ao salvar o pré-cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-white border border-slate-200 text-slate-900 p-8 text-center rounded-3xl shadow-2xl space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Pré-Cadastro Concluído! 🎉</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Obrigado, <strong className="text-blue-600">{formData.nome}</strong>. Suas informações foram registradas no sistema e enviadas para o setor de contratos.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2 text-left">
            <p className="flex items-center gap-2 text-blue-700 font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Dados Criptografados & Seguros
            </p>
            <p className="text-slate-600">
              Nosso consultor sênior entrará em contato em instantes com a documentação pronta para sua validação.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* CAPA HERO DA LANDING PAGE */}
      <div className="relative w-full min-h-[340px] sm:min-h-[420px] bg-slate-900 overflow-hidden flex items-center justify-center">
        {/* Imagem de Fundo (Hero Cover) */}
        <img
          src={heroImage}
          alt="Capa Pré-Cadastro Simulaja"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
        />

        {/* Dynamic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />

        {/* Conteúdo da Capa */}
        <div className="relative z-10 container max-w-4xl mx-auto px-4 text-center text-white py-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Ficha de Pré-Cadastro • Emissão de Contrato</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Qual é o seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-300 to-white">próximo sonho?</span>
          </h1>

          <p className="text-slate-200 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            Da casa própria ao carro novo, ajudamos você a encontrar o <strong className="text-white font-bold">consórcio ideal</strong> para conquistar seus objetivos com segurança, planejamento e consultoria especializada.
          </p>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
            <span className="bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Seguro & Criptografado
            </span>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (CLEAN LIGHT DESIGN) */}
      <div className="container max-w-4xl mx-auto px-4 -mt-10 relative z-20 pb-16 space-y-6">

        {fetchingLead && (
          <div className="flex items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 text-blue-600 gap-2 text-xs font-bold shadow-md">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando dados do cliente...
          </div>
        )}

        {/* NAVEGAÇÃO DE ETAPAS (Navegação em Abas Limpas e Modernas) */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              currentStep === 1
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <User className="w-4 h-4" /> 1. Pessoais
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              currentStep === 2
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <MapPin className="w-4 h-4" /> 2. Endereço
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              currentStep === 3
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Briefcase className="w-4 h-4" /> 3. Profissão
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className={`py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              currentStep === 4
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Building2 className="w-4 h-4" /> 4. Envio
          </button>
        </div>

        {/* CARD PRINCIPAL DE FORMULÁRIO (Clean White) */}
        <Card className="bg-white border-slate-200 text-slate-900 rounded-3xl shadow-xl overflow-hidden">
          <CardContent className="p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* ETAPA 1: DADOS PESSOAIS */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-900">Dados Pessoais & Documentação</h3>
                        <p className="text-xs text-slate-500 font-medium">Preencha as informações conforme seus documentos oficiais.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome Completo *</Label>
                      <Input
                        required
                        value={formData.nome}
                        onChange={(e) => handleChange("nome", e.target.value)}
                        placeholder="Ex: João da Silva Santos"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">CPF / CNPJ *</Label>
                      <Input
                        required
                        value={formData.cpf}
                        onChange={(e) => handleChange("cpf", e.target.value)}
                        placeholder="000.000.000-00"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">RG / CNH *</Label>
                      <Input
                        required
                        value={formData.rg}
                        onChange={(e) => handleChange("rg", e.target.value)}
                        placeholder="00.000.000-0"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Órgão Emissor / UF</Label>
                      <Input
                        value={formData.orgaoEmissor}
                        onChange={(e) => handleChange("orgaoEmissor", e.target.value)}
                        placeholder="SSP/PR"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Data de Nascimento *</Label>
                      <Input
                        required
                        type="text"
                        value={formData.dataNascimento}
                        onChange={(e) => handleChange("dataNascimento", e.target.value)}
                        placeholder="DD/MM/AAAA"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Celular / WhatsApp *</Label>
                      <Input
                        required
                        value={formData.celular}
                        onChange={(e) => handleChange("celular", e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">E-mail</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="seuemail@cliente.com"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Estado Civil</Label>
                      <Select
                        value={formData.estadoCivil}
                        onValueChange={(val) => handleChange("estadoCivil", val)}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                          <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                          <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                          <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                          <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                          <SelectItem value="União Estável">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome da Mãe *</Label>
                      <Input
                        required
                        value={formData.nomeMae}
                        onChange={(e) => handleChange("nomeMae", e.target.value)}
                        placeholder="Nome completo da mãe"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Naturalidade (Cidade/UF)</Label>
                      <Input
                        value={formData.naturalidade}
                        onChange={(e) => handleChange("naturalidade", e.target.value)}
                        placeholder="Curitiba/PR"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm h-12 px-8 rounded-xl shadow-md flex items-center gap-2"
                    >
                      Próximo: Endereço <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 2: ENDEREÇO */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900">Endereço de Residência</h3>
                      <p className="text-xs text-slate-500 font-medium">Informe seu endereço para o envio de correspondência do contrato.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">CEP * (Busca Automática)</Label>
                      <Input
                        required
                        value={formData.cep}
                        onChange={(e) => handleChange("cep", e.target.value)}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rua / Logradouro *</Label>
                      <Input
                        required
                        value={formData.logradouro}
                        onChange={(e) => handleChange("logradouro", e.target.value)}
                        placeholder="Rua, Avenida, Alameda..."
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Número *</Label>
                      <Input
                        required
                        value={formData.numero}
                        onChange={(e) => handleChange("numero", e.target.value)}
                        placeholder="123"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Complemento</Label>
                      <Input
                        value={formData.complemento}
                        onChange={(e) => handleChange("complemento", e.target.value)}
                        placeholder="Apto 101, Bloco B..."
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bairro *</Label>
                      <Input
                        required
                        value={formData.bairro}
                        onChange={(e) => handleChange("bairro", e.target.value)}
                        placeholder="Bairro"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cidade *</Label>
                      <Input
                        required
                        value={formData.cidade}
                        onChange={(e) => handleChange("cidade", e.target.value)}
                        placeholder="Cidade"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">UF *</Label>
                      <Input
                        required
                        value={formData.uf}
                        onChange={(e) => handleChange("uf", e.target.value)}
                        placeholder="PR"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="border-slate-200 text-slate-700 hover:bg-slate-100 h-12 px-6 rounded-xl font-bold flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm h-12 px-8 rounded-xl shadow-md flex items-center gap-2"
                    >
                      Próximo: Profissão <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 3: PROFISSÃO & FINANCEIRO */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900">Dados Profissionais & Renda</h3>
                      <p className="text-xs text-slate-500 font-medium">Informações necessárias para o enquadramento do seu crédito.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Profissão / Cargo *</Label>
                      <Input
                        required
                        value={formData.profissao}
                        onChange={(e) => handleChange("profissao", e.target.value)}
                        placeholder="Ex: Engenheiro, Empresário, Autônomo..."
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Empresa / Ocupação</Label>
                      <Input
                        value={formData.empresa}
                        onChange={(e) => handleChange("empresa", e.target.value)}
                        placeholder="Nome da empresa ou negócio"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Renda Mensal Estimada (R$) *</Label>
                      <Input
                        required
                        value={formData.rendaMensal}
                        onChange={(e) => handleChange("rendaMensal", e.target.value)}
                        placeholder="R$ 8.500,00"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Patrimônio Declarado (Opcional)</Label>
                      <Input
                        value={formData.patrimonio}
                        onChange={(e) => handleChange("patrimonio", e.target.value)}
                        placeholder="R$ 350.000,00"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="border-slate-200 text-slate-700 hover:bg-slate-100 h-12 px-6 rounded-xl font-bold flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm h-12 px-8 rounded-xl shadow-md flex items-center gap-2"
                    >
                      Próximo: Dados Bancários <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 4: DADOS BANCÁRIOS & ENVIO */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900">Dados Bancários & Confirmação</h3>
                      <p className="text-xs text-slate-500 font-medium">Dados para faturamento do boleto/débito da cota de consórcio.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Banco Principal</Label>
                      <Input
                        value={formData.banco}
                        onChange={(e) => handleChange("banco", e.target.value)}
                        placeholder="Ex: Itaú, Bradesco, Nubank..."
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Agência</Label>
                      <Input
                        value={formData.agencia}
                        onChange={(e) => handleChange("agencia", e.target.value)}
                        placeholder="0000"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Conta com Dígito</Label>
                      <Input
                        value={formData.conta}
                        onChange={(e) => handleChange("conta", e.target.value)}
                        placeholder="00000-0"
                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium rounded-xl h-12 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Resumo do Plano */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" /> Resumo da Cota de Consórcio
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block">Tipo de Bem:</span>
                        <strong className="text-slate-900 font-black text-sm">{formData.tipoConsorcio || "Imóvel"}</strong>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block">Valor do Crédito:</span>
                        <strong className="text-slate-900 font-black text-sm">{formData.valorCredito || "Conforme proposta"}</strong>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block">Prazo Desejado:</span>
                        <strong className="text-slate-900 font-black text-sm">{formData.prazoMeses ? `${formData.prazoMeses} meses` : "A definir"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-center gap-3">
                    <Lock className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>Ao finalizar, seus dados serão registrados em ambiente seguro para emissão imediata da proposta e contrato.</span>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(3)}
                      className="border-slate-200 text-slate-700 hover:bg-slate-100 h-12 px-6 rounded-xl font-bold flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:opacity-95 text-white font-black text-sm h-14 px-10 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.01]"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      Finalizar Pré-Cadastro & Emissão
                    </Button>
                  </div>
                </div>
              )}

            </form>
          </CardContent>
        </Card>

        {/* Rodapé institucional */}
        <div className="text-center pt-4 text-xs text-slate-500 font-medium">
          Simulaja Consórcios © {new Date().getFullYear()} • Consultoria Especializada & Soluções Financeiras
        </div>
      </div>
    </div>
  );
}
