import { supabase } from "@/integrations/supabase/client";
import { SimulacaoSchema, SimulacaoData } from "@/schemas/simulacao";
import { useSimuladorStore } from "@/stores/simuladorStore";

async function callAIGateway(prompt: string, maxTokens = 800): Promise<{ text: string; error: any }> {
  const { data, error } = await supabase.functions.invoke("jarvis-ai", {
    body: { prompt, maxTokens },
  });
  if (error) {
    console.error("Erro na API Gemini (Lovable Gateway):", error);
    return { text: "", error };
  }
  if (data?.error) {
    return { text: "", error: data.error };
  }
  return { text: data?.text ?? "", error: null };
}

export const geminiApi = {
  /**
   * Envia uma pergunta de simulação para o Jarvis (Gemini),
   * garantindo que a resposta baseie-se APENAS em dados já validados.
   */
  async askSimulatorJarvis(perguntaDoCliente: string, dadosParaValidar: any) {
    const store = useSimuladorStore.getState();
    
    // 1. Valida estritamente os dados recebidos da tabela (Zod)
    const dadosValidados = store.validarSimulacao(dadosParaValidar);
    
    if (!dadosValidados) {
      return { 
        answer: "Erro: Os dados solicitados para simulação não existem ou não são válidos. Opções: Verifique a tabela.",
        error: "Validação Zod Falhou" 
      };
    }

    // 2. Monta o Prompt Atualizado
    const prompt = `Você é um assistente de simulação. 
DADOS VALIDADOS PELO SISTEMA:
${JSON.stringify(dadosValidados, null, 2)}

Responda APENAS com esses dados. NUNCA invente valores.

Pergunta do usuário: "${perguntaDoCliente}"`;

    // 3. Busca no Supabase/Edge Function
    const { text, error } = await callAIGateway(prompt, 500);

    return {
      answer: text || "Desculpe, ocorreu um erro na simulação.",
      error,
      dadosValidados
    };
  }
};
