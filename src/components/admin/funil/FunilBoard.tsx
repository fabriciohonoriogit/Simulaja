import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { COLUMNS, COLUMN_COLORS, COLUMN_DOT_COLORS } from "./constants";
import { LeadCard } from "./LeadCard";
import { supabase } from "@/integrations/supabase/client";
import { parseISO } from "date-fns";
import { Lead } from "@/types/funil";

export function FunilBoard({ state, searchTerm = "", quickFilter = "todos" }: { state: any; searchTerm?: string; quickFilter?: string }) {
  const {
    leads,
    setLeads,
    isMobile,
    mobileColIdx,
    setMobileColIdx,
    getColumnLeads,
    onDragEnd,
    isDraggingCardRef,
    kanbanRef,
    isWideView,
    columnWidths,
    startResizing,
    handleDeleteLead,
    setVencimentoLead,
    setSelectedDate,
    setHistoricoLead,
    membros,
    isManager,
    ultimasTratativas,
    handleUpdateLeadField,
    handleToggleAI,
  } = state;

  const currentCol = COLUMNS[mobileColIdx];
  const columnRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  const applyFilters = (leads: Lead[]) => {
    return leads.filter((l: Lead) => {
      const matchSearch = !searchTerm || (l.nome || "").toLowerCase().includes(searchTerm.toLowerCase());
      const today = new Date(); today.setHours(0,0,0,0);
      const dias = l.created_at ? Math.max(0, Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000)) : 0;
      const matchQuick =
        quickFilter === 'todos' ? true :
        quickFilter === 'atrasados' ? dias > 14 :
        quickFilter === 'sem_tratativa' ? !ultimasTratativas[l.id] :
        quickFilter === 'hoje' ? (l.data_vencimento ? new Date(l.data_vencimento).toDateString() === today.toDateString() : false) :
        true;
      return matchSearch && matchQuick;
    });
  };

  const currentColLeads = applyFilters(getColumnLeads(currentCol.id));
  const currentColTotal = currentColLeads
    .filter(l => l.dados_cadastro?.is_retroativo !== true)
    .reduce((s: number, l: Lead) => s + Number(l.valor_credito), 0);

  const renderLeadCard = (lead: Lead, idx: number) => (
    <Draggable draggableId={lead.id} index={idx} key={lead.id}>
      {(provided, snapshot) => {
        const style = {
          ...provided.draggableProps.style,
          zIndex: snapshot.isDragging ? 9999 : "auto",
        };

        const assignLead = async (leadId: string, responsavelId: string) => {
          const val = responsavelId === "none" ? null : responsavelId;
          await supabase.from("leads").update({ responsavel_id: val } as any).eq("id", leadId);
          setLeads((prev: Lead[]) => prev.map((l) => l.id === leadId ? { ...l, responsavel_id: val } : l));
        };

        const moveStage = async (leadId: string, newStatus: string) => {
          const updateData = {
            status: newStatus,
            status_updated_at: new Date().toISOString()
          };
          await supabase.from("leads").update(updateData as any).eq("id", leadId);
          setLeads((prev: Lead[]) => prev.map((l) => l.id === leadId ? { ...l, ...updateData } : l));
        };

        const cardElement = (
          <LeadCard
            lead={lead}
            snapshot={snapshot}
            provided={provided}
            onDelete={handleDeleteLead}
            onSetVencimento={(l) => {
              setVencimentoLead(l);
              setSelectedDate(l.data_vencimento ? parseISO(l.data_vencimento) : undefined);
            }}
            onOpenHistorico={setHistoricoLead}
            onAssignLead={assignLead}
            membros={membros}
            isManager={isManager}
            ultimaTratativa={ultimasTratativas[lead.id] ?? null}
            compact={isWideView}
            onUpdateField={handleUpdateLeadField}
            onEdit={state.setEditingLead}
            onViewFicha={state.setViewingFichaLead}
            onToggleAI={handleToggleAI}
            onMoveStage={moveStage}
          />
        );

        if (snapshot.isDragging) {
          return createPortal(cardElement, document.body);
        }

        return cardElement;
      }}
    </Draggable>
  );



  return (
    <DragDropContext
      onDragEnd={onDragEnd}
      onDragStart={() => { isDraggingCardRef.current = true; }}
    >
      <div className={`relative group w-full flex-1 flex flex-col ${isMobile ? 'h-auto' : 'min-h-0'}`}>
        <button
          onClick={() => kanbanRef.current && (kanbanRef.current.scrollLeft -= 500)}
          className="hidden lg:block absolute left-2 top-1/2 -translate-y-1/2 z-50 bg-primary/20 backdrop-blur-xl text-primary shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-full p-2 hover:scale-110 active:scale-95 transition-all border border-primary/20 opacity-0 group-hover:opacity-70"
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={() => kanbanRef.current && (kanbanRef.current.scrollLeft += 500)}
          className="hidden lg:block absolute right-2 top-1/2 -translate-y-1/2 z-50 bg-primary/20 backdrop-blur-xl text-primary shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-full p-2 hover:scale-110 active:scale-95 transition-all border border-primary/20 opacity-0 group-hover:opacity-70"
          aria-label="Rolar para direita"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {isMobile && (
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-md border border-slate-200 p-1.5 mb-2 rounded-lg sticky top-0 z-20 mx-2 mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => setMobileColIdx(Math.max(0, mobileColIdx - 1))}
              disabled={mobileColIdx === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <span className={`text-[11px] font-black uppercase truncate tracking-tight ${COLUMN_COLORS[currentCol.id]?.replace('border-t-', 'text-') || 'text-slate-700'}`}>
                {currentCol.label}
              </span>
              <span className="text-[9px] text-slate-500 font-bold">{currentColLeads.length} leads</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => setMobileColIdx(Math.min(COLUMNS.length - 1, mobileColIdx + 1))}
              disabled={mobileColIdx === COLUMNS.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        <div
          ref={kanbanRef}
          className={`flex-1 flex ${isMobile ? 'flex-col h-auto' : 'min-h-0 overflow-x-auto pb-4 custom-scrollbar'} ${isWideView ? '' : 'justify-start'}`}
        >
          {(isMobile ? [currentCol] : COLUMNS).map((col, index) => {
            const colLeads = applyFilters(getColumnLeads(col.id));
            const totalValor = colLeads
              .filter(l => l.dados_cadastro?.is_retroativo !== true)
              .reduce((s: number, l: Lead) => s + Number(l.valor_credito), 0);

            return (
              <div
                key={col.id}
                className={`shrink-0 rounded-lg border-t-4 ${COLUMN_COLORS[col.id] || "border-t-border bg-card/50"} bg-card/80 p-1.5 flex flex-col relative group/col ${isMobile ? 'mx-2 mb-2 h-auto' : 'h-full mr-2 first:ml-2'}`}
                style={isMobile ? { width: 'auto' } : { width: columnWidths[col.id] || (isWideView ? 180 : 240), minWidth: isWideView ? 140 : 230 }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-black text-[11px] truncate uppercase tracking-tighter ${isWideView ? "text-[10px]" : ""}`}>{col.label}</h3>
                    <p className="text-[9px] text-muted-foreground -mt-0.5">
                      {colLeads.length} leads · {formatCurrency(totalValor)}
                    </p>
                  </div>
                </div>

                <div
                  onMouseDown={(e: any) => startResizing(col.id, e)}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary transition-colors z-10"
                />

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => {
                    const scrollColumn = (direction: 'up' | 'down') => {
                      const el = columnRefs.current[col.id];
                      if (el) {
                        el.scrollBy({
                          top: direction === 'up' ? -300 : 300,
                          behavior: 'smooth'
                        });
                      }
                    };

                    return (
                      <div className="relative flex-1 flex flex-col group/colcontent">
                        <div
                          ref={(el) => {
                            provided.innerRef(el);
                            columnRefs.current[col.id] = el;
                          }}
                          {...provided.droppableProps}
                          className={`space-y-1.5 flex-1 ${isMobile ? '' : 'overflow-y-auto min-h-[100px]'} pr-1 custom-scrollbar ${snapshot.isDraggingOver ? "ring-2 ring-primary/30 rounded" : ""}`}
                        >
                          {colLeads.map((lead: Lead, idx: number) => renderLeadCard(lead, idx))}
                          {provided.placeholder}
                        </div>
                        
                        {/* Vertical Scroll Controls - Always Visible on Touch / Hover on Desktop */}
                        <div className="flex absolute right-2 bottom-2 flex-col gap-1 opacity-100 lg:opacity-0 lg:group-hover/colcontent:opacity-100 transition-opacity z-20">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full shadow-md bg-primary/20 backdrop-blur-md border border-primary/20 text-primary hover:bg-primary/30 transition-all"
                            onPointerDown={(e) => { e.preventDefault(); scrollColumn('up'); }}
                            onTouchStart={(e) => { e.preventDefault(); scrollColumn('up'); }}
                            onClick={() => scrollColumn('up')}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full shadow-md bg-primary/20 backdrop-blur-md border border-primary/20 text-primary hover:bg-primary/30 transition-all"
                            onPointerDown={(e) => { e.preventDefault(); scrollColumn('down'); }}
                            onTouchStart={(e) => { e.preventDefault(); scrollColumn('down'); }}
                            onClick={() => scrollColumn('down')}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  }}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
}
