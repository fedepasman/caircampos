-- Datos de prueba para validar el modelo mínimo de socios y campos.
--
-- SOLO LOCAL: los seeds no se aplican con `supabase db push`, así que esto
-- nunca llega al proyecto remoto. Sirve para tener algo que mostrar en
-- `pnpm --filter @cair/web dev` sin cargar nada a mano en Studio cada vez
-- que se corre `pnpm db:reset`.
--
-- Un campo queda sin publicar a propósito: sirve para confirmar a simple
-- vista que la política RLS pública lo excluye del mapa.
--
-- El email del socio de prueba (prueba_socio@cair.com, contraseña
-- password123) es el que se usa consistentemente para probar login en el
-- móvil desde hace semanas. Antes decía socio-prueba@cair.test: alguien lo
-- había creado a mano contra la base local en una sesión anterior (nunca
-- llegó a este archivo), así que cada `db:reset` lo borraba sin avisar y el
-- login "se rompía" sin motivo aparente. Cambiarlo acá, en el seed, es lo
-- que lo hace sobrevivir a cualquier reset futuro.

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
  'prueba_socio@cair.com',
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

insert into public.socios (
  id, usuario_id, nombre, nro_socio, telefono, provincia, localidad, latitud, longitud
) values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Inmobiliaria Rural de Prueba',
  1,
  '(011) 4444-5555',
  'Buenos Aires',
  'Pergamino',
  -33.8952,
  -60.5736
);

-- Sin `revisado_por_cair` en el insert: el trigger
-- `antes_de_guardar_campo` (02_campos.sql) fuerza 'pendiente' en todo
-- alta con `publicado = true`, así que ponerlo acá no serviría de nada —
-- los dos que deben quedar aprobados se actualizan aparte, más abajo (un
-- UPDATE que no toca `publicado` no dispara el reset del trigger).
insert into public.campos
  (socio_id, titulo, hectareas, precio_usd, provincia, localidad, modalidad, tipo_campo, latitud, longitud, publicado)
values
  (
    '22222222-2222-2222-2222-222222222222',
    'Campo mixto zona núcleo',
    350,
    850000,
    'Buenos Aires',
    'Pergamino',
    'venta',
    'mixto',
    -33.8969,
    -60.5731,
    true
  ),
  (
    -- Sin precio a propósito: prueba el estado "Consultar precio" en la
    -- ficha pública y en la landing de resultados.
    '22222222-2222-2222-2222-222222222222',
    'Campo agrícola sobre ruta',
    620,
    null,
    'Santa Fe',
    'Venado Tuerto',
    'arrendamiento',
    'agricola',
    -33.7489,
    -61.9672,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Campo ganadero, todavía sin publicar',
    480,
    620000,
    'Buenos Aires',
    'Pehuajó',
    'venta',
    'ganadero',
    -35.8058,
    -61.8912,
    false
  ),
  (
    -- Publicado y sin revisar todavía: el que le da contenido a la cola de
    -- moderación del panel de admin apenas se siembra la base.
    '22222222-2222-2222-2222-222222222222',
    'Fracción sobre ruta 8, a la espera de aprobación',
    900,
    1450000,
    'Córdoba',
    'Río Cuarto',
    'venta',
    'agricola',
    -33.1301,
    -64.3499,
    true
  );

update public.campos
set revisado_por_cair = 'aprobado'
where titulo in ('Campo mixto zona núcleo', 'Campo agrícola sobre ruta');
