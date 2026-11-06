import { describe, it, expect } from "vitest";
import {
  stripEmotionTags,
  normalizeTextForSpeech,
  inferEmotionFromText,
  parseSpeechSegments,
  computeProsody,
  EMOTION_PROSODY,
} from "./voiceService";

describe("Voice Pipeline - J.A.R.V.I.S OS", () => {
  it("stripEmotionTags deve remover todas as tags de emoção e pausas", () => {
    const raw = "[emoção:alegre] Olá Fabrício! [pausa] Tudo bem? [respira] Analisei seu funil [pausa longa] hoje.";
    const cleaned = stripEmotionTags(raw);
    expect(cleaned).toBe("Olá Fabrício! Tudo bem? Analisei seu funil hoje.");
    expect(cleaned).not.toContain("[emoção");
    expect(cleaned).not.toContain("[pausa");
    expect(cleaned).not.toContain("[respira");
  });

  it("normalizeTextForSpeech deve converter valores monetários e siglas para fala", () => {
    const raw = "O crédito de R$ 300.000,00 no consórcio com IPCA a 4,5%.";
    const normalized = normalizeTextForSpeech(raw);
    expect(normalized).toContain("300 mil reais");
    expect(normalized).toContain("I-P-C-A");
    expect(normalized).toContain("4 vírgula 5 por cento");

    // Validações do bug relatado pelo usuário: 100mil, 100k, R$ 100 mil
    expect(normalizeTextForSpeech("crédito de 100mil")).toContain("100 mil reais");
    expect(normalizeTextForSpeech("orçamento de 100 mil")).toContain("100 mil reais");
    expect(normalizeTextForSpeech("valor de 100k")).toContain("100 mil reais");
    expect(normalizeTextForSpeech("R$ 100 mil")).toContain("100 mil reais");
    expect(normalizeTextForSpeech("R$ 100.000,00")).toContain("100 mil reais");
  });

  it("inferEmotionFromText deve inferir emoção por pontuação e semântica", () => {
    expect(inferEmotionFromText("Excelente notícia!")).toBe("empolgado");
    expect(inferEmotionFromText("Qual o valor da parcela?")).toBe("curioso");
    expect(inferEmotionFromText("Peço desculpas pelo atraso")).toBe("empático");
    expect(inferEmotionFromText("Atenção, pagamento crítico")).toBe("sério");
    expect(inferEmotionFromText("Mantenha a calma")).toBe("calmo");
  });

  it("parseSpeechSegments deve criar segmentos com emoções e pausas", () => {
    const raw = "[emoção:empolgado] Olá Fabrício! [pausa] Temos uma nova oportunidade.";
    const segments = parseSpeechSegments(raw, "alta", true);
    expect(segments.length).toBeGreaterThanOrEqual(2);
    expect(segments[0].emotion).toBe("empolgado");
    expect(segments[0].text).toContain("Olá Fabrício");
    expect(segments[0].pauseAfterMs).toBeGreaterThan(0);
  });

  it("computeProsody deve aplicar escala de expressividade", () => {
    const alta = computeProsody("empolgado", "alta");
    const baixa = computeProsody("empolgado", "baixa");

    const altaRate = parseInt(alta.rate);
    const baixaRate = parseInt(baixa.rate);

    expect(altaRate).toBeGreaterThan(baixaRate);
  });
});

