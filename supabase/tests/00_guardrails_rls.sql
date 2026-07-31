-- ═══════════════════════════════════════════════════════════════════════════
-- Guardrails de seguridad de la base
--
-- Estos tests no verifican ninguna regla de negocio: verifican que no se
-- pueda cometer, sin darse cuenta, ninguno de los errores que dejarían
-- expuestos los datos de contacto de los compradores.
--
-- El punto 9 del pliego de CAIR es una obligación contractual: los datos del
-- comprador los recibe únicamente el socio que publicó el campo, y CAIR solo
-- ve agregados. Estos guardrails convierten esa promesa en algo que rompe el
-- build, en lugar de algo que hay que recordar en cada revisión.
--
-- Son deliberadamente independientes del dominio: siguen valiendo sin
-- cambios cuando se agreguen las tablas reales.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

select plan(6);

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Toda tabla de `public` tiene RLS habilitada.
--
-- `public` se expone vía la Data API. Una tabla sin RLS ahí es legible por
-- cualquiera que tenga la clave publicable, que viaja en el bundle del sitio.
-- ───────────────────────────────────────────────────────────────────────────
select is_empty(
  $$
    select tablename
    from pg_tables
    where schemaname = 'public'
      and not rowsecurity
  $$,
  'Toda tabla de public debe tener RLS habilitada (alter table ... enable row level security)'
);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Toda vista de `public` es SECURITY INVOKER.
--
-- Por defecto una vista corre con los permisos de quien la creó y EVADE las
-- políticas RLS de las tablas que consulta. Es la trampa más peligrosa para
-- este proyecto: las vistas de estadísticas agregadas para CAIR leen de las
-- tablas de consultas, y sin security_invoker devolverían las filas de todos
-- los socios a cualquiera que consulte la vista.
-- ───────────────────────────────────────────────────────────────────────────
select is_empty(
  $$
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and coalesce(array_to_string(c.reloptions, ','), '') not ilike '%security_invoker=true%'
  $$,
  'Toda vista de public debe declararse with (security_invoker = true), o evade RLS'
);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Ninguna función SECURITY DEFINER de `public` es ejecutable por `anon`.
--
-- Postgres otorga EXECUTE a PUBLIC en toda función nueva por defecto, y
-- `anon` hereda de PUBLIC. Una función SECURITY DEFINER en `public` que
-- `anon` pudiera ejecutar sería, de hecho, un endpoint público anónimo que
-- corre con privilegios elevados y evade RLS.
--
-- Esto NO prohíbe toda función SECURITY DEFINER en public sin excepción:
-- hay una necesidad real que solo esto resuelve (ver
-- 05_estadisticas_cair.sql) — Postgres no tiene RLS a nivel de columna, así
-- que "CAIR ve el agregado de consultas pero no una fila cruda" no se puede
-- expresar con una política. Lo que sí es innegociable es que `anon` nunca
-- llegue a una de estas funciones, y que la propia función revise el rol de
-- quien llama por `app_metadata` antes de devolver nada.
-- ───────────────────────────────────────────────────────────────────────────
select is_empty(
  $$
    select p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  $$,
  'Ninguna función SECURITY DEFINER de public puede ser ejecutable por anon'
);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Ninguna política usa `user_metadata` para autorizar.
--
-- `raw_user_meta_data` lo edita el propio usuario y aparece en auth.jwt().
-- Una política que lea de ahí permite que cualquiera se declare admin o socio
-- y acceda a los datos de contacto de todos los compradores. Los datos de
-- autorización van en `app_metadata`, que el usuario no puede modificar.
-- ───────────────────────────────────────────────────────────────────────────
select is_empty(
  $$
    select polname
    from pg_policy
    where pg_get_expr(polqual, polrelid) ilike '%user_metadata%'
       or coalesce(pg_get_expr(polwithcheck, polrelid), '') ilike '%user_metadata%'
  $$,
  'Ninguna política RLS puede leer user_metadata: es editable por el usuario. Usar app_metadata'
);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Los roles de cliente no alcanzan el esquema `private`.
--
-- `private` es donde viven las funciones SECURITY DEFINER que las políticas
-- usan para lookups internos. Si `anon` o `authenticated` obtuvieran USAGE,
-- podrían invocarlas directamente y saltearse RLS.
--
-- Postgres ya deniega esto por defecto, pero el motor de diff descarta los
-- GRANT y REVOKE al generar migraciones: si alguien otorga el privilegio a
-- mano en producción, ningún archivo del repositorio lo delataría. Este test
-- es la única verificación real del invariante.
-- ───────────────────────────────────────────────────────────────────────────
select is_empty(
  $$
    select rolname
    from pg_roles
    where rolname in ('anon', 'authenticated')
      and has_schema_privilege(rolname, 'private', 'USAGE')
  $$,
  'Ni anon ni authenticated pueden tener USAGE sobre el esquema private'
);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. Ni `anon` ni `authenticated` tienen TRUNCATE, REFERENCES, TRIGGER o
--    MAINTAIN sobre ninguna tabla de `public`.
--
-- RLS controla filas, no privilegios de tabla: TRUNCATE en particular no lo
-- filtra ninguna política. Supabase otorga estos cuatro por defecto a toda
-- tabla nueva (ver supabase/schemas/00_extensions.sql); sin este guardrail,
-- una tabla nueva creada sin acordarse de revocarlos dejaría a `anon` con
-- permiso para vaciarla por completo.
-- ───────────────────────────────────────────────────────────────────────────
select is_empty(
  $$
    select table_name || ': ' || grantee || ' ' || privilege_type
    from information_schema.table_privileges
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated')
      and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
  $$,
  'Ni anon ni authenticated pueden tener TRUNCATE/REFERENCES/TRIGGER/MAINTAIN en ninguna tabla de public'
);

select * from finish();

rollback;
