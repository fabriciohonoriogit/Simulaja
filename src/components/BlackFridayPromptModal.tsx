import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Copy, Check, Flame, Sliders, Layers, Lightbulb, Image as ImageIcon } from "lucide-react";
import { BLACK_FRIDAY_PROMPTS, BlackFridayPromptItem } from "@/utils/blackFridayPrompts";
import { useToast } from "@/hooks/use-toast";

interface BlackFridayPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoria?: string;
}

export const BlackFridayPromptModal: React.FC<BlackFridayPromptModalProps> = ({
  isOpen,
  onClose,
  defaultCategoria = "imovel",
}) => {
  const { toast } = useToast();
  const [selectedKey, setSelectedKey] = useState<string>(
    BLACK_FRIDAY_PROMPTS[defaultCategoria] ? defaultCategoria : "imovel"
  );
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1">("9:16");
  const [language, setLanguage] = useState<"en" | "pt">("en");
  const [copied, setCopied] = useState(false);

  const activeItem: BlackFridayPromptItem = BLACK_FRIDAY_PROMPTS[selectedKey] || BLACK_FRIDAY_PROMPTS.imovel;

  const getFullPrompt = (): string => {
    let base = language === "en" ? activeItem.promptIngles : activeItem.promptPortugues;
    
    // Substituir ou aplicar aspect ratio
    if (language === "en") {
      base = base.replace(/--ar\s+[0-9:]+/g, `--ar ${aspectRatio}`);
    } else {
      base = `${base} (Proporção: ${aspectRatio === "9:16" ? "Vertical Story 9:16" : "Quadrado Feed 1:1"})`;
    }
    return base;
  };

  const handleCopy = () => {
    const textToCopy = getFullPrompt();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast({
      title: "Prompt Copiado com Sucesso! 🚀",
      description: `Pronto para colar no Midjourney, Flux.1 ou DALL-E 3 (${aspectRatio}).`,
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-[#030712] border border-cyan-500/40 text-white p-6 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.25)] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40 inline-flex items-center gap-1">
              <Flame className="w-3 h-3 text-pink-400" />
              Black das Blacks 2026
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Engenharia de Prompt IA
            </span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-pink-400">
            Gerador de Prompts: Estilo Cybernetic Wireframe
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs sm:text-sm">
            Copie os prompts oficiais calibrados para reproduzir o efeito visual da campanha: objeto real com fatiamento holográfico 3D luminoso em ciano e laranja magma.
          </DialogDescription>
        </DialogHeader>

        {/* Categoria Selector Tabs */}
        <div className="mt-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Selecione o Segmento da Imagem:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {Object.entries(BLACK_FRIDAY_PROMPTS).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
                  selectedKey === key
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {key === "imovel" && "🏠 Imóvel"}
                {key === "veiculo" && "🚗 Carro"}
                {key === "moto" && "🏍️ Moto"}
                {key === "pesados" && "🚛 Caminhão"}
                {key === "agro" && "🌾 Agro"}
                {key === "master" && "⭐ Master"}
              </button>
            ))}
          </div>
        </div>

        {/* Options Toolbar: Language & Format */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Formato:</span>
            <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              <button
                onClick={() => setAspectRatio("9:16")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  aspectRatio === "9:16" ? "bg-cyan-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Story 9:16
              </button>
              <button
                onClick={() => setAspectRatio("1:1")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  aspectRatio === "1:1" ? "bg-cyan-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Feed 1:1
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Idioma:</span>
            <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  language === "en" ? "bg-pink-500 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
                title="Recomendado para Midjourney e Flux"
              >
                Inglês (Recomendado)
              </button>
              <button
                onClick={() => setLanguage("pt")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  language === "pt" ? "bg-pink-500 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Português
              </button>
            </div>
          </div>
        </div>

        {/* Prompt Display Box */}
        <div className="mt-3 relative rounded-xl border border-cyan-500/30 bg-slate-950/90 p-4 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              {activeItem.titulo}
            </span>
            <Button
              size="sm"
              onClick={handleCopy}
              className="h-8 px-3 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.4)]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copiar Prompt
                </>
              )}
            </Button>
          </div>

          <p className="text-xs sm:text-sm font-mono text-slate-200 leading-relaxed select-all bg-black/40 p-3 rounded-lg border border-slate-800">
            {getFullPrompt()}
          </p>

          {/* Negative Prompt */}
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
              Negative Prompt (Para Stable Diffusion / Leonardo):
            </span>
            <p className="text-[11px] font-mono text-slate-400 select-all">
              {activeItem.negativePrompt}
            </p>
          </div>
        </div>

        {/* Technical Guidance */}
        <div className="mt-4 rounded-xl bg-slate-900/60 border border-slate-800 p-3 text-xs text-slate-300 space-y-2">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong className="text-amber-300">Dica de Produção:</strong> {activeItem.detalhesTecnicos}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Paleta de Cores Chave: {activeItem.paletaCores.join(" · ")}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

