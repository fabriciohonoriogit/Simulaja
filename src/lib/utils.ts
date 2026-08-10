import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "R$0,00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$0,00";
  
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).replace(/\u00a0/g, "").replace("R$", "R$");
}

/**
 * Especial para Leads: Trata o valor 1 como 0.
 * Comum em dados importados que usam 1 como placeholder.
 */
export function formatLeadValue(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value || 0);
  if (num === 1) return formatCurrency(0);
  return formatCurrency(num);
}

/** Converte valor formatado em BRL (ex: "R$ 110.000,00") para number */
export function parseBRLValue(v: unknown): number {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Verifica se um lead representa uma venda realizada no mês de referência.
 * Exclui vendas retroativas, rascunhos, shadow e verifica a data real de fechamento.
 */
export function isVendaRealizadaNoMes(lead: any, targetMonthStr: string): boolean {
  if (!lead) return false;
  
  const s = (lead.status || "").toLowerCase().replace("_", " ");
  const isClosed = s === "fechado" || s === "venda fechada";
  if (!isClosed) return false;

  const isShadow = lead.origem === "carteira_shadow";
  const isRetroativo = lead.dados_cadastro?.is_retroativo === true;
  if (isShadow || isRetroativo) return false;

  const closingDate = lead.dados_cadastro?.data_venda || 
                      lead.dados_cadastro?.data_fechamento || 
                      lead.dados_cadastro?.data_adesao || 
                      lead.status_updated_at;

  if (!closingDate) return false;

  return closingDate.startsWith(targetMonthStr);
}

