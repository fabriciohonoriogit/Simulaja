import fs from 'fs';

// 1. Atualizar src/constants/simulador.ts
let sim = fs.readFileSync('src/constants/simulador.ts', 'utf8');

// 380k -> Grupo 6035 (prazo 221, tx 23)
sim = sim.replace(
  /\{\s*grupo:\s*"6042",\s*credito:\s*380000[^\}]+\},/,
  '{ grupo: "6035", credito: 380000, prazo: 221, r50: 1396.68, r50SemSeguro: 1272.40, r100: 2256.70, r100SemSeguro: 2132.42, tx5050: 23, fr5050: 1, txLinear: 23, frLinear: 1, seguro: 0.0312, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },'
);

// Composicoes multi-cotas
sim = sim.replace(/grupo:\s*"6042 \+ 6044"/g, 'grupo: "6045 + 6044"');
sim = sim.replace(/grupo:\s*"2x 6042"/g, 'grupo: "2x 6045"');
sim = sim.replace(/grupo:\s*"3x 6042"/g, 'grupo: "3x 6045"');
sim = sim.replace(/grupo:\s*"4x 6042"/g, 'grupo: "4x 6045"');

// Plano Gold 350k -> Grupo 6039
sim = sim.replace(
  /\{\s*grupo:\s*"6042",\s*credito:\s*350000,\s*prazo:\s*235[^\}]+\},/,
  '{ grupo: "6039", credito: 350000, prazo: 222, r50: 1226.02, r50SemSeguro: 1119.27, r100: 2040.85, r100SemSeguro: 1934.10, tx5050: 20, fr5050: 1, txLinear: 20, frLinear: 1, seguro: 0.0305, isPromo: false, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },'
);

// Plano Gold 400k a 700k -> Grupo 6045
const goldCredits = [
  { credito: 400000, r50: 1234.74, r50Sem: 1118.06, r100: 2068.08, r100Sem: 1951.39 },
  { credito: 420000, r50: 1296.47, r50Sem: 1173.96, r100: 2171.48, r100Sem: 2048.96 },
  { credito: 430000, r50: 1327.34, r50Sem: 1201.91, r100: 2223.18, r100Sem: 2097.75 },
  { credito: 450000, r50: 1389.08, r50Sem: 1257.81, r100: 2326.58, r100Sem: 2195.31 },
  { credito: 500000, r50: 1543.42, r50Sem: 1397.57, r100: 2585.08, r100Sem: 2439.24 },
  { credito: 550000, r50: 1697.76, r50Sem: 1537.33, r100: 2843.59, r100Sem: 2683.16 },
  { credito: 600000, r50: 1852.10, r50Sem: 1677.08, r100: 3102.10, r100Sem: 2927.08 },
  { credito: 650000, r50: 2006.45, r50Sem: 1816.84, r100: 3360.60, r100Sem: 3170.99 },
  { credito: 700000, r50: 2160.79, r50Sem: 1956.60, r100: 3619.11, r100Sem: 3414.91 },
];

for (const g of goldCredits) {
  const reg = new RegExp(`\\{\\s*grupo:\\s*"6042",\\s*credito:\\s*${g.credito},\\s*prazo:\\s*235[^\\}]+\\},`);
  const repl = `{ grupo: "6045", credito: ${g.credito}, prazo: 240, r50: ${g.r50}, r50SemSeguro: ${g.r50Sem}, r100: ${g.r100}, r100SemSeguro: ${g.r100Sem}, tx5050: 16, fr5050: 1, txLinear: 16, frLinear: 1, seguro: 0.0292, isPromo: false, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },`;
  sim = sim.replace(reg, repl);
}

fs.writeFileSync('src/constants/simulador.ts', sim, 'utf8');
console.log('src/constants/simulador.ts sincronizado com sucesso.');

// 2. Atualizar src/pages/Indicacoes.tsx para garantir calculo seguro uniforme
let ind = fs.readFileSync('src/pages/Indicacoes.tsx', 'utf8');
ind = ind.replace(
  'const valorSeguroMensal = (saldoTotalContrato * (_g.seguro ?? 0)) / 100;',
  'const valorSeguroMensal = _g.r50SemSeguro !== undefined ? Number((_g.r50 - _g.r50SemSeguro).toFixed(2)) : ((_g.credito * (_g.seguro ?? 0)) / 100);'
);
fs.writeFileSync('src/pages/Indicacoes.tsx', ind, 'utf8');
console.log('src/pages/Indicacoes.tsx sincronizado com sucesso.');

// 3. Atualizar src/main.tsx para forcar ativacao imediata do SW
let main = fs.readFileSync('src/main.tsx', 'utf8');
if (!main.includes('updateSW(true)')) {
  main = main.replace(
    'onNeedRefresh() {\n    console.log("[PWA] Nova versão detectada em segundo plano.");\n  },',
    'onNeedRefresh() {\n    console.log("[PWA] Nova versão detectada. Atualizando imediatamente...");\n    updateSW(true);\n  },'
  );
  fs.writeFileSync('src/main.tsx', main, 'utf8');
  console.log('src/main.tsx atualizado com auto-update do SW.');
}
