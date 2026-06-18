import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, MessageCircle, Lock, Sparkles } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5541997925357?text=Quero%20um%20convite%20para%20testar%20o%20Contemplar%20CRM";

export default function Register() {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(!!invitationToken);
  const [success, setSuccess] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (invitationToken) checkInvitation();
  }, [invitationToken]);

  const checkInvitation = async () => {
    setChecking(true);
    const { data, error } = await (supabase.from("convites") as any)
      .select("*, organizacoes(nome)")
      .eq("token", invitationToken)
      .eq("status", "pendente")
      .maybeSingle();

    if (error || !data) {
      setInviteError("Este link de convite expirou ou é inválido.");
      setChecking(false);
      return;
    }
    if (new Date(data.expires_at) < new Date()) {
      setInviteError("Este convite expirou. Solicite um novo.");
      setChecking(false);
      return;
    }
    setInvitationData(data);
    setEmail(data.email || "");
    setChecking(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/login`,
          data: {
            nome_completo: nome,
            convite_token: invitationToken,
          },
        },
      });
      if (authError) throw authError;
      setSuccess(true);
      toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o acesso." });
      setTimeout(() => navigate("/admin/login"), 3000);
    } catch (err: any) {
      toast({ title: "Erro no cadastro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // If no invitation token is provided, it's an open registration for a new Trial tenant.
  // We no longer block access for users without a token.

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[28px] p-8 text-center space-y-5">
          <h2 className="text-xl font-black text-slate-900">Convite inválido</h2>
          <p className="text-slate-500">{inviteError}</p>
          <Button asChild className="w-full h-12 rounded-xl">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener">
              <MessageCircle className="mr-2 h-4 w-4" /> Solicitar novo convite
            </a>
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[32px] p-8 text-center">
          <div className="bg-green-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Quase lá!</h2>
          <p className="text-slate-500 mb-6">
            Enviamos um e-mail de confirmação para <strong>{email}</strong>.
          </p>
          <Button onClick={() => navigate("/admin/login")} variant="outline" className="w-full rounded-xl">
            Ir para o Login
          </Button>
        </Card>
      </div>
    );
  }

  const isNovoTenant = !invitationToken || invitationData?.tipo !== "membro_org";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[28px] p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            {isNovoTenant ? "30 dias grátis" : `Entrar na equipe ${invitationData?.organizacoes?.nome || ""}`}
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {isNovoTenant ? "Ative seu acesso" : "Aceitar convite"}
          </h2>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Seu nome completo</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled required className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Crie uma senha forte</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10 h-12 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button className="w-full h-12 rounded-xl font-bold" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isNovoTenant ? "Começar trial de 30 dias" : "Entrar na equipe")}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
