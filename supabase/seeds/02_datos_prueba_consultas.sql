-- Datos de prueba para validar el mecanismo de privacidad del punto 9.
--
-- SOLO LOCAL. Un comprador que consulta por uno de los campos sembrados en
-- 01_datos_prueba.sql, para poder verificar con JWTs reales que el socio
-- dueño la ve, el comprador la ve, y nadie más.

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
  '33333333-3333-3333-3333-333333333333',
  'authenticated',
  'authenticated',
  'comprador-prueba@cair.test',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"], "rol": "comprador"}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into public.compradores (id, usuario_id, nombre, apellido, telefono) values (
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  'Compradora',
  'De Prueba',
  '+54 9 11 5555-5555'
);

insert into public.consultas (campo_id, comprador_id, mensaje)
select id, '44444444-4444-4444-4444-444444444444', 'Hola, me interesa este campo. ¿Sigue disponible?'
from public.campos
where titulo = 'Campo mixto zona núcleo';

-- Dos usuarios más, solo para probar los casos negativos del mecanismo de
-- privacidad: un admin (para la RPC de estadísticas) y un autenticado
-- cualquiera sin relación con el campo ni la consulta (debe ver cero filas).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '55555555-5555-5555-5555-555555555555',
  'authenticated',
  'authenticated',
  'admin-prueba@cair.test',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"], "rol": "admin"}',
  '{}',
  now(),
  now(),
  '', '', '', ''
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '66666666-6666-6666-6666-666666666666',
  'authenticated',
  'authenticated',
  'otro-usuario-prueba@cair.test',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '', '', '', ''
);
