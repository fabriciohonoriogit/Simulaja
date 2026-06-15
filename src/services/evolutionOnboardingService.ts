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
      throw error;
    }

    return data; // Retorna QR Code ou dados da instância
  } catch (error) {
    console.error("Erro ao criar instância do WhatsApp:", error);
    throw error;
  }
};
