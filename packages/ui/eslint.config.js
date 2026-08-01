import reactHooks from 'eslint-plugin-react-hooks';
import { baseConfig } from '@cair/config/eslint/base';

// A diferencia del resto de `packages/*` (código sin hooks de React), este
// paquete sí tiene componentes con hooks (ver SelectorUbicacion.tsx) — de
// ahí el plugin extra, que las apps de Next.js ya traen vía
// `@cair/config/eslint/next.js`.
export default [
  ...baseConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
];
