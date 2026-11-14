import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import heroBgImage from "@/assets/hero-bg.webp";
import { BlueParticlesBackground } from "@/components/BlueParticlesBackground";
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
  ArrowLeft,
  CreditCard
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
    digito: "",
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
          banco: dc.banco || prev.banco,
          agencia: dc.agencia || prev.agencia,
          conta: dc.conta || prev.conta,
          digito: dc.digito || prev.digito,
          tipoConta: dc.tipoConta || prev.tipoConta,
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
            observacao: `Ficha de Pré-Cadastro concluída pelo cliente em ${new Date().toLocaleDateString("pt-BR")}. Dados bancários preenchidos (${formData.banco || "Banco"} Ag: ${formData.agencia} CC: ${formData.conta}-${formData.digito}). Contrato em fase de geração.`,
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
      <div className="min-h-screen bg-[#050814] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
        <BlueParticlesBackground />
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />

        <Card className="max-w-lg w-full bg-[#070D19]/90 border border-cyan-500/30 text-white p-8 sm:p-10 text-center rounded-3xl shadow-2xl shadow-blue-950/80 backdrop-blur-2xl relative z-10 space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Pré-Cadastro Concluído! 🎉</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Obrigado, <strong className="text-cyan-300">{formData.nome}</strong>. Suas informações foram registradas com sucesso e enviadas para o setor de contratos do Consórcio Magalu.
            </p>
          </div>
          <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/10 text-xs text-slate-300 space-y-2 text-left backdrop-blur-md">
            <p className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Dados Criptografados & Homologados
            </p>
            <p className="text-slate-400">
              Nosso consultor sênior entrará em contato em instantes para validação formal e assinatura digital do contrato via GOV.BR.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">
      
      {/* PARTÍCULAS E GLOW FUTURISTA DA LANDING PAGE */}
      <BlueParticlesBackground />
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* CAPA HERO FUTURISTA (PADRÃO LANDING PAGE) */}
      <div className="relative w-full min-h-[340px] sm:min-h-[400px] overflow-hidden flex items-center justify-center border-b border-white/10">
        {/* Imagem de Fundo (Hero Cover Oficial) */}
        <img
          src={heroBgImage}
          alt="Capa Pré-Cadastro Simulaja"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105"
        />

        {/* Gradientes e Iluminação */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050814] via-[#050814]/70 to-[#050814]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050814]/90 via-transparent to-[#050814]/90" />

        {/* Conteúdo da Capa */}
        <div className="relative z-10 container max-w-4xl mx-auto px-4 text-center text-white pt-10 pb-16 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/40 text-blue-300 text-xs font-black tracking-wider uppercase backdrop-blur-md shadow-[0_0_15px_rgba(0,134,255,0.25)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>Gestor autorizado do consórcio magalu</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-200 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              <FileText className="w-3.5 h-3.5 text-cyan-300" />
              <span>Ficha Oficial de Pré-Cadastro</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            O Futuro do seu Patrimônio{" "}
            <span className="text-[#0086FF]">
              Sem Juros Bancários
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            Ambiente seguro e criptografado para reserva de cota e elaboração da proposta contratual do <strong className="text-white font-bold">Consórcio Magalu</strong>.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-300">
            <span className="bg-white/[0.05] border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Seguro & Criptografado
            </span>
            <span className="bg-white/[0.05] border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md">
              <Lock className="w-4 h-4 text-cyan-400" /> Homologação Imediata
            </span>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (CARD FUTURISTA DARK GLASS) */}
      <div className="container max-w-4xl mx-auto px-4 -mt-8 relative z-20 pb-20 space-y-6">

        {fetchingLead && (
          <div className="flex items-center justify-center p-4 bg-blue-950/40 rounded-2xl border border-cyan-500/30 text-cyan-300 gap-2 text-xs font-bold shadow-lg backdrop-blur-xl">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> Sincronizando dados oficiais do lead...
          </div>
        )}

        {/* NAVEGAÇÃO DE ETAPAS (Tabs Estilo Dark Glass com Glow Ativo) */}
        <div className="bg-[#070D19]/80 p-2 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              currentStep === 1
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(0,180,255,0.4)] border border-cyan-400/50"
                : "bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07] border border-white/5"
            }`}
          >
            <User className="w-4 h-4" /> 1. Pessoais
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              currentStep === 2
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(0,180,255,0.4)] border border-cyan-400/50"
                : "bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07] border border-white/5"
            }`}
          >
            <MapPin className="w-4 h-4" /> 2. Endereço
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              currentStep === 3
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(0,180,255,0.4)] border border-cyan-400/50"
                : "bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07] border border-white/5"
            }`}
          >
            <Briefcase className="w-4 h-4" /> 3. Profissão
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className={`py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              currentStep === 4
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(0,180,255,0.4)] border border-cyan-400/50"
                : "bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07] border border-white/5"
            }`}
          >
            <Building2 className="w-4 h-4" /> 4. Banco & Envio
          </button>
        </div>

        {/* CARD PRINCIPAL DE FORMULÁRIO (Dark Luxury Glass) */}
        <Card className="bg-[#070D19]/90 border border-cyan-500/30 text-white rounded-3xl shadow-2xl shadow-blue-950/80 backdrop-blur-2xl overflow-hidden">
          <CardContent className="p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* ETAPA 1: DADOS PESSOAIS */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-white/10 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-500/10 text-cyan-300 rounded-xl border border-cyan-500/30">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-white">Dados Pessoais & Documentação</h3>
                        <p className="text-xs text-slate-400 font-medium">Preencha as informações conforme seus documentos oficiais.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Nome Completo *</Label>
                      <Input
                        required
                        value={formData.nome}
                        onChange={(e) => handleChange("nome", e.target.value)}
                        placeholder="Ex: João da Silva Santos"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">CPF / CNPJ *</Label>
                      <Input
                        required
                        value={formData.cpf}
                        onChange={(e) => handleChange("cpf", e.target.value)}
                        placeholder="000.000.000-00"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">RG / CNH *</Label>
                      <Input
                        required
                        value={formData.rg}
                        onChange={(e) => handleChange("rg", e.target.value)}
                        placeholder="00.000.000-0"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Órgão Emissor / UF</Label>
                      <Input
                        value={formData.orgaoEmissor}
                        onChange={(e) => handleChange("orgaoEmissor", e.target.value)}
                        placeholder="SSP/PR"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Data de Nascimento *</Label>
                      <Input
                        required
                        type="text"
                        value={formData.dataNascimento}
                        onChange={(e) => handleChange("dataNascimento", e.target.value)}
                        placeholder="DD/MM/AAAA"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Celular / WhatsApp *</Label>
                      <Input
                        required
                        value={formData.celular}
                        onChange={(e) => handleChange("celular", e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">E-mail</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="seuemail@cliente.com"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Estado Civil</Label>
                      <Select
                        value={formData.estadoCivil}
                        onValueChange={(val) => handleChange("estadoCivil", val)}
                      >
                        <SelectTrigger className="bg-slate-900/80 border-slate-700/80 text-white text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0b1528] border-slate-700 text-white">
                          <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                          <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                          <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                          <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                          <SelectItem value="União Estável">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Nome da Mãe *</Label>
                      <Input
                        required
                        value={formData.nomeMae}
                        onChange={(e) => handleChange("nomeMae", e.target.value)}
                        placeholder="Nome completo da mãe"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Naturalidade (Cidade/UF)</Label>
                      <Input
                        value={formData.naturalidade}
                        onChange={(e) => handleChange("naturalidade", e.target.value)}
                        placeholder="Curitiba/PR"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm h-12 px-8 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                    >
                      Próximo: Endereço <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 2: ENDEREÇO */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-white/10 pb-4 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 text-cyan-300 rounded-xl border border-cyan-500/30">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-white">Endereço de Residência</h3>
                      <p className="text-xs text-slate-400 font-medium">Informe seu endereço para o envio de correspondência e registro do contrato.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">CEP * (Busca Automática)</Label>
                      <Input
                        required
                        value={formData.cep}
                        onChange={(e) => handleChange("cep", e.target.value)}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Rua / Logradouro *</Label>
                      <Input
                        required
                        value={formData.logradouro}
                        onChange={(e) => handleChange("logradouro", e.target.value)}
                        placeholder="Rua, Avenida, Alameda..."
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Número *</Label>
                      <Input
                        required
                        value={formData.numero}
                        onChange={(e) => handleChange("numero", e.target.value)}
                        placeholder="123"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Complemento</Label>
                      <Input
                        value={formData.complemento}
                        onChange={(e) => handleChange("complemento", e.target.value)}
                        placeholder="Apto 101, Bloco B..."
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Bairro *</Label>
                      <Input
                        required
                        value={formData.bairro}
                        onChange={(e) => handleChange("bairro", e.target.value)}
                        placeholder="Bairro"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Cidade *</Label>
                      <Input
                        required
                        value={formData.cidade}
                        onChange={(e) => handleChange("cidade", e.target.value)}
                        placeholder="Cidade"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">UF *</Label>
                      <Input
                        required
                        value={formData.uf}
                        onChange={(e) => handleChange("uf", e.target.value)}
                        placeholder="PR"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 h-12 px-6 rounded-xl font-bold flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm h-12 px-8 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                    >
                      Próximo: Profissão <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 3: PROFISSÃO & FINANCEIRO */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-white/10 pb-4 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 text-cyan-300 rounded-xl border border-cyan-500/30">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-white">Dados Profissionais & Renda</h3>
                      <p className="text-xs text-slate-400 font-medium">Informações necessárias para o enquadramento do seu crédito.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Profissão / Cargo *</Label>
                      <Input
                        required
                        value={formData.profissao}
                        onChange={(e) => handleChange("profissao", e.target.value)}
                        placeholder="Ex: Engenheiro, Empresário, Autônomo..."
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Empresa / Ocupação</Label>
                      <Input
                        value={formData.empresa}
                        onChange={(e) => handleChange("empresa", e.target.value)}
                        placeholder="Nome da empresa ou negócio"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Renda Mensal Estimada (R$) *</Label>
                      <Input
                        required
                        value={formData.rendaMensal}
                        onChange={(e) => handleChange("rendaMensal", e.target.value)}
                        placeholder="R$ 8.500,00"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Patrimônio Declarado (Opcional)</Label>
                      <Input
                        value={formData.patrimonio}
                        onChange={(e) => handleChange("patrimonio", e.target.value)}
                        placeholder="R$ 350.000,00"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 h-12 px-6 rounded-xl font-bold flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm h-12 px-8 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                    >
                      Próximo: Dados Bancários <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 4: DADOS BANCÁRIOS & ENVIO */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-white/10 pb-4 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 text-cyan-300 rounded-xl border border-cyan-500/30">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-white">Dados Bancários & Finalização</h3>
                      <p className="text-xs text-slate-400 font-medium">Informe seus dados bancários para faturamento, débito e formalização da cota.</p>
                    </div>
                  </div>

                  {/* 4 CAMPOS BANCÁRIOS SOLICITADOS: BANCO, AGÊNCIA, CONTA, DÍGITO */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    {/* BANCO */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                        Banco *
                      </Label>
                      <Input
                        required
                        value={formData.banco}
                        onChange={(e) => handleChange("banco", e.target.value)}
                        placeholder="Ex: Nubank, Itaú, Bradesco, BB..."
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    {/* AGÊNCIA */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                        Agência *
                      </Label>
                      <Input
                        required
                        value={formData.agencia}
                        onChange={(e) => handleChange("agencia", e.target.value)}
                        placeholder="0001"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    {/* CONTA */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                        Conta *
                      </Label>
                      <Input
                        required
                        value={formData.conta}
                        onChange={(e) => handleChange("conta", e.target.value)}
                        placeholder="1234567"
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    {/* DÍGITO */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                        Dígito *
                      </Label>
                      <Input
                        required
                        value={formData.digito}
                        onChange={(e) => handleChange("digito", e.target.value)}
                        placeholder="8"
                        maxLength={3}
                        className="bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    {/* TIPO DE CONTA */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                      <Label className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                        Tipo de Conta
                      </Label>
                      <Select
                        value={formData.tipoConta}
                        onValueChange={(val) => handleChange("tipoConta", val)}
                      >
                        <SelectTrigger className="bg-slate-900/80 border-slate-700/80 text-white text-sm font-medium rounded-xl h-12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20">
                          <SelectValue placeholder="Selecione o tipo..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0b1528] border-slate-700 text-white">
                          <SelectItem value="Corrente">Conta Corrente</SelectItem>
                          <SelectItem value="Poupança">Conta Poupança</SelectItem>
                          <SelectItem value="Pagamento">Conta de Pagamento / Digital</SelectItem>
                          <SelectItem value="Salário">Conta Salário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Resumo do Plano (Estilo Dark Luxury Glow) */}
                  <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/10 space-y-3 backdrop-blur-md">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Resumo da Cota de Consórcio
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/5">
                        <span className="text-slate-400 block text-[11px]">Tipo de Bem:</span>
                        <strong className="text-white font-black text-sm">{formData.tipoConsorcio || "Imóvel"}</strong>
                      </div>
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/5">
                        <span className="text-slate-400 block text-[11px]">Valor do Crédito:</span>
                        <strong className="text-cyan-300 font-black text-sm">{formData.valorCredito || "Conforme proposta"}</strong>
                      </div>
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/5">
                        <span className="text-slate-400 block text-[11px]">Prazo Desejado:</span>
                        <strong className="text-amber-300 font-black text-sm">{formData.prazoMeses ? `${formData.prazoMeses} meses` : "A definir"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 p-4 rounded-2xl border border-cyan-500/30 text-xs text-cyan-200 flex items-center gap-3">
                    <Lock className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>Ao finalizar, seus dados bancários e cadastrais serão criptografados em ambiente seguro para emissão imediata da proposta e contrato oficial.</span>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(3)}
                      className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 h-12 px-6 rounded-xl font-bold flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:opacity-95 text-white font-black text-sm h-14 px-10 rounded-2xl shadow-xl shadow-cyan-500/30 flex items-center gap-2 transition-all hover:scale-[1.01]"
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
          SimulaJá Consórcios © {new Date().getFullYear()} • Gestor Autorizado Consórcio Magalu • Consultoria Especializada
        </div>
      </div>
    </div>
  );
}
