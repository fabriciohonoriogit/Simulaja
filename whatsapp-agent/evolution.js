require('dotenv').config();
const axios = require('axios');

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "sua_chave_global_aqui";
const INSTANCE_NAME = process.env.INSTANCE_NAME || "SimulajaBot";

async function sendMessage(remoteJid, text) {
  try {
    const url = `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`;
    
    const payload = {
      number: remoteJid,
      options: {
        delay: 2000, // delay em milissegundos para simular "digitando..."
        presence: "composing"
      },
      textMessage: {
        text: text
      }
    };

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    };

    await axios.post(url, payload, config);
  } catch (error) {
    console.error("Erro ao enviar mensagem via Evolution API:", error.response?.data || error.message);
  }
}

module.exports = { sendMessage };
