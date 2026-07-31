# 0004 — Esquema declarativo estable, no el flujo pg-delta

**Estado:** aceptada · **Fecha:** 2026-07-30

## Contexto

El CLI de Supabase ofrece dos flujos declarativos:

1. **Estable** — `supabase/schemas/` declarado en `schema_paths`, con
   migraciones generadas por `supabase db diff -f`. Es el que documenta el
   skill `supabase`.
2. **pg-delta** — `supabase db schema declarative sync`, con los archivos en
   `./database`. El changelog del 2026-04-16 lo anuncia como **Public Alpha**.

## Decisión

El flujo estable.

## Motivo

No corresponde apoyar en un motor en alpha un proyecto cuya obligación
contractual central es la privacidad de datos. Un diff mal generado sobre
políticas RLS no se manifiesta como un error: se manifiesta como datos
visibles para quien no debía verlos.

## Consecuencias

- `supabase/schemas/` es la entrada; `supabase/migrations/` es salida generada
  que se versiona pero no se edita a mano.
- **El motor de diff descarta `GRANT` y `REVOKE`.** Se comprobó: un
  `revoke all on schema private` desapareció de la migración generada. Todo
  privilegio que dependa de esas sentencias se verifica con un test de pgTAP,
  no se da por aplicado.
- Revisar pg-delta cuando salga de alpha.
