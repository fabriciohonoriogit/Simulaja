import { jsPDF } from 'jspdf';
import { formatCurrency } from './utils';

export interface AlteracaoBemData {
  proposta: string;
  grupo: string;
  cota: string;
  nomeCliente: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  cidadeUf: string;
  bemAtual: string;
  novoBem: string;
  valorCredito: number;
  justificativa: string;
  dataSolicitacao?: string;
  consultorNome?: string;
}

export interface FichaCadastralImovelData {
  // Consorciado
  nomeCliente: string;
  cpf: string;
  rg: string;
  orgaoEmissor: string;
  dataNascimento: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  rendaMensal: number;
  celular: string;
  email: string;
  endereco: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;

  // Cônjuge
  temConjuge: boolean;
  conjugeNome?: string;
  conjugeCpf?: string;
  conjugeRg?: string;
  conjugeDataNasc?: string;
  conjugeProfissao?: string;
  conjugeRenda?: number;

  // PJ (opcional)
  isPessoaJuridica: boolean;
  razaoSocial?: string;
  cnpj?: string;

  // Imóvel & Crédito
  valorCredito: number;
  tipoImovel: string;
  enderecoImovel?: string;

  // Dados Bancários
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  chavePix: string;
  titularConta: string;
  dataPreenchimento?: string;
}

/**
 * Gera o PDF oficial do Formulário de Alteração do Bem - Consórcio Magalu
 */
export function gerarPDFAlteracaoBem(data: AlteracaoBemData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const m = 15;
  let y = 0;

  // Cores institucionais Magalu / Elite
  const magaluBlue: [number, number, number] = [0, 134, 255];
  const darkSlate: [number, number, number] = [15, 23, 42];
  const borderGray: [number, number, number] = [226, 232, 240];
  const bgLight: [number, number, number] = [248, 250, 252];
  const textDark: [number, number, number] = [30, 41, 59];
  const textMuted: [number, number, number] = [100, 116, 139];

  // Top Bar Accent
  doc.setFillColor(...magaluBlue);
  doc.rect(0, 0, W, 4, 'F');

  // Cabeçalho Principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...magaluBlue);
  doc.text('CONSÓRCIO MAGALU', m, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('CENTRAL DE FORMULÁRIOS OFICIAIS', W - m, 15, { align: 'right' });

  const dataAtual = data.dataSolicitacao || new Date().toLocaleDateString('pt-BR');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Data da Solicitação: ${dataAtual}`, W - m, 20, { align: 'right' });

  // Título do Documento
  y = 28;
  doc.setFillColor(...bgLight);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(m, y, W - (m * 2), 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkSlate);
  doc.text('SOLICITAÇÃO DE ALTERAÇÃO DO BEM / CRÉDITO', W / 2, y + 7.5, { align: 'center' });

  y += 18;

  const renderSectionHeader = (title: string) => {
    doc.setFillColor(...magaluBlue);
    doc.rect(m, y, 3, 7, 'F');
    doc.setFillColor(241, 245, 249);
    doc.rect(m + 3, y, W - (m * 2) - 3, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkSlate);
    doc.text(title.toUpperCase(), m + 6, y + 4.8);
    y += 10;
  };

  const renderField = (label: string, value: string, x: number, width: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text(label.toUpperCase(), x, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.text(value || '—', x, y + 4.5);
  };

  // Seção 1: Identificação do Consorciado & Contrato
  renderSectionHeader('1. Dados do Consorciado e da Proposta');

  renderField('Proposta Nº', data.proposta, m, 40);
  renderField('Grupo', data.grupo, m + 45, 30);
  renderField('Cota', data.cota, m + 80, 30);
  renderField('CPF / CNPJ', data.cpfCnpj, m + 115, 60);

  y += 12;

  renderField('Nome do Consorciado', data.nomeCliente, m, 90);
  renderField('Telefone / WhatsApp', data.telefone, m + 95, 40);
  renderField('Cidade / UF', data.cidadeUf, m + 140, 40);

  y += 14;

  // Seção 2: Detalhes da Alteração Solicitada
  renderSectionHeader('2. Detalhes da Alteração do Bem Solicitada');

  // Quadro de Comparação (Bem Atual vs Novo Bem)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(m, y, (W - (m * 2)) / 2 - 2, 22, 2, 2, 'D');
  doc.roundedRect(W / 2 + 1, y, (W - (m * 2)) / 2 - 2, 22, 2, 2, 'D');

  // Cabeçalho Quadro 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(225, 29, 72); // Rose
  doc.text('BEM ATUAL INDICADO NA PROPOSTA', m + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  const bemAtualLines = doc.splitTextToSize(data.bemAtual || '—', (W - (m * 2)) / 2 - 10);
  doc.text(bemAtualLines, m + 4, y + 11);

  // Cabeçalho Quadro 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text('NOVO BEM / CRÉDITO SOLICITADO', W / 2 + 5, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  const novoBemLines = doc.splitTextToSize(data.novoBem || '—', (W - (m * 2)) / 2 - 10);
  doc.text(novoBemLines, W / 2 + 5, y + 11);

  y += 28;

  renderField('Novo Valor do Crédito Solicitado', formatCurrency(data.valorCredito || 0), m, 80);
  renderField('E-mail do Consorciado', data.email, m + 85, 90);

  y += 14;

  // Seção 3: Justificativa
  renderSectionHeader('3. Justificativa e Motivo da Troca');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  const justLines = doc.splitTextToSize(data.justificativa || 'Solicitação de alteração do bem cadastrado para adequação do plano de consórcio.', W - (m * 2) - 4);
  doc.text(justLines, m + 2, y + 1);

  y += Math.max(14, justLines.length * 5 + 4);

  // Seção 4: Termo de Responsabilidade & Assinaturas
  renderSectionHeader('4. Termo de Autorização e Assinatura');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  const termo = 'Declaro estar ciente de que a alteração do bem/crédito está sujeita à aprovação da Administradora Consórcio Magalu, observando as regras do regulamento do grupo, recálculo de parcelas e diferenças de saldo devedor decorrentes da mudança.';
  const termoLines = doc.splitTextToSize(termo, W - (m * 2));
  doc.text(termoLines, m, y);

  y += 20;

  // Campos de Assinatura
  const sigW = (W - (m * 2)) / 2 - 10;
  doc.setDrawColor(...textMuted);
  doc.line(m, y, m + sigW, y);
  doc.line(W - m - sigW, y, W - m, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text(data.nomeCliente || 'Assinatura do Consorciado', m + (sigW / 2), y, { align: 'center' });
  doc.text('Consórcio Magalu / Atendimento', W - m - (sigW / 2), y, { align: 'center' });

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text(`CPF/CNPJ: ${data.cpfCnpj || '—'}`, m + (sigW / 2), y, { align: 'center' });
  doc.text(data.consultorNome ? `Consultor: ${data.consultorNome}` : 'Representante Autorizado', W - m - (sigW / 2), y, { align: 'center' });

  // Rodapé
  doc.setFontSize(7);
  doc.setTextColor(160, 174, 192);
  doc.text('Documento gerado eletronicamente via SimulaJá CRM Consórcio Magalu', W / 2, 287, { align: 'center' });

  doc.save(`Alteracao_Bem_Magalu_${(data.nomeCliente || 'Cliente').replace(/\s+/g, '_')}.pdf`);
}

/**
 * Gera a Ficha Cadastral Completa de Imóvel Consorciado - Consórcio Magalu
 */
export function gerarPDFFichaCadastralImovel(data: FichaCadastralImovelData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const m = 14;
  let y = 0;

  const magaluBlue: [number, number, number] = [0, 134, 255];
  const darkSlate: [number, number, number] = [15, 23, 42];
  const borderGray: [number, number, number] = [226, 232, 240];
  const bgLight: [number, number, number] = [248, 250, 252];
  const textDark: [number, number, number] = [30, 41, 59];
  const textMuted: [number, number, number] = [100, 116, 139];

  // Top Bar
  doc.setFillColor(...magaluBlue);
  doc.rect(0, 0, W, 4, 'F');

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...magaluBlue);
  doc.text('CONSÓRCIO MAGALU', m, 16);

  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('FICHA CADASTRAL DE IMÓVEL CONSORCIADO', W - m, 14, { align: 'right' });

  const dataPreenc = data.dataPreenchimento || new Date().toLocaleDateString('pt-BR');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Emissão: ${dataPreenc}`, W - m, 19, { align: 'right' });

  y = 24;

  const renderSectionHeader = (title: string) => {
    doc.setFillColor(...magaluBlue);
    doc.rect(m, y, 2.5, 6, 'F');
    doc.setFillColor(241, 245, 249);
    doc.rect(m + 2.5, y, W - (m * 2) - 2.5, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkSlate);
    doc.text(title.toUpperCase(), m + 5, y + 4.2);
    y += 8.5;
  };

  const renderField = (label: string, value: string, x: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(label.toUpperCase(), x, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text(value || '—', x, y + 4);
  };

  // 1. Dados Pessoais
  renderSectionHeader('1. Dados do Consorciado');

  renderField('Nome Completo', data.nomeCliente, m);
  renderField('CPF', data.cpf, m + 90);
  renderField('RG / Órgão', `${data.rg || '—'} ${data.orgaoEmissor || ''}`, m + 140);

  y += 10;

  renderField('Data Nasc.', data.dataNascimento, m);
  renderField('Nacionalidade', data.nacionalidade || 'Brasileira', m + 45);
  renderField('Estado Civil', data.estadoCivil, m + 90);
  renderField('Profissão', data.profissao, m + 140);

  y += 10;

  renderField('Renda Mensal', formatCurrency(data.rendaMensal || 0), m);
  renderField('Celular / WhatsApp', data.celular, m + 45);
  renderField('E-mail', data.email, m + 90);

  y += 10;

  renderField('Endereço Residencial', `${data.endereco || '—'}`, m);
  renderField('Bairro', data.bairro, m + 110);
  renderField('CEP', data.cep, m + 155);

  y += 10;

  renderField('Cidade / UF', `${data.cidade || '—'} - ${data.uf || ''}`, m);

  y += 12;

  // 2. Dados do Cônjuge (se aplicável)
  if (data.temConjuge) {
    renderSectionHeader('2. Dados do Cônjuge / Companheiro(a)');
    renderField('Nome Cônjuge', data.conjugeNome || '—', m);
    renderField('CPF Cônjuge', data.conjugeCpf || '—', m + 90);
    renderField('RG Cônjuge', data.conjugeRg || '—', m + 140);

    y += 10;

    renderField('Data Nasc. Cônjuge', data.conjugeDataNasc || '—', m);
    renderField('Profissão Cônjuge', data.conjugeProfissao || '—', m + 45);
    renderField('Renda Cônjuge', formatCurrency(data.conjugeRenda || 0), m + 90);

    y += 12;
  }

  // 3. Pessoa Jurídica (se aplicável)
  if (data.isPessoaJuridica) {
    renderSectionHeader('3. Dados da Pessoa Jurídica (PJ)');
    renderField('Razão Social', data.razaoSocial || '—', m);
    renderField('CNPJ', data.cnpj || '—', m + 110);

    y += 12;
  }

  // 4. Imóvel & Crédito
  renderSectionHeader('4. Dados do Crédito e Imóvel Pretendido');
  renderField('Valor do Crédito', formatCurrency(data.valorCredito || 0), m);
  renderField('Tipo de Imóvel', data.tipoImovel || 'Residencial', m + 60);
  renderField('Endereço / Localidade do Imóvel', data.enderecoImovel || 'A definir', m + 110);

  y += 12;

  // 5. Dados Bancários
  renderSectionHeader('5. Dados Bancários para Liberação do Crédito');
  renderField('Banco', data.banco, m);
  renderField('Agência', data.agencia, m + 50);
  renderField('Conta', data.conta, m + 90);
  renderField('Tipo de Conta', data.tipoConta || 'Corrente', m + 130);

  y += 10;

  renderField('Chave PIX', data.chavePix, m);
  renderField('Titular da Conta', data.titularConta || data.nomeCliente, m + 90);

  y += 14;

  // Declaração & Assinatura
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  const dec = 'Declaro que todas as informações prestadas nesta ficha cadastral são exatas e verdadeiras, responsabilizando-me civil e criminalmente por elas. Autorizo o Consórcio Magalu a consultar os órgãos de proteção ao crédito (SPC/SERASA/SCR).';
  const decLines = doc.splitTextToSize(dec, W - (m * 2));
  doc.text(decLines, m, y);

  y += 16;

  const sigW = (W - (m * 2)) / 2 - 10;
  doc.setDrawColor(...textMuted);
  doc.line(m, y, m + sigW, y);
  doc.line(W - m - sigW, y, W - m, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text(data.nomeCliente || 'Assinatura do Consorciado', m + (sigW / 2), y, { align: 'center' });
  doc.text(data.conjugeNome ? 'Assinatura do Cônjuge' : 'Consórcio Magalu / Análise', W - m - (sigW / 2), y, { align: 'center' });

  // Rodapé
  doc.setFontSize(7);
  doc.setTextColor(160, 174, 192);
  doc.text('Ficha Cadastral Oficial — Gerada pelo SimulaJá CRM Consórcio Magalu', W / 2, 287, { align: 'center' });

  doc.save(`Ficha_Cadastral_Imovel_Magalu_${(data.nomeCliente || 'Cliente').replace(/\s+/g, '_')}.pdf`);
}
