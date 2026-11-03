import React, { useState, useEffect } from "react";
import { 
  Calculator, 
  Home, 
  Car, 
  Plus, 
  Trash2, 
  FileText, 
  ChevronRight, 
  Info,
  BadgeCheck,
  TrendingDown,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Share2,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ClipboardPaste,
  Copy,
  Check,
  ArrowDownRight,
  HelpCircle,
  Split,
  Percent,
  ListPlus,
  Landmark,
  Building2
} from "lucide-react";
import { FinanciamentoImobiliarioTab } from "@/components/admin/credito/FinanciamentoImobiliarioTab";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface FaixaParcela {
  id: string;
  de: number;
  ate: number;
  valor: number;
}

export interface Simulacao {
  id: number;
  nome: string;
  codigo: string;
  bem: number;
  entrada: number;
  pv: number;
  n: number;
  pmt: number; // Parcela fixa ou média ponderada
  r: number; // Taxa mensal efetiva
  anual: number; // Taxa anual efetiva
  custoReal: number;
  totalPago: number;
  tipo: string;
  tab: "imovel" | "veiculo";
  // Suporte a parcelas escalonadas / variáveis
  isEscalonada: boolean;
  faixas?: FaixaParcela[];
  proximoVencimento?: string;
  somaParcelas?: number;
}

// Helper: Parse currency input string to number (handles dots, commas and R$)
const parseCurrency = (str: string): number => {
  if (!str) return 0;
  let cleaned = str.trim().replace(/^R\$\s*/i, "");
  if (cleaned.includes(".") && cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  } else if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      cleaned = cleaned.replace(/\./g, "");
    }
  }
  cleaned = cleaned.replace(/[^\d.-]/g, "");
  return parseFloat(cleaned) || 0;
};

// Helper: Format number to currency style (without trailing ,00 for integers if desired)
const fmtMoeda = (v: number) => {
  return formatCurrency(v).replace(",00", "");
};

// Smart Parser: Parses pasted proposal text
const parseSmartPaste = (raw: string) => {
  const result: {
    credito: string | null;
    entrada: string | null;
    vencimento: string | null;
    faixas: FaixaParcela[];
  } = {
    credito: null,
    entrada: null,
    vencimento: null,
    faixas: []
  };

  const lines = raw.split(/[\r\n]+/);
  const faixaRegex = /(\d+)\s*(?:a|até|-|ate)\s*(\d+)\s*(?:de|:|x|-)?\s*(?:R\$\s*)?([0-9.,]+)/i;
  const creditoRegex = /(?:cr[eé]dito|valor do bem|bem|cr[eé]d)\s*(?::|=)?\s*(?:R\$\s*)?([0-9.,]+)/i;
  const entradaRegex = /(?:entrada|ágio|agio)\s*(?::|=)?\s*(?:R\$\s*)?([0-9.,]+)/i;
  const vencRegex = /(?:pr[oó]x\.?\s*venc(?:imento)?\.?|vencimento|venc)\s*(?::|=)?\s*([0-9]{1,2}\/[0-9]{1,2}(?:\/[0-9]{2,4})?)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const vencMatch = trimmed.match(vencRegex);
    if (vencMatch) {
      result.vencimento = vencMatch[1];
      continue;
    }

    const faixaMatch = trimmed.match(faixaRegex);
    if (faixaMatch) {
      const de = parseInt(faixaMatch[1]);
      const ate = parseInt(faixaMatch[2]);
      const valor = parseCurrency(faixaMatch[3]);
      if (de && ate && ate >= de && valor > 0) {
        result.faixas.push({
          id: Math.random().toString(36).substring(2, 9),
          de,
          ate,
          valor
        });
        continue;
      }
    }

    const credMatch = trimmed.match(creditoRegex);
    if (credMatch) {
      result.credito = credMatch[1];
      continue;
    }

    const entMatch = trimmed.match(entradaRegex);
    if (entMatch) {
      result.entrada = entMatch[1];
      continue;
    }
  }

  return result;
};

// General Cash Flow IRR (Newton-Raphson with Bisection fallback)
// Works universally for fixed annuities and tiered/escalonadas payment schedules
const calcTaxaFluxo = (pv: number, pmts: number[]): number | null => {
  if (pv <= 0 || !pmts || pmts.length === 0) return null;
  const totalPmts = pmts.reduce((acc, p) => acc + p, 0);
  if (totalPmts <= pv) return null;

  const npv = (r: number) => {
    let val = -pv;
    let factor = 1 + r;
    for (let i = 0; i < pmts.length; i++) {
      val += pmts[i] / factor;
      factor *= (1 + r);
    }
    return val;
  };

  const dNpv = (r: number) => {
    let val = 0;
    let factor = Math.pow(1 + r, 2);
    for (let i = 0; i < pmts.length; i++) {
      const t = i + 1;
      val -= (t * pmts[i]) / factor;
      factor *= (1 + r);
    }
    return val;
  };

  // Initial estimate based on simple interest
  let r = (totalPmts / pv - 1) / pmts.length;
  if (r <= 0) r = 0.01;

  // Newton-Raphson
  for (let iter = 0; iter < 80; iter++) {
    const fVal = npv(r);
    const dfVal = dNpv(r);
    if (Math.abs(fVal) < 1e-7) return r;
    if (Math.abs(dfVal) < 1e-12) break;
    const nextR = r - fVal / dfVal;
    if (nextR <= -0.99 || nextR > 2.0 || isNaN(nextR)) break;
    if (Math.abs(nextR - r) < 1e-8) return nextR;
    r = nextR;
  }

  // Bisection fallback
  let low = 0.000001;
  let high = 1.0;
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const val = npv(mid);
    if (Math.abs(val) < 1e-6 || (high - low) < 1e-8) return mid;
    if (val > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
};

export default function CartaAnalise() {
  const [modoAnalise, setModoAnalise] = useState<"financiamento" | "carta">("financiamento");
  const [activeTab, setActiveTab] = useState<"imovel" | "veiculo">("imovel");
  const [simulacoes, setSimulacoes] = useState<Record<string, Simulacao[]>>(() => {
    try {
      const saved = localStorage.getItem("carta_analise_simulacoes_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return { imovel: [], veiculo: [] };
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("carta_analise_simulacoes_v2", JSON.stringify(simulacoes));
    } catch (e) {
      console.error(e);
    }
  }, [simulacoes]);

  // Form states
  const [tipoParcela, setTipoParcela] = useState<"fixa" | "escalonada">("escalonada");
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    bem: "",
    entrada: "",
    n: "",
    pmt: "",
    proximoVencimento: ""
  });

  // Escalonada Faixas state
  const [faixas, setFaixas] = useState<FaixaParcela[]>([]);
  const [novaFaixaDe, setNovaFaixaDe] = useState("1");
  const [novaFaixaAte, setNovaFaixaAte] = useState("");
  const [novaFaixaValor, setNovaFaixaValor] = useState("");

  // Modal de colar proposta
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteInputText, setPasteInputText] = useState("");

  // Preview state
  const [previewTaxa, setPreviewTaxa] = useState<{
    anual: string;
    mensal: string;
    total: string;
    resumoParcelas: string;
    color: string;
  } | null>(null);

  // Auto calculate next 'de' month for faixas
  useEffect(() => {
    if (faixas.length > 0) {
      const maxAte = Math.max(...faixas.map(f => f.ate));
      setNovaFaixaDe((maxAte + 1).toString());
    } else {
      setNovaFaixaDe("1");
    }
  }, [faixas]);

  // Helper to build pmts array
  const buildPmts = (isEsc: boolean, fList: FaixaParcela[], nFix: number, pmtFix: number): number[] => {
    if (isEsc) {
      const pmts: number[] = [];
      const sorted = [...fList].sort((a, b) => a.de - b.de);
      sorted.forEach(f => {
        for (let m = f.de; m <= f.ate; m++) {
          pmts.push(f.valor);
        }
      });
      return pmts;
    } else {
      if (nFix <= 0 || pmtFix <= 0) return [];
      return Array(nFix).fill(pmtFix);
    }
  };

  // Recalculate preview on form or faixas change
  useEffect(() => {
    const bem = parseCurrency(formData.bem);
    const entrada = parseCurrency(formData.entrada);
    const pv = bem - entrada;

    if (pv <= 0) {
      setPreviewTaxa(null);
      return;
    }

    const isEsc = tipoParcela === "escalonada";
    const nFix = parseInt(formData.n) || 0;
    const pmtFix = parseCurrency(formData.pmt);

    const pmts = buildPmts(isEsc, faixas, nFix, pmtFix);
    if (pmts.length === 0) {
      setPreviewTaxa(null);
      return;
    }

    const r = calcTaxaFluxo(pv, pmts);
    if (r && r > 0) {
      const anual = (Math.pow(1 + r, 12) - 1) * 100;
      const somaPmts = pmts.reduce((a, b) => a + b, 0);
      const totalPago = entrada + somaPmts;
      const mediaPmt = somaPmts / pmts.length;

      let color = "text-emerald-600";
      if (anual > 20) color = "text-red-600";
      else if (anual > 14) color = "text-amber-600";

      setPreviewTaxa({
        anual: anual.toFixed(2) + "% a.a.",
        mensal: (r * 100).toFixed(4) + "% a.m.",
        total: "Total: " + fmtMoeda(totalPago),
        resumoParcelas: `${pmts.length} parcelas · Média: ${formatCurrency(mediaPmt)}`,
        color
      });
    } else {
      setPreviewTaxa(null);
    }
  }, [formData, tipoParcela, faixas]);

  const handleAddFaixa = () => {
    const de = parseInt(novaFaixaDe);
    const ate = parseInt(novaFaixaAte);
    const valor = parseCurrency(novaFaixaValor);

    if (!de || !ate || ate < de || valor <= 0) {
      toast.error("Informe um intervalo válido (De <= Até) e um valor maior que zero.");
      return;
    }

    const newFaixa: FaixaParcela = {
      id: Math.random().toString(36).substring(2, 9),
      de,
      ate,
      valor
    };

    setFaixas(prev => [...prev, newFaixa].sort((a, b) => a.de - b.de));
    setNovaFaixaAte("");
    setNovaFaixaValor("");
    toast.success(`Faixa ${de} a ${ate} adicionada!`);
  };

  const handleRemoveFaixa = (id: string) => {
    setFaixas(prev => prev.filter(f => f.id !== id));
  };

  const handleClearFaixas = () => {
    setFaixas([]);
  };

  // Carregar o exemplo direto solicitado pelo usuário
  const handleCarregarExemploUsuario = () => {
    setFormData({
      nome: "Consórcio Contemplado",
      codigo: "624K",
      bem: "624.306,00",
      entrada: "249.990,00",
      n: "",
      pmt: "",
      proximoVencimento: "20/10"
    });
    setTipoParcela("escalonada");
    setFaixas([
      { id: "f1", de: 1, ate: 58, valor: 8135 },
      { id: "f2", de: 59, ate: 60, valor: 4994 },
      { id: "f3", de: 61, ate: 75, valor: 3174 },
      { id: "f4", de: 76, ate: 217, valor: 859 }
    ]);
    toast.success("Exemplo de 4 faixas (Crédito R$ 624k) carregado com sucesso!");
  };

  // Processar texto colado no modal
  const handleApplyPastedText = () => {
    if (!pasteInputText.trim()) {
      toast.error("Cole o texto da proposta antes de processar.");
      return;
    }

    const parsed = parseSmartPaste(pasteInputText);

    if (parsed.faixas.length === 0 && !parsed.credito && !parsed.entrada) {
      toast.error("Não foram identificados valores no texto. Verifique o formato.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      bem: parsed.credito || prev.bem,
      entrada: parsed.entrada || prev.entrada,
      proximoVencimento: parsed.vencimento || prev.proximoVencimento,
      nome: prev.nome || "Carta Contemplada"
    }));

    if (parsed.faixas.length > 0) {
      setTipoParcela("escalonada");
      setFaixas(parsed.faixas.sort((a, b) => a.de - b.de));
      toast.success(`${parsed.faixas.length} faixas de parcelas importadas com sucesso!`);
    } else {
      toast.info("Valores de crédito/entrada atualizados.");
    }

    setIsPasteModalOpen(false);
    setPasteInputText("");
  };

  const handleAddSimulacao = () => {
    const bem = parseCurrency(formData.bem);
    const entrada = parseCurrency(formData.entrada);
    const pv = bem - entrada;

    if (!formData.nome.trim()) {
      toast.error("Informe a administradora ou nome da simulação.");
      return;
    }

    if (bem <= 0 || entrada <= 0 || pv <= 0) {
      toast.error("Valor do bem e entrada devem ser válidos (Bem > Entrada).");
      return;
    }

    const isEsc = tipoParcela === "escalonada";
    const nFix = parseInt(formData.n) || 0;
    const pmtFix = parseCurrency(formData.pmt);

    if (isEsc && faixas.length === 0) {
      toast.error("Adicione ao menos uma faixa de parcelas.");
      return;
    }

    if (!isEsc && (nFix <= 0 || pmtFix <= 0)) {
      toast.error("Informe a quantidade de parcelas e o valor da parcela.");
      return;
    }

    const pmts = buildPmts(isEsc, faixas, nFix, pmtFix);
    const r = calcTaxaFluxo(pv, pmts);

    if (!r || r <= 0) {
      toast.error("Erro no cálculo da taxa. Verifique se a soma das parcelas é superior ao saldo a amortizar.");
      return;
    }

    const anual = (Math.pow(1 + r, 12) - 1) * 100;
    const custoReal = anual + (activeTab === "imovel" ? 6.0 : 0);
    const somaParcelas = pmts.reduce((a, b) => a + b, 0);
    const totalPago = entrada + somaParcelas;
    const pmtMedia = somaParcelas / pmts.length;

    const newSim: Simulacao = {
      id: Date.now(),
      nome: formData.nome,
      codigo: formData.codigo,
      bem,
      entrada,
      pv,
      n: pmts.length,
      pmt: isEsc ? pmtMedia : pmtFix,
      r,
      anual,
      custoReal,
      totalPago,
      tipo: activeTab === "imovel" ? "Imóvel" : "Veículo",
      tab: activeTab,
      isEscalonada: isEsc,
      faixas: isEsc ? [...faixas] : undefined,
      proximoVencimento: formData.proximoVencimento.trim() || undefined,
      somaParcelas
    };

    setSimulacoes(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newSim]
    }));

    // Reset fields keeping convenient defaults
    setFormData({
      nome: "",
      codigo: "",
      bem: "",
      entrada: "",
      n: "",
      pmt: "",
      proximoVencimento: ""
    });
    setFaixas([]);

    toast.success("Simulação adicionada com sucesso!");
  };

  const removeSimulacao = (id: number) => {
    setSimulacoes(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(s => s.id !== id)
    }));
    toast.info("Simulação removida.");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Gerar mensagem formatada para WhatsApp
  const handleShareWhatsApp = (s: Simulacao) => {
    let msg = `📋 *ANÁLISE DE CARTA CONTEMPLADA*\n`;
    msg += `🏢 *Administradora:* ${s.nome} ${s.codigo ? `(Cód. ${s.codigo})` : ""}\n`;
    msg += `🏷️ *Segmento:* Consórcio de ${s.tipo}\n\n`;
    msg += `💰 *Crédito Contemplado:* ${formatCurrency(s.bem)}\n`;
    msg += `💵 *Entrada (Ágio):* ${formatCurrency(s.entrada)}\n`;
    msg += `📉 *Saldo a Amortizar:* ${formatCurrency(s.pv)}\n`;
    if (s.proximoVencimento) {
      msg += `📅 *Próximo Vencimento:* ${s.proximoVencimento}\n`;
    }
    msg += `\n`;

    if (s.isEscalonada && s.faixas && s.faixas.length > 0) {
      msg += `📊 *FLUXO DE PARCELAS ESCALONADAS:*\n`;
      s.faixas.forEach(f => {
        const qtd = f.ate - f.de + 1;
        msg += `• Meses ${f.de} a ${f.ate} (${qtd}x): *${formatCurrency(f.valor)}*\n`;
      });
      msg += `👉 *Total de Parcelas:* ${s.n} meses\n`;
      msg += `👉 *Parcela Média:* ${formatCurrency(s.pmt)}/mês\n`;
    } else {
      msg += `📊 *Plano de Pagamento:* ${s.n}x de *${formatCurrency(s.pmt)}*\n`;
    }

    msg += `\n📈 *INDICADORES DE TAXA & CUSTO:*\n`;
    msg += `• *Taxa Efetiva Mensal:* ${(s.r * 100).toFixed(4)}% a.m.\n`;
    msg += `• *Taxa Efetiva Anual:* ${s.anual.toFixed(2)}% a.a.\n`;
    if (s.tab === "imovel") {
      msg += `• *Custo Real Estimado (+INCC ~6%):* ~${s.custoReal.toFixed(1)}% a.a.\n`;
    }
    msg += `• *Total a Pagar (Entrada + Parcelas):* ${formatCurrency(s.totalPago)}\n`;
    msg += `• *Custo Extra Total:* ${formatCurrency(s.totalPago - s.bem)}\n\n`;
    msg += `💬 _Gerado via Simulador Jarvis Contempladas_`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const COLORS = ['#e85d04', '#7c3aed', '#0891b2', '#be185d', '#15803d'];
  const BG_COLORS = ['bg-orange-50', 'bg-purple-50', 'bg-cyan-50', 'bg-pink-50', 'bg-emerald-50'];
  const BORDER_COLORS = ['border-orange-200', 'border-purple-200', 'border-cyan-200', 'border-pink-200', 'border-emerald-200'];

  const currentSims = simulacoes[activeTab] || [];
  const isImovel = activeTab === "imovel";
  const taxaFin = isImovel ? 0.1269 : 0.1999;
  const labelFin = isImovel ? "Financiamento CEF (12,69% a.a.)" : "Financiamento Bancário (19,99% a.a.)";
  const labelRef = isImovel ? "+ INCC ~6,0% a.a." : "sem correção";

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 space-y-6">
      {/* HEADER SUPERIOR UNIFICADO - ANÁLISE DO CRÉDITO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/20">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Análise do Crédito</h1>
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-wider">
                Operação de Crédito
              </Badge>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              Estudo comparativo de viabilidade financeira: Financiamento Imobiliário Caixa (SAC / Price) e Carta Contemplada
            </p>
          </div>
        </div>

        {/* SELETOR DE MODO: FINANCIAMENTO IMOBILIÁRIO vs CARTA CONTEMPLADA */}
        <div className="flex items-center p-1 bg-white border border-slate-200 shadow-sm rounded-2xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setModoAnalise("financiamento")}
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap",
              modoAnalise === "financiamento"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <Building2 className="h-4 w-4" /> Financiamento Imobiliário (Caixa)
          </button>
          <button
            type="button"
            onClick={() => setModoAnalise("carta")}
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap",
              modoAnalise === "carta"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <FileText className="h-4 w-4" /> Carta Contemplada (Taxas & Fluxo)
          </button>
        </div>
      </div>

      {/* RENDERIZAÇÃO DO MODO SELECIONADO */}
      {modoAnalise === "financiamento" ? (
        <FinanciamentoImobiliarioTab />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR FORM */}
          <div className="w-full lg:w-96 shrink-0 space-y-4">
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-white">
                <Calculator className="h-4 w-4 text-cyan-400" /> NOVA SIMULAÇÃO
              </CardTitle>
              <Badge variant="outline" className="text-cyan-300 border-cyan-400/30 text-[10px] font-black uppercase tracking-wider">
                {isImovel ? "Imóvel" : "Veículo"}
              </Badge>
            </div>
            <p className="text-[11px] font-medium text-slate-300 mt-1">
              Avaliação de taxas e comparativo para Carta Contemplada
            </p>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Quick Actions Bar */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPasteModalOpen(true)}
                className="flex-1 text-[11px] font-bold h-8 border-dashed border-slate-300 hover:border-cyan-500 hover:bg-cyan-50/50 text-slate-700 gap-1.5"
              >
                <ClipboardPaste className="h-3.5 w-3.5 text-cyan-600" /> Colar Proposta
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCarregarExemploUsuario}
                className="text-[11px] font-bold h-8 border-slate-300 hover:border-amber-500 hover:bg-amber-50 text-amber-700 gap-1"
                title="Carregar exemplo R$ 624k com 4 faixas de parcelas"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Exemplo 4 Faixas
              </Button>
            </div>

            {/* Administradora & Código */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Administradora / Nome</label>
              <Input 
                placeholder="Ex: Porto Seguro / Magalu / Ademicon" 
                value={formData.nome}
                onChange={e => handleInputChange("nome", e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Código (opcional)</label>
                <Input 
                  placeholder="Ex: 624K" 
                  value={formData.codigo}
                  onChange={e => handleInputChange("codigo", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-cyan-600" /> Próx. Venc.
                </label>
                <Input 
                  placeholder="Ex: 20/10" 
                  value={formData.proximoVencimento}
                  onChange={e => handleInputChange("proximoVencimento", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Crédito e Entrada */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Crédito / Bem (R$)</label>
                <Input 
                  placeholder="624.306,00" 
                  value={formData.bem}
                  onChange={e => handleInputChange("bem", e.target.value)}
                  className="h-9 text-sm font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Entrada / Ágio (R$)</label>
                <Input 
                  placeholder="249.990,00" 
                  value={formData.entrada}
                  onChange={e => handleInputChange("entrada", e.target.value)}
                  className="h-9 text-sm font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Saldo a amortizar preview */}
            {parseCurrency(formData.bem) > 0 && parseCurrency(formData.entrada) > 0 && (
              <div className="flex justify-between items-center bg-cyan-50/60 border border-cyan-100 rounded-lg px-3 py-1.5 text-[11px]">
                <span className="font-bold text-cyan-800">Saldo a Amortizar (PV):</span>
                <span className="font-black text-cyan-950">
                  {formatCurrency(parseCurrency(formData.bem) - parseCurrency(formData.entrada))}
                </span>
              </div>
            )}

            {/* Seletor Tipo de Parcela: Fixa vs Escalonada */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" /> Tipo de Parcelamento
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTipoParcela("escalonada")}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5",
                    tipoParcela === "escalonada"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <Split className="h-3.5 w-3.5 text-cyan-600" /> Escalonadas
                </button>
                <button
                  type="button"
                  onClick={() => setTipoParcela("fixa")}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5",
                    tipoParcela === "fixa"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <Percent className="h-3.5 w-3.5 text-indigo-600" /> Parcela Fixa
                </button>
              </div>
            </div>

            {/* CAMPOS CONFORME O TIPO */}
            {tipoParcela === "fixa" ? (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Qtd Parcelas (N)</label>
                  <Input 
                    type="number"
                    placeholder="148" 
                    value={formData.n}
                    onChange={e => handleInputChange("n", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Vl. Parcela (R$)</label>
                  <Input 
                    placeholder="3.749,00" 
                    value={formData.pmt}
                    onChange={e => handleInputChange("pmt", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            ) : (
              /* FAIXAS ESCALONADAS */
              <div className="space-y-3 animate-in fade-in">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                      <ListPlus className="h-3.5 w-3.5 text-cyan-600" /> Adicionar Faixa
                    </span>
                    {faixas.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearFaixas}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-700"
                      >
                        Limpar todas
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">De (mês)</label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={novaFaixaDe}
                        onChange={e => setNovaFaixaDe(e.target.value)}
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Até (mês)</label>
                      <Input
                        type="number"
                        placeholder="58"
                        value={novaFaixaAte}
                        onChange={e => setNovaFaixaAte(e.target.value)}
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Valor (R$)</label>
                      <Input
                        placeholder="8.135,00"
                        value={novaFaixaValor}
                        onChange={e => setNovaFaixaValor(e.target.value)}
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddFaixa}
                    className="w-full h-8 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1"
                  >
                    <Plus className="h-3 w-3" /> Incluir Faixa
                  </Button>
                </div>

                {/* Lista de Faixas Adicionadas */}
                {faixas.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {faixas.map((f, idx) => {
                      const qtd = f.ate - f.de + 1;
                      const subtotal = qtd * f.valor;
                      return (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs hover:border-cyan-300 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-black bg-cyan-100 text-cyan-800">
                                #{idx + 1}
                              </Badge>
                              <span className="font-black text-slate-800">
                                {f.de} a {f.ate} <span className="text-[10px] text-slate-500 font-medium">({qtd}x)</span>
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-cyan-700 mt-0.5">
                              {formatCurrency(f.valor)}/mês <span className="text-[10px] text-slate-400 font-normal">· Total {fmtMoeda(subtotal)}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFaixa(f.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remover faixa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-center text-slate-400 italic py-2">
                    Nenhuma faixa inserida. Use o formulário acima ou clique em "Exemplo 4 Faixas".
                  </p>
                )}
              </div>
            )}

            {/* PREVIEW EM TEMPO REAL */}
            {previewTaxa && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-3.5 border border-slate-700 shadow-inner animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Taxa Efetiva Calculada</span>
                  <span className="text-xl font-black text-cyan-400 tracking-tight">{previewTaxa.anual}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-300 pt-1 border-t border-slate-700/60">
                  <span className="text-emerald-400">{previewTaxa.mensal}</span>
                  <span className="text-slate-200">{previewTaxa.total}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
                  {previewTaxa.resumoParcelas}
                </p>
              </div>
            )}

            <Button onClick={handleAddSimulacao} className="w-full font-black uppercase text-xs h-10 gap-2 bg-primary hover:bg-primary/90 text-white shadow-md">
              <Plus className="h-4 w-4" /> Adicionar Simulação ao Quadro
            </Button>
          </CardContent>
        </Card>

        {/* LISTA RÁPIDA DE SIMULAÇÕES CADASTRADAS */}
        {currentSims.length > 0 && (
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/70 p-3 border-b flex flex-row items-center justify-between">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {currentSims.length} SIMULAÇÃO(ÕES) ATIVA(S)
              </p>
              <Badge variant="outline" className="text-[9px] font-bold">
                {isImovel ? "Imóveis" : "Veículos"}
              </Badge>
            </CardHeader>
            <div className="p-2 space-y-1.5 max-h-60 overflow-y-auto">
              {currentSims.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 border border-slate-100 group transition-all hover:border-slate-300 hover:bg-white">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black truncate text-slate-900">{s.nome}</p>
                      {s.isEscalonada && (
                        <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100 text-[8px] font-black px-1 py-0 uppercase">
                          Escalonada
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">
                      {s.anual.toFixed(2)}% a.a. · {s.n}m · Bem: {fmtMoeda(s.bem)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleShareWhatsApp(s)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                      title="Compartilhar no WhatsApp"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => removeSimulacao(s.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 space-y-6">
        {/* Header Superior */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Carta Contemplada — Análise de Taxas</h1>
              <Badge className="bg-cyan-500 hover:bg-cyan-600 text-white font-black text-[10px] uppercase">
                Pro
              </Badge>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Análise financeira de propostas com parcelas fixas ou escalonadas versus financiamento bancário
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full md:w-auto">
            <TabsList className="bg-white border p-1 rounded-xl shadow-sm">
              <TabsTrigger value="imovel" className="rounded-lg gap-2 font-bold px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Home className="h-4 w-4" /> Imóvel
              </TabsTrigger>
              <TabsTrigger value="veiculo" className="rounded-lg gap-2 font-bold px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Car className="h-4 w-4" /> Veículo
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {currentSims.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Calculator className="h-10 w-10 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-800">Nenhuma simulação cadastrada nesta aba</h2>
              <p className="text-slate-500 max-w-md mx-auto text-sm font-medium">
                Adicione uma nova carta no painel lateral ou carregue o exemplo de parcelas escalonadas para testar a taxa global de imediato.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={handleCarregarExemploUsuario} className="font-bold text-xs gap-2 bg-slate-900 hover:bg-slate-800 text-white">
                <Sparkles className="h-4 w-4 text-amber-400" /> Carregar Exemplo (R$ 624k · 4 Faixas)
              </Button>
              <Button variant="outline" onClick={() => setIsPasteModalOpen(true)} className="font-bold text-xs gap-2">
                <ClipboardPaste className="h-4 w-4 text-cyan-600" /> Colar Texto de Proposta
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {currentSims.map((s, i) => {
                const color = COLORS[i % COLORS.length];
                const bgClass = BG_COLORS[i % BG_COLORS.length];
                const borderClass = BORDER_COLORS[i % BORDER_COLORS.length];

                return (
                  <Card key={s.id} className="border-none shadow-lg shadow-slate-200/60 overflow-hidden bg-white flex flex-col justify-between">
                    <div>
                      <CardHeader className="pb-3 border-b bg-slate-50/50">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {s.codigo ? `CÓD. ${s.codigo}` : "CÓD. —"}
                              </span>
                              {s.proximoVencimento && (
                                <Badge variant="outline" className="text-[9px] font-bold text-slate-600 border-slate-300 gap-1 px-1.5 py-0">
                                  <Calendar className="h-2.5 w-2.5 text-cyan-600" /> Venc. {s.proximoVencimento}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base font-black truncate text-slate-900">{s.nome}</CardTitle>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Consórcio {s.tipo}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-[9px] gap-1 px-2 py-0.5 border-none">
                              <CheckCircle2 className="h-3 w-3" /> Contemplada
                            </Badge>
                            {s.isEscalonada && (
                              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[8px] font-black uppercase">
                                {s.faixas?.length || "Múltiplas"} faixas
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 space-y-4">
                        {/* Crédito, Entrada e Saldo Financiado */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Crédito</p>
                            <p className="text-xs font-black text-slate-900">{fmtMoeda(s.bem)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Entrada / Ágio</p>
                            <p className="text-xs font-bold text-slate-700">{fmtMoeda(s.entrada)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-cyan-600 uppercase">Financiado (PV)</p>
                            <p className="text-xs font-black text-cyan-700">{fmtMoeda(s.pv)}</p>
                          </div>
                        </div>

                        {/* Fluxo de Parcelas */}
                        {s.isEscalonada && s.faixas && s.faixas.length > 0 ? (
                          <div className="space-y-2 p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Split className="h-3 w-3 text-cyan-600" /> Fluxo Escalonado ({s.n} meses)
                              </span>
                              <span className="text-[10px] font-bold text-slate-600">
                                Média: <strong className="text-slate-900">{formatCurrency(s.pmt)}</strong>
                              </span>
                            </div>

                            <div className="space-y-1">
                              {s.faixas.map((f, fIdx) => {
                                const qtd = f.ate - f.de + 1;
                                return (
                                  <div key={f.id || fIdx} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100 last:border-none">
                                    <span className="text-slate-600 font-medium">
                                      <strong className="text-slate-800">{f.de.toString().padStart(2, "0")} a {f.ate.toString().padStart(2, "0")}</strong> ({qtd}x)
                                    </span>
                                    <span className="font-black text-slate-900">{formatCurrency(f.valor)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Fluxo de Pagamento</p>
                              <p className="text-sm font-black text-slate-900">{s.n} × {formatCurrency(s.pmt)}</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">Parcelas Fixas</span>
                          </div>
                        )}

                        {/* Taxa Efetiva Box */}
                        <div className={cn("p-4 rounded-2xl border flex items-center justify-between", bgClass, borderClass)}>
                          <div>
                            <p className="text-[9px] font-bold opacity-70 uppercase mb-0.5">Taxa Efetiva Anual</p>
                            <p className="text-2xl font-black tracking-tighter" style={{ color }}>
                              {s.anual.toFixed(2)}% <span className="text-xs opacity-60">a.a.</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-black" style={{ color }}>
                              {(s.r * 100).toFixed(4)}% <span className="text-[9px] opacity-60">a.m.</span>
                            </p>
                            <div className="mt-1.5 flex items-center gap-1 bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-rose-500/20">
                              <AlertCircle className="h-2.5 w-2.5" /> ⚠ {labelRef}
                            </div>
                          </div>
                        </div>

                        {/* Custo Efetivo Real e Total Pago */}
                        <div className="pt-3 border-t border-dashed flex justify-between items-end">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Custo Real (Anual)</p>
                            <p className="text-lg font-black text-rose-600 tracking-tight">
                              ~{s.custoReal.toFixed(1)}% <span className="text-[10px] opacity-60">a.a.</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Total Pago Final</p>
                            <p className="text-xs font-black text-slate-800">{fmtMoeda(s.totalPago)}</p>
                            <p className="text-[9px] font-bold text-slate-400">
                              Extra: {fmtMoeda(s.totalPago - s.bem)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </div>

                    {/* Rodapé do Card com Ações */}
                    <div className="p-3 bg-slate-50/70 border-t flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShareWhatsApp(s)}
                        className="text-[11px] font-bold h-7 gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Share2 className="h-3 w-3" /> WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSimulacao(s.id)}
                        className="text-[11px] font-bold h-7 text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* COMPARATIVO COM FINANCIAMENTO */}
            <div className="relative flex items-center gap-4 py-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-primary" /> Comparativo com {labelFin}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="space-y-6">
              {currentSims.map((s, i) => {
                const color = COLORS[i % COLORS.length];
                const taxaMensalFin = Math.pow(1 + taxaFin, 1/12) - 1;
                const pmtFin0 = s.pv * taxaMensalFin / (1 - Math.pow(1 + taxaMensalFin, -s.n));
                const totalFin0 = s.entrada + pmtFin0 * s.n;
                const economiaFin0 = s.totalPago - totalFin0;

                const altPrazos = isImovel ? [240, 360] : [60, 84];

                return (
                  <div key={s.id} className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden overflow-x-auto">
                    <div className="bg-slate-900 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                       <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                         <Calculator className="h-4 w-4 text-cyan-400" /> {s.nome} {s.codigo ? `· Cód. ${s.codigo}` : ""} — Crédito {fmtMoeda(s.bem)}
                       </h3>
                       <div className="flex flex-wrap items-center gap-2">
                         {s.proximoVencimento && (
                           <Badge variant="outline" className="text-cyan-300 border-cyan-400/40 text-[10px] font-black uppercase">
                             Venc. {s.proximoVencimento}
                           </Badge>
                         )}
                         <Badge variant="outline" className="text-white/80 border-white/20 text-[10px] uppercase font-black">
                           Financiado (PV): {fmtMoeda(s.pv)}
                         </Badge>
                       </div>
                    </div>

                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Operação</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Prazo</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Parcela</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Total Pago</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Custo Extra</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Avaliação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* CONSÓRCIO ROW */}
                        <tr className="border-b transition-colors hover:bg-slate-50/50" style={{ backgroundColor: `${color}08` }}>
                          <td className="p-4">
                            <Badge className="bg-transparent border shadow-none font-black text-[9px] uppercase" style={{ color, borderColor: `${color}30`, backgroundColor: `${color}15` }}>
                              Consórcio Contemplado
                            </Badge>
                          </td>
                          <td className="p-4">
                            <p className="text-xs font-black text-slate-900">{s.n} meses</p>
                            <p className="text-[10px] font-bold text-slate-400">{(s.n/12).toFixed(1)} anos</p>
                          </td>
                          <td className="p-4">
                            {s.isEscalonada ? (
                              <div>
                                <p className="font-black text-xs text-slate-900">Média: {formatCurrency(s.pmt)}</p>
                                <p className="text-[10px] text-cyan-700 font-bold">Escalonada em {s.faixas?.length} faixas</p>
                              </div>
                            ) : (
                              <p className="font-black text-xs text-slate-900">{formatCurrency(s.pmt)}</p>
                            )}
                          </td>
                          <td className="p-4 font-black text-xs" style={{ color }}>{fmtMoeda(s.totalPago)}</td>
                          <td className="p-4 font-black text-xs text-slate-500">{fmtMoeda(s.totalPago - s.bem)}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-black uppercase">
                              {labelRef}
                            </Badge>
                          </td>
                        </tr>

                        {/* FINANCIAMENTO NO MESMO PRAZO */}
                        <tr className="border-b transition-colors hover:bg-slate-50/50 bg-blue-50/20">
                          <td className="p-4">
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 border shadow-none font-black text-[9px] uppercase">
                              {isImovel ? "CEF (Mesmo Prazo)" : "Banco (Mesmo Prazo)"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <p className="text-xs font-black text-slate-900">{s.n} meses</p>
                            <p className="text-[10px] font-bold text-slate-400">{(s.n/12).toFixed(1)} anos</p>
                          </td>
                          <td className="p-4 font-black text-xs text-slate-900">{formatCurrency(pmtFin0)}</td>
                          <td className="p-4 font-black text-xs text-emerald-600">{fmtMoeda(totalFin0)}</td>
                          <td className="p-4 font-black text-xs text-emerald-500">{fmtMoeda(totalFin0 - s.bem)}</td>
                          <td className="p-4">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border shadow-none font-black text-[9px] uppercase">
                              {economiaFin0 > 0 ? `${fmtMoeda(economiaFin0)} mais barato` : "Competitivo"}
                            </Badge>
                          </td>
                        </tr>

                        {/* PRAZOS ALTERNATIVOS TRADICIONAIS */}
                        {altPrazos.map(np => {
                          const pmtFin = s.pv * taxaMensalFin / (1 - Math.pow(1 + taxaMensalFin, -np));
                          const totalFin = s.entrada + pmtFin * np;
                          const isMoreExp = totalFin > s.totalPago;

                          return (
                            <tr key={np} className="border-b transition-colors hover:bg-slate-50/50">
                              <td className="p-4">
                                <Badge className="bg-slate-100 text-slate-600 border-slate-200 border shadow-none font-black text-[9px] uppercase">
                                  {isImovel ? `CEF (${np/12} anos)` : `Banco (${np/12} anos)`}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <p className="text-xs font-black text-slate-900">{np} meses</p>
                                <p className="text-[10px] font-bold text-slate-400">{(np/12)} anos</p>
                              </td>
                              <td className="p-4 font-black text-xs text-slate-900">{formatCurrency(pmtFin)}</td>
                              <td className={cn("p-4 font-black text-xs", isMoreExp ? "text-rose-600" : "text-amber-600")}>
                                {fmtMoeda(totalFin)}
                              </td>
                              <td className={cn("p-4 font-black text-xs opacity-70", isMoreExp ? "text-rose-500" : "text-amber-500")}>
                                {fmtMoeda(totalFin - s.bem)}
                              </td>
                              <td className="p-4">
                                <Badge className={cn("border shadow-none font-black text-[9px] uppercase", isMoreExp ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-600 border-amber-200")}>
                                  {isMoreExp ? "Mais caro total" : "Parcela menor"}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* ANÁLISE TÉCNICA FINAL */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-blue-700" />
                <div>
                  <h2 className="text-xl font-black text-blue-900 uppercase tracking-wide">Análise Técnica & Parecer de Especialista</h2>
                  <p className="text-xs text-blue-700 font-medium">Recomendações fundamentadas para orientar o cliente na decisão de compra</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentSims.map((s, i) => {
                  const color = COLORS[i % COLORS.length];
                  const taxaMensalFin = Math.pow(1 + taxaFin, 1/12) - 1;
                  const pmtFin0 = s.pv * taxaMensalFin / (1 - Math.pow(1 + taxaMensalFin, -s.n));
                  const totalFin0 = s.entrada + pmtFin0 * s.n;
                  const economia = s.totalPago - totalFin0;
                  const bancoMaisBarato = economia > 0;

                  return (
                    <div key={s.id} className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-4 space-y-2">
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                           <span className="text-[11px] font-black uppercase tracking-wider" style={{ color }}>
                             {s.nome} {s.codigo ? `· ${s.codigo}` : ""}
                           </span>
                         </div>
                         {s.isEscalonada && (
                           <Badge variant="outline" className="text-[9px] font-bold text-cyan-800 bg-cyan-50 border-cyan-200">
                             Parcelamento Escalonado
                           </Badge>
                         )}
                       </div>

                       <p className="text-xs leading-relaxed text-slate-700">
                         Taxa interna de retorno de <strong className="text-slate-900">{s.anual.toFixed(2)}% a.a.</strong> ({(s.r * 100).toFixed(4)}% a.m.) com custo real estimado em <strong className="text-rose-600">~{s.custoReal.toFixed(1)}% a.a.</strong> {isImovel ? "incluindo projeção de correção anual do saldo." : "."}
                       </p>

                       {s.isEscalonada ? (
                         <p className="text-xs leading-relaxed text-slate-700">
                           💡 <strong>Efeito Escalonado:</strong> O pagamento de parcelas mais altas no início amortiza mais rápido o saldo devedor, fazendo com que as parcelas finais caiam substancialmente e reduzam o peso dos juros futuros.
                         </p>
                       ) : null}

                       <p className="text-xs leading-relaxed text-slate-700">
                         {bancoMaisBarato
                           ? <span>O {labelFin} no mesmo prazo de <strong>{(s.n/12).toFixed(1)} anos</strong> fica nominalmente em <strong>{fmtMoeda(totalFin0)}</strong> (diferença de {fmtMoeda(Math.abs(economia))}).</span>
                           : <span>O consórcio contemplado apresenta taxa e desembolso total altamente competitivos frente ao {labelFin}.</span>}
                       </p>
                    </div>
                  );
                })}

                <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-4 space-y-2">
                   <div className="flex items-center gap-2 mb-2">
                     <TrendingUp className="h-4 w-4 text-emerald-600" />
                     <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Ponto de Equilíbrio</span>
                   </div>
                   <p className="text-xs leading-relaxed text-slate-700 font-medium">
                     O consórcio contemplado torna-se imbatível frente a financiamentos de <strong>{isImovel ? "20 a 30 anos" : "5 a 7 anos"}</strong>, onde o custo total bancário dobra ou triplica pelo efeito dos juros compostos.
                   </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-4 space-y-2">
                   <div className="flex items-center gap-2 mb-2">
                     <BadgeCheck className="h-4 w-4 text-blue-700" />
                     <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">Argumentação com o Cliente</span>
                   </div>
                   <p className="text-xs leading-relaxed text-slate-700 font-medium">
                     Destaque que a carta contemplada não cobra IOF nem juros remuneratórios bancários, apenas a taxa de administração e o ágio já negociado. {isImovel ? "O FGTS também pode ser utilizado para amortizar o saldo devedor." : ""}
                   </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-blue-200">
                 <Button 
                   onClick={() => currentSims[0] && handleShareWhatsApp(currentSims[0])}
                   className="bg-[#25d366] hover:bg-[#1ebe5c] text-white font-black uppercase text-xs gap-2 rounded-xl shadow-md"
                 >
                   <Share2 className="h-4 w-4" /> Compartilhar Primeira Proposta no WhatsApp
                 </Button>
                 <Button variant="outline" className="bg-white hover:bg-slate-50 border-blue-200 text-blue-700 font-black uppercase text-xs gap-2 rounded-xl" onClick={() => window.print()}>
                   <Download className="h-4 w-4" /> Gerar PDF / Imprimir Relatório
                 </Button>
              </div>
            </div>
          </div>
        )}
      </div>
        </div>
      )}

      {/* MODAL DE COLAR PROPOSTA */}
      <Dialog open={isPasteModalOpen} onOpenChange={setIsPasteModalOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <ClipboardPaste className="h-5 w-5 text-cyan-600" /> Importar Texto da Proposta
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Cole o texto contendo crédito, entrada e faixas de parcelas no formato comum de administradoras.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              rows={8}
              placeholder={`Exemplo:\nCredito R$ 624.306,00\nEntrada 249.990,00\n01 a 58 de R$ 8.135,00\n59 a 60 de R$ 4.994,00\n61 a 75 de 3.174,00\n76 a 217 de 859,00\nProx. Venc. 20/10`}
              value={pasteInputText}
              onChange={e => setPasteInputText(e.target.value)}
              className="text-xs font-mono leading-relaxed resize-none"
            />
            <div className="bg-slate-50 p-2.5 rounded-lg border text-[11px] text-slate-600">
              <p className="font-bold text-slate-700">💡 Dica:</p>
              <p>O sistema detecta automaticamente linhas no formato <code>01 a 58 de R$ 8.135,00</code>, o valor do crédito, entrada e a data do próximo vencimento.</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPasteInputText(`Credito R$ 624.306,00\nEntrada 249.990,00\n01 a 58 de R$ 8.135,00\n59 a 60 de R$ 4.994,00\n61 a 75 de 3.174,00\n76 a 217 de 859,00\nProx. Venc. 20/10`);
              }}
              className="text-xs font-bold text-amber-700"
            >
              Inserir Texto Exemplo
            </Button>
            <Button
              type="button"
              onClick={handleApplyPastedText}
              className="text-xs font-bold bg-primary text-white"
            >
              Processar e Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fixed scroll up/down buttons */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '20px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        zIndex: 50
      }}>
        <button
          onClick={() => window.scrollBy({ top: -400, behavior: 'smooth' })}
          title="Rolar para cima"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#ffffff', border: '1.5px solid #e2e8f0',
            color: '#475569', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <button
          onClick={() => window.scrollBy({ top: 400, behavior: 'smooth' })}
          title="Rolar para baixo"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#ffffff', border: '1.5px solid #e2e8f0',
            color: '#475569', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <style>{`
        @media print {
          aside, .lg\\:hidden, .TabsList, .sidebar, button, .action-btns { display: none !important; }
          .flex-1 { width: 100% !important; padding: 0 !important; }
          body { background: white !important; }
          .Card, .bg-white { border: 1px solid #eee !important; box-shadow: none !important; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
