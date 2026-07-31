# 0005 — El rol del usuario vive en app_metadata

**Estado:** aceptada · **Fecha:** 2026-07-30

## Contexto

La plataforma tiene tres roles: socio, comprador y administrador de CAIR. Las
políticas RLS necesitan saber cuál es el del usuario que consulta.

Supabase Auth ofrece dos lugares para guardar datos de usuario en el JWT:
`user_metadata` y `app_metadata`.

## Decisión

**El rol va en `app_metadata`. Nunca en `user_metadata`.**

## Motivo

`raw_user_meta_data` lo puede editar el propio usuario, y aparece en
`auth.jwt()`. Una política que autorice leyendo de ahí permitiría que
cualquiera se declare administrador y acceda a los datos de contacto de todos
los compradores: exactamente lo que el punto 9 del pliego prohíbe.

`app_metadata` solo se puede modificar desde el servidor.

## Consecuencias

- Asignar o cambiar un rol es una operación de servidor, nunca del cliente.
- Los claims del JWT no se refrescan hasta que el token se renueva: un cambio
  de rol no es inmediato. Para operaciones sensibles, verificar contra la base
  y no solo contra el claim.
- Hay dos verificaciones automáticas: el guardrail 4 de
  `supabase/tests/00_guardrails_rls.sql` falla si alguna política lee
  `user_metadata`, y la regla `cair-politica-lee-user-metadata` de Semgrep lo
  detecta antes, sobre el SQL.
