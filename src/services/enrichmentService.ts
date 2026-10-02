/**
 * Service de Enriquecimento de Dados & Validação baseada em APIs Públicas (public-apis)
 * Conecta o Contemplar CRM com APIs gratuitas como BrasilAPI, BCB e Validações de Mídia.
 */

export interface CNPJEnrichmentResult {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnaeDescricao: string;
  capitalSocial: number;
  uf: string;
  municipio: string;
  porte: string;
  socios: { nome: string; qualificacao: string }[];
}

export interface CEPEnrichmentResult {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  latitude?: number;
  longitude?: number;
}

export interface EconomyIndexesResult {
  selic: number;
  cdi: number;
  ipca: number;
  atualizadoEm: string;
}

/**
 * Enriquece um Lead PJ a partir do CNPJ usando a BrasilAPI (public-api gratuita)
 */
export async function enrichCNPJ(cnpjInput: string): Promise<CNPJEnrichmentResult | null> {
  const cnpjClean = cnpjInput.replace(/\D/g, "");
  if (cnpjClean.length !== 14) {
    throw new Error("CNPJ inválido. Deve conter 14 dígitos.");
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Erro na consulta de CNPJ (${res.status})`);
    }

    const data = await res.json();
    return {
      cnpj: data.cnpj,
      razaoSocial: data.razao_social || "",
      nomeFantasia: data.nome_fantasia || data.razao_social || "",
      cnaeDescricao: data.cnae_fiscal_descricao || "",
      capitalSocial: Number(data.capital_social || 0),
      uf: data.uf || "",
      municipio: data.municipio || "",
      porte: data.porte || "N/I",
      socios: (data.qsa || []).map((s: any) => ({
        nome: s.nome_socio_raz_social || "",
        qualificacao: s.qualificacao_socio || "",
      })),
    };
  } catch (error) {
    console.error("❌ Erro no enriquecimento de CNPJ:", error);
    return null;
  }
}

/**
 * Consulta e autocompleta endereço e coordenadas via CEP (BrasilAPI)
 */
export async function enrichCEP(cepInput: string): Promise<CEPEnrichmentResult | null> {
  const cepClean = cepInput.replace(/\D/g, "");
  if (cepClean.length !== 8) {
    throw new Error("CEP inválido. Deve conter 8 dígitos.");
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepClean}`);
    if (!res.ok) return null;

    const data = await res.json();
    return {
      cep: data.cep,
      logradouro: data.street || "",
      bairro: data.neighborhood || "",
      cidade: data.city || "",
      uf: data.state || "",
      latitude: data.location?.coordinates?.latitude ? Number(data.location.coordinates.latitude) : undefined,
      longitude: data.location?.coordinates?.longitude ? Number(data.location.coordinates.longitude) : undefined,
    };
  } catch (error) {
    console.error("❌ Erro no enriquecimento de CEP:", error);
    return null;
  }
}

/**
 * Obtém os principais indicadores financeiros atualizados (Selic/CDI/IPCA) via BrasilAPI & BCB
 */
export async function fetchEconomyIndexes(): Promise<EconomyIndexesResult> {
  try {
    const res = await fetch("https://brasilapi.com.br/api/taxas/v1");
    if (!res.ok) throw new Error("Falha ao obter taxas de juros");
    
    const taxas = await res.json();
    const selicObj = taxas.find((t: any) => t.nome === "Selic");
    const cdiObj = taxas.find((t: any) => t.nome === "CDI");
    const ipcaObj = taxas.find((t: any) => t.nome === "IPCA");

    return {
      selic: selicObj ? selicObj.valor : 10.75,
      cdi: cdiObj ? cdiObj.valor : 10.65,
      ipca: ipcaObj ? ipcaObj.valor : 4.5,
      atualizadoEm: new Date().toLocaleDateString("pt-BR"),
    };
  } catch (error) {
    console.warn("⚠️ Usando taxas padrão do mercado:", error);
    return {
      selic: 10.75,
      cdi: 10.65,
      ipca: 4.5,
      atualizadoEm: new Date().toLocaleDateString("pt-BR"),
    };
  }
}

/**
 * Validação de qualidade de e-mail (detecta provedores temporários / fakes)
 */
export function validateEmailQuality(email: string): { isValid: boolean; isDisposable: boolean; message?: string } {
  if (!email || !email.includes("@")) {
    return { isValid: false, isDisposable: false, message: "E-mail com formato inválido" };
  }

  const disposableDomains = [
    "mailinator.com", "tempmail.com", "guerrillamail.com", "10minutemail.com",
    "trashmail.com", "sharklasers.com", "dispostable.com", "yopmail.com"
  ];

  const domain = email.split("@")[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return { isValid: false, isDisposable: true, message: "E-mails temporários não são permitidos para simulação." };
  }

  return { isValid: true, isDisposable: false };
}

/**
 * Gera URL de acompanhamento com UTMs para envio de proposta por WhatsApp
 */
export function generateTrackedProposalUrl(baseUrl: string, leadId: string, propostaId: string, canal: string = "whatsapp"): string {
  const url = new URL(baseUrl);
  url.searchParams.set("lead_id", leadId);
  url.searchParams.set("prop_id", propostaId);
  url.searchParams.set("utm_source", canal);
  url.searchParams.set("utm_medium", "crm_proposal");
  url.searchParams.set("utm_campaign", "consortia_quote");
  return url.toString();
}
