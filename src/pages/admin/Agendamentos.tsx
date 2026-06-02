import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays, MessageCircle, Phone, Clock, AlertCircle, Search,
  MapPin, DollarSign, ExternalLink, Gift, PartyPopper, Plus,
  ChevronLeft, ChevronRight, CheckCircle2, ListFilter,
  Calendar as CalendarIcon, Trash2, Pencil, ChevronUp, ChevronDown,
  Zap, Users, Bell, Instagram, Copy, Check, Sparkles, Share2, FileText,
  CheckSquare, RefreshCw
} from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { Badge } from "@/components/ui/badge";
import {
  format, parseISO, isPast, isToday, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay,
  addMonths, subMonths, addDays, getDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatLeadValue, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { formatToUpper } from "@/lib/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseBirthday, isBirthdayToday, isBirthdayThisMonth, extractBirthdayValue } from "@/lib/birthdayUtils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const getLeadBirthdayStr = (lead: Lead | undefined): string | null => {
  if (!lead || !lead.dados_cadastro) return null;
  return extractBirthdayValue(lead.dados_cadastro);
};

interface Lead {
  id: string;
  nome: string;
  status: string | null;
  valor_credito: number;
  data_vencimento: string | null;
  celular: string | null;
  cidade: string | null;
  tipo_consorcio: string | null;
  dados_cadastro?: any;
}

interface Appointment {
  id: string;
  titulo: string;
  data_agendada: string;
  descricao: string | null;
  lead_id: string | null;
  tipo: string | null;
  status: string | null;
  lead?: Lead;
}

interface SocialPost {
  dia: number;
  tema: string;
  formato: 'Vídeo' | 'Carrossel' | 'Post' | 'Story' | 'Reels';
  legenda: string;
  hashtags: string;
}

const postsRedesSociais: SocialPost[] = [
  {
    dia: 1,
    tema: "Quem planeja compra melhor",
    formato: "Vídeo",
    legenda: "Planejar seu futuro financeiro é o melhor caminho para conquistar seus objetivos sem pagar juros abusivos. Quem planeja não apenas compra melhor, mas compra com inteligência e economia. Quer saber como começar seu planejamento hoje? Simule no link da bio!",
    hashtags: "#planejamento #consorcio #educacaofinanceira #economia"
  },
  {
    dia: 2,
    tema: "Mito: Consórcio é sorte",
    formato: "Carrossel",
    legenda: "Consórcio não é jogo de azar! Com lances estratégicos (lance embutido, lance fixo) e a escolha do grupo certo, você assume as rédeas da sua contemplação. Passe para o lado e veja como funciona a matemática por trás do consórcio.",
    hashtags: "#mitos #consorcio #investimento #estratega #planejamento"
  },
  {
    dia: 3,
    tema: "Quanto custa um carro de R$100 mil no consórcio?",
    formato: "Post",
    legenda: "Sem juros altos de financiamento e sem necessidade de entrada! Planeje a compra do seu carro de R$100 mil com parcelas que realmente cabem no seu bolso. Faça uma simulação rápida pelo WhatsApp!",
    hashtags: "#carro #consorcioautomotivo #carros #planejamento"
  },
  {
    dia: 4,
    tema: "Corpus Christi - Planejamento e Fé",
    formato: "Vídeo",
    legenda: "Neste feriado de Corpus Christi, refletimos sobre a importância de construir bases sólidas para a vida e a família. Ter fé nos nossos sonhos e planejar o caminho é o primeiro passo para realizá-los. Um excelente feriado a todos!",
    hashtags: "#corpuschristi #fé #planejamento #familia #conquistas"
  },
  {
    dia: 5,
    tema: "Cliente que conquistou veículo",
    formato: "Story",
    legenda: "Mais um sonho saindo do papel! Parabéns ao nosso cliente que acaba de faturar o seu veículo novo através do consórcio planejado. O próximo pode ser você! Clique e simule agora.",
    hashtags: "#clientecontemplado #consorcio #veiculotop #realizacao"
  },
  {
    dia: 6,
    tema: "Top 5 carros para comprar com consórcio",
    formato: "Carrossel",
    legenda: "Quer trocar de carro mas não sabe qual escolher? Listamos os 5 modelos mais procurados e com excelente custo-benefício para comprar com sua carta de crédito de consórcio. Passe para o lado e escolha o seu preferido!",
    hashtags: "#top5 #carros #automoveis #cartadecredito #consorcio"
  },
  {
    dia: 7,
    tema: "Bastidores da semana",
    formato: "Story",
    legenda: "Um pouquinho do que rolou por aqui nesta semana: muitas simulações, entregas de cartas de crédito e planejamento estratégico para nossos clientes. Foco total em ajudar você a conquistar seu patrimônio!",
    hashtags: "#bastidores #bastidorescrm #consultoria #vendas"
  },
  {
    dia: 8,
    tema: "Moto nova sem entrada",
    formato: "Reels",
    legenda: "Sair de moto nova sem dar nenhuma entrada e sem pagar juros abusivos é possível! O consórcio de moto é a forma mais barata de planejar sua conquista. Assista ao vídeo e veja como iniciar!",
    hashtags: "#moto #duasrodas #motociclista #consorciodemoto"
  },
  {
    dia: 9,
    tema: "Financiamento x Consórcio",
    formato: "Carrossel",
    legenda: "Colocamos na ponta do lápis: Financiamento vs. Consórcio. A diferença no valor final vai te surpreender! Arrasta para o lado e veja por que quem faz contas escolhe o consórcio.",
    hashtags: "#comparativo #consorcio #financiamento #juros #economia"
  },
  {
    dia: 10,
    tema: "Como usar FGTS no consórcio imobiliário",
    formato: "Vídeo",
    legenda: "Você sabia que pode utilizar o saldo do seu FGTS para dar lance ou amortizar parcelas no seu consórcio imobiliário? Essa é uma das melhores formas de acelerar a conquista da sua casa própria. Assista ao vídeo para saber mais!",
    hashtags: "#fgts #imoveis #casapropria #consorcioimobiliario"
  },
  {
    dia: 11,
    tema: "O poder do planejamento",
    formato: "Story",
    legenda: "Pequenas escolhas hoje geram grandes conquistas amanhã. O planejamento financeiro com consórcio é a chave para multiplicar seu patrimônio de forma segura e consistente. Comece hoje!",
    hashtags: "#planejamento #sucesso #metas #disciplina"
  },
  {
    dia: 12,
    tema: "Dia dos Namorados: Construindo sonhos juntos",
    formato: "Reels",
    legenda: "Neste Dia dos Namorados, que tal planejar o futuro a dois? Conquistar a casa própria ou o primeiro carro juntos é o melhor presente que vocês podem se dar. Comecem a planejar o amanhã hoje mesmo!",
    hashtags: "#diadosnamorados #amor #futuroadois #casal #consorcio"
  },
  {
    dia: 13,
    tema: "Simulação de imóvel",
    formato: "Post",
    legenda: "Quanto custa planejar um imóvel de R$300 mil? Parcelas que cabem no seu bolso e sem taxa de juros. Peça agora mesmo uma simulação personalizada pelo WhatsApp e dê o primeiro passo para sair do aluguel!",
    hashtags: "#imovel #casapropria #apartamento #simulacao"
  },
  {
    dia: 14,
    tema: "Festa Junina + patrimônio",
    formato: "Story",
    legenda: "No clima das festas juninas, que tal dar um 'pula fogueira' nos juros altos? O consórcio é o caminho mais doce e seguro para construir o seu patrimônio. Peça sua simulação junina!",
    hashtags: "#festajunina #patrimonio #economia #semjuros"
  },
  {
    dia: 15,
    tema: "Quanto custa uma moto de R$30 mil?",
    formato: "Post",
    legenda: "Uma moto de R$30 mil no consórcio tem parcelas extremamente acessíveis e taxa zero de juros. Excelente para trabalhar ou passear com economia. Simule agora clicando no link!",
    hashtags: "#moto #duasrodas #motocicleta #simulacao"
  },
  {
    dia: 16,
    tema: "Cliente contemplado",
    formato: "Story",
    legenda: "Olha a alegria de quem acabou de ser contemplado no consórcio imobiliário! Mais um cliente que acreditou no planejamento e agora vai escolher a casa dos sonhos. Parabéns!",
    hashtags: "#contemplado #casapropria #consorcioimobiliario #sucesso"
  },
  {
    dia: 17,
    tema: "5 vantagens do consórcio",
    formato: "Carrossel",
    legenda: "Ainda tem dúvidas se o consórcio vale a pena? Listamos as 5 principais vantagens que fazem dele a melhor opção para construir patrimônio com inteligência. Confira no carrossel!",
    hashtags: "#vantagens #consorcio #educacaofinanceira #economia #investir"
  },
  {
    dia: 18,
    tema: "Reforma da casa com consórcio",
    formato: "Reels",
    legenda: "Sabia que você pode usar o consórcio de imóveis para reformar ou ampliar a sua casa atual? Sem juros altos de empréstimos, você planeja a compra de materiais e mão de obra. Assista e veja como!",
    hashtags: "#reforma #obra #decoracao #casa #consorcioimobiliario"
  },
  {
    dia: 19,
    tema: "O erro de esperar sobrar dinheiro",
    formato: "Vídeo",
    legenda: "Esperar sobrar dinheiro para começar a investir é o maior erro financeiro. O dinheiro nunca sobra se você não se pagar primeiro! O consórcio funciona como uma 'poupança forçada' inteligente. Assista!",
    hashtags: "#educacaofinanceira #poupança #investimento #dinheiro"
  },
  {
    dia: 20,
    tema: "Consórcio para investidores",
    formato: "Carrossel",
    legenda: "Muitos investidores usam o consórcio como alavancagem de patrimônio e geração de renda passiva (como aluguel). Quer entender essa estratégia avançada? Confira o passo a passo!",
    hashtags: "#investidores #alavancagem #patrimonio #rendapassiva"
  },
  {
    dia: 21,
    tema: "Resultado da semana",
    formato: "Story",
    legenda: "Semana incrível encerrada com chave de ouro! Muitas simulações feitas, novos clientes iniciando a jornada e cartas de crédito prontas para uso. Obrigado pela confiança!",
    hashtags: "#resultados #sucesso #gratidao #trabalho"
  },
  {
    dia: 22,
    tema: "Carro ou imóvel: qual comprar primeiro?",
    formato: "Vídeo",
    legenda: "Dilema comum: comprar um carro ou um imóvel primeiro? Analisamos os prós e contras de cada escolha sob a ótica financeira e de qualidade de vida. Assista ao vídeo e tire suas conclusões!",
    hashtags: "#carroouimovel #decisao #investimento #planejamentofinanceiro"
  },
  {
    dia: 23,
    tema: "Perguntas frequentes",
    formato: "Story",
    legenda: "Respondendo as principais dúvidas sobre consórcios: Como funciona o lance? E as taxas? Quanto tempo demora? Mande sua dúvida na caixinha que eu respondo!",
    hashtags: "#duvidas #perguntaserespostas #consorcio #faq"
  },
  {
    dia: 24,
    tema: "Consórcio como investimento",
    formato: "Carrossel",
    legenda: "Consórcio também é investimento de médio e longo prazo. Excelente rentabilidade, segurança do sistema regulado pelo Banco Central e poder de compra garantido por reajustes. Veja os números!",
    hashtags: "#investimento #educacaofinanceira #patrimonio #seguranca"
  },
  {
    dia: 25,
    tema: "Como antecipar contemplação",
    formato: "Vídeo",
    legenda: "Quer ser contemplado mais rápido? Existem estratégias comprovadas para acelerar esse processo, como lances sazonais, lance embutido e análise estatística de grupos. Assista e aprenda!",
    hashtags: "#contemplacao #lancedeconsorcio #dicas #estratega"
  },
  {
    dia: 26,
    tema: "Simulação ao vivo",
    formato: "Story",
    legenda: "Vou fazer algumas simulações ao vivo hoje à tarde! Quer ver o valor das parcelas para o seu carro ou imóvel dos sonhos? Responda este story com o valor que precisa!",
    hashtags: "#simulacaoaovivo #interativo #consorcio"
  },
  {
    dia: 27,
    tema: "Histórias de sucesso",
    formato: "Reels",
    legenda: "De um sonho distante à chave na mão. Conheça a história inspiradora do nosso cliente que usou o consórcio de forma estratégica e hoje conquistou sua sede própria. Planeje e conquiste também!",
    hashtags: "#sucesso #inspiracao #conquista #empreendedorismo"
  },
  {
    dia: 28,
    tema: "Motivação e metas",
    formato: "Story",
    legenda: "Domingo é o dia perfeito para revisar suas metas e planejar os passos da semana que está começando. Onde você quer estar daqui a 5 anos? O planejamento começa hoje!",
    hashtags: "#motivacao #metas #planejamento #foco"
  },
  {
    dia: 29,
    tema: "Última semana do mês",
    formato: "Vídeo",
    legenda: "Chegamos na última semana do mês! Ainda dá tempo de fechar Junho com chave de ouro e tirar aquele planejamento do papel. Não empurre seus sonhos para o próximo mês!",
    hashtags: "#foco #retafinal #metas #realizacao"
  },
  {
    dia: 30,
    tema: "Fechamento de junho + metas julho",
    formato: "Reels",
    legenda: "Junho foi incrível, mas Julho será ainda melhor! Fechamos o mês com dezenas de sonhos iniciados e contemplações realizadas. Quais são os seus objetivos para o próximo mês?",
    hashtags: "#fechamento #metas #julho #novomês #consorcio"
  }
];

const getFormatBadge = (formato: string) => {
  switch (formato) {
    case 'Vídeo': return <Badge className="bg-red-50 text-red-700 border-red-200 border uppercase text-[9px] font-black tracking-wider">Video</Badge>;
    case 'Reels': return <Badge className="bg-pink-50 text-pink-700 border-pink-200 border uppercase text-[9px] font-black tracking-wider">Reels</Badge>;
    case 'Carrossel': return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 border uppercase text-[9px] font-black tracking-wider">Carrossel</Badge>;
    case 'Post': return <Badge className="bg-blue-50 text-blue-700 border-blue-200 border uppercase text-[9px] font-black tracking-wider">Post</Badge>;
    case 'Story': return <Badge className="bg-amber-50 text-amber-700 border-amber-200 border uppercase text-[9px] font-black tracking-wider">Story</Badge>;
    default: return <Badge className="uppercase text-[9px] font-black tracking-wider border">{formato}</Badge>;
  }
};

export default function Agendamentos() {
  const { profile } = useAuth();
  const [agendas, setAgendas] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [leadsWithBirthday, setLeadsWithBirthday] = useState<Lead[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // States para Redes Sociais
  const [showSocialMedia, setShowSocialMedia] = useState<boolean>(() => {
    const val = localStorage.getItem("crm_show_social_media");
    return val !== "false"; // default true
  });
  const [socialProgress, setSocialProgress] = useState<Record<number, boolean>>(() => {
    const val = localStorage.getItem("crm_social_progress");
    return val ? JSON.parse(val) : {};
  });
  const [storiesProgress, setStoriesProgress] = useState<Record<string, boolean>>(() => {
    const val = localStorage.getItem("crm_stories_progress");
    return val ? JSON.parse(val) : {};
  });
  const [selectedSocialPost, setSelectedSocialPost] = useState<SocialPost | null>(null);
  const [isViewPostDialogOpen, setIsViewPostDialogOpen] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // States para novo agendamento
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [newAppt, setNewAppt] = useState({
    titulo: "",
    data: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    descricao: "",
    lead_id: "none",
    tipo: "reuniao"
  });
  const [allLeadsList, setAllLeadsList] = useState<Lead[]>([]);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{
    id: string;
    type: 'appointment' | 'lead';
    date: string;
    titulo?: string;
  } | null>(null);

  const fetchAgendas = async () => {
    const { data: leadsData } = await supabase
      .from("leads")
      .select("*")
      .order("data_vencimento", { ascending: true });

    const allLeads = (leadsData as any[]) ?? [];
    setAllLeadsList(allLeads);

    const filteredAgendas = allLeads.filter(a =>
      a.data_vencimento &&
      !["fechado", "perdido", "morto", "aguardando_pagamento"].includes(a.status?.toLowerCase() || "")
    );

    const { data: apptsData } = await supabase
      .from("agendamentos")
      .select("*, lead:leads(*)")
      .order("data_agendada", { ascending: true });

    setAppointments((apptsData as any[]) ?? []);

    const birthdayLeads = allLeads.filter(l => {
      const birth = getLeadBirthdayStr(l);
      return birth && parseBirthday(birth) !== null;
    }).sort((a, b) => {
      const birthA = getLeadBirthdayStr(a);
      const birthB = getLeadBirthdayStr(b);
      const dateA = parseBirthday(birthA)!;
      const dateB = parseBirthday(birthB)!;
      if (dateA.getMonth() !== dateB.getMonth()) return dateA.getMonth() - dateB.getMonth();
      return dateA.getDate() - dateB.getDate();
    });

    setAgendas(filteredAgendas);
    setLeadsWithBirthday(birthdayLeads);
    setLoading(false);
  };

  useEffect(() => { fetchAgendas(); }, []);

  const filteredAgendas = agendas.filter(a =>
    (a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.cidade && a.cidade.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredBirthdays = leadsWithBirthday.filter(a =>
    a.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const agendamentosHoje = agendas.filter(a => isToday(parseISO(a.data_vencimento!))).length;
  const aniversariantesHoje = leadsWithBirthday.filter(l => {
    const birth = getLeadBirthdayStr(l);
    return isBirthdayToday(birth);
  }).length;
  const agendamentosAtrasados = agendas.filter(a => {
    const d = parseISO(a.data_vencimento!);
    return isPast(d) && !isToday(d);
  }).length;

  const openWhatsApp = (lead: Lead, isBirthday = false) => {
    const phone = lead.celular ? lead.celular.replace(/\D/g, "") : "";
    let message = "";
    if (isBirthday) {
      message = `Olá ${formatToUpper(lead.nome)}! %0A%0AEm nome d'O Especialista Consórcio, gostaria de lhe desejar um feliz aniversário! Que seu dia seja repleto de alegrias e realizações. Parabéns! 🎉🥳`;
    }
    window.open(`https://wa.me/55${phone}${message ? `?text=${message}` : ""}`, "_blank");
  };

  const handleAddAppointment = async () => {
    if (!newAppt.titulo || !newAppt.data) {
      toast({ title: "Erro", description: "Preencha o título e a data.", variant: "destructive" });
      return;
    }
    const leadIdValue = newAppt.lead_id === "none" || !newAppt.lead_id ? null : newAppt.lead_id;
    const { error } = await supabase.from("agendamentos").insert({
      titulo: newAppt.titulo,
      data_agendada: newAppt.data,
      descricao: newAppt.descricao,
      lead_id: leadIdValue as any,
      tipo: newAppt.tipo,
      criado_por: profile?.id,
      status: "pendente"
    });
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Agendamento salvo!", description: "Seu compromisso foi registrado com sucesso." });
      setIsAddingAppointment(false);
      setNewAppt({ titulo: "", data: format(new Date(), "yyyy-MM-dd'T'HH:mm"), descricao: "", lead_id: "none", tipo: "reuniao" });
      fetchAgendas();
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;
    const { error } = await supabase.from("agendamentos").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Excluído!", description: "Agendamento removido da sua lista." });
      fetchAgendas();
    }
  };

  const handleDeleteLeadSchedule = async (id: string) => {
    if (!confirm("Remover este retorno da sua agenda? (Isso não exclui o cliente)")) return;
    const { error } = await supabase.from("leads").update({ data_vencimento: null }).eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removido!", description: "O retorno foi retirado da sua agenda." });
      fetchAgendas();
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleData) return;
    const { id, type, date } = rescheduleData;
    let error;
    if (type === 'appointment') {
      const { error: err } = await supabase.from("agendamentos").update({ data_agendada: date, titulo: rescheduleData.titulo }).eq("id", id);
      error = err;
    } else {
      const { error: err } = await supabase.from("leads").update({ data_vencimento: date }).eq("id", id);
      error = err;
    }
    if (error) {
      toast({ title: "Erro ao transferir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Transferido!", description: "A nova data foi salva com sucesso." });
      setIsRescheduling(false);
      fetchAgendas();
    }
  };

  const toggleShowSocialMedia = (val: boolean) => {
    setShowSocialMedia(val);
    localStorage.setItem("crm_show_social_media", String(val));
  };

  const togglePostStatus = (dia: number) => {
    const updated = { ...socialProgress, [dia]: !socialProgress[dia] };
    setSocialProgress(updated);
    localStorage.setItem("crm_social_progress", JSON.stringify(updated));
    toast({
      title: updated[dia] ? "Postado! 🎉" : "Marcado como Pendente",
      description: `O post do dia ${dia} foi atualizado.`
    });
  };

  const toggleStoryStatus = (key: string) => {
    const updated = { ...storiesProgress, [key]: !storiesProgress[key] };
    setStoriesProgress(updated);
    localStorage.setItem("crm_stories_progress", JSON.stringify(updated));
  };

  const resetStoriesChecklist = () => {
    setStoriesProgress({});
    localStorage.removeItem("crm_stories_progress");
    toast({ title: "Checklist resetado", description: "Todos os stories diários voltaram para pendente." });
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    toast({ title: "Copiado!", description: "O texto foi copiado para a área de transferência." });
    setTimeout(() => {
      setCopiedTextId(null);
    }, 2000);
  };

  const importSocialPostToCRM = async (post: SocialPost) => {
    const dateStr = `2026-06-${String(post.dia).padStart(2, "0")}T09:00`;
    const { error } = await supabase.from("agendamentos").insert({
      titulo: `[Post Social] ${post.formato}: ${post.tema}`,
      data_agendada: dateStr,
      descricao: `Legenda:\n${post.legenda}\n\nHashtags:\n${post.hashtags}`,
      lead_id: null,
      tipo: "outro",
      criado_por: profile?.id,
      status: "pendente"
    });
    if (error) {
      toast({ title: "Erro ao importar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Importado!", description: "Este post de rede social foi adicionado como compromisso oficial no banco de dados." });
      fetchAgendas();
    }
  };

  const getSocialPostForDay = (day: Date) => {
    if (day.getMonth() === 5 && day.getFullYear() === 2026) {
      const dateNum = day.getDate();
      return postsRedesSociais.find(p => p.dia === dateNum);
    }
    return null;
  };

  // Calendário Grid Helpers
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => {
    const appts = appointments.filter(a => isSameDay(parseISO(a.data_agendada), day));
    const leads = agendas.filter(l => isSameDay(parseISO(l.data_vencimento!), day));
    const births = leadsWithBirthday.filter(l => {
      const birth = getLeadBirthdayStr(l);
      const b = parseBirthday(birth);
      return b && b.getDate() === day.getDate() && b.getMonth() === day.getMonth();
    });
    return { appts, leads, births };
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative group/main-scroll overflow-hidden">
      <div
        id="agendamentos-main-container"
        className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar p-1"
      >
        {/* Header Row */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-slate-900">Sua Agenda</h1>
          <Dialog open={isAddingAppointment} onOpenChange={setIsAddingAppointment}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-1 h-8 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                title="Novo Agendamento"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                <Plus className="h-3 w-3" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white rounded-3xl border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">Registrar Compromisso</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Título do Compromisso</Label>
                  <Input
                    placeholder="Ex: Reunião de Fechamento"
                    value={newAppt.titulo}
                    onChange={e => setNewAppt({...newAppt, titulo: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Data e Hora</Label>
                    <Input
                      type="datetime-local"
                      value={newAppt.data}
                      onChange={e => setNewAppt({...newAppt, data: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Tipo</Label>
                    <Select value={newAppt.tipo} onValueChange={v => setNewAppt({...newAppt, tipo: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="visita">Visita</SelectItem>
                        <SelectItem value="banco">Banco</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Vincular a um Cliente</Label>
                  <Select value={newAppt.lead_id} onValueChange={v => setNewAppt({...newAppt, lead_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione um cliente (opcional)..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem vínculo (Evento Geral)</SelectItem>
                      {allLeadsList.map(l => (
                        <SelectItem key={l.id} value={l.id}>{formatToUpper(l.nome)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Observações</Label>
                  <Textarea
                    placeholder="Detalhes importantes..."
                    value={newAppt.descricao}
                    onChange={e => setNewAppt({...newAppt, descricao: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingAppointment(false)}>Cancelar</Button>
                <Button onClick={handleAddAppointment} className="bg-slate-900 text-white">Salvar na Agenda</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Aniversariantes do Dia Alert Banner */}
        {(() => {
          const birthdayPeopleToday = leadsWithBirthday.filter(l => {
            const birth = getLeadBirthdayStr(l);
            return isBirthdayToday(birth);
          });
          if (birthdayPeopleToday.length === 0) return null;

          return (
            <div className="relative group overflow-hidden p-4 rounded-[24px] bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.01] animate-in slide-in-from-top duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-2xl animate-bounce">
                    <PartyPopper className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg tracking-tight uppercase">Hoje tem Aniversariante! 🥳</h3>
                    <p className="text-xs text-white/95 font-medium leading-relaxed mt-0.5">
                      {birthdayPeopleToday.length === 1 ? (
                        <>O cliente <strong>{formatToUpper(birthdayPeopleToday[0].nome)}</strong> está fazendo aniversário hoje! Envie uma mensagem de felicitações.</>
                      ) : (
                        <>Hoje é o aniversário de {birthdayPeopleToday.length} clientes: <strong>{birthdayPeopleToday.map(l => formatToUpper(l.nome)).join(", ")}</strong>! Envie as felicitações.</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {birthdayPeopleToday.slice(0, 3).map(l => (
                    <Button
                      key={`btn-alert-${l.id}`}
                      size="sm"
                      className="bg-white text-orange-600 hover:bg-slate-50 font-black uppercase text-[10px] tracking-wider rounded-xl gap-1.5 shadow-md h-9"
                      onClick={() => openWhatsApp(l, true)}
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" /> Parabéns {formatToUpper(l.nome.split(" ")[0])}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Hero Card - padronizado */}
        <AdminHeroCard
          title="Agendamentos"
          subtitle="Calendário & Compromissos"
          icon={CalendarDays}
          bgIcon={CalendarDays}
          accentColor="primary"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Organização <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">Total</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                Centralize retornos de leads, agendamentos importantes e aniversários em uma visão mensal completa.
              </p>
            </div>

            {/* Metric Cards - cores vivas como outros painéis */}
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-violet-500/20 text-white min-w-[88px]">
                <div className="absolute top-1 right-1 opacity-20">
                  <CalendarDays className="h-8 w-8" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-wider opacity-80">Agendados</p>
                <p className="text-2xl font-black mt-0.5">{agendas.length + appointments.length}</p>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-2xl shadow-lg shadow-amber-400/20 text-white min-w-[88px]">
                <div className="absolute top-1 right-1 opacity-20">
                  <Gift className="h-8 w-8" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-wider opacity-80">Aniversários</p>
                <p className="text-2xl font-black mt-0.5">{leadsWithBirthday.length}</p>
              </div>
              <div className={cn(
                "relative overflow-hidden p-3 rounded-2xl shadow-lg text-white min-w-[88px]",
                agendamentosAtrasados > 0
                  ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20"
                  : "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/20"
              )}>
                <div className="absolute top-1 right-1 opacity-20">
                  <Bell className="h-8 w-8" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-wider opacity-80">Atrasados</p>
                <p className="text-2xl font-black mt-0.5">{agendamentosAtrasados}</p>
              </div>
            </div>
          </div>
        </AdminHeroCard>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou cidade..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="calendario" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="calendario" className="gap-2">
              <CalendarIcon className="h-4 w-4" /> Calendário Mensal
            </TabsTrigger>
            <TabsTrigger value="agendamentos" className="gap-2">
              <ListFilter className="h-4 w-4" /> Lista de Compromissos
            </TabsTrigger>
            <TabsTrigger value="aniversarios" className="gap-2">
              <Gift className="h-4 w-4" /> Aniversários (Todos)
            </TabsTrigger>
            <TabsTrigger value="redes-sociais" className="gap-2">
              <Instagram className="h-4 w-4" /> Redes Sociais
            </TabsTrigger>
          </TabsList>

          {/* ── CALENDÁRIO ── */}
          <TabsContent value="calendario" className="animate-in fade-in zoom-in-95 duration-500">
            <Card className="rounded-[32px] overflow-hidden border-slate-100 shadow-xl">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between p-5 gap-4">
                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 shadow-inner">
                    <input
                      type="checkbox"
                      id="toggle-social-posts"
                      checked={showSocialMedia}
                      onChange={(e) => toggleShowSocialMedia(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-pink-600 focus:ring-pink-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="toggle-social-posts" className="text-[10px] font-black uppercase text-slate-600 tracking-wider cursor-pointer select-none">
                      Ver Redes Sociais
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())} className="text-[10px] font-black uppercase">Hoje</Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Days of week header */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"].map(d => (
                    <div key={d} className="py-2.5 text-center text-[10px] font-black text-slate-400 tracking-widest bg-slate-50/30">
                      {d}
                    </div>
                  ))}
                </div>
                {/* Calendar grid - altura fixa para evitar overflow no PC */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, i) => {
                    const { appts, leads, births } = getEventsForDay(day);
                    const isTodayDay = isToday(day);
                    const isThisMonth = isSameMonth(day, currentDate);

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "min-h-[100px] p-2 border-r border-b border-slate-50 transition-colors hover:bg-slate-50/50 relative flex flex-col justify-between",
                          !isThisMonth && "bg-slate-50/20 opacity-40",
                          (i + 1) % 7 === 0 && "border-r-0"
                        )}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className={cn(
                              "text-xs font-black p-1 rounded-lg w-7 h-7 flex items-center justify-center",
                              isTodayDay ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "text-slate-400"
                            )}>
                              {format(day, "d")}
                            </span>
                            {births.length > 0 && <PartyPopper className="h-3 w-3 text-amber-500" />}
                          </div>

                          <div className="space-y-0.5 mt-1">
                            {appts.map(a => (
                              <div key={a.id} className="text-[9px] px-1 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100 truncate font-bold uppercase tracking-tight">
                                📌 {a.titulo}
                              </div>
                            ))}
                            {leads.map(l => (
                              <div key={l.id} className="text-[9px] px-1 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 truncate font-bold uppercase tracking-tight">
                                👤 {l.nome}
                              </div>
                            ))}
                            {births.map(b => (
                              <div key={`cal-birth-${b.id}`} className="text-[9px] px-1 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100 truncate font-bold uppercase tracking-tight">
                                🎂 {b.nome}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Social media post rendering */}
                        {showSocialMedia && (() => {
                          const post = getSocialPostForDay(day);
                          if (!post) return null;
                          const isDone = socialProgress[post.dia] || false;
                          return (
                            <div
                              key={`cal-social-${post.dia}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSocialPost(post);
                                setIsViewPostDialogOpen(true);
                              }}
                              className={cn(
                                "text-[9.5px] px-1.5 py-1 mt-1.5 rounded-lg border font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 select-none",
                                isDone
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 line-through opacity-60 hover:opacity-90"
                                  : "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border-pink-100 hover:from-pink-100 hover:to-rose-100 hover:scale-[1.03] shadow-sm"
                              )}
                              title={`${post.formato}: ${post.tema}`}
                            >
                              <Instagram className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{post.formato}: {post.tema}</span>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── LISTA DE COMPROMISSOS ── */}
          <TabsContent value="agendamentos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.map(appt => (
                <Card key={appt.id} className="overflow-hidden border-t-4 border-t-purple-500 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">{format(parseISO(appt.data_agendada), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                          <Badge variant="secondary" className="text-[8px] font-black uppercase text-purple-700 bg-purple-100">{appt.tipo || "Compromisso"}</Badge>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg truncate leading-tight uppercase tracking-tighter">{appt.titulo}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium mb-3">CLIENTE: {formatToUpper(appt.lead?.nome || "Vínculo Direto")}</p>
                    {appt.descricao && <p className="text-xs text-slate-500 line-clamp-2 italic mb-4">"{appt.descricao}"</p>}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => appt.lead ? openWhatsApp(appt.lead) : null}
                      >
                        <WhatsAppIcon className="h-4 w-4" /> Contato
                      </Button>
                      <Button
                        variant="outline" size="icon"
                        className="h-9 w-9 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200"
                        onClick={() => {
                          setRescheduleData({ id: appt.id, type: 'appointment', date: format(parseISO(appt.data_agendada), "yyyy-MM-dd'T'HH:mm"), titulo: appt.titulo });
                          setIsRescheduling(true);
                        }}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline" size="icon"
                        className="h-9 w-9 text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200"
                        onClick={() => handleDeleteAppointment(appt.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredAgendas.map((lead) => {
                const date = parseISO(lead.data_vencimento!);
                const isAtrasado = isPast(date) && !isToday(date);
                const hoje = isToday(date);
                return (
                  <Card key={lead.id} className={`overflow-hidden border-t-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${isAtrasado ? "border-t-red-500" : hoje ? "border-t-amber-500" : "border-t-primary"}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${isAtrasado ? "bg-red-50 text-red-600" : hoje ? "bg-amber-50 text-amber-600" : "bg-primary/10 text-primary"}`}>
                            <CalendarDays className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground">{format(date, "dd 'de' MMMM", { locale: ptBR })}</p>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">
                              {isAtrasado ? "⚠️ Atrasado" : hoje ? "🔔 Vence Hoje" : "📅 Programado"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase truncate max-w-[100px]">
                          {lead.status?.replace(/_/g, " ") ?? "Lead"}
                        </Badge>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg truncate leading-tight flex-1">{formatToUpper(lead.nome)}</h3>
                          {(() => {
                            const bStr = getLeadBirthdayStr(lead);
                            if (!bStr) return null;
                            const isHoje = isBirthdayToday(bStr);
                            return (
                              <span className={`flex items-center gap-1 text-[9px] font-black uppercase rounded-full px-2 py-0.5 shrink-0 ${
                                isHoje
                                  ? "bg-amber-100 text-amber-700 border border-amber-300 animate-pulse"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}>
                                <Gift className="h-2.5 w-2.5" />
                                {isHoje ? "Hoje!" : (() => { const b = parseBirthday(bStr); return b ? format(b, "dd/MM") : ""})()}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lead.cidade || "N/Inf"}</span>
                          <span className="flex items-center gap-1 text-primary font-bold"><DollarSign className="h-3 w-3" /> {formatLeadValue(Number(lead.valor_credito))}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline" size="sm"
                          className="flex-1 gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                          onClick={() => openWhatsApp(lead)}
                        >
                          <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                        </Button>
                        <Button
                          variant="outline" size="icon"
                          className="h-9 w-9 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200"
                          onClick={() => {
                            setRescheduleData({ id: lead.id, type: 'lead', date: format(parseISO(lead.data_vencimento!), "yyyy-MM-dd'T'HH:mm") });
                            setIsRescheduling(true);
                          }}
                          title="Remarcar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline" size="icon"
                          className="h-9 w-9 text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200"
                          onClick={() => handleDeleteLeadSchedule(lead.id)}
                          title="Remover da Agenda"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredAgendas.length === 0 && appointments.length === 0 && (
                <div className="col-span-full py-20 text-center bg-card rounded-xl border-2 border-dashed border-border opacity-50">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhum agendamento encontrado.</p>
                  <p className="text-sm">Tudo em dia por aqui!</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── ANIVERSÁRIOS ── */}
          <TabsContent value="aniversarios" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBirthdays.map((lead) => {
                const birthStr = getLeadBirthdayStr(lead);
                const birthDate = parseBirthday(birthStr);
                const hoje = isBirthdayToday(birthStr);
                return (
                  <Card key={`birth-${lead.id}`} className={`overflow-hidden border-t-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${hoje ? "border-t-amber-500" : "border-t-blue-400"}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${hoje ? "bg-amber-100 text-amber-600 shadow-sm" : "bg-blue-50 text-blue-600"}`}>
                            <Gift className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground">
                              {birthDate ? format(birthDate, "dd 'de' MMMM", { locale: ptBR }) : "--"}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">
                              {hoje ? "🥳 É HOJE!" : "🎂 Aniversariantes"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase">
                          {hoje ? "Parabéns!" : "Próximo"}
                        </Badge>
                      </div>
                      <div className="space-y-1 mb-4">
                        <h3 className="font-bold text-lg truncate leading-tight">{formatToUpper(lead.nome)}</h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          {birthDate ? `${new Date().getFullYear() - birthDate.getFullYear()} anos` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default" size="sm"
                          className={`flex-1 gap-2 ${hoje ? "bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20" : ""}`}
                          onClick={() => openWhatsApp(lead, true)}
                        >
                          <WhatsAppIcon className="h-4 w-4" /> Enviar Parabéns
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredBirthdays.length === 0 && (
                <div className="col-span-full py-20 text-center bg-card rounded-xl border-2 border-dashed border-border opacity-50">
                  <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhum aniversariante este mês.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── REDES SOCIAIS ── */}
          <TabsContent value="redes-sociais" className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Resumo de Metas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-slate-100 shadow-sm bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-pink-100">Total de Posts (Junho)</p>
                    <p className="text-3xl font-black mt-1">30</p>
                  </div>
                  <Instagram className="h-10 w-10 opacity-30" />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-100 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Publicados</p>
                    <p className="text-3xl font-black mt-1">
                      {Object.values(socialProgress).filter(Boolean).length} / 30
                    </p>
                  </div>
                  <CheckSquare className="h-10 w-10 opacity-30" />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-100 shadow-sm bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-100">Stories Concluídos (Hoje)</p>
                    <p className="text-3xl font-black mt-1">
                      {["stories-manha", "stories-financeira", "stories-credito", "stories-perguntas"].filter(k => storiesProgress[k]).length} / 4
                    </p>
                  </div>
                  <Sparkles className="h-10 w-10 opacity-30" />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-100 shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-100">Progresso do Mês</p>
                    <p className="text-3xl font-black mt-1">
                      {Math.round((Object.values(socialProgress).filter(Boolean).length / 30) * 100)}%
                    </p>
                  </div>
                  <Zap className="h-10 w-10 opacity-30" />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna da Esquerda: Lista de Posts do Calendário */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="rounded-[32px] overflow-hidden border-slate-100 shadow-xl">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                        <Instagram className="h-5 w-5 text-pink-500" /> Cronograma de Conteúdo
                      </CardTitle>
                      <p className="text-xs text-slate-500 font-medium mt-1">Atividades recomendadas dia a dia para Junho de 2026</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 divide-y divide-slate-100">
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                      {postsRedesSociais.map(post => {
                        const isDone = socialProgress[post.dia] || false;
                        return (
                          <div
                            key={`list-post-${post.dia}`}
                            className={cn(
                              "p-4 flex items-start gap-4 transition-colors hover:bg-slate-50/50",
                              isDone && "bg-emerald-50/20"
                            )}
                          >
                            <div className="pt-0.5">
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => togglePostStatus(post.dia)}
                                className="h-4.5 w-4.5 rounded text-pink-600 focus:ring-pink-500 border-slate-300 cursor-pointer"
                                title="Marcar como publicado"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs font-black text-slate-400">DIA {String(post.dia).padStart(2, "0")}</span>
                                {getFormatBadge(post.formato)}
                              </div>
                              <h4 className={cn(
                                "font-black text-sm uppercase tracking-tight text-slate-800",
                                isDone && "line-through text-slate-400"
                              )}>
                                {post.tema}
                              </h4>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1 italic">
                                "{post.legenda}"
                              </p>
                            </div>

                            <div className="flex gap-1.5 self-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 rounded-lg border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider shrink-0 gap-1"
                                onClick={() => {
                                  setSelectedSocialPost(post);
                                  setIsViewPostDialogOpen(true);
                                }}
                              >
                                <FileText className="h-3 w-3" /> Detalhes
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-slate-200 text-slate-500 hover:text-pink-600 shrink-0"
                                onClick={() => handleCopyText(`${post.legenda}\n\n${post.hashtags}`, `post-${post.dia}`)}
                                title="Copiar Legenda"
                              >
                                {copiedTextId === `post-${post.dia}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna da Direita: Stories, Reels Script & Campanhas Especiais */}
              <div className="space-y-6">
                {/* 1. Checklist Stories Diários */}
                <Card className="rounded-[24px] border-slate-100 shadow-lg overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-500" /> Stories Diários (Funil)
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600" onClick={resetStoriesChecklist} title="Resetar Checklist">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {[
                      { key: "stories-manha", label: "☕ Manhã", desc: "Bom dia + reflexão pessoal/profissional" },
                      { key: "stories-financeira", label: "📊 Meio-dia", desc: "Dica financeira rápida sobre juros ou planejamento" },
                      { key: "stories-credito", label: "🚗 Tarde", desc: "Crédito disponível do dia (ex: Veículo R$100k)" },
                      { key: "stories-perguntas", label: "❓ Noite", desc: "Caixa de perguntas nos stories" }
                    ].map(st => (
                      <div
                        key={st.key}
                        onClick={() => toggleStoryStatus(st.key)}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none",
                          storiesProgress[st.key]
                            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                            : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100/55"
                        )}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <span className="font-black text-xs uppercase tracking-tight block">{st.label}</span>
                          <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5">{st.desc}</span>
                        </div>
                        <div>
                          <input
                            type="checkbox"
                            checked={storiesProgress[st.key] || false}
                            onChange={() => {}} // handled by div click
                            className="h-4 w-4 rounded text-emerald-600 border-slate-300 pointer-events-none"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 2. Roteiro Especial Reels (Consórcio é Sorte) */}
                <Card className="rounded-[24px] border-slate-100 shadow-lg overflow-hidden bg-gradient-to-b from-indigo-900 to-slate-950 text-white">
                  <CardHeader className="border-b border-white/10 p-4">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-400" /> Roteiro Reels: Consórcio é Sorte
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 mt-0.5">Roteiro otimizado para vídeos curtos de 30-45s</p>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5">
                    <div>
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">1. Gancho de Entrada (0-5s)</span>
                      <p className="text-xs text-white/95 leading-relaxed mt-0.5">
                        "Você ainda acha que consórcio é sorte? Se pensa assim, está deixando muito dinheiro na mesa..."
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">2. Conteúdo Rápido (5-20s)</span>
                      <p className="text-xs text-white/95 leading-relaxed mt-0.5">
                        "Consórcio não é jogo! Com lances estratégicos (lance embutido e lance fixo) e a escolha do grupo correto, você assume as rédeas da sua contemplação. É pura matemática e planejamento!"
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">3. Chamada de Ação (20-30s)</span>
                      <p className="text-xs text-white/95 leading-relaxed mt-0.5">
                        "Quer parar de depender da sorte e planejar a conquista do seu carro ou imóvel? Digite SIM nos comentários que eu te envio uma simulação gratuita."
                      </p>
                    </div>

                    <Button
                      className="w-full bg-white text-indigo-900 hover:bg-slate-100 font-black uppercase text-[10px] tracking-wider rounded-xl gap-2 shadow-lg h-9"
                      onClick={() => handleCopyText(
                        `Roteiro Reels: Consórcio é Sorte\n\n[GANCHO 0-5s]: "Você ainda acha que consórcio é sorte? Se pensa assim, está deixando muito dinheiro na mesa..."\n\n[CONTEÚDO 5-20s]: "Consórcio não é jogo! Com lances estratégicos (lance embutido e lance fixo) e a escolha do grupo correto, você assume as rédeas da sua contemplação. É pura matemática e planejamento!"\n\n[CTA 20-30s]: "Quer parar de depender da sorte e planejar a conquista do seu carro ou imóvel? Digite SIM nos comentários que eu te envio uma simulação gratuita."`,
                        "roteiro-sorte"
                      )}
                    >
                      {copiedTextId === "roteiro-sorte" ? (
                        <><Check className="h-3.5 w-3.5 text-emerald-600" /> Roteiro Copiado!</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" /> Copiar Roteiro Completo</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* 3. Campanhas Especiais & Ofertas Fixas */}
                <Card className="rounded-[24px] border-slate-100 shadow-lg overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
                    <CardTitle className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      Campanhas Especiais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Semana da Copa */}
                    <div className="space-y-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-700 tracking-wider">
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Semana da Copa
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400">Story/Post de Engajamento</p>
                        <p className="text-xs text-slate-600 italic">"Se você acredita que o Brasil pode ser campeão, por que não acreditar que pode conquistar sua casa própria?"</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-[9px] font-black uppercase text-blue-600 hover:bg-blue-50/50 h-7"
                          onClick={() => handleCopyText(
                            `Se você acredita que o Brasil pode ser campeão, por que não acreditar que pode conquistar sua casa própria? 🏆 Campeões não esperam oportunidade. Eles se preparam para ela! Solicite sua simulação pelo WhatsApp.`,
                            "campanha-copa"
                          )}
                        >
                          {copiedTextId === "campanha-copa" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />} Copiar Legenda Copa
                        </Button>
                      </div>
                    </div>

                    {/* Ofertas Fixas (2x por semana) */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-700 tracking-wider">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Ofertas Fixas (2x por Semana)
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { title: "🚗 Veículo (100k)", cred: "Crédito R$100.000", key: "of-car" },
                          { title: "🏍 Moto (30k)", cred: "Crédito R$30.000", key: "of-moto" },
                          { title: "🏠 Imóvel (300k)", cred: "Crédito R$300.000", key: "of-imo" }
                        ].map(of => (
                          <div key={of.key} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div>
                              <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{of.title}</p>
                              <p className="text-[10px] text-muted-foreground">{of.cred}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md text-slate-500 hover:text-emerald-600"
                              onClick={() => handleCopyText(
                                `🚀 MEGA OPORTUNIDADE!\n\nConquiste o seu objetivo:\n🔑 ${of.title}\n📈 ${of.cred}\n\nSem parcelas abusivas e sem entrada!\n\n👉 Solicite sua simulação pelo WhatsApp agora mesmo.`,
                                of.key
                              )}
                              title="Copiar Oferta"
                            >
                              {copiedTextId === of.key ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog Transferência / Remarcação */}
        <Dialog open={isRescheduling} onOpenChange={setIsRescheduling}>
          <DialogContent className="max-w-md bg-white rounded-3xl border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {rescheduleData?.type === 'appointment' ? 'Editar Agendamento' : 'Transferir Retorno'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {rescheduleData?.type === 'appointment' && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Título</Label>
                  <Input
                    value={rescheduleData.titulo}
                    onChange={e => setRescheduleData({...rescheduleData, titulo: e.target.value})}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Nova Data e Hora</Label>
                <Input
                  type="datetime-local"
                  value={rescheduleData?.date}
                  onChange={e => setRescheduleData(rescheduleData ? {...rescheduleData, date: e.target.value} : null)}
                />
              </div>
              <p className="text-xs text-slate-500 italic">
                Selecione o novo horário para este compromisso na sua agenda.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRescheduling(false)}>Cancelar</Button>
              <Button onClick={handleReschedule} className="bg-indigo-600 text-white hover:bg-indigo-700">Confirmar Transferência</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Detalhes de Post de Rede Social */}
        <Dialog open={isViewPostDialogOpen} onOpenChange={setIsViewPostDialogOpen}>
          <DialogContent className="max-w-md bg-white rounded-3xl border-slate-200">
            {selectedSocialPost && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Dia {String(selectedSocialPost.dia).padStart(2, "0")} de Junho</span>
                    {getFormatBadge(selectedSocialPost.formato)}
                  </div>
                  <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                    {selectedSocialPost.tema}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Legenda */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sugestão de Legenda</Label>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar">
                      {selectedSocialPost.legenda}
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Hashtags Recomendadas</Label>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs text-pink-600 font-bold">
                      {selectedSocialPost.hashtags}
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-slate-700">Status de Publicação</p>
                      <p className="text-[10px] text-muted-foreground">Marque como postado para atualizar o seu progresso.</p>
                    </div>
                    <Button
                      size="sm"
                      className={cn(
                        "font-black uppercase text-[10px] tracking-wider rounded-xl h-8",
                        socialProgress[selectedSocialPost.dia]
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      )}
                      onClick={() => togglePostStatus(selectedSocialPost.dia)}
                    >
                      {socialProgress[selectedSocialPost.dia] ? "Postado! ✓" : "Marcar Postado"}
                    </Button>
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto uppercase text-[10px] font-black tracking-wider rounded-xl gap-1.5 h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => {
                      importSocialPostToCRM(selectedSocialPost);
                      setIsViewPostDialogOpen(false);
                    }}
                  >
                    <Zap className="h-3.5 w-3.5" /> Importar para CRM
                  </Button>
                  <Button
                    className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 uppercase text-[10px] font-black tracking-wider rounded-xl gap-1.5 h-10"
                    onClick={() => handleCopyText(`${selectedSocialPost.legenda}\n\n${selectedSocialPost.hashtags}`, `popup-${selectedSocialPost.dia}`)}
                  >
                    {copiedTextId === `popup-${selectedSocialPost.dia}` ? (
                      <><Check className="h-3.5 w-3.5 text-emerald-600" /> Copiado!</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> Copiar Legenda</>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Vertical Scroll Controls - padrão das outras telas */}
      <div className="hidden lg:flex absolute right-4 bottom-4 flex-col gap-2 opacity-0 group-hover/main-scroll:opacity-100 transition-opacity z-20">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-2xl bg-white/95 border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
          onClick={() => {
            const container = document.getElementById('agendamentos-main-container');
            container?.scrollBy({ top: -400, behavior: 'smooth' });
          }}
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-2xl bg-white/95 border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
          onClick={() => {
            const container = document.getElementById('agendamentos-main-container');
            container?.scrollBy({ top: 400, behavior: 'smooth' });
          }}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
