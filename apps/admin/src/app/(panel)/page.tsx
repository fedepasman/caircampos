import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, Clock, MessageCircle, PlusCircle, Tag, UserPlus } from 'lucide-react';
import { clienteServidor } from '@/lib/supabase/server';
import { Card } from '@cair/ui/Card';

export const metadata: Metadata = {
  title: 'Panel CAIR',
};

export default async function DashboardPage() {
  const supabase = await clienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata.rol !== 'admin') {
    redirect('/ingresar');
  }

  // Agregado, nunca filas crudas de `consultas`: mismo criterio que
  // estadisticas_consultas_por_campo — la función es SECURITY DEFINER y
  // verifica el rol adentro (05_estadisticas_cair.sql).
  const { data: resumen } = await supabase.rpc('estadisticas_resumen_cair').single();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Panel CAIR</h1>
      <p className="mt-1 text-neutral-800">Resumen de la actividad de la plataforma.</p>

      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
          Estado actual
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/moderacion">
            <Card className="hover:border-brand-900 p-6">
              <div className="flex items-center justify-between">
                <Clock className="text-brand-900" size={28} />
                <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                  Pendientes de aprobación
                </span>
              </div>
              <p className="font-display text-brand-900 mt-4 text-4xl font-bold">
                {resumen?.campos_pendientes ?? 0}
              </p>
            </Card>
          </Link>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <Building2 className="text-brand-900" size={28} />
              <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                Socios vigentes
              </span>
            </div>
            <p className="font-display text-brand-900 mt-4 text-4xl font-bold">
              {resumen?.socios_vigentes ?? 0}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <Tag className="text-brand-900" size={28} />
              <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                Campos publicados
              </span>
            </div>
            <p className="font-display text-brand-900 mt-4 text-4xl font-bold">
              {resumen?.campos_publicados ?? 0}
            </p>
          </Card>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
          Este mes
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <UserPlus className="text-brand-900" size={28} />
              <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                Socios nuevos
              </span>
            </div>
            <p className="font-display text-brand-900 mt-4 text-4xl font-bold">
              {resumen?.socios_nuevos_mes ?? 0}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <PlusCircle className="text-brand-900" size={28} />
              <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                Campos nuevos
              </span>
            </div>
            <p className="font-display text-brand-900 mt-4 text-4xl font-bold">
              {resumen?.campos_nuevos_mes ?? 0}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <MessageCircle className="text-brand-900" size={28} />
              <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                Consultas recibidas
              </span>
            </div>
            <p className="font-display text-brand-900 mt-4 text-4xl font-bold">
              {resumen?.consultas_mes_actual ?? 0}
            </p>
            <p className="mt-1 text-xs text-neutral-800">
              {resumen?.consultas_total ?? 0} en total desde siempre
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
