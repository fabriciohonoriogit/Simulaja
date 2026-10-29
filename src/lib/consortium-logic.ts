export const groupQuotaMap: Record<string, number> = {
  // Imóvel
  "6035": 2500,
  "6037": 2500,
  "6038": 2500,
  "6039": 3100,
  "6040": 3100,
  "6041": 3100,
  "6042": 4300,
  "6043": 4300,
  "6044": 4300,
  // Veículo
  "5297": 3100,
  "5295": 2500,
  "5294": 2500,
  "5292": 2500,
  "5291": 1800,
  "5290": 1800,
  "5288": 1800,
  "5287": 1800,
  "5286": 2500,
  "5284": 1800,
  "5282": 2500,
  "5281": 1800,
  "5278": 1800,
  "5277": 1800,
  "5275": 2500,
  "5274": 1800,
  "5272": 1800,
  "5271": 1800,
  "5268": 2500,
  "5267": 1800,
  "5264": 1800,
  "5263": 1800,
  "5260": 1800,
  "5259": 2500,
  "5257": 1800,
  "5251": 2500,
  "5247": 1800,
  "5245": 1800,
  "5243": 2500,
  "5242": 2500,
  "5240": 2500,
  // Motos
  "5296": 1800,
  "5293": 1800,
  "5289": 1800,
  "5285": 1800,
  "5283": 1800,
  "5280": 1800,
  "5276": 1800,
  "5273": 1800,
  "5270": 1800,
  "5266": 1800,
  "5265": 1800,
  "5261": 1800,
  // Outros / Pesados
  "5999": 1800,
  "5998": 1800,
  "5997": 1800,
  "5996": 1800,
  "1703": 2000,
};

export const getAdemiconParticipants = (grupoStr: string | null, tipoConsorcio: string | null): number => {
  if (!grupoStr) return 9999;
  const g = parseInt(grupoStr.replace(/\D/g, ''), 10);
  if (isNaN(g)) return 9999;

  const cleanTipo = tipoConsorcio?.trim().toLowerCase() || "";
  const isVehicleKeyword = cleanTipo.includes("veiculo") || cleanTipo.includes("carro") || cleanTipo.includes("moto") || cleanTipo.includes("pesado") || cleanTipo.includes("caminhao") || cleanTipo.includes("bens");

  // Checagem de Grupos de Bens Móveis / Veículos da Ademicon (Tabela Oficial Comassetto)
  const isAdemiconVehicleGroup = 
    g === 4116 ||
    [1171, 1172, 1502, 1503, 1504, 3013, 4109, 4110, 4115].includes(g) ||
    [1173, 4111, 4112, 4113, 4114, 1681, 1682, 1684, 1685, 1694, 1695, 1697, 1700, 1701, 1706, 1708].includes(g) ||
    (g >= 1601 && g <= 1679) ||
    (g >= 8000 && g <= 8003) ||
    [1680, 1683, 1686, 1687, 1688, 1689, 1691, 1692, 1696, 1698, 1699, 1702, 1703, 1704, 1705, 1707, 1709, 1710].includes(g) ||
    g === 1690 || g === 1693;

  if (isVehicleKeyword || isAdemiconVehicleGroup) {
    // GRUPO 4116: 250 participantes
    if (g === 4116) return 250;

    // GRUPO 1: 500 participantes
    if ([1171, 1172, 1502, 1503, 1504, 3013, 4109, 4110, 4115].includes(g)) return 500;

    // GRUPO 2: 1000 participantes
    if ([1173, 4111, 4112, 4113, 4114, 1681, 1682, 1684, 1685, 1694, 1695, 1697, 1700, 1701, 1706, 1708].includes(g)) return 1000;
    if (g >= 1601 && g <= 1679) return 1000;
    if (g >= 8000 && g <= 8003) return 1000;

    // GRUPO 3: 2000 participantes
    if ([1680, 1683, 1686, 1687, 1688, 1689, 1691, 1692, 1696, 1698, 1699, 1702, 1703, 1704, 1705, 1707, 1709, 1710].includes(g)) return 2000;

    // GRUPO 4: 5000 participantes
    if (g === 1690 || g === 1693) return 5000;

    return 500; // Fallback para veículos se não encontrado
  }

  // GRUPO 1: 1000 participantes (IMÓVEIS)
  if (g >= 20 && g <= 50) return 1000;
  if ([370, 600, 6102].includes(g)) return 1000;
  if (g >= 430 && g <= 510) return 1000;

  // GRUPO 2: 2000 participantes (IMÓVEIS)
  if ([420, 710, 860, 1100].includes(g)) return 2000;
  if (g >= 520 && g <= 590) return 2000;
  if (g >= 611 && g <= 640) return 2000;
  if (g >= 960 && g <= 1000) return 2000;

  // GRUPO 3: 3333 participantes (IMÓVEIS)
  if (g >= 651 && g <= 700) return 3333;
  if (g >= 720 && g <= 790) return 3333;
  if (g >= 800 && g <= 850) return 3333;
  if ([880, 890, 930, 940, 950, 1090, 1120, 12126, 12127, 12129, 12133, 12148, 12155, 12165, 12175, 12176].includes(g)) return 3333;

  // GRUPO 4: 5000 participantes (IMÓVEIS)
  if ([870, 900, 910, 921, 1110, 12128, 12161, 12162, 12164, 12166, 12168, 12169, 12170, 12172, 12174, 12177, 12179, 12181, 12182, 12184].includes(g)) return 5000;
  if (g >= 1010 && g <= 1080) return 5000;
  if (g >= 1180 && g <= 1200) return 5000;
  if (g >= 12130 && g <= 12132) return 5000;
  if (g >= 12134 && g <= 12147) return 5000;
  if (g >= 12149 && g <= 12151) return 5000;
  if (g >= 12156 && g <= 12159) return 5000;

  // GRUPO 5: 9999 participantes (IMÓVEIS)
  if ([12152, 12153, 12154, 12160, 12163, 12167, 12171, 12173, 12178, 12180, 12185].includes(g)) return 9999;

  // Fallback para Ademicon Imóveis se não bater com nada
  return 9999;
};

export interface LoteriaResult {
  winCota: number;
  isWinner: boolean;
  isClose: boolean;
  diff: number | null;
  participants: number;
}

/**
 * Calculates the winning quota based on the Federal Lottery result.
 * 
 * Standard Rule: lotId % participants
 * Ademicon Vehicle Rule: (lotId % 10000) % participants
 */
export const getLoteriaStatus = (
  loteriaFederal: string,
  cotaStr: string | null,
  grupoStr: string | null,
  administradora: string | null = "MAGALU",
  tipoConsorcio: string | null = "",
  defaultParticipants: number = 600
): LoteriaResult | null => {
  if (!loteriaFederal) return null;
  const lotId = parseInt(loteriaFederal.replace(/\D/g, ''));
  if (isNaN(lotId)) return null;

  // Extreme cleaning for robustness
  const rawGrupo = grupoStr?.replace(/\D/g, '') || "";
  const cleanGrupo = rawGrupo.replace(/^0+/, '') || rawGrupo;
  const cleanAdmin = administradora?.trim().toUpperCase() || "";
  const cleanTipo = tipoConsorcio?.trim().toLowerCase() || "";

  // Get participants for this group
  let participants = defaultParticipants;
  const isAdemicon = cleanAdmin.includes("ADEMICON");

  if (isAdemicon) {
    participants = getAdemiconParticipants(cleanGrupo, cleanTipo);
  } else {
    participants = cleanGrupo ? (groupQuotaMap[cleanGrupo] || groupQuotaMap[rawGrupo] || defaultParticipants) : defaultParticipants;
  }

  if (participants <= 0) return null;

  let calculationBasis = lotId;

  // Rule for Ademicon: Universally use only the "milhar" (last 4 digits) for calculations
  if (isAdemicon) {
    calculationBasis = lotId % 10000;
  }

  const winCota = calculationBasis % participants === 0 ? participants : calculationBasis % participants;
  const clientCota = parseInt(cotaStr?.replace(/\D/g, '') || "0");
  
  if (!clientCota) return { winCota, isWinner: false, isClose: false, diff: null, participants };

  if (clientCota > participants) {
    return { winCota, isWinner: false, isClose: false, diff: null, participants };
  }

  const diff = Math.min(
    Math.abs(clientCota - winCota),
    participants - Math.abs(clientCota - winCota)
  );
  
  return { 
    winCota, 
    isWinner: diff === 0, 
    isClose: diff > 0 && diff <= 10, 
    diff, 
    participants 
  };
};
