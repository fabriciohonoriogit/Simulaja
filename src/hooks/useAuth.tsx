import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthError, Session, User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  nome_completo: string | null;
  tipo_acesso: string | null;
  organizacao_id: string | null;
  avatar_url?: string | null;
}

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile?: Profile | null;
  role?: string | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId: string, userEmail?: string) => {
      try {
        const { data: profileData } = await supabase
          .from("perfis")
          .select("id, nome_completo, tipo_acesso, organizacao_id, avatar_url")
          .eq("id", userId)
          .maybeSingle();

        if (mounted) {
          if (profileData) {
            setProfile(profileData as Profile);
            setRole(profileData.tipo_acesso ?? "vendedor");
          } else {
            const fallback: Profile = {
              id: userId,
              nome_completo: userEmail?.split("@")[0] || "Usuário",
              tipo_acesso: "vendedor",
              organizacao_id: null,
            };
            setProfile(fallback);
            setRole("vendedor");
          }
        }
      } catch (e) {
        console.error("Erro ao buscar perfil:", e);
        if (mounted) setRole("vendedor");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // Timeout de segurança para evitar que o mobile fique preso em loading
    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.events",
      },
    });
    return { error };
  };

  return { user, session, loading, profile, role, signIn, signInWithGoogle, signOut };
};
