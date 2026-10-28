import { chromium } from 'playwright';
import fs from 'fs';

async function inspectPortal() {
  console.log('--- Conectando ao Portal Magalu ---');
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

  await active.waitForSelector('input[name="cpfCnpj"], input[placeholder*="CPF"]', { timeout: 20000 });
  await active.evaluate(() => {
    document.querySelector('button[type="submit"]')?.click();
  });
  await active.waitForTimeout(3000);

  console.log('Token obtido:', !!authToken);
  if (!authToken) {
    throw new Error('Sem token');
  }

  const headers = {
    'Authorization': authToken,
    'Content-Type': 'application/json'
  };

  const baseUrl = 'https://api.consorciomagalu.tec.br/AppVendasApi';

  // 1. Tipos de venda para Imóveis (idProduto: 4, idSubProduto: 8)
  const resTipos = await fetch(`${baseUrl}/vendas/detalhes/tipos-venda?IdProduto=4&IdSubProduto=8&SnFuncionario=N&IdEmpresa=1&IdPontoVenda=10933&IdComissionado=191393`, { headers });
  const dataTipos = await resTipos.json();
  console.log('Tipos de venda Imóveis:', dataTipos.data.map(t => `${t.idTipoVendaGrupo}: ${t.nmTipoVendaGrupo.trim()}`));

  // 2. Buscar bens para cada tipo de venda
  const todosBens = {};

  for (const t of dataTipos.data) {
    if (t.snFuncionario === 'S' || t.idTipoVendaGrupo === 99999) continue;

    const resBens = await fetch(`${baseUrl}/vendas/grupos-creditos/bens-disponiveis`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        idProduto: 4,
        idSubProduto: 8,
        idTipoVendaGrupo: t.idTipoVendaGrupo,
        pzVendaInicial: 5,
        pzVendaFinal: 300,
        idEmpresa: 1,
        idDesconto: 0,
        vlCreditoInicial: 100000,
        vlCreditoFinal: 800000
      })
    });
    const bensData = await resBens.json();
    const listaBens = bensData.data || [];
    console.log(`Tipo ${t.idTipoVendaGrupo} (${t.nmTipoVendaGrupo.trim()}): ${listaBens.length} bens encontrados.`);

    for (const b of listaBens) {
      if (!todosBens[b.vlBem]) todosBens[b.vlBem] = [];

      // Consultar grupos disponíveis
      const resGrupos = await fetch(`${baseUrl}/vendas/grupos-creditos/grupos-disponiveis`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          idProduto: 4,
          idSubProduto: 8,
          idTipoVendaGrupo: t.idTipoVendaGrupo,
          pzVendaInicial: 5,
          pzVendaFinal: 300,
          idEmpresa: 1,
          situacao: 'A',
          idBem: b.idBem,
          idDesconto: 0,
          idFormaPagamentoPP: 'BB',
          tpNegociacao: 'string',
          idPontoVenda: 10933,
          idComissionado: 191393,
          snFuncionario: 'N'
        })
      });
      const gData = await resGrupos.json();
      const grupos = gData.data || [];

      for (const g of grupos) {
        todosBens[b.vlBem].push({
          credito: b.vlBem,
          idBem: b.idBem,
          grupo: g.cdGrupo ? String(parseInt(g.cdGrupo, 10)) : String(g.idGrupo),
          tipoVendaId: t.idTipoVendaGrupo,
          tipoVendaNome: (g.nmTipoVendaGrupo || t.nmTipoVendaGrupo).trim(),
          prazoRestante: g.pzRestante_Venda,
          taxaAdm: g.peTaPlano,
          fundoReserva: g.peFrPlano,
          seguro: g.peSG,
          vlParcela: g.vlParcela,
          fullGrupo: g
        });
      }
    }
  }

  fs.writeFileSync('scripts/logs/imoveis_all_scraped_options.json', JSON.stringify(todosBens, null, 2));
  console.log('Salvo em scripts/logs/imoveis_all_scraped_options.json com sucesso!');

  await browser.close();
}

inspectPortal().catch(console.error);
