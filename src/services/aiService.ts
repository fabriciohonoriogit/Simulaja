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
        if (retries === 0) return { text: "", error };
      } else if (data?.error) {
        console.error("Jarvis returned error:", data.error);
        lastError = data.error;
        if (retries === 0) return { text: data.text || "", error: data.error };
      } else {
        return { text: data?.text ?? "", error: null };
      }
    } catch (e) {
      console.error("aiService.callAI exception:", e);
      lastError = e;
      if (retries === 0) return { text: "", error: e };
    }
    retries--;
    await new Promise(res => setTimeout(res, 1000));
  }
  return { text: "", error: lastError };
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
      const res = await fetch(`http://localhost:8008/context?query=${encodeURIComponent(question)}&who=vendedor`);
      if (res.ok) {
        const data = await res.json();
        localContext = data.context || "";
      }
    } catch (e) {
      console.warn("[3Cerebros] Servidor local não está rodando. Usando memória padrão do sistema.");
    }

    const prompt = `Você é o Jarvis, diretor comercial parceiro de vendas.
Você tem acesso a Ferramentas (Tools) para consultar o banco de dados do CRM em tempo real.
Se o usuário perguntar sobre leads, metas, inadimplência, carteira ou qualquer outro dado comercial, você DEVE usar as Ferramentas (Tools) IMEDIATAMENTE para trazer os dados reais.
NUNCA responda dizendo "vou verificar no CRM", "deixe-me ver", "vou consultar" ou qualquer mensagem intermediária. Chame a ferramenta na mesma hora e retorne apenas a resposta final com os dados reais.
Seja pró-ativo. Não diga "eu não tenho acesso", use as ferramentas.

REGRAS DE RESPOSTA (EXTREMAMENTE IMPORTANTES - SUA VOZ É SINTETIZADA):
- Seja EXTREMAMENTE CURTO, rápido e natural, como num áudio de WhatsApp. Máximo 1 a 2 frases curtas.
- PROIBIDO usar formatação markdown (asteriscos, negritos, listas). Fale como um ser humano conversando.
- Vá direto ao ponto: diga o número principal ou o próximo passo.
- Use palavras naturais da fala ("Olha", "Então", "Temos", "A gente").
- IMPORTANTE: Ao informar valores de parcelas, sempre dê também a opção sem seguro e fale o seu respectivo valor.

SE O USUÁRIO PEDIR PARA MOVER UM LEAD DE ETAPA (ex: "mova o Carlos para negociação"):
Você DEVE incluir na sua resposta EXATAMENTE este bloco JSON (e a sua resposta em texto fora dele):
\`\`\`json
{
  "function": "moverLeadEtapa",
  "params": { "nomeLead": "NOME DO LEAD EXATO CONFORME DADOS", "novaEtapa": "ID DA ETAPA" }
}
\`\`\`
Onde "novaEtapa" DEVE ser um dos IDs: novo_lead, contato_feito, analise_credito, negociacao, aguardando_docs, contrato_assinado, comissao_paga, fechado, perdido, morto.

VISÃO / CÂMERA DO USUÁRIO EM TEMPO REAL:
- Se houver uma imagem anexada a esta requisição, ela representa o frame capturado da webcam/câmera do usuário no exato momento da pergunta.
- Se o usuário perguntar algo de cunho visual ou pessoal sobre o que ele está vestindo, a cor da camisa dele, o ambiente, ou sua expressão (ex: "que cor é a minha camisa?", "como está a luz do meu ambiente?", "o que você está vendo na minha câmera?"), analise a imagem com precisão e responda diretamente de forma descontraída, curta e muito natural.

INFORMAÇÃO FIXA (MEMÓRIA):
- Se perguntarem quais são os clientes EP (ou EP do mês de junho), responda que são: Emily Oliveira da Luz, João Batista Pereira, Alessandro Moreira e Leonardo Alves de Arruda.
- Se perguntarem sobre o índice QV8 (Qualidade da Venda no Oitavo Mês) de junho: a meta era 71.00%, mas o Resultado Atual foi 100.00% (Meta Atingida), com Crédito Gerado de R$ 310.000,00.
- Grupos com Resolução 285 do BACEN: Os grupos de imóveis 6043, 6041, 6040, 6039, 6038, 6037 e de veículos/motos 5297, 5295, 5294, 5292, 5291, 5290, 5288, 5287, 5286, 5284, 5996, 5296, 5293, 5289, 5285 NÃO permitem a troca da data da 1ª assembleia devido à regulamentação da Resolução 285.

${localContext ? `\n--- CONTEXTO ADICIONAL DO SEGUNDO CÉREBRO (3CEREBROS) ---\n${localContext}\n` : ""}

CONTEXTO DA TELA ATUAL:
${context}

PERGUNTA: "${question}"`;
    const { text, error } = await callAI(prompt, 500, history, imageBase64);

    // Registra a interação no cérebro se a chamada deu certo
    if (text && !error) {
      try {
        await fetch("http://localhost:8008/observe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ who: "vendedor", user_msg: question, ai_reply: text })
        });
      } catch (e) {
        // Ignora silenciosamente se o servidor local do cérebro estiver offline
      }
    }

    return {
      answer: text || "Desculpe, ocorreu um erro de conexão. Tente novamente em instantes.",
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
