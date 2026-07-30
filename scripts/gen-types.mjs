#!/usr/bin/env node
/**
 * Genera los tipos de TypeScript a partir del esquema de la base local.
 *
 * Envuelve a `supabase gen types` solo para anteponer un encabezado: el CLI
 * sobrescribe el archivo entero en cada corrida, así que cualquier aviso
 * escrito a mano se pierde. Sin el encabezado, el archivo parece código
 * común y termina editado a mano.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const DESTINO = 'packages/supabase/src/database.types.ts';

const ENCABEZADO = `/* eslint-disable */
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ARCHIVO GENERADO — NO EDITAR A MANO                                     ║
// ║                                                                          ║
// ║  Regenerar con:  pnpm db:types                                           ║
// ║                                                                          ║
// ║  CI verifica que esté al día con \`pnpm db:types:check\` y falla si quedó   ║
// ║  desincronizado del esquema. Editarlo a mano hace que el tipado mienta    ║
// ║  sobre la forma real de la base, que es peor que no tener tipos.          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

`;

const salida = execFileSync(
  'supabase',
  ['gen', 'types', 'typescript', '--local', '--schema', 'public'],
  { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
);

writeFileSync(DESTINO, ENCABEZADO + salida.trimStart());
console.log(`Tipos generados en ${DESTINO}`);
