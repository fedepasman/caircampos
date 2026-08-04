import type { ExpoConfig } from 'expo/config';

/**
 * Configuración de la app Expo.
 *
 * En TypeScript y no en app.json para poder leer variables de entorno y
 * derivar valores por perfil de build sin duplicar el archivo.
 *
 * Nota: `newArchEnabled` y `android.edgeToEdgeEnabled` ya no existen en el
 * tipo de SDK 57. No se quitaron por conveniencia: en esta versión la Nueva
 * Arquitectura de React Native es obligatoria y edge-to-edge es el
 * comportamiento por defecto, así que declararlos no tenía efecto.
 */
const config: ExpoConfig = {
  name: 'CAIR',
  slug: 'cair',
  version: '0.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',

  // Necesario para Supabase Auth: los enlaces de confirmación de mail y de
  // reset de contraseña vuelven a la app por deep link con este scheme.
  scheme: 'cair',

  ios: {
    supportsTablet: false,
    bundleIdentifier: 'ar.org.cair.app',
  },

  android: {
    package: 'ar.org.cair.app',
    // Necesario para que Android pueda inicializar Firebase Messaging y
    // recibir push — sin esto, expo-notifications falla en runtime con
    // "Default FirebaseApp is not initialized". No se commitea (mismo
    // criterio que cualquier archivo de credenciales): cada quien lo baja
    // de la consola de Firebase y lo coloca acá. Ver OPERACIONES.md.
    googleServicesFile: './google-services.json',
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        photosPermission:
          'CAIR necesita acceder a tus fotos para agregarlas a la publicación de un campo.',
      },
    ],
    // El token de descarga del SDK nativo (RNMAPBOX_MAPS_DOWNLOAD_TOKEN) se
    // pasa por variable de entorno al correr prebuild/build, no acá — la
    // opción de plugin equivalente está deprecada. Nunca se embebe en el
    // binario. Ver OPERACIONES.md.
    '@rnmapbox/maps',
    'expo-notifications',
  ],

  experiments: {
    // Genera tipos para las rutas: un enlace a una ruta inexistente rompe en
    // compilación en vez de fallar en el dispositivo.
    typedRoutes: true,
  },

  extra: {
    eas: {
      projectId: '491fb4d5-f983-4a5f-a6bf-b7bed28838b0',
    },
  },
  owner: 'fedepasman-team',
};

export default config;
