const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const raizApp = __dirname;
const raizMonorepo = path.resolve(raizApp, '../..');

const config = getDefaultConfig(raizApp);

/*
 * Configuración de Metro para monorepo con pnpm.
 *
 * Sin esto la app no compila. Metro, por defecto, solo mira dentro de la
 * carpeta de la app, y en este repositorio los paquetes compartidos viven
 * fuera y llegan por enlaces simbólicos que pnpm crea.
 */

// 1. Observar todo el monorepo, para que un cambio en packages/* recargue.
config.watchFolders = [raizMonorepo];

// 2. Resolver dependencias en la app y también en la raíz. pnpm no aplana el
//    árbol: las dependencias transitivas viven en node_modules/.pnpm y hay que
//    darle a Metro las dos rutas para que las encuentre.
config.resolver.nodeModulesPaths = [
  path.resolve(raizApp, 'node_modules'),
  path.resolve(raizMonorepo, 'node_modules'),
];

// 3. Seguir los enlaces simbólicos hasta su destino real. Sin esto Metro trata
//    cada paquete del workspace como una copia distinta y termina con dos
//    instancias de React, que falla con el error "invalid hook call".
config.resolver.unstable_enableSymlinks = true;

// 4. Respetar el campo `exports` de package.json, que es como los paquetes de
//    este repositorio declaran sus subpaths (@cair/supabase/mobile).
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
