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
    { grupo: "6043", credito: 110000, prazo: 219, r50: 390.16, r100: 630.62, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 120000, prazo: 219, r50: 425.63, r100: 687.95, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 130000, prazo: 219, r50: 461.10, r100: 745.27, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 140000, prazo: 219, r50: 496.57, r100: 802.60, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 150000, prazo: 219, r50: 532.04, r100: 859.93, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 160000, prazo: 219, r50: 567.51, r100: 917.26, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 170000, prazo: 219, r50: 602.98, r100: 974.59, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 180000, prazo: 219, r50: 638.45, r100: 1031.92, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 190000, prazo: 219, r50: 673.91, r100: 1089.25, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 200000, prazo: 219, r50: 709.38, r100: 1146.58, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 210000, prazo: 219, r50: 744.85, r100: 1203.90, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6043", credito: 220000, prazo: 219, r50: 780.32, r100: 1261.23, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6041", credito: 230000, prazo: 212, r50: 874.80, r100: 1382.74, txLinear: 20, frLinear: 1, tx5050: 23, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6030", credito: 240000, prazo: 195, r50: 972.95, r100: 1562.38, txLinear: 20, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6027", credito: 250000, prazo: 189, r50: 973.59, r100: 1618.64, txLinear: 15, frLinear: 1, tx5050: 17, fr5050: 1, seguro: 0.0297, isPromo: true },
    { grupo: "6027", credito: 280000, prazo: 190, r50: 1131.69, r100: 1791.32, txLinear: 15, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "6025", credito: 300000, prazo: 193, r50: 1145.81, r100: 1971.88, txLinear: 20, frLinear: 1, tx5050: 17, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6030", credito: 320000, prazo: 195, r50: 1297.27, r100: 2083.17, txLinear: 20, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6035", credito: 340000, prazo: 225, r50: 1240.32, r100: 1932.19, txLinear: 20, frLinear: 1, tx5050: 24, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6042", credito: 350000, prazo: 239, r50: 1146.22, r100: 1847.26, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 400000, prazo: 239, r50: 1309.97, r100: 2111.15, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 450000, prazo: 239, r50: 1473.71, r100: 2375.05, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 500000, prazo: 239, r50: 1637.46, r100: 2638.94, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 550000, prazo: 239, r50: 1801.21, r100: 2902.83, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 600000, prazo: 239, r50: 1964.95, r100: 3166.73, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 650000, prazo: 239, r50: 2128.70, r100: 3431.40, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "6042", credito: 700000, prazo: 239, r50: 2292.44, r100: 3694.52, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 1000000, prazo: 239, r50: 3274.92, r100: 5277.88, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 1500000, prazo: 239, r50: 4912.38, r100: 7916.82, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "6042", credito: 2000000, prazo: 239, r50: 6549.84, r100: 10555.76, txLinear: 18, frLinear: 1, tx5050: 20, fr5050: 1, seguro: 0.03, isPromo: true },
  ],
  veiculo: [
    { grupo: "5292", credito: 15000, prazo: 74, r50: 250.00, r100: 250.00, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5293", credito: 16000, prazo: 74, r50: 270.91, r100: 270.91, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5296", credito: 20000, prazo: 80, r50: 204.00, r100: 323.90, txLinear: 25, frLinear: 2, tx5050: 27, fr5050: 2, seguro: 0.032, isPromo: true },
    { grupo: "5296", credito: 25000, prazo: 80, r50: 255.02, r100: 404.89, txLinear: 25, frLinear: 2, tx5050: 27, fr5050: 2, seguro: 0.032, isPromo: true },
    { grupo: "5293", credito: 28000, prazo: 74, r50: 474.08, r100: 474.08, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5293", credito: 30000, prazo: 74, r50: 507.95, r100: 507.95, txLinear: 21, frLinear: 2, isPromo: true },
    { grupo: "5297", credito: 40000, prazo: 100, r50: 288.00, r100: 496.20, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5297", credito: 50000, prazo: 100, r50: 359.99, r100: 620.25, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5297", credito: 60000, prazo: 100, r50: 431.99, r100: 744.30, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5297", credito: 70000, prazo: 100, r50: 503.99, r100: 868.34, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5297", credito: 80000, prazo: 100, r50: 575.99, r100: 992.39, txLinear: 20, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0305, isPromo: true },
    { grupo: "5295", credito: 90000, prazo: 97, r50: 667.16, r100: 1131.11, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5295", credito: 100000, prazo: 97, r50: 741.29, r100: 1256.79, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5295", credito: 120000, prazo: 97, r50: 889.55, r100: 1508.15, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5295", credito: 130000, prazo: 98, r50: 954.29, r100: 1563.18, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5295", credito: 140000, prazo: 97, r50: 1037.80, r100: 1759.50, txLinear: 18, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5282", credito: 150000, prazo: 87, r50: 1304.99, r100: 2096.68, txLinear: 18, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5282", credito: 160000, prazo: 87, r50: 1391.99, r100: 2236.46, txLinear: 18, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "5282", credito: 170000, prazo: 87, r50: 1478.99, r100: 2376.24, txLinear: 18, frLinear: 1, tx5050: 22, fr5050: 1, seguro: 0.03, isPromo: true },
    { grupo: "2x 5295", credito: 180000, prazo: 98, r50: 1321.32, r100: 2164.40, txLinear: 14, frLinear: 1, tx5050: 18, fr5050: 1, seguro: 0.0252, isPromo: true }
  ],
  pesados: [
    { grupo: "5997", credito: 190000, prazo: 111, r50: 1184.83, r100: 2023.65, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.029, isPromo: true },
    { grupo: "5997", credito: 200000, prazo: 111, r50: 1247.19, r100: 2130.16, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.029, isPromo: true },
    { grupo: "5996", credito: 220000, prazo: 132, r50: 1164.31, r100: 1980.42, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5997", credito: 250000, prazo: 111, r50: 1558.99, r100: 2662.70, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.029, isPromo: true },
    { grupo: "5996", credito: 280000, prazo: 132, r50: 1481.85, r100: 2520.54, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.0252, isPromo: true },
    { grupo: "5997", credito: 300000, prazo: 111, r50: 1870.78, r100: 3195.24, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.029, isPromo: true },
    { grupo: "5997", credito: 350000, prazo: 111, r50: 2182.58, r100: 3727.78, txLinear: 14, frLinear: 1, tx5050: 15, fr5050: 1, seguro: 0.029, isPromo: true },
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
