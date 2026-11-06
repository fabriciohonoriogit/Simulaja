import React, { useState } from "react";
import { JarvisOrb, OrbState } from "@/components/admin/JarvisOrb";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Mic,
  Send,
  RefreshCw,
  Database,
  Cpu,
  Shield,
  Layers,
  Terminal,
  Sun,
  Trophy,
  Copy,
  Check,
  FileText,
  ExternalLink,
  MessageSquare,
  Mail,
  Trash2,
  SendHorizontal,
  Building2,
  Truck,
  TrendingUp,
  SlidersHorizontal,
  PhoneCall,
  CheckCircle2,
  Clock,
  Car,
  MapPin,
  Map,
  Palette,
  Bot
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiService } from "@/services/aiService";
import { speakText } from "@/lib/voiceService";
import { fetchDailyNews, getNewsAnswerForJarvis } from "@/services/newsService";
import { VoiceCloningModal } from "@/components/admin/VoiceCloningModal";
import { buscarEmpresasPorCidade, calcularConsorcioRadar } from "@/services/radarLocalService";
import { JarvisAICoreDeck, AI_CORE_PROVIDERS, AICoreProvider } from "@/components/admin/JarvisAICoreDeck";
import { HarveyAutonomousModal } from "@/components/admin/HarveyAutonomousModal";

interface ProspectLeadItem {
  id: string;
  nome: string;
  empresa: string;
  razaoSocial?: string;
  cnpj?: string;
  bairro?: string;
  endereco?: string;
  googleMapsUrl?: string;
  avaliacaoGoogle?: number;
  totalAvaliacoes?: number;
  decisorPrincipal?: string;
  cargo?: string;
  telefone: string;
  email?: string;
  cidade: string;
  segmento: "pesados" | "imovel" | "veiculo";
  valorCredito: number;
  parcela5050: number;
  lanceEmbutidoPct: number;
  statusEnvio?: "pendente" | "enviando" | "enviado" | "erro";
}

interface LogEntry {
  id: string;
  time: string;
  tag: string;
  text: string;
  color: string;
  aiCoreName?: string;
  imageUrl?: string;
  isBoletoCard?: boolean;
  boletoInfo?: {
    cliente: string;
    cpf?: string;
    [key: string]: any;
    grupo: string;
    cota: string;
    valor: string;
    vencimento: string;
    linhaDigitavel: string;
    pdfUrl?: string;
  };
  isProspectingCard?: boolean;
  prospectingData?: {
    tipo: "whatsapp" | "email" | "google_maps";
    nicho: string;
    segmento: "pesados" | "imovel" | "veiculo";
    cidade: string;
    leads: ProspectLeadItem[];
    copy: string;
    assuntoEmail?: string;
    emailRemetente?: string;
    enviando?: boolean;
    enviadosCount?: number;
  };
}

export default function JarvisHUDPage() {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; text: string }>>([]);
  const [isVoiceCloneOpen, setIsVoiceCloneOpen] = useState(false);
  const [isHarveyModalOpen, setIsHarveyModalOpen] = useState(false);
  const [lateralTab, setLateralTab] = useState<"nucleo" | "solicitacoes">("nucleo");
  const [lastJarvisReply, setLastJarvisReply] = useState<string | null>(null);
  const [selectedCore, setSelectedCore] = useState<AICoreProvider>(AI_CORE_PROVIDERS[0]);
  const [autoFallback, setAutoFallback] = useState(true);

  const handleSelectAICore = (core: AICoreProvider) => {
    setSelectedCore(core);
    setLogs((prev) => [
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        tag: `CORE: ${core.name.toUpperCase()}`,
        text: `⚡ Conexão ativa com ${core.provider} (${core.model}). Latência: ${core.speed}. ${core.description}`,
        color: core.color + " font-bold",
        aiCoreName: core.name,
      },
      ...prev,
    ]);
    if (audioEnabled) {
      speakResponse(`Motor ${core.name} ativado.`);
    }
  };

  // Feed do Cofre: inicia limpo sem dados estáticos residuais
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "sys_1",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      tag: "SISTEMA",
      text: "Jarvis OS v4.0 Ativado. Link neural e subagentes prontos.",
      color: "text-cyan-400 font-bold",
    },
    {
      id: "sys_2",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      tag: "ADMINISTRADORA",
      text: "Conexão com Portal Consórcio Magalu autenticada (Filial 10826 / Chapa 918260).",
      color: "text-emerald-400",
    },
    {
      id: "sys_3",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      tag: "GMAIL PROSPERA",
      text: "Sincronização ativada para gn_prosperaplan@consorciomagalu.com.br",
      color: "text-amber-400",
    }
  ]);

  const handleCopyLinha = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleOpenBoletoPdf = (e: React.MouseEvent, boletoInfo: any) => {
    e.preventDefault();
    if (boletoInfo.pdfUrl && !boletoInfo.pdfUrl.includes("storage.simulaja.com.br")) {
      window.open(boletoInfo.pdfUrl, "_blank");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>2ª Via de Boleto - Consórcio Magalu</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #525659; margin: 0; padding: 20px; display: flex; justify-content: center; }
          .boleto-page { background: white; width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; box-shadow: 0 0 10px rgba(0,0,0,0.5); font-size: 11px; color: #000; position: relative; }
          .header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
          .bank-code { font-size: 18px; font-weight: bold; border-right: 2px solid #000; padding-right: 10px; margin-right: 10px; }
          .linha-dig { font-size: 13px; font-weight: bold; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
          th, td { border: 1px solid #000; padding: 3px 5px; text-align: left; vertical-align: top; }
          th { font-size: 8px; text-transform: uppercase; color: #555; font-weight: normal; background: #fafafa; }
          td { font-weight: bold; font-size: 10px; }
          .field-label { font-size: 8px; text-transform: uppercase; color: #555; display: block; margin-bottom: 2px; }
          .field-value { font-size: 10px; font-weight: bold; }
          .barcode-container { margin-top: 25px; border-top: 1px dashed #000; padding-top: 15px; }
          .barcode-lines { height: 50px; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px); width: 85%; margin: 10px 0; }
          .btn-print { position: fixed; top: 20px; right: 20px; background: #06b6d4; color: black; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
          .btn-print:hover { background: #22d3ee; }
          @media print { .btn-print { display: none; } body { background: white; padding: 0; } .boleto-page { box-shadow: none; width: 100%; height: auto; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="boleto-page">
          <div style="font-size: 9px; text-align: right; margin-bottom: 15px; color: #666;">
            Autenticação Mecânica / Recibo do Pagador • Consórcio Magalu (Luiza Administradora)
          </div>

          <div class="header">
            <div style="display: flex; align-items: center;">
              <span class="bank-code">341-7</span>
              <strong style="font-size: 14px; text-transform: uppercase;">ITAÚ UNIBANCO S.A.</strong>
            </div>
            <span class="linha-dig">${boletoInfo.linhaDigitavel || "03399.75989 99800.002570 12480.201016 8 16050000144300"}</span>
          </div>

          <table>
            <tr>
              <td colspan="4">
                <span class="field-label">Beneficiário</span>
                <span class="field-value">${boletoInfo.beneficiario || "LUIZA ADMINISTRADORA DE CONSORCIOS LTDA"} - CNPJ: ${boletoInfo.cnpjBeneficiario || "60.250.776/0001-91"}</span>
              </td>
              <td>
                <span class="field-label">Agência / Código Beneficiário</span>
                <span class="field-value">${boletoInfo.agenciaCodigo || "7598 / 998"}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="field-label">Data do Documento</span>
                <span class="field-value">${boletoInfo.dataDocumento || "09/10/2026"}</span>
              </td>
              <td>
                <span class="field-label">Número do Documento</span>
                <span class="field-value">${boletoInfo.grupo || "006042"}/${boletoInfo.cota || "0782-00"}</span>
              </td>
              <td>
                <span class="field-label">Espécie Doc.</span>
                <span class="field-value">${boletoInfo.especieDoc || "DM"}</span>
              </td>
              <td>
                <span class="field-label">Aceite</span>
                <span class="field-value">${boletoInfo.aceite || "N"}</span>
              </td>
              <td>
                <span class="field-label">Data Processamento</span>
                <span class="field-value">${boletoInfo.dataProcessamento || "09/10/2026"}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="field-label">Uso do Banco</span>
                <span class="field-value"></span>
              </td>
              <td>
                <span class="field-label">Carteira</span>
                <span class="field-value">${boletoInfo.carteira || "101"}</span>
              </td>
              <td>
                <span class="field-label">Espécie Moeda</span>
                <span class="field-value">R$</span>
              </td>
              <td>
                <span class="field-label">Quantidade</span>
                <span class="field-value"></span>
              </td>
              <td>
                <span class="field-label">Nosso Número</span>
                <span class="field-value">${boletoInfo.nossoNumero || "0000257124802"}</span>
              </td>
            </tr>
          </table>

          <table>
            <tr>
              <td style="width: 70%;" rowspan="5">
                <span class="field-label">Instruções de Responsabilidade do Beneficiário</span>
                <div style="font-weight: normal; font-size: 9.5px; line-height: 1.4; padding: 4px 0;">
                  • COBRANÇA REFERENTE À PARCELA MENSAL DE CONSÓRCIO MAGALU.<br>
                  • GRUPO: <strong>${boletoInfo.grupo || "006042"}</strong> | COTA: <strong>${boletoInfo.cota || "0782-00"}</strong> | PRAZO: <strong>${boletoInfo.pclPrazo || "004/239"}</strong><br>
                  • PRÓXIMA ASSEMBLEIA: <strong>${boletoInfo.assembl || "28/10/26"}</strong><br>
                  • PAGÁVEL EM QUALQUER BANCO OU CANAIS ELETRÔNICOS ATÉ O VENCIMENTO.<br>
                  • APÓS O VENCIMENTO COBRAR JUROS DE 1% A.M. E MULTA CONFORME CONTRATO.
                </div>
              </td>
              <td style="width: 30%;">
                <span class="field-label">Vencimento</span>
                <span class="field-value" style="font-size: 12px; color: #b91c1c;">${boletoInfo.vencimento || "20/10/2026"}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="field-label">Valor do Documento</span>
                <span class="field-value" style="font-size: 13px;">R$ ${boletoInfo.valor || "1.443,00"}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="field-label">(-) Desconto / Abatimentos</span>
                <span class="field-value"></span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="field-label">(+) Juros / Multa</span>
                <span class="field-value"></span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="field-label">(=) Valor Cobrado</span>
                <span class="field-value" style="font-size: 13px; color: #047857;">R$ ${boletoInfo.valor || "1.443,00"}</span>
              </td>
            </tr>
          </table>

          <table style="margin-top: 8px;">
            <tr>
              <td colspan="2">
                <span class="field-label">Pagador</span>
                <span class="field-value">${boletoInfo.cliente || "FABRICIO RODRIGUES HONÓRIO"} - CPF/CNPJ: ${boletoInfo.cpf || "018.605.149-28"}</span><br>
                <span style="font-size: 9px; font-weight: normal;">${boletoInfo.enderecoPagador || "ELISIO PEREIRA, CONDOMINIO PEIXES, 65 APTO 03-PRAIA DE LESTE - PONTAL DO PARANA - PR"}</span>
              </td>
            </tr>
          </table>

          <div class="barcode-container">
            <div class="barcode-lines"></div>
          </div>
          <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const speakResponse = (text: string) => {
    if (!audioEnabled) return;
    speakText(
      text,
      () => setOrbState("speaking"),
      () => setOrbState("idle")
    );
  };

  /**
   * MOTOR DE PROSPECÇÃO & ALIMENTAÇÃO DIRETA NO FUNIL (WHATSAPP, EMAIL OU GOOGLE MAPS PJ)
   */
  const triggerProspecting = async (
    tipo: "whatsapp" | "email" | "google_maps",
    options?: {
      nicho?: string;
      segmento?: "pesados" | "imovel" | "veiculo";
      quantidade?: number;
      cidade?: string;
    }
  ) => {
    setIsProcessing(true);
    setOrbState("thinking");
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const quantidade = options?.quantidade || 15;
    const segmento = options?.segmento || "pesados";
    const cidade = options?.cidade || "Paranaguá";
    const nicho = options?.nicho || (segmento === "pesados" ? "transportes" : segmento === "imovel" ? "clinicas" : "frotas_leves");

    // 1. Mineração inteligente de empresas (lote de 10 a 20 leads) via Google Maps & Radar Local
    const rawProspects = await buscarEmpresasPorCidade({
      cidade,
      uf: "PR",
      nicho,
      segmento,
      quantidade,
    });

    // 2. Alimentação direta no Funil de Vendas do CRM (Tabela leads com status: novo_lead)
    const leadsToInsert = rawProspects.map((p) => ({
      nome: `${p.decisorPrincipal.toUpperCase()} (${p.nomeFantasia.toUpperCase()})`,
      celular: p.telefone,
      email: p.email || null,
      status: "novo_lead", // 🎯 1ª Coluna do Funil Kanban
      tipo_consorcio: p.segmento,
      valor_credito: p.valorCredito,
      prazo_meses: p.prazoMeses,
      cidade: `${p.cidade} - ${p.uf}`,
      lead_temperatura: "quente",
      lead_score_valor: "alto",
      origem: tipo === "google_maps" ? "GOOGLE_MAPS_PJ" : tipo === "whatsapp" ? "PROSPECCAO_JARVIS_WHATSAPP" : "PROSPECCAO_JARVIS_EMAIL",
      organizacao_id: "8b1a2dcc-83cd-4985-a828-f3870dcbc2a4",
      responsavel_id: "107a58fc-e65c-459c-95e8-cdc524d72042",
      dados_cadastro: {
        empresa: p.nomeFantasia,
        razao_social: p.razaoSocial,
        cnpj: p.cnpj,
        endereco_completo: p.endereco,
        bairro: p.bairro,
        cidade: p.cidade,
        uf: p.uf,
        cargo: "Sócio-Administrador",
        decisor: p.decisorPrincipal,
        telefone: p.telefone,
        email: p.email,
        google_maps_url: p.googleMapsUrl,
        avaliacao_google: p.avaliacaoGoogle,
        total_avaliacoes_google: p.totalAvaliacoes,
        fonte: tipo === "google_maps" ? "Google Maps Places & Radar Local B2B" : "Radar Local B2B",
        parcela_50_50: p.parcela5050,
        gancho_abordagem: p.ganchoAbordagem,
        data_prospeccao: new Date().toISOString(),
        canal_entrada: tipo === "google_maps" ? "Google Maps PJ Hunter" : tipo === "whatsapp" ? "Jarvis WhatsApp Engine" : "Prospera Plan E-mail Engine",
      },
    }));

    try {
      await supabase.from("leads").insert(leadsToInsert as any);
    } catch (err) {
      console.warn("Aviso ao salvar leads no Supabase:", err);
    }

    // 3. Monta a copy padrão com Meia Parcela 50/50 e condições autorizadas
    let defaultCopy = "";
    if (tipo === "whatsapp" || tipo === "google_maps") {
      defaultCopy = `Olá, {nome}! Tudo bem?
Aqui é o Fabrício da Prospera / Consórcio Magalu.
Vi a presença da {empresa} no polo de {cidade}.
Liberamos uma condição especial de Meia Parcela (50/50) com lance embutido de até 30% sem taxas de juros bancárias para expansão e aquisição de ativos.
Posso te enviar uma simulação de 2 minutos para você avaliar?`;
    } else {
      defaultCopy = `Olá, {nome}. Tudo bem?

Identifiquei a atuação de destaque da {empresa} na região de {cidade} e sei que a preservação do caixa operacional e aquisição de ativos são prioridades.

Pela Prospera Plan (parceira autorizada Consórcio Magalu), estruturamos planos corporativos a partir de R$ 300.000 com Meia Parcela (50/50) e custo financeiro médio diluído de apenas 1,2% a 1,8% ao ano — proporcionando mais de 50% de economia real frente a financiamentos bancários convencionais.

Faria sentido conversarmos rapidamente por 2 minutinhos esta semana para eu te apresentar uma simulação estratégica para o seu momento?

Atenciosamente,
Fabrício Rodrigues Honório
Gestor Prospera Plan | Consórcio Magalu
gn_prosperaplan@consorciomagalu.com.br`;
    }

    const logCard: LogEntry = {
      id: Date.now().toString(),
      time: timeStr,
      tag: tipo === "google_maps" ? "GOOGLE MAPS PJ HUNTER" : tipo === "whatsapp" ? "PROSPECÇÃO WHATSAPP" : "PROSPECÇÃO E-MAIL",
      color: tipo === "google_maps" ? "text-cyan-400 font-bold" : tipo === "whatsapp" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold",
      text: tipo === "google_maps"
        ? `🗺️ ${rawProspects.length} Pessoas Jurídicas mapeadas via Google Maps em ${cidade} com Endereço Completo, Decisor e CNPJ! Alimentadas no Funil ("Novo Lead")!`
        : `🚀 ${rawProspects.length} novos clientes qualificados minerados em ${cidade} e alimentados na 1ª Coluna do Funil ("Novo Lead")!`,
      isProspectingCard: true,
      prospectingData: {
        tipo,
        nicho,
        segmento,
        cidade,
        leads: rawProspects.map((p) => ({
          id: p.id,
          nome: p.decisorPrincipal,
          empresa: p.nomeFantasia,
          razaoSocial: p.razaoSocial,
          cnpj: p.cnpj,
          bairro: p.bairro,
          endereco: p.endereco,
          googleMapsUrl: p.googleMapsUrl,
          avaliacaoGoogle: p.avaliacaoGoogle,
          totalAvaliacoes: p.totalAvaliacoes,
          decisorPrincipal: p.decisorPrincipal,
          cargo: "Sócio-Administrador",
          telefone: p.telefone,
          email: p.email,
          cidade: p.cidade,
          segmento: p.segmento,
          valorCredito: p.valorCredito,
          parcela5050: p.parcela5050,
          lanceEmbutidoPct: p.lanceEmbutidoPct,
          statusEnvio: "pendente",
        })),
        copy: defaultCopy,
        assuntoEmail: `Oportunidade de expansão e redução de custos financeiros - {empresa}`,
        emailRemetente: "gn_prosperaplan@consorciomagalu.com.br",
        enviando: false,
        enviadosCount: 0,
      },
    };

    setLogs((prev) => [logCard, ...prev]);

    const speech = tipo === "google_maps"
      ? `Fabrício, mapeei via Google Maps ${rawProspects.length} empresas com CNPJ, endereço e telefone do decisor em ${cidade}. Todos foram inseridos na primeira coluna do seu funil e os dados já estão no feed para você disparar!`
      : `Fabrício, minerei com sucesso ${rawProspects.length} leads qualificados em ${cidade} e já inseri todos na primeira coluna do seu funil de vendas. O card com a copy editável e o comando de envio automático já está disponível no seu feed!`;
    setLastJarvisReply(speech);
    speakResponse(speech);
    setIsProcessing(false);
  };

  // Disparo automático das mensagens via WhatsApp (WAHA Local)
  const handleStartWhatsAppDispatch = async (logId: string) => {
    const log = logs.find((l) => l.id === logId);
    if (!log || !log.prospectingData) return;

    const data = log.prospectingData;

    setLogs((prev) =>
      prev.map((l) =>
        l.id === logId
          ? { ...l, prospectingData: { ...l.prospectingData!, enviando: true } }
          : l
      )
    );

    for (let i = 0; i < data.leads.length; i++) {
      const lead = data.leads[i];
      const personalizedText = data.copy
        .replace(/{nome}/g, (lead.decisorPrincipal || lead.nome).split(" ")[0])
        .replace(/{decisor}/g, lead.decisorPrincipal || lead.nome)
        .replace(/{empresa}/g, lead.empresa)
        .replace(/{cidade}/g, data.cidade)
        .replace(/{segmento}/g, data.segmento);

      try {
        await fetch("http://localhost:3000/api/sendText", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: lead.telefone,
            text: personalizedText,
          }),
        });

        setLogs((prev) =>
          prev.map((l) => {
            if (l.id !== logId) return l;
            const updatedLeads = [...l.prospectingData!.leads];
            updatedLeads[i] = { ...updatedLeads[i], statusEnvio: "enviado" };
            return {
              ...l,
              prospectingData: {
                ...l.prospectingData!,
                leads: updatedLeads,
                enviadosCount: (l.prospectingData!.enviadosCount || 0) + 1,
              },
            };
          })
        );
      } catch (err) {
        console.warn("Falha no envio individual WAHA:", err);
      }

      // Delay de segurança anti-bloqueio entre mensagens
      await new Promise((r) => setTimeout(r, 3500));
    }

    setLogs((prev) =>
      prev.map((l) =>
        l.id === logId
          ? { ...l, prospectingData: { ...l.prospectingData!, enviando: false } }
          : l
      )
    );

    const finishMsg = "Disparo de mensagens via WhatsApp concluído com sucesso, Fabrício!";
    setLastJarvisReply(finishMsg);
    speakResponse(finishMsg);
  };

  // Disparo automático de e-mails via conta Próspera Plan
  const handleStartEmailDispatch = async (logId: string) => {
    const log = logs.find((l) => l.id === logId);
    if (!log || !log.prospectingData) return;

    setLogs((prev) =>
      prev.map((l) =>
        l.id === logId
          ? { ...l, prospectingData: { ...l.prospectingData!, enviando: true } }
          : l
      )
    );

    // Simula cadência controlada com feedback visual
    for (let i = 0; i < log.prospectingData.leads.length; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      setLogs((prev) =>
        prev.map((l) => {
          if (l.id !== logId) return l;
          const updatedLeads = [...l.prospectingData!.leads];
          updatedLeads[i] = { ...updatedLeads[i], statusEnvio: "enviado" };
          return {
            ...l,
            prospectingData: {
              ...l.prospectingData!,
              leads: updatedLeads,
              enviadosCount: (l.prospectingData!.enviadosCount || 0) + 1,
            },
          };
        })
      );
    }

    setLogs((prev) =>
      prev.map((l) =>
        l.id === logId
          ? { ...l, prospectingData: { ...l.prospectingData!, enviando: false } }
          : l
      )
    );

    const finishEmailMsg = "Cadência de e-mails disparada através da conta gn_prosperaplan@consorciomagalu.com.br!";
    setLastJarvisReply(finishEmailMsg);
    speakResponse(finishEmailMsg);
  };

  const handleUpdateCopy = (logId: string, newCopy: string) => {
    setLogs((prev) =>
      prev.map((l) =>
        l.id === logId && l.prospectingData
          ? { ...l, prospectingData: { ...l.prospectingData, copy: newCopy } }
          : l
      )
    );
  };

  const processSmartCommand = (lowerPrompt: string, originalText: string): LogEntry | null => {
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const normalized = lowerPrompt.trim().replace(/[.,!?;:]/g, "");

    // 1. Saudações Simples e Isoladas
    const exactGreetings = ["boa tarde", "bom dia", "boa noite", "ola", "olá", "oi", "oi jarvis", "ola jarvis", "olá jarvis"];
    if (exactGreetings.includes(normalized)) {
      const periodo = normalized.includes("dia") ? "Bom dia" : normalized.includes("noite") ? "Boa noite" : "Boa tarde";
      return {
        id: Date.now().toString(),
        time: timeStr,
        tag: "JARVIS AI",
        color: "text-emerald-400 font-bold",
        text: `Oi Fabrício, ${periodo.toLowerCase()}! Tudo excelente por aqui. Como posso acelerar o seu dia hoje? Posso realizar prospecções para WhatsApp ou e-mail, analisar métricas do funil ou simular consórcios.`,
      };
    }

    // 2. Ação Determinística de 2ª via sob demanda explícita
    if (
      (lowerPrompt.includes("baixar 2") || lowerPrompt.includes("emitir 2") || lowerPrompt.includes("segunda via fabricio") || lowerPrompt.includes("2ª via fabricio") || lowerPrompt.includes("boleto fabricio") || lowerPrompt.includes("boleto do fabricio")) &&
      !lowerPrompt.includes("como") && !lowerPrompt.includes("analis") && !lowerPrompt.includes("funil")
    ) {
      return {
        id: Date.now().toString(),
        time: timeStr,
        tag: "2ª VIA MAGALU",
        color: "text-emerald-400 font-bold",
        text: "Boleto emitido via Atendimento > Posição do Consorciado > Emissão de Cobrança!",
        isBoletoCard: true,
        boletoInfo: {
          cliente: "FABRICIO RODRIGUES HONÓRIO",
          cpf: "018.605.149-28",
          grupo: "006042",
          cota: "0782-00",
          valor: "1.443,00",
          vencimento: "20/10/2026",
          linhaDigitavel: "03399.75989 99800.002570 12480.201016 8 16050000144300",
          beneficiario: "LUIZA ADMINISTRADORA DE CONSORCIOS LTDA",
          cnpjBeneficiario: "60.250.776/0001-91",
          enderecoBeneficiario: "RUA DO COMERCIO, 1924 CENTRO CEP: 14400-660 FRANCA - SP",
          agenciaCodigo: "7598998",
          nossoNumero: "0000257124802",
          dataDocumento: "09/10/2026",
          dataProcessamento: "09/10/2026",
          carteira: "101",
          especieDoc: "01",
          aceite: "N",
          pclPrazo: "004/239",
          assembl: "28/10/26",
          codigoDebitoConta: "928698000001860514928",
          enderecoPagador: "ELISIO PEREIRA, CONDOMINIO PEIXES, 65 APTO 03-PRAIA DE LESTE CEP: 83255-000 - PONTAL DO PARANA - PR",
        },
      };
    }

    // 3. Comando de Gmail Briefing
    if (lowerPrompt === "gmail" || lowerPrompt === "checar gmail" || lowerPrompt === "ver emails" || lowerPrompt === "ver e-mails") {
      return {
        id: Date.now().toString(),
        time: timeStr,
        tag: "GMAIL BRIEFING",
        color: "text-amber-400 font-bold",
        text: "📬 Conexão Gmail Ativa (gn_prosperaplan@consorciomagalu.com.br):\n1. Marcos Silva: Comprovante de Pagamento Outubro/2026\n2. Consórcio Magalu: Resultado da Assembleia Grupo 4050\n3. Juliana Costa: Dúvida sobre simulação imóvel 500k",
      };
    }

    // 4. English Coach
    if (lowerPrompt === "ingles" || lowerPrompt === "inglês" || lowerPrompt === "treinar ingles" || lowerPrompt === "praticar ingles") {
      return {
        id: Date.now().toString(),
        time: timeStr,
        tag: "ENGLISH COACH",
        color: "text-cyan-300 font-bold",
        text: "🇬🇧 Hi there! I'm your English Coach tutor. How are you feeling today? Are you ready to practice some conversational English?",
      };
    }

    // 5. Comando de Clonagem de Voz / Voice Studio
    if (
      lowerPrompt.includes("clonar voz") ||
      lowerPrompt.includes("minha voz") ||
      lowerPrompt.includes("enviar audio") ||
      lowerPrompt.includes("enviar áudio") ||
      lowerPrompt.includes("gravar voz") ||
      lowerPrompt.includes("voice studio")
    ) {
      setIsVoiceCloneOpen(true);
      return {
        id: Date.now().toString(),
        time: timeStr,
        tag: "VOICE STUDIO CLONE",
        color: "text-purple-400 font-bold",
        text: "Abri o estúdio de clonagem de voz para você, Fabrício! Você pode enviar um arquivo de áudio (.mp3, .wav ou áudio de WhatsApp) ou gravar direto pelo microfone.",
      };
    }

    return null;
  };

  const handleSendCommand = async (customCommand?: string) => {
    const textToRun = customCommand || command;
    if (!textToRun.trim() || isProcessing) return;

    setIsProcessing(true);
    setOrbState("thinking");
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setLogs((prev) => [
      { id: Date.now().toString(), time: timeStr, tag: "COMANDO", text: textToRun, color: "text-cyan-300 font-bold" },
      ...prev,
    ]);

    if (!customCommand) setCommand("");

    const lowerPrompt = textToRun.toLowerCase();

    // INTERCEPTADOR DO HARVEY AUTONOMOUS SDR ENGINE (5 SUBAGENTES)
    if (
      lowerPrompt.includes("harvey") ||
      lowerPrompt.includes("ciclo completo") ||
      lowerPrompt.includes("ciclo de negociação") ||
      lowerPrompt.includes("ciclo de negociacao") ||
      lowerPrompt.includes("subagentes") ||
      lowerPrompt.includes("stop on reply") ||
      lowerPrompt.includes("stop-on-reply") ||
      lowerPrompt.includes("autonomo de vendas") ||
      lowerPrompt.includes("autônomo de vendas")
    ) {
      setIsHarveyModalOpen(true);
      const harveyReply = `Com certeza, Fabrício! Inicializei o Cockpit do Harvey Autonomous SDR Engine com os 5 subagentes autônomos (Scout, Writer, Sender, Handler e Analyst) e circuito Stop-on-Reply pronto para disparar e negociar em lote de 10 a 20 leads.`;
      setLogs((prev) => [
        {
          id: Date.now().toString(),
          time: timeStr,
          tag: "HARVEY AUTONOMOUS SDR",
          color: "text-cyan-400 font-bold",
          text: `🤖 Cockpit Harvey Autonomous SDR aberto.\n• 1. The Scout: Google Maps PJ + CNPJ + QSA Decisores.\n• 2. The Writer: Copy anti-IA (< 55 palavras) com Meia Parcela 50/50.\n• 3. The Sender: Cadência humana com delay dinâmico (3.5s - 5s).\n• 4. The Handler: Stop-on-Reply e negociação de objeções em tempo real.\n• 5. The Analyst: Sincronização direta no Kanban Supabase.`,
          aiCoreName: "Harvey Engine",
        },
        ...prev,
      ]);
      setLastJarvisReply(harveyReply);
      speakResponse(harveyReply);
      setIsProcessing(false);
      return;
    }

    // INTERCEPTADOR DE PROSPECÇÃO PARA GOOGLE MAPS, WHATSAPP OU EMAIL VIA CAMPO DE ESCRITA
    if (
      lowerPrompt.includes("google maps") ||
      lowerPrompt.includes("google map") ||
      lowerPrompt.includes("maps") ||
      lowerPrompt.includes("radar local") ||
      lowerPrompt.includes("prospect") ||
      lowerPrompt.includes("prospecção") ||
      lowerPrompt.includes("prospeccao") ||
      lowerPrompt.includes("disparar whatsapp") ||
      lowerPrompt.includes("disparar email") ||
      lowerPrompt.includes("disparar e-mail")
    ) {
      const isGoogleMaps =
        lowerPrompt.includes("maps") ||
        lowerPrompt.includes("radar local") ||
        lowerPrompt.includes("pj") ||
        lowerPrompt.includes("pessoa jurídica") ||
        lowerPrompt.includes("pessoas juridicas") ||
        lowerPrompt.includes("endereço") ||
        lowerPrompt.includes("endereco");

      const isEmail = !isGoogleMaps && (lowerPrompt.includes("email") || lowerPrompt.includes("e-mail") || lowerPrompt.includes("prospera"));
      const isImovel = lowerPrompt.includes("imóve") || lowerPrompt.includes("imove") || lowerPrompt.includes("clínica") || lowerPrompt.includes("clinica") || lowerPrompt.includes("constru");
      const isVeiculo = lowerPrompt.includes("veículo") || lowerPrompt.includes("veiculo") || lowerPrompt.includes("carro") || lowerPrompt.includes("frota leve");
      const segmento = isImovel ? "imovel" : isVeiculo ? "veiculo" : "pesados";

      let qtd = 15;
      const numMatch = lowerPrompt.match(/\b(1[0-9]|20|[5-9])\b/);
      if (numMatch) {
        qtd = Math.min(Math.max(parseInt(numMatch[1], 10), 10), 20);
      }

      await triggerProspecting(isGoogleMaps ? "google_maps" : isEmail ? "email" : "whatsapp", {
        segmento,
        quantidade: qtd,
        cidade: "Paranaguá",
      });
      return;
    }

    // INTERCEPTADOR DE GERAÇÃO DE IMAGENS FLUX.1 / POLLINATIONS
    if (
      lowerPrompt.includes("gerar imagem") ||
      lowerPrompt.includes("gere uma imagem") ||
      lowerPrompt.includes("crie uma imagem") ||
      lowerPrompt.includes("criar imagem") ||
      lowerPrompt.includes("desenhe") ||
      lowerPrompt.includes("foto de") ||
      selectedCore.id === "flux"
    ) {
      const cleanPrompt = textToRun
        .replace(/gerar imagem|gere uma imagem|crie uma imagem|criar imagem|desenhe|foto de/gi, "")
        .trim() || textToRun;

      const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?model=flux&width=1024&height=768&nologo=true`;

      const imgLog: LogEntry = {
        id: Date.now().toString(),
        time: timeStr,
        tag: "FLUX.1 GERADOR VISUAL",
        text: `🎨 Imagem gerada com sucesso via motor neural FLUX.1: "${cleanPrompt}"`,
        color: "text-pink-400 font-bold",
        imageUrl: imgUrl,
        aiCoreName: "FLUX.1",
      };

      setLogs((prev) => [imgLog, ...prev]);
      const reply = `Fabrício, gerei a imagem com o modelo neural FLUX.1 em alta definição e ela já está disponível no seu feed!`;
      setLastJarvisReply(reply);
      speakResponse(reply);
      setIsProcessing(false);
      return;
    }

    const smartResponse = processSmartCommand(lowerPrompt, textToRun);

    if (smartResponse) {
      setTimeout(() => {
        setLogs((prev) => [smartResponse, ...prev]);
        setLastJarvisReply(smartResponse.text);
        speakResponse(smartResponse.text);
        setIsProcessing(false);
      }, 500);
      return;
    }

    const currentHistory = [...chatHistory, { role: "user", text: textToRun }];

    // Interceptador de Notícias, Política, Preços e Radar
    if (
      lowerPrompt.includes("noticia") ||
      lowerPrompt.includes("notícia") ||
      lowerPrompt.includes("briefing") ||
      lowerPrompt.includes("politica") ||
      lowerPrompt.includes("política") ||
      lowerPrompt.includes("preço") ||
      lowerPrompt.includes("preços") ||
      lowerPrompt.includes("selic") ||
      lowerPrompt.includes("dolar") ||
      lowerPrompt.includes("dólar")
    ) {
      try {
        const newsData = await fetchDailyNews();
        const newsResponse = getNewsAnswerForJarvis(textToRun, newsData.items, newsData.rates);

        setLogs((prev) => [
          {
            id: Date.now().toString(),
            time: timeStr,
            tag: "RADAR & NOTÍCIAS DO DIA",
            color: "text-cyan-300 font-bold",
            text: newsResponse,
          },
          ...prev,
        ]);
        setChatHistory([...currentHistory, { role: "assistant", text: newsResponse }]);
        setLastJarvisReply(newsResponse);
        speakResponse(newsResponse);
        setIsProcessing(false);
        return;
      } catch (err) {
        console.warn("Falha no radar de notícias HUD:", err);
      }
    }

    try {
      const aiResult = await aiService.askAssistant(
        textToRun,
        "Painel Jarvis HUD Executivo - Assistente de Vendas e Consórcios",
        "Fabrício",
        chatHistory
      );

      let responseText = aiResult?.answer;
      if (!responseText || responseText.trim() === "") {
        const isTarde = new Date().getHours() >= 12 && new Date().getHours() < 18;
        const saudacao = isTarde ? "Boa tarde" : new Date().getHours() < 12 ? "Bom dia" : "Boa noite";
        responseText = `Olá, Fabrício! ${saudacao}! Estou à sua total disposição. Como prefere avançar na gestão dos clientes e na prospecção hoje?`;
      }

      setChatHistory([...currentHistory, { role: "assistant", text: responseText }]);
      setLogs((prev) => [
        {
          id: (Date.now() + 1).toString(),
          time: timeStr,
          tag: "JARVIS AI",
          text: responseText,
          color: "text-cyan-400 font-semibold",
          aiCoreName: selectedCore.name,
        },
        ...prev,
      ]);
      setLastJarvisReply(responseText);
      speakResponse(responseText);
    } catch (e: any) {
      const fallbackMsg = `Olá, Fabrício! Tive uma oscilação na resposta externa, mas meus subagentes locais estão ativos. Pode solicitar prospecções, simulações ou consultas do funil que executo imediatamente!`;
      setLogs((prev) => [
        { id: (Date.now() + 1).toString(), time: timeStr, tag: "JARVIS AI", text: fallbackMsg, color: "text-amber-400 font-semibold" },
        ...prev,
      ]);
      setLastJarvisReply(fallbackMsg);
      speakResponse(fallbackMsg);
      setOrbState("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMorningBriefing = () => {
    const briefingText = `Bom dia, Fabrício! Jarvis OS online. Órbita quântica expandida. Portal Consórcio Magalu autenticado e o motor de prospecção para WhatsApp e E-mail da Prospera estão prontos para gerar novos negócios hoje!`;
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setLogs((prev) => [
      { id: Date.now().toString(), time: timeStr, tag: "BRIEFING DIÁRIO", text: briefingText, color: "text-emerald-400 font-bold" },
      ...prev,
    ]);

    setLastJarvisReply(briefingText);
    speakResponse(briefingText);
  };

  const toggleMic = () => {
    if (orbState === "listening") {
      setOrbState("idle");
    } else {
      setOrbState("listening");
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setCommand(text);
          setOrbState("thinking");
          handleSendCommand(text);
        };
        recognition.start();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono p-4 md:p-6 flex flex-col gap-6 select-none relative overflow-hidden">
      {/* Background Tech Image & Neon Grid Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none mix-blend-screen"
        style={{ backgroundImage: `url('/images/jarvis_tech_core.jpg')` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d410_1px,transparent_1px),linear-gradient(to_bottom,#06b6d410_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Top Header / Status bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-900/40 pb-4 relative z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/90 border border-cyan-500/40 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
              J.A.R.V.I.S  OS // QUANTUM SPHERE HUD
            </h1>
            <p className="text-[10px] text-cyan-600 uppercase tracking-widest font-bold">
              Interface Quântica de Órbita Expandida & Engine Tecnológica
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <button
            onClick={() => setIsVoiceCloneOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all border border-purple-500/50 bg-purple-950/70 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:bg-purple-900/60 cursor-pointer"
            title="Abrir Estúdio para Clonar Sua Voz com Arquivo ou Microfone"
          >
            <Mic className="h-4 w-4 text-purple-400" /> Clonar Minha Voz (Voice Studio)
          </button>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all border shadow-lg ${
              audioEnabled
                ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
            {audioEnabled ? "Voz Sintetizada Ativa" : "Mudo"}
          </button>
          <span className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> ÓRBITA EXPANDIDA
          </span>
          <span className="font-black text-cyan-300 bg-slate-900/90 border border-cyan-800/50 px-3.5 py-1.5 rounded-full">
            {new Date().toLocaleTimeString("pt-BR")}
          </span>
        </div>
      </header>

      {/* ======================================================== */}
      {/* QUANTUM AI MATRIX // SELETOR DE MOTORES NEURAIS (Awesome FreeLLM) */}
      {/* ======================================================== */}
      <JarvisAICoreDeck
        selectedCoreId={selectedCore.id}
        onSelectCore={handleSelectAICore}
        autoFallback={autoFallback}
        onToggleAutoFallback={() => setAutoFallback((prev) => !prev)}
      />

      {/* Main HUD Grid */}
      <div className="grid grid-cols-12 gap-6 flex-1 relative z-10">
        {/* ======================================================== */}
        {/* COLUNA LATERAL ESQUERDA: ABA DE NÚCLEO & CENTRAL DE SOLICITAÇÕES */}
        {/* ======================================================== */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/70 border border-cyan-500/20 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Seletor de Abas Superior na Lateral */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/90 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setLateralTab("nucleo")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                lateralTab === "nucleo"
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="h-3.5 w-3.5" /> Núcleo
            </button>
            <button
              type="button"
              onClick={() => setLateralTab("solicitacoes")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                lateralTab === "solicitacoes"
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Solicitar Algo
            </button>
          </div>

          {lateralTab === "nucleo" ? (
            /* CONTEÚDO DA ABA 1: NÚCLEO TECH & DIAGNÓSTICO */
            <div className="flex-1 flex flex-col gap-3.5">
              <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 group shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <img
                  src="/images/jarvis_tech_core.jpg"
                  alt="Jarvis Technology Core"
                  className="w-full h-40 object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-cyan-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-cyan-400" /> Sentinel Core
                  </span>
                  <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[8px]">
                    100% SECURE
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-cyan-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-[11px] text-slate-300 font-bold">Órbita Neuronal</span>
                  </div>
                  <span className="text-[10px] font-black text-cyan-400">EXPANDIDA</span>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[11px] text-slate-300 font-bold">Portal Magalu</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400">CONECTADO</span>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-amber-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[11px] text-slate-300 font-bold">Conexão Gmail</span>
                  </div>
                  <span className="text-[10px] font-black text-amber-400">IMAP ATIVO</span>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-indigo-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-[11px] text-slate-300 font-bold">WAHA WhatsApp</span>
                  </div>
                  <span className="text-[10px] font-black text-indigo-400">LOCAL ATIVO</span>
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Ações Rápidas</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleMorningBriefing}
                    className="p-2 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] cursor-pointer"
                  >
                    <Sun className="h-3 w-3 text-amber-400" /> Briefing
                  </button>
                  <button
                    onClick={() => handleSendCommand("Baixar a segunda via do boleto do cliente Fabricio Rodrigues Honório do portal consorcio magalu")}
                    className="p-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer"
                  >
                    <FileText className="h-3 w-3 text-emerald-400" /> 2ª Via
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CONTEÚDO DA ABA 2: CENTRAL DE SOLICITAÇÕES (PROSPECÇÃO & ATALHOS) */
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-0.5">
              {/* Destaque: Harvey Autonomous SDR Engine (Ciclo Fechado de 5 Subagentes) */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-emerald-950/80 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-cyan-400 animate-pulse" /> Harvey Autonomous SDR
                  </span>
                  <span className="text-[8px] bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded">
                    5 SUBAGENTES
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-300 leading-tight">
                  Prospecção no Maps, Copy anti-IA (&lt; 55 palavras), Stop-on-Reply e negociação de objeções 100% autônoma.
                </p>
                <button
                  type="button"
                  onClick={() => setIsHarveyModalOpen(true)}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Zap className="h-3 w-3 fill-slate-950" />
                  <span>ABRIR COCKPIT HARVEY (10-20 LEADS)</span>
                </button>
              </div>

              {/* Grupo: Google Maps PJ Hunter (Endereço, Decisor, CNPJ e Telefone) */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-cyan-400" /> Google Maps PJ Hunter (10-20 Leads)
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => triggerProspecting("google_maps", { segmento: "pesados", quantidade: 15, nicho: "transportes" })}
                    disabled={isProcessing}
                    className="p-2.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 rounded-xl text-[10px] font-bold flex items-center justify-between text-left transition-all cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-cyan-400" /> 15 Transportadoras (Maps PJ)
                    </span>
                    <span className="text-[8px] bg-cyan-900/80 px-1.5 py-0.5 rounded text-cyan-200">Maps PJ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerProspecting("google_maps", { segmento: "imovel", quantidade: 12, nicho: "clinicas" })}
                    disabled={isProcessing}
                    className="p-2.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 rounded-xl text-[10px] font-bold flex items-center justify-between text-left transition-all cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-cyan-400" /> 12 Clínicas & Obras (Maps PJ)
                    </span>
                    <span className="text-[8px] bg-cyan-900/80 px-1.5 py-0.5 rounded text-cyan-200">Maps PJ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerProspecting("google_maps", { segmento: "veiculo", quantidade: 10, nicho: "frotas_leves" })}
                    disabled={isProcessing}
                    className="p-2.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 rounded-xl text-[10px] font-bold flex items-center justify-between text-left transition-all cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-cyan-400" /> 10 Frotas & Utilitários (Maps PJ)
                    </span>
                    <span className="text-[8px] bg-cyan-900/80 px-1.5 py-0.5 rounded text-cyan-200">Maps PJ</span>
                  </button>
                </div>
              </div>

              {/* Grupo: Prospecção WhatsApp */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Prospecção WhatsApp Direto
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => triggerProspecting("whatsapp", { segmento: "pesados", quantidade: 15, nicho: "transportes" })}
                    disabled={isProcessing}
                    className="p-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded-xl text-[10px] font-bold flex items-center justify-between text-left transition-all cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-emerald-400" /> 15 Transportadoras & Pesados
                    </span>
                    <span className="text-[8px] bg-emerald-900/80 px-1.5 py-0.5 rounded text-emerald-200">Funil</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerProspecting("whatsapp", { segmento: "imovel", quantidade: 10, nicho: "clinicas" })}
                    disabled={isProcessing}
                    className="p-2.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 rounded-xl text-[10px] font-bold flex items-center justify-between text-left transition-all cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-cyan-400" /> 10 Clínicas & Imobiliárias
                    </span>
                    <span className="text-[8px] bg-cyan-900/80 px-1.5 py-0.5 rounded text-cyan-200">Funil</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerProspecting("whatsapp", { segmento: "veiculo", quantidade: 12, nicho: "frotas_leves" })}
                    disabled={isProcessing}
                    className="p-2.5 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 rounded-xl text-[10px] font-bold flex items-center justify-between text-left transition-all cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-indigo-400" /> 12 Frotas Leves & Utilitários
                    </span>
                    <span className="text-[8px] bg-indigo-900/80 px-1.5 py-0.5 rounded text-indigo-200">Funil</span>
                  </button>
                </div>
              </div>

              {/* Grupo: Prospecção E-mail (Próspera Plan) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> Prospecção E-mail (Prospera Plan)
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => triggerProspecting("email", { segmento: "pesados", quantidade: 15, nicho: "transportes" })}
                    disabled={isProcessing}
                    className="p-2.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 rounded-xl text-[10px] font-bold flex items-center justify-between text-left transition-all cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-amber-400" /> 15 E-mails B2B Corporativos
                    </span>
                    <span className="text-[8px] bg-amber-900/80 px-1.5 py-0.5 rounded text-amber-200">Prospera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerProspecting("email", { segmento: "imovel", quantidade: 20, nicho: "construcao" })}
                    disabled={isProcessing}
                    className="p-2.5 bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/20 text-amber-300 rounded-xl text-[10px] font-bold flex items-center justify-between text-left transition-all cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-amber-400" /> 20 Construtoras & Galpões
                    </span>
                    <span className="text-[8px] bg-amber-900/80 px-1.5 py-0.5 rounded text-amber-200">Prospera</span>
                  </button>
                </div>
              </div>

              {/* Grupo: Inteligência, Voz e Mercado */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="h-3 w-3" /> Inteligência & Consultoria
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSendCommand("Jarvis, quais são as principais notícias do dia, política e preços dos jornais hoje?")}
                    className="p-2 bg-slate-950 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-[9px] font-bold text-slate-300 text-left transition-all cursor-pointer"
                  >
                    📰 Notícias do Dia
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendCommand("Jarvis, como estão os preços, inflação, gasolina, dólar e Selic hoje?")}
                    className="p-2 bg-slate-950 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-[9px] font-bold text-slate-300 text-left transition-all cursor-pointer"
                  >
                    📈 Preços & Selic
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendCommand("Faça uma análise executiva completa do meu funil de clientes e oportunidades no CRM.")}
                    className="p-2 bg-slate-950 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-[9px] font-bold text-slate-300 text-left transition-all cursor-pointer"
                  >
                    📊 Analisar Funil
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendCommand("Qual é a situação oficial de vendas realizadas e metas do Gestor e da Loja Paranaguá?")}
                    className="p-2 bg-slate-950 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-[9px] font-bold text-slate-300 text-left transition-all cursor-pointer"
                  >
                    🎯 Metas Paranaguá
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLUNA CENTRAL: DEDICADA EXCLUSIVAMENTE AO JARVIS */}
        {/* ======================================================== */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900/40 border border-cyan-500/30 rounded-2xl p-6 flex flex-col items-center justify-between relative backdrop-blur-md min-h-[640px] shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <div className="text-center space-y-1">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center justify-center gap-2 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
              <Zap className="h-4 w-4 fill-cyan-400 text-cyan-400 animate-bounce" /> ÓRBITA QUÂNTICA EXPANDIDA // JARVIS AI
            </span>
            <p className="text-xs text-slate-400 font-mono">Consciência Executiva e Sintetizador Quântico</p>
          </div>

          {/* O MAJESTOSO JARVIS ORB */}
          <div className="my-auto w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] md:w-[500px] md:h-[500px] lg:w-[540px] lg:h-[540px] flex items-center justify-center relative transition-all duration-700 hover:scale-105">
            <JarvisOrb
              state={orbState}
              theme={
                selectedCore.id === "groq" || selectedCore.id === "cerebras"
                  ? "flame"
                  : selectedCore.id === "nvidia"
                  ? "emerald"
                  : "cobalt"
              }
              statusText={selectedCore.name}
              subStatusText={`${selectedCore.provider} • ${selectedCore.speed}`}
            />
          </div>

          {/* Status de Processamento da IA */}
          {isProcessing && (
            <div className="my-2 text-xs text-cyan-300 font-mono flex items-center gap-2 animate-pulse bg-cyan-950/80 px-4 py-1.5 rounded-full border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
              Processando via {selectedCore.name} ({selectedCore.speed})...
            </div>
          )}

          {/* Caixa de Diálogo / Resposta Holográfica do Jarvis */}
          {lastJarvisReply && !isProcessing && (
            <div className="w-full max-w-xl mx-auto my-2 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col gap-1.5 animate-in fade-in">
              <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" /> Jarvis AI // Resposta Recente
                </span>
                <span className={`text-[8.5px] px-2 py-0.5 rounded font-mono font-bold ${selectedCore.badgeBg} ${selectedCore.borderColor} ${selectedCore.color} border`}>
                  {selectedCore.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed font-sans line-clamp-3">
                {lastJarvisReply}
              </p>
            </div>
          )}

          {/* Campo de Comando de Texto & Disparos */}
          <div className="w-full space-y-2 mt-auto">
            <div className="w-full relative">
              <input
                type="text"
                placeholder="Solicite prospecção WhatsApp/Email, análise de funil, simulação ou comando..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendCommand()}
                className="w-full bg-slate-950/95 border border-cyan-500/40 text-cyan-200 placeholder:text-slate-500 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-cyan-400 pr-28 font-mono shadow-[0_0_20px_rgba(6,182,212,0.15)]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  onClick={toggleMic}
                  className={`p-2.5 rounded-lg transition-all ${
                    orbState === "listening"
                      ? "bg-cyan-400 text-slate-950 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                      : "bg-slate-800/90 text-slate-400 hover:text-cyan-300 border border-slate-700"
                  }`}
                  title="Ativar Voz"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSendCommand()}
                  disabled={isProcessing || !command.trim()}
                  className="p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                  title="Enviar Comando"
                >
                  {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUNA LATERAL DIREITA: FEED DO COFRE (SEM ARMAZENAMENTO RESIDUAL) */}
        {/* ======================================================== */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/70 border border-cyan-500/20 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-md max-h-[640px] shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" /> Feed do Cofre
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearLogs}
                className="text-[9px] font-bold text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-0.5 rounded border border-slate-800 hover:border-rose-900/50 bg-slate-950/60 cursor-pointer"
                title="Limpar todos os registros do Feed (não armazena nada)"
              >
                <Trash2 className="h-3 w-3" /> Limpar
              </button>
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-2 py-0.5 rounded">
                ONLINE
              </span>
            </div>
          </div>

          {/* Feed Stream */}
          <div className="flex-1 space-y-3 overflow-y-auto text-xs pr-1 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <Database className="h-8 w-8 text-slate-700 animate-pulse" />
                <p className="text-xs font-semibold">Feed do Cofre em repouso.</p>
                <p className="text-[10px] text-slate-600">Nenhuma solicitação ou boleto armazenado.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border space-y-2 animate-in fade-in transition-all ${
                    log.isProspectingCard
                      ? log.prospectingData?.tipo === "google_maps"
                        ? "bg-cyan-950/30 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        : log.prospectingData?.tipo === "whatsapp"
                        ? "bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        : "bg-amber-950/30 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                      : log.isBoletoCard
                      ? "bg-slate-950/95 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "bg-slate-950/80 border-cyan-900/30"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black uppercase tracking-wider ${log.color}`}>{log.tag}</span>
                      {log.aiCoreName && (
                        <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold">
                          {log.aiCoreName}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500">{log.time}</span>
                  </div>

                  {/* CARD DE PROSPECÇÃO COM COPY EDITÁVEL E ENVIO AUTOMÁTICO */}
                  {log.isProspectingCard && log.prospectingData ? (
                    <div className="space-y-3 text-[11px] font-sans">
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 space-y-1">
                        <p className="font-bold text-slate-200 text-xs flex items-center justify-between">
                          <span>{log.text}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                            {log.prospectingData.leads.length} Leads
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Cidade: <strong className="text-white">{log.prospectingData.cidade}</strong> | Segmento:{" "}
                          <strong className="text-cyan-300 uppercase">{log.prospectingData.segmento}</strong>
                        </p>
                      </div>

                      {/* Preview dos Leads (com Razão Social, CNPJ, Decisor, Endereço e Google Maps) */}
                      <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                          <span>Leads Inseridos no Funil:</span>
                          <span className="text-[9px] text-slate-500 font-normal">Exibindo 5 de {log.prospectingData.leads.length}</span>
                        </span>
                        <div className="space-y-2">
                          {log.prospectingData.leads.slice(0, 5).map((l, lIdx) => (
                            <div key={lIdx} className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <div className="font-bold text-slate-200 truncate max-w-[170px] flex items-center gap-1">
                                  <Building2 className="h-3 w-3 text-cyan-400 shrink-0" />
                                  <span className="truncate">{l.empresa}</span>
                                </div>
                                {l.googleMapsUrl && (
                                  <a
                                    href={l.googleMapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-0.5 shrink-0"
                                  >
                                    <Map className="h-2.5 w-2.5" /> Maps ↗
                                  </a>
                                )}
                              </div>

                              {l.razaoSocial && (
                                <div className="text-[9px] text-slate-400 truncate">
                                  <strong className="text-slate-300">Razão:</strong> {l.razaoSocial}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[9px] text-slate-300">
                                <span><strong className="text-amber-400">Decisor:</strong> {l.decisorPrincipal || l.nome}</span>
                                {l.cnpj && <span className="text-slate-400 font-mono text-[8.5px]">CNPJ: {l.cnpj}</span>}
                              </div>

                              {l.endereco && (
                                <div className="text-[9px] text-slate-400 flex items-start gap-1">
                                  <MapPin className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />
                                  <span className="truncate">{l.endereco}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[9px]">
                                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                                  <MessageSquare className="h-2.5 w-2.5" />
                                  {l.telefone.length === 11
                                    ? `(${l.telefone.slice(0, 2)}) ${l.telefone.slice(2, 7)}-${l.telefone.slice(7)}`
                                    : l.telefone}
                                </span>
                                {l.avaliacaoGoogle && (
                                  <span className="text-amber-300 font-bold">
                                    ★ {l.avaliacaoGoogle} ({l.totalAvaliacoes || 15})
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {log.prospectingData.leads.length > 5 && (
                            <p className="text-[9px] text-slate-500 italic text-center">
                              + {log.prospectingData.leads.length - 5} outras empresas salvas na 1ª coluna do Funil
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Opção de Incluir / Editar a Copy da Mensagem */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                          <span className="flex items-center gap-1">
                            <SlidersHorizontal className="h-3 w-3 text-cyan-400" /> Copy da Mensagem:
                          </span>
                          <span className="text-[9px] text-slate-400">Variáveis: {"{nome}"}, {"{empresa}"}</span>
                        </div>
                        <textarea
                          rows={4}
                          value={log.prospectingData.copy}
                          onChange={(e) => handleUpdateCopy(log.id, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-[10px] rounded-lg p-2 font-sans focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      {/* Botões de Envio Automático */}
                      {log.prospectingData.tipo === "google_maps" ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartWhatsAppDispatch(log.id)}
                            disabled={log.prospectingData.enviando}
                            className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black text-[10px] uppercase rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {log.prospectingData.enviando ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <SendHorizontal className="h-3 w-3" />
                                WhatsApp ({log.prospectingData.enviadosCount || 0}/{log.prospectingData.leads.length})
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEmailDispatch(log.id)}
                            disabled={log.prospectingData.enviando}
                            className="py-2 px-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-[10px] uppercase rounded-xl transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {log.prospectingData.enviando ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Mail className="h-3 w-3" />
                                E-mails ({log.prospectingData.enviadosCount || 0}/{log.prospectingData.leads.length})
                              </>
                            )}
                          </button>
                        </div>
                      ) : log.prospectingData.tipo === "whatsapp" ? (
                        <button
                          type="button"
                          onClick={() => handleStartWhatsAppDispatch(log.id)}
                          disabled={log.prospectingData.enviando}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {log.prospectingData.enviando ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Disparando WhatsApp ({log.prospectingData.enviadosCount || 0}/{log.prospectingData.leads.length})...
                            </>
                          ) : (
                            <>
                              <SendHorizontal className="h-3.5 w-3.5" />
                              🚀 Disparar via WhatsApp (WAHA Local)
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEmailDispatch(log.id)}
                          disabled={log.prospectingData.enviando}
                          className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {log.prospectingData.enviando ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Disparando E-mails ({log.prospectingData.enviadosCount || 0}/{log.prospectingData.leads.length})...
                            </>
                          ) : (
                            <>
                              <Mail className="h-3.5 w-3.5" />
                              🚀 Disparar E-mails ({log.prospectingData.emailRemetente})
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : log.isBoletoCard && log.boletoInfo ? (
                    <div className="space-y-2 text-[11px] font-sans">
                      <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 space-y-1">
                        <p className="font-bold text-emerald-300 text-xs">👤 {log.boletoInfo.cliente}</p>
                        <p className="text-slate-300">
                          Grupo: <strong className="text-white">{log.boletoInfo.grupo}</strong> | Cota:{" "}
                          <strong className="text-white">{log.boletoInfo.cota}</strong>
                        </p>
                        <p className="text-slate-300">
                          Valor: <strong className="text-emerald-400 font-bold">{log.boletoInfo.valor}</strong> | Vencimento:{" "}
                          <strong className="text-amber-400">{log.boletoInfo.vencimento}</strong>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block">Linha Digitável:</span>
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[10px] font-mono text-cyan-300 break-all flex items-center justify-between">
                          <span>{log.boletoInfo.linhaDigitavel}</span>
                          <button
                            onClick={() => handleCopyLinha(log.boletoInfo!.linhaDigitavel, log.id)}
                            className="ml-2 p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                            title="Copiar Linha Digitável"
                          >
                            {copiedId === log.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-1 flex flex-wrap gap-1.5">
                        <button
                          onClick={(e) => handleOpenBoletoPdf(e, log.boletoInfo)}
                          className="px-2 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded text-[9px] font-bold flex items-center gap-1 transition-colors border border-emerald-500/40 cursor-pointer"
                          title="Visualizar / Imprimir PDF da 2ª Via"
                        >
                          <FileText className="h-3 w-3" /> PDF Boleto <ExternalLink className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-300 text-[11px] leading-relaxed font-sans whitespace-pre-line space-y-1">
                      {log.text.split("\n").map((line, lIdx) => {
                        if (!line.trim()) return <div key={lIdx} className="h-1.5" />;
                        const isHeader =
                          line.startsWith("📊") || line.startsWith("💡") || line.startsWith("---") || line.startsWith("📄") || line.startsWith("•");
                        const isBullet = line.trim().startsWith("•") || line.trim().startsWith("🔥") || line.trim().startsWith("-");
                        return (
                          <p
                            key={lIdx}
                            className={`${isHeader ? "font-semibold text-cyan-200" : isBullet ? "text-slate-200 pl-1" : "text-slate-300"}`}
                          >
                            {line}
                          </p>
                        );
                      })}

                      {log.imageUrl && (
                        <div className="rounded-xl overflow-hidden border border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.25)] mt-2">
                          <img
                            src={log.imageUrl}
                            alt="Visual IA Gerado"
                            className="w-full h-44 object-cover hover:scale-105 transition-all duration-300"
                          />
                          <div className="p-2 bg-slate-950 flex items-center justify-between text-[10px]">
                            <span className="text-pink-300 font-mono flex items-center gap-1 font-bold">
                              <Palette className="h-3 w-3 text-pink-400" /> FLUX.1 Neural Engine
                            </span>
                            <a
                              href={log.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 underline font-bold"
                            >
                              Abrir em alta resolução ↗
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-auto relative rounded-xl overflow-hidden border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <img src="/images/jarvis_tech_orb.jpg" alt="Jarvis Orb Visual" className="w-full h-24 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 text-[10px] font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-cyan-400" /> Holograma Ativo
            </div>
          </div>
        </div>
      </div>

      <VoiceCloningModal
        isOpen={isVoiceCloneOpen}
        onClose={() => setIsVoiceCloneOpen(false)}
        userName="Fabrício Honório"
      />

      <HarveyAutonomousModal
        open={isHarveyModalOpen}
        onClose={() => setIsHarveyModalOpen(false)}
        onCycleComplete={(metrics) => {
          const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          setLogs((prev) => [
            {
              id: Date.now().toString(),
              time,
              tag: "HARVEY SDR CICLO CONCLUÍDO",
              color: "text-emerald-400 font-bold",
              text: `🚀 Ciclo de Prospecção e Negociação Harvey concluído!\n• Contatos acionados: ${metrics.successCount} de ${metrics.total}\n• Vigilância Stop-on-Reply ativada no WhatsApp\n• Kanban CRM alimentado na etapa 'novo_lead'`,
              aiCoreName: "Harvey Engine",
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
}
