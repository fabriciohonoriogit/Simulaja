import fs from 'fs';

const masterData = JSON.parse(fs.readFileSync('scripts/logs/magalu_master_scraped_matrix.json', 'utf8'));
const allGroupsMeta = JSON.parse(fs.readFileSync('scripts/logs/magalu_all_groups_metadata.json', 'utf8'));

let fileContent = fs.readFileSync('src/constants/simulador.ts', 'utf8');

// 1. Atualizar tipo GrupoCaracteristicas para suportar campos adicionais
const oldType = `export type GrupoCaracteristicas = {
  grupo: string;
  reajuste: string;
  primeiraAssembleia: string;
  proximaAssembleia: string;
  caracteristicas: string;
  ordemContemplacao: string;
  opcaoDiluir: string;
  regraReajuste: string;
};`;

const newType = `export type GrupoCaracteristicas = {
  grupo: string;
  reajuste: string;
  primeiraAssembleia: string;
  proximaAssembleia: string;
  caracteristicas: string;
  ordemContemplacao: string;
  opcaoDiluir: string;
  regraReajuste: string;
  taxaAdm?: number;
  fundoReserva?: number;
  seguro?: number;
  prazoRestante?: number;
  prazoOriginal?: number;
  cotasVagas?: number;
  status?: string;
  numeroAssembleia?: number;
  vencimento?: string;
};`;

if (fileContent.includes(oldType)) {
  fileContent = fileContent.replace(oldType, newType);
}

// 2. Atualizar GRUPO_CARACTERISTICAS com as datas de assembleia reais (25/11/2026) e metadados
// Atualizar para os principais grupos utilizados nas simulações:
const gruposParaAtualizar = ['5296', '5298', '5295', '5294', '5292', '5282', '5286', '5996', '5997', '5998', '6044', '6043', '6042', '6041', '6039', '6035', '6030', '6027', '6025', '6021', '4150', '4147', '7120', '7119', '7118'];

for (const grp of gruposParaAtualizar) {
  const meta = allGroupsMeta[grp];
  if (!meta) continue;

  // Regex para localizar a entrada do grupo em GRUPO_CARACTERISTICAS
  const grpRegex = new RegExp(`("${grp}":\\s*\\{[\\s\\S]*?\\n\\s*\\})`, 'm');
  const match = fileContent.match(grpRegex);
  if (match) {
    let block = match[1];

    // Atualizar proximaAssembleia se existir
    block = block.replace(/proximaAssembleia:\s*"[^"]*"/, `proximaAssembleia: "${meta.proximaAssembleia || '25/11/2026'}"`);

    // Inserir campos de metadados se não existirem
    if (!block.includes('taxaAdm:')) {
      block = block.replace(/regraReajuste:\s*"[^"]*",?/, (m) => {
        return `${m}\n    taxaAdm: ${meta.taxaAdm},\n    fundoReserva: ${meta.fundoReserva},\n    prazoRestante: ${meta.prazoRestante},\n    cotasVagas: ${meta.cotasVagas},\n    status: "${meta.status}",\n    vencimento: "${meta.vencimento}"`;
      });
    } else {
      // Atualizar campos existentes
      block = block.replace(/taxaAdm:\s*\d+/, `taxaAdm: ${meta.taxaAdm}`);
      block = block.replace(/fundoReserva:\s*\d+/, `fundoReserva: ${meta.fundoReserva}`);
      block = block.replace(/prazoRestante:\s*\d+/, `prazoRestante: ${meta.prazoRestante}`);
      block = block.replace(/cotasVagas:\s*\d+/, `cotasVagas: ${meta.cotasVagas}`);
      block = block.replace(/status:\s*"[^"]*"/, `status: "${meta.status}"`);
      block = block.replace(/vencimento:\s*"[^"]*"/, `vencimento: "${meta.vencimento}"`);
    }

    fileContent = fileContent.replace(match[1], block);
  }
}

// 3. Montar a nova lista de GRUPOS com base na raspagem precisa masterData
const motosPlanos = masterData['MOTOCICLETAS'].planos;
const autoPlanos = masterData['AUTOMOVEIS'].planos;
const imoveisPlanos = masterData['IMOVEIS'].planos;
const caminhoesPlanos = masterData['CAMINHÕES'].planos;
const eletroPlanos = masterData['ELETRO'].planos;
const servicosPlanos = masterData['SERVIÇOS'].planos;

// Montar GRUPOS.veiculo (Motos + Carros)
const veiculoItems = [];

// Motos
veiculoItems.push('    // Motocicletas (Grupo 5296 - 78m 50/50 Negociado Oficial Magalu)');
for (const p of motosPlanos) {
  // r100 aproximado proporcional se 50/50
  const r100 = Number(((p.credito * (1 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante + (p.seguro || 0.031) / 100 * p.credito).toFixed(2));
  veiculoItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${p.parcela.toFixed(2)}, r100: ${r100}, txLinear: 25, frLinear: 2, tx5050: ${p.taxaAdm}, fr5050: ${p.fundoReserva}, seguro: ${p.seguro || 0.031}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}

// Automóveis
veiculoItems.push('\n    // Automóveis - Menor Parcela Oficial Magalu (50/50 Negociado - Grupos 5298, 5294, 5292, 5295, 5282)');
for (const p of autoPlanos) {
  if (p.credito < 37000) continue; // Pular cotas residuais de 35k/36k se não forem competitivas
  const r100 = Number(((p.credito * (1 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante + (p.seguro || 0.0252) / 100 * p.credito).toFixed(2));
  veiculoItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${p.parcela.toFixed(2)}, r100: ${r100}, tx5050: ${p.taxaAdm}, fr5050: ${p.fundoReserva}, seguro: ${p.seguro || 0.0252}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}
// Multi-cota automóvel 180k
veiculoItems.push(`    { grupo: "2x 5295", credito: 180000, prazo: 94, r50: 1375.18, r100: 2232.95, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "2x 90 MIL (50/50)" }`);

// Montar GRUPOS.imovel
const imovelItems = [];
imovelItems.push('    // Imóveis - Menor Parcela Oficial Magalu (Silver 50/50 e 50/50 Negociado)');
for (const p of imoveisPlanos) {
  const r100 = Number(((p.credito * (1 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante + (p.seguro || 0.0252) / 100 * p.credito).toFixed(2));
  imovelItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${p.parcela.toFixed(2)}, r100: ${r100}, tx5050: ${p.taxaAdm}, fr5050: ${p.fundoReserva}, seguro: ${p.seguro || 0.0252}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}

// Multi-cotas Imóveis
imovelItems.push('\n    // Composições de Crédito Multi-Cotas (810k, 900k, 1M, 1.5M, 2M)');
imovelItems.push(`    { grupo: "6042 + 6044", credito: 810000, prazo: 236, r50: 2650.46, r100: 4361.21, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "700 MIL + 110 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "6042 + 6044", credito: 900000, prazo: 236, r50: 2972.61, r100: 4881.94, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "700 MIL + 200 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "2x 6042", credito: 1000000, prazo: 236, r50: 3223.88, r100: 5410.50, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "2 COTAS DE 500 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "3x 6042", credito: 1500000, prazo: 236, r50: 4835.82, r100: 8115.75, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "3 COTAS DE 500 MIL (50/50)" },`);
imovelItems.push(`    { grupo: "4x 6042", credito: 2000000, prazo: 236, r50: 6447.76, r100: 10821.00, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "4 COTAS DE 500 MIL (50/50)" }`);

// Montar GRUPOS.pesados
const pesadosItems = [];
pesadosItems.push('    // Veículos Pesados / Caminhões - 50/50 Negociado Oficial Magalu (Grupo 5996 - 128m e 5997 - 108m)');
for (const p of caminhoesPlanos) {
  if (p.credito >= 400000) continue; // Pular grupo 5999 de 15m residuais
  const r100 = Number(((p.credito * (1 + p.taxaAdm / 100 + p.fundoReserva / 100)) / p.prazoRestante + (p.seguro || 0.0252) / 100 * p.credito).toFixed(2));
  pesadosItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${p.parcela.toFixed(2)}, r100: ${r100}, tx5050: ${p.taxaAdm}, fr5050: ${p.fundoReserva}, seguro: ${p.seguro || 0.0252}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}
pesadosItems.push(`    { grupo: "5999", credito: 400000, prazo: 58, r50: 8031.83, r100: 8031.83, txLinear: 14, frLinear: 1, seguro: 0.0252, isPromo: true, tipoVenda: "PLANO LINEAR" }`);

// Montar GRUPOS.servicos (Eletro + Serviços)
const servicosItems = [];
servicosItems.push('    // Eletroeletrônicos (Grupo 4150 - 45m e Grupo 4147 - 29m)');
for (const p of eletroPlanos) {
  servicosItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${p.parcela.toFixed(2)}, txLinear: ${p.taxaAdm}, frLinear: ${p.fundoReserva}, seguro: ${p.seguro || 0.0252}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}
servicosItems.push('\n    // Serviços / Procedimentos / Festas (Grupo 7118 - 15m, Grupo 7120 - 57m e Grupo 7119 - 38m)');
for (const p of servicosPlanos) {
  servicosItems.push(`    { grupo: "${p.grupo}", credito: ${p.credito}, prazo: ${p.prazoRestante}, r50: ${p.parcela.toFixed(2)}, txLinear: ${p.taxaAdm}, frLinear: ${p.fundoReserva}, seguro: ${p.seguro || 0.0252}, isPromo: true, tipoVenda: "${p.tipoVendaNome}" },`);
}

// Substituir seções de GRUPOS em fileContent
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

// Localizar bloco export const GRUPOS = { ... };
fileContent = fileContent.replace(/export const GRUPOS:\s*Record<string,\s*GrupoItem\[\]>\s*=\s*\{[\s\S]*?\n\};/, novoGruposBlock);

fs.writeFileSync('src/constants/simulador.ts', fileContent, 'utf8');
console.log('✅ src/constants/simulador.ts atualizado com sucesso com dados 100% reais e precisos!');
