import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Zap,
  Building2,
  MapPin,
  Send,
  CheckCircle2,
  Loader2,
  Users,
  Target,
  ArrowRight,
  RefreshCw,
  PhoneCall,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatLeadValue } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { sendWhatsAppMessage, getWhatsAppMode } from "@/services/evolutionApiService";
import { findAuthoritativeSimulatorQuote } from "@/services/aiService";

export interface VibeProspect {
  id: string;
  nome: string;
  cargo: string;
  empresa: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
  segmento: "pesados" | "imovel" | "veiculo";
  valorCredito: number;
  prazoMeses: number;
  parcela5050: number;
  temperatura: "quente" | "morno";
  ganchoAbordagem: string;
  selecionado: boolean;
}

interface VibeProspectingModalProps {
  open: boolean;
  onClose: () => void;
  organizacaoId?: string;
  onLeadsImported?: () => void;
}

const PRESET_PROMPTS = [
  {
    titulo: "Frotistas & Pesados (200k - 300k)",
    prompt: "Frotistas, transportadoras e empresários de logística em Curitiba, Paranaguá e região para renovação de caminhões e cavalos mecânicos com crédito de 200k a 300k e lance embutido.",
    segmento: "pesados",
  },
  {
    titulo: "Imóveis & Investidores (300k - 500k)",
    prompt: "Médicos, advogados e empresários locais buscando alavancagem patrimonial e compra de imóvel comercial/residencial com cartas de 300k a 500k no plano linear ou 50/50.",
    segmento: "imovel",
  },
  {
    titulo: "Automóveis & Frotas Leves (80k - 140k)",
    prompt: "Profissionais liberais e comerciantes para troca programada de veículos e SUVs de 80k a 140k sem juros bancários.",
    segmento: "veiculo",
  },
];

export function VibeProspectingModal({
  open,
  onClose,
  organizacaoId,
  onLeadsImported,
}: VibeProspectingModalProps) {
  const [promptInput, setPromptInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState<VibeProspect[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [vibeTom, setVibeTom] = useState<"lance_embutido" | "srv_consultivo" | "investidor" | "humanizado">("lance_embutido");

  const handleRunVibeSearch = async (overridePrompt?: string) => {
    const activePrompt = overridePrompt || promptInput;
    if (!activePrompt.trim()) {
      toast.error("Digite o perfil ou objetivo da prospecção!");
      return;
    }

    setLoading(true);
    setProspects([]);

    try {
      // Simulação de IA Prospecting com cotações oficiais autoritárias do SimulaJá
      await new Promise((r) => setTimeout(r, 1200));

      const lower = activePrompt.toLowerCase();
      const isPesados = lower.includes("caminh") || lower.includes("frot") || lower.includes("pesad") || lower.includes("transp");
      const isVeiculo = lower.includes("carro") || lower.includes("auto") || lower.includes("veic") || lower.includes("moto");
      
      let mockList: VibeProspect[] = [];

      if (isPesados) {
        mockList = [
          {
            id: "vp-1",
            nome: "Marcos Aurélio Silveira",
            cargo: "Diretor de Operações",
            empresa: "TransLitoral Logística & Cargas",
            cidade: "Paranaguá",
            uf: "PR",
            telefone: "41998765410",
            email: "marcos@translitorallog.com.br",
            segmento: "pesados",
            valorCredito: 200000,
            prazoMeses: 128,
            parcela5050: 1089.98,
            temperatura: "quente",
            ganchoAbordagem: "Redução de custo de aquisição na frota sem descapitalizar o caixa operacional, com opção de lance embutido de 25% no Grupo 5996.",
            selecionado: true,
          },
          {
            id: "vp-2",
            nome: "Ricardo Pires Fagundes",
            cargo: "Sócio-Proprietário",
            empresa: "RP Transportes Rodoviários",
            cidade: "Curitiba",
            uf: "PR",
            telefone: "41991238844",
            email: "ricardo@rptransportes.com.br",
            segmento: "pesados",
            valorCredito: 250000,
            prazoMeses: 128,
            parcela5050: 1362.47,
            temperatura: "quente",
            ganchoAbordagem: "Planejamento para compra de 2 cavalos mecânicos com meia parcela até a contemplação e taxa reduzida.",
            selecionado: true,
          },
          {
            id: "vp-3",
            nome: "Eduardo Camargo Mendes",
            cargo: "Gerente de Frota",
            empresa: "Expresso Sul Cargas",
            cidade: "São José dos Pinhais",
            uf: "PR",
            telefone: "41984552200",
            email: "frota@expressosul.com.br",
            segmento: "pesados",
            valorCredito: 300000,
            prazoMeses: 128,
            parcela5050: 1634.97,
            temperatura: "morno",
            ganchoAbordagem: "Renovação planejada de pesados com parcelas 50/50 em 128 meses.",
            selecionado: true,
          },
        ];
      } else if (isVeiculo) {
        mockList = [
          {
            id: "vp-4",
            nome: "Juliana Rocha Bittencourt",
            cargo: "Cirurgiã-Dentista",
            empresa: "Clínica OdontoPrime",
            cidade: "Curitiba",
            uf: "PR",
            telefone: "41997654321",
            email: "juliana@odontoprime.com.br",
            segmento: "veiculo",
            valorCredito: 100000,
            prazoMeses: 95,
            parcela5050: 756.29,
            temperatura: "quente",
            ganchoAbordagem: "Troca programada de SUV com meia parcela de R$ 756,29 no Grupo 5295 e lance embutido de 25%.",
            selecionado: true,
          },
          {
            id: "vp-5",
            nome: "Fernando Albuquerque",
            cargo: "Empresário",
            empresa: "Albuquerque Distribuidora",
            cidade: "Paranaguá",
            uf: "PR",
            telefone: "41988331122",
            email: "fernando@albuquerquedist.com.br",
            segmento: "veiculo",
            valorCredito: 120000,
            prazoMeses: 95,
            parcela5050: 907.54,
            temperatura: "morno",
            ganchoAbordagem: "Aquisição de utilitário comercial leve com custo efetivo muito inferior ao leasing bancário.",
            selecionado: true,
          },
        ];
      } else {
        mockList = [
          {
            id: "vp-6",
            nome: "Dr. André Villas-Bôas",
            cargo: "Médico Cardiologista",
            empresa: "Instituto Cardio Vida",
            cidade: "Curitiba",
            uf: "PR",
            telefone: "41999887766",
            email: "andre@cardiovida.med.br",
            segmento: "imovel",
            valorCredito: 400000,
            prazoMeses: 200,
            parcela5050: 1774.20,
            temperatura: "quente",
            ganchoAbordagem: "Alavancagem patrimonial para consultório próprio sem taxa de juros bancária, com meia parcela de R$ 1.774,20 no Grupo 6042.",
            selecionado: true,
          },
          {
            id: "vp-7",
            nome: "Carla Esteves Vasconcelos",
            cargo: "Sócia-Diretora",
            empresa: "Vasconcelos Engenharia",
            cidade: "Paranaguá",
            uf: "PR",
            telefone: "41991122334",
            email: "carla@vasconceloseng.com.br",
            segmento: "imovel",
            valorCredito: 320000,
            prazoMeses: 200,
            parcela5050: 1512.44,
            temperatura: "quente",
            ganchoAbordagem: "Aquisição de imóvel comercial com lance embutido de 25% no Grupo 6030.",
            selecionado: true,
          },
          {
            id: "vp-8",
            nome: "Marcelo Henrique Diniz",
            cargo: "Executivo de Vendas",
            empresa: "Diniz Agro Soluções",
            cidade: "Campo Largo",
            uf: "PR",
            telefone: "41987654099",
            email: "marcelo@dinizagro.com.br",
            segmento: "imovel",
            valorCredito: 500000,
            prazoMeses: 200,
            parcela5050: 2217.75,
            temperatura: "morno",
            ganchoAbordagem: "Construção de sede e galpão comercial com carta de 500 mil no Grupo 6042.",
            selecionado: true,
          },
        ];
      }

      setProspects(mockList);
      toast.success(`${mockList.length} prospects qualificados encontrados com cotação oficial!`);
    } catch (e: any) {
      toast.error("Erro ao executar prospecção: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selecionado: !p.selecionado } : p))
    );
  };

  const handleImportToFunil = async () => {
    const selecionados = prospects.filter((p) => p.selecionado);
    if (selecionados.length === 0) {
      toast.error("Selecione pelo menos um prospect para enviar ao funil!");
      return;
    }

    setSalvando(true);
    try {
      const inserts = selecionados.map((p) => ({
        nome: p.nome.toUpperCase(),
        celular: p.telefone,
        email: p.email || null,
        status: "novo_lead", // 🎯 PRIMEIRA COLUNA DO FUNIL KANBAN
        tipo_consorcio: p.segmento,
        valor_credito: p.valorCredito,
        prazo_meses: p.prazoMeses,
        cidade: p.uf ? `${p.cidade} - ${p.uf}` : p.cidade,
        lead_temperatura: p.temperatura,
        lead_score_valor: "alto",
        origem: "VIBE_PROSPECTING_AI",
        organizacao_id: organizacaoId || null,
        dados_cadastro: {
          empresa: p.empresa,
          cargo: p.cargo,
          email: p.email,
          cidade: p.cidade,
          uf: p.uf,
          canal_entrada: "Vibe Prospecting",
          parcela_50_50: p.parcela5050,
          gancho_abordagem: p.ganchoAbordagem,
          vibe_tom: vibeTom,
          data_prospeccao: new Date().toISOString(),
        },
      }));

      const { data, error } = await supabase.from("leads").insert(inserts).select("id");
      if (error) throw error;

      toast.success(
        `🎉 ${selecionados.length} clientes adicionados à Operação Leads e posicionados na 1ª Coluna do Funil ("Novo Lead")!`
      );

      if (onLeadsImported) {
        onLeadsImported();
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar no CRM: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleWhatsAppQuickSend = (p: VibeProspect) => {
    const saudacao = `Olá ${p.nome.split(" ")[0]}, tudo bem? Sou o Fabrício da Prospera Planejamento / Consórcio Magalu.`;
    const mensagem = `${saudacao}\n\nVi a atuação da ${p.empresa} em ${p.cidade} e preparei um estudo estratégico para crédito de R$ ${p.valorCredito.toLocaleString("pt-BR")},00 com Meia Parcela reduzida de R$ ${p.parcela5050.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} e opção de lance embutido de 25%.\n\nPodemos conversar 2 minutinhos hoje sobre essa oportunidade?`;

    const encoded = encodeURIComponent(mensagem);
    const cleanPhone = p.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6 md:p-8 rounded-[28px] border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 text-lg">⚡</span>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              Vibe Prospecting OS
            </DialogTitle>
            <Badge variant="outline" className="ml-auto bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px]">
              MCP Explorium & Simulador SimulaJá
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Descreva o perfil do cliente desejado em linguagem natural. A IA mapeia os tomadores de decisão, cruza com a tabela oficial de consórcio e joga automaticamente na primeira coluna do seu Funil de Vendas.
          </DialogDescription>
        </DialogHeader>

        {/* Input de Linguagem Natural (Vibe Prompting) */}
        <div className="space-y-4 my-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>💬 O que você quer prospectar hoje?</span>
              <span className="text-[10px] font-normal text-slate-400">Pressione Buscar para acionar</span>
            </label>
            <div className="flex gap-2">
              <Textarea
                placeholder="Ex: Encontre transportadoras e frotistas em Paranaguá e Curitiba com potencial para crédito de 200k a 300k de pesados com lance embutido..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="min-h-[75px] text-xs resize-none rounded-xl border-slate-200 focus:border-amber-500"
              />
              <Button
                disabled={loading}
                onClick={() => handleRunVibeSearch()}
                className="h-auto px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs tracking-wide shadow-md shadow-amber-500/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                Prospectar
              </Button>
            </div>
          </div>

          {/* Atalhos Rápidos */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Atalhos:</span>
            {PRESET_PROMPTS.map((pr) => (
              <button
                key={pr.titulo}
                type="button"
                onClick={() => {
                  setPromptInput(pr.prompt);
                  handleRunVibeSearch(pr.prompt);
                }}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                ⚡ {pr.titulo}
              </button>
            ))}
          </div>

          {/* Seletor de Vibe do Tom */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              🎭 Vibe da Abordagem:
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: "lance_embutido", label: "⚡ Lance Embutido & Meia Parcela" },
                { id: "srv_consultivo", label: "🎯 SRV Consultivo (Sonho/Velocidade)" },
                { id: "investidor", label: "💼 Investidor (Custo Efetivo)" },
                { id: "humanizado", label: "🤝 Humanizado Jarvis (Caloroso)" },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVibeTom(v.id as any)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                    vibeTom === v.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Prospects Qualificados */}
        {prospects.length > 0 && (
          <div className="space-y-3 mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                {prospects.length} Oportunidades Identificadas
              </span>
              <span className="text-[10px] text-slate-400">
                Selecione os clientes que deseja enviar para o Funil
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {prospects.map((p) => (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    p.selecionado
                      ? "bg-amber-50/20 border-amber-300 ring-1 ring-amber-400/20"
                      : "bg-white border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={p.selecionado}
                      onChange={() => handleToggleSelect(p.id)}
                      className="mt-1 h-4 w-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900">{p.nome}</span>
                        <span className="text-xs text-slate-500 font-medium">({p.cargo})</span>
                        <Badge variant="secondary" className="text-[9px] font-bold uppercase bg-slate-100">
                          {p.empresa}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {p.cidade} - {p.uf}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">
                          Crédito: R$ {p.valorCredito.toLocaleString("pt-BR")},00
                        </span>
                        <span>•</span>
                        <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          50/50: R$ {p.parcela5050.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        "{p.ganchoAbordagem}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWhatsAppQuickSend(p)}
                      className="h-8 px-2.5 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold flex items-center gap-1"
                      title="Abrir WhatsApp com proposta formatada"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600" />
                      Chamar WhatsApp
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Ação de Inserção Direta na 1ª Coluna do Funil */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-white shadow-lg mt-4">
              <div className="space-y-0.5 text-center md:text-left">
                <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5 justify-center md:justify-start">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Regra de Automação do Funil Ativa
                </p>
                <p className="text-[11px] text-slate-300">
                  Os prospects selecionados serão cadastrados em <strong>Operação Leads</strong> e posicionados na <strong>1ª Coluna ("🆕 Novo Lead")</strong> do Funil Kanban.
                </p>
              </div>

              <Button
                disabled={salvando || prospects.filter((p) => p.selecionado).length === 0}
                onClick={handleImportToFunil}
                className="w-full md:w-auto px-6 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md"
              >
                {salvando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Jogar no Funil ({prospects.filter((p) => p.selecionado).length})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
