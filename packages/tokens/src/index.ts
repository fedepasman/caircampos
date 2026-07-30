/**
 * Design tokens de CAIR.
 *
 * Este paquete es el ÚNICO elemento visual compartido entre Next.js y React
 * Native. Los componentes no se comparten (`packages/ui` es exclusivo de web
 * y admin); los valores crudos sí, y son los que garantizan que las tres
 * superficies se lean como el mismo producto.
 *
 * Consumo:
 *   - web / admin → se proyectan a variables CSS en el `@theme` de Tailwind 4
 *   - móvil       → se consumen directamente desde TypeScript
 *
 * ⚠️ VALORES PROVISORIOS. La identidad visual todavía no está definida: estos
 * son placeholders neutros que fijan la ESTRUCTURA de los tokens, no la marca.
 * Los reemplaza la etapa de diseño mediante el flujo `new-work` del skill
 * `impeccable`, que además produce DESIGN.md. No tratar estos colores como
 * decisiones de marca.
 */

/** Paleta base. Cada escala va de 50 (más claro) a 950 (más oscuro). */
export const colors = {
  /** Color de marca. Placeholder: verde neutro, por el dominio rural. */
  brand: {
    50: '#f2f8f2',
    100: '#e0efe0',
    200: '#c2dfc4',
    300: '#95c69a',
    400: '#63a66b',
    500: '#41894b',
    600: '#2f6d38',
    700: '#27572e',
    800: '#224628',
    900: '#1d3a23',
    950: '#0e2011',
  },
  /** Grises de interfaz: fondos, bordes y texto. */
  neutral: {
    50: '#f8f8f7',
    100: '#f0efed',
    200: '#e0dedb',
    300: '#c9c6c1',
    400: '#a5a19a',
    500: '#87837b',
    600: '#6e6a63',
    700: '#5a5651',
    800: '#4c4945',
    900: '#42403d',
    950: '#22201e',
  },
  /** Colores semánticos de estado. */
  success: '#2f6d38',
  warning: '#b45309',
  danger: '#b42318',
  info: '#175cd3',
} as const;

/**
 * Escala de espaciado en píxeles, con paso base de 4.
 * Se usa igual en CSS (`px`) y en React Native (unidades sin dimensión).
 */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

/** Radios de borde. */
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

/** Tamaños de fuente en píxeles. */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

/** Pesos tipográficos, como string para que sirvan en CSS y en RN. */
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/**
 * Puntos de corte responsivos, solo para web.
 * React Native no usa media queries: en móvil se resuelve por dimensiones.
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const tokens = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  breakpoints,
} as const;

export type Tokens = typeof tokens;
export type ColorScale = keyof typeof colors.brand;
export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
export type FontSizeKey = keyof typeof fontSize;
