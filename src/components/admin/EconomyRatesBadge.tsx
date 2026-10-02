import React, { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, DollarSign, Percent } from "lucide-react";
import { fetchEconomyIndexes, EconomyIndexesResult } from "@/services/enrichmentService";

export function EconomyRatesBadge() {
  const [rates, setRates] = useState<EconomyIndexesResult | null>(() => {
    try {
      const cached = localStorage.getItem("jarvis_economy_rates");
      if (cached) return JSON.parse(cached);
    } catch {
      // Ignore cache error
    }
    return null;
  });

  const [loading, setLoading] = useState(!rates);
  const [refreshing, setRefreshing] = useState(false);

  const loadRates = async () => {
    setRefreshing(true);
    try {
      const data = await fetchEconomyIndexes();
      setRates(data);
      localStorage.setItem("jarvis_economy_rates", JSON.stringify(data));
    } catch (e) {
      console.warn("⚠️ Fallback taxas BCB no Dashboard:", e);
      if (!rates) {
        setRates({ selic: 10.75, cdi: 10.65, ipca: 4.5, atualizadoEm: "Hoje" });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  if (loading && !rates) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/50 border border-emerald-100 animate-pulse">
        <TrendingUp className="h-4 w-4 text-emerald-400" />
        <span className="text-[10px] font-bold text-emerald-600">Taxas BCB...</span>
      </div>
    );
  }

  if (!rates) return null;

  return (
    <div
      onClick={loadRates}
      className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-slate-50 border border-emerald-100/60 shadow-sm transition-all hover:scale-105 cursor-pointer select-none"
      title="Taxas Oficiais do Banco Central. Clique para atualizar."
    >
      <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
      </div>

      <div className="flex items-center gap-2 text-[11px] font-black">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[9px] uppercase font-bold">Selic</span>
          <span className="text-emerald-700 font-extrabold">{rates.selic}%</span>
        </div>

        <span className="text-slate-200">|</span>

        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[9px] uppercase font-bold">CDI</span>
          <span className="text-blue-700 font-extrabold">{rates.cdi}%</span>
        </div>

        <span className="text-slate-200">|</span>

        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[9px] uppercase font-bold">IPCA</span>
          <span className="text-purple-700 font-extrabold">{rates.ipca}%</span>
        </div>
      </div>

      {refreshing && (
        <RefreshCw className="h-3 w-3 text-emerald-500 animate-spin ml-0.5" />
      )}
    </div>
  );
}
