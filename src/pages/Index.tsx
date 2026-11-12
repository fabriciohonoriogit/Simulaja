import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { VitrineOfertasMagalu } from "@/components/VitrineOfertasMagalu";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import { StickySimulatorCTA } from "@/components/StickySimulatorCTA";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BlackFridayBanner } from "@/components/BlackFridayBanner";
import { isBlackFridayActive } from "@/utils/blackFridayTheme";

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
    const { nome, celular, categoriaLabel, credito, prazo, leadScoreValor } = leadData;
    
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
    <main className="min-h-screen bg-[#050814] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {isBlackFridayActive() && <BlackFridayBanner compact={true} className="sticky top-0 z-50" />}
      <StickySimulatorCTA />
      <Header />

      {/* 1ª DOBRA - Hero Futurista Magalu com Planeta Holográfico e Simulador à Direita */}
      <div id="simulator" className="scroll-mt-20">
        <Hero onSimulateSubmit={handleSimulateSubmit} />
      </div>

      {/* 2ª SEÇÃO - Vitrine de Conquistas Magalu (Cardápio das Maiores Ofertas) */}
      <VitrineOfertasMagalu />

      {/* 3ª SEÇÃO - Como Funciona em 4 Etapas Simples */}
      <HowItWorks />

      {/* 4ª SEÇÃO - Depoimentos de Clientes Contemplados */}
      <Testimonials />

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default Index;
