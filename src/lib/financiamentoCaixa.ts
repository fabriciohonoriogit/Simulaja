/**
 * Financiamento Imobiliário - Motor de Cálculo Oficial Caixa Econômica Federal (SFH / SFI)
 * Suporte a SAC (Sistema de Amortização Constante) e PRICE (Tabela Price)
 * Inclui seguros obrigatórios (MIP, DFI) e tarifa de administração de contrato (TAC/TCA).
 */

export type SistemaAmortizacao = "SAC" | "PRICE";

/**
 * Parâmetros Oficiais da Caixa Econômica Federal (SFH/SFI)
 * Regra: Idade do proponente mais idoso + Prazo de financiamento <= 80 anos e 6 meses (80,5 anos = 966 meses)
 */
export const IDADE_MAXIMA_QUITACAO_CAIXA_ANOS = 80.5; // 80 anos e 6 meses
export const PRAZO_MAXIMO_ABSOLUTO_CAIXA_MESES = 420; // 35 anos

/**
 * Alíquotas referenciais de seguro MIP (Morte e Invalidez Permanente) da Caixa Seguradora por faixa etária
 */
export function obterAliquotaMIPPorIdade(idade: number): number {
  if (idade <= 30) return 0.0160;
  if (idade <= 40) return 0.0225;
  if (idade <= 45) return 0.0340;
  if (idade <= 50) return 0.0460;
  if (idade <= 55) return 0.0780;
  if (idade <= 60) return 0.1180;
  if (idade <= 65) return 0.2050;
  if (idade <= 70) return 0.3950;
  if (idade <= 75) return 0.7200;
  return 1.0500;
}

export interface RegraIdadeCaixa {
  idadeAtual: number;
  prazoMeses: number;
  idadeTerminoAnos: number;
  prazoMaximoPermitidoMeses: number;
  prazoMaximoPermitidoAnos: number;
  valido: boolean;
  motivoInvalido?: string;
  aliquotaMIPEstimada: number;
}

/**
 * Valida a regra de idade e prazo máximo da Caixa Econômica Federal
 */
export function calcularRegraIdadeCaixa(idade: number, prazoMeses: number): RegraIdadeCaixa {
  const idadeLimpa = Math.max(18, Math.min(100, Math.round(idade) || 35));
  const prazoLimpo = Math.max(1, Math.round(prazoMeses) || 360);
  
  const idadeTerminoAnos = Number((idadeLimpa + (prazoLimpo / 12)).toFixed(2));
  
  // Limite: 80.5 anos * 12 meses = 966 meses
  const mesesRestantes = Math.floor((IDADE_MAXIMA_QUITACAO_CAIXA_ANOS - idadeLimpa) * 12);
  const prazoMaximoPermitidoMeses = Math.min(
    PRAZO_MAXIMO_ABSOLUTO_CAIXA_MESES,
    Math.max(0, mesesRestantes)
  );
  const prazoMaximoPermitidoAnos = Number((prazoMaximoPermitidoMeses / 12).toFixed(1));

  const valido = idadeTerminoAnos <= IDADE_MAXIMA_QUITACAO_CAIXA_ANOS && prazoMaximoPermitidoMeses > 0;
  let motivoInvalido: string | undefined;

  if (idadeLimpa >= IDADE_MAXIMA_QUITACAO_CAIXA_ANOS) {
    motivoInvalido = `Proponente com ${idadeLimpa} anos atinge ou supera o limite máximo de quitação da Caixa (80 anos e 6 meses).`;
  } else if (!valido) {
    motivoInvalido = `Pela regra da Caixa (Idade + Prazo ≤ 80 anos e 6 meses), o proponente terá ${idadeTerminoAnos} anos ao final do contrato. O prazo máximo permitido para quem tem ${idadeLimpa} anos é de ${prazoMaximoPermitidoMeses} meses (${prazoMaximoPermitidoAnos} anos).`;
  }

  const aliquotaMIPEstimada = obterAliquotaMIPPorIdade(idadeLimpa);

  return {
    idadeAtual: idadeLimpa,
    prazoMeses: prazoLimpo,
    idadeTerminoAnos,
    prazoMaximoPermitidoMeses,
    prazoMaximoPermitidoAnos,
    valido,
    motivoInvalido,
    aliquotaMIPEstimada
  };
}

/**
 * Calcula o prazo máximo exato da Caixa a partir da Data de Nascimento (ex: "05/01/1977")
 * Regra: Data Limite = Data de Nascimento + 80 anos e 6 meses
 */
export function calcularPrazoMaximoPorDataNascimento(
  dataNascStr: string,
  dataRef: Date = new Date()
): {
  prazoMaximoMeses: number;
  idadeAnos: number;
  dataLimiteQuitacao: string;
  valido: boolean;
  mensagem?: string;
} {
  let dia = 1, mes = 1, ano = 1980;
  const limpo = dataNascStr.trim();

  if (limpo.includes("/")) {
    const parts = limpo.split("/").map(p => parseInt(p, 10));
    if (parts.length === 3 && parts[2] > 1900) {
      dia = parts[0];
      mes = parts[1] - 1;
      ano = parts[2];
    }
  } else if (limpo.includes("-")) {
    const parts = limpo.split("-").map(p => parseInt(p, 10));
    if (parts.length === 3 && parts[0] > 1900) {
      ano = parts[0];
      mes = parts[1] - 1;
      dia = parts[2];
    }
  }

  const nasc = new Date(ano, mes, dia);
  if (isNaN(nasc.getTime()) || ano < 1920) {
    return { 
      prazoMaximoMeses: 420, 
      idadeAnos: 35, 
      dataLimiteQuitacao: "", 
      valido: true 
    };
  }

  // Idade atual
  let idadeAnos = dataRef.getFullYear() - ano;
  if (dataRef.getMonth() < mes || (dataRef.getMonth() === mes && dataRef.getDate() < dia)) {
    idadeAnos--;
  }

  // Data limite: Nascimento + 80 anos + 6 meses
  const anoLimite = ano + 80;
  const mesLimite = mes + 6;
  const dataLimite = new Date(anoLimite, mesLimite, dia);

  // Diferença em meses entre hoje e data limite
  let mesesRestantes = (dataLimite.getFullYear() - dataRef.getFullYear()) * 12 + (dataLimite.getMonth() - dataRef.getMonth());
  if (dataLimite.getDate() < dataRef.getDate()) {
    mesesRestantes--;
  }

  const prazoMaximoMeses = Math.min(
    PRAZO_MAXIMO_ABSOLUTO_CAIXA_MESES,
    Math.max(0, mesesRestantes)
  );

  const valido = prazoMaximoMeses > 0 && idadeAnos < 80.5;

  const diaFmt = String(dataLimite.getDate()).padStart(2, "0");
  const mesFmt = String(dataLimite.getMonth() + 1).padStart(2, "0");
  const anoFmt = dataLimite.getFullYear();
  const dataLimiteQuitacao = `${diaFmt}/${mesFmt}/${anoFmt}`;

  return {
    prazoMaximoMeses,
    idadeAnos,
    dataLimiteQuitacao,
    valido,
    mensagem: !valido 
      ? `Proponente com ${idadeAnos} anos atinge ou supera o limite máximo de quitação da Caixa (80 anos e 6 meses).`
      : undefined
  };
}

export interface FinanciamentoInput {
  valorImovel: number;
  valorEntrada: number;
  prazoMeses: number;
  taxaJurosAnual: number; // Ex: 10.49 (% a.a.)
  sistemaAmortizacao: SistemaAmortizacao;
  idadeProponente?: number; // Padrão: 35 anos
  taxaAdminMensal?: number; // Padrão Caixa: R$ 25,00 fixos mensais
  taxaDFIPercentual?: number; // Padrão Caixa: ~0.0095% a.m. sobre o valor do imóvel
  taxaMIPPercentual?: number; // Calculado pela idade se omitido
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

  // Regra da Caixa e Idade
  regraIdade: RegraIdadeCaixa;
  aliquotaMIPPercentual: number;
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
    idadeProponente = 35,
    taxaAdminMensal = 25.0, // Padrão Caixa SFH
    taxaDFIPercentual = 0.0095, // ~0.0095% sobre valor do imóvel
  } = input;

  const regraIdade = calcularRegraIdadeCaixa(idadeProponente, prazoMeses);
  const taxaMIPPercentual = input.taxaMIPPercentual !== undefined 
    ? input.taxaMIPPercentual 
    : regraIdade.aliquotaMIPEstimada;

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
    regraIdade,
    aliquotaMIPPercentual: taxaMIPPercentual,
  };
}

/**
 * Presets Oficiais mais comuns de financiamento imobiliário Caixa
 */
export const PRESETS_FINANCIAMENTO_CAIXA = [
  {
    id: "caixa-balcao",
    nome: "Caixa Balcão (SFH Vigente)",
    taxaAnual: 11.49,
    descricao: "Taxa anual estimada Caixa para clientes de balcão SFH",
    badge: "11,49% a.a."
  },
  {
    id: "caixa-relacionamento",
    nome: "Caixa Relacionamento",
    taxaAnual: 10.49,
    descricao: "Com conta corrente, cheque especial e salário na Caixa",
    badge: "10,49% a.a."
  },
  {
    id: "caixa-pro-cotista",
    nome: "Caixa Pró-Cotista FGTS",
    taxaAnual: 8.66,
    descricao: "Para trabalhadores com saldo ativo ou inativo no FGTS",
    badge: "8,66% a.a."
  },
  {
    id: "caixa-sfi",
    nome: "Caixa SFI Mercado",
    taxaAnual: 12.00,
    descricao: "Para imóveis acima do teto do SFH ou segundo imóvel",
    badge: "12,00% a.a."
  }
];

