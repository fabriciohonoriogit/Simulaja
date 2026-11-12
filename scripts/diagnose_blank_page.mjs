import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';

async function diagnose() {
  console.log('1. Starting vite preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    shell: true,
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => console.log('[Server stdout]', d.toString()));
  server.stderr.on('data', (d) => console.error('[Server stderr]', d.toString()));

  // Wait 6 seconds for server to start
  await new Promise(r => setTimeout(r, 6000));

  console.log('2. Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    console.log(`[Browser Console ${msg.type()}]:`, msg.text());
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('pageerror', err => {
    console.error('[Browser Uncaught PageError]:', err.message);
    consoleErrors.push(err.message + '\n' + err.stack);
  });

  try {
    console.log('Navigating to http://localhost:4173 ...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasRoot: !!root,
        innerHTML: root ? root.innerHTML.slice(0, 300) : '',
        childCount: root ? root.childElementCount : 0
      };
    });

    console.log('\n--- ROOT ELEMENT STATUS ---');
    console.log(JSON.stringify(rootContent, null, 2));

    console.log('\n--- CONSOLE ERRORS DETECTED ---');
    console.log(consoleErrors.length > 0 ? consoleErrors : 'NENHUM ERRO NO CONSOLE!');
  } catch (e) {
    console.error('Erro na navegação:', e.message);
  } finally {
    await browser.close();
    server.kill();
  }
}

diagnose().catch(console.error);
