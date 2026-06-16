import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, MessageCircle, Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const WHATSAPP_URL = "https://wa.me/5541997925357";

const PLANOS = [
  {
    nome: "Starter",
    preco: "R$ 97",
    periodo: "/mês",
    destaque: false,
    features: ["Até 2 usuários", "500 leads ativos", "Funil + Carteira", "Suporte por e-mail"],
  },
  {
    nome: "Pro",
    preco: "R$ 197",
    periodo: "/mês",
    destaque: true,
    features: [
      "Até 5 usuários",
      "Leads ilimitados",
      "Jarvis IA + WhatsApp Inbox",
      "Agendamentos Google Calendar",
      "Suporte prioritário",
    ],
  },
  {
    nome: "Business",
    preco: "Sob consulta",
    periodo: "",
    destaque: false,
    features: ["Usuários ilimitados", "API + integrações dedicadas", "Onboarding VIP", "SLA 99,9%"],
  },
];

export default function Assinatura() {
  const { isExpired, isTrialing, daysLeft, orgNome } = useSubscription();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubscribe = (planoNome: string) => {
    const text = `Fala Fabrício! Quero ativar a minha assinatura do Contemplar CRM no plano *${planoNome}*.`;
    window.open(`${WHATSAPP_URL}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      <div className="text-center space-y-3">
        {isExpired ? (
          <>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
              Trial expirado
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Continue impulsionando suas vendas
            </h1>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              {isTrialing ? `${daysLeft} ${daysLeft === 1 ? "dia restante" : "dias restantes"} de trial` : "Sua conta"}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Escolha o plano ideal para {orgNome || "sua equipe"}
            </h1>
          </>
        )}
        <p className="text-slate-600 max-w-xl mx-auto">
          Ative sua assinatura falando direto com o Fabrício pelo WhatsApp. Sem burocracia, ativação no mesmo dia.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANOS.map((p) => (
          <Card
            key={p.nome}
            className={`relative border-2 ${
              p.destaque ? "border-primary shadow-2xl scale-[1.02]" : "border-slate-200"
            }`}
          >
            {p.destaque && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                MAIS POPULAR
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl font-black">{p.nome}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">{p.preco}</span>
                <span className="text-slate-500 font-medium">{p.periodo}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe(p.nome)}
                className={`w-full h-12 rounded-xl font-bold transition-all ${
                  p.destaque ? "hover:scale-105 shadow-xl shadow-primary/20" : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Assinar via WhatsApp
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900 text-white border-none">
        <CardContent className="p-6 flex items-center gap-4">
          <ShieldCheck className="h-10 w-10 text-primary flex-shrink-0" />
          <div className="text-sm">
            <p className="font-bold mb-1">Seus dados estão seguros.</p>
            <p className="text-white/70">
              Mesmo após o trial, todos os leads, conversas e configurações permanecem salvos. Basta reativar a
              assinatura para retomar o acesso completo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
