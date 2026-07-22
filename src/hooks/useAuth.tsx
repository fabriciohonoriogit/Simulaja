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
    const fetchProfile = async (userId: string) => {
      try {
        const { data: profileData } = await supabase
          .from("perfis")
          .select("id, nome_completo, tipo_acesso, organizacao_id, avatar_url")
          .eq("id", userId)
          .single();
        setProfile(profileData as Profile | null);
        setRole(profileData?.tipo_acesso ?? null);
      } catch (e) {
        console.error("Erro ao buscar perfil:", e);
        setProfile(null);
        setRole(null);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
