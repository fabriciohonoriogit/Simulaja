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

async function callAI(prompt: string, maxTokens = 800): Promise<{ text: string; error: any }> {
  const { data, error } = await supabase.functions.invoke("jarvis-ai", {
    body: { prompt, maxTokens },
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

  async askJarvis(context: string, question: string) {
    const prompt = `Você é um diretor comercial especialista em consórcio.
Seu objetivo é:
- Aumentar conversão
- Priorizar ações com maior impacto financeiro
- Dar respostas diretas, estratégicas e acionáveis

Nunca responda de forma genérica.
Sempre use os dados fornecidos.
Se possível, traga números, prioridades e próximos passos.

DADOS FORNECIDOS (OPERAÇÃO E CRM EM TEMPO REAL):
${context}

PERGUNTA DO USUÁRIO: "${question}"`;
    const { text, error } = await callAI(prompt, 1200);
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
