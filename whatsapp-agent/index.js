require('dotenv').config();
const express = require('express');
const { generateAIResponse } = require('./ai');
const { sendMessage } = require('./evolution');

const app = express();
app.use(express.json());

// Rota Webhook que a Evolution API vai chamar
app.post('/webhook/evolution', async (req, res) => {
  try {
    // A Evolution API envia vários tipos de eventos. 
    // Só nos importamos com "messages.upsert" (novas mensagens recebidas).
    const event = req.body;
    
    // Confirmação rápida para a Evolution API não dar timeout
    res.status(200).send('OK');

    // Validar se é uma mensagem real recebida (não mensagem do próprio bot ou atualização de status)
    if (event.event === 'messages.upsert') {
      const msg = event.data?.messages?.[0];
      if (!msg) return;
      
      // Ignorar mensagens enviadas por nós mesmos (fromMe)
      if (msg.key.fromMe) return;

      const remoteJid = msg.key.remoteJid || '';
      // Ignorar mensagens de grupos ou status
      if (remoteJid.includes('@g.us') || remoteJid.includes('status@broadcast')) return;

      const rawNumber = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
      const shortNumber = rawNumber.startsWith('55') ? rawNumber.substring(2) : rawNumber;
      const last8Digits = rawNumber.length >= 8 ? rawNumber.slice(-8) : rawNumber;

      // FILTRO DE SEGURANÇA: Verificar se o número de telefone já é um LEAD CADASTRADO no CRM
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        const { data: leads } = await supabase
          .from('leads')
          .select('id, nome, atendimento_ia')
          .or(`celular.ilike.%${shortNumber}%,celular.ilike.%${last8Digits}%`)
          .limit(1);

        if (!leads || leads.length === 0) {
          console.log(`[!] Contato ${rawNumber} não é um lead do CRM. Mensagem ignorada.`);
          return;
        }
      }

      const messageType = Object.keys(msg.message || {})[0];
      let incomingText = '';

      if (messageType === 'conversation') {
        incomingText = msg.message.conversation;
      } else if (messageType === 'extendedTextMessage') {
        incomingText = msg.message.extendedTextMessage.text;
      }

      if (!incomingText) return;

      console.log(`[+] Mensagem recebida de Lead CRM (${remoteJid}): ${incomingText}`);

      // Chamar a IA para gerar a resposta
      const aiResponse = await generateAIResponse(incomingText, remoteJid);

      if (aiResponse) {
        console.log(`[-] Enviando resposta para ${remoteJid}...`);
        await sendMessage(remoteJid, aiResponse);
      }
    }
  } catch (error) {
    console.error('Erro ao processar webhook:', error.message);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🤖 Agente de WhatsApp rodando na porta ${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook/evolution`);
});
