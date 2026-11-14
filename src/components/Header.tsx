import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";

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
    { label: "Sobre", href: "#beneficios" },
    { label: "Segmentos", href: "#segmentos" },
    { label: "Simulador", href: "#simulator" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/98 backdrop-blur-md shadow-sm py-3 border-b border-slate-200" 
          : "bg-white/90 backdrop-blur-md py-4 border-b border-slate-100 shadow-xs"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <a href="#" className="flex items-center gap-2 group">
          <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase">
            O ESPECIALISTA CONSÓRCIO
          </span>
        </a>

        {/* Navigation Links matching exact user screenshot */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.label} 
              href={link.href}
              className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {link.label}
            </a>
          ))}
          
          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#00A0E9] hover:bg-[#0088cc] text-white px-5 py-2 rounded-full text-xs font-extrabold shadow-lg shadow-sky-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          aria-label="Abrir Menu"
          className="md:hidden text-slate-700 bg-slate-100 p-2.5 rounded-xl border border-slate-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-slate-200 p-6 shadow-lg md:hidden animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a 
                key={link.label} 
                href={link.href}
                className="text-base font-medium p-3 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#00A0E9] text-white py-3.5 rounded-full font-bold text-sm uppercase tracking-wider mt-2 shadow-lg"
            >
              <Phone className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

