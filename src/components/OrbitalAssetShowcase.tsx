import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Home, Truck, Bike, ShieldCheck, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import brightCar from "@/assets/bright/bright-car.webp";
import brightHouse from "@/assets/bright/bright-house.webp";
import brightMoto from "@/assets/bright/bright-moto.webp";
import brightTruck from "@/assets/bright/bright-truck.webp";

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
    image: brightCar,
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
    image: brightHouse,
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
    image: brightMoto,
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
    image: brightTruck,
    icon: Truck,
    color: "#8B5CF6", // Roxo Tech
    categoryId: "pesados",
  },
];

interface OrbitalAssetShowcaseProps {
  onSelectCategory?: (categoryId: string) => void;
  className?: string;
}

const AUTOPLAY_DURATION_MS = 5500;

export function OrbitalAssetShowcase({ onSelectCategory, className = "" }: OrbitalAssetShowcaseProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const selectedAsset = ORBITAL_CONQUESTS[selectedIndex];

  // Auto-Play: avança automaticamente a cada 5.5s se não estiver em hover
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % ORBITAL_CONQUESTS.length);
    }, AUTOPLAY_DURATION_MS);

    return () => clearInterval(interval);
  }, [isHovered, selectedIndex]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    const asset = ORBITAL_CONQUESTS[index];
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
    <div 
      className={`w-full flex flex-col items-start select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* SELETOR SUPERIOR EM PÍLULAS COM BARRA DE PROGRESSO ANIMADA */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-blue-200/80 shadow-md shadow-blue-50/50 z-20 mb-3 w-full">
        {ORBITAL_CONQUESTS.map((asset, index) => {
          const isSelected = selectedIndex === index;
          const Icon = asset.icon;
          return (
            <button
              key={asset.id}
              onClick={() => handleSelect(index)}
              className={`relative overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                isSelected
                  ? "bg-[#0086FF] text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{asset.name}</span>

              {/* Barra de progresso do Auto-Play no botão ativo */}
              {isSelected && !isHovered && (
                <motion.div
                  key={`progress-${selectedIndex}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTOPLAY_DURATION_MS / 1000, ease: "linear" }}
                  style={{ originX: 0 }}
                  className="absolute inset-x-0 bottom-0 h-[2px] bg-white/70"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* VITRINE REAL DO BEM SELECIONADO COM EFEITOS DINÂMICOS */}
      <div 
        onClick={() => handleSelect(selectedIndex)}
        className="w-full relative rounded-3xl overflow-hidden border border-blue-200/80 bg-white shadow-xl shadow-blue-100/50 group transition-all duration-500 cursor-pointer hover:border-[#0086FF]/60 hover:shadow-2xl"
        title="Toque para simular esta conquista com meia parcela"
      >
        {/* Glow dinâmico sutil que pulsa e reage à cor do ativo */}
        <div
          className="absolute -top-12 -right-12 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-1000 animate-pulse"
          style={{ backgroundColor: selectedAsset.color }}
        />

        {/* CONTAINER DA IMAGEM */}
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-slate-100">
          <img
            key={selectedAsset.id}
            src={selectedAsset.image}
            alt={selectedAsset.name}
            loading="eager"
            decoding="sync"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />

          {/* Feixe de brilho dinâmico */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg] animate-shine-sweep" />
          </div>

          {/* Sombra inferior suave para contraste dos textos */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none z-10" />

          {/* Badges superiores flutuantes */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-900/90 border border-white/20 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-md">
              {selectedAsset.name}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              50% até contemplar
            </span>
          </div>

          {/* Destaque da Parcela Reduzida na Imagem com Animação de Entrada */}
          <div className="absolute bottom-3 right-3 z-20 text-right">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-end gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" /> Meia Parcela a partir de
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedAsset.parcelaEstimada}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] font-mono tracking-tight"
              >
                {selectedAsset.parcelaEstimada}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Informações Estratégicas do Ativo */}
        <div className="p-3.5 sm:p-4 space-y-2.5 bg-slate-50/60 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-snug">
              {selectedAsset.subtitle}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#0086FF] shrink-0 group-hover:translate-x-1.5 transition-transform">
              Simular <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 text-[11px] font-bold text-slate-600">
            <div className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-[#0086FF] flex items-center gap-1.5 shadow-xs">
              <span>Créditos:</span>
              <strong className="text-slate-900">{selectedAsset.creditRange}</strong>
            </div>
            <div className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-amber-600 flex items-center gap-1.5 shadow-xs">
              <span>Prazo:</span>
              <strong className="text-slate-900">{selectedAsset.prazoMaximo}</strong>
            </div>
            <div className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sem Juros Bancários</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
