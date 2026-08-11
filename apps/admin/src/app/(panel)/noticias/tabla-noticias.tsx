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
import { ETIQUETAS_CATEGORIA_NOTICIA } from '@cair/shared';
import { BotonPublicada } from './boton-publicada';

export interface NoticiaFila {
  id: string;
  titulo: string;
  categoria: string;
  fecha_publicacion: string;
  publicado: boolean;
}

const columnHelper = createColumnHelper<NoticiaFila>();

const columnas = [
  columnHelper.accessor('titulo', { header: 'Título' }),
  columnHelper.accessor((fila) => ETIQUETAS_CATEGORIA_NOTICIA[fila.categoria] ?? fila.categoria, {
    id: 'categoria',
    header: 'Categoría',
  }),
  columnHelper.accessor('fecha_publicacion', {
    header: 'Fecha',
    cell: (info) => new Date(info.getValue()).toLocaleDateString('es-AR'),
  }),
  columnHelper.accessor('publicado', {
    header: 'Publicada',
    cell: (info) => (
      <BotonPublicada id={info.row.original.id} publicado={info.getValue()} />
    ),
    enableSorting: false,
  }),
  columnHelper.display({
    id: 'acciones',
    header: '',
    cell: (info) => (
      <Link
        href={`/noticias/${info.row.original.id}/editar`}
        className="text-brand-900 text-sm font-semibold underline underline-offset-4"
      >
        Editar
      </Link>
    ),
  }),
];

export function TablaNoticias({ noticias }: { noticias: NoticiaFila[] }) {
  const [orden, setOrden] = useState<SortingState>([{ id: 'fecha_publicacion', desc: true }]);

  const tabla = useReactTable({
    data: noticias,
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
