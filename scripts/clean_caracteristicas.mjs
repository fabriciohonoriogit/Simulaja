import fs from 'fs';

const meta = JSON.parse(fs.readFileSync('scripts/logs/magalu_all_groups_metadata.json', 'utf8'));
let code = fs.readFileSync('src/constants/simulador.ts', 'utf8');

// Ajustar taxaAdm de 5296 para 21
if (meta['5296']) {
  meta['5296'].taxaAdm = 21;
}

// Para cada grupo em GRUPO_CARACTERISTICAS
// Encontrar cada entrada "XXXX": { ... }
const groupRegex = /"(\d+)":\s*\{([\s\S]*?)\n\s*\}/g;

code = code.replace(groupRegex, (fullMatch, grpId, body) => {
  const m = meta[grpId];
  
  // Limpar quebras e propriedades antigas duplicadas
  const lines = body.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .filter(l => !l.startsWith('taxaAdm:') && !l.startsWith('fundoReserva:') && !l.startsWith('prazoRestante:') && !l.startsWith('prazoOriginal:') && !l.startsWith('cotasVagas:') && !l.startsWith('status:') && !l.startsWith('vencimento:') && !l.startsWith('numeroAssembleia:') && !l.startsWith('seguro:'));

  // Garantir que cada linha termine com vírgula
  const cleanedLines = lines.map(l => l.endsWith(',') ? l : l + ',');

  if (m) {
    // Atualizar proximaAssembleia se existir
    for (let i = 0; i < cleanedLines.length; i++) {
      if (cleanedLines[i].startsWith('proximaAssembleia:')) {
        cleanedLines[i] = `proximaAssembleia: "${m.proximaAssembleia || '25/11/2026'}",`;
      }
    }

    // Adicionar metadados
    cleanedLines.push(`taxaAdm: ${m.taxaAdm},`);
    cleanedLines.push(`fundoReserva: ${m.fundoReserva},`);
    if (m.seguro) cleanedLines.push(`seguro: ${m.seguro},`);
    cleanedLines.push(`prazoRestante: ${m.prazoRestante},`);
    if (m.prazoOriginal) cleanedLines.push(`prazoOriginal: ${m.prazoOriginal},`);
    cleanedLines.push(`cotasVagas: ${m.cotasVagas},`);
    cleanedLines.push(`status: "${m.status}",`);
    if (m.numeroAssembleia) cleanedLines.push(`numeroAssembleia: ${m.numeroAssembleia},`);
    if (m.vencimento) cleanedLines.push(`vencimento: "${m.vencimento}"`);
    else cleanedLines[cleanedLines.length - 1] = cleanedLines[cleanedLines.length - 1].replace(/,$/, '');
  } else {
    // Se não tem meta scraped, remover vírgula da última linha
    cleanedLines[cleanedLines.length - 1] = cleanedLines[cleanedLines.length - 1].replace(/,$/, '');
  }

  return `"${grpId}": {\n    ${cleanedLines.join('\n    ')}\n  }`;
});

fs.writeFileSync('src/constants/simulador.ts', code, 'utf8');
console.log('✅ Formatação e sincronização de GRUPO_CARACTERISTICAS concluída com sucesso!');
