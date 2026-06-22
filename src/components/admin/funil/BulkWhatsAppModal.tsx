import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Users, CheckCircle2, RefreshCw, Send, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatToUpper } from "@/lib/formatters";

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

export function BulkWhatsAppModal({
  open,
  onOpenChange,
  selectedClients,
  onComplete,
  organizacaoId
}: BulkWhatsAppModalProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 });
  
  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [mediaMimeType, setMediaMimeType] = useState<string | null>(null);

  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O tamanho máximo permitido é 5MB.", variant: "destructive" });
      return;
    }

    setMediaFile(file);
    setMediaMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setMediaPreview(result);
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
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

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + variable);
  };

  const handleSend = async () => {
    if (!message.trim() || selectedClients.length === 0 || !organizacaoId) return;

    setIsSending(true);
    setProgress({ sent: 0, failed: 0, total: selectedClients.length });

    try {
      // In a real scenario, this would call the Supabase Edge Function to enqueue and process via Evolution API.
      // For this implementation, we simulate the backend call to the new edge function.
      const { data, error } = await supabase.functions.invoke("evolution-send-message", {
        body: {
          organizacaoId,
          clients: selectedClients.map(c => ({
            id: c.id,
            nome: c.nome,
            celular: c.celular,
            grupo: c.grupo,
            cota: c.cota,
            administradora: c.administradora
          })),
          template: message,
          media: mediaBase64 ? {
            base64: mediaBase64,
            mimeType: mediaMimeType,
            fileName: mediaFile?.name
          } : undefined
        }
      });

      if (error) throw error;

      toast({ title: "Disparo iniciado com sucesso!", description: "As mensagens estão sendo enviadas em segundo plano." });
      onComplete();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao iniciar disparo", description: e.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-900">
            <Zap className="h-6 w-6 text-emerald-500 fill-emerald-500" />
            Disparo em Massa (WhatsApp)
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Você selecionou {selectedClients.length} cliente(s) para envio. A mensagem será enviada através do WhatsApp conectado (Evolution API).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
              Variáveis Dinâmicas
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => insertVariable("{{nome}}")} className="h-7 text-[10px] font-bold">
                {"{{nome}}"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertVariable("{{grupo}}")} className="h-7 text-[10px] font-bold">
                {"{{grupo}}"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertVariable("{{cota}}")} className="h-7 text-[10px] font-bold">
                {"{{cota}}"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertVariable("{{administradora}}")} className="h-7 text-[10px] font-bold">
                {"{{administradora}}"}
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              Clique nos botões para inserir variáveis. O sistema substituirá pelos dados reais de cada cliente na hora do envio.
            </p>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 block">
              Mensagem (Legenda se houver imagem)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Olá {{nome}}, temos uma novidade para sua cota {{cota}}..."
              className="min-h-[120px] font-medium resize-none focus-visible:ring-emerald-500 rounded-xl"
              disabled={isSending}
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                Anexo (Imagem ou Documento)
              </label>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Máx 5MB</span>
            </div>
            
            {!mediaFile ? (
              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  disabled={isSending}
                />
                <ImageIcon className="h-8 w-8 text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                <p className="text-sm font-bold text-slate-600">Clique ou arraste um arquivo</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Imagens (JPG, PNG) ou PDF</p>
              </div>
            ) : (
              <div className="relative border border-slate-200 rounded-xl p-4 flex items-center gap-4 bg-white">
                {mediaPreview && mediaFile.type.startsWith("image/") ? (
                  <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                    <img src={mediaPreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100">
                    <span className="font-black text-xs uppercase">PDF</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{mediaFile.name}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={removeMedia}
                  className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                  disabled={isSending}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
            <div className="bg-amber-100 h-8 w-8 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-sm text-amber-800">
              <p className="font-bold">Dica de Prevenção de Bloqueio</p>
              <p className="opacity-90 mt-1 leading-snug">
                As mensagens serão enviadas com intervalos de segurança de alguns segundos entre cada uma. Mantenha as mensagens amigáveis para evitar que os clientes marquem como Spam.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSending} className="font-bold">
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !mediaFile) || isSending}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest min-w-[140px]"
          >
            {isSending ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" /> Iniciar Envio
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
