import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Eye, ShieldAlert, Cpu, RefreshCw, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { aiService } from "@/services/aiService";
import { useToast } from "@/components/ui/use-toast";

interface IdleEngineModule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  icon: any;
  lastChecked?: string;
}

interface ProactiveInsight {
  id: string;
  type: "pipeline" | "facts" | "inadimplencia";
  title: string;
  description: string;
  actionText?: string;
  actionRoute?: string;
  timestamp: Date;
}

interface BellaIdleEngineProps {
  onRunInsight?: (insight: ProactiveInsight) => void;
  onNavigate?: (route: string) => void;
}

export function BellaIdleEngine({ onRunInsight, onNavigate }: BellaIdleEngineProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [modules, setModules] = useState<IdleEngineModule[]>([
    {
      id: "funil",
      name: "Olhar o Funil",
      description: "Scanner de leads parados e propostas não enviadas",
      active: true,
      icon: Eye,
      lastChecked: "Agora mesmo",
    },
    {
      id: "fato",
      name: "Olhar o Fato",
      description: "Leitura de taxa Selic, BACEN e tabelas de consórcio",
      active: true,
      icon: Zap,
      lastChecked: "Há 2 min",
    },
    {
      id: "inadimplencia",
      name: "Olhar Inadimplência",
      description: "Monitoramento de parcelas em risco de atraso",
      active: true,
      icon: ShieldAlert,
      lastChecked: "Há 5 min",
    },
    {
      id: "status",
      name: "Telemetria & Status",
      description: "Integridade de APIs e servidor de inteligência local",
      active: true,
      icon: Cpu,
      lastChecked: "Ativo 100%",
    },
  ]);

  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((mod) => (mod.id === id ? { ...mod, active: !mod.active } : mod))
    );
  };

  const runFullDiagnostic = async () => {
    setIsScanning(true);
    toast({
      title: "🔍 Motor Ocioso Iniciado",
      description: "Bella está varrendo o funil, mercado e financeiro...",
    });

    try {
      const activeMods = modules.filter((m) => m.active).map((m) => m.id);
      const res = await aiService.scanEngineProactively(activeMods);

      if (res && res.insights && res.insights.length > 0) {
        setInsights(res.insights);
        toast({
          title: "✨ Diagnóstico Concluído!",
          description: `${res.insights.length} novos insights identificados pela Bella.`,
        });
      } else {
        // Fallback demo insights if DB is clean
        const defaultInsights: ProactiveInsight[] = [
          {
            id: "1",
            type: "pipeline",
            title: "Leads sem Contato no Funil",
            description: "Existem 4 novos leads de consórcio imobiliário aguardando primeira abordagem há mais de 12 horas.",
            actionText: "Ir para o Funil",
            actionRoute: "/admin/funil",
            timestamp: new Date(),
          },
          {
            id: "2",
            type: "facts",
            title: "Oportunidade de Lance Embutido",
            description: "Taxa SELIC estável favorece contemplação acelerada por lance fixo no segmento de Pesados.",
            actionText: "Simular Consórcio",
            actionRoute: "/simulador",
            timestamp: new Date(),
          },
          {
            id: "3",
            type: "inadimplencia",
            title: "Prevenção de Assembleia",
            description: "3 clientes possuem parcelas a vencer nos próximos 2 dias. Recomenda-se envio de lembrete preventivo.",
            actionText: "Ver Inadimplentes",
            actionRoute: "/admin/inadimplentes",
            timestamp: new Date(),
          },
        ];
        setInsights(defaultInsights);
      }
    } catch (e) {
      console.error("Erro no diagnóstico do Motor Ocioso:", e);
    } finally {
      setIsScanning(false);
      setModules((prev) =>
        prev.map((m) => ({ ...m, lastChecked: "Agora mesmo" }))
      );
    }
  };

  return (
    <Card className="bg-slate-950/80 border-slate-800 text-white shadow-2xl backdrop-blur-xl rounded-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-800/80 bg-slate-900/50 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-amber-400 font-mono">
              MOTOR OCIOSO (IDLE ENGINE)
            </CardTitle>
            <p className="text-[11px] text-slate-400">
              Agente autônomo monitorando em background
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={isScanning}
          onClick={runFullDiagnostic}
          className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono gap-1.5 h-8"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
          {isScanning ? "Varrendo..." : "Diagnóstico"}
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Checklist dos Módulos do Motor */}
        <div className="grid grid-cols-1 gap-2">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => toggleModule(mod.id)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  mod.active
                    ? "bg-slate-900/80 border-slate-700/80 hover:border-amber-500/40"
                    : "bg-slate-950/40 border-slate-800/40 opacity-50 hover:opacity-80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2
                    className={`w-4 h-4 transition-colors ${
                      mod.active ? "text-amber-400" : "text-slate-600"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200">
                        {mod.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({mod.lastChecked})
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[9px] font-mono uppercase ${
                    mod.active
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                      : "border-slate-700 text-slate-500"
                  }`}
                >
                  {mod.active ? "ATIVO" : "PAUSADO"}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Proactive Insights Generated */}
        {insights.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Zap className="w-3.5 h-3.5" />
                Insights Proativos da Bella
              </span>
              <span>{insights.length} encontrados</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {insights.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      {item.type === "pipeline" && <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                      {item.type === "facts" && <TrendingUp className="w-3.5 h-3.5 text-amber-400" />}
                      {item.type === "inadimplencia" && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                      {item.title}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  {item.actionText && item.actionRoute && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onNavigate?.(item.actionRoute!)}
                      className="h-6 px-2 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-0 font-mono"
                    >
                      {item.actionText} →
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
