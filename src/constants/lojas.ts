export interface LojaConfig {
  id: string;
  codigo: string;
  cidade: string;
  nome: string;
  metaMensal: number;
  gerente?: string;
  contatoGerente?: string;
  corHex: string;
}

export const INITIAL_LOJAS: LojaConfig[] = [
  {
    id: "filial-952",
    codigo: "952",
    cidade: "PARANAGUÁ",
    nome: "PARANAGUÁ - MAGALU FILIAL 952",
    metaMensal: 108464,
    gerente: "Gerente Paranaguá",
    corHex: "#3b82f6" // blue
  },
  {
    id: "filial-927",
    codigo: "927",
    cidade: "SÃO MATEUS DO SUL",
    nome: "SÃO MATEUS DO SUL - MAGALU FILIAL 927",
    metaMensal: 103502,
    gerente: "Gerente São Mateus",
    corHex: "#10b981" // emerald
  },
  {
    id: "filial-929",
    codigo: "929",
    cidade: "IRATI",
    nome: "IRATI - MAGALU FILIAL 929",
    metaMensal: 124802,
    gerente: "Gerente Irati",
    corHex: "#8b5cf6" // purple
  },
  {
    id: "filial-646",
    codigo: "646",
    cidade: "CANOINHAS",
    nome: "CANOINHAS - MAGALU FILIAL 646",
    metaMensal: 50545,
    gerente: "Gerente Canoinhas",
    corHex: "#f59e0b" // amber
  },
  {
    id: "filial-909",
    codigo: "909",
    cidade: "CAMPO LARGO",
    nome: "CAMPO LARGO - MAGALU FILIAL 909",
    metaMensal: 70071,
    gerente: "Gerente Campo Largo",
    corHex: "#ec4899" // pink
  }
];

export const STORAGE_KEY_LOJAS = "simulaja_lojas_config_v1";
