// @ts-check
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import { baseConfig, noAppImports, noServerSecretsInAppCode } from './base.js';

/**
 * Configuración para la app móvil (Expo).
 *
 * @param {{ tsconfigRootDir: string }} options
 */
export function reactNativeConfig({ tsconfigRootDir }) {
  return tseslint.config(...baseConfig({ tsconfigRootDir }), {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...noAppImports.patterns,
            {
              // Regla 3 — los componentes visuales NO se comparten entre
              // Next.js y React Native. `@cair/ui` son componentes de
              // shadcn/ui que dependen del DOM: importarlos acá rompe el
              // build de forma poco obvia. Lo que sí se comparte son los
              // tokens de diseño (`@cair/tokens`).
              group: ['@cair/ui', '@cair/ui/*'],
              message:
                'packages/ui es exclusivo de web y admin (depende del DOM). En móvil usá @cair/tokens y construí el componente nativo.',
            },
            {
              group: ['next', 'next/*'],
              message: 'La app móvil no puede depender de Next.js.',
            },
          ],
        },
      ],

      'no-restricted-syntax': ['error', ...noServerSecretsInAppCode],
    },
  });
}

/**
 * Configuración para los archivos que Metro exige en CommonJS.
 *
 * `metro.config.js` lo carga el bundler antes de que exista cualquier
 * transformación, así que tiene que ser CJS: usa `require`, `module.exports`
 * y `__dirname`. No es código de la app y no se le aplican sus reglas.
 */
export const configMetro = {
  files: ['metro.config.js', 'babel.config.js'],
  languageOptions: {
    sourceType: 'commonjs',
    globals: {
      require: 'readonly',
      module: 'writable',
      __dirname: 'readonly',
      process: 'readonly',
    },
  },
  rules: {
    '@typescript-eslint/no-require-imports': 'off',
    'no-undef': 'off',
  },
};
