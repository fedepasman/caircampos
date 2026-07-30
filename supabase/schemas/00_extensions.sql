-- Extensiones de Postgres.
--
-- Este archivo es ENTRADA del flujo declarativo: describe el estado deseado.
-- Las migraciones de supabase/migrations/ se GENERAN a partir de acá con
-- `pnpm db:sync`. Nunca editar una migración a mano.
--
-- Las extensiones viven en el esquema `extensions`, no en `public`: `public`
-- está expuesto vía la Data API y no conviene sumarle superficie.
--
-- Sin cláusula `version`: desde 2026-08-05 Supabase la ignora e instala la
-- versión por defecto. Fijarla solo generaría una advertencia.

create schema if not exists extensions;

-- PostGIS: tipos y operadores geoespaciales. Es lo que permite resolver en la
-- base las búsquedas por zona y el clustering del mapa, en vez de traer todo
-- al cliente y filtrar ahí.
create extension if not exists postgis with schema extensions;

-- Esquema privado para funciones auxiliares de las políticas RLS.
--
-- Las funciones `SECURITY DEFINER` evaden RLS, y en `public` Postgres otorga
-- EXECUTE a PUBLIC por defecto: cualquier función de ayuda que viviera ahí
-- sería, de hecho, un endpoint público. Este esquema no se expone en la Data
-- API y los roles de cliente no tienen USAGE sobre él.
-- Postgres no otorga USAGE sobre un esquema nuevo a PUBLIC, así que `anon` y
-- `authenticated` quedan sin acceso sin necesidad de un REVOKE explícito.
--
-- No se agrega igual "por las dudas": el motor de diff no versiona GRANT ni
-- REVOKE, los descarta al generar la migración, y una sentencia que parece
-- estar aplicada pero no lo está es peor que no tenerla. La garantía se
-- verifica en supabase/tests/00_guardrails_rls.sql, que sí corre en CI.
create schema if not exists private;
