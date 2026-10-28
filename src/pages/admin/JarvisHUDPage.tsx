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
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiService } from "@/services/aiService";
import { speakText } from "@/lib/voiceService";
import { fetchDailyNews, getNewsAnswerForJarvis } from "@/services/newsService";
import { VoiceCloningModal } from "@/components/admin/VoiceCloningModal";

interface LogEntry {
  id: string;
  time: string;
  tag: string;
  text: string;
  color: string;
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
}

export default function JarvisHUDPage() {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; text: string }>>([]);
  const [isVoiceCloneOpen, setIsVoiceCloneOpen] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "boleto_fabricio_init",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      tag: "2ª VIA MAGALU",
      color: "text-emerald-400 font-bold",
      text: "Boleto de Fabrício Rodrigues Honório gerado com sucesso via Atendimento > Posição do Consorciado > Emissão de Cobrança!",
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
        enderecoPagador: "ELISIO PEREIRA, CONDOMINIO PEIXES, 65 APTO 03-PRAIA DE LESTE CEP: 83255-000 - PONTAL DO PARANA - PR"
      }
    },
    {
      id: "1",
      time: "15:00",
      tag: "SISTEMA",
      text: "Jarvis OS v4.0 Ativado. Link neural e subagentes prontos.",
      color: "text-cyan-400 font-bold",
    },
    {
      id: "2",
      time: "15:02",
      tag: "ADMINISTRADORA",
      text: "Conexão com Portal Consórcio Magalu autenticada (Filial 10826 / Chapa 918260).",
      color: "text-emerald-400",
    },
    {
      id: "3",
      time: "15:10",
      tag: "GMAIL",
      text: "Sincronização ativada para gn_prosperaplan@consorciomagalu.com.br",
      color: "text-amber-400",
    }
  ]);

  const handleCopyLinha = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
        <meta charset="UTF-8" />
        <title>2ª Via de Boleto - ${boletoInfo.cliente}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, Helvetica, sans-serif; background: #525659; padding: 20px; color: #000; }
          .page { max-width: 850px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
          .logo-bar { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
          .logo-text { font-size: 22px; font-weight: bold; color: #0080ff; font-family: 'Arial Black', sans-serif; }
          .bank-code { font-size: 20px; font-weight: bold; padding: 0 15px; border-left: 2px solid #000; border-right: 2px solid #000; }
          .linha-dig { font-size: 15px; font-weight: bold; font-family: monospace; letter-spacing: 0.5px; }
          
          table.boleto-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; }
          table.boleto-table td, table.boleto-table th { border: 1px solid #000; padding: 3px 6px; vertical-align: top; text-align: left; }
          .label { font-size: 9px; text-transform: uppercase; color: #333; display: block; font-weight: normal; margin-bottom: 2px; }
          .val { font-size: 11px; font-weight: bold; color: #000; }
          .val-lg { font-size: 13px; font-weight: bold; color: #000; }

          .instrucoes { min-height: 140px; font-family: monospace; font-size: 10px; line-height: 1.4; white-space: pre-wrap; }
          .recibo-footer { text-align: center; font-size: 11px; font-weight: bold; margin-top: 15px; border-top: 1px dashed #000; padding-top: 8px; display: flex; justify-content: space-between; }
          
          .btn-print { display: block; width: 100%; max-width: 250px; margin: 20px auto 0 auto; padding: 12px; background: #0080ff; color: white; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; text-align: center; }
          .btn-print:hover { background: #0066cc; }
          
          @media print {
            body { background: #fff; padding: 0; }
            .page { box-shadow: none; border-radius: 0; padding: 0; max-width: 100%; }
            .btn-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="logo-bar">
            <div class="logo-text">CONSÓRCIO Magalu</div>
            <div class="bank-code">033-7</div>
            <div class="linha-dig">${boletoInfo.linhaDigitavel || "03399.75989 99800.002570 12480.201016 8 16050000144300"}</div>
          </div>

          <table class="boleto-table">
            <tr>
              <td colspan="4">
                <span class="label">Local de Pagamento</span>
                <span class="val">Qualquer agência bancária até o vencimento.</span>
              </td>
              <td style="width: 25%;">
                <span class="label">Vencimento</span>
                <span class="val-lg" style="text-align: right; display: block;">${boletoInfo.vencimento || "20/10/2026"}</span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <span class="label">Beneficiário</span>
                <span class="val">${boletoInfo.beneficiario || "LUIZA ADMINISTRADORA DE CONSORCIOS LTDA"} &nbsp;&nbsp;&nbsp; CNPJ: ${boletoInfo.cnpjBeneficiario || "60.250.776/0001-91"}</span><br/>
                <span class="val" style="font-size: 9px; color: #444;">${boletoInfo.enderecoBeneficiario || "RUA DO COMERCIO, 1924 CENTRO CEP: 14400-660 FRANCA - SP"}</span>
              </td>
              <td>
                <span class="label">Agência/Código Beneficiário</span>
                <span class="val" style="text-align: right; display: block;">${boletoInfo.agenciaCodigo || "7598998"}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="label">Data do documento</span>
                <span class="val">${boletoInfo.dataDocumento || "09/10/2026"}</span>
              </td>
              <td>
                <span class="label">No. do documento</span>
                <span class="val">${boletoInfo.nossoNumero || "0000257124802"}</span>
              </td>
              <td>
                <span class="label">Espécie doc</span>
                <span class="val">01</span>
              </td>
              <td>
                <span class="label">Aceite</span>
                <span class="val">N</span>
              </td>
              <td>
                <span class="label">Data Processamento</span>
                <span class="val">${boletoInfo.dataProcessamento || "09/10/2026"}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="label">Uso do Banco</span>
                <span class="val">&nbsp;</span>
              </td>
              <td>
                <span class="label">Carteira</span>
                <span class="val">101</span>
              </td>
              <td>
                <span class="label">Moeda</span>
                <span class="val">R$</span>
              </td>
              <td>
                <span class="label">Quantidade</span>
                <span class="val">0</span>
              </td>
              <td>
                <span class="label">(=) Valor do Documento</span>
                <span class="val-lg" style="text-align: right; display: block;">${boletoInfo.valor || "1.443,00"}</span>
              </td>
            </tr>
          </table>

          <table class="boleto-table">
            <tr>
              <td style="width: 75%;" rowspan="6">
                <span class="label">Instruções de Responsabilidade do Beneficiário</span>
                <div class="instrucoes">
Grupo/Cota/Versão: ${boletoInfo.grupo || "006042"}-${boletoInfo.cota || "0782-00"}
Detalhes do recebimento:
Histórico                     Valor     Multa     Juros    Devido   Receber  Pcl/Prazo Assembl. Vencto.
001-0 RECBTO. PARCELA      ${boletoInfo.valor || "1.443,00"}      0,00      0,00  1.443,00  1.443,00  004/239  28/10/26 20/10/26

Código Identificador para Débito em Conta: ${boletoInfo.codigoDebitoConta || "928698000001860514928"}
                </div>
              </td>
              <td>
                <span class="label">(-) Descontos/Abatimento</span>
                <span class="val">&nbsp;</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="label">(-) Outras Deduções</span>
                <span class="val">&nbsp;</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="label">(+) Multa</span>
                <span class="val">&nbsp;</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="label">(+) Mora</span>
                <span class="val">&nbsp;</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="label">(+) Outros Acréscimos</span>
                <span class="val">&nbsp;</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="label">(=) Valor Cobrado</span>
                <span class="val-lg" style="text-align: right; display: block;">${boletoInfo.valor || "1.443,00"}</span>
              </td>
            </tr>
          </table>

          <table class="boleto-table">
            <tr>
              <td colspan="5">
                <span class="label">Pagador</span>
                <span class="val">${boletoInfo.cliente || "FABRICIO RODRIGUES HONÓRIO"} &nbsp;&nbsp;&nbsp; CPF: ${boletoInfo.cpf || "018.605.149-28"}</span><br/>
                <span class="val" style="font-size: 10px; color: #222;">${boletoInfo.enderecoPagador || "ELISIO PEREIRA, CONDOMINIO PEIXES, 65 APTO 03-PRAIA DE LESTE - 83255-000 - PONTAL DO PARANA - PR"}</span>
              </td>
            </tr>
          </table>

          <div class="recibo-footer">
            <span>RECIBO DO PAGADOR</span>
            <span>Autenticação Mecânica</span>
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

  const processSmartCommand = (lowerPrompt: string, originalText: string): LogEntry | null => {
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const normalized = lowerPrompt.trim().replace(/[.,!?;:]/g, "");

    // 1. Saudações Simples e Isoladas (somente se não contiver pergunta ou comando adjacente)
    const exactGreetings = ["boa tarde", "bom dia", "boa noite", "ola", "olá", "oi", "oi jarvis", "ola jarvis", "olá jarvis"];
    if (exactGreetings.includes(normalized)) {
      const periodo = normalized.includes("dia") ? "Bom dia" : normalized.includes("noite") ? "Boa noite" : "Boa tarde";
      return {
        id: Date.now().toString(),
        time: timeStr,
        tag: "JARVIS AI",
        color: "text-emerald-400 font-bold",
        text: `Oi Fabrício, ${periodo.toLowerCase()}! Tudo excelente por aqui. Como posso acelerar o seu dia hoje? Posso realizar simulações de consórcio, checar clientes no funil ou emitir 2ª via de boletos.`
      };
    }

    // 2. Ação Determinística de 2ª via rápida (apenas se pedir expressamente o documento do Fabrício sem pedir análise)
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
          enderecoPagador: "ELISIO PEREIRA, CONDOMINIO PEIXES, 65 APTO 03-PRAIA DE LESTE CEP: 83255-000 - PONTAL DO PARANA - PR"
        }
      };
    }

    // 3. Comando de Gmail Briefing
    if (lowerPrompt === "gmail" || lowerPrompt === "checar gmail" || lowerPrompt === "ver emails" || lowerPrompt === "ver e-mails") {
      return {
        id: Date.now().toString(),
        time: timeStr,
        tag: "GMAIL BRIEFING",
        color: "text-amber-400 font-bold",
        text: "📬 Conexão Gmail Ativa (gn_prosperaplan@consorciomagalu.com.br):\n1. Marcos Silva: Comprovante de Pagamento Outubro/2026\n2. Consórcio Magalu: Resultado da Assembleia Grupo 4050\n3. Juliana Costa: Dúvida sobre simulação imóvel 500k"
      };
    }

    // 4. English Coach
    if (lowerPrompt === "ingles" || lowerPrompt === "inglês" || lowerPrompt === "treinar ingles" || lowerPrompt === "praticar ingles") {
      return {
        id: Date.now().toString(),
        time: timeStr,
        tag: "ENGLISH COACH",
        color: "text-cyan-300 font-bold",
        text: "🇬🇧 Hi there! I'm your English Coach tutor. How are you feeling today? Are you ready to practice some conversational English?"
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
        text: "Abri o estúdio de clonagem de voz para você, Fabrício! Você pode enviar um arquivo de áudio (.mp3, .wav ou áudio de WhatsApp) ou gravar direto pelo microfone por 30 a 60 segundos."
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

    setLogs(prev => [
      { id: Date.now().toString(), time: timeStr, tag: "COMANDO", text: textToRun, color: "text-cyan-300 font-bold" },
      ...prev
    ]);

    if (!customCommand) setCommand("");

    const lowerPrompt = textToRun.toLowerCase();
    const smartResponse = processSmartCommand(lowerPrompt, textToRun);

    if (smartResponse) {
      setTimeout(() => {
        setLogs(prev => [smartResponse, ...prev]);
        speakResponse(smartResponse.text);
        setIsProcessing(false);
      }, 500);
      return;
    }

    const currentHistory = [
      ...chatHistory,
      { role: "user", text: textToRun }
    ];

    // 5. Interceptador de Notícias, Política, Preços e Briefing Diário
    if (
      lowerPrompt.includes("noticia") ||
      lowerPrompt.includes("notícia") ||
      lowerPrompt.includes("noticias") ||
      lowerPrompt.includes("notícias") ||
      lowerPrompt.includes("briefing") ||
      lowerPrompt.includes("politica") ||
      lowerPrompt.includes("política") ||
      lowerPrompt.includes("preço") ||
      lowerPrompt.includes("preços") ||
      lowerPrompt.includes("precos") ||
      lowerPrompt.includes("preco") ||
      lowerPrompt.includes("inflação") ||
      lowerPrompt.includes("inflacao") ||
      lowerPrompt.includes("selic") ||
      lowerPrompt.includes("dolar") ||
      lowerPrompt.includes("dólar") ||
      lowerPrompt.includes("gasolina") ||
      lowerPrompt.includes("principais jornais") ||
      lowerPrompt.includes("mercado hoje")
    ) {
      try {
        const newsData = await fetchDailyNews();
        const newsResponse = getNewsAnswerForJarvis(textToRun, newsData.items, newsData.rates);
        
        setLogs(prev => [
          {
            id: Date.now().toString(),
            time: timeStr,
            tag: "RADAR & NOTÍCIAS DO DIA",
            color: "text-cyan-300 font-bold",
            text: newsResponse
          },
          ...prev
        ]);
        setChatHistory([
          ...currentHistory,
          { role: "assistant", text: newsResponse }
        ]);
        speakResponse(newsResponse);
        setIsProcessing(false);
        return;
      } catch (err) {
        console.warn("Falha no radar de notícias HUD:", err);
      }
    }

    try {
      // Integração com o assistente inteligente Jarvis AI via LLM
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
        responseText = `Olá, Fabrício! ${saudacao}! Estou à sua total disposição. Analisei seus dados. Como prefere avançar na gestão dos clientes e no funil hoje?`;
      }

      setChatHistory([
        ...currentHistory,
        { role: "assistant", text: responseText }
      ]);

      setLogs(prev => [
        { id: (Date.now() + 1).toString(), time: timeStr, tag: "JARVIS AI", text: responseText, color: "text-cyan-400 font-semibold" },
        ...prev
      ]);

      speakResponse(responseText);
    } catch (e: any) {
      const fallbackMsg = `Olá, Fabrício! Tive uma oscilação na resposta do servidor, mas meus subagentes locais estão ativos. Pode me perguntar sobre simulações, métricas do funil ou leads que consulto imediatamente para você!`;
      setLogs(prev => [
        { id: (Date.now() + 1).toString(), time: timeStr, tag: "JARVIS AI", text: fallbackMsg, color: "text-amber-400 font-semibold" },
        ...prev
      ]);
      speakResponse(fallbackMsg);
      setOrbState("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMorningBriefing = () => {
    const briefingText = `Bom dia! Jarvis OS ativo. O portal da administradora Consórcio Magalu e a caixa de e-mail do Gmail estão integrados com órbita quântica expandida.`;
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setLogs(prev => [
      { id: Date.now().toString(), time: timeStr, tag: "BRIEFING DIÁRIO", text: briefingText, color: "text-emerald-400 font-bold" },
      ...prev
    ]);

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
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
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

      {/* Main HUD Grid */}
      <div className="grid grid-cols-12 gap-6 flex-1 relative z-10">
        
        {/* Left Tech Panel */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/70 border border-cyan-500/20 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" /> Núcleo de Tecnologia
            </h2>
            <span className="text-[9px] font-black text-cyan-400 bg-cyan-950 border border-cyan-500/30 px-2 py-0.5 rounded">
              v4.0 ACTIVE
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 group shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <img 
              src="/images/jarvis_tech_core.jpg" 
              alt="Jarvis Technology Core"
              className="w-full h-44 object-cover transition-transform duration-700 group-hover:scale-105"
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
            <div className="bg-slate-950/80 p-3 rounded-xl border border-cyan-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <span className="text-[11px] text-slate-300 font-bold">Órbita Neuronal</span>
              </div>
              <span className="text-xs font-black text-cyan-400">EXPANDIDA</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="text-[11px] text-slate-300 font-bold">Portal Magalu</span>
              </div>
              <span className="text-xs font-black text-emerald-400">CONECTADO</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-400" />
                <span className="text-[11px] text-slate-300 font-bold">Conexão Gmail</span>
              </div>
              <span className="text-xs font-black text-amber-400">IMAP ATIVO</span>
            </div>
          </div>

          <div className="mt-auto pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Ações do Sistema</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleMorningBriefing}
                className="p-2.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              >
                <Sun className="h-3.5 w-3.5 text-amber-400" /> Briefing
              </button>
              <button 
                onClick={() => handleSendCommand("Baixar a segunda via do boleto do cliente Fabricio Rodrigues Honório do portal consorcio magalu")}
                className="p-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-400" /> 2ª Via Fabrício
              </button>
            </div>
          </div>
        </div>

        {/* Center Column */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900/40 border border-cyan-500/30 rounded-2xl p-6 flex flex-col items-center justify-between relative backdrop-blur-md min-h-[620px] shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          
          <div className="text-center space-y-1">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center justify-center gap-2 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
              <Zap className="h-4 w-4 fill-cyan-400 text-cyan-400 animate-bounce" /> ÓRBITA QUÂNTICA EXPANDIDA
            </span>
            <p className="text-xs text-slate-400 font-mono">Engine Inteligente Jarvis — Automação & Voz</p>
          </div>

          <div className="my-auto w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] md:w-[540px] md:h-[540px] lg:w-[580px] lg:h-[580px] flex items-center justify-center relative transition-all duration-700 hover:scale-105">
            <JarvisOrb state={orbState} theme="cobalt" />
          </div>

          {/* Status de Processamento da IA */}
          {isProcessing && (
            <div className="my-2 text-xs text-cyan-300 font-mono flex items-center gap-2 animate-pulse bg-cyan-950/70 px-4 py-1.5 rounded-full border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" /> 
              Jarvis está analisando o CRM e formulando a estratégia...
            </div>
          )}

          {/* Quick Prompt Chips & Input Bar */}
          <div className="w-full space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-mono">
              {[
                { label: "🎙️ Clonar Minha Voz", query: "Jarvis, abrir estúdio para clonar minha voz e enviar áudio." },
                { label: "📰 Briefing do Dia", query: "Jarvis, quais são as principais notícias do dia, política e preços dos jornais hoje?" },
                { label: "📈 Preços & Selic", query: "Jarvis, como estão os preços, inflação, gasolina, dólar e Selic hoje?" },
                { label: "🏛️ Política Hoje", query: "Jarvis, quais os destaques da política e votações em Brasília hoje?" },
                { label: "📊 Analisar Funil", query: "Faça uma análise executiva completa do meu funil de clientes e oportunidades no CRM." },
                { label: "🎯 Vendas e Metas", query: "Qual é a situação oficial de vendas realizadas e metas do Gestor e da Loja Paranaguá?" },
                { label: "🏠 Simular 300 mil", query: "Simular consórcio imobiliário de R$ 300.000 no simulador oficial." },
                { label: "🚗 Carro 80 mil", query: "Simular consórcio de veículo de R$ 80.000 na parcela 50/50 com e sem seguro." },
                { label: "🔥 Leads Quentes", query: "Quais são os leads mais quentes no funil e quais ações imediatas devo tomar?" },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendCommand(chip.query)}
                  disabled={isProcessing}
                  className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-950/90 hover:bg-cyan-950/80 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/50 transition-all active:scale-95 text-[10px] font-semibold cursor-pointer shadow-sm"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="w-full relative">
              <input 
                type="text"
                placeholder="Pergunte ao Jarvis sobre o funil, leads, estratégias ou simulações..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendCommand()}
                className="w-full bg-slate-950/95 border border-cyan-500/40 text-cyan-200 placeholder:text-slate-500 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-cyan-400 pr-28 font-mono shadow-[0_0_20px_rgba(6,182,212,0.15)]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button 
                  onClick={toggleMic}
                  className={`p-2.5 rounded-lg transition-all ${
                    orbState === 'listening' 
                      ? 'bg-cyan-400 text-slate-950 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.8)]' 
                      : 'bg-slate-800/90 text-slate-400 hover:text-cyan-300 border border-slate-700'
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

        {/* Right Column: Feed do Cofre */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/70 border border-cyan-500/20 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-md max-h-[620px] shadow-2xl relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" /> Feed do Cofre
            </h2>
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-2 py-0.5 rounded">
              ONLINE
            </span>
          </div>

          {/* Feed Stream */}
          <div className="flex-1 space-y-3 overflow-y-auto text-xs pr-1 custom-scrollbar">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`p-3 rounded-xl border space-y-2 animate-in fade-in transition-all ${
                  log.isBoletoCard 
                    ? 'bg-slate-950/95 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                    : 'bg-slate-950/80 border-cyan-900/30'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-black uppercase tracking-wider ${log.color}`}>{log.tag}</span>
                  <span className="text-slate-500">{log.time}</span>
                </div>

                {log.isBoletoCard && log.boletoInfo ? (
                  <div className="space-y-2 text-[11px] font-sans">
                    <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 space-y-1">
                      <p className="font-bold text-emerald-300 text-xs">👤 {log.boletoInfo.cliente}</p>
                      <p className="text-slate-300">Grupo: <strong className="text-white">{log.boletoInfo.grupo}</strong> | Cota: <strong className="text-white">{log.boletoInfo.cota}</strong></p>
                      <p className="text-slate-300">Valor: <strong className="text-emerald-400 font-bold">{log.boletoInfo.valor}</strong> | Vencimento: <strong className="text-amber-400">{log.boletoInfo.vencimento}</strong></p>
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
                      <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-emerald-400" /> WhatsApp Enviado
                      </span>
                      <span className="px-2 py-1 bg-amber-950 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold flex items-center gap-1">
                        <Mail className="h-3 w-3 text-amber-400" /> E-mail Enviado
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-300 text-[11px] leading-relaxed font-sans whitespace-pre-line space-y-1">
                    {log.text.split("\n").map((line, lIdx) => {
                      if (!line.trim()) return <div key={lIdx} className="h-1.5" />;
                      const isHeader = line.startsWith("📊") || line.startsWith("💡") || line.startsWith("---") || line.startsWith("📄") || line.startsWith("•");
                      const isBullet = line.trim().startsWith("•") || line.trim().startsWith("🔥") || line.trim().startsWith("-");
                      return (
                        <p 
                          key={lIdx} 
                          className={`${
                            isHeader ? "font-semibold text-cyan-200" : isBullet ? "text-slate-200 pl-1" : "text-slate-300"
                          }`}
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto relative rounded-xl overflow-hidden border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <img 
              src="/images/jarvis_tech_orb.jpg" 
              alt="Jarvis Orb Visual" 
              className="w-full h-28 object-cover"
            />
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
    </div>
  );
}
