import React, { useState, useEffect, useRef } from "react";
import { Car, Home, Truck, Bike, Sparkles, ShieldCheck, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { getActiveCampaignTheme } from "@/utils/campaignThemeManager";
import cardImovel from "@/assets/card-imovel.webp";
import cardVeiculo from "@/assets/card-veiculo.webp";
import cardMoto from "@/assets/card-moto.webp";
import cardPesados from "@/assets/segment-truck.webp";

export interface OrbitalAsset {
  id: string;
  name: string;
  subtitle: string;
  creditRange: string;
  parcelaEstimada: string;
  prazoMaximo: string;
  image: string;
  icon: React.ElementType;
  color: string;
  categoryId: "imovel" | "veiculo" | "moto" | "caminhão";
}

export const ORBITAL_ASSETS: OrbitalAsset[] = [
  {
    id: "asset_car",
    name: "Carros & Veículos",
    subtitle: "SUVs, sedans e elétricos com poder de compra à vista",
    creditRange: "R$ 40 mil a R$ 250 mil",
    parcelaEstimada: "R$ 380/mês",
    prazoMaximo: "100 meses",
    image: cardVeiculo,
    icon: Car,
    color: "#00F2FE", // Ciano Neon
    categoryId: "veiculo",
  },
  {
    id: "asset_home",
    name: "Casas & Imóveis",
    subtitle: "Casas, apartamentos, terrenos e reformas sem juros bancários",
    creditRange: "R$ 150 mil a R$ 1.5 Milhão",
    parcelaEstimada: "R$ 720/mês",
    prazoMaximo: "200 meses",
    image: cardImovel,
    icon: Home,
    color: "#FFB800", // Ouro Magalu
    categoryId: "imovel",
  },
  {
    id: "asset_moto",
    name: "Motos & Scooters",
    subtitle: "Motos urbanas e alta cilindrada com parcelas que cabem no bolso",
    creditRange: "R$ 15 mil a R$ 60 mil",
    parcelaEstimada: "R$ 195/mês",
    prazoMaximo: "70 meses",
    image: cardMoto,
    icon: Bike,
    color: "#10B981", // Esmeralda
    categoryId: "moto",
  },
  {
    id: "asset_truck",
    name: "Caminhões & Frotas",
    subtitle: "Extrapesados, carretas e maquinário agrícola no plano 50/50",
    creditRange: "R$ 200 mil a R$ 1.2 Milhão",
    parcelaEstimada: "R$ 1.450/mês",
    prazoMaximo: "120 meses",
    image: cardPesados,
    icon: Truck,
    color: "#8B5CF6", // Roxo Tech
    categoryId: "caminhão",
  },
];

interface OrbitalAssetShowcaseProps {
  onSelectCategory?: (categoryId: string) => void;
  className?: string;
}

export function OrbitalAssetShowcase({ onSelectCategory, className = "" }: OrbitalAssetShowcaseProps) {
  const [selectedAsset, setSelectedAsset] = useState<OrbitalAsset>(ORBITAL_ASSETS[0]);
  const [orbitalAngle, setOrbitalAngle] = useState(0);
  const theme = getActiveCampaignTheme();

  // Rotação suave contínua das órbitas
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setOrbitalAngle((prev) => (prev + 0.4) % 360);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleSelect = (asset: OrbitalAsset) => {
    setSelectedAsset(asset);
    if (onSelectCategory) {
      onSelectCategory(asset.categoryId);
    }
    // Dispara evento global para o simulador sincronizar
    window.dispatchEvent(new CustomEvent("select-simulator-category", { detail: { categoryId: asset.categoryId } }));
  };

  // 4 Satélites orbitais com posições trigonométricas
  const satellites = [
    { label: "Meia Parcela 50/50", desc: "50% até contemplar", color: "#10B981", offset: 0 },
    { label: "Poder de Compra", desc: "Desconto à vista", color: "#00F2FE", offset: 90 },
    { label: "Lance Embutido", desc: "Até 30% da carta", color: "#FFB800", offset: 180 },
    { label: "Zero Juros", desc: "Taxa fixa justa", color: "#EC4899", offset: 270 },
  ];

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* SELETOR RÁPIDO DE ATIVOS (CARROS, CASAS, MOTOS, PESADOS) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#070D19]/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl z-20 mb-4 max-w-full overflow-x-auto scrollbar-none">
        {ORBITAL_ASSETS.map((asset) => {
          const isSelected = selectedAsset.id === asset.id;
          const Icon = asset.icon;
          return (
            <button
              key={asset.id}
              onClick={() => handleSelect(asset)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isSelected
                  ? "bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 scale-105"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{asset.name.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* PLANETA HOLOGRÁFICO ORBITAL 3D */}
      <div className="relative w-[310px] sm:w-[360px] h-[310px] sm:h-[360px] flex items-center justify-center">
        {/* Glow Central Holográfico Eterial */}
        <div
          className="absolute inset-4 rounded-full blur-3xl opacity-50 transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: selectedAsset.color }}
        />

        {/* Anel de Órbita 1 (Externo - Rotação Inversa) */}
        <div
          className="absolute w-[290px] sm:w-[340px] h-[290px] sm:h-[340px] rounded-full border border-cyan-400/20 border-dashed pointer-events-none transition-transform duration-75"
          style={{ transform: `rotate(${-orbitalAngle * 0.5}deg)` }}
        />

        {/* Anel de Órbita 2 (Interno com Gradiente) */}
        <div
          className="absolute w-[230px] sm:w-[270px] h-[230px] sm:h-[270px] rounded-full border-2 border-transparent border-t-cyan-400/60 border-b-amber-400/50 pointer-events-none transition-transform duration-75"
          style={{ transform: `rotate(${orbitalAngle}deg)` }}
        />

        {/* SATÉLITES ORBITAIS (LUAS DO JARVIS ADAPTADAS PARA O CONSÓRCIO) */}
        {satellites.map((sat, idx) => {
          const rad = ((orbitalAngle + sat.offset) * Math.PI) / 180;
          const radiusPx = 135; // Raio da órbita
          const x = Math.cos(rad) * radiusPx;
          const y = Math.sin(rad) * (radiusPx * 0.42); // Elipse em perspectiva isométrica

          return (
            <div
              key={idx}
              className="absolute z-20 flex flex-col items-center pointer-events-auto transition-transform duration-75 hover:scale-110 cursor-pointer"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              onClick={() => handleSelect(selectedAsset)}
            >
              <div
                className="w-3.5 h-3.5 rounded-full border-2 border-white/80 shadow-[0_0_12px_currentColor] animate-pulse"
                style={{ backgroundColor: sat.color, color: sat.color }}
              />
              <span className="mt-1 px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-white/10 text-[9px] font-bold text-slate-200 whitespace-nowrap backdrop-blur-md shadow-md">
                {sat.label}
              </span>
            </div>
          );
        })}

        {/* NÚCLEO HOLOGRÁFICO: O ATIVO SELECIONADO (CARRO, MOTO, CASA, CAMINHÃO) */}
        <div className="relative z-10 w-44 sm:w-52 h-44 sm:h-52 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-cyan-500/40 via-blue-600/40 to-amber-500/40 backdrop-blur-2xl border border-white/20 shadow-2xl group transition-all duration-500 hover:scale-[1.03]">
          <div className="w-full h-full rounded-[22px] overflow-hidden relative bg-slate-950">
            <img
              src={selectedAsset.image}
              alt={selectedAsset.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Overlay Holográfico com Linhas de Varredura */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
            
            {/* Badge de Representação no Card */}
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 backdrop-blur-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">Magalu 3D</span>
            </div>

            {/* Informações de Crédito no Rodapé da Imagem */}
            <div className="absolute bottom-2 left-2 right-2 z-10 text-left">
              <div className="text-[11px] font-black text-white leading-tight truncate">{selectedAsset.name}</div>
              <div className="text-[10px] text-amber-300 font-bold mt-0.5">
                Meia Parcela de {selectedAsset.parcelaEstimada}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOX DE DETALHES RÁPIDOS ABAIXO DA ÓRBITA */}
      <div className="mt-3 text-center max-w-sm px-4">
        <div className="text-xs text-slate-300 font-medium leading-relaxed">
          {selectedAsset.subtitle}
        </div>
        <div className="mt-2 flex items-center justify-center gap-3 text-[11px] font-bold text-slate-300">
          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-cyan-300">
            Crédito: {selectedAsset.creditRange}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-emerald-300">
            Até {selectedAsset.prazoMaximo}
          </span>
        </div>
      </div>
    </div>
  );
}

