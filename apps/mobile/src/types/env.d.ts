/**
 * Tipado de las variables de entorno de la app móvil.
 *
 * Ni React Native ni Expo declaran `process.env`, así que sin este archivo
 * resuelve a `any` y cada lectura entra al código sin ninguna verificación.
 *
 * Se declaran solo las variables que la app efectivamente usa, y todas como
 * `string | undefined`: Metro sustituye estas expresiones en tiempo de build,
 * y si la variable no estaba definida el resultado es `undefined`. Darlas por
 * `string` sería mentir, y es justo el error que hace que una URL faltante se
 * manifieste recién en una pantalla lejana.
 *
 * ⚠️ Solo variables EXPO_PUBLIC_. Quedan embebidas en el binario publicado en
 * las tiendas: cualquiera puede descomprimir el .ipa o el .apk y leerlas.
 * Ningún secreto va acá.
 */
declare const process: {
  readonly env: {
    readonly EXPO_PUBLIC_SUPABASE_URL: string | undefined;
    readonly EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string | undefined;
    readonly EXPO_PUBLIC_MAPBOX_TOKEN: string | undefined;
    readonly EXPO_PUBLIC_SENTRY_DSN: string | undefined;
    readonly NODE_ENV: 'development' | 'production' | 'test' | undefined;
  };
};
