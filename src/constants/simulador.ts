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

export type Category = { id: string; label: string; icon: string; };

export const GRUPOS: Record<string, GrupoItem[]> = {
  imovel: [
    { grupo: "6043", credito: 110000, prazo: 220, r50: 377.84, r100: 649.10, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 120000, prazo: 220, r50: 412.19, r100: 707.80, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 130000, prazo: 220, r50: 446.53, r100: 767.11, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 140000, prazo: 220, r50: 480.88, r100: 895.66, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 150000, prazo: 220, r50: 515.23, r100: 885.13, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 160000, prazo: 220, r50: 549.58, r100: 1023.31, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 170000, prazo: 220, r50: 583.93, r100: 1002.72, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 180000, prazo: 220, r50: 635.79, r100: 1062.16, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6043", credito: 200000, prazo: 220, r50: 686.98, r100: 1180.17, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 220000, prazo: 220, r50: 777.08, r100: 1298.19, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 240000, prazo: 190, r50: 970.02, r100: 1535.42, txLinear: 15, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6030", grupoLinear: "6023", credito: 250000, prazo: 196, prazoLinear: 144, r50: 1008.49, r100: 2140.72, txLinear: 18, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6027", credito: 280000, prazo: 190, r50: 1131.69, r100: 1791.32, txLinear: 15, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6030", credito: 300000, prazo: 196, r50: 1210.19, r100: 2021.00, txLinear: 18, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.0310, isPromo: true },
    { grupo: "6042", credito: 350000, prazo: 240, r50: 1110.86, r100: 1840.37, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 400000, prazo: 240, r50: 1305.30, r100: 2103.29, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6042", credito: 450000, prazo: 240, r50: 1468.46, r100: 2366.20, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6042", credito: 500000, prazo: 240, r50: 1586.94, r100: 2629.11, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 600000, prazo: 240, r50: 1957.95, r100: 3154.93, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6042", credito: 650000, prazo: 240, r50: 2121.11, r100: 3417.84, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6042", credito: 700000, prazo: 240, r50: 2221.72, r100: 3680.75, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 1000000, prazo: 240, r50: 3263.26, r100: 5258.22, txLinear: 20, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true },
  ],
  veiculo: [
    { grupo: "5292", credito: 15000, prazo: 74, r50: 250.00, r100: 250.00, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5293", credito: 16000, prazo: 74, r50: 270.91, r100: 270.91, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5293", credito: 20000, prazo: 74, r50: 220.02, r100: 367.43, txLinear: 21, frLinear: 2, tx5050: 27, fr5050: 2, seguro: 0.0325, isPromo: true },
    { grupo: "5293", credito: 25000, prazo: 74, r50: 423.29, r100: 423.29, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5293", credito: 28000, prazo: 74, r50: 474.08, r100: 474.08, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5293", credito: 30000, prazo: 74, r50: 507.95, r100: 507.95, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5294", credito: 40000, prazo: 97, r50: 296.53, r100: 490.04, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5294", credito: 50000, prazo: 97, r50: 370.66, r100: 612.55, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5294", credito: 60000, prazo: 97, r50: 444.80, r100: 735.06, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5294", credito: 70000, prazo: 97, r50: 518.93, r100: 857.58, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5294", credito: 80000, prazo: 97, r50: 593.06, r100: 980.09, txLinear: 15, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5295", credito: 90000, prazo: 98, r50: 660.66, r100: 1082.20, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5295", credito: 100000, prazo: 98, r50: 734.07, r100: 1202.45, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5295", credito: 120000, prazo: 98, r50: 880.88, r100: 1442.94, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5295", credito: 130000, prazo: 98, r50: 954.29, r100: 1563.18, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5295", credito: 140000, prazo: 98, r50: 1027.70, r100: 1683.43, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5282", credito: 150000, prazo: 88, r50: 1290.74, r100: 2155.53, txLinear: 18, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.0310, isPromo: true },
    { grupo: "2x 5295", credito: 180000, prazo: 98, r50: 1321.32, r100: 2164.40, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true }
  ],
  pesados: [
    { grupo: "5996", credito: 190000, prazo: 132, r50: 1005.54, r100: 1710.37, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5996", credito: 200000, prazo: 132, r50: 1058.46, r100: 1800.38, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5996", credito: 220000, prazo: 132, r50: 1164.31, r100: 1980.42, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5996", credito: 250000, prazo: 132, r50: 1323.08, r100: 2250.48, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5996", credito: 280000, prazo: 132, r50: 1481.85, r100: 2520.54, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5996", credito: 300000, prazo: 132, r50: 1587.70, r100: 2700.58, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true }
  ],
  servicos: [
    { grupo: "Magalu", credito: 8000, r50: 502.52, prazo: 20 },
    { grupo: "Magalu", credito: 9000, r50: 565.35, prazo: 20 },
    { grupo: "Magalu", credito: 10000, r50: 628.15, prazo: 20 },
    { grupo: "Magalu", credito: 12000, r50: 753.78, prazo: 20 },
    { grupo: "Magalu", credito: 13000, r50: 816.60, prazo: 20 },
    { grupo: "Magalu", credito: 14000, r50: 879.42, prazo: 20 },
    { grupo: "Magalu", credito: 18000, r50: 520.47, prazo: 43 },
    { grupo: "Magalu", credito: 20000, r50: 578.30, prazo: 43 },
    { grupo: "Magalu", credito: 25000, r50: 722.89, prazo: 43 },
    { grupo: "Magalu", credito: 30000, r50: 867.45, prazo: 43 },
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
