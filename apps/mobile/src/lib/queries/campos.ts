import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@cair/supabase';
import { supabase } from '../supabase';

type FotoCampo = Pick<Tables<'campo_fotos'>, 'object_key' | 'orden'>;

export type CampoListado = Pick<
  Tables<'campos'>,
  | 'id'
  | 'titulo'
  | 'hectareas'
  | 'precio_usd'
  | 'provincia'
  | 'localidad'
  | 'modalidad'
  | 'tipo_campo'
  | 'created_at'
> & { campo_fotos: FotoCampo[] };

export type CampoFicha = Pick<
  Tables<'campos'>,
  | 'id'
  | 'titulo'
  | 'descripcion'
  | 'hectareas'
  | 'precio_usd'
  | 'provincia'
  | 'localidad'
  | 'modalidad'
  | 'tipo_campo'
  | 'latitud'
  | 'longitud'
> & {
  socios: Pick<Tables<'socios'>, 'nombre'>;
  campo_fotos: (Pick<Tables<'campo_fotos'>, 'id' | 'orden'> & FotoCampo)[];
};

export function useCampos() {
  return useQuery({
    queryKey: ['campos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campos')
        .select(
          'id, titulo, hectareas, precio_usd, provincia, localidad, modalidad, tipo_campo, created_at, campo_fotos(object_key, orden)',
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data satisfies CampoListado[];
    },
  });
}

export function useCampo(id: string) {
  return useQuery({
    queryKey: ['campos', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campos')
        .select(
          'id, titulo, descripcion, hectareas, precio_usd, provincia, localidad, modalidad, tipo_campo, latitud, longitud, socios(nombre), campo_fotos(id, object_key, orden)',
        )
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data satisfies CampoFicha | null;
    },
  });
}
