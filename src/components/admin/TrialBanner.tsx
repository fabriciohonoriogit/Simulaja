import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import { Sparkles, AlertTriangle } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5541997925357?text=Quero%20ativar%20minha%20assinatura%20do%20Contemplar%20CRM";

export default function TrialBanner() {
  const { loading, isActive, isTrialing, isExpired, daysLeft } = useSubscription();

  if (loading || isActive) return null;

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-medium">
        <AlertTriangle className="h-4 w-4" />
        <span>Seu período trial expirou.</span>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener" className="underline font-bold hover:no-underline">
          Falar com Fabrício no WhatsApp
        </a>
      </div>
    );
  }

  if (isTrialing) {
    const urgent = daysLeft <= 3;
    return (
      <div className={`${urgent ? "bg-amber-500" : "bg-primary"} text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium`}>
        <Sparkles className="h-4 w-4" />
        <span>
          {daysLeft === 0
            ? "Último dia de trial!"
            : `Trial: ${daysLeft} ${daysLeft === 1 ? "dia restante" : "dias restantes"}`}
        </span>
        <Link to="/admin/assinatura" className="underline font-bold hover:no-underline">
          Assinar agora
        </Link>
      </div>
    );
  }

  return null;
}
