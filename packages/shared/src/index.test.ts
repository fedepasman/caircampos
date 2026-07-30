import { describe, expect, it } from 'vitest';
import { assertNever, groupBy, isDefined, requireEnv } from './index.js';

describe('assertNever', () => {
  it('lanza al recibir un valor que el tipado daba por imposible', () => {
    const inesperado = 'forestal' as never;
    expect(() => assertNever(inesperado)).toThrow('Caso no contemplado');
  });
});

describe('isDefined', () => {
  it('descarta null y undefined conservando el resto', () => {
    const entrada = [1, null, 2, undefined, 0];
    expect(entrada.filter(isDefined)).toEqual([1, 2, 0]);
  });
});

describe('requireEnv', () => {
  it('devuelve el valor cuando está presente', () => {
    expect(requireEnv('X', 'valor')).toBe('valor');
  });

  it('falla cuando falta o viene vacía', () => {
    expect(() => requireEnv('MI_VAR', undefined)).toThrow('MI_VAR');
    expect(() => requireEnv('MI_VAR', '   ')).toThrow('MI_VAR');
  });

  it('señala la variable y dónde resolverla, porque el error puede terminar en un log', () => {
    try {
      requireEnv('SUPABASE_SECRET_KEY', '');
      expect.unreachable('debería haber lanzado');
    } catch (error) {
      const mensaje = (error as Error).message;
      expect(mensaje).toContain('SUPABASE_SECRET_KEY');
      expect(mensaje).toContain('.env.example');
    }
  });
});

describe('groupBy', () => {
  it('agrupa conservando el orden de aparición', () => {
    const resultado = groupBy(['ba', 'ab', 'bc'], (s) => s[0]);
    expect(resultado.get('b')).toEqual(['ba', 'bc']);
    expect(resultado.get('a')).toEqual(['ab']);
  });

  it('no colisiona con claves heredadas de Object.prototype', () => {
    // Devolver un Map en vez de un objeto es justamente para esto: con un
    // objeto plano, una clave '__proto__' proveniente de datos externos
    // corrompe el resultado.
    const resultado = groupBy(['x'], () => '__proto__');
    expect(resultado.get('__proto__')).toEqual(['x']);
    expect(resultado.size).toBe(1);
  });
});
