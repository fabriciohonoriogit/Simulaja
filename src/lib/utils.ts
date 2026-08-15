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
  
  const dc = lead.dados_cadastro || {};
  const valor = Number(lead.valor_credito || lead.valor_estimado || lead.valor_venda || dc.valor_credito || 0);

  // Excluir lead fantasma de 110k sem adesão/contrato confirmado
  if (valor === 110000 && !lead.data_adesao && !dc.data_adesao && !dc.data_venda && !lead.grupo) {
    return false;
  }

  const s = (lead.status || "").toLowerCase().replace("_", " ").trim();
  const isClosed = [
    "fechado", "venda fechada", "venda_fechada", "contrato assinado", 
    "contrato_assinado", "comissao paga", "comissao_paga"
  ].includes(s) || Boolean(lead.data_adesao || dc.data_venda || dc.data_fechamento);

  if (!isClosed) return false;

  const isShadow = lead.origem === "carteira_shadow";
  if (isShadow) return false;

  // 1. Data explícita de venda ou cadastro
  const explicitSaleDate = dc.data_venda || 
                           dc.data_fechamento || 
                           dc.data_adesao || 
                           lead.data_adesao ||
                           lead.status_updated_at ||
                           lead.created_at;

  if (explicitSaleDate) {
    const saleMonth = String(explicitSaleDate).substring(0, 7);
    return saleMonth === targetMonthStr || !targetMonthStr;
  }

  return true;
}

