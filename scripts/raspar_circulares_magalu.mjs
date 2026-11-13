import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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
};

function log(msg) {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${now}] ${msg}`);
}

async function run() {
  log('Iniciando navegador Chromium para acessar o Portal Magalu...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    log(`Navegando para: ${CONFIG.portalUrl}`);
    await page.goto(CONFIG.portalUrl, { waitUntil: 'networkidle', timeout: 60000 });

    log(`Preenchendo login (Filial: ${CONFIG.filial}, Chapa: ${CONFIG.chapa})...`);
    const filialInput = page.locator('input[name*="txtFilial"], input[id*="txtFilial"], input[placeholder*="Filial"]').first();
    const chapaInput = page.locator('input[name*="txtChapa"], input[id*="txtChapa"], input[placeholder*="Chapa"]').first();
    const senhaInput = page.locator('input[name*="txtSenha"], input[id*="txtSenha"], input[type="password"]').first();
    const btnEntrar = page.locator('input[type="submit"], button:has-text("Entrar"), button:has-text("Acessar"), input[value*="Entrar"]').first();

    await filialInput.fill(CONFIG.filial);
    await chapaInput.fill(CONFIG.chapa);
    await senhaInput.fill(CONFIG.senha);

    log('Enviando credenciais de acesso...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 45000 }).catch(() => {}),
      btnEntrar.click()
    ]);

    await page.waitForTimeout(3000);
    log(`Página atual pós-login: ${page.url()}`);

    // Screenshot do dashboard inicial
    const debugDir = path.join(ROOT_DIR, 'scratch', 'portal_debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    await page.screenshot({ path: path.join(debugDir, 'pos_login.png') });
    log('Screenshot do dashboard salvo em scratch/portal_debug/pos_login.png');

    // Mapear todos os links/menus da barra lateral e superior
    const menuLinks = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a, button, li, span, div.menu, div.nav'));
      return elements
        .map(el => ({
          tag: el.tagName,
          text: el.innerText ? el.innerText.trim() : '',
          href: el.getAttribute('href') || '',
          id: el.id || '',
          className: el.className || ''
        }))
        .filter(item => item.text.length > 0 && item.text.length < 50);
    });

    log(`Total de elementos de menu encontrados: ${menuLinks.length}`);
    const comunicacaoItems = menuLinks.filter(m => 
      /comunica/i.test(m.text) || 
      /circular/i.test(m.text) || 
      /comunica/i.test(m.href) || 
      /circular/i.test(m.href)
    );
    log(`Elementos relacionados a Comunicação/Circulares: ${JSON.stringify(comunicacaoItems, null, 2)}`);

    // Tentar clicar em Comunicação
    const linkComunicacao = page.locator('text=/Comunicação|Comunicados/i').first();
    if (await linkComunicacao.isVisible({ timeout: 5000 }).catch(() => false)) {
      log('Clicando no menu Comunicação...');
      await linkComunicacao.click();
      await page.waitForTimeout(2000);
    } else {
      // Procura por href ou classe
      const altComunicacao = page.locator('a[href*="Comunica"], a[href*="comunica"]').first();
      if (await altComunicacao.isVisible({ timeout: 3000 }).catch(() => false)) {
        log('Clicando em link alternativo de Comunicação...');
        await altComunicacao.click();
        await page.waitForTimeout(2000);
      }
    }

    // Tentar clicar em Circulares
    const linkCirculares = page.locator('text=/Circulares|Circular/i').first();
    if (await linkCirculares.isVisible({ timeout: 5000 }).catch(() => false)) {
      log('Clicando na opção Circulares...');
      await linkCirculares.click();
      await page.waitForTimeout(3000);
    } else {
      const altCirculares = page.locator('a[href*="Circular"], a[href*="circular"]').first();
      if (await altCirculares.isVisible({ timeout: 3000 }).catch(() => false)) {
        log('Clicando em link alternativo de Circulares...');
        await altCirculares.click();
        await page.waitForTimeout(3000);
      }
    }

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: path.join(debugDir, 'tela_circulares.png') });
    log('Screenshot da tela de circulares salvo em scratch/portal_debug/tela_circulares.png');

    // Extrair todo o conteúdo da página de circulares
    const circularesData = await page.evaluate(() => {
      // Pega tabelas, listas, cards ou linhas
      const rows = Array.from(document.querySelectorAll('table tr, .grid-row, .card, ul.circulares li, div.circular-item'));
      const textDump = document.body ? document.body.innerText : '';
      
      const tableData = rows.map(r => {
        const cells = Array.from(r.querySelectorAll('td, th, .col, p, span'));
        return cells.map(c => c.innerText.trim()).filter(Boolean);
      }).filter(row => row.length > 0);

      const links = Array.from(document.querySelectorAll('a'))
        .map(a => ({ text: a.innerText.trim(), href: a.href }))
        .filter(a => a.text.length > 0);

      return {
        url: window.location.href,
        title: document.title,
        tableData,
        links,
        textDump
      };
    });

    log(`Extração inicial concluída! URL: ${circularesData.url}`);
    
    // Salvar dump de dados brutos
    fs.writeFileSync(
      path.join(debugDir, 'circulares_dump.json'), 
      JSON.stringify(circularesData, null, 2), 
      'utf-8'
    );
    log('Dump inicial salvo em scratch/portal_debug/circulares_dump.json');

  } catch (err) {
    log(`Erro durante execução: ${err.message}`);
    const debugDir = path.join(ROOT_DIR, 'scratch', 'portal_debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    await page.screenshot({ path: path.join(debugDir, 'erro.png') }).catch(() => {});
  } finally {
    await browser.close();
    log('Navegador fechado.');
  }
}

run();

