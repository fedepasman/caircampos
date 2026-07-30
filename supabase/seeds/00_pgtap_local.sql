-- Extensión de testing, SOLO para el entorno local.
--
-- Vive en un seed y no en el esquema declarativo a propósito: los seeds
-- corren en `supabase db reset` local, pero NO se aplican al proyecto remoto
-- con `supabase db push`. Así pgTAP está disponible para correr los tests sin
-- agregarle superficie de ataque a producción.

create extension if not exists pgtap with schema extensions;
