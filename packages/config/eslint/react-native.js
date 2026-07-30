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
