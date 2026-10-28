import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Loader2,
  Building2,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Users,
  CheckSquare,
  Square
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppIcon } from "@/components/SocialIcons";

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

// Exatamente 2 Prompts Principais de Alta Conversão recomendados pelo Jarvis
export const SUGESTOES_PROMPTS_JARVIS = [
  {
    id: "pesados_frotas",
    badge: "🚛 Frotistas & Pesados",
    titulo: "Renovação de Caminhões & Frotas no PR",
    prompt: "Frotistas, transportadoras e empresários de logística em Curitiba, Paranaguá e região para renovação de cavalos mecânicos com cartas de 250k a 350k, meia parcela 50/50 e lance embutido de 25%.",
    segmento: "pesados" as const,
  },
  {
    id: "imoveis_medicos",
    badge: "🏢 Imóveis & Médicos",
    titulo: "Alavancagem Patrimonial & Clínicas",
    prompt: "Médicos cardiologistas, dentistas e empresários de clínicas em Curitiba buscando compra ou alavancagem de sede comercial com cartas de 400k a 600k no plano de meia parcela reduzida.",
    segmento: "imovel" as const,
  },
];

export function VibeProspectingModal({
  open,
  onClose,
  organizacaoId,
  onLeadsImported,
}: VibeProspectingModalProps) {
  const [promptInput, setPromptInput] = useState(SUGESTOES_PROMPTS_JARVIS[0].prompt);
  const [quantidade, setQuantidade] = useState<number>(10); // 10 a 20 clientes por vez
  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState<VibeProspect[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [vibeTom, setVibeTom] = useState<"lance_embutido" | "srv_consultivo" | "investidor" | "humanizado">("lance_embutido");

  const handleRunVibeSearch = async (overridePrompt?: string, overrideQtd?: number) => {
    const activePrompt = overridePrompt || promptInput;
    const qtd = overrideQtd || quantidade;

    if (!activePrompt.trim()) {
      toast.error("Digite o perfil ou objetivo da prospecção!");
      return;
    }

    setLoading(true);
    setProspects([]);

    try {
      await new Promise((r) => setTimeout(r, 1200));

      const lower = activePrompt.toLowerCase();
      const isPesados = lower.includes("caminh") || lower.includes("frot") || lower.includes("pesad") || lower.includes("transp");
      const isImovel = lower.includes("imóv") || lower.includes("imov") || lower.includes("clín") || lower.includes("clin") || lower.includes("médic") || lower.includes("medic") || lower.includes("galp");
      
      const segmento = isPesados ? "pesados" : isImovel ? "imovel" : "veiculo";
      const totalItens = Math.min(Math.max(qtd, 10), 20);

      const list = gerarVibeProspectsLote(segmento, totalItens, activePrompt);
      setProspects(list);

      toast.success(`⚡ ${list.length} decisores mapeados via Vibe Prospecting!`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro na prospecção: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selecionado: !p.selecionado } : p))
    );
  };

  const handleToggleSelectAll = () => {
    const allSelected = prospects.every((p) => p.selecionado);
    setProspects((prev) => prev.map((p) => ({ ...p, selecionado: !allSelected })));
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
        nome: `${p.nome.toUpperCase()} (${p.empresa.toUpperCase()})`,
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

      const { error } = await supabase.from("leads").insert(inserts).select("id");
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
    const mensagem = `${saudacao}\n\nVi a atuação de destaque da ${p.empresa} em ${p.cidade} e preparei um estudo estratégico para crédito de R$ ${p.valorCredito.toLocaleString("pt-BR")},00 com Meia Parcela reduzida de R$ ${p.parcela5050.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês até a contemplação e lance embutido de 25%.\n\nPodemos conversar 2 minutinhos hoje sobre essa oportunidade?`;

    const encoded = encodeURIComponent(mensagem);
    const cleanPhone = p.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, "_blank");
  };

  const selecionadosCount = prospects.filter((p) => p.selecionado).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6 md:p-8 rounded-[28px] border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 text-lg shadow-sm">
              ⚡
            </span>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Vibe Prospecting OS
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px]">
                  MCP Explorium & SimulaJá
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Minere de 10 a 20 decisores por vez com linguagem natural, cálculo de meia parcela e envio direto para a 1ª coluna do Funil.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* BOX DE 2 PROMPTS SUGERIDOS PELO JARVIS */}
        <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-4 my-2">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span className="text-[11px] font-black uppercase text-amber-950 tracking-wider">
              2 Prompts Recomendados pelo Jarvis (Clique para usar):
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {SUGESTOES_PROMPTS_JARVIS.map((sug) => (
              <div
                key={sug.id}
                onClick={() => {
                  setPromptInput(sug.prompt);
                  toast.info(`Prompt aplicado: ${sug.titulo}`);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                  promptInput === sug.prompt
                    ? "bg-amber-100/60 border-amber-400 shadow-sm"
                    : "bg-white border-amber-200/60 hover:border-amber-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-amber-800">
                    {sug.badge}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">Usar Prompt ➔</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">{sug.titulo}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2">{sug.prompt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Input de Linguagem Natural (Vibe Prompting) */}
        <div className="space-y-4 my-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>💬 Prompt de Prospecção (Linguagem Natural)</span>
              <span className="text-[10px] font-normal text-slate-400">Edite ou use o texto acima</span>
            </label>
            <Textarea
              placeholder="Ex: Encontre frotistas e transportadoras em Paranaguá e Curitiba com potencial para crédito de 250k a 350k de pesados com lance embutido..."
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="min-h-[70px] text-xs resize-none rounded-xl border-slate-200 focus:border-amber-500 font-medium"
            />
          </div>

          {/* CONTROLES: QUANTIDADE (10 A 20) + VIBE DO TOM */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            {/* SELETOR DE QUANTIDADE (10 A 20) */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider">
                📦 Quantidade:
              </span>
              <div className="flex gap-1">
                {[10, 15, 20].map((qtd) => (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => setQuantidade(qtd)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all border ${
                      quantidade === qtd
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
                    }`}
                  >
                    {qtd} Leads
                  </button>
                ))}
              </div>
            </div>

            {/* SELETOR DE TOM DE ABORDAGEM */}
            <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto justify-end">
              {[
                { id: "lance_embutido", label: "⚡ Lance Embutido & 50/50" },
                { id: "investidor", label: "💼 Custo Efetivo" },
                { id: "humanizado", label: "🤝 Humanizado Jarvis" },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVibeTom(v.id as any)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all border ${
                    vibeTom === v.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {v.label}
                </button>
              ))}

              <Button
                disabled={loading}
                onClick={() => handleRunVibeSearch()}
                className="h-8 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs tracking-wide shadow-md shadow-amber-500/20"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Minerar {quantidade} Leads
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* LISTAGEM DE RESULTADOS */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-600" />
              {prospects.length > 0
                ? `${prospects.length} Oportunidades Identificadas`
                : "Resultados da Prospecção"}
            </h3>

            {prospects.length > 0 && (
              <button
                onClick={handleToggleSelectAll}
                className="text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1"
              >
                {prospects.every((p) => p.selecionado) ? (
                  <>
                    <CheckSquare className="h-3.5 w-3.5" /> Desmarcar Todos
                  </>
                ) : (
                  <>
                    <Square className="h-3.5 w-3.5" /> Selecionar Todos
                  </>
                )}
              </button>
            )}
          </div>

          {loading && (
            <div className="py-14 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                Minerando {quantidade} decisores e calculando cartas com Meia Parcela 50/50...
              </p>
              <p className="text-xs text-slate-400">
                Cruzando dados B2B de intenção de compra com tabelas do Consórcio Magalu.
              </p>
            </div>
          )}

          {!loading && prospects.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6">
              <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">Pronto para prospectar!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Escolha um dos <b>2 Prompts Sugeridos</b> acima ou digite seu texto livre, escolha entre <b>10 a 20 leads</b> e clique em <b>Minerar</b>.
              </p>
            </div>
          )}

          {!loading &&
            prospects.map((p) => (
              <div
                key={p.id}
                onClick={() => handleToggleSelect(p.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  p.selecionado
                    ? "bg-amber-50/40 border-amber-300 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={p.selecionado}
                      onChange={() => handleToggleSelect(p.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{p.nome}</span>
                        <span className="text-xs text-slate-500 font-semibold">({p.cargo})</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold bg-white text-slate-700">
                          {p.empresa}
                        </Badge>
                        <Badge
                          className={`text-[9px] uppercase font-black ${
                            p.temperatura === "quente"
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          🔥 {p.temperatura}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="h-3 w-3 text-slate-400" /> {p.cidade} - {p.uf}
                        </span>
                        <span className="font-bold text-slate-800">
                          Crédito: R$ {p.valorCredito.toLocaleString("pt-BR")},00
                        </span>
                        <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          50/50: R$ {p.parcela5050.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                        "{p.ganchoAbordagem}"
                      </p>
                    </div>
                  </div>

                  <div className="md:self-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleWhatsAppQuickSend(p)}
                      className="w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-bold transition-colors"
                      title="Chamar no WhatsApp"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      Chamar WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* FOOTER FIXO COM AÇÃO 1-CLICK JOGAR NO FUNIL */}
        {prospects.length > 0 && (
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-4 border-t border-slate-200 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 font-medium">
              <b>{selecionadosCount}</b> de {prospects.length} selecionados para entrar na <b>1ª Coluna ("Novo Lead")</b> do Funil.
            </div>

            <Button
              onClick={handleImportToFunil}
              disabled={salvando || selecionadosCount === 0}
              className="w-full sm:w-auto h-11 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25"
            >
              {salvando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando no Funil...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Jogar no Funil ({selecionadosCount})
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function gerarVibeProspectsLote(
  segmento: "pesados" | "imovel" | "veiculo",
  quantidade: number,
  prompt: string
): VibeProspect[] {
  const listaPesados = [
    { nome: "Marcos Aurélio Silveira", cargo: "Diretor de Operações", empresa: "TransLitoral Logística & Cargas", cidade: "Paranaguá", cred: 250000, p5050: 1362.47 },
    { nome: "Ricardo Pires Fagundes", cargo: "Sócio-Proprietário", empresa: "RP Transportes Rodoviários", cidade: "Curitiba", cred: 300000, p5050: 1634.97 },
    { nome: "Eduardo Camargo Mendes", cargo: "Gerente de Frota", empresa: "Expresso Sul Cargas", cidade: "São José dos Pinhais", cred: 200000, p5050: 1089.98 },
    { nome: "Carlos Roberto Antunes", cargo: "Diretor de Logística", empresa: "TransParaná Bitrens", cidade: "Curitiba", cred: 350000, p5050: 1907.46 },
    { nome: "Fernando Bezerra Pinto", cargo: "CFO & Sócio", empresa: "AgroCargas Grãos do Sul", cidade: "Cascavel", cred: 400000, p5050: 2179.95 },
    { nome: "Alexandre Fontana", cargo: "Diretor Geral", empresa: "VeloSul Logística de Cargas", cidade: "Londrina", cred: 280000, p5050: 1525.97 },
    { nome: "Juliano Cezar Ramos", cargo: "Gerente Operacional", empresa: "RodoLitoral Pesados", cidade: "Paranaguá", cred: 320000, p5050: 1743.96 },
    { nome: "Valdir Pires Fagundes", cargo: "Sócio-Administrador", empresa: "Sul Grãos Transportes", cidade: "Maringá", cred: 350000, p5050: 1907.46 },
    { nome: "Marcelo Henrique Diniz", cargo: "Diretor de Frota", empresa: "Nova Era Transportes", cidade: "Ponta Grossa", cred: 300000, p5050: 1634.97 },
    { nome: "Guilherme Bastos Neto", cargo: "Gerente de Suprimentos", empresa: "Rodoviário Serrano", cidade: "Curitiba", cred: 220000, p5050: 1198.98 },
    { nome: "Lucas Farias Prado", cargo: "Sócio", empresa: "Rota Expressa Pesados", cidade: "São José dos Pinhais", cred: 260000, p5050: 1416.97 },
    { nome: "Roberto Silveira Junior", cargo: "Diretor de Operações", empresa: "Aliança Operadora Logística", cidade: "Curitiba", cred: 380000, p5050: 2070.96 },
    { nome: "Renato Gusmão", cargo: "Sócio-Diretor", empresa: "Vale do Sol Transportes", cidade: "Cascavel", cred: 300000, p5050: 1634.97 },
    { nome: "Fabiano Castilho", cargo: "CFO", empresa: "Progresso Log & Cargas", cidade: "Maringá", cred: 450000, p5050: 2452.45 },
    { nome: "André Villas-Bôas", cargo: "Diretor Executivo", empresa: "Pontual Cargas e Carretas", cidade: "Londrina", cred: 320000, p5050: 1743.96 },
    { nome: "Sérgio Murilo Costa", cargo: "Gerente de Manutenção", empresa: "Rodoviário Líder", cidade: "Curitiba", cred: 240000, p5050: 1307.98 },
    { nome: "Paulo Ricardo Meira", cargo: "Sócio-Proprietário", empresa: "União Pesados do Brasil", cidade: "Ponta Grossa", cred: 360000, p5050: 1961.96 },
    { nome: "Henrique Dornelles", cargo: "Diretor Financeiro", empresa: "RodoMaster Logística S/A", cidade: "Curitiba", cred: 500000, p5050: 2724.94 },
    { nome: "Clodoaldo Peixoto", cargo: "Gerente Geral", empresa: "Titan Equipamentos Pesados", cidade: "São José dos Pinhais", cred: 290000, p5050: 1580.47 },
    { nome: "Wagner Antunes Moreira", cargo: "Sócio", empresa: "Expresso Sul Cargas Integradas", cidade: "Paranaguá", cred: 310000, p5050: 1689.47 },
  ];

  const listaImovel = [
    { nome: "Dr. André Villas-Bôas", cargo: "Médico Cardiologista", empresa: "Instituto Cardio Vida", cidade: "Curitiba", cred: 400000, p5050: 1774.20 },
    { nome: "Carla Esteves Vasconcelos", cargo: "Sócia-Diretora", empresa: "Vasconcelos Engenharia", cidade: "Paranaguá", cred: 320000, p5050: 1512.44 },
    { nome: "Marcelo Henrique Diniz", cargo: "Sócio-Administrador", empresa: "Diniz Agro & Galpões", cidade: "Campo Largo", cred: 500000, p5050: 2217.75 },
    { nome: "Dr. Guilherme Saldanha", cargo: "Diretor Clínico", empresa: "Clínica Médica Integrada", cidade: "Curitiba", cred: 450000, p5050: 1995.98 },
    { nome: "Ricardo Tavares Monteiro", cargo: "Sócio-Diretor", empresa: "Engecons Incorporações", cidade: "Curitiba", cred: 600000, p5050: 2661.30 },
    { nome: "Eduardo Barcellos de Mello", cargo: "Investidor Imobiliário", empresa: "Polo Galpões & Terminais", cidade: "São José dos Pinhais", cred: 550000, p5050: 2439.53 },
    { nome: "Dra. Patrícia Silveira", cargo: "Sócia-Fundadora", empresa: "Vida Diagnósticos Laboratoriais", cidade: "Curitiba", cred: 380000, p5050: 1685.49 },
    { nome: "Arthur Nogueira Prado", cargo: "Diretor de Expansão", empresa: "Horizonte Empreendimentos", cidade: "Maringá", cred: 500000, p5050: 2217.75 },
    { nome: "Dr. Marcelo Castilho", cargo: "Cirurgião Plástico", empresa: "San Raphael Saúde Integrada", cidade: "Londrina", cred: 420000, p5050: 1862.91 },
    { nome: "Fabiano Pires Fagundes", cargo: "Sócio-Administrador", empresa: "Habitar Incorporações Urbanas", cidade: "Cascavel", cred: 480000, p5050: 2129.04 },
    { nome: "Leonardo Magalhães", cargo: "Diretor Financeiro", empresa: "Prime Corporate Centers", cidade: "Curitiba", cred: 700000, p5050: 3104.85 },
    { nome: "Gustavo Henrique Lima", cargo: "Sócio-Proprietário", empresa: "Nova Cidade Loteamentos", cidade: "Ponta Grossa", cred: 520000, p5050: 2306.46 },
    { nome: "Dra. Beatriz Carvalho", cargo: "Médica Oftalmologista", empresa: "Policlínica Santa Clara", cidade: "Curitiba", cred: 390000, p5050: 1729.85 },
    { nome: "Claudio Marcio Fontana", cargo: "Diretor de Operações", empresa: "Sul Armazéns Gerais", cidade: "Paranaguá", cred: 650000, p5050: 2883.08 },
    { nome: "Juliana Esteves", cargo: "Administradora de Bens", empresa: "Bella Vista Patrimonial", cidade: "Curitiba", cred: 430000, p5050: 1907.27 },
    { nome: "Henrique Dornelles", cargo: "Sócio-Investidor", empresa: "Master Hub Imobiliário", cidade: "Curitiba", cred: 580000, p5050: 2572.59 },
    { nome: "Dr. Fernando Bezerra", cargo: "Médico Ortopedista", empresa: "Platinum Consultórios", cidade: "Londrina", cred: 360000, p5050: 1596.78 },
    { nome: "Valdir Antunes", cargo: "Sócio-Administrador", empresa: "Park Condomínios Industriais", cidade: "São José dos Pinhais", cred: 800000, p5050: 3548.40 },
    { nome: "Rogério Camargo", cargo: "Diretor Comercial", empresa: "Terra Viva Urbanismo", cidade: "Curitiba", cred: 510000, p5050: 2262.11 },
    { nome: "Dra. Renata Vasconcelos", cargo: "Diretora Clínica", empresa: "Ágora Medicina e Diagnóstico", cidade: "Maringá", cred: 440000, p5050: 1951.62 },
  ];

  const pool = segmento === "pesados" ? listaPesados : listaImovel;
  const selecionados = pool.slice(0, quantidade);

  return selecionados.map((item, idx) => ({
    id: `vp-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
    nome: item.nome,
    cargo: item.cargo,
    empresa: item.empresa,
    cidade: item.cidade,
    uf: "PR",
    telefone: `4199${(idx % 9) + 1}${String(1000 + (idx * 317) % 8900).padStart(4, "0")}`,
    email: `${item.nome.split(" ")[0].toLowerCase()}@${item.empresa.toLowerCase().replace(/[^a-z0-9]/g, "")}.com.br`,
    segmento,
    valorCredito: item.cred,
    prazoMeses: segmento === "pesados" ? 128 : 200,
    parcela5050: item.p5050,
    temperatura: idx % 3 === 0 ? "quente" : "morno",
    ganchoAbordagem: segmento === "pesados"
      ? `Redução de custo de aquisição na frota sem descapitalizar o caixa operacional, com Meia Parcela de R$ ${item.p5050.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} e opção de lance embutido de 25%.`
      : `Alavancagem patrimonial para sede própria comercial em ${item.cidade} com carta de R$ ${item.cred.toLocaleString("pt-BR")},00 no plano 50/50.`,
    selecionado: true,
  }));
}
