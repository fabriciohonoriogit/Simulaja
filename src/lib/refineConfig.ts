import dataProvider from "@refinedev/supabase";
import { supabase } from "@/integrations/supabase/client";

/**
 * Configuração centralizada do Refine
 * Usada em componentes CRUD e hooks de dados automáticos
 *
 * O dataProvider do @refinedev/supabase mapeia automaticamente:
 *   useList()   → supabase.from(resource).select()
 *   useCreate() → supabase.from(resource).insert()
 *   useUpdate() → supabase.from(resource).update()
 *   useDelete() → supabase.from(resource).delete()
 */
export const refineDataProvider = dataProvider(supabase);

/**
 * Recursos/tabelas gerenciadas pelo Refine.
 * As rotas são informativas — o projeto usa seu próprio React Router.
 */
export const refineResources = [
  {
    name: "carteira",
    list: "/admin/carteira",
    create: "/admin/carteira/create",
    edit: "/admin/carteira/edit/:id",
    show: "/admin/carteira/show/:id",
    meta: {
      canDelete: true,
      canEdit: true,
      canCreate: true,
    },
  },
  {
    name: "leads",
    list: "/admin/leads",
    create: "/admin/leads/create",
    edit: "/admin/leads/edit/:id",
    meta: {
      canDelete: false, // Soft delete apenas
      canEdit: true,
    },
  },
  {
    name: "comissoes",
    list: "/admin/comissoes",
    show: "/admin/comissoes/show/:id",
    meta: {
      canDelete: false,
      canEdit: false, // Apenas visualização
    },
  },
  {
    name: "inadimplentes",
    list: "/admin/inadimplentes",
    edit: "/admin/inadimplentes/edit/:id",
    meta: {
      canDelete: false,
    },
  },
  {
    name: "metas",
    list: "/admin/metas",
    show: "/admin/metas/show/:id",
    meta: {
      canDelete: false,
    },
  },
];
