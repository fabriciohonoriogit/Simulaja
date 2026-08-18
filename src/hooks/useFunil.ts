import { useState, useEffect, useCallback, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";
import { DropResult } from "@hello-pangea/dnd";

import { Lead, HistoricoContato, Membro } from "@/types/funil";
import { COLUMNS, normalizeStatus } from "@/components/admin/funil/constants";
import { googleCalendarService } from "@/services/googleCalendarService";
import { makeService } from "@/services/makeService";

export const ADMINISTRADORAS = ["MAGALU", "ADEMICON", "SERVOPA"];

export function useFunil() {
  const { profile, isManager } = useProfile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrationLead, setCelebrationLead] = useState<Lead | null>(null);
  const [grupo, setGrupo] = useState("");
  const [cota, setCota] = useState("");
  const [administradora, setAdministradora] = useState("");
  const [comissaoRegra, setComissaoRegra] = useState("DEMAIS");
  const [comissaoTipo, setComissaoTipo] = useState("REDUZIDA");
  const [saving, setSaving] = useState(false);
  const [administradoraFilter, setAdministradoraFilter] = useState("todos");
  const [indicadorFilter, setIndicadorFilter] = useState("todos");
  
  const [vencimentoLead, setVencimentoLead] = useState<Lead | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [horaAgendamento, setHoraAgendamento] = useState("09:00");
  const [notaAgendamento, setNotaAgendamento] = useState("");
  const [criarNoGcal, setCriarNoGcal] = useState(true);
  const [historicoLead, setHistoricoLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [savingLead, setSavingLead] = useState(false);
  const [viewingFichaLead, setViewingFichaLead] = useState<Lead | null>(null);
  const [ultimasTratativas, setUltimasTratativas] = useState<Record<string, HistoricoContato>>({});
  
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [mobileColIdx, setMobileColIdx] = useState(0);
  const [membros, setMembros] = useState<Membro[]>([]);
  // isManager is now dynamically fetched from useProfile 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    
    supabase.from("perfis").select("id, nome_completo").then(({ data }) => {
      setMembros((data as Membro[]) || []);
    });

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [isWideView, setIsWideView] = useState(() => {
    return localStorage.getItem("crm_wide_view") === "true";
  });
  
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("crm_column_widths");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar larguras das colunas", e);
      }
    }
    return {};
  });

  const handleUpdateLeadField = async (leadId: string, field: string, value: string) => {
    const { error } = await (supabase.from("leads") as any).update({ [field]: value }).eq("id", leadId);
    
    if (error) {
      toast.error(`Erro ao atualizar campo: ${error.message}`);
      return;
    }

    const { data: carteiraItem } = await supabase.from("carteira").select("id").eq("lead_id", leadId).maybeSingle();
    if (carteiraItem) {
      await (supabase.from("carteira") as any).update({ [field]: value }).eq("lead_id", leadId);
    }

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, [field]: value } : l)));

    const fieldLabels: Record<string, string> = {
      grupo: "Grupo",
      cota: "Cota",
      administradora: "Administradora",
      data_adesao: "Data de Adesão",
    };
    toast.success(`${fieldLabels[field] ?? field} atualizado com sucesso!`);
  };

  useEffect(() => {
    localStorage.setItem("crm_wide_view", String(isWideView));
  }, [isWideView]);

  useEffect(() => {
    localStorage.setItem("crm_column_widths", JSON.stringify(columnWidths));
  }, [columnWidths]);

  const resizingRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);

  const startResizing = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = {
      id,
      startX: e.pageX,
      startWidth: columnWidths[id] || (isWideView ? 200 : 280),
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { id, startX, startWidth } = resizingRef.current;
    const newWidth = Math.max(150, Math.min(600, startWidth + (e.pageX - startX)));
    setColumnWidths((prev) => ({ ...prev, [id]: newWidth }));
  };

  const stopResizing = () => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
  };

  const kanbanRef = useRef<HTMLDivElement>(null);
  const isDraggingCardRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowRight") {
        if (kanbanRef.current) kanbanRef.current.scrollLeft += 500;
      } else if (e.key === "ArrowLeft") {
        if (kanbanRef.current) kanbanRef.current.scrollLeft -= 500;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Função reutilizável de fetch de leads ───────────────────────────────
  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar leads do funil:", error);
      setLoading(false);
      return;
    }

    const uniqueRaw = ((data as unknown as Lead[]) || []).filter(
      (v: Lead, i: number, a: Lead[]) => a.findIndex((t: Lead) => t.id === v.id) === i
    );

    const fetchedLeads: Lead[] = uniqueRaw.map((lead) => ({
      ...lead,
      nome: lead.nome || "Lead Sem Nome",
      status: normalizeStatus(lead.status),
    }));
    setLeads(fetchedLeads);
    setLoading(false);
  }, []);

  // refetch público para uso em outras páginas (ex: Leads.tsx)
  const refetch = useCallback(async () => {
    await fetchLeads();
  }, [fetchLeads]);

  // Carga inicial
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Subscription realtime — qualquer alteração em leads reflete no Funil/Carteira/Dashboard
  useEffect(() => {
    const channel = supabase
      .channel('funil-leads-realtime-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setLeads((prev) => prev.filter((l) => l.id !== (payload.old as Lead).id));
          } else {
            fetchLeads();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads]);

  useEffect(() => {
    if (leads.length === 0 || !profile?.organizacao_id) return;
    const leadIds = leads.map((l) => l.id);
    (supabase as any)
      .from("historico_contatos")
      .select("id, lead_id, observacao, created_at, tipo, resultado, organizacao_id")
      .eq("organizacao_id", profile.organizacao_id)
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any }) => {
        if (!data) return;
        const map: Record<string, HistoricoContato> = {};
        (data as HistoricoContato[]).forEach((h) => {
          if (h.lead_id && !map[h.lead_id]) {
            map[h.lead_id] = h;
          }
        });
        setUltimasTratativas(map);
      });
  }, [leads.length, profile?.organizacao_id]);

  const getColumnLeads = useCallback((columnId: string) => {
     return leads.filter((lead) => {
      const matchStatus = normalizeStatus(lead.status) === columnId;
      const matchAdmin = administradoraFilter === "todos" || lead.administradora === administradoraFilter;
      return matchStatus && matchAdmin;
    })
    .sort((a, b) => {
        const updateA = new Date(a.last_interaction_at || a.status_updated_at || a.created_at || 0).getTime();
        const updateB = new Date(b.last_interaction_at || b.status_updated_at || b.created_at || 0).getTime();
        if (updateA !== updateB) return updateB - updateA;

        const sw: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };
        const sA = sw[a.score_final || ""] || 0, sB = sw[b.score_final || ""] || 0;
        if (sA !== sB) return sB - sA;
        return 0;
      });
  }, [leads, administradoraFilter]);

  const fireConfetti = useCallback(() => {
    const end = Date.now() + 5000; // Aumentado para 5 segundos
    const frame = () => {
      confetti({ 
        particleCount: 3, 
        angle: 60, 
        spread: 55, 
        origin: { x: 0 },
        zIndex: 9999
      });
      confetti({ 
        particleCount: 3, 
        angle: 120, 
        spread: 55, 
        origin: { x: 1 },
        zIndex: 9999
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const triggerCelebration = useCallback((lead: Lead) => {
    const finalAdmin = lead.administradora || "";
    setCelebrationLead({ ...lead, status: "fechado" });
    setGrupo(lead.grupo || "");
    setCota(lead.cota || "");
    setAdministradora(finalAdmin);

    if (finalAdmin === "ADEMICON") {
      setComissaoRegra("ADEMICON");
      const isVeiculo = ["veiculo", "moto", "pesados", "agricolas"].includes(
        (lead.tipo_consorcio || "").toLowerCase()
      );
      setComissaoTipo(isVeiculo ? "ADEMICON_VEICULO_REDUZIDA" : "ADEMICON_IMOVEL_REDUZIDA");
    } else {
      setComissaoRegra("DEMAIS");
      setComissaoTipo("REDUZIDA");
    }

    fireConfetti();
  }, [fireConfetti]);

  const handleGenerateReport = useCallback(() => {
    const doc = new jsPDF();
    const title = "Relatorio de Funil de Vendas";
    const date = format(new Date(), "dd/MM/yyyy HH:mm");

    doc.setFontSize(16);
    doc.text(title, 10, 10);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${date}`, 10, 16);
    doc.line(10, 18, 200, 18);

    let y = 25;
    doc.setFont("helvetica", "bold");
    doc.text("Nome", 10, y);
    doc.text("Status", 80, y);
    doc.text("Valor", 130, y);
    doc.text("Temp", 165, y);
    doc.text("Origem", 185, y);
    doc.line(10, y + 2, 200, y + 2);
    y += 8;

    doc.setFont("helvetica", "normal");
    const filteredLeads = leads.filter(item => administradoraFilter === "todos" || item.administradora === administradoraFilter);
    filteredLeads.forEach((item) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(item.nome.substring(0, 35), 10, y);
      doc.text((item.status || "Novo").replace("_", " "), 80, y);
      doc.text(String(item.valor_credito || 0), 130, y); // simplified value rendering for report
      doc.text(item.lead_temperatura || "quente", 165, y);
      doc.text((item.origem || "Simulador").substring(0, 10), 185, y);
      y += 6;
    });

    doc.save(`relatorio-funil-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Relatório gerado com sucesso!");
  }, [leads, administradoraFilter]);

  const onDragEnd = useCallback(async (result: DropResult) => {
    isDraggingCardRef.current = false;
    const { destination, source, draggableId } = result;
    if (!destination) return;
    
    // Se não mudou de lugar, ignora
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const leadId = draggableId;
    const oldStatus = source.droppableId;
    const newStatus = destination.droppableId;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    // --- Lógica de Reordenamento Persistente via Timestamp ---
    const colLeads = getColumnLeads(newStatus);
    let newTimestamp = new Date().toISOString();

    if (colLeads.length > 0) {
      if (destination.index === 0) {
        // No topo: mais recente que o atual primeiro
        const firstLead = colLeads[0];
        const firstTime = new Date(firstLead.last_interaction_at || firstLead.status_updated_at || firstLead.created_at || Date.now()).getTime();
        newTimestamp = new Date(firstTime + 1000).toISOString();
      } else if (destination.index >= colLeads.length) {
        // No fim: mais antigo que o atual último
        const lastLead = colLeads[colLeads.length - 1];
        const lastTime = new Date(lastLead.last_interaction_at || lastLead.status_updated_at || lastLead.created_at || Date.now()).getTime();
        newTimestamp = new Date(lastTime - 1000).toISOString();
      } else {
        // No meio: entre o item de cima e o de baixo
        // Importante: se source === destination, os índices podem mudar após o splice interno
        const leadsAdjusted = colLeads.filter(l => l.id !== leadId);
        const before = leadsAdjusted[destination.index - 1];
        const after = leadsAdjusted[destination.index];
        
        if (before && after) {
          const timeBefore = new Date(before.last_interaction_at || before.status_updated_at || before.created_at || Date.now()).getTime();
          const timeAfter = new Date(after.last_interaction_at || after.status_updated_at || after.created_at || Date.now()).getTime();
          newTimestamp = new Date((timeBefore + timeAfter) / 2).toISOString();
        } else if (before) {
           const timeBefore = new Date(before.last_interaction_at || before.status_updated_at || before.created_at || Date.now()).getTime();
           newTimestamp = new Date(timeBefore - 1000).toISOString();
        }
      }
    }

    const isStatusChanging = newStatus !== oldStatus;
    const finalStatusUpdatedAt = isStatusChanging ? new Date().toISOString() : (lead.status_updated_at || new Date().toISOString());

    // Atualiza localmente com o novo timestamp para manter a posição após o sort
    setLeads(prev => prev.map(l => l.id === leadId ? { 
      ...l, 
      status: newStatus, 
      status_updated_at: finalStatusUpdatedAt,
      last_interaction_at: newTimestamp 
    } : l));

    // Persiste no Supabase
    const { error } = await supabase
      .from("leads")
      .update({ 
        status: newStatus, 
        status_updated_at: finalStatusUpdatedAt,
        last_interaction_at: newTimestamp,
        updated_at: new Date().toISOString()
      })
      .eq("id", leadId);

    if (error) {
      toast.error("Erro ao sincronizar posição: " + error.message);
      // Revert op (simplified)
      fetchLeads();
    }

    // --- Gatilhos de Status ---
    if (newStatus === "aguardando_pagamento") {
      setVencimentoLead({ ...lead, status: "aguardando_pagamento" });
      setSelectedDate(lead.data_vencimento ? parseISO(lead.data_vencimento) : undefined);
    }

    if (newStatus === "fechado" || newStatus === "venda_fechada") {
      triggerCelebration({ ...lead, status: newStatus, status_updated_at: finalStatusUpdatedAt });
    }
    
    const statusLabel = COLUMNS.find(c => c.id === newStatus)?.label || newStatus;
    const logEntry = `Movido para: ${statusLabel}`;
    await supabase.from("historico_contatos").insert({
      lead_id: leadId,
      tipo: "sistema",
      observacao: `[${format(new Date(), "dd/MM")}] ${logEntry}`,
      resultado: "neutro",
      organizacao_id: lead.organizacao_id
    });
  }, [leads, fireConfetti, getColumnLeads, fetchLeads]);


  const handleSaveVencimento = async () => {
    if (!vencimentoLead || !selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const updateData: Partial<Lead> = {
      data_vencimento: dateStr,
      updated_at: new Date().toISOString(),
    };

    let gcalEventId: string | null = null;
    if (criarNoGcal) {
      const gcalResult = await googleCalendarService.criarEvento({
        leadNome: vencimentoLead.nome,
        leadCelular: vencimentoLead.celular || "",
        valorCredito: Number(vencimentoLead.valor_credito),
        tipoConsorcio: vencimentoLead.tipo_consorcio,
        data: dateStr,
        hora: horaAgendamento,
        nota: `[AUTOMATIZAÇÃO CRM] Acompanhamento de pagamento para lead ${vencimentoLead.nome}. \nObservação: ${notaAgendamento}`,
      });

      if (gcalResult) {
        gcalEventId = gcalResult.eventId;
        updateData.gcal_event_id = gcalEventId;
        toast.success("Evento criado no Google Calendar!", { duration: 4000 });
        
        // Log no histórico
        await supabase.from("historico_contatos").insert({
          lead_id: vencimentoLead.id,
          tipo: "sistema",
          observacao: `[${format(new Date(), "dd/MM")}] Agendamento GCal criado para ${format(selectedDate, "dd/MM")} às ${horaAgendamento}`,
          resultado: "neutro",
          organizacao_id: vencimentoLead.organizacao_id
        });
      }
    }

    const { error } = await (supabase
      .from("leads") as any)
      .update(updateData as any)
      .eq("id", vencimentoLead.id);

    if (error) {
      toast.error("Erro ao salvar agendamento");
      return;
    }

    const responsavel = membros.find(m => m.id === vencimentoLead.responsavel_id);
    await makeService.notificarAgendamento({
      lead: {
        id: vencimentoLead.id,
        nome: vencimentoLead.nome,
        celular: vencimentoLead.celular,
        tipo_consorcio: vencimentoLead.tipo_consorcio,
        valor_credito: Number(vencimentoLead.valor_credito),
        status: vencimentoLead.status,
      },
      data: dateStr,
      hora: horaAgendamento,
      nota: notaAgendamento,
      responsavel_nome: responsavel?.nome_completo || profile?.nome_completo || "",
    });

    setLeads((prev) =>
      prev.map((l) => (l.id === vencimentoLead.id ? { ...l, data_vencimento: dateStr, gcal_event_id: gcalEventId } : l)),
    );

    toast.success(`Agendado para ${format(selectedDate, "dd/MM/yyyy")} às ${horaAgendamento}`);
    setVencimentoLead(null);
    setSelectedDate(undefined);
    setHoraAgendamento("09:00");
    setNotaAgendamento("");
  };

  const handleSaveCelebration = async () => {
    if (!celebrationLead) return;
    setSaving(true);

    const valorCredito = Number(celebrationLead.valor_credito) || 0;
    const finalAdmin = (administradora === "none" ? null : administradora) || celebrationLead.administradora;

    // Comissionamento Auto-Create
    let taxa_comissao = 4; // DEMAIS
    if (comissaoRegra === "GOLDEN") taxa_comissao = 5;
    if (comissaoRegra === "SILVER") taxa_comissao = 3;
    if (finalAdmin === "ADEMICON") taxa_comissao = 2.5;
    if (comissaoRegra === "INDICACAO_MAGALU") taxa_comissao = 0.8; // Comissão Filial Magalu = sempre 0.80% independente do segmento ou administradora

    let finalTipoComissionamento = comissaoRegra === "INDICACAO_MAGALU" ? "LINEAR" : comissaoTipo;
    if (finalAdmin === "ADEMICON" && !finalTipoComissionamento.startsWith("ADEMICON_")) {
      const isVeiculo = ["veiculo", "moto", "pesados", "agricolas"].includes((celebrationLead.tipo_consorcio || "").toLowerCase());
      const base = isVeiculo ? "ADEMICON_VEICULO" : "ADEMICON_IMOVEL";
      const tipo = finalTipoComissionamento === "LINEAR" ? "LINEAR" : "REDUZIDA";
      finalTipoComissionamento = `${base}_${tipo}`;
    }

    let parcelas_comissao = 1;
    if (finalTipoComissionamento === "REDUZIDA") parcelas_comissao = 10;
    if (finalTipoComissionamento === "LINEAR") parcelas_comissao = 4;
    if (comissaoRegra === "INDICACAO_MAGALU") parcelas_comissao = 4;
    if (finalTipoComissionamento.startsWith("ADEMICON_")) {
      parcelas_comissao = finalTipoComissionamento.includes("VEICULO") ? 13 : 15;
    }

    const comissao_total = (valorCredito * taxa_comissao) / 100;

    const dataAdesao = celebrationLead.status_updated_at 
      ? celebrationLead.status_updated_at.split('T')[0] 
      : new Date().toISOString().split('T')[0];

    // 1. Atualiza Lead para Venda Fechada
    const { error: leadError } = await supabase
      .from("leads")
      .update({
        status: "fechado",
        grupo: grupo || null,
        cota: cota || null,
        administradora: finalAdmin || null,
        status_updated_at: new Date().toISOString()
      } as any)
      .eq("id", celebrationLead.id);

    if (leadError) {
      console.error("Erro ao atualizar lead:", leadError);
      toast.error("Erro ao salvar lead: " + leadError.message);
      setSaving(false);
      return;
    }

    // 2. Adiciona ou Atualiza na Carteira de Clientes
    try {
      await supabase
        .from("carteira")
        .upsert({
          lead_id: celebrationLead.id,
          nome: celebrationLead.nome,
          tipo_consorcio: celebrationLead.tipo_consorcio,
          valor_credito: valorCredito,
          grupo: grupo || null,
          cota: cota || null,
          administradora: finalAdmin || null,
          status: "ativo",
          data_adesao: dataAdesao,
          organizacao_id: celebrationLead.organizacao_id || profile?.organizacao_id
        } as any, { onConflict: 'lead_id' });
    } catch (cErr) {
      console.warn("Aviso ao gravar carteira:", cErr);
    }

    // 3. Registra a Comissão de Venda
    try {
      await supabase
        .from("comissoes")
        .insert({
          organizacao_id: celebrationLead.organizacao_id || profile?.organizacao_id,
          usuario_id: profile?.id,
          lead_id: celebrationLead.id,
          cliente_nome: celebrationLead.nome,
          grupo: grupo || null,
          cota: cota || null,
          valor_venda: valorCredito,
          regra_comissao: comissaoRegra || "DEMAIS",
          taxa_comissao: taxa_comissao,
          tipo_comissionamento: finalTipoComissionamento,
          comissao_total: comissao_total,
          parcelas_comissao: parcelas_comissao,
          data_venda: dataAdesao,
          administradora: finalAdmin || null,
          parcela_atual: 1
        } as any);
    } catch (mErr) {
      console.warn("Aviso ao gravar comissão:", mErr);
    }

    setLeads(prev => prev.map(l => l.id === celebrationLead.id ? {
      ...l,
      status: "fechado",
      grupo: grupo || l.grupo,
      cota: cota || l.cota,
      administradora: finalAdmin || l.administradora,
      status_updated_at: new Date().toISOString()
    } : l));

    setSaving(false);

    toast.success("Cliente adicionado à carteira e comissão registrada!");
    setCelebrationLead(null);
    setComissaoRegra("DEMAIS");
    setComissaoTipo("REDUZIDA");
    setGrupo("");
    setCota("");
    setAdministradora("");
  };

  const handleDeleteLead = async (leadId: string, leadNome: string) => {
    if (!confirm(`Excluir o lead "${leadNome}" permanentemente?`)) return;
    await Promise.all([
      supabase.from("interacoes").delete().eq("lead_id", leadId),
      supabase.from("historico_contatos").delete().eq("lead_id", leadId),
      supabase.from("propostas").delete().eq("lead_id", leadId),
      supabase.from("carteira").delete().eq("lead_id", leadId),
    ]);
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) {
      toast.error("Erro ao excluir lead");
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    toast.success(`Lead "${leadNome}" excluído`);
  };

  const handleCloseHistorico = useCallback(async () => {
    if (!historicoLead) { setHistoricoLead(null); return; }
    const leadId = historicoLead.id;
    setHistoricoLead(null);
    const { data } = await supabase
      .from("historico_contatos")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      setUltimasTratativas((prev) => ({ ...prev, [leadId]: data[0] as HistoricoContato }));
    }
  }, [historicoLead]);

  return {
    leads,
    setLeads,
    loading,
    refetch,
    celebrationLead,
    setCelebrationLead,
    triggerCelebration,
    grupo,
    setGrupo,
    cota,
    setCota,
    administradora,
    setAdministradora,
    comissaoRegra,
    setComissaoRegra,
    comissaoTipo,
    setComissaoTipo,
    saving,
    administradoraFilter,
    setAdministradoraFilter,
    vencimentoLead,
    setVencimentoLead,
    selectedDate,
    setSelectedDate,
    horaAgendamento,
    setHoraAgendamento,
    notaAgendamento,
    setNotaAgendamento,
    criarNoGcal,
    setCriarNoGcal,
    historicoLead,
    setHistoricoLead,
    ultimasTratativas,
    isMobile,
    mobileColIdx,
    setMobileColIdx,
    membros,
    isManager,
    isWideView,
    setIsWideView,
    columnWidths,
    kanbanRef,
    isDraggingCardRef,
    handleUpdateLeadField,
    startResizing,
    getColumnLeads,
    handleGenerateReport,
    onDragEnd,
    handleSaveVencimento,
    handleSaveCelebration,
    handleDeleteLead,
    handleCloseHistorico,
    indicadorFilter,
    setIndicadorFilter,
    editingLead,
    setEditingLead,
    savingLead,
    handleSaveLead: useCallback(async (formData: Partial<Lead> & { comissao_regra?: string; comissao_tipo?: string; is_retroativo?: boolean }) => {
      if (!editingLead) return;
      setSavingLead(true);
      try {
        const dados_cadastro = {
          ...formData.dados_cadastro,
          is_retroativo: formData.is_retroativo,
          comissao_regra: formData.comissao_regra,
          comissao_tipo: formData.comissao_tipo,
        };

        const { error } = await supabase
          .from("leads")
          .update({
            nome: formData.nome,
            email: formData.email,
            celular: formData.celular,
            cidade: formData.cidade,
            tipo_consorcio: formData.tipo_consorcio,
            valor_credito: Number(formData.valor_credito),
            prazo_meses: Number(formData.prazo_meses),
            status: formData.status,
            lead_temperatura: formData.lead_temperatura,
            lead_score_valor: formData.lead_score_valor,
            administradora: formData.administradora === "none" ? null : formData.administradora,
            indicador_nome: formData.indicador_nome,
            indicador_celular: formData.indicador_celular,
            grupo: formData.grupo,
            cota: formData.cota,
            dados_cadastro: dados_cadastro,
            origem: formData.origem || null,
          })
          .eq("id", editingLead.id);

        if (error) throw error;

        // Se for retroativo, cria comissão se ainda não existir
        if (formData.is_retroativo) {
          // Check if comissao already exists
          const { data: comissoesExistentes } = await supabase
            .from("comissoes")
            .select("id")
            .eq("lead_id", editingLead.id);

          if (!comissoesExistentes || comissoesExistentes.length === 0) {
            let taxa_comissao = 4; // DEMAIS
            if (formData.comissao_regra === "GOLDEN") taxa_comissao = 5;
            if (formData.comissao_regra === "SILVER") taxa_comissao = 3;
            
            // Se for retroativo (vendas até Março), a taxa é obrigatoriamente 3.5%
            if (formData.is_retroativo) taxa_comissao = 3.5;
            
            // Regra específica Ademicon
            if (formData.administradora === "ADEMICON") taxa_comissao = 2.5;

            // Comissão Filial Magalu é sempre 0.80% independente de administradora, retroativo ou segmento
            if (formData.comissao_regra === "INDICACAO_MAGALU") taxa_comissao = 0.8;

            let finalTipoComissionamento = formData.comissao_regra === "INDICACAO_MAGALU" ? "LINEAR" : (formData.comissao_tipo || "REDUZIDA");
            if (formData.administradora === "ADEMICON" && !finalTipoComissionamento.startsWith("ADEMICON_")) {
              const isVeiculo = ["veiculo", "moto", "pesados", "agricolas"].includes((formData.tipo_consorcio || "").toLowerCase());
              const base = isVeiculo ? "ADEMICON_VEICULO" : "ADEMICON_IMOVEL";
              const tipo = finalTipoComissionamento === "LINEAR" ? "LINEAR" : "REDUZIDA";
              finalTipoComissionamento = `${base}_${tipo}`;
            }

            let parcelas_comissao = 1;
            if (finalTipoComissionamento === "REDUZIDA") parcelas_comissao = 10;
            if (finalTipoComissionamento === "LINEAR") parcelas_comissao = 4;
            if (formData.comissao_regra === "INDICACAO_MAGALU") parcelas_comissao = 4;
            if (finalTipoComissionamento.startsWith("ADEMICON_")) {
              parcelas_comissao = finalTipoComissionamento.includes("VEICULO") ? 13 : 15;
            }

            const valorVenda = Number(formData.valor_credito) || 0;
            const comissao_total = (valorVenda * taxa_comissao) / 100;
            
            // Calcula a parcela atual baseada na data da venda
            const saleDate = formData.status_updated_at ? new Date(formData.status_updated_at) : new Date();
            const today = new Date();
            const diffMonths = (today.getFullYear() - saleDate.getFullYear()) * 12 + (today.getMonth() - saleDate.getMonth());
            const parcela_atual = diffMonths > 0 ? diffMonths : 1;

            await supabase.from("comissoes").insert({
              organizacao_id: profile?.organizacao_id,
              usuario_id: profile?.id,
              lead_id: editingLead.id,
              cliente_nome: formData.nome,
              grupo: formData.grupo,
              cota: formData.cota,
              valor_venda: valorVenda,
              regra_comissao: formData.is_retroativo ? "RETROATIVO" : (formData.comissao_regra || "DEMAIS"),
              taxa_comissao,
              tipo_comissionamento: finalTipoComissionamento,
              comissao_total,
              parcelas_comissao,
              data_venda: formData.status_updated_at ? formData.status_updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
              pagamentos_retroativos: 1, // Default to 1 to show it's retroactive, or leave empty
              administradora: formData.administradora,
              parcela_atual
            });
            
            // Also upsert to carteira
            await supabase.from("carteira").upsert({
              lead_id: editingLead.id,
              nome: formData.nome,
              tipo_consorcio: formData.tipo_consorcio,
              valor_credito: Number(formData.valor_credito),
              grupo: formData.grupo,
              cota: formData.cota,
              administradora: formData.administradora === "none" ? null : formData.administradora,
              status: "aguardando",
              data_adesao: formData.status_updated_at ? formData.status_updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
              organizacao_id: profile?.organizacao_id,
            }, { onConflict: 'lead_id' });
          }
        }

        setLeads((prev) => prev.map((l) => (l.id === editingLead.id ? { ...l, ...formData, dados_cadastro } : l)));
        setEditingLead(null);
        toast.success("Lead atualizado!");
      } catch (e) {
        toast.error("Erro ao salvar: " + (e as Error).message);
      } finally {
        setSavingLead(false);
      }
    }, [editingLead, profile]),
    viewingFichaLead,
    setViewingFichaLead,
    profile,
    handleToggleAI: async (leadId: string, currentStatus: boolean) => {
      const novoStatus = !currentStatus;
      const { error } = await supabase
        .from("leads")
        .update({ atendimento_ia: novoStatus } as any)
        .eq("id", leadId);

      if (error) {
        toast.error("Erro ao alterar status da IA");
        return;
      }

      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, atendimento_ia: novoStatus } : l)));
      toast.success(novoStatus ? "IA Ativada para este lead" : "IA Desativada para este lead");
    }
  };
}
