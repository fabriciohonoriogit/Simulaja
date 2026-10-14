import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  Mail, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  UserCheck, 
  Globe, 
  Percent 
} from "lucide-react";
import { 
  enrichCNPJ, 
  enrichCEP, 
  fetchEconomyIndexes, 
  validateEmailQuality,
  CNPJEnrichmentResult,
  CEPEnrichmentResult,
  EconomyIndexesResult
} from "@/services/enrichmentService";
import { toast } from "sonner";

export function LeadEnrichmentWidget() {
  // CNPJ State
  const [cnpjInput, setCnpjInput] = useState("");
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjData, setCnpjData] = useState<CNPJEnrichmentResult | null>(null);

  // CEP State
  const [cepInput, setCepInput] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepData, setCepData] = useState<CEPEnrichmentResult | null>(null);

  // Economy Rates State
  const [economyRates, setEconomyRates] = useState<EconomyIndexesResult | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  // Email Validation State
  const [emailInput, setEmailInput] = useState("");
  const [emailResult, setEmailResult] = useState<ReturnType<typeof validateEmailQuality> | null>(null);

  useEffect(() => {
    loadEconomyRates();
  }, []);

  const loadEconomyRates = async () => {
    setRatesLoading(true);
    try {
      const data = await fetchEconomyIndexes();
      setEconomyRates(data);
    } catch {
      toast.error("Erro ao carregar taxas de mercado");
    } finally {
      setRatesLoading(false);
    }
  };

  const handleSearchCNPJ = async () => {
    if (!cnpjInput.trim()) {
      toast.error("Digite um CNPJ para buscar");
      return;
    }
    setCnpjLoading(true);
    setCnpjData(null);
    try {
      const result = await enrichCNPJ(cnpjInput);
      if (!result) {
        toast.error("CNPJ não encontrado na Receita Federal");
      } else {
        setCnpjData(result);
        toast.success(`CNPJ ${result.razaoSocial} localizado!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar CNPJ");
    } finally {
      setCnpjLoading(false);
    }
  };

  const handleSearchCEP = async () => {
    if (!cepInput.trim()) {
      toast.error("Digite um CEP para buscar");
      return;
    }
    setCepLoading(true);
    setCepData(null);
    try {
      const result = await enrichCEP(cepInput);
      if (!result) {
        toast.error("CEP não encontrado");
      } else {
        setCepData(result);
        toast.success(`Endereço localizado: ${result.logradouro}, ${result.cidade}-${result.uf}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const handleValidateEmail = () => {
    if (!emailInput.trim()) return;
    const res = validateEmailQuality(emailInput);
    setEmailResult(res);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
              Integrado com Public-APIs
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Central de Enriquecimento de Dados
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Validação instantânea via Receita Federal, BrasilAPI e Banco Central do Brasil.
          </p>
        </div>
      </div>

      <Tabs defaultValue="cnpj" className="w-full">
        <TabsList className="grid grid-cols-4 bg-slate-100 p-1 rounded-2xl mb-6">
          <TabsTrigger value="cnpj" className="rounded-xl font-black text-xs gap-2">
            <Building2 className="h-3.5 w-3.5" />
            Empresas (CNPJ)
          </TabsTrigger>
          <TabsTrigger value="cep" className="rounded-xl font-black text-xs gap-2">
            <MapPin className="h-3.5 w-3.5" />
            Localização (CEP)
          </TabsTrigger>
          <TabsTrigger value="economia" className="rounded-xl font-black text-xs gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Taxas BCB
          </TabsTrigger>
          <TabsTrigger value="email" className="rounded-xl font-black text-xs gap-2">
            <Mail className="h-3.5 w-3.5" />
            Qualidade Email
          </TabsTrigger>
        </TabsList>

        {/* CNPJ Tab */}
        <TabsContent value="cnpj" className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Digite o CNPJ (ex: 00.000.000/0001-00)"
              value={cnpjInput}
              onChange={(e) => setCnpjInput(e.target.value)}
              className="rounded-2xl font-mono text-sm border-slate-200"
            />
            <Button
              onClick={handleSearchCNPJ}
              disabled={cnpjLoading}
              className="rounded-2xl px-6 font-black text-xs gap-2"
            >
              {cnpjLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar CNPJ
            </Button>
          </div>

          {cnpjData && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold mb-1">
                    CNPJ Ativo na Receita
                  </Badge>
                  <h3 className="text-lg font-black text-slate-900">{cnpjData.razaoSocial}</h3>
                  <p className="text-xs text-slate-500 font-mono">{cnpjData.nomeFantasia}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400">Capital Social</p>
                  <p className="text-base font-black text-primary">
                    {cnpjData.capitalSocial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold">Atividade Principal:</span>
                  <p className="text-slate-700 font-semibold">{cnpjData.cnaeDescricao}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Localização:</span>
                  <p className="text-slate-700 font-semibold">{cnpjData.municipio} - {cnpjData.uf}</p>
                </div>
              </div>

              {cnpjData.socios.length > 0 && (
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-primary" /> Quadro de Sócios ({cnpjData.socios.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cnpjData.socios.map((s, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1 rounded-xl font-bold">
                        {s.nome} ({s.qualificacao || "Sócio"})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* CEP Tab */}
        <TabsContent value="cep" className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Digite o CEP (ex: 01001-000)"
              value={cepInput}
              onChange={(e) => setCepInput(e.target.value)}
              className="rounded-2xl font-mono text-sm border-slate-200"
            />
            <Button
              onClick={handleSearchCEP}
              disabled={cepLoading}
              className="rounded-2xl px-6 font-black text-xs gap-2"
            >
              {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar CEP
            </Button>
          </div>

          {cepData && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-black text-slate-900">
                  {cepData.logradouro}, {cepData.bairro}
                </h3>
              </div>
              <p className="text-sm text-slate-600 font-semibold">
                {cepData.cidade} - {cepData.uf} (CEP: {cepData.cep})
              </p>
              {cepData.latitude && cepData.longitude && (
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs text-slate-500 font-mono">
                  📍 Coordenadas de Visita: Lat {cepData.latitude}, Lng {cepData.longitude}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Economia Tab */}
        <TabsContent value="economia" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Taxas oficiais extraídas diretamente do **Banco Central do Brasil** via BrasilAPI.
            </p>
            <Button variant="outline" size="sm" onClick={loadEconomyRates} disabled={ratesLoading} className="rounded-xl text-xs font-bold">
              {ratesLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Atualizar Taxas"}
            </Button>
          </div>

          {economyRates && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 text-center">
                <p className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Taxa Selic</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">{economyRates.selic}%</p>
                <p className="text-[9px] text-emerald-500 mt-1 font-bold">ao ano</p>
              </div>

              <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 text-center">
                <p className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Taxa CDI</p>
                <p className="text-3xl font-black text-blue-600 mt-1">{economyRates.cdi}%</p>
                <p className="text-[9px] text-blue-500 mt-1 font-bold">referência mercado</p>
              </div>

              <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100 text-center">
                <p className="text-[10px] font-black uppercase text-purple-700 tracking-wider">Inflação IPCA</p>
                <p className="text-3xl font-black text-purple-600 mt-1">{economyRates.ipca}%</p>
                <p className="text-[9px] text-purple-500 mt-1 font-bold">acumulada</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Email Quality Tab */}
        <TabsContent value="email" className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Digite o e-mail do lead..."
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setEmailResult(null);
              }}
              className="rounded-2xl text-sm border-slate-200"
            />
            <Button onClick={handleValidateEmail} className="rounded-2xl px-6 font-black text-xs">
              Validar E-mail
            </Button>
          </div>

          {emailResult && (
            <div className={`p-4 rounded-2xl border ${emailResult.isValid ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"} flex items-center gap-3`}>
              {emailResult.isValid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-black text-emerald-800">E-mail Válido e Confiável</p>
                    <p className="text-xs text-emerald-600">Provedor autêntico detectado.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-black text-red-800">Atenção ao E-mail</p>
                    <p className="text-xs text-red-600">{emailResult.message}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
