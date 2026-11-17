/**
 * ==============================================================================
 * SIMULAJÁ CRM • JARVIS SENTINELA DE VAGAS: GRUPO 6042 (350K @ 16%)
 * ==============================================================================
 * Monitora periodicamente o portal Consórcio Magalu.
 * Caso surja 1 ou mais cotas vagas no Grupo 6042 de R$ 350.000,00 com taxa a 16%,
 * dispara alerta imediato para o gestor Fabrício Honório.
 * ==============================================================================
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const PORTAL_URL = 'https://portal.consorciomagalu.com.br/portal-consorcio/login';
const FILIAL = '10826';
const CHAPA = '918260';
const SENHA = process.env.MAGALU_SENHA || 'Fh021088';

const DESTINO_TELEFONE = '5541997925357';
const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';

const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1';

async function enviarAlertaTelegramMake(dados) {
  try {
    const payload = {
      evento: 'alerta_jarvis_vaga_6042',
      nome: 'Fabrício Honório (🚨 VAGA GRUPO 6042)',
      celular: '41997925357',
      valor_credito: 'R$ 350.000,00 (Taxa 16%)',
      tipo_consorcio: '🚨 VAGA LIBERADA NO GRUPO 6042 - R$ 350.000,00!',
      pagina: 'https://portal.consorciomagalu.com.br/portal-consorcio/login',
      origem: 'Jarvis Sentinela Bot',
      score: 'alta_prioridade',
      mensagem: `🚨 ATENÇÃO FABRÍCIO! O Sentinela identificou cota liberada no Grupo 6042 (R$ 350k a 16%). Dados: ${JSON.stringify(dados)}`,
      timestamp: new Date().toISOString()
    };

    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      console.log('✅ [Sentinela] Alerta disparado com sucesso para o Telegram via Make.com!');
      return true;
    }
  } catch (e) {
    console.warn('⚠️ [Sentinela] Falha no envio do webhook Make:', e.message);
  }
  return false;
}

async function enviarAlertaWhatsApp(mensagem) {
  try {
    const res = await fetch(`${WAHA_URL}/api/sendText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: 'default',
        chatId: `${DESTINO_TELEFONE}@c.us`,
        text: mensagem
      })
    });
    if (res.ok) {
      console.log('✅ [Sentinela] Alerta enviado com sucesso via WhatsApp WAHA!');
      return true;
    }
  } catch (e) {
    console.log('ℹ️ [Sentinela] WAHA local não ativo no momento:', e.message);
  }
  return false;
}

export async function checarVagasGrupo6042() {
  console.log('🕵️‍♂️ [Jarvis Sentinela] Iniciando checagem de vagas no Grupo 6042...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  try {
    // 1. Login
    await page.goto(PORTAL_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('#filial', FILIAL);
    await page.fill('#chapa', CHAPA);
    await page.fill('#senha', SENHA);
    await page.click('button[type="submit"], input[type="submit"], .btn-entrar');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });

    // 2. Acessa Simulação / Grade de Vendas
    await page.goto('https://portal.consorciomagalu.com.br/portal-consorcio/simulacao-vendas', { waitUntil: 'networkidle', timeout: 30000 });
    
    // 3. Captura seletor de bens / grupos
    const dadosGrupos = await page.evaluate(() => {
      // Procura tabelas ou options com o texto 6042 e 350.000
      const resultados = [];
      document.querySelectorAll('tr, .row-cota, option').forEach(el => {
        const txt = el.innerText || el.textContent;
        if (txt.includes('6042') && txt.includes('350')) {
          resultados.push(txt.trim());
        }
      });
      return resultados;
    });

    console.log('Resultados encontrados no portal:', dadosGrupos);

    if (dadosGrupos.length > 0) {
      const alerta = `🚨 *ALERTA JARVIS: VAGA IDENTIFICADA!* 🚨\n\nFabricio, surgiu disponibilidade de cota no *Grupo 6042* (R$ 350.000,00 - Taxa 16%)!\n\nDados no Portal:\n${dadosGrupos.join('\n')}\n\nAcesse imediatamente o portal para reservar a cota:\nhttps://portal.consorciomagalu.com.br/portal-consorcio/login`;
      console.log(alerta);
      await Promise.allSettled([
        enviarAlertaTelegramMake(dadosGrupos),
        enviarAlertaWhatsApp(alerta)
      ]);
      return { vagaEncontrada: true, dados: dadosGrupos };
    } else {
      console.log('ℹ️ [Sentinela] Grupo 6042 (350k a 16%) continua sem vagas disponíveis no momento.');
      return { vagaEncontrada: false };
    }
  } catch (err) {
    console.error('❌ [Sentinela] Erro durante a varredura:', err.message);
    return { error: err.message };
  } finally {
    await browser.close();
  }
}

if (process.argv[1].endsWith('sentinela_vagas_6042.mjs')) {
  checarVagasGrupo6042();
}
