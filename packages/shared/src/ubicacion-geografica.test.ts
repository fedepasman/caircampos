import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buscarLocalidadesUruguay,
  incluirValorActualSiFalta,
  obtenerDepartamentosUruguay,
  obtenerLocalidadesUruguay,
} from './ubicacion-geografica';

describe('obtenerDepartamentosUruguay', () => {
  it('devuelve los 19 departamentos, ordenados por nombre', () => {
    const departamentos = obtenerDepartamentosUruguay();
    expect(departamentos).toHaveLength(19);
    expect(departamentos.map((d) => d.nombre)).toEqual(
      [...departamentos.map((d) => d.nombre)].sort((a, b) => a.localeCompare(b, 'es')),
    );
  });

  it('cada departamento trae su centro como lat/lng', () => {
    const montevideo = obtenerDepartamentosUruguay().find((d) => d.nombre === 'Montevideo');
    expect(montevideo?.lat).toBeCloseTo(-34.9, 1);
    expect(montevideo?.lng).toBeCloseTo(-56.16, 1);
  });
});

describe('obtenerLocalidadesUruguay', () => {
  it('devuelve las localidades del departamento pedido', () => {
    const localidades = obtenerLocalidadesUruguay('Maldonado');
    expect(localidades.map((l) => l.nombre)).toContain('Punta del Este');
  });

  it('devuelve una lista vacía para un departamento que no existe', () => {
    expect(obtenerLocalidadesUruguay('Departamento Inexistente')).toEqual([]);
  });
});

describe('buscarLocalidadesUruguay', () => {
  it('encuentra una localidad exacta y marca país/provincia', () => {
    const resultados = buscarLocalidadesUruguay('Punta del Este');
    expect(resultados).toContainEqual(
      expect.objectContaining({
        nombre: 'Punta del Este',
        provincia: 'Maldonado',
        pais: 'Uruguay',
      }),
    );
  });

  it('ignora acentos y mayúsculas', () => {
    const resultados = buscarLocalidadesUruguay('MONTEVIDEO');
    expect(resultados.map((r) => r.nombre)).toContain('Montevideo');
  });

  it('matchea por substring, no solo desde el principio', () => {
    const resultados = buscarLocalidadesUruguay('este');
    expect(resultados.map((r) => r.nombre)).toContain('Punta del Este');
  });

  it('devuelve vacío para una query vacía o sin match', () => {
    expect(buscarLocalidadesUruguay('   ')).toEqual([]);
    expect(buscarLocalidadesUruguay('zzz-no-existe-zzz')).toEqual([]);
  });
});

describe('incluirValorActualSiFalta', () => {
  const opciones = [
    { id: '1', nombre: 'Pergamino' },
    { id: '2', nombre: 'Rosario' },
  ];

  it('no duplica un valor que ya está en las opciones (case-insensitive, con trim)', () => {
    expect(incluirValorActualSiFalta(opciones, '  pergamino  ')).toEqual(opciones);
  });

  it('agrega como primera opción un valor legacy que no matchea ninguna oficial', () => {
    const resultado = incluirValorActualSiFalta(opciones, 'CABA');
    expect(resultado[0]).toEqual({ id: 'CABA', nombre: 'CABA' });
    expect(resultado).toHaveLength(3);
  });

  it('no agrega nada si no hay valor actual', () => {
    expect(incluirValorActualSiFalta(opciones, undefined)).toEqual(opciones);
  });
});

describe('obtenerProvinciasArgentina / obtenerLocalidadesArgentina', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('valida y mapea el shape real de la API Georef', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          provincias: [
            { id: '06', nombre: 'Buenos Aires', centroide: { lat: -36.61, lon: -60.55 } },
          ],
        }),
    } as unknown as Response);

    const { obtenerProvinciasArgentina: obtenerFresco } = await import('./ubicacion-geografica.js');
    const provincias = await obtenerFresco();
    expect(provincias).toEqual([{ id: '06', nombre: 'Buenos Aires', lat: -36.61, lng: -60.55 }]);
  });

  it('rechaza si la respuesta no matchea el shape esperado', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ algo: 'inesperado' }),
    } as unknown as Response);

    const { obtenerProvinciasArgentina: obtenerFresco } = await import('./ubicacion-geografica.js');
    await expect(obtenerFresco()).rejects.toThrow();
  });

  it('no repite el fetch de localidades para la misma provincia', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () =>
        Promise.resolve({
          localidades: [{ id: '1', nombre: 'Pergamino', centroide: { lat: -33.9, lon: -60.57 } }],
        }),
    } as unknown as Response);

    const { obtenerLocalidadesArgentina: obtenerFresco } =
      await import('./ubicacion-geografica.js');
    await obtenerFresco('06');
    await obtenerFresco('06');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('buscarLocalidadesArgentina valida y mapea el shape con provincia embebida', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          localidades: [
            {
              id: '06623100',
              nombre: 'Pergamino',
              centroide: { lat: -33.89, lon: -60.57 },
              provincia: { id: '06', nombre: 'Buenos Aires' },
            },
          ],
        }),
    } as unknown as Response);

    const { buscarLocalidadesArgentina: buscarFresco } = await import('./ubicacion-geografica.js');
    const resultados = await buscarFresco('perga');
    expect(resultados).toEqual([
      {
        id: '06623100',
        nombre: 'Pergamino',
        lat: -33.89,
        lng: -60.57,
        provincia: 'Buenos Aires',
        pais: 'Argentina',
      },
    ]);
  });

  it('buscarLocalidadesArgentina no llama a fetch con una query vacía', async () => {
    const { buscarLocalidadesArgentina: buscarFresco } = await import('./ubicacion-geografica.js');
    expect(await buscarFresco('   ')).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
