/**
 * CampaignThemeManager
 * Gerenciador central de skins sazonais para o Consórcio Magalu:
 * - Novembro (até 30/11 23:59:59): Black das Blacks Magalu (Onyx + Azul Elétrico + Ouro)
 * - Dezembro (01/12 a 31/12 23:59:59): Natal de Conquistas Magalu (Dourado Nobre + Carmesim + Azul Profundo)
 * - Padrão / Ano Novo: Consórcio Magalu Futurista (Azul Royal + Ciano Neon + Ouro)
 */

export type CampaignThemeId = "black_friday" | "natal" | "magalu_future";

export interface CampaignThemeConfig {
  id: CampaignThemeId;
  name: string;
  badgeText: string;
  subBadgeText: string;
  headlineHighlight: string;
  primaryColor: string; // Hex primário
  accentColor: string;  // Hex de destaque
  secondaryColor: string;
  glowClass: string;
  borderClass: string;
  cardBgClass: string;
  badgeBgClass: string;
  countdownLabel?: string;
  expiryDate?: Date;
}

export const getActiveCampaignTheme = (): CampaignThemeConfig => {
  // Verificação de override manual para testes ou demonstração
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("force_campaign_theme") as CampaignThemeId | null;
    if (override && THEMES[override]) {
      return THEMES[override];
    }
    // Compatibilidade com flag antiga
    if (localStorage.getItem("force_black_friday") === "true") {
      return THEMES.black_friday;
    }
  }

  const now = new Date();
  const month = now.getMonth(); // 10 = Novembro, 11 = Dezembro (0-indexed)
  const year = now.getFullYear();

  // Novembro -> Black das Blacks
  if (month === 10) {
    return THEMES.black_friday;
  }

  // Dezembro -> Natal de Conquistas
  if (month === 11) {
    return THEMES.natal;
  }

  // Padrão / Outros meses -> Magalu Futurista
  return THEMES.magalu_future;
};

const THEMES: Record<CampaignThemeId, CampaignThemeConfig> = {
  black_friday: {
    id: "black_friday",
    name: "Black das Blacks Consórcio Magalu",
    badgeText: "Black das Blacks Consórcio Magalu",
    subBadgeText: "Condições Exclusivas de Novembro • Meia Parcela Garantida",
    headlineHighlight: "Black das Blacks",
    primaryColor: "#0086FF", // Azul Magalu
    accentColor: "#FFB800",  // Ouro Solar
    secondaryColor: "#00F2FE", // Ciano Neon
    glowClass: "shadow-[0_0_35px_rgba(0,134,255,0.35)]",
    borderClass: "border-cyan-400/50 hover:border-amber-400/70",
    cardBgClass: "bg-[#070D19]/95 backdrop-blur-2xl border border-cyan-500/30",
    badgeBgClass: "bg-gradient-to-r from-blue-600 via-cyan-500 to-amber-500 text-slate-950",
    countdownLabel: "Encerramento da Black",
    expiryDate: new Date(new Date().getFullYear(), 10, 30, 23, 59, 59),
  },

  natal: {
    id: "natal",
    name: "Natal de Conquistas Consórcio Magalu",
    badgeText: "Natal de Conquistas Consórcio Magalu",
    subBadgeText: "Seu Maior Presente para 2027 • Comece o Ano Sem Juros",
    headlineHighlight: "Natal de Conquistas",
    primaryColor: "#FFD700", // Dourado Nobre
    accentColor: "#DC2626",  // Carmesim Imperial
    secondaryColor: "#0050DC", // Azul Real Magalu
    glowClass: "shadow-[0_0_35px_rgba(255,215,0,0.35)]",
    borderClass: "border-amber-400/50 hover:border-red-400/70",
    cardBgClass: "bg-[#060B1E]/95 backdrop-blur-2xl border border-amber-500/30",
    badgeBgClass: "bg-gradient-to-r from-amber-400 via-yellow-500 to-red-600 text-slate-950",
    countdownLabel: "Edição Especial de Fim de Ano",
    expiryDate: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59),
  },

  magalu_future: {
    id: "magalu_future",
    name: "Consórcio Magalu Futurista",
    badgeText: "Consórcio Magalu",
    subBadgeText: "Planejamento Patrimonial Inteligente • Metodologia 50/50",
    headlineHighlight: "Sem Juros Bancários",
    primaryColor: "#0086FF",
    accentColor: "#00F2FE",
    secondaryColor: "#FFB800",
    glowClass: "shadow-[0_0_35px_rgba(0,134,255,0.3)]",
    borderClass: "border-blue-500/40 hover:border-cyan-400/70",
    cardBgClass: "bg-[#060D1F]/95 backdrop-blur-2xl border border-blue-500/30",
    badgeBgClass: "bg-gradient-to-r from-blue-600 to-cyan-500 text-white",
  },
};

