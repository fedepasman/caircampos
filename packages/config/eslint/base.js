// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/** Artefactos de build: nunca se lintean. */
export const ignores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/.expo/**',
  '**/.turbo/**',
  '**/coverage/**',
];

/**
 * Reglas de dependencia entre paquetes del monorepo.
 *
 * Se implementan con `no-restricted-imports` en lugar de un plugin de
 * boundaries: las reglas a hacer cumplir son pocas y se expresan enteras acá,
 * sin sumar una dependencia ni una capa de configuración extra.
 *
 * Regla 1 — ningún `packages/*` importa de una app. Las apps son hojas del
 *           grafo; si un paquete necesita algo de una app, ese algo estaba
 *           mal ubicado.
 * Regla 2 — ninguna app importa de otra app. Lo compartido vive en packages.
 */
export const noAppImports = {
  patterns: [
    {
      group: [
        '@cair/web',
        '@cair/web/*',
        '@cair/admin',
        '@cair/admin/*',
        '@cair/mobile',
        '@cair/mobile/*',
      ],
      message:
        'Las apps son hojas del grafo de dependencias. Mové el código compartido a packages/ en vez de importarlo desde una app.',
    },
  ],
};

/**
 * Impide leer del entorno secretos que jamás deben resolverse en código de
 * cliente. La `service_role` key evade RLS por completo: filtrarla equivale a
 * publicar la base entera. Su único lugar legítimo es supabase/functions/.
 */
export const noServerSecretsInAppCode = [
  {
    selector:
      "MemberExpression[object.object.name='process'][object.property.name='env'][property.name=/^(SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|R2_SECRET_ACCESS_KEY|R2_ACCESS_KEY_ID|MAPBOX_DOWNLOAD_TOKEN|RESEND_API_KEY|SENTRY_AUTH_TOKEN)$/]",
    message:
      'Este secreto es de servidor y no puede leerse desde una app. Su lugar es una Edge Function (supabase/functions/). Ver la sección de seguridad de CLAUDE.md.',
  },
];

/**
 * Configuración base de TypeScript con reglas que requieren tipos.
 *
 * @param {{ tsconfigRootDir: string }} options
 *   `tsconfigRootDir` debe ser el directorio del paquete que consume la
 *   configuración, normalmente `import.meta.dirname`.
 */
export function baseConfig({ tsconfigRootDir }) {
  return tseslint.config(
    { ignores },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        'no-restricted-imports': ['error', noAppImports],

        // Las promesas sin await son la fuente más común de errores que se
        // pierden en silencio dentro de handlers de servidor.
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',

        // `any` invalida el tipado estricto que es un objetivo del proyecto.
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',

        // Separar imports de tipos permite que el bundler los elimine sin
        // ambigüedad; `verbatimModuleSyntax` lo exige.
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],

        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
    },
    // Los tests pueden ser más laxos con los tipos al construir fixtures.
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    // Los archivos de configuración en JS quedan fuera del `include` de los
    // tsconfig, así que el project service no puede resolverlos. Se lintean
    // sin información de tipos en vez de ensuciar el tsconfig de cada paquete.
    {
      files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
      extends: [tseslint.configs.disableTypeChecked],
    },
    // Debe ir último: apaga todo lo que colisione con Prettier.
    prettier,
  );
}
