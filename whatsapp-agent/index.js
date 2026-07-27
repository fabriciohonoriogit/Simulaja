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

    const rawEvent = (event.event || event.type || event.action || '').toString().toUpperCase();
    if (rawEvent.includes('MESSAGES') || rawEvent.includes('UPSERT') || rawEvent.includes('SEND') || !event.event) {
      const msg = event.data?.messages?.[0] || event.messages?.[0] || event.data;
      if (!msg) return;
      
      const isFromMe = !!msg.key?.fromMe;
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

      // FILTRO DE SEGURANÇA: Verificar se o número de telefone já é um LEAD CADASTRADO no CRM
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
          // Fallback em memória limpando caracteres especiais
          const { data: allLeads } = await supabase
            .from('leads')
            .select('id, nome, celular, atendimento_ia, organizacao_id')
            .order('created_at', { ascending: false })
            .limit(200);

          if (allLeads) {
            matchedLead = allLeads.find((l) => {
              if (!l.celular) return false;
              const clean = l.celular.replace(/\D/g, '');
              return clean.endsWith(last8Digits) || (shortNumber.length >= 8 && clean.includes(shortNumber));
            });
          }
        }

        // Fallback por pushName
        if (!matchedLead && pushName && pushName.trim().length > 2) {
          const { data: nameLeads } = await supabase
            .from('leads')
            .select('id, nome, celular, atendimento_ia, organizacao_id')
            .ilike('nome', `%${pushName.trim()}%`)
            .limit(1);

          if (nameLeads && nameLeads.length > 0) {
            matchedLead = nameLeads[0];
          }
        }

        if (!matchedLead) {
          console.log(`[!] Contato ${pushName || rawNumber} não é um lead do CRM. Mensagem ignorada.`);
          return;
        }

        // 1. Gravar a mensagem no CRM (role assistant se fromMe, user se mensagem do cliente)
        const msgRole = isFromMe ? 'assistant' : 'user';
        await supabase.from('chat_messages').insert({
          lead_id: matchedLead.id,
          organizacao_id: matchedLead.organizacao_id,
          content: incomingText,
          role: msgRole
        });
      }

      if (isFromMe) {
        console.log(`[+] Mensagem enviada pelo próprio celular espelhada no CRM (${matchedLead?.nome || ''}): ${incomingText}`);
        return;
      }

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
