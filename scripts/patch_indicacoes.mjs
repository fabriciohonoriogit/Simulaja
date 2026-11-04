import fs from 'fs';

let code = fs.readFileSync('src/pages/Indicacoes.tsx', 'utf8');

// 1. Add imports if not present
if (!code.includes('generatePromoCardPDF')) {
  code = code.replace(
    'import { JarvisOrb } from "@/components/admin/JarvisOrb";',
    'import { JarvisOrb } from "@/components/admin/JarvisOrb";\nimport { BlackFridayBanner } from "@/components/BlackFridayBanner";\nimport { isBlackFridayActive } from "@/utils/blackFridayTheme";\nimport { generatePromoCardPDF } from "@/lib/promoCardPdfGenerator";'
  );
}

// 2. Add isBF in Indicacoes function
if (!code.includes('const isBF = isBlackFridayActive();')) {
  code = code.replace(
    'export default function Indicacoes() {',
    'export default function Indicacoes() {\n  const isBF = isBlackFridayActive();'
  );
}

// 3. Replace handleExportPDF
const startExport = code.indexOf('const handleExportPDF = () => {');
if (startExport !== -1) {
  const endExport = code.indexOf('toast({ title: "PDF Gerado!" });', startExport);
  if (endExport !== -1) {
    const endBrace = code.indexOf('};', endExport);
    if (endBrace !== -1) {
      const newExport = `const handleExportPDF = () => {
    const isLinear = effectiveMode === 'linear';
    const tx = isLinear ? (g.txLinear ?? g.tx ?? 20) : (g.tx5050 ?? g.tx ?? 20);
    const fr = isLinear ? (g.frLinear ?? g.fr ?? 1) : (g.fr5050 ?? g.fr ?? 1);

    const doc = generatePromoCardPDF({
      nomeCliente: nomeCliente || 'Cliente Indicado',
      whatsappCliente: wppCliente || '',
      segmento: CATEGORIAS.find(c => c.id === categoria)?.label || categoria,
      grupo: String(isLinear ? (g.grupoLinear ?? g.grupo) : g.grupo),
      credito: g.credito,
      prazo: isLinear ? (g.prazoLinear ?? g.prazo) : g.prazo,
      tipoParcela: g.isPlanoGold ? (isLinear ? 'Golden Linear' : 'PLANO GOLD') : (isLinear ? 'Linear' : 'Reduzida 50%'),
      parcelaValor: selectedInstallment,
      taxaAdm: tx,
      fundoReserva: fr,
      seguro: g.seguro,
      lanceDinheiroPct: lanceDinheiroPct > 0 ? lanceDinheiroPct : undefined,
      lanceEmbutidoPct: lanceEmbutidoPct > 0 ? lanceEmbutidoPct : undefined,
      lanceTotalRS: (lanceDinheiroPct > 0 || lanceEmbutidoPct > 0) ? (g.credito * (lanceDinheiroPct + lanceEmbutidoPct) / 100) : undefined,
      lanceTotalPct: (lanceDinheiroPct > 0 || lanceEmbutidoPct > 0) ? (lanceDinheiroPct + lanceEmbutidoPct) : undefined,
      proximaAssembleia: "25/11/2026",
      consultorNome: pNome ? \`Indicador: \${pNome}\` : 'Parceiro Indicador Autorizado',
      consultorTelefone: pWpp || '41997925357'
    });

    const cleanNome = (nomeCliente || 'cliente').split(' ')[0].toLowerCase();
    doc.save(\`card_promocional_indicacao_\${cleanNome}.pdf\`);
    toast({ 
      title: "Card Promocional Baixado!",
      description: "O PDF em formato de card exclusivo foi gerado com sucesso."
    });
  };`;
      code = code.substring(0, startExport) + newExport + code.substring(endBrace + 2);
    }
  }
}

// 4. Update max-w container and add banner
code = code.replace(
  '<div className="w-full max-w-[480px] animate-in fade-in duration-1000 z-10 flex flex-col items-center mt-4 sm:mt-8 pb-16 px-4">',
  '<div className={`w-full ${isBF ? "max-w-[520px]" : "max-w-[480px]"} animate-in fade-in duration-1000 z-10 flex flex-col items-center mt-4 sm:mt-8 pb-16 px-4`}>'
);

// Add BlackFridayBanner right before {/* Card Principal */}
if (!code.includes('<BlackFridayBanner')) {
  code = code.replace(
    '{/* Card Principal */}',
    '{isBF && <BlackFridayBanner className="w-full mb-6" />}\n\n        {/* Card Principal */}'
  );
}

// 5. Update header badge on AREA DO PARCEIRO
if (!code.includes('EDIÇÃO BLACK DAS BLACKS')) {
  code = code.replace(
    '<span className="text-[18px] sm:text-[20px] font-bold tracking-[0.4em] text-[#84CC16] -mt-1 ml-2 drop-shadow-md">ÁREA DO PARCEIRO</span>',
    `<span className="text-[18px] sm:text-[20px] font-bold tracking-[0.4em] text-[#84CC16] -mt-1 ml-2 drop-shadow-md">ÁREA DO PARCEIRO</span>
            {isBF && (
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-cyan-300 uppercase mt-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.3)] animate-pulse">
                🔥 EDIÇÃO BLACK DAS BLACKS MAGALU
              </span>
            )}`
  );
}

// 6. Update installment card styling
const oldInstallmentCard = `<div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl p-4 flex flex-col items-center justify-center mb-6">
            <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mb-1">
              {isLinear ? "Parcela Linear" : "Parcela Reduzida (50%)"}
            </p>
            <p className="text-2xl font-mono font-bold text-green-700">{fmt(selectedInstallment)}</p>
            
            <div className="w-full grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-green-200 text-center">
              <div>
                <p className="text-[8px] font-bold text-green-600 uppercase">Prazo</p>
                <p className="text-xs font-bold text-green-800">{g.prazo} meses</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-green-600 uppercase">Taxa Adm</p>
                <p className="text-xs font-bold text-green-800">{tx}%</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-green-600 uppercase">F. Reserva</p>
                <p className="text-xs font-bold text-green-800">{fr}%</p>
              </div>
            </div>
          </div>`;

const newInstallmentCard = `<div className={\`rounded-xl p-4 flex flex-col items-center justify-center mb-6 relative overflow-hidden shadow-lg border-2 \${
            isBF 
              ? "border-cyan-400 bg-gradient-to-br from-cyan-50/70 via-slate-50 to-pink-50/40 text-slate-900 shadow-[0_0_25px_rgba(0,229,255,0.2)]" 
              : "bg-[#f0fdf4] border-[#86efac]"
          }\`}>
            <div className={\`absolute top-0 left-0 right-0 h-[3px] \${
              isBF ? "bg-gradient-to-r from-cyan-400 via-pink-500 to-cyan-400 animate-pulse" : "bg-green-500"
            }\`} />
            <p className={\`text-[9px] font-black uppercase tracking-widest mb-1 \${isBF ? "text-cyan-900 flex items-center justify-center gap-1.5 flex-wrap" : "text-green-600"}\`}>
              {isBF && <span className="text-pink-600 font-extrabold">🔥 BLACK DAS BLACKS MAGALU ·</span>}
              {isLinear ? "Parcela Linear" : "Parcela Reduzida (50%)"}
            </p>
            <p className={\`text-2xl sm:text-3xl font-mono font-bold \${isBF ? "text-[#0f2044]" : "text-green-700"}\`}>
              {fmt(selectedInstallment)}
            </p>
            
            <div className={\`w-full grid grid-cols-3 gap-2 mt-3 pt-3 border-t text-center \${isBF ? "border-cyan-200" : "border-green-200"}\`}>
              <div>
                <p className={\`text-[8px] font-bold uppercase \${isBF ? "text-cyan-700" : "text-green-600"}\`}>Prazo</p>
                <p className={\`text-xs font-bold \${isBF ? "text-slate-900" : "text-green-800"}\`}>{g.prazo} meses</p>
              </div>
              <div>
                <p className={\`text-[8px] font-bold uppercase \${isBF ? "text-cyan-700" : "text-green-600"}\`}>Taxa Adm</p>
                <p className={\`text-xs font-bold \${isBF ? "text-slate-900" : "text-green-800"}\`}>{tx}%</p>
              </div>
              <div>
                <p className={\`text-[8px] font-bold uppercase \${isBF ? "text-cyan-700" : "text-green-600"}\`}>F. Reserva</p>
                <p className={\`text-xs font-bold \${isBF ? "text-slate-900" : "text-green-800"}\`}>{fr}%</p>
              </div>
            </div>
          </div>`;

code = code.replace(oldInstallmentCard.replace(/\r\n/g, '\n'), newInstallmentCard);

// 7. Update PDF button label in result section
code = code.replace(
  '<FileText className="mr-2 w-4 h-4 text-slate-500" /> Baixar PDF',
  '<FileText className="mr-2 w-4 h-4 text-cyan-600" /> Baixar Card PDF 🔥'
);

fs.writeFileSync('src/pages/Indicacoes.tsx', code, 'utf8');
console.log('src/pages/Indicacoes.tsx updated successfully!');
