import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { ProfileRow, ConviteRow, OrganizationRow } from "@/types";
import { Users, Mail, UserPlus, Copy, RefreshCw, Trash2, Shield, ChevronDown, Upload, CalendarDays, Settings as SettingsIcon, MessageSquare, Loader2, Link2, QrCode, ExternalLink } from "lucide-react";
import { AdminHeroCard } from "@/components/admin/AdminHeroCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createWhatsAppInstance } from "@/services/evolutionOnboardingService";
import { 
  getEvolutionConfig, 
  saveEvolutionConfig, 
  checkEvolutionStatus, 
  fetchEvolutionQrCode, 
  getWhatsAppMode, 
  saveWhatsAppMode, 
  getWahaConfig,
  saveWahaConfig,
  checkWahaStatus,
  fetchWahaQrCode,
  requestWahaPairingCode,
  restartWahaSession,
  WhatsAppMode 
} from "@/services/evolutionApiService";
import { QRCodeSVG } from "qrcode.react";

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "manager", label: "Manager" },
  { value: "vendedor", label: "Vendedor" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber-100 text-amber-900 border-amber-300",
  manager: "bg-purple-100 text-purple-900 border-purple-300",
  vendedor: "bg-blue-100 text-blue-900 border-blue-300",
};

export default function Settings() {
  const { toast } = useToast();
  const { profile, isAdmin } = useProfile();
  const [emailToInvite, setEmailToInvite] = useState("");
  const [roleToInvite, setRoleToInvite] = useState("vendedor");
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [invitations, setInvitations] = useState<ConviteRow[]>([]);
  const [org, setOrg] = useState<OrganizationRow | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [waMode, setWaMode] = useState<WhatsAppMode>("web");
  const [evolutionUrl, setEvolutionUrl] = useState("");
  const [evolutionKey, setEvolutionKey] = useState("");
  const [evolutionInstance, setEvolutionInstance] = useState("");
  const [evolutionStatus, setEvolutionStatus] = useState<string>("UNKNOWN");
  const [testingStatus, setTestingStatus] = useState(false);
  const [qrCodeImg, setQrCodeImg] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [webQrOpen, setWebQrOpen] = useState(false);
  const [wahaUrl, setWahaUrl] = useState("");
  const [wahaKey, setWahaKey] = useState("");
  const [wahaSession, setWahaSession] = useState("default");
  const [wahaStatus, setWahaStatus] = useState<string>("UNKNOWN");
  const [wahaTesting, setWahaTesting] = useState(false);
  const [wahaCreating, setWahaCreating] = useState(false);
  const [wahaQrCodeImg, setWahaQrCodeImg] = useState<string | null>(null);
  const [wahaPairingPhone, setWahaPairingPhone] = useState("");
  const [wahaPairingCode, setWahaPairingCode] = useState<string | null>(null);

  useEffect(() => {
    const cfg = getEvolutionConfig();
    setEvolutionUrl(cfg.apiUrl);
    setEvolutionKey(cfg.apiKey);
    setEvolutionInstance(cfg.instanceName);
    const wahaCfg = getWahaConfig();
    setWahaUrl(wahaCfg.apiUrl);
    setWahaKey(wahaCfg.apiKey);
    setWahaSession(wahaCfg.sessionName || "default");
    setWaMode(getWhatsAppMode());
  }, []);

  const handleModeChange = (mode: WhatsAppMode) => {
    setWaMode(mode);
    saveWhatsAppMode(mode);
    if (mode === "web") {
      setEvolutionStatus("WEB_MODE");
      setQrCodeImg(null);
      setWahaQrCodeImg(null);
      toast({
        title: "🟢 Modo WhatsApp Direto (wa.me) Ativo!",
        description: "Suas conversas e mensagens serão abertas diretamente no WhatsApp sem depender de servidor.",
      });
    } else if (mode === "waha") {
      setQrCodeImg(null);
      toast({
        title: "🚀 Modo WAHA (Envio Direto pelo CRM) Ativo!",
        description: "Disparo direto sem abrir novas abas. Leve, rápido e sem dependência de banco de dados complexo.",
      });
    } else {
      setWahaQrCodeImg(null);
      toast({
        title: "⚡ Modo Evolution API Ativo",
        description: "Configure abaixo o endereço do seu servidor Evolution API (VPS ou Docker).",
      });
    }
  };

  const handleTestWaha = async () => {
    if (!wahaUrl.trim()) {
      toast({ title: "URL Ausente", description: "Informe a URL da API WAHA (ex: http://localhost:3000)", variant: "destructive" });
      return;
    }
    setWahaTesting(true);
    saveWahaConfig({ apiUrl: wahaUrl, apiKey: wahaKey, sessionName: wahaSession || "default" });
    try {
      const res = await checkWahaStatus(wahaSession || "default");
      setWahaStatus(res.state);
      if (res.state === "WORKING") {
        setWahaQrCodeImg(null);
        setWahaPairingCode(null);
        toast({
          title: "Status: CONECTADO! 🟢",
          description: "Sua instância WAHA está conectada ao WhatsApp e pronta para envio direto pelo CRM.",
        });
      } else if (res.state === "SCAN_QR_CODE") {
        toast({
          title: "Aguardando QR Code 🟡",
          description: "Clique em 'Gerar QR Code' para escanear com seu celular.",
        });
      } else {
        toast({
          title: `Status: ${res.state}`,
          description: res.reason || "Sessão não está ativa. Clique em 'Provisionar / QR Code' para iniciar.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setWahaStatus("DISCONNECTED");
      toast({
        title: "Erro ao conectar com WAHA",
        description: err?.message || "Verifique se o container WAHA está rodando.",
        variant: "destructive",
      });
    } finally {
      setWahaTesting(false);
    }
  };

  const handleCreateWahaQr = async () => {
    if (!wahaUrl.trim()) {
      toast({ title: "URL Ausente", description: "Informe a URL da API WAHA", variant: "destructive" });
      return;
    }
    setWahaCreating(true);
    setWahaQrCodeImg(null);
    setWahaPairingCode(null);
    saveWahaConfig({ apiUrl: wahaUrl, apiKey: wahaKey, sessionName: wahaSession || "default" });
    try {
      const qrRes = await fetchWahaQrCode(wahaSession || "default");
      if (qrRes.success && qrRes.connected) {
        setWahaStatus("WORKING");
        toast({
          title: "WhatsApp Já Conectado! 🟢",
          description: "Sua sessão WAHA está ativa e pronta para envio direto.",
        });
        return;
      }
      if (qrRes.success && qrRes.qrcode) {
        setWahaQrCodeImg(qrRes.qrcode);
        setWahaStatus("SCAN_QR_CODE");
        toast({
          title: "QR Code WAHA Gerado com Sucesso!",
          description: "Escaneie o QR Code exibido na tela no seu WhatsApp > Aparelhos Conectados.",
        });
        return;
      }
      toast({
        title: "Aviso",
        description: qrRes.error || "Aguardando o container gerar o QR Code...",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao gerar QR Code",
        description: err?.message || "Falha de rede com o servidor WAHA.",
        variant: "destructive",
      });
    } finally {
      setWahaCreating(false);
    }
  };

  const handleRequestWahaPairing = async () => {
    if (!wahaPhoneForCode.trim()) {
      toast({ title: "Telefone Ausente", description: "Informe o número com DDD (ex: 11999999999)", variant: "destructive" });
      return;
    }
    setWahaCreating(true);
    try {
      const res = await requestWahaPairingCode(wahaPhoneForCode, wahaSession || "default");
      if (res.success && res.code) {
        setWahaPairingCode(res.code);
        toast({
          title: "Código de Pareamento Gerado! 📱",
          description: "Digite o código no seu WhatsApp > Conectar com número de telefone.",
        });
      } else {
        toast({
          title: "Falha ao gerar código",
          description: res.error || "O servidor não retornou código de pareamento.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    } finally {
      setWahaCreating(false);
    }
  };

  const handleRestartWaha = async () => {
    setWahaCreating(true);
    try {
      const res = await restartWahaSession(wahaSession || "default");
      if (res.success) {
        setWahaQrCodeImg(null);
        setWahaPairingCode(null);
        setWahaStatus("STOPPED");
        toast({
          title: "Sessão Reiniciada 🔄",
          description: "Cache antigo limpo com sucesso! Você pode gerar um novo QR Code ou Código de Pareamento agora.",
        });
      } else {
        toast({ title: "Aviso", description: res.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setWahaCreating(false);
    }
  };

  // Auto-polling em tempo real para detectar conexão concluída no celular
  useEffect(() => {
    if (!wahaQrCodeImg && !wahaPairingCode && wahaStatus !== "SCAN_QR_CODE") return;
    const interval = setInterval(async () => {
      try {
        const res = await checkWahaStatus(wahaSession || "default");
        if (res.state === "WORKING") {
          setWahaStatus("WORKING");
          setWahaQrCodeImg(null);
          setWahaPairingCode(null);
          toast({
            title: "WhatsApp CONECTADO! 🟢",
            description: "Aparelho pareado com sucesso. Pronto para envios pelo CRM!",
          });
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [wahaQrCodeImg, wahaPairingCode, wahaStatus, wahaSession]);

  const fetchData = async () => {
    if (!profile?.organizacao_id) return;
    setLoading(true);
    try {
      const { data: members } = await supabase.from("perfis")
        .select("*")
        .eq("organizacao_id", profile.organizacao_id);
      setUsers(members || []);

      const { data: orgData } = await supabase.from("organizacoes")
        .select("*").eq("id", profile.organizacao_id).single();
      setOrg(orgData);

      const { data: invites } = await supabase.from("convites")
        .select("*")
        .eq("organizacao_id", profile.organizacao_id)
        .eq("status", "pendente");
      setInvitations(invites || []);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!emailToInvite || !profile?.organizacao_id) return;
    setInviting(true);
    try {
      const token = Math.random().toString(36).substring(2, 15);
      const { error } = await (supabase.from("convites") as any).insert({
        email: emailToInvite,
        token,
        organizacao_id: profile.organizacao_id,
        convidado_por: profile.id,
        tipo_acesso: roleToInvite,
        tipo: "membro_org",
      });
      if (error) throw error;
      toast({ title: "Convite Criado!", description: "Copie o link abaixo e envie ao colaborador." });
      setEmailToInvite("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/admin/register?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copiado!", description: "Envie para seu colaborador." });
  };

  const deleteInvite = async (id: string) => {
    await supabase.from("convites").delete().eq("id", id);
    toast({ title: "Convite Removido" });
    fetchData();
  };

  const deleteMember = async (userId: string) => {
    if (!window.confirm("Tem certeza que deseja remover este membro da equipe? Todos os dados vinculados a ele podem ser afetados.")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from("perfis")
        .delete()
        .eq("id", userId);
        
      if (error) throw error;
      
      toast({ 
        title: "Membro Removido", 
        description: "O acesso deste colaborador foi revogado com sucesso." 
      });
      fetchData();
    } catch (err) {
      toast({ 
        title: "Erro ao remover", 
        description: (err as Error).message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    try {
      const { error } = await supabase.rpc("update_member_role" as any, {
        target_user_id: userId,
        new_role: newRole,
      });
      if (error) throw error;
      toast({ title: "Cargo Alterado!", description: `Novo cargo: ${ROLES.find(r => r.value === newRole)?.label}` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setChangingRole(null);
    }
  };

  const validateEvolutionUrl = (url: string): { valid: boolean; error?: string } => {
    const trimmed = url.trim();
    if (!trimmed) {
      return { valid: false, error: "Configure a URL da Evolution API em Configurações antes de conectar." };
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return { valid: false, error: "A URL da Evolution API deve iniciar com http:// ou https://" };
    }
    if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" && (trimmed.includes("localhost") || trimmed.includes("127.0.0.1"))) {
      return { valid: false, error: "URLs com 'localhost' não funcionam em produção. Configure a URL com o IP público ou domínio com HTTPS da sua VPS/servidor." };
    }
    return { valid: true };
  };

  const handleTestConnection = async () => {
    const urlCheck = validateEvolutionUrl(evolutionUrl);
    if (!urlCheck.valid) {
      toast({ title: "Configuração Inválida", description: urlCheck.error, variant: "destructive" });
      return;
    }
    if (!evolutionKey.trim()) {
      toast({ title: "Chave Ausente", description: "Configure a chave da Evolution API em Configurações antes de conectar.", variant: "destructive" });
      return;
    }

    setTestingStatus(true);
    saveEvolutionConfig({ apiUrl: evolutionUrl, apiKey: evolutionKey, instanceName: evolutionInstance || "simulaja" });
    try {
      const res = await checkEvolutionStatus();
      setEvolutionStatus(res.state);
      if (res.state === "open" || res.state === "CONNECTED") {
        setQrCodeImg(null);
        setPairingCode(null);
        toast({
          title: "Status: CONECTADO! 🟢",
          description: "Sua instância da Evolution API está conectada e operacional.",
        });
      } else {
        toast({
          title: `Status: ${res.state}`,
          description: res.reason || "Não foi possível confirmar a conexão.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setEvolutionStatus("DISCONNECTED");
      toast({
        title: "Erro no Teste de Conexão",
        description: err?.message || "Falha ao conectar com a Evolution API.",
        variant: "destructive",
      });
    } finally {
      setTestingStatus(false);
    }
  };

  const handleCreateWhatsApp = async () => {
    const urlCheck = validateEvolutionUrl(evolutionUrl);
    if (!urlCheck.valid) {
      toast({ title: "Configuração Inválida", description: urlCheck.error, variant: "destructive" });
      return;
    }
    if (!evolutionKey.trim()) {
      toast({ title: "Chave Ausente", description: "Configure a chave da Evolution API em Configurações antes de conectar.", variant: "destructive" });
      return;
    }

    setCreatingInstance(true);
    setQrCodeImg(null);
    setPairingCode(null);
    saveEvolutionConfig({ apiUrl: evolutionUrl, apiKey: evolutionKey, instanceName: evolutionInstance || "simulaja" });
    try {
      const qrRes = await fetchEvolutionQrCode(evolutionInstance || "simulaja");
      if (qrRes.success && qrRes.connected) {
        setEvolutionStatus("CONNECTED");
        toast({
          title: "WhatsApp Conectado!",
          description: "Sua instância do WhatsApp já está ativa e pronta para enviar mensagens.",
        });
        return;
      }

      if (qrRes.success && (qrRes.qrcode || qrRes.pairingCode)) {
        if (qrRes.qrcode) setQrCodeImg(qrRes.qrcode);
        if (qrRes.pairingCode) setPairingCode(qrRes.pairingCode);
        setEvolutionStatus("connecting");
        toast({
          title: "QR Code Gerado com Sucesso!",
          description: "Escaneie o QR Code exibido na tela no seu WhatsApp > Aparelhos Conectados.",
        });
        return;
      }

      if (profile?.organizacao_id) {
        const instanceName = evolutionInstance || `simulaja_org_${profile.organizacao_id.substring(0, 8)}`;
        const createRes: any = await createWhatsAppInstance(profile.organizacao_id, instanceName);
        if (createRes?.qrcode || createRes?.pairingCode) {
          if (createRes.qrcode) setQrCodeImg(createRes.qrcode);
          if (createRes.pairingCode) setPairingCode(createRes.pairingCode);
          setEvolutionStatus("connecting");
          toast({
            title: "QR Code Gerado!",
            description: "Escaneie o QR Code exibido na tela com seu celular.",
          });
          return;
        }
      }

      setEvolutionStatus("DISCONNECTED");
      toast({
        title: "Servidor Evolution API Indisponível",
        description: qrRes.error || "Servidor offline ou inalcançável. Altere para o Modo WhatsApp Web (Direto) se não possuir servidor próprio rodando.",
        variant: "destructive",
      });
    } catch (err: any) {
      setEvolutionStatus("DISCONNECTED");
      toast({
        title: "Erro de Conexão",
        description: err?.message || "Certifique-se de que a Evolution API está rodando na URL informada.",
        variant: "destructive",
      });
    } finally {
      setCreatingInstance(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <RefreshCw className="animate-spin h-8 w-8 text-primary" />
      </div>
    );

  return (
    <div className="flex-1 overflow-y-auto max-w-5xl w-full mx-auto space-y-6 px-4 pb-10 custom-scrollbar">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Configurações</h1>
          <p className="text-slate-500 font-medium text-sm">{org?.nome || "Minha Empresa"}</p>
        </div>
      </div>

      {/* Seção Meu Perfil - Standardized Slim Style */}
      <AdminHeroCard 
        title="Operação & Perfil" 
        subtitle="Configurações e Acesso do Colaborador"
        icon={SettingsIcon} 
        bgIcon={SettingsIcon}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="relative group/avatar">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-white/10 overflow-hidden bg-slate-800 flex items-center justify-center text-xl font-black shrink-0 transition-transform group-hover/avatar:scale-105">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.nome_completo || ""} className="h-full w-full object-cover" />
              ) : (
                (profile?.nome_completo || "?").charAt(0).toUpperCase()
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className="absolute -bottom-1 -right-1 p-1.5 bg-primary rounded-full cursor-pointer shadow-lg hover:bg-primary/80 transition-colors border-2 border-slate-900"
            >
              <Upload className="h-3 w-3 text-white" />
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast({ title: "Arquivo muito grande", description: "O limite é de 2MB.", variant: "destructive" });
                    return;
                  }
                  setLoading(true);
                  try {
                    const fileExt = file.name.split('.').pop();
                    const filePath = `${profile?.id}/avatar.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from("profiles")
                      .upload(filePath, file, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                      .from("profiles")
                      .getPublicUrl(filePath);

                    const { error: updateError } = await (supabase.from("perfis" as any) as any)
                      .update({ avatar_url: publicUrl })
                      .eq("id", profile?.id);

                    if (updateError) throw updateError;

                    toast({ title: "Foto atualizada!", description: "Sua nova foto já está visível." });
                    window.location.reload(); 
                  } catch (err: any) {
                    toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </label>
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{profile?.nome_completo}</h2>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{profile?.email}</p>
            <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${ROLE_COLORS[profile?.tipo_acesso || "vendedor"]}`}>
                {profile?.tipo_acesso}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-100 bg-slate-50 text-slate-400">
                ID: #{profile?.id?.substring(0, 8)}
              </span>
            </div>
            
            <div className="pt-3">
              <Button 
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.auth.linkIdentity({
                      provider: 'google',
                      options: {
                        redirectTo: `${window.location.origin}/admin/configuracoes`,
                        scopes: "https://www.googleapis.com/auth/calendar.events",
                      }
                    });
                    if (error) throw error;
                  } catch (err: any) {
                    toast({ title: "Erro na conexão", description: err.message, variant: "destructive" });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-white text-slate-900 hover:bg-slate-100 font-black text-[10px] tracking-tight rounded-lg h-8"
                size="sm"
              >
                <CalendarDays className="h-3 w-3 mr-2 text-blue-600" />
                CONECTAR CALENDAR
              </Button>
            </div>
          </div>
        </div>
      </AdminHeroCard>

      <Tabs defaultValue="equipe" className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-slate-100/50 rounded-xl mb-6 overflow-x-auto flex-nowrap hide-scrollbar">
          <TabsTrigger value="equipe" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold py-2 px-4 gap-2 text-xs">
            <Users className="h-4 w-4" />
            Minha Equipe
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold py-2 px-4 gap-2 text-xs">
            <Link2 className="h-4 w-4" />
            Integrações & Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipe" className="mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Painel de convite */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-xl"><UserPlus className="h-5 w-5 text-primary" /></div>
                    <div>
                      <CardTitle className="text-base font-bold">Novo Convite</CardTitle>
                      <CardDescription className="text-slate-400 text-xs">Adicione membros ao time</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-convite" className="font-bold text-slate-700">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email-convite"
                        type="email"
                        placeholder="vendedor@empresa.com"
                        className="pl-9 h-11 rounded-xl text-sm"
                        value={emailToInvite}
                        onChange={(e) => setEmailToInvite(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Cargo</Label>
                    <Select value={roleToInvite} onValueChange={setRoleToInvite}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                        {isAdmin && <SelectItem value="admin">Administrador</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full h-11 rounded-xl font-bold"
                    onClick={handleInvite}
                    disabled={inviting || !emailToInvite}
                  >
                    {inviting ? <RefreshCw className="animate-spin h-4 w-4" /> : "Gerar Link de Acesso"}
                  </Button>
                </CardContent>
              </Card>

              {invitations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Convites Pendentes</p>
                  {invitations.map((inv) => (
                    <div key={inv.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-2 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-700 truncate">{inv.email}</p>
                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[inv.tipo_acesso || 'vendedor']}`}>
                          {inv.tipo_acesso || 'vendedor'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/5" onClick={() => copyInviteLink(inv.token)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50" onClick={() => deleteInvite(inv.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Membros */}
            <div className="lg:col-span-8">
              <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="p-5 sm:p-6 border-b border-slate-50">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-xl"><Users className="h-5 w-5 text-blue-500" /></div>
                      <div>
                        <CardTitle className="text-base font-bold">Membros Ativos</CardTitle>
                        <CardDescription className="text-xs">Pessoas com acesso ao CRM</CardDescription>
                      </div>
                    </div>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                      {users.length} {users.length === 1 ? "membro" : "membros"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-50">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-500 text-sm shrink-0">
                            {(u.nome_completo || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{u.nome_completo || "Sem nome"}</p>
                            <p className="text-xs text-slate-400">{u.id === profile?.id ? "Você" : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isAdmin && u.id !== profile?.id ? (
                            <>
                              <div className="flex items-center gap-2">
                                {changingRole === u.id ? (
                                  <RefreshCw className="animate-spin h-4 w-4 text-slate-400" />
                                ) : (
                                  <Select value={u.tipo_acesso || "vendedor"} onValueChange={(val) => changeRole(u.id, val)}>
                                    <SelectTrigger className={`h-8 text-[11px] font-black uppercase rounded-full border px-3 ${ROLE_COLORS[u.tipo_acesso || "vendedor"]}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="manager">Manager</SelectItem>
                                      <SelectItem value="vendedor">Vendedor</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                onClick={() => deleteMember(u.id)}
                                title="Excluir Vendedor"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${ROLE_COLORS[u.tipo_acesso || "vendedor"]}`}>
                              {u.tipo_acesso === "admin" ? "Admin" : u.tipo_acesso === "manager" ? "Manager" : "Vendedor"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integracoes" className="mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Integrações (WhatsApp) */}
            {isAdmin && (
              <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-6">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-xl"><MessageSquare className="h-5 w-5 text-green-400" /></div>
                      <div>
                        <CardTitle className="text-base font-bold">Conexão WhatsApp &amp; Mensageria</CardTitle>
                        <CardDescription className="text-slate-400 text-xs">
                          {waMode === "waha" ? "WAHA (Envio Direto pelo CRM sem abrir abas)" : waMode === "web" ? "Modo Direto (wa.me / WhatsApp Web)" : "Evolution API (Servidor Legado)"}
                        </CardDescription>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${waMode === "waha" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : waMode === "web" ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" : "bg-purple-500/20 text-purple-300 border border-purple-500/40"}`}>
                      {waMode === "waha" ? "🚀 WAHA (Envio Direto)" : waMode === "web" ? "🟢 Whats Direto (wa.me)" : "⚡ Evolution API"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {/* Seleção de Modo */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Selecione o Modo de Envio:</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => handleModeChange("waha")}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${waMode === "waha" ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            🚀 WAHA (Recomendado)
                          </span>
                          {waMode === "waha" && <span className="h-2 w-2 rounded-full bg-emerald-500"></span>}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Envio direto pelo CRM sem abrir abas! Container ultraleve (~120 MB RAM) e alta estabilidade.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleModeChange("web")}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${waMode === "web" ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            📱 Whats Direto (wa.me)
                          </span>
                          {waMode === "web" && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Abre as conversas direto no seu WhatsApp Web/App com mensagens pré-preenchidas. Sem servidor!
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleModeChange("evolution")}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${waMode === "evolution" ? "border-purple-500 bg-purple-50/60 ring-2 ring-purple-500/20" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            ⚡ Evolution API
                          </span>
                          {waMode === "evolution" && <span className="h-2 w-2 rounded-full bg-purple-500"></span>}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Conexão com servidor Evolution API legado em Docker/VPS.
                        </p>
                      </button>
                    </div>
                  </div>

                  {waMode === "web" ? (
                    <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <p className="font-bold flex items-center gap-1.5 text-blue-900">
                          🟢 Modo WhatsApp Direto (wa.me) Ativo
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open("https://web.whatsapp.com", "_blank")}
                          className="h-7 text-[11px] font-bold text-blue-800 border-blue-300 bg-white hover:bg-blue-100/60 gap-1 rounded-lg shrink-0 shadow-sm"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-blue-700" />
                          Abrir WhatsApp Web
                        </Button>
                      </div>
                      <p className="text-[11.5px] text-blue-800 leading-relaxed">
                        Nenhuma configuração ou servidor de QR Code é necessário neste modo! Ao conversar com leads no CRM:
                      </p>
                      <ul className="list-disc pl-4 text-[11px] text-blue-800 space-y-1">
                        <li>O sistema abre diretamente o link universal <code>wa.me</code> com o telefone do cliente e o texto já preenchido.</li>
                        <li>Todas as mensagens continuam sendo registradas normalmente no histórico do CRM.</li>
                        <li>Se quiser disparar <strong>100% direto sem abrir novas abas</strong>, altere acima para o <strong>Modo WAHA (Recomendado)</strong>.</li>
                      </ul>
                    </div>
                  ) : waMode === "waha" ? (
                    <>
                      {/* PAINEL DE CONFIGURAÇÃO WAHA */}
                      <div className="space-y-3 pt-1 border-t border-slate-100">
                        <div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-700">Server URL (WAHA API)</Label>
                            <span className="text-[10px] text-slate-400 font-mono">Padrão local: http://localhost:3000</span>
                          </div>
                          <Input
                            placeholder="http://localhost:3000 ou https://waha.seudominio.com"
                            value={wahaUrl}
                            onChange={(e) => setWahaUrl(e.target.value)}
                            className="h-10 text-xs font-mono mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-bold text-slate-700">API Key (X-Api-Key)</Label>
                            <Input
                              type="password"
                              placeholder="Opcional se configurado WAHA_API_KEY"
                              value={wahaKey}
                              onChange={(e) => setWahaKey(e.target.value)}
                              className="h-10 text-xs font-mono mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-slate-700">Nome da Sessão</Label>
                            <Input
                              placeholder="default"
                              value={wahaSession}
                              onChange={(e) => setWahaSession(e.target.value)}
                              className="h-10 text-xs font-mono mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 flex-wrap">
                        <div className="text-xs font-bold">
                          Status WAHA:{" "}
                          <span className={wahaStatus === "WORKING" ? "text-emerald-600 font-black" : wahaStatus === "SCAN_QR_CODE" ? "text-amber-600 font-black" : "text-slate-600 font-black"}>
                            {wahaStatus === "WORKING" ? "🟢 CONECTADO" : wahaStatus === "SCAN_QR_CODE" ? "🟡 AGUARDANDO QR CODE" : wahaStatus === "UNKNOWN" ? "⚪ NÃO TESTADO" : `🔴 ${wahaStatus}`}
                          </span>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleTestWaha}
                            disabled={wahaTesting}
                            className="font-bold text-xs h-9"
                          >
                            {wahaTesting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                            Testar Conexão
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRestartWaha}
                            disabled={wahaCreating}
                            className="font-bold text-xs h-9 border-amber-300 hover:border-amber-400 hover:bg-amber-50 text-amber-800"
                            title="Limpar arquivos residuais e reiniciar sessão do zero"
                          >
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                            Limpar &amp; Reiniciar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleCreateWahaQr}
                            disabled={wahaCreating}
                            className="font-bold text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {wahaCreating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                            <QrCode className="mr-1.5 h-3.5 w-3.5" />
                            Gerar QR Code
                          </Button>
                        </div>
                      </div>

                      {/* OPÇÃO DE PAREAMENTO POR NÚMERO (SEM CÂMERA) */}
                      <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs space-y-2">
                        <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          📱 Conectar com Código de 8 dígitos (sem escanear QR Code)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Seu celular com DDD (ex: 11999999999)"
                            value={wahaPairingPhone}
                            onChange={(e) => setWahaPairingPhone(e.target.value)}
                            className="h-9 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleRequestWahaPairing}
                            disabled={wahaCreating || !wahaPairingPhone.trim()}
                            className="h-9 text-xs font-bold shrink-0"
                          >
                            Gerar Código
                          </Button>
                        </div>
                      </div>

                      {/* GUIA DE INICIALIZAÇÃO LOCAL DO SERVIDOR */}
                      <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-2.5 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            ⚡ Iniciar Servidor Local (Sem Docker)
                          </span>
                          <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">~40 MB RAM</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Execute no terminal do seu computador (PowerShell) na pasta do projeto:
                        </p>
                        <div className="p-2 bg-black/60 rounded-lg font-mono text-[11px] text-emerald-300 flex items-center justify-between select-all">
                          <code>npm run whatsapp</code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("npm run whatsapp");
                              toast({ title: "Comando Copiado!" });
                            }}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded ml-2 font-bold"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>

                      {/* EXIBIÇÃO DE QR CODE OU CÓDIGO DE PAREAMENTO DO WAHA */}
                      {(wahaQrCodeImg || wahaPairingCode) && (
                        <div className="mt-4 p-5 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 border border-emerald-500/40 shadow-xl animate-in fade-in zoom-in-95">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            Aguardando Leitura no Celular...
                          </div>

                          {wahaQrCodeImg && (
                            <div className="p-3 bg-white rounded-xl shadow-2xl border border-slate-200">
                              <img
                                src={wahaQrCodeImg}
                                alt="QR Code WhatsApp WAHA"
                                className="w-56 h-56 object-contain"
                              />
                            </div>
                          )}

                          {wahaPairingCode && (
                            <div className="p-4 bg-slate-800/95 rounded-2xl border border-emerald-500/40 text-center w-full max-w-sm space-y-2 shadow-lg">
                              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                                Código de Pareamento por Telefone:
                              </p>
                              <div className="flex items-center justify-center gap-2">
                                <p className="text-2xl font-mono font-black text-white tracking-widest bg-black/40 px-3 py-1.5 rounded-xl border border-slate-700 select-all">
                                  {wahaPairingCode}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(wahaPairingCode);
                                    toast({ title: "Código copiado!", description: wahaPairingCode });
                                  }}
                                  className="h-10 text-xs font-bold border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                                >
                                  Copiar
                                </Button>
                              </div>
                              <p className="text-[10.5px] text-slate-300">
                                💡 No WhatsApp: <strong>Aparelhos conectados</strong> &gt; <strong>Conectar com número de telefone</strong> &gt; Digite o código acima.
                              </p>
                            </div>
                          )}

                          <div className="text-[11px] text-slate-300 space-y-1 max-w-xs leading-snug">
                            <p className="font-bold text-white">No seu Celular:</p>
                            <p>Abra o WhatsApp &gt; <strong>Aparelhos Conectados</strong> &gt; <strong>Conectar um Aparelho</strong></p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="space-y-3 pt-1 border-t border-slate-100">
                        <div>
                          <Label className="text-xs font-bold text-slate-700">Server URL (Evolution API)</Label>
                          <Input
                            placeholder="https://sua-api-evolution.com"
                            value={evolutionUrl}
                            onChange={(e) => setEvolutionUrl(e.target.value)}
                            className="h-10 text-xs font-mono mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-slate-700">Global API Key</Label>
                          <Input
                            type="password"
                            placeholder="Chave de API do servidor"
                            value={evolutionKey}
                            onChange={(e) => setEvolutionKey(e.target.value)}
                            className="h-10 text-xs font-mono mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-slate-700">Nome da Instância</Label>
                          <Input
                            placeholder="simulaja"
                            value={evolutionInstance}
                            onChange={(e) => setEvolutionInstance(e.target.value)}
                            className="h-10 text-xs font-mono mt-1"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                        <div className="text-xs font-bold">
                          Status:{" "}
                          <span className={evolutionStatus === "open" || evolutionStatus === "CONNECTED" ? "text-emerald-600 font-black" : "text-amber-600 font-black"}>
                            {evolutionStatus === "open" || evolutionStatus === "CONNECTED" ? "🟢 CONECTADO" : evolutionStatus === "UNKNOWN" ? "⚪ NÃO TESTADO" : `🔴 ${evolutionStatus}`}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testingStatus}
                            className="font-bold text-xs h-9"
                          >
                            {testingStatus ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                            Salvar &amp; Testar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleCreateWhatsApp}
                            disabled={creatingInstance}
                            className="font-bold text-xs h-9"
                          >
                            {creatingInstance && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                            Provisionar / QR Code
                          </Button>
                        </div>
                      </div>

                      {evolutionStatus !== "open" && evolutionStatus !== "CONNECTED" && !qrCodeImg && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-2">
                          <p className="font-bold flex items-center gap-1">
                            💡 Não tem um servidor Evolution API rodando?
                          </p>
                          <p className="text-[11px] text-amber-800">
                            Se o servidor em <code className="bg-amber-100 px-1 rounded font-mono font-bold">{evolutionUrl || "http://localhost:8080"}</code> não estiver ativo, mude para o modo WhatsApp Web Direto.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModeChange("web")}
                            className="w-full bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold text-xs h-8"
                          >
                            📱 Usar WhatsApp Web (Direto)
                          </Button>
                        </div>
                      )}

                      {(qrCodeImg || pairingCode) && (
                        <div className="mt-4 p-5 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 border border-emerald-500/40 shadow-xl animate-in fade-in zoom-in-95">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            Aguardando Pareamento com o Celular...
                          </div>

                          {qrCodeImg && (
                            <div className="p-3 bg-white rounded-xl shadow-2xl border border-slate-200">
                              <img
                                src={qrCodeImg.startsWith("data:") ? qrCodeImg : `data:image/png;base64,${qrCodeImg}`}
                                alt="QR Code WhatsApp Baileys"
                                className="w-52 h-52 object-contain"
                              />
                            </div>
                          )}

                          {pairingCode && (
                            <div className="p-3 bg-slate-800/90 rounded-xl border border-emerald-500/30 text-center w-full max-w-xs space-y-1">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                Código de Pareamento de 8 dígitos:
                              </p>
                              <p className="text-xl font-mono font-black text-emerald-400 tracking-widest">
                                {pairingCode}
                              </p>
                            </div>
                          )}

                          <div className="text-[11px] text-slate-300 space-y-1 max-w-xs leading-snug">
                            <p className="font-bold text-white">No seu Celular:</p>
                            <p>Abra o WhatsApp &gt; <strong>Aparelhos Conectados</strong> &gt; <strong>Conectar um Aparelho</strong></p>
                            {pairingCode && (
                              <p className="text-emerald-300 font-bold">
                                Ou toque na opção &quot;Conectar com número de telefone&quot; no rodapé da tela do WhatsApp e digite o código acima!
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Links de Operação CRM */}
            <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-slate-900 text-white">
              <CardHeader className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-xl">
                    <Link2 className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      Operações de Captura & Links do CRM 🚀
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Links personalizados da sua organização para captação de leads direta no CRM.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Operação 1: Jarvis SRV */}
                <div className="space-y-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      🤖 Operação Jarvis SRV (Landing Page + IA)
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-black">
                      AUTO OPEN IA
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Abre a landing page com a consultoria inteligente Jarvis ativada. Leads capturados são gravados como <code className="text-cyan-300">Operação Jarvis SRV</code> no seu CRM.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Input 
                      readOnly 
                      value={`${window.location.origin}/?org=${profile?.organizacao_id}&srv=true`}
                      className="font-mono text-xs bg-slate-900 border-slate-800 text-slate-200"
                    />
                    <Button
                      variant="outline"
                      className="border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900 text-cyan-300 shrink-0"
                      onClick={() => {
                        const link = `${window.location.origin}/?org=${profile?.organizacao_id}&srv=true`;
                        navigator.clipboard.writeText(link);
                        toast({ title: "Link Copiado! 🚀", description: "Link da Operação Jarvis SRV copiado para a área de transferência." });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Operação: Pré-Cadastro para Contrato */}
                <div className="space-y-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      📋 Formulário de Pré-Cadastro (Geração de Contrato)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-black">
                      LEAD EXCLUSIVO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Formulário de preenchimento de dados pessoais, endereço, renda e dados bancários do cliente para geração do contrato. Integrado diretamente com o registro do lead no CRM.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Input 
                      readOnly 
                      value={`${window.location.origin}/pre-cadastro?org=${profile?.organizacao_id}`}
                      className="font-mono text-xs bg-slate-900 border-slate-800 text-slate-200"
                    />
                    <Button
                      variant="outline"
                      className="border-amber-500/40 bg-amber-950/50 hover:bg-amber-900 text-amber-300 shrink-0"
                      onClick={() => {
                        const link = `${window.location.origin}/pre-cadastro?org=${profile?.organizacao_id}`;
                        navigator.clipboard.writeText(link);
                        toast({ title: "Link Copiado! 📋", description: "Link do Formulário de Pré-Cadastro copiado." });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Operação 2: Portal de Indicações */}
                <div className="space-y-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                    🤝 Operação Portal de Indicações (Membros & Parceiros)
                  </span>
                  <p className="text-xs text-slate-400">
                    Link do formulário de indicação premiada para parceiros e promotores registrarem novos clientes.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Input 
                      readOnly 
                      value={`${window.location.origin}/indicacoes?org=${profile?.organizacao_id}`}
                      className="font-mono text-xs bg-slate-900 border-slate-800 text-slate-200"
                    />
                    <Button
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 shrink-0"
                      onClick={() => {
                        const link = `${window.location.origin}/indicacoes?org=${profile?.organizacao_id}`;
                        navigator.clipboard.writeText(link);
                        toast({ title: "Link Copiado! 🤝", description: "Link do Portal de Indicações copiado com sucesso." });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Webhooks de Recebimento de Leads */}
            {isAdmin && (
              <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl"><Upload className="h-5 w-5 text-blue-400" /></div>
                    <div>
                      <CardTitle className="text-base font-bold">Webhooks de Captura</CardTitle>
                      <CardDescription className="text-slate-400 text-xs">Receba leads via POST</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-slate-600">
                    Use a URL abaixo nas campanhas (Zapier, Make, FB Ads) para injetar leads no CRM.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input 
                      readOnly 
                      value={`https://[seu-projeto].supabase.co/functions/v1/webhook-leads?org=${profile?.organizacao_id}`}
                      className="font-mono text-xs bg-slate-50 border-slate-200"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://[seu-projeto].supabase.co/functions/v1/webhook-leads?org=${profile?.organizacao_id}`);
                        toast({ title: "URL Copiada", description: "Cole esta URL na sua plataforma de anúncios." });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs border border-amber-200">
                    <p className="font-bold mb-1">Campos suportados no JSON:</p>
                    <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">nome</code>, <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">telefone</code>, <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">email</code>, <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">origem</code>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
