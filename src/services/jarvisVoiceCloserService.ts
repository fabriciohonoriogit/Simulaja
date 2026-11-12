/**
 * ==============================================================================
 * SIMULAJÁ CRM • JARVIS AGENTE CLOSER NEGOCIADOR DE VOZ (METODOLOGIA SRV)
 * ==============================================================================
 * Conduz a negociação baseada em:
 * 1. S - SONHO: Descobre o verdadeiro propósito e conquista (família, imóvel, frota, liberdade).
 * 2. R - REALIDADE: Diagnostica a capacidade de investimento confortável sem apertar o bolso.
 * 3. V - VIABILIDADE: Apresenta o crédito sob medida de forma tão irresistível que o cliente deseja comprar.
 * SEM EMPURRAR PRODUTO. SEM FALAR DE PARCELA ANTES DA HORA.
 * ==============================================================================
 */

import { speakJarvisText, stopVoice, VoiceEmotion } from "@/lib/voiceService";
import { supabase } from "@/integrations/supabase/client";

export type FaseSRV = "sonho" | "realidade" | "viabilidade" | "fechamento";

export interface CloserLeadContext {
  id?: string;
  nome: string;
  telefone?: string;
  valor_credito?: number | string;
  tipo_consorcio?: string;
  segmento?: string;
  historicoMensagens?: string[];
  objeçaoAtual?: string;
  sonhoIdentificado?: string;
  capacidadeMensal?: number | string;
  faseSRV?: FaseSRV;
}

export interface CloserMessage {
  id: string;
  sender: "jarvis" | "cliente" | "sistema";
  text: string;
  emotion?: VoiceEmotion;
  faseSRV?: FaseSRV;
  timestamp: string;
}

export const CLOSER_SRV_SYSTEM_PROMPT = `Você é o JARVIS, Assistente Executivo e Negociador Consultivo de Elite do Consórcio Magalu, representando o Gestor Fabrício Honório.

SUA FILOSOFIA: METODOLOGIA SRV (SONHO -> REALIDADE -> VIABILIDADE)
Você NUNCA empurra produto e NUNCA sai oferecendo parcelas ou taxas logo de início. Seu foco absoluto é o SONHO do cliente. O produto só é apresentado no final, desenhado sob medida para a capacidade real dele, de forma tão perfeita que é o cliente quem pede para fechar.

AS 3 ETAPAS OBRIGATÓRIAS DA CONVERSA:

1. [S] O SONHO (Investigação e Conexão Emocional):
   - Pergunte o que ele realmente deseja realizar (construir a casa dos sonhos para a família, renovar a frota sem descapitalizar a empresa, trocar de caminhonete, garantir o futuro dos filhos).
   - Faça o cliente sentir e visualizar a conquista: "Me conta mais sobre como é esse projeto... onde vai ser? Quem vai aproveitar com você?".
   - PROIBIDO falar de valor de parcela ou taxa de juros nesta etapa.

2. [R] A REALIDADE & CAPACIDADE (Diagnóstico Financeiro sem Pressão):
   - Compreenda o fluxo e a capacidade de investimento mensal sem aperto: "Para tirarmos esse sonho do papel com total tranquilidade, quanto por mês fica confortável no seu orçamento sem comprometer suas reservas?".
   - Verifique se há recursos para acelerar (usar carro usado como lance, FGTS ou se prefere lance embutido que sai da própria carta sem colocar dinheiro extra).

3. [V] A VIABILIDADE & VALOR (Apresentação do Crédito Sob Medida):
   - Só agora apresente a solução, conectando diretamente com o sonho dito por ele: "Entendi perfeitamente. Sabendo do seu objetivo de [Sonho] e que [Capacidade] é o seu valor confortável, o que desenhamos para você é...".
   - Mostre como o consórcio protege o patrimônio dele sem juros bancários.
   - Conclua com pergunta de escolha confortável (2 opções): "Prefere que eu já segure essa condição da assembleia deste mês no seu nome ou prefere que eu te envie o estudo detalhado no WhatsApp para você olhar com calma?".

DIRETRIZES DE FALA:
- Respostas curtas (1 a 3 frases por intervenção).
- Linguagem natural, empática, acolhedora e confiante.`;

export class JarvisVoiceCloserService {
  private isCallActive = false;
  private recognition: any = null;
  private listeners: ((msg: CloserMessage) => void)[] = [];
  private stateListeners: ((active: boolean) => void)[] = [];
  private faseListeners: ((fase: FaseSRV) => void)[] = [];
  private currentContext: CloserLeadContext | null = null;
  private currentFase: FaseSRV = "sonho";
  private conversationHistory: { role: "system" | "user" | "assistant"; content: string }[] = [];

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = "pt-BR";

      this.recognition.onresult = async (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          if (transcript) {
            await this.handleClientSpeech(transcript);
          }
        }
      };

      this.recognition.onerror = (e: any) => {
        console.warn("[Closer SRV] Erro reconhecimento de voz:", e.error);
      };
    }
  }

  public subscribeMessages(cb: (msg: CloserMessage) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public subscribeState(cb: (active: boolean) => void) {
    this.stateListeners.push(cb);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== cb);
    };
  }

  public subscribeFase(cb: (fase: FaseSRV) => void) {
    this.faseListeners.push(cb);
    return () => {
      this.faseListeners = this.faseListeners.filter(l => l !== cb);
    };
  }

  public setFase(fase: FaseSRV) {
    this.currentFase = fase;
    this.faseListeners.forEach(cb => cb(fase));
  }

  public getFase(): FaseSRV {
    return this.currentFase;
  }

  private emitMessage(sender: CloserMessage["sender"], text: string, emotion: VoiceEmotion = "empático") {
    const msg: CloserMessage = {
      id: Math.random().toString(36).substring(7),
      sender,
      text,
      emotion,
      faseSRV: this.currentFase,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };
    this.listeners.forEach(cb => cb(msg));
  }

  private emitState(active: boolean) {
    this.isCallActive = active;
    this.stateListeners.forEach(cb => cb(active));
  }

  /**
   * Inicia a sessão de chamada consultiva SRV
   */
  public async startVoiceCall(context: CloserLeadContext) {
    this.currentContext = context;
    this.currentFase = "sonho";
    this.setFase("sonho");

    this.conversationHistory = [
      { role: "system", content: `${CLOSER_SRV_SYSTEM_PROMPT}\n\nLEAD ATUAL: ${context.nome}. Segmento de interesse: ${context.tipo_consorcio || 'Planejamento'}.` }
    ];

    this.emitState(true);
    this.emitMessage("sistema", `Chamada conectada com ${context.nome}. Metodologia SRV ativada: [Fase 1: O Sonho].`);

    // Abertura consultiva humana - Foco no sonho, sem jargões de consórcio
    const primeiroNome = context.nome.split(" ")[0];
    const abertura = `Olá, ${primeiroNome}! Tudo bem com você? Aqui é o Jarvis, junto com o Fabrício Honório do Consórcio Magalu. Eu não estou te ligando para te empurrar consórcio ou falar de parcelas, mas sim para entender o seu projeto e como podemos te ajudar a tirar esse objetivo do papel. Me conta: qual é a grande conquista que você tem em mente para os próximos meses?`;

    this.emitMessage("jarvis", abertura, "alegre");
    await this.speak(abertura, "alegre");

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (err) {}
    }
  }

  /**
   * Trata a fala do cliente guiando a jornada SRV
   */
  public async handleClientSpeech(userText: string) {
    if (!this.isCallActive) return;

    this.emitMessage("cliente", userText);
    this.conversationHistory.push({ role: "user", content: userText });

    // Determina a evolução da fase SRV com base no diálogo
    this.atualizarEvolucaoSRV(userText);

    try {
      const resposta = await this.generateSRVResponse(userText);
      this.emitMessage("jarvis", resposta.text, resposta.emotion);
      this.conversationHistory.push({ role: "assistant", content: resposta.text });

      await this.speak(resposta.text, resposta.emotion);
    } catch (e: any) {
      const fallback = this.obterRespostaPadraoFase();
      this.emitMessage("jarvis", fallback.text, fallback.emotion);
      await this.speak(fallback.text, fallback.emotion);
    }
  }

  private atualizarEvolucaoSRV(userText: string) {
    const lower = userText.toLowerCase();

    // Transição de Sonho para Realidade/Capacidade
    if (this.currentFase === "sonho") {
      if (lower.includes("casa") || lower.includes("imovel") || lower.includes("carro") || lower.includes("caminh") || lower.includes("reforma") || lower.includes("terreno") || lower.includes("empresa") || lower.length > 25) {
        if (this.currentContext) this.currentContext.sonhoIdentificado = userText;
        this.setFase("realidade");
        this.emitMessage("sistema", "Sonho identificado! Transição para [Fase 2: Realidade & Capacidade Financeira].");
      }
    }
    // Transição de Realidade para Viabilidade
    else if (this.currentFase === "realidade") {
      if (lower.match(/\d+/) || lower.includes("mil") || lower.includes("cem") || lower.includes("reais") || lower.includes("mes") || lower.includes("capacidade") || lower.includes("lance")) {
        if (this.currentContext) this.currentContext.capacidadeMensal = userText;
        this.setFase("viabilidade");
        this.emitMessage("sistema", "Capacidade mapeada! Transição para [Fase 3: Viabilidade & Apresentação de Valor].");
      }
    }
    // Transição para Fechamento
    else if (this.currentFase === "viabilidade") {
      if (lower.includes("gostei") || lower.includes("faz sentido") || lower.includes("sim") || lower.includes("como funciona") || lower.includes("pode ser") || lower.includes("manda")) {
        this.setFase("fechamento");
        this.emitMessage("sistema", "Cliente engajado! Transição para [Fase 4: Formalização de Fechamento].");
      }
    }
  }

  private async generateSRVResponse(userText: string): Promise<{ text: string; emotion: VoiceEmotion }> {
    try {
      const { data, error } = await supabase.functions.invoke("chat-closer-ia", {
        body: {
          messages: this.conversationHistory,
          leadContext: this.currentContext,
          faseSRV: this.currentFase,
          lastUserMessage: userText
        }
      });

      if (!error && data?.reply) {
        return {
          text: data.reply,
          emotion: data.emotion || "empático"
        };
      }
    } catch (err) {}

    return this.obterRespostaPadraoFase(userText);
  }

  private obterRespostaPadraoFase(userText: string = ""): { text: string; emotion: VoiceEmotion } {
    if (this.currentFase === "sonho") {
      return {
        text: "Que conquista incrível! Um projeto como esse transforma completamente a vida da gente. E me diz: você tem um prazo ideal que gostaria de ver isso acontecendo, ou quer se planejar com tranquilidade?",
        emotion: "alegre"
      };
    }

    if (this.currentFase === "realidade") {
      return {
        text: "Perfeito! Para que você conquiste isso sem apertar seu padrão de vida e com total segurança, qual valor mensal hoje fica mais confortável para o seu orçamento investir?",
        emotion: "empático"
      };
    }

    if (this.currentFase === "viabilidade") {
      const sonho = this.currentContext?.sonhoIdentificado ? "conquistar o seu projeto" : "sua conquista";
      return {
        text: `Excelente. Sabendo que o seu foco é ${sonho} e com esse aporte confortável, nós conseguimos estruturar um crédito sob medida onde você não paga um único centavo de juros bancários. Além disso, podemos usar lance embutido de até 30% da própria carta para acelerar sua contemplação. Faz sentido para você esse formato?`,
        emotion: "empolgado"
      };
    }

    // Fechamento
    return {
      text: "Maravilha! O que podemos fazer para garantir essa vaga do grupo da assembleia deste mês é formalizar a reserva da sua cota sem compromisso. Você prefere que eu já reserve agora ou te mando o resumo no WhatsApp para você dar o OK final?",
      emotion: "sério"
    };
  }

  private async speak(text: string, emotion: VoiceEmotion = "empático") {
    if (this.recognition) {
      try { this.recognition.abort(); } catch(e) {}
    }

    await speakJarvisText(text, {
      onEnd: () => {
        if (this.isCallActive && this.recognition) {
          try { this.recognition.start(); } catch(e) {}
        }
      }
    }, { emotion });
  }

  public endVoiceCall() {
    this.emitState(false);
    stopVoice();
    if (this.recognition) {
      try { this.recognition.stop(); } catch(e) {}
    }
    this.emitMessage("sistema", "Chamada consultiva finalizada.");
  }

  /**
   * Envia Áudio Consultivo SRV Humanizado no WhatsApp do Cliente
   */
  public async sendWhatsAppSRVAudio(telefone: string, leadNome: string, customText?: string) {
    const primeiroNome = leadNome.split(" ")[0];
    const textoAudio = customText || `Olá, ${primeiroNome}! Aqui é o Fabrício Honório do Consórcio Magalu. Tentei te ligar rapidinho agora para bater um papo leve sobre aquele projeto que você me comentou. Não quero te empurrar nada nem falar de parcelas, mas sim entender o seu momento e como podemos desenhar uma estratégia que caiba com total conforto no seu bolso. Quando tiver 5 minutinhos, me manda um alô por aqui! Um grande abraço!`;

    // Fala e reproduz localmente
    await this.speak(textoAudio, "empático");

    // Envia no WhatsApp via WAHA
    try {
      const cleanPhone = String(telefone).replace(/\D/g, "");
      await fetch("http://localhost:3000/api/sendText", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: "default",
          chatId: `${cleanPhone}@c.us`,
          text: `🎙️ *Mensagem de Voz de Fabrício Honório (Consórcio Magalu):*\n\n"${textoAudio}"`
        })
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const jarvisVoiceCloser = new JarvisVoiceCloserService();
