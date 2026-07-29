require('dotenv').config();
const { OpenAI } = require('openai');
const axios = require('axios');

// Inicializa a OpenAI apenas se a chave estiver configurada
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

// Memória simples em cache para manter contexto da conversa (idealmente usar Redis ou DB em produção)
const memoryCache = new Map();

const nomeEquipe = process.env.NOME_EQUIPE || 'O Especialista Consórcio';

const SYSTEM_PROMPT = `Você é o assistente virtual da equipe ${nomeEquipe}, especialista em consórcio.
Sua missão é atender leads que chegam pelo WhatsApp interessados em consórcio, qualificá-los seguindo a metodologia de vendas SRV e direcioná-los para um atendimento personalizado com a equipe.

Metodologia de Vendas SRV (Siga este fluxo passo a passo de forma natural):
1. **SONHO (Qual o desejo?):** Identifique o que o cliente quer conquistar (Carro, Moto, Casa/Imóvel, Investimento, Caminhão, etc.).
2. **REALIDADE (Capacidade de pagamento):** Entenda qual faixa de parcela mensal cabe no bolso dele ou o valor do crédito que ele precisa.
3. **VELOCIDADE (Estratégia de contemplação):** Descubra quanto ele possui disponível para ofertar de lance (recursos próprios) para acelerar a contemplação, ou se prefere contar com lance fixo (embutido) ou apenas sorteio.

Regras Cruciais de Atendimento:
- **Apresentação Inicial:** Apresente-se como "assistente virtual da equipe ${nomeEquipe}".
- **Tom de voz:** Direto, consultivo, amigável, natural e sem parecer automático. Fale como um ser humano conversando de forma fluida no WhatsApp (evite textos gigantes, use parágrafos curtos, poucos emojis).
- **Conversa fluida:** Não envie listas prontas ou todas as perguntas de uma vez só. Qualifique o lead de forma natural e gradativa.
- **Fechamento de turnos:** Sempre termine a sua mensagem com uma pergunta simples e objetiva para gerar resposta (conforme a etapa atual do SRV em que você está).
- **Valores/Taxas:** Se perguntarem preço/parcela, comente que varia conforme o crédito, mas que a equipe consegue simular opções de alta contemplação em 5 minutos. Conduza perguntando qual a capacidade de pagamento (Realidade) do cliente.
- **Sem promessas falsas:** NUNCA prometa contemplação garantida ou prazos exatos.
- **Objetivo Final:** Após entender o perfil SRV (Sonho, Realidade e Velocidade), agende/direcione para a equipe apresentar as melhores propostas de grupos ativos.`;

async function generateAIResponse(userMessage, remoteJid) {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!openai && !geminiKey) {
    console.log('[!] Nem OPENAI_API_KEY nem GEMINI_API_KEY configuradas.');
    return `Olá! Sou o assistente da equipe ${nomeEquipe}. Em instantes a equipe já irá te responder!`;
  }

  // Tenta buscar contexto dinâmico do 3cerebros
  let localContext = "";
  try {
    const res = await axios.get(`http://localhost:8008/context?query=${encodeURIComponent(userMessage)}&who=${encodeURIComponent(remoteJid)}`);
    localContext = res.data.context || "";
  } catch (e) {
    // Ignora silenciosamente se o servidor local do cérebro estiver offline
  }

  try {
    // Busca histórico da conversa ou cria um novo
    let conversationHistory = memoryCache.get(remoteJid) || [
      { role: "system", content: SYSTEM_PROMPT }
    ];

    // Se tivermos contexto local adicional, injetamos no system prompt
    if (localContext) {
      conversationHistory[0] = {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n--- CONTEXTO ADICIONAL DO SEGUNDO CÉREBRO (3CEREBROS) ---\n${localContext}`
      };
    } else {
      conversationHistory[0] = { role: "system", content: SYSTEM_PROMPT };
    }

    // Adiciona a nova mensagem do usuário
    conversationHistory.push({ role: "user", content: userMessage });

    // Limita o histórico para não gastar muitos tokens (ex: últimas 10 mensagens + system prompt)
    if (conversationHistory.length > 11) {
      conversationHistory = [
        conversationHistory[0], 
        ...conversationHistory.slice(conversationHistory.length - 10)
      ];
    }

    let aiMessage = "";

    if (openai) {
      // Chama a API da OpenAI se configurada
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 250,
      });
      aiMessage = completion.choices[0].message.content;
    } else if (geminiKey) {
      // Chama a API da Gemini 2.5 Flash Lite
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`;
      const contents = conversationHistory.slice(1).map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));
      const res = await axios.post(geminiUrl, {
        contents,
        generationConfig: { maxOutputTokens: 250, temperature: 0.7 },
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
      });
      aiMessage = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (!aiMessage) {
      return "Olá! Como posso te ajudar hoje com as opções de consórcio?";
    }

    // Salva a resposta da IA no histórico
    conversationHistory.push({ role: "assistant", content: aiMessage });
    memoryCache.set(remoteJid, conversationHistory);

    // Salva a interação no 3cerebros local se ativo
    try {
      await axios.post("http://localhost:8008/observe", {
        who: remoteJid,
        user_msg: userMessage,
        ai_reply: aiMessage
      });
    } catch (e) {
      // Ignora silenciosamente se o servidor local estiver offline
    }

    return aiMessage;
  } catch (error) {
    console.error("Erro na API da IA:", error?.message || error);
    return "Desculpe, estou enfrentando uma instabilidade técnica no momento. O Fabrício já vai te atender!";
  }
}

module.exports = { generateAIResponse };
