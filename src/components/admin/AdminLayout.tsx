import { useState, useEffect } from "react";
import { Profile, OrganizationRow } from "@/types";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Filter, Users, LogOut, Target, Briefcase, AlertTriangle, Menu, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calculator, CalendarDays, Sparkles, Zap, Settings, MessageSquare, RefreshCw, FileText } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import TrialBanner from "@/components/admin/TrialBanner";
import TrialGate from "@/components/admin/TrialGate";
import { useSubscription } from "@/hooks/useSubscription";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MenuGroup {
    label: string;
    items: {
        icon: React.ElementType;
        label: string;
        path: string;
        color: string;
        adminOnly?: boolean;
    }[];
}

const menuGroups: MenuGroup[] = [
    {
        label: "OPERAÇÃO",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/admin", color: "text-blue-500" },
            { icon: Briefcase, label: "Funil de Vendas", path: "/admin/funil", color: "text-emerald-500" },
            { icon: Filter, label: "Leads", path: "/admin/leads", color: "text-orange-500" },
            { icon: MessageSquare, label: "Inbox WhatsApp", path: "/admin/whatsapp-inbox", color: "text-indigo-600" },
            { icon: CalendarDays, label: "Agendamentos", path: "/admin/agendamentos", color: "text-indigo-500" },
        ]
    },
    {
        label: "FERRAMENTAS DE CONVERSÃO",
        items: [
            { icon: Calculator, label: "Simulador", path: "/admin/simulador", color: "text-cyan-500" },
            { icon: FileText, label: "Análise do Crédito", path: "/admin/carta-analise", color: "text-rose-500" },
            { icon: FileText, label: "Central de Formulários", path: "/admin/formularios", color: "text-blue-600" },
        ]
    },
    {
        label: "RELACIONAMENTO",
        items: [
            { icon: Users, label: "Carteira Clientes", path: "/admin/carteira", color: "text-blue-600" },
        ]
    },
    {
        label: "RECUPERAÇÃO",
        items: [
            { icon: AlertTriangle, label: "Inadimplentes", path: "/admin/inadimplentes", color: "text-red-500", adminOnly: true },
        ]
    },
    {
        label: "GESTÃO",
        items: [
            { icon: Target, label: "Metas", path: "/admin/metas", color: "text-amber-500" }, // Todos acessam, limitaremos dentro do componente
            { icon: Calculator, label: "Comissões", path: "/admin/comissoes", color: "text-emerald-500" },
        ]
    },
    {
        label: "SISTEMA",
        items: [
            { icon: Settings, label: "Configurações", path: "/admin/configuracoes", color: "text-slate-600", adminOnly: true },
        ]
    },
    {
        label: "SUPORTE / IA",
        items: [
            { icon: Zap, label: "Jarvis OS", path: "/admin/jarvis", color: "text-cyan-400" },
        ]
    }
];

export default function AdminLayout() {
    const { signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [org, setOrg] = useState<OrganizationRow | null>(null);
    const { hasJarvis, isExpired } = useSubscription();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem("admin_sidebar_collapsed");
        return saved === "true";
    });

    const currentHour = new Date().getHours();
    const isDayTime = currentHour >= 6 && currentHour < 18;

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profileData } = await supabase.from("perfis")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileData) {
                setProfile(profileData as Profile);
                if (profileData.organizacao_id) {
                    const { data: orgData } = await supabase.from("organizacoes")
                        .select("*")
                        .eq("id", profileData.organizacao_id)
                        .single();
                    setOrg(orgData);
                }
            } else {
                // Auto-recuperação: cria o perfil do usuário e uma nova organização caso não exista
                try {
                    const nome = user.user_metadata?.nome_completo || user.email || "Usuário";
                    const orgName = `${nome} - CRM`;
                    const orgSlug = `org-${Math.random().toString(36).substring(2, 10)}`;

                    const { data: newOrg, error: orgError } = await supabase.from("organizacoes").insert({
                        nome: orgName,
                        slug: orgSlug
                    }).select().single();

                    if (orgError) throw orgError;

                    const { data: newProfile, error: insertError } = await supabase.from("perfis").insert({
                        id: user.id,
                        nome_completo: nome,
                        organizacao_id: newOrg.id,
                        tipo_acesso: "admin"
                    }).select("*").single();

                    if (!insertError && newProfile) {
                        setProfile(newProfile as Profile);
                        setOrg(newOrg);
                    }
                } catch (err) {
                    console.error("Erro na auto-recuperação de layout:", err);
                }
            }
        } catch (e) {
            console.error("Layout fetch error:", e);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (!isExpired && org && !(org as any).onboarding_completed && location.pathname !== "/admin/onboarding") {
            navigate("/admin/onboarding", { replace: true });
        }
    }, [org, location.pathname, navigate, isExpired]);

    useEffect(() => {
        localStorage.setItem("admin_sidebar_collapsed", String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    const forceUpdate = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                }
            });
        }
        if ('caches' in window) {
            caches.keys().then((keyList) => {
                return Promise.all(keyList.map((key) => caches.delete(key)));
            });
        }
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    const renderSidebar = (collapsed: boolean) => (
        <div className={`flex flex-col h-full transition-all duration-300 border-r ${
            isDayTime 
                ? 'bg-white text-slate-900 border-slate-100 shadow-xl' 
                : 'bg-[#001E3C] text-slate-100 border-slate-800'
            } ${collapsed ? 'w-20' : 'w-64'}`}>
            <div className={`p-4 border-b h-20 flex items-center justify-center ${
                isDayTime ? 'border-slate-50' : 'border-slate-800'
            }`}>
                {!collapsed ? (
                    <div className="flex flex-col items-center">
                        <img src="/icon-512.webp" alt="Logo" className="h-8 w-auto mb-1" />
                        <span className="text-[10px] font-black tracking-widest text-[#84CC16]">CONTEMPLAR CRM</span>
                    </div>
                ) : (
                    <img src="/icon-512.webp" alt="Logo" className="h-8 w-auto" />
                )}
            </div>

            {!collapsed && org && (
                <div className={`mx-2 mt-4 p-3 rounded-xl border transition-colors ${
                    isDayTime ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/10'
                }`}>
                    <div className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${
                        isDayTime ? 'text-slate-400' : 'text-slate-500'
                    }`}>Empresa</div>
                    <div className={`font-bold text-xs truncate ${isDayTime ? 'text-slate-900' : 'text-slate-200'}`}>{org.nome}</div>
                    <div className={`text-[10px] truncate ${isDayTime ? 'text-slate-500' : 'text-slate-400'}`}>{profile?.nome_completo}</div>
                </div>
            )}

            <nav className="flex-1 p-2 space-y-1 overflow-y-auto mt-4">
                {menuGroups.map((group) => {
                    const groupItems = group.items.filter(item => {
                        if (item.path === "/admin/jarvis" && !hasJarvis) return false;
                        return !item.adminOnly || profile?.tipo_acesso === 'admin';
                    });
                    if (groupItems.length === 0) return null;

                    return (
                        <div key={group.label} className="pt-2">
                            {!collapsed && (
                                <div className={`text-[9px] font-bold uppercase tracking-widest px-4 mb-1 ${
                                    isDayTime ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                    {group.label}
                                </div>
                            )}
                            {groupItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === "/admin"}
                                    onClick={() => setOpen(false)}
                                    className={({ isActive }) => {
                                        let activeClass = "";
                                        if (isActive) {
                                            activeClass = isDayTime 
                                                ? "bg-blue-50 text-blue-700 shadow-sm font-black border border-blue-100" 
                                                : "bg-blue-600 text-white font-black shadow-lg shadow-blue-900/40";
                                        } else {
                                            activeClass = isDayTime
                                                ? "text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-bold"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white font-bold";
                                        }
                                        return `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeClass} ${collapsed ? 'justify-center px-0' : ''}`;
                                    }}
                                >
                                    <item.icon className={`h-4 w-4 shrink-0 transition-colors ${item.color} ${collapsed ? 'mx-auto' : ''}`} />
                                    {!collapsed && <span className="text-xs font-bold">{item.label}</span>}
                                </NavLink>
                            ))}
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <Button
                    variant="ghost"
                    onClick={() => signOut()}
                    className={`w-full justify-start gap-3 transition-colors ${
                        isDayTime 
                            ? "text-red-500 hover:text-red-600 hover:bg-red-50" 
                            : "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    }`}
                >
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span className="text-xs font-bold">Sair</span>}
                </Button>
                
                <Button
                    variant="ghost"
                    onClick={forceUpdate}
                    className={`w-full justify-start gap-3 transition-colors mt-2 ${
                        isDayTime 
                            ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100" 
                            : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                >
                    <RefreshCw className="h-4 w-4" />
                    {!collapsed && <span className="text-[10px] font-bold">Forçar Atualização</span>}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-slate-50/50 [overscroll-behavior:none]">
            <aside className="hidden lg:block h-full w-auto shrink-0 z-40">
                {renderSidebar(sidebarCollapsed)}
            </aside>

            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                <header className={`lg:hidden flex items-center justify-between px-4 h-16 shadow-sm z-30 transition-colors ${
                    isDayTime ? 'bg-white text-slate-900 border-b border-slate-100' : 'bg-[#001E3C] text-white border-b border-white/5'
                }`}>
                    <img src="/icon-512.webp" alt="Logo" className="h-8 w-auto" />
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className={isDayTime ? "text-slate-900" : "text-white"}>
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-none w-64">
                            {renderSidebar(false)}
                        </SheetContent>
                    </Sheet>
                </header>

                <main className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-y-auto">
                    <TrialBanner />
                    <div className="flex-1 flex flex-col min-h-0 w-full p-3 sm:p-4 md:p-6 pb-12">
                        <ErrorBoundary>
                            <Suspense fallback={
                                <div className="flex h-full w-full items-center justify-center py-20">
                                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            }>
                                <TrialGate>
                                    <Outlet />
                                </TrialGate>
                            </Suspense>
                        </ErrorBoundary>
                    </div>
                </main>
            </div>
            <PwaInstallPrompt />
        </div>
    );
}
