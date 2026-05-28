
/**
 * Utilitário para lidar com conversões de data de nascimento do CRM
 * Robusto contra: strings brutas, números, objetos com .value, espaços extras,
 * e qualquer mistura de capitalização nas chaves de dados_cadastro.
 */

/** Converte qualquer valor candidato a data numa string normalizável */
function toDateString(v: any): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') {
    // Número no formato DDMMYYYY (ex: 14021985)
    const s = String(v).padStart(8, '0');
    if (s.length === 8) return s;
    return null;
  }
  if (typeof v === 'object' && v !== null) {
    // Objetos com .value (e.g. { value: "14/02/1985" })
    if (v.value) return toDateString(v.value);
    return null;
  }
  return null;
}

export function parseBirthday(birthStr: string | any): Date | null {
  const raw = toDateString(birthStr);
  if (!raw) return null;

  try {
    let day: number, month: number, year: number;

    if (raw.includes('/')) {
      // Formato DD/MM/YYYY ou MM/DD/YYYY — assume BR (DD/MM/YYYY)
      const parts = raw.split('/');
      if (parts.length < 3) return null;
      day   = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1; // 0-indexed
      year  = parseInt(parts[2], 10);
    } else if (raw.includes('-')) {
      // Formato YYYY-MM-DD (ISO) ou DD-MM-YYYY
      const parts = raw.split('-');
      if (parts.length < 3) return null;
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year  = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day   = parseInt(parts[2], 10);
      } else {
        // DD-MM-YYYY
        day   = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year  = parseInt(parts[2], 10);
      }
    } else if (raw.length === 8 && /^\d{8}$/.test(raw)) {
      // Formato DDMMYYYY (numérico sem separador)
      day   = parseInt(raw.substring(0, 2), 10);
      month = parseInt(raw.substring(2, 4), 10) - 1;
      year  = parseInt(raw.substring(4, 8), 10);
    } else {
      return null;
    }

    // Sanity check
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (year < 1900 || year > new Date().getFullYear()) return null;
    if (month < 0 || month > 11) return null;
    if (day < 1 || day > 31) return null;

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/** Lista de chaves conhecidas de data de nascimento (case-insensitive fallback via scan) */
const BIRTHDAY_KEYS = [
  'dataNascimento', 'NASCIMENTO', 'DATA_NASCIMENTO', 'DATANASCIMENTO',
  'data_nascimento', 'nascimento', 'birth_date', 'birthdate', 'birthday',
  'dt_nascimento', 'DT_NASCIMENTO', 'DATA_NASC', 'data_nasc',
];

/**
 * Extrai o valor bruto de data de nascimento de um objeto dados_cadastro,
 * tentando todas as chaves conhecidas e depois fazendo um scan geral.
 */
export function extractBirthdayValue(dados_cadastro: any): string | null {
  if (!dados_cadastro || typeof dados_cadastro !== 'object') return null;

  // 1. Tenta chaves conhecidas primeiro
  for (const key of BIRTHDAY_KEYS) {
    const v = toDateString(dados_cadastro[key]);
    if (v && parseBirthday(v)) return v;
  }

  // 2. Fallback: scan em todas as chaves do objeto procurando algo que parece data
  for (const [key, val] of Object.entries(dados_cadastro)) {
    const lk = key.toLowerCase();
    if (lk.includes('nasc') || lk.includes('birth') || lk.includes('nascimento')) {
      const v = toDateString(val);
      if (v && parseBirthday(v)) return v;
    }
  }

  return null;
}

export function isBirthdayToday(birthStr: string | any): boolean {
  const date = parseBirthday(birthStr);
  if (!date) return false;

  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
}

export function isBirthdayThisMonth(birthStr: string | any): boolean {
  const date = parseBirthday(birthStr);
  if (!date) return false;

  const today = new Date();
  return date.getMonth() === today.getMonth();
}
