import { supabase } from "@/integrations/supabase/client";

export interface LeadScoreData {
  leadId: string;
  nome: string;
  score: number; // 0 a 100
  temperatura: "HOT" | "WARM" | "COLD";
  fatorEngajamento: string;
  recomendacaoLance: string;
}

export const leadScoringService = {
  /**
   * Calcula o Lead Score comercial e temperatura do lead com base em perfil e histórico
   */
  async calcularScoreLead(lead: {
    id: string;
    nome: string;
    valor_credito?: number;
    status: string;
    tipo_consorcio?: string;
  }): Promise<LeadScoreData> {
    let score = 50;

    // Fator 1: Valor do crédito
    const valor = Number(lead.valor_credito) || 0;
    if (valor >= 300000) score += 25;
    else if (valor >= 150000) score += 15;
    else if (valor >= 50000) score += 10;

    // Fator 2: Status do funil
    if (lead.status === "proposta" || lead.status === "negociacao") score += 20;
    else if (lead.status === "aguardando_docs") score += 25;
    else if (lead.status === "novo") score += 5;

    const temperatura: "HOT" | "WARM" | "COLD" = score >= 75 ? "HOT" : score >= 50 ? "WARM" : "COLD";

    // Fator 3: Recomendação inteligente de grupo Magalu
    let recGrupo = "Grupo 6014 (Imóveis - Lance médio 33.8%)";
    if ((lead.tipo_consorcio || "").includes("veic") || (lead.tipo_consorcio || "").includes("carro")) {
      recGrupo = "Grupo 5240 (Automóveis - Lance médio 34.2%)";
    } else if ((lead.tipo_consorcio || "").includes("moto")) {
      recGrupo = "Grupo 5261 (Motos - Lance médio 16.3%)";
    }

    return {
      leadId: lead.id,
      nome: lead.nome,
      score: Math.min(score, 100),
      temperatura,
      fatorEngajamento: `Engajamento alto no segmento ${lead.tipo_consorcio || "imóveis"}.`,
      recomendacaoLance: recGrupo,
    };
  },

  /**
   * Busca as maiores oportunidades comerciais ("Money on Table") da organização
   */
  async buscarOportunidadesOuro() {
    const { data: profile } = await supabase.from("perfis").select("organizacao_id").single();
    if (!profile?.organizacao_id) return [];

    const { data: leads } = await supabase
      .from("leads")
      .select("id, nome, celular, status, valor_credito, tipo_consorcio")
      .eq("organizacao_id", profile.organizacao_id)
      .in("status", ["proposta", "negociacao", "aguardando_docs"])
      .order("valor_credito", { ascending: false })
      .limit(10);

    if (!leads) return [];

    const scored = await Promise.all(leads.map((l) => this.calcularScoreLead(l)));
    return scored.filter((s) => s.temperatura === "HOT");
  }
};
