import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Lock, Eye, EyeOff, LogIn, User, MessageSquare, Bot, BarChart2 } from "lucide-react";
import { JarvisOrb } from "@/components/admin/JarvisOrb";

const customAnimations = `
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
.animate-breathe {
  animation: breathe 4s ease-in-out infinite;
}
@keyframes orbit-1 {
  from { transform: rotate(0deg) scale(1); }
  to { transform: rotate(360deg) scale(1); }
}
.animate-orbit-1 {
  animation: orbit-1 12s linear infinite;
}
@keyframes orbit-2 {
  from { transform: rotate(120deg) scale(1); }
  to { transform: rotate(480deg) scale(1); }
}
.animate-orbit-2 {
  animation: orbit-2 15s linear infinite;
}
@keyframes orbit-3 {
  from { transform: rotate(240deg) scale(1); }
  to { transform: rotate(600deg) scale(1); }
}
.animate-orbit-3 {
  animation: orbit-3 18s linear infinite;
}
`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const lowerEmail = email.trim().toLowerCase();
    if (lowerEmail.includes("copatti") || lowerEmail.includes("coppati") || lowerEmail.includes("andersoncopatti")) {
      setError("Acesso revogado pelo Administrador do sistema.");
      setLoading(false);
      return;
    }

    try {
      // Timeout de segurança de 10s para redes móveis
      const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Tempo limite de resposta excedido. Tente novamente.")), 10000)
      );

      const res = await Promise.race([
        signIn(email.trim(), password),
        timeoutPromise
      ]);

      if (res.error) {
        setError(res.error.message || "E-mail ou senha inválidos.");
        setLoading(false);
      } else {
        window.location.href = "/admin";
      }
    } catch (err: any) {
      console.error("Login catch error:", err);
      setError(err.message || "Erro ao conectar. Verifique sua conexão.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ 
        title: "E-mail necessário", 
        description: "Digite seu e-mail no campo acima para receber o link de recuperação.", 
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Link Enviado!", 
        description: "Verifique seu e-mail para redefinir sua senha." 
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#040B16]">
      <style>{customAnimations}</style>
      
      {/* Background Deep Gradient matching the image */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#021024] via-[#051f3e] to-[#042817] z-0" />
      
      {/* Orbs/Particles in the background (using JarvisOrb scaled up and subtle) */}
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none scale-[1.5] sm:scale-125">
         <JarvisOrb state="idle" />
      </div>

      <div className="w-full max-w-[420px] animate-in fade-in duration-1000 z-10 flex flex-col items-center mt-4 sm:mt-8">
        
        {/* Logo Section with Atom Rings */}
        <div className="relative flex flex-col items-center mb-6 animate-breathe w-full">
          
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
            {/* Core Glow */}
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150" />
            
            {/* CSS Orbit Rings (Atoms) */}
            <div className="absolute w-[220%] h-[70%] border border-blue-400/40 rounded-[100%] animate-orbit-1" />
            <div className="absolute w-[220%] h-[70%] border border-green-400/30 rounded-[100%] animate-orbit-2" />
            <div className="absolute w-[220%] h-[70%] border border-blue-400/20 rounded-[100%] animate-orbit-3" />

            {/* Logo Image */}
            <img src="/icon-512.webp" alt="Logo Contemplar" className="h-28 sm:h-32 w-auto object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] relative z-10" />
          </div>

          <div className="flex flex-col items-center leading-tight mt-8 relative z-10">
            <span className="text-[32px] sm:text-[36px] font-black tracking-widest text-white uppercase drop-shadow-lg">CONTEMPLAR</span>
            <span className="text-[20px] sm:text-[22px] font-bold tracking-[0.4em] text-[#84CC16] -mt-1 ml-2 drop-shadow-md">CRM</span>
          </div>
          
          <p className="text-slate-200 text-[13px] sm:text-sm mt-4 font-medium text-center leading-relaxed max-w-[340px] relative z-10 drop-shadow-md">
            Gerencie clientes, vendas e contemplações<br/>em um só lugar com o poder do <span className="text-[#84CC16] font-bold">Jarvis IA</span>.
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white rounded-[20px] shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6 sm:p-8 relative z-10 border border-white/10">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Acesso ao Painel</h2>
            <div className="h-1 w-10 bg-[#84CC16] mx-auto mt-3 rounded-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-bold text-[13px]">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="vendedor@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 text-sm focus-visible:ring-[#0D214F] shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-bold text-[13px]">Senha</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[12px] font-bold text-[#0D214F] hover:text-[#84CC16] transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pl-10 pr-10 rounded-xl bg-slate-50 border-slate-200 text-sm focus-visible:ring-[#0D214F] shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 font-medium text-center bg-red-50 py-2 rounded-lg">{error}</p>}

            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-[15px] bg-[#051125] hover:bg-[#0a1e3f] text-white shadow-lg transition-all mt-4" disabled={loading}>
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? "Autenticando..." : "Acessar Meu CRM"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-3 opacity-50">
            <div className="h-px bg-slate-300 flex-1"></div>
            <span className="text-[11px] text-slate-500 font-medium">ou conecte-se com</span>
            <div className="h-px bg-slate-300 flex-1"></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl font-bold text-sm mt-5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all"
            onClick={async () => {
              setLoading(true);
              await signInWithGoogle();
              setLoading(false);
            }}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google Workspace
          </Button>
        </div>

        {/* 4 Bottom Features */}
        <div className="grid grid-cols-4 gap-2 mt-8 w-full px-2 relative z-10 pb-16">
          <div className="flex flex-col items-center text-center group transition-transform hover:scale-110">
            <User className="h-[22px] w-[22px] text-[#84CC16] mb-1.5" />
            <span className="text-[10px] leading-tight text-slate-300 font-medium">Gestão<br/>de Leads</span>
          </div>
          <div className="flex flex-col items-center text-center group transition-transform hover:scale-110">
            <MessageSquare className="h-[22px] w-[22px] text-blue-400 mb-1.5" />
            <span className="text-[10px] leading-tight text-slate-300 font-medium">Automação<br/>WhatsApp</span>
          </div>
          <div className="flex flex-col items-center text-center group transition-transform hover:scale-110">
            <Bot className="h-[22px] w-[22px] text-[#84CC16] mb-1.5" />
            <span className="text-[10px] leading-tight text-slate-300 font-medium">Inteligência<br/>Artificial Jarvis</span>
          </div>
          <div className="flex flex-col items-center text-center group transition-transform hover:scale-110">
            <BarChart2 className="h-[22px] w-[22px] text-blue-400 mb-1.5" />
            <span className="text-[10px] leading-tight text-slate-300 font-medium">Dashboard<br/>Comercial</span>
          </div>
        </div>

      </div>

      {/* Footer Powered by Fabricio */}
      <div className="absolute bottom-4 flex items-center justify-center space-x-2 z-10">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-900/40 border border-blue-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(59,130,246,0.3)]">
          <Bot className="w-4 h-4 text-[#4ca8e8]" />
        </div>
        <p className="text-white/70 text-[12px] font-medium uppercase tracking-wider">
          Powered por <span className="text-[#84CC16] font-bold">FABRICIO HONÓRIO</span>
        </p>
      </div>

    </div>
  );
}
