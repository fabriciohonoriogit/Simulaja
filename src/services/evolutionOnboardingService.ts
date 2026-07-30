import { supabase } from "@/integrations/supabase/client";

// URL e Global API Key do Evolution API - deve vir do backend ou variaveis de ambiente,
// mas para simplicidade neste MVP, usaremos Edge Functions caso precise de segurança.
// Se for fazer client-side, essas vars precisariam ser públicas (não recomendado).
// Portanto, o ideal é chamar uma Edge Function. Vamos criar um serviço que chama a Edge Function.

export const createWhatsAppInstance = async (organizacaoId: string, instanceName: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("evolution-create-instance", {
      body: { organizacaoId, instanceName },
    });

    if (error) {
      console.warn("Edge Function evolution-create-instance warning:", error);
      return { success: false, error: "Servidor de automação offline." };
    }

    return data || { success: true };
  } catch (error: any) {
    console.warn("Erro ao criar instância do WhatsApp:", error);
    return { success: false, error: error?.message || "Servidor do WhatsApp indisponível no momento." };
  }
};
