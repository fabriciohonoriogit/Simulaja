import React, { useState, useMemo } from "react";
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
  AlertCircle, 
  Landmark, 
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  ArrowRight,
  BadgeCheck
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
  FinanciamentoResultado 
} from "@/lib/financiamentoCaixa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FinanciamentoImobiliarioTab() {
  // Input states
  const [valorImovelInput, setValorImovelInput] = useState("500.000");
  const [valorEntradaInput, setValorEntradaInput] = useState("100.000");
  const [percentualEntradaAtivo, setPercentualEntradaAtivo] = useState<number | null>(20);
  const [prazoMeses, setPrazoMeses] = useState<number>(360);
  const [sistemaAmortizacao, setSistemaAmortizacao] = useState<SistemaAmortizacao>("SAC");
  const [presetSelecionado, setPresetSelecionado] = useState<string>("caixa-balcao");
  const [taxaJurosAnualInput, setTaxaJurosAnualInput] = useState<string>("10.49");
  const [mostrarEncargosAvancados, setMostrarEncargosAvancados] = useState(false);
  const [taxaAdminMensalInput, setTaxaAdminMensalInput] = useState("25,00");
  const [taxaDFIInput, setTaxaDFIInput] = useState("0,0095");
  const [taxaMIPInput, setTaxaMIPInput] = useState("0,0280");
  const [nomeCliente, setNomeCliente] = useState("");

  const parseNumber = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/\./g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  };

  const valorImovel = useMemo(() => parseNumber(valorImovelInput), [valorImovelInput]);
  const valorEntrada = useMemo(() => parseNumber(valorEntradaInput), [valorEntradaInput]);
  const taxaJurosAnual = useMemo(() => parseNumber(taxaJurosAnualInput), [taxaJurosAnualInput]);
  const taxaAdminMensal = useMemo(() => parseNumber(taxaAdminMensalInput), [taxaAdminMensalInput]);
  const taxaDFIPercentual = useMemo(() => parseNumber(taxaDFIInput), [taxaDFIInput]);
  const taxaMIPPercentual = useMemo(() => parseNumber(taxaMIPInput), [taxaMIPInput]);

  // Handler para botões rápidos de percentual de entrada
  const handleSelecionarPercentualEntrada = (pct: number) => {
    setPercentualEntradaAtivo(pct);
    const novoValorEntrada = (valorImovel * pct) / 100;
    setValorEntradaInput(novoValorEntrada.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
  };

  // Handler para alteração do valor do imóvel (recalcula entrada se houver percentual ativo)
  const handleValorImovelChange = (val: string) => {
    setValorImovelInput(val);
    const num = parseNumber(val);
    if (percentualEntradaAtivo !== null && num > 0) {
      const novoValorEntrada = (num * percentualEntradaAtivo) / 100;
      setValorEntradaInput(novoValorEntrada.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    }
  };

  // Handler para alteração direta da entrada
  const handleValorEntradaChange = (val: string) => {
    setValorEntradaInput(val);
    setPercentualEntradaAtivo(null);
  };

  // Handler para presets da Caixa
  const handleSelecionarPreset = (presetId: string) => {
    setPresetSelecionado(presetId);
    const preset = PRESETS_FINANCIAMENTO_CAIXA.find(p => p.id === presetId);
    if (preset) {
      setTaxaJurosAnualInput(preset.taxaAnual.toString().replace(".", ","));
    }
  };

  // Simulação calculada
  const resultado: FinanciamentoResultado = useMemo(() => {
    return simularFinanciamentoImobiliario({
      valorImovel,
      valorEntrada,
      prazoMeses,
      taxaJurosAnual,
      sistemaAmortizacao,
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
    taxaAdminMensal, 
    taxaDFIPercentual, 
    taxaMIPPercentual
  ]);

  // Estimativa do Consórcio Imobiliário para o mesmo crédito (Ex: Magalu / SimulaJá 220 meses, taxa 18% + 1% FR)
  const consorcioEstimado = useMemo(() => {
    const cred = resultado.valorFinanciado;
    const prazoConsorcio = 220; // Padrão Imóveis Magalu
    const taxaTotal = 0.19; // 18% taxa + 1% FR
    const totalPagoConsorcio = cred * (1 + taxaTotal);
    const parcelaLinear = totalPagoConsorcio / prazoConsorcio;
    const parcela5050 = (cred * (0.5 + taxaTotal)) / prazoConsorcio;
    const economiaVsCaixa = resultado.totalFinanciamentoPago - totalPagoConsorcio;

    return {
      credito: cred,
      prazo: prazoConsorcio,
      parcelaLinear,
      parcela5050,
      totalPago: totalPagoConsorcio,
      economiaVsCaixa: Math.max(0, economiaVsCaixa)
    };
  }, [resultado]);

  // Compartilhar proposta no WhatsApp
  const handleShareWhatsApp = () => {
    let msg = `🏠 *ESTUDO DE ANÁLISE DE CRÉDITO IMOBILIÁRIO*\n`;
    if (nomeCliente.trim()) {
      msg += `👤 *Cliente:* ${nomeCliente.trim()}\n`;
    }
    msg += `🏦 *Modalidade:* Financiamento Imobiliário Caixa (${resultado.sistema})\n\n`;
    msg += `📍 *Valor do Imóvel:* ${formatCurrency(resultado.valorImovel)}\n`;
    msg += `💵 *Entrada:* ${formatCurrency(resultado.valorEntrada)} (${((resultado.valorEntrada / (resultado.valorImovel || 1)) * 100).toFixed(0)}%)\n`;
    msg += `💰 *Crédito Financiado:* ${formatCurrency(resultado.valorFinanciado)}\n`;
    msg += `⏱️ *Prazo:* ${resultado.prazoMeses} meses (${(resultado.prazoMeses / 12).toFixed(0)} anos)\n`;
    msg += `📊 *Taxa Nominal:* ${resultado.taxaJurosAnual.toFixed(2)}% a.a.\n`;
    msg += `📈 *CET (Custo Efetivo Total):* ${resultado.cetAnual.toFixed(2)}% a.a.\n\n`;

    if (resultado.sistema === "SAC") {
      msg += `💳 *1ª Parcela (Inicial):* ${formatCurrency(resultado.primeiraParcela)}\n`;
      msg += `📉 *Última Parcela:* ${formatCurrency(resultado.ultimaParcela)}\n`;
      msg += `⚖️ *Parcela Média:* ${formatCurrency(resultado.parcelaMedia)}\n\n`;
    } else {
      msg += `💳 *Parcela Mensal Fixa:* ${formatCurrency(resultado.primeiraParcela)}\n\n`;
    }

    msg += `🏛️ *TOTAL PAGO NO BANCO:* ${formatCurrency(resultado.totalFinanciamentoPago)}\n`;
    msg += `💸 *Juros & Encargos Pagos:* ${formatCurrency(resultado.custoExtraTotal)}\n`;
    msg += `⚠️ *Multiplicador:* Você paga *${resultado.multiplicadorImovel.toFixed(2)}x* o valor do imóvel!\n\n`;

    msg += `─────────────────────\n`;
    msg += `🎯 *COMPARATIVO COM CONSÓRCIO IMOBILIÁRIO:*\n`;
    msg += `• Mesmo Crédito de: *${formatCurrency(consorcioEstimado.credito)}*\n`;
    msg += `• Meia Parcela (50/50): *${formatCurrency(consorcioEstimado.parcela5050)}/mês*\n`;
    msg += `• Parcela Integral (100%): *${formatCurrency(consorcioEstimado.parcelaLinear)}/mês*\n`;
    msg += `• Custo Total no Consórcio: *${formatCurrency(consorcioEstimado.totalPago)}*\n`;
    msg += `💰 *ECONOMIA REAL:* *${formatCurrency(consorcioEstimado.economiaVsCaixa)}* poupados de juros bancários!\n\n`;
    msg += `💬 _Gerado via Análise do Crédito — SimulaJá / Jarvis_`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const handleCopyResumo = () => {
    const texto = `Financiamento Caixa ${resultado.sistema}: Crédito ${formatCurrency(resultado.valorFinanciado)} em ${resultado.prazoMeses}x. 1ª Parcela: ${formatCurrency(resultado.primeiraParcela)} | Total Pago: ${formatCurrency(resultado.totalFinanciamentoPago)} (CET: ${resultado.cetAnual.toFixed(2)}% a.a.). Economia no Consórcio: ${formatCurrency(consorcioEstimado.economiaVsCaixa)}.`;
    navigator.clipboard.writeText(texto);
    toast.success("Resumo copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      {/* GRID PRINCIPAL: FORMULÁRIO À ESQUERDA + RESULTADOS À DIREITA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* FORMULÁRIO DE ENTRADA (COL 12 / LG 4) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-white">
                  <Landmark className="h-4 w-4 text-amber-400" /> PARÂMETROS DO FINANCIAMENTO
                </CardTitle>
                <Badge className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                  Caixa / SFH
                </Badge>
              </div>
              <p className="text-[11px] font-medium text-slate-300 mt-1">
                Configure os valores do imóvel, taxas, prazo e seguros oficiais.
              </p>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Nome do Cliente (Opcional) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                  Nome do Proponente / Cliente (Opcional)
                </label>
                <Input 
                  placeholder="Ex: João da Silva" 
                  value={nomeCliente}
                  onChange={e => setNomeCliente(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

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
                  className="h-10 text-base font-black text-slate-900"
                />
              </div>

              {/* Valor da Entrada & Atalhos de % */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">
                    Entrada / Recursos Próprios (R$)
                  </label>
                  <span className="text-[10px] font-bold text-blue-600">
                    {((valorEntrada / (valorImovel || 1)) * 100).toFixed(0)}% do imóvel
                  </span>
                </div>
                <Input 
                  placeholder="100.000" 
                  value={valorEntradaInput}
                  onChange={e => handleValorEntradaChange(e.target.value)}
                  className="h-9 text-sm font-bold text-slate-800"
                />
                
                {/* Botões Rápidos de Entrada */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[20, 30, 40, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleSelecionarPercentualEntrada(pct)}
                      className={cn(
                        "py-1 px-1.5 text-[10px] font-black rounded-lg border transition-all text-center",
                        percentualEntradaAtivo === pct
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {pct}% {pct === 20 ? "(Min)" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saldo Financiado em destaque */}
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-blue-700">Crédito Financiado Líquido</p>
                  <p className="text-base font-black text-blue-950">{formatCurrency(resultado.valorFinanciado)}</p>
                </div>
                <Badge variant="outline" className="bg-white text-blue-800 border-blue-300 font-bold text-[10px]">
                  {prazoMeses} meses
                </Badge>
              </div>

              {/* Sistema de Amortização (SAC vs PRICE) */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center justify-between">
                  <span>Sistema de Amortização</span>
                  <span className="text-[9px] font-normal text-slate-500">Caixa adota SAC</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSistemaAmortizacao("SAC")}
                    className={cn(
                      "py-2 px-2 rounded-lg text-xs font-black transition-all text-center flex flex-col items-center justify-center gap-0.5",
                      sistemaAmortizacao === "SAC"
                        ? "bg-white text-blue-900 shadow-sm border border-slate-200"
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
                        ? "bg-white text-blue-900 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <span>PRICE</span>
                    <span className="text-[9px] font-medium text-slate-400">Parcelas Fixas</span>
                  </button>
                </div>
              </div>

              {/* Prazo (Botões rápidos + input) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">
                    Prazo do Financiamento
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">
                    {(prazoMeses / 12).toFixed(1)} anos
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[420, 360, 240, 180, 120, 60].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrazoMeses(p)}
                      className={cn(
                        "py-1.5 px-1 text-[10px] font-black rounded-lg border transition-all text-center",
                        prazoMeses === p
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {p}m ({p / 12}a)
                    </button>
                  ))}
                </div>
              </div>

              {/* Taxa de Juros Anual & Presets da Caixa */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center justify-between">
                  <span>Taxa de Juros Anual (% a.a.)</span>
                  <Percent className="h-3.5 w-3.5 text-amber-500" />
                </label>
                
                {/* Presets Caixa */}
                <div className="space-y-1.5">
                  {PRESETS_FINANCIAMENTO_CAIXA.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelecionarPreset(p.id)}
                      className={cn(
                        "w-full text-left p-2 rounded-xl border text-xs transition-all flex items-center justify-between",
                        presetSelecionado === p.id
                          ? "bg-amber-50/70 border-amber-300 text-amber-950 font-bold shadow-sm"
                          : "bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-black truncate">{p.nome}</span>
                          <span className="text-[9px] bg-white border px-1 rounded text-slate-500 uppercase">{p.badge}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 line-clamp-1">{p.descricao}</p>
                      </div>
                      <span className="text-xs font-black text-amber-700 shrink-0">
                        {p.taxaAnual.toFixed(2)}%
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">Taxa personalizada:</span>
                    <Input 
                      placeholder="10,49"
                      value={taxaJurosAnualInput}
                      onChange={e => {
                        setTaxaJurosAnualInput(e.target.value);
                        setPresetSelecionado("custom");
                      }}
                      className="h-8 text-xs font-bold"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
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
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-600">Tarifa Adm Mensal Caixa:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">R$</span>
                        <Input 
                          value={taxaAdminMensalInput}
                          onChange={e => setTaxaAdminMensalInput(e.target.value)}
                          className="h-7 w-20 text-[11px] font-bold text-right"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-600">Seguro DFI (Danos Físicos):</span>
                      <div className="flex items-center gap-1">
                        <Input 
                          value={taxaDFIInput}
                          onChange={e => setTaxaDFIInput(e.target.value)}
                          className="h-7 w-20 text-[11px] font-bold text-right"
                        />
                        <span className="text-[10px] text-slate-400">% a.m.</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-600">Seguro MIP (Morte/Invalidez):</span>
                      <div className="flex items-center gap-1">
                        <Input 
                          value={taxaMIPInput}
                          onChange={e => setTaxaMIPInput(e.target.value)}
                          className="h-7 w-20 text-[11px] font-bold text-right"
                        />
                        <span className="text-[10px] text-slate-400">% a.m.</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 italic pt-1">
                      Valores padrão do SFH Caixa. O DFI incide sobre o valor do imóvel e o MIP sobre o saldo devedor mensal.
                    </p>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 space-y-2">
                <Button 
                  onClick={handleShareWhatsApp}
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase gap-2 shadow-sm rounded-xl"
                >
                  <Share2 className="h-4 w-4" /> Enviar Estudo no WhatsApp
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCopyResumo}
                    className="flex-1 h-9 text-xs font-bold gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-600" /> Copiar Resumo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.print()}
                    className="flex-1 h-9 text-xs font-bold gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-600" /> Imprimir PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PAINEL DE RESULTADOS E IMPACTO COMERCIAL (COL 12 / LG 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CARDS DE DESTAQUE: CRÉDITO, PARCELAS E TOTAL PAGO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Card 1: Crédito Financiado */}
            <Card className="border-slate-200/80 shadow-sm bg-white p-4 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Crédito Financiado</span>
                <Badge variant="outline" className="text-[9px] font-black text-blue-700 bg-blue-50 border-blue-200">
                  {((resultado.valorFinanciado / (resultado.valorImovel || 1)) * 100).toFixed(0)}% do Bem
                </Badge>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(resultado.valorFinanciado)}
              </p>
              <p className="text-[11px] font-bold text-slate-500 mt-1">
                Imóvel: {formatCurrency(resultado.valorImovel)}
              </p>
            </Card>

            {/* Card 2: 1ª Parcela (Inicial) */}
            <Card className="border-blue-200 shadow-md shadow-blue-500/5 bg-gradient-to-br from-blue-50/50 to-white p-4 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">1ª Parcela (Inicial)</span>
                <Badge className="text-[9px] font-black bg-blue-600 text-white border-none">
                  {resultado.sistema}
                </Badge>
              </div>
              <p className="text-2xl font-black text-blue-900 tracking-tight">
                {formatCurrency(resultado.primeiraParcela)}
              </p>
              <p className="text-[11px] font-bold text-slate-500 mt-1">
                {resultado.sistema === "SAC" ? `Última: ${formatCurrency(resultado.ultimaParcela)}` : "Parcela Fixa"}
              </p>
            </Card>

            {/* Card 3: Valor Final Total Pago */}
            <Card className="border-rose-200 shadow-md shadow-rose-500/5 bg-gradient-to-br from-rose-50/50 to-white p-4 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider">Total Pago ao Banco</span>
                <Badge variant="destructive" className="text-[9px] font-black px-1.5 py-0">
                  {resultado.multiplicadorImovel.toFixed(2)}x o Valor
                </Badge>
              </div>
              <p className="text-2xl font-black text-rose-700 tracking-tight">
                {formatCurrency(resultado.totalFinanciamentoPago)}
              </p>
              <p className="text-[11px] font-bold text-rose-600/80 mt-1">
                + Juros: {formatCurrency(resultado.custoExtraTotal)}
              </p>
            </Card>

            {/* Card 4: Custo Efetivo Total (CET) */}
            <Card className="border-amber-200 shadow-sm bg-gradient-to-br from-amber-50/40 to-white p-4 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">CET Anual (Real)</span>
                <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Oficial</span>
              </div>
              <p className="text-2xl font-black text-amber-900 tracking-tight">
                {resultado.cetAnual.toFixed(2)}% <span className="text-xs font-bold text-slate-400">a.a.</span>
              </p>
              <p className="text-[11px] font-bold text-slate-500 mt-1">
                Taxa Nominal: {resultado.taxaJurosAnual.toFixed(2)}% a.a.
              </p>
            </Card>
          </div>

          {/* CARD DE OURO: COMPARATIVO DIRETO COM CONSÓRCIO MAGALU / SIMULAJÁ */}
          <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 text-white shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Comparativo Estratégico de Crédito</span>
                    <h3 className="text-xl font-black text-white">Financiamento Caixa vs. Consórcio Imobiliário</h3>
                  </div>
                </div>
                <Badge className="bg-emerald-500 text-slate-950 font-black text-xs uppercase px-3 py-1">
                  Economia Comprovada
                </Badge>
              </div>

              {/* Tabela de Contraste Direto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Lado Caixa */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-rose-300 flex items-center gap-1.5">
                      <Landmark className="h-4 w-4" /> Financiamento Caixa ({resultado.sistema})
                    </span>
                    <Badge variant="outline" className="text-rose-300 border-rose-400/30 text-[9px]">
                      {resultado.prazoMeses} meses
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">1ª Parcela (Inicial):</span>
                      <strong className="text-white text-sm">{formatCurrency(resultado.primeiraParcela)}</strong>
                    </div>
                    {resultado.sistema === "SAC" && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Última Parcela:</span>
                        <strong className="text-slate-200">{formatCurrency(resultado.ultimaParcela)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">CET Anual Caixa:</span>
                      <strong className="text-amber-400">{resultado.cetAnual.toFixed(2)}% a.a.</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10 text-sm">
                      <span className="text-rose-300 font-bold">Total Pago ao Banco:</span>
                      <strong className="text-rose-400 font-black text-base">{formatCurrency(resultado.totalFinanciamentoPago)}</strong>
                    </div>
                    <p className="text-[10px] text-rose-300/80 italic text-right">
                      Você paga {formatCurrency(resultado.custoExtraTotal)} só em juros e taxas!
                    </p>
                  </div>
                </div>

                {/* Lado Consórcio */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                      <BadgeCheck className="h-4 w-4" /> Consórcio Imobiliário SimulaJá
                    </span>
                    <Badge className="bg-emerald-500 text-slate-950 font-black text-[9px]">
                      {consorcioEstimado.prazo} meses
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Meia Parcela (50/50):</span>
                      <strong className="text-emerald-300 text-sm font-black">{formatCurrency(consorcioEstimado.parcela5050)}/mês</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Parcela Linear (100%):</span>
                      <strong className="text-white">{formatCurrency(consorcioEstimado.parcelaLinear)}/mês</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Juros Bancários:</span>
                      <strong className="text-emerald-400 font-black">ZERO JUROS (Apenas Taxa Adm)</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-emerald-500/20 text-sm">
                      <span className="text-emerald-300 font-bold">Total Pago no Consórcio:</span>
                      <strong className="text-emerald-400 font-black text-base">{formatCurrency(consorcioEstimado.totalPago)}</strong>
                    </div>
                    <p className="text-[10px] text-emerald-300/80 italic text-right">
                      Sem surpresas de juros compostos ou tabela SAC abusiva.
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner de Economia Brutal */}
              <div className="p-4 rounded-2xl bg-emerald-500 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-500/20">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                    💰 Economia no Bolso do Seu Cliente
                  </span>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                    {formatCurrency(consorcioEstimado.economiaVsCaixa)}
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    Equivale a economizar {(consorcioEstimado.economiaVsCaixa / (resultado.valorImovel || 1)).toFixed(1)}x o valor do imóvel inteiro em juros!
                  </p>
                </div>

                <Button 
                  onClick={handleShareWhatsApp}
                  className="bg-slate-950 hover:bg-slate-900 text-white font-black uppercase text-xs h-11 px-6 rounded-xl shrink-0 gap-2 shadow-md"
                >
                  <Share2 className="h-4 w-4 text-emerald-400" /> Apresentar ao Cliente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* COMPOSIÇÃO DOS CUSTOS DA CAIXA (ONDE VAI CADA CENTAVO) */}
          <Card className="border-slate-200 shadow-sm bg-white p-6 rounded-3xl space-y-4">
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
            <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
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

            {/* Legenda de Detalhamento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span className="text-[10px] font-black uppercase text-blue-900">Amortização</span>
                </div>
                <p className="text-sm font-black text-blue-950">{formatCurrency(resultado.totalAmortizacao)}</p>
                <p className="text-[10px] font-bold text-blue-700">
                  {((resultado.totalAmortizacao / resultado.totalFinanciamentoPago) * 100).toFixed(1)}% do total
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-black uppercase text-rose-900">Juros Bancários</span>
                </div>
                <p className="text-sm font-black text-rose-950">{formatCurrency(resultado.totalJuros)}</p>
                <p className="text-[10px] font-bold text-rose-700">
                  {((resultado.totalJuros / resultado.totalFinanciamentoPago) * 100).toFixed(1)}% do total
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-black uppercase text-amber-900">Seguros (MIP+DFI)</span>
                </div>
                <p className="text-sm font-black text-amber-950">{formatCurrency(resultado.totalSeguros)}</p>
                <p className="text-[10px] font-bold text-amber-700">
                  {((resultado.totalSeguros / resultado.totalFinanciamentoPago) * 100).toFixed(1)}% do total
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
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
          <Card className="border-slate-200 shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/70 p-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" /> Evolução da Dívida e Parcelas (Marcos Principais)
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">
                  Acompanhamento da amortização da dívida ao longo dos anos
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">
                {resultado.sistema}
              </Badge>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Mês / Ano</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Saldo Devedor</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Amortização</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Juros</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Seguros + Taxa</th>
                    <th className="p-3 text-[10px] font-black text-blue-700 uppercase">Parcela Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.marcosPrincipais.map((m) => (
                    <tr key={m.mes} className="border-b hover:bg-slate-50/80 transition-colors">
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
                      <td className="p-3 font-black text-blue-900 text-sm">
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

