import { describe, expect, it } from 'vitest';
import { generarSlug } from './slug';

describe('generarSlug', () => {
  it('pasa a minúsculas y separa palabras con guiones', () => {
    expect(generarSlug('Perspectivas del valor de la tierra')).toBe(
      'perspectivas-del-valor-de-la-tierra',
    );
  });

  it('saca acentos y otros signos diacríticos', () => {
    expect(generarSlug('Actualización sobre régimen impositivo')).toBe(
      'actualizacion-sobre-regimen-impositivo',
    );
  });

  it('reemplaza cualquier caracter que no sea letra o número por un guion', () => {
    expect(generarSlug('¿Cómo afecta la sequía al precio/hectárea?')).toBe(
      'como-afecta-la-sequia-al-precio-hectarea',
    );
  });

  it('colapsa guiones repetidos en uno solo', () => {
    expect(generarSlug('Mercado  --  en alza')).toBe('mercado-en-alza');
  });

  it('no deja guiones al principio ni al final', () => {
    expect(generarSlug('  -Eventos 2026-  ')).toBe('eventos-2026');
  });
});
