import { chromium } from 'playwright';

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

async function verifyMotos28k() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  let authToken = '';
  page.on('request', (req) => {
    if (req.url().includes('AppVendasApi')) {
      const auth = req.headers()['authorization'];
      if (auth && auth.startsWith('Bearer ') && !authToken) {
        authToken = auth;
      }
    }
  });

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
  active.on('request', (req) => {
    if (req.url().includes('AppVendasApi')) {
      const auth = req.headers()['authorization'];
      if (auth && auth.startsWith('Bearer ') && !authToken) {
        authToken = auth;
      }
    }
  });

  await active.waitForLoadState('domcontentloaded');
  await active.waitForTimeout(3000);

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

  console.log(`Token: ${authToken.slice(0, 20)}...`);

  // Agora chamada com idProduto 5 (Motos), idSubProduto 9, idTipoVendaGrupo 746 (50/50), pzVendaInicial 5, pzVendaFinal 240
  const headers = {
    'Authorization': authToken,
    'Content-Type': 'application/json'
  };

  const res = await fetch('https://api.consorciomagalu.tec.br/AppVendasApi/vendas/grupos-creditos/grupos-disponiveis', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      idProduto: 5,
      idSubProduto: 9,
      idTipoVendaGrupo: 746, // 50/50 NEGOCIADO
      pzVendaInicial: 5,
      pzVendaFinal: 240,
      idEmpresa: 1,
      situacao: 'A',
      idBem: 2699, // 28 mil
      idDesconto: 0,
      idFormaPagamentoPP: 'BB',
      tpNegociacao: 'string',
      idPontoVenda: 10933,
      idComissionado: 191393,
      snFuncionario: 'N'
    })
  });

  const json = await res.json();
  console.log('\n--- RESPOSTA GRUPOS DISPONIVEIS MOTOS 28K (746) ---');
  console.log(JSON.stringify(json, null, 2));

  await browser.close();
}

verifyMotos28k().catch(e => console.error(e));
