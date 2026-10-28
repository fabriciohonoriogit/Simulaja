import { chromium } from 'playwright';
import fs from 'fs';

function gerarCPFValido() {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  let d1 = n.reduce((total, num, i) => total + num * (10 - i), 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  n.push(d1);
  let d2 = n.reduce((total, num, i) => total + num * (11 - i), 0) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  n.push(d2);
  return n.join('');
}

async function scrapeAnalise() {
  console.log('--- INICIANDO CAPTURA DE ANÁLISE E CARACTERÍSTICAS DOS GRUPOS ---');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  let authToken = '';
  const apiLogs = [];

  const handleResponse = async (res) => {
    const url = res.url();
    if (url.includes('AppVendasApi')) {
      try {
        const text = await res.text();
        apiLogs.push({
          url,
          status: res.status(),
          method: res.request().method(),
          postData: res.request().postData(),
          json: JSON.parse(text)
        });
      } catch (e) {
        apiLogs.push({
          url,
          status: res.status(),
          method: res.request().method(),
          postData: res.request().postData()
        });
      }
    }
  };

  page.on('response', handleResponse);

  console.log('1. Login...');
  await page.goto('https://portal.consorciomagalu.com.br/portal-consorcio/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  await page.getByPlaceholder('Filial').first().fill('10826');
  await page.getByPlaceholder('Chapa').first().fill('918260');
  await page.getByPlaceholder('Senha').first().fill('Magalu5177*');
  await page.getByRole('button', { name: 'Acessar portal' }).first().click();

  const menuVendas = page.locator('nav, aside, div').locator('text="Vendas"').first();
  await menuVendas.waitFor({ state: 'visible', timeout: 30000 });
  await menuVendas.click();
  await page.waitForTimeout(1000);

  const btnNovoRegistro = page.locator('text="Novo Registro de Vendas"').first();
  await btnNovoRegistro.waitFor({ state: 'visible', timeout: 15000 });

  const [newPage] = await Promise.all([
    context.waitForEvent('page', { timeout: 15000 }).catch(() => null),
    btnNovoRegistro.click()
  ]);

  const active = newPage || page;
  active.on('response', handleResponse);

  await active.waitForLoadState('domcontentloaded');
  await active.waitForTimeout(3000);

  // Navegar para Análise de Grupos
  console.log('2. Navegando para Análise de Grupos...');
  await active.goto('https://portal.consorciomagalu.com.br/registro-de-vendas/analise-grupos', { waitUntil: 'networkidle', timeout: 30000 });
  await active.waitForTimeout(4000);

  // Tirar screenshot da tela
  await active.screenshot({ path: 'scripts/logs/analise_grupos_screen.png', fullPage: true });

  // Clicar na aba "Características"
  console.log('3. Clicando na aba Características...');
  const abaCarac = active.locator('text="Características"').first();
  if (await abaCarac.count() > 0) {
    await abaCarac.click();
    await active.waitForTimeout(4000);
    await active.screenshot({ path: 'scripts/logs/caracteristicas_screen.png', fullPage: true });
    const textCarac = await active.innerText('body');
    fs.writeFileSync('scripts/logs/caracteristicas_tab_text.txt', textCarac);
  }

  fs.writeFileSync('scripts/logs/analise_api_calls.json', JSON.stringify(apiLogs, null, 2));
  console.log(`Concluído! ${apiLogs.length} chamadas de API registradas.`);

  await browser.close();
}

scrapeAnalise().catch(e => console.error(e));
