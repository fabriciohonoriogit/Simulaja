import { jsPDF } from "jspdf";
import { isBlackFridayActive } from "@/utils/blackFridayTheme";

export interface PromoCardPdfData {
  nomeCliente?: string;
  whatsappCliente?: string;
  segmento: string;
  grupo: string;
  credito: number;
  prazo: number;
  tipoVenda?: string;
  tipoParcela: string; // "Reduzida 50%", "Linear", "Plano Golden", etc.
  parcelaValor: number;
  taxaAdm?: number;
  fundoReserva?: number;
  seguro?: number;
  lanceDinheiroPct?: number;
  lanceEmbutidoPct?: number;
  lanceTotalRS?: number;
  lanceTotalPct?: number;
  prazoRestante?: number;
  proximaAssembleia?: string;
  consultorNome?: string;
  consultorTelefone?: string;
}

const fmtCurrency = (val: number): string => {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const generatePromoCardPDF = (data: PromoCardPdfData): jsPDF => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const isBF = isBlackFridayActive();
  const W = 210;
  const H = 297;

  // ── 1. BACKGROUND FULL BLEED ──
  // Deep Obsidian background (#030712)
  doc.setFillColor(3, 7, 18);
  doc.rect(0, 0, W, H, "F");

  // Subtle ambient radial glow simulation (geometric rings)
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(0.1);
  doc.circle(20, 20, 60, "S");
  doc.setDrawColor(255, 0, 128);
  doc.circle(W - 20, H - 20, 70, "S");

  // ── 2. CARD PRINCIPAL CONTAINER ──
  const cardX = 10;
  const cardY = 10;
  const cardW = 190;
  const cardH = 277;
  const cardRadius = 7;

  // Card Body Background (#070E22)
  doc.setFillColor(7, 14, 34);
  doc.roundedRect(cardX, cardY, cardW, cardH, cardRadius, cardRadius, "F");

  // Card Outer Glow Border (Neon Cyan #00e5ff)
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(0.9);
  doc.roundedRect(cardX, cardY, cardW, cardH, cardRadius, cardRadius, "S");

  // Neon Gradient Top Bar (Cyan to Magenta)
  const barSegments = 30;
  const barW = cardW / barSegments;
  for (let i = 0; i < barSegments; i++) {
    const ratio = i / barSegments;
    const r = Math.round(0 + (255 - 0) * ratio);
    const g = Math.round(229 + (0 - 229) * ratio);
    const b = Math.round(255 + (128 - 255) * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(cardX + i * barW, cardY, barW + 0.5, 2.5, "F");
  }

  // ── 3. HEADER DO CARD PROMOCIONAL ──
  let curY = cardY + 12;

  // Top Pill Badge
  doc.setFillColor(12, 28, 64);
  doc.roundedRect(W / 2 - 55, curY - 5, 110, 8, 4, 4, "F");
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(W / 2 - 55, curY - 5, 110, 8, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 229, 255);
  const badgeTitle = isBF
    ? "★ BLACK DAS BLACKS CONSÓRCIO MAGALU 2026 ★"
    : "★ OFERTA EXCLUSIVA CONSÓRCIO MAGALU ★";
  doc.text(badgeTitle, W / 2, curY, { align: "center" });

  curY += 13;

  // Main Card Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("CARD PROMOCIONAL EXCLUSIVO", W / 2, curY, { align: "center" });

  curY += 6;

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(165, 195, 235);
  const subText = isBF
    ? "Condições Especiais de Novembro · As Menores Parcelas do Ano"
    : "Planejamento Estratégico de Conquista Patrimonial";
  doc.text(subText, W / 2, curY, { align: "center" });

  curY += 9;

  // ── 4. CLIENT & CONSULTOR RIBBON ──
  const ribbonX = cardX + 6;
  const ribbonW = cardW - 12;
  const ribbonH = 14;

  doc.setFillColor(11, 22, 50);
  doc.roundedRect(ribbonX, curY, ribbonW, ribbonH, 3, 3, "F");
  doc.setDrawColor(28, 55, 105);
  doc.setLineWidth(0.3);
  doc.roundedRect(ribbonX, curY, ribbonW, ribbonH, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(140, 175, 220);
  doc.text("CLIENTE:", ribbonX + 5, curY + 5.5);
  doc.setTextColor(255, 255, 255);
  doc.text(data.nomeCliente || "Cliente Especial", ribbonX + 22, curY + 5.5);

  if (data.whatsappCliente) {
    doc.setTextColor(140, 175, 220);
    doc.text("WHATSAPP:", ribbonX + 5, curY + 10.5);
    doc.setTextColor(200, 225, 255);
    doc.text(data.whatsappCliente, ribbonX + 26, curY + 10.5);
  }

  const todayStr = new Date().toLocaleDateString("pt-BR");
  doc.setTextColor(140, 175, 220);
  doc.text("DATA:", ribbonX + ribbonW - 55, curY + 5.5);
  doc.setTextColor(255, 255, 255);
  doc.text(todayStr, ribbonX + ribbonW - 43, curY + 5.5);

  doc.setTextColor(255, 120, 180);
  doc.text("VALIDADE:", ribbonX + ribbonW - 55, curY + 10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(isBF ? "30/11/2026" : "7 DIAS", ribbonX + ribbonW - 36, curY + 10.5);

  curY += ribbonH + 8;

  // ── 5. THE HERO CARD (CORAÇÃO PROMOCIONAL) ──
  const heroX = cardX + 6;
  const heroW = cardW - 12;
  const heroH = 76;

  // Hero Card Background (#0A1638)
  doc.setFillColor(10, 22, 56);
  doc.roundedRect(heroX, curY, heroW, heroH, 5, 5, "F");

  // Hero Card Double Border (Pink Magenta & Cyan)
  doc.setDrawColor(255, 0, 128);
  doc.setLineWidth(0.6);
  doc.roundedRect(heroX, curY, heroW, heroH, 5, 5, "S");

  // Segment & Group Header Tag
  doc.setFillColor(18, 38, 88);
  doc.roundedRect(heroX + 5, curY + 5, heroW - 10, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 229, 255);
  doc.text(
    `SEGMENTO: ${data.segmento.toUpperCase()}  |  GRUPO: ${data.grupo}  |  STATUS: ATIVO & OFICIAL MAGALU`,
    W / 2,
    curY + 10.5,
    { align: "center" }
  );

  // Valor da Carta de Crédito
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(170, 195, 230);
  doc.text("CARTA DE CRÉDITO CONTEMPLADA", W / 2, curY + 21, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text(fmtCurrency(data.credito), W / 2, curY + 31, { align: "center" });

  // Floating Glowing Parcela Box
  const boxPillX = heroX + 10;
  const boxPillW = heroW - 20;
  const boxPillY = curY + 36;
  const boxPillH = 34;

  doc.setFillColor(4, 11, 28);
  doc.roundedRect(boxPillX, boxPillY, boxPillW, boxPillH, 4, 4, "F");
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(0.8);
  doc.roundedRect(boxPillX, boxPillY, boxPillW, boxPillH, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 100, 180);
  doc.text(
    isBF ? "🔥 PARCELA PROMOCIONAL BLACK DAS BLACKS (MENOR DO ANO) 🔥" : "★ PARCELA PROMOCIONAL REDUZIDA ★",
    W / 2,
    boxPillY + 7.5,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(0, 229, 255);
  doc.text(fmtCurrency(data.parcelaValor) + " / mês", W / 2, boxPillY + 19, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(210, 230, 255);
  const planoDesc = `${data.tipoParcela.toUpperCase()} ATÉ A CONTEMPLAÇÃO · ZERO JUROS BANCÁRIOS`;
  doc.text(planoDesc, W / 2, boxPillY + 28, { align: "center" });

  curY += heroH + 7;

  // ── 6. GRID 2x2 DE CARDS DE BENEFÍCIOS ──
  const gridW = (cardW - 12 - 5) / 2;
  const gridH = 22;

  const drawMiniCard = (
    x: number,
    y: number,
    title: string,
    value: string,
    sub: string,
    valColor: [number, number, number] = [255, 255, 255]
  ) => {
    doc.setFillColor(9, 18, 44);
    doc.roundedRect(x, y, gridW, gridH, 3, 3, "F");
    doc.setDrawColor(24, 48, 92);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, gridW, gridH, 3, 3, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(130, 165, 210);
    doc.text(title.toUpperCase(), x + 5, y + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(valColor[0], valColor[1], valColor[2]);
    doc.text(value, x + 5, y + 12.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(160, 185, 220);
    doc.text(sub, x + 5, y + 18);
  };

  // Card 1: Prazo
  drawMiniCard(
    heroX,
    curY,
    "Prazo Contratual",
    `${data.prazo} Meses`,
    "Sem multas de quitação antecipada",
    [0, 229, 255]
  );

  // Card 2: Taxa Adm
  const txTotal = data.taxaAdm ?? 20;
  const txMensal = (txTotal / data.prazo).toFixed(2);
  drawMiniCard(
    heroX + gridW + 5,
    curY,
    "Taxa de Administração",
    `${txTotal}% Total`,
    `Apenas ~${txMensal}% ao mês (Zero juros compostos)`,
    [255, 215, 0]
  );

  curY += gridH + 4;

  // Card 3: Fundo Reserva
  drawMiniCard(
    heroX,
    curY,
    "Fundo de Reserva",
    `${data.fundoReserva ?? 1}%`,
    "Segurança e devolução de sobras do grupo",
    [255, 255, 255]
  );

  // Card 4: Próxima Assembleia
  drawMiniCard(
    heroX + gridW + 5,
    curY,
    "Próxima Assembleia",
    data.proximaAssembleia || "25/11/2026",
    isBF ? "Cotas de Black Friday com alta contemplação" : "Sorteio e lances oficiais",
    [255, 100, 180]
  );

  curY += gridH + 7;

  // ── 7. CARD DE ESTRATÉGIA DE LANCE OU ECONOMIA COMPROVADA ──
  const stratX = heroX;
  const stratW = heroW;
  const stratH = 28;

  doc.setFillColor(9, 18, 44);
  doc.roundedRect(stratX, curY, stratW, stratH, 3, 3, "F");
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(stratX, curY, stratW, stratH, 3, 3, "S");

  if (data.lanceTotalRS && data.lanceTotalRS > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 229, 255);
    doc.text("🏹 ESTRATÉGIA DE LANCE PROGRAMADA", stratX + 5, curY + 6.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Lance Recursos Próprios: ${data.lanceDinheiroPct || 0}%  |  Lance Embutido da Carta: ${data.lanceEmbutidoPct || 0}%`,
      stratX + 5,
      curY + 13
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 215, 0);
    doc.text(
      `Total do Lance Ofertado: ${fmtCurrency(data.lanceTotalRS)} (${data.lanceTotalPct?.toFixed(1)}%)`,
      stratX + 5,
      curY + 20
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 230, 150);
    doc.text(
      "✓ Probabilidade Estratégica Alta baseada no histórico oficial das últimas assembleias.",
      stratX + 5,
      curY + 25.5
    );
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 229, 255);
    doc.text("⚡ VANTAGENS DO CONSÓRCIO VS. FINANCIAMENTO BANCÁRIO", stratX + 5, curY + 6.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(220, 235, 255);
    doc.text(
      "• Sem cobrança de Juros Compostos (Tabela SAC ou Price que triplicam o saldo do imóvel).",
      stratX + 5,
      curY + 13
    );
    doc.text(
      "• Possibilidade de usar até 25% da própria carta como Lance Embutido (zero desembolso inicial).",
      stratX + 5,
      curY + 18.5
    );
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 120, 180);
    doc.text(
      "• Economia comprovada de até R$ 800.000 em juros quando comparado a um financiamento Caixa.",
      stratX + 5,
      curY + 24
    );
  }

  curY += stratH + 7;

  // ── 8. FOOTER VIP & SELOS OFICIAIS ──
  const footerX = heroX;
  const footerW = heroW;
  const footerH = 30;

  doc.setFillColor(6, 12, 28);
  doc.roundedRect(footerX, curY, footerW, footerH, 3, 3, "F");
  doc.setDrawColor(20, 42, 85);
  doc.setLineWidth(0.3);
  doc.roundedRect(footerX, curY, footerW, footerH, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 175, 220);
  doc.text("CONSULTORIA ESPECIALIZADA:", footerX + 5, curY + 7);
  doc.setTextColor(255, 255, 255);
  doc.text(data.consultorNome || "O Especialista Consórcio", footerX + 50, curY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 229, 255);
  doc.text("PORTAL OFICIAL:", footerX + footerW - 65, curY + 7);
  doc.setTextColor(255, 255, 255);
  doc.text("oespecialistaconsorcio.com.br", footerX + footerW - 40, curY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(120, 150, 190);
  doc.text(
    "Consórcio Magalu · Autorizado e Fiscalizado pelo Banco Central do Brasil sob a Lei 11.795/08.",
    W / 2,
    curY + 15,
    { align: "center" }
  );

  // VIP Bottom Alert Banner
  doc.setFillColor(15, 30, 68);
  doc.roundedRect(footerX + 8, curY + 18, footerW - 16, 8, 2, 2, "F");
  doc.setDrawColor(255, 0, 128);
  doc.setLineWidth(0.4);
  doc.roundedRect(footerX + 8, curY + 18, footerW - 16, 8, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 120, 180);
  const guaranteeText = isBF
    ? "CONDIÇÃO PROMOCIONAL EXCLUSIVA BLACK DAS BLACKS · VÁLIDA ATÉ 30 DE NOVEMBRO DE 2026"
    : "PROPOSTA EXCLUSIVA COM TAXAS PROMOCIONAIS LIMITADAS · CONSULTE DISPONIBILIDADE DE COTAS";
  doc.text(guaranteeText, W / 2, curY + 23.2, { align: "center" });

  return doc;
};
