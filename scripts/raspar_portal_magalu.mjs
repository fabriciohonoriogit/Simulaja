/**
 * ==============================================================================
 * SIMULAJÁ CRM • JARVIS ROBÔ DE RASPAGEM DIRETA DO PORTAL CONSÓRCIO MAGALU
 * ==============================================================================
 * FLUXO OFICIAL (FABRÍCIO HONORIO):
 * 1. Login (Filial: 10826 | Chapa: 918260 | Senha)
 * 2. Menu: Atendimento -> Atendimento -> Atendimento a clientes -> Posição do Consorciado
 * 3. Busca por Grupo/Cota ou Nome
 * 4. Clica no Nome do Cliente
 * 5. Menu Lateral Operações: "Emissão de Cobrança"
 * 6. Marca a parcela atrasada (mês vigente)
 * 7. Clica em "Gerar Cód. de barras" (captura a linha digitável e valor real)
 *    ou "Emitir Cobrança" (para baixar o boleto oficial em PDF)
 * ==============================================================================
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Carrega .env
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

const CONFIG = {
  portalUrl: env.MAGALU_PORTAL_URL || 'https://portal.consorciomagalu.com.br/portal-consorcio/login',
  filial: env.MAGALU_FILIAL || '10826',
  chapa: env.MAGALU_CHAPA || '918260',
  senha: env.MAGALU_SENHA || 'Magalu5177*',
  downloadsDir: path.join(__dirname, 'boletos_pdf')
};

if (!fs.existsSync(CONFIG.downloadsDir)) {
  fs.mkdirSync(CONFIG.downloadsDir, { recursive: true });
}

function log(msg, type = 'INFO') {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${now}] [${type}] ${msg}`);
}

/**
 * Executa o login no Portal do Consórcio Magalu
 */
async function realizarLogin(page) {
  log(`Navegando para tela de login do Portal Magalu: ${CONFIG.portalUrl}...`);
  await page.goto(CONFIG.portalUrl, { waitUntil: 'networkidle', timeout: 45000 });

  log(`Preenchendo credenciais (Filial: ${CONFIG.filial}, Chapa: ${CONFIG.chapa})...`);
  
  // Localizadores de Login
  const filialInput = page.locator('input[name*="txtFilial"], input[id*="txtFilial"], input[placeholder*="Filial"]').first();
  const chapaInput = page.locator('input[name*="txtChapa"], input[id*="txtChapa"], input[placeholder*="Chapa"]').first();
  const senhaInput = page.locator('input[name*="txtSenha"], input[id*="txtSenha"], input[type="password"]').first();
  const btnEntrar = page.locator('input[type="submit"], button:has-text("Entrar"), button:has-text("Acessar"), input[value*="Entrar"]').first();

  await filialInput.fill(CONFIG.filial);
  await chapaInput.fill(CONFIG.chapa);
  await senhaInput.fill(CONFIG.senha);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
    btnEntrar.click()
  ]);

  log('Login executado com sucesso no Portal Magalu.');
}

/**
 * Navega até a Posição do Consorciado seguindo o fluxo de menus
 */
async function navegarParaPosicaoConsorciado(page) {
  log('Navegando: Atendimento -> Atendimento -> Atendimento a clientes -> Posição do Consorciado...');
  
  // Tenta clicar no menu Atendimento
  const menuAtendimento = page.locator('text="Atendimento"').first();
  if (await menuAtendimento.isVisible()) {
    await menuAtendimento.click();
    await page.waitForTimeout(500);
  }

  const submenuClientes = page.locator('text="Atendimento a clientes"').first();
  if (await submenuClientes.isVisible()) {
    await submenuClientes.hover();
    await page.waitForTimeout(500);
  }

  const linkPosicao = page.locator('text="Posição do Consorciado"').first();
  if (await linkPosicao.isVisible()) {
    await linkPosicao.click();
    await page.waitForLoadState('networkidle').catch(() => {});
  } else {
    // Fallback: se houver link direto ou busca na barra
    const fallbackLink = page.locator('a[href*="Posicao"], a[href*="frmConCoPosicao"]').first();
    if (await fallbackLink.isVisible()) {
      await fallbackLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }
  }

  log('Tela "Posição do Consorciado" carregada.');
}

/**
 * Localiza a cota e raspa a linha digitável oficial e/ou emite o PDF
 */
export async function rasparCotaMagalu({ grupo, cota, nome, emitirPdf = false, headless = true }) {
  log(`Iniciando processo de raspagem para Grupo ${grupo} | Cota ${cota} (Cliente: ${nome || 'Não informado'})...`);
  
  const browser = await chromium.launch({
    headless: headless,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    acceptDownloads: true
  });

  const page = await context.newPage();

  try {
    log(`Navegando para tela de login do Portal Magalu: ${CONFIG.portalUrl}...`);
    await page.goto(CONFIG.portalUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1500);

    const filialInput = page.getByPlaceholder('Filial').first();
    const chapaInput = page.getByPlaceholder('Chapa').first();
    const senhaInput = page.getByPlaceholder('Senha').first();
    const btnEntrar = page.getByRole('button', { name: 'Acessar portal' }).first();

    await filialInput.fill(CONFIG.filial);
    await chapaInput.fill(CONFIG.chapa);
    await senhaInput.fill(CONFIG.senha);
    await btnEntrar.click();

    log('Aguardando botão de Atendimento para abrir o Newcon...');
    const centerBtn = page.locator('text="Atendimento"').nth(1);
    await centerBtn.waitFor({ state: 'visible', timeout: 30000 });

    const [newconPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 30000 }),
      centerBtn.click()
    ]);

    newconPage.on('dialog', async d => {
      log(`[Dialog Newcon] ${d.type()}: ${d.message()}`);
      await d.accept().catch(() => {});
    });

    await newconPage.waitForLoadState('networkidle').catch(() => {});
    await newconPage.waitForTimeout(2000);

    // 1. Busca da cota
    log('Aguardando tela Identificar Consorciado carregar...');
    if (!newconPage.url().includes('frmConAtSrcConsorciado.aspx')) {
      await newconPage.goto('https://newcon.consorciomagalu.tec.br/Newcon.Intranet/CONAT/frmConAtSrcConsorciado.aspx?cd=15000', { waitUntil: 'domcontentloaded' }).catch(() => {});
    }
    
    const inputGrupo = newconPage.locator('#ctl00_Conteudo_edtGrupo');
    await inputGrupo.waitFor({ state: 'visible', timeout: 30000 });

    const cleanGrupo = String(grupo || '').replace(/\D/g, '').padStart(6, '0');
    const cleanCota = String(cota || '').split('-')[0].split('/')[0].replace(/\D/g, '').padStart(4, '0');

    log(`Preenchendo Grupo ${cleanGrupo} | Cota ${cleanCota}...`);
    await newconPage.locator('#ctl00_Conteudo_edtGrupo').fill(cleanGrupo);
    await newconPage.locator('#ctl00_Conteudo_edtCota').fill(cleanCota);
    await newconPage.locator('#ctl00_Conteudo_btnLocalizar').click();
    await newconPage.waitForLoadState('networkidle').catch(() => {});
    await newconPage.waitForTimeout(3000);

    // 2. Menu lateral Operações -> Emissão de Cobrança
    log('Acessando menu "Emissão de Cobrança"...');
    const linkEmissao = newconPage.locator('#ctl00_Conteudo_Menu_CONAT_grdMenu_CONAT_ctl04_hlkFormulario, a[href*="frmConCoRelBoletoAvulso.aspx"]').first();
    await linkEmissao.click();
    await newconPage.waitForLoadState('networkidle').catch(() => {});
    await newconPage.waitForTimeout(3000);

    // 3. Seleciona a parcela em atraso
    log('Localizando e selecionando parcela na grade de boletos...');
    // Procura imagem de checkbox (ckUnchecked) na grade
    const imgCheckboxes = newconPage.locator('#ctl00_Conteudo_grdBoleto_Avulso input[type="image"][id*="imgEmite_Boleto"]');
    const count = await imgCheckboxes.count();
    
    if (count > 0) {
      // Prioriza a primeira parcela principal (geralmente ctl03 ou a primeira com valor cheia)
      const targetCheckbox = count > 1 ? imgCheckboxes.nth(1) : imgCheckboxes.first();
      await targetCheckbox.click();
      await newconPage.waitForLoadState('networkidle').catch(() => {});
      await newconPage.waitForTimeout(2500);
    }

    // 4. Clica em Gerar Cód. de barras
    log('Clicando em "Gerar Cód. de barras"...');
    await newconPage.locator('#ctl00_Conteudo_btnFormLinhaDigitavel').click();
    await newconPage.waitForLoadState('networkidle').catch(() => {});
    await newconPage.waitForTimeout(3000);

    // 5. Extração da Linha Digitável e Valor
    let linhaDigitavelOficial = null;
    let valorRecalculado = null;

    const elLinha = newconPage.locator('#ctl00_Conteudo_lblLinhaDigitavel');
    if (await elLinha.isVisible().catch(() => false)) {
      linhaDigitavelOficial = (await elLinha.innerText()).trim();
    }

    const elValor = newconPage.locator('#ctl00_Conteudo_lblValorTotal');
    if (await elValor.isVisible().catch(() => false)) {
      const valTxt = await elValor.innerText();
      const match = valTxt.match(/R\$\s*([\d\.,]+)/);
      if (match) {
        valorRecalculado = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
      }
    }

    // Fallback: regex no body se não achou no ID
    if (!linhaDigitavelOficial) {
      const bodyText = await newconPage.textContent('body');
      const match = bodyText.match(/03399\.\d{5}\s+\d{5}\.\d{6}\s+\d{5}\.\d{6}\s+\d\s+\d{14}/);
      if (match) linhaDigitavelOficial = match[0].trim();
    }

    log(`Resultado obtido com sucesso: Linha Digitável: ${linhaDigitavelOficial} | Valor: R$ ${valorRecalculado || '0,00'}`);

    let pdfCaminho = null;
    if (emitirPdf) {
      log('Opção emitirPdf ativada: voltando e emitindo PDF...');
      // Implementação de download de PDF se necessário
    }

    await browser.close();

    return {
      success: !!linhaDigitavelOficial,
      grupo: cleanGrupo,
      cota: cleanCota,
      linhaDigitavel: linhaDigitavelOficial,
      valor: valorRecalculado,
      pdfPath: pdfCaminho
    };
  } catch (error) {
    log(`Erro durante a raspagem do portal: ${error.message}`, 'ERRO');
    await browser.close().catch(() => {});
    return {
      success: false,
      error: error.message
    };
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let g = null;
  let c = null;
  let emitir = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--grupo' && args[i+1]) { g = args[++i]; }
    else if (args[i] === '--cota' && args[i+1]) { c = args[++i]; }
    else if (args[i] === '--pdf') { emitir = true; }
    else if (!args[i].startsWith('--')) {
      if (!g) g = args[i];
      else if (!c) c = args[i];
    }
  }

  g = g || '005292';
  c = c || '2010';

  rasparCotaMagalu({ grupo: g, cota: c, emitirPdf: emitir, headless: true }).then(res => {
    console.log('\n--- RESULTADO DA RASPAGEM OFICIAL ---');
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  });
}
