import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Estadísticas',
};

export default async function EstadisticasPage() {
  const supabase = await clienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata.rol !== 'admin') {
    redirect('/ingresar');
  }

  // Agregado, nunca filas crudas de consultas: la función es SECURITY
  // DEFINER y verifica el rol adentro (05_estadisticas_cair.sql) — el punto
  // 9 del pliego prohíbe que CAIR vea el dato personal del comprador, ni
  // siquiera acá.
  const { data: estadisticas } = await supabase.rpc('estadisticas_consultas_por_campo');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-neutral-950">
        Consultas por campo
      </h1>

      {estadisticas && estadisticas.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-md border border-neutral-600 bg-neutral-50">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-600 bg-neutral-200">
                <th className="p-3 text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                  Campo
                </th>
                <th className="p-3 text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                  Ubicación
                </th>
                <th className="p-3 text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                  Consultas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-600">
              {estadisticas.map((fila) => (
                <tr key={fila.campo_id}>
                  <td className="p-3 font-display text-neutral-950">{fila.titulo}</td>
                  <td className="p-3 text-neutral-800">
                    {fila.localidad}, {fila.provincia}
                  </td>
                  <td className="p-3 text-neutral-950">{fila.cantidad_consultas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-neutral-800">Todavía no hay consultas registradas.</p>
      )}
    </div>
  );
}
