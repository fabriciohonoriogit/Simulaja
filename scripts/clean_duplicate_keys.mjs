import fs from 'fs';

const filePath = 'src/constants/simulador.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Remover a segunda ocorrência de "6039": { ... }
const first6039 = content.indexOf('"6039": {');
if (first6039 !== -1) {
  const second6039 = content.indexOf('"6039": {', first6039 + 10);
  if (second6039 !== -1) {
    const end6039 = content.indexOf('  "6038": {', second6039);
    if (end6039 !== -1) {
      content = content.slice(0, second6039) + content.slice(end6039);
      console.log('✅ Segunda ocorrência de 6039 removida!');
    }
  }
}

// Remover a segunda ocorrência de "5298": { ... }
const first5298 = content.indexOf('"5298": {');
if (first5298 !== -1) {
  const second5298 = content.indexOf('"5298": {', first5298 + 10);
  if (second5298 !== -1) {
    const nextGroup = content.indexOf('  "5296": {', second5298);
    if (nextGroup !== -1) {
      content = content.slice(0, second5298) + content.slice(nextGroup);
      console.log('✅ Segunda ocorrência de 5298 removida!');
    }
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Limpeza de chaves duplicadas concluída!');
