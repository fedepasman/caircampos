#!/usr/bin/env node
/**
 * Importa los socios reales de CAIR desde borrar/socios_cair.json,
 * geocodificando cada localidad y emitiendo el SQL de inserción.
 *
 * `borrar/` nunca se commitea (contiene datos reales de contacto de las
 * inmobiliarias) — este script sí, porque no contiene el dato en sí, solo
 * el proceso para cargarlo. Sin ese archivo en tu máquina, el script no
 * tiene nada que leer.
 *
 * Uso:
 *   node scripts/importar-socios-cair.mjs > lote-socios-cair.sql
 *   docker exec -i supabase_db_CAIR psql -U postgres -d postgres < lote-socios-cair.sql
 *
 * Geocodificación:
 * - CABA: centroide de la Ciudad Autónoma vía /provincias (Georef no separa
 *   "localidades" ahí, y buscar "CABA" como localidad matchea cosas raras
 *   por texto parecido, ej. "Caballito").
 * - Provincias de Uruguay (aparecen como "MONTEVIDEO / URUGUAY", etc. en el
 *   dato de origen): sin API de Georef equivalente disponible acá, se usa
 *   una tabla chica de centroides de departamento a mano.
 * - Resto (Argentina continental): /localidades de la API de Georef
 *   (apis.datos.gob.ar), con /provincias como respaldo si no matchea nada
 *   a nivel localidad.
 *
 * Los que no se puedan geocodificar quedan con latitud/longitud null — es
 * un campo opcional en `socios` (a diferencia de `campos`, donde sí es
 * obligatorio), así que no bloquea la carga.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rutaJson = path.join(__dirname, '..', 'borrar', 'socios_cair.json');

const socios = JSON.parse(readFileSync(rutaJson, 'utf-8'));

const centroidesUruguay = {
  MONTEVIDEO: { lat: -34.9011, lng: -56.1645 },
  'CERRO LARGO': { lat: -32.3667, lng: -54.1833 },
  MALDONADO: { lat: -34.9, lng: -54.95 },
  COLONIA: { lat: -34.4722, lng: -57.8411 },
  SORIANO: { lat: -33.2422, lng: -58.0342 },
  'SAN JOSÉ': { lat: -34.3382, lng: -56.7117 },
  FLORIDA: { lat: -34.0993, lng: -56.2153 },
  SALTO: { lat: -31.3833, lng: -57.9667 },
  PAYSANDÚ: { lat: -32.3214, lng: -58.075 },
};

function escapar(texto) {
  return String(texto).replace(/'/g, "''");
}

async function geocodificarCaba() {
  const resp = await fetch(
    'https://apis.datos.gob.ar/georef/api/provincias?nombre=Ciudad%20Autonoma&campos=centroide',
  );
  const data = await resp.json();
  const provincia = data.provincias?.[0];
  return provincia ? { lat: provincia.centroide.lat, lng: provincia.centroide.lon } : null;
}

async function geocodificarArgentina(provincia, localidad) {
  const params = new URLSearchParams({
    provincia,
    nombre: localidad,
    campos: 'centroide',
    max: '1',
  });
  const resp = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?${params}`);
  const data = await resp.json();
  const encontrada = data.localidades?.[0];
  if (encontrada) return { lat: encontrada.centroide.lat, lng: encontrada.centroide.lon };

  // Respaldo: sin esa localidad puntual, centroide de la provincia entera.
  const paramsProvincia = new URLSearchParams({ nombre: provincia, campos: 'centroide', max: '1' });
  const respProvincia = await fetch(
    `https://apis.datos.gob.ar/georef/api/provincias?${paramsProvincia}`,
  );
  const dataProvincia = await respProvincia.json();
  const provinciaEncontrada = dataProvincia.provincias?.[0];
  return provinciaEncontrada
    ? { lat: provinciaEncontrada.centroide.lat, lng: provinciaEncontrada.centroide.lon }
    : null;
}

function departamentoUruguayo(provinciaCruda) {
  // El dato de origen trae "MONTEVIDEO / URUGUAY", "CERRO LARGO / URUGUAY", etc.
  const [depto] = provinciaCruda.split('/').map((parte) => parte.trim());
  return depto;
}

async function geocodificar(provinciaCruda, localidadCruda, cache) {
  const esUruguay = /URUGUAY/i.test(provinciaCruda);
  const clave = `${provinciaCruda}::${localidadCruda ?? ''}`;
  if (cache.has(clave)) return cache.get(clave);

  let resultado = null;
  try {
    if (esUruguay) {
      const depto = departamentoUruguayo(provinciaCruda);
      resultado = centroidesUruguay[depto.toUpperCase()] ?? null;
    } else if (provinciaCruda.trim().toUpperCase() === 'CABA') {
      resultado = await geocodificarCaba();
    } else if (localidadCruda) {
      resultado = await geocodificarArgentina(provinciaCruda, localidadCruda);
      // Cortesía con la API pública: no bombardearla sin pausa.
      await new Promise((r) => setTimeout(r, 120));
    }
  } catch {
    resultado = null;
  }

  cache.set(clave, resultado);
  return resultado;
}

async function main() {
  const cache = new Map();
  const filas = [];
  let geocodificados = 0;

  for (const socio of socios) {
    const provinciaCruda = (socio.provincia ?? '').trim();
    const localidadCruda = (socio.localidad ?? '').trim() || null;
    const esUruguay = /URUGUAY/i.test(provinciaCruda);
    const pais = esUruguay ? 'Uruguay' : 'Argentina';
    const provinciaLimpia = esUruguay ? departamentoUruguayo(provinciaCruda) : provinciaCruda;

    const coords = await geocodificar(provinciaCruda, localidadCruda, cache);
    if (coords) geocodificados++;

    filas.push({
      nombre: socio.nombre,
      nro_socio: socio.nro_socio,
      telefono: socio.telefono ?? null,
      pais,
      provincia: provinciaLimpia,
      localidad: localidadCruda,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });

    process.stderr.write(
      `\r${filas.length}/${socios.length} procesados, ${geocodificados} geocodificados`,
    );
  }
  process.stderr.write('\n');

  let sql = 'begin;\n\n';
  for (const fila of filas) {
    sql += `insert into public.socios (nombre, nro_socio, telefono, pais, provincia, localidad, latitud, longitud, publicado)\n`;
    sql += `values ('${escapar(fila.nombre)}', ${fila.nro_socio}, ${fila.telefono ? `'${escapar(fila.telefono)}'` : 'null'}, '${fila.pais}', '${escapar(fila.provincia)}', ${fila.localidad ? `'${escapar(fila.localidad)}'` : 'null'}, ${fila.lat ?? 'null'}, ${fila.lng ?? 'null'}, true)\n`;
    sql += `on conflict (nro_socio) do nothing;\n\n`;
  }
  sql += `-- total socios: ${filas.length}, geocodificados: ${geocodificados}\n`;
  sql += 'commit;\n';

  process.stdout.write(sql);
}

main();
