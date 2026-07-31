import { describe, expect, it } from 'vitest';
import { breakpoints, colors, fontFamily, fontSize, radius, spacing, tokens } from './index.js';

describe('tokens', () => {
  it('expone todos los grupos bajo un objeto único', () => {
    expect(Object.keys(tokens).sort()).toEqual([
      'breakpoints',
      'colors',
      'fontFamily',
      'fontSize',
      'fontWeight',
      'radius',
      'spacing',
    ]);
  });

  it('define las escalas de color completas de 50 a 950', () => {
    const esperado = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    for (const escala of [colors.brand, colors.accent, colors.neutral]) {
      expect(Object.keys(escala).map(Number)).toEqual(esperado);
    }
  });

  it('usa colores hexadecimales de 6 dígitos en toda la paleta', () => {
    const hex = /^#[0-9a-f]{6}$/;
    const planos = [colors.success, colors.warning, colors.danger, colors.info];
    const escalas = [
      ...Object.values(colors.brand),
      ...Object.values(colors.accent),
      ...Object.values(colors.neutral),
    ];
    for (const valor of [...planos, ...escalas]) {
      expect(valor).toMatch(hex);
    }
  });

  it('define las dos familias tipográficas', () => {
    expect(fontFamily.display).toBe('Libre Caslon Text');
    expect(fontFamily.body).toBe('Hanken Grotesk');
  });

  it('mantiene el espaciado en múltiplos de 4', () => {
    for (const valor of Object.values(spacing)) {
      expect(valor % 4).toBe(0);
    }
  });

  it('entrega spacing, radius y fontSize como números, para que sirvan en React Native', () => {
    // En web se convierten a px; en RN se usan crudos. Si alguno se define
    // como string con unidad, el móvil rompe de forma poco evidente.
    for (const grupo of [spacing, radius, fontSize, breakpoints]) {
      for (const valor of Object.values(grupo)) {
        expect(typeof valor).toBe('number');
      }
    }
  });
});
