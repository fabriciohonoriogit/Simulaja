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
  // Dados do Consórcio & Proposta
  grupo?: string;
  cota?: string;
  aquisicaoImovelUrbano?: boolean;
  reformaConstrucao?: boolean;
  aquisicaoQuitacaoFinanciamento?: boolean;
  aquisicaoImovelRural?: boolean;
  energiaFotovoltaica?: boolean;
  quitacaoFinanciamentoProprio?: boolean;

  // Consorciado Titular
  nomeCliente: string;
  sexo?: 'M' | 'F' | '';
  cpf: string;
  rg: string;
  orgaoEmissor: string;
  dataNascimento: string;
  localNascimento?: string;
  nacionalidade?: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  estadoCivil: string;
  telFixo?: string;
  telCel?: string;
  telCom?: string;
  celular?: string;
  email: string;
  declaraIR?: 'Sim' | 'Não' | '';
  regimeTrabalho?: string; // Privada, Publica, Autonomo, Liberal, Outro, Aposentado
  aposentadoNumero?: string;
  profissao: string;
  tempoServico?: string;
  nomeEmpresa?: string;
  empresaEndereco?: string;
  empresaBairro?: string;
  empresaCidade?: string;
  empresaEstado?: string;
  empresaCep?: string;
  empresaTelCom?: string;
  rendaBruta?: number;
  rendaMensal: number;
  outraRenda?: string;

  // Cônjuge
  temConjuge: boolean;
  conjugeNome?: string;
  conjugeCpf?: string;
  conjugeRg?: string;
  conjugeOrgaoEmissor?: string;
  conjugeDataNasc?: string;
  conjugeLocalNascimento?: string;
  conjugeNacionalidade?: string;
  conjugeProfissao?: string;
  conjugeRenda?: number;
  conjugeEmail?: string;
  conjugeRegimeTrabalho?: string;
  conjugeAposentadoNumero?: string;

  // Pessoa Jurídica
  isPessoaJuridica: boolean;
  razaoSocial?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  ramoAtuacao?: string;
  dataFundacao?: string;
  formaConstituicao?: string;
  faturamentoMensal?: number;
  pjEndereco?: string;
  pjBairro?: string;
  pjCidade?: string;
  pjEstado?: string;
  pjCep?: string;
  pjTelFixo?: string;
  pjTelCel?: string;

  // Dados para Liberação de Crédito
  titularConta: string;
  cpfTitularConta?: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta?: string;
  chavePix?: string;

  // Valor da Sobra de Crédito
  sobraAbatimento?: boolean;
  sobraReembolso10?: boolean;

  // Valor de Compra e Venda
  valorCredito?: number;
  valorTotalImovel?: number;
  valorPagoConsorcio?: number;
  tipoImovel?: string;
  enderecoImovel?: string;

  // Declaração & Assinatura
  localAssinatura?: string;
  dataAssinatura?: string;
  dataPreenchimento?: string;
}

/**
 * Gera o PDF oficial do Formulário de Alteração do Bem - Consórcio Magalu
 */
export async function gerarPDFAlteracaoBem(data: AlteracaoBemData) {
  const { jsPDF } = await import('jspdf');
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
 * Gera a Ficha Cadastral Completa e Fidedigna ao Anexo - Consórcio Magalu (2 Páginas)
 */
export async function gerarPDFFichaCadastralImovel(data: FichaCadastralImovelData) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const marginX = 8;
  const boxW = W - (marginX * 2); // 194 mm

  // Cores idênticas ao anexo oficial
  const headerBlue: [number, number, number] = [0, 72, 205]; // #0048cd - Azul Magalu oficial
  const orangeAccent: [number, number, number] = [255, 107, 0]; // #FF6B00 - Laranja Magalu oficial
  const lineGray: [number, number, number] = [170, 170, 170];
  const bgBox: [number, number, number] = [250, 250, 250];
  const textBlack: [number, number, number] = [30, 30, 30];
  const valueBlue: [number, number, number] = [0, 35, 120];

  // Helper para desenhar o Cabeçalho Oficial Magalu
  const drawHeader = () => {
    // Banner Azul
    doc.setFillColor(...headerBlue);
    doc.rect(0, 0, W, 18, 'F');

    // Texto Esquerda
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Ficha Cadastral - imóvel consorciado', marginX + 2, 12);

    // Logo Magalu Direita
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('CONSÓRCIO', W - marginX - 42, 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('magalu', W - marginX - 42, 15);
  };

  // Helper para desenhar Faixa de Divisão Laranja
  const drawOrangeBar = (title: string, yPos: number) => {
    doc.setFillColor(...orangeAccent);
    doc.rect(marginX, yPos, boxW, 5, 'F');

    if (title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(title, marginX + 3, yPos + 3.8);
    }
  };

  // Helper para desenhar Caixa de Campo
  const drawBox = (x: number, y: number, w: number, h: number) => {
    doc.setFillColor(...bgBox);
    doc.setDrawColor(...lineGray);
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, h, 'FD');
  };

  // Helper para desenhar Label + Valor dentro de um espaço
  const drawFieldInline = (label: string, value: string | undefined, x: number, y: number, valueOffsetX = 0) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textBlack);
    doc.text(label, x, y);

    if (value) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...valueBlue);
      const strVal = String(value);
      const offX = valueOffsetX || (doc.getTextWidth(label) + 1.5);
      doc.text(strVal, x + offX, y);
    }
  };

  const drawCheckbox = (label: string, isChecked: boolean, x: number, y: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textBlack);
    const mark = isChecked ? '( X )' : '(   )';
    doc.text(`${mark} ${label}`, x, y);
  };

  // ==========================================
  // PÁGINA 1
  // ==========================================
  drawHeader();

  let curY = 19;

  // Quadro Topo: Grupo/Cota & Opções de Aquisição
  drawBox(marginX, curY, boxW, 15);

  // Coluna 1: Grupo e Cota
  drawFieldInline('Grupo:________', data.grupo, marginX + 3, curY + 5.5, 13);
  drawFieldInline('Cota:________', data.cota, marginX + 3, curY + 11.5, 11);

  // Coluna 2: Checkboxes de finalidade do imóvel (2 colunas)
  drawCheckbox('Aquisição de Imóvel Urbano', !!data.aquisicaoImovelUrbano, marginX + 45, curY + 4.5);
  drawCheckbox('Reforma e Construção', !!data.reformaConstrucao, marginX + 105, curY + 4.5);

  drawCheckbox('Aquisição de Imóvel Rural', !!data.aquisicaoImovelRural, marginX + 45, curY + 9);
  drawCheckbox('Aquisição de Energia Fotovoltaica', !!data.energiaFotovoltaica, marginX + 105, curY + 9);

  drawCheckbox('Aquisição e Quitação Financiamento', !!data.aquisicaoQuitacaoFinanciamento, marginX + 45, curY + 13.5);
  drawCheckbox('Quitação de Financiamento Próprio', !!data.quitacaoFinanciamentoProprio, marginX + 105, curY + 13.5);

  curY += 16.5;

  // Faixa Laranja 1
  drawOrangeBar('', curY);
  curY += 6;

  // Campos do Consorciado
  const hBox = 6.5;

  // Box: Nome / Sexo
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Nome:', data.nomeCliente, marginX + 3, curY + 4.5);
  const sexoVal = data.sexo?.toUpperCase() || '';
  drawCheckbox('M', sexoVal === 'M', marginX + 160, curY + 4.5);
  drawCheckbox('F', sexoVal === 'F', marginX + 175, curY + 4.5);
  curY += hBox + 1;

  // Box: CPF / RG / Orgao Exp
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('CPF:', data.cpf, marginX + 3, curY + 4.5);
  drawFieldInline('Nº RG:', data.rg, marginX + 85, curY + 4.5);
  drawFieldInline('Orgão Exp.:', data.orgaoEmissor, marginX + 145, curY + 4.5);
  curY += hBox + 1;

  // Box: Data Nasc / Local / Nacionalidade
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Data de Nascimento:', data.dataNascimento ? `${data.dataNascimento}` : ' / / ', marginX + 3, curY + 4.5);
  drawFieldInline('Local Nascimento:', data.localNascimento, marginX + 85, curY + 4.5);
  drawFieldInline('Nacionalidade:', data.nacionalidade || 'Brasileira', marginX + 145, curY + 4.5);
  curY += hBox + 1;

  // Box: Endereço Residencial
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Endereço Residencial:', data.endereco, marginX + 3, curY + 4.5);
  curY += hBox + 1;

  // Box: Bairro / Cidade / Estado / Cep
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Bairro:', data.bairro, marginX + 3, curY + 4.5);
  drawFieldInline('Cidade:', data.cidade, marginX + 60, curY + 4.5);
  drawFieldInline('Estado:', data.uf, marginX + 125, curY + 4.5);
  drawFieldInline('Cep:', data.cep, marginX + 158, curY + 4.5);
  curY += hBox + 1;

  // Box: Estado Civil
  drawBox(marginX, curY, boxW, hBox);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Estado Civil:', marginX + 3, curY + 4.5);
  const ec = (data.estadoCivil || '').toLowerCase();
  drawCheckbox('Solteiro', ec.includes('solteir'), marginX + 30, curY + 4.5);
  drawCheckbox('Casado', ec.includes('casad'), marginX + 60, curY + 4.5);
  drawCheckbox('União Estável', ec.includes('uniã') || ec.includes('estavel'), marginX + 90, curY + 4.5);
  curY += hBox + 1;

  // Box: Telefones
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Tel Fixo: (  )', data.telFixo, marginX + 3, curY + 4.5);
  drawFieldInline('Tel Cel: (  )', data.telCel || data.celular, marginX + 65, curY + 4.5);
  drawFieldInline('Tel Com: (  )', data.telCom, marginX + 130, curY + 4.5);
  curY += hBox + 1;

  // Box: Email
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Email:', data.email, marginX + 3, curY + 4.5);
  curY += hBox + 1;

  // Box: Declara IR
  drawBox(marginX, curY, boxW, hBox);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Declara IR:', marginX + 3, curY + 4.5);
  const irVal = (data.declaraIR || '').toLowerCase();
  drawCheckbox('Sim', irVal === 'sim', marginX + 30, curY + 4.5);
  drawCheckbox('Não', irVal === 'não' || irVal === 'nao', marginX + 50, curY + 4.5);
  curY += hBox + 1;

  // Box: Regime de Trabalho
  drawBox(marginX, curY, boxW, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Regime de Trabalho:', marginX + 3, curY + 4.5);

  const rt = (data.regimeTrabalho || '').toLowerCase();
  drawCheckbox('Funcionário(a) Empresa Privada', rt.includes('privad'), marginX + 3, curY + 8.5);
  drawCheckbox('Autônomo', rt.includes('autonom'), marginX + 75, curY + 8.5);
  drawCheckbox('Outro', rt.includes('outro'), marginX + 130, curY + 8.5);

  drawCheckbox('Funcionário(a) Empresa Pública', rt.includes('public'), marginX + 3, curY + 11.5);
  drawCheckbox('Profissional Liberal', rt.includes('liberal'), marginX + 75, curY + 11.5);
  drawCheckbox('Aposentado nº do beneficio:', rt.includes('aposentad'), marginX + 130, curY + 11.5);
  if (data.aposentadoNumero) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...valueBlue);
    doc.text(data.aposentadoNumero, marginX + 175, curY + 11.5);
  }
  curY += 13;

  // Box: Profissão
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Profissão:', data.profissao, marginX + 3, curY + 4.5);
  curY += hBox + 1;

  // Box: Tempo de Serviço & Nome Empresa
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Tempo de Serviço:', data.tempoServico, marginX + 3, curY + 4.5);
  drawFieldInline('Nome Empresa:', data.nomeEmpresa, marginX + 90, curY + 4.5);
  curY += hBox + 1;

  // Box: Endereço Empresa
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Endereço:', data.empresaEndereco, marginX + 3, curY + 4.5);
  curY += hBox + 1;

  // Box: Bairro / Cidade / Estado / Cep Empresa
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Bairro:', data.empresaBairro, marginX + 3, curY + 4.5);
  drawFieldInline('Cidade:', data.empresaCidade, marginX + 60, curY + 4.5);
  drawFieldInline('Estado:', data.empresaEstado, marginX + 125, curY + 4.5);
  drawFieldInline('Cep:', data.empresaCep, marginX + 158, curY + 4.5);
  curY += hBox + 1;

  // Box: Tel Com Empresa
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Tel Com.:', data.empresaTelCom, marginX + 3, curY + 4.5);
  curY += hBox + 1;

  // Box: Renda Bruta / Renda Líquida
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Renda Bruta: R$', data.rendaBruta ? formatCurrency(data.rendaBruta).replace('R$', '').trim() : '', marginX + 3, curY + 4.5);
  drawFieldInline('Renda Líquida: R$', data.rendaMensal ? formatCurrency(data.rendaMensal).replace('R$', '').trim() : '', marginX + 105, curY + 4.5);
  curY += hBox + 1;

  // Box: Outra Renda
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Outra Renda (especifique):', data.outraRenda, marginX + 3, curY + 4.5);
  curY += hBox + 1.5;

  // Faixa Laranja 2: Dados do Cônjuge (se houver)
  drawOrangeBar('Dados do Cônjuge (se houver)', curY);
  curY += 6;

  // Box Cônjuge: Nome
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Nome:', data.conjugeNome, marginX + 3, curY + 4.5);
  curY += hBox + 1;

  // Box Cônjuge: CPF / RG / Orgao
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('CPF:', data.conjugeCpf, marginX + 3, curY + 4.5);
  drawFieldInline('Nº RG:', data.conjugeRg, marginX + 85, curY + 4.5);
  drawFieldInline('Orgão Exp.:', data.conjugeOrgaoEmissor, marginX + 145, curY + 4.5);
  curY += hBox + 1;

  // Box Cônjuge: Data Nasc / Local / Nacionalidade
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Data de Nascimento:', data.conjugeDataNasc ? `${data.conjugeDataNasc}` : ' / / ', marginX + 3, curY + 4.5);
  drawFieldInline('Local Nascimento:', data.conjugeLocalNascimento, marginX + 85, curY + 4.5);
  drawFieldInline('Nacionalidade:', data.conjugeNacionalidade || (data.temConjuge ? 'Brasileira' : ''), marginX + 145, curY + 4.5);

  // ==========================================
  // PÁGINA 2
  // ==========================================
  doc.addPage();
  curY = 10;

  // Box Cônjuge cont.: Profissão / Renda Líquida
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Profissão:', data.conjugeProfissao, marginX + 3, curY + 4.5);
  drawFieldInline('Renda Liquida: R$', data.conjugeRenda ? formatCurrency(data.conjugeRenda).replace('R$', '').trim() : '', marginX + 105, curY + 4.5);
  curY += hBox + 1;

  // Box Cônjuge cont.: Email
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Email:', data.conjugeEmail, marginX + 3, curY + 4.5);
  curY += hBox + 1;

  // Box Cônjuge cont.: Regime de Trabalho
  drawBox(marginX, curY, boxW, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Regime de Trabalho:', marginX + 3, curY + 4.5);

  const crt = (data.conjugeRegimeTrabalho || '').toLowerCase();
  drawCheckbox('Funcionário(a) Empresa Privada', crt.includes('privad'), marginX + 3, curY + 8.5);
  drawCheckbox('Autônomo', crt.includes('autonom'), marginX + 75, curY + 8.5);
  drawCheckbox('Outro', crt.includes('outro'), marginX + 130, curY + 8.5);

  drawCheckbox('Funcionário(a) Empresa Pública', crt.includes('public'), marginX + 3, curY + 11.5);
  drawCheckbox('Profissional Liberal', crt.includes('liberal'), marginX + 75, curY + 11.5);
  drawCheckbox('Aposentado nº do beneficio:', crt.includes('aposentad'), marginX + 130, curY + 11.5);
  if (data.conjugeAposentadoNumero) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...valueBlue);
    doc.text(data.conjugeAposentadoNumero, marginX + 175, curY + 11.5);
  }
  curY += 13.5;

  // Faixa Laranja 3: Pessoa Jurídica
  drawOrangeBar('Pessoa Jurídica', curY);
  curY += 6;

  // Box PJ: Razão Social / CNPJ
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Razão Social:', data.razaoSocial, marginX + 3, curY + 4.5);
  drawFieldInline('CNPJ:', data.cnpj, marginX + 130, curY + 4.5);
  curY += hBox + 1;

  // Box PJ: Inscrição / Ramo
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Inscrição Estadual e/ou municipal:', data.inscricaoEstadual, marginX + 3, curY + 4.5);
  drawFieldInline('Ramo de atuação:', data.ramoAtuacao, marginX + 115, curY + 4.5);
  curY += hBox + 1;

  // Box PJ: Fundação / Forma Constituição
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Data de Fundação/Abertura:', data.dataFundacao, marginX + 3, curY + 4.5);
  drawFieldInline('Forma de Constituição:', data.formaConstituicao, marginX + 115, curY + 4.5);
  curY += hBox + 1;

  // Box PJ: Faturamento
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Faturamento Mensal:', data.faturamentoMensal ? formatCurrency(data.faturamentoMensal) : '', marginX + 3, curY + 4.5);
  curY += hBox + 1;

  // Box PJ: Endereço
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Endereço:', data.pjEndereco, marginX + 3, curY + 4.5);
  curY += hBox + 1;

  // Box PJ: Bairro / Cidade / Estado / Cep
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Bairro:', data.pjBairro, marginX + 3, curY + 4.5);
  drawFieldInline('Cidade:', data.pjCidade, marginX + 60, curY + 4.5);
  drawFieldInline('Estado:', data.pjEstado, marginX + 125, curY + 4.5);
  drawFieldInline('Cep:', data.pjCep, marginX + 158, curY + 4.5);
  curY += hBox + 1;

  // Box PJ: Telefones
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Tel Fixo: (  )', data.pjTelFixo, marginX + 3, curY + 4.5);
  drawFieldInline('Tel Cel: (  )', data.pjTelCel, marginX + 75, curY + 4.5);
  curY += hBox + 1.5;

  // Faixa Laranja 4: Dados para Liberação de Crédito
  drawOrangeBar('Dados para Liberação de Crédito', curY);
  curY += 6;

  // Box Liberação 1: Titular
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('Titular da conta:', data.titularConta || data.nomeCliente, marginX + 3, curY + 4.5);
  curY += hBox + 1;

  // Box Liberação 2: CPF Titular
  drawBox(marginX, curY, boxW, hBox);
  drawFieldInline('CPF:', data.cpfTitularConta || data.cpf, marginX + 3, curY + 4.5);
  curY += hBox + 1;

  // Box Liberação 3: Banco / Agência / Nº Conta + Nota
  drawBox(marginX, curY, boxW, 19);
  drawFieldInline('Banco:', data.banco, marginX + 3, curY + 4.5);
  drawFieldInline('Agência:', data.agencia, marginX + 65, curY + 4.5);
  drawFieldInline('NºConta:', data.conta, marginX + 125, curY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  const notaBancaria = 'Importante : O valor do credito disponível será depositado na conta acima, no prazo de 48 horas úteis, após o recebimento de 01 via do Contrato de Alienação assinada e reconhecido firma das partes envolvidas e 01 via da Matricula do Imóvel, constando o registro de alienação. Os dados bancários a serem preenchidos são somente de quem for receber o crédito ( consorciado ou vendedor ). Não será aceito pagamento para terceiros.';
  const notaLines = doc.splitTextToSize(notaBancaria, boxW - 6);
  doc.text(notaLines, marginX + 3, curY + 9.5);
  curY += 20.5;

  // Quadro: Valor da Sobra de Crédito
  drawBox(marginX, curY, boxW, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textBlack);
  doc.text('Valor da Sobra de Crédito', marginX + 3, curY + 5);

  drawCheckbox('Autorizo que seja feito o abatimento automático da sobra de crédito no saldo devedor, caso o imóvel avaliado seja', !!data.sobraAbatimento, marginX + 3, curY + 9.5);
  doc.setFontSize(7.5);
  doc.setTextColor(...textBlack);
  doc.text('inferior ao crédito a pagar ou inferior ao valor de compra e venda.', marginX + 11, curY + 12.5);

  drawCheckbox('Reservo até 10% do valor do crédito para reembolso de documentação.', !!data.sobraReembolso10, marginX + 3, curY + 16.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 30, 30);
  doc.text('Dou ciência que a administradora tem total autonomia para abater todo o valor da sobra no saldo devedor caso as informações citadas acima', marginX + 3, curY + 20.5);
  doc.text('sejam deixadas em branco.', marginX + 68, curY + 23);
  curY += 25;

  // Quadro: Valor de Compra e Venda do Imóvel
  drawBox(marginX, curY, boxW, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textBlack);
  doc.text('Valor de Compra e Venda do Imóvel', marginX + 3, curY + 5);

  const valTotStr = data.valorTotalImovel ? formatCurrency(data.valorTotalImovel) : '___________________________';
  const valPagoStr = data.valorPagoConsorcio || data.valorCredito ? formatCurrency(data.valorPagoConsorcio || data.valorCredito || 0) : '___________________';

  drawFieldInline('Valor Total negociado pelo imóvel:', valTotStr, marginX + 3, curY + 10, 52);
  drawFieldInline('Valor a ser pago com recursos do consórcio :', valPagoStr, marginX + 3, curY + 15, 68);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(60, 60, 60);
  const notaCV = 'Dou ciência de que recebi a relação de documentos necessárias para análise cadastral e do imóvel, sendo que a documentação a ser encaminhada é de minha responsabilidade e do consorciado. Ciente inclusive de que os documentos devem ser enviados de forma completa, possibilitando a análise da Administradora, a qual possui um prazo de até 10 (dez) dias úteis do recebimento dos documentos, para apreciá-los, informando em seguida sobre a aprovação, reprovação ou possíveis pendências. Sendo aprovado, a própria Administradora emitirá o instrumento particular de compra e venda, com força de escritura pública, o qual deverá ser levado a registro e em seguida, após concluídos os procedimentos de alienação e transferência do mesmo, será realizado o pagamento do crédito.';
  const notaCVLines = doc.splitTextToSize(notaCV, boxW - 6);
  doc.text(notaCVLines, marginX + 3, curY + 20);
  curY += 37;

  // Quadro: Declaração de Veracidade & Assinaturas
  drawBox(marginX, curY, boxW, 33);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...textBlack);
  doc.text('Declaro que as informações acima são a pura expressão de verdade responsabilizando-me por estas.', marginX + 3, curY + 5);

  const locStr = data.localAssinatura || '_________________________';
  const dataStr = data.dataAssinatura || new Date().toLocaleDateString('pt-BR');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Local: ${locStr}`, marginX + 3, curY + 12);
  doc.text(`Data: ${dataStr}`, marginX + 90, curY + 12);

  doc.text('Assinatura Consorciado/Sócio: _____________________________', marginX + 3, curY + 20);
  doc.text('Assinatura Cônjuge/Cônjuge Sócio: _____________________________', marginX + 3, curY + 28);
  curY += 35;

  // Rodapé Oficial LGPD Magalu
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  const lgpdText = 'O Consórcio Magalu preza pela segurança dos seus dados, pelo respeito à sua privacidade e pela transparência com você. Todos os seus dados pessoais são coletados de acordo com a legislação vigente, especialmente a Lei Geral de Proteção de Dados Pessoais. Os detalhes das práticas adotadas pelo Consórcio Magalu estão dispostos em nossa Política de Privacidade, que poderá ser consultada em nosso website https://consorciomagalu.com.br';
  const lgpdLines = doc.splitTextToSize(lgpdText, boxW);
  doc.text(lgpdLines, marginX, 287);

  doc.save(`Ficha_Cadastral_Imovel_Magalu_${(data.nomeCliente || 'Cliente').replace(/\s+/g, '_')}.pdf`);
}

