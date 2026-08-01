'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Badge } from '@cair/ui/Badge';

export interface SocioFila {
  id: string;
  nro_socio: number | null;
  nombre: string;
  telefono: string | null;
  provincia: string | null;
  localidad: string | null;
  latitud: number | null;
  publicado: boolean;
}

const columnHelper = createColumnHelper<SocioFila>();

const columnas = [
  // `?? undefined`, no `?? '—'`: así `sortUndefined` deja las filas sin
  // número de socio siempre al final, sin importar el sentido del orden
  // (con `null` en vez de `undefined`, TanStack no las trata como "sin
  // valor" y saltarían de punta a punta según asc/desc).
  columnHelper.accessor((fila) => fila.nro_socio ?? undefined, {
    id: 'nro_socio',
    header: 'Nº socio',
    cell: (info) => info.getValue() ?? '—',
    sortUndefined: 'last',
  }),
  columnHelper.accessor('nombre', { header: 'Nombre' }),
  columnHelper.accessor('telefono', {
    header: 'Teléfono',
    cell: (info) => info.getValue() ?? '—',
    enableSorting: false,
  }),
  columnHelper.accessor(
    (fila) => (fila.localidad && fila.provincia ? `${fila.localidad}, ${fila.provincia}` : '—'),
    { id: 'ubicacion', header: 'Ubicación' },
  ),
  columnHelper.accessor('latitud', {
    header: 'En el mapa',
    cell: (info) => (
      <Badge tone={info.getValue() !== null ? 'brand' : 'neutral'}>
        {info.getValue() !== null ? 'Sí' : 'Sin ubicar'}
      </Badge>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor('publicado', {
    header: 'Publicado',
    cell: (info) => (
      <Badge tone={info.getValue() ? 'brand' : 'neutral'}>{info.getValue() ? 'Sí' : 'No'}</Badge>
    ),
    enableSorting: false,
  }),
  columnHelper.display({
    id: 'acciones',
    header: '',
    cell: (info) => (
      <Link
        href={`/socios/${info.row.original.id}/editar`}
        className="text-brand-900 text-sm font-semibold underline underline-offset-4"
      >
        Editar
      </Link>
    ),
  }),
];

export function TablaSocios({ socios }: { socios: SocioFila[] }) {
  const [orden, setOrden] = useState<SortingState>([]);

  const tabla = useReactTable({
    data: socios,
    columns: columnas,
    state: { sorting: orden },
    onSortingChange: setOrden,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-md border border-neutral-600 bg-neutral-50">
      <table className="w-full text-left">
        <thead>
          {tabla.getHeaderGroups().map((grupo) => (
            <tr key={grupo.id} className="border-b border-neutral-600 bg-neutral-200">
              {grupo.headers.map((header) => {
                const ordenActual = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className="p-3 text-xs font-semibold tracking-widest text-neutral-800 uppercase"
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="hover:text-brand-900 flex items-center gap-1"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {ordenActual === 'asc' && <ArrowUp size={14} />}
                        {ordenActual === 'desc' && <ArrowDown size={14} />}
                        {!ordenActual && <ArrowUpDown size={14} className="opacity-40" />}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-neutral-600">
          {tabla.getRowModel().rows.map((fila) => (
            <tr key={fila.id}>
              {fila.getVisibleCells().map((celda) => (
                <td key={celda.id} className="p-3 text-neutral-950">
                  {flexRender(celda.column.columnDef.cell, celda.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
