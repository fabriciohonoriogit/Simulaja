import { chromium } from 'playwright';
import fs from 'fs';

function gerarCPFValido() {
  const rand = (n) => Math.floor(Math.random() * n);
  const n = Array.from({ length: 9 }, () => rand(10));
  let d1 = n.reduce((total, num, i) => total + num * (10 - i), 0);
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  n.push(d1);
  let d2 = n.reduce((total, num, i) => total + num * (11 - i), 0);
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  n.push(d2);
  return n.join('');
}

async function scrapeFullMatrix() {
  console.log('--- INICIANDO RASPAGEM COMPLETA DO PORTAL MAGALU ---');
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

  console.log('2. Inicializando formulário com CPF gerado...');
  const testCpf = gerarCPFValido();
  await active.locator('#documento').click();
  await active.locator('#documento').pressSequentially(testCpf, { delay: 30 });
  await active.locator('#chapa').click();
  await active.locator('#chapa').pressSequentially('918260', { delay: 30 });
  await active.keyboard.press('Tab');
  await active.waitForTimeout(2000);

  console.log('3. Avançando para Etapa 2 para capturar Token de Vendas...');
  await active.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.click();
  });
  await active.waitForTimeout(3500);

  console.log(`Auth Token obtido: ${authToken ? 'SIM (' + authToken.slice(0, 20) + '...)' : 'NÃO'}`);

  // Executar a extração completa de todos os 6 produtos via page.evaluate
  const extractionResult = await active.evaluate(async (token) => {
    const baseUrl = 'https://api.consorciomagalu.tec.br/AppVendasApi';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token
    };

    const produtosConfig = [
      { idProduto: 1, idSubProduto: 1, segmento: 'AUTOMOVEIS', nomeSimulador: 'automoveis' },
      { idProduto: 2, idSubProduto: 20, segmento: 'CAMINHÕES', nomeSimulador: 'pesados' },
      { idProduto: 3, idSubProduto: 6, segmento: 'ELETRO', nomeSimulador: 'eletro' },
      { idProduto: 4, idSubProduto: 8, segmento: 'IMOVEIS', nomeSimulador: 'imoveis' },
      { idProduto: 5, idSubProduto: 9, segmento: 'MOTOCICLETAS', nomeSimulador: 'motos' },
      { idProduto: 8, idSubProduto: 12, segmento: 'SERVIÇOS', nomeSimulador: 'servicos' }
    ];

    const results = {};

    for (const prod of produtosConfig) {
      console.log(`Buscando dados para ${prod.segmento}...`);
      results[prod.segmento] = {
        config: prod,
        tiposVenda: [],
        bens: [],
        matrizPlanos: []
      };

      // 1. Buscar tipos de venda
      const urlTipos = `${baseUrl}/vendas/detalhes/tipos-venda?IdProduto=${prod.idProduto}&IdSubProduto=${prod.idSubProduto}&SnFuncionario=N&IdEmpresa=1&IdPontoVenda=10933&IdComissionado=191393`;
      const resTipos = await fetch(urlTipos, { headers });
      const dataTipos = await resTipos.json();
      const tiposValidos = (dataTipos.data || []).filter(t => t.snFuncionario !== 'S' && t.idTipoVendaGrupo !== 99999);
      results[prod.segmento].tiposVenda = tiposValidos;

      // Ordenar priorizando menor parcela: 50/50 > Promocional > 75/25 > Linear
      const tiposPrioritarios = [...tiposValidos].sort((a, b) => {
        const score = (t) => {
          const nome = (t.nmTipoVendaGrupo || '').toUpperCase();
          if (nome.includes('50/50')) return 1;
          if (nome.includes('PROMOCIONAL')) return 2;
          if (nome.includes('75/25')) return 3;
          if (nome.includes('LINEAR')) return 4;
          return 5;
        };
        return score(a) - score(b);
      });

      console.log(`${prod.segmento}: ${tiposPrioritarios.length} tipos de venda encontrados.`);

      // Mapa de bens já mapeados para o menor plano
      const bensPlanosMap = new Map();

      for (const tipo of tiposPrioritarios) {
        try {
          const resBens = await fetch(`${baseUrl}/vendas/grupos-creditos/bens-disponiveis`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              idProduto: prod.idProduto,
              idSubProduto: prod.idSubProduto,
              idTipoVendaGrupo: tipo.idTipoVendaGrupo,
              pzVendaInicial: tipo.pzMin || 5,
              pzVendaFinal: tipo.pzMax || 240,
              idEmpresa: 1,
              idDesconto: 0,
              vlCreditoInicial: tipo.vlMin || 1000,
              vlCreditoFinal: tipo.vlMax || 1000000
            })
          });

          const dataBens = await resBens.json();
          const listaBens = dataBens.data || [];
          console.log(`  Tipo: ${tipo.nmTipoVendaGrupo.trim()} -> ${listaBens.length} bens disponíveis`);

          for (const bem of listaBens) {
            // Se já temos um plano 50/50 com menor parcela para esse crédito, não precisa sobrescrever com plano linear mais caro
            const existing = bensPlanosMap.get(bem.vlBem);
            if (existing && existing.is5050) continue;

            const resGrupos = await fetch(`${baseUrl}/vendas/grupos-creditos/grupos-disponiveis`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                idProduto: prod.idProduto,
                idSubProduto: prod.idSubProduto,
                idTipoVendaGrupo: tipo.idTipoVendaGrupo,
                pzVendaInicial: tipo.pzMin || 5,
                pzVendaFinal: tipo.pzMax || 240,
                idEmpresa: 1,
                situacao: 'A',
                idBem: bem.idBem,
                idDesconto: 0,
                idFormaPagamentoPP: 'BB',
                tpNegociacao: 'string',
                idPontoVenda: 10933,
                idComissionado: 191393,
                snFuncionario: 'N'
              })
            });

            const dataGrupos = await resGrupos.json();
            const grupos = dataGrupos.data || [];

            for (const g of grupos) {
              const currentBest = bensPlanosMap.get(bem.vlBem);
              if (!currentBest || g.vlParcela < currentBest.menorParcela) {
                bensPlanosMap.set(bem.vlBem, {
                  idBem: bem.idBem,
                  cdBem: bem.cdBem,
                  nmBem: bem.nmBem,
                  credito: g.vlBem || bem.vlBem,
                  grupo: g.cdGrupo ? String(parseInt(g.cdGrupo, 10)) : String(g.idGrupo),
                  prazoOriginal: g.pzComercializacaoGrupo || g.pzComercializacao,
                  prazoRestante: g.pzRestante_Venda || g.pzComercializacao,
                  taxaAdm: g.peTaPlano,
                  fundoReserva: g.peFrPlano,
                  seguro: g.peSG,
                  menorParcela: g.vlParcela,
                  tipoVendaId: g.idTipoVenda || tipo.idTipoVendaGrupo,
                  tipoVendaNome: (g.nmTipoVendaGrupo || tipo.nmTipoVendaGrupo).trim(),
                  is5050: /50\/50/i.test(g.nmTipoVendaGrupo || tipo.nmTipoVendaGrupo),
                  isPromo: /promoc/i.test(g.nmTipoVendaGrupo || tipo.nmTipoVendaGrupo),
                  statusGrupo: g.stSituacao,
                  cotasVagas: g.qtCotaVaga
                });
              }
            }
          }
        } catch (err) {
          console.error(`Erro ao consultar tipo ${tipo.nmTipoVendaGrupo}:`, err.message);
        }
      }

      results[prod.segmento].matrizPlanos = Array.from(bensPlanosMap.values())
        .sort((a, b) => a.credito - b.credito);
      console.log(`✅ ${prod.segmento}: ${results[prod.segmento].matrizPlanos.length} planos com menor parcela consolidados.`);
    }

    return results;
  }, authToken);

  console.log('\n--- EXTRAÇÃO FINALIZADA ---');
  for (const seg in extractionResult) {
    const data = extractionResult[seg];
    console.log(`Segmento ${seg}: ${data.matrizPlanos.length} planos encontrados.`);
  }

  fs.writeFileSync('scripts/logs/magalu_scraped_matrix_completa.json', JSON.stringify(extractionResult, null, 2));
  console.log('Matriz completa gravada em scripts/logs/magalu_scraped_matrix_completa.json!');

  await browser.close();
}

scrapeFullMatrix().catch(e => console.error(e));
