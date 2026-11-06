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
import {
  Bot,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Users,
  Send,
  Loader2,
  FileText,
  RotateCcw,
  Check,
  ShieldCheck,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  HarveyProspect,
  HarveyStage,
  HarveyIntent,
  runHarveyScout,
  generateHarveyCopy,
  executeHarveySendingSequence,
  classifyHarveyIntent,
  generateHarveyNegotiationReply,
  handleIncomingLeadMessageWithHarvey,
  HARVEY_BAN_LIST,
  MAX_WORDS_FIRST_TOUCH,
} from "@/services/harveyEngine";

interface HarveyAutonomousModalProps {
  open: boolean;
  onClose: () => void;
  onCycleComplete?: (metrics: any) => void;
}

export const HarveyAutonomousModal: React.FC<HarveyAutonomousModalProps> = ({
  open,
  onClose,
  onCycleComplete,
}) => {
  // Configurações do Ciclo
  const [cidade, setCidade] = useState("Paranaguá");
  const [segmento, setSegmento] = useState<"pesados" | "imovel" | "veiculo">("pesados");
  const [nicho, setNicho] = useState("Transportes e Logística Portuária");
  const [quantidade, setQuantidade] = useState<number>(15); // Lote de 10 a 20 leads
  const [canal, setCanal] = useState<"whatsapp" | "email">("whatsapp");

  // Estado do Pipeline Harvey
  const [isRunning, setIsRunning] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<"idle" | "scout" | "writer" | "sender" | "handler" | "analyst">("idle");
  const [progressMsg, setProgressMsg] = useState("");
  const [prospects, setProspects] = useState<HarveyProspect[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Simulador de Objeções (Handler)
  const [simulatedLeadIndex, setSimulatedLeadIndex] = useState<number>(0);
  const [simulatedObjection, setSimulatedObjection] = useState("Consórcio demora muito, preciso do caminhão para o próximo mês.");
  const [simulationResult, setSimulationResult] = useState<{
    intent: HarveyIntent;
    reply: string;
    nextStage: HarveyStage;
  } | null>(null);

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [`[${time}] ${text}`, ...prev.slice(0, 40)]);
  };

  // Execução do Ciclo Completo de 5 Subagentes
  const handleExecuteCycle = async () => {
    try {
      setIsRunning(true);
      setProspects([]);
      setLogs([]);

      // 1. SUBAGENTE THE SCOUT
      setCurrentAgent("scout");
      setProgressMsg(`The Scout: Minerando e pontuando ${quantidade} empresas em ${cidade}...`);
      addLog(`🎯 [THE SCOUT] Iniciando mineração de ${quantidade} empresas (${segmento}) em ${cidade}...`);

      const scouted = await runHarveyScout({
        cidade,
        nicho,
        segmento,
        quantidade,
      });

      setProspects(scouted);
      addLog(`✅ [THE SCOUT] ${scouted.length} empresas mineradas com CNPJ ativo e Decisores (QSA) mapeados.`);

      // 2. SUBAGENTE THE WRITER
      setCurrentAgent("writer");
      setProgressMsg(`The Writer: Gerando copies anti-jargão (< ${MAX_WORDS_FIRST_TOUCH} palavras)...`);
      addLog(`✍️ [THE WRITER] Aplicando ban list de jargões (${HARVEY_BAN_LIST.length} palavras bloqueadas)...`);
      addLog(`✍️ [THE WRITER] Estruturando gancho de Meia Parcela 50/50 e economia sem juros bancários.`);

      await new Promise((r) => setTimeout(r, 1200));

      // 3. SUBAGENTE THE SENDER
      setCurrentAgent("sender");
      setProgressMsg(`The Sender: Disparando via ${canal === "whatsapp" ? "WhatsApp (WAHA)" : "E-mail"} com cadência humana...`);
      addLog(`⚡ [THE SENDER] Iniciando cadência controlada (delay dinâmico de 3.5s a 5.0s entre disparos)...`);
      addLog(`🛑 [THE SENDER] Circuito Stop-on-Reply ativado: qualquer resposta pausa follow-ups automáticos.`);

      const { successCount, updatedProspects } = await executeHarveySendingSequence(
        scouted,
        canal,
        (current, total, p) => {
          setProgressMsg(`The Sender: Enviando ${current}/${total} para ${p.decisor} (${p.empresa})...`);
          addLog(`📨 [THE SENDER] Disparo ${current}/${total} concluído para ${p.telefone} (${p.empresa}).`);
        }
      );

      setProspects(updatedProspects);

      // 4. SUBAGENTE THE ANALYST
      setCurrentAgent("analyst");
      setProgressMsg("The Analyst: Consolidando telemetria e sincronizando funil CRM...");
      addLog(`📊 [THE ANALYST] Sincronização concluída: ${successCount} leads inseridos na etapa 'novo_lead' do Supabase.`);
      addLog(`🛡️ [THE HANDLER] Vigilância de respostas ativa no webhook WAHA.`);

      toast.success(`Ciclo Harvey concluído com sucesso! ${successCount} contatos acionados.`);
      if (onCycleComplete) {
        onCycleComplete({ successCount, total: scouted.length });
      }
    } catch (err: any) {
      console.error("[Harvey Cycle Error]:", err);
      toast.error("Erro ao executar ciclo Harvey: " + (err.message || "Tente novamente."));
      addLog(`❌ [ERRO] Falha no ciclo: ${err.message}`);
    } finally {
      setIsRunning(false);
      setCurrentAgent("idle");
      setProgressMsg("");
    }
  };

  // Teste ao Vivo do Subagente Handler (Contorno de Objeções)
  const handleTestObjection = () => {
    if (prospects.length === 0) {
      toast.error("Execute primeiro o ciclo ou aguarde carregar os prospects para simular.");
      return;
    }

    const currentLead = prospects[simulatedLeadIndex] || prospects[0];
    const intent = classifyHarveyIntent(simulatedObjection);
    const { reply, nextStage } = generateHarveyNegotiationReply(currentLead, simulatedObjection);

    setSimulationResult({
      intent,
      reply,
      nextStage,
    });

    addLog(`💬 [THE HANDLER SIMULADO] Mensagem do Lead: "${simulatedObjection}"`);
    addLog(`🧠 [THE HANDLER SIMULADO] Intenção detectada: [${intent.toUpperCase()}] -> Próximo Estágio: [${nextStage}]`);
    toast.info(`Handler classificou como: ${intent.toUpperCase()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-cyan-500/30 text-white shadow-[0_0_50px_rgba(6,182,212,0.15)] p-6 rounded-2xl">
        <DialogHeader className="space-y-2 border-b border-cyan-900/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Bot className="h-6 w-6 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 font-mono tracking-tight flex items-center gap-2">
                  HARVEY AUTONOMOUS SDR ENGINE
                  <Badge className="bg-emerald-950 border-emerald-500/40 text-emerald-400 text-[9px] uppercase font-bold">
                    CLOSED-LOOP 5 SUBAGENTS
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Sistema autônomo baseado no repositório <strong className="text-cyan-300">ethanplusai/harvey</strong> — Mineração, Copy Anti-IA, Disparo Cadenciado, Stop-on-Reply e Negociação Automática.
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 bg-cyan-950/40 px-3 py-1 text-[11px] font-mono">
              v2.4.0 Engine
            </Badge>
          </div>
        </DialogHeader>

        {/* 5 SUBAGENT PIPELINE STATUS CARDS */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {/* Scout */}
          <div
            className={`p-3 rounded-xl border text-center transition-all ${
              currentAgent === "scout"
                ? "bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-105"
                : "bg-slate-900/60 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <Building2 className={`h-4 w-4 ${currentAgent === "scout" ? "text-cyan-300 animate-bounce" : "text-slate-400"}`} />
            </div>
            <div className="text-[11px] font-black text-slate-200">1. THE SCOUT</div>
            <div className="text-[9px] text-slate-400">Maps & Decisores</div>
          </div>

          {/* Writer */}
          <div
            className={`p-3 rounded-xl border text-center transition-all ${
              currentAgent === "writer"
                ? "bg-amber-950/80 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105"
                : "bg-slate-900/60 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <Sparkles className={`h-4 w-4 ${currentAgent === "writer" ? "text-amber-300 animate-spin" : "text-slate-400"}`} />
            </div>
            <div className="text-[11px] font-black text-slate-200">2. THE WRITER</div>
            <div className="text-[9px] text-slate-400">&lt; 55 Palavras Anti-IA</div>
          </div>

          {/* Sender */}
          <div
            className={`p-3 rounded-xl border text-center transition-all ${
              currentAgent === "sender"
                ? "bg-emerald-950/80 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105"
                : "bg-slate-900/60 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <Send className={`h-4 w-4 ${currentAgent === "sender" ? "text-emerald-300 animate-pulse" : "text-slate-400"}`} />
            </div>
            <div className="text-[11px] font-black text-slate-200">3. THE SENDER</div>
            <div className="text-[9px] text-slate-400">Delay Humano (3-5s)</div>
          </div>

          {/* Handler */}
          <div
            className={`p-3 rounded-xl border text-center transition-all ${
              currentAgent === "handler"
                ? "bg-indigo-950/80 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] scale-105"
                : "bg-slate-900/60 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <ShieldAlert className={`h-4 w-4 ${currentAgent === "handler" ? "text-indigo-300 animate-pulse" : "text-slate-400"}`} />
            </div>
            <div className="text-[11px] font-black text-slate-200">4. THE HANDLER</div>
            <div className="text-[9px] text-slate-400">Stop-on-Reply & Negoc.</div>
          </div>

          {/* Analyst */}
          <div
            className={`p-3 rounded-xl border text-center transition-all ${
              currentAgent === "analyst"
                ? "bg-pink-950/80 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] scale-105"
                : "bg-slate-900/60 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className={`h-4 w-4 ${currentAgent === "analyst" ? "text-pink-300 animate-bounce" : "text-slate-400"}`} />
            </div>
            <div className="text-[11px] font-black text-slate-200">5. THE ANALYST</div>
            <div className="text-[9px] text-slate-400">CRM Kanban Sync</div>
          </div>
        </div>

        {/* CONTROLES DO CICLO & PARAMETRIZAÇÃO */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-cyan-400" /> Parâmetros de Prospecção do Ciclo
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* Cidade */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Cidade Alvo</label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-cyan-400 outline-none"
                placeholder="Ex: Paranaguá, Curitiba"
              />
            </div>

            {/* Segmento */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Segmento</label>
              <select
                value={segmento}
                onChange={(e) => setSegmento(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-cyan-400 outline-none"
              >
                <option value="pesados">Pesados (Caminhões & Frotas)</option>
                <option value="imovel">Imóvel (Galpões & Clínicas)</option>
                <option value="veiculo">Veículo (Utilitários & Frotas Leves)</option>
              </select>
            </div>

            {/* Tamanho do Lote (10 a 20 Leads conforme regra) */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Lote em Massa (10-20 Leads)</label>
              <div className="flex gap-1.5">
                {[10, 15, 20].map((qtd) => (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => setQuantidade(qtd)}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      quantidade === qtd
                        ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {qtd}
                  </button>
                ))}
              </div>
            </div>

            {/* Canal */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Canal de Disparo</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCanal("whatsapp")}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    canal === "whatsapp"
                      ? "bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                      : "bg-slate-950 border border-slate-800 text-slate-400"
                  }`}
                >
                  <MessageSquare className="h-3 w-3" /> WhatsApp (WAHA)
                </button>
                <button
                  type="button"
                  onClick={() => setCanal("email")}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    canal === "email"
                      ? "bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                      : "bg-slate-950 border border-slate-800 text-slate-400"
                  }`}
                >
                  <FileText className="h-3 w-3" /> E-mail Prospera
                </button>
              </div>
            </div>
          </div>

          {/* BOTÃO PRINCIPAL DE EXECUÇÃO */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Anti-Ban ativado: Delay dinâmico (3.5s - 5s) e Stop-on-Reply imediato.</span>
            </div>

            <Button
              onClick={handleExecuteCycle}
              disabled={isRunning}
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black px-6 py-2 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{progressMsg || "Executando Ciclo..."}</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-slate-950" />
                  <span>INICIAR CICLO COMPLETO ({quantidade} LEADS)</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* FEED EM TEMPO REAL DOS PROSPECTS E DO STOP-ON-REPLY */}
        {prospects.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-cyan-400" /> Prospects no Ciclo Ativo ({prospects.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Kanban Supabase: Sincronizado em tempo real
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {prospects.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/30 transition-all flex items-center justify-between text-xs"
                >
                  <div className="space-y-1 max-w-[55%]">
                    <div className="font-bold text-slate-200 flex items-center gap-2">
                      <span className="text-cyan-400">#{idx + 1}</span>
                      <span className="truncate">{p.empresa}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({p.decisor})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-3">
                      <span className="flex items-center gap-1 font-mono text-slate-300">
                        <Phone className="h-2.5 w-2.5 text-emerald-400" /> {p.telefone}
                      </span>
                      <span>CNPJ: {p.cnpj}</span>
                      <span>{p.cidade} - {p.uf}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-[11px] font-bold text-emerald-400">
                      R$ {(p.creditoEstimado / 1000).toFixed(0)}k{" "}
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Meia: R$ {p.parcela5050.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/m)
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <Badge
                        className={`text-[8.5px] font-mono uppercase ${
                          p.stage === "INITIAL_OUTREACH"
                            ? "bg-cyan-950 border-cyan-500/40 text-cyan-300"
                            : p.stage === "NEGOTIATING"
                            ? "bg-amber-950 border-amber-500/40 text-amber-300"
                            : p.stage === "CLOSING"
                            ? "bg-emerald-950 border-emerald-500/40 text-emerald-300"
                            : "bg-slate-900 text-slate-300"
                        }`}
                      >
                        {p.stage}
                      </Badge>

                      {p.stopOnReplyTriggered && (
                        <Badge className="bg-red-950 border-red-500/40 text-red-300 text-[8.5px] font-mono">
                          STOP-ON-REPLY
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SIMULADOR DO HANDLER (NEGOCIAÇÃO E QUEBRA DE OBJEÇÕES AO VIVO) */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="h-4 w-4 text-indigo-400" /> Simulador de Negociação & Objeções (Harvey Handler)
            </div>
            <span className="text-[9px] text-slate-500">Teste respostas e quebra de objeções em tempo real</span>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSimulatedObjection("Consórcio demora muito, preciso do caminhão para o próximo mês.")}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 text-[10px] text-left transition-all"
              >
                🕒 "Consórcio demora muito..."
              </button>
              <button
                type="button"
                onClick={() => setSimulatedObjection("O banco me oferece taxa de financiamento menor, não compensa.")}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 text-[10px] text-left transition-all"
              >
                🏦 "A taxa do banco é menor..."
              </button>
              <button
                type="button"
                onClick={() => setSimulatedObjection("Pode me mandar a simulação detalhada por favor?")}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 text-[10px] text-left transition-all"
              >
                ✅ "Pode mandar a simulação..."
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={simulatedObjection}
                onChange={(e) => setSimulatedObjection(e.target.value)}
                placeholder="Digite uma objeção ou resposta do cliente para o Harvey contrapor..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-400 outline-none"
              />
              <Button
                onClick={handleTestObjection}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-lg cursor-pointer"
              >
                Testar Resposta
              </Button>
            </div>

            {simulationResult && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                    Intenção: <strong className="text-white uppercase">{simulationResult.intent}</strong>
                  </span>
                  <Badge className="bg-emerald-950 border-emerald-500/40 text-emerald-300 text-[9px] font-mono">
                    Avança para: {simulationResult.nextStage}
                  </Badge>
                </div>
                <div className="text-xs text-slate-200 bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-sans leading-relaxed">
                  "{simulationResult.reply}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LOGS DE EXECUÇÃO EM TEMPO REAL */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-cyan-400" /> Telemetria Harvey Engine (Real-Time Logs)
            </span>
            <span className="text-[9px] text-slate-600">{logs.length} eventos registrados</span>
          </div>

          <div className="h-28 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-400 custom-scrollbar pr-1">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">Aguardando início do ciclo autônomo...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="leading-tight">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

