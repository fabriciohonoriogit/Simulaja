import { Facebook, Instagram, Linkedin, Phone, Sparkles, ShieldCheck, Lock } from "lucide-react";
import magaluLogo from "@/assets/logo-consorcio-magalu-oficial.webp";

const WHATSAPP_NUMBER = "5541997925357";

const Footer = () => {
  return (
    <footer className="py-16 px-4 sm:px-6 bg-[#0B132B] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#B8860B] via-[#D4AF37] to-[#966F1E] flex items-center justify-center text-slate-950 font-bold shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">O ESPECIALISTA CONSÓRCIO</h3>
                <p className="text-[10px] text-amber-400 font-extrabold tracking-widest uppercase">PLANEJAMENTO & CONSULTORIA ESTRATÉGICA</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Gestor Autorizado Consórcio Magalu. Consultoria estratégica especializada em consórcios imobiliários, pesados e veículos com metodologia de parcelas reduzidas e planejamento de contemplação.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[10px] text-cyan-300 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Parceria Oficial Consórcio Magalu</span>
            </div>
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
                <a href="/pre-cadastro" className="hover:text-amber-400 transition-colors">Ficha de Pré-Cadastro</a>
              </li>
              <li>
                <a href="/login" className="hover:text-amber-400 transition-colors">Acesso Administrativo CRM</a>
              </li>
            </ul>
          </div>

          {/* Compliance & ABAC */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Regulatório & ABAC</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <a href="https://www.abac.org.br/para-voce" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">
                  ABAC — Guia Oficial do Consórcio
                </a>
              </li>
              <li>
                <a href="https://www.bcb.gov.br/estabilidadefinanceira/consorcios" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">
                  Banco Central do Brasil — Fiscalização
                </a>
              </li>
              <li>
                <span className="text-slate-500 block text-[11px] pt-1">
                  Lei Federal nº 11.795/2008 (Sistema de Consórcios)
                </span>
              </li>
              <li>
                <span className="text-slate-500 block text-[11px]">
                  Administradora: Consórcio Magalu Ltda. (CNPJ 50.416.748/0001-90)
                </span>
              </li>
            </ul>
          </div>

          {/* Redes Sociais & Credibilidade */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Redes Oficiais & Resultados</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quer mais credibilidade? Acompanhe o dia a dia, entregas reais de cartas de crédito e depoimentos nas minhas redes sociais oficiais:
            </p>

            <div className="space-y-2">
              <a
                href="https://www.instagram.com/fabricioespecialistaconsorcio/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-2.5 rounded-2xl transition-all group w-full shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E1306C] to-[#833AB4] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Instagram className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-pink-400 uppercase font-bold tracking-wider">Instagram Oficial</p>
                  <p className="text-xs font-black text-white group-hover:text-pink-300 truncate">@fabricioespecialistaconsorcio</p>
                </div>
              </a>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 p-2.5 rounded-2xl transition-all group w-full shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">WhatsApp Consultoria</p>
                  <p className="text-xs font-black text-white group-hover:text-emerald-300">(41) 99792-5357</p>
                </div>
              </a>
            </div>

            <div className="flex gap-2.5 pt-1">
              <a href="https://www.facebook.com/profile.php?id=61587719436474" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-400/50 transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/fabricioespecialistaconsorcio/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-pink-400 hover:border-pink-400/50 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-400/50 transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* REPRESENTANTE OFICIAL CONSÓRCIO MAGALU */}
        <div className="border-t border-slate-800 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <img src={magaluLogo} alt="Consórcio Magalu" className="h-12 w-auto" />
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Representante Oficial</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Gestor Autorizado — Consórcio Magalu Ltda.</p>
              <p className="text-[10px] text-slate-500">CNPJ 50.416.748/0001-90</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Fiscalizado pelo Banco Central do Brasil</span>
          </div>
        </div>

        {/* NOTA LGPD & SEGURANÇA */}
        <div className="border-t border-slate-800/80 pt-6 pb-4 text-[11px] text-slate-400 leading-relaxed flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Privacidade & LGPD:</span>
          </div>
          <p className="flex-1 text-slate-400 text-[10.5px]">
            Seus dados cadastrais e de simulação são protegidos em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Não comercializamos suas informações com terceiros nem enviamos mensagens não autorizadas.
          </p>
        </div>

        {/* COPYRIGHT & CRÉDITOS */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} O Especialista em Consórcio — <a href="https://www.oespecialistaconsorcio.com.br" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 transition-colors font-bold">www.oespecialistaconsorcio.com.br</a></p>
          <p className="font-bold text-amber-400/90 tracking-wider text-[11px]">PROSPERA PLANEJAMENTO & CONSULTORIA</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
