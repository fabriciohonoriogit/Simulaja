import fs from 'fs';

// 1. Carregar dados recém-raspados do portal Magalu
const masterData = JSON.parse(fs.readFileSync('scripts/logs/magalu_master_scraped_matrix.json', 'utf8'));
const imoveisAllOps = JSON.parse(fs.readFileSync('scripts/logs/imoveis_all_scraped_options.json', 'utf8'));
const allGroupsMeta = JSON.parse(fs.readFileSync('scripts/logs/magalu_all_groups_metadata.json', 'utf8'));

// -------------------------------------------------------------
// 1. IMOVEIS
// -------------------------------------------------------------
const imovelItems = [];
const creditosImovel = Object.keys(imoveisAllOps).map(Number).sort((a, b) => a - b);

imovelItems.push('    // Imóveis - Menores Parcelas Oficiais Magalu (Promocional, 50/50 e Linear | Excluídos Silver e Funcionários)');

for (const cr of creditosImovel) {
  const ops = imoveisAllOps[cr] || [];
  
  // REGRA: Excluir SILVER e FUNCIONARIOS
  const noSilverNoFunc = ops.filter(o => 
    !/silver/i.test(o.tipoVendaNome) && 
    !/funciona/i.test(o.tipoVendaNome) &&
    o.snFuncionario !== 'S' &&
    o.vlParcela > 0
  );

  // Melhor Regular (50/50 Negociado, Promocional ou Linear) - Exclui Golden aqui pois Golden fica em bloco separado
  const regular = noSilverNoFunc.filter(o => !/golden/i.test(o.tipoVendaNome));
  regular.sort((a, b) => a.vlParcela - b.vlParcela);
  const bestReg = regular[0];

  if (bestReg) {
    const is50 = /50\/50/i.test(bestReg.tipoVendaNome) || /parc\.reduzida/i.test(bestReg.tipoVendaNome);
    const fatorCredito = is50 ? 0.5 : 1.0;
    const semSeguro50 = Number(((bestReg.credito * (fatorCredito + bestReg.taxaAdm / 100 + bestReg.fundoReserva / 100)) / bestReg.prazoRestante).toFixed(2));
    const r50 = Number(bestReg.vlParcela.toFixed(2));
    const txLinear = bestReg.taxaAdm;
    const frLinear = bestReg.fundoReserva;
    const semSeguro100 = Number(((bestReg.credito * (1.0 + txLinear / 100 + frLinear / 100)) / bestReg.prazoRestante).toFixed(2));
    const seguroMensal = Number((r50 - semSeguro50).toFixed(2));
    const r100 = Number((semSeguro100 + seguroMensal).toFixed(2));

    imovelItems.push(`    { grupo: "${bestReg.grupo}", credito: ${bestReg.credito}, prazo: ${bestReg.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro50}, r100: ${r100}, r100SemSeguro: ${semSeguro100}, tx5050: ${bestReg.taxaAdm}, fr5050: ${bestReg.fundoReserva}, txLinear: ${txLinear}, frLinear: ${frLinear}, seguro: ${bestReg.seguro || 0.03}, isPromo: true, tipoVenda: "${bestReg.tipoVendaNome}" },`);
  }
}

// Multi-cotas Imóveis baseadas nos novos valores dos grupos 6042 e 6044
const c110 = (imoveisAllOps[110000] || []).filter(o => !/silver/i.test(o.tipoVendaNome) && !/golden/i.test(o.tipoVendaNome)).sort((a,b) => a.vlParcela - b.vlParcela)[0];
const c200 = (imoveisAllOps[200000] || []).filter(o => !/silver/i.test(o.tipoVendaNome) && !/golden/i.test(o.tipoVendaNome)).sort((a,b) => a.vlParcela - b.vlParcela)[0];
const c500 = (imoveisAllOps[500000] || []).filter(o => !/silver/i.test(o.tipoVendaNome) && !/golden/i.test(o.tipoVendaNome)).sort((a,b) => a.vlParcela - b.vlParcela)[0];
const c700 = (imoveisAllOps[700000] || []).filter(o => !/silver/i.test(o.tipoVendaNome) && !/golden/i.test(o.tipoVendaNome)).sort((a,b) => a.vlParcela - b.vlParcela)[0];

const r810_50 = Number((c700.vlParcela + c110.vlParcela).toFixed(2));
const r900_50 = Number((c700.vlParcela + c200.vlParcela).toFixed(2));
const r1M_50 = Number((c500.vlParcela * 2).toFixed(2));
const r15M_50 = Number((c500.vlParcela * 3).toFixed(2));
const r2M_50 = Number((c500.vlParcela * 4).toFixed(2));

imovelItems.push('\n    // Composições de Crédito Multi-Cotas (810k, 900k, 1M, 1.5M, 2M)');
imovelItems.push(`    { grupo: "6042 + 6044", credito: 810000, prazo: ${c700.prazoRestante}, r50: ${r810_50}, r50SemSeguro: ${(r810_50 * 0.91).toFixed(2)}, r100: ${(r810_50 * 1.65).toFixed(2)}, r100SemSeguro: ${(r810_50 * 1.55).toFixed(2)}, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true, tipoVenda: "700 MIL + 110 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "6042 + 6044", credito: 900000, prazo: ${c700.prazoRestante}, r50: ${r900_50}, r50SemSeguro: ${(r900_50 * 0.91).toFixed(2)}, r100: ${(r900_50 * 1.65).toFixed(2)}, r100SemSeguro: ${(r900_50 * 1.55).toFixed(2)}, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true, tipoVenda: "700 MIL + 200 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "2x 6042", credito: 1000000, prazo: ${c500.prazoRestante}, r50: ${r1M_50}, r50SemSeguro: ${(r1M_50 * 0.91).toFixed(2)}, r100: ${(r1M_50 * 1.68).toFixed(2)}, r100SemSeguro: ${(r1M_50 * 1.58).toFixed(2)}, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true, tipoVenda: "2 COTAS DE 500 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "3x 6042", credito: 1500000, prazo: ${c500.prazoRestante}, r50: ${r15M_50}, r50SemSeguro: ${(r15M_50 * 0.91).toFixed(2)}, r100: ${(r15M_50 * 1.68).toFixed(2)}, r100SemSeguro: ${(r15M_50 * 1.58).toFixed(2)}, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true, tipoVenda: "3 COTAS DE 500 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "4x 6042", credito: 2000000, prazo: ${c500.prazoRestante}, r50: ${r2M_50}, r50SemSeguro: ${(r2M_50 * 0.91).toFixed(2)}, r100: ${(r2M_50 * 1.68).toFixed(2)}, r100SemSeguro: ${(r2M_50 * 1.58).toFixed(2)}, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true, tipoVenda: "4 COTAS DE 500 MIL (50/50)" },`);

// Planos Golden Imóveis (isPlanoGold: true | Excluídos Silvers e Funcionários)
imovelItems.push('\n    // Planos Golden Imóveis (Menor Parcela Golden 50/50 | Excluídos Silvers e Funcionários)');
for (const cr of creditosImovel) {
  const ops = imoveisAllOps[cr] || [];
  const golden = ops.filter(o => 
    /golden/i.test(o.tipoVendaNome) && 
    !/silver/i.test(o.tipoVendaNome) &&
    !/funciona/i.test(o.tipoVendaNome) &&
    o.snFuncionario !== 'S' &&
    o.vlParcela > 0
  );
  golden.sort((a, b) => a.vlParcela - b.vlParcela);
  const bestGold = golden[0];

  if (bestGold) {
    const is50 = /50\/50/i.test(bestGold.tipoVendaNome) || /parc\.reduzida/i.test(bestGold.tipoVendaNome);
    const fatorCredito = is50 ? 0.5 : 1.0;
    const semSeguro50 = Number(((bestGold.credito * (fatorCredito + bestGold.taxaAdm / 100 + bestGold.fundoReserva / 100)) / bestGold.prazoRestante).toFixed(2));
    const r50 = Number(bestGold.vlParcela.toFixed(2));
    const txLinear = bestGold.taxaAdm;
    const frLinear = bestGold.fundoReserva;
    const semSeguro100 = Number(((bestGold.credito * (1.0 + txLinear / 100 + frLinear / 100)) / bestGold.prazoRestante).toFixed(2));
    const seguroMensal = Number((r50 - semSeguro50).toFixed(2));
    const r100 = Number((semSeguro100 + seguroMensal).toFixed(2));

    imovelItems.push(`    { grupo: "${bestGold.grupo}", credito: ${bestGold.credito}, prazo: ${bestGold.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro50}, r100: ${r100}, r100SemSeguro: ${semSeguro100}, tx5050: ${bestGold.taxaAdm}, fr5050: ${bestGold.fundoReserva}, txLinear: ${txLinear}, frLinear: ${frLinear}, seguro: ${bestGold.seguro || 0.032}, isPromo: false, isPlanoGold: true, tipoVenda: "${bestGold.tipoVendaNome}" },`);
  }
}

// -------------------------------------------------------------
// 2. VEICULOS (Motos + Carros)
// -------------------------------------------------------------
const veiculoItems = [];
const motosPlanos = masterData['MOTOCICLETAS'].planos.filter(p => !/silver/i.test(p.tipoVendaNome) && !/funciona/i.test(p.tipoVendaNome));
const autoPlanos = masterData['AUTOMOVEIS'].planos.filter(p => !/silver/i.test(p.tipoVendaNome) && !/funciona/i.test(p.tipoVendaNome));

veiculoItems.push('    // Motocicletas (Grupo 5296 - Menores Parcelas 50/50 Negociado Oficial Magalu)');
for (const p of motosPlanos) {
  const is50 = /50\/50/i.test(p.tipoVendaNome);
  const fatorCredito = is50 ? 0.5 : 1.0;
  const semSeguro50 = Number(((p.credito * (fatorCredito + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const r50 = Number(p.parcela.toFixed(2));
  const semSeguro100 = Number(((p.credito * (1.0 + 25 / 100 + 2 / 100)) / p.prazoRestante).toFixed(2));
  const seguroMensal = Number((r50 - semSeguro50).toFixed(2));
  const r100 = Number((semSeguro100 + seguroMensal).toFixed(2));

  veiculoItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro50}, r100: ${r100}, r100SemSeguro: ${semSeguro100}, txLinear: 25, frLinear: 2, tx5050: ${p.taxaAdm}, fr5050: ${p.fundoReserva}, seguro: ${p.seguro || 0.031}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}

veiculoItems.push('\n    // Automóveis - Menor Parcela Oficial Magalu (50/50 Negociado, Promocional e Linear)');
for (const p of autoPlanos) {
  if (p.credito < 37000) continue; // Padrão de entrada de automóveis a partir de 37k
  const is50 = /50\/50/i.test(p.tipoVendaNome);
  const fatorCredito = is50 ? 0.5 : 1.0;
  const semSeguro50 = Number(((p.credito * (fatorCredito + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const r50 = Number(p.parcela.toFixed(2));
  const semSeguro100 = Number(((p.credito * (1.0 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const seguroMensal = Number((r50 - semSeguro50).toFixed(2));
  const r100 = Number((semSeguro100 + seguroMensal).toFixed(2));

  veiculoItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro50}, r100: ${r100}, r100SemSeguro: ${semSeguro100}, tx5050: ${p.taxaAdm}, fr5050: ${p.fundoReserva}, seguro: ${p.seguro || 0.0295}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}

// Multi-cota automóvel 180k (2x 90k)
const auto90 = autoPlanos.find(p => p.credito === 90000);
if (auto90) {
  const pz180 = auto90.prazoRestante;
  const r180_50 = Number((auto90.parcela * 2).toFixed(2));
  const semSeg180_50 = Number(((180000 * (0.5 + auto90.taxaAdm / 100 + auto90.fundoReserva / 100)) / pz180).toFixed(2));
  const semSeg180_100 = Number(((180000 * (1.0 + auto90.taxaAdm / 100 + auto90.fundoReserva / 100)) / pz180).toFixed(2));
  const r180_100 = Number((semSeg180_100 + (r180_50 - semSeg180_50)).toFixed(2));
  veiculoItems.push(`    { grupo: "2x ${auto90.grupo}", credito: 180000, prazo: ${pz180}, r50: ${r180_50}, r50SemSeguro: ${semSeg180_50}, r100: ${r180_100}, r100SemSeguro: ${semSeg180_100}, tx5050: ${auto90.taxaAdm}, fr5050: ${auto90.fundoReserva}, seguro: ${auto90.seguro || 0.0252}, isPromo: true, tipoVenda: "2x 90 MIL (50/50)" }`);
}

// -------------------------------------------------------------
// 3. PESADOS
// -------------------------------------------------------------
const pesadosItems = [];
const caminhoesPlanos = masterData['CAMINHÕES'].planos.filter(p => !/silver/i.test(p.tipoVendaNome) && !/funciona/i.test(p.tipoVendaNome));

pesadosItems.push('    // Veículos Pesados / Caminhões - 50/50 Negociado e Linear Oficial Magalu');
for (const p of caminhoesPlanos) {
  if (p.credito >= 400000) continue;
  const is50 = /50\/50/i.test(p.tipoVendaNome);
  const fatorCredito = is50 ? 0.5 : 1.0;
  const semSeguro50 = Number(((p.credito * (fatorCredito + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const r50 = Number(p.parcela.toFixed(2));
  const semSeguro100 = Number(((p.credito * (1.0 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const seguroMensal = Number((r50 - semSeguro50).toFixed(2));
  const r100 = Number((semSeguro100 + seguroMensal).toFixed(2));

  pesadosItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro50}, r100: ${r100}, r100SemSeguro: ${semSeguro100}, tx5050: ${p.taxaAdm}, fr5050: ${p.fundoReserva}, seguro: ${p.seguro || 0.0292}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}
// Manter entrada histórica de 400k linear caso não retorne 400k regular
const p400 = caminhoesPlanos.find(p => p.credito === 400000);
if (p400 && p400.prazoRestante >= 50) {
  const semSeg = Number(((400000 * (1.0 + p400.taxaAdm / 100 + p400.fundoReserva / 100)) / p400.prazoRestante).toFixed(2));
  pesadosItems.push(`    { grupo: "${p400.grupo}", credito: 400000, prazo: ${p400.prazoRestante}, r50: ${p400.parcela.toFixed(2)}, r50SemSeguro: ${semSeg}, r100: ${p400.parcela.toFixed(2)}, r100SemSeguro: ${semSeg}, txLinear: ${p400.taxaAdm}, frLinear: ${p400.fundoReserva}, seguro: ${p400.seguro || 0.0252}, isPromo: true, tipoVenda: "${p400.tipoVendaNome}" }`);
} else {
  pesadosItems.push(`    { grupo: "5999", credito: 400000, prazo: 58, r50: 8031.83, r50SemSeguro: 7931.03, r100: 8031.83, r100SemSeguro: 7931.03, txLinear: 14, frLinear: 1, seguro: 0.0252, isPromo: true, tipoVenda: "PLANO LINEAR" }`);
}

// -------------------------------------------------------------
// 4. SERVICOS (Eletro + Serviços)
// -------------------------------------------------------------
const servicosItems = [];
const eletroPlanos = masterData['ELETRO'].planos.filter(p => !/silver/i.test(p.tipoVendaNome) && !/funciona/i.test(p.tipoVendaNome));
const servicosPlanos = masterData['SERVIÇOS'].planos.filter(p => !/silver/i.test(p.tipoVendaNome) && !/funciona/i.test(p.tipoVendaNome));

servicosItems.push('    // Eletroeletrônicos (Grupos 4150 e 4147 - Promocional e Linear Oficial Magalu)');
for (const p of eletroPlanos) {
  const semSeguro = Number(((p.credito * (1.0 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const r50 = Number(p.parcela.toFixed(2));
  servicosItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro}, txLinear: ${p.taxaAdm}, frLinear: ${p.fundoReserva}, seguro: ${p.seguro || 0.0323}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}

servicosItems.push('\n    // Serviços / Procedimentos / Festas (Grupos 7118, 7120 e 7119 - Linear Oficial Magalu)');
for (const p of servicosPlanos) {
  const semSeguro = Number(((p.credito * (1.0 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante).toFixed(2));
  const r50 = Number(p.parcela.toFixed(2));
  servicosItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${r50}, r50SemSeguro: ${semSeguro}, txLinear: ${p.taxaAdm}, frLinear: ${p.fundoReserva}, seguro: ${p.seguro || 0.031}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}

// -------------------------------------------------------------
// 5. ATUALIZAR ARQUIVO src/constants/simulador.ts
// -------------------------------------------------------------
let fileContent = fs.readFileSync('src/constants/simulador.ts', 'utf8');

// Atualizar GRUPO_CARACTERISTICAS com as datas de assembleia reais (25/11/2026) e dados atualizados
for (const [grp, meta] of Object.entries(allGroupsMeta)) {
  const grpRegex = new RegExp(`("${grp}":\\s*\\{[\\s\\S]*?\\n\\s*\\})`, 'm');
  const match = fileContent.match(grpRegex);
  if (match) {
    let block = match[1];
    if (meta.proximaAssembleia) {
      block = block.replace(/proximaAssembleia:\s*"[^"]*"/, `proximaAssembleia: "${meta.proximaAssembleia}"`);
    }
    if (meta.prazoRestante) {
      block = block.replace(/prazoRestante:\s*\d+/, `prazoRestante: ${meta.prazoRestante}`);
    }
    if (meta.cotasVagas !== undefined) {
      block = block.replace(/cotasVagas:\s*\d+/, `cotasVagas: ${meta.cotasVagas}`);
    }
    if (meta.vencimento) {
      block = block.replace(/vencimento:\s*"[^"]*"/, `vencimento: "${meta.vencimento}"`);
    }
    if (meta.numeroAssembleia) {
      block = block.replace(/numeroAssembleia:\s*\d+/, `numeroAssembleia: ${meta.numeroAssembleia}`);
    }
    fileContent = fileContent.replace(match[1], block);
  }
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

fileContent = fileContent.replace(/export const GRUPOS:\s*Record<string,\s*GrupoItem\[\]>\s*=\s*\{[\s\S]*?\n\};/, novoGruposBlock);
fs.writeFileSync('src/constants/simulador.ts', fileContent, 'utf8');

console.log('✅ Matriz simulador.ts atualizada com sucesso!');
console.log(`- Imóveis: ${creditosImovel.length} créditos (Regular + Golden + Multi-cotas)`);
console.log(`- Veículos: ${motosPlanos.length} motos + ${autoPlanos.length} autos`);
console.log(`- Pesados: ${caminhoesPlanos.length} caminhões`);
console.log(`- Serviços: ${eletroPlanos.length} eletro + ${servicosPlanos.length} serviços`);
console.log('Excluídos rigorosamente planos SILVER e FUNCIONÁRIOS!');
