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
      // `packages/ui` contiene componentes de shadcn/ui pensados para el DOM.
      // No debe existir en el árbol de imports de la app móvil, pero sí puede
      // usarse libremente acá: la restricción vive en la config de RN.
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        globals: {
          React: 'readonly',
        },
      },
    },
  );
}
