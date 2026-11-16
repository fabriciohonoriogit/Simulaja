import { jsPDF } from 'jspdf';
import { GRUPO_CARACTERISTICAS, GRUPOS, MEDIA_LANCES_GRUPOS, GrupoItem, GrupoCaracteristicas } from '@/constants/simulador';

export interface GrupoReportData {
  grupoId: string;
  info: GrupoCaracteristicas;
  items: GrupoItem[];
  mediaLance: number | null;
}

export function generateGruposReportPDF(grupoIds: string[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  grupoIds.forEach((gId, index) => {
    if (index > 0) doc.addPage();

    const info = GRUPO_CARACTERISTICAS[gId];
    const mediaLance = MEDIA_LANCES_GRUPOS[gId] ?? null;

    // Busca itens do grupo em todas as categorias
    const allItems: GrupoItem[] = [
      ...(GRUPOS.imovel || []),
      ...(GRUPOS.veiculo || []),
      ...(GRUPOS.pesados || []),
      ...(GRUPOS.servicos || [])
    ].filter(item => item.grupo === gId);

    // Header Background
    doc.setFillColor(2, 16, 36); // #021024
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Accent line
    doc.setFillColor(0, 134, 255); // #0086FF
    doc.rect(0, 42, pageWidth, 2.5, 'F');

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`RELATÓRIO OFICIAL DE GRUPO — ${gId}`, margin, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(56, 189, 248); // #38bdf8
    doc.text('CONSÓRCIO MAGALU | AUDITORIA E DADOS TÉCNICOS AUTORITÁRIOS', margin, 26);

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Próxima Assembleia: ${info?.proximaAssembleia || '25/11/2026'} | Reajuste: ${info?.reajuste || 'INCC'}`, margin, 34);

    let y = 54;

    // Card 1: Resumo Técnico do Grupo
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 38, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 38, 3, 3, 'D');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`DADOS GERAIS — GRUPO ${gId}`, margin + 5, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    const minCred = allItems.length > 0 ? Math.min(...allItems.map(i => i.credito)) : 0;
    const maxCred = allItems.length > 0 ? Math.max(...allItems.map(i => i.credito)) : 0;
    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    doc.text(`• Faixa de Crédito: ${fmt(minCred)} a ${fmt(maxCred)}`, margin + 5, y + 16);
    doc.text(`• Prazo Restante: ${info?.prazoRestante || allItems[0]?.prazo || 'N/A'} meses (Original: ${info?.prazoOriginal || 'N/A'} meses)`, margin + 5, y + 22);
    doc.text(`• Taxa ADM: ${info?.taxaAdm || allItems[0]?.tx5050 || 18}% | Fundo de Reserva: ${info?.fundoReserva || 1}% | Seguro: 0,0295%`, margin + 5, y + 28);
    doc.text(`• Média Histórica de Lance Livre: ${mediaLance ? `${mediaLance}%` : 'Sob Consulta'} | Lance Fixo: 25% e 45%`, margin + 5, y + 34);

    y += 45;

    // Card 2: Regras e Características
    if (info?.caracteristicas) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('CARACTERÍSTICAS & REGRAS OFICIAIS:', margin + 5, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      const splitDesc = doc.splitTextToSize(info.caracteristicas, contentWidth - 10);
      doc.text(splitDesc.slice(0, 2), margin + 5, y + 14);

      const ordem = `Ordem de Contemplação: ${info.ordemContemplacao || 'Sorteio, Lance Livre e Fixos.'}`;
      const splitOrdem = doc.splitTextToSize(ordem, contentWidth - 10);
      doc.text(splitOrdem.slice(0, 2), margin + 5, y + 24);

      y += 39;
    }

    // Card 3: Tabela de Créditos e Parcelas 50/50 x Linear
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('VALORES DISPONÍVEIS E PARCELAS (50/50 E LINEAR)', margin, y + 5);
    y += 8;

    // Header da Tabela
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CRÉDITO', margin + 3, y + 5);
    doc.text('PRAZO', margin + 45, y + 5);
    doc.text('MEIA PARCELA (50/50)', margin + 70, y + 5);
    doc.text('PARCELA LINEAR', margin + 120, y + 5);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Linhas da tabela
    const uniqueCredits = Array.from(new Set(allItems.map(i => i.credito))).sort((a, b) => a - b);
    uniqueCredits.forEach((cred, i) => {
      if (y > pageHeight - 35) {
        doc.addPage();
        y = 20;
      }
      const item = allItems.find(it => it.credito === cred);
      if (!item) return;

      const bg = i % 2 === 0 ? 255 : 248;
      doc.setFillColor(bg, bg, bg);
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);

      doc.setTextColor(15, 23, 42);
      doc.text(fmt(item.credito), margin + 3, y + 4.5);
      doc.text(`${item.prazo} meses`, margin + 45, y + 4.5);

      const r50Text = item.r50 ? `${fmt(item.r50)} ${item.r50SemSeguro ? `(${fmt(item.r50SemSeguro)} s/seg)` : ''}` : 'N/A';
      doc.setTextColor(0, 134, 255);
      doc.text(r50Text, margin + 70, y + 4.5);

      const r100Text = item.r100 ? `${fmt(item.r100)} ${item.r100SemSeguro ? `(${fmt(item.r100SemSeguro)} s/seg)` : ''}` : 'N/A';
      doc.setTextColor(51, 65, 85);
      doc.text(r100Text, margin + 120, y + 4.5);

      y += 6;
    });

    // Rodapé Oficial Obrigatório
    y = Math.max(y + 10, pageHeight - 28);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, margin + contentWidth, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Relatório elaborado por', margin, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Fabricio Honório', margin, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 134, 255);
    doc.text('www.oespecialistaconsorcio.com.br', margin, y + 15);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7.5);
    doc.text('Representante Autorizado Consórcio Magalu | Dados obtidos diretamente do Portal Oficial', margin, y + 20);
  });

  return doc;
}
