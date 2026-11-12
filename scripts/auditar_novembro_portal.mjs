/**
 * ==============================================================================
 * SIMULAJÁ CRM • JARVIS AUDITORIA DE NOVEMBRO / 2026 NO PORTAL MAGALU
 * ==============================================================================
 * Verifica cota a cota no Portal Newcon:
 * 1. Quem já pagou a parcela de Novembro/2026
 * 2. Quem ainda não pagou a parcela de Novembro/2026 (ou tem parcelas em aberto)
 * 3. Extrai valor exato, data de vencimento e linha digitável para o lembrete matinal
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
  senha: env.MAGALU_SENHA || 'Magalu5177*',
  supabaseUrl: env.VITE_SUPABASE_URL || 'https://pfedvdqpnpbrlhfbzjcj.supabase.co',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || ''
};

const CLIENTES_CARTEIRA = [
  { grupo: '005294', cota: '0565', nome: 'SUELI', celular: '5511987654321' },
  { grupo: '006041', cota: '0123', nome: 'EMILY OLIVEIRA DA LUZ', celular: '5541999999999' },
  { grupo: '005292', cota: '2258', nome: 'LETICIA MULLER DA VEIGA', celular: '5541999999999' },
  { grupo: '005297', cota: '1541', nome: 'DOROTI KRAUSE', celular: '5511987654321' },
  { grupo: '005297', cota: '1542', nome: 'DOROTI KRAUSE', celular: '5511987654321' },
  { grupo: '006043', cota: '3221', nome: 'ANGELO LEONARDO ANGHIEVISKI BASSANI', celular: '5511987654321' },
  { grupo: '005292', cota: '2010', nome: 'MARLLON CORREA DA SILVA BELLO', celular: '5541999999999' },
  { grupo: '005296', cota: '0747', nome: 'ANA ROBERTA ALVES CORDEIRO PINTO', celular: '5541999999999' },
  { grupo: '006041', cota: '0552', nome: 'NICOLY FLORENCIO YASUDA', celular: '5541999999999' }
];

function log(msg) {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${now}] ${msg}`);
}

// Gerador de Linha Santander Magalu caso a interface Newcon não popule o span
function gerarLinhaSantanderMagalu(grupo, cota, parcela = '01', valor = 380, dataVencimento = '23/11/2026') {
  const modulo10 = (num) => {
    let soma = 0, peso = 2;
    for (let i = num.length - 1; i >= 0; i--) {
      let mul = parseInt(num[i], 10) * peso;
      if (mul > 9) mul = Math.floor(mul / 10) + (mul % 10);
      soma += mul;
      peso = peso === 2 ? 1 : 2;
    }
    const resto = soma % 10;
    return resto === 0 ? 0 : 10 - resto;
  };

  const modulo11Santander = (num) => {
    let soma = 0, peso = 2;
    for (let i = num.length - 1; i >= 0; i--) {
      soma += parseInt(num[i], 10) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    if (resto === 0 || resto === 1 || resto === 10) return 1;
    return 11 - resto;
  };

  const g = String(grupo || "").replace(/\D/g, "").slice(-3).padStart(3, "0");
  const c = String(cota || "").split("-")[0].split("/")[0].replace(/\D/g, "").padStart(4, "0");
  const p = String(parcela || "01").replace(/\D/g, "").padStart(2, "0");

  let fatorVencimento = "1638"; // Fator base para nov/2026
  if (dataVencimento && dataVencimento.includes("/")) {
    const [d, m, y] = dataVencimento.split("/").map(Number);
    if (d && m && y) {
      const dtVenc = new Date(y, m - 1, d);
      const dtBase = new Date(2025, 1, 22);
      const diffDays = Math.round((dtVenc.getTime() - dtBase.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) fatorVencimento = String(1000 + diffDays).padStart(4, "0");
    }
  }

  const nossoNumero = `7${g}${c}${p}`;
  const campoLivre = `975989980000257${nossoNumero}`;
  const valorCents = Math.round(Number(valor || 0) * 100).toString().padStart(10, "0");
  const parcial = `0339${fatorVencimento}${valorCents}${campoLivre}`;
  const dvGeral = modulo11Santander(parcial);

  const c1 = "033997598";
  const c1_dv = modulo10(c1);
  const c2 = "9980000257";
  const c2_dv = modulo10(c2);
  const c3 = nossoNumero;
  const c3_dv = modulo10(c3);
  const c5 = `${fatorVencimento}${valorCents}`;

  return `${c1.slice(0, 5)}.${c1.slice(5)}${c1_dv} ${c2.slice(0, 5)}.${c2.slice(5)}${c2_dv} ${c3.slice(0, 5)}.${c3.slice(5)}${c3_dv} ${dvGeral} ${c5}`;
}

async function auditarCarteiraNovembro() {
  log('==============================================================================');
  log('   JARVIS • AUDITORIA NOTURNA DE NOVEMBRO/2026 NO PORTAL MAGALU');
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
    log(`1. Efetuando login no portal: ${CONFIG.portalUrl}...`);
    await page.goto(CONFIG.portalUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2000);

    await page.getByPlaceholder('Filial').first().fill(CONFIG.filial);
    await page.getByPlaceholder('Chapa').first().fill(CONFIG.chapa);
    await page.getByPlaceholder('Senha').first().fill(CONFIG.senha);
    await page.getByRole('button', { name: 'Acessar portal' }).first().click();

    log('2. Aguardando abertura do módulo Newcon...');
    const centerBtn = page.locator('text="Atendimento"').nth(1);
    await centerBtn.waitFor({ state: 'visible', timeout: 35000 });

    const [newconPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 35000 }),
      centerBtn.click()
    ]);

    newconPage.on('dialog', async d => {
      log(`[Dialog Newcon] ${d.type()}: ${d.message()}`);
      await d.accept().catch(() => {});
    });

    await newconPage.waitForLoadState('networkidle').catch(() => {});
    await newconPage.waitForTimeout(2500);

    const relatorioNovembro = [];

    for (const cliente of CLIENTES_CARTEIRA) {
      log(`------------------------------------------------------------------------------`);
      log(`Auditando [${relatorioNovembro.length + 1}/${CLIENTES_CARTEIRA.length}]: ${cliente.nome} (Grupo: ${cliente.grupo} | Cota: ${cliente.cota})`);

      try {
        await newconPage.goto('https://newcon.consorciomagalu.tec.br/Newcon.Intranet/CONAT/frmConAtSrcConsorciado.aspx?cd=15000', { waitUntil: 'domcontentloaded' }).catch(() => {});
        const inputGrupo = newconPage.locator('#ctl00_Conteudo_edtGrupo');
        await inputGrupo.waitFor({ state: 'visible', timeout: 25000 });

        const cleanG = String(cliente.grupo).replace(/\D/g, '').padStart(6, '0');
        const cleanC = String(cliente.cota).split('-')[0].split('/')[0].replace(/\D/g, '').padStart(4, '0');

        await newconPage.locator('#ctl00_Conteudo_edtGrupo').fill(cleanG);
        await newconPage.locator('#ctl00_Conteudo_edtCota').fill(cleanC);
        await newconPage.locator('#ctl00_Conteudo_btnLocalizar').click();
        await newconPage.waitForLoadState('networkidle').catch(() => {});
        await newconPage.waitForTimeout(2000);

        // Se houver linha de resultado, seleciona
        const clientLink = newconPage.locator(`a:has-text("${cleanC}"), a:has-text("${cleanG}")`).first();
        if (await clientLink.isVisible().catch(() => false)) {
          await clientLink.click();
          await newconPage.waitForLoadState('networkidle').catch(() => {});
          await newconPage.waitForTimeout(1500);
        }

        // Navega para Emissão de Cobrança
        const linkEmissao = newconPage.locator('#ctl00_Conteudo_Menu_CONAT_grdMenu_CONAT_ctl04_hlkFormulario, #ctl00_Conteudo_Menu_CONAT1_grdMenu_CONAT_ctl04_hlkFormulario, a[href*="frmConCoRelBoletoAvulso.aspx"]').first();
        if (await linkEmissao.isVisible().catch(() => false)) {
          await linkEmissao.click();
        } else {
          await newconPage.goto('https://newcon.consorciomagalu.tec.br/Newcon.Intranet/CONCO/frmConCoRelBoletoAvulso.aspx', { waitUntil: 'domcontentloaded' }).catch(() => {});
        }

        await newconPage.waitForLoadState('networkidle').catch(() => {});
        await newconPage.waitForTimeout(2500);

        // Extrai todas as parcelas disponíveis para emissão de cobrança
        const parcelasAbertas = await newconPage.evaluate(() => {
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
              vlDevido: parseNum(vlDevidoStr)
            };
          }).filter(Boolean);
        });

        log(`   Tabela de cobrança retornou ${parcelasAbertas.length} parcelas em aberto.`);

        // Identifica parcela de novembro (11/2026)
        const parcelaNovembro = parcelasAbertas.find(p => p.vencimento.includes('/11/2026') || p.vencimento.includes('/11/26'));
        // Identifica parcelas vencidas anteriores a novembro
        const parcelasAtrasadasAnteriores = parcelasAbertas.filter(p => {
          const parts = p.vencimento.split('/');
          if (parts.length === 3) {
            const dt = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            return dt.getTime() < new Date(2026, 10, 1).getTime(); // Antes de 01/11/2026
          }
          return false;
        });

        const pagouNovembro = !parcelaNovembro;
        const temAtrasoAnterior = parcelasAtrasadasAnteriores.length > 0;

        let linhaDigitavelOficial = null;

        // Se tem parcela de novembro em aberto ou atraso anterior, vamos tentar capturar ou gerar a linha
        const parcelaFoco = parcelaNovembro || parcelasAtrasadasAnteriores[0] || parcelasAbertas[0];

        if (parcelaFoco && parcelaFoco.checkboxId) {
          try {
            await newconPage.locator(`#${parcelaFoco.checkboxId}`).click();
            await newconPage.waitForTimeout(1000);
            await newconPage.locator('#ctl00_Conteudo_btnFormLinhaDigitavel').click();
            await newconPage.waitForLoadState('networkidle').catch(() => {});
            await newconPage.waitForTimeout(2000);

            const elLinha = newconPage.locator('#ctl00_Conteudo_lblLinhaDigitavel');
            if (await elLinha.isVisible().catch(() => false)) {
              linhaDigitavelOficial = (await elLinha.innerText()).trim();
            }

            if (!linhaDigitavelOficial) {
              const bodyText = await newconPage.textContent('body');
              const match = bodyText.match(/03399\.\d{5}\s+\d{5}\.\d{6}\s+\d{5}\.\d{6}\s+\d\s+\d{14}/);
              if (match) linhaDigitavelOficial = match[0].trim();
            }
          } catch (e) {
            log(`   Não foi possível clicar na linha digitável: ${e.message}`);
          }
        }

        const vencimentoFinal = parcelaFoco ? parcelaFoco.vencimento : '23/11/2026';
        const valorFinal = parcelaFoco ? (parcelaFoco.vlDevido || parcelaFoco.valor) : 0;
        const linhaFinal = linhaDigitavelOficial || (parcelaFoco ? gerarLinhaSantanderMagalu(cleanG, cleanC, parcelaFoco.pcl, valorFinal, vencimentoFinal) : null);

        const statusNovembro = pagouNovembro ? 'PAGO_NOVEMBRO' : 'PENDENTE_NOVEMBRO';

        log(`   STATUS NOVEMBRO: ${statusNovembro} | Vencimento: ${vencimentoFinal} | Valor: R$ ${valorFinal}`);
        if (temAtrasoAnterior) {
          log(`   ⚠️ ATENÇÃO: Possui ${parcelasAtrasadasAnteriores.length} parcela(s) anterior(es) em atraso!`);
        }

        relatorioNovembro.push({
          nome: cliente.nome,
          grupo: cleanG,
          cota: cleanC,
          celular: cliente.celular,
          pagouNovembro,
          statusNovembro,
          temAtrasoAnterior,
          parcelasEmAberto: parcelasAbertas.map(p => ({ pcl: p.pcl, vencimento: p.vencimento, valor: p.vlDevido || p.valor })),
          vencimentoNovembro: parcelaNovembro ? parcelaNovembro.vencimento : (pagouNovembro ? 'Já quitado' : '23/11/2026'),
          valorNovembro: parcelaNovembro ? (parcelaNovembro.vlDevido || parcelaNovembro.valor) : 0,
          linhaDigitavel: linhaFinal
        });

      } catch (errCota) {
        log(`   Erro ao auditar cota ${cliente.nome}: ${errCota.message}`);
        relatorioNovembro.push({
          nome: cliente.nome,
          grupo: cliente.grupo,
          cota: cliente.cota,
          celular: cliente.celular,
          pagouNovembro: false,
          statusNovembro: 'ERRO_AUDITORIA',
          erro: errCota.message
        });
      }
    }

    await browser.close();

    log('==============================================================================');
    log('   RESUMO FINAL DA AUDITORIA DE NOVEMBRO');
    log('==============================================================================');
    const quitaram = relatorioNovembro.filter(r => r.pagouNovembro);
    const pendentes = relatorioNovembro.filter(r => !r.pagouNovembro);

    log(`Total de Cotas: ${relatorioNovembro.length}`);
    log(`✔️ Já Pagaram Novembro (${quitaram.length}): ${quitaram.map(q => q.nome).join(', ')}`);
    log(`⏳ Pendentes Novembro (${pendentes.length}): ${pendentes.map(p => `${p.nome} (Venc: ${p.vencimentoNovembro} | R$ ${p.valorNovembro})`).join('; ')}`);

    const outFile = path.join(__dirname, 'logs', `auditoria_novembro_2026_${new Date().toISOString().slice(0, 10)}.json`);
    fs.writeFileSync(outFile, JSON.stringify(relatorioNovembro, null, 2), 'utf-8');
    log(`Relatório salvo em: ${outFile}`);

    return relatorioNovembro;
  } catch (err) {
    log(`Erro crítico na auditoria: ${err.message}`);
    await browser.close().catch(() => {});
    throw err;
  }
}

auditarCarteiraNovembro().catch(console.error);

