import { describe, expect, it } from 'vitest';
import { parseOrThrow, validar, z } from './index.js';

const esquema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  hectareas: z.number().positive('Debe ser mayor a cero'),
});

describe('validar', () => {
  it('devuelve los datos parseados cuando la entrada es válida', () => {
    const resultado = validar(esquema, { nombre: 'Campo', hectareas: 120 });
    expect(resultado).toEqual({ ok: true, data: { nombre: 'Campo', hectareas: 120 } });
  });

  it('agrupa los errores por campo, que es lo que necesita un formulario', () => {
    const resultado = validar(esquema, { nombre: '', hectareas: -1 });
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores.nombre).toContain('Requerido');
    expect(resultado.errores.hectareas).toContain('Debe ser mayor a cero');
  });

  it('rechaza entradas de tipo inesperado sin lanzar', () => {
    // El borde recibe `unknown`: null, string o array no deben romper.
    for (const entrada of [null, 'texto', [], 42]) {
      expect(validar(esquema, entrada).ok).toBe(false);
    }
  });
});

describe('parseOrThrow', () => {
  it('devuelve los datos cuando la entrada es válida', () => {
    expect(parseOrThrow(esquema, { nombre: 'Campo', hectareas: 5 }, 'test')).toEqual({
      nombre: 'Campo',
      hectareas: 5,
    });
  });

  it('incluye el contexto en el error para que sea diagnosticable desde un log', () => {
    expect(() => parseOrThrow(esquema, {}, 'respuesta de R2')).toThrow('respuesta de R2');
  });
});
