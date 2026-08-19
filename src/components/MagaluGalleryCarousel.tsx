import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles, ShieldCheck, Maximize2, Play, Pause, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BANNERS = [
  {
    id: "casa-300k",
    title: "Casa Própria",
    subtitle: "Realize o Sonho da Sua Casa Própria sem pagar juros bancários!",
    credito: "R$ 300.000",
    parcela: "R$ 1.128,59",
    prazo: "194 meses",
    src: "/images/magalu/banner_casa_300k.jpg",
    categoria: "imoveis",
    badge: "Imóveis Especiais",
  },
  {
    id: "reforma-110k",
    title: "Reforma & Ampliação",
    subtitle: "Transforme seu lar do seu jeito com planejamento inteligente!",
    credito: "R$ 110.000",
    parcela: "R$ 353,14",
    prazo: "218 meses",
    src: "/images/magalu/banner_reforma_110k.jpg",
    categoria: "imoveis",
    badge: "Linha Reforma",
  },
  {
    id: "carro-120k",
    title: "Carro Novo",
    subtitle: "Tire o carro zero ou seminovo dos seus planos com parcelas que cabem no seu bolso!",
    credito: "R$ 120.000",
    parcela: "R$ 862,50",
    prazo: "96 meses",
    src: "/images/magalu/banner_carro_120k.jpg",
    categoria: "veiculos",
    badge: "Veículos Auto",
  },
  {
    id: "moto-50k",
    title: "Liberdade Sob Duas Rodas",
    subtitle: "Conquiste sua moto de média ou alta cilindrada com total liberdade!",
    credito: "R$ 50.000",
    parcela: "R$ 363,48",
    prazo: "99 meses",
    src: "/images/magalu/banner_moto_50k.jpg",
    categoria: "motos",
    badge: "Linha Duas Rodas",
  },
  {
    id: "casa-500k",
    title: "Alto Padrão Residencial",
    subtitle: "Imóvel de alto padrão ou terreno com parcela reduzida de consórcio!",
    credito: "R$ 500.000",
    parcela: "R$ 1.449,44",
    prazo: "238 meses",
    src: "/images/magalu/banner_casa_500k.jpg",
    categoria: "imoveis",
    badge: "Prime Imóveis",
  },
];

export const MagaluGalleryCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
  };

  const currentBanner = BANNERS[currentIndex];

  const scrollToSimulator = () => {
    const el = document.getElementById("simulator");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="galeria" className="py-20 bg-gradient-to-b from-slate-950 via-[#070D19] to-slate-950 text-white relative overflow-hidden scroll-mt-20">
      {/* Luz de Fundo Encantadora */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-amber-500/10 via-blue-600/15 to-amber-400/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="container max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabeçalho Encantador */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg shadow-amber-500/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>O ESPECIALISTA EM CONSÓRCIO</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Galeria Exclusiva de <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">Planos & Oportunidades</span>
          </h2>

          <p className="text-slate-300 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            Confira as melhores opções e condições especiais de crédito com parcelas reduzidas e planejamento sem juros bancários.
          </p>

          <div className="pt-1 flex items-center justify-center gap-6 text-xs text-slate-300 font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Segurança & Regulamentação Bacen
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Atendimento em Todo o Brasil
            </span>
          </div>
        </div>

        {/* Moldura do Carrossel de Alto Padrão */}
        <div className="relative max-w-5xl mx-auto group">
          
          {/* Container do Slide Principal com Efeito Glass & Sombra 3D */}
          <div 
            className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-900/80 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition-all duration-700 aspect-[16/9] sm:aspect-[16/9] md:aspect-[1.85/1]"
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current !== null) {
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (diff > 50) nextSlide();
                else if (diff < -50) prevSlide();
                touchStartX.current = null;
              }
            }}
          >
            {/* Imagem com Animação Suave */}
            {BANNERS.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentIndex
                    ? "opacity-100 scale-100 z-10 pointer-events-auto"
                    : "opacity-0 scale-105 z-0 pointer-events-none"
                }`}
              >
                <img
                  src={banner.src}
                  alt={banner.title}
                  className="w-full h-full object-cover object-center"
                />

                {/* Overlays Gradientes para Leitura & Encanto */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-90 md:opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/30" />

                {/* Informações Flutuantes no Canto Inferior Esquerdo */}
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-8 right-4 sm:right-8 z-20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
                      {banner.badge}
                    </div>
                    <h3 className="text-xl sm:text-3xl font-black text-white drop-shadow-md">
                      {banner.title}
                    </h3>
                    <p className="text-slate-200 text-xs sm:text-sm font-medium line-clamp-2 drop-shadow">
                      {banner.subtitle}
                    </p>
                  </div>

                  {/* CTA Botão "Simular Este Plano" */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      onClick={scrollToSimulator}
                      className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 sm:py-3 rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-2 group/btn"
                    >
                      <span>Simular Este Plano</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>

                    <button
                      onClick={() => setLightboxOpen(true)}
                      className="w-10 h-10 rounded-2xl bg-slate-950/60 hover:bg-slate-900 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105"
                      title="Ampliar Imagem"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botões de Navegação Lateral (Esquerda e Direita) */}
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-amber-500 border border-white/20 hover:border-amber-400 text-white hover:text-slate-950 flex items-center justify-center backdrop-blur-xl shadow-2xl transition-all duration-300 hover:scale-110 group-hover:opacity-100 opacity-90"
            aria-label="Slide Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-amber-500 border border-white/20 hover:border-amber-400 text-white hover:text-slate-950 flex items-center justify-center backdrop-blur-xl shadow-2xl transition-all duration-300 hover:scale-110 group-hover:opacity-100 opacity-90"
            aria-label="Próximo Slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Controles de Miniaturas & Play/Pause */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
          
          {/* Botão Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-white/10 hover:border-amber-400/40 text-xs text-slate-300 font-bold backdrop-blur-md transition-all"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Pausar Carrossel</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Iniciar Reprodução</span>
              </>
            )}
          </button>

          {/* Miniaturas Interativas com Efeito de Seleção */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-2">
            {BANNERS.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 shrink-0 ${
                  idx === currentIndex
                    ? "border-amber-400 scale-105 shadow-lg shadow-amber-500/20 w-16 sm:w-20 h-10 sm:h-12"
                    : "border-white/10 opacity-50 hover:opacity-100 w-12 sm:w-16 h-8 sm:h-10"
                }`}
              >
                <img src={b.src} alt={b.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Indicadores Numéricos */}
          <div className="text-xs text-slate-400 font-bold tracking-widest">
            <span className="text-amber-400 text-sm font-black">{currentIndex + 1}</span> / {BANNERS.length}
          </div>
        </div>

      </div>

      {/* Lightbox Modal de Ampliação */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-slate-900 border border-white/20 text-white hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center font-bold text-xl transition-all"
          >
            ✕
          </button>
          <div className="max-w-6xl w-full max-h-[90vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl relative">
            <img
              src={currentBanner.src}
              alt={currentBanner.title}
              className="w-full h-full object-contain max-h-[85vh] mx-auto"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <h4 className="text-lg font-bold text-amber-400">{currentBanner.title}</h4>
              <p className="text-xs text-slate-300 mt-1">Crédito: {currentBanner.credito} | Parcela a partir de: {currentBanner.parcela} em {currentBanner.prazo}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
