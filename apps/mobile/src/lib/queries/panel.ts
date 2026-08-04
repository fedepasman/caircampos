import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@cair/supabase';
import { supabase } from '../supabase';

export type Socio = Pick<Tables<'socios'>, 'id' | 'nombre'>;

export type CampoPanel = Pick<
  Tables<'campos'>,
  | 'id'
  | 'titulo'
  | 'provincia'
  | 'localidad'
  | 'hectareas'
  | 'modalidad'
  | 'tipo_campo'
  | 'publicado'
  | 'revisado_por_cair'
>;

export function useSocio(usuarioId: string | undefined) {
  return useQuery({
    queryKey: ['socios', usuarioId],
    queryFn: async () => {
      if (!usuarioId) throw new Error('usuarioId requerido');

      const { data, error } = await supabase
        .from('socios')
        .select('id, nombre')
        .eq('usuario_id', usuarioId)
        .maybeSingle();

      if (error) throw error;
      return data satisfies Socio | null;
    },
    enabled: usuarioId !== undefined,
  });
}

export type CampoEditable = Tables<'campos'>;
export type FotoCampo = Pick<Tables<'campo_fotos'>, 'id' | 'object_key' | 'orden'>;

export function useCampoParaEditar(id: string) {
  return useQuery({
    queryKey: ['campos', 'editar', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campos')
        .select('*, campo_fotos(id, object_key, orden)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data satisfies (CampoEditable & { campo_fotos: FotoCampo[] }) | null;
    },
  });
}

export type Consulta = Pick<Tables<'consultas'>, 'id' | 'mensaje' | 'created_at'> & {
  campos: Pick<Tables<'campos'>, 'titulo'>;
  compradores: Pick<Tables<'compradores'>, 'nombre' | 'apellido' | 'telefono'>;
};

export function useConsultas(habilitado: boolean) {
  return useQuery({
    queryKey: ['consultas'],
    queryFn: async () => {
      // Sin filtro a propósito: la política de RLS de `consultas` ya
      // restringe el SELECT a las consultas de los campos del socio
      // logueado (o a las que mandó, si fuera comprador) — mismo select
      // que usa apps/web/src/app/panel/page.tsx.
      const { data, error } = await supabase
        .from('consultas')
        .select('id, mensaje, created_at, campos(titulo), compradores(nombre, apellido, telefono)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data satisfies Consulta[];
    },
    enabled: habilitado,
  });
}

export function useMisCampos(socioId: string | undefined) {
  return useQuery({
    queryKey: ['campos', 'mios', socioId],
    queryFn: async () => {
      if (!socioId) throw new Error('socioId requerido');

      const { data, error } = await supabase
        .from('campos')
        .select(
          'id, titulo, provincia, localidad, hectareas, modalidad, tipo_campo, publicado, revisado_por_cair',
        )
        .eq('socio_id', socioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data satisfies CampoPanel[];
    },
    enabled: socioId !== undefined,
  });
}
