import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Monitor, Sparkles, X, Check, FileText, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { aiService } from "@/services/aiService";

interface BellaMultimodalScannerProps {
  onAnalysisResult: (text: string, imageBase64?: string) => void;
}

export function BellaMultimodalScanner({ onAnalysisResult }: BellaMultimodalScannerProps) {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Escuta evento de colar imagem diretamente (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            readAndSetFile(file);
            toast({
              title: "📸 Imagem Colada da Área de Transferência!",
              description: "Pronta para análise multimodal da Bella.",
            });
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  function readAndSetFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo Inválido",
        description: "Selecione uma imagem válida (PNG, JPG, WEBP).",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readAndSetFile(file);
  };

  const captureScreen = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast({
          title: "Captura Indisponível",
          description: "Use o botão de upload de arquivo ou cole com Ctrl+V.",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/png");
      setSelectedImage(dataUrl);

      // Para todas as faixas do stream
      stream.getTracks().forEach((track) => track.stop());

      toast({
        title: "🖥️ Captura de Tela Efetuada!",
        description: "Bella pronta para analisar o conteúdo exibido.",
      });
    } catch (e) {
      console.log("Captura de tela cancelada pelo usuário ou não suportada.");
    }
  };

  const processImageWithAI = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    toast({
      title: "🤖 Bella Olhando a Tela / Documento...",
      description: "Extraindo dados de consórcio, tabela ou proposta...",
    });

    try {
      const res = await aiService.askJarvis(
        "Análise Multimodal de Imagem/Tela",
        "Bella, analise esta imagem/captura de tela com atenção máxima. Se for proposta ou simulação de consórcio, extraia os valores, taxas e lance. Se for print de conversa ou tabela, resuma os pontos decisivos de vendas.",
        [],
        selectedImage
      );

      const text = res.answer || (res as any).script || "Análise concluída com sucesso!";
      onAnalysisResult(text, selectedImage);
      setSelectedImage(null);
    } catch (e) {
      toast({
        title: "Erro na Análise",
        description: "Falha ao processar imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="bg-slate-950/80 border-slate-800 text-white shadow-2xl backdrop-blur-xl rounded-xl">
      <CardHeader className="pb-3 border-b border-slate-800/80 bg-slate-900/50 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-cyan-400 font-mono">
              OLHAR A TELA / DOCUMENTO (MULTIMODAL)
            </CardTitle>
            <p className="text-[11px] text-slate-400">
              Cole (Ctrl+V), capture a tela ou faça upload de propostas
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {!selectedImage ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-20 border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-800/60 text-slate-300 flex flex-col gap-1.5 rounded-lg"
            >
              <Upload className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-mono">Upload de Imagem</span>
              <span className="text-[10px] text-slate-500">ou cole com Ctrl+V</span>
            </Button>

            <Button
              variant="outline"
              onClick={captureScreen}
              className="h-20 border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-800/60 text-slate-300 flex flex-col gap-1.5 rounded-lg"
            >
              <Monitor className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-mono">Capturar Tela Atual</span>
              <span className="text-[10px] text-slate-500">Prints, CRM ou Tabelas</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-cyan-500/40 max-h-[180px] flex items-center justify-center bg-black/60">
              <img
                src={selectedImage}
                alt="Captura selecionada"
                className="max-h-[170px] w-auto object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="border-slate-800 text-slate-400 text-xs font-mono"
              >
                Cancelar
              </Button>

              <Button
                size="sm"
                disabled={isAnalyzing}
                onClick={processImageWithAI}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                {isAnalyzing ? "Analisando..." : "Enviar para Bella"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
