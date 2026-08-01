'use client';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Badge, type BadgeTone } from '@cair/ui/Badge';
import { BotonModerar } from './boton-moderar';

export interface CampoModeracion {
  id: string;
  titulo: string;
  provincia: string;
  localidad: string;
  hectareas: number;
  revisado_por_cair: string;
  socios: { nombre: string };
}

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

const TONO_ESTADO: Record<string, BadgeTone> = {
  pendiente: 'neutral',
  aprobado: 'brand',
  rechazado: 'danger',
};

const columnHelper = createColumnHelper<CampoModeracion>();

function construirColumnas(mostrarAcciones: boolean) {
  return [
    columnHelper.accessor('titulo', { header: 'Título' }),
    columnHelper.accessor((fila) => fila.socios.nombre, { id: 'socio', header: 'Socio' }),
    columnHelper.accessor((fila) => `${fila.localidad}, ${fila.provincia}`, {
      id: 'ubicacion',
      header: 'Ubicación',
    }),
    columnHelper.accessor('hectareas', { header: 'Hectáreas' }),
    columnHelper.accessor('revisado_por_cair', {
      header: 'Estado',
      cell: (info) => {
        const estado = info.getValue();
        return (
          <Badge tone={TONO_ESTADO[estado] ?? 'neutral'}>{ETIQUETA_ESTADO[estado] ?? estado}</Badge>
        );
      },
    }),
    // Solo se agrega la columna de acciones cuando hace falta: incluirla
    // siempre en el array y ocultarla con CSS dejaría el RPC de moderación
    // a un clic de distancia en la tabla de solo lectura.
    ...(mostrarAcciones
      ? [
          columnHelper.display({
            id: 'acciones',
            header: 'Acciones',
            cell: (info: { row: { original: CampoModeracion } }) => (
              <BotonModerar campoId={info.row.original.id} />
            ),
          }),
        ]
      : []),
  ];
}

export function TablaCampos({
  campos,
  mostrarAcciones = false,
}: {
  campos: CampoModeracion[];
  mostrarAcciones?: boolean;
}) {
  const tabla = useReactTable({
    data: campos,
    columns: construirColumnas(mostrarAcciones),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-md border border-neutral-600 bg-neutral-50">
      <table className="w-full text-left">
        <thead>
          {tabla.getHeaderGroups().map((grupo) => (
            <tr key={grupo.id} className="border-b border-neutral-600 bg-neutral-200">
              {grupo.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-3 text-xs font-semibold tracking-widest text-neutral-800 uppercase"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
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
