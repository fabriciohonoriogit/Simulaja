import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => {
  const chainableMock: any = {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "mock-lead-123", organizacao_id: "mock-org-123" }, error: null }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    limit: vi.fn().mockResolvedValue({
      data: [{ id: "mock-lead-123", celular: "41999998888", organizacao_id: "mock-org-123", nome: "Mariana" }],
      error: null,
    }),
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(chainableMock),
    },
  };
});

vi.mock("@/services/evolutionApiService", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true, provider: "waha" }),
  isEvolutionConfigured: vi.fn().mockReturnValue(false),
  getEvolutionConfig: vi.fn().mockReturnValue({ apiUrl: "", apiKey: "", instanceName: "" }),
}));

global.fetch = vi.fn().mockImplementation((url: string) => {
  if (String(url).includes("api/sendText")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, id: "msg_mock_123" }),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

import {
  generateBudgetProposal,
  parseProposalRequestFromPrompt,
  sendProposalViaWhatsAppInbox,
  fmtBrlCompact,
} from "./proposalService";

describe("proposalService - Orçamentos Oficiais com Emoticons & Inbox WhatsApp", () => {
  it("deve gerar a simulação com valores exatos do grupo 6044 (R$ 150.000)", () => {
    const proposal = generateBudgetProposal({
      clienteNome: "Não informado",
      valorCredito: 150000,
      segmento: "imovel",
      consultorNome: "Fabricio Honório",
      dataStr: "05/11/2026",
    });

    expect(proposal.creditoFmt).toBe("R$ 150.000");
    expect(proposal.prazo).toBe(220);
    expect(proposal.parcelaAtualFmt).toBe("R$ 508");
    expect(proposal.creditoDisponivelFmt).toBe("R$ 112.500");
    expect(proposal.saldoDevedorFmt).toBe("R$ 138.992");
    expect(proposal.prazoRestante).toBe(219);
    expect(proposal.parcelaPosFmt).toBe("R$ 635");
    expect(proposal.grupo).toBe("6044");

    // Valida emoticons no script
    expect(proposal.scriptWhatsApp).toContain("🗓️ 05/11/2026");
    expect(proposal.scriptWhatsApp).toContain("👤 Cliente: Não informado");
    expect(proposal.scriptWhatsApp).toContain("📋 SIMULAÇÃO DE CONSÓRCIO");
    expect(proposal.scriptWhatsApp).toContain("🏠 Bem: Imóvel / Investimento | Grupo 6044");
    expect(proposal.scriptWhatsApp).toContain("💰 Carta de Crédito: R$ 150.000");
    expect(proposal.scriptWhatsApp).toContain("⏱️ Prazo: 220 meses");
    expect(proposal.scriptWhatsApp).toContain("🏷️ Tipo de Parcela: ⚡ 50/50 NEGOCIADO");
    expect(proposal.scriptWhatsApp).toContain("🎯 LANCE");
    expect(proposal.scriptWhatsApp).toContain("💵 Dinheiro: 0%");
    expect(proposal.scriptWhatsApp).toContain("📥 Embutido: 25%");
    expect(proposal.scriptWhatsApp).toContain("📊 Total do Lance: 25% → R$ 37.500");
    expect(proposal.scriptWhatsApp).toContain("💳 VALOR PARCELA");
    expect(proposal.scriptWhatsApp).toContain("💲 Valor da Parcela Atual: R$ 508");
    expect(proposal.scriptWhatsApp).toContain("💎 Crédito Disponível: R$ 112.500");
    expect(proposal.scriptWhatsApp).toContain("📉 Saldo Devedor: R$ 138.992");
    expect(proposal.scriptWhatsApp).toContain("⏳ Prazo Restante: 219 meses");
    expect(proposal.scriptWhatsApp).toContain("✨ Parcela Pós-Contemplação: R$ 635");
    expect(proposal.scriptWhatsApp).toContain("🤝 Simulação realizada por Fabricio Honório");
  });

  it("deve detectar e interpretar prompts de envio de orçamento", async () => {
    const prompt1 = "enviar um orçamento para a cliente Maria no whatsapp e também pode ser via email";
    const res1 = await parseProposalRequestFromPrompt(prompt1);

    expect(res1.isMatch).toBe(true);
    expect(res1.proposal).toBeDefined();
    expect(res1.proposal?.canal).toBe("ambos");
    expect(res1.proposal?.clienteNome).toBe("Mariana"); // Resolvido no mock de leads
    expect(res1.proposal?.creditoFmt).toBe("R$ 150.000");
  });

  it("deve extrair valores de crédito personalizados quando especificados no prompt", async () => {
    const prompt2 = "envie uma proposta para o cliente Carlos no whats de 300 mil";
    const res2 = await parseProposalRequestFromPrompt(prompt2);

    expect(res2.isMatch).toBe(true);
    expect(res2.proposal?.clienteNome).toBe("Mariana"); // Mock retorna Mariana
    expect(res2.proposal?.creditoFmt).toBe("R$ 300.000");
  });

  it("deve disparar de forma automática pela operação Inbox WhatsApp", async () => {
    const proposal = generateBudgetProposal({
      clienteNome: "Mariana",
      telefone: "41999998888",
      valorCredito: 150000,
    });

    const result = await sendProposalViaWhatsAppInbox(proposal);
    expect(result.success).toBe(true);
    expect(result.sentDirect).toBe(true);
    expect(proposal.statusEnvioWhatsApp).toBe("enviado_automatico");
  });
});
