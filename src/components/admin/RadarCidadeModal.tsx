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
import {
  MapPin,
  Building2,
  Users,
  Search,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Filter,
  CheckSquare,
  Square
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppIcon } from "@/components/SocialIcons";
import {
  buscarEmpresasPorCidade,
  RadarLocalProspect,
  NICHOS_POPULARES,
  ESTADOS_BRASIL,
} from "@/services/radarLocalService";

interface RadarCidadeModalProps {
  open: boolean;
  onClose: () => void;
  organizacaoId?: string;
  onLeadsImported?: () => void;
}

export function RadarCidadeModal({
  open,
  onClose,
  organizacaoId,
  onLeadsImported,
}: RadarCidadeModalProps) {
  const [cidade, setCidade] = useState("Curitiba");
  const [uf, setUf] = useState("PR");
  const [nichoSelecionado, setNichoSelecionado] = useState(NICHOS_POPULARES[0].id);
  const [nichoLivre, setNichoLivre] = useState("");
  const [segmento, setSegmento] = useState<"pesados" | "imovel" | "veiculo">("pesados");
  const [faixaCredito, setFaixaCredito] = useState<number>(300000);
  
  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState<RadarLocalProspect[]>([]);
  const [salvando, setSalvando] = useState(false);

  const handleBuscar = async () => {
    if (!cidade.trim()) {
      toast.error("Informe a cidade desejada!");
      return;
    }

    setLoading(true);
    setProspects([]);

    try {
      const nichoObj = NICHOS_POPULARES.find((n) => n.id === nichoSelecionado);
      const nichoNome = nichoLivre.trim() || nichoObj?.label || "Empresas Locais";

      const results = await buscarEmpresasPorCidade({
        cidade: cidade.trim(),
        uf,
        nicho: nichoNome,
        segmento,
        faixaCredito,
      });

      setProspects(results);
      toast.success(`📍 ${results.length} empresas mapeadas em ${cidade} - ${uf}!`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao varrer cidade: " + (err.message || "Tente novamente"));
    } finally {
      setLoading(false);
    }
  };

  const handleNichoChange = (nichoId: string) => {
    setNichoSelecionado(nichoId);
    setNichoLivre("");
    const n = NICHOS_POPULARES.find((item) => item.id === nichoId);
    if (n) {
      setSegmento(n.segmento);
      setFaixaCredito(n.creditoPadrao);
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
      toast.error("Selecione ao menos uma empresa para enviar ao funil!");
      return;
    }

    setSalvando(true);
    try {
      const inserts = selecionados.map((p) => ({
        nome: `${p.decisorPrincipal.toUpperCase()} (${p.nomeFantasia.toUpperCase()})`,
        celular: p.telefone,
        email: p.email || null,
        status: "novo_lead", // 🎯 PRIMEIRA COLUNA DO FUNIL KANBAN
        tipo_consorcio: p.segmento,
        valor_credito: p.valorCredito,
        prazo_meses: p.prazoMeses,
        cidade: `${p.cidade} - ${p.uf}`,
        lead_temperatura: "quente",
        lead_score_valor: "alto",
        origem: "RADAR_LOCAL_MAPS",
        organizacao_id: organizacaoId || null,
        dados_cadastro: {
          cnpj: p.cnpj,
          razao_social: p.razaoSocial,
          nome_fantasia: p.nomeFantasia,
          decisor_principal: p.decisorPrincipal,
          socios: p.socios,
          capital_social: p.capitalSocial,
          endereco: p.endereco,
          bairro: p.bairro,
          cidade: p.cidade,
          uf: p.uf,
          google_maps_url: p.googleMapsUrl,
          avaliacao_google: p.avaliacaoGoogle,
          nicho: p.nicho,
          parcela_normal: p.parcelaNormal,
          parcela_50_50: p.parcela5050,
          lance_embutido_pct: p.lanceEmbutidoPct,
          gancho_abordagem: p.ganchoAbordagem,
          canal_entrada: "Radar Local (Google Maps & CNPJ)",
          data_prospeccao: new Date().toISOString(),
        },
      }));

      const { error } = await supabase.from("leads").insert(inserts).select("id");
      if (error) throw error;

      toast.success(
        `🎉 ${selecionados.length} empresas de ${cidade}/${uf} inseridas no Funil ("Novo Lead")!`
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

  const handleWhatsAppSend = (p: RadarLocalProspect) => {
    const primeiroNome = p.decisorPrincipal.split(" ")[0];
    const saudacao = `Olá ${primeiroNome}, tudo bem? Sou o Fabrício da Prospera Planejamento / Consórcio Magalu.`;
    const mensagem = `${saudacao}\n\nVi a atuação de destaque da ${p.nomeFantasia} em ${p.cidade} e preparei um estudo estratégico de expansão sem juros bancários.\n\nSimulamos para sua empresa uma carta de R$ ${p.valorCredito.toLocaleString("pt-BR")},00 com Meia Parcela de R$ ${p.parcela5050.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} até a contemplação e lance embutido de ${p.lanceEmbutidoPct}%.\n\nPodemos falar 2 minutinhos hoje para eu lhe apresentar os números?`;

    const encoded = encodeURIComponent(mensagem);
    const cleanPhone = p.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, "_blank");
  };

  const selecionadosCount = prospects.filter((p) => p.selecionado).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6 md:p-8 rounded-[28px] border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
              <MapPin className="h-6 w-6" />
            </span>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Radar de Prospecção por Cidade
                <Badge className="bg-blue-600 text-white text-[10px] uppercase font-black tracking-wider px-2 py-0.5">
                  Maps & CNPJs
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Varredura geolocalizada no Google Maps com cruzamento de CNPJs, Quadro de Sócios (QSA) e proposta de meia parcela 50/50.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* PAINEL DE CONTROLE DE BUSCA GEOGRÁFICA */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* CIDADE */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-600" /> Cidade Alvo
              </label>
              <Input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex: Curitiba, Cascavel, Joinville..."
                className="bg-white font-bold text-slate-900 h-10 rounded-xl"
              />
            </div>

            {/* ESTADO */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider">
                UF
              </label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ESTADOS_BRASIL.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            {/* SEGMENTO DE CONSÓRCIO */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider">
                Carta Consórcio
              </label>
              <select
                value={segmento}
                onChange={(e) => setSegmento(e.target.value as any)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pesados">🚛 Pesados / Frotas</option>
                <option value="imovel">🏢 Imóveis / Galpões</option>
                <option value="veiculo">🚗 Veículos / Leves</option>
              </select>
            </div>

            {/* BOTÃO PROSPECTAR */}
            <div className="md:col-span-2">
              <Button
                onClick={handleBuscar}
                disabled={loading}
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* CHIPS DE NICHOS RÁPIDOS */}
          <div className="pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Nichos Comerciais Populares (Clique para selecionar):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {NICHOS_POPULARES.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNichoChange(n.id)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all border ${
                    nichoSelecionado === n.id && !nichoLivre
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-400"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LISTAGEM DE RESULTADOS */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {prospects.length > 0
                  ? `${prospects.length} Empresas Identificadas em ${cidade} - ${uf}`
                  : "Empresas Encontradas"}
              </h3>
            </div>

            {prospects.length > 0 && (
              <button
                onClick={handleToggleSelectAll}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
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
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                Varrendo Google Maps e cruzando CNPJs com a Receita Federal em {cidade}...
              </p>
              <p className="text-xs text-slate-400">
                Localizando estabelecimentos, quadro societário (QSA) e simulando parcelas 50/50.
              </p>
            </div>
          )}

          {!loading && prospects.length === 0 && (
            <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6">
              <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">
                Pronto para mapear sua região!
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Escolha a cidade, o estado e o nicho desejado acima e clique em <b>Buscar</b> para trazer empresas, sócios e contatos para o seu funil.
              </p>
            </div>
          )}

          {!loading &&
            prospects.map((p) => (
              <div
                key={p.id}
                onClick={() => handleToggleSelect(p.id)}
                className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer ${
                  p.selecionado
                    ? "bg-blue-50/40 border-blue-400 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* DADOS DA EMPRESA E SÓCIOS */}
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={p.selecionado}
                      onChange={() => handleToggleSelect(p.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />

                    <div className="space-y-2 flex-1">
                      {/* TÍTULO E BADGES */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-black text-slate-900">
                          {p.nomeFantasia}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold text-slate-600 bg-white">
                          CNPJ: {p.cnpj}
                        </Badge>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-black uppercase">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Ativa na Receita
                        </Badge>
                        {p.avaliacaoGoogle && (
                          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            ⭐ {p.avaliacaoGoogle} ({p.totalAvaliacoes} no Maps)
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 font-mono">
                        Razão Social: {p.razaoSocial} • Capital:{" "}
                        <b className="text-slate-800">
                          {p.capitalSocial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </b>
                      </p>

                      {/* QUADRO DE SÓCIOS (QSA) */}
                      <div className="bg-slate-100/70 p-2.5 rounded-xl border border-slate-200/60 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="text-[11px] font-black text-blue-900 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-blue-600" /> Decisor: {p.decisorPrincipal}
                        </span>
                        {p.socios.length > 1 && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            +{p.socios.length - 1} outro(s) sócio(s) cadastrado(s)
                          </span>
                        )}
                      </div>

                      {/* ENDEREÇO E MAPS */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" /> {p.endereco}
                        </span>
                        {p.googleMapsUrl && (
                          <a
                            href={p.googleMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                          >
                            Abrir no Google Maps <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      {/* SIMULAÇÃO DE CONSÓRCIO E MEIA PARCELA */}
                      <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 text-xs text-blue-950 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold">
                            💰 Crédito: R$ {p.valorCredito.toLocaleString("pt-BR")},00 em {p.prazoMeses} meses
                          </span>
                          <span className="font-black text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                            Meia Parcela: R$ {p.parcela5050.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic">
                          "{p.ganchoAbordagem}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* BOTÃO CHAT WHATSAPP DIRETO */}
                  <div className="md:self-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleWhatsAppSend(p)}
                      className="w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all"
                      title="Chamar o Sócio no WhatsApp com proposta de 50/50"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      Chamar Decisor
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
              <b>{selecionadosCount}</b> de {prospects.length} empresas selecionadas para entrar na <b>1ª Coluna ("Novo Lead")</b> do Funil.
            </div>

            <Button
              onClick={handleImportToFunil}
              disabled={salvando || selecionadosCount === 0}
              className="w-full sm:w-auto h-11 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25"
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
