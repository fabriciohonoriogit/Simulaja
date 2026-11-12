import fs from 'fs';
import path from 'path';

const html = fs.readFileSync('scripts/logs/resultado_consulta_propostas.html', 'utf-8');

// Match table ctl00_Conteudo_grdProposta
const tableMatch = html.match(/<table[^>]*id="ctl00_Conteudo_grdProposta"[^>]*>([\s\S]*?)<\/table>/);
if (!tableMatch) {
  console.log('Tabela grdProposta não encontrada');
  process.exit(1);
}

const tableContent = tableMatch[1];
const rowMatches = tableContent.match(/<tr[\s\S]*?<\/tr>/g) || [];
console.log(`Total de linhas na tabela grdProposta: ${rowMatches.length}`);

const cotas = [];

for (let i = 1; i < rowMatches.length; i++) {
  const tr = rowMatches[i];
  const tds = (tr.match(/<td[\s\S]*?<\/td>/g) || []).map(td => {
    return td.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  });

  if (tds.length >= 17) {
    const proposta = tds[0];
    const status = tds[1];
    const comissionado = tds[5];
    const grupo = tds[15];
    const cota = tds[16];
    const valorBem = tds[tds.length - 1];

    cotas.push({
      proposta,
      status,
      comissionado,
      grupo,
      cota,
      valorBem,
      tds: tds.join(' | ')
    });
  }
}

console.log(`Encontradas ${cotas.length} propostas:`);
console.log(JSON.stringify(cotas.map(c => ({
  proposta: c.proposta,
  status: c.status,
  grupo: c.grupo,
  cota: c.cota
})), null, 2));

const ativas = cotas.filter(c => c.status !== 'C' && c.grupo && c.cota && c.grupo !== '0000');
console.log(`\nPropostas ATIVAS / ALOCADAS com grupo e cota válidos (${ativas.length}):`);
console.log(JSON.stringify(ativas.map(a => ({ grupo: a.grupo, cota: a.cota, status: a.status })), null, 2));

