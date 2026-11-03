import { describe, it, expect } from "vitest";
import { simularFinanciamentoImobiliario } from "./financiamentoCaixa";

describe("simularFinanciamentoImobiliario - Motor Caixa Econômica Federal", () => {
  it("calcula corretamente um financiamento SAC 360 meses de R$ 500.000 (80% financiado)", () => {
    const res = simularFinanciamentoImobiliario({
      valorImovel: 500000,
      valorEntrada: 100000,
      prazoMeses: 360,
      taxaJurosAnual: 10.49,
      sistemaAmortizacao: "SAC",
      taxaAdminMensal: 25,
      taxaDFIPercentual: 0.0095,
      taxaMIPPercentual: 0.0280
    });

    expect(res.valorFinanciado).toBe(400000);
    expect(res.prazoMeses).toBe(360);
    expect(res.sistema).toBe("SAC");
    
    // Amortização mensal constante: 400.000 / 360 = 1111.11
    // Juros mês 1: 400.000 * (10.49% / 12) = 3496.67
    // MIP mês 1: 400.000 * 0.028% = 112.00
    // DFI: 500.000 * 0.0095% = 47.50
    // Taxa Adm: 25.00
    // Parcela 1 esperada: 1111.11 + 3496.67 + 112 + 47.50 + 25 = ~4792.28
    expect(res.primeiraParcela).toBeGreaterThan(4700);
    expect(res.primeiraParcela).toBeLessThan(4900);

    // No SAC, a última parcela é menor que a primeira
    expect(res.ultimaParcela).toBeLessThan(res.primeiraParcela);
    expect(res.ultimaParcela).toBeGreaterThan(1100);

    // Total amortizado deve ser exatamente o saldo financiado
    expect(Math.round(res.totalAmortizacao)).toBe(400000);

    // Total pago deve ser superior ao valor do imóvel (efeito dos juros)
    expect(res.valorFinalTotal).toBeGreaterThan(1000000);
    expect(res.multiplicadorImovel).toBeGreaterThan(2.0);

    // CET deve ser maior que a taxa de juros nominal (devido a seguros e tarifas)
    expect(res.cetAnual).toBeGreaterThan(10.49);
    expect(res.cronogramaCompleto).toHaveLength(360);
    expect(res.marcosPrincipais.length).toBeGreaterThan(5);
  });

  it("calcula corretamente um financiamento PRICE de R$ 300.000", () => {
    const res = simularFinanciamentoImobiliario({
      valorImovel: 300000,
      valorEntrada: 60000,
      prazoMeses: 240,
      taxaJurosAnual: 9.99,
      sistemaAmortizacao: "PRICE"
    });

    expect(res.valorFinanciado).toBe(240000);
    expect(res.sistema).toBe("PRICE");
    expect(res.primeiraParcela).toBeGreaterThan(2000);
    expect(res.cronogramaCompleto).toHaveLength(240);
  });
});

