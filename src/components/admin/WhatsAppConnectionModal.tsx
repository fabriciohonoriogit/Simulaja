import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  QrCode,
  Smartphone,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  checkWahaStatus,
  fetchWahaQrCode,
  requestWahaPairingCode,
  restartWahaSession,
  getWhatsAppMode,
  saveWhatsAppMode,
  WhatsAppMode,
} from "@/services/evolutionApiService";
import { toast } from "sonner";

interface WhatsAppConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

export function WhatsAppConnectionModal({
  open,
  onOpenChange,
  onConnected,
}: WhatsAppConnectionModalProps) {
  const [activeTab, setActiveTab] = useState<"pairing" | "qr" | "direct">("pairing");
  const [status, setStatus] = useState<"WORKING" | "SCAN_QR_CODE" | "DISCONNECTED" | "STARTING" | "UNKNOWN">("UNKNOWN");
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("41997925357");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCodeImg, setQrCodeImg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [waMode, setWaMode] = useState<WhatsAppMode>(() => getWhatsAppMode());

  const checkStatus = async () => {
    try {
      const res = await checkWahaStatus();
      setStatus(res.state as any);
      if (res.state === "WORKING") {
        setPairingCode(null);
        setQrCodeImg(null);
        onConnected?.();
      }
      return res.state;
    } catch {
      setStatus("DISCONNECTED");
      return "DISCONNECTED";
    }
  };

  useEffect(() => {
    if (open) {
      checkStatus();
    }
  }, [open]);

  // Auto-polling quando aguardando pareamento
  useEffect(() => {
    if (!open) return;
    if (status === "WORKING") return;

    const interval = setInterval(async () => {
      const currentState = await checkStatus();
      if (currentState === "WORKING") {
        toast.success("WhatsApp conectado com sucesso! 🟢");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [open, status]);

  const handleRequestPairingCode = async () => {
    const clean = phoneNumber.replace(/\D/g, "");
    if (!clean) {
      toast.error("Informe o número com DDD (ex: 41997925357)");
      return;
    }

    setLoading(true);
    setPairingCode(null);
    try {
      const res = await requestWahaPairingCode(clean);
      if (res.success && res.code) {
        setPairingCode(res.code);
        toast.success("Código de pareamento gerado!");
      } else {
        toast.error(res.error || "Não foi possível gerar código.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro de rede ao conectar.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadQrCode = async () => {
    setLoading(true);
    setQrCodeImg(null);
    try {
      const res = await fetchWahaQrCode();
      if (res.connected) {
        setStatus("WORKING");
        toast.success("WhatsApp já está conectado!");
      } else if (res.qrcode) {
        setQrCodeImg(res.qrcode);
        setStatus("SCAN_QR_CODE");
        toast.info("Escaneie o QR Code exibido com seu celular.");
      } else {
        toast.warning(res.error || "Aguardando geração do QR Code...");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar QR Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestartSession = async () => {
    setLoading(true);
    try {
      const res = await restartWahaSession();
      if (res.success) {
        setPairingCode(null);
        setQrCodeImg(null);
        setStatus("STARTING");
        toast.success("Sessão reiniciada! Pronto para novo pareamento limpo.");
        setTimeout(checkStatus, 1500);
      } else {
        toast.error(res.error || "Falha ao reiniciar sessão.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao reiniciar.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchMode = (mode: WhatsAppMode) => {
    saveWhatsAppMode(mode);
    setWaMode(mode);
    toast.info(`Modo alterado para: ${mode === "waha" ? "🚀 Envio Direto (WAHA)" : "📱 WhatsApp Direto (wa.me)"}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-950 border-cyan-500/40 text-slate-100 shadow-2xl p-6 rounded-3xl">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-black text-white tracking-wide uppercase">
                Conexão WhatsApp
              </DialogTitle>
            </div>
            <Badge
              variant="outline"
              className={
                status === "WORKING"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-950/40 font-black text-[10px]"
                  : status === "SCAN_QR_CODE" || status === "STARTING"
                  ? "border-amber-500 text-amber-400 bg-amber-950/40 font-black text-[10px]"
                  : "border-rose-500 text-rose-400 bg-rose-950/40 font-black text-[10px]"
              }
            >
              {status === "WORKING" ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> ONLINE
                </span>
              ) : status === "SCAN_QR_CODE" ? (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> AGUARDANDO
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> DESCONECTADO
                </span>
              )}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-400 font-medium">
            Conecte o WhatsApp para disparos automáticos e silenciosos pelo CRM.
          </DialogDescription>
        </DialogHeader>

        {/* Status Banner */}
        {status === "WORKING" ? (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="text-xs font-black text-white">WhatsApp 100% Conectado!</p>
                <p className="text-[11px] text-emerald-400/90 font-medium">
                  Pronto para envio direto de mensagens e propostas.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRestartSession}
              disabled={loading}
              className="text-[10px] text-slate-400 hover:text-white h-8"
              title="Desconectar e reiniciar"
            >
              Reconectar
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Seletor de Método de Conexão */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("pairing");
                  setQrCodeImg(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "pairing"
                    ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Código (8 Dígitos)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("qr");
                  setPairingCode(null);
                  handleLoadQrCode();
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "qr"
                    ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <QrCode className="h-3.5 w-3.5" /> Escanear QR
              </button>
            </div>

            {/* ABA 1: CÓDIGO DE PAREAMENTO (O MAIS PRÁTICO) */}
            {activeTab === "pairing" && (
              <div className="space-y-3 p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Número do seu WhatsApp (com DDD):
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Ex: 41997925357"
                      className="h-10 text-sm font-bold bg-slate-950 border-slate-700 text-white font-mono rounded-xl"
                    />
                    <Button
                      onClick={handleRequestPairingCode}
                      disabled={loading || !phoneNumber.trim()}
                      className="h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 rounded-xl shrink-0"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar Código"}
                    </Button>
                  </div>
                </div>

                {pairingCode ? (
                  <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/50 text-center space-y-2 animate-in zoom-in-95">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-widest block">
                      Digite este código no seu WhatsApp:
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-mono font-black text-white tracking-widest bg-slate-900 px-4 py-1.5 rounded-xl border border-cyan-500/40 select-all">
                        {pairingCode}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyCode}
                        className="h-10 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 text-left bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <p className="font-bold text-slate-200">Como conectar:</p>
                      <p>1. Abra o WhatsApp no seu celular.</p>
                      <p>2. Toque nos <strong>três pontinhos</strong> (ou Configurações) &gt; <strong>Aparelhos Conectados</strong>.</p>
                      <p>3. Toque em <strong>Conectar um Aparelho</strong> &gt; <strong>Conectar com número de telefone</strong>.</p>
                      <p>4. Digite o código de 8 caracteres exibido acima.</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    💡 <strong>Dica Prática:</strong> O pareamento por código não usa câmera e não expira em 20 segundos. Você só digita o código no celular uma única vez!
                  </p>
                )}
              </div>
            )}

            {/* ABA 2: QR CODE CLÁSSICO */}
            {activeTab === "qr" && (
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                {qrCodeImg ? (
                  <div className="p-3 bg-white rounded-2xl shadow-xl">
                    <img src={qrCodeImg} alt="QR Code WhatsApp" className="w-52 h-52 object-contain" />
                  </div>
                ) : (
                  <div className="h-52 w-52 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                    {loading ? (
                      <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-2" />
                    ) : (
                      <QrCode className="h-8 w-8 mb-2" />
                    )}
                    <span className="text-xs">Aguardando QR Code...</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLoadQrCode}
                    disabled={loading}
                    className="h-8 text-xs font-bold border-slate-700 text-slate-300"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar QR
                  </Button>
                </div>
              </div>
            )}

            {/* Botões Inferiores de Ação */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleRestartSession}
                disabled={loading}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                title="Limpar arquivos antigos da sessão e reiniciar do zero"
              >
                <RefreshCw className="h-3 w-3" /> Limpar Sessão &amp; Reiniciar
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode(waMode === "waha" ? "web" : "waha")}
                className="text-[11px] text-slate-400 hover:text-cyan-400 font-bold flex items-center gap-1"
              >
                {waMode === "waha" ? "Mudar p/ Whats Direto (wa.me)" : "Usar WAHA Direto"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
