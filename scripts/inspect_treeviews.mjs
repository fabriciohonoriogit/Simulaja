import { chromium } from 'playwright';
import fs from 'fs';

const env = {
  portalUrl: 'https://portal.consorciomagalu.com.br/portal-consorcio/login',
  filial: '10826',
  chapa: '918260',
  senha: 'Magalu5177*'
};

async function inspectSubmenus() {
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

  const targets = [
    { name: 'Venda de Proposta', url: 'https://newcon.consorciomagalu.tec.br/Newcon.Intranet/frmMainMenu.aspx?ID_Modulo=VE&ID_SubGrupo=VP&ID_Empresa=1' },
    { name: 'Comissão', url: 'https://newcon.consorciomagalu.tec.br/Newcon.Intranet/frmMainMenu.aspx?ID_Modulo=VE&ID_SubGrupo=CM&ID_Empresa=1' },
    { name: 'Retenção/Recuperação', url: 'https://newcon.consorciomagalu.tec.br/Newcon.Intranet/frmMainMenu.aspx?ID_Modulo=CO&ID_SubGrupo=RA&ID_Empresa=1' },
    { name: 'Relatório de Grupo', url: 'https://newcon.consorciomagalu.tec.br/Newcon.Intranet/frmMainMenu.aspx?ID_Modulo=GR&ID_SubGrupo=RE&ID_Empresa=1' }
  ];

  for (const t of targets) {
    console.log(`\n=== Target: ${t.name} ===`);
    await newconPage.goto(t.url, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await newconPage.waitForTimeout(2000);

    const items = await newconPage.evaluate(() => {
      // Look inside ctl00_Conteudo_ctl00_tvwMenu or any treeview
      const tree = document.querySelector('div[id*="tvwMenu"], table[id*="tvwMenu"]');
      if (!tree) return [];
      return Array.from(tree.querySelectorAll('a')).map(a => ({
        text: a.innerText.trim(),
        href: a.href
      })).filter(x => x.text);
    });
    console.log(`Menu items (${items.length}):`, JSON.stringify(items, null, 2));
  }

  await browser.close();
}

inspectSubmenus().catch(console.error);
