/**
 * ==============================================================================
 * SIMULAJÁ CRM • JARVIS GERADOR DE LEMBRETES PREVENTIVOS DE NOVEMBRO
 * ==============================================================================
 * Formata os lembretes matinais com o tom executivo e empático do Jarvis,
 * pronto para envio a partir das 08:00/09:00 da manhã.
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function montarMensagemPreventivaNovembro(cliente) {
  const primeiroNome = cliente.nome ? cliente.nome.split(' ')[0].charAt(0).toUpperCase() + cliente.nome.split(' ')[0].slice(1).toLowerCase() : 'Cliente';
  const vencimento = cliente.vencimentoNovembro || '23/11/2026';
  const valorFormatado = cliente.valorNovembro ? `R$ ${Number(cliente.valorNovembro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 380,00';
  
  // Se tem linha digitável
  const linhaStr = cliente.linhaDigitavel ? `\n\n📌 *Código de barras / Linha digitável:*\n\`${cliente.linhaDigitavel}\`` : '';

  return `Bom dia, ${primeiroNome}! Tudo bem com você? Espero que sim! 😊

Aqui é o Fabrício Honório, do Consórcio Magalu.

Passando rapidinho para te poupar tempo e te lembrar com carinho que a sua parcela deste mês da cota ${cliente.cota} (Grupo ${cliente.grupo}) vence no dia *${vencimento}*, no valor de *${valorFormatado}*.${linhaStr}

Qualquer dúvida ou caso queira antecipar alguma questão, estou 100% à sua disposição por aqui!

Tenha um excelente dia! ✨`;
}

export function processarFilaEnvio(caminhoRelatorio) {
  if (!fs.existsSync(caminhoRelatorio)) {
    console.error(`Arquivo de auditoria não encontrado: ${caminhoRelatorio}`);
    return [];
  }

  const raw = fs.readFileSync(caminhoRelatorio, 'utf-8');
  const clientes = JSON.parse(raw);

  const filaEnvio = [];

  for (const c of clientes) {
    if (c.pagouNovembro) {
      console.log(`[PAGO] ${c.nome} já quitou novembro. Não receberá lembrete.`);
      continue;
    }

    const mensagem = montarMensagemPreventivaNovembro(c);
    filaEnvio.push({
      nome: c.nome,
      celular: c.celular,
      grupo: c.grupo,
      cota: c.cota,
      vencimento: c.vencimentoNovembro,
      valor: c.valorNovembro,
      linhaDigitavel: c.linhaDigitavel,
      mensagemPronta: mensagem,
      status: 'agendado_manha'
    });
  }

  const outPath = path.join(__dirname, 'logs', `fila_disparo_manha_novembro_${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(outPath, JSON.stringify(filaEnvio, null, 2), 'utf-8');
  console.log(`Fila de envio gerada com sucesso (${filaEnvio.length} clientes a disparar pela manhã): ${outPath}`);
  return filaEnvio;
}

