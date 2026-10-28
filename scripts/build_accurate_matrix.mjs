import fs from 'fs';

const masterData = JSON.parse(fs.readFileSync('scripts/logs/magalu_master_scraped_matrix.json', 'utf8'));
const imoveisAllOps = JSON.parse(fs.readFileSync('scripts/logs/imoveis_all_scraped_options.json', 'utf8'));

// 1. IMOVEIS
const imovelItems = [];
const creditosImovel = [
  110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 
  200000, 210000, 220000, 230000, 240000, 250000, 260000, 270000, 280000, 
  300000, 320000, 350000, 360000, 380000, 400000, 420000, 430000, 450000, 
  500000, 550000, 600000, 630000, 650000, 700000
];

imovelItems.push('    // Imóveis - 50/50 Negociado e Promocional Oficial Magalu (Excluídos Silvers)');

for (const cr of creditosImovel) {
  const ops = imoveisAllOps[cr] || [];
  // Excluir SILVER
  const noSilver = ops.filter(o => !/silver/i.test(o.tipoVendaNome) && o.vlParcela > 0);

  // Melhor Regular (50/50 Negociado ou Promocional)
  const regular = noSilver.filter(o => !/golden/i.test(o.tipoVendaNome));
  regular.sort((a, b) => a.vlParcela - b.vlParcela);
  const bestReg = regular[0];

  if (bestReg) {
    const semSeguro50 = Number(((bestReg.credito * (0.5 + bestReg.taxaAdm / 100 + bestReg.fundoReserva / 100)) / bestReg.prazoRestante).toFixed(2));
    const r50 = Number(bestReg.vlParcela.toFixed(2));
    const txLinear = bestReg.taxaAdm;
    const frLinear = bestReg.fundoReserva;
    const semSeguro100 = Number(((bestReg.credito * (1.0 + txLinear / 100 + frLinear / 100)) / bestReg.prazoRestante).toFixed(2));
    const seguroMensal = Number((r50 - semSeguro50).toFixed(2));
    const r100 = Number((semSeguro100 + seguroMensal).toFixed(2));

    imovelItems.push(`    { grupo: "${bestReg.grupo}", credito: ${bestReg.credito}, prazo: ${bestReg.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro50}, r100: ${r100}, r100SemSeguro: ${semSeguro100}, tx5050: ${bestReg.taxaAdm}, fr5050: ${bestReg.fundoReserva}, txLinear: ${txLinear}, frLinear: ${frLinear}, seguro: ${bestReg.seguro}, isPromo: true, tipoVenda: "${bestReg.tipoVendaNome}" },`);
  }
}

// Multi-cotas Imóveis
imovelItems.push('\n    // Composições de Crédito Multi-Cotas (810k, 900k, 1M, 1.5M, 2M)');
imovelItems.push(`    { grupo: "6042 + 6044", credito: 810000, prazo: 236, r50: 2650.46, r50SemSeguro: 2400.00, r100: 4361.21, r100SemSeguro: 4110.75, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true, tipoVenda: "700 MIL + 110 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "6042 + 6044", credito: 900000, prazo: 236, r50: 2972.61, r50SemSeguro: 2690.00, r100: 4881.94, r100SemSeguro: 4599.33, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true, tipoVenda: "700 MIL + 200 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "2x 6042", credito: 1000000, prazo: 236, r50: 3223.88, r50SemSeguro: 2923.73, r100: 5410.50, r100SemSeguro: 5110.35, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true, tipoVenda: "2 COTAS DE 500 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "3x 6042", credito: 1500000, prazo: 236, r50: 4835.82, r50SemSeguro: 4385.59, r100: 8115.75, r100SemSeguro: 7665.52, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true, tipoVenda: "3 COTAS DE 500 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "4x 6042", credito: 2000000, prazo: 236, r50: 6447.76, r50SemSeguro: 5847.46, r100: 10821.00, r100SemSeguro: 10220.70, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true, tipoVenda: "4 COTAS DE 500 MIL (50/50)" },`);

// Planos Golden Imóveis (isPlanoGold: true)
imovelItems.push('\n    // Planos Golden Imóveis (Taxa diferenciada / Golden 50/50)');
for (const cr of creditosImovel) {
  const ops = imoveisAllOps[cr] || [];
  const golden = ops.filter(o => /golden/i.test(o.tipoVendaNome) && o.vlParcela > 0);
  golden.sort((a, b) => a.vlParcela - b.vlParcela);
  const bestGold = golden[0];

  if (bestGold) {
    const semSeguro50 = Number(((bestGold.credito * (0.5 + bestGold.taxaAdm / 100 + bestGold.fundoReserva / 100)) / bestGold.prazoRestante).toFixed(2));
    const r50 = Number(bestGold.vlParcela.toFixed(2));
    const txLinear = bestGold.taxaAdm;
    const frLinear = bestGold.fundoReserva;
    const semSeguro100 = Number(((bestGold.credito * (1.0 + txLinear / 100 + frLinear / 100)) / bestGold.prazoRestante).toFixed(2));
    const seguroMensal = Number((r50 - semSeguro50).toFixed(2));
    const r100 = Number((semSeguro100 + seguroMensal).toFixed(2));

    imovelItems.push(`    { grupo: "${bestGold.grupo}", credito: ${bestGold.credito}, prazo: ${bestGold.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro50}, r100: ${r100}, r100SemSeguro: ${semSeguro100}, tx5050: ${bestGold.taxaAdm}, fr5050: ${bestGold.fundoReserva}, txLinear: ${txLinear}, frLinear: ${frLinear}, seguro: ${bestGold.seguro}, isPromo: false, isPlanoGold: true, tipoVenda: "${bestGold.tipoVendaNome}" },`);
  }
}

// 2. VEICULOS (Motos + Carros)
const veiculoItems = [];
const motosPlanos = masterData['MOTOCICLETAS'].planos;
const autoPlanos = masterData['AUTOMOVEIS'].planos;

veiculoItems.push('    // Motocicletas (Grupo 5296 - 78m 50/50 Negociado Oficial Magalu)');
for (const p of motosPlanos) {
  const semSeguro50 = Number(((p.credito * (0.5 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const r50 = Number(p.parcela.toFixed(2));
  const semSeguro100 = Number(((p.credito * (1.0 + 25 / 100 + 2 / 100)) / p.prazoRestante).toFixed(2));
  const seguroMensal = Number((r50 - semSeguro50).toFixed(2));
  const r100 = Number((semSeguro100 + seguroMensal).toFixed(2));

  veiculoItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro50}, r100: ${r100}, r100SemSeguro: ${semSeguro100}, txLinear: 25, frLinear: 2, tx5050: ${p.taxaAdm}, fr5050: ${p.fundoReserva}, seguro: ${p.seguro || 0.031}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}

veiculoItems.push('\n    // Automóveis - Menor Parcela Oficial Magalu (50/50 Negociado - Grupos 5298, 5294, 5292, 5295, 5282)');
for (const p of autoPlanos) {
  if (p.credito < 37000) continue;
  const semSeguro50 = Number(((p.credito * (0.5 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const r50 = Number(p.parcela.toFixed(2));
  const semSeguro100 = Number(((p.credito * (1.0 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const seguroMensal = Number((r50 - semSeguro50).toFixed(2));
  const r100 = Number((semSeguro100 + seguroMensal).toFixed(2));

  veiculoItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro50}, r100: ${r100}, r100SemSeguro: ${semSeguro100}, tx5050: ${p.taxaAdm}, fr5050: ${p.fundoReserva}, seguro: ${p.seguro || 0.0295}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}
// Multi-cota automóvel 180k
veiculoItems.push(`    { grupo: "2x 5295", credito: 180000, prazo: 94, r50: 1375.18, r50SemSeguro: 1310.00, r100: 2232.95, r100SemSeguro: 2167.77, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "2x 90 MIL (50/50)" }`);

// 3. PESADOS
const pesadosItems = [];
const caminhoesPlanos = masterData['CAMINHÕES'].planos;
pesadosItems.push('    // Veículos Pesados / Caminhões - 50/50 Negociado Oficial Magalu (Grupo 5996 - 128m e 5997 - 108m)');
for (const p of caminhoesPlanos) {
  if (p.credito >= 400000) continue;
  const semSeguro50 = Number(((p.credito * (0.5 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const r50 = Number(p.parcela.toFixed(2));
  const semSeguro100 = Number(((p.credito * (1.0 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const seguroMensal = Number((r50 - semSeguro50).toFixed(2));
  const r100 = Number((semSeguro100 + seguroMensal).toFixed(2));

  pesadosItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro50}, r100: ${r100}, r100SemSeguro: ${semSeguro100}, tx5050: ${p.taxaAdm}, fr5050: ${p.fundoReserva}, seguro: ${p.seguro || 0.0292}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}
pesadosItems.push(`    { grupo: "5999", credito: 400000, prazo: 58, r50: 8031.83, r50SemSeguro: 7931.03, r100: 8031.83, r100SemSeguro: 7931.03, txLinear: 14, frLinear: 1, seguro: 0.0252, isPromo: true, tipoVenda: "PLANO LINEAR" }`);

// 4. SERVICOS
const servicosItems = [];
const eletroPlanos = masterData['ELETRO'].planos;
const servicosPlanos = masterData['SERVIÇOS'].planos;

servicosItems.push('    // Eletroeletrônicos (Grupo 4150 - 45m e Grupo 4147 - 29m)');
for (const p of eletroPlanos) {
  const semSeguro = Number(((p.credito * (1.0 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const r50 = Number(p.parcela.toFixed(2));
  servicosItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro}, txLinear: ${p.taxaAdm}, frLinear: ${p.fundoReserva}, seguro: ${p.seguro || 0.0323}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}

servicosItems.push('\n    // Serviços / Procedimentos / Festas (Grupo 7118 - 15m, Grupo 7120 - 57m e Grupo 7119 - 38m)');
for (const p of servicosPlanos) {
  const semSeguro = Number(((p.credito * (1.0 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const r50 = Number(p.parcela.toFixed(2));
  servicosItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro}, txLinear: ${p.taxaAdm}, frLinear: ${p.fundoReserva}, seguro: ${p.seguro || 0.031}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}

// Montar GRUPOS bloco
const novoGruposBlock = `export const GRUPOS: Record<string, GrupoItem[]> = {
  imovel: [
${imovelItems.join('\n')}
  ],
  veiculo: [
${veiculoItems.join('\n')}
  ],
  pesados: [
${pesadosItems.join('\n')}
  ],
  servicos: [
${servicosItems.join('\n')}
  ]
};`;

let fileContent = fs.readFileSync('src/constants/simulador.ts', 'utf8');
fileContent = fileContent.replace(/export const GRUPOS:\s*Record<string,\s*GrupoItem\[\]>\s*=\s*\{[\s\S]*?\n\};/, novoGruposBlock);
fs.writeFileSync('src/constants/simulador.ts', fileContent, 'utf8');

console.log('✅ Matriz simulador.ts atualizada com sucesso sem Silvers, com Golden e valores com e sem seguro exatos!');
