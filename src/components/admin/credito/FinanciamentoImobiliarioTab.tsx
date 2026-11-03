import React, { useState, useMemo, useEffect } from "react";
import { 
  Building2, 
  Calculator, 
  TrendingDown, 
  TrendingUp, 
  Percent, 
  Calendar, 
  ShieldCheck, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle, 
  Landmark, 
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  ArrowRight,
  BadgeCheck,
  UserCheck,
  Clock,
  Coins,
  Receipt,
  FileCheck2,
  SlidersHorizontal,
  RefreshCw
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { 
  simularFinanciamentoImobiliario, 
  SistemaAmortizacao, 
  PRESETS_FINANCIAMENTO_CAIXA,
  FinanciamentoResultado,
  calcularPrazoMaximoPorDataNascimento,
  PRAZO_MAXIMO_ABSOLUTO_CAIXA_MESES
} from "@/lib/financiamentoCaixa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Parsing seguro de valores monetários no padrão brasileiro (ex: "500.000", "500.000,00", "135.688,77")
 */
export const parseMoeda = (val: string | number): number => {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).trim();
  if (str.includes(",")) {
    const clean = str.replace(/\./g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    return parseFloat(str.replace(/\./g, "")) || 0;
  }
  return parseFloat(str) || 0;
};

/**
 * Parsing seguro de taxas e percentuais (ex: "11.49", "11,49", "0.0280", "0,0280")
 * NUNCA remove o ponto decimal.
 */
export const parseTaxaPercentual = (val: string | number): number => {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).trim();
  const clean = str.replace(",", ".");
  return parseFloat(clean) || 0;
};

export function FinanciamentoImobiliarioTab() {
  // Input states com base nos valores oficiais da simulação Caixa
  const [valorImovelInput, setValorImovelInput] = useState("500.000");
  const [valorEntradaInput, setValorEntradaInput] = useState("135.688,77");
  const [percentualEntradaAtivo, setPercentualEntradaAtivo] = useState<number | null>(null);
  
  // Data de nascimento e prazo livres seguindo a regra da Caixa
  const [dataNascimentoInput, setDataNascimentoInput] = useState<string>("05/01/1977");
  const [prazoMesesInput, setPrazoMesesInput] = useState<string>("369");
  const [idadeManual, setIdadeManual] = useState<number | null>(null);

  const [sistemaAmortizacao, setSistemaAmortizacao] = useState<SistemaAmortizacao>("SAC");
  const [presetSelecionado, setPresetSelecionado] = useState<string>("caixa-balcao");
  const [taxaJurosAnualInput, setTaxaJurosAnualInput] = useState<string>("11,49");
  const [mostrarEncargosAvancados, setMostrarEncargosAvancados] = useState(false);
  const [taxaAdminMensalInput, setTaxaAdminMensalInput] = useState("25,00");
  const [taxaDFIInput, setTaxaDFIInput] = useState("0,0095");
  const [taxaMIPInput, setTaxaMIPInput] = useState(""); // vazio = calculado pela idade automaticamente
  const [nomeCliente, setNomeCliente] = useState("");

  // ==========================================
  // PARÂMETROS ABERTOS DO CONSÓRCIO IMOBILIÁRIO
  // ==========================================
  // Padrão: 500mil (valor integral do imóvel que o cliente busca)
  const [creditoConsorcioInput, setCreditoConsorcioInput] = useState<string>("500.000");
  const [prazoConsorcioInput, setPrazoConsorcioInput] = useState<string>("220");
  const [taxaAdmConsorcioInput, setTaxaAdmConsorcioInput] = useState<string>("19,00"); // 18% taxa + 1% FR
  const [taxaINCCAnualInput, setTaxaINCCAnualInput] = useState<string>("5,50");
  const [projetarINCC, setProjetarINCC] = useState<boolean>(true);
  const [mostrarConfigConsorcio, setMostrarConfigConsorcio] = useState<boolean>(true);

  // Cálculo da data de nascimento oficial Caixa
  const infoNascimento = useMemo(() => {
    if (!dataNascimentoInput.trim()) return null;
    return calcularPrazoMaximoPorDataNascimento(dataNascimentoInput);
  }, [dataNascimentoInput]);

  // Idade efetiva
  const idadeProponente = useMemo(() => {
    if (idadeManual !== null) return idadeManual;
    if (infoNascimento && infoNascimento.valido) return infoNascimento.idadeAnos;
    return 49;
  }, [idadeManual, infoNascimento]);

  const valorImovel = useMemo(() => parseMoeda(valorImovelInput), [valorImovelInput]);
  const valorEntrada = useMemo(() => parseMoeda(valorEntradaInput), [valorEntradaInput]);
  const prazoMeses = useMemo(() => Math.max(1, parseInt(prazoMesesInput) || 369), [prazoMesesInput]);
  const taxaJurosAnual = useMemo(() => parseTaxaPercentual(taxaJurosAnualInput), [taxaJurosAnualInput]);
  const taxaAdminMensal = useMemo(() => parseMoeda(taxaAdminMensalInput) || 25, [taxaAdminMensalInput]);
  const taxaDFIPercentual = useMemo(() => parseTaxaPercentual(taxaDFIInput) || 0.0095, [taxaDFIInput]);
  
  const taxaMIPPercentual = useMemo(() => {
    if (!taxaMIPInput.trim()) return undefined;
    return parseTaxaPercentual(taxaMIPInput);
  }, [taxaMIPInput]);

  // ITBI e outras despesas (aproximadamente 5% do imóvel - padrão Caixa)
  const itbiDespesas = useMemo(() => valorImovel * 0.05, [valorImovel]);

  // Handler para botões rápidos de percentual de entrada
  const handleSelecionarPercentualEntrada = (pct: number) => {
    setPercentualEntradaAtivo(pct);
    const novoValorEntrada = (valorImovel * pct) / 100;
    setValorEntradaInput(novoValorEntrada.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  // Handler para alteração do valor do imóvel (recalcula entrada e sincroniza consórcio se aplicável)
  const handleValorImovelChange = (val: string) => {
    setValorImovelInput(val);
    const num = parseMoeda(val);
    if (percentualEntradaAtivo !== null && num > 0) {
      const novoValorEntrada = (num * percentualEntradaAtivo) / 100;
      setValorEntradaInput(novoValorEntrada.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  };

  // Handler para alteração direta da entrada
  const handleValorEntradaChange = (val: string) => {
    setValorEntradaInput(val);
    setPercentualEntradaAtivo(null);
  };

  // Handler para alteração da data de nascimento
  const handleDataNascimentoChange = (val: string) => {
    setDataNascimentoInput(val);
    setIdadeManual(null);
    const info = calcularPrazoMaximoPorDataNascimento(val);
    if (info && info.valido) {
      if (prazoMeses > info.prazoMaximoMeses) {
        setPrazoMesesInput(String(info.prazoMaximoMeses));
      }
    }
  };

  // Handler para presets da Caixa
  const handleSelecionarPreset = (presetId: string) => {
    setPresetSelecionado(presetId);
    const preset = PRESETS_FINANCIAMENTO_CAIXA.find(p => p.id === presetId);
    if (preset) {
      setTaxaJurosAnualInput(preset.taxaAnual.toString().replace(".", ","));
    }
  };

  // Simulação calculada com precisão oficial da Caixa
  const resultado: FinanciamentoResultado = useMemo(() => {
    return simularFinanciamentoImobiliario({
      valorImovel,
      valorEntrada,
      prazoMeses,
      taxaJurosAnual,
      sistemaAmortizacao,
      idadeProponente,
      taxaAdminMensal,
      taxaDFIPercentual,
      taxaMIPPercentual
    });
  }, [
    valorImovel, 
    valorEntrada, 
    prazoMeses, 
    taxaJurosAnual, 
    sistemaAmortizacao, 
    idadeProponente,
    taxaAdminMensal, 
    taxaDFIPercentual, 
    taxaMIPPercentual
  ]);

  // ========================================================
  // CÁLCULO COMPLETO E ABERTO DO CONSÓRCIO IMOBILIÁRIO (500K)
  // ========================================================
  const creditoConsorcio = useMemo(() => parseMoeda(creditoConsorcioInput) || valorImovel, [creditoConsorcioInput, valorImovel]);
  const prazoConsorcio = useMemo(() => Math.max(1, parseInt(prazoConsorcioInput) || 220), [prazoConsorcioInput]);
  const taxaAdmConsorcio = useMemo(() => parseTaxaPercentual(taxaAdmConsorcioInput) || 19, [taxaAdmConsorcioInput]);
  const taxaINCCAnual = useMemo(() => parseTaxaPercentual(taxaINCCAnualInput) || 5.5, [taxaINCCAnualInput]);

  const consorcioEstimado = useMemo(() => {
    const cred = creditoConsorcio;
    const n = prazoConsorcio;
    const taxaTotal = taxaAdmConsorcio / 100; // Ex: 19% = 0.19
    const inccTaxa = taxaINCCAnual / 100; // Ex: 5.5% a.a.

    // 1. Valores Nominais (na contratação / sem INCC)
    const totalPagoNominal = cred * (1 + taxaTotal);
    const parcelaLinear = totalPagoNominal / n;
    const parcela5050 = (cred * (0.5 + taxaTotal)) / n;

    // 2. Projeção com INCC anual (parcelas corrigidas a cada 12 meses)
    let somaParcelasComINCC = 0;
    let parcelaCorrente = parcelaLinear;
    const totalAnos = Math.ceil(n / 12);

    for (let ano = 1; ano <= totalAnos; ano++) {
      const mesesNesteAno = Math.min(12, n - (ano - 1) * 12);
      somaParcelasComINCC += parcelaCorrente * mesesNesteAno;
      parcelaCorrente *= (1 + inccTaxa);
    }

    const totalPagoComINCC = somaParcelasComINCC;
    const parcelaMediaComINCC = totalPagoComINCC / n;
    const creditoFinalAtualizado = cred * Math.pow(1 + inccTaxa, n / 12);

    // Comparativo contra o desembolso total da Caixa
    const totalDesembolsoCaixa = resultado.valorEntrada + resultado.totalFinanciamentoPago;
    const economiaVsCaixa = totalDesembolsoCaixa - totalPagoNominal;
    const economiaVsFinanciado = resultado.totalFinanciamentoPago - totalPagoNominal;

    // Oportunidade de usar a entrada da Caixa como Lance Livre no consórcio
    const percentualLanceEntrada = (resultado.valorEntrada / cred) * 100;

    return {
      credito: cred,
      prazo: n,
      taxaAdmTotal: taxaAdmConsorcio,
      taxaINCC: taxaINCCAnual,
      parcelaLinear,
      parcela5050,
      totalPago: totalPagoNominal,
      parcelaMediaComINCC,
      totalPagoComINCC,
      creditoFinalAtualizado,
      economiaVsCaixa: Math.max(0, economiaVsCaixa),
      economiaVsFinanciado: Math.max(0, economiaVsFinanciado),
      percentualLanceEntrada
    };
  }, [creditoConsorcio, prazoConsorcio, taxaAdmConsorcio, taxaINCCAnual, resultado]);

  // Compartilhar proposta no WhatsApp
  const handleShareWhatsApp = () => {
    let msg = `🏠 *ESTUDO COMPARATIVO DE CRÉDITO IMOBILIÁRIO*\n`;
    if (nomeCliente.trim()) {
      msg += `👤 *Cliente:* ${nomeCliente.trim()}\n`;
    }
    msg += `🏦 *Modalidade 1:* Financiamento Imobiliário Caixa (${resultado.sistema})\n`;
    if (dataNascimentoInput) {
      msg += `🎂 *Data de Nascimento:* ${dataNascimentoInput} (${idadeProponente} anos | Prazo Máximo Caixa: ${infoNascimento?.prazoMaximoMeses || 369}m)\n\n`;
    }
    msg += `📍 *Valor do Imóvel:* ${formatCurrency(resultado.valorImovel)}\n`;
    msg += `💵 *Entrada Exigida na Caixa:* ${formatCurrency(resultado.valorEntrada)} (${((resultado.valorEntrada / (resultado.valorImovel || 1)) * 100).toFixed(1)}%)\n`;
    msg += `💰 *Crédito Financiado Caixa:* ${formatCurrency(resultado.valorFinanciado)}\n`;
    msg += `⏱️ *Prazo Caixa:* ${resultado.prazoMeses} meses (${(resultado.prazoMeses / 12).toFixed(1)} anos)\n`;
    msg += `📊 *Taxa Efetiva Estimada:* ${resultado.taxaJurosAnual.toFixed(2)}% a.a.\n`;
    msg += `💳 *1ª Parcela Caixa:* ${formatCurrency(resultado.primeiraParcela)}\n`;
    msg += `🏛️ *TOTAL PAGO NO BANCO:* ${formatCurrency(resultado.totalFinanciamentoPago + resultado.valorEntrada)} (com entrada)\n`;
    msg += `💸 *Juros & Encargos do Banco:* ${formatCurrency(resultado.custoExtraTotal)}\n\n`;

    msg += `─────────────────────\n`;
    msg += `🎯 *MODALIDADE 2: CONSÓRCIO IMOBILIÁRIO (CRÉDITO DE ${formatCurrency(consorcioEstimado.credito)})*\n`;
    msg += `• Prazo do Consórcio: *${consorcioEstimado.prazo} meses*\n`;
    msg += `• Taxa Administrativa Total: *${consorcioEstimado.taxaAdmTotal.toFixed(2)}%* (ZERO JUROS BANCÁRIOS)\n`;
    msg += `• Meia Parcela (50/50): *${formatCurrency(consorcioEstimado.parcela5050)}/mês*\n`;
    msg += `• Parcela Integral (100%): *${formatCurrency(consorcioEstimado.parcelaLinear)}/mês*\n`;
    if (projetarINCC) {
      msg += `• Correção Anual INCC: *~${consorcioEstimado.taxaINCC.toFixed(2)}% a.a.* (Valoriza a sua carta de crédito na mesma proporção)\n`;
    }
    msg += `• Custo Total do Consórcio: *${formatCurrency(consorcioEstimado.totalPago)}*\n\n`;

    msg += `💰 *ECONOMIA REAL NO CONSÓRCIO:* *${formatCurrency(consorcioEstimado.economiaVsCaixa)}* poupados de juros bancários!\n`;
    msg += `🚀 *Estratégia de Lance:* A entrada de ${formatCurrency(resultado.valorEntrada)} vira um Lance Livre de *${consorcioEstimado.percentualLanceEntrada.toFixed(1)}%* para contemplar rapidamente!\n\n`;
    msg += `💬 _Gerado via Análise do Crédito — SimulaJá / Jarvis_`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://web.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const handleCopyResumo = () => {
    const texto = `Comparativo Caixa vs Consórcio (${formatCurrency(resultado.valorImovel)}): Caixa 1ª Parcela ${formatCurrency(resultado.primeiraParcela)} em ${resultado.prazoMeses}m (Total ${formatCurrency(resultado.totalFinanciamentoPago)}). Consórcio ${formatCurrency(consorcioEstimado.credito)} em ${consorcioEstimado.prazo}m (Taxa ${consorcioEstimado.taxaAdmTotal}%, Parcela ${formatCurrency(consorcioEstimado.parcelaLinear)}). Economia Real: ${formatCurrency(consorcioEstimado.economiaVsCaixa)}.`;
    navigator.clipboard.writeText(texto);
    toast.success("Resumo copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      {/* GRID PRINCIPAL: FORMULÁRIO À ESQUERDA + RESULTADOS À DIREITA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* FORMULÁRIO DE ENTRADA (COL 12 / LG 4) - CLEAN AI DESIGN */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border border-slate-200/90 shadow-xs bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-blue-50/30 border-b border-slate-200/80 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-slate-900 tracking-tight">
                      Parâmetros da Caixa
                    </CardTitle>
                    <p className="text-[11px] font-medium text-slate-500">
                      Simulação oficial SFH / SFI
                    </p>
                  </div>
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-black text-[10px] uppercase">
                  Regras CEF
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Nome do Cliente (Opcional) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                  Nome do Proponente / Cliente (Opcional)
                </label>
                <Input 
                  placeholder="Ex: João da Silva" 
                  value={nomeCliente}
                  onChange={e => setNomeCliente(e.target.value)}
                  className="h-9 text-xs bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl"
                />
              </div>

              {/* Data de Nascimento do Proponente (Regra Oficial da Caixa) */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100/80">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Data de Nascimento</span>
                  </label>
                  <span className="text-[10px] font-bold text-indigo-600">
                    {idadeProponente} anos
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="DD/MM/AAAA (ex: 05/01/1977)" 
                    value={dataNascimentoInput}
                    onChange={e => handleDataNascimentoChange(e.target.value)}
                    className="h-9 text-sm font-black text-indigo-950 bg-white border-indigo-200 rounded-xl"
                  />
                  {infoNascimento && infoNascimento.prazoMaximoMeses && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPrazoMesesInput(String(infoNascimento.prazoMaximoMeses))}
                      className="h-9 text-[11px] font-bold text-indigo-700 bg-white border-indigo-200 hover:bg-indigo-50 shrink-0 rounded-xl"
                      title="Usar prazo máximo da Caixa"
                    >
                      {infoNascimento.prazoMaximoMeses}m Max
                    </Button>
                  )}
                </div>

                {infoNascimento && (
                  <div className="flex items-center justify-between text-[10px] text-indigo-900 font-medium pt-0.5">
                    <span>Prazo máx pela idade: <strong>{infoNascimento.prazoMaximoMeses} meses</strong></span>
                    <span>Término: <strong>{infoNascimento.dataLimiteQuitacao}</strong></span>
                  </div>
                )}
              </div>

              {/* Alerta de Violação da Regra da Caixa (Idade + Prazo > 80.5 anos) */}
              {!resultado.regraIdade.valido && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-[11px]">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Regra dos 80 anos e 6 meses excedida</span>
                  </div>
                  <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                    {resultado.regraIdade.motivoInvalido}
                  </p>
                  {resultado.regraIdade.prazoMaximoPermitidoMeses > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrazoMesesInput(String(resultado.regraIdade.prazoMaximoPermitidoMeses))}
                      className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[10px] shadow-xs flex items-center justify-center gap-1 transition-all"
                    >
                      <Sparkles className="h-3 w-3" /> Ajustar para {resultado.regraIdade.prazoMaximoPermitidoMeses} meses ({(resultado.regraIdade.prazoMaximoPermitidoMeses / 12).toFixed(1)} anos)
                    </button>
                  )}
                </div>
              )}

              {/* Valor do Imóvel */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center justify-between">
                  <span>Valor de Avaliação do Imóvel (R$)</span>
                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                </label>
                <Input 
                  placeholder="500.000" 
                  value={valorImovelInput}
                  onChange={e => handleValorImovelChange(e.target.value)}
                  className="h-10 text-base font-black text-slate-900 bg-slate-50/50 focus:bg-white border-slate-200 rounded-xl"
                />
              </div>

              {/* Valor da Entrada & Atalhos de % */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">
                    Entrada / Recursos Próprios (R$)
                  </label>
                  <span className="text-[10px] font-bold text-blue-600">
                    {((valorEntrada / (valorImovel || 1)) * 100).toFixed(1)}% do imóvel
                  </span>
                </div>
                <Input 
                  placeholder="135.688,77" 
                  value={valorEntradaInput}
                  onChange={e => handleValorEntradaChange(e.target.value)}
                  className="h-9 text-sm font-bold text-slate-800 bg-slate-50/50 focus:bg-white border-slate-200 rounded-xl"
                />
                
                {/* Botões Rápidos de Entrada */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[20, 27.14, 30, 40].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleSelecionarPercentualEntrada(pct)}
                      className={cn(
                        "py-1 px-1.5 text-[10px] font-black rounded-lg border transition-all text-center",
                        percentualEntradaAtivo === pct
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {pct === 27.14 ? "27,1% (Caixa)" : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saldo Financiado em destaque Clean */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Crédito a ser Financiado</p>
                  <p className="text-base font-black text-slate-900">{formatCurrency(resultado.valorFinanciado)}</p>
                </div>
                <Badge variant="outline" className="bg-white text-slate-800 border-slate-300 font-bold text-[10px]">
                  {prazoMeses} meses
                </Badge>
              </div>

              {/* Prazo Livre (Input + Atalhos) */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-500" /> Prazo do Financiamento
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">
                    {(prazoMeses / 12).toFixed(1)} anos ({prazoMeses} meses)
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    min="1"
                    max={PRAZO_MAXIMO_ABSOLUTO_CAIXA_MESES}
                    value={prazoMesesInput}
                    onChange={e => setPrazoMesesInput(e.target.value)}
                    placeholder="369"
                    className="h-9 text-sm font-black text-slate-900 bg-slate-50/50 focus:bg-white border-slate-200 rounded-xl"
                  />
                  <span className="text-xs font-bold text-slate-500 shrink-0">meses</span>
                </div>

                {/* Atalhos rápidos de prazo */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[369, 360, 240, 180].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrazoMesesInput(String(p))}
                      className={cn(
                        "py-1 px-1 text-[10px] font-black rounded-lg border transition-all text-center",
                        prazoMeses === p
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {p === 369 ? "369m (Max)" : `${p}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sistema de Amortização (SAC vs PRICE) */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center justify-between">
                  <span>Sistema de Amortização</span>
                  <span className="text-[9px] font-normal text-slate-500">Caixa adota SAC</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/70 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSistemaAmortizacao("SAC")}
                    className={cn(
                      "py-2 px-2 rounded-lg text-xs font-black transition-all text-center flex flex-col items-center justify-center gap-0.5",
                      sistemaAmortizacao === "SAC"
                        ? "bg-white text-indigo-900 shadow-xs border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <span>SAC</span>
                    <span className="text-[9px] font-medium text-slate-400">Parcelas Decrescentes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSistemaAmortizacao("PRICE")}
                    className={cn(
                      "py-2 px-2 rounded-lg text-xs font-black transition-all text-center flex flex-col items-center justify-center gap-0.5",
                      sistemaAmortizacao === "PRICE"
                        ? "bg-white text-indigo-900 shadow-xs border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <span>PRICE</span>
                    <span className="text-[9px] font-medium text-slate-400">Parcelas Fixas</span>
                  </button>
                </div>
              </div>

              {/* Taxa de Juros Anual & Presets da Caixa */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center justify-between">
                  <span>Taxa de Juros Anual (% a.a.)</span>
                  <Percent className="h-3.5 w-3.5 text-indigo-600" />
                </label>
                
                {/* Presets Caixa */}
                <div className="space-y-1.5">
                  {PRESETS_FINANCIAMENTO_CAIXA.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelecionarPreset(p.id)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between",
                        presetSelecionado === p.id
                          ? "bg-indigo-50/70 border-indigo-300 text-indigo-950 font-bold shadow-xs"
                          : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/70"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-black truncate">{p.nome}</span>
                          <span className="text-[9px] bg-white border px-1 rounded text-slate-500 uppercase">{p.badge}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 line-clamp-1">{p.descricao}</p>
                      </div>
                      <span className="text-xs font-black text-indigo-700 shrink-0">
                        {p.taxaAnual.toFixed(2)}%
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">Taxa personalizada:</span>
                    <Input 
                      placeholder="11,49"
                      value={taxaJurosAnualInput}
                      onChange={e => {
                        setTaxaJurosAnualInput(e.target.value);
                        setPresetSelecionado("custom");
                      }}
                      className="h-8 text-xs font-bold bg-slate-50/50 focus:bg-white border-slate-200 rounded-xl"
                    />
                    <span className="text-xs font-bold text-slate-400">% a.a.</span>
                  </div>
                </div>
              </div>

              {/* Encargos Adicionais da Caixa (CET - Tarifas e Seguros) */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarEncargosAvancados(!mostrarEncargosAvancados)}
                  className="w-full flex items-center justify-between text-[11px] font-black text-slate-600 hover:text-slate-900 py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Encargos Caixa & CET (MIP, DFI, Tarifa)
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", mostrarEncargosAvancados && "rotate-180")} />
                </button>

                {mostrarEncargosAvancados && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-600">Tarifa Adm Mensal Caixa:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">R$</span>
                        <Input 
                          value={taxaAdminMensalInput}
                          onChange={e => setTaxaAdminMensalInput(e.target.value)}
                          className="h-7 w-20 text-[11px] font-bold text-right bg-white rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-600">Seguro DFI (Danos Físicos):</span>
                      <div className="flex items-center gap-1">
                        <Input 
                          value={taxaDFIInput}
                          onChange={e => setTaxaDFIInput(e.target.value)}
                          className="h-7 w-20 text-[11px] font-bold text-right bg-white rounded-lg"
                        />
                        <span className="text-[10px] text-slate-400">% a.m.</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-600">Seguro MIP (Personalizado):</span>
                      <div className="flex items-center gap-1">
                        <Input 
                          placeholder={`${(resultado.aliquotaMIPPercentual).toFixed(4)}`}
                          value={taxaMIPInput}
                          onChange={e => setTaxaMIPInput(e.target.value)}
                          className="h-7 w-20 text-[11px] font-bold text-right bg-white rounded-lg"
                        />
                        <span className="text-[10px] text-slate-400">% a.m.</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 italic pt-1">
                      O DFI incide sobre o valor do imóvel e o MIP sobre o saldo devedor mensal (calculado automaticamente com base na idade).
                    </p>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 space-y-2">
                <Button 
                  onClick={handleShareWhatsApp}
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase gap-2 shadow-xs rounded-xl"
                >
                  <Share2 className="h-4 w-4" /> Enviar Comparativo no WhatsApp
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCopyResumo}
                    className="flex-1 h-9 text-xs font-bold gap-1.5 rounded-xl border-slate-200"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-600" /> Copiar Resumo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.print()}
                    className="flex-1 h-9 text-xs font-bold gap-1.5 rounded-xl border-slate-200"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-600" /> Imprimir PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PAINEL DE RESULTADOS E IMPACTO COMERCIAL (COL 12 / LG 8) - TOTALMENTE CLEAN AI */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* GRID OFICIAL DA CAIXA (8 CARDS CLEAN IDÊNTICOS AO PORTAL DA CAIXA) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-blue-600" /> Simulação Oficial da Caixa Econômica Federal
              </span>
              <Badge variant="outline" className="text-[10px] font-bold text-slate-600 border-slate-300">
                Padrão Caixa SFH
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* Card 1: Valor do imóvel (borda âmbar/laranja suave) */}
              <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-4 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <Building2 className="h-4 w-4" />
                  <span className="text-[11px] font-bold text-slate-600">Valor do imóvel</span>
                </div>
                <p className="text-xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(resultado.valorImovel)}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Valor estimado do imóvel
                </p>
              </div>

              {/* Card 2: Valor mínimo de entrada (borda azul suave) */}
              <div className="bg-white border-2 border-blue-300/80 rounded-2xl p-4 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-blue-600">
                  <span className="font-black text-sm">$</span>
                  <span className="text-[11px] font-bold text-slate-600">Valor mínimo de entrada</span>
                </div>
                <p className="text-xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(resultado.valorEntrada)}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {((resultado.valorEntrada / (resultado.valorImovel || 1)) * 100).toFixed(1)}% do valor
                </p>
              </div>

              {/* Card 3: Valor máximo de financiamento (borda slate/cinza suave) */}
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calculator className="h-4 w-4" />
                  <span className="text-[11px] font-bold text-slate-600">Valor de financiamento</span>
                </div>
                <p className="text-xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(resultado.valorFinanciado)}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Valor a ser financiado
                </p>
              </div>

              {/* Card 4: Taxa efetiva (borda slate/cinza suave) */}
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Info className="h-4 w-4" />
                  <span className="text-[11px] font-bold text-slate-600">Taxa efetiva</span>
                </div>
                <p className="text-xl font-black text-slate-900 tracking-tight">
                  {resultado.taxaJurosAnual.toFixed(2)}% a.a.
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Taxa anual estimada
                </p>
              </div>

              {/* Card 5: Sistema de amortização (borda slate/cinza suave) */}
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Info className="h-4 w-4" />
                  <span className="text-[11px] font-bold text-slate-600">Sistema de amortização</span>
                </div>
                <p className="text-xl font-black text-slate-900 tracking-tight">
                  {resultado.sistema}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {resultado.sistema === "SAC" ? "Parcelas decrescentes" : "Parcelas fixas"}
                </p>
              </div>

              {/* Card 6: Primeira Parcela (borda verde/esmeralda suave) */}
              <div className="bg-white border-2 border-emerald-400 rounded-2xl p-4 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="font-black text-sm">$</span>
                  <span className="text-[11px] font-bold text-slate-600">Primeira Parcela</span>
                </div>
                <p className="text-xl font-black text-emerald-700 tracking-tight">
                  {formatCurrency(resultado.primeiraParcela)}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {resultado.sistema === "SAC" ? `Última: ${formatCurrency(resultado.ultimaParcela)}` : "Parcela Fixa"}
                </p>
              </div>

              {/* Card 7: ITBI e outras despesas (borda rose/vermelha suave) */}
              <div className="bg-white border-2 border-rose-300/80 rounded-2xl p-4 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-rose-600">
                  <span className="font-black text-sm">$</span>
                  <span className="text-[11px] font-bold text-slate-600">ITBI e outras despesas</span>
                </div>
                <p className="text-xl font-black text-rose-700 tracking-tight">
                  {formatCurrency(itbiDespesas)}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Aproximadamente 5% do valor
                </p>
              </div>

              {/* Card 8: Prazo máximo (borda âmbar/laranja suave) */}
              <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-4 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <Calendar className="h-4 w-4" />
                  <span className="text-[11px] font-bold text-slate-600">Prazo máximo</span>
                </div>
                <p className="text-xl font-black text-slate-900 tracking-tight">
                  {resultado.prazoMeses} meses
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Prazo estimado de acordo com a idade
                </p>
              </div>

              {/* Card 9: Total Pago ao Banco (Destaque Clean) */}
              <div className="bg-white border-2 border-rose-200 rounded-2xl p-4 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-700">
                    <Landmark className="h-4 w-4" />
                    <span className="text-[11px] font-bold text-slate-600">Total Pago ao Banco</span>
                  </div>
                  <Badge variant="destructive" className="text-[9px] px-1 py-0">
                    {resultado.multiplicadorImovel.toFixed(2)}x
                  </Badge>
                </div>
                <p className="text-xl font-black text-rose-700 tracking-tight">
                  {formatCurrency(resultado.totalFinanciamentoPago)}
                </p>
                <p className="text-[11px] text-rose-600 font-medium">
                  + {formatCurrency(resultado.custoExtraTotal)} só de juros
                </p>
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* CARD COMPARATIVO ESTRATÉGICO: FINANCIAMENTO VS CONSÓRCIO */}
          {/* ======================================================== */}
          <Card className="border border-indigo-100 shadow-sm bg-gradient-to-br from-white via-indigo-50/15 to-slate-50/40 rounded-3xl overflow-hidden relative">
            <CardContent className="p-6 md:p-8 space-y-6">
              
              {/* Header Clean AI */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-200/60 text-indigo-600 rounded-2xl shadow-xs">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                        Análise de Inteligência Financeira
                      </span>
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2 py-0.5">
                        Economia Comprovada
                      </Badge>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Financiamento Caixa vs. Consórcio Imobiliário
                    </h3>
                  </div>
                </div>

                {/* Botão de Toggle para customizar parâmetros do consórcio */}
                <button
                  type="button"
                  onClick={() => setMostrarConfigConsorcio(!mostrarConfigConsorcio)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-800 text-xs font-bold transition-all shadow-xs"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Configurar Consórcio ({formatCurrency(consorcioEstimado.credito)})</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", mostrarConfigConsorcio && "rotate-180")} />
                </button>
              </div>

              {/* PAINEL EXPANSÍVEL: PARÂMETROS ABERTOS DO CONSÓRCIO (CRÉDITO 500K, TAXA, PRAZO, INCC) */}
              {mostrarConfigConsorcio && (
                <div className="p-4 bg-white/90 border border-indigo-100 rounded-2xl space-y-3.5 animate-in fade-in shadow-xs">
                  <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                    <span className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                      <BadgeCheck className="h-4 w-4 text-emerald-600" /> Parâmetros em Aberto do Consórcio Imobiliário
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCreditoConsorcioInput(valorImovelInput);
                        setPrazoConsorcioInput("220");
                        setTaxaAdmConsorcioInput("19,00");
                        setTaxaINCCAnualInput("5,50");
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Restaurar Padrões
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    
                    {/* Campo 1: Crédito do Consórcio (Padrão: 500.000) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">
                        Crédito da Carta (R$)
                      </label>
                      <Input 
                        value={creditoConsorcioInput}
                        onChange={e => setCreditoConsorcioInput(e.target.value)}
                        placeholder="500.000"
                        className="h-8 text-xs font-black text-slate-900 bg-slate-50/50 rounded-lg"
                      />
                      <div className="flex gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setCreditoConsorcioInput(valorImovelInput)}
                          className="text-[9px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200"
                          title="Igualar ao valor do imóvel"
                        >
                          Imóvel ({formatCurrency(valorImovel)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreditoConsorcioInput(resultado.valorFinanciado.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }))}
                          className="text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                          title="Igualar ao crédito financiado"
                        >
                          Financiado
                        </button>
                      </div>
                    </div>

                    {/* Campo 2: Taxa Administrativa Total */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">
                        Taxa Adm Total (% no prazo)
                      </label>
                      <Input 
                        value={taxaAdmConsorcioInput}
                        onChange={e => setTaxaAdmConsorcioInput(e.target.value)}
                        placeholder="19,00"
                        className="h-8 text-xs font-black text-slate-900 bg-slate-50/50 rounded-lg"
                      />
                      <div className="flex gap-1 pt-0.5">
                        {[15, 17, 19, 21].map(tx => (
                          <button
                            key={tx}
                            type="button"
                            onClick={() => setTaxaAdmConsorcioInput(String(tx))}
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all",
                              taxaAdmConsorcio === tx 
                                ? "bg-indigo-600 text-white border-indigo-600" 
                                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                            )}
                          >
                            {tx}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Campo 3: Prazo do Consórcio (meses) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">
                        Prazo do Consórcio
                      </label>
                      <Input 
                        type="number"
                        value={prazoConsorcioInput}
                        onChange={e => setPrazoConsorcioInput(e.target.value)}
                        placeholder="220"
                        className="h-8 text-xs font-black text-slate-900 bg-slate-50/50 rounded-lg"
                      />
                      <div className="flex gap-1 pt-0.5">
                        {[180, 200, 220, 240].map(pz => (
                          <button
                            key={pz}
                            type="button"
                            onClick={() => setPrazoConsorcioInput(String(pz))}
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all",
                              prazoConsorcio === pz 
                                ? "bg-indigo-600 text-white border-indigo-600" 
                                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                            )}
                          >
                            {pz}m
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Campo 4: Correção Anual do INCC */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">
                          INCC Anual Estimado
                        </label>
                        <button
                          type="button"
                          onClick={() => setProjetarINCC(!projetarINCC)}
                          className={cn(
                            "text-[9px] font-bold px-1 rounded",
                            projetarINCC ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                          )}
                        >
                          {projetarINCC ? "Ativo" : "Desativado"}
                        </button>
                      </div>
                      <Input 
                        value={taxaINCCAnualInput}
                        onChange={e => setTaxaINCCAnualInput(e.target.value)}
                        placeholder="5,50"
                        disabled={!projetarINCC}
                        className="h-8 text-xs font-black text-slate-900 bg-slate-50/50 rounded-lg"
                      />
                      <div className="flex gap-1 pt-0.5">
                        {[4.5, 5.5, 6.0, 7.0].map(incc => (
                          <button
                            key={incc}
                            type="button"
                            disabled={!projetarINCC}
                            onClick={() => setTaxaINCCAnualInput(incc.toFixed(1).replace(".", ","))}
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all",
                              taxaINCCAnual === incc 
                                ? "bg-indigo-600 text-white border-indigo-600" 
                                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                            )}
                          >
                            {incc}%
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Tabela de Contraste Direto Clean */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Lado Caixa Clean */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                      <Landmark className="h-4 w-4 text-blue-600" /> Financiamento Caixa ({resultado.sistema})
                    </span>
                    <Badge variant="outline" className="text-slate-600 border-slate-200 text-[9px] font-bold">
                      {resultado.prazoMeses} meses
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Crédito Financiado:</span>
                      <strong className="text-slate-900 text-sm font-black">{formatCurrency(resultado.valorFinanciado)}</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Entrada Obrigatória Caixa:</span>
                      <strong className="text-rose-600 font-bold">{formatCurrency(resultado.valorEntrada)}</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">1ª Parcela (Inicial):</span>
                      <strong className="text-slate-900 text-sm font-black">{formatCurrency(resultado.primeiraParcela)}</strong>
                    </div>
                    {resultado.sistema === "SAC" && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Última Parcela:</span>
                        <strong className="text-slate-700 font-bold">{formatCurrency(resultado.ultimaParcela)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Taxa Efetiva Estimada:</span>
                      <strong className="text-slate-800 font-bold">{resultado.taxaJurosAnual.toFixed(2)}% a.a.</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">ITBI e Despesas (à vista):</span>
                      <strong className="text-rose-600 font-bold">{formatCurrency(itbiDespesas)}</strong>
                    </div>
                    <div className="flex justify-between items-center pt-2 text-sm">
                      <span className="text-rose-700 font-bold">Total Pago (Entrada + Parcelas):</span>
                      <strong className="text-rose-600 font-black text-base">{formatCurrency(resultado.valorEntrada + resultado.totalFinanciamentoPago)}</strong>
                    </div>
                    <p className="text-[10px] text-slate-400 italic text-right">
                      Você paga {formatCurrency(resultado.custoExtraTotal)} só em juros e taxas!
                    </p>
                  </div>
                </div>

                {/* Lado Consórcio Clean (Sobre 500k com Parâmetros Abertos) */}
                <div className="bg-gradient-to-b from-emerald-50/50 via-white to-teal-50/20 border border-emerald-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-emerald-800 flex items-center gap-1.5">
                      <BadgeCheck className="h-4 w-4 text-emerald-600" /> Consórcio Imobiliário
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300/60 font-black text-[9px]">
                      {consorcioEstimado.prazo} meses
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between items-center py-1 border-b border-emerald-100/60">
                      <span className="text-slate-600">Crédito da Carta:</span>
                      <strong className="text-emerald-800 text-sm font-black">{formatCurrency(consorcioEstimado.credito)}</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-100/60">
                      <span className="text-slate-600">Taxa Administrativa Total:</span>
                      <strong className="text-emerald-700 font-bold">{consorcioEstimado.taxaAdmTotal.toFixed(2)}% (ZERO JUROS)</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-100/60">
                      <span className="text-slate-600">Meia Parcela (50/50):</span>
                      <strong className="text-emerald-700 text-sm font-black">{formatCurrency(consorcioEstimado.parcela5050)}/mês</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-100/60">
                      <span className="text-slate-600">Parcela Linear (100%):</span>
                      <strong className="text-slate-800 font-bold">{formatCurrency(consorcioEstimado.parcelaLinear)}/mês</strong>
                    </div>
                    {projetarINCC && (
                      <div className="flex justify-between items-center py-1 border-b border-emerald-100/60">
                        <span className="text-slate-600">Correção Anual INCC (~{consorcioEstimado.taxaINCC}%):</span>
                        <span className="text-[10px] text-emerald-700 font-bold">Valoriza o crédito para {formatCurrency(consorcioEstimado.creditoFinalAtualizado)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-1 border-b border-emerald-100/60">
                      <span className="text-slate-600">ITBI e Escritura:</span>
                      <strong className="text-emerald-700 font-bold">Pode embutir até 10% da carta</strong>
                    </div>
                    <div className="flex justify-between items-center pt-2 text-sm">
                      <span className="text-emerald-900 font-bold">Total Pago no Consórcio:</span>
                      <strong className="text-emerald-700 font-black text-base">{formatCurrency(consorcioEstimado.totalPago)}</strong>
                    </div>
                    <p className="text-[10px] text-emerald-700/80 italic text-right font-medium">
                      Diferença de custo para o crédito de {formatCurrency(consorcioEstimado.credito)} é de apenas {formatCurrency(consorcioEstimado.totalPago - consorcioEstimado.credito)}!
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner de Economia Clean e Estratégia de Lance */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-200/90 text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center justify-center sm:justify-start gap-1">
                    <Coins className="h-3.5 w-3.5 text-emerald-600" /> Economia Real no Bolso do Seu Cliente
                  </span>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-700">
                    {formatCurrency(consorcioEstimado.economiaVsCaixa)}
                  </p>
                  <p className="text-xs font-bold text-emerald-800/90">
                    💡 <strong>Poder de Lance:</strong> A entrada de {formatCurrency(resultado.valorEntrada)} vira um Lance Livre de <strong>{consorcioEstimado.percentualLanceEntrada.toFixed(1)}%</strong> na carta de {formatCurrency(consorcioEstimado.credito)}, com altíssima chance de contemplação rápida!
                  </p>
                </div>

                <Button 
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs h-11 px-6 rounded-xl shrink-0 gap-2 shadow-xs transition-all"
                >
                  <Share2 className="h-4 w-4" /> Apresentar Proposta ao Cliente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* COMPOSIÇÃO DOS CUSTOS DA CAIXA (ONDE VAI CADA CENTAVO) */}
          <Card className="border border-slate-200/90 shadow-xs bg-white p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Composição do Financiamento Caixa (Detalhamento)
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Para onde vai o dinheiro pago pelo cliente ao longo dos {resultado.prazoMeses} meses
                </p>
              </div>
              <span className="text-xs font-black text-slate-900">{formatCurrency(resultado.totalFinanciamentoPago)}</span>
            </div>

            {/* Barra Visual de Proporção */}
            <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${(resultado.totalAmortizacao / resultado.totalFinanciamentoPago) * 100}%` }}
                className="bg-blue-600 transition-all"
                title={`Amortização: ${formatCurrency(resultado.totalAmortizacao)}`}
              />
              <div 
                style={{ width: `${(resultado.totalJuros / resultado.totalFinanciamentoPago) * 100}%` }}
                className="bg-rose-500 transition-all"
                title={`Juros: ${formatCurrency(resultado.totalJuros)}`}
              />
              <div 
                style={{ width: `${(resultado.totalSeguros / resultado.totalFinanciamentoPago) * 100}%` }}
                className="bg-amber-400 transition-all"
                title={`Seguros: ${formatCurrency(resultado.totalSeguros)}`}
              />
              <div 
                style={{ width: `${(resultado.totalTaxasAdm / resultado.totalFinanciamentoPago) * 100}%` }}
                className="bg-slate-400 transition-all"
                title={`Taxas: ${formatCurrency(resultado.totalTaxasAdm)}`}
              />
            </div>

            {/* Legenda de Detalhamento Clean */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                  <span className="text-[10px] font-black uppercase text-blue-900">Amortização</span>
                </div>
                <p className="text-sm font-black text-blue-950">{formatCurrency(resultado.totalAmortizacao)}</p>
                <p className="text-[10px] font-bold text-blue-700">
                  {((resultado.totalAmortizacao / resultado.totalFinanciamentoPago) * 100).toFixed(1)}% do total
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-black uppercase text-rose-900">Juros Bancários</span>
                </div>
                <p className="text-sm font-black text-rose-950">{formatCurrency(resultado.totalJuros)}</p>
                <p className="text-[10px] font-bold text-rose-700">
                  {((resultado.totalJuros / resultado.totalFinanciamentoPago) * 100).toFixed(1)}% do total
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-black uppercase text-amber-900">Seguros (MIP+DFI)</span>
                </div>
                <p className="text-sm font-black text-amber-950">{formatCurrency(resultado.totalSeguros)}</p>
                <p className="text-[10px] font-bold text-amber-700">
                  {((resultado.totalSeguros / resultado.totalFinanciamentoPago) * 100).toFixed(1)}% do total
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-[10px] font-black uppercase text-slate-800">Tarifas Caixa</span>
                </div>
                <p className="text-sm font-black text-slate-900">{formatCurrency(resultado.totalTaxasAdm)}</p>
                <p className="text-[10px] font-bold text-slate-500">
                  R$ 25,00/mês
                </p>
              </div>
            </div>
          </Card>

          {/* TABELA DE EVOLUÇÃO TEMPORAL (MARCOS PRINCIPAIS) */}
          <Card className="border border-slate-200/90 shadow-xs bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/60 p-4 border-b border-slate-200 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" /> Evolução da Dívida e Parcelas (Marcos Principais)
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">
                  Acompanhamento oficial da amortização da dívida ao longo dos anos
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">
                {resultado.sistema}
              </Badge>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Mês / Ano</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Saldo Devedor</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Amortização</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Juros</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Seguros + Taxa</th>
                    <th className="p-3 text-[10px] font-black text-indigo-700 uppercase">Parcela Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.marcosPrincipais.map((m) => (
                    <tr key={m.mes} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">
                        Mês {m.mes} <span className="text-slate-400 font-normal">({(m.mes / 12).toFixed(1)} anos)</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">
                        {formatCurrency(m.saldoDevedorInicial)}
                      </td>
                      <td className="p-3 font-semibold text-emerald-700">
                        {formatCurrency(m.amortizacao)}
                      </td>
                      <td className="p-3 font-semibold text-rose-600">
                        {formatCurrency(m.juros)}
                      </td>
                      <td className="p-3 text-slate-500">
                        {formatCurrency(m.seguroMIP + m.seguroDFI + m.taxaAdm)}
                      </td>
                      <td className="p-3 font-black text-indigo-950 text-sm">
                        {formatCurrency(m.parcelaTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
