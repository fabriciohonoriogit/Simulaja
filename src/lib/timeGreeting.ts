/**
 * Utilitário de Noção de Espaço e Tempo para Saudações Humanizadas
 * 
 * Regras estritas de horário:
 * - A partir das 05:00 até 12:00: "Bom dia" / "bom dia"
 * - A partir das 12:01 até 18:00: "Boa tarde" / "boa tarde"
 * - A partir das 18:01 até 04:59: "Boa noite" / "boa noite"
 */

export interface InfoSaudacao {
  saudacao: "bom dia" | "boa tarde" | "boa noite";
  saudacaoCapitalizada: "Bom dia" | "Boa tarde" | "Boa noite";
  otimaSaudacao: "Um ótimo dia" | "Uma ótima tarde" | "Uma ótima noite";
  periodo: "manha" | "tarde" | "noite";
  horaFormatada: string;
}

export function obterSaudacaoTempo(data: Date = new Date()): InfoSaudacao {
  const horas = data.getHours();
  const minutos = data.getMinutes();
  const tempoEmMinutos = horas * 60 + minutos;

  // 05:00 = 5 * 60 = 300
  // 12:00 = 12 * 60 = 720
  // 12:01 = 12 * 60 + 1 = 721
  // 18:00 = 18 * 60 = 1080
  // 18:01 = 18 * 60 + 1 = 1081

  const horaFormatada = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;

  if (tempoEmMinutos >= 300 && tempoEmMinutos <= 720) {
    // 05:00 às 12:00 -> Bom dia
    return {
      saudacao: "bom dia",
      saudacaoCapitalizada: "Bom dia",
      otimaSaudacao: "Um ótimo dia",
      periodo: "manha",
      horaFormatada,
    };
  } else if (tempoEmMinutos >= 721 && tempoEmMinutos <= 1080) {
    // 12:01 às 18:00 -> Boa tarde
    return {
      saudacao: "boa tarde",
      saudacaoCapitalizada: "Boa tarde",
      otimaSaudacao: "Uma ótima tarde",
      periodo: "tarde",
      horaFormatada,
    };
  } else {
    // 18:01 às 04:59 -> Boa noite
    return {
      saudacao: "boa noite",
      saudacaoCapitalizada: "Boa noite",
      otimaSaudacao: "Uma ótima noite",
      periodo: "noite",
      horaFormatada,
    };
  }
}

/**
 * Ajusta automaticamente qualquer texto para a saudação correta do horário atual
 * Substitui tags dinâmicas ({saudacao}, {Saudacao}, {otima_saudacao}) e corrige
 * saudações estáticas que tenham sido digitadas fora do horário correspondente.
 */
export function ajustarSaudacaoPorHorario(texto: string, data: Date = new Date()): string {
  if (!texto) return "";
  const info = obterSaudacaoTempo(data);

  let resultado = texto
    .replace(/{saudacao}/g, info.saudacao)
    .replace(/{Saudacao}/g, info.saudacaoCapitalizada)
    .replace(/{otima_saudacao}/g, info.otimaSaudacao);

  // Correção inteligente de saudações estáticas (ex: substituir "boa tarde" por "boa noite" se for > 18:01)
  // 1. "Uma ótima tarde" / "Um ótimo dia" / "Uma ótima noite"
  resultado = resultado.replace(/\b(uma? ótim[ao] (tarde|dia|noite))\b/gi, (match) => {
    const isFirstUpper = match[0] === match[0].toUpperCase();
    return isFirstUpper ? info.otimaSaudacao : info.otimaSaudacao.toLowerCase();
  });

  // 2. "Boa tarde" / "Bom dia" / "Boa noite" (com primeira maiúscula)
  resultado = resultado.replace(/\b(Boa tarde|Bom dia|Boa noite)\b/g, info.saudacaoCapitalizada);

  // 3. "boa tarde" / "bom dia" / "boa noite" (minúsculo)
  resultado = resultado.replace(/\b(boa tarde|bom dia|boa noite)\b/g, info.saudacao);

  return resultado;
}
