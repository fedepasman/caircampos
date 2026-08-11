# CAIR — Checklist de lanzamiento a las stores

Auditoría de cumplimiento para Apple App Store y Google Play, hecha sobre
`apps/mobile` el 2026-08-05 (commit `116c61c7`, rama `feat/mobile-perfil`).
**Veredicto: `NO LISTA`.** Este archivo es la versión accionable de esa
auditoría — la idea es no tener que rehacerla desde cero: cada punto trae
archivo, criterio de aceptación y la regla oficial que lo exige.

**Regla de mantenimiento:** tildar `[x]` a medida que se resuelve cada punto.
Cuando un bloqueante se implementa, se borra la entrada completa (no se tacha
— la implementación queda en el código y en el historial de git). El archivo
entero se borra el día que se envía la primera versión a revisión.

Todo lo verificado acá se midió sobre un **APK debug local**
(`aapt dump badging`), no sobre el build de producción real — antes de enviar
hay que repetir la verificación de permisos sobre el AAB/IPA firmado.

---

## Bloqueantes — nada se envía sin esto

### 1. Eliminación de cuenta dentro de la app

Hoy `apps/mobile/src/app/(tabs)/perfil.tsx` solo tiene `signOut()` (cerrar
sesión). No existe ningún RPC, endpoint ni pantalla de baja de cuenta en todo
el repo.

Apple exige esto **aunque el alta la haga CAIR y no el propio socio** — la
FAQ de Apple sobre eliminación de cuenta es explícita en que la obligación
también cubre cuentas creadas automáticamente o por un tercero. Google exige
además un recurso **web** además del in-app.

- [ ] RPC en `private`/`public` (`security definer`, con `auth.uid()`
      chequeado en el cuerpo) que:
  - Borra o anonimiza la fila de `socios`.
  - Desvincula `socios.usuario_id`.
  - Borra los `push_tokens` del socio.
  - Llama a `auth.admin.deleteUser` (o marca al usuario para borrado
    asíncrono si hay que preservar `campos`/`consultas` ya publicados por
    retención legal — documentar cuál es esa retención y por qué).
- [ ] Pantalla en `perfil.tsx` que invoca el RPC con confirmación.
- [ ] Recurso **web** de eliminación (URL pública, fuera de la app) —
      Google lo pide como requisito separado del botón in-app.
- [ ] Test en `supabase/tests/` que confirma el borrado en cascada y la
      revocación de sesión (guardrail — romperlo a propósito una vez para
      confirmar que efectivamente falla, según el punto 10 de `CLAUDE.md`).

Fuente: `developer.apple.com/support/offering-account-deletion-in-your-app` ·
`support.google.com/googleplay/android-developer/answer/13327111`.

### 2. Política de privacidad

No existe ninguna página de privacidad ni de términos en `apps/web` ni en
`apps/mobile`. `PRODUCT.md` (líneas 111–120) ya la lista como requisito
conocido del pliego, pero nunca se implementó.

- [ ] Página nueva en `apps/web/src/app/(sitio)/` con URL pública y estable,
      que describa: los datos del inventario de abajo, sus finalidades, los
      terceros involucrados (Supabase, Cloudflare R2, Mapbox, servicio de
      push de Expo/Firebase) y el mecanismo de eliminación del punto 1.
  - Contenido legal: `MANUAL` — no lo resuelve una revisión de código, hace
    falta que alguien redacte o valide el texto.
- [ ] Enlace desde `apps/mobile/src/app/(tabs)/perfil.tsx`.
- [ ] Enlace desde el sitio web (footer o similar).

---

## Alto — antes de generar el build de producción

### 3. Permisos de Android sin uso real

Verificado con `aapt dump badging` sobre el manifiesto ya mergeado, no solo
el `AndroidManifest.xml` fuente:

| Permiso                                            | Lo agrega                                                                                                                                     | Por qué sobra                                                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`   | `@rnmapbox/maps` (declarado incondicionalmente en su propio manifest)                                                                         | `MapaUbicacion.tsx` nunca pide la ubicación del usuario, solo centra el mapa en coordenadas ya conocidas del campo |
| `CAMERA`                                           | `expo-image-picker` (ídem)                                                                                                                    | `SubidaFotos.tsx` solo llama `launchImageLibraryAsync` (galería), nunca `launchCameraAsync`                        |
| `RECORD_AUDIO`, `USE_BIOMETRIC`, `USE_FINGERPRINT` | Origen no confirmado en texto plano (no aparecen en los manifiestos de las dependencias directas revisadas — probablemente un AAR transitivo) | Ningún flujo de audio ni biometría en `apps/mobile/src`                                                            |

Google puede rechazar o sancionar por permiso peligroso sin caso de uso real.

- [ ] Suprimir `ACCESS_COARSE_LOCATION`/`ACCESS_FINE_LOCATION`/`CAMERA` con
      `tools:node="remove"` (vía un plugin de config en `app.config.ts`, o
      `expo-build-properties`).
- [ ] Confirmar que Mapbox sigue funcionando sin permiso de ubicación (el
      SDK solo lo necesita para el layer de "mostrar mi ubicación", que esta
      app no usa).
- [ ] Identificar el origen exacto de `RECORD_AUDIO`/`USE_BIOMETRIC`/
      `USE_FINGERPRINT` con `./gradlew :app:processDebugManifest --info` (el
      reporte de manifest merger no se generó en el build auditado) y
      suprimirlos si no hay caso de uso.
- [ ] Repetir `aapt dump badging` sobre el próximo APK/AAB y confirmar la
      ausencia de los cuatro.

### 4. Purpose strings de iOS genéricas y sin uso

`Info.plist` trae el texto por defecto de Expo, en inglés, para funciones que
la app no implementa: `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`,
`NSFaceIDUsageDescription` (Face ID no se usa — `almacenamiento-seguro.ts`
no configura `requireAuthentication` en `expo-secure-store`).

- [ ] Quitar esas tres claves en `ios.infoPlist` de `app.config.ts`, o
      reescribirlas en español y específicas si se planea implementar esas
      funciones (coherente con la que ya existe para fotos: _"CAIR necesita
      acceder a tus fotos para agregarlas a la publicación de un campo."_).

---

## Medio

### 5. Recuperación de contraseña en el login móvil

`apps/mobile/src/app/ingresar.tsx` no tiene "olvidé mi contraseña" ni enlace
al flujo que sí existe en `apps/web` (`recuperar-contrasena`). Un socio
bloqueado no tiene forma de recuperar acceso desde la app — riesgo también
para el equipo de revisión de las tiendas si la cuenta demo cambia de clave.

- [ ] Agregar enlace/flujo que dispare `resetPasswordForEmail` o abra el
      flujo web equivalente vía deep link.

### 6. Confirmar el entitlement de push en iOS

`apps/mobile/ios/CAIR/CAIR.entitlements` está vacío en el prebuild local
(sin `aps-environment`). El plugin `expo-notifications` sí lo inyecta al
correr `expo prebuild`/`eas build`, pero el árbol `ios/` en disco es un
artefacto gitignoreado de fecha desconocida — no confirmado con un build de
EAS real todavía.

- [ ] Verificar en el próximo `eas build --platform ios` que el `.ipa`
      resultante trae `aps-environment`, y que el App ID `ar.org.cair.app`
      tiene la capability de Push habilitada en las credenciales de EAS.
- [ ] Prueba de punta a punta contra un iPhone físico.

### 7. Completar Data Safety (Google) y App Privacy Details (Apple)

Viven en las consolas, no en el repo — usar el inventario de datos de abajo
como línea base. No completarlas hasta resolver los puntos 1–3 (declarar hoy
permisos que en verdad no se usan sería una inconsistencia).

- [ ] Play Console → Data Safety.
- [ ] App Store Connect → App Privacy Details.

### 8. Cuenta demo para el equipo de revisión

El login solo funciona con una cuenta de socio ya vinculada por CAIR — no
hay autorregistro (`supabase/schemas/01_socios.sql`, alta solo por admin).

- [ ] Preparar una cuenta persistente, con datos de prueba no sensibles
      (campos, consultas de ejemplo, sin PII real de compradores), y
      documentar las credenciales en las notas de revisión de ambas
      consolas.

---

## Antes de enviar (verificación sobre el build real)

Todo lo de arriba se auditó sobre un **APK debug**, no sobre el artefacto
que se sube a las tiendas.

- [ ] `eas build --profile production --platform all`.
- [ ] Repetir `aapt dump badging` sobre el AAB/APK de producción: confirmar
      la ausencia de los permisos removidos (punto 3) y de `SYSTEM_ALERT_WINDOW`
      (hoy presente solo por ser build debug, no debería aparecer en release).
- [ ] Confirmar `targetSdk 36` en el artefacto real (ya cumple el requisito
      vigente de Google, exigido desde el 31/08/2026 — verificado el
      2026-08-05, pero medido sobre el debug).
- [ ] Confirmar el entitlement de push en el `.ipa` (punto 6).

## Configuración manual en App Store Connect

- [ ] Cargar la URL de política de privacidad (punto 2).
- [ ] Completar App Privacy Details (punto 7).
- [ ] Habilitar la capability de Push Notifications en el App ID.
- [ ] Cargar credenciales de la cuenta demo en las notas de revisión (punto 8).
- [ ] Clasificación etaria y capturas actualizadas de la versión real.

## Configuración manual en Play Console

- [ ] Completar Data Safety (punto 7), después de remover los permisos sin uso.
- [ ] Cargar URL de política de privacidad y el recurso web de eliminación
      de cuenta (puntos 1 y 2).
- [ ] Declarar los permisos sensibles que queden, con su justificación real.
- [ ] Cargar credenciales de la cuenta demo (punto 8).

---

## Lo que ya está bien (no requiere acción)

- Sin SDKs de analítica, publicidad ni tracking — confirmado por grep
  (`sentry`, `analytics`, `IDFA`, `AdSupport`, `TrackingTransparency`) sin
  resultados en `apps/mobile/src`.
- `PrivacyInfo.xcprivacy` presente, con `NSPrivacyTracking = false` y
  `NSPrivacyCollectedDataTypes` vacío — coherente con no tener tracking.
- Sesión almacenada en Keychain/Keystore vía `expo-secure-store`, nunca en
  logs.
- Las publicaciones de campos ya pasan por moderación de CAIR
  (`revisado_por_cair`, `06_moderacion.sql`); las consultas son mensajes
  privados 1:1, no contenido público — no aplica moderación de UGC.
- No hay pagos, IAP ni suscripciones — no aplica StoreKit ni Play Billing.
- No hay login social — no aplica Sign in with Apple.

## Evidencia pendiente (no verificable desde el repo)

- `PrivacyInfo.xcprivacy` propio de `@rnmapbox/maps` (sus Pods están en
  `apps/mobile/ios/Pods/MapboxMaps`) — no se abrió para confirmar si aporta
  Required Reason APIs propias que deban mergearse.
- Validez operativa de `google-services.json` en disco (se confirmó que
  existe y su estructura, no su contenido ni si corresponde al proyecto de
  Firebase de producción).
- Todo lo que vive solo en App Store Connect / Play Console.

## Fuentes oficiales consultadas (2026-08-05)

- Apple, _App Review Guidelines_ (5.1.1(v), 4.2, 2.1(a)) —
  `developer.apple.com/app-store/review/guidelines/`
- Apple, _Offering Account Deletion in Your App_ —
  `developer.apple.com/support/offering-account-deletion-in-your-app/`
- Google, _Target API level requirements_ —
  `developer.android.com/google/play/requirements/target-sdk`
- Google Play Help, _Account Deletion Requirements_ —
  `support.google.com/googleplay/android-developer/answer/13327111`
- Google Play, _Developer Content Policy Center_ — `play.google/developer-content-policy/`
