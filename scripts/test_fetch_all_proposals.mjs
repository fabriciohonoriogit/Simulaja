import { chromium } from 'playwright';
import fs from 'fs';

const env = {
  portalUrl: 'https://portal.consorciomagalu.com.br/portal-consorcio/login',
  filial: '10826',
  chapa: '918260',
  senha: 'Magalu5177*'
};

async function testFetchAllProposals() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  await page.goto(env.portalUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);

  await page.getByPlaceholder('Filial').first().fill(env.filial);
  await page.getByPlaceholder('Chapa').first().fill(env.chapa);
  await page.getByPlaceholder('Senha').first().fill(env.senha);
  await page.getByRole('button', { name: 'Acessar portal' }).first().click();

  const centerBtn = page.locator('text="Atendimento"').nth(1);
  const [newconPage] = await Promise.all([
    context.waitForEvent('page', { timeout: 35000 }),
    centerBtn.click()
  ]);

  await newconPage.waitForLoadState('networkidle').catch(() => {});
  await newconPage.waitForTimeout(2000);

  console.log('Navigating to FrmConPvRelAnaliseCadastral.aspx...');
  await newconPage.goto('https://newcon.consorciomagalu.tec.br/Newcon.Intranet/CONPV/FrmConPvRelAnaliseCadastral.aspx?cd=13035');
  await newconPage.waitForLoadState('networkidle').catch(() => {});
  await newconPage.waitForTimeout(2000);

  // Set dates wide or check cbxTodas
  console.log('Clicking btnSelecionar or btnImprimir...');
  // Radio button for Tela/Excel: rblImpressao_1 (E) or rblImpressao_0 (P)
  await newconPage.locator('#ctl00_Conteudo_btnSelecionar').click();
  await newconPage.waitForLoadState('networkidle').catch(() => {});
  await newconPage.waitForTimeout(4000);

  await newconPage.screenshot({ path: 'scripts/logs/resultado_consulta_propostas.png' });
  const html = await newconPage.content();
  fs.writeFileSync('scripts/logs/resultado_consulta_propostas.html', html, 'utf-8');

  // Check if a table appeared
  const tables = await newconPage.evaluate(() => {
    return Array.from(document.querySelectorAll('table')).map(t => ({
      id: t.id,
      className: t.className,
      rowsCount: t.querySelectorAll('tr').length,
      sampleText: t.innerText.slice(0, 300).replace(/\s+/g, ' ')
    }));
  });
  console.log('Tables found:', JSON.stringify(tables, null, 2));

  await browser.close();
}

testFetchAllProposals().catch(console.error);
