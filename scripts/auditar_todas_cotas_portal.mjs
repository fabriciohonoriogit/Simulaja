/**
 * ==============================================================================
 * SIMULAJÁ CRM • JARVIS MOTOR DE AUDITORIA REAL VIA PLAYWRIGHT NO PORTAL MAGALU
 * ==============================================================================
 * Raspa 1 a 1 todas as cotas no Portal Newcon oficial.
 * Regra:
 * - Apenas inclui parcelas com vencimento expirado (< hoje) ou com multa/juros > 0.
 * - Cotas com parcelas apenas de meses futuros (ex: 23/11/2026) são marcadas como ADIMPLENTES.
 * ==============================================================================
 */

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
  supabaseUrl: env.VITE_SUPABASE_URL || 'https://pfedvdqpnpbrlhfbzjcj.supabase.co',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || ''
};

function log(msg) {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${now}] ${msg}`);
}

const COTAS_ALVO = [
  { grupo: '005294', cota: '0565', nome: 'SUELI' },
  { grupo: '006041', cota: '0123', nome: 'EMILY OLIVEIRA DA LUZ' },
  { grupo: '005292', cota: '2258', nome: 'LETICIA MULLER DA VEIGA' },
  { grupo: '005297', cota: '1541', nome: 'DOROTI KRAUSE' },
  { grupo: '005297', cota: '1542', nome: 'DOROTI KRAUSE' },
  { grupo: '006043', cota: '3221', nome: 'ANGELO LEONARDO ANGHIEVISKI BASSANI' },
  { grupo: '005292', cota: '2010', nome: 'MARLLON CORREA DA SILVA BELLO' },
  { grupo: '005296', cota: '0747', nome: 'ANA ROBERTA ALVES CORDEIRO PINTO' },
  { grupo: '006041', cota: '0552', nome: 'NICOLY FLORENCIO YASUDA' }
];

async function executarAuditoriaGeral() {
  log('==============================================================================');
  log('   INICIANDO AUDITORIA REAL VIA PLAYWRIGHT NO PORTAL CONSÓRCIO MAGALU');
  log(`   TOTAL DE COTAS ALVO: ${COTAS_ALVO.length}`);
  log('==============================================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    log(`1. Efetuando login em ${CONFIG.portalUrl}...`);
    await page.goto(CONFIG.portalUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1500);

    await page.getByPlaceholder('Filial').first().fill(CONFIG.filial);
    await page.getByPlaceholder('Chapa').first().fill(CONFIG.chapa);
    await page.getByPlaceholder('Senha').first().fill(CONFIG.senha);
    await page.getByRole('button', { name: 'Acessar portal' }).first().click();

    log('2. Aguardando Newcon abrir...');
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

    const resultados = [];

    for (const c of COTAS_ALVO) {
      log(`------------------------------------------------------------------------------`);
      log(`Auditando [${resultados.length + 1}/${COTAS_ALVO.length}]: ${c.nome} (G: ${c.grupo} / C: ${c.cota})...`);

      try {
        await newconPage.goto('https://newcon.consorciomagalu.tec.br/Newcon.Intranet/CONAT/frmConAtSrcConsorciado.aspx?cd=15000', { waitUntil: 'domcontentloaded' }).catch(() => {});
        const inputGrupo = newconPage.locator('#ctl00_Conteudo_edtGrupo');
        await inputGrupo.waitFor({ state: 'visible', timeout: 25000 });

        const cleanG = String(c.grupo).replace(/\D/g, '').padStart(6, '0');
        const cleanC = String(c.cota).split('-')[0].split('/')[0].replace(/\D/g, '').padStart(4, '0');

        await newconPage.locator('#ctl00_Conteudo_edtGrupo').fill(cleanG);
        await newconPage.locator('#ctl00_Conteudo_edtCota').fill(cleanC);
        await newconPage.locator('#ctl00_Conteudo_btnLocalizar').click();
        await newconPage.waitForLoadState('networkidle').catch(() => {});
        await newconPage.waitForTimeout(2500);

        // Se houver link com o nome do cliente na busca, clica
        const clientLink = newconPage.locator(`a:has-text("${cleanC}"), a:has-text("${cleanG}")`).first();
        if (await clientLink.isVisible().catch(() => false)) {
          await clientLink.click();
          await newconPage.waitForLoadState('networkidle').catch(() => {});
          await newconPage.waitForTimeout(2000);
        }

        // Vai para Emissão de Cobrança
        const linkEmissao = newconPage.locator('#ctl00_Conteudo_Menu_CONAT_grdMenu_CONAT_ctl04_hlkFormulario, #ctl00_Conteudo_Menu_CONAT1_grdMenu_CONAT_ctl04_hlkFormulario, a[href*="frmConCoRelBoletoAvulso.aspx"]').first();
        if (await linkEmissao.isVisible().catch(() => false)) {
          await linkEmissao.click();
        } else {
          await newconPage.goto('https://newcon.consorciomagalu.tec.br/Newcon.Intranet/CONCO/frmConCoRelBoletoAvulso.aspx', { waitUntil: 'domcontentloaded' }).catch(() => {});
        }

        await newconPage.waitForLoadState('networkidle').catch(() => {});
        await newconPage.waitForTimeout(3000);

        // Inspeciona tabela de pendências
        const parcelas = await newconPage.evaluate(() => {
          const table = document.querySelector('#ctl00_Conteudo_grdBoleto_Avulso');
          if (!table) return [];
          const rows = Array.from(table.querySelectorAll('tr'));
          return rows.map((tr, index) => {
            const tds = Array.from(tr.querySelectorAll('td'));
            if (tds.length < 8) return null;
            const img = tr.querySelector('input[type="image"][id*="imgEmite_Boleto"], input[type="checkbox"]');
            const cota = tds[1]?.innerText?.trim() || '';
            const pcl = tds[2]?.innerText?.trim() || '';
            const historico = tds[3]?.innerText?.trim() || '';
            const vencimento = tds[4]?.innerText?.trim() || '';
            const valStr = tds[5]?.innerText?.trim() || '0,00';
            const multaStr = tds[6]?.innerText?.trim() || '0,00';
            const jurosStr = tds[7]?.innerText?.trim() || '0,00';
            const vlDevidoStr = tds[8]?.innerText?.trim() || '0,00';

            const parseNum = (s) => parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;

            return {
              rowIndex: index,
              checkboxId: img ? img.id : null,
              cota,
              pcl,
              historico,
              vencimento,
              valor: parseNum(valStr),
              multa: parseNum(multaStr),
              juros: parseNum(jurosStr),
              vlDevido: parseNum(vlDevidoStr)
            };
          }).filter(Boolean);
        });

        function parseDataBR(dataStr) {
          if (!dataStr) return null;
          const parts = dataStr.trim().split('/');
          if (parts.length !== 3) return null;
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 23, 59, 59);
        }

        const parcelasAtrasadas = parcelas.filter(p => {
          const dt = parseDataBR(p.vencimento);
          const estaVencida = dt && dt.getTime() < Date.now();
          const temEncargos = p.multa > 0 || p.juros > 0;
          return estaVencida || temEncargos;
        });

        if (parcelasAtrasadas.length === 0) {
          const proxVenc = parcelas[0]?.vencimento || 'Mês futuro';
          log(`   ✔️ REGULARIZADO / ADIMPLENTE: Nenhuma parcela vencida. Próxima: ${proxVenc}.`);
          resultados.push({
            nome: c.nome,
            grupo: cleanG,
            cota: cleanC,
            temPendencia: false,
            adimplente: true,
            status: 'regularizado',
            proximoVencimento: proxVenc,
            valorDevido: 0,
            linhaDigitavel: null
          });
        } else {
          const target = parcelasAtrasadas.find(p => p.pcl !== 'DIF') || parcelasAtrasadas[0];
          log(`   ⚠️ INADIMPLENTE CONFIRMADO: Pcl ${target.pcl} vencida em ${target.vencimento} no valor de R$ ${target.vlDevido}`);

          if (target.checkboxId) {
            await newconPage.locator(`#${target.checkboxId}`).click();
          } else {
            const imgCheckboxes = newconPage.locator('#ctl00_Conteudo_grdBoleto_Avulso input[type="image"][id*="imgEmite_Boleto"]');
            await imgCheckboxes.nth(target.rowIndex).click();
          }
          await newconPage.waitForLoadState('networkidle').catch(() => {});
          await newconPage.waitForTimeout(2000);

          await newconPage.locator('#ctl00_Conteudo_btnFormLinhaDigitavel').click();
          await newconPage.waitForLoadState('networkidle').catch(() => {});
          await newconPage.waitForTimeout(3000);

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

          if (!linhaDigitavelOficial) {
            const bodyText = await newconPage.textContent('body');
            const match = bodyText.match(/03399\.\d{5}\s+\d{5}\.\d{6}\s+\d{5}\.\d{6}\s+\d\s+\d{14}/);
            if (match) linhaDigitavelOficial = match[0].trim();
          }

          const valorFinal = valorRecalculado || target.vlDevido;
          log(`   Linha Digitável Oficial: ${linhaDigitavelOficial || 'Não capturada'} | Valor: R$ ${valorFinal}`);

          resultados.push({
            nome: c.nome,
            grupo: cleanG,
            cota: cleanC,
            temPendencia: true,
            adimplente: false,
            status: 'em_atraso',
            parcela: target.pcl,
            vencimento: target.vencimento,
            valorDevido: valorFinal,
            linhaDigitavel: linhaDigitavelOficial
          });
        }
      } catch (cotaErr) {
        log(`   Erro ao auditar cota ${c.grupo}/${c.cota}: ${cotaErr.message}`);
      }
    }

    await browser.close();

    log('==============================================================================');
    log('   RESULTADO CONSOLIDADO DA AUDITORIA REAL VIA PORTAL MAGALU');
    log('==============================================================================');
    const inadimplentes = resultados.filter(r => r.temPendencia);
    const adimplentes = resultados.filter(r => !r.temPendencia);
    log(`Total Auditados: ${resultados.length}`);
    log(`Adimplentes (Quitados/Em dia): ${adimplentes.length} (${adimplentes.map(a => a.nome).join(', ')})`);
    log(`Inadimplentes Reais: ${inadimplentes.length} (${inadimplentes.map(i => `${i.nome} - R$ ${i.valorDevido}`).join(', ')})`);

    const jsonPath = path.join(__dirname, 'logs', `auditoria_real_portal_${new Date().toISOString().slice(0, 10)}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(resultados, null, 2), 'utf-8');
    log(`Relatório salvo em: ${jsonPath}`);

    return resultados;
  } catch (err) {
    log(`Erro fatal na auditoria: ${err.message}`);
    await browser.close().catch(() => {});
    throw err;
  }
}

executarAuditoriaGeral().catch(console.error);
