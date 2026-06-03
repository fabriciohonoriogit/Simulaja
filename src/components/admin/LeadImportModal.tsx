import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
  Loader2,
  Users,
  ChevronRight,
} from "lucide-react";
import { formatToUpper } from "@/lib/formatters";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedLead {
  nome: string;
  celular?: string;
  _row: number;
  _errors: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  organizacaoId: string | null | undefined;
  onImportDone: () => void;
}

// ─── Column aliases → lead fields ────────────────────────────────────────────

const COLUMN_MAP: Record<string, keyof Omit<ParsedLead, "_row" | "_errors">> = {
  // nome
  nome: "nome",
  name: "nome",
  cliente: "nome",
  "nome do cliente": "nome",
  // celular
  celular: "celular",
  telefone: "celular",
  phone: "celular",
  whatsapp: "celular",
  fone: "celular",
  contato: "celular",
};



// ─── Helpers ─────────────────────────────────────────────────────────────────

function normKey(k: string) {
  return k.toLowerCase().trim().replace(/\s+/g, " ");
}

function parseMoney(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const s = String(v)
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

function parseRows(rows: Record<string, unknown>[]): ParsedLead[] {
  return rows.map((row, i) => {
    const lead: ParsedLead = { nome: "", _row: i + 2, _errors: [] };

    for (const [rawKey, rawVal] of Object.entries(row)) {
      const field = COLUMN_MAP[normKey(rawKey)];
      if (!field || rawVal == null || rawVal === "") continue;

      const val = String(rawVal).trim();
      (lead as any)[field] = val;
    }

    // validations
    if (!lead.nome || lead.nome.trim() === "") {
      lead._errors.push("Nome obrigatório");
    }

    return lead;
  });
}

// ─── Download sample ─────────────────────────────────────────────────────────

function downloadSample() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["nome", "telefone"],
    ["João Silva", "11999991111"],
    ["Maria Souza", "21988882222"],
    ["Carlos Lima", "31977773333"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(wb, "modelo_importacao_leads.xlsx");
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LeadImportModal({ open, onClose, organizacaoId, onImportDone }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [leads, setLeads] = useState<ParsedLead[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [errors, setErrors] = useState(0);
  const [fileName, setFileName] = useState("");

  const reset = () => {
    setStep("upload");
    setLeads([]);
    setImporting(false);
    setImported(0);
    setErrors(0);
    setFileName("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
          raw: false,
        });

        if (rows.length === 0) {
          toast.error("Arquivo vazio ou sem dados válidos");
          return;
        }

        const parsed = parseRows(rows);
        setLeads(parsed);
        setStep("preview");
      } catch (err) {
        toast.error("Erro ao ler arquivo. Verifique o formato.");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const validLeads = leads.filter((l) => l._errors.length === 0);
  const invalidLeads = leads.filter((l) => l._errors.length > 0);

  const handleImport = async () => {
    if (!organizacaoId) {
      toast.error("Organização não identificada");
      return;
    }

    setImporting(true);
    let ok = 0;
    let fail = 0;

    // Chunk insert in batches of 50
    const BATCH = 50;
    for (let i = 0; i < validLeads.length; i += BATCH) {
      const chunk = validLeads.slice(i, i + BATCH).map((l) => ({
        nome: formatToUpper(l.nome),
        celular: l.celular ?? null,
        status: "novo_lead",
        tipo_consorcio: "imovel", // Default
        valor_credito: 0,
        prazo_meses: 0,
        organizacao_id: organizacaoId,
      }));

      const { error } = await supabase.from("leads").insert(chunk);
      if (error) {
        fail += chunk.length;
        console.error("[import] batch error:", error);
      } else {
        ok += chunk.length;
      }
    }

    setImported(ok);
    setErrors(fail);
    setImporting(false);
    setStep("done");

    if (ok > 0) {
      toast.success(`${ok} lead${ok > 1 ? "s" : ""} importado${ok > 1 ? "s" : ""} com sucesso!`);
      onImportDone();
    }
    if (fail > 0) {
      toast.error(`${fail} lead${fail > 1 ? "s" : ""} falharam na importação`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] border-none shadow-2xl p-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-white rounded-t-[28px]">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-white">
                  Importação em Massa
                </DialogTitle>
                <DialogDescription className="text-white/70 text-xs font-bold uppercase tracking-widest mt-0.5">
                  CSV · XLS · XLSX
                </DialogDescription>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-6">
              {(["upload", "preview", "done"] as const).map((s, idx) => {
                const labels = ["Enviar arquivo", "Revisar dados", "Concluído"];
                const active = step === s;
                const past =
                  (step === "preview" && idx === 0) ||
                  (step === "done" && idx <= 1);
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                        active
                          ? "bg-white text-primary"
                          : past
                          ? "bg-white/30 text-white"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {past ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                      {labels[idx]}
                    </div>
                    {idx < 2 && (
                      <ChevronRight className="h-3 w-3 text-white/40" />
                    )}
                  </div>
                );
              })}
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          {/* ── STEP 1: Upload ── */}
          {step === "upload" && (
            <div className="space-y-6">
              {/* Drag & drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                  transition-all duration-200 select-none
                  ${dragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-slate-200 hover:border-primary/50 hover:bg-primary/3 bg-slate-50"
                  }
                `}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className={`mx-auto mb-4 h-16 w-16 rounded-2xl flex items-center justify-center transition-all ${dragging ? "bg-primary text-white scale-110" : "bg-slate-100 text-slate-400"}`}>
                  <Upload className="h-8 w-8" />
                </div>

                <p className="text-slate-900 font-black text-lg mb-1">
                  {dragging ? "Solte o arquivo aqui" : "Arraste seu arquivo aqui"}
                </p>
                <p className="text-slate-400 text-sm">
                  ou clique para selecionar
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  {[".CSV", ".XLS", ".XLSX"].map((ext) => (
                    <span key={ext} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black border border-slate-200">
                      {ext}
                    </span>
                  ))}
                </div>
              </div>

              {/* Template download */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Download className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-800">Modelo de planilha</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Baixe o modelo com as colunas corretas para preencher.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSample}
                  className="flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50 font-black text-[10px] uppercase tracking-wider"
                >
                  Baixar modelo
                </Button>
              </div>

              {/* Field reference */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Colunas reconhecidas
                  </p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  {[
                    { label: "Nome *", hint: "nome, cliente, name" },
                    { label: "Telefone", hint: "celular, telefone, whatsapp" },
                  ].map((f) => (
                    <div key={f.label} className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                      <p className="text-[10px] font-black text-slate-800">{f.label}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{f.hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Preview ── */}
          {step === "preview" && (
            <div className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <p className="text-3xl font-black text-slate-900">{leads.length}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1">Total de linhas</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-center">
                  <p className="text-3xl font-black text-emerald-600">{validLeads.length}</p>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mt-1">Válidos</p>
                </div>
                <div className={`rounded-2xl p-4 border text-center ${invalidLeads.length > 0 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
                  <p className={`text-3xl font-black ${invalidLeads.length > 0 ? "text-red-500" : "text-slate-300"}`}>{invalidLeads.length}</p>
                  <p className={`text-[10px] font-black uppercase tracking-wider mt-1 ${invalidLeads.length > 0 ? "text-red-400" : "text-slate-400"}`}>Com erros</p>
                </div>
              </div>

              {/* File badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 w-fit">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-black text-slate-700">{fileName}</span>
                <button onClick={reset} className="ml-1 text-slate-400 hover:text-red-400 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Preview table */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Pré-visualização — {leads.length} linha{leads.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left w-16">Status</th>
                        <th className="px-3 py-2 text-left">Nome</th>
                        <th className="px-3 py-2 text-left">Telefone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {leads.map((l) => (
                        <tr key={l._row} className={l._errors.length > 0 ? "bg-red-50/50" : "hover:bg-slate-50/50"}>
                          <td className="px-3 py-2">
                            {l._errors.length > 0 ? (
                              <span title={l._errors.join(", ")} className="inline-flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                <AlertCircle className="h-2.5 w-2.5" />
                                Erro
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                OK
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-black text-slate-900 truncate">{l.nome || "—"}</td>
                          <td className="px-3 py-2 text-slate-500">{l.celular || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Errors summary */}
              {invalidLeads.length > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-amber-700">
                      {invalidLeads.length} linha{invalidLeads.length > 1 ? "s" : ""} com erro serão ignoradas
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Apenas os {validLeads.length} leads válidos serão importados.
                    </p>
                  </div>
                </div>
              )}

              {validLeads.length === 0 && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm font-black text-red-700">
                    Nenhum lead válido encontrado. Verifique as colunas do arquivo.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Done ── */}
          {step === "done" && (
            <div className="py-6 text-center space-y-6">
              <div className="mx-auto h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-emerald-100">
                {errors === 0 ? (
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-amber-500" />
                )}
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">Importação Concluída!</h3>
                <p className="text-slate-500 text-sm mt-2">
                  Veja o resumo abaixo e confira sua lista de leads.
                </p>
              </div>

              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-black text-emerald-500">{imported}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Importados</p>
                </div>
                {errors > 0 && (
                  <div className="text-center">
                    <p className="text-4xl font-black text-red-400">{errors}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Falharam</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={reset}
                  className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest"
                >
                  Nova Importação
                </Button>
                <Button
                  onClick={handleClose}
                  className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest gap-2"
                >
                  <Users className="h-4 w-4" />
                  Ver Leads
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step !== "done" && (
          <div className="px-8 pb-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="font-black text-[10px] uppercase tracking-widest text-slate-400"
            >
              Cancelar
            </Button>

            {step === "preview" && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={reset}
                  className="rounded-xl px-5 font-black text-[10px] uppercase tracking-widest"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || validLeads.length === 0}
                  className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest gap-2 min-w-[160px]"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Importar {validLeads.length} lead{validLeads.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
