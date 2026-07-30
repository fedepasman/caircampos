import { baseConfig } from '@cair/config/eslint/base';

export default [
  {
    // Archivo generado por `supabase gen types typescript`. Su forma la decide
    // el CLI, no nosotros: lintearlo obligaría a editar a mano un archivo que
    // se sobrescribe en cada regeneración.
    ignores: ['src/database.types.ts'],
  },
  ...baseConfig({ tsconfigRootDir: import.meta.dirname }),
];
