/**
 * Financiamento Imobiliário - Motor de Cálculo Oficial Caixa Econômica Federal (SFH / SFI)
 * Suporte a SAC (Sistema de Amortização Constante) e PRICE (Tabela Price)
 * Inclui seguros obrigatórios (MIP, DFI) e tarifa de administração de contrato (TAC/TCA).
 */

export type SistemaAmortizacao = "SAC" | "PRICE";

export interface FinanciamentoInput {
  valorImovel: number;
  valorEntrada: number;
  prazoMeses: number;
  taxaJurosAnual: number; // Ex: 10.49 (% a.a.)
  sistemaAmortizacao: SistemaAmortizacao;
  taxaAdminMensal?: number; // Padrão Caixa: R$ 25,00 fixos mensais
  taxaDFIPercentual?: number; // Padrão Caixa: ~0.0095% a.m. sobre o valor do imóvel
  taxaMIPPercentual?: number; // Padrão Caixa: ~0.0280% a.m. sobre o saldo devedor
}

export interface ParcelaMes {
  mes: number;
  saldoDevedorInicial: number;
  amortizacao: number;
  juros: number;
  seguroMIP: number;
  seguroDFI: number;
  taxaAdm: number;
  parcelaTotal: number;
  saldoDevedorFinal: number;
}

export interface FinanciamentoResultado {
  valorImovel: number;
  valorEntrada: number;
  valorFinanciado: number;
  prazoMeses: number;
  sistema: SistemaAmortizacao;
  taxaJurosAnual: number;
  taxaJurosMensal: number; // Taxa proporcional mensal = taxaJurosAnual / 12

  // Parcelas
  primeiraParcela: number;
  segundaParcela?: number;
  ultimaParcela: number;
  parcelaMedia: number;

  // Totais
  totalAmortizacao: number;
  totalJuros: number;
  totalSeguroMIP: number;
  totalSeguroDFI: number;
  totalSeguros: number;
  totalTaxasAdm: number;
  totalFinanciamentoPago: number; // Soma de todas as parcelas
  valorFinalTotal: number; // Entrada + Parcelas
  custoExtraTotal: number; // Juros + Seguros + Taxas

  // Multiplicador (Total pago / Valor do Imóvel)
  multiplicadorImovel: number;

  // Custo Efetivo Total (CET)
  cetMensal: number;
  cetAnual: number;

  // Cronograma
  cronogramaCompleto: ParcelaMes[];
  marcosPrincipais: ParcelaMes[];
}

/**
 * Cálculo da TIR (Taxa Interna de Retorno) para determinação do CET
 */
export function calcularTIRFluxo(pv: number, fluxos: number[]): number {
  if (pv <= 0 || !fluxos || fluxos.length === 0) return 0;
  const total = fluxos.reduce((a, b) => a + b, 0);
  if (total <= pv) return 0;

  const npv = (rate: number) => {
    let val = -pv;
    let factor = 1 + rate;
    for (let i = 0; i < fluxos.length; i++) {
      val += fluxos[i] / factor;
      factor *= 1 + rate;
    }
    return val;
  };

  const dNpv = (rate: number) => {
    let val = 0;
    let factor = Math.pow(1 + rate, 2);
    for (let i = 0; i < fluxos.length; i++) {
      val -= ((i + 1) * fluxos[i]) / factor;
      factor *= 1 + rate;
    }
    return val;
  };

  let r = (total / pv - 1) / fluxos.length;
  if (r <= 0) r = 0.01;

  for (let iter = 0; iter < 60; iter++) {
    const f = npv(r);
    const df = dNpv(r);
    if (Math.abs(f) < 1e-7) return r;
    if (Math.abs(df) < 1e-12) break;
    const nextR = r - f / df;
    if (nextR <= -0.99 || nextR > 2.0 || isNaN(nextR)) break;
    if (Math.abs(nextR - r) < 1e-8) return nextR;
    r = nextR;
  }

  // Bisection fallback
  let low = 0.000001;
  let high = 1.0;
  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    const val = npv(mid);
    if (Math.abs(val) < 1e-6 || high - low < 1e-8) return mid;
    if (val > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/**
 * Realiza a simulação completa de financiamento imobiliário nos parâmetros oficiais da Caixa
 */
export function simularFinanciamentoImobiliario(input: FinanciamentoInput): FinanciamentoResultado {
  const {
    valorImovel,
    valorEntrada,
    prazoMeses,
    taxaJurosAnual,
    sistemaAmortizacao,
    taxaAdminMensal = 25.0, // Padrão Caixa SFH
    taxaDFIPercentual = 0.0095, // ~0.0095% sobre valor do imóvel
    taxaMIPPercentual = 0.0280, // ~0.0280% sobre saldo devedor
  } = input;

  const valorFinanciado = Math.max(0, valorImovel - valorEntrada);
  const n = Math.max(1, prazoMeses);
  
  // Taxa nominal mensal proporcional padrão Caixa (taxa anual / 12)
  const iMensal = (taxaJurosAnual / 100) / 12;
  const dfiMensal = (valorImovel * (taxaDFIPercentual / 100));
  const mipTaxa = taxaMIPPercentual / 100;
  const adm = taxaAdminMensal;

  const cronogramaCompleto: ParcelaMes[] = [];

  let totalJuros = 0;
  let totalSeguroMIP = 0;
  let totalSeguroDFI = 0;
  let totalTaxasAdm = 0;
  let totalParcelas = 0;

  if (sistemaAmortizacao === "SAC") {
    const amortizacaoConstante = valorFinanciado / n;
    let saldoAtual = valorFinanciado;

    for (let mes = 1; mes <= n; mes++) {
      const saldoInicial = saldoAtual;
      const juros = saldoInicial * iMensal;
      const mip = saldoInicial * mipTaxa;
      const dfi = dfiMensal;
      const amort = Math.min(amortizacaoConstante, saldoInicial);
      const parcela = amort + juros + mip + dfi + adm;
      const saldoFinal = Math.max(0, saldoInicial - amort);

      cronogramaCompleto.push({
        mes,
        saldoDevedorInicial: saldoInicial,
        amortizacao: amort,
        juros,
        seguroMIP: mip,
        seguroDFI: dfi,
        taxaAdm: adm,
        parcelaTotal: parcela,
        saldoDevedorFinal: saldoFinal,
      });

      totalJuros += juros;
      totalSeguroMIP += mip;
      totalSeguroDFI += dfi;
      totalTaxasAdm += adm;
      totalParcelas += parcela;

      saldoAtual = saldoFinal;
    }
  } else {
    // PRICE
    let pmtPura = 0;
    if (iMensal > 0) {
      pmtPura = valorFinanciado * (iMensal * Math.pow(1 + iMensal, n)) / (Math.pow(1 + iMensal, n) - 1);
    } else {
      pmtPura = valorFinanciado / n;
    }

    let saldoAtual = valorFinanciado;

    for (let mes = 1; mes <= n; mes++) {
      const saldoInicial = saldoAtual;
      const juros = saldoInicial * iMensal;
      const amort = Math.min(pmtPura - juros, saldoInicial);
      const mip = saldoInicial * mipTaxa;
      const dfi = dfiMensal;
      const parcela = pmtPura + mip + dfi + adm;
      const saldoFinal = Math.max(0, saldoInicial - amort);

      cronogramaCompleto.push({
        mes,
        saldoDevedorInicial: saldoInicial,
        amortizacao: amort,
        juros,
        seguroMIP: mip,
        seguroDFI: dfi,
        taxaAdm: adm,
        parcelaTotal: parcela,
        saldoDevedorFinal: saldoFinal,
      });

      totalJuros += juros;
      totalSeguroMIP += mip;
      totalSeguroDFI += dfi;
      totalTaxasAdm += adm;
      totalParcelas += parcela;

      saldoAtual = saldoFinal;
    }
  }

  const primeiraParcela = cronogramaCompleto[0]?.parcelaTotal || 0;
  const segundaParcela = cronogramaCompleto[1]?.parcelaTotal || primeiraParcela;
  const ultimaParcela = cronogramaCompleto[cronogramaCompleto.length - 1]?.parcelaTotal || 0;
  const parcelaMedia = totalParcelas / n;

  const totalSeguros = totalSeguroMIP + totalSeguroDFI;
  const valorFinalTotal = valorEntrada + totalParcelas;
  const custoExtraTotal = totalJuros + totalSeguros + totalTaxasAdm;
  const multiplicadorImovel = valorImovel > 0 ? valorFinalTotal / valorImovel : 0;

  // Cálculo do CET
  const fluxos = cronogramaCompleto.map(p => p.parcelaTotal);
  const cetMensal = calcularTIRFluxo(valorFinanciado, fluxos);
  const cetAnual = ((Math.pow(1 + cetMensal, 12) - 1) * 100);

  // Extrair marcos principais para exibição didática (Mês 1, 12, 36, 60, 120, 180, 240, 360, final)
  const marcosDesejados = [1, 12, 24, 60, 120, 180, 240, 300, 360, 420];
  const marcosPrincipais: ParcelaMes[] = [];

  marcosDesejados.forEach(m => {
    if (m <= n) {
      const item = cronogramaCompleto[m - 1];
      if (item && !marcosPrincipais.includes(item)) {
        marcosPrincipais.push(item);
      }
    }
  });

  // Garantir que a última parcela está nos marcos
  const ultimoItem = cronogramaCompleto[cronogramaCompleto.length - 1];
  if (ultimoItem && !marcosPrincipais.some(m => m.mes === ultimoItem.mes)) {
    marcosPrincipais.push(ultimoItem);
  }

  return {
    valorImovel,
    valorEntrada,
    valorFinanciado,
    prazoMeses: n,
    sistema: sistemaAmortizacao,
    taxaJurosAnual,
    taxaJurosMensal: iMensal * 100,
    primeiraParcela,
    segundaParcela,
    ultimaParcela,
    parcelaMedia,
    totalAmortizacao: valorFinanciado,
    totalJuros,
    totalSeguroMIP,
    totalSeguroDFI,
    totalSeguros,
    totalTaxasAdm,
    totalFinanciamentoPago: totalParcelas,
    valorFinalTotal,
    custoExtraTotal,
    multiplicadorImovel,
    cetMensal: cetMensal * 100,
    cetAnual,
    cronogramaCompleto,
    marcosPrincipais,
  };
}

/**
 * Presets Oficiais mais comuns de financiamento imobiliário Caixa
 */
export const PRESETS_FINANCIAMENTO_CAIXA = [
  {
    id: "caixa-balcao",
    nome: "Caixa Balcão (SFH Padrão)",
    taxaAnual: 10.49,
    descricao: "Taxa padrão para clientes sem pacote de relacionamento Caixa",
    badge: "Padrão Balcão"
  },
  {
    id: "caixa-relacionamento",
    nome: "Caixa Relacionamento",
    taxaAnual: 9.99,
    descricao: "Com conta corrente, cheque especial e recebimento de salário na Caixa",
    badge: "Bonificada"
  },
  {
    id: "caixa-pro-cotista",
    nome: "Caixa Pró-Cotista FGTS",
    taxaAnual: 8.66,
    descricao: "Para trabalhadores com saldo ativo ou inativo no FGTS (recursos limitados)",
    badge: "Pró-Cotista"
  },
  {
    id: "caixa-sfi",
    nome: "Caixa SFI (Imóveis > 1.5M)",
    taxaAnual: 11.49,
    descricao: "Para imóveis acima do teto do SFH ou segundo imóvel",
    badge: "SFI Mercado"
  }
];

