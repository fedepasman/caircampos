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
 * Identidad "Agro-Institutional Modernism": paleta y tipografía adoptadas
 * desde Base_Stitch/agro_institutional_modernism/DESIGN.md (comps de
 * referencia generados con Google Stitch, aprobados como dirección visual).
 * Ver /DESIGN.md en la raíz para el detalle completo y qué pantallas ya lo
 * usan.
 */

/** Paleta base. Cada escala va de 50 (más claro) a 950 (más oscuro). */
export const colors = {
  /**
   * Field Green — color de marca. Ancla en 300/700/900 tomada directo del
   * DESIGN.md de origen (primary-fixed-dim, primary-container, primary).
   */
  brand: {
    50: '#f1f7ed',
    100: '#dfeed3',
    200: '#c3dfb0',
    300: '#aed099',
    400: '#8ebd74',
    500: '#6ba04d',
    600: '#4a8030',
    700: '#2e4a20',
    800: '#223a18',
    900: '#18330c',
    950: '#0c1a06',
  },
  /**
   * Harvest Gold — resalte: "featured", botón de búsqueda, badges premium.
   * Ancla en 200/300/400/700/950 tomada directo del DESIGN.md de origen.
   */
  accent: {
    50: '#fefbea',
    100: '#fef3c3',
    200: '#fee171',
    300: '#e1c559',
    400: '#c8ae44',
    500: '#ab9236',
    600: '#8a7629',
    700: '#705d00',
    800: '#574800',
    900: '#3d3300',
    950: '#221b00',
  },
  /**
   * Grises de interfaz. Los 11 pasos son, en orden, los 11 roles de
   * superficie del DESIGN.md de origen (surface-container-lowest →
   * on-surface) — no hay valores inventados acá, esa escala ya venía
   * completa.
   */
  neutral: {
    50: '#ffffff',
    100: '#fcf9f8',
    200: '#f6f3f2',
    300: '#f0eded',
    400: '#eae7e7',
    500: '#e5e2e1',
    600: '#dcd9d9',
    700: '#c3c8bb',
    800: '#74796e',
    900: '#43483f',
    950: '#1b1c1c',
  },
  /** Colores semánticos de estado. No vienen del comp: son para los estados de formulario del resto del proyecto. */
  success: '#2f6d38',
  warning: '#b45309',
  danger: '#b42318',
  info: '#175cd3',
} as const;

/**
 * Familias tipográficas. `display` es la serif institucional para títulos,
 * `body` la sans para UI y texto largo — la razón de esta pareja está en
 * /DESIGN.md. Se sirven con `next/font/google` en las apps (self-hosted),
 * no con un `<link>` a Google Fonts en runtime.
 */
export const fontFamily = {
  display: 'Libre Caslon Text',
  body: 'Hanken Grotesk',
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

/**
 * Radios de borde. Valores tomados del DESIGN.md de origen: "Soft" pero no
 * "pill" — cards, inputs y botones en 4px, imágenes grandes hasta 12px.
 */
export const radius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
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
  fontFamily,
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
