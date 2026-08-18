/**
 * Padrões de formatação para o CRM
 */

/**
 * Formata um nome para TODAS LETRAS MAIÚSCULAS
 */
export const formatToUpper = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.trim().toUpperCase();
};

/**
 * Formata números para o padrão de 4 dígitos (ex: 0392)
 * Se não for um número válido, retorna o texto original limpo
 */
export const formatToFourDigits = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  
  const strValue = String(value).trim();
  if (strValue === "") return "";
  
  // Remove qualquer caractere que não seja número para a formatação
  const cleanValue = strValue.replace(/\D/g, "");
  
  if (cleanValue === "") return strValue.toUpperCase(); // Caso contenha apenas letras, mantém maiúsculo
  
  return cleanValue.padStart(4, "0");
};

/**
 * Converte qualquer string de data UTC (com ou sem Z, com espaço ou T)
 * em um objeto Date no fuso horário local do usuário.
 */
export const parseUTCDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  let str = String(dateStr).trim();
  if (!str) return null;

  // Substitui espaço por T se for formato "YYYY-MM-DD HH:mm:ss"
  if (str.includes(' ') && !str.includes('T')) {
    str = str.replace(' ', 'T');
  }
  
  // Se for ISO sem fuso (ex: "2026-08-18T17:51:00" ou "2026-08-18T17:51:00.000000"),
  // adiciona 'Z' para indicar explicitamente UTC para que o JS converta para a hora local.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !/[Zz+\-]\d{2}/.test(str.slice(19))) {
    str += 'Z';
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

