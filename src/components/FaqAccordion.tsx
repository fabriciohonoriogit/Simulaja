import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Sparkles } from "lucide-react";

const faqItems = [
  {
    question: "Como funciona o consórcio?",
    answer:
      "O consórcio é uma modalidade de compra planejada em grupo, sem cobrança de juros. Todos os meses, os participantes contribuem com parcelas e ocorrem as contemplações por sorteio ou oferta de lance. Assim que contemplado, você recebe a carta de crédito com poder de compra à vista.",
  },
  {
    question: "Existe entrada?",
    answer:
      "Não! Diferente dos financiamentos bancários convencionais, o consórcio não exige entrada. Você inicia seu plano pagando apenas a primeira parcela mensal reduzida.",
  },
  {
    question: "Tem juros?",
    answer:
      "Não existem juros no consórcio. Há apenas uma taxa de administração fixa diluída ao longo de todo o plano, o que torna o custo total significativamente mais barato do que qualquer financiamento.",
  },
  {
    question: "Posso ofertar lance?",
    answer:
      "Sim! O lance é uma excelente ferramenta para acelerar sua contemplação. Você pode utilizar recursos próprios ou até mesmo o 'lance embutido' (usar um percentual da própria carta de crédito) para antecipar a conquista.",
  },
  {
    question: "Posso utilizar FGTS?",
    answer:
      "Sim! No consórcio imobiliário, você pode utilizar o seu saldo do FGTS para ofertar lances, complementar a carta de crédito, amortizar parcelas ou quitar o saldo devedor, conforme regras da Caixa Econômica Federal.",
  },
  {
    question: "Posso quitar antes?",
    answer:
      "Sim! Você pode antecipar parcelas, amortizar o saldo devedor ou quitar integralmente o plano a qualquer momento com total transparência e sem taxas de penalização.",
  },
  {
    question: "Quanto tempo leva para contemplar?",
    answer:
      "A contemplação pode ocorrer desde a primeira assembleia até o final do plano via sorteio. Com a nossa consultoria estratégica, analisamos os grupos e o histórico de lances para maximizar suas chances de ser contemplado no prazo que você precisa.",
  },
];

const FaqAccordion = () => {
  return (
    <section className="py-24 bg-white text-slate-900 relative overflow-hidden border-t border-slate-200/60" id="faq">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-[#B8860B] text-xs font-bold uppercase tracking-widest">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Tire Suas Dúvidas
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F172A]">
            Perguntas <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#966F1E]">Frequentes</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Respostas transparentes para as principais dúvidas sobre o consórcio inteligente.
          </p>
        </div>

        {/* Accordion Component - Clean White Light Styling */}
        <div className="bg-slate-50/70 rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md">
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border border-slate-200 rounded-2xl px-6 py-2 bg-white data-[state=open]:border-amber-300 data-[state=open]:shadow-md transition-all duration-200"
              >
                <AccordionTrigger className="text-left font-bold text-base sm:text-lg text-[#0F172A] hover:text-[#B8860B] hover:no-underline py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-sm leading-relaxed pb-4 pt-1">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

      </div>
    </section>
  );
};

export default FaqAccordion;
