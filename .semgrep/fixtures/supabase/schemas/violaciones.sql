-- Fixture de verificación. NO es esquema del proyecto.

-- ruleid: cair-vista-sin-security-invoker
create view public.estadisticas as select count(*) from consultas;

-- ruleid: cair-politica-lee-user-metadata
create policy admin_todo on campos for select to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'admin');
