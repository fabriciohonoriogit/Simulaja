import fs from 'fs';

const filePath = 'src/constants/simulador.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Atualizar entrada de 350.000 em GRUPOS.imovel
// Substituir a cota antiga do 6042 de 350.000 a 16% pela cota oficial ativa do Grupo 6039 (222m, taxa 20%, 261 vagas)
const old350Regex = /\{\s*grupo:\s*"6042",\s*credito:\s*350000[^\}]+\},?/;
const new350Entry = `{ grupo: "6039", credito: 350000, prazo: 222, r50: 1226.02, r50SemSeguro: 1119.27, r100: 2040.85, r100SemSeguro: 1934.10, tx5050: 20, fr5050: 1, txLinear: 20, frLinear: 1, seguro: 0.0305, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },`;

if (old350Regex.test(content)) {
  content = content.replace(old350Regex, new350Entry);
  console.log('✅ Cota de 350k atualizada de Grupo 6042 para Grupo 6039!');
} else {
  console.warn('⚠️ old350Regex não encontrado diretamente.');
}

// 2. Atualizar cotas a partir de 400.000 para o novo Grupo 6045 (240m, taxa 16%, 4.296 vagas)
const oldHighCreditsRegex = /\{\s*grupo:\s*"6042",\s*credito:\s*400000[\s\S]*?\{\s*grupo:\s*"6042",\s*credito:\s*700000[^\}]+\},/;
const newHighCreditsReplacement = `{ grupo: "6045", credito: 400000, prazo: 240, r50: 1234.74, r50SemSeguro: 1118.06, r100: 2068.08, r100SemSeguro: 1951.39, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6045", credito: 420000, prazo: 240, r50: 1296.47, r50SemSeguro: 1173.96, r100: 2171.48, r100SemSeguro: 2048.96, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6045", credito: 430000, prazo: 240, r50: 1327.34, r50SemSeguro: 1201.91, r100: 2223.18, r100SemSeguro: 2097.75, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6045", credito: 450000, prazo: 240, r50: 1389.08, r50SemSeguro: 1257.81, r100: 2326.58, r100SemSeguro: 2195.31, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6045", credito: 500000, prazo: 240, r50: 1543.42, r50SemSeguro: 1397.57, r100: 2585.08, r100SemSeguro: 2439.24, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6045", credito: 550000, prazo: 240, r50: 1697.76, r50SemSeguro: 1537.33, r100: 2843.59, r100SemSeguro: 2683.16, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6045", credito: 600000, prazo: 240, r50: 1852.10, r50SemSeguro: 1677.08, r100: 3102.10, r100SemSeguro: 2927.08, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6035", credito: 630000, prazo: 221, r50: 2315.55, r50SemSeguro: 2109.50, r100: 3740.89, r100SemSeguro: 3534.84, tx5050: 23, fr5050: 1, txLinear: 23, frLinear: 1, seguro: 0.0312, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6045", credito: 650000, prazo: 240, r50: 2006.45, r50SemSeguro: 1816.84, r100: 3360.60, r100SemSeguro: 3170.99, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6045", credito: 700000, prazo: 240, r50: 2160.79, r50SemSeguro: 1956.60, r100: 3619.11, r100SemSeguro: 3414.91, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6045", credito: 750000, prazo: 240, r50: 2315.13, r50SemSeguro: 2096.35, r100: 3877.61, r100SemSeguro: 3658.84, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6045", credito: 800000, prazo: 240, r50: 2469.47, r50SemSeguro: 2236.11, r100: 4136.12, r100SemSeguro: 3902.76, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },`;

if (oldHighCreditsRegex.test(content)) {
  content = content.replace(oldHighCreditsRegex, newHighCreditsReplacement);
  console.log('✅ Cotas altas de Imóveis atualizadas para Grupo 6045 (4.296 vagas, taxa 16%)!');
} else {
  console.warn('⚠️ oldHighCreditsRegex não encontrado diretamente.');
}

// 3. Atualizar GRUPO_CARACTERISTICAS
const caracteristicasHeader = 'export const GRUPO_CARACTERISTICAS: Record<string, GrupoCaracteristicas> = {';
const newGruposDef = `export const GRUPO_CARACTERISTICAS: Record<string, GrupoCaracteristicas> = {
  "6045": {
    grupo: "6045",
    reajuste: "INCC",
    primeiraAssembleia: "Em formação",
    proximaAssembleia: "25/11/2026",
    caracteristicas: "Imóvel linear e 50/50. Crédito de R$ 400.000,00 a R$ 800.000,00. Prazo: 240 meses. Taxa ADM: 16% + 1% FR. Cotas vagas: 4.296. Status: Formação. Tipo de venda: 50/50 NEGOCIADO. LANCE EMBUTIDO DE 25%. Novo grupo oficial de grande porte.",
    ordemContemplacao: "Sorteio, Lance livre, Fixo 25% e Fixo 45%.",
    opcaoDiluir: "Opção de diluir o lance total e quitar parcelas subsequentes.",
    regraReajuste: "Reajuste anual pelo INCC.",
    taxaAdm: 16,
    fundoReserva: 1,
    seguro: 0.0292,
    prazoRestante: 240,
    prazoOriginal: 240,
    cotasVagas: 4296,
    status: "Formação",
    numeroAssembleia: 1,
    vencimento: "23/11/2026"
  },
  "6039": {
    grupo: "6039",
    reajuste: "INCC",
    primeiraAssembleia: "Em andamento",
    proximaAssembleia: "25/11/2026",
    caracteristicas: "Imóvel linear e 50/50. Crédito de R$ 350.000,00. Prazo: 222 meses. Taxa ADM: 20% + 1% FR. Cotas vagas: 261. Status: Andamento (Ass. 18). Tipo de venda: 50/50 NEGOCIADO. LANCE EMBUTIDO DE 25%. Grupo oficial ativo para a cota de 350 mil após esgotamento total de vagas a 16% no grupo 6042.",
    ordemContemplacao: "Sorteio, Lance livre, Fixo 25% e Fixo 45%.",
    opcaoDiluir: "Opção de diluir o lance total e quitar parcelas subsequentes.",
    regraReajuste: "Reajuste pelo INCC.",
    taxaAdm: 20,
    fundoReserva: 1,
    seguro: 0.0305,
    prazoRestante: 222,
    prazoOriginal: 240,
    cotasVagas: 261,
    status: "Andamento",
    numeroAssembleia: 18,
    vencimento: "23/11/2026"
  },
  "5298": {
    grupo: "5298",
    reajuste: "IPCA",
    primeiraAssembleia: "Em formação",
    proximaAssembleia: "25/11/2026",
    caracteristicas: "Automóveis linear e 50/50. Crédito de R$ 40.000,00 a R$ 130.000,00. Prazo: 100 meses. Taxa ADM: 16% + 1% FR. Cotas vagas: 3.109. Status: Formação. Tipo de venda: 50/50 NEGOCIADO. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance livre e Lances Fixos.",
    opcaoDiluir: "Opção de diluir o lance total.",
    regraReajuste: "Reajuste pelo IPCA.",
    taxaAdm: 16,
    fundoReserva: 1,
    seguro: 0.0292,
    prazoRestante: 100,
    prazoOriginal: 100,
    cotasVagas: 3109,
    status: "Formação",
    numeroAssembleia: 1,
    vencimento: "23/11/2026"
  },`;

if (content.includes(caracteristicasHeader)) {
  content = content.replace(caracteristicasHeader, newGruposDef);
  console.log('✅ Grupos 6045, 6039 e 5298 adicionados em GRUPO_CARACTERISTICAS!');
}

// 4. Atualizar Grupo 6042 com aviso de 350k esgotado
content = content.replace(
  /"6042":\s*\{[\s\S]*?status:\s*"Andamento",\s*numeroAssembleia:\s*6,\s*vencimento:\s*"23\/11\/2026"\s*\}/,
  `"6042": {
    grupo: "6042",
    reajuste: "INCC",
    primeiraAssembleia: "Em andamento",
    proximaAssembleia: "25/11/2026",
    caracteristicas: "Imóvel linear e 50/50. ATENÇÃO RASPAGEM: Crédito de R$ 350.000,00 a 16% ESGOTADO (SEM MAIS VAGAS). Opção ativa para 350k migrada para o Grupo 6039 (222m, taxa 20%). Status: Andamento (Ass. 6). EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance livre, Lance Fidelidade, Fixo 25% e Fixo 45%.",
    opcaoDiluir: "Opção de diluir o lance total.",
    regraReajuste: "Reajuste pelo INCC.",
    taxaAdm: 16,
    fundoReserva: 1,
    seguro: 0.0295,
    prazoRestante: 235,
    prazoOriginal: 240,
    cotasVagas: 0,
    status: "Andamento (350k Esgotado)",
    numeroAssembleia: 6,
    vencimento: "23/11/2026"
  }`
);

// 5. Adicionar média de lances dos novos grupos
if (!content.includes('"6045":')) {
  content = content.replace(
    '  "6044": 98.98,',
    '  "6044": 98.98,\n  "6045": 98.98,'
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Arquivo src/constants/simulador.ts gravado com sucesso!');
