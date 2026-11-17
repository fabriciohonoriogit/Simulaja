import fs from 'fs';

const content = fs.readFileSync('src/constants/simulador.ts', 'utf8');

// Extrair GRUPOS.imovel
const imovelMatch = content.match(/imovel:\s*\[([\s\S]*?)\n\s*\]/);
if (!imovelMatch) {
  console.error('imovel array not found');
  process.exit(1);
}

// Avaliar array
const imoveis = eval('[' + imovelMatch[1] + ']');
console.log('Total planos imovel:', imoveis.length);

const p350 = imoveis.filter(g => g.credito === 350000);
console.log('Todos os itens de 350k no array:');
p350.forEach(p => console.log(' - Grupo:', p.grupo, '| Prazo:', p.prazo, '| r50:', p.r50, '| SemSeg:', p.r50SemSeguro, '| isPlanoGold:', p.isPlanoGold));

// Lógica de filtragem usada no Site, Indicador e CRM Interno:
// 1. Sem Plano Gold
let filtered = imoveis.filter(g => !g.isPlanoGold);
filtered = [...filtered].sort((a, b) => a.r50 - b.r50);
const seen = new Set();
filtered = filtered.filter(g => {
  if (seen.has(g.credito)) return false;
  seen.add(g.credito);
  return true;
});
filtered.sort((a, b) => a.credito - b.credito);

const item350 = filtered.find(g => g.credito === 350000);
console.log('\n--- RESULTADO PADRÃO (NORMAL 50/50): ---');
console.log('Crédito:', item350?.credito);
console.log('Grupo:', item350?.grupo);
console.log('Prazo:', item350?.prazo);
console.log('r50 (Com Seguro):', item350?.r50);
console.log('r50 (Sem Seguro):', item350?.r50SemSeguro);
console.log('tx:', item350?.tx5050);

// 2. Com Plano Gold
let filteredGold = imoveis.filter(g => g.isPlanoGold);
filteredGold = [...filteredGold].sort((a, b) => a.r50 - b.r50);
const seenGold = new Set();
filteredGold = filteredGold.filter(g => {
  if (seenGold.has(g.credito)) return false;
  seenGold.add(g.credito);
  return true;
});
filteredGold.sort((a, b) => a.credito - b.credito);

const item350Gold = filteredGold.find(g => g.credito === 350000);
console.log('\n--- RESULTADO PLANO GOLD: ---');
console.log('Crédito:', item350Gold?.credito);
console.log('Grupo:', item350Gold?.grupo);
console.log('Prazo:', item350Gold?.prazo);
console.log('r50 (Com Seguro):', item350Gold?.r50);
console.log('r50 (Sem Seguro):', item350Gold?.r50SemSeguro);
