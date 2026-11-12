import React, { useState, useEffect } from "react";
import { Car, Home, Truck, Bike, Sparkles } from "lucide-react";
import cardImovel from "@/assets/card-imovel.webp";
import cardVeiculo from "@/assets/card-veiculo.webp";
import cardMoto from "@/assets/card-moto.webp";
import cardPesados from "@/assets/segment-truck.webp";

export interface OrbitalConquest {
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

export const ORBITAL_CONQUESTS: OrbitalConquest[] = [
  {
    id: "conquest_car",
    name: "Carros & SUVs",
    subtitle: "Carro novo, zero entrada e poder de compra à vista",
    creditRange: "R$ 40 mil a R$ 250 mil",
    parcelaEstimada: "R$ 380/mês",
    prazoMaximo: "100 meses",
    image: cardVeiculo,
    icon: Car,
    color: "#00F2FE", // Ciano Neon
    categoryId: "veiculo",
  },
  {
    id: "conquest_home",
    name: "Casas & Imóveis",
    subtitle: "Casa própria, sobrado ou terreno sem juros de banco",
    creditRange: "R$ 150 mil a R$ 1.5 Milhão",
    parcelaEstimada: "R$ 508/mês",
    prazoMaximo: "220 meses",
    image: cardImovel,
    icon: Home,
    color: "#FFB800", // Ouro Magalu
    categoryId: "imovel",
  },
  {
    id: "conquest_moto",
    name: "Motos 0km",
    subtitle: "Alta cilindrada e scooters com parcelas que cabem no bolso",
    creditRange: "R$ 15 mil a R$ 60 mil",
    parcelaEstimada: "R$ 180/mês",
    prazoMaximo: "70 meses",
    image: cardMoto,
    icon: Bike,
    color: "#10B981", // Esmeralda
    categoryId: "moto",
  },
  {
    id: "conquest_truck",
    name: "Caminhões & Frotas",
    subtitle: "Extrapesados e maquinários que geram renda",
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
  const [selectedAsset, setSelectedAsset] = useState<OrbitalConquest>(ORBITAL_CONQUESTS[0]);
  const [orbitalAngle, setOrbitalAngle] = useState(0);

  // Rotação suave contínua das órbitas
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setOrbitalAngle((prev) => (prev + 0.35) % 360);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleSelect = (asset: OrbitalConquest) => {
    setSelectedAsset(asset);
    if (onSelectCategory) {
      onSelectCategory(asset.categoryId);
    }
    // Dispara evento global para o simulador sincronizar automaticamente
    window.dispatchEvent(new CustomEvent("select-simulator-category", { detail: { categoryId: asset.categoryId } }));
  };

  // Os 4 sonhos em órbita contínua ao redor do planeta
  const orbitingItems = [
    { ...ORBITAL_CONQUESTS[0], offset: 0 },   // Carro
    { ...ORBITAL_CONQUESTS[1], offset: 90 },  // Casa
    { ...ORBITAL_CONQUESTS[2], offset: 180 }, // Moto
    { ...ORBITAL_CONQUESTS[3], offset: 270 }, // Caminhão
  ];

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* SELETOR SUPERIOR EM PÍLULAS */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#070D19]/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl z-20 mb-3 max-w-full overflow-x-auto scrollbar-none">
        {ORBITAL_CONQUESTS.map((asset) => {
          const isSelected = selectedAsset.id === asset.id;
          const Icon = asset.icon;
          return (
            <button
              key={asset.id}
              onClick={() => handleSelect(asset)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isSelected
                  ? "bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 scale-105"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{asset.name.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* PLANETA HOLOGRÁFICO ORBITAL COM PEQUENOS CARROS, CASAS E MOTOS EM ÓRBITA */}
      <div className="relative w-[320px] sm:w-[380px] h-[320px] sm:h-[380px] flex items-center justify-center">
        {/* Glow Central Holográfico Eterial */}
        <div
          className="absolute inset-6 rounded-full blur-3xl opacity-50 transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: selectedAsset.color }}
        />

        {/* Anel de Órbita 1 (Externo - Rotação Inversa com Brilho) */}
        <div
          className="absolute w-[300px] sm:w-[350px] h-[300px] sm:h-[350px] rounded-full border border-cyan-400/30 border-dashed pointer-events-none transition-transform duration-75"
          style={{ transform: `rotate(${-orbitalAngle * 0.4}deg)` }}
        />

        {/* Anel de Órbita 2 (Interno com Gradiente Magalu Blue & Gold) */}
        <div
          className="absolute w-[240px] sm:w-[280px] h-[240px] sm:h-[280px] rounded-full border-2 border-transparent border-t-cyan-400/70 border-b-amber-400/60 pointer-events-none transition-transform duration-75"
          style={{ transform: `rotate(${orbitalAngle}deg)` }}
        />

        {/* AS 4 MINI CONQUISTAS ORBITANDO EM VOLTA (CARRO, CASA, MOTO, PESADOS) */}
        {orbitingItems.map((item, idx) => {
          const rad = ((orbitalAngle + item.offset) * Math.PI) / 180;
          const radiusPx = 142; // Raio da órbita
          const x = Math.cos(rad) * radiusPx;
          const y = Math.sin(rad) * (radiusPx * 0.44); // Perspectiva isométrica suave
          const isSelected = selectedAsset.id === item.id;
          const Icon = item.icon;

          return (
            <div
              key={idx}
              onClick={() => handleSelect(item)}
              className={`absolute z-20 flex flex-col items-center cursor-pointer transition-all duration-150 hover:scale-125 ${
                isSelected ? "scale-115" : "opacity-85 hover:opacity-100"
              }`}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              title={`Ver ${item.name}`}
            >
              {/* Card Flutuante Miniatura com Miniatura Real do Bem */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl p-0.5 border-2 shadow-lg transition-all flex items-center justify-center overflow-hidden ${
                  isSelected
                    ? "border-amber-400 shadow-[0_0_18px_#FFB800] ring-2 ring-cyan-400/60"
                    : "border-white/30 shadow-[0_0_10px_rgba(0,134,255,0.4)]"
                }`}
                style={{ backgroundColor: "#060D1F" }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>

              {/* Preço de Desejo Instantâneo */}
              <div className="mt-1 px-1.5 py-0.5 rounded-md bg-slate-950/90 border border-white/15 text-[8.5px] font-black text-amber-300 whitespace-nowrap shadow-md backdrop-blur-md">
                {item.parcelaEstimada}
              </div>
            </div>
          );
        })}

        {/* NÚCLEO HOLOGRÁFICO: O ATIVO EM DESTAQUE (GRANDE E DESEJÁVEL) */}
        <div className="relative z-10 w-48 sm:w-56 h-48 sm:h-56 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-cyan-400/50 via-blue-600/50 to-amber-400/50 backdrop-blur-2xl border border-white/25 shadow-2xl group transition-all duration-500 hover:scale-[1.03]">
          <div className="w-full h-full rounded-[22px] overflow-hidden relative bg-slate-950">
            <img
              src={selectedAsset.image}
              alt={selectedAsset.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Overlay Holográfico com Linhas de Varredura */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
            
            {/* Badge de Representação no Card */}
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-blue-600/80 border border-cyan-400/40 backdrop-blur-md flex items-center gap-1 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
              <span className="text-[9px] font-black text-white uppercase tracking-wider">Magalu 3D</span>
            </div>

            {/* Informações de Desejo no Rodapé */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 text-left">
              <div className="text-xs font-black text-white leading-tight truncate drop-shadow-md">
                {selectedAsset.name}
              </div>
              <div className="text-[11px] text-amber-300 font-black mt-0.5 drop-shadow">
                Meia Parcela de {selectedAsset.parcelaEstimada}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOX DE DETALHES ABAIXO DA ÓRBITA */}
      <div className="mt-2 text-center max-w-sm px-4">
        <div className="text-xs text-slate-300 font-medium leading-relaxed">
          {selectedAsset.subtitle}
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-300">
          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-cyan-300">
            {selectedAsset.creditRange}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-black">
            50% até contemplar
          </span>
        </div>
      </div>
    </div>
  );
}
