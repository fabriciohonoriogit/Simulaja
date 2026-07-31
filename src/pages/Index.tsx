import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SegmentCards from "@/components/SegmentCards";
import ConsortiumSimulator from "@/components/ConsortiumSimulator";
import HowItWorks from "@/components/HowItWorks";
import WhyPlanning from "@/components/WhyPlanning";
import Testimonials from "@/components/Testimonials";
import FaqAccordion from "@/components/FaqAccordion";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import { StickySimulatorCTA } from "@/components/StickySimulatorCTA";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Clock, ShieldCheck } from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const [utmParams, setUtmParams] = useState({ origem: "", meio: "", campanha: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtmParams({
      origem: params.get("utm_source") || "",
      meio: params.get("utm_medium") || "",
      campanha: params.get("utm_campaign") || "",
    });
  }, []);

  const handleSimulateSubmit = async (leadData: any) => {
    const { nome, celular, categoriaLabel, credito, prazo, r50, leadScoreValor } = leadData;
    
    const fmt = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

    try {
      console.log("Sincronizando lead com o CRM...", { nome, celular });
      const { error: dbError } = await supabase.from("leads").insert({
        nome: nome,
        celular: celular.replace(/\D/g, ""),
        tipo_consorcio: categoriaLabel,
        valor_credito: credito,
        prazo_meses: prazo,
        status: "novo_lead",
        lead_score_valor: leadScoreValor,
        lead_temperatura: "quente"
      });

      if (dbError) {
        console.error("❌ ERRO CRM:", dbError);
        toast({ 
          title: "Erro ao sincronizar CRM", 
          description: dbError.message || "Ocorreu um erro ao salvar o lead no banco de dados.",
          variant: "destructive"
        });
      } else {
        console.log("✅ Lead salvo no CRM!");
        toast({ title: "✅ Sua simulação foi registrada com sucesso!" });
      }
    } catch (e: any) {
      console.error("🚨 EXCEÇÃO CRM:", e);
      toast({ title: "Erro Crítico", description: e.message, variant: "destructive" });
    }

    try {
      const response = await fetch("https://hook.us2.make.com/t71aks5bg9zhk7briz86yxfeq98n65a1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          celular,
          valor_credito: fmt(credito),
          tipo_consorcio: categoriaLabel,
          pagina: window.location.href,
          origem: utmParams.origem || "Simulador Web",
          score: leadScoreValor,
        }),
      });
      
      if (response.ok) {
        console.log("✅ Webhook capturado!");
      }
    } catch (e) {
      console.error("Webhook Error:", e);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-amber-100 selection:text-[#B8860B]">
      <StickySimulatorCTA />
      <Header />

      {/* 1ª DOBRA - Hero (Clean Light) */}
      <Hero />

      {/* 2ª SEÇÃO - Tipos de Consórcio (Clean Light) */}
      <SegmentCards />

      {/* 3ª SEÇÃO - SIMULADOR (Clean Light Container) */}
      <div id="simulator" className="scroll-mt-20">
        <section className="py-24 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden border-t border-slate-200/60">
          
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
            
            {/* Header Acima do Simulador */}
            <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-[#B8860B] text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulador Inteligente</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F172A] leading-tight">
                Descubra a melhor estratégia para o <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#966F1E]">seu objetivo</span>
              </h2>

              <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
                Leva menos de 30 segundos para montar sua estratégia personalizada.
              </p>

              <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Rápido & Prático
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  100% Seguro
                </span>
              </div>
            </div>

            {/* Componente do Simulador (Clean Container com retenção de captação de leads) */}
            <div className="bg-white rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-2xl shadow-slate-200/60">
              <ConsortiumSimulator onSimulateSubmit={handleSimulateSubmit} />
            </div>

          </div>
        </section>
      </div>

      {/* 4ª SEÇÃO - Como Funciona (4 Etapas Clean) */}
      <HowItWorks />

      {/* 5ª SEÇÃO - Por que fazer um consórcio com planejamento? (Cards de Benefícios Clean) */}
      <WhyPlanning />

      {/* 6ª SEÇÃO - Depoimentos (Clean) */}
      <Testimonials />

      {/* 7ª SEÇÃO - Perguntas Frequentes (Accordion Clean) */}
      <FaqAccordion />

      {/* 8ª SEÇÃO - CTA Final (Navy & Gold Accent) */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default Index;
