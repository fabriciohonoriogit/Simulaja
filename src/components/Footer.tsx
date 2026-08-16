import { Facebook, Instagram, Linkedin, Phone, Sparkles } from "lucide-react";

const WHATSAPP_NUMBER = "5541997925357";

const Footer = () => {
  return (
    <footer className="py-16 px-4 sm:px-6 bg-[#0B132B] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#B8860B] via-[#D4AF37] to-[#966F1E] flex items-center justify-center text-slate-950 font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">FABRÍCIO HONÓRIO</h3>
                <p className="text-[10px] text-amber-400 font-extrabold tracking-widest uppercase">GN CONSÓRCIO MAGALU PR/SC</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Consultoria estratégica especializada GN CONSÓRCIO MAGALU PR/SC. Conquiste seu imóvel, veículo ou investimento sem juros bancários.
            </p>
          </div>

          {/* Navigation Anchors */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <a href="#simulator" className="hover:text-amber-400 transition-colors">Simulador Inteligente</a>
              </li>
              <li>
                <a href="#segmentos" className="hover:text-amber-400 transition-colors">Tipos de Consórcio</a>
              </li>
              <li>
                <a href="#beneficios" className="hover:text-amber-400 transition-colors">Por que Planejar?</a>
              </li>
              <li>
                <a href="#depoimentos" className="hover:text-amber-400 transition-colors">Histórias de Sucesso</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-400 transition-colors">Perguntas Frequentes</a>
              </li>
            </ul>
          </div>

          {/* Useful Links & ABAC */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Links Úteis</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <a href="https://www.abac.org.br/para-voce" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">
                  ABAC — Guia do Consórcio
                </a>
              </li>
              <li>
                <a href="https://www.abac.org.br/perguntas-frequentes" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">
                  ABAC — Dúvidas e Regras
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-amber-400 transition-colors">Acesso Administrativo</a>
              </li>
            </ul>
          </div>

          {/* Contact Details & Socials */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Atendimento Direto</h4>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-slate-800/80 hover:bg-emerald-950/40 border border-slate-700/60 hover:border-emerald-500/40 p-3 rounded-2xl transition-all group w-full"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Phone className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">WhatsApp Consultoria</p>
                <p className="text-xs font-black text-white group-hover:text-emerald-400">(41) 99792-5357</p>
              </div>
            </a>

            <div className="flex gap-2.5 pt-1">
              <a href="https://www.facebook.com/profile.php?id=61587719436474" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-400/50 transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/fabricioespecialistaconsorcio/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-400/50 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-400/50 transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} GN CONSÓRCIO MAGALU PR/SC — Fabrício Rodrigues Honório — <a href="https://www.oespecialistaconsorcio.com.br" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 transition-colors font-bold">www.oespecialistaconsorcio.com.br</a></p>
          <p className="font-bold text-amber-400/90 tracking-wider">GN CONSÓRCIO MAGALU PR/SC</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

