'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CATEGORIAS_NOTICIA, esquemaNoticia, type z } from '@cair/schemas';
import { ETIQUETAS_CATEGORIA_NOTICIA, generarSlug } from '@cair/shared';
import { clienteNavegador } from '@/lib/supabase/client';
import { FormField } from '@cair/ui/FormField';
import { FormTextarea } from '@cair/ui/FormTextarea';
import { FormSelect } from '@cair/ui/FormSelect';
import { FormCheckbox } from '@cair/ui/FormCheckbox';
import { Button } from '@cair/ui/Button';
import type { ClienteCair, Tables } from '@cair/supabase';
import { SubidaImagen } from './subida-imagen';

// Mismo motivo que en `apps/web/panel/formulario-campo.tsx`: el tipo de
// entrada de React Hook Form (lo que tipean los inputs) difiere del de
// salida (ya validado, con `fecha_publicacion` coercionada a `Date`), y sin
// distinguirlos el resolver de zod no tipa contra `useForm`.
type NoticiaFormularioEntrada = z.input<typeof esquemaNoticia>;
type NoticiaFormulario = z.output<typeof esquemaNoticia>;

/**
 * Busca el próximo slug libre a partir de uno propuesto, agregando un
 * sufijo `-2`, `-3`… si ya existe (dos noticias con el mismo título). Una
 * sola consulta trayendo todos los slugs de esa "familia" en vez de probar
 * de a uno — el caso común (sin colisión) no paga ningún round-trip extra.
 * No hace falta escapar `slugBase` para el `.or()`: `generarSlug` solo
 * produce `[a-z0-9-]`, ninguno de esos caracteres tiene significado
 * especial en la sintaxis de filtros de PostgREST.
 */
async function resolverSlugDisponible(
  supabase: ClienteCair,
  slugBase: string,
  idAExcluir?: string,
): Promise<string> {
  let query = supabase
    .from('noticias')
    .select('slug')
    .or(`slug.eq.${slugBase},slug.like.${slugBase}-%`);
  if (idAExcluir) query = query.neq('id', idAExcluir);

  const { data } = await query.overrideTypes<{ slug: string }[], { merge: false }>();
  const existentes = new Set((data ?? []).map((fila) => fila.slug));

  if (!existentes.has(slugBase)) return slugBase;

  let sufijo = 2;
  while (existentes.has(`${slugBase}-${String(sufijo)}`)) sufijo += 1;
  return `${slugBase}-${String(sufijo)}`;
}

export function FormularioNoticia({ noticiaExistente }: { noticiaExistente?: Tables<'noticias'> }) {
  const router = useRouter();
  // En el alta, el slug se auto-deriva del título hasta que el admin lo
  // edite a mano; en la edición nunca se re-deriva solo, para no romper en
  // silencio la URL de una nota ya publicada.
  const [slugTocado, setSlugTocado] = useState(Boolean(noticiaExistente));
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NoticiaFormularioEntrada, unknown, NoticiaFormulario>({
    resolver: zodResolver(esquemaNoticia),
    defaultValues: noticiaExistente
      ? {
          titulo: noticiaExistente.titulo,
          slug: noticiaExistente.slug,
          // La columna es `text` con `check` en Postgres: el tipo generado
          // por Supabase la ve como `string` a secas, no como el enum que
          // el `check` en los hechos garantiza.
          categoria: noticiaExistente.categoria as NoticiaFormularioEntrada['categoria'],
          cuerpo: noticiaExistente.cuerpo,
          fecha_publicacion: noticiaExistente.fecha_publicacion.slice(0, 10),
          publicado: noticiaExistente.publicado,
        }
      : {
          // `titulo`/`slug` explícitos en '' (no ausentes): `useWatch`
          // arranca en `undefined` si el campo no está en `defaultValues`,
          // y `generarSlug(undefined)` rompe en `.normalize()` — se vio en
          // la práctica al abrir "Nueva noticia" sin haber tipeado nada
          // todavía.
          titulo: '',
          slug: '',
          categoria: 'mercado',
          fecha_publicacion: new Date().toISOString().slice(0, 10),
          publicado: false,
        },
  });

  const titulo = useWatch({ control, name: 'titulo' });
  const registroSlug = register('slug');

  useEffect(() => {
    if (slugTocado) return;
    setValue('slug', generarSlug(titulo), { shouldValidate: false });
  }, [titulo, slugTocado, setValue]);

  async function alEnviar(datos: NoticiaFormulario) {
    setErrorGeneral(null);
    const supabase = clienteNavegador();

    const slugFinal = await resolverSlugDisponible(supabase, datos.slug, noticiaExistente?.id);

    const datosAGuardar = {
      titulo: datos.titulo,
      slug: slugFinal,
      categoria: datos.categoria,
      cuerpo: datos.cuerpo,
      fecha_publicacion: datos.fecha_publicacion.toISOString(),
      publicado: datos.publicado,
    };

    if (noticiaExistente) {
      const { error } = await supabase
        .from('noticias')
        .update(datosAGuardar)
        .eq('id', noticiaExistente.id);

      if (error) {
        setErrorGeneral('No se pudo guardar la noticia. Intentá de nuevo.');
        return;
      }

      router.push('/noticias');
      router.refresh();
      return;
    }

    // Una noticia nueva no tiene id todavía, y la portada necesita uno (va
    // a R2 bajo `noticias/{noticia_id}/...`) — por eso el alta redirige a
    // editar en vez de al listado, para recién ahí habilitar la subida de
    // imagen. Mismo patrón que `apps/web/panel/formulario-campo.tsx`.
    const { data: nuevaNoticia, error } = await supabase
      .from('noticias')
      .insert(datosAGuardar)
      .select('id')
      .single();

    if (error) {
      setErrorGeneral('No se pudo guardar la noticia. Intentá de nuevo.');
      return;
    }

    router.push(`/noticias/${nuevaNoticia.id}/editar`);
    router.refresh();
  }

  async function alEliminar() {
    if (!noticiaExistente) return;
    if (!window.confirm('¿Eliminar esta noticia? No se puede deshacer.')) return;

    const { error } = await clienteNavegador()
      .from('noticias')
      .delete()
      .eq('id', noticiaExistente.id);

    if (error) {
      setErrorGeneral('No se pudo eliminar la noticia. Intentá de nuevo.');
      return;
    }

    router.push('/noticias');
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(alEnviar)(event)}
      className="mt-6 flex flex-col gap-4"
    >
      <FormField
        label="Título"
        type="text"
        error={errors.titulo?.message}
        {...register('titulo')}
      />

      <FormField
        label="Slug (URL)"
        type="text"
        error={errors.slug?.message}
        {...registroSlug}
        onChange={(event) => {
          setSlugTocado(true);
          void registroSlug.onChange(event);
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect label="Categoría" error={errors.categoria?.message} {...register('categoria')}>
          {CATEGORIAS_NOTICIA.map((categoria) => (
            <option key={categoria} value={categoria}>
              {ETIQUETAS_CATEGORIA_NOTICIA[categoria]}
            </option>
          ))}
        </FormSelect>

        <FormField
          label="Fecha de publicación"
          type="date"
          error={errors.fecha_publicacion?.message}
          {...register('fecha_publicacion')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <FormTextarea
          label="Cuerpo"
          rows={12}
          error={errors.cuerpo?.message}
          {...register('cuerpo')}
        />
        <p className="text-sm text-neutral-800">
          Dejá una línea en blanco entre párrafos: así se separan al mostrarla. Texto plano, sin
          negrita ni links.
        </p>
      </div>

      {noticiaExistente && (
        <SubidaImagen
          noticiaId={noticiaExistente.id}
          imagenObjectKey={noticiaExistente.imagen_object_key}
        />
      )}

      <FormCheckbox label="Publicar esta noticia" {...register('publicado')} />

      {errorGeneral && <p className="text-danger text-sm">{errorGeneral}</p>}

      <div className="mt-2 flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar'}
        </Button>

        {noticiaExistente && (
          <button
            type="button"
            onClick={() => void alEliminar()}
            className="text-danger text-sm underline underline-offset-4"
          >
            Eliminar noticia
          </button>
        )}
      </div>
    </form>
  );
}
