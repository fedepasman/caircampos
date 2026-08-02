#!/usr/bin/env node
/**
 * Genera SQL con un lote de datos ficticios (40 socios, ~156 campos) para
 * probar el sitio con volumen sin depender de los datos reales de CAIR.
 *
 * Uso:
 *   node scripts/generar-lote-demo.mjs > lote-demo.sql
 *   node scripts/generar-lote-demo.mjs "campos/abc/foto1.png,campos/def/foto2.png" > lote-demo.sql
 *
 * El argumento opcional es una lista de object_key ya existentes en el
 * bucket de R2 (separados por coma) para asignarles fotos a los campos
 * ficticios por rotación. Sin argumento, los campos generados quedan sin
 * fotos (el sitio ya maneja ese caso con un placeholder, no rompe nada).
 *
 * Después, cargarlo con psql contra el destino que corresponda — ver la
 * sección "Datos de demo" de OPERACIONES.md para el flujo completo (local,
 * o un proyecto de Supabase aparte para no mezclar datos falsos con
 * producción).
 *
 * El UPDATE final que aprueba los campos es necesario porque el trigger
 * `antes_de_guardar_campo` (supabase/schemas/02_campos.sql) fuerza
 * `revisado_por_cair = 'pendiente'` en todo INSERT con `publicado = true` —
 * no hay forma de insertar un campo ya aprobado. El UPDATE no dispara el
 * trigger porque no cambia `publicado`.
 */

const nombresInmobiliaria = [
  'Campo Sur',
  'Estancias del Litoral',
  'Pampa Rural',
  'Tierras del Interior',
  'Rural Group',
  'Agro Inversiones',
  'Del Valle Propiedades',
  'Estancias Argentinas',
  'Sur Campos',
  'Norte Rural',
  'La Federal Rural',
  'Patagonia Agro',
  'Cuyo Rural',
  'Litoral Campos',
  'Interior Propiedades',
  'Rural Norte',
  'Agroestancias',
  'Campos y Estancias',
  'La Rural Inmobiliaria',
  'Tierra Fértil',
  'Rural Plus',
  'Estancias del Sur',
  'Agro Litoral',
  'Rural Consultores',
  'Campos del Este',
  'Rural Federal',
  'Estancias Premium',
  'Agro Sur',
  'Rural Centro',
  'Del Campo Propiedades',
  'Rural Oeste',
  'Estancias del Norte',
  'Agro Rural SRL',
  'Campos Unidos',
  'Rural Express',
  'Estancias Modernas',
  'Agro Total',
  'Rural Directo',
  'Campos Argentinos',
  'Rural Uruguay',
];

const ubicaciones = [
  {
    pais: 'Argentina',
    provincia: 'Buenos Aires',
    localidad: 'Pergamino',
    lat: -33.895,
    lng: -60.573,
  },
  {
    pais: 'Argentina',
    provincia: 'Buenos Aires',
    localidad: 'Bragado',
    lat: -35.119,
    lng: -60.494,
  },
  { pais: 'Argentina', provincia: 'Buenos Aires', localidad: 'Bolívar', lat: -36.23, lng: -61.114 },
  { pais: 'Argentina', provincia: 'Buenos Aires', localidad: 'Tandil', lat: -37.323, lng: -59.133 },
  { pais: 'Argentina', provincia: 'Buenos Aires', localidad: 'Azul', lat: -36.777, lng: -59.858 },
  {
    pais: 'Argentina',
    provincia: 'Buenos Aires',
    localidad: 'Necochea',
    lat: -38.554,
    lng: -58.739,
  },
  {
    pais: 'Argentina',
    provincia: 'Buenos Aires',
    localidad: 'Chivilcoy',
    lat: -34.897,
    lng: -60.017,
  },
  { pais: 'Argentina', provincia: 'Córdoba', localidad: 'Río Cuarto', lat: -33.13, lng: -64.349 },
  { pais: 'Argentina', provincia: 'Córdoba', localidad: 'Villa María', lat: -32.408, lng: -63.24 },
  { pais: 'Argentina', provincia: 'Córdoba', localidad: 'Marcos Juárez', lat: -32.7, lng: -62.106 },
  { pais: 'Argentina', provincia: 'Santa Fe', localidad: 'Rosario', lat: -32.947, lng: -60.639 },
  { pais: 'Argentina', provincia: 'Santa Fe', localidad: 'Rafaela', lat: -31.254, lng: -61.487 },
  {
    pais: 'Argentina',
    provincia: 'Santa Fe',
    localidad: 'Venado Tuerto',
    lat: -33.747,
    lng: -61.968,
  },
  { pais: 'Argentina', provincia: 'Entre Ríos', localidad: 'Paraná', lat: -31.732, lng: -60.529 },
  {
    pais: 'Argentina',
    provincia: 'Entre Ríos',
    localidad: 'Gualeguaychú',
    lat: -33.011,
    lng: -58.517,
  },
  {
    pais: 'Argentina',
    provincia: 'Entre Ríos',
    localidad: 'Concordia',
    lat: -31.393,
    lng: -58.021,
  },
  { pais: 'Argentina', provincia: 'La Pampa', localidad: 'Santa Rosa', lat: -36.619, lng: -64.291 },
  {
    pais: 'Argentina',
    provincia: 'La Pampa',
    localidad: 'General Pico',
    lat: -35.656,
    lng: -63.756,
  },
  {
    pais: 'Argentina',
    provincia: 'San Luis',
    localidad: 'Villa Mercedes',
    lat: -33.678,
    lng: -65.46,
  },
  { pais: 'Argentina', provincia: 'Chaco', localidad: 'Resistencia', lat: -27.451, lng: -58.986 },
  { pais: 'Argentina', provincia: 'Corrientes', localidad: 'Goya', lat: -29.14, lng: -59.263 },
  {
    pais: 'Argentina',
    provincia: 'Santiago del Estero',
    localidad: 'Santiago del Estero',
    lat: -27.783,
    lng: -64.264,
  },
  { pais: 'Uruguay', provincia: 'Canelones', localidad: 'Canelones', lat: -34.538, lng: -56.283 },
  {
    pais: 'Uruguay',
    provincia: 'Colonia',
    localidad: 'Colonia del Sacramento',
    lat: -34.472,
    lng: -57.841,
  },
  { pais: 'Uruguay', provincia: 'Soriano', localidad: 'Mercedes', lat: -33.265, lng: -58.033 },
  {
    pais: 'Uruguay',
    provincia: 'San José',
    localidad: 'San José de Mayo',
    lat: -34.338,
    lng: -56.712,
  },
  { pais: 'Uruguay', provincia: 'Florida', localidad: 'Florida', lat: -34.099, lng: -56.215 },
  { pais: 'Uruguay', provincia: 'Salto', localidad: 'Salto', lat: -31.388, lng: -57.961 },
  { pais: 'Uruguay', provincia: 'Paysandú', localidad: 'Paysandú', lat: -32.319, lng: -58.075 },
];

// `object_key` tiene que ser una ruta DENTRO del bucket de R2, nunca una URL
// completa: el cliente arma `${NEXT_PUBLIC_R2_PUBLIC_URL}/${object_key}` con
// una simple concatenación de string, sin ninguna rama para detectar una URL
// absoluta (confirmado leyendo apps/web/src — ver los cuatro puntos donde se
// arma ese template). Poner ahí una URL externa da un link roto tipo
// `https://<bucket>.r2.dev/https://otra-url...`.
//
// Sin credenciales de escritura de R2 (viven solo en la Edge Function
// `subir-foto-campo`, nunca en manos de quien corre este script) no hay forma
// de subir fotos nuevas al bucket. La única opción sin subir nada es
// reutilizar object_keys que ya existen físicamente ahí — los que dejaron
// los campos reales cargados hasta ahora. `--object-keys` recibe esa lista
// desde afuera para no hardcodear nada específico del bucket real en el
// script.
const fotosPlaceholder = process.argv[2] ? process.argv[2].split(',') : null;

const tipos = ['agricola', 'ganadero', 'mixto'];
const modalidades = ['venta', 'arrendamiento'];

function jitter(valor, rango) {
  return valor + (Math.random() - 0.5) * rango;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function escapar(texto) {
  return texto.replace(/'/g, "''");
}

let sql = 'begin;\n\n';
const totalSocios = 40;
const totalCamposObjetivo = 156;
let campoCount = 0;

for (let i = 0; i < totalSocios; i++) {
  const ubicacionSocio = pick(ubicaciones);
  const nombre = nombresInmobiliaria[i];
  // Arranca en 9000: CAIR tiene socios reales numerados en rangos bajos
  // (hasta ~486 hoy), así que un offset chico como 100 choca con números
  // reales apenas se cargan ambos en el mismo entorno.
  const nroSocio = 9000 + i;
  const telefono = `+54 9 11 ${4000 + i}-${1000 + i}`;
  const lat = jitter(ubicacionSocio.lat, 0.3);
  const lng = jitter(ubicacionSocio.lng, 0.3);

  sql += `insert into public.socios (nombre, nro_socio, telefono, pais, provincia, localidad, latitud, longitud, publicado)\n`;
  sql += `values ('${escapar(nombre)}', ${nroSocio}, '${telefono}', '${ubicacionSocio.pais}', '${escapar(ubicacionSocio.provincia)}', '${escapar(ubicacionSocio.localidad)}', ${lat}, ${lng}, true)\n`;
  sql += `returning id \\gset socio_${i}_\n\n`;

  const restantes = totalSocios - i;
  const restantesCampos = totalCamposObjetivo - campoCount;
  const camposParaEste =
    i === totalSocios - 1
      ? restantesCampos
      : Math.max(1, Math.round(restantesCampos / restantes) + (Math.random() > 0.5 ? 1 : -1));

  for (let j = 0; j < camposParaEste; j++) {
    const ubicacionCampo = pick(ubicaciones);
    const tipo = pick(tipos);
    const modalidad = pick(modalidades);
    const hectareas = Math.round((20 + Math.random() * 980) * 10) / 10;
    const conPrecio = Math.random() > 0.15;
    const precio = conPrecio ? Math.round(hectareas * (1500 + Math.random() * 4000)) : null;
    const titulo = `Campo ${tipo === 'ganadero' ? 'ganadero' : tipo === 'agricola' ? 'agrícola' : 'mixto'} en ${ubicacionCampo.localidad}, ${hectareas} ha`;
    const descripcion = `Campo ${tipo} de ${hectareas} hectáreas en ${ubicacionCampo.localidad}, ${ubicacionCampo.provincia}. ${modalidad === 'venta' ? 'En venta' : 'En arrendamiento'}.`;
    const latC = jitter(ubicacionCampo.lat, 0.4);
    const lngC = jitter(ubicacionCampo.lng, 0.4);

    sql += `insert into public.campos (socio_id, titulo, descripcion, hectareas, precio_usd, pais, provincia, localidad, modalidad, tipo_campo, latitud, longitud, publicado, revisado_por_cair)\n`;
    sql += `values (:'socio_${i}_id', '${escapar(titulo)}', '${escapar(descripcion)}', ${hectareas}, ${precio ?? 'null'}, '${ubicacionCampo.pais}', '${escapar(ubicacionCampo.provincia)}', '${escapar(ubicacionCampo.localidad)}', '${modalidad}', '${tipo}', ${latC}, ${lngC}, true, 'aprobado')\n`;
    sql += `returning id \\gset campo_${i}_${j}_\n\n`;
    if (fotosPlaceholder) {
      // La galería de la ficha (apps/web/.../campos/[id]/page.tsx) muestra
      // hasta 3 fotos en su layout de grilla — con solo 1 se ve incompleta
      // (dos huecos vacíos a la derecha). Tres por campo, no necesariamente
      // distintas entre sí si `fotosPlaceholder` tiene menos de 3 opciones.
      for (let orden = 0; orden < 3; orden++) {
        sql += `insert into public.campo_fotos (campo_id, object_key, orden)\n`;
        sql += `values (:'campo_${i}_${j}_id', '${escapar(pick(fotosPlaceholder))}', ${orden});\n\n`;
      }
    }
    campoCount++;
  }
}

sql += `-- total campos generados: ${campoCount}\n`;
// Ver nota en el encabezado: el trigger fuerza 'pendiente' en el INSERT.
sql += `update public.campos set revisado_por_cair = 'aprobado' where revisado_por_cair = 'pendiente';\n\n`;
sql += 'commit;\n';

process.stdout.write(sql);
