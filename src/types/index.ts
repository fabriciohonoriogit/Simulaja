import { Database } from '@/integrations/supabase/types';

export type LeadRow = Database['public']['Tables']['leads']['Row'];
export type ProfileRow = Database['public']['Tables']['perfis']['Row'];
export type OrganizationRow = Database['public']['Tables']['organizacoes']['Row'] & {
  evolution_instance_name?: string | null;
};
export type ComissaoRow = Database['public']['Tables']['comissoes']['Row'];
export type HistoricoContatoRow = Database['public']['Tables']['historico_contatos']['Row'];
export type CarteiraRow = Database['public']['Tables']['carteira']['Row'];
export type InadimplenteRow = Database['public']['Tables']['inadimplentes']['Row'];
export type AgendamentoRow = Database['public']['Tables']['agendamentos']['Row'];
export type MetaRow = Database['public']['Tables']['meta']['Row'];
export type ConviteRow = Database['public']['Tables']['convites']['Row'];

// Extended / specific types for application usage
export type TipoAcesso = "admin" | "manager" | "vendedor";

export interface Profile {
  id: string;
  tipo_acesso?: TipoAcesso | string | null;
  organizacao_id?: string | null;
  nome_completo?: string | null;
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  avatar_url?: string | null;
  cargo?: string | null;
  ativo?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

// Permissive Lead — all DB fields optional + arbitrary extensions
export interface Lead {
  id: string;
  nome: string;
  responsavel_id?: string | null;
  dados_cadastro?: any;
  atendimento_ia?: boolean;
  score_final?: string | null;
  origem?: string | null;
  gcal_event_id?: string | null;
  [key: string]: any;
}
