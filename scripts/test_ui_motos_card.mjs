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

async function testUiMotos() {
  console.log('--- TESTANDO FLUXO UI PARA MOTOS 28K ---');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const apiLogs = [];
  const logResponse = async (res) => {
    if (res.url().includes('AppVendasApi')) {
      try {
        const text = await res.text();
        apiLogs.push({
          url: res.url(),
          status: res.status(),
          method: res.request().method(),
          postData: res.request().postData(),
          json: JSON.parse(text)
        });
      } catch (e) {}
    }
  };

  page.on('response', logResponse);

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
  active.on('response', logResponse);

  await active.waitForLoadState('domcontentloaded');
  await active.waitForTimeout(3000);

  console.log('2. Preenchendo Etapa 1...');
  const testCpf = gerarCPFValido();
  await active.locator('#documento').click();
  await active.locator('#documento').pressSequentially(testCpf, { delay: 30 });
  await active.locator('#chapa').click();
  await active.locator('#chapa').pressSequentially('918260', { delay: 30 });
  await active.keyboard.press('Tab');
  await active.waitForTimeout(1500);

  await active.evaluate(() => {
    document.querySelector('button[type="submit"]')?.click();
  });
  await active.waitForTimeout(3500);

  console.log('3. Etapa 2: Selecionando MOTOCICLETAS...');
  await active.screenshot({ path: 'scripts/logs/etapa2_select.png' });

  // Clicar no card MOTOCICLETAS
  const cardMotos = active.locator('text=/MOTOCICLETAS/i').first();
  await cardMotos.click();
  await active.waitForTimeout(1000);

  // Clicar Continuar
  const btnContinuarEtapa2 = active.locator('button:has-text("Continuar")');
  await btnContinuarEtapa2.click();
  await active.waitForTimeout(3500);

  console.log('4. Etapa 3: Selecionando Tipo de Venda e Crédito 28k...');
  await active.screenshot({ path: 'scripts/logs/etapa3_motos.png' });

  // No formulário da Etapa 3, selecionar Tipo de Venda 50/50 NEGOCIADO
  // Procurar select ou radio ou dropdown
  const pageText = await active.innerText('body');
  fs.writeFileSync('scripts/logs/etapa3_motos_text.txt', pageText);

  // Procurar opção 50/50
  const opt5050 = active.locator('text=/50\\/50/i').first();
  if (await opt5050.count() > 0) {
    console.log('Encontrou opção 50/50, clicando...');
    await opt5050.click();
    await active.waitForTimeout(1500);
  }

  // Clicar no valor 28.000
  const opt28k = active.locator('text=/28\\.000/i').first();
  if (await opt28k.count() > 0) {
    console.log('Encontrou 28.000, clicando...');
    await opt28k.click();
    await active.waitForTimeout(1500);
  }

  // Clicar Continuar para ir para a Etapa 4
  const btnContinuarEtapa3 = active.locator('button:has-text("Continuar")');
  if (await btnContinuarEtapa3.count() > 0) {
    console.log('Clicando Continuar para Etapa 4...');
    await btnContinuarEtapa3.click();
    await active.waitForTimeout(4000);
  }

  console.log('5. Etapa 4 atingida!');
  await active.screenshot({ path: 'scripts/logs/etapa4_motos_28k.png' });
  const etapa4Text = await active.innerText('body');
  fs.writeFileSync('scripts/logs/etapa4_motos_28k_text.txt', etapa4Text);

  // Inspecionar os botões azuis do card
  const cardButtons = await active.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, [role="button"], i, svg'));
    return btns.map(b => ({
      tag: b.tagName,
      className: b.className,
      ariaLabel: b.getAttribute('aria-label'),
      title: b.getAttribute('title'),
      innerText: b.innerText
    })).filter(b => b.ariaLabel || b.title || (b.className && typeof b.className === 'string' && (b.className.includes('icon') || b.className.includes('btn') || b.className.includes('blue'))));
  });

  fs.writeFileSync('scripts/logs/card_buttons.json', JSON.stringify(cardButtons, null, 2));

  // Salvar todos os logs de API chamados
  fs.writeFileSync('scripts/logs/motos_28k_api_calls.json', JSON.stringify(apiLogs, null, 2));

  console.log('Concluído teste UI motos!');
  await browser.close();
}

testUiMotos().catch(e => console.error(e));
