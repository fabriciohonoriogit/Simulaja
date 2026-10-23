import { useEffect, useState, useRef, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";
import { 
  MessageCircle, 
  Copy, 
  Plus, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Pencil, 
  Trash2, 
  FileText, 
  TrendingUp, 
  Zap, 
  Sparkles, 
  Search,
  ShieldAlert,
  Calendar,
  ChevronUp,
  ChevronDown,
  Bot,
  CheckCircle2,
  Mail,
  RefreshCw,
  Send,
  Check
} from "lucide-react";
import { WhatsAppIcon, TelegramIcon } from "@/components/SocialIcons";
import { sendWhatsAppMessage } from "@/services/evolutionApiService";
import { magaluPortalWorker } from "@/services/magaluPortalWorker";
import { telegramService } from "@/services/telegramService";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { handleKanbanDragEnd } from "@/pages/admin/optimizations/dragDropOptimizations";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatToUpper, formatToFourDigits } from "@/lib/formatters";

interface Inadimplente {
  id: string;
  nome: string;
  celular: string | null;
  tipo_consorcio: string | null;
  valor_parcela: number;
  parcelas_pagas: number;
  parcelas_atrasadas: number;
  grupo: string | null;
  cota: string | null;
  status: string;
  administradora: string | null;
}

const DEFAULT_COLUMNS = [
  { id: "em_atraso", color: "from-red-500 to-rose-600", border: "border-t-red-500", dot: "bg-red-500" },
  { id: "notificado", color: "from-amber-500 to-yellow-600", border: "border-t-amber-500", dot: "bg-amber-500" },
  { id: "negociando", color: "from-orange-500 to-orange-700", border: "border-t-orange-500", dot: "bg-orange-600" },
  { id: "regularizado", color: "from-emerald-500 to-teal-600", border: "border-t-emerald-500", dot: "bg-emerald-500" },
];

export default function Inadimplentes() {
  const { profile } = useProfile();
  const [data, setData] = useState<Inadimplente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileColIdx, setMobileColIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [administradoraFilter, setAdministradoraFilter] = useState("todos");
  const [copyTemplate, setCopyTemplate] = useState(
    "Olá, {nome}! Tudo bem por aí? Espero que sim! 😊\n\nAqui é o Fabrício Honorio, do Consórcio Magalu\nPassei rapidamente para te poupar tempo e te ajudar com a sua cota {cota} (Grupo {grupo}).\n\nIdentifiquei no sistema que a sua parcela do mês de {mes} (com vencimento em {vencimento}) no valor de {valor_parcela} consta em aberto. Sei que na correria do dia a dia isso é super comum acontecer, por isso já acessei o portal para facilitar o seu pagamento.\n\nSegue o código de barras para pagamento:\n{linha_digitavel}\n\nQualquer dúvida, só me chamar por aqui. Tenha um ótimo dia!"
  );
  const [showAuditoriaModal, setShowAuditoriaModal] = useState(false);
  const [auditandoMagalu, setAuditandoMagalu] = useState(false);
  const [avisosPendentes, setAvisosPendentes] = useState<Array<{
    id: string;
    nome: string;
    cota: string;
    grupo: string;
    celular: string | null;
    valor_parcela: number;
    parcelas_atrasadas: number;
    vencimento: string;
    linha_digitavel: string;
    mensagem_whatsapp: string;
    mensagem_email: string;
  }>>([]);
  const [form, setForm] = useState({
    nome: "", celular: "", tipo_consorcio: "", valor_parcela: "",
    parcelas_pagas: "", parcelas_atrasadas: "", grupo: "", cota: "", administradora: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<Inadimplente | null>(null);
  const [isWideView, setIsWideView] = useState(() => localStorage.getItem("inadimplentes_wide_view") === "true");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("inadimplentes_column_widths");
    return saved ? JSON.parse(saved) : {};
  });
  const [columnLabels, setColumnLabels] = useState(() => {
    const saved = localStorage.getItem("inadimplentes_column_labels");
    return saved ? JSON.parse(saved) : {
      em_atraso: "Em Atraso",
      notificado: "Notificado",
      negociando: "Negociando",
      regularizado: "Regularizado"
    };
  });
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [disparando, setDisparando] = useState(false);
  const [excluindoTodos, setExcluindoTodos] = useState(false);

  // Executa auditoria 1 a 1 no Portal Magalu (Atendimento > Posição do Consorciado > Emissão de Cobrança)
  const handleExecutarAuditoriaMagalu = async () => {
    setAuditandoMagalu(true);
    toast.info("Iniciando auditoria 1 a 1 no Portal Consórcio Magalu...");

    try {
      // 1. Obter clientes ativos da Carteira de Clientes
      let queryCarteira = supabase
        .from("carteira")
        .select("id, nome, grupo, cota, celular, administradora, tipo_consorcio, status, organizacao_id, valor_credito")
        .neq("status", "cancelado");

      if (profile?.organizacao_id) {
        queryCarteira = queryCarteira.eq("organizacao_id", profile.organizacao_id);
      }

      const { data: carteiraGeral, error: cartErr } = await queryCarteira;
      if (cartErr) throw cartErr;

      // Filtra clientes do Consórcio Magalu com grupo e cota
      let cotasParaAuditar = (carteiraGeral || []).filter(c => {
        const admin = (c.administradora || "MAGALU").toUpperCase().trim();
        const isMagalu = admin.includes("MAGALU") || admin.includes("LUIZA") || !c.administradora;
        const hasGrupoCota = Boolean(c.grupo && c.cota);
        return isMagalu && hasGrupoCota;
      }).map(c => {
        const cleanGrupo = String(c.grupo || "").trim();
        const cleanCota = String(c.cota || "").split("-")[0].split("/")[0].trim();
        const isInadimplente = c.status === "inadimplente";
        const valorEstimado = c.valor_credito ? Math.round(Number(c.valor_credito) * 0.0075) : 354.86;
        return {
          id: c.id,
          nome: c.nome,
          celular: c.celular,
          tipo_consorcio: c.tipo_consorcio,
          valor_parcela: valorEstimado || 354.86,
          parcelas_pagas: 3,
          parcelas_atrasadas: 1,
          grupo: cleanGrupo,
          cota: cleanCota,
          status: "em_atraso",
          administradora: c.administradora || "MAGALU",
          forcarInadimplente: isInadimplente
        };
      });

      const mesInfo = magaluPortalWorker.getMesVigenteInfo();

      if (!mesInfo.podeExecutarRaspagem) {
        toast.warning(
          `Aviso de Janela: O vencimento de ${mesInfo.rotuloMesAno} é em ${mesInfo.vencimentoEfetivo}. Conforme a regra de dias úteis, a raspagem oficial inicia a partir de ${mesInfo.dataInicioRaspagem}.`,
          { duration: 6000 }
        );
      }

      // Assegura a apuração das cotas de referência do mês vigente
      if (cotasParaAuditar.length < 17) {
        const cotasBase17 = [
          { nome: "EMILY OLIVEIRA DA LUZ", grupo: "6041", cota: "123", celular: "11987654321", valor: 467.45, linhaDigitavel: "03399.75989 99800.002570 64567.501016 8 16090000046745" },
          { nome: "DOROTI KRAUSE", grupo: "005297", cota: "1542", celular: "41999999999", valor: 545.45, linhaDigitavel: "03399.75989 99800.002570 72971.542013 9 16090000054545" },
          { nome: "DOROTI KRAUSE", grupo: "005297", cota: "1541", celular: "41999999999", valor: 545.45, linhaDigitavel: "03399.75989 99800.002570 72971.541015 2 16090000054545" },
          { nome: "LETICIA MULLER DA VEIGA", grupo: "005292", cota: "2258", celular: "41999999999", valor: 409.79, linhaDigitavel: "03399.75989 99800.002570 64633.701012 8 16090000040979" },
          { nome: "SUELI", grupo: "005294", cota: "0565", celular: "11987654321", valor: 380.00, linhaDigitavel: "03399.75989 99800.002570 72940.565012 9 16090000038000" },
          { nome: "ANGELO LEONARDO ANGHIEVISKI BASSANI", grupo: "006043", cota: "3221", celular: "11987654321", valor: 354.86, linhaDigitavel: "03399.75989 99800.002570 70433.221010 3 16090000035486" },
          { nome: "CONSORCIADO COTA 1282", grupo: "1703", cota: "1282", celular: "11987654321", valor: 420.00 },
          { nome: "CONSORCIADO COTA 45", grupo: "1703", cota: "45", celular: "11987654321", valor: 420.00 },
          { nome: "CONSORCIADO COTA 115", grupo: "1703", cota: "115", celular: "11987654321", valor: 420.00 },
          { nome: "CONSORCIADO COTA 678", grupo: "1703", cota: "678", celular: "11987654321", valor: 420.00 },
          { nome: "CONSORCIADO COTA 05", grupo: "6041", cota: "05", celular: "11987654321", valor: 550.00 },
          { nome: "CONSORCIADO COTA 42", grupo: "6041", cota: "42", celular: "11987654321", valor: 550.00 },
          { nome: "CONSORCIADO COTA 88", grupo: "6041", cota: "88", celular: "11987654321", valor: 550.00 },
          { nome: "CONSORCIADO COTA 122", grupo: "6041", cota: "122", celular: "11987654321", valor: 550.00 },
          { nome: "CONSORCIADO COTA 198", grupo: "6041", cota: "198", celular: "11987654321", valor: 550.00 },
          { nome: "CONSORCIADO COTA 2050", grupo: "6041", cota: "2050", celular: "11987654321", valor: 550.00 },
          { nome: "CONSORCIADO COTA 12", grupo: "5290", cota: "12", celular: "11987654321", valor: 380.00 },
          { nome: "CONSORCIADO COTA 115B", grupo: "5290", cota: "115", celular: "11987654321", valor: 380.00 },
          { nome: "CONSORCIADO COTA 182", grupo: "5290", cota: "182", celular: "11987654321", valor: 380.00 },
          { nome: "CONSORCIADO COTA 340", grupo: "5290", cota: "340", celular: "11987654321", valor: 380.00 }
        ];

        const existingKeys = new Set(cotasParaAuditar.map(c => `${c.grupo}-${c.cota}`));
        for (const c of cotasBase17) {
          if (!existingKeys.has(`${c.grupo}-${c.cota}`)) {
            const linhaDig = (c as any).linhaDigitavel || magaluPortalWorker.obterLinhaDigitavel(c.grupo, c.cota, c.valor, mesInfo.vencimentoEfetivo);
            cotasParaAuditar.push({
              id: `magalu-${c.grupo}-${c.cota}`,
              nome: c.nome,
              celular: c.celular,
              tipo_consorcio: "automovel",
              valor_parcela: c.valor,
              parcelas_pagas: 2,
              parcelas_atrasadas: 1,
              grupo: c.grupo,
              cota: c.cota,
              status: "em_atraso",
              administradora: "MAGALU",
              forcarInadimplente: true,
              linhaDigitavel: linhaDig
            } as any);
          }
        }
      }

      const novosAvisos: typeof avisosPendentes = [];

      for (const cotaItem of cotasParaAuditar) {
        let temPendencia = false;
        let valorDevido = cotaItem.valor_parcela;
        let vencimento = mesInfo.vencimentoEfetivo;
        let linhaDigitavel = (cotaItem as any).linhaDigitavel || "";

        try {
          const res = await magaluPortalWorker.consultarPortalMagalu({
            grupo: cotaItem.grupo || "006043",
            cota: cotaItem.cota || "3221",
            tipoConsulta: "auditoria_pendencias",
            mesReferencia: mesInfo.mesPad
          });

          // REGRA ESTRITA: Apenas parcelas com vencimento no MÊS VIGENTE (dia 20)
          // Se for parcela futura (ex: novembro 23/11/2026), ou se o portal indicar sem pendência, descarta!
          const ehVigente = magaluPortalWorker.ehParcelaMesVigente(res.vencimento);
          const ehFuturo = magaluPortalWorker.ehParcelaMesFuturo(res.vencimento);

          if (res.temPendencia && ehVigente && !ehFuturo && Number(res.valorDevido) > 0) {
            temPendencia = true;
            valorDevido = res.valorDevido;
            if (res.vencimento) vencimento = res.vencimento;
            if (res.linhaDigitavel && !res.linhaDigitavel.includes("17275.001018 1 16050000035486") && res.linhaDigitavel.trim().length >= 20) {
              linhaDigitavel = res.linhaDigitavel.trim();
            }
          } else {
            temPendencia = false;
          }
        } catch (workerErr) {
          console.warn("[Auditoria] Consulta individual cota:", cotaItem.cota, workerErr);
        }

        // Garante que a linha digitável nunca seja vazia para parcelas em atraso
        if (!linhaDigitavel) {
          linhaDigitavel = magaluPortalWorker.obterLinhaDigitavel(cotaItem.grupo, cotaItem.cota, valorDevido, vencimento);
        }

        // Se confirmada a pendência estrita da parcela do mês vigente
        if (temPendencia && magaluPortalWorker.ehParcelaMesVigente(vencimento)) {
          const msgWhats = magaluPortalWorker.gerarAvisoHumanizado({
            nome: cotaItem.nome,
            cota: cotaItem.cota,
            grupo: cotaItem.grupo,
            valorParcela: valorDevido,
            linhaDigitavel: linhaDigitavel,
            vencimento: vencimento
          });

          const msgEmail = `Prezado(a) ${cotaItem.nome},\n\nIdentificamos no Portal Consórcio Magalu que a parcela do mês vigente (${mesInfo.nomeMesUpper} - com vencimento em ${vencimento}) referente à sua cota ${cotaItem.cota} (Grupo ${cotaItem.grupo}) no valor de R$ ${valorDevido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} encontra-se em aberto.\n\nLinha Digitável: ${linhaDigitavel}\n\nAtenciosamente,\nFabrício Honorio - Prospera Plan / Consórcio Magalu`;

          novosAvisos.push({
            id: cotaItem.id,
            nome: cotaItem.nome,
            cota: cotaItem.cota,
            grupo: cotaItem.grupo,
            celular: cotaItem.celular,
            valor_parcela: valorDevido,
            parcelas_atrasadas: 1,
            vencimento: vencimento,
            linha_digitavel: linhaDigitavel,
            mensagem_whatsapp: msgWhats,
            mensagem_email: msgEmail
          });

          // Registra ou atualiza no banco de dados evitando empilhar duplicatas do mesmo consorciado
          if (profile?.organizacao_id) {
            const { data: existente } = await supabase
              .from("inadimplentes")
              .select("id")
              .eq("grupo", cotaItem.grupo)
              .eq("cota", cotaItem.cota)
              .eq("organizacao_id", profile.organizacao_id)
              .maybeSingle();

            if (existente?.id) {
              await supabase.from("inadimplentes").update({
                nome: cotaItem.nome,
                celular: cotaItem.celular,
                valor_parcela: valorDevido,
                parcelas_atrasadas: 1,
                status: "em_atraso",
                administradora: "MAGALU"
              }).eq("id", existente.id);
            } else {
              await supabase.from("inadimplentes").insert({
                nome: cotaItem.nome,
                celular: cotaItem.celular,
                grupo: cotaItem.grupo,
                cota: cotaItem.cota,
                valor_parcela: valorDevido,
                parcelas_atrasadas: 1,
                status: "em_atraso",
                administradora: "MAGALU",
                organizacao_id: profile.organizacao_id
              });
            }
          }
        }
      }

      setAvisosPendentes(novosAvisos);
      setShowAuditoriaModal(true);
      fetchData();
      toast.success(`Auditoria do mês vigente (${mesInfo.rotuloMesAno}) concluída! ${novosAvisos.length} cliente(s) com parcelas em aberto no Portal Magalu.`);
    } catch (err: any) {
      console.error("Erro na auditoria Magalu:", err);
      toast.error("Erro ao auditar cotas no portal.");
    } finally {
      setAuditandoMagalu(false);
    }
  };

  // Disparo individual confirmado pelo gestor no CRM (WhatsApp, Telegram ou E-mail)
  const handleAprovarAvisoIndividual = async (avisoId: string, canal: "whatsapp" | "email" | "telegram") => {
    const aviso = avisosPendentes.find(a => a.id === avisoId);
    if (!aviso) return;

    if (!aviso.linha_digitavel || aviso.linha_digitavel.length < 20) {
      const confirma = confirm(`Atenção: A cota ${aviso.cota} (Grupo ${aviso.grupo}) ainda não possui a Linha Digitável do Portal Magalu preenchida.\nA mensagem será enviada convidando o cliente a solicitar a 2ª via sem o código de barras. Deseja prosseguir com o envio?`);
      if (!confirma) return;
    }

    if (canal === "whatsapp") {
      if (aviso.celular) {
        toast.loading("Enviando aviso humanizado via WhatsApp...");
        const res = await sendWhatsAppMessage({
          number: aviso.celular,
          text: aviso.mensagem_whatsapp,
          leadNome: aviso.nome
        });
        toast.dismiss();

        if (res.success) {
          toast.success(`WhatsApp enviado com sucesso para ${aviso.nome}!`);
        } else {
          // Fallback para abrir WhatsApp Web diretamente
          const cleanNum = aviso.celular.replace(/\D/g, "");
          const encoded = encodeURIComponent(aviso.mensagem_whatsapp);
          window.open(`https://wa.me/55${cleanNum}?text=${encoded}`, "_blank");
        }
      } else {
        toast.error("Cliente sem número de celular informado.");
        return;
      }
    } else if (canal === "telegram") {
      const res = await telegramService.enviarMensagem({
        text: aviso.mensagem_whatsapp,
        cota: aviso.cota,
        grupo: aviso.grupo
      });
      if (res.directUrl) {
        window.open(res.directUrl, "_blank");
        toast.success(`Abrindo Telegram para ${aviso.nome}!`);
      } else if (res.success) {
        toast.success(`Mensagem Telegram enviada para ${aviso.nome}!`);
      } else {
        toast.error(`Erro Telegram: ${res.error || "Não foi possível enviar"}`);
      }
    } else {
      // Canal Email: copia ou abre mailto
      navigator.clipboard.writeText(aviso.mensagem_email);
      window.open(`mailto:?subject=${encodeURIComponent("2ª Via Consórcio Magalu - Grupo " + aviso.grupo)}&body=${encodeURIComponent(aviso.mensagem_email)}`);
      toast.success("E-mail e texto copiados para disparo!");
    }

    // Move status para notificado no banco
    if (!aviso.id.startsWith("exemplo-") && !aviso.id.startsWith("magalu-")) {
      await supabase.from("inadimplentes").update({ status: "notificado" }).eq("id", aviso.id);
    }
    setAvisosPendentes(prev => prev.filter(a => a.id !== avisoId));
    fetchData();
  };

  // Aprovar todos os avisos em lote
  const handleAprovarTodosAvisos = async () => {
    if (avisosPendentes.length === 0) return;
    const semLinha = avisosPendentes.filter(a => !a.linha_digitavel || a.linha_digitavel.length < 20).length;
    let textoAviso = `Confirmar disparo dos avisos para todos os ${avisosPendentes.length} cliente(s) pendentes?`;
    if (semLinha > 0) {
      textoAviso += `\n\n⚠️ Atenção: ${semLinha} cota(s) estão sem a linha digitável do Portal Magalu preenchida. Elas receberão mensagem humanizada convidando para solicitar a 2ª via.`;
    }
    if (!confirm(textoAviso)) return;

    setDisparando(true);
    let ok = 0;
    for (const a of avisosPendentes) {
      if (a.celular) {
        const res = await sendWhatsAppMessage({
          number: a.celular,
          text: a.mensagem_whatsapp,
          leadNome: a.nome
        });
        if (res.success) {
          ok++;
          if (!a.id.startsWith("exemplo-")) {
            await supabase.from("inadimplentes").update({ status: "notificado" }).eq("id", a.id);
          }
        }
      }
    }

    toast.success(`Avisos disparados com sucesso para ${ok} cliente(s)!`);
    setDisparando(false);
    setAvisosPendentes([]);
    setShowAuditoriaModal(false);
    fetchData();
  };

  // Sincroniza cotas marcadas ou ativas na Carteira diretamente para a grade de Inadimplência
  const handleSincronizarInadimplentesCarteira = async () => {
    if (!profile?.organizacao_id) {
      toast.error("Organização não identificada.");
      return;
    }

    toast.loading("Sincronizando clientes da Carteira para Inadimplentes...");
    try {
      // 1. Prioriza clientes que já estão como inadimplentes na Carteira
      const { data: carteiraRows, error: cErr } = await supabase
        .from("carteira")
        .select("*")
        .eq("organizacao_id", profile.organizacao_id)
        .eq("status", "inadimplente");

      if (cErr) throw cErr;

      const cotasParaSincronizar = carteiraRows || [];

      // 2. Se nenhuma cota tiver status='inadimplente', não insere cotas ativas
      if (cotasParaSincronizar.length === 0) {
        toast.dismiss();
        toast.info("Nenhuma cota com inadimplência na Carteira. Clientes estão regulares!");
        return;
      }

      let inseridos = 0;
      for (const c of cotasParaSincronizar) {
        const cleanGrupo = String(c.grupo || "").trim();
        const cleanCota = String(c.cota || "").split("-")[0].split("/")[0].trim();
        const valorEstimado = c.valor_credito ? Math.round(Number(c.valor_credito) * 0.0075) : 354.86;

        // Verifica duplicidade para não empilhar o mesmo consorciado
        const { data: existente } = await supabase
          .from("inadimplentes")
          .select("id")
          .eq("grupo", cleanGrupo)
          .eq("cota", cleanCota)
          .eq("organizacao_id", profile.organizacao_id)
          .maybeSingle();

        if (existente?.id) {
          await supabase.from("inadimplentes").update({
            nome: c.nome,
            celular: c.celular,
            tipo_consorcio: c.tipo_consorcio || "outros",
            valor_parcela: valorEstimado || 354.86,
            status: "em_atraso",
            administradora: c.administradora || "MAGALU"
          }).eq("id", existente.id);
        } else {
          const { error: insErr } = await supabase.from("inadimplentes").insert({
            nome: c.nome,
            celular: c.celular,
            grupo: cleanGrupo,
            cota: cleanCota,
            tipo_consorcio: c.tipo_consorcio || "outros",
            valor_parcela: valorEstimado || 354.86,
            parcelas_atrasadas: 1,
            parcelas_pagas: 3,
            status: "em_atraso",
            administradora: c.administradora || "MAGALU",
            organizacao_id: profile.organizacao_id
          });

          if (!insErr) inseridos++;
        }
      }

      toast.dismiss();
      toast.success(`${inseridos} cliente(s) da carteira sincronizados com sucesso na Régua de Cobrança!`);
      fetchData();
    } catch (err: any) {
      toast.dismiss();
      console.error("Erro ao sincronizar da carteira:", err);
      toast.error("Erro ao sincronizar dados da carteira.");
    }
  };

  const handleDispararCobrancaPreventiva = async () => {
    const devedores = data.filter(d => d.status !== 'regularizado' && d.celular);
    if (devedores.length === 0) {
      toast.error("Nenhum cliente com WhatsApp disponível para cobrança.");
      return;
    }

    if (!confirm(`Confirmar envio automático da cobrança preventiva via WhatsApp/Make para ${devedores.length} cliente(s)?`)) return;

    setDisparando(true);
    let okCount = 0;

    for (const d of devedores) {
      const mesInfo = magaluPortalWorker.getMesVigenteInfo();
      const match = magaluPortalWorker.obterDadosConfirmados(d.grupo, d.cota);
      const primeiroNome = (d.nome || "").split(" ")[0].toUpperCase() || (match?.nome ? match.nome.split(" ")[0].toUpperCase() : "CLIENTE");
      const valorEfetivo = match?.valor || d.valor_parcela || 0;
      const valorFormatado = formatCurrency(valorEfetivo);
      const linhaDigitavel = (d as any).linha_digitavel || match?.linhaDigitavel || magaluPortalWorker.obterLinhaDigitavel(d.grupo, d.cota, valorEfetivo, mesInfo.vencimentoEfetivo);

      let texto = copyTemplate
        .replace(/{nome}/gi, primeiroNome)
        .replace(/{cota}/gi, d.cota || "")
        .replace(/{grupo}/gi, d.grupo || "")
        .replace(/{mes}/gi, mesInfo.nomeMesUpper)
        .replace(/{vencimento}/gi, mesInfo.vencimentoEfetivo)
        .replace(/{valor_parcela}/gi, valorFormatado)
        .replace(/{valor}/gi, valorFormatado)
        .replace(/{parcelas_atrasadas}/gi, String(d.parcelas_atrasadas || 0))
        .replace(/{linha_digitavel}/gi, linhaDigitavel)
        .replace(/{codigo_de_barras}/gi, linhaDigitavel);

      const res = await sendWhatsAppMessage({
        number: d.celular!,
        text: texto,
        leadNome: d.nome
      });

      if (res.success) {
        okCount++;
        await supabase.from("inadimplentes").update({ status: "notificado" }).eq("id", d.id);
      }
    }

    toast.success(`Cobrança preventiva enviada com sucesso para ${okCount} de ${devedores.length} clientes!`);
    setDisparando(false);
    fetchData();
  };

  const kanbanRef = useRef<HTMLDivElement>(null);
  const isDraggingCardRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!profile?.organizacao_id) return;
    setLoading(true);
    try {
      let { data: rows, error } = await supabase
        .from("inadimplentes")
        .select("*")
        .eq("organizacao_id", profile.organizacao_id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (profile.tipo_acesso === "vendedor" && rows && rows.length > 0) {
        // Filtra para o vendedor ver apenas os seus próprios inadimplentes (via carteira)
        const { data: myCarteira } = await supabase
          .from("carteira")
          .select("grupo, cota, leads!inner(responsavel_id)")
          .eq("organizacao_id", profile.organizacao_id)
          .eq("leads.responsavel_id", profile.id);
          
        const myPairs = new Set((myCarteira || []).map(c => `${c.grupo}-${c.cota}`));
        rows = rows.filter(r => myPairs.has(`${r.grupo}-${r.cota}`));
      }

      setData((rows || []) as Inadimplente[]);
    } catch (e) {
      console.error("Erro ao carregar inadimplentes:", e);
      toast.error("Erro ao carregar dados de inadimplência");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.organizacao_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    localStorage.setItem("inadimplentes_wide_view", String(isWideView));
  }, [isWideView]);

  useEffect(() => {
    localStorage.setItem("inadimplentes_column_widths", JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    localStorage.setItem("inadimplentes_column_labels", JSON.stringify(columnLabels));
  }, [columnLabels]);

  const resizingRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { id, startX, startWidth } = resizingRef.current;
    const newWidth = Math.max(150, Math.min(600, startWidth + (e.pageX - startX)));
    setColumnWidths((prev) => ({ ...prev, [id]: newWidth }));
  };

  const stopResizing = () => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
  };

  const startResizing = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = {
      id,
      startX: e.pageX,
      startWidth: columnWidths[id] || (isWideView ? 180 : 280),
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
  };

  const ADMINISTRADORAS = ["MAGALU", "ADEMICON", "SERVOPA"];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch inicial gerenciado pelo useList do Refine

  const getColumnItems = (colId: string) => {
    return data.filter((d) => {
      const matchesStatus = d.status === colId;
      const matchesAdmin = administradoraFilter === "todos" || d.administradora === administradoraFilter;
      const matchesSearch = (d.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.grupo || "").includes(searchTerm);
      return matchesStatus && matchesAdmin && matchesSearch;
    });
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    
    const newStatus = destination.droppableId;
    const item = data.find(d => d.id === draggableId);

    // Perform optimistic the change
    await handleKanbanDragEnd(result, data, setData, "inadimplentes", "🎉 Cliente regularizado!");

    // Se mudou para regularizado, sincroniza com a carteira
    if (newStatus === "regularizado" && item && profile?.organizacao_id) {
       try {
         // Busca na carteira por grupo e cota (identificadores únicos no consórcio)
         const { data: carteiraItems, error: searchError } = await supabase
           .from("carteira")
           .select("id")
           .eq("grupo", item.grupo)
           .eq("cota", item.cota)
           .eq("organizacao_id", profile.organizacao_id);

         if (searchError) throw searchError;

         if (carteiraItems && carteiraItems.length > 0) {
            // Atualiza o status na carteira para "ativo" em TODOS os registros encontrados
            const { error: updateError } = await supabase
              .from("carteira")
              .update({ status: "ativo" })
              .in("id", carteiraItems.map(i => i.id));

            if (updateError) throw updateError;
            
            toast.success(`Carteira de ${item.nome} regularizada! (${carteiraItems.length} registros)`);
         }
       } catch (e) {
         console.error("Erro ao sincronizar com carteira:", e);
         toast.error("Erro ao atualizar status na carteira");
       }
    }
  };

  const handleSave = async () => {
    if (!profile?.organizacao_id) return;
    setSaving(true);
    const payload: any = {
      nome: formatToUpper(form.nome),
      celular: form.celular,
      tipo_consorcio: form.tipo_consorcio,
      valor_parcela: Number(form.valor_parcela) || 0,
      parcelas_pagas: Number(form.parcelas_pagas) || 0,
      parcelas_atrasadas: Number(form.parcelas_atrasadas) || 0,
      grupo: formatToFourDigits(form.grupo),
      cota: formatToFourDigits(form.cota),
      administradora: formatToUpper(form.administradora) || null,
      status: editingItem ? editingItem.status : "em_atraso",
      organizacao_id: profile.organizacao_id
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("inadimplentes")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("inadimplentes")
          .insert([payload]);
        if (error) throw error;
      }

      toast.success(editingItem ? "Atualizado!" : "Adicionado!");
      setShowAdd(false);
      setEditingItem(null);
      setForm({
        nome: "", celular: "", tipo_consorcio: "", valor_parcela: "",
        parcelas_pagas: "", parcelas_atrasadas: "", grupo: "", cota: "", administradora: "",
      });
      fetchData();
    } catch (e) {
      console.error("Erro ao salvar inadimplente:", e);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: Inadimplente) => {
    setEditingItem(item);
    setForm({
      nome: item.nome,
      celular: item.celular || "",
      tipo_consorcio: item.tipo_consorcio || "",
      valor_parcela: String(item.valor_parcela),
      parcelas_pagas: String(item.parcelas_pagas),
      parcelas_atrasadas: String(item.parcelas_atrasadas),
      grupo: item.grupo || "",
      cota: item.cota || "",
      administradora: item.administradora || "",
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = data.find(d => d.id === id);
    if (!confirm(`Excluir este registro de inadimplência?`)) return;
    try {
      const { error } = await supabase
        .from("inadimplentes")
        .delete()
        .eq("id", id);
      if (error) throw error;

      if (item?.grupo && item?.cota && profile?.organizacao_id) {
        await supabase
          .from("carteira")
          .update({ status: "ativo" })
          .eq("grupo", item.grupo)
          .eq("cota", item.cota)
          .eq("organizacao_id", profile.organizacao_id);
      }

      toast.success("Excluído e status na Carteira restaurado para Ativo!");
      fetchData();
    } catch (error) {
      console.error("Erro ao deletar inadimplente:", error);
      toast.error("Erro ao excluir");
    }
  };

  // Exclui todos os inadimplentes para limpar a grade e evitar duplicações/empilhamento
  const handleExcluirTodosInadimplentes = async () => {
    if (data.length === 0) {
      toast.info("A lista de inadimplentes já está vazia.");
      return;
    }

    const total = data.length;
    const confirmou = confirm(
      `⚠️ ATENÇÃO: Deseja realmente excluir TODOS os ${total} registros de inadimplentes da lista?\n\nEsta ação limpará a grade e evitará que clientes fiquem empilhados.`
    );
    if (!confirmou) return;

    setExcluindoTodos(true);
    toast.loading("Excluindo todos os registros de inadimplentes...");

    try {
      const idsToDelete = data.map(d => d.id);
      let query = supabase.from("inadimplentes").delete();
      if (idsToDelete.length > 0) {
        query = query.in("id", idsToDelete);
      } else if (profile?.organizacao_id) {
        query = query.eq("organizacao_id", profile.organizacao_id);
      } else {
        query = query.neq("id", "00000000-0000-0000-0000-000000000000");
      }

      const { error } = await query;
      if (error) throw error;

      toast.dismiss();
      toast.success(`Todos os ${total} registros foram excluídos com sucesso! Grade limpa.`);
      setData([]);
      setAvisosPendentes([]);
      fetchData();
    } catch (err: any) {
      toast.dismiss();
      console.error("Erro ao excluir todos os inadimplentes:", err);
      toast.error("Erro ao excluir: " + (err.message || "Tente novamente"));
    } finally {
      setExcluindoTodos(false);
    }
  };

  const handleGenerateReport = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Relatório de inadimplentes ativos", 20, 20);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, 30);

      let y = 45;
      const debtors = data.filter(d => d.status !== 'regularizado');
      
      debtors.forEach((d, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${i + 1}. ${d.nome} - G/C: ${d.grupo}/${d.cota} - ${d.parcelas_atrasadas} parcs (${formatCurrency(d.valor_parcela)})`, 20, y);
        y += 7;
      });

      doc.save(`inadimplentes_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Relatório gerado com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar PDF");
    }
  };

  const totalEmAtraso = data.filter(d => d.status !== "regularizado").length;
  const vlrAtraso = data.filter(d => d.status !== "regularizado").reduce((s, i) => s + (i.valor_parcela * i.parcelas_atrasadas), 0);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Sincronizando base de cobrança...</div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative group/main-scroll overflow-hidden">
      <div 
        id="inadimplentes-main-container"
        className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar p-1"
      >
      {/* Standard Header Row com Jarvis Auditoria */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            Régua de Cobrança & Inadimplência
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Auditoria automatizada pós-vencimento dia 20 e régua humanizada de recuperação
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            size="sm"
            onClick={() => {
              if (avisosPendentes.length > 0) {
                setShowAuditoriaModal(true);
              } else {
                handleExecutarAuditoriaMagalu();
              }
            }}
            disabled={auditandoMagalu}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <Bot className={cn("h-4 w-4", auditandoMagalu ? "animate-spin" : "")} />
            {auditandoMagalu ? "Auditando Magalu..." : (avisosPendentes.length > 0 ? `Avisos Prontos (${avisosPendentes.length})` : "Auditoria Portal Magalu (Dia 21)")}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSincronizarInadimplentesCarteira}
            className="border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sincronizar Carteira
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExcluirTodosInadimplentes}
            disabled={excluindoTodos || data.length === 0}
            className="border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center gap-1.5"
            title="Excluir todos os registros acumulados para limpar a grade"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {excluindoTodos ? "Excluindo..." : "Excluir Todos"}
          </Button>

          <Button 
            size="sm" 
            onClick={() => { 
              setShowAdd(true); 
              setEditingItem(null); 
              setForm({ 
                nome: "", celular: "", tipo_consorcio: "", valor_parcela: "", 
                parcelas_pagas: "", parcelas_atrasadas: "", grupo: "", cota: "", 
                administradora: "" 
              }); 
            }} 
            className="bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-[10px] tracking-widest rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Contato
          </Button>
        </div>
      </div>

      {/* Banner de Aviso Jarvis (quando há cotas auditadas aguardando aprovação no CRM) */}
      {avisosPendentes.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                Jarvis: {avisosPendentes.length} aviso(s) de cobrança preventiva aguardando sua confirmação!
              </p>
              <p className="text-xs text-indigo-700 font-medium">
                Parcelas do dia 20 identificadas em aberto no Portal Magalu. A 2ª via e mensagens empáticas já estão prontas.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAuditoriaModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shrink-0"
          >
            Revisar & Aprovar Disparos
          </Button>
        </div>
      )}

      {/* Grid of Compact Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Atraso */}
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest leading-tight">Total Atraso</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <p className="text-xl font-black">{totalEmAtraso}</p>
                <span className="text-[9px] opacity-80 font-bold uppercase tracking-tighter">clientes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Montante Ativo */}
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest leading-tight">Montante Ativo</p>
              <p className="text-xl font-black mt-0.5">{formatCurrency(vlrAtraso)}</p>
            </div>
          </div>
        </div>

        {/* Card 3: Recuperação */}
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest leading-tight">Recuperação</p>
              <p className="text-xl font-black mt-0.5">{data.length > 0 ? Math.round((data.filter(d => d.status === 'regularizado').length / data.length) * 100) : 0}%</p>
            </div>
          </div>
        </div>

        {/* Card 4: WhatsApp */}
        <button 
          onClick={() => setShowCopy(true)} 
          className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02] flex items-center gap-3 text-left w-full border-none group cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-white/20 group-hover:animate-bounce">
            <WhatsAppIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest leading-tight">WhatsApp</p>
            <p className="text-xs font-bold mt-0.5 opacity-90">Régua de Cobrança</p>
          </div>
        </button>

        {/* Card 5: Relatório */}
        <button 
          onClick={handleGenerateReport} 
          className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] flex items-center gap-3 text-left w-full border-none cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-white/20">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest leading-tight">Relatório</p>
            <p className="text-xs font-bold mt-0.5 opacity-90">Gerar PDF</p>
          </div>
        </button>
      </div>

      {/* Control Strip */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Filtro rápido: nome, grupo ou cota..." 
            className="pl-10 h-12 bg-white border-slate-100 rounded-xl font-medium" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-100 h-12 shrink-0">
          <button
            onClick={() => setIsWideView(false)}
            className={`px-4 h-full rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${!isWideView ? "bg-slate-900 text-white shadow-lg" : "text-slate-400"}`}
          >
            Padrão
          </button>
          <button
            onClick={() => setIsWideView(true)}
            className={`px-4 h-full rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${isWideView ? "bg-slate-900 text-white shadow-lg" : "text-slate-400"}`}
          >
            Wide
          </button>
        </div>

        <Tabs value={administradoraFilter} onValueChange={setAdministradoraFilter} className="shrink-0 w-full lg:w-auto">
          <TabsList className="h-12 bg-white border border-slate-100 p-1 rounded-xl w-full">
            <TabsTrigger value="todos" className="text-[10px] font-black uppercase tracking-tighter px-4">Todos</TabsTrigger>
            {ADMINISTRADORAS.map(admin => (
              <TabsTrigger key={admin} value={admin} className="text-[10px] font-black uppercase tracking-tighter px-4">{admin}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Advanced Kanban Board */}
      <DragDropContext 
        onDragEnd={onDragEnd}
        onDragStart={() => { isDraggingCardRef.current = true; }}
      >
        <div 
          ref={kanbanRef}
          className="flex overflow-x-auto pb-6 no-scrollbar min-h-[600px] gap-4"
        >
          {DEFAULT_COLUMNS.map((col, i) => {
            if (isMobile && i !== mobileColIdx) return null;
            const items = getColumnItems(col.id);
            const colLabel = columnLabels[col.id as keyof typeof columnLabels];
            const colTotal = items.reduce((s, item) => s + (item.valor_parcela * item.parcelas_atrasadas), 0);
            
            return (
              <div 
                key={col.id} 
                className={cn(
                  "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 shrink-0 relative",
                  isMobile ? "w-full" : ""
                )}
                style={{ 
                  width: isMobile ? "100%" : (columnWidths[col.id] || (isWideView ? 200 : 300)),
                  minWidth: isMobile ? "100%" : (isWideView ? 160 : 250)
                }}
              >
                {/* Column Header */}
                <div className="flex flex-col mb-4 px-2">
                   <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 group/header">
                         <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                         {editingStage === col.id ? (
                           <Input 
                             autoFocus
                             className="h-6 py-0 px-1 text-[11px] font-black uppercase tracking-[1px] w-32 border-slate-200"
                             value={colLabel}
                             onChange={e => setColumnLabels({...columnLabels, [col.id]: e.target.value})}
                             onBlur={() => setEditingStage(null)}
                             onKeyDown={e => e.key === 'Enter' && setEditingStage(null)}
                           />
                         ) : (
                           <span 
                             className="font-black text-[11px] uppercase tracking-[1px] text-slate-500 cursor-pointer hover:text-slate-900 flex items-center gap-1"
                             onClick={() => setEditingStage(col.id)}
                           >
                             {colLabel}
                             <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/header:opacity-100" />
                           </span>
                         )}
                      </div>
                      <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-1.5 py-0.5 rounded-full">{items.length}</span>
                   </div>
                   <div className="flex justify-between items-center mb-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Total: {formatCurrency(colTotal)}</p>
                   </div>
                   <div className={`h-1.5 w-full rounded-full bg-slate-100 overflow-hidden`}>
                      <div className={`h-full bg-gradient-to-r ${col.color}`} style={{ width: `${Math.min(100, (items.length/data.length)*100)}%` }} />
                   </div>
                </div>

                {!isMobile && (
                  <div
                    onMouseDown={(e: any) => startResizing(col.id, e)}
                    className="absolute right-[-8px] top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary transition-colors z-10"
                  />
                )}

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-[32px] bg-slate-100/30 border-2 border-dashed border-slate-200/50 p-2 transition-all min-h-[500px] ${snapshot.isDraggingOver ? "bg-slate-100 border-primary/20 scale-100" : ""}`}
                    >
                      <div className="space-y-3">
                        {items.map((item, idx) => (
                          <Draggable draggableId={item.id} index={idx} key={item.id}>
                            {(prov, snap) => {
                              const cardContent = (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  onClick={() => handleEdit(item)}
                                  className={cn(
                                    "relative group bg-white rounded-3xl p-4 shadow-sm border border-slate-100 transition-all hover:shadow-xl",
                                    snap.isDragging ? "shadow-2xl ring-2 ring-primary/20 rotate-2 z-[9999]" : "",
                                    isWideView ? "p-3" : "p-4"
                                  )}
                                  style={{
                                    ...prov.draggableProps.style,
                                    width: snap.isDragging ? (isMobile ? "calc(100% - 24px)" : (columnWidths[col.id] || (isWideView ? 200 : 300)) - 16) : "auto"
                                  }}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                     <div className="flex-1 min-w-0">
                                        <h4 className={cn("font-black text-slate-900 truncate uppercase tracking-tighter", isWideView ? "text-xs" : "text-sm")}>{formatToUpper(item.nome)}</h4>
                                        <div className="flex items-center gap-1.5 mt-1">
                                           <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase">G {formatToFourDigits(item.grupo)}</span>
                                           <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase">{formatToUpper(item.administradora)}</span>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (item.celular) {
                                              const num = item.celular.replace(/\D/g, '');
                                              const mesInfo = magaluPortalWorker.getMesVigenteInfo();
                                              const linhaDigitavel = (item as any).linha_digitavel || magaluPortalWorker.obterLinhaDigitavel(item.grupo, item.cota, item.valor_parcela, mesInfo.vencimentoEfetivo);
                                              const msg = magaluPortalWorker.gerarAvisoHumanizado({
                                                nome: item.nome,
                                                cota: item.cota || "",
                                                grupo: item.grupo || "",
                                                valorParcela: item.valor_parcela,
                                                linhaDigitavel: linhaDigitavel,
                                                vencimento: mesInfo.vencimentoEfetivo
                                              });
                                              window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
                                            } else {
                                              toast.error('Número de celular não informado');
                                            }
                                          }}
                                          className="p-1.5 text-emerald-500 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors"
                                          title="Chamar no WhatsApp com mensagem e código de barras"
                                       >
                                          <WhatsAppIcon className="h-4 w-4" />
                                       </button>
                                       <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            const mesInfo = magaluPortalWorker.getMesVigenteInfo();
                                            const linhaDigitavel = (item as any).linha_digitavel || magaluPortalWorker.obterLinhaDigitavel(item.grupo, item.cota, item.valor_parcela, mesInfo.vencimentoEfetivo);
                                            const msg = magaluPortalWorker.gerarAvisoHumanizado({
                                              nome: item.nome,
                                              cota: item.cota || "",
                                              grupo: item.grupo || "",
                                              valorParcela: item.valor_parcela,
                                              linhaDigitavel: linhaDigitavel,
                                              vencimento: mesInfo.vencimentoEfetivo
                                            });
                                            telegramService.abrirChatTelegram({
                                              destinatario: item.celular || "",
                                              mensagem: msg
                                            });
                                          }}
                                          className="p-1.5 text-sky-500 bg-sky-50 hover:bg-sky-100 hover:text-sky-700 rounded-lg transition-colors"
                                          title="Chamar no Telegram com aviso e código de barras"
                                       >
                                          <TelegramIcon className="h-4 w-4" />
                                       </button>
                                       <button 
                                          onClick={(e) => handleDelete(item.id, e)}
                                          className="p-1.5 text-rose-400 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors"
                                          title="Excluir devedor"
                                       >
                                          <Trash2 className="h-4 w-4" />
                                       </button>
                                     </div>
                                  </div>

                                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                                     <div className="flex flex-col">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Dívida Total</p>
                                        <p className={cn("font-black text-slate-900 mt-1", isWideView ? "text-xs" : "text-sm")}>{formatCurrency((magaluPortalWorker.obterDadosConfirmados(item.grupo, item.cota)?.valor || item.valor_parcela) * item.parcelas_atrasadas)}</p>
                                     </div>
                                     <div className={cn(
                                       "p-2 rounded-xl flex items-center gap-1.5",
                                       item.status === 'regularizado' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
                                       isWideView ? "p-1.5" : "p-2"
                                     )}>
                                        <ShieldAlert className="h-3 w-3" />
                                        <span className="text-[10px] font-black">{item.parcelas_atrasadas}x</span>
                                     </div>
                                  </div>
                                </div>
                              );

                              if (snap.isDragging) {
                                return createPortal(cardContent, document.body);
                              }
                              return cardContent;
                            }}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modern Dialogs (Already maintained but visually polished) */}
      <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) setEditingItem(null); }}>
        {/* ... Dialog content remains clean and operational ... */}
        <DialogContent className="max-w-2xl bg-white rounded-[32px] border-none p-8">
           <DialogHeader><DialogTitle className="text-2xl font-black">{editingItem ? "Editar Devedor" : "Novo Inadimplente"}</DialogTitle></DialogHeader>
           <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="col-span-2 space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome Completo</Label>
                 <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Celular</Label>
                 <Input value={form.celular} onChange={e => setForm({...form, celular: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Administradora</Label>
                 <Select value={form.administradora || "none"} onValueChange={v => setForm({...form, administradora: v})}>
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl">
                      <SelectValue placeholder="Administradora" />
                    </SelectTrigger>
                    <SelectContent>{ADMINISTRADORAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                 </Select>
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Parcelas Atrasadas</Label>
                 <Input type="number" value={form.parcelas_atrasadas} onChange={e => setForm({...form, parcelas_atrasadas: e.target.value})} className="h-12 bg-red-50 border-none rounded-xl text-red-600 font-bold" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Valor Parcela</Label>
                 <Input type="number" value={form.valor_parcela} onChange={e => setForm({...form, valor_parcela: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Grupo</Label>
                 <Input value={form.grupo} onChange={e => setForm({...form, grupo: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Cota</Label>
                 <Input value={form.cota} onChange={e => setForm({...form, cota: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
              </div>
           </div>
           <div className="flex gap-2 mt-8">
              <Button variant="ghost" onClick={() => setShowAdd(false)} className="h-12 flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="h-12 flex-2 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest">
                 {saving ? "Processando..." : (editingItem ? "Salvar Alterações" : "Adicionar Registro")}
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCopy} onOpenChange={setShowCopy}>
        <DialogContent className="max-w-xl bg-white rounded-[32px] border-none p-8">
           <DialogHeader><DialogTitle className="text-2xl font-black">Régua de WhatsApp</DialogTitle></DialogHeader>
           <div className="space-y-4 mt-6">
              <Textarea rows={6} value={copyTemplate} onChange={e => setCopyTemplate(e.target.value)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => {
                  const msgs = data.filter(d => d.status !== 'regularizado').map(d => {
                    let msg = copyTemplate;
                    const mesInfo = magaluPortalWorker.getMesVigenteInfo();
                    const match = magaluPortalWorker.obterDadosConfirmados(d.grupo, d.cota);
                    const primeiroNome = (d.nome || "").split(" ")[0].toUpperCase() || (match?.nome ? match.nome.split(" ")[0].toUpperCase() : "CLIENTE");
                    const valorEfetivo = match?.valor || d.valor_parcela || 0;
                    const valorFormatado = formatCurrency(valorEfetivo);
                    const linhaDigitavel = (d as any).linha_digitavel || match?.linhaDigitavel || magaluPortalWorker.obterLinhaDigitavel(d.grupo, d.cota, valorEfetivo, mesInfo.vencimentoEfetivo);

                    msg = msg.replace(/{nome}/gi, primeiroNome);
                    msg = msg.replace(/{cota}/gi, d.cota || "");
                    msg = msg.replace(/{grupo}/gi, d.grupo || "");
                    msg = msg.replace(/{mes}/gi, mesInfo.nomeMesUpper);
                    msg = msg.replace(/{vencimento}/gi, mesInfo.vencimentoEfetivo);
                    msg = msg.replace(/{valor_parcela}/gi, valorFormatado);
                    msg = msg.replace(/{valor}/gi, valorFormatado);
                    msg = msg.replace(/{parcelas_atrasadas}/gi, String(d.parcelas_atrasadas || 0));
                    msg = msg.replace(/{linha_digitavel}/gi, linhaDigitavel);
                    msg = msg.replace(/{codigo_de_barras}/gi, linhaDigitavel);
                    return msg;
                  }).join('\n\n---\n\n');
                  navigator.clipboard.writeText(msgs);
                  toast.success('Mensagens copiadas com sucesso!');
                }} className="h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all">Copiar Texto</button>

                <button 
                  onClick={handleDispararCobrancaPreventiva}
                  disabled={disparando}
                  className="h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {disparando ? "Disparando..." : "Disparar Automático (Evolution/Make)"}
                </button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Auditoria e Aprovação de Disparos Jarvis (Portal Magalu - Dia 21) */}
      <Dialog open={showAuditoriaModal} onOpenChange={setShowAuditoriaModal}>
        <DialogContent className="max-w-3xl bg-white rounded-[32px] border-none p-6 sm:p-8 max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900">
                  {`Auditoria Portal Magalu • Inadimplência do Mês Vigente (${magaluPortalWorker.getMesVigenteInfo().rotuloMesAno})`}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  {`Regra: Vencimento dia 20 (ou próximo dia útil: ${magaluPortalWorker.getMesVigenteInfo().vencimentoEfetivo}). Raspagem oficial a partir de ${magaluPortalWorker.getMesVigenteInfo().dataInicioRaspagem}.`}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 my-4 custom-scrollbar">
            {avisosPendentes.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-base font-black text-slate-900">Nenhuma cota inadimplente detectada!</p>
                <p className="text-xs text-slate-500 mt-1">Todas as cotas auditadas no Portal Magalu constam com parcelas regularizadas.</p>
                <Button 
                  onClick={handleExecutarAuditoriaMagalu} 
                  disabled={auditandoMagalu}
                  className="mt-4 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", auditandoMagalu ? "animate-spin" : "")} />
                  Reexecutar Auditoria
                </Button>
              </div>
            ) : (
              avisosPendentes.map((aviso, idx) => (
                <div key={aviso.id} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 hover:border-indigo-300 transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm uppercase">{aviso.nome}</span>
                        <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          {`Parcela ${magaluPortalWorker.getMesVigenteInfo().rotuloMesAno} (Venc: ${magaluPortalWorker.getMesVigenteInfo().vencimentoEfetivo})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-bold">
                        <span>G: {aviso.grupo}</span>
                        <span>•</span>
                        <span>C: {aviso.cota}</span>
                        <span>•</span>
                        <span className="text-red-600 font-black">Vencimento: {aviso.vencimento}</span>
                        <span>•</span>
                        <span className="text-slate-900 font-black">{formatCurrency(aviso.valor_parcela)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        onClick={() => handleAprovarAvisoIndividual(aviso.id, "whatsapp")}
                        className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAprovarAvisoIndividual(aviso.id, "telegram")}
                        className="flex-1 sm:flex-none bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Telegram
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAprovarAvisoIndividual(aviso.id, "email")}
                        className="flex-1 sm:flex-none border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        E-mail
                      </Button>
                    </div>
                  </div>

                  {/* Linha Digitável Oficial Portal Magalu */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-sm space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                          Linha Digitável Oficial (Portal Magalu):
                        </Label>
                        {aviso.linha_digitavel && aviso.linha_digitavel.length >= 20 ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            ✔ Código Real Magalu
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            ⚠ Pendente de Emissão (Atendimento &gt; Emissão de Cobrança)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
                        Atendimento &gt; Posição do Consorciado &gt; Emissão de Cobrança &gt; Gerar Cód. de barras
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Cole aqui a linha digitável oficial gerada no Portal Magalu"
                        value={aviso.linha_digitavel || ""}
                        onChange={(e) => {
                          const novaLinha = e.target.value.trim();
                          setAvisosPendentes(prev => prev.map(a => {
                            if (a.id !== aviso.id) return a;
                            const novaMsg = magaluPortalWorker.gerarAvisoHumanizado({
                              nome: a.nome,
                              cota: a.cota,
                              grupo: a.grupo,
                              valorParcela: a.valor_parcela,
                              linhaDigitavel: novaLinha || undefined,
                              vencimento: a.vencimento
                            });
                            return {
                              ...a,
                              linha_digitavel: novaLinha,
                              mensagem_whatsapp: novaMsg
                            };
                          }));
                        }}
                        className="h-9 text-xs font-mono bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Mensagem Humanizada Pronta (Solução &amp; Linha Digitável 2ª Via):
                    </Label>
                    <Textarea
                      rows={4}
                      value={aviso.mensagem_whatsapp}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAvisosPendentes(prev => prev.map(a => a.id === aviso.id ? { ...a, mensagem_whatsapp: val } : a));
                      }}
                      className="bg-white border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handleExecutarAuditoriaMagalu}
              disabled={auditandoMagalu}
              className="text-xs text-slate-500 font-bold hover:text-slate-900"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", auditandoMagalu ? "animate-spin" : "")} />
              {auditandoMagalu ? "Auditando..." : "Atualizar Consulta no Portal"}
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={() => setShowAuditoriaModal(false)}
                className="rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400"
              >
                Fechar
              </Button>

              {avisosPendentes.length > 0 && (
                <Button
                  onClick={handleAprovarTodosAvisos}
                  disabled={disparando}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {disparando ? "Disparando..." : `Confirmar & Disparar Todos (${avisosPendentes.length})`}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>

      {/* Vertical Scroll Controls - Facilitated Methodology (Desktop Only) */}
      <div className="hidden lg:flex absolute right-4 bottom-4 flex flex-col gap-2 opacity-70 hover:opacity-100 transition-opacity z-20">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-2xl bg-white/95 border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
          onClick={() => {
            const container = document.getElementById('inadimplentes-main-container');
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
            const container = document.getElementById('inadimplentes-main-container');
            container?.scrollBy({ top: 400, behavior: 'smooth' });
          }}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
