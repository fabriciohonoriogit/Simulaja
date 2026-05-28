/**
 * Variáveis de ambiente públicas (apenas Supabase URL + anon key).
 * Chaves privadas (AI, Z-API) NUNCA devem ficar aqui — vivem em edge functions.
 */

const required = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`[ENV] Variável de ambiente obrigatória não encontrada: ${key}`);
  }
  return value;
};

export const env = {
  supabase: {
    url: required("VITE_SUPABASE_URL"),
    anonKey: required("VITE_SUPABASE_ANON_KEY"),
  },
} as const;
