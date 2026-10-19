/**
 * ==============================================================================
 * SIMULAJÁ / PROSPERA PLAN - MOTOR DE PROSPECÇÃO & CONTATO AUTOMÁTICO VIA EMAIL
 * ==============================================================================
 * Cadência inteligente de 3 passos para prospecção consultiva de alto padrão
 * com proteção de entregabilidade, rotação de templates, spintax e delay humano.
 *
 * Uso:
 *   node scripts/prospeccao_diaria_email.mjs                  (Execução diária normal)
 *   node scripts/prospeccao_diaria_email.mjs --dry-run        (Simulação sem envio real)
 *   node scripts/prospeccao_diaria_email.mjs --test-to=seu@email.com (Dispara teste)
 *   node scripts/prospeccao_diaria_email.mjs --limit=10       (Limite customizado)
 *   node scripts/prospeccao_diaria_email.mjs --step=1         (Disparar apenas Passo 1)
 * ==============================================================================
 */

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Carregar variáveis do .env manualmente para independência total
function loadEnv() {
  const envPath = path.join(ROOT_DIR, '.env');
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  }
  return env;
}

const env = loadEnv();

// Configurações Principais
const CONFIG = {
  gmailUser: env.GMAIL_USER || 'gn_prosperaplan@consorciomagalu.com.br',
  gmailPass: env.GMAIL_APP_PASSWORD || 'mglv pdbv saky bliq',
  senderName: env.EMAIL_SENDER_NAME || 'Fabrício Honorio | Prospera Plan',
  replyTo: env.EMAIL_REPLY_TO || 'gn_prosperaplan@consorciomagalu.com.br',
  dailyLimit: parseInt(env.PROSPECCAO_DAILY_LIMIT || '25', 10),
  minDelaySec: parseInt(env.PROSPECCAO_MIN_DELAY || '12', 10),
  maxDelaySec: parseInt(env.PROSPECCAO_MAX_DELAY || '25', 10),
  supabaseUrl: env.VITE_SUPABASE_URL || 'https://pfedvdqpnpbrlhfbzjcj.supabase.co',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
};

// Pastas de dados e logs
const LOGS_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

const HISTORICO_FILE = path.join(LOGS_DIR, 'historico_disparos.json');
const LEADS_FILE = path.join(__dirname, 'leads_prospeccao.json');

// Helper para logs com timestamp
function log(msg, type = 'INFO') {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const formatted = `[${now}] [${type}] ${msg}`;
  console.log(formatted);
  const logFileName = `prospeccao_${new Date().toISOString().slice(0, 10)}.log`;
  try {
    fs.appendFileSync(path.join(LOGS_DIR, logFileName), formatted + '\n', 'utf-8');
  } catch (e) {
    // ignore
  }
}

// 2. Transporter Nodemailer (SSL Porta 465)
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: CONFIG.gmailUser,
      pass: CONFIG.gmailPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// 3. Processador Spintax {Opcao A|Opcao B|Opcao C} (apenas se contiver '|')
function parseSpintax(text) {
  if (!text) return '';
  let result = text;
  const regex = /\{([^{}]+?\|[^{}]+?)\}/;
  let match;
  let iterations = 0;
  while ((match = regex.exec(result)) !== null && iterations < 30) {
    iterations++;
    const options = match[1].split('|');
    const chosen = options[Math.floor(Math.random() * options.length)].trim();
    result = result.replace(match[0], chosen);
  }
  return result;
}

// Helper para primeiro nome
function getFirstName(fullName) {
  if (!fullName) return 'Prezado(a)';
  const clean = fullName.trim().split(/\s+/)[0];
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

// Helper para formatação de moeda
function formatBRL(value) {
  if (!value) return 'R$ 500.000';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
  if (isNaN(num) || num <= 0) return 'R$ 500.000';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

// 4. CADÊNCIA DE EMAILS (3 PASSOS CONSULTIVOS DE ALTO NÍVEL)
const CADENCIA_TEMPLATES = {
  1: {
    name: 'Passo 1: Abertura Consultiva & Alavancagem Patrimonial',
    minDaysSinceLast: 0,
    subject: '{Oportunidade para|Estratégia de} alavancagem patrimonial em {{cidade}}?',
    buildText: (lead) => `Olá, {{nome_primeiro}}, {tudo bem?|como vai?|espero que esteja tendo uma ótima semana!}

{Acompanho o mercado imobiliário e empresarial|Identifiquei o perfil da sua empresa/atuação} na região de {{cidade}} e percebo que muitos empresários e investidores ainda utilizam financiamento bancário tradicional para aquisição de imóveis, frotas ou capital para expansão, pagando taxas e CET que quase dobram o custo final do projeto.

Na Prospera Plan (parceira autorizada Consórcio Magalu), estruturamos operações de crédito a partir de {{valor_credito}} com custo financeiro médio diluído de apenas 1,2% a 1,8% ao ano — representando frequentemente uma economia de mais de 50% em comparação com qualquer linha bancária tradicional.

Faria sentido nos falarmos rapidamente por 5 minutinhos nesta semana para eu te apresentar um comparativo objetivo para o seu momento?

{Um grande abraço|Atenciosamente},
Fabrício Honorio
Gestor de Planejamento Patrimonial | Prospera Plan & Consórcio Magalu
WhatsApp: (11) 98765-4321
E-mail: gn_prosperaplan@consorciomagalu.com.br`,
    buildHtml: (lead) => {
      const text = CADENCIA_TEMPLATES[1].buildText(lead);
      const paragraphs = text.split('\n\n').map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #1e293b; font-size: 15px;">${p.replace(/\n/g, '<br/>')}</p>`).join('');
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px 16px; background-color: #ffffff;">
          ${paragraphs}
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">Você recebeu esta mensagem exclusivamente devido ao seu perfil executivo ou comercial. Caso não deseje mais receber análises de crédito da Prospera Plan, basta responder "Remover".</p>
          </div>
        </div>
      `;
    }
  },
  2: {
    name: 'Passo 2: Estudo de Caso & Matemática de Economia',
    minDaysSinceLast: 3, // Enviar após 3 a 4 dias do Passo 1
    subject: 'Re: {{nome_primeiro}}, {comparativo prático|estudo de caso}: Consórcio vs Financiamento',
    buildText: (lead) => `Olá, {{nome_primeiro}}, {tudo bem por aí?|espero que esteja tudo bem!}

{Passei rapidamente apenas para compartilhar|Quis te enviar um número rápido e direto}:

Recentemente, desenhamos uma operação de crédito no valor de {{valor_credito}} para um cliente aqui no estado. Ao invés do financiamento bancário padrão (com CET na casa de 12,8% a.a.), ele utilizou nossa estratégia de contemplação planejada com lance embutido no Consórcio Magalu.

O resultado? Uma economia real calculada em mais de R$ 130.000 em juros que não saíram do caixa dele.

Preparei uma lâmina executiva de 1 página com esse comparativo passo a passo. Gostaria que eu te enviasse uma cópia em PDF por aqui ou pelo WhatsApp?

{Um grande abraço|Cordialmente},
Fabrício Honorio
Prospera Plan | Consórcio Magalu
(11) 98765-4321`,
    buildHtml: (lead) => {
      const text = CADENCIA_TEMPLATES[2].buildText(lead);
      const paragraphs = text.split('\n\n').map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #1e293b; font-size: 15px;">${p.replace(/\n/g, '<br/>')}</p>`).join('');
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px 16px; background-color: #ffffff;">
          ${paragraphs}
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">Prospera Plan • Soluções de Alavancagem e Crédito Estratégico.</p>
          </div>
        </div>
      `;
    }
  },
  3: {
    name: 'Passo 3: Break-up Elegante & Última Tentativa',
    minDaysSinceLast: 4, // Enviar após 4 a 5 dias do Passo 2
    subject: '{Devo encerrar meu contato por aqui|Encerrando meus contatos}, {{nome_primeiro}}?',
    buildText: (lead) => `Olá, {{nome_primeiro}}, {tudo bem?|como vai?}

Imagino que sua rotina esteja bastante corrida ou que alavancagem patrimonial e consórcio estratégico não sejam sua prioridade neste momento — e está tudo bem!

Como prezo pelo respeito à sua caixa de entrada, este será meu último e-mail sobre o assunto para não ser inconveniente.

Se mais adiante fizer sentido analisar uma compra planejada de imóvel, veículo ou investimento empresarial com juro zero, minhas informações de contato direto ficam registradas abaixo.

{Desejo muito sucesso e excelentes negócios!|Desejo ótimos resultados na sua jornada!}

Atenciosamente,
Fabrício Honorio
Gestor Comercial | Prospera Plan & Consórcio Magalu
gn_prosperaplan@consorciomagalu.com.br`,
    buildHtml: (lead) => {
      const text = CADENCIA_TEMPLATES[3].buildText(lead);
      const paragraphs = text.split('\n\n').map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #1e293b; font-size: 15px;">${p.replace(/\n/g, '<br/>')}</p>`).join('');
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px 16px; background-color: #ffffff;">
          ${paragraphs}
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">Prospera Plan • Contato comercial encerrado nesta esteira.</p>
          </div>
        </div>
      `;
    }
  }
};

// 5. Interpolar variáveis no texto
function renderTemplate(content, lead) {
  const nomePrimeiro = getFirstName(lead.nome);
  const cidade = lead.cidade?.trim() || 'sua região';
  const valorCredito = formatBRL(lead.valor_credito);

  return content
    .replace(/\{\{nome_primeiro\}\}/g, nomePrimeiro)
    .replace(/\{\{nome\}\}/g, lead.nome || 'Cliente')
    .replace(/\{\{cidade\}\}/g, cidade)
    .replace(/\{\{valor_credito\}\}/g, valorCredito);
}

// 6. Gerenciar Histórico de Disparos Local
function loadLocalHistory() {
  if (!fs.existsSync(HISTORICO_FILE)) return {};
  try {
    const raw = fs.readFileSync(HISTORICO_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveLocalHistory(history) {
  try {
    fs.writeFileSync(HISTORICO_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (e) {
    log(`Erro ao salvar histórico local: ${e.message}`, 'ERROR');
  }
}

const CSV_FILE = path.join(__dirname, 'leads_prospeccao.csv');

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length < 2) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    if (row.email && row.email.includes('@')) {
      row.id = row.id || `lead-csv-${i}`;
      row.valor_credito = parseFloat(row.valor_credito) || 500000;
      rows.push(row);
    }
  }
  return rows;
}

// 7. Carregar leads (do arquivo CSV e/ou JSON)
function getLeadsToProspect() {
  const leadsMap = new Map();

  // 1. Tentar ler do CSV (prioridade para fácil edição em Excel)
  if (fs.existsSync(CSV_FILE)) {
    try {
      const csvRaw = fs.readFileSync(CSV_FILE, 'utf-8');
      const csvLeads = parseCSV(csvRaw);
      for (const l of csvLeads) {
        if (l.email) leadsMap.set(l.email.toLowerCase(), l);
      }
      log(`Carregados ${csvLeads.length} leads do arquivo CSV (leads_prospeccao.csv)`);
    } catch (e) {
      log(`Erro ao ler CSV: ${e.message}`, 'WARN');
    }
  }

  // 2. Tentar ler do JSON
  if (fs.existsSync(LEADS_FILE)) {
    try {
      const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
      const jsonLeads = JSON.parse(raw);
      if (Array.isArray(jsonLeads)) {
        for (const l of jsonLeads) {
          if (l.email && !leadsMap.has(l.email.toLowerCase())) {
            leadsMap.set(l.email.toLowerCase(), l);
          }
        }
      }
    } catch (e) {
      log(`Erro ao ler JSON: ${e.message}`, 'WARN');
    }
  }

  return Array.from(leadsMap.values());
}

// 8. Determinar Passo Elegível para o Lead
function getEligibleStep(lead, leadHistory) {
  const history = leadHistory || [];
  const emailsSent = history.filter(h => h.tipo === 'email_prospeccao');

  if (emailsSent.length === 0) {
    return 1; // Passo 1
  }

  // Ordena pelo mais recente
  emailsSent.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
  const last = emailsSent[0];
  const lastStep = last.step || 1;
  const daysDiff = (Date.now() - new Date(last.sent_at).getTime()) / (1000 * 60 * 60 * 24);

  if (lastStep === 1) {
    if (daysDiff >= CADENCIA_TEMPLATES[2].minDaysSinceLast) {
      return 2;
    }
    return null; // Aguardando intervalo
  }

  if (lastStep === 2) {
    if (daysDiff >= CADENCIA_TEMPLATES[3].minDaysSinceLast) {
      return 3;
    }
    return null; // Aguardando intervalo
  }

  // Já completou os 3 passos
  return null;
}

// Delay aleatório humano
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomDelay(minSec, maxSec) {
  const sec = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
  return sec * 1000;
}

// ==============================================================================
// FLUXO PRINCIPAL DE EXECUÇÃO
// ==============================================================================
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const testToArg = args.find(a => a.startsWith('--test-to='));
  const stepArg = args.find(a => a.startsWith('--step='));

  const maxLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : CONFIG.dailyLimit;
  const forcedStep = stepArg ? parseInt(stepArg.split('=')[1], 10) : null;

  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       SIMULAJÁ CRM • MOTOR DE PROSPECÇÃO DIÁRIA POR EMAIL        ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  log(`Remetente: ${CONFIG.senderName} <${CONFIG.gmailUser}>`);
  log(`Limite do dia: ${maxLimit} disparos | Modo: ${isDryRun ? '🔍 SIMULAÇÃO (DRY RUN)' : '🚀 PRODUÇÃO (ENVIO REAL)'}`);

  const transporter = createTransporter();

  // Teste de conexão SMTP
  try {
    await transporter.verify();
    log('Conexão SMTP com Gmail autenticada com sucesso! ✅');
  } catch (err) {
    log(`Falha crítica de autenticação SMTP: ${err.message}`, 'FATAL');
    process.exit(1);
  }

  // MODO TESTE DIRETO: Enviar os 3 passos para o email indicado
  if (testToArg) {
    const targetEmail = testToArg.split('=')[1];
    log(`Iniciando envio de demonstração dos 3 passos para: ${targetEmail}`);
    const mockLead = {
      id: 'teste-direto',
      nome: 'Fabrício Honorio',
      email: targetEmail,
      cidade: 'São Paulo',
      valor_credito: 500000,
    };

    for (let s = 1; s <= 3; s++) {
      const template = CADENCIA_TEMPLATES[s];
      const subject = renderTemplate(parseSpintax(template.subject), mockLead);
      const textBody = renderTemplate(template.buildText(mockLead), mockLead);
      const htmlBody = renderTemplate(template.buildHtml(mockLead), mockLead);

      log(`[TESTE] Disparando Passo ${s} (${template.name})...`);
      const info = await transporter.sendMail({
        from: `"${CONFIG.senderName}" <${CONFIG.gmailUser}>`,
        to: targetEmail,
        replyTo: CONFIG.replyTo,
        subject: `[TESTE PASSO ${s}] ${subject}`,
        text: textBody,
        html: htmlBody,
      });
      log(`Passo ${s} enviado com sucesso! Message ID: ${info.messageId}`);
      if (s < 3) await sleep(2000);
    }

    log('Todos os testes concluídos com sucesso! Verifique sua caixa de entrada.');
    return;
  }

  // Carregar Leads e Histórico
  const leads = getLeadsToProspect();
  const history = loadLocalHistory();

  log(`Total de leads carregados para análise: ${leads.length}`);

  // Filtrar leads elegíveis
  const queue = [];

  for (const lead of leads) {
    if (!lead.email || !lead.email.includes('@')) continue;
    // Pula se lead fechou venda ou foi descartado
    if (['venda_fechada', 'fechado', 'perdido', 'descartado'].includes(lead.status)) continue;

    const leadHist = history[lead.id || lead.email] || [];
    const step = forcedStep || getEligibleStep(lead, leadHist);

    if (step) {
      queue.push({ lead, step, leadHist });
    }
  }

  log(`Fila de hoje calculada: ${queue.length} leads prontos para receber contato.`);

  if (queue.length === 0) {
    log('Nenhum lead pendente para contato na cadência hoje. Finalizando.');
    return;
  }

  // Aplicar limite diário de segurança
  const toSend = queue.slice(0, maxLimit);
  log(`Disparos agendados para este lote: ${toSend.length} (limite seguro respeitado)`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toSend.length; i++) {
    const { lead, step, leadHist } = toSend[i];
    const template = CADENCIA_TEMPLATES[step];
    const subject = parseSpintax(renderTemplate(template.subject, lead));
    const textBody = parseSpintax(renderTemplate(template.buildText(lead), lead));
    const htmlBody = parseSpintax(renderTemplate(template.buildHtml(lead), lead));

    log(`\n[${i + 1}/${toSend.length}] Lead: ${lead.nome} <${lead.email}> | Passo ${step}`);
    log(`Assunto: "${subject}"`);

    if (isDryRun) {
      log(`[DRY-RUN] Simulação concluída com sucesso. E-mail NÃO disparado.`);
      successCount++;
    } else {
      try {
        const info = await transporter.sendMail({
          from: `"${CONFIG.senderName}" <${CONFIG.gmailUser}>`,
          to: lead.email,
          replyTo: CONFIG.replyTo,
          subject,
          text: textBody,
          html: htmlBody,
        });

        log(`Enviado com sucesso! Message ID: ${info.messageId} ✅`);

        // Registrar no histórico
        const record = {
          sent_at: new Date().toISOString(),
          step,
          subject,
          message_id: info.messageId,
          tipo: 'email_prospeccao',
        };

        const key = lead.id || lead.email;
        if (!history[key]) history[key] = [];
        history[key].push(record);
        saveLocalHistory(history);

        successCount++;
      } catch (err) {
        log(`Falha ao enviar para ${lead.email}: ${err.message}`, 'ERROR');
        failCount++;
      }
    }

    // Delay humano entre os disparos (não espera no último e pula em dry-run)
    if (i < toSend.length - 1) {
      if (isDryRun) {
        await sleep(50);
      } else {
        const delayMs = getRandomDelay(CONFIG.minDelaySec, CONFIG.maxDelaySec);
        const delaySec = Math.round(delayMs / 1000);
        log(`Aguardando ${delaySec}s (jitter humano anti-spam) antes do próximo envio...`);
        await sleep(delayMs);
      }
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════════');
  log(`Fim do ciclo diário de prospecção. Sucessos: ${successCount} | Falhas: ${failCount}`);
  console.log('══════════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  log(`Erro fatal na execução: ${err.message}\n${err.stack}`, 'FATAL');
  process.exit(1);
});
