require('dotenv').config();
const express = require('express');
const { generateAIResponse } = require('./ai');
const { sendMessage } = require('./evolution');

const app = express();
app.use(express.json());

// Logger de debug para registrar todas as requisições recebidas
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] HTTP ${req.method} ${req.url} recebido!`);
  next();
});

// Rota Webhook aceitando múltiplos alias
app.post(['/webhook/evolution', '/webhook/evolution/', '/'], async (req, res) => {
  try {
    const event = req.body;
    
    // Confirmação rápida para a Evolution API não dar timeout
    res.status(200).send('OK');

    const rawEvent = (event.event || event.type || event.action || '').toString().toLowerCase();
    
    // PROCESSAR EXCLUSIVAMENTE 'messages.upsert' (Ignorar SEND_MESSAGE para evitar loop)
    if (!rawEvent.includes('messages.upsert') && !rawEvent.includes('messages_upsert')) {
      return;
    }

    const msg = event.data?.messages?.[0] || event.messages?.[0] || event.data;
    if (!msg) return;
    
    const isFromMe = !!msg.key?.fromMe;
    if (isFromMe) return; // Ignorar totalmente mensagens enviadas por nós mesmos

    const remoteJid = msg.key?.remoteJidAlt || msg.key?.participant || msg.key?.remoteJid || '';
    const pushName = msg.pushName || '';

    // Ignorar mensagens de grupos ou status
    if (!remoteJid || remoteJid.includes('@g.us') || remoteJid.includes('status@broadcast')) return;

    const rawNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '').replace(/\D/g, '');
    const shortNumber = rawNumber.startsWith('55') ? rawNumber.substring(2) : rawNumber;
    const last8Digits = rawNumber.length >= 8 ? rawNumber.slice(-8) : rawNumber;

    const messageType = Object.keys(msg.message || {})[0];
    let incomingText = '';

    if (messageType === 'conversation') {
      incomingText = msg.message.conversation;
    } else if (messageType === 'extendedTextMessage') {
      incomingText = msg.message.extendedTextMessage?.text;
    } else if (msg.message?.imageMessage?.caption) {
      incomingText = msg.message.imageMessage.caption;
    }

    if (!incomingText) return;

    // FILTRO DE SEGURANÇA EXCLUSIVO POR TELEFONE: Verificar se o número de telefone é um LEAD CADASTRADO no CRM
    let matchedLead = null;
    let supabase = null;

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = require('@supabase/supabase-js');
      supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      
      const { data: leads } = await supabase
        .from('leads')
        .select('id, nome, celular, atendimento_ia, organizacao_id')
        .or(`celular.ilike.%${shortNumber}%,celular.ilike.%${last8Digits}%`)
        .limit(5);

      if (leads && leads.length > 0) {
        matchedLead = leads[0];
      } else {
        // Busca em memória comparando dígitos do celular
        const { data: allLeads } = await supabase
          .from('leads')
          .select('id, nome, celular, atendimento_ia, organizacao_id')
          .order('created_at', { ascending: false })
          .limit(500);

        if (allLeads) {
          matchedLead = allLeads.find((l) => {
            if (!l.celular) return false;
            const clean = l.celular.replace(/\D/g, '');
            return (
              (last8Digits.length >= 8 && clean.endsWith(last8Digits)) ||
              (shortNumber.length >= 8 && clean.includes(shortNumber))
            );
          });
        }
      }
    }

    // REGRA DE SEGURANÇA: Se o número NÃO pertence a NENHUM lead cadastrado no CRM, ignora COMPLETAMENTE!
    if (!matchedLead) {
      console.log(`[!] IGNORADO: O número ${rawNumber} não pertence a nenhum lead do CRM.`);
      return;
    }

    // 1. Gravar a mensagem do cliente no CRM
    await supabase.from('chat_messages').insert({
      lead_id: matchedLead.id,
      organizacao_id: matchedLead.organizacao_id,
      content: incomingText,
      role: 'user'
    });

    console.log(`[+] Mensagem recebida de Lead CRM ${matchedLead?.nome || ''} (${remoteJid}): ${incomingText}`);

    // Se a IA estiver desativada para o lead, não responde automaticamente
    if (matchedLead && matchedLead.atendimento_ia === false) {
      console.log(`[!] Atendimento IA está desativado para ${matchedLead.nome}.`);
      return;
    }

    // Chamar a IA para gerar a resposta
    const aiResponse = await generateAIResponse(incomingText, remoteJid);

    if (aiResponse) {
      console.log(`[-] Enviando resposta para ${remoteJid}...`);

      if (supabase && matchedLead) {
        // 2. Gravar a resposta da IA no CRM com organizacao_id
        await supabase.from('chat_messages').insert({
          lead_id: matchedLead.id,
          organizacao_id: matchedLead.organizacao_id,
          content: aiResponse,
          role: 'assistant'
        });
      }

      await sendMessage(remoteJid, aiResponse);
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
