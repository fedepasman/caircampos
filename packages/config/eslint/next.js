// @ts-check
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import { baseConfig, noAppImports, noServerSecretsInAppCode } from './base.js';

/**
 * Configuración para las apps Next.js (web y admin).
 *
 * @param {{ tsconfigRootDir: string }} options
 */
export function nextConfig({ tsconfigRootDir }) {
  return tseslint.config(
    ...baseConfig({ tsconfigRootDir }),
    {
      plugins: {
        '@next/next': nextPlugin,
        'react-hooks': reactHooks,
      },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs['core-web-vitals'].rules,
        ...reactHooks.configs.recommended.rules,

        'no-restricted-imports': ['error', noAppImports],
        'no-restricted-syntax': ['error', ...noServerSecretsInAppCode],
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        globals: {
          React: 'readonly',
        },
      },
    },
    {
      // La API de Next tipa `headers`, `redirects` y `rewrites` como funciones
      // que devuelven una promesa, así que hay que declararlas `async` aunque
      // no tengan ningún `await`. Acá `require-await` es un falso positivo.
      files: ['next.config.ts', 'next.config.mjs', 'next.config.js'],
      rules: {
        '@typescript-eslint/require-await': 'off',
      },
    },
  );
}
