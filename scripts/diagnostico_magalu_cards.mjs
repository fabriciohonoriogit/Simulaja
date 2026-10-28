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

async function run() {
  console.log('--- INICIANDO DIAGNÓSTICO E EXTRAÇÃO PRECISA MAGALU ---');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  let authToken = '';
  const apiCalls = [];

  page.on('request', (req) => {
    if (req.url().includes('AppVendasApi')) {
      const auth = req.headers()['authorization'];
      if (auth && auth.startsWith('Bearer ') && !authToken) {
        authToken = auth;
      }
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('AppVendasApi')) {
      try {
        const text = await res.text();
        apiCalls.push({
          url: res.url(),
          status: res.status(),
          method: res.request().method(),
          postData: res.request().postData(),
          responseSnippet: text.slice(0, 300)
        });
      } catch (e) {}
    }
  });

  console.log('1. Autenticando com credenciais de produção...');
  await page.goto('https://portal.consorciomagalu.com.br/portal-consorcio/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
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

  console.log('2. Inicializando formulário com CPF...');
  const testCpf = gerarCPFValido();
  await active.locator('#documento').click();
  await active.locator('#documento').pressSequentially(testCpf, { delay: 30 });
  await active.locator('#chapa').click();
  await active.locator('#chapa').pressSequentially('918260', { delay: 30 });
  await active.keyboard.press('Tab');
  await active.waitForTimeout(2000);

  console.log('3. Avançando para Etapa 2 para capturar Token...');
  await active.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.click();
  });
  await active.waitForTimeout(3500);

  console.log(`Auth Token obtido: ${authToken ? 'SIM (' + authToken.slice(0, 20) + '...)' : 'NÃO'}`);

  // Testar chamada direta à API para Motos 28.000 com pzVendaInicial: 5 e pzVendaFinal: 240
  const headers = {
    'Authorization': authToken,
    'Content-Type': 'application/json'
  };

  console.log('\n--- TESTANDO MOTOS 28K (BEM 2699) COM 50/50 ---');
  const testRes = await fetch('https://api.consorciomagalu.tec.br/AppVendasApi/vendas/grupos-creditos/grupos-disponiveis', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      idProduto: 3,
      idSubProduto: 6,
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

  const testJson = await testRes.json();
  console.log('Resultado Motos 28k 50/50:');
  console.log(JSON.stringify(testJson.data, null, 2));

  // Vamos também verificar se existe o menu "Análise de Grupos" na tela ou na API
  console.log('\n--- VERIFICANDO MENU ANÁLISE DE GRUPOS ---');
  const analiseMenu = active.locator('text="Análise de Grupos"').first();
  const hasAnalise = await analiseMenu.count();
  console.log('Menu Análise de Grupos visível:', hasAnalise > 0);

  if (hasAnalise > 0) {
    await analiseMenu.click();
    await active.waitForTimeout(3000);
    console.log('Navegou para Análise de Grupos, URL atual:', active.url());
    const analiseText = await active.innerText('body');
    fs.writeFileSync('scripts/logs/analise_grupos_text.txt', analiseText);
  }

  fs.writeFileSync('scripts/logs/test_motos_28k.json', JSON.stringify(testJson, null, 2));
  await browser.close();
}

run().catch(e => console.error(e));
