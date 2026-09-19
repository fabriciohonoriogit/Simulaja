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
  isPlanoGold?: boolean;
  tipoVenda?: string;
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
    proximaAssembleia: "23/09/2026",
    caracteristicas: "Imóvel linear, 75/25 e 50/50. Crédito - 110.000,00 a 220.000,00. 217 meses. DEVIDO A RESOLUÇAO 285, GRUPO NÃO PERMITE TROCA DA DATA DA 1ª ASSEMBLEIA. LANCE EMBUTIDO DE 25%. Linear: 22+1% por 18+1% | 50/50: 21+1%. Seguro 0,0252%.",
    ordemContemplacao: "Sorteio, Lance livre, Fixo 25% (desde a 1ª conf. saldo) e Fixo 45% (à partir 10ª assembleia), onde inicia repetição entre todos lances conforme saldo grupo.",
    opcaoDiluir: "Opção de diluir o lance total e quitar 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste todo o mês de Outubro pelo INCC a partir de Outubro 2027."
  },
  "6042": {
    grupo: "6042",
    reajuste: "INCC",
    primeiraAssembleia: "24/06/2026",
    proximaAssembleia: "23/09/2026",
    caracteristicas: "Imóvel linear e 50/50. Crédito - 350.000,00 a 700.000,00. 237 meses. Linear: 22+1% por 18+1% | 50/50: 24+1% por 18+1%. Seguro 0,0252%. EMBUTIDO 25%.",
    ordemContemplacao: "Sorteio, Lance livre, Lance Fidelidade (a partir da 13ª ass - limitado a 50% - cotas com 12 pagamentos), Fixo 25% (desde a 1ª conf. saldo) e Fixo 45% (a partir da 10ª assembleia), após a 14ª ass lances alternados por 3 vezes.",
    opcaoDiluir: "Opção de diluir o lance total. Quitação de 2 parcelas subsequentes na contemplação por lance.",
    regraReajuste: "Reajuste todo o mês de Outubro pelo INCC a partir de Outubro 2027."
  },
  "6027": {
    grupo: "6027",
    reajuste: "INCC",
    primeiraAssembleia: "Em andamento",
    proximaAssembleia: "23/09/2026",
    caracteristicas: "Imóvel linear e 50/50. Crédito - 140.000,00 a 280.000,00. 187 meses. Linear: 20+1% por 15+1% | 50/50: 22+1% por 18+1%. Seguro 0,0252%.",
    ordemContemplacao: "Sorteio, Lance livre e Lances Fixos.",
    opcaoDiluir: "Opção de diluir o lance total.",
    regraReajuste: "Reajuste pelo INCC."
  },
  "6021": {
    grupo: "6021",
    reajuste: "INCC",
    primeiraAssembleia: "Em andamento",
    proximaAssembleia: "26/08/2026",
    caracteristicas: "Imóvel Plano 50/50 negociado. Crédito - 280.000,00 a 500.000,00. 123 meses. 50/50: 18+1% por 16+1%. Seguro 0,0252%. Economia até R$ 10.000.",
    ordemContemplacao: "Sorteio, Lance livre e Lances Fixos.",
    opcaoDiluir: "Opção de diluir o lance total.",
    regraReajuste: "Reajuste pelo INCC."
  },
  "6022": {
    grupo: "6022",
    reajuste: "INCC",
    primeiraAssembleia: "Em andamento",
    proximaAssembleia: "26/08/2026",
    caracteristicas: "Imóvel Plano 50/50 negociado. Crédito - 140.000,00 a 250.000,00. 126 meses. 50/50: 18+1% por 15+1%. Seguro 0,0252%. LIQUIDA COTAS! 13/08. Economia até R$ 7.500.",
    ordemContemplacao: "Sorteio, Lance livre e Lances Fixos.",
    opcaoDiluir: "Opção de diluir o lance total.",
    regraReajuste: "Reajuste pelo INCC."
  },
  "7120": {
    grupo: "7120",
    reajuste: "IPCA",
    primeiraAssembleia: "25/07",
    proximaAssembleia: "25/07",
    caracteristicas: "Novo grupo Serviços. Crédito 13.000 a 26.000. 59 meses. Taxa ADM 21+2%. Plano linear. Seguro 0,0252%.",
    ordemContemplacao: "Sorteio e Lances.",
    opcaoDiluir: "Opção de diluir o lance.",
    regraReajuste: "Reajuste pelo IPCA."
  },
  "4150": {
    grupo: "4150",
    reajuste: "IPCA",
    primeiraAssembleia: "Julho",
    proximaAssembleia: "Julho",
    caracteristicas: "Novo grupo Eletro. Crédito 6.000 a 12.000. 47 meses. Taxa ADM 24+4% (DE 28+4%). Plano linear. Economia até R$ 480,00.",
    ordemContemplacao: "Sorteio e Lances.",
    opcaoDiluir: "Opção de diluir o lance.",
    regraReajuste: "Reajuste pelo IPCA."
  },
  "6041": {
    grupo: "6041",
    reajuste: "INCC",
    primeiraAssembleia: "26/11/2025",
    proximaAssembleia: "23/09/2026",
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
  "6030": {
    grupo: "6030",
    reajuste: "INCC",
    primeiraAssembleia: "22/12/2021",
    proximaAssembleia: "25/07/2026",
    caracteristicas: "Imóvel linear e 50/50. Crédito - 240.000,00 a 320.000,00. Cotas vagas: 265. Status: Andamento. Tipo de venda: 50/50 NEGOCIADO.",
    ordemContemplacao: "Sorteio, Lance livre, Fixo 25% (desde a 1ª conf. saldo) e Fixo 45% (a partir da 10ª assembleia).",
    opcaoDiluir: "Opção de diluir o lance total.",
    regraReajuste: "Reajuste pelo INCC."
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
    proximaAssembleia: "23/09/2026",
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
    proximaAssembleia: "23/09/2026",
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
    // Grupo 6043 - Promocional Agosto/26
    { grupo: "6043", credito: 110000, prazo: 217, r50: 398.80, r100: 636.44, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6043", credito: 120000, prazo: 217, r50: 435.05, r100: 694.30, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6043", credito: 130000, prazo: 217, r50: 471.30, r100: 752.16, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6043", credito: 140000, prazo: 217, r50: 507.56, r100: 810.02, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6043", credito: 150000, prazo: 217, r50: 543.81, r100: 867.88, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6043", credito: 160000, prazo: 217, r50: 580.07, r100: 925.74, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6043", credito: 170000, prazo: 217, r50: 616.32, r100: 983.60, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6043", credito: 180000, prazo: 217, r50: 652.58, r100: 1041.45, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6043", credito: 190000, prazo: 217, r50: 688.83, r100: 1099.31, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6043", credito: 200000, prazo: 217, r50: 725.09, r100: 1157.17, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6043", credito: 210000, prazo: 217, r50: 761.34, r100: 1215.03, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6043", credito: 220000, prazo: 217, r50: 797.60, r100: 1272.89, txLinear: 18, frLinear: 1, tx5050: 21, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },

    // Grupo 6043 - Plano Golden Agosto/26
    { grupo: "6043", credito: 110000, prazo: 217, r50: 423.54, r100: 677.37, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6043", credito: 120000, prazo: 217, r50: 462.05, r100: 738.95, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6043", credito: 130000, prazo: 217, r50: 500.55, r100: 800.53, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6043", credito: 140000, prazo: 217, r50: 539.06, r100: 862.11, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6043", credito: 150000, prazo: 217, r50: 577.56, r100: 923.69, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6043", credito: 160000, prazo: 217, r50: 616.06, r100: 985.27, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6043", credito: 170000, prazo: 217, r50: 654.57, r100: 1046.85, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6043", credito: 180000, prazo: 217, r50: 693.07, r100: 1108.43, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6043", credito: 190000, prazo: 217, r50: 731.58, r100: 1170.01, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6043", credito: 200000, prazo: 217, r50: 770.08, r100: 1231.59, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6043", credito: 210000, prazo: 217, r50: 808.59, r100: 1293.17, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6043", credito: 220000, prazo: 217, r50: 847.09, r100: 1354.75, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },

    // Grupo 6027 - Promocional Agosto/26
    { grupo: "6027", credito: 140000, prazo: 187, r50: 558.44, r100: 910.45, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 160000, prazo: 187, r50: 638.22, r100: 1040.51, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 180000, prazo: 187, r50: 718.00, r100: 1170.58, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 200000, prazo: 187, r50: 797.78, r100: 1300.64, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 220000, prazo: 187, r50: 877.55, r100: 1430.71, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 230000, prazo: 187, r50: 917.44, r100: 1495.74, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 240000, prazo: 187, r50: 957.33, r100: 1560.77, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 250000, prazo: 187, r50: 997.22, r100: 1625.80, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 260000, prazo: 187, r50: 1037.11, r100: 1690.83, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 270000, prazo: 187, r50: 1077.00, r100: 1755.87, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 280000, prazo: 187, r50: 1116.89, r100: 1820.90, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },

    // Grupo 6041 - Promocional Agosto/26
    { grupo: "6041", credito: 200000, prazo: 210, r50: 716.98, r100: 1193.33, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6041", credito: 230000, prazo: 211, r50: 878.48, r100: 1419.17, txLinear: 18, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6041", credito: 230000, prazo: 211, r50: 912.88, r100: 1474.65, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },

    // Grupo 6030 - Promocional e Plano Golden Agosto/26
    { grupo: "6030", credito: 240000, prazo: 194, r50: 1016.28, r100: 1618.35, txLinear: 25, frLinear: 1, tx5050: 25, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6030", credito: 250000, prazo: 194, r50: 1058.63, r100: 1685.78, txLinear: 25, frLinear: 1, tx5050: 25, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6030", credito: 260000, prazo: 194, r50: 1100.98, r100: 1753.21, txLinear: 25, frLinear: 1, tx5050: 25, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6030", credito: 270000, prazo: 194, r50: 1143.32, r100: 1820.64, txLinear: 25, frLinear: 1, tx5050: 25, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6030", credito: 280000, prazo: 194, r50: 1185.67, r100: 1888.07, txLinear: 25, frLinear: 1, tx5050: 25, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6030", credito: 300000, prazo: 194, r50: 1221.59, r100: 1962.58, txLinear: 20, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6030", credito: 300000, prazo: 194, r50: 1270.36, r100: 2023.07, txLinear: 25, frLinear: 1, tx5050: 25, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6030", credito: 320000, prazo: 194, r50: 1303.03, r100: 2093.41, txLinear: 20, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6030", credito: 320000, prazo: 194, r50: 1355.05, r100: 2157.94, txLinear: 25, frLinear: 1, tx5050: 25, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },

    // Grupo 6042 - Promocional e Plano Golden Agosto/26
    { grupo: "6042", credito: 350000, prazo: 237, r50: 1155.32, r100: 1893.67, txLinear: 20, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6042", credito: 350000, prazo: 237, r50: 1249.52, r100: 1980.53, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6042", credito: 400000, prazo: 237, r50: 1320.37, r100: 2164.20, txLinear: 20, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6042", credito: 400000, prazo: 237, r50: 1428.02, r100: 2263.46, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6042", credito: 450000, prazo: 237, r50: 1485.38, r100: 2434.72, txLinear: 20, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6042", credito: 450000, prazo: 237, r50: 1606.52, r100: 2546.39, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6042", credito: 500000, prazo: 237, r50: 1650.42, r100: 2705.25, txLinear: 20, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6042", credito: 500000, prazo: 237, r50: 1785.02, r100: 2829.32, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6042", credito: 550000, prazo: 237, r50: 1815.46, r100: 2975.77, txLinear: 20, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6042", credito: 550000, prazo: 237, r50: 1963.52, r100: 3112.26, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6042", credito: 600000, prazo: 237, r50: 1980.50, r100: 3246.30, txLinear: 20, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6042", credito: 600000, prazo: 237, r50: 2142.03, r100: 3395.19, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6042", credito: 650000, prazo: 237, r50: 2145.54, r100: 3516.82, txLinear: 20, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6042", credito: 650000, prazo: 237, r50: 2320.53, r100: 3678.12, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },
    { grupo: "6042", credito: 700000, prazo: 237, r50: 2310.58, r100: 3787.35, txLinear: 20, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "6042", credito: 700000, prazo: 237, r50: 2499.03, r100: 3961.05, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN 50/50" },

    // Composições de Crédito Multi-Cotas (810k, 900k, 1M, 2M)
    { grupo: "6042", credito: 810000, prazo: 237, r50: 2635.74, r100: 4361.21, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "700 MIL + 110 MIL" },
    { grupo: "6042", credito: 810000, prazo: 237, r50: 2923.93, r100: 4640.43, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN (700k + 110k)" },

    { grupo: "6042", credito: 900000, prazo: 237, r50: 2953.30, r100: 4881.94, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "700 MIL + 200 MIL" },
    { grupo: "6042", credito: 900000, prazo: 237, r50: 3307.62, r100: 5253.35, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN (700k + 200k)" },

    { grupo: "6042", credito: 1000000, prazo: 237, r50: 3210.88, r100: 5321.10, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "2 COTAS DE 500 MIL" },
    { grupo: "6042", credito: 1000000, prazo: 237, r50: 3570.04, r100: 5658.65, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN (2 COTAS DE 500 MIL)" },

    { grupo: "6042", credito: 1500000, prazo: 237, r50: 4816.32, r100: 7981.65, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "3 COTAS DE 500 MIL" },

    { grupo: "6042", credito: 2000000, prazo: 237, r50: 6421.76, r100: 10642.20, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "4 COTAS DE 500 MIL" },
    { grupo: "6042", credito: 2000000, prazo: 237, r50: 7140.08, r100: 11317.30, txLinear: 26, frLinear: 1, tx5050: 26, fr5050: 1, seguro: 0.0252, isPlanoGold: true, tipoVenda: "PLANO GOLDEN (4 COTAS DE 500 MIL)" },
  ],
  veiculo: [
    // Novo Grupo Moto 5296 (Agosto/26)
    { grupo: "5296", credito: 15000, prazo: 80, r50: 229.54, r100: 229.54, txLinear: 18, frLinear: 2, seguro: 0.0252, isPromo: true },
    { grupo: "5296", credito: 20000, prazo: 80, r50: 188.70, r100: 306.05, txLinear: 18, frLinear: 2, tx5050: 21, fr5050: 2, seguro: 0.0252, isPromo: true },
    { grupo: "5296", credito: 25000, prazo: 80, r50: 235.87, r100: 382.56, txLinear: 18, frLinear: 2, tx5050: 21, fr5050: 2, seguro: 0.0252, isPromo: true },
    { grupo: "5296", credito: 28000, prazo: 80, r50: 264.18, r100: 428.47, txLinear: 18, frLinear: 2, tx5050: 21, fr5050: 2, seguro: 0.0252, isPromo: true },
    { grupo: "5296", credito: 30000, prazo: 80, r50: 283.05, r100: 459.07, txLinear: 18, frLinear: 2, tx5050: 21, fr5050: 2, seguro: 0.0252, isPromo: true },

    // Grupo Carro 5297 (Julho/26)
    { grupo: "5297", credito: 40000, prazo: 99, r50: 290.79, r100: 480.38, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5297", credito: 50000, prazo: 99, r50: 363.48, r100: 600.47, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5297", credito: 60000, prazo: 99, r50: 436.17, r100: 720.57, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5297", credito: 70000, prazo: 99, r50: 508.87, r100: 840.66, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5297", credito: 80000, prazo: 99, r50: 581.57, r100: 960.76, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },

    // Grupo Carro 5295
    { grupo: "5295", credito: 90000, prazo: 95, r50: 680.66, r100: 1116.47, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5295", credito: 100000, prazo: 95, r50: 756.29, r100: 1240.53, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5295", credito: 120000, prazo: 95, r50: 907.54, r100: 1488.63, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5295", credito: 130000, prazo: 95, r50: 983.17, r100: 1612.68, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5295", credito: 140000, prazo: 95, r50: 1058.80, r100: 1736.74, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "2x 5295", credito: 180000, prazo: 95, r50: 1512.58, r100: 2232.95, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true }
  ],
  pesados: [
    // Grupo 5996 (Setembro/26)
    // Grupo 5996 - 50/50 Negociado (Setembro/26)
    { grupo: "5996", credito: 180000, prazo: 129, r50: 973.55, r100: 1671.22, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "5996", credito: 190000, prazo: 129, r50: 1027.63, r100: 1764.07, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "5996", credito: 200000, prazo: 129, r50: 1081.72, r100: 1856.91, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "5996", credito: 220000, prazo: 129, r50: 1189.89, r100: 2042.60, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "5996", credito: 250000, prazo: 129, r50: 1352.15, r100: 2321.14, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "5996", credito: 280000, prazo: 129, r50: 1514.41, r100: 2599.68, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "5996", credito: 300000, prazo: 129, r50: 1622.50, r100: 2785.29, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true, tipoVenda: "50/50 NEGOCIADO" },
    { grupo: "5997", credito: 350000, prazo: 111, r50: 2182.58, r100: 3727.78, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.029, isPromo: true },
    { grupo: "5999", credito: 400000, prazo: 58, r50: 8031.83, r100: 8031.83, txLinear: 14, frLinear: 1, seguro: 0.0252, isPromo: true }
  ],
  servicos: [
    // Novo Grupo Eletro (4150)
    { grupo: "4150", credito: 6000, prazo: 47, r50: 165.34, txLinear: 24, frLinear: 4, seguro: 0.0252, isPromo: true },
    { grupo: "4150", credito: 8000, prazo: 47, r50: 220.45, txLinear: 24, frLinear: 4, seguro: 0.0252, isPromo: true },
    { grupo: "4150", credito: 9000, prazo: 47, r50: 248.01, txLinear: 24, frLinear: 4, seguro: 0.0252, isPromo: true },
    { grupo: "4150", credito: 10000, prazo: 47, r50: 275.57, txLinear: 24, frLinear: 4, seguro: 0.0252, isPromo: true },
    { grupo: "4150", credito: 12000, prazo: 47, r50: 330.68, txLinear: 24, frLinear: 4, seguro: 0.0252, isPromo: true },

    // Novo Grupo Serviços (7120)
    { grupo: "7120", credito: 13000, prazo: 59, r50: 275.05, txLinear: 21, frLinear: 2, seguro: 0.0252, isPromo: true },
    { grupo: "7120", credito: 15000, prazo: 59, r50: 317.36, txLinear: 21, frLinear: 2, seguro: 0.0252, isPromo: true },
    { grupo: "7120", credito: 17000, prazo: 59, r50: 359.68, txLinear: 21, frLinear: 2, seguro: 0.0252, isPromo: true },
    { grupo: "7120", credito: 20000, prazo: 59, r50: 423.15, txLinear: 21, frLinear: 2, seguro: 0.0252, isPromo: true },
    { grupo: "7120", credito: 25000, prazo: 59, r50: 528.94, txLinear: 21, frLinear: 2, seguro: 0.0252, isPromo: true },
    { grupo: "7120", credito: 26000, prazo: 59, r50: 550.09, txLinear: 21, frLinear: 2, seguro: 0.0252, isPromo: true },
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
  "6043": { lanceMaior: 52.27, lanceMenor: 52.27, lanceMedia: 52.27, qtdLances: 1 },
  "6030": { lanceMaior: 100.00, lanceMenor: 75.00, lanceMedia: 87.50, qtdLances: 2 },
};

export function obterEstatisticasGrupo(grupo: string): { lanceMaior: number, lanceMenor: number, lanceMedia: number, qtdLances: number } | null {
  if (ESTATISTICAS_LANCES[grupo]) {
    return ESTATISTICAS_LANCES[grupo];
  }
  return null;
}

export const MEDIA_LANCES_GRUPOS: Record<string, number> = {
  // MOTOCICLETA
  "5261": 16.37,
  "5265": 26.42,
  "5266": 27.27,
  "5268": 34.28,
  "5273": 40.50,
  "5276": 43.73,
  "5270": 44.95,
  "5280": 53.54,
  "5283": 55.82,
  "5285": 71.11,
  "5288": 75.00,
  "5293": 80.00,
  "5289": 81.25,
  "5296": 88.75,
  "5298": 95.55,

  // AUTOMÓVEIS
  "5240": 34.28,
  "5242": 41.08,
  "5243": 41.96,
  "5295": 43.73,
  "5247": 45.54,
  "5251": 48.49,
  "5253": 50.00,
  "5257": 48.57,
  "5259": 49.83,
  "5260": 48.57,
  "5263": 49.83,
  "5264": 53.42,
  "5267": 55.24,
  "5268-auto": 55.82, // Sufixo para diferenciar se necessário, mas o principal busca por grupo
  "5271": 58.05,
  "5274": 60.55,
  "5272": 60.84,
  "5275": 60.75,
  "5277": 67.62,
  "5278": 68.52,
  "5281": 72.32,
  "5282": 75.76,
  "5297": 99.00,

  // CAMINHÕES E ÔNIBUS
  "5900": 58.75,
  "5907": 66.62,
  "5904": 67.50,
  "5911": 68.75,

  // ELETROELETRÔNICOS
  "4144": 51.35,
  "4145": 62.73,
  "4147": 61.54,
  "4149": 83.25,
  "4150": 97.96,

  // IMÓVEIS
  "6014": 33.83,
  "6016": 38.54,
  "6015": 40.17,
  "6018": 47.92,
  "6019": 53.44,
  "6021": 56.57,
  "6022": 60.00,
  "6028": 72.58,
  "6029": 72.58,
  "6023": 72.84,
  "6027": 73.84,
  "6031": 76.59,
  "6030": 77.60,
  "6032": 78.57,
  "6033": 81.43,
  "6020": 82.22,
  "6034": 84.78,
  "6035": 89.00,
  "6037": 89.88,
  "6038": 91.35,
  "6040": 93.17,
  "6039": 93.76,
  "6041": 95.90,
  "6042": 98.97,
  "6043": 98.98,

  // SERVIÇOS
  "7116": 12.22,
  "7117": 17.50,
  "7115": 18.28,
  "7118": 30.50,
  "7119": 55.55,
  "7120": 95.38
};
