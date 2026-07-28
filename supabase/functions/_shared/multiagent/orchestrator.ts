export type AgentRole = "supervisor" | "crm_agent" | "magalu_agent" | "whatsapp_agent" | "marketing_agent";

export interface AgentResponse {
  agentName: AgentRole;
  responsePrompt: string;
  recommendedTools: string[];
}

export class MultiagentOrchestrator {
  /**
   * Identifica o agente especialista ideal com base no prompt do usuário
   */
  routeRequest(userPrompt: string): AgentResponse {
    const promptLower = userPrompt.toLowerCase();

    if (
      promptLower.includes("post") ||
      promptLower.includes("imagem") ||
      promptLower.includes("instagram") ||
      promptLower.includes("facebook") ||
      promptLower.includes("redes sociais") ||
      promptLower.includes("publicar")
    ) {
      return {
        agentName: "marketing_agent",
        responsePrompt: "Você é o Agente de Marketing do Jarvis 4.0 especialista em campanhas visuais e posts de consórcio.",
        recommendedTools: ["mcp_marketing_generate_image", "mcp_marketing_post_social"],
      };
    }

    if (
      promptLower.includes("grupo") ||
      promptLower.includes("lance") ||
      promptLower.includes("contempla") ||
      promptLower.includes("abac") ||
      promptLower.includes("boleto") ||
      promptLower.includes("portal")
    ) {
      return {
        agentName: "magalu_agent",
        responsePrompt: "Você é o Agente Especialista no Consórcio Magalu. Conhece todas as estatísticas históricas dos grupos, regras de lances embutidos (até 30%) e emissão de boletos.",
        recommendedTools: ["mcp_consorcio_simular", "mcp_web_search"],
      };
    }

    if (
      promptLower.includes("whatsapp") ||
      promptLower.includes("envia mensagem") ||
      promptLower.includes("manda um whats")
    ) {
      return {
        agentName: "whatsapp_agent",
        responsePrompt: "Você é o Agente especialista em Comunicação de WhatsApp com foco na metodologia SRV (Sonho, Realidade e Velocidade).",
        recommendedTools: ["mcp_whatsapp_send_text"],
      };
    }

    return {
      agentName: "crm_agent",
      responsePrompt: "Você é o Agente Gestor do CRM Simulaja especialista em gestão de leads, movimentação de funil e metas comerciais.",
      recommendedTools: ["mcp_crm_search_leads", "mcp_crm_create_lead", "mcp_crm_mover_etapa"],
    };
  }
}

export const multiagentOrchestrator = new MultiagentOrchestrator();
