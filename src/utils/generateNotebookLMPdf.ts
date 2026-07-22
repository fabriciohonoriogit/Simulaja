import { jsPDF as jsPDFNamed } from "jspdf";
import jsPDFDefault from "jspdf";

const jsPDF = jsPDFNamed || jsPDFDefault || (globalThis as any).jspdf?.jsPDF || (globalThis as any).jsPDF;
import type { GrupoItem } from "@/constants/simulador";

interface ApresentacaoParams {
  grupo: GrupoItem;
  categoria: string;
  paymentMode: "linear" | "reduzido";
  installmentValue: number;
  simNome?: string;
  simWpp?: string;
  consultorNome?: string;
  lanceDinheiroPct?: number;
  lanceEmbutidoPct?: number;
  incluirSeguro?: boolean;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtFull = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function generateNotebookLMPdf({
  grupo,
  categoria,
  paymentMode,
  installmentValue,
  simNome,
  simWpp,
  consultorNome,
  lanceDinheiroPct = 0,
  lanceEmbutidoPct = 25,
  incluirSeguro = true,
}: ApresentacaoParams) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const isImovel = categoria === "imovel";
  const isLinear = paymentMode === "linear";
  const clienteStr = simNome?.trim() ? simNome.trim() : "Cliente Especial";
  const consultorStr = consultorNome?.trim() ? consultorNome.trim() : "Fabricio Honório - Especialista Magalu";
  const dataHoje = new Date().toLocaleDateString("pt-BR");

  // Palette: Notebook LM (Deep Executive Navy, Slate, Gold & Emerald Accent)
  const cNavy = [13, 27, 42];      // #0D1B2A
  const cSlate = [27, 38, 59];     // #1B263B
  const cGold = [212, 160, 23];    // #D4A017
  const cGreen = [22, 163, 74];    // #16A34A
  const cText = [15, 23, 42];      // #0F172A
  const cMuted = [100, 116, 139];  // #64748B
  const cCardBg = [248, 250, 252]; // #F8FAFC
  const cBorder = [226, 232, 240]; // #E2E8F0

  // -------------------------------------------------------------
  // PAGE 1: EXECUTIVE COVER & FINANCIAL STRATEGY
  // -------------------------------------------------------------

  // Top Accent Banner (Notebook LM Dark Navy)
  doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.rect(0, 0, 210, 48, "F");

  // Top Golden Accent Line
  doc.setFillColor(cGold[0], cGold[1], cGold[2]);
  doc.rect(0, 48, 210, 2, "F");

  // Header Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("NOTEBOOK LM · ESTUDO ESTRATÉGICO PATRIMONIAL", 15, 16);

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("APRESENTAÇÃO EXECUTIVA DE CONSÓRCIO", 15, 28);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(212, 160, 23);
  doc.text("PLANEJAMENTO FINANCEIRO INTELIGENTE & ALAVANCAGEM", 15, 36);

  // Metadata Card (Right Aligned in Header)
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`CLIENTE: ${clienteStr.toUpperCase()}`, 195, 20, { align: "right" });
  doc.text(`DATA: ${dataHoje}`, 195, 27, { align: "right" });
  doc.text(`GRUPO: ${grupo.grupo || "6042"}`, 195, 34, { align: "right" });

  // Body Content Start
  let y = 60;

  // Executive Greeting Box
  doc.setFillColor(cCardBg[0], cCardBg[1], cCardBg[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(15, y, 180, 24, 3, 3, "FD");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text(`Prezado(a) ${clienteStr},`, 20, y + 8);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(cText[0], cText[1], cText[2]);
  doc.text(
    `Preparamos esta análise executiva personalizada para apresentar a viabilidade e os benefícios estratégicos`,
    20,
    y + 14
  );
  doc.text(
    `do Consórcio Magalu na conquista e ampliação do seu patrimônio com custo financeiro otimizado.`,
    20,
    y + 19
  );

  y += 32;

  // SECTION 1: FINANCIAL OVERVIEW (QUADRO DE VALORES)
  doc.setFillColor(cSlate[0], cSlate[1], cSlate[2]);
  doc.rect(15, y, 180, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("1. RESUMO FINANCEIRO DA PROPOSTA", 20, y + 5.5);

  y += 12;

  // 4 Key Metric Cards in Grid
  const cardW = 41;
  const cardH = 22;

  const metrics = [
    { label: "CRÉDITO CONTRATADO", val: fmtFull(grupo.credito), color: cNavy },
    {
      label: isLinear ? "PARCELA LINEAR" : "PARCELA REDUZIDA 50%",
      val: fmtFull(installmentValue),
      color: cGreen,
    },
    { label: "PRAZO TOTAL", val: `${grupo.prazo} meses`, color: cSlate },
    { label: "TAXA ADM TOTAL", val: `${grupo.txLinear ?? grupo.tx5050 ?? 18}%`, color: cGold },
  ];

  metrics.forEach((m, idx) => {
    const mx = 15 + idx * 46;
    doc.setFillColor(cCardBg[0], cCardBg[1], cCardBg[2]);
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.roundedRect(mx, y, cardW, cardH, 2, 2, "FD");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
    doc.text(m.label, mx + cardW / 2, y + 6, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.val, mx + cardW / 2, y + 16, { align: "center" });
  });

  y += 28;

  // SECTION 2: POSSIBILIDADES ESTRATÉGICAS DE USO (IMÓVEL & INVESTIMENTO)
  doc.setFillColor(cSlate[0], cSlate[1], cSlate[2]);
  doc.rect(15, y, 180, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(
    isImovel
      ? "2. POSSIBILIDADES ESTRATÉGICAS DE USO DO CRÉDITO IMOBILIÁRIO"
      : "2. POSSIBILIDADES DE USO & APLICAÇÕES ESTRATÉGICAS",
    20,
    y + 5.5
  );

  y += 12;

  const estrategiasImovel = [
    {
      titulo: "🔑 Aquisição Imobiliária (Residencial, Comercial ou Terrenos)",
      desc: "Utilize o crédito integral de " + fmt(grupo.credito) + " para adquirir imóveis novos, usados, comerciais, galpões ou terrenos, sem incidência de juros compostos de financiamento bancário.",
    },
    {
      titulo: "🛠️ Construção e Reforma de Alto Padrão",
      desc: "Construa do zero em terreno próprio ou execute reformas expressivas e modernização imobiliária, valorizando o imóvel existente sem descapitalizar o seu caixa.",
    },
    {
      titulo: "📈 Alavancagem Patrimonial & Renda Passiva de Aluguel",
      desc: "Estratégia de investimento: adquira imóveis voltados para locação residencial/comercial. O valor recebido do aluguel financia as parcelas restantes, criando uma fonte de renda passiva vitalícia.",
    },
    {
      titulo: "🏛️ Quitação ou Substituição de Financiamento Bancário High Cost",
      desc: "Utilize a carta contemplada para quitar financiamentos imobiliários de juros altos (ex: SAC/PRICE), reduzindo drasticamente o seu custo financeiro mensal e acelerando a quitação.",
    },
  ];

  const estrategiasGeral = [
    {
      titulo: "🚗 Aquisição e Renovação de Frota / Veículos",
      desc: "Adquira veículos zero km ou seminovos com poder de compra à vista, negociando descontos agressivos sem pagar juros de financiamento.",
    },
    {
      titulo: "💼 Planejamento Estratégico de Capital e Investimentos",
      desc: "Formação de patrimônio programado com máxima eficiência, ideal para empresários e investidores que priorizam preservação de liquidez.",
    },
  ];

  const listaEstrategias = isImovel ? estrategiasImovel : estrategiasGeral;

  listaEstrategias.forEach((est) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.roundedRect(15, y, 180, 16, 2, 2, "FD");

    // Indicator bar
    doc.setFillColor(cGold[0], cGold[1], cGold[2]);
    doc.rect(15, y, 2.5, 16, "F");

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.text(est.titulo, 21, y + 5.5);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
    const splitDesc = doc.splitTextToSize(est.desc, 170);
    doc.text(splitDesc, 21, y + 10.5);

    y += 19;
  });

  y += 4;

  // SECTION 3: COMPARATIVO CONSÓRCIO VS FINANCIAMENTO BANCÁRIO
  doc.setFillColor(cSlate[0], cSlate[1], cSlate[2]);
  doc.rect(15, y, 180, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("3. ESTUDO COMPARATIVO DE CUSTO FINANCEIRO", 20, y + 5.5);

  y += 12;

  // Calculated estimates
  const taxaTotalConsorcioPct = (grupo.txLinear ?? grupo.tx5050 ?? 18) + (grupo.frLinear ?? grupo.fr5050 ?? 1);
  const custoTotalConsorcio = grupo.credito * (1 + taxaTotalConsorcioPct / 100);
  
  // Financiamento bancário tradicional cost ~2.2x credit
  const custoTotalFinanciamento = grupo.credito * 2.2;
  const economiaEstimada = Math.max(0, custoTotalFinanciamento - custoTotalConsorcio);

  doc.setFillColor(240, 253, 244); // light green bg
  doc.setDrawColor(134, 239, 172);
  doc.roundedRect(15, y, 180, 26, 3, 3, "FD");

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(cGreen[0], cGreen[1], cGreen[2]);
  doc.text("💡 ECONOMIA FINANCEIRA ESTIMADA: " + fmtFull(economiaEstimada), 20, y + 7);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(cText[0], cText[1], cText[2]);
  doc.text(
    `No consórcio você NÃO paga juros remuneratórios compostos. O custo total do seu plano será de apenas ${fmtFull(
      custoTotalConsorcio
    )}`,
    20,
    y + 13
  );
  doc.text(
    `enquanto no financiamento bancário tradicional o custo total ultrapassaria ${fmtFull(
      custoTotalFinanciamento
    )} (mais do que o dobro do crédito).`,
    20,
    y + 18
  );

  // -------------------------------------------------------------
  // FOOTER SIGNATURE & BRANDING (Notebook LM Style)
  // -------------------------------------------------------------

  doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.rect(0, 272, 210, 25, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("CONSÓRCIO MAGALU · EXCELLENCE IN WEALTH PLANNING", 15, 280);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text(`Consultor Responsável: ${consultorStr}`, 15, 286);
  doc.text("www.oespecialistaconsorcio.com.br", 195, 286, { align: "right" });

  // Save the PDF
  const nomeArquivo = `apresentacao_notebooklm_${clienteStr.toLowerCase().replace(/\s+/g, "_")}.pdf`;
  doc.save(nomeArquivo);
}
