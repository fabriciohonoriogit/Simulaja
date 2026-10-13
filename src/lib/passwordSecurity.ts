/**
 * Módulo de validação de segurança de senhas.
 * Integra com o serviço HaveIBeenPwned (k-Anonymity SHA-1) para impedir senhas vazadas.
 */

export interface LeakedPasswordCheckResult {
  isLeaked: boolean;
  breachCount: number;
}

/**
 * Verifica se a senha já esteve presente em vazamentos públicos conhecidos.
 * Usa o modelo oficial de k-Anonymity do HaveIBeenPwned:
 * Apenas os 5 primeiros caracteres do hash SHA-1 são enviados à API externa,
 * garantindo que a senha original NUNCA seja transmitida ou exposta.
 */
export async function checkLeakedPassword(password: string): Promise<LeakedPasswordCheckResult> {
  if (!password || password.trim().length === 0) {
    return { isLeaked: false, breachCount: 0 };
  }

  // Senhas muito curtas já são rejeitadas por tamanho mínimo
  if (password.length < 6) {
    return { isLeaked: false, breachCount: 0 };
  }

  try {
    // 1. Gera o hash SHA-1 no navegador usando Web Crypto API nativa
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    // 2. Separa os 5 primeiros caracteres (prefixo) dos restantes (sufixo)
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    // 3. Consulta a API com cabeçalho de proteção de tráfego
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: "GET",
      headers: {
        "Add-Padding": "true",
      },
    });

    if (!response.ok) {
      // Se a API externa estiver instável ou indisponível, não bloqueia o usuário
      return { isLeaked: false, breachCount: 0 };
    }

    const text = await response.text();
    const lines = text.split("\r\n");

    for (const line of lines) {
      const [itemSuffix, countStr] = line.split(":");
      if (itemSuffix && itemSuffix.trim().toUpperCase() === suffix) {
        const breachCount = parseInt(countStr ? countStr.trim() : "1", 10);
        return { isLeaked: true, breachCount: isNaN(breachCount) ? 1 : breachCount };
      }
    }

    return { isLeaked: false, breachCount: 0 };
  } catch (error) {
    console.warn("[passwordSecurity] Verificação de senha vazada indisponível:", error);
    return { isLeaked: false, breachCount: 0 };
  }
}
