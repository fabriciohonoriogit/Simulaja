/**
 * ==============================================================================
 * SIMULAJÁ CRM • JARVIS MOTOR DE DISPARO MATINAL DE LEMBRETES
 * ==============================================================================
 * Executa os envios via WAHA WhatsApp local (porta 3000)
 * Horário ideal: a partir das 08:30 / 09:00
 * Intervalo de segurança anti-ban: 4 a 7 segundos entre mensagens
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enviarWhatsApp(telefone, texto) {
  const cleanPhone = String(telefone).replace(/\D/g, '');
  const chatId = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`;

  try {
    const res = await fetch(`${WAHA_URL}/api/sendText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: 'default',
        chatId: chatId,
        text: texto
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`WAHA erro ${res.status}: ${err}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`Falha no envio para ${chatId}: ${err.message}`);
    return { error: err.message };
  }
}

async function main() {
  const logsDir = path.join(__dirname, 'logs');
  const files = fs.readdirSync(logsDir).filter(f => f.startsWith('fila_disparo_manha_novembro_'));
  if (files.length === 0) {
    console.log('Nenhuma fila de disparo encontrada em scripts/logs/.');
    return;
  }

  const latestFile = files.sort().reverse()[0];
  const filaPath = path.join(logsDir, latestFile);
  console.log(`Carregando fila de disparo: ${filaPath}`);

  const fila = JSON.parse(fs.readFileSync(filaPath, 'utf-8'));
  console.log(`Total de mensagens para envio: ${fila.length}`);

  for (let i = 0; i < fila.length; i++) {
    const item = fila[i];
    console.log(`[${i + 1}/${fila.length}] Enviando lembrete para ${item.nome} (${item.celular})...`);
    
    const resultado = await enviarWhatsApp(item.celular, item.mensagemPronta);
    console.log(`   Resultado:`, resultado);

    // Intervalo de segurança entre 4 e 7 segundos
    if (i < fila.length - 1) {
      const delay = Math.floor(Math.random() * 3000) + 4000;
      console.log(`   Aguardando ${delay / 1000}s para próximo disparo...`);
      await sleep(delay);
    }
  }

  console.log('Todos os disparos matinais foram concluídos com sucesso!');
}

main().catch(console.error);

