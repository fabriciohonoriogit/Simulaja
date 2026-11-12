import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const env = {
  portalUrl: 'https://portal.consorciomagalu.com.br/portal-consorcio/login',
  filial: '10826',
  chapa: '918260',
  senha: 'Magalu5177*'
};

async function inspectAllMenus() {
  console.log('--- INSPECTION OF PORTAL MAGALU MENUS & REPORTS ---');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('1. Logging in...');
  await page.goto(env.portalUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);

  await page.getByPlaceholder('Filial').first().fill(env.filial);
  await page.getByPlaceholder('Chapa').first().fill(env.chapa);
  await page.getByPlaceholder('Senha').first().fill(env.senha);
  await page.getByRole('button', { name: 'Acessar portal' }).first().click();

  await page.waitForTimeout(5000);
  console.log('Logged into main portal. Current URL:', page.url());

  // Dump all links & buttons from the main portal homepage
  const mainPortalLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button')).map(el => ({
      tag: el.tagName,
      text: el.innerText.trim().replace(/\s+/g, ' '),
      href: el.getAttribute('href') || ''
    })).filter(x => x.text.length > 2);
  });
  console.log('\n--- MAIN PORTAL LINKS/BUTTONS ---');
  console.log(JSON.stringify(mainPortalLinks, null, 2));

  // Now open Newcon
  console.log('\n2. Opening Newcon...');
  const centerBtn = page.locator('text="Atendimento"').nth(1);
  const [newconPage] = await Promise.all([
    context.waitForEvent('page', { timeout: 35000 }),
    centerBtn.click()
  ]);

  await newconPage.waitForLoadState('networkidle').catch(() => {});
  await newconPage.waitForTimeout(3000);

  console.log('Newcon opened. Current URL:', newconPage.url());

  // Let's inspect Newcon top menu or sidebar menus:
  // In Newcon, there is frmMainMenu.aspx or top navigation
  const newconMenus = await newconPage.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.innerText.trim().replace(/\s+/g, ' '),
      href: a.href
    })).filter(x => x.text.length > 2);
  });
  console.log('\n--- NEWCON INITIAL MENUS ---');
  console.log(JSON.stringify(newconMenus, null, 2));

  // Let's also check if there is a menu for Relatórios / Cobrança / Carteira
  // Check modules in Newcon: ID_Modulo=CO (Cobrança), ID_Modulo=VE (Vendas), ID_Modulo=AT (Atendimento)
  const modules = [
    'https://newcon.consorciomagalu.tec.br/Newcon.Intranet/frmMainMenu.aspx?ID_Modulo=CO&ID_SubGrupo=CO&ID_Empresa=1',
    'https://newcon.consorciomagalu.tec.br/Newcon.Intranet/frmMainMenu.aspx?ID_Modulo=VE&ID_SubGrupo=VE&ID_Empresa=1',
    'https://newcon.consorciomagalu.tec.br/Newcon.Intranet/frmMainMenu.aspx?ID_Modulo=AT&ID_SubGrupo=AT&ID_Empresa=1'
  ];

  for (const mUrl of modules) {
    console.log(`\nVisiting Newcon module: ${mUrl}`);
    await newconPage.goto(mUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await newconPage.waitForTimeout(2000);
    const subLinks = await newconPage.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText.trim().replace(/\s+/g, ' '),
        href: a.href
      })).filter(x => x.text.length > 2);
    });
    console.log(`Module links count: ${subLinks.length}`);
    console.log(JSON.stringify(subLinks, null, 2));
  }

  await browser.close();
}

inspectAllMenus().catch(console.error);
