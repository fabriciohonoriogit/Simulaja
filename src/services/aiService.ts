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

async function callAI(prompt: string, maxTokens = 800, history?: Array<{role: string, text: string}>): Promise<{ text: string; error: any }> {
  const { data, error } = await supabase.functions.invoke("jarvis-ai", {
    body: { prompt, maxTokens, history },
  });
  if (error) {
    console.error("aiService.callAI error:", error);
    return { text: "", error };
  }
  if (data?.error) {
    return { text: "", error: data.error };
  }
  return { text: data?.text ?? "", error: null };
}

export const aiService = {
  async generateSalesScript(lead: LeadContext) {
    const prompt = `Você é o Jarvis, um consultor de elite em consórcios.
O lead ${lead.nome} de ${lead.cidade} acabou de fazer uma simulação de ${lead.tipo_consorcio} no valor de R$ ${lead.valor_credito.toLocaleString("pt-BR")}.
Crie uma primeira mensagem de WhatsApp curta, persuasiva e humana.
Não use emojis em excesso. Chame-o pelo nome.
Foque em como essa carta de crédito pode transformar o patrimônio dele ou gerar rentabilidade.
Responda apenas com o texto da mensagem.`;
    const { text, error } = await callAI(prompt, 500);
    return { script: text || "Olá, bom dia! Gostaria de falar sobre o seu consórcio.", error };
  },

  async askJarvis(context: string, question: string, history?: Array<{role: string, text: string}>) {
    const prompt = `Você é o Jarvis, diretor comercial parceiro de vendas.

REGRAS DE RESPOSTA (EXTREMAMENTE IMPORTANTES - SUA VOZ É SINTETIZADA):
- Seja EXTREMAMENTE CURTO, rápido e natural, como num áudio de WhatsApp. Máximo 1 a 2 frases curtas.
- PROIBIDO usar formatação markdown (asteriscos, negritos, listas). Fale como um ser humano conversando.
- Vá direto ao ponto: diga o número principal ou o próximo passo.
- Use palavras naturais da fala ("Olha", "Então", "Temos", "A gente").
- Não explique os dados, apenas dê a resposta. Se pedirem mais detalhe, aí sim você expande.

DADOS DO CRM (use só o que for relevante para a pergunta):
${context}

PERGUNTA: "${question}"

Responda em no máximo 2 frases muito curtas e diretas.`;
    const { text, error } = await callAI(prompt, 200, history);
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
