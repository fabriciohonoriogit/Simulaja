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
    channel: 'msedge',
    headless: headless
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    acceptDownloads: true
  });

  const page = await context.newPage();

  try {
    await realizarLogin(page);
    await navegarParaPosicaoConsorciado(page);

    // 1. Busca por Grupo / Cota
    const cleanGrupo = String(grupo || '').replace(/\D/g, '');
    const cleanCota = String(cota || '').split('-')[0].split('/')[0].replace(/\D/g, '');

    const inputGrupo = page.locator('input[id*="txtGrupo"], input[name*="txtGrupo"]').first();
    const inputCota = page.locator('input[id*="txtCota"], input[name*="txtCota"]').first();
    const btnLocalizar = page.locator('input[value*="Localizar"], button:has-text("Localizar")').first();

    if (await inputGrupo.isVisible() && await inputCota.isVisible()) {
      await inputGrupo.fill(cleanGrupo);
      await inputCota.fill(cleanCota);
      await btnLocalizar.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // 2. Clica sobre o nome do cliente na grade de resultados
    log('Clicando no nome do cliente localizado...');
    const linkNome = page.locator(`a:has-text("${cleanCota}"), a:has-text("${cleanGrupo}"), td a`).first();
    if (await linkNome.isVisible()) {
      await linkNome.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // 3. Menu lateral Operações -> Emissão de Cobrança
    log('Acessando menu lateral "Emissão de Cobrança"...');
    const linkEmissao = page.locator('a:has-text("Emissão de Cobrança"), a[href*="BoletoAvulso"]').first();
    await linkEmissao.click();
    await page.waitForLoadState('networkidle').catch(() => {});

    // 4. Marca o checkbox da parcela em atraso
    log('Marcando checkbox da parcela em aberto...');
    const checkboxParcela = page.locator('input[type="checkbox"][id*="grdBoleto"]').first();
    if (await checkboxParcela.isVisible()) {
      await checkboxParcela.check();
    }

    // 5. Opção 1: Gerar Código de Barras
    log('Clicando em "Gerar Cód. de barras"...');
    const btnGerarCodigo = page.locator('input[id*="btnFormLinhaDigitavel"], button:has-text("Gerar Cód. de barras"), input[value*="Gerar Cód. de barras"]').first();
    await btnGerarCodigo.click();
    await page.waitForTimeout(1500);

    // Captura o texto do modal/tela
    // Procura pela linha Santander (03399.75989...)
    const textoPagina = await page.textContent('body');
    const matchLinha = textoPagina.match(/03399\.\d{5}\s+\d{5}\.\d{6}\s+\d{5}\.\d{6}\s+\d\s+\d{14}/);
    const matchValor = textoPagina.match(/R\$\s*([\d\.,]+)/);

    let linhaDigitavelOficial = matchLinha ? matchLinha[0].trim() : null;
    let valorRecalculado = matchValor ? parseFloat(matchValor[1].replace(/\./g, '').replace(',', '.')) : null;

    log(`Resultado obtido no portal: Linha: ${linhaDigitavelOficial || 'Não localizada'} | Valor: R$ ${valorRecalculado || '0,00'}`);

    // Opção 2: Se solicitado emitir PDF
    let pdfCaminho = null;
    if (emitirPdf) {
      log('Clicando em "Emitir Cobrança" para baixar o PDF oficial...');
      const btnEmitirPdf = page.locator('input[id*="btnEmitir"], button:has-text("Emitir Cobrança")').first();
      
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 20000 }).catch(() => null),
        btnEmitirPdf.click()
      ]);

      if (download) {
        const nomeArquivo = `Boleto_Magalu_${cleanGrupo}_${cleanCota}_${Date.now()}.pdf`;
        pdfCaminho = path.join(CONFIG.downloadsDir, nomeArquivo);
        await download.saveAs(pdfCaminho);
        log(`Boleto em PDF salvo com sucesso em: ${pdfCaminho}`);
      }
    }

    await browser.close();

    return {
      success: true,
      grupo: cleanGrupo,
      cota: cleanCota,
      linhaDigitavel: linhaDigitavelOficial,
      valorParcela: valorRecalculado,
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

// Execução direta via CLI (ex: node scripts/raspar_portal_magalu.mjs --grupo 6041 --cota 123)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let g = '6041';
  let c = '123';
  let emitir = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--grupo' && args[i+1]) g = args[++i];
    if (args[i] === '--cota' && args[i+1]) c = args[++i];
    if (args[i] === '--pdf') emitir = true;
  }

  rasparCotaMagalu({ grupo: g, cota: c, emitirPdf: emitir, headless: true }).then(res => {
    console.log('\n--- RESULTADO DA RASPAGEM OFICIAL ---');
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  });
}
