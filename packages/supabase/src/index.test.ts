import { describe, expect, it, vi } from 'vitest';
import { crearClienteNavegador } from './browser.js';
import { crearClienteServidor } from './server.js';
import { crearClienteMovil } from './mobile.js';

const config = { url: 'http://127.0.0.1:54321', publishableKey: 'sb_publishable_test' };

describe('factories de cliente', () => {
  it('crea un cliente de navegador con auth y consultas disponibles', () => {
    const cliente = crearClienteNavegador(config);
    expect(cliente.auth).toBeDefined();
    expect(typeof cliente.from).toBe('function');
  });

  it('crea un cliente de servidor usando el adaptador de cookies inyectado', () => {
    const getAll = vi.fn(() => []);
    const cliente = crearClienteServidor(config, { getAll, setAll: vi.fn() });
    expect(cliente.auth).toBeDefined();
    expect(typeof cliente.from).toBe('function');
  });

  it('crea un cliente móvil apoyado en el almacenamiento seguro inyectado', () => {
    const almacenamiento = {
      getItem: vi.fn(() => Promise.resolve(null)),
      setItem: vi.fn(() => Promise.resolve()),
      removeItem: vi.fn(() => Promise.resolve()),
    };
    const cliente = crearClienteMovil(config, almacenamiento);
    expect(cliente.auth).toBeDefined();
  });

  it('devuelve instancias independientes en cada llamada', () => {
    // Los Server Components no pueden compartir cliente entre requests: si la
    // factory devolviera un singleton, la sesión se cruzaría entre usuarios.
    const a = crearClienteServidor(config, { getAll: () => [], setAll: () => undefined });
    const b = crearClienteServidor(config, { getAll: () => [], setAll: () => undefined });
    expect(a).not.toBe(b);
  });
});
