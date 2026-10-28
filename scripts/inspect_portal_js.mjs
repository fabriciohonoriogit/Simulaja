import { chromium } from 'playwright';
import fs from 'fs';

async function inspectJs() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  const page = await browser.newPage();

  const jsFiles = [];
  page.on('response', async (res) => {
    if (res.url().endsWith('.js') || res.url().includes('/static/js/') || res.url().includes('main.') || res.url().includes('chunk.')) {
      try {
        const text = await res.text();
        jsFiles.push({ url: res.url(), length: text.length, text });
      } catch (e) {}
    }
  });

  await page.goto('https://portal.consorciomagalu.com.br/portal-consorcio/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#filial', '10826');
  await page.fill('#usuario', '918260');
  await page.fill('#senha', 'Magalu5177*');
  await page.click('button:has-text("Entrar")');
  await page.waitForTimeout(3000);

  // Ir para registro de vendas
  await page.goto('https://portal.consorciomagalu.com.br/registro-de-vendas/etapa-4', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(3000);

  console.log(`Encontrados ${jsFiles.length} arquivos JS.`);
  for (const js of jsFiles) {
    console.log(`- ${js.url} (${js.length} bytes)`);
    if (js.text.includes('dtAssembleia') || js.text.includes('peTaPlano') || js.text.includes('qtCotaVaga')) {
      console.log(`  -> Contém termos de grupo! Buscando rotas de API...`);
      const matches = js.text.match(/["'](\/[a-zA-Z0-9_\-\/]+)["']/g) || [];
      const apiMatches = matches.filter(m => m.includes('vendas') || m.includes('grupo') || m.includes('assembleia') || m.includes('lance') || m.includes('caracteristica'));
      console.log(`  -> Endpoints encontrados:`, [...new Set(apiMatches)].slice(0, 30));
    }
  }

  await browser.close();
}

inspectJs().catch(e => console.error(e));
