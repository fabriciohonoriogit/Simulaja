/**
 * AI Service — chama a edge function `jarvis-ai` (Lovable AI Gateway).
 * Nenhuma chave de API fica exposta no frontend.
 */
import { supabase } from "@/integrations/supabase/client";

export interface LeadContext {
  nome: string;
  tipo_consorcio: string;
  valor_credito: number;
  cidade: string;
}

async function callAI(prompt: string, maxTokens = 800, history?: Array<{role: string, text: string}>, imageBase64?: string): Promise<{ text: string; error: any }> {
  let retries = 2;
  let lastError = null;
  while (retries >= 0) {
    try {
      const { data, error } = await supabase.functions.invoke("jarvis-ai", {
        body: { prompt, maxTokens, history, imageBase64 },
      });
      if (error) {
        console.error("aiService.callAI error:", error);
        lastError = error;
        if (retries === 0) return { text: data?.text || "Não foi possível obter resposta da inteligência artificial no momento. Tente novamente.", error: lastError };
      } else if (data?.error) {
        console.error("Jarvis returned error:", data.error);
        lastError = data.error;
        if (retries === 0) return { text: data.text || (typeof data.error === 'string' ? data.error : "Ocorreu uma falha no processamento do Jarvis."), error: lastError };
      } else if (data?.text) {
        return { text: data.text, error: null };
      }
    } catch (e) {
      console.error("aiService.callAI exception:", e);
      lastError = e;
      if (retries === 0) return { text: "Erro de conexão com o Jarvis. Por favor, tente novamente.", error: e };
    }
    retries--;
    await new Promise(res => setTimeout(res, 500));
  }
  return { text: "Sem resposta do servidor de IA. Verifique as chaves de API.", error: lastError };
}

export const aiService = {
  async generateSalesScript(lead: LeadContext) {
    const prompt = `Você é o Jarvis, consultor comercial parceiro em consórcios do Simulaja.
O lead ${lead.nome} de ${lead.cidade} acabou de simular um consórcio de ${lead.tipo_consorcio} no valor de R$ ${lead.valor_credito.toLocaleString("pt-BR")}.

Crie uma primeira abordagem de WhatsApp de acordo com o método SRV (Sonho, Realidade e Velocidade) e seguindo estas diretrizes:
1. Tom de voz: Assuma o papel de consultor comercial. O tom deve ser direto, consultivo, muito amigável e sem parecer automático.
2. Formato: Crie uma mensagem curta (máximo de 3 parágrafos curtos) abordando-o pelo nome. Não use emojis em excesso.
3. Fluxo SRV: Faça referência ao Sonho dele (${lead.tipo_consorcio}) e ao valor simulado (R$ ${lead.valor_credito.toLocaleString("pt-BR")}).
4. Foco na Velocidade: Instigue a curiosidade sobre a contemplação rápida. Termine com uma pergunta simples sobre a Velocidade (se ele tem planos de dar um lance para acelerar ou se vai contar com lance fixo/sorteio) para gerar resposta.
5. Responda apenas com o texto da mensagem a ser enviada.`;
    const { text, error } = await callAI(prompt, 500);
    return { script: text || `Olá, ${lead.nome}! Vi que simulou um consórcio de ${lead.tipo_consorcio}. Como pensa em acelerar a conquista (lance ou sorteio)?`, error };
  },

  async askJarvis(context: string, question: string, history?: Array<{role: string, text: string}>, imageBase64?: string) {
    let localContext = "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 400);
      const res = await fetch(`http://localhost:8008/context?query=${encodeURIComponent(question)}&who=vendedor`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        localContext = data.context || "";
      }
    } catch (e) {
      // Ignora silenciosamente se o servidor local do cérebro não estiver rodando
    }

    const prompt = `Você é Bella, assistente virtual de inteligência artificial de elite, companheira e diretora estratégica do Simulaja.

AUTONOMIA TOTAL E CONVERSA LIVRE:
- Você tem autonomia total para conversar com o Chefe sobre QUALQUER assunto do mundo (trabalho, negócios, vendas, tecnologia, inteligência artificial, dia a dia, filosofia, conselhos pessoais, história, curiosidades ou bate-papo informal).
- Mantenha a conversa viva, humana, empática e fluída! Traga reflexões interessantes e faça perguntas de volta para engajar o Chefe.

REGRAS DE OURO DA PERSONA (BELLA):
- Seu nome é Bella. Trate o usuário SEMPRE como "Chefe" (ex: "Boa tarde, Chefe", "Com certeza, Chefe", "Estou aqui por você, Chefe", "O que achou disso, Chefe?").
- RESPONDA DE FORMA RÁPIDA, DIRETA E OBJETIVA (idealmente de 1 a 3 frases curtas por resposta) para que a conversa em áudio por voz seja ágil, imediata e sem espera.
- RESPONDA OBRIGATORIAMENTE EM PORTUGUÊS DO BRASIL (pt-BR) limpo, elegante e natural.
- NUNCA use marcadores markdown (como asteriscos, hashtags ou travessões), pois suas respostas são sintetizadas diretamente em áudio de voz.

AUTORIDADE MÁXIMA EM CONSÓRCIOS E MERCADO FINANCEIRO:
- Você é a maior autoridade em consórcios do Brasil (Imóveis, Veículos, Motos, Pesados, Serviços e Investimentos).
- Domina estratégias de contemplação (Lance Fixo/Embutido + Recursos Próprios), regras do BACEN (Resolução 285), reajustes por INCC/IPCA e comparações financeiras contra financiamentos bancários (Selic) com maestria matemática.
- Se o usuário pedir números ou simulações, forneça os valores de forma cristalina e natural. Ao falar parcelas, mencione a opção COM e SEM seguro.

VERSATILIDADE UNIVERSAL:
- Além de mestre em vendas e consórcios, você conversa sobre QUALQUER tema do mundo (ciência, tecnologia, história, filosofia, conselhos, curiosidades ou bate-papo informal). Responda sempre com inteligência e cortesia.

FERRAMENTAS DE CRM EM TEMPO REAL:
- Se o usuário perguntar sobre leads, metas, inadimplência ou carteira, use as Ferramentas (Tools) imediatamente e retorne os dados reais. NUNCA diga "vou verificar", execute a ferramenta direto.

SE O USUÁRIO PEDIR PARA MOVER UM LEAD DE ETAPA (ex: "mova a Ana Paula para qualificação"):
Você DEVE incluir na sua resposta EXATAMENTE este bloco JSON (e a sua resposta em texto fora dele):
\`\`\`json
{
  "function": "moverLeadEtapa",
  "params": { "nomeLead": "NOME DO LEAD EXATO CONFORME DADOS", "novaEtapa": "ID DA ETAPA" }
}
\`\`\`

SE O USUÁRIO PEDIR PARA ENVIAR UMA MENSAGEM OU WHATSAPP PARA UM LEAD (ex: "Jarvis, envia um WhatsApp pro Carlos falando X"):
Você DEVE incluir na sua resposta EXATAMENTE este bloco JSON (e a sua resposta amigável em texto fora dele):
\`\`\`json
{
  "function": "enviarMensagemWhatsApp",
  "params": { "nomeLead": "NOME DO LEAD", "mensagem": "TEXTO DA MENSAGEM A ENVIAR" }
}
\`\`\`

SE O USUÁRIO PEDIR PARA CONFIRMAR OU CRIAR UM AGENDAMENTO COM UM LEAD (ex: "Jarvis, confirma a reunião com a Maria amanhã às 15h"):
Você DEVE incluir na sua resposta EXATAMENTE este bloco JSON (e a sua resposta em texto fora dele):
\`\`\`json
{
  "function": "confirmarAgendamento",
  "params": { "nomeLead": "NOME DO LEAD", "dataHora": "DATA HORA DO AGENDAMENTO", "observacao": "Reunião de alavancagem confirmada via WhatsApp" }
}
\`\`\`

Onde "novaEtapa" DEVE ser um dos IDs exatos: novo_lead, primeiro_contato, qualificacao, simulacao_enviada, negociacao, aguardando_pagamento, fechado, perdido, morto.

VISÃO / CÂMERA DO USUÁRIO EM TEMPO REAL:
- Se houver uma imagem anexada a esta requisição, ela representa o frame capturado da webcam/câmera do usuário no exato momento da pergunta.
- Se o usuário perguntar algo de cunho visual ou pessoal sobre o que ele está vestindo, a cor da camisa dele, o ambiente, ou sua expressão (ex: "que cor é a minha camisa?", "como está a luz do meu ambiente?", "o que você está vendo na minha câmera?"), analise a imagem com precisão e responda diretamente de forma descontraída, curta e muito natural.

INFORMAÇÃO FIXA (MEMÓRIA):
- Se perguntarem quais são os clientes EP (ou EP do mês de junho), responda que são: Emily Oliveira da Luz, João Batista Pereira, Alessandro Moreira e Leonardo Alves de Arruda.
- Se perguntarem sobre o índice QV8 (Qualidade da Venda no Oitavo Mês) de junho: a meta era 71.00%, mas o Resultado Atual foi 100.00% (Meta Atingida), com Crédito Gerado de R$ 310.000,00.
- Grupos com Resolução 285 do BACEN: Os grupos de imóveis 6043, 6041, 6040, 6039, 6038, 6037 e de veículos/motos 5297, 5295, 5294, 5292, 5291, 5290, 5288, 5287, 5286, 5284, 5996, 5296, 5293, 5289, 5285 NÃO permitem a troca da data da 1ª assembleia devido à regulamentação da Resolução 285.
- Análise de Prioridade de Grupos e Lances Contemplados Médios (do menor para o maior):
  * IMÓVEIS: 6014 (33.83%), 6016 (38.54%), 6015 (40.17%), 6018 (47.92%), 6019 (53.44%), 6021 (56.57%), 6022 (60.00%), 6028 (72.58%), 6029 (72.58%), 6023 (72.84%), 6027 (73.84%), 6031 (76.59%), 6030 (77.60%), 6032 (78.57%), 6033 (81.43%), 6020 (82.22%), 6034 (84.78%), 6035 (89.00%), 6037 (89.88%), 6038 (91.35%), 6040 (93.17%), 6039 (93.76%), 6041 (95.90%), 6042 (98.97%), 6043 (98.98%).
  * MOTOCICLETA: 5261 (16.37%), 5265 (26.42%), 5266 (27.27%), 5268 (34.28%), 5273 (40.50%), 5276 (43.73%), 5270 (44.95%), 5280 (53.54%), 5283 (55.82%), 5285 (71.11%), 5288 (75.00%), 5293 (80.00%), 5289 (81.25%), 5296 (88.75%), 5298 (95.55%).
  * AUTOMÓVEIS: 5240 (34.28%), 5242 (41.08%), 5243 (41.96%), 5295 (43.73%), 5247 (45.54%), 5251 (48.49%), 5253 (50.00%), 5257 (48.57%), 5259 (49.83%), 5260 (48.57%), 5263 (49.83%), 5264 (53.42%), 5267 (55.24%), 5268 (55.82%), 5271 (58.05%), 5274 (60.55%), 5272 (60.84%), 5275 (60.75%), 5277 (67.62%), 5278 (68.52%), 5281 (72.32%), 5282 (75.76%), 5297 (99.00%).
  * CAMINHÕES E ÔNIBUS: 5900 (58.75%), 5907 (66.62%), 5904 (67.50%), 5911 (68.75%).
  * ELETROELETRÔNICOS: 4144 (51.35%), 4145 (62.73%), 4147 (61.54%), 4149 (83.25%), 4150 (97.96%).
  * SERVIÇOS: 7116 (12.22%), 7117 (17.50%), 7115 (18.28%), 7118 (30.50%), 7119 (55.55%), 7120 (95.38%).
Os grupos no início de cada lista representam lances mais baixos e maior velocidade/facilidade de contemplação (Alta Prioridade). Grupos com mais de 80% são de altíssima concorrência.

${localContext ? `\n--- CONTEXTO ADICIONAL DO SEGUNDO CÉREBRO (3CEREBROS) ---\n${localContext}\n` : ""}

CONTEXTO DA TELA ATUAL:
${context}

PERGUNTA: "${question}"`;
    const { text, error } = await callAI(prompt, 500, history, imageBase64);

    // Registra a interação no cérebro se a chamada deu certo
    if (text && !error) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 400);
        await fetch("http://localhost:8008/observe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ who: "vendedor", user_msg: question, ai_reply: text }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (e) {
        // Ignora silenciosamente se o servidor local do cérebro estiver offline
      }
    }

    return {
      answer: error ? "" : (text || "Desculpe, não foi possível obter resposta no momento."),
      error,
    };
  },

  async qualifyLeads(leadsContext: string) {
    const prompt = `Você é o Jarvis, estrategista de CRM.
Analise a lista de leads e seus históricos de interação abaixo.
Para cada lead, determine:
1. lead_temperatura: 'quente', 'morno', 'frio' ou 'morto'
2. propensity_score: um número de 0 a 100 indicando a chance de fechamento
3. propensity_reason: uma breve justificativa estratégica

Responda APENAS em formato JSON puro (array de objetos), sem markdown:
[{"id": "uuid", "temp": "quente", "score": 85, "reason": "Justificativa..."}]

LISTA DE LEADS E HISTÓRICO:
${leadsContext}`;
    const { text, error } = await callAI(prompt, 2000);
    if (error) return { analysis: [], error };
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      return { analysis: JSON.parse(clean), error: null };
    } catch (e) {
      console.error("qualifyLeads parse error:", e);
      return { analysis: [], error: e };
    }
  },
};
