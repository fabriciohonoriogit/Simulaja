import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Image as ImageIcon,
  X,
  ShieldCheck,
  Eye,
  Dice5,
  Clock,
  Pause,
  Play,
  StopCircle,
  Sparkles,
  Smartphone,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Cliente {
  id: string;
  nome: string;
  grupo: string | null;
  cota: string | null;
  celular?: string | null;
  administradora?: string | null;
}

interface BulkWhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClients: Cliente[];
  onComplete: () => void;
  organizacaoId?: string;
}

type SafeProfile = "reactivation" | "standard" | "accelerated";

interface SentLogItem {
  id: string;
  nome: string;
  celular: string;
  status: "success" | "failed";
  time: string;
  error?: string;
}

// Helper to resolve Spintax: {opcao1|opcao2|opcao3}
function resolveSpintax(text: string): string {
  if (!text) return "";
  let result = text;
  const regex = /\{([^{}]+)\}/;
  let match;
  let iterations = 0;
  while ((match = regex.exec(result)) !== null && iterations < 30) {
    iterations++;
    const options = match[1].split("|");
    const chosen = options[Math.floor(Math.random() * options.length)];
    result = result.replace(match[0], chosen);
  }
  return result;
}

// Helper to resolve template variables
function resolveVariables(template: string, client?: Cliente): string {
  if (!template) return "";
  if (!client) {
    return template
      .replace(/{{nome}}/gi, "João")
      .replace(/{{grupo}}/gi, "1234")
      .replace(/{{cota}}/gi, "567")
      .replace(/{{administradora}}/gi, "Consórcio Magalu");
  }
  return template
    .replace(/{{nome}}/gi, client.nome.split(" ")[0] || "")
    .replace(/{{grupo}}/gi, client.grupo || "")
    .replace(/{{cota}}/gi, client.cota || "")
    .replace(/{{administradora}}/gi, client.administradora || "Consórcio");
}

export function BulkWhatsAppModal({
  open,
  onOpenChange,
  selectedClients,
  onComplete,
  organizacaoId
}: BulkWhatsAppModalProps) {
  const [message, setMessage] = useState("");
  const [statusMode, setStatusMode] = useState<"setup" | "broadcasting" | "completed">("setup");
  
  // Safe Profile Settings (Inspired by WA-AKG Safe Broadcast)
  const [safeProfile, setSafeProfile] = useState<SafeProfile>("reactivation");
  const [showPreview, setShowPreview] = useState(false);
  const [previewSampleIndex, setPreviewSampleIndex] = useState(0);
  const [previewText, setPreviewText] = useState("");

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [mediaMimeType, setMediaMimeType] = useState<string | null>(null);

  // Live Broadcast State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [currentStepMessage, setCurrentStepMessage] = useState("");
  const [sentLogs, setSentLogs] = useState<SentLogItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Cancellation and Pause refs
  const cancelRequestedRef = useRef(false);
  const isPausedRef = useRef(false);

  const { toast } = useToast();

  // Profile configuration values
  const profileConfig = {
    reactivation: {
      name: "Reativação Segura",
      desc: "Delays maiores (12s a 22s) e pausas de 40s a cada 8 envios. Ideal para chips que estavam parados.",
      minDelay: 12,
      maxDelay: 22,
      batchSize: 8,
      batchCooldown: 40,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      recommended: true,
    },
    standard: {
      name: "Equilibrado",
      desc: "Delays médios (8s a 16s) e pausas de 30s a cada 10 envios. Ótimo para uso semanal regular.",
      minDelay: 8,
      maxDelay: 16,
      batchSize: 10,
      batchCooldown: 30,
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      recommended: false,
    },
    accelerated: {
      name: "Acelerado",
      desc: "Delays curtos (4s a 8s) e pausas de 15s a cada 15 envios. Apenas para bases muito quentes.",
      minDelay: 4,
      maxDelay: 8,
      batchSize: 15,
      batchCooldown: 15,
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      recommended: false,
    },
  }[safeProfile];

  // Calculate estimated duration in minutes
  const totalClients = selectedClients.length;
  const avgDelay = (profileConfig.minDelay + profileConfig.maxDelay) / 2;
  const batches = Math.floor(totalClients / profileConfig.batchSize);
  const totalEstimatedSeconds = Math.round(totalClients * avgDelay + batches * profileConfig.batchCooldown);
  const estimatedMinutes = Math.max(1, Math.round(totalEstimatedSeconds / 60));

  // Sync ref with paused state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Update preview when message or sample client changes
  useEffect(() => {
    if (showPreview) {
      regeneratePreview();
    }
  }, [message, showPreview, previewSampleIndex]);

  const regeneratePreview = () => {
    const sampleClient = selectedClients[previewSampleIndex % Math.max(1, selectedClients.length)];
    const withVars = resolveVariables(message || "Olá {{nome}}, temos uma novidade sobre sua cota {{cota}}...", sampleClient);
    const withSpintax = resolveSpintax(withVars);
    setPreviewText(withSpintax);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 5MB.",
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);
    setMediaMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setMediaPreview(result);
      const base64Content = result.split(",")[1];
      setMediaBase64(base64Content);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaBase64(null);
    setMediaMimeType(null);
  };

  const insertText = (snippet: string) => {
    setMessage((prev) => prev + snippet);
  };

  // Helper wait with active countdown and pause check
  const waitWithCountdown = async (seconds: number, statusPrefix: string): Promise<boolean> => {
    for (let s = seconds; s > 0; s--) {
      if (cancelRequestedRef.current) return false;
      
      // If paused, wait here until unpaused
      while (isPausedRef.current) {
        if (cancelRequestedRef.current) return false;
        setCurrentStepMessage("⏸️ Disparo pausado. Clique em 'Continuar' para retomar.");
        await new Promise((r) => setTimeout(r, 400));
      }

      setCountdownSeconds(s);
      setCurrentStepMessage(`${statusPrefix} (${s}s restantes)...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdownSeconds(0);
    return true;
  };

  // Live Broadcast Execution
  const handleStartBroadcast = async () => {
    if ((!message.trim() && !mediaFile) || selectedClients.length === 0 || !organizacaoId) return;

    setStatusMode("broadcasting");
    cancelRequestedRef.current = false;
    isPausedRef.current = false;
    setIsPaused(false);
    setCurrentIndex(0);
    setSuccessCount(0);
    setFailCount(0);
    setSentLogs([]);

    let localSuccess = 0;
    let localFail = 0;

    for (let i = 0; i < selectedClients.length; i++) {
      if (cancelRequestedRef.current) {
        toast({
          title: "Disparo interrompido",
          description: `Envio cancelado. Foram entregues ${localSuccess} de ${selectedClients.length} mensagens.`,
        });
        break;
      }

      // Check Pause state
      while (isPausedRef.current) {
        if (cancelRequestedRef.current) break;
        setCurrentStepMessage("⏸️ Disparo pausado. Aguardando retorno...");
        await new Promise((r) => setTimeout(r, 400));
      }
      if (cancelRequestedRef.current) break;

      const client = selectedClients[i];
      setCurrentIndex(i + 1);

      // 1. Cadence Delay (before each message starting from the 2nd)
      if (i > 0) {
        if (i % profileConfig.batchSize === 0) {
          const ok = await waitWithCountdown(
            profileConfig.batchCooldown,
            `🛡️ Pausa de respiro anti-bloqueio após ${i} envios`
          );
          if (!ok) break;
        } else {
          const jitter = Math.floor(
            Math.random() * (profileConfig.maxDelay - profileConfig.minDelay + 1)
          ) + profileConfig.minDelay;
          const ok = await waitWithCountdown(
            jitter,
            `⏳ Cadência segura para ${client.nome.split(" ")[0]}`
          );
          if (!ok) break;
        }
      }

      // 2. Typing Simulation
      setCurrentStepMessage(`⌨️ Simulando digitação para ${client.nome}...`);
      await new Promise((r) => setTimeout(r, 1400));

      // 3. Format phone & Send via Edge Function
      const cleanPhone = (client.celular || "").replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        localFail++;
        setFailCount(localFail);
        setSentLogs((prev) => [
          {
            id: client.id,
            nome: client.nome,
            celular: client.celular || "Sem número",
            status: "failed",
            error: "Número inválido",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          ...prev,
        ]);
        continue;
      }

      try {
        const { data, error } = await supabase.functions.invoke("evolution-send-message", {
          body: {
            organizacaoId,
            clients: [
              {
                id: client.id,
                nome: client.nome,
                celular: client.celular,
                grupo: client.grupo,
                cota: client.cota,
                administradora: client.administradora,
              },
            ],
            template: message,
            media: mediaBase64
              ? {
                  base64: mediaBase64,
                  mimeType: mediaMimeType,
                  fileName: mediaFile?.name,
                }
              : undefined,
          },
        });

        if (error || (data?.results && data.results[0]?.status === "failed")) {
          const errMsg = error?.message || data?.results?.[0]?.reason || "Falha no envio";
          throw new Error(errMsg);
        }

        localSuccess++;
        setSuccessCount(localSuccess);
        setSentLogs((prev) => [
          {
            id: client.id,
            nome: client.nome,
            celular: client.celular || "",
            status: "success",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          ...prev,
        ]);
      } catch (err: any) {
        console.error(`Erro ao enviar para ${client.nome}:`, err);
        localFail++;
        setFailCount(localFail);
        setSentLogs((prev) => [
          {
            id: client.id,
            nome: client.nome,
            celular: client.celular || "",
            status: "failed",
            error: err.message || "Erro de conexão",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          ...prev,
        ]);
      }
    }

    setStatusMode("completed");
  };

  const handleCancelBroadcast = () => {
    cancelRequestedRef.current = true;
    setIsPaused(false);
  };

  const handleClose = () => {
    if (statusMode === "broadcasting") {
      if (confirm("O disparo está em andamento. Deseja realmente parar e sair?")) {
        cancelRequestedRef.current = true;
        onOpenChange(false);
      }
    } else {
      if (statusMode === "completed") {
        onComplete();
      }
      onOpenChange(false);
    }
  };

  const progressPercent = totalClients > 0 ? Math.round((currentIndex / totalClients) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-900">
              <Zap className="h-6 w-6 text-emerald-500 fill-emerald-500" />
              Disparo Seguro WhatsApp (Anti-Ban)
            </DialogTitle>
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 font-bold">
              {totalClients} Contato(s) Selecionado(s)
            </Badge>
          </div>
          <DialogDescription className="text-slate-500 text-xs">
            Com tecnologia Spintax e cadência humanizada com pausas de respiro para blindagem contra bloqueios.
          </DialogDescription>
        </DialogHeader>

        {/* ============================================================== */}
        {/* MODO 1: CONFIGURAÇÃO DO DISPARO (SETUP)                        */}
        {/* ============================================================== */}
        {statusMode === "setup" && (
          <div className="space-y-4 py-2">
            {/* Perfil de Segurança Anti-Ban */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Perfil de Proteção Anti-Ban
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Duração estim.: <strong>~{estimatedMinutes} min</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {(["reactivation", "standard", "accelerated"] as SafeProfile[]).map((pKey) => {
                  const active = safeProfile === pKey;
                  const item = {
                    reactivation: { title: "Reativação", sub: "12s-22s", tag: "Chip Parado" },
                    standard: { title: "Padrão", sub: "8s-16s", tag: "Equilibrado" },
                    accelerated: { title: "Acelerado", sub: "4s-8s", tag: "Base Quente" },
                  }[pKey];

                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => setSafeProfile(pKey)}
                      className={`text-left p-2.5 rounded-lg border transition-all ${
                        active
                          ? "border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black ${active ? "text-emerald-900" : "text-slate-800"}`}>
                          {item.title}
                        </span>
                        {pKey === "reactivation" && (
                          <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                            Seguro
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">{item.sub}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{item.tag}</div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-slate-100 flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{profileConfig.desc}</span>
              </p>
            </div>

            {/* Variáveis Dinâmicas & Spintax */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  1. Dados do Cliente
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertText("{{nome}}")}
                    className="h-7 text-xs font-bold bg-white"
                  >
                    {"{{nome}}"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertText("{{grupo}}")}
                    className="h-7 text-xs font-bold bg-white"
                  >
                    {"{{grupo}}"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertText("{{cota}}")}
                    className="h-7 text-xs font-bold bg-white"
                  >
                    {"{{cota}}"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertText("{{administradora}}")}
                    className="h-7 text-xs font-bold bg-white"
                  >
                    {"{{administradora}}"}
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    2. Variações Spintax (Gera texto diferente por cliente)
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Anti-Hash da Meta</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertText("{Olá|Oi|Tudo bem|Como vai,} ")}
                    className="h-7 text-[11px] font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-white"
                  >
                    + Saudação Variada
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertText("{Passei rapidinho para te avisar que|Gostaria de te lembrar sobre|Trago uma novidade sobre} ")}
                    className="h-7 text-[11px] font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-white"
                  >
                    + Abertura Variada
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertText("\n\n{Qualquer dúvida me avise aqui!|Me confirma se recebeu certinho?|Um abraço e boa semana!}")}
                    className="h-7 text-[11px] font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-white"
                  >
                    + Pergunta/Fechamento
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagem Principal */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Mensagem de Disparo
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPreview(!showPreview);
                    if (!showPreview) regeneratePreview();
                  }}
                  className="h-7 text-xs text-indigo-600 hover:text-indigo-800 font-bold gap-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {showPreview ? "Ocultar Preview" : "Simular Variação (Preview)"}
                </Button>
              </div>

              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="{Olá|Oi,} {{nome}}! Passei para te lembrar sobre sua cota {{cota}} do {{administradora}}..."
                className="min-h-[110px] text-sm font-medium resize-none focus-visible:ring-emerald-500 rounded-xl"
              />
            </div>

            {/* Balão de Preview ao Vivo Estilo WhatsApp */}
            {showPreview && (
              <div className="bg-[#efeae2] p-4 rounded-xl border border-slate-300 relative shadow-inner">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-300/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Smartphone className="h-4 w-4 text-emerald-700" />
                    <span>Prévia no celular de: <strong>{selectedClients[previewSampleIndex % Math.max(1, selectedClients.length)]?.nome || "Cliente Teste"}</strong></span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPreviewSampleIndex((prev) => prev + 1);
                      regeneratePreview();
                    }}
                    className="h-6 text-[10px] font-bold gap-1 bg-white"
                  >
                    <Dice5 className="h-3 w-3" /> Gerar Outra Variação
                  </Button>
                </div>

                <div className="max-w-[85%] bg-white rounded-lg p-3 shadow-sm text-xs text-slate-900 leading-relaxed font-sans whitespace-pre-wrap rounded-tl-none border border-black/5">
                  {previewText || "Digite sua mensagem acima para visualizar..."}
                  <div className="text-[10px] text-slate-400 text-right mt-1 font-sans">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ✓✓
                  </div>
                </div>
              </div>
            )}

            {/* Anexo de Arquivo/Imagem */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Anexo Opcional (Imagem ou PDF)
                </label>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Máx 5MB</span>
              </div>

              {!mediaFile ? (
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                  />
                  <ImageIcon className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 mb-1 transition-colors" />
                  <p className="text-xs font-bold text-slate-600">Clique para anexar boleto (PDF) ou imagem</p>
                </div>
              ) : (
                <div className="relative border border-slate-200 rounded-xl p-3 flex items-center gap-3 bg-white">
                  {mediaPreview && mediaFile.type.startsWith("image/") ? (
                    <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                      <img src={mediaPreview} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <span className="font-black text-xs uppercase">PDF</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{mediaFile.name}</p>
                    <p className="text-[10px] font-medium text-slate-500">
                      {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeMedia}
                    className="text-slate-400 hover:text-rose-500 rounded-full h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Ações Inferiores */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <Button variant="ghost" onClick={handleClose} className="font-bold text-xs">
                Cancelar
              </Button>
              <Button
                onClick={handleStartBroadcast}
                disabled={!message.trim() && !mediaFile}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider px-6 h-10 shadow-md gap-2"
              >
                <Send className="h-4 w-4" /> Iniciar Envio Seguro
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODO 2: EXECUÇÃO AO VIVO (BROADCASTING COM MONITOR EM TEMPO REAL) */}
        {/* ============================================================== */}
        {statusMode === "broadcasting" && (
          <div className="space-y-4 py-4">
            {/* Header com Progresso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-700">
                  Enviando {currentIndex} de {totalClients} ({progressPercent}%)
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold">
                    ✅ {successCount} Sucessos
                  </Badge>
                  {failCount > 0 && (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 font-bold">
                      ❌ {failCount} Falhas
                    </Badge>
                  )}
                </div>
              </div>
              <Progress value={progressPercent} className="h-2.5 bg-slate-100" />
            </div>

            {/* Status Atual do Robô */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  {isPaused ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">{currentStepMessage}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Modo {profileConfig.name} ativo • Cadência com simulação de digitação humana
                  </p>
                </div>
              </div>
            </div>

            {/* Controles de Pausa e Cancelamento */}
            <div className="flex items-center justify-center gap-3 py-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="font-bold text-xs gap-1.5"
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 text-emerald-600 fill-emerald-600" /> Retomar Disparo
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 text-amber-600 fill-amber-600" /> Pausar Envio
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelBroadcast}
                className="font-bold text-xs gap-1.5"
              >
                <StopCircle className="h-4 w-4" /> Cancelar Restantes
              </Button>
            </div>

            {/* Log de Envios Recentes */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Histórico Recente
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {sentLogs.length === 0 ? (
                  <p className="text-slate-400 text-[11px] py-2 text-center">Iniciando transmissões...</p>
                ) : (
                  sentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white p-2 rounded-lg border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {log.status === "success" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                        )}
                        <span className="font-bold text-slate-800">{log.nome}</span>
                        <span className="text-slate-400 text-[11px]">({log.celular})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.error && (
                          <span className="text-[10px] text-rose-600 font-medium">{log.error}</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODO 3: FINALIZADO (COMPLETED)                                 */}
        {/* ============================================================== */}
        {statusMode === "completed" && (
          <div className="space-y-4 py-6 text-center">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Disparo Concluído!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Todas as mensagens foram processadas respeitando os intervalos humanos e Spintax de segurança.
              </p>
            </div>

            <div className="flex justify-center gap-4 py-2">
              <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                <span className="text-xl font-black text-emerald-700 block">{successCount}</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Entregues</span>
              </div>
              {failCount > 0 && (
                <div className="bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl">
                  <span className="text-xl font-black text-rose-700 block">{failCount}</span>
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Falhas</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleClose}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-8 h-10 rounded-xl"
            >
              Fechar e Atualizar Carteira
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
