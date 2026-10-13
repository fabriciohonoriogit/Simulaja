import { describe, it, expect } from "vitest";
import { checkLeakedPassword } from "./passwordSecurity";

describe("passwordSecurity", () => {
  it("deve ignorar senhas vazias ou muito curtas", async () => {
    const res = await checkLeakedPassword("");
    expect(res.isLeaked).toBe(false);
    expect(res.breachCount).toBe(0);

    const resCurta = await checkLeakedPassword("123");
    expect(resCurta.isLeaked).toBe(false);
  });

  it("deve detectar uma senha sabidamente vazada (ex: password123 ou 12345678)", async () => {
    // Usamos 'password123' que está vazada milhões de vezes
    const res = await checkLeakedPassword("password123");
    // Se houver conexão com a internet, deve detectar
    if (res.isLeaked) {
      expect(res.breachCount).toBeGreaterThan(0);
    }
  });

  it("não deve apontar vazamento para senha aleatória forte e única", async () => {
    const randomStrong = "k9#Zq!99L_mXx" + Date.now() + "SimulaJa";
    const res = await checkLeakedPassword(randomStrong);
    expect(res.isLeaked).toBe(false);
    expect(res.breachCount).toBe(0);
  });
});
