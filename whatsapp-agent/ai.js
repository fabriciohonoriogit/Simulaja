require('dotenv').config();
const { OpenAI } = require('openai');

// Inicializa a OpenAI apenas se a chave estiver configurada
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

// Memória simples em cache para manter contexto da conversa (idealmente usar Redis ou DB em produção)
const memoryCache = new Map();

const SYSTEM_PROMPT = `Você é o Jarvis, o principal assistente virtual do "Consórcio Magalu", liderado pelo especialista Fabrício Honório.
Sua missão é atender leads (clientes) que chegam pelo WhatsApp, tirar dúvidas básicas sobre os consórcios de imóveis, veículos, motocicletas e veículos pesados, e agendar uma reunião com o Fabrício.

Regras de Atendimento:
1. Seja sempre educado, prestativo e use um tom profissional porém amigável e persuasivo.
2. Seja direto e objetivo. Não envie textos gigantes. Lembre-se que é o WhatsApp.
3. Se o cliente perguntar o preço ou a parcela, diga que o valor depende do crédito desejado e que o Fabrício faz uma simulação exata em 5 minutos.
4. O objetivo final de toda conversa é QUALIFICAR o cliente (saber o que ele quer comprar) e AGENDAR uma reunião ou ligação.
5. Nunca invente taxas ou prometar contemplação garantida (isso é contra a lei dos consórcios).
6. Responda em Português do Brasil de forma coloquial.`;

async function generateAIResponse(userMessage, remoteJid) {
  // Se não houver chave configurada, retorna uma mensagem simulada para testes
  if (!openai) {
    console.log('[!] OPENAI_API_KEY não configurada. Usando resposta mock.');
    return "Olá! Sou o assistente do Fabrício. No momento meu cérebro de IA está desligado (falta a chave da API), mas logo estarei 100%!";
  }

  try {
    // Busca histórico da conversa ou cria um novo
    let conversationHistory = memoryCache.get(remoteJid) || [
      { role: "system", content: SYSTEM_PROMPT }
    ];

    // Adiciona a nova mensagem do usuário
    conversationHistory.push({ role: "user", content: userMessage });

    // Limita o histórico para não gastar muitos tokens (ex: últimas 10 mensagens + system prompt)
    if (conversationHistory.length > 11) {
      conversationHistory = [
        conversationHistory[0], 
        ...conversationHistory.slice(conversationHistory.length - 10)
      ];
    }

    // Chama a API da OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // ou "gpt-3.5-turbo" / "gpt-4o"
      messages: conversationHistory,
      temperature: 0.7,
      max_tokens: 250,
    });

    const aiMessage = completion.choices[0].message.content;

    // Salva a resposta da IA no histórico
    conversationHistory.push({ role: "assistant", content: aiMessage });
    memoryCache.set(remoteJid, conversationHistory);

    return aiMessage;

  } catch (error) {
    console.error("Erro na OpenAI:", error);
    return "Desculpe, estou enfrentando uma instabilidade técnica no momento. O Fabrício já vai te atender!";
  }
}

module.exports = { generateAIResponse };
