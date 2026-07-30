#!/usr/bin/env node
/**
 * Verifica que las reglas propias de Semgrep sigan detectando lo que dicen.
 *
 * Una regla de seguridad que dejó de matchear no falla: simplemente no
 * encuentra nada, y el job de CI queda en verde dando una falsa sensación de
 * cobertura. Este script corre las reglas contra fixtures que violan cada una
 * a propósito, y falla si alguna no dispara.
 *
 * Los fixtures viven en .semgrep/fixtures/ con la estructura de directorios
 * real (apps/, supabase/), porque las reglas usan filtros `paths: include`.
 */
import { execFileSync } from 'node:child_process';

const REGLAS_ESPERADAS = [
  'cair-service-role-fuera-de-edge-functions',
  'cair-secreto-con-prefijo-publico',
  'cair-getsession-para-autorizar',
  'cair-almacenamiento-inseguro-de-sesion',
  'cair-vista-sin-security-invoker',
  'cair-politica-lee-user-metadata',
];

let salida;
try {
  salida = execFileSync(
    'semgrep',
    ['--config', '.semgrep/cair.yaml', '--json', '--quiet', '.semgrep/fixtures'],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
} catch (error) {
  // Semgrep sale con código distinto de cero cuando encuentra hallazgos, que
  // es justamente lo que se espera acá.
  salida = /** @type {{ stdout?: string }} */ (error).stdout ?? '';
}

const { results = [], errors = [] } = JSON.parse(salida);

if (errors.length > 0) {
  console.error('Semgrep reportó errores de configuración:');
  for (const e of errors) console.error(`  ${e.message ?? JSON.stringify(e)}`);
  process.exit(1);
}

const disparadas = new Set(results.map((r) => r.check_id.split('.').at(-1)));
const mudas = REGLAS_ESPERADAS.filter((r) => !disparadas.has(r));

for (const regla of REGLAS_ESPERADAS) {
  console.log(`  ${disparadas.has(regla) ? '✓' : '✗'} ${regla}`);
}

if (mudas.length > 0) {
  console.error(
    `\n${String(mudas.length)} regla(s) no detectaron su violación. Una regla que no matchea da falsa seguridad.`,
  );
  process.exit(1);
}

console.log(`\nLas ${String(REGLAS_ESPERADAS.length)} reglas detectan su violación.`);
