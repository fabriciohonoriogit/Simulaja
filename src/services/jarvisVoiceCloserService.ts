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
  nome?: string;
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

  private isSpeaking = false;
  private silenceTimer: any = null;

  constructor() {
    // Não inicializa SpeechRecognition no construtor para evitar crash em browsers sem suporte
  }

  private initSpeechRecognition() {
    try {
      if (typeof window === "undefined" || this.recognition) return;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = "pt-BR";

        this.recognition.onresult = async (event: any) => {
          if (this.isSpeaking) return; // Ignora captura enquanto Jarvis fala (previne eco)

          const lastResult = event.results[event.results.length - 1];
          if (lastResult?.isFinal) {
            const transcript = lastResult[0]?.transcript?.trim();
            if (transcript && transcript.length >= 2) {
              if (this.silenceTimer) clearTimeout(this.silenceTimer);
              this.silenceTimer = setTimeout(async () => {
                await this.handleClientSpeech(transcript);
              }, 600);
            }
          }
        };

        this.recognition.onerror = (e: any) => {
          console.warn("[Closer SRV] Reconhecimento de voz:", e?.error);
        };
      }
    } catch (err) {
      console.warn("[Closer SRV] Inicialização de reconhecimento segura:", err);
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

    const nomeValido = (context.nome || "Cliente").trim();
    this.conversationHistory = [
      { role: "system", content: `${CLOSER_SRV_SYSTEM_PROMPT}\n\nLEAD ATUAL: ${nomeValido}. Segmento de interesse: ${context.tipo_consorcio || 'Planejamento'}.` }
    ];

    this.emitState(true);
    this.emitMessage("sistema", `Chamada conectada com ${nomeValido}. Metodologia SRV ativada: [Fase 1: O Sonho].`);

    // Abertura natural de telefone humana: curta, educada e esperando o cliente atender
    const primeiroNome = nomeValido.split(" ")[0];
    const abertura = `Olá, ${primeiroNome}! Aqui é o Fabrício Honório do Consórcio Magalu, tudo bem com você?`;

    this.emitMessage("jarvis", abertura, "alegre");
    await this.speak(abertura, "alegre");

    // Inicia microfone apenas sob demanda após a fala
    this.initSpeechRecognition();
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

    try {
      const resposta = await this.generateSRVResponse(userText);
      this.emitMessage("jarvis", resposta.text, resposta.emotion);
      this.conversationHistory.push({ role: "assistant", content: resposta.text });

      await this.speak(resposta.text, resposta.emotion);
    } catch (e: any) {
      const fallback = this.obterRespostaPadraoFase(userText);
      this.emitMessage("jarvis", fallback.text, fallback.emotion);
      await this.speak(fallback.text, fallback.emotion);
    }
  }

  private async generateSRVResponse(userText: string): Promise<{ text: string; emotion: VoiceEmotion }> {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "AQ.Ab8RN6K4DMA3cCraG70_iCcWufgBc_6np-TWuUbPDs7hhFhjog";
    const leadNome = this.currentContext?.nome || "Cliente";
    const segmento = this.currentContext?.tipo_consorcio || this.currentContext?.segmento || "imóvel/veículo";

    const prompt = `Você é o JARVIS, assistente executivo e consultor de negociação de alta performance do Fabrício Honório (Consórcio Magalu).
Você está em uma chamada de voz consultiva com o cliente ${leadNome}.
Interesse: ${segmento}.
Fase atual no método SRV: ${this.currentFase.toUpperCase()}.

O cliente acabou de falar exatamente isto na chamada: "${userText}".

DIRETRIZES FUNDAMENTAIS (METODOLOGIA SRV):
1. Responda DIRETAMENTE e ESPECIFICAMENTE ao que o cliente falou ("${userText}").
2. Se o cliente apenas cumprimentou ("oi", "olá", "alô", "quem é?", "tudo bem"): cumprimente de volta com entusiasmo, confirme se ele pode falar 2 minutos e pergunte qual o grande projeto ou conquista que ele tem em mente para os próximos meses.
3. Se o cliente falou do sonho (ex: carro, caminhão, casa, reforma): parabenize a conquista com calor humano genuíno e pergunte sobre o prazo ideal ou como ele imagina essa realização. Mude novaFase para "realidade".
4. Se o cliente falou de prazo, dinheiro ou parcela: pergunte qual aporte mensal fica 100% confortável no bolso dele sem comprometer as reservas. Mude novaFase para "viabilidade".
5. Se o cliente demonstrou interesse na estratégia: apresente o formato sem juros com opção de lance embutido de até 30% e sugira reservar a vaga na assembleia deste mês. Mude novaFase para "fechamento".
6. NUNCA fale frases longas. No máximo 2 a 3 frases curtas faladas de telefone. NUNCA empurre produto.
7. Retorne EXCLUSIVAMENTE um JSON válido no formato:
{"text": "sua fala aqui", "emotion": "alegre" | "empático" | "empolgado" | "sério", "novaFase": "sonho" | "realidade" | "viabilidade" | "fechamento"}`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (parsed?.novaFase && parsed.novaFase !== this.currentFase) {
            this.setFase(parsed.novaFase);
          }
          if (parsed?.text) {
            return {
              text: parsed.text,
              emotion: parsed.emotion || "empático"
            };
          }
        }
      }
    } catch (err) {
      console.warn("[Closer SRV] Falha na chamada direta Gemini, usando fallback contextual:", err);
    }

    return this.obterRespostaPadraoFase(userText);
  }

  private obterRespostaPadraoFase(userText: string = ""): { text: string; emotion: VoiceEmotion } {
    const lower = userText.toLowerCase();

    // Saudação ou identificação
    if (lower.includes("olá") || lower.includes("oi") || lower.includes("alô") || lower.includes("quem") || lower.length < 12) {
      return {
        text: "Tudo ótimo por aqui! Estou te ligando rapidinho para te dar um retorno sobre o seu projeto. Você tem 2 minutinhos para falarmos sobre o que você planeja conquistar?",
        emotion: "alegre"
      };
    }

    // Identificação de sonho
    if (this.currentFase === "sonho") {
      this.setFase("realidade");
      return {
        text: "Que conquista incrível! Um projeto como esse é maravilhoso. E para a gente planejar isso com total conforto no seu bolso, qual valor mensal hoje você consegue investir com tranquilidade?",
        emotion: "empolgado"
      };
    }

    if (this.currentFase === "realidade") {
      this.setFase("viabilidade");
      return {
        text: "Perfeito! Com essa faixa mensal nós conseguimos estruturar uma carta de crédito sob medida no Consórcio Magalu sem juros de financiamento bancário, além de poder usar lance embutido para adiantar sua contemplação. Faz sentido esse caminho para você?",
        emotion: "empático"
      };
    }

    return {
      text: "Maravilha! O que podemos fazer para garantir essa condição para a assembleia deste mês é formalizar a reserva da sua cota sem compromisso. Você prefere que eu já reserve ou te mando o resumo no WhatsApp para você dar o OK final?",
      emotion: "sério"
    };
  }

  private async speak(text: string, emotion: VoiceEmotion = "empático") {
    this.isSpeaking = true;
    if (this.recognition) {
      try { this.recognition.abort(); } catch(e) {}
    }

    try {
      await speakJarvisText(text, {
        onEnd: () => {
          this.isSpeaking = false;
          if (this.isCallActive && this.recognition) {
            setTimeout(() => {
              if (this.isCallActive && !this.isSpeaking) {
                try { this.recognition.start(); } catch(e) {}
              }
            }, 400);
          }
        }
      }, { emotion });
    } catch (e) {
      this.isSpeaking = false;
      console.warn("[Closer SRV] Erro fala Jarvis:", e);
    }
  }

  public endVoiceCall() {
    this.emitState(false);
    this.isSpeaking = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    try {
      stopVoice();
    } catch (e) {}
    if (this.recognition) {
      try { this.recognition.stop(); } catch(e) {}
    }
    this.emitMessage("sistema", "Chamada consultiva finalizada.");
  }

  public async sendWhatsAppSRVAudio(telefone: string, leadNome: string = "Cliente", customText?: string) {
    const primeiroNome = (leadNome || "Cliente").split(" ")[0];
    const textoAudio = customText || `Olá, ${primeiroNome}! Aqui é o Fabrício Honório do Consórcio Magalu. Tentei te ligar rapidinho agora para bater um papo leve sobre aquele projeto que você me comentou. Não quero te empurrar nada nem falar de parcelas, mas sim entender o seu momento e como podemos desenhar uma estratégia que caiba com total conforto no seu bolso. Quando tiver 5 minutinhos, me manda um alô por aqui! Um grande abraço!`;

    // 1. Envia nota de voz de áudio real diretamente pelo WAHA (Porta 3000)
    try {
      const cleanPhone = String(telefone).replace(/\D/g, "");
      const res = await fetch("http://localhost:3000/api/sendVoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: cleanPhone,
          text: textoAudio,
          voice: "pt-BR-AntonioNeural",
          emotion: "empatico"
        })
      });

      if (res.ok) {
        return true;
      }
    } catch (e) {}

    // Fallback: envio de texto se o endpoint de voz não responder
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
