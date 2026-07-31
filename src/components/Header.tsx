import { useState, useEffect } from "react";
import { Menu, X, Phone, Sparkles } from "lucide-react";

const WHATSAPP_NUMBER = "5541997925357";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Segmentos", href: "#segmentos" },
    { label: "Simulador Inteligente", href: "#simulator" },
    { label: "Vantagens", href: "#beneficios" },
    { label: "Depoimentos", href: "#depoimentos" },
    { label: "Dúvidas", href: "#faq" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-[#0F172A]/95 backdrop-blur-md shadow-xl py-3 border-b border-slate-800/80" 
          : "bg-[#0F172A]/90 backdrop-blur-sm py-4 border-b border-slate-800/40"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#B8860B] via-[#D4AF37] to-[#966F1E] flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight text-white block leading-none">
              FABRÍCIO HONÓRIO
            </span>
            <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase block mt-0.5">
              ESPECIALISTA CONSÓRCIO
            </span>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <a 
              key={link.label} 
              href={link.href}
              className="text-xs sm:text-sm font-bold text-slate-300 hover:text-amber-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Phone className="w-4 h-4" />
            <span>Fale no WhatsApp</span>
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          aria-label="Abrir Menu"
          className="lg:hidden text-white bg-slate-800/80 p-2.5 rounded-xl border border-slate-700"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0F172A] border-t border-slate-800 p-6 shadow-2xl lg:hidden animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a 
                key={link.label} 
                href={link.href}
                className="text-base font-bold p-3 text-slate-200 hover:text-amber-400 hover:bg-slate-800/50 rounded-xl transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider mt-2 shadow-lg"
            >
              <Phone className="w-4 h-4" />
              <span>Fale no WhatsApp</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
