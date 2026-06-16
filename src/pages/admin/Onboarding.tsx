import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Building2, Target, Loader2, Rocket } from "lucide-react";

export default function Onboarding() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const [orgName, setOrgName] = useState("");
  const [metaAnual, setMetaAnual] = useState("1000000");

  useEffect(() => {
    // If we have profile data, prefill some fields
    if (profile?.organizacao_id) {
      fetchOrg();
    }
  }, [profile]);

  const fetchOrg = async () => {
    if (!profile?.organizacao_id) return;
    const { data } = await supabase.from("organizacoes").select("*").eq("id", profile.organizacao_id).single();
    if (data) {
      if ((data as any).onboarding_completed) {
        navigate("/admin"); // already onboarded
      }
      setOrgName(data.nome.replace(" - CRM", ""));
    }
  };

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleFinish = async () => {
    if (!profile?.organizacao_id) return;
    setSaving(true);
    try {
      // Atualiza Organizacao
      const { error: orgError } = await (supabase.from("organizacoes") as any).update({
        nome: orgName,
        onboarding_completed: true
      }).eq("id", profile.organizacao_id);

      if (orgError) throw orgError;

      // Opcional: cria a meta
      const { error: metaError } = await supabase.from("meta").insert({
        organizacao_id: profile.organizacao_id,
        meta_anual: parseInt(metaAnual.replace(/\D/g, "")),
        ano: new Date().getFullYear()
      });
      // ignore meta duplicate errors if any

      toast({
        title: "Tudo pronto!",
        description: "Seu CRM foi configurado com sucesso.",
      });

      // Força reload para limpar caches do roteador e recarregar o AdminLayout
      window.location.href = "/admin";
    } catch (err: any) {
      toast({
        title: "Erro ao configurar",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bem-vindo ao Simulajá</h1>
          <p className="text-slate-500 mt-2">Vamos preparar o seu ambiente em menos de 1 minuto.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-2xl overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
            <span className="text-white font-bold">Passo {step} de 2</span>
            <div className="flex gap-2">
              <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-slate-700'}`} />
              <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-slate-700'}`} />
            </div>
          </div>

          <CardContent className="p-8">
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-3 text-primary mb-6">
                  <Building2 className="h-6 w-6" />
                  <h2 className="text-xl font-bold">Dados da Empresa</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold">Nome da sua Corretora/Empresa</Label>
                    <Input 
                      value={orgName} 
                      onChange={(e) => setOrgName(e.target.value)}
                      className="h-12 text-lg rounded-xl"
                      placeholder="Ex: Prime Consórcios"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    onClick={handleNext} 
                    className="w-full h-12 rounded-xl text-base font-bold"
                    disabled={!orgName.trim()}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-3 text-primary mb-6">
                  <Target className="h-6 w-6" />
                  <h2 className="text-xl font-bold">Metas & Regras</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold">Meta de Vendas ({new Date().getFullYear()})</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                      <Input 
                        value={metaAnual} 
                        onChange={(e) => setMetaAnual(e.target.value.replace(/\D/g, ""))}
                        className="h-12 pl-12 text-lg rounded-xl font-mono"
                        placeholder="1.000.000"
                      />
                    </div>
                    <p className="text-xs text-slate-500">Isso ajuda a gerar os relatórios iniciais no Dashboard.</p>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    className="flex-1 h-12 rounded-xl text-base font-bold"
                  >
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleFinish} 
                    className="flex-1 h-12 rounded-xl text-base font-bold gap-2"
                    disabled={saving || !metaAnual}
                  >
                    {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                    Concluir Setup
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
