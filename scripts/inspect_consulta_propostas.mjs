import { chromium } from 'playwright';
import fs from 'fs';

const env = {
  portalUrl: 'https://portal.consorciomagalu.com.br/portal-consorcio/login',
  filial: '10826',
  chapa: '918260',
  senha: 'Magalu5177*'
};

async function inspectConsultaPropostas() {
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

  console.log('Navigating to Consulta de Propostas (FrmConPvRelAnaliseCadastral.aspx)...');
  await newconPage.goto('https://newcon.consorciomagalu.tec.br/Newcon.Intranet/CONPV/FrmConPvRelAnaliseCadastral.aspx?cd=13035');
  await newconPage.waitForLoadState('networkidle').catch(() => {});
  await newconPage.waitForTimeout(3000);

  const inputs = await newconPage.evaluate(() => {
    return Array.from(document.querySelectorAll('input, select, button')).map(el => ({
      id: el.id,
      name: el.getAttribute('name'),
      type: el.getAttribute('type') || el.tagName,
      value: el.value || '',
      placeholder: el.getAttribute('placeholder') || ''
    }));
  });
  console.log('Inputs on Consulta de Propostas:', JSON.stringify(inputs.filter(i => i.id), null, 2));

  await browser.close();
}

inspectConsultaPropostas().catch(console.error);
