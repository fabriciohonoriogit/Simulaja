import fs from 'fs';

// 1. Patch src/lib/pdfGenerator.ts
const newPdfGen = `import { jsPDF } from 'jspdf';
import { generatePromoCardPDF } from './promoCardPdfGenerator';

export interface SimData {
  nomeCliente: string;
  tipoAquisicao: string;
  numGrupo: string;
  credito: number;
  taxaAdm: number;
  fundoReserva: number;
  seguro: number;
  prazo: number;
  tipoParcela: string;
  parcelasContemplar: number;
  lanceDinheiroPct: number;
  lanceEmbutidoPct: number;
  lanceTotalRS: number;
  lanceTotalPct: number;
  valorParcela: number;
  creditoDisponivel: number;
  saldoDevedor: number;
  prazoRestante: number;
  parcelaPosContemp: number;
  consultorNome?: string;
  whatsappCliente?: string;
}

export function gerarPDF(data: SimData) {
  const doc = generatePromoCardPDF({
    nomeCliente: data.nomeCliente,
    whatsappCliente: data.whatsappCliente,
    segmento: data.tipoAquisicao,
    grupo: data.numGrupo,
    credito: data.credito,
    prazo: data.prazo,
    tipoParcela: data.tipoParcela,
    parcelaValor: data.valorParcela,
    taxaAdm: data.taxaAdm,
    fundoReserva: data.fundoReserva,
    seguro: data.seguro,
    lanceDinheiroPct: data.lanceDinheiroPct > 0 ? data.lanceDinheiroPct : undefined,
    lanceEmbutidoPct: data.lanceEmbutidoPct > 0 ? data.lanceEmbutidoPct : undefined,
    lanceTotalRS: data.lanceTotalRS > 0 ? data.lanceTotalRS : undefined,
    lanceTotalPct: data.lanceTotalPct > 0 ? data.lanceTotalPct : undefined,
    prazoRestante: data.prazoRestante,
    consultorNome: data.consultorNome || 'Fabricio Honório - O Especialista',
    proximaAssembleia: '25/11/2026'
  });

  const cleanNome = (data.nomeCliente || 'cliente').replace(/\\s+/g, '_').toLowerCase();
  doc.save(\`card_promocional_consorcio_\${cleanNome}.pdf\`);
  return doc;
}
`;
fs.writeFileSync('src/lib/pdfGenerator.ts', newPdfGen, 'utf8');
console.log('src/lib/pdfGenerator.ts updated successfully!');

// 2. Patch src/components/ConsortiumSimulator.tsx
let csCode = fs.readFileSync('src/components/ConsortiumSimulator.tsx', 'utf8');

const csStartMarker = 'const handleExportPDF = () => {';
const csEndMarker = 'toast({\n        title: "PDF Gerado!",\n        description: "A proposta foi baixada com sucesso.",\n    });\n  };';
const csAltEndMarker = 'toast({\r\n        title: "PDF Gerado!",\r\n        description: "A proposta foi baixada com sucesso.",\r\n    });\r\n  };';

const newExportCode = `const handleExportPDF = () => {
    const res = resultado || (isInternal ? g : null);
    if (!res) return;

    const resIsLinear = isLinear;
    const resTx = resIsLinear ? (res.txLinear ?? res.tx ?? 20) : (res.tx5050 ?? res.tx ?? 20);
    const resFr = resIsLinear ? (res.frLinear ?? res.fr ?? 1) : (res.fr5050 ?? res.fr ?? 1);
    const valParcela = isLinear ? (res.r100 ?? res.r50) : res.r50;

    const doc = generatePromoCardPDF({
      nomeCliente: simNome || "Cliente Especial",
      whatsappCliente: simWpp || "",
      segmento: dynamicCategorias.find((c) => c.id === categoria)?.label || categoria,
      grupo: String(resIsLinear ? (res.grupoLinear ?? res.grupo) : res.grupo),
      credito: res.credito,
      prazo: resIsLinear ? (res.prazoLinear ?? res.prazo) : res.prazo,
      tipoVenda: res.tipoVenda,
      tipoParcela: res.tipoVenda ? res.tipoVenda : (res.isPlanoGold ? (resIsLinear ? "Golden Linear" : "PLANO GOLD") : (resIsLinear ? "Linear" : "Reduzida 50%")),
      parcelaValor: valParcela,
      taxaAdm: resTx,
      fundoReserva: resFr,
      seguro: res.seguro,
      lanceDinheiroPct: lanceDinheiroPct > 0 ? lanceDinheiroPct : undefined,
      lanceEmbutidoPct: lanceEmbutidoPct > 0 ? lanceEmbutidoPct : undefined,
      lanceTotalRS: (lanceDinheiroPct > 0 || lanceEmbutidoPct > 0) ? (res.credito * (lanceDinheiroPct + lanceEmbutidoPct) / 100) : undefined,
      lanceTotalPct: (lanceDinheiroPct > 0 || lanceEmbutidoPct > 0) ? (lanceDinheiroPct + lanceEmbutidoPct) : undefined,
      prazoRestante: prazoRestante,
      proximaAssembleia: "25/11/2026",
      consultorNome: profile?.nome || searchParams.get("nome") || "Fabricio Honório - O Especialista",
      consultorTelefone: "41997925357",
    });

    const cleanNome = (simNome || "cliente").replace(/\\s+/g, "_").toLowerCase();
    doc.save(\`card_promocional_consorcio_\${cleanNome}.pdf\`);

    toast({
      title: "Card Promocional Baixado!",
      description: "O PDF no formato de card promocional exclusivo foi gerado com sucesso.",
    });
  };`;

const csStartIndex = csCode.indexOf(csStartMarker);
if (csStartIndex !== -1) {
  let csEndIndex = csCode.indexOf('toast({', csStartIndex);
  if (csEndIndex !== -1) {
    const endBrace = csCode.indexOf('};', csEndIndex);
    if (endBrace !== -1) {
      csCode = csCode.substring(0, csStartIndex) + newExportCode + csCode.substring(endBrace + 2);
      fs.writeFileSync('src/components/ConsortiumSimulator.tsx', csCode, 'utf8');
      console.log('src/components/ConsortiumSimulator.tsx updated successfully!');
    }
  }
} else {
  console.log('csStartIndex not found');
}

// 3. Patch src/pages/Simulador.tsx
let simCode = fs.readFileSync('src/pages/Simulador.tsx', 'utf8');

// Ensure generatePromoCardPDF import exists
if (!simCode.includes('generatePromoCardPDF')) {
  simCode = simCode.replace(
    'import { isBlackFridayActive } from "@/utils/blackFridayTheme";',
    'import { isBlackFridayActive } from "@/utils/blackFridayTheme";\nimport { generatePromoCardPDF } from "@/lib/promoCardPdfGenerator";'
  );
}

const simStartMarker = 'const handleExportPDF = () => {';
const newSimExportCode = `const handleExportPDF = () => {
    const isLinear = effectiveMode === 'linear';
    const tx = isLinear ? (g.txLinear ?? g.tx ?? 20) : (g.tx5050 ?? g.tx ?? 20);
    const fr = isLinear ? (g.frLinear ?? g.fr ?? 1) : (g.fr5050 ?? g.fr ?? 1);

    const doc = generatePromoCardPDF({
      nomeCliente: nome || 'Cliente Especial',
      whatsappCliente: wpp || '',
      segmento: CATEGORIAS.find(c => c.id === categoria)?.label || categoria,
      grupo: String(isLinear ? (g.grupoLinear ?? g.grupo) : g.grupo),
      credito: g.credito,
      prazo: isLinear ? (g.prazoLinear ?? g.prazo) : g.prazo,
      tipoParcela: g.isPlanoGold ? (isLinear ? 'Golden Linear' : 'PLANO GOLD') : (isLinear ? 'Linear' : 'Reduzida 50%'),
      parcelaValor: selectedInstallment,
      taxaAdm: tx,
      fundoReserva: fr,
      seguro: g.seguro,
      proximaAssembleia: "25/11/2026",
      consultorNome: refNome || 'O Especialista Consórcio',
      consultorTelefone: refCelular || '41997925357'
    });

    const cleanNome = (nome || 'cliente').split(' ')[0].toLowerCase();
    doc.save(\`card_promocional_\${cleanNome}.pdf\`);
    toast({ 
      title: "Card Promocional Gerado!",
      description: "O PDF em formato de card exclusivo foi baixado com sucesso." 
    });
  };`;

const simStartIndex = simCode.indexOf(simStartMarker);
if (simStartIndex !== -1) {
  let simEndIndex = simCode.indexOf('toast({ title: "PDF Gerado!" });', simStartIndex);
  if (simEndIndex !== -1) {
    const endBrace = simCode.indexOf('};', simEndIndex);
    if (endBrace !== -1) {
      simCode = simCode.substring(0, simStartIndex) + newSimExportCode + simCode.substring(endBrace + 2);
      fs.writeFileSync('src/pages/Simulador.tsx', simCode, 'utf8');
      console.log('src/pages/Simulador.tsx updated successfully!');
    }
  }
} else {
  console.log('simStartIndex not found');
}
