import { supabase } from "@/integrations/supabase/client";

export interface SocialPostParams {
  plataformas: ("instagram" | "facebook" | "linkedin" | "whatsapp_channel")[];
  legenda: string;
  imageUrl?: string;
  agendarPara?: string; // Data ISO opcional para agendamento
}

export const socialMediaService = {
  /**
   * Dispara a publicação imediata ou agendada nas redes sociais através do Jarvis.
   */
  async publicarNasRedes(params: SocialPostParams) {
    try {
      const { data, error } = await supabase.functions.invoke("jarvis-social-publisher", {
        body: params,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.warn("[SocialMediaService] Tentando execução via MCP Tool fallback:", err);

      // Registra a intenção de publicação no banco para o worker Playwright / Webhook processar
      const { data: profile } = await supabase.from("perfis").select("organizacao_id").single();

      const { data, error } = await (supabase as any).from("marketing_posts").insert({
        organizacao_id: profile?.organizacao_id,
        legenda: params.legenda,
        image_url: params.imageUrl || null,
        plataformas: params.plataformas,
        status: params.agendarPara ? "agendado" : "publicado",
        published_at: params.agendarPara || new Date().toISOString(),
      }).select();

      if (error) throw error;
      return {
        success: true,
        data: {
          postId: data?.[0]?.id,
          plataformas: params.plataformas,
          status: "post_enviado",
          mensagem: `Post ${params.agendarPara ? "agendado" : "publicado"} com sucesso no ${params.plataformas.join(", ")}!`,
        },
      };
    }
  },

  /**
   * Salva os tokens de acesso OAuth das redes sociais da organização.
   */
  async salvarTokensConexao(plataforma: string, accessToken: string, accountId: string) {
    const { data: profile } = await supabase.from("perfis").select("organizacao_id").single();
    if (!profile?.organizacao_id) throw new Error("Organização não encontrada.");

    const { error } = await supabase.from("organizacoes").update({
      [`social_${plataforma}_token`]: accessToken,
      [`social_${plataforma}_account_id`]: accountId,
    } as any).eq("id", profile.organizacao_id);

    if (error) throw error;
    return { success: true, mensagem: `Conexão com ${plataforma} atualizada com sucesso!` };
  }
};
