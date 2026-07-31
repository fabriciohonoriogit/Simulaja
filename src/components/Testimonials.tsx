import { CheckCheck, CheckCircle2, MessageSquare, Phone, MoreVertical, Star, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "./SocialIcons";

const testimonials = [
  {
    title: "EU NÃO ACREDITAVA EM CONSÓRCIO",
    text: "Fiz o consórcio pela amizade que tinha com o Fabricio, e para minha surpresa fui contemplado no 3 mês.",
    author: "João Pereira",
    role: "Construtor • Paranaguá/Pr",
    time: "09:42",
    initials: "JP",
    contemplation: "Contemplado no 3º Mês",
  },
  {
    title: "CONQUISTEI MINHA CASA NA PRAIA",
    text: "Sou aposentada e com fé em Deus e a ajuda do Fabricio consegui conquistar minha casa na praia no 6. mês.",
    author: "Zilma Gomes",
    role: "Aposentada • Guaratuba/PR",
    time: "14:15",
    initials: "ZG",
    contemplation: "Contemplada no 6º Mês",
  },
  {
    title: "CONQUISTEI UMA MOTO TOP",
    text: "Queria comprar uma moto via financiamento, mas a parcela estava fora do meu orçamento. Por indicação conheci o Fabricio e fui contemplado no 3.mês, hoje curto a liberdade que a moto me proporciona. Gratidão.",
    author: "Elias Jr",
    role: "Cliente • Paranaguá/PR",
    time: "18:30",
    initials: "EJ",
    contemplation: "Contemplado no 3º Mês",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-slate-50/70 text-slate-900 relative overflow-hidden border-t border-slate-200/60" id="depoimentos">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold uppercase tracking-widest">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Depoimentos Reais de Clientes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F172A]">
            Histórias de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#966F1E]">Conquista</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Veja as mensagens enviadas por clientes reais que planejaram e conquistaram seus patrimônios com a nossa consultoria.
          </p>
        </div>

        {/* WhatsApp Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="group relative bg-[#efeae2] rounded-3xl overflow-hidden border border-slate-300/80 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
            >
              {/* WhatsApp Header Bar */}
              <div className="bg-[#075E54] text-white p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 border-2 border-emerald-400 flex items-center justify-center font-black text-sm text-white shadow-inner">
                    {item.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white leading-tight flex items-center gap-1.5">
                      {item.author}
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    </h3>
                    <p className="text-[11px] text-emerald-100/90 font-medium">{item.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-200/80">
                  <span className="text-[10px] font-bold bg-emerald-800/80 px-2 py-0.5 rounded-full text-emerald-200 border border-emerald-600/50">
                    {item.contemplation}
                  </span>
                </div>
              </div>

              {/* Chat Body Wallpaper & Message Bubble */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between bg-[#efeae2] bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px]">
                
                {/* Incoming Message Bubble */}
                <div className="relative bg-[#d9fdd3] text-slate-800 rounded-2xl rounded-tl-none p-4.5 shadow-md border border-emerald-200/60 max-w-[95%] mb-4">
                  {/* Small WhatsApp Bubble Tail Left Top */}
                  <div className="absolute -top-[1px] -left-2 w-0 h-0 border-t-[10px] border-t-[#d9fdd3] border-l-[10px] border-l-transparent" />
                  
                  {/* Quote Highlight Title */}
                  <div className="text-xs font-black uppercase text-[#075E54] tracking-wider mb-2 pb-1 border-b border-emerald-300/40 flex items-center justify-between">
                    <span>"{item.title}"</span>
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Message Content */}
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    "{item.text}"
                  </p>

                  {/* Timestamp & Double Blue Checkmark */}
                  <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-slate-500 font-bold">
                    <span>{item.time}</span>
                    <CheckCheck className="w-4 h-4 text-[#34B7F1]" />
                  </div>
                </div>

                {/* WhatsApp Footer Badge */}
                <div className="pt-3 border-t border-slate-300/60 flex items-center justify-between text-xs text-slate-600 font-bold">
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                    <span>Depoimento Verificado</span>
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                    100% Real
                  </span>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
