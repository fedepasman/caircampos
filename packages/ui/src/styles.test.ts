import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { colors, fontFamily, radius } from '@cair/tokens';

/**
 * Tailwind 4 se configura con CSS y no puede leer un objeto de TypeScript en
 * tiempo de build, así que los tokens están escritos dos veces: en
 * `@cair/tokens` (fuente de verdad, compartida con la app móvil) y en
 * `styles.css`.
 *
 * Este test es lo que evita que esa duplicación se convierta en deriva. Sin
 * él, un color cambiado en un solo lado haría que web y móvil se vieran
 * distintos sin que nada falle.
 */

const css = readFileSync(join(import.meta.dirname, 'styles.css'), 'utf8');

function variableCss(nombre: string): string | undefined {
  return new RegExp(`--${nombre}:\\s*([^;]+);`).exec(css)?.[1]?.trim();
}

describe('paridad entre @cair/tokens y el @theme de Tailwind', () => {
  it('replica la escala de marca completa', () => {
    for (const [paso, valor] of Object.entries(colors.brand)) {
      expect(variableCss(`color-brand-${paso}`), `--color-brand-${paso}`).toBe(valor);
    }
  });

  it('replica la escala de acento completa', () => {
    for (const [paso, valor] of Object.entries(colors.accent)) {
      expect(variableCss(`color-accent-${paso}`), `--color-accent-${paso}`).toBe(valor);
    }
  });

  it('replica la escala neutra completa', () => {
    for (const [paso, valor] of Object.entries(colors.neutral)) {
      expect(variableCss(`color-neutral-${paso}`), `--color-neutral-${paso}`).toBe(valor);
    }
  });

  it('replica las familias tipográficas: la variable de next/font primero, el nombre literal como fallback', () => {
    expect(variableCss('font-display')).toBe(
      `var(--font-libre-caslon-text), '${fontFamily.display}', serif`,
    );
    expect(variableCss('font-body')).toBe(`var(--font-hanken-grotesk), '${fontFamily.body}', sans-serif`);
  });

  it('replica los colores semánticos', () => {
    expect(variableCss('color-success')).toBe(colors.success);
    expect(variableCss('color-warning')).toBe(colors.warning);
    expect(variableCss('color-danger')).toBe(colors.danger);
    expect(variableCss('color-info')).toBe(colors.info);
  });

  it('replica los radios, con la unidad px que exige CSS', () => {
    for (const clave of ['sm', 'md', 'lg', 'xl'] as const) {
      expect(variableCss(`radius-${clave}`)).toBe(`${String(radius[clave])}px`);
    }
  });

  it('importa Tailwind, sin lo cual el @theme no se aplica', () => {
    expect(css).toContain("@import 'tailwindcss'");
  });
});
