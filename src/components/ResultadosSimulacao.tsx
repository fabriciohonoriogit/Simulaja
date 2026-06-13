import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { GrupoItem } from "./ConsortiumSimulator";

interface ResultadosSimulacaoProps {
  data: GrupoItem[];
}

export function ResultadosSimulacao({ data }: ResultadosSimulacaoProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });

  const columns = useMemo<ColumnDef<GrupoItem>[]>(
    () => [
      {
        accessorKey: "credito",
        header: "Crédito (R$)",
        cell: (info) => info.getValue<number>().toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      },
      {
        accessorKey: "r50",
        header: "Parcela 50% (R$)",
        cell: (info) => info.getValue<number>().toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      },
      {
        accessorKey: "prazo",
        header: "Prazo (Meses)",
      },
      {
        accessorKey: "grupo",
        header: "Grupo",
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (!data || data.length === 0) return null;

  return (
    <div className="mt-8 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-bold text-lg text-foreground">Todas as Opções do Simulador</h3>
        <p className="text-xs text-muted-foreground">Compare todas as cartas disponíveis na categoria selecionada.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-3 cursor-pointer select-none hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 font-medium text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/10">
        <div className="text-xs text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold bg-background disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold bg-background disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
