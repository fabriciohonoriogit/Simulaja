import { Facebook, Instagram, Linkedin, Phone, Sparkles, ShieldCheck, Lock, ExternalLink } from "lucide-react";
import magaluLogo from "@/assets/logo-consorcio-magalu-transparent.png";

const WHATSAPP_NUMBER = "5541997925357";

const Footer = () => {
  return (
    <footer className="py-14 px-4 sm:px-6 bg-[#FAF9F5] text-slate-700 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* PARCERIA OFICIAL E CHANCELA DE AUTORIDADE COM LOGOS OFICIAIS */}
        <div className="mb-12 p-6 rounded-3xl bg-white border border-blue-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="bg-[#0086FF] p-3.5 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <img src={magaluLogo} alt="Consórcio Magalu" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0086FF] text-[10px] font-black uppercase tracking-wider mb-1">
                <span>Representante Autorizado Oficial</span>
              </div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Consórcio Magalu Ltda.
              </h3>
              <p className="text-xs text-slate-500">
                CNPJ 50.416.748/0001-90 • Regulamentado pela Lei Federal nº 11.795/2008
              </p>
            </div>
          </div>

          {/* CHANCELAS OFICIAIS: BANCO CENTRAL & ABAC COM LOGOS SEM FUNDO */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
            <a 
              href="https://www.bcb.gov.br/estabilidadefinanceira/consorcios" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Fiscalizado pelo Banco Central do Brasil"
            >
              <img src="/logo-bacen.svg" alt="Banco Central do Brasil" className="h-7 w-auto object-contain" />
              <div className="text-left">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Órgão Regulador</span>
                <span className="block text-xs font-black text-slate-800">Banco Central</span>
              </div>
            </a>

            <a 
              href="https://www.abac.org.br" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Filiado à ABAC"
            >
              <img src="/logo-abac.svg" alt="ABAC - Associação Brasileira de Administradoras de Consórcios" className="h-7 w-auto object-contain" />
              <div className="text-left">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Entidade de Classe</span>
                <span className="block text-xs font-black text-slate-800">Filiado ABAC</span>
              </div>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0086FF] flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">O ESPECIALISTA CONSÓRCIO</h3>
                <p className="text-[10px] text-[#0086FF] font-extrabold tracking-widest uppercase">PLANEJAMENTO & CONSULTORIA</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
              Consultoria estratégica especializada em consórcios imobiliários, veículos e frotas com metodologia de parcelas reduzidas e inteligência de contemplação.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[10px] text-[#0086FF] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Garantia Consórcio Magalu</span>
            </div>
          </div>

          {/* Navigation Anchors */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li>
                <a href="#simulator" className="hover:text-[#0086FF] transition-colors">Simulador Inteligente</a>
              </li>
              <li>
                <a href="#segmentos" className="hover:text-[#0086FF] transition-colors">Tipos de Consórcio</a>
              </li>
              <li>
                <a href="#beneficios" className="hover:text-[#0086FF] transition-colors">Por que Planejar?</a>
              </li>
              <li>
                <a href="#depoimentos" className="hover:text-[#0086FF] transition-colors">Histórias de Sucesso</a>
              </li>
              <li>
                <a href="/pre-cadastro" className="hover:text-[#0086FF] transition-colors">Ficha de Pré-Cadastro</a>
              </li>
              <li>
                <a href="/login" className="hover:text-[#0086FF] transition-colors">Acesso Administrativo CRM</a>
              </li>
            </ul>
          </div>

          {/* Compliance & ABAC */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Regulatório & Transparência</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li>
                <a href="https://www.abac.org.br/para-voce" target="_blank" rel="noopener noreferrer" className="hover:text-[#0086FF] transition-colors flex items-center gap-1">
                  <span>ABAC — Guia Oficial</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a href="https://www.bcb.gov.br/estabilidadefinanceira/consorcios" target="_blank" rel="noopener noreferrer" className="hover:text-[#0086FF] transition-colors flex items-center gap-1">
                  <span>Banco Central — Fiscalização</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <span className="text-slate-500 block text-[11px] pt-1">
                  Lei Federal nº 11.795/2008 (Sistema de Consórcios)
                </span>
              </li>
              <li>
                <span className="text-slate-500 block text-[11px]">
                  Administradora: Consórcio Magalu Ltda.
                </span>
              </li>
            </ul>
          </div>

          {/* Redes Sociais & Contato */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Atendimento Consultivo
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tire suas dúvidas ou solicite um estudo personalizado de contemplação:
            </p>

            <div className="space-y-2">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-2.5 rounded-2xl transition-all group w-full shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">WhatsApp Consultoria</p>
                  <p className="text-xs font-black text-slate-900 group-hover:text-emerald-800">(41) 99792-5357</p>
                </div>
              </a>

              <a
                href="https://www.instagram.com/fabricioespecialistaconsorcio/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2.5 rounded-2xl transition-all group w-full shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E1306C] to-[#833AB4] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Instagram className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-pink-600 uppercase font-bold tracking-wider">Instagram</p>
                  <p className="text-xs font-black text-slate-900 group-hover:text-pink-700 truncate">@fabricioespecialistaconsorcio</p>
                </div>
              </a>
            </div>

            <div className="flex gap-2.5 pt-1">
              <a href="https://www.facebook.com/profile.php?id=61587719436474" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0086FF] hover:border-blue-300 transition-all shadow-xs">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/fabricioespecialistaconsorcio/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-pink-600 hover:border-pink-300 transition-all shadow-xs">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0086FF] hover:border-blue-300 transition-all shadow-xs">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* NOTA LGPD & SEGURANÇA */}
        <div className="border-t border-slate-200 pt-6 pb-4 text-[11px] text-slate-500 leading-relaxed flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#0086FF] font-bold">
            <Lock className="w-4 h-4 text-[#0086FF] shrink-0" />
            <span>Privacidade & LGPD:</span>
          </div>
          <p className="flex-1 text-slate-500 text-[10.5px]">
            Seus dados cadastrais e de simulação são protegidos em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Não comercializamos suas informações com terceiros nem enviamos mensagens não autorizadas.
          </p>
        </div>

        {/* COPYRIGHT & CRÉDITOS */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} O Especialista em Consórcio — <a href="https://www.oespecialistaconsorcio.com.br" target="_blank" rel="noopener noreferrer" className="text-[#0086FF] hover:underline font-bold">www.oespecialistaconsorcio.com.br</a></p>
          <p className="font-bold text-slate-600 tracking-wider text-[11px]">PROSPERA PLANEJAMENTO & CONSULTORIA</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
