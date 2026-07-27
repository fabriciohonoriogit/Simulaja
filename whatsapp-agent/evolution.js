require('dotenv').config();
const axios = require('axios');

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "B6D711FCDE4D4FD5936544120E713976";
const INSTANCE_NAME = process.env.INSTANCE_NAME || "simulaja";

async function sendMessage(remoteJid, text) {
  try {
    const url = `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`;
    const cleanNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '').replace(/\D/g, '');
    
    const payload = {
      number: cleanNumber,
      text: text,
      delay: 1200
    };

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    };

    await axios.post(url, payload, config);
    console.log(`[✓] Resposta enviada com sucesso no WhatsApp do cliente (${cleanNumber})`);
  } catch (error) {
    console.error("Erro ao enviar mensagem via Evolution API:", error.response?.data || error.message);
  }
}

module.exports = { sendMessage };
