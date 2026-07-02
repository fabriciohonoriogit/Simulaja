export type GrupoItem = { 
  grupo: string; 
  grupoLinear?: string;
  credito: number; 
  prazo: number; 
  prazoLinear?: number;
  r50: number; 
  r100?: number; 
  tx5050?: number; 
  txLinear?: number; 
  fr5050?: number; 
  frLinear?: number; 
  tx?: number; 
  fr?: number; 
  seguro?: number; 
  isPromo?: boolean; 
};

export type GrupoCaracteristicas = {
  grupo: string;
  reajuste: string;
  primeiraAssembleia: string;
  proximaAssembleia: string;
  caracteristicas: string;
  ordemContemplacao: string;
  opcaoDiluir: string;
  regraReajuste: string;
};

export type Category = { id: string; label: string; icon: string; };

export const GRUPO_CARACTERISTICAS: Record<string, GrupoCaracteristicas> = {
  "6043": {
    grupo: "6043",
    reajuste: "INCC",
    primeiraAssembleia: "24/06/2026",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Imóvel linear, 75/25 e 50/50. Crédito - 110.000,00 a 220.000,00. ****** DEVIDO A RESOLUÇAO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance livre, Fixo 25% (desde a 1ª conf. saldo) e Fixo 45% (à partir 10ª assembleia), onde inicia repetição entre todos lances conforme saldo grupo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste todo o mês de Outubro pelo INCC a partir de Outubro 2027."
  },
  "6042": {
    grupo: "6042",
    reajuste: "INCC",
    primeiraAssembleia: "24/06/2026",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Imóvel linear e 50/50. Crédito - 350.000,00 a 700.000,00. EMBUTIDO 25%. Plano Gestor Investidor - Sem comissão.",
    ordemContemplacao: "Sorteio, Lance livre, Lance Fidelidade (a partir da 13ª ass - limitado a 50% - cotas com 12 pagamentos), Fixo 25% (desde a 1ª conf. saldo) e Fixo 45% (a partir da 10ª assembleia), após a 14ª ass lances alternados por 3 vezes.",
    opcaoDiluir: "Opção de diluir o lance total. Quitação de 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste todo o mês de Outubro pelo INCC a partir de Outubro 2027."
  },
  "6041": {
    grupo: "6041",
    reajuste: "INCC",
    primeiraAssembleia: "26/11/2025",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Imóvel linear, 75/25 e 50/50. Crédito - 120.000,00 a 230.000,00. ****** DEVIDO A RESOLUÇAO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance livre, Fixo 25% (desde a 1ª conf. saldo) e Fixo 45% (a partir da 10ª assembleia), onde inicia repetição entre todos lances conforme saldo grupo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste todo o mês de Outubro pelo INCC a partir de Outubro 2026."
  },
  "6040": {
    grupo: "6040",
    reajuste: "INCC",
    primeiraAssembleia: "24/05/2025",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Imóvel linear, 75/25 e 50/50. Crédito - 120.000,00 a 230.000,00. ****** DEVIDO A RESOLUÇAO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance livre, Fixo 25% (desde a 1ª conf. saldo) e Fixo 45% (a partir da 10ª assembleia), onde inicia repetição entre todos lances conforme saldo grupo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste todo o mês de Outubro pelo INCC a partir de Outubro 2026."
  },
  "6039": {
    grupo: "6039",
    reajuste: "INCC",
    primeiraAssembleia: "24/05/2025",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Imóvel linear e 50/50. Crédito - 360.000,00 a 700.000,00. ****** DEVIDO A RESOLUÇAO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance livre, Fixo 25% (desde a 1ª conf. saldo) e Fixo 45% (a partir da 10ª assembleia), onde inicia alternação 3x dos lances conforme saldo do grupo.",
    opcaoDiluir: "Opção de diluir o lance total. Quitação de 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste todo o mês de Outubro pelo INCC a partir de Outubro 2026."
  },
  "6038": {
    grupo: "6038",
    reajuste: "INCC",
    primeiraAssembleia: "25/01/2025",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Imóvel linear, 75/25 e 50/50. Crédito - 130.000,00 a 230.000,00. ****** DEVIDO A RESOLUÇAO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance livre, Fixo 25% (desde a 1ª conf. saldo) e Fixo 45% (a partir da 10ª assembleia), onde inicia repetição entre todos lances conforme saldo grupo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste todo o mês de Outubro pelo INCC a partir de Outubro 2025."
  },
  "6037": {
    grupo: "6037",
    reajuste: "INCC",
    primeiraAssembleia: "24/08/2024",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Imóvel linear, 75/25 e 50/50. Crédito - 130.000,00 a 230.000,00. ****** DEVIDO A RESOLUÇAO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance livre, Fixo 25% (desde a 1ª conf. saldo) e Fixo 45% (a partir da 10ª assembleia), onde inicia alternação 3x dos lances conforme saldo do grupo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste todo o mês de Outubro pelo INCC a partir de Outubro 2025."
  },
  "6035": {
    grupo: "6035",
    reajuste: "INCC",
    primeiraAssembleia: "22/06/2024",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Imóvel linear, 75/25 e 50/50. Crédito - 340.000,00 a 650.000,00. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance livre, Fixo 25% (desde a 1ª conf. saldo) e Fixo 45% (a partir da 10ª assembleia), onde inicia alternação 3x dos lances conforme saldo do grupo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste todo o mês de Outubro pelo INCC a partir de Outubro 2025."
  },
  "5297": {
    grupo: "5297",
    reajuste: "IPCA",
    primeiraAssembleia: "25/07/2026",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "AUTO LINEAR, 50/50 E 75/25 - CRÉD 40 A 80 MIL. ****** DEVIDO A RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% e Segundo Fixo 45% (desde a 1ª ass. conforme saldo). A partir da 3ª ass inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total. O lance poderá quitar até 2 parcelas subsequentes na contemplação.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2027."
  },
  "5295": {
    grupo: "5295",
    reajuste: "IPCA",
    primeiraAssembleia: "25/04/2026",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 90 A 140 MIL. ***** DEVIDO A RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (a partir da 3ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 6ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2025."
  },
  "5294": {
    grupo: "5294",
    reajuste: "IPCA",
    primeiraAssembleia: "25/03/2026",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 40 A 80 MIL. ****** DEVIDO A RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 3ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total. O lance poderá quitar até 2 parcelas subsequentes na contemplação.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2027."
  },
  "5292": {
    grupo: "5292",
    reajuste: "IPCA",
    primeiraAssembleia: "25/10/2025",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 40 A 80 MIL. ****** DEVIDO A RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 3ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total. O lance poderá quitar até 2 parcelas subsequentes na contemplação.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2026."
  },
  "5291": {
    grupo: "5291",
    reajuste: "IPCA",
    primeiraAssembleia: "23/08/2025",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 90 A 140 MIL. ***** DEVIDO A RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (a partir da 3ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 6ª ass) e continua no livre enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2026."
  },
  "5290": {
    grupo: "5290",
    reajuste: "IPCA",
    primeiraAssembleia: "26/07/2025",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 40 A 80 MIL. ****** DEVIDO A RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 3ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total. O lance poderá quitar até 2 parcelas subsequentes na contemplação.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2026."
  },
  "5288": {
    grupo: "5288",
    reajuste: "IPCA",
    primeiraAssembleia: "22/03/2025",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 40 A 80 MIL. ****** DEVIDO A RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 3ª ass), continua no lance livre enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2025."
  },
  "5287": {
    grupo: "5287",
    reajuste: "IPCA",
    primeiraAssembleia: "21/12/2024",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 40 A 80 MIL. ****** DEVIDO A RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 3ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total. O lance quitará 2 parcelas subsequentes na contemplação.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2025."
  },
  "5286": {
    grupo: "5286",
    reajuste: "IPCA",
    primeiraAssembleia: "21/12/2024",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 90 A 170 MIL. ***** DEVIDO A RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (a partir da 3ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 6ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2025."
  },
  "5284": {
    grupo: "5284",
    reajuste: "IPCA",
    primeiraAssembleia: "24/08/2024",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 40 A 80 MIL. ****** DEVIDO A RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 3ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2025."
  },
  "5282": {
    grupo: "5282",
    reajuste: "IPCA",
    primeiraAssembleia: "22/06/2024",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 75/25 E 50/50 - CRÉD 100 A 170 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (a partir da 3ª ass) e Segundo Fixo 45% (a partir da 6ª ass), onde inicia repetição entre lance livre, fixo e o segundo lance fixo de 45% por 3 vezes, depois somente lance livre.",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes no lance e lance diluído total.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2025."
  },
  "5281": {
    grupo: "5281",
    reajuste: "IPCA",
    primeiraAssembleia: "24/04/2024",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 45 A 80 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 3ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2024."
  },
  "5278": {
    grupo: "5278",
    reajuste: "IPCA",
    primeiraAssembleia: "23/12/2023",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 45 A 80 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 5ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2024."
  },
  "5277": {
    grupo: "5277",
    reajuste: "IPCA",
    primeiraAssembleia: "25/10/2023",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 45 A 80 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 5ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2024."
  },
  "5275": {
    grupo: "5275",
    reajuste: "IPCA",
    primeiraAssembleia: "23/09/2023",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 75/25 E 50/50 - CRÉD 100 A 170 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (a partir da 3ª ass) e Segundo Fixo 45% (a partir da 6ª ass), onde inicia repetição entre lance livre e o segundo lance fixo de 45% por 3 vezes, depois somente lance livre.",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes no lance e lance diluído total.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2024."
  },
  "5274": {
    grupo: "5274",
    reajuste: "IPCA",
    primeiraAssembleia: "24/06/2023",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 40 A 80 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 5ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2024."
  },
  "5272": {
    grupo: "5272",
    reajuste: "IPCA",
    primeiraAssembleia: "25/03/2023",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 37 A 70 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 5ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2023."
  },
  "5271": {
    grupo: "5271",
    reajuste: "IPCA",
    primeiraAssembleia: "24/12/2022",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 37 A 70 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 5ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2023."
  },
  "5268": {
    grupo: "5268",
    reajuste: "IPCA",
    primeiraAssembleia: "26/11/2022",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 75/25 E 50/50 - CRÉD 90 A 160 MIL. REAJUSTE ANUAL PELO IPCA LIMITADO A 5%. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (a partir da 3ª ass) e Segundo Fixo 45% (a partir da 6ª ass), onde inicia repetição entre lance livre e o segundo lance fixo de 45% por 3 vezes, depois somente lance livre. Na cont. plano 75/25 e 50/50 tem que pagar residual.",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes no lance e lance diluído total.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA (limitado a 5%) a partir de Outubro 2023."
  },
  "5267": {
    grupo: "5267",
    reajuste: "IPCA",
    primeiraAssembleia: "24/09/2022",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 50/50 E 75/25 - CRÉD 37 A 70 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 5ª ass), onde inicia repetição entre os lances enquanto houver saldo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2023."
  },
  "5264": {
    grupo: "5264",
    reajuste: "IPCA",
    primeiraAssembleia: "25/05/2022",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR E 75/25 - CRÉD 40 A 80 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 5ª ass), onde inicia repetição entre Livre e Segundo Fixo de 45% por 3X, depois só Livre.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2022."
  },
  "5263": {
    grupo: "5263",
    reajuste: "IPCA",
    primeiraAssembleia: "25/05/2022",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR E 75/25 - CRÉD 36 A 65 MIL. IPCA LIMITADO A 2%. LANCE EMBUTIDO DE 25%. Valorização anual do crédito em Outubro pelo IPCA limitado a 2%.",
    ordemContemplacao: "Sorteio, Livre, Fixo 25%, Segundo Fixo 45% (a partir da 5ª ass onde inicia repetição de 3X entre Livre e Segundo Fixo). Sorteio extra na 5ª, 10ª e 15ª ass.",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes no lance e lance diluído total.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA (limitado a 2%) a partir de Outubro 2022."
  },
  "5260": {
    grupo: "5260",
    reajuste: "IPCA",
    primeiraAssembleia: "23/02/2022",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR, 75/25 E 50/50 - CRÉD 40 A 70 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 5ª ass) onde inicia a repetição entre o lance livre e o segundo lance fixo de 45% por 3 vezes, depois somente lance livre.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2022."
  },
  "5259": {
    grupo: "5259",
    reajuste: "IPCA",
    primeiraAssembleia: "22/12/2021",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR E 75/25 - CRÉD 80 A 130 MIL. LANCE EMBUTIDO DE 25%. Na cont. plano 75/25 tem que pagar os 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (a partir da 3ª ass) e Segundo Fixo 45% (a partir da 6ª ass) onde inicia a repetição entre o lance livre e o segundo lance fixo de 45% por 3 vezes, depois somente lance livre.",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes no lance e lance diluído total.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2022."
  },
  "5257": {
    grupo: "5257",
    reajuste: "IPCA",
    primeiraAssembleia: "22/12/2021",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR E 75/25 - CRÉD 35 A 60 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 5ª ass) onde inicia a repetição entre o lance livre e o segundo lance fixo de 45% por 3 vezes, depois somente lance livre.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2022."
  },
  "5251": {
    grupo: "5251",
    reajuste: "IPCA",
    primeiraAssembleia: "25/08/2021",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR E 75/25 - CRÉD 80 A 120 MIL. 10 contemplações em agosto e 10 em setembro de 2021. LANCE EMBUTIDO DE 25%. Na cont. plano 75/25 tem que pagar os 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% e Segundo Fixo 45% (desde a 1ª ass. conforme saldo).",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes no lance e lance diluído total.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2022."
  },
  "5247": {
    grupo: "5247",
    reajuste: "IPCA",
    primeiraAssembleia: "24/07/2021",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR E 75/25 - CRÉD 40 A 60 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (já disponível).",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA a partir de Outubro 2022."
  },
  "5245": {
    grupo: "5245",
    reajuste: "IPCA",
    primeiraAssembleia: "22/05/2021",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR E 75/25 - CRÉD 35 A 60 MIL. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% e Segundo Fixo 45%.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA em Outubro conf. AGE 21/07/21, alterando de IGPM para IPCA."
  },
  "5243": {
    grupo: "5243",
    reajuste: "IPCA",
    primeiraAssembleia: "24/03/2021",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR E 75/25 - CRÉD 60 A 100 MIL Conf. Circular 4009. LANCE EMBUTIDO DE 25%. Na cont. plano 75/25 tem que pagar os 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% e Segundo Fixo 45% (alterna 3x os lances).",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes no lance e lance diluído total.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA em Outubro conf. AGE 21/07/21, alterando de IGPM para IPCA."
  },
  "5242": {
    grupo: "5242",
    reajuste: "IPCA",
    primeiraAssembleia: "24/02/2021",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR E 75/25 - CRÉD 60 A 100 MIL Conf. Circular 4009. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 6ª ass).",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA em Outubro conf. AGE 21/07/21, alterando de IGPM para IPCA."
  },
  "5240": {
    grupo: "5240",
    reajuste: "IPCA",
    primeiraAssembleia: "24/12/2020",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_AL - AUTO LINEAR E 75/25 - CRÉD 60 A 100 MIL Conf. Circular 4009. LANCE EMBUTIDO DE 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% (desde a 1ª ass. conforme saldo) e Segundo Fixo 45% (a partir da 6ª ass).",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes no lance e lance diluído total.",
    regraReajuste: "Reajuste anual no mês de Outubro pelo IPCA em Outubro conf. AGE 21/07/21, alterando de IGPM para IPCA."
  },
  "5999": {
    grupo: "5999",
    reajuste: "IPCA",
    primeiraAssembleia: "31/05/2011",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PL_L - GRUPO APTA. CRÉD 250 a 400 mil. LANCE EMBUTIDO DE 25%. Vendas exclusivas APTA pós cont. fundo comum passa a ser de 1,6667%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo 25% e repete lances conforme saldo conforme AGE 13/09/19.",
    opcaoDiluir: "Lance poderá quitar 2 parcelas subsequentes. Poderá ser solicitado diluição total, exceto vendas APTA.",
    regraReajuste: "Correção anual pelo IPCA em Outubro conforme AGE 21/07/21, alterando de IGPM para IPCA."
  },
  "5998": {
    grupo: "5998",
    reajuste: "IPCA",
    primeiraAssembleia: "24/12/2020",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Grupo Caminhão Linear e 75/25 - Créditos de 190 à 360 mil - conf. Circular Bacen 4.009/28/04/2020. Lance embutido de até: 30%.",
    ordemContemplacao: "Sorteio, Lance Livre e Fixo de 30% e alterna 3x os lances conforme saldo.",
    opcaoDiluir: "Opção quitação de 2 parcelas subsequentes na contemplação por lance e lance diluído total.",
    regraReajuste: "Correção anual pelo IPCA em Outubro conforme AGE 21/07/21, alterando de IGPM para IPCA."
  },
  "5997": {
    grupo: "5997",
    reajuste: "IPCA",
    primeiraAssembleia: "25/06/2022",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Grupo Veículo Pesado Linear, 75/25 e 50/50. Créditos de 190 a 360 mil. Lance embutido de até 25%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo de 25% (a partir da 5ª ass) e Fixo de 50% (desde a 1ª ass), na 8ª assembleia repete 3x o Lance Livre e Segundo Fixo, conforme saldo do grupo.",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes e diluição total do lance.",
    regraReajuste: "Valorização anual do crédito em Outubro pelo IPCA limitado a 5%."
  },
  "5996": {
    grupo: "5996",
    reajuste: "IPCA",
    primeiraAssembleia: "21/12/2024",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Grupo Veículo Pesado Linear, 75/25 e 50/50. ***** DEVIDO A RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. Créditos de 180 a 300 mil. Lance embutido de até 30%.",
    ordemContemplacao: "Sorteio, Lance Livre, Fixo de 30% a partir da 5ª ass, onde inicia alternação entre os lances, conforme saldo do grupo.",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes e diluição total do lance.",
    regraReajuste: "Valorização anual do crédito em Outubro pelo IPCA limitado a 5%."
  },
  "5296": {
    grupo: "5296",
    reajuste: "IPCA",
    primeiraAssembleia: "26/08/2026",
    proximaAssembleia: "26/08/2026",
    caracteristicas: "Plano moto linear Cred. 15 A 30 MIL e 50/50 Cred. 20 a 30 mil *** DEVIDO À RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. Embutido de 25%.",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 25% - Segundo Fixo 45% (desde a 1ª conf saldo), inicia repetição a partir da 5ª entre os lances.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2027."
  },
  "5293": {
    grupo: "5293",
    reajuste: "IPCA",
    primeiraAssembleia: "24/12/2025",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Plano moto linear Cred. 16 A 30 MIL e 50/50 Cred. 20 a 30 mil *** DEVIDO À RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. Embutido de 25%.",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 25% - Segundo Fixo 45%, inicia repetição a partir da 5ª entre os lances.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2026."
  },
  "5289": {
    grupo: "5289",
    reajuste: "IPCA",
    primeiraAssembleia: "24/05/2025",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Plano moto linear Cred. 16 A 30 MIL e 50/50 Cred. 20 a 30 mil *** DEVIDO À RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. Embutido de 25%.",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 25% - Segundo Fixo 45%, inicia repetição a partir da 5ª entre os lances.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2026."
  },
  "5285": {
    grupo: "5285",
    reajuste: "IPCA",
    primeiraAssembleia: "21/12/2024",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Plano moto linear Cred. 17 A 30 MIL e 50/50 Cred. 20 a 30 mil *** DEVIDO À RESOLUÇÃO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. Embutido de 25%. MEGA ASS. DEZ/24 - 40 CONT. (10-SORTEIO-10-LIVRE-10 FIXO de 25% e 10 FIXO de 45%).",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 25% - Segundo Fixo 45%, inicia repetição a partir da 5ª entre os lances.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2025."
  },
  "5283": {
    grupo: "5283",
    reajuste: "IPCA",
    primeiraAssembleia: "22/06/2024",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Plano moto linear e 50/50. Créditos de 17 a 30 mil. Embutido de 25%.",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 25% (desde a 1ª conf saldo) - Segundo Fixo 45% (A partir da 5ª Ass), onde inicia repetição de 3x entre livre, fixo e segundo fixo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2025."
  },
  "5280": {
    grupo: "5280",
    reajuste: "IPCA",
    primeiraAssembleia: "23/12/2023",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PLANO MOTO LINEAR. CRÉDITOS 17 A 22 MIL. EMBUTIDO DE 15%.",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 15% (1ª Ass) - Segundo Fixo 30% (A partir da 5ª Ass) depois continuar no livre conforme saldo.",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes no lance e lance diluído total.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2024."
  },
  "5276": {
    grupo: "5276",
    reajuste: "IPCA",
    primeiraAssembleia: "25/10/2023",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Plano moto linear e 50/50. Créditos de 22 a 30 mil. Embutido de 15%.",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 15% (A partir da 3ª Ass) - Segundo Fixo 30% (A partir da 3ª Ass) depois continua no livre.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2024."
  },
  "5273": {
    grupo: "5273",
    reajuste: "IPCA",
    primeiraAssembleia: "27/05/2023",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PLANO MOTO LINEAR. CRÉDITOS 17 A 22 MIL. EMBUTIDO DE 15%.",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 15% (1ª Ass) - Segundo Fixo 30% (A partir da 5ª Ass) depois continuar no livre conforme saldo.",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes no lance e lance diluído total.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2024."
  },
  "5270": {
    grupo: "5270",
    reajuste: "IPCA",
    primeiraAssembleia: "26/11/2022",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Plano moto linear e 50/50. Créditos de 19 A 30 mil. MEGA ASS 1ª E 2ª ASS - 30 CONT. POR LANCE. Embutido de 15%.",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 15% (A partir da 3ª Ass) - Segundo Fixo 30% (A partir da 3ª Ass) depois continua no livre.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2023."
  },
  "5266": {
    grupo: "5266",
    reajuste: "IPCA",
    primeiraAssembleia: "27/08/2022",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "PLANO MOTO LINEAR. CRÉDITOS 15 A 16 MIL. EMBUTIDO DE 15%.",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 15% - Segundo Fixo 30% (lances fixos já disponíveis). A partir da 5ª assembleia repete essa mesma ordem uma vez, conforme saldo do grupo.",
    opcaoDiluir: "Opção de quitação de 02 parcelas subsequentes no lance e lance diluído total.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2023."
  },
  "5265": {
    grupo: "5265",
    reajuste: "IPCA",
    primeiraAssembleia: "27/08/2022",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Plano moto linear e 50/50. Créditos de 17 A 30 mil. Embutido de 15%.",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 15% (Desde a 1ª conf. saldo) - Segundo Fixo 30% (A partir da 5ª assembleia, onde repete essa mesma ordem 1x conforme saldo).",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2023."
  },
  "5261": {
    grupo: "5261",
    reajuste: "IPCA",
    primeiraAssembleia: "23/03/2022",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Plano moto linear. Créditos de 17 a 30 mil. Embutido de 15%.",
    ordemContemplacao: "Sorteio - Lance Livre - Lance Fixo 15% (Desde a 1ª conf. saldo) - Segundo Fixo 30% (A partir da 5ª assembleia, onde repete essa mesma ordem uma vez conforme saldo do grupo).",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste pelo IPCA a partir de Outubro 2022."
  }
};

export const GRUPOS: Record<string, GrupoItem[]> = {
  imovel: [
    { grupo: "6043", credito: 110000, prazo: 219, r50: 390.16, r100: 630.62, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 120000, prazo: 219, r50: 425.63, r100: 687.95, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 120000, prazo: 212, r50: 456.42, r100: 721.43, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 120000, prazo: 206, r50: 467.66, r100: 741.43, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6043", credito: 130000, prazo: 219, r50: 461.10, r100: 745.27, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 130000, prazo: 212, r50: 494.45, r100: 781.55, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 130000, prazo: 206, r50: 506.63, r100: 803.22, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6038", credito: 130000, prazo: 202, r50: 515.88, r100: 818.37, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6037", credito: 130000, prazo: 197, r50: 527.98, r100: 838.11, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6043", credito: 140000, prazo: 219, r50: 496.57, r100: 802.60, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 140000, prazo: 212, r50: 532.49, r100: 841.67, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 140000, prazo: 206, r50: 545.60, r100: 865.00, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6038", credito: 140000, prazo: 202, r50: 555.56, r100: 881.32, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6037", credito: 140000, prazo: 197, r50: 568.60, r100: 902.58, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6043", credito: 150000, prazo: 219, r50: 532.04, r100: 859.93, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 150000, prazo: 212, r50: 570.52, r100: 901.79, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 150000, prazo: 206, r50: 584.57, r100: 926.79, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6038", credito: 150000, prazo: 202, r50: 595.25, r100: 944.27, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6037", credito: 150000, prazo: 197, r50: 609.21, r100: 967.05, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6043", credito: 160000, prazo: 219, r50: 567.51, r100: 917.26, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 160000, prazo: 212, r50: 608.56, r100: 961.91, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 160000, prazo: 206, r50: 623.54, r100: 988.57, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6038", credito: 160000, prazo: 202, r50: 634.93, r100: 1007.22, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6037", credito: 160000, prazo: 197, r50: 649.82, r100: 1031.52, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6043", credito: 170000, prazo: 219, r50: 602.98, r100: 974.59, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 170000, prazo: 212, r50: 646.59, r100: 1022.03, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 170000, prazo: 206, r50: 662.51, r100: 1050.36, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6038", credito: 170000, prazo: 202, r50: 674.61, r100: 1070.18, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6037", credito: 170000, prazo: 197, r50: 690.44, r100: 1096.00, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6043", credito: 180000, prazo: 219, r50: 638.45, r100: 1031.92, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 180000, prazo: 212, r50: 684.63, r100: 1082.14, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 180000, prazo: 206, r50: 701.48, r100: 1112.15, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6038", credito: 180000, prazo: 202, r50: 714.30, r100: 1133.13, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6037", credito: 180000, prazo: 197, r50: 731.05, r100: 1160.47, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6043", credito: 190000, prazo: 219, r50: 673.91, r100: 1089.25, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 190000, prazo: 212, r50: 722.66, r100: 1142.26, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 190000, prazo: 206, r50: 740.46, r100: 1173.93, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6038", credito: 190000, prazo: 202, r50: 753.98, r100: 1196.08, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6037", credito: 190000, prazo: 197, r50: 771.67, r100: 1224.94, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6043", credito: 200000, prazo: 219, r50: 709.38, r100: 1146.58, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 200000, prazo: 212, r50: 760.70, r100: 1202.38, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 200000, prazo: 206, r50: 779.43, r100: 1235.72, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6038", credito: 200000, prazo: 202, r50: 793.66, r100: 1259.03, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6037", credito: 200000, prazo: 197, r50: 812.28, r100: 1289.41, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6043", credito: 210000, prazo: 219, r50: 744.85, r100: 1203.90, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 210000, prazo: 212, r50: 798.73, r100: 1262.50, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 210000, prazo: 206, r50: 818.40, r100: 1297.50, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6038", credito: 210000, prazo: 202, r50: 833.35, r100: 1321.98, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6037", credito: 210000, prazo: 197, r50: 852.89, r100: 1353.88, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6043", credito: 220000, prazo: 219, r50: 780.32, r100: 1261.23, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 220000, prazo: 212, r50: 836.77, r100: 1322.62, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 220000, prazo: 206, r50: 857.37, r100: 1359.29, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6038", credito: 220000, prazo: 202, r50: 873.03, r100: 1384.93, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6037", credito: 220000, prazo: 197, r50: 893.51, r100: 1418.35, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6041", credito: 230000, prazo: 212, r50: 874.80, r100: 1382.74, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6040", credito: 230000, prazo: 206, r50: 896.34, r100: 1421.08, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6038", credito: 230000, prazo: 202, r50: 912.71, r100: 1447.88, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6037", credito: 230000, prazo: 197, r50: 934.12, r100: 1482.82, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6030", credito: 240000, prazo: 195, r50: 972.95, r100: 1562.38, txLinear: 20, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6027", credito: 250000, prazo: 189, r50: 973.59, r100: 1618.64, txLinear: 15, frLinear: 1, tx5050: 17, fr5050: 1, seguro: 0.0297, isPromo: true },
    { grupo: "6027", credito: 280000, prazo: 190, r50: 1131.69, r100: 1791.32, txLinear: 15, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6025", credito: 300000, prazo: 193, r50: 1145.81, r100: 1971.88, txLinear: 20, frLinear: 1, tx5050: 17, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6030", credito: 320000, prazo: 195, r50: 1297.27, r100: 2083.17, txLinear: 20, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6035", credito: 340000, prazo: 225, r50: 1240.32, r100: 1932.19, txLinear: 20, frLinear: 1, tx5050: 24, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6042", credito: 350000, prazo: 239, r50: 1146.22, r100: 1847.26, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6039", credito: 360000, prazo: 226, r50: 1238.97, r100: 2003.58, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 400000, prazo: 239, r50: 1309.97, r100: 2111.15, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6039", credito: 400000, prazo: 226, r50: 1376.64, r100: 2226.19, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6035", credito: 400000, prazo: 225, r50: 1459.20, r100: 2273.16, txLinear: 20, frLinear: 1, tx5050: 24, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6042", credito: 450000, prazo: 239, r50: 1473.71, r100: 2375.05, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6039", credito: 450000, prazo: 226, r50: 1548.72, r100: 2504.47, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6035", credito: 450000, prazo: 225, r50: 1641.60, r100: 2557.31, txLinear: 20, frLinear: 1, tx5050: 24, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6042", credito: 500000, prazo: 239, r50: 1637.46, r100: 2638.94, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6039", credito: 500000, prazo: 226, r50: 1720.80, r100: 2782.74, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6035", credito: 500000, prazo: 225, r50: 1824.00, r100: 2841.46, txLinear: 20, frLinear: 1, tx5050: 24, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6042", credito: 550000, prazo: 239, r50: 1801.21, r100: 2902.83, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6039", credito: 550000, prazo: 226, r50: 1892.88, r100: 3061.02, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6035", credito: 550000, prazo: 225, r50: 2006.40, r100: 3125.60, txLinear: 20, frLinear: 1, tx5050: 24, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6042", credito: 600000, prazo: 239, r50: 1964.95, r100: 3166.73, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6039", credito: 600000, prazo: 226, r50: 2064.96, r100: 3339.29, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6035", credito: 600000, prazo: 225, r50: 2188.80, r100: 3409.75, txLinear: 20, frLinear: 1, tx5050: 24, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6042", credito: 650000, prazo: 239, r50: 2128.70, r100: 3431.40, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6039", credito: 650000, prazo: 226, r50: 2237.04, r100: 3617.57, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6035", credito: 650000, prazo: 225, r50: 2371.20, r100: 3693.89, txLinear: 20, frLinear: 1, tx5050: 24, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6042", credito: 700000, prazo: 239, r50: 2292.44, r100: 3694.52, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6039", credito: 700000, prazo: 226, r50: 2409.12, r100: 3895.84, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 1000000, prazo: 239, r50: 3274.92, r100: 5277.88, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 1500000, prazo: 239, r50: 4912.38, r100: 7916.82, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 2000000, prazo: 239, r50: 6549.84, r100: 10555.76, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
  ],
  veiculo: [
    { grupo: "5296", credito: 15000, prazo: 100, r50: 195.30, r100: 195.30, txLinear: 25, frLinear: 2, seguro: 0.032, isPromo: true },
    { grupo: "5293", credito: 16000, prazo: 73, r50: 269.57, r100: 269.57, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5285", credito: 17000, prazo: 82, r50: 255.00, r100: 255.00, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5270", credito: 19000, prazo: 56, r50: 417.32, r100: 417.32, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5296", credito: 20000, prazo: 80, r50: 204.00, r100: 323.90, txLinear: 25, frLinear: 2, tx5050: 27, fr5050: 2, seguro: 0.032, isPromo: true },
    { grupo: "5280", credito: 22000, prazo: 70, r50: 386.57, r100: 386.57, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5296", credito: 25000, prazo: 80, r50: 255.02, r100: 404.89, txLinear: 25, frLinear: 2, tx5050: 27, fr5050: 2, seguro: 0.032, isPromo: true },
    { grupo: "5296", credito: 28000, prazo: 80, r50: 264.18, r100: 439.18, txLinear: 21, frLinear: 2, tx5050: 21, fr5050: 2, seguro: 0.030643, isPromo: true },
    { grupo: "5293", credito: 30000, prazo: 74, r50: 304.05, r100: 507.95, txLinear: 21, frLinear: 2, tx5050: 23, fr5050: 2, isPromo: true },
    { grupo: "5257", credito: 35000, prazo: 46, r50: 931.33, r100: 931.33, txLinear: 20, frLinear: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5297", credito: 40000, prazo: 100, r50: 288.00, r100: 496.20, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5281", credito: 45000, prazo: 73, r50: 439.07, r100: 759.62, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5297", credito: 50000, prazo: 100, r50: 359.99, r100: 620.25, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5294", credito: 55000, prazo: 96, r50: 412.09, r100: 710.01, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5297", credito: 60000, prazo: 100, r50: 431.99, r100: 744.30, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5263", credito: 65000, prazo: 50, r50: 1592.83, r100: 1592.83, txLinear: 20, frLinear: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5297", credito: 70000, prazo: 100, r50: 503.99, r100: 868.34, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5290", credito: 75000, prazo: 88, r50: 610.95, r100: 1054.13, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5297", credito: 80000, prazo: 100, r50: 575.99, r100: 992.39, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5259", credito: 85000, prazo: 45, r50: 2311.49, r100: 2311.49, txLinear: 20, frLinear: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5295", credito: 90000, prazo: 97, r50: 667.16, r100: 1131.11, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5268", credito: 95000, prazo: 56, r50: 1199.52, r100: 2081.66, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5295", credito: 100000, prazo: 97, r50: 741.29, r100: 1256.79, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5295", credito: 110000, prazo: 97, r50: 815.42, r100: 1382.47, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5295", credito: 120000, prazo: 97, r50: 889.55, r100: 1508.15, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5286", credito: 125000, prazo: 81, r50: 1102.94, r100: 1905.41, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5295", credito: 130000, prazo: 98, r50: 954.29, r100: 1563.18, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5291", credito: 135000, prazo: 89, r50: 1087.81, r100: 1876.57, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5295", credito: 140000, prazo: 97, r50: 1037.80, r100: 1759.50, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5282", credito: 150000, prazo: 87, r50: 1304.99, r100: 2096.68, txLinear: 18, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5282", credito: 160000, prazo: 87, r50: 1391.99, r100: 2236.46, txLinear: 18, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5275", credito: 165000, prazo: 66, r50: 1775.33, r100: 3075.33, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5282", credito: 170000, prazo: 87, r50: 1478.99, r100: 2376.24, txLinear: 18, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "2x 5295", credito: 180000, prazo: 98, r50: 1321.32, r100: 2164.40, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true }
  ],
  pesados: [
    { grupo: "5996", credito: 180000, prazo: 132, r50: 945.36, r100: 1613.54, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5996", credito: 190000, prazo: 131, r50: 1012.76, r100: 1737.95, txLinear: 15, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0292, isPromo: true },
    { grupo: "5997", credito: 200000, prazo: 111, r50: 1247.19, r100: 2130.16, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.029, isPromo: true },
    { grupo: "5996", credito: 220000, prazo: 132, r50: 1164.31, r100: 1980.42, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5997", credito: 250000, prazo: 111, r50: 1558.99, r100: 2662.70, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.029, isPromo: true },
    { grupo: "5999", credito: 260000, prazo: 58, r50: 5220.70, r100: 5220.70, txLinear: 14, frLinear: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5996", credito: 280000, prazo: 132, r50: 1481.85, r100: 2520.54, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5998", credito: 300000, prazo: 53, r50: 6585.03, r100: 6585.03, txLinear: 14, frLinear: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5997", credito: 350000, prazo: 111, r50: 2182.58, r100: 3727.78, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.029, isPromo: true },
    { grupo: "5999", credito: 400000, prazo: 58, r50: 8031.83, r100: 8031.83, txLinear: 14, frLinear: 1, seguro: 0.0252, isPromo: true }
  ],
  servicos: [
    { grupo: "4150", credito: 6000, prazo: 48, r50: 167.00, txLinear: 28, frLinear: 4, seguro: 0.0333 },
    { grupo: "4150", credito: 7000, prazo: 48, r50: 194.83, txLinear: 28, frLinear: 4, seguro: 0.0333 },
    { grupo: "4150", credito: 8000, prazo: 48, r50: 222.66, txLinear: 28, frLinear: 4, seguro: 0.0333 },
    { grupo: "Magalu", credito: 9000, r50: 565.35, prazo: 20 },
    { grupo: "4150", credito: 10000, prazo: 48, r50: 278.33, txLinear: 28, frLinear: 4, seguro: 0.0333 },
    { grupo: "Magalu", credito: 12000, r50: 753.78, prazo: 20 },
    { grupo: "Magalu", credito: 13000, r50: 816.60, prazo: 20 },
    { grupo: "Magalu", credito: 14000, r50: 879.42, prazo: 20 },
    { grupo: "7120", credito: 15000, prazo: 60, r50: 312.16, txLinear: 21, frLinear: 2, seguro: 0.0311 },
    { grupo: "Magalu", credito: 18000, r50: 520.47, prazo: 43 },
    { grupo: "7120", credito: 20000, prazo: 60, r50: 416.20, txLinear: 21, frLinear: 2, seguro: 0.031 },
    { grupo: "Magalu", credito: 25000, r50: 722.89, prazo: 43 },
    { grupo: "7119", credito: 30000, prazo: 41, r50: 909.27, txLinear: 21, frLinear: 2, seguro: 0.0309 },
  ]
};

export const CATEGORIAS: Category[] = [
  { id: "imovel", label: "Imóvel / Investimento", icon: "🏠" },
  { id: "veiculo", label: "Moto / Veículos / Náutico", icon: "🚗" },
  { id: "pesados", label: "Pesados / Agrícola", icon: "🚛" },
  { id: "servicos", label: "Serviços / Plástica", icon: "✨" },
];

export const ESTATISTICAS_LANCES: Record<string, { lanceMaior: number, lanceMenor: number, lanceMedia: number, qtdLances: number }> = {
  "5292": { lanceMaior: 85.00, lanceMenor: 64.00, lanceMedia: 71.31, qtdLances: 17 },
};
