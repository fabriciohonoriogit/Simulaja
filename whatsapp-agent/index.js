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
      const msg = event.data.messages[0];
      
      // Ignorar mensagens enviadas por nós mesmos (fromMe)
      if (msg.key.fromMe) return;

      const remoteJid = msg.key.remoteJid;
      // Ignorar mensagens de grupos
      if (remoteJid.includes('@g.us')) return;

      const messageType = Object.keys(msg.message || {})[0];
      let incomingText = '';

      if (messageType === 'conversation') {
        incomingText = msg.message.conversation;
      } else if (messageType === 'extendedTextMessage') {
        incomingText = msg.message.extendedTextMessage.text;
      }

      if (!incomingText) return;

      console.log(`[+] Mensagem recebida de ${remoteJid}: ${incomingText}`);

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
