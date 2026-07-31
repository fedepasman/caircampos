-- Datos de prueba para validar el modelo mínimo de socios y campos.
--
-- SOLO LOCAL: los seeds no se aplican con `supabase db push`, así que esto
-- nunca llega al proyecto remoto. Sirve para tener algo que mostrar en
-- `pnpm --filter @cair/web dev` sin cargar nada a mano en Studio cada vez
-- que se corre `pnpm db:reset`.
--
-- Un campo queda sin publicar a propósito: sirve para confirmar a simple
-- vista que la política RLS pública lo excluye del mapa.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'socio-prueba@cair.test',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"], "rol": "socio"}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into public.socios (id, usuario_id, nombre) values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Inmobiliaria Rural de Prueba'
);

insert into public.campos
  (socio_id, titulo, hectareas, provincia, localidad, latitud, longitud, publicado)
values
  (
    '22222222-2222-2222-2222-222222222222',
    'Campo mixto zona núcleo',
    350,
    'Buenos Aires',
    'Pergamino',
    -33.8969,
    -60.5731,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Campo agrícola sobre ruta',
    620,
    'Santa Fe',
    'Venado Tuerto',
    -33.7489,
    -61.9672,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Campo ganadero, todavía sin publicar',
    480,
    'Buenos Aires',
    'Pehuajó',
    -35.8058,
    -61.8912,
    false
  );
