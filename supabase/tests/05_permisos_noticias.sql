-- ═══════════════════════════════════════════════════════════════════════════
-- Permisos de la Data API para las noticias.
--
-- Mismo motivo que 03_permisos_campo_fotos.sql: verificar contra el
-- catálogo real, no asumir que lo que dice schemas/ quedó aplicado. Acá
-- además vale la pena confirmar el caso atípico de la tabla: `anon` SÍ
-- tiene SELECT (a diferencia de push_tokens/campo_fotos), porque las
-- noticias publicadas son de lectura pública.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

select plan(3);

-- anon puede leer (la sección pública del sitio), pero no escribir nada.
select ok(
  has_table_privilege('anon', 'public.noticias', 'SELECT')
    and not has_table_privilege('anon', 'public.noticias', 'INSERT')
    and not has_table_privilege('anon', 'public.noticias', 'UPDATE')
    and not has_table_privilege('anon', 'public.noticias', 'DELETE'),
  'anon debe poder SELECT pero no escribir sobre public.noticias'
);

-- authenticated tiene los cuatro privilegios a nivel de GRANT: no hay
-- ownership que filtrar (a diferencia de campos/socios), así que es RLS —no
-- el GRANT— lo que de verdad acota insert/update/delete a un admin. Eso se
-- prueba con las políticas, en la siguiente aserción.
select ok(
  has_table_privilege('authenticated', 'public.noticias', 'SELECT')
    and has_table_privilege('authenticated', 'public.noticias', 'INSERT')
    and has_table_privilege('authenticated', 'public.noticias', 'UPDATE')
    and has_table_privilege('authenticated', 'public.noticias', 'DELETE'),
  'authenticated debe tener SELECT/INSERT/UPDATE/DELETE sobre public.noticias (acotado por RLS a admin)'
);

-- Exactamente las 4 políticas esperadas, con sus roles. La de select trae
-- {anon,authenticated} juntos a propósito: acá no hace falta separarlos
-- (ver el comentario en 09_noticias.sql sobre por qué).
select set_eq(
  $$
    select policyname, roles::text
    from pg_policies
    where schemaname = 'public' and tablename = 'noticias'
  $$,
  $$
    values
      ('Cualquiera ve las noticias publicadas, CAIR ve todas', '{anon,authenticated}'),
      ('CAIR da de alta noticias', '{authenticated}'),
      ('CAIR edita las noticias', '{authenticated}'),
      ('CAIR borra las noticias', '{authenticated}')
  $$,
  'public.noticias debe tener exactamente las 4 políticas esperadas, con sus roles'
);

select * from finish();

rollback;
