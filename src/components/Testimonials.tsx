import React from "react";
import { CheckCheck, CheckCircle2, Star, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "./SocialIcons";
import { BlueParticlesBackground } from "@/components/BlueParticlesBackground";

const testimonials = [
  {
    title: "EU NÃO ACREDITAVA EM CONSÓRCIO",
    text: "Fiz o consórcio pela amizade que tinha com o Fabricio, e para minha surpresa fui contemplado no 3º mês.",
    author: "João Pereira",
    role: "Construtor • Paranaguá/PR",
    time: "09:42",
    initials: "JP",
    contemplation: "Contemplado no 3º Mês",
  },
  {
    title: "CONQUISTEI MINHA CASA NA PRAIA",
    text: "Sou aposentada e com fé em Deus e a ajuda do Fabricio consegui conquistar minha casa na praia no 6º mês.",
    author: "Zilma Gomes",
    role: "Aposentada • Guaratuba/PR",
    time: "14:15",
    initials: "ZG",
    contemplation: "Contemplada no 6º Mês",
  },
  {
    title: "CONQUISTEI UMA MOTO TOP",
    text: "Queria comprar uma moto via financiamento, mas a parcela estava fora do meu orçamento. Por indicação conheci o Fabricio e fui contemplado no 3º mês, hoje curto a liberdade que a moto me proporciona. Gratidão.",
    author: "Elias Jr",
    role: "Cliente • Paranaguá/PR",
    time: "18:30",
    initials: "EJ",
    contemplation: "Contemplado no 3º Mês",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-[#070D19] text-white relative overflow-hidden border-t border-white/10" id="depoimentos">
      {/* Partículas Espaciais Contínuas */}
      <BlueParticlesBackground />

      {/* Luzes e Auroras Cósmicas Suaves */}
      <div className="absolute top-10 right-10 w-[500px] h-[350px] bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[350px] bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Depoimentos Reais de Clientes</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Histórias Reais de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
              Conquista
            </span>
          </h2>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Veja as mensagens enviadas por clientes reais que planejaram e conquistaram seus patrimônios com a consultoria de Fabrício Honório.
          </p>
        </div>

        {/* WhatsApp Review Cards Grid em Estilo Noturno Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="group relative bg-[#0B1528]/90 rounded-3xl overflow-hidden border border-white/10 hover:border-emerald-400/50 shadow-2xl shadow-blue-950/60 hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between backdrop-blur-xl"
            >
              {/* WhatsApp Header Bar Noturno */}
              <div className="bg-[#0e2c22] text-white p-4 flex items-center justify-between border-b border-emerald-500/20 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 border border-emerald-400/60 flex items-center justify-center font-black text-sm text-white shadow-inner">
                    {item.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white leading-tight flex items-center gap-1.5">
                      {item.author}
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </h3>
                    <p className="text-[11px] text-emerald-200/80 font-medium">{item.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-emerald-950/90 px-2.5 py-1 rounded-full text-emerald-300 border border-emerald-400/40">
                    🏆 {item.contemplation}
                  </span>
                </div>
              </div>

              {/* Chat Body Wallpaper Noturno & Message Bubble */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between bg-[#08101a] relative">
                
                {/* Incoming Message Bubble */}
                <div className="relative bg-[#0F291E] text-slate-100 rounded-2xl rounded-tl-none p-4.5 shadow-lg border border-emerald-500/30 max-w-[96%] mb-4">
                  {/* Small WhatsApp Bubble Tail Left Top */}
                  <div className="absolute -top-[1px] -left-2 w-0 h-0 border-t-[10px] border-t-[#0F291E] border-l-[10px] border-l-transparent" />
                  
                  {/* Quote Highlight Title */}
                  <div className="text-xs font-black uppercase text-amber-300 tracking-wider mb-2 pb-1 border-b border-emerald-500/30 flex items-center justify-between">
                    <span>"{item.title}"</span>
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Message Content */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    "{item.text}"
                  </p>

                  {/* Timestamp & Double Blue Checkmark */}
                  <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-slate-400 font-bold">
                    <span>{item.time}</span>
                    <CheckCheck className="w-4 h-4 text-[#34B7F1]" />
                  </div>
                </div>

                {/* WhatsApp Footer Badge */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-bold">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                    <span>Depoimento Verificado</span>
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
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