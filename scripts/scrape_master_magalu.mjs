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

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

async function scrapeMaster() {
  console.log('=== RASPAGEM MASTER MAGALU COM PZ 5-240/300 ===');
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

  console.log('1. Autenticando...');
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

  console.log('2. Obtendo token...');
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

  if (!authToken) {
    throw new Error('Não foi possível obter authToken!');
  }
  console.log('AuthToken obtido com sucesso!');

  const headers = {
    'Authorization': authToken,
    'Content-Type': 'application/json'
  };

  const baseUrl = 'https://api.consorciomagalu.tec.br/AppVendasApi';

  const produtosConfig = [
    { idProduto: 1, idSubProduto: 1, segmento: 'AUTOMOVEIS', nomeSimulador: 'automoveis', pzMax: 240 },
    { idProduto: 2, idSubProduto: 20, segmento: 'CAMINHÕES', nomeSimulador: 'pesados', pzMax: 240 },
    { idProduto: 3, idSubProduto: 6, segmento: 'ELETRO', nomeSimulador: 'eletro', pzMax: 240 },
    { idProduto: 4, idSubProduto: 8, segmento: 'IMOVEIS', nomeSimulador: 'imoveis', pzMax: 300 },
    { idProduto: 5, idSubProduto: 9, segmento: 'MOTOCICLETAS', nomeSimulador: 'motos', pzMax: 240 },
    { idProduto: 8, idSubProduto: 12, segmento: 'SERVIÇOS', nomeSimulador: 'servicos', pzMax: 240 }
  ];

  const fullData = {};
  const allGroupsMetadata = {};

  for (const prod of produtosConfig) {
    console.log(`\n========================================`);
    console.log(`Processando Segmento: ${prod.segmento}`);
    console.log(`========================================`);

    // 1. Buscar tipos de venda
    const urlTipos = `${baseUrl}/vendas/detalhes/tipos-venda?IdProduto=${prod.idProduto}&IdSubProduto=${prod.idSubProduto}&SnFuncionario=N&IdEmpresa=1&IdPontoVenda=10933&IdComissionado=191393`;
    const resTipos = await fetch(urlTipos, { headers });
    const dataTipos = await resTipos.json();
    const tipos = (dataTipos.data || []).filter(t => t.snFuncionario !== 'S' && t.idTipoVendaGrupo !== 99999);
    console.log(`Tipos de venda (${tipos.length}):`, tipos.map(t => `${t.idTipoVendaGrupo} - ${t.nmTipoVendaGrupo.trim()}`).join(' | '));

    // Mapa de bens únicos por valor do bem
    // Guarda: credito -> lista de todas as opções de grupos encontradas
    const bensTiersMap = new Map();

    for (const tipo of tipos) {
      // Buscar bens disponíveis com pzVendaInicial: 5 e pzVendaFinal: prod.pzMax
      const resBens = await fetch(`${baseUrl}/vendas/grupos-creditos/bens-disponiveis`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          idProduto: prod.idProduto,
          idSubProduto: prod.idSubProduto,
          idTipoVendaGrupo: tipo.idTipoVendaGrupo,
          pzVendaInicial: 5,
          pzVendaFinal: prod.pzMax,
          idEmpresa: 1,
          idDesconto: 0,
          vlCreditoInicial: 1000,
          vlCreditoFinal: 2500000
        })
      });

      const dataBens = await resBens.json();
      const listaBens = dataBens.data || [];
      console.log(`Tipo ${tipo.idTipoVendaGrupo} (${tipo.nmTipoVendaGrupo.trim()}): ${listaBens.length} bens.`);

      for (const bem of listaBens) {
        // Consultar grupos disponíveis para este bem com pzVendaInicial: 5 e pzVendaFinal: prod.pzMax
        const resGrupos = await fetch(`${baseUrl}/vendas/grupos-creditos/grupos-disponiveis`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            idProduto: prod.idProduto,
            idSubProduto: prod.idSubProduto,
            idTipoVendaGrupo: tipo.idTipoVendaGrupo,
            pzVendaInicial: 5,
            pzVendaFinal: prod.pzMax,
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
          const codGrupo = g.cdGrupo ? String(parseInt(g.cdGrupo, 10)) : String(g.idGrupo);

          // Salvar metadados do grupo se ainda não salvou ou atualizar
          if (!allGroupsMetadata[codGrupo]) {
            allGroupsMetadata[codGrupo] = {
              grupo: codGrupo,
              segmento: prod.segmento,
              tipoVenda: (g.nmTipoVendaGrupo || tipo.nmTipoVendaGrupo).trim(),
              taxaAdm: g.peTaPlano,
              fundoReserva: g.peFrPlano,
              seguro: g.peSG,
              prazoRestante: g.pzRestante_Venda,
              prazoOriginal: g.pzComercializacaoGrupo || g.pzComercializacao,
              proximaAssembleia: formatDate(g.dtAssembleia),
              vencimento: formatDate(g.dtVencimento),
              numeroAssembleia: g.noAssembleia,
              cotasVagas: g.qtCotaVaga,
              status: g.stSituacao === 'F' ? 'Formação' : (g.stSituacao === 'A' ? 'Andamento' : g.stSituacao)
            };
          }

          if (!bensTiersMap.has(bem.vlBem)) {
            bensTiersMap.set(bem.vlBem, []);
          }

          bensTiersMap.get(bem.vlBem).push({
            idBem: bem.idBem,
            cdBem: bem.cdBem,
            nmBem: bem.nmBem,
            credito: bem.vlBem,
            grupo: codGrupo,
            prazoRestante: g.pzRestante_Venda,
            prazoOriginal: g.pzComercializacaoGrupo || g.pzComercializacao,
            taxaAdm: g.peTaPlano,
            fundoReserva: g.peFrPlano,
            seguro: g.peSG,
            parcela: g.vlParcela,
            tipoVendaId: g.idTipoVenda || tipo.idTipoVendaGrupo,
            tipoVendaNome: (g.nmTipoVendaGrupo || tipo.nmTipoVendaGrupo).trim(),
            is5050: /50\/50/i.test(g.nmTipoVendaGrupo || tipo.nmTipoVendaGrupo),
            isPromo: /promoc/i.test(g.nmTipoVendaGrupo || tipo.nmTipoVendaGrupo),
            status: g.stSituacao === 'F' ? 'Formação' : 'Andamento',
            cotasVagas: g.qtCotaVaga,
            proximaAssembleia: formatDate(g.dtAssembleia)
          });
        }
      }
    }

    // Para cada valor de crédito, selecionar a opção com MENOR parcela
    const melhoresPlanos = [];
    for (const [credito, opcoes] of bensTiersMap.entries()) {
      // Filtrar parcelas válidas (> 0)
      const validas = opcoes.filter(o => typeof o.parcela === 'number' && o.parcela > 0);
      if (validas.length > 0) {
        // Ordenar pela menor parcela
        validas.sort((a, b) => a.parcela - b.parcela);
        const melhor = validas[0];
        melhoresPlanos.push(melhor);
      } else if (opcoes.length > 0) {
        // Se todas vieram com parcela 0 (ex: grupo 6035 em imóveis), ordenar por taxa adm
        opcoes.sort((a, b) => a.taxaAdm - b.taxaAdm);
        melhoresPlanos.push(opcoes[0]);
      }
    }

    melhoresPlanos.sort((a, b) => a.credito - b.credito);

    fullData[prod.segmento] = {
      config: prod,
      totalBens: melhoresPlanos.length,
      planos: melhoresPlanos
    };

    console.log(`✅ ${prod.segmento}: ${melhoresPlanos.length} créditos mapeados com a menor parcela.`);
    melhoresPlanos.forEach(p => {
      console.log(`   R$ ${p.credito.toLocaleString('pt-BR')} -> Grupo ${p.grupo} | Prazo ${p.prazoRestante}m | ${p.tipoVendaNome} | Parcela: R$ ${p.parcela?.toFixed(2)} | Tx: ${p.taxaAdm}% | FR: ${p.fundoReserva}% | Ass: ${p.proximaAssembleia}`);
    });
  }

  // Salvar tudo em disco
  fs.writeFileSync('scripts/logs/magalu_master_scraped_matrix.json', JSON.stringify(fullData, null, 2));
  fs.writeFileSync('scripts/logs/magalu_all_groups_metadata.json', JSON.stringify(allGroupsMetadata, null, 2));

  console.log('\n--- EXTRAÇÃO MASTER CONCLUÍDA COM SUCESSO! ---');
  console.log(`Metadados de ${Object.keys(allGroupsMetadata).length} grupos gravados em scripts/logs/magalu_all_groups_metadata.json`);

  await browser.close();
}

scrapeMaster().catch(e => console.error(e));
