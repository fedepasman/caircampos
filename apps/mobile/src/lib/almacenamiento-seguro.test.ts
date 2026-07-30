import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `expo-secure-store` es un módulo nativo y no se puede cargar en Node, así
 * que se sustituye por un doble. Lo que se verifica no es el comportamiento
 * del Keychain —eso lo garantiza Expo— sino que el adaptador delegue en él y
 * no en otra cosa.
 *
 * Vale la pena testearlo porque el modo de fallo es silencioso: cambiar
 * SecureStore por AsyncStorage deja la app funcionando igual, pero pasa a
 * guardar el token de sesión en texto plano. En un dispositivo con root o
 * jailbreak, ese token da acceso a los datos de contacto de los compradores.
 */
const mockSecureStore = {
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
};

vi.mock('expo-secure-store', () => mockSecureStore);

const { almacenamientoSeguro } = await import('./almacenamiento-seguro');

describe('almacenamientoSeguro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lee delegando en el almacenamiento respaldado por hardware', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue('token');
    await expect(almacenamientoSeguro.getItem('sesion')).resolves.toBe('token');
    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('sesion');
  });

  it('escribe delegando en el almacenamiento respaldado por hardware', async () => {
    await almacenamientoSeguro.setItem('sesion', 'token');
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('sesion', 'token');
  });

  it('borra delegando en el almacenamiento respaldado por hardware', async () => {
    await almacenamientoSeguro.removeItem('sesion');
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('sesion');
  });

  it('devuelve null cuando la clave no existe, y no undefined', async () => {
    // supabase-js distingue los dos casos: con `undefined` interpreta que el
    // almacenamiento falló, no que no hay sesión, y reintenta en bucle.
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    await expect(almacenamientoSeguro.getItem('inexistente')).resolves.toBeNull();
  });
});
