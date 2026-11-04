import { jsPDF } from 'jspdf';
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

  const cleanNome = (data.nomeCliente || 'cliente').replace(/\s+/g, '_').toLowerCase();
  doc.save(`card_promocional_consorcio_${cleanNome}.pdf`);
  return doc;
}
