import { DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Optimized DnD handler for Kanban-style boards.
 * Performs optimistic updates and handles persistence.
 */
export const handleKanbanDragEnd = async <T extends { id: string; status: string }>(
  result: DropResult,
  data: T[],
  setData: React.Dispatch<React.SetStateAction<T[]>>,
  tableName: string,
  successMsg?: string
) => {
  const { destination, source, draggableId } = result;

  if (!destination) return;
  if (destination.droppableId === source.droppableId && destination.index === source.index) return;

  const originalData = [...data];
  const newStatus = destination.droppableId;
  const nowIso = new Date().toISOString();

  // 1. Optimistic Update
  setData(prev => {
    const next = [...prev];
    const idx = next.findIndex(i => i.id === draggableId);
    if (idx !== -1) {
      const [moved] = next.splice(idx, 1);
      // Append to end — kanban boards filter items per column, so
      // the position within the global array is irrelevant for rendering.
      next.push({
        ...moved,
        status: newStatus,
        status_updated_at:
          newStatus !== moved.status && tableName !== "inadimplentes"
            ? nowIso
            : (moved as any).status_updated_at,
      });
      return next;
    }
    return next;
  });


  // 2. Persistence
  try {
    const updatePayload: any = { 
      status: newStatus,
      updated_at: nowIso
    };
    
    if (tableName !== "inadimplentes") {
      updatePayload.status_updated_at = nowIso;
    }
    
    const { data: updatedRows, error } = await (supabase.from(tableName as any) as any)
      .update(updatePayload)
      .eq("id", draggableId)
      .select();

    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error("Permissão negada ou lead não encontrado.");
    }

    if (successMsg && newStatus === "fechado") {
      toast.success(successMsg);
    } else if (successMsg && tableName === "inadimplentes" && newStatus === "regularizado") {
      toast.success("🎉 Cliente regularizado!");
    }
  } catch (error: any) {
    console.error(`Error updating ${tableName}:`, error);
    toast.error(`Falha: ${error?.message || "Erro ao atualizar status."} Revertendo...`);
    setData(originalData);
  }
};

