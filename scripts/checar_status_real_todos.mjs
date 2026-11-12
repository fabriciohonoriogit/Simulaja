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
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[trimmed.slice(0, eqIdx).trim()] = val;
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
  senha: env.MAGALU_SENHA || 'Magalu5177*'
};

const CLIENTES = [
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

async function run() {
  console.log('--- INICIANDO VERIFICAÇÃO DIRETA NO PORTAL NEWCON ---');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('1. Efetuando login...');
  await page.goto(CONFIG.portalUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);

  await page.getByPlaceholder('Filial').first().fill(CONFIG.filial);
  await page.getByPlaceholder('Chapa').first().fill(CONFIG.chapa);
  await page.getByPlaceholder('Senha').first().fill(CONFIG.senha);
  await page.getByRole('button', { name: 'Acessar portal' }).first().click();

  const centerBtn = page.locator('text="Atendimento"').nth(1);
  await centerBtn.waitFor({ state: 'visible', timeout: 35000 });

  const [newconPage] = await Promise.all([
    context.waitForEvent('page', { timeout: 35000 }),
    centerBtn.click()
  ]);

  newconPage.on('dialog', async d => {
    await d.accept().catch(() => {});
  });

  await newconPage.waitForLoadState('networkidle').catch(() => {});
  await newconPage.waitForTimeout(2000);

  const dadosConsolidados = [];

  for (const c of CLIENTES) {
    console.log(`\nConsultando ${c.nome} (G: ${c.grupo} / C: ${c.cota})...`);
    try {
      await newconPage.goto('https://newcon.consorciomagalu.tec.br/Newcon.Intranet/CONAT/frmConAtSrcConsorciado.aspx?cd=15000', { waitUntil: 'domcontentloaded' });
      await newconPage.locator('#ctl00_Conteudo_edtGrupo').waitFor({ state: 'visible', timeout: 20000 });

      const cleanG = String(c.grupo).replace(/\D/g, '').padStart(6, '0');
      const cleanC = String(c.cota).split('-')[0].split('/')[0].replace(/\D/g, '').padStart(4, '0');

      await newconPage.locator('#ctl00_Conteudo_edtGrupo').fill(cleanG);
      await newconPage.locator('#ctl00_Conteudo_edtCota').fill(cleanC);
      await newconPage.locator('#ctl00_Conteudo_btnLocalizar').click();
      await newconPage.waitForLoadState('networkidle').catch(() => {});
      await newconPage.waitForTimeout(1500);

      const clientLink = newconPage.locator(`a:has-text("${cleanC}"), a:has-text("${cleanG}")`).first();
      if (await clientLink.isVisible().catch(() => false)) {
        await clientLink.click();
        await newconPage.waitForLoadState('networkidle').catch(() => {});
        await newconPage.waitForTimeout(1500);
      }

      // Vai para Emissão de Cobrança
      const linkEmissao = newconPage.locator('#ctl00_Conteudo_Menu_CONAT_grdMenu_CONAT_ctl04_hlkFormulario, #ctl00_Conteudo_Menu_CONAT1_grdMenu_CONAT_ctl04_hlkFormulario, a[href*="frmConCoRelBoletoAvulso.aspx"]').first();
      if (await linkEmissao.isVisible().catch(() => false)) {
        await linkEmissao.click();
      } else {
        await newconPage.goto('https://newcon.consorciomagalu.tec.br/Newcon.Intranet/CONCO/frmConCoRelBoletoAvulso.aspx', { waitUntil: 'domcontentloaded' }).catch(() => {});
      }

      await newconPage.waitForLoadState('networkidle').catch(() => {});
      await newconPage.waitForTimeout(2000);

      const pendencias = await newconPage.evaluate(() => {
        const table = document.querySelector('#ctl00_Conteudo_grdBoleto_Avulso');
        if (!table) return [];
        const rows = Array.from(table.querySelectorAll('tr'));
        return rows.map(tr => {
          const tds = Array.from(tr.querySelectorAll('td'));
          if (tds.length < 8) return null;
          return {
            cota: tds[1]?.innerText?.trim() || '',
            pcl: tds[2]?.innerText?.trim() || '',
            historico: tds[3]?.innerText?.trim() || '',
            vencimento: tds[4]?.innerText?.trim() || '',
            valor: tds[5]?.innerText?.trim() || '0,00',
            multa: tds[6]?.innerText?.trim() || '0,00',
            juros: tds[7]?.innerText?.trim() || '0,00',
            vlDevido: tds[8]?.innerText?.trim() || '0,00'
          };
        }).filter(Boolean);
      });

      console.log(`   Parcelas em aberto no portal: ${pendencias.length}`);
      for (const p of pendencias) {
        console.log(`   -> Pcl ${p.pcl} | Venc: ${p.vencimento} | R$ ${p.vlDevido} (${p.historico})`);
      }

      // Analisa quem pagou novembro vs quem tem novembro ou atrasos
      const parcelasNormal = pendencias.filter(p => p.pcl !== 'DIF');
      const temParcelaNovembro = parcelasNormal.some(p => p.vencimento.includes('/11/2026') || p.vencimento.includes('/11/26'));
      const parcelasAtrasadas = parcelasNormal.filter(p => {
        const parts = p.vencimento.split('/');
        if (parts.length === 3) {
          const dt = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          return dt.getTime() < new Date(2026, 10, 1).getTime(); // Antes de 01/11/2026
        }
        return false;
      });

      dadosConsolidados.push({
        nome: c.nome,
        grupo: cleanG,
        cota: cleanC,
        totalPendenciasAbertas: pendencias.length,
        pendencias,
        temParcelaNovembro,
        parcelasAtrasadas: parcelasAtrasadas.map(p => `${p.pcl} (${p.vencimento})`),
        // Se NÃO tem parcela normal de novembro na lista de boletos em aberto (ou só DIF minúsculo), significa que a parcela normal de novembro já foi liquidada ou está adimplente
        pagouNovembroNormal: !temParcelaNovembro
      });

    } catch (err) {
      console.log(`   Erro ao consultar: ${err.message}`);
    }
  }

  await browser.close();

  const outJson = path.join(__dirname, 'logs', `status_pagamentos_real_${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(outJson, JSON.stringify(dadosConsolidados, null, 2), 'utf-8');
  console.log(`\nSalvo em: ${outJson}`);
}

run().catch(console.error);

