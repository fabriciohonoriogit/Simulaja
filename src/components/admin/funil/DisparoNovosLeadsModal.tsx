import React, { useState, useEffect, useRef } from "react";
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
  Send,
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Users,
  ShieldCheck,
  Building2,
  Phone,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  CheckSquare,
  Square,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendWhatsAppMessage } from "@/services/evolutionApiService";
import { Lead } from "@/types/funil";

interface DisparoNovosLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onLeadsUpdated?: () => void;
}

interface ItemDisparo {
  lead: Lead;
  selecionado: boolean;
  status: "idle" | "enviando" | "sucesso" | "erro" | "pulado";
  erroMsg?: string;
}

const PRESETS_MENSAGEM = [
  {
    id: "meia_parcela",
    titulo: "🔥 Meia Parcela 50/50 (Alta Conversão)",
    texto:
      "Olá, {nome}! Tudo bem? Vi o destaque da sua empresa em {cidade}. Estamos liberando cartas de consórcio de {credito} com Meia Parcela de {parcela_50_50}/mês até a contemplação e lance embutido de 30%. Teria 2 minutos para eu te apresentar como funciona?",
  },
  {
    id: "consultiva_direta",
    titulo: "💼 Abordagem Executiva Direta",
    texto:
      "Oi {primeiro_nome}, tudo bem? Aqui é o Fabrício da Prospera / SimulaJá. Localizei sua empresa em {cidade} e preparei uma condição especial de crédito sem juros bancários para expansão. Posso te enviar os valores detalhados por aqui?",
  },
  {
    id: "frotas_imoveis",
    titulo: "🚛 Imóveis, Frotas & Capital de Giro",
    texto:
      "Olá {nome}! Tudo certo? Temos uma linha exclusiva de crédito programado para compra de sede própria, galpão ou renovação de frotas em {cidade} com parcelas reduzidas pela metade. Gostaria de receber uma simulação sem compromisso?",
  },
];

export function DisparoNovosLeadsModal({
  isOpen,
  onClose,
  leads,
  onLeadsUpdated,
}: DisparoNovosLeadsModalProps) {
  // Filtra leads que estão na coluna novo_lead
  const leadsNovos = leads.filter(
    (l) => (l.status || "").toLowerCase() === "novo_lead"
  );

  const [itens, setItens] = useState<ItemDisparo[]>([]);
  const [mensagem, setMensagem] = useState(PRESETS_MENSAGEM[0].texto);
  const [presetAtivo, setPresetAtivo] = useState(PRESETS_MENSAGEM[0].id);

  // Configurações
  const [ativarIA, setAtivarIA] = useState(true);
  const [moverPrimeiroContato, setMoverPrimeiroContato] = useState(true);
  const [intervaloSegundos, setIntervaloSegundos] = useState(8);

  // Execução
  const [emExecucao, setEmExecucao] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [indiceAtual, setIndiceAtual] = useState(-1);
  const [progresso, setProgresso] = useState({ enviados: 0, erros: 0, total: 0 });

  const pausadoRef = useRef(false);
  const canceladoRef = useRef(false);

  useEffect(() => {
    pausadoRef.current = pausado;
  }, [pausado]);

  // Inicializa lista quando o modal abre ou a lista de leads muda
  useEffect(() => {
    if (isOpen) {
      const novos = leadsNovos.map((lead) => ({
        lead,
        selecionado: Boolean(lead.celular && lead.celular.replace(/\D/g, "").length >= 10),
        status: "idle" as const,
      }));
      setItens(novos);
      setEmExecucao(false);
      setPausado(false);
      setIndiceAtual(-1);
      setProgresso({ enviados: 0, erros: 0, total: novos.filter((i) => i.selecionado).length });
    }
  }, [isOpen, leads]);

  const selecionados = itens.filter((i) => i.selecionado);

  const toggleSelect = (id: string) => {
    if (emExecucao) return;
    setItens((prev) =>
      prev.map((item) =>
        item.lead.id === id ? { ...item, selecionado: !item.selecionado } : item
      )
    );
  };

  const toggleSelectAll = () => {
    if (emExecucao) return;
    const todosSelecionados = itens.every((i) => i.selecionado);
    setItens((prev) => prev.map((i) => ({ ...i, selecionado: !todosSelecionados })));
  };

  const aplicarPreset = (presetId: string) => {
    const p = PRESETS_MENSAGEM.find((x) => x.id === presetId);
    if (p) {
      setMensagem(p.texto);
      setPresetAtivo(presetId);
      toast.success(`Preset "${p.titulo}" aplicado!`);
    }
  };

  const inserirTag = (tag: string) => {
    setMensagem((prev) => prev + " " + tag);
  };

  // Monta a mensagem personalizada para um lead
  const montarMensagemLead = (lead: Lead, template: string) => {
    const nomeCompleto = lead.nome || "Cliente";
    const primeiroNome = nomeCompleto.split(" ")[0] || "Cliente";
    const dados = lead.dados_cadastro || {};
    const nomeEmpresa = dados.nome_fantasia || lead.nome || "sua empresa";
    const cidade = lead.cidade || dados.cidade || "sua região";

    const credNum = Number(lead.valor_credito) || 300000;
    const credFmt = credNum.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });

    let parc5050 = "R$ 1.540,00";
    if (dados.parcela_50_50) {
      parc5050 = Number(dados.parcela_50_50).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    } else {
      // Cálculo aproximado 50/50: prazo 128 meses, taxa 15%
      const custo = credNum * 1.17;
      const parc = (custo / 128) * 0.5;
      parc5050 = parc.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }

    return template
      .replace(/{nome}/g, nomeCompleto)
      .replace(/{primeiro_nome}/g, primeiroNome)
      .replace(/{empresa}/g, nomeEmpresa)
      .replace(/{cidade}/g, cidade)
      .replace(/{credito}/g, credFmt)
      .replace(/{parcela_50_50}/g, parc5050);
  };

  // Preview com base no primeiro selecionado
  const primeiroLead = selecionados[0]?.lead || leadsNovos[0];
  const mensagemPreview = primeiroLead
    ? montarMensagemLead(primeiroLead, mensagem)
    : "Selecione ao menos um lead para visualizar a prévia.";

  // Função principal de disparo
  const handleIniciarDisparo = async () => {
    if (selecionados.length === 0) {
      toast.error("Selecione ao menos um lead para disparar!");
      return;
    }

    if (!mensagem.trim()) {
      toast.error("O texto da mensagem não pode ficar vazio!");
      return;
    }

    setEmExecucao(true);
    setPausado(false);
    canceladoRef.current = false;
    pausadoRef.current = false;

    let sucessoCount = 0;
    let erroCount = 0;

    for (let i = 0; i < itens.length; i++) {
      if (canceladoRef.current) {
        toast.info("Disparos cancelados pelo usuário.");
        break;
      }

      const item = itens[i];
      if (!item.selecionado) continue;

      // Espera enquanto estiver pausado
      while (pausadoRef.current) {
        await new Promise((r) => setTimeout(r, 600));
        if (canceladoRef.current) break;
      }
      if (canceladoRef.current) break;

      setIndiceAtual(i);
      setItens((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: "enviando" } : it))
      );

      const lead = item.lead;
      const targetPhone = lead.celular ? lead.celular.replace(/\D/g, "") : "";

      if (!targetPhone || targetPhone.length < 10) {
        erroCount++;
        setItens((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? { ...it, status: "erro", erroMsg: "Número de telefone inválido" }
              : it
          )
        );
        continue;
      }

      const textoFinal = montarMensagemLead(lead, mensagem);

      try {
        // 1. Envia via WhatsApp (WAHA Local ou Evolution API)
        const waRes = await sendWhatsAppMessage({
          number: targetPhone,
          text: textoFinal,
          organizacaoId: lead.organizacao_id,
          leadId: lead.id,
          leadNome: lead.nome,
        });

        if (!waRes.success) {
          erroCount++;
          setItens((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? {
                    ...it,
                    status: "erro",
                    erroMsg: waRes.error || "Sem WhatsApp ou erro de conexão",
                  }
                : it
            )
          );
        } else {
          sucessoCount++;

          // 2. Grava no chat_messages do Supabase para aparecer no LeadChat
          await supabase.from("chat_messages").insert({
            lead_id: lead.id,
            content: textoFinal,
            role: "assistant",
          });

          // 3. Atualiza lead no Supabase: status e atendimento_ia
          const updatePayload: any = {
            atendimento_ia: ativarIA,
            status_updated_at: new Date().toISOString(),
          };
          if (moverPrimeiroContato) {
            updatePayload.status = "primeiro_contato";
          }

          await supabase.from("leads").update(updatePayload).eq("id", lead.id);

          // 4. Grava no histórico de contatos
          await supabase.from("historico_contatos").insert({
            lead_id: lead.id,
            tipo_contato: "whatsapp",
            detalhes: `Disparo em lote WhatsApp: "${textoFinal.substring(0, 100)}..."`,
            resultado: ativarIA
              ? "Mensagem entregue com Atendimento IA ativado"
              : "Mensagem entregue",
          });

          setItens((prev) =>
            prev.map((it, idx) =>
              idx === i ? { ...it, status: "sucesso" } : it
            )
          );
        }
      } catch (err: any) {
        erroCount++;
        setItens((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: "erro", erroMsg: err.message } : it
          )
        );
      }

      setProgresso({
        enviados: sucessoCount,
        erros: erroCount,
        total: selecionados.length,
      });

      // Intervalo seguro entre disparos para evitar bloqueio do WhatsApp
      if (i < itens.length - 1 && !canceladoRef.current) {
        await new Promise((r) => setTimeout(r, intervaloSegundos * 1000));
      }
    }

    setEmExecucao(false);
    setIndiceAtual(-1);

    toast.success(
      `🎉 Disparos concluídos! ${sucessoCount} enviados com sucesso, ${erroCount} falhas.`,
      { duration: 6000 }
    );

    if (onLeadsUpdated) {
      onLeadsUpdated();
    }
  };

  const handleCancelar = () => {
    canceladoRef.current = true;
    setEmExecucao(false);
    setPausado(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !emExecucao && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-slate-50 border border-slate-200 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Send className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Disparo em Massa para Novos Leads
                <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                  {leadsNovos.length} no Funil
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Envie mensagens no WhatsApp com cadência humana anti-banimento e ative o
                atendimento automático da IA Jarvis para responder instantaneamente.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* CORPO DO MODAL */}
        <div className="space-y-6 pt-3">
          {/* SEÇÃO 1: MENSAGEM & PRESETS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Modelos de
                Abordagem Prontos:
              </span>
              <div className="flex flex-wrap gap-1">
                {PRESETS_MENSAGEM.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => aplicarPreset(p.id)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      presetAtivo === p.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {p.titulo}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              disabled={emExecucao}
              rows={4}
              placeholder="Digite a mensagem do WhatsApp..."
              className="text-xs bg-slate-50/50 border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-emerald-500"
            />

            {/* TAGS DINÂMICAS */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Inserir Tag:
              </span>
              {[
                { tag: "{nome}", label: "Nome / Razão" },
                { tag: "{primeiro_nome}", label: "Primeiro Nome" },
                { tag: "{cidade}", label: "Cidade" },
                { tag: "{credito}", label: "Valor de Crédito" },
                { tag: "{parcela_50_50}", label: "Meia Parcela" },
              ].map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => inserirTag(t.tag)}
                  className="text-[10px] font-mono bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                >
                  {t.tag}
                </button>
              ))}
            </div>

            {/* PRÉVIA AO VIVO */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-emerald-800">
                <span>👁️ Prévia ao Vivo (Como o cliente recebe):</span>
                {primeiroLead && (
                  <span className="text-slate-500 font-normal">
                    Exemplo: <b>{primeiroLead.nome}</b>
                  </span>
                )}
              </div>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-sans bg-white p-2.5 rounded-lg border border-emerald-100/60 shadow-xs">
                {mensagemPreview}
              </p>
            </div>
          </div>

          {/* SEÇÃO 2: CONFIGURAÇÕES DE DISPARO E ATENDIMENTO AUTOMÁTICO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* TOGGLE IA ATIVA */}
            <div
              onClick={() => !emExecucao && setAtivarIA(!ativarIA)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                ativarIA
                  ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Bot className={`h-4 w-4 ${ativarIA ? "text-emerald-600" : "text-slate-400"}`} />
                  <span className="text-xs font-black text-slate-900">
                    Atendimento IA Jarvis
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={ativarIA}
                  onChange={() => {}}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Assim que o cliente responder no WhatsApp, o Jarvis responde
                automaticamente tirando dúvidas de consórcio.
              </p>
            </div>

            {/* TOGGLE MOVER STATUS */}
            <div
              onClick={() => !emExecucao && setMoverPrimeiroContato(!moverPrimeiroContato)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                moverPrimeiroContato
                  ? "bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/20 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <ArrowRight className={`h-4 w-4 ${moverPrimeiroContato ? "text-blue-600" : "text-slate-400"}`} />
                  <span className="text-xs font-black text-slate-900">
                    Mover para "1º Contato"
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={moverPrimeiroContato}
                  onChange={() => {}}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Ao enviar a mensagem, o card no Kanban é movido da coluna "Novo Lead"
                para "Primeiro Contato".
              </p>
            </div>

            {/* CADÊNCIA / INTERVALO */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-black text-slate-900">
                  Cadência Anti-Bloqueio
                </span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {[
                  { seg: 5, label: "5s (Rápido)" },
                  { seg: 8, label: "8s (Seguro)" },
                  { seg: 15, label: "15s (Calmo)" },
                ].map((c) => (
                  <button
                    key={c.seg}
                    type="button"
                    disabled={emExecucao}
                    onClick={() => setIntervaloSegundos(c.seg)}
                    className={`flex-1 text-[10px] font-bold py-1 px-1 rounded-lg border transition-all ${
                      intervaloSegundos === c.seg
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 mt-1">
                Intervalo aleatório entre cada envio para proteger o chip.
              </p>
            </div>
          </div>

          {/* SEÇÃO 3: LISTAGEM DE LEADS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Leads Selecionados ({selecionados.length} de {itens.length})
                </span>
              </div>
              <button
                type="button"
                disabled={emExecucao}
                onClick={toggleSelectAll}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                {itens.every((i) => i.selecionado) ? (
                  <>
                    <CheckSquare className="h-3.5 w-3.5" /> Desmarcar Todos
                  </>
                ) : (
                  <>
                    <Square className="h-3.5 w-3.5" /> Selecionar Todos
                  </>
                )}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {itens.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Nenhum lead encontrado na coluna "Novo Lead".
                </div>
              ) : (
                itens.map((item, idx) => {
                  const lead = item.lead;
                  const temPhone = Boolean(lead.celular && lead.celular.replace(/\D/g, "").length >= 10);
                  const isCurrent = indiceAtual === idx;

                  return (
                    <div
                      key={lead.id}
                      onClick={() => toggleSelect(lead.id)}
                      className={`p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        item.selecionado ? "bg-slate-50/50 hover:bg-slate-100/60" : "opacity-60 bg-white"
                      } ${isCurrent ? "ring-2 ring-emerald-500 bg-emerald-50/40" : ""}`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={item.selecionado}
                          disabled={emExecucao}
                          onChange={() => toggleSelect(lead.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 truncate">
                              {lead.nome}
                            </span>
                            {lead.cidade && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                • {lead.cidade}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1 font-mono font-medium">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {lead.celular || "Sem telefone"}
                            </span>
                            {lead.valor_credito && (
                              <span>
                                • Carta:{" "}
                                <b>
                                  {Number(lead.valor_credito).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                    maximumFractionDigits: 0,
                                  })}
                                </b>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* STATUS DO ITEM */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {item.status === "idle" && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {temPhone ? "Aguardando" : "Sem Telefone"}
                          </span>
                        )}
                        {item.status === "enviando" && (
                          <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Enviando...
                          </Badge>
                        )}
                        {item.status === "sucesso" && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Enviado
                          </Badge>
                        )}
                        {item.status === "erro" && (
                          <Badge className="bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1" title={item.erroMsg}>
                            <AlertCircle className="h-3 w-3" /> Falha
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* BARRA DE PROGRESSO DURANTE O DISPARO */}
          {emExecucao && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  <span>
                    Enviando {indiceAtual + 1} de {progresso.total}...
                  </span>
                </div>
                <span className="font-mono text-emerald-400">
                  {Math.round(((indiceAtual + 1) / (progresso.total || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                  style={{
                    width: `${((indiceAtual + 1) / (progresso.total || 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>🟢 Sucessos: {progresso.enviados}</span>
                <span>🔴 Erros: {progresso.erros}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPausado(!pausado)}
                    className="h-6 px-2 text-[10px] bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  >
                    {pausado ? (
                      <>
                        <Play className="h-3 w-3 mr-1" /> Continuar
                      </>
                    ) : (
                      <>
                        <Pause className="h-3 w-3 mr-1" /> Pausar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleCancelar}
                    className="h-6 px-2 text-[10px] bg-rose-600 hover:bg-rose-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* RODAPÉ COM AÇÕES */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <Button
              variant="outline"
              disabled={emExecucao}
              onClick={onClose}
              className="text-xs font-bold text-slate-600 rounded-xl"
            >
              Fechar
            </Button>

            <Button
              onClick={handleIniciarDisparo}
              disabled={emExecucao || selecionados.length === 0}
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs uppercase tracking-wider px-6 h-11 rounded-xl shadow-lg shadow-emerald-500/20"
            >
              {emExecucao ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Disparando em Lote...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Iniciar Disparos ({selecionados.length} Leads)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
