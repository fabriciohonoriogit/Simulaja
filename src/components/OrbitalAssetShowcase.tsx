import React, { useState } from "react";
import { Car, Home, Truck, Bike, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import cardImovel from "@/assets/card-imovel.webp";
import cardVeiculo from "@/assets/card-veiculo.webp";
import cardMoto from "@/assets/card-moto.webp";
import cardPesados from "@/assets/banner-pesados.jpg";

export interface OrbitalConquest {
  id: string;
  name: string;
  subtitle: string;
  creditRange: string;
  targetCredit: number;
  parcelaEstimada: string;
  prazoMaximo: string;
  image: string;
  icon: React.ElementType;
  color: string;
  categoryId: "imovel" | "veiculo" | "pesados";
}

export const ORBITAL_CONQUESTS: OrbitalConquest[] = [
  {
    id: "conquest_car",
    name: "Carros & SUVs",
    subtitle: "Carro novo, zero entrada e poder de compra à vista na concessionária",
    creditRange: "R$ 40 mil a R$ 250 mil",
    targetCredit: 100000,
    parcelaEstimada: "R$ 680,00/mês",
    prazoMaximo: "100 meses",
    image: cardVeiculo,
    icon: Car,
    color: "#00F2FE", // Ciano Neon
    categoryId: "veiculo",
  },
  {
    id: "conquest_home",
    name: "Casas & Imóveis",
    subtitle: "Casa própria, terreno ou construção com escritura e sem juros bancários",
    creditRange: "R$ 150 mil a R$ 1.5 Milhão",
    targetCredit: 150000,
    parcelaEstimada: "R$ 508,25/mês",
    prazoMaximo: "220 meses",
    image: cardImovel,
    icon: Home,
    color: "#FFB800", // Ouro Magalu
    categoryId: "imovel",
  },
  {
    id: "conquest_moto",
    name: "Motos 0km",
    subtitle: "Alta cilindrada e scooters com parcelas reduzidas que cabem no bolso",
    creditRange: "R$ 15 mil a R$ 60 mil",
    targetCredit: 18000,
    parcelaEstimada: "R$ 176,21/mês",
    prazoMaximo: "77 meses",
    image: cardMoto,
    icon: Bike,
    color: "#10B981", // Esmeralda
    categoryId: "veiculo",
  },
  {
    id: "conquest_truck",
    name: "Caminhões & Frotas",
    subtitle: "Caminhões extrapesados, vans e maquinários comerciais que geram renda",
    creditRange: "R$ 180 mil a R$ 1.2 Milhão",
    targetCredit: 250000,
    parcelaEstimada: "R$ 1.412,84/mês",
    prazoMaximo: "127 meses",
    image: cardPesados,
    icon: Truck,
    color: "#8B5CF6", // Roxo Tech
    categoryId: "pesados",
  },
];

interface OrbitalAssetShowcaseProps {
  onSelectCategory?: (categoryId: string) => void;
  className?: string;
}

export function OrbitalAssetShowcase({ onSelectCategory, className = "" }: OrbitalAssetShowcaseProps) {
  const [selectedAsset, setSelectedAsset] = useState<OrbitalConquest>(ORBITAL_CONQUESTS[0]);

  const handleSelect = (asset: OrbitalConquest) => {
    setSelectedAsset(asset);
    if (onSelectCategory) {
      onSelectCategory(asset.categoryId);
    }
    // Sincroniza o simulador globalmente com categoria e crédito exato
    window.dispatchEvent(
      new CustomEvent("select-simulator-category", {
        detail: { 
          categoryId: asset.categoryId,
          targetCredit: asset.targetCredit,
          assetId: asset.id
        },
      })
    );
  };

  return (
    <div className={`w-full flex flex-col items-start select-none ${className}`}>
      {/* SELETOR SUPERIOR EM PÍLULAS */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#070D19]/90 border border-white/10 backdrop-blur-xl shadow-xl z-20 mb-3 w-full">
        {ORBITAL_CONQUESTS.map((asset) => {
          const isSelected = selectedAsset.id === asset.id;
          const Icon = asset.icon;
          return (
            <button
              key={asset.id}
              onClick={() => handleSelect(asset)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                isSelected
                  ? "bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 scale-102"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{asset.name}</span>
            </button>
          );
        })}
      </div>

      {/* VITRINE REAL DO BEM SELECIONADO - CLICÁVEL QUE ATUALIZA O SIMULADOR */}
      <div 
        onClick={() => handleSelect(selectedAsset)}
        className="w-full relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-[#0B1528] to-[#060D19] shadow-2xl group transition-all duration-300 cursor-pointer hover:border-cyan-400/60"
        title="Clique para simular esta oferta no simulador ao lado"
      >
        {/* Glow dinâmico sutil baseado na cor do ativo */}
        <div
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: selectedAsset.color }}
        />

        {/* Imagem do Ativo */}
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-slate-950">
          <img
            src={selectedAsset.image}
            alt={selectedAsset.name}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060D19] via-[#060D19]/35 to-transparent pointer-events-none" />

          {/* Badge superior da categoria */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-white/15 text-[10px] font-black uppercase tracking-wider text-cyan-300 backdrop-blur-md">
              {selectedAsset.name}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider text-emerald-300 backdrop-blur-md">
              50% até contemplar
            </span>
          </div>

          {/* Destaque da Parcela Reduzida na Imagem */}
          <div className="absolute bottom-3 right-3 z-10 text-right">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Meia Parcela a partir de</div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-mono">
              {selectedAsset.parcelaEstimada}
            </div>
          </div>
        </div>

        {/* Informações Estratégicas do Ativo */}
        <div className="p-3.5 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-snug">
              {selectedAsset.subtitle}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-cyan-300 shrink-0 group-hover:translate-x-1 transition-transform">
              Simular <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-[11px] font-bold text-slate-300">
            <div className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-cyan-300 flex items-center gap-1.5">
              <span>Créditos:</span>
              <strong className="text-white">{selectedAsset.creditRange}</strong>
            </div>
            <div className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-amber-300 flex items-center gap-1.5">
              <span>Prazo:</span>
              <strong className="text-white">{selectedAsset.prazoMaximo}</strong>
            </div>
            <div className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sem Juros Bancários</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}