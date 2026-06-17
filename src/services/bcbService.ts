export interface BcbData {
  selic: { data: string; valor: string } | null;
  ipca: { data: string; valor: string } | null;
  cdi: { data: string; valor: string } | null;
  incc: { data: string; valor: string } | null;
}

export const bcbService = {
  async getEconomicIndicators(): Promise<BcbData> {
    try {
      const [selicRes, ipcaRes, cdiRes, inccRes] = await Promise.all([
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json').catch(() => null),
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json').catch(() => null),
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json').catch(() => null),
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.192/dados/ultimos/1?formato=json').catch(() => null)
      ]);

      const selicData = selicRes ? await selicRes.json() : null;
      const ipcaData = ipcaRes ? await ipcaRes.json() : null;
      const cdiData = cdiRes ? await cdiRes.json() : null;
      const inccData = inccRes ? await inccRes.json() : null;

      return {
        selic: selicData && selicData.length > 0 ? selicData[0] : null,
        ipca: ipcaData && ipcaData.length > 0 ? ipcaData[0] : null,
        cdi: cdiData && cdiData.length > 0 ? cdiData[0] : null,
        incc: inccData && inccData.length > 0 ? inccData[0] : null,
      };
    } catch (error) {
      console.error("Erro ao buscar indicadores econômicos do BCB:", error);
      return { selic: null, ipca: null, cdi: null, incc: null };
    }
  }
};
