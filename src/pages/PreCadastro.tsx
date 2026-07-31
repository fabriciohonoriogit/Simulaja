import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
  Lock
} from "lucide-react";

export default function PreCadastro() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("lead_id") || searchParams.get("id") || searchParams.get("lead");
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

  // Carrega os dados existentes do lead se houver lead_id
  useEffect(() => {
    if (leadId) {
      fetchLeadData(leadId);
    }
  }, [leadId]);

  const fetchLeadData = async (id: string) => {
    try {
      setFetchingLead(true);
      const { data: lead, error } = await (supabase.from("leads") as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar lead para pré-cadastro:", error);
        return;
      }

      if (lead) {
        const dc = lead.dados_cadastro || {};
        setFormData((prev) => ({
          ...prev,
          nome: lead.nome || dc.nome || prev.nome,
          celular: lead.celular || dc.celular || dc.telefone || prev.celular,
          email: lead.email || dc.email || prev.email,
          cpf: lead.cpf || dc.cpf || dc.CPF || prev.cpf,
          cidade: lead.cidade || dc.cidade || prev.cidade,
          uf: dc.uf || dc.estado || prev.uf,
          tipoConsorcio: lead.tipo_consorcio || dc.tipoConsorcio || dc.segmento || prev.tipoConsorcio,
          valorCredito: lead.valor_credito ? String(lead.valor_credito) : (dc.valorCredito || prev.valorCredito),
          prazoMeses: lead.prazo_meses ? String(lead.prazo_meses) : (dc.prazoMeses || prev.prazoMeses),
          rg: dc.rg || dc.documento || prev.rg,
          orgaoEmissor: dc.orgaoEmissor || prev.orgaoEmissor,
          dataEmissao: dc.dataEmissao || prev.dataEmissao,
          dataNascimento: dc.dataNascimento || prev.dataNascimento,
          sexo: dc.sexo || prev.sexo,
          estadoCivil: dc.estadoCivil || prev.estadoCivil,
          nomeMae: dc.nomeMae || prev.nomeMae,
          nomePai: dc.nomePai || prev.nomePai,
          naturalidade: dc.naturalidade || prev.naturalidade,
          nomeConjuge: dc.nomeConjuge || prev.nomeConjuge,
          cpfConjuge: dc.cpfConjuge || prev.cpfConjuge,
          cep: dc.cep || prev.cep,
          logradouro: dc.logradouro || dc.endereco || prev.logradouro,
          numero: dc.numero || prev.numero,
          complemento: dc.complemento || prev.complemento,
          bairro: dc.bairro || prev.bairro,
          profissao: dc.profissao || prev.profissao,
          empresa: dc.empresa || prev.empresa,
          rendaMensal: dc.rendaMensal || prev.rendaMensal,
          patrimonio: dc.patrimonio || prev.patrimonio,
          banco: dc.banco || prev.banco,
          agencia: dc.agencia || prev.agencia,
          conta: dc.conta || prev.conta,
          tipoConta: dc.tipoConta || prev.tipoConta,
        }));
      }
    } catch (err) {
      console.error("Erro na consulta do lead:", err);
    } finally {
      setFetchingLead(false);
    }
  };

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

      if (leadId) {
        // Atualiza lead existente no CRM
        const { error } = await (supabase.from("leads") as any)
          .update({
            nome: formData.nome.trim(),
            celular: rawPhone,
            email: formData.email.trim(),
            cpf: formData.cpf.replace(/\D/g, ""),
            cidade: formData.cidade,
            tipo_consorcio: formData.tipoConsorcio,
            valor_credito: rawCredit,
            prazo_meses: rawPrazo,
            dados_cadastro: payloadDadosCadastro,
            observacao: `Ficha de Pré-Cadastro preenchida pelo cliente para geração de contrato em ${new Date().toLocaleDateString("pt-BR")}.`,
          })
          .eq("id", leadId);

        if (error) throw error;
      } else {
        // Se não houver lead_id, insere como novo pré-cadastro no CRM
        const { error } = await (supabase.from("leads") as any).insert({
          nome: formData.nome.trim(),
          celular: rawPhone,
          email: formData.email.trim(),
          cpf: formData.cpf.replace(/\D/g, ""),
          cidade: formData.cidade,
          tipo_consorcio: formData.tipoConsorcio,
          valor_credito: rawCredit,
          prazo_meses: rawPrazo,
          status: "novo_lead",
          origem: "Ficha de Pré-Cadastro Contrato",
          dados_cadastro: payloadDadosCadastro,
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-slate-900 border border-slate-800 text-white p-8 text-center rounded-3xl shadow-2xl space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Pré-Cadastro Enviado! 🎉</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Obrigado, <strong className="text-emerald-400">{formData.nome}</strong>. Suas informações foram registradas no sistema e enviadas para o setor de contratos.
            </p>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
            <p className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4" /> Dados Criptografados & Seguros
            </p>
            <p className="text-slate-400">
              Nosso consultor entrará em contato em instantes com a sua documentação pronta para assinatura digital.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Ficha de Pré-Cadastro • Emissão de Contrato</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Preencha seus dados para <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">gerar o contrato</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Processo 100% seguro e criptografado. Suas informações serão utilizadas exclusivamente para a confecção da sua cota de consórcio.
          </p>
        </div>

        {fetchingLead && (
          <div className="flex items-center justify-center p-6 bg-slate-900 rounded-2xl border border-slate-800 text-cyan-400 gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando informações do cliente...
          </div>
        )}

        {/* Step Indicator Navigation */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
          <button
            onClick={() => setCurrentStep(1)}
            className={`p-3 rounded-2xl border transition-all ${
              currentStep === 1
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Pessoais 👤
          </button>
          <button
            onClick={() => setCurrentStep(2)}
            className={`p-3 rounded-2xl border transition-all ${
              currentStep === 2
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            2. Endereço 📍
          </button>
          <button
            onClick={() => setCurrentStep(3)}
            className={`p-3 rounded-2xl border transition-all ${
              currentStep === 3
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            3. Profissão 💼
          </button>
          <button
            onClick={() => setCurrentStep(4)}
            className={`p-3 rounded-2xl border transition-all ${
              currentStep === 4
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            4. Dados & Envio 🏦
          </button>
        </div>

        {/* Main Form Card */}
        <Card className="bg-slate-900/90 border-slate-800 text-white rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* ETAPA 1: DADOS PESSOAIS */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-base text-white">Dados Pessoais & Documentação</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-300">Nome Completo *</Label>
                      <Input
                        required
                        value={formData.nome}
                        onChange={(e) => handleChange("nome", e.target.value)}
                        placeholder="Ex: João da Silva Santos"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">CPF / CNPJ *</Label>
                      <Input
                        required
                        value={formData.cpf}
                        onChange={(e) => handleChange("cpf", e.target.value)}
                        placeholder="000.000.000-00"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">RG / CNH *</Label>
                      <Input
                        required
                        value={formData.rg}
                        onChange={(e) => handleChange("rg", e.target.value)}
                        placeholder="00.000.000-0"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Órgão Emissor / UF</Label>
                      <Input
                        value={formData.orgaoEmissor}
                        onChange={(e) => handleChange("orgaoEmissor", e.target.value)}
                        placeholder="SSP/PR"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Data de Nascimento *</Label>
                      <Input
                        required
                        type="text"
                        value={formData.dataNascimento}
                        onChange={(e) => handleChange("dataNascimento", e.target.value)}
                        placeholder="DD/MM/AAAA"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Celular / WhatsApp *</Label>
                      <Input
                        required
                        value={formData.celular}
                        onChange={(e) => handleChange("celular", e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-300">E-mail</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="seuemail@cliente.com"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Estado Civil</Label>
                      <Select
                        value={formData.estadoCivil}
                        onValueChange={(val) => handleChange("estadoCivil", val)}
                      >
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                          <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                          <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                          <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                          <SelectItem value="União Estável">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-300">Nome da Mãe *</Label>
                      <Input
                        required
                        value={formData.nomeMae}
                        onChange={(e) => handleChange("nomeMae", e.target.value)}
                        placeholder="Nome completo da mãe"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Naturalidade (Cidade/UF)</Label>
                      <Input
                        value={formData.naturalidade}
                        onChange={(e) => handleChange("naturalidade", e.target.value)}
                        placeholder="Curitiba/PR"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 font-bold px-8 rounded-xl"
                    >
                      Próximo: Endereço ➔
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 2: ENDEREÇO */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-base text-white">Endereço de Residência</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">CEP * (Preenche automático)</Label>
                      <Input
                        required
                        value={formData.cep}
                        onChange={(e) => handleChange("cep", e.target.value)}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-300">Rua / Logradouro *</Label>
                      <Input
                        required
                        value={formData.logradouro}
                        onChange={(e) => handleChange("logradouro", e.target.value)}
                        placeholder="Rua, Avenida, Alameda..."
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Número *</Label>
                      <Input
                        required
                        value={formData.numero}
                        onChange={(e) => handleChange("numero", e.target.value)}
                        placeholder="123"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Complemento</Label>
                      <Input
                        value={formData.complemento}
                        onChange={(e) => handleChange("complemento", e.target.value)}
                        placeholder="Apto 101, Bloco B..."
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Bairro *</Label>
                      <Input
                        required
                        value={formData.bairro}
                        onChange={(e) => handleChange("bairro", e.target.value)}
                        placeholder="Bairro"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Cidade *</Label>
                      <Input
                        required
                        value={formData.cidade}
                        onChange={(e) => handleChange("cidade", e.target.value)}
                        placeholder="Cidade"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">UF *</Label>
                      <Input
                        required
                        value={formData.uf}
                        onChange={(e) => handleChange("uf", e.target.value)}
                        placeholder="PR"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl"
                    >
                      ⬅ Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 font-bold px-8 rounded-xl"
                    >
                      Próximo: Profissão ➔
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 3: PROFISSÃO & FINANCEIRO */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-base text-white">Dados Profissionais & Renda</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Profissão / Cargo *</Label>
                      <Input
                        required
                        value={formData.profissao}
                        onChange={(e) => handleChange("profissao", e.target.value)}
                        placeholder="Ex: Engenheiro, Empresário, Autônomo..."
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Empresa / Ocupação</Label>
                      <Input
                        value={formData.empresa}
                        onChange={(e) => handleChange("empresa", e.target.value)}
                        placeholder="Nome da empresa ou negócio"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Renda Mensal Estimada (R$) *</Label>
                      <Input
                        required
                        value={formData.rendaMensal}
                        onChange={(e) => handleChange("rendaMensal", e.target.value)}
                        placeholder="R$ 8.500,00"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Patrimônio Declarado (Opcional)</Label>
                      <Input
                        value={formData.patrimonio}
                        onChange={(e) => handleChange("patrimonio", e.target.value)}
                        placeholder="R$ 350.000,00"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl"
                    >
                      ⬅ Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 font-bold px-8 rounded-xl"
                    >
                      Próximo: Dados Bancários ➔
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 4: DADOS BANCÁRIOS & ENVIO */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-base text-white">Dados Bancários & Confirmação de Contrato</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Banco Principal</Label>
                      <Input
                        value={formData.banco}
                        onChange={(e) => handleChange("banco", e.target.value)}
                        placeholder="Ex: Itaú, Bradesco, Nubank..."
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Agência</Label>
                      <Input
                        value={formData.agencia}
                        onChange={(e) => handleChange("agencia", e.target.value)}
                        placeholder="0000"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Conta com Dígito</Label>
                      <Input
                        value={formData.conta}
                        onChange={(e) => handleChange("conta", e.target.value)}
                        placeholder="00000-0"
                        className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl h-11"
                      />
                    </div>
                  </div>

                  {/* Resumo do Consórcio */}
                  <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Detalhes do Plano Escolhido
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Tipo do Bem:</span>
                        <strong className="text-white font-bold">{formData.tipoConsorcio || "Imóvel"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Valor do Crédito:</span>
                        <strong className="text-white font-bold">{formData.valorCredito || "A definir"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Prazo Estimado:</span>
                        <strong className="text-white font-bold">{formData.prazoMeses ? `${formData.prazoMeses} meses` : "A definir"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-3">
                    <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Ao clicar em enviar, os dados serão salvos com criptografia no CRM para emissão imediata da proposta e contrato.</span>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(3)}
                      className="border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl"
                    >
                      ⬅ Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-black text-sm px-10 py-6 rounded-2xl shadow-xl shadow-emerald-900/30 flex items-center gap-2"
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
      </div>
    </div>
  );
}
