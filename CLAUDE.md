# CLAUDE.md

Reglas de trabajo del proyecto. Cómo se construye.

Qué se construye y para quién está en [PRODUCT.md](PRODUCT.md) — no se duplica acá.

---

## 1. Contexto en una línea

Plataforma de búsqueda y comercialización de campos de la Cámara Argentina de
Inmobiliarias Rurales: sitio público, panel administrativo y app nativa, sobre
un backend compartido.

**La restricción que ordena todo lo demás:** los datos de contacto de un
comprador los recibe únicamente el socio que publicó ese campo. CAIR ve solo
agregados. Es una obligación contractual, no una preferencia. Ante cualquier
duda de diseño, esa restricción gana.

---

## 2. Stack

Versiones fijadas en el catálogo de `pnpm-workspace.yaml`. **Al agregar una
dependencia, agregarla al catálogo y referenciarla con `catalog:`**, nunca
fijar una versión suelta en un `package.json`.

| Capa              | Tecnología                                                       |
| ----------------- | ---------------------------------------------------------------- |
| Monorepo          | pnpm 11 + workspaces + Turborepo 2                               |
| Lenguaje          | TypeScript 6.0.3, modo estricto                                  |
| Web y admin       | Next.js 16 (App Router, Turbopack), React 19.2.3, Tailwind CSS 4 |
| Móvil             | Expo SDK 57, React Native 0.86, Expo Router                      |
| Backend           | Supabase — PostgreSQL 17, Auth, RLS, PostGIS, Edge Functions     |
| Archivos          | Cloudflare R2, con URLs firmadas                                 |
| Mapas             | Mapbox GL (web) y `@rnmapbox/maps` (móvil)                       |
| Formularios       | React Hook Form + Zod 4                                          |
| Datos en cliente  | TanStack Query; TanStack Table en el admin                       |
| Email             | Resend                                                           |
| Observabilidad    | Sentry                                                           |
| Tests             | Vitest, pgTAP                                                    |
| Análisis estático | Semgrep                                                          |

**Region de Supabase: `sa-east-1` (São Paulo). No se puede cambiar** después de
creado el proyecto. Las funciones de Vercel van en `gru1`.

No se incorporan tecnologías nuevas sin justificación técnica explícita.

---

## 3. Estructura

```text
apps/
  web/       Sitio público. Indexable. SEO es un requisito contractual.
  admin/     Panel de CAIR. noindex, acceso restringido, dominio propio.
  mobile/    App Expo para iOS y Android.
packages/
  tokens/    Design tokens. Único puente visual entre web y móvil.
  ui/        Componentes de interfaz. SOLO web y admin: dependen del DOM.
  shared/    Utilidades puras, sin APIs de plataforma.
  schemas/   Zod. Fuente única de validación.
  supabase/  Tipos generados y factories de cliente.
  config/    tsconfig, ESLint y reglas de dependencia.
supabase/
  schemas/     ENTRADA: estado declarativo del esquema.
  migrations/  SALIDA generada. Nunca editar a mano.
  functions/   Edge Functions.
  tests/       pgTAP. Guardrails de seguridad.
  seeds/       Solo local; no se aplican con db push.
```

### Reglas de dependencia

Las hace cumplir ESLint (`packages/config/eslint/base.js`):

1. Ningún `packages/*` importa de una app. Las apps son hojas del grafo.
2. Ninguna app importa de otra app. Lo compartido va a `packages/`.
3. **`packages/ui` nunca se importa desde `apps/mobile`.** Depende del DOM.

Los paquetes compartidos exponen TypeScript sin compilar y lo transpila el
bundler de cada app. No tienen paso de build. Al crear una app nueva hay que
sumarlos a `transpilePackages` en Next o al `metro.config.js` en Expo.

---

## 4. Dónde vive la lógica

Sin esta regla la lógica se dispersa y web y móvil terminan comportándose
distinto.

1. **Postgres (RPC + RLS)** — por defecto. Es lo único que ambos clientes
   comparten de verdad.
2. **Edge Functions** — solo lo que necesitan **ambos** clientes y Postgres no
   puede hacer: firmar URLs de R2, webhooks entrantes, llamadas a terceros con
   secretos.
3. **Route Handlers y Server Actions** — solo lo específico de web: sitemaps,
   imágenes OG, formularios server-side.

**El firmado de URLs de R2 va en una Edge Function**, no en un Route Handler:
el móvil también lo necesita.

### Regla de SEO

Los listados y fichas públicas se renderizan en el servidor. **TanStack Query
no es la capa de datos del sitio público**: es para el admin, el móvil y el
filtrado interactivo del mapa. Un listado que se carga desde el cliente es
invisible para Google, y eso incumple el punto 7 del pliego.

---

## 5. Seguridad

### Autorización

- **El rol del usuario (socio / admin / comprador) va en `app_metadata`, nunca
  en `user_metadata`.** `raw_user_meta_data` lo edita el propio usuario y
  aparece en `auth.jwt()`: una política que lo lea permite que cualquiera se
  declare admin. Es la decisión de seguridad más importante del proyecto.
- Para saber si hay usuario autenticado, **`getUser()`, nunca `getSession()`**.
  `getSession()` solo lee la cookie, y la cookie la controla el cliente.

### RLS

- **RLS habilitada en toda tabla de un esquema expuesto.** `public` lo está.
- Las **vistas evaden RLS por defecto**: declararlas
  `with (security_invoker = true)`. Crítico para las vistas de estadísticas.
- `auth.role()` está deprecado: usar la cláusula `TO authenticated` / `TO anon`.
- **`TO authenticated` a secas es autenticación sin autorización** (BOLA/IDOR).
  Siempre acompañar con un predicado de pertenencia en `USING`.
- Las políticas de `UPDATE` necesitan **`USING` y `WITH CHECK`**, o el usuario
  puede reasignar la fila a otro dueño. Y un `UPDATE` sin política de `SELECT`
  devuelve 0 filas en silencio.
- **`SECURITY DEFINER` evade RLS** y en `public` es ejecutable por `anon` por
  defecto. Solo en el esquema `private`, con chequeo de `auth.uid()` en el
  cuerpo y `EXECUTE` revocado.
- Envolver las funciones en subquery: `(select auth.uid()) = user_id`. Sin eso
  se evalúan por fila.
- **Índice sobre toda columna usada en una política** y sobre toda FK.

### Secretos

| Prefijo        | Dónde llega                         | Qué puede ir            |
| -------------- | ----------------------------------- | ----------------------- |
| `NEXT_PUBLIC_` | Al navegador                        | Solo claves publicables |
| `EXPO_PUBLIC_` | Embebido en el binario de la tienda | Solo claves publicables |
| sin prefijo    | Solo servidor                       | Secretos                |

- **La `service_role` / secret key evade RLS por completo.** Filtrarla equivale
  a publicar la base entera. Su único lugar es `supabase/functions/`.
- El token de descarga de Mapbox va en EAS Secrets. Nunca en el repositorio.
- Nunca se commitea un `.env`. Solo `.env.example`, con las claves vacías.

### Validación

Todo dato que cruce un borde de confianza —formulario, Route Handler, Edge
Function, respuesta de un tercero— se parsea con un esquema de
`@cair/schemas` antes de usarse. El tipado de TypeScript desaparece en runtime;
Zod es lo que sobrevive.

### Otros

- Un cliente de Supabase **nuevo por request** en el servidor. Un singleton
  cruzaría sesiones entre usuarios.
- El `setAll` del adaptador de cookies recibe un segundo argumento con
  cabeceras anti-caché. **Aplicarlas**: una respuesta con cookies de sesión
  cacheada en un CDN le sirve el token de un usuario a otro.
- En móvil la sesión va en `expo-secure-store` (Keychain / Keystore), nunca en
  AsyncStorage, que guarda en texto plano.
- Desde 2026, **las tablas nuevas de `public` no se exponen automáticamente a
  la Data API**. Requieren `GRANT` explícito. Al otorgarlo, habilitar RLS.

---

## 6. Uso de los skills de `.agents`

No son documentación de consulta: gobiernan cómo se construye cada parte.

| Skill                              | Cuándo cargarlo                                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `supabase`                         | Cualquier tarea que toque Supabase: auth, RLS, Edge Functions, CLI, migraciones.                                      |
| `supabase-postgres-best-practices` | Antes de escribir o cambiar cualquier cosa que viva en Postgres, incluido un cambio de una sola columna.              |
| `code-security`                    | Al escribir o revisar código que maneje entrada de usuario, autenticación, archivos, consultas o configuración de CI. |
| `semgrep`                          | Al agregar o modificar reglas de análisis estático.                                                                   |
| `impeccable`                       | Cualquier trabajo de diseño de interfaz.                                                                              |
| `llm-security`                     | **No aplica**: el stack no tiene ningún componente LLM.                                                               |

**Antes de implementar cualquier feature de Supabase, consultar
`https://supabase.com/changelog.md`.** Las firmas y convenciones cambian entre
versiones y el conocimiento previo queda viejo rápido.

**Los comandos del CLI de Supabase se descubren con `--help`, nunca se
adivinan.** La estructura cambia entre versiones.

---

## 7. Flujo de base de datos

```
1. Editar supabase/schemas/*.sql        ← el estado deseado
2. pnpm db:sync                         ← genera la migración
3. pnpm db:reset                        ← la aplica desde cero
4. pnpm db:types                        ← regenera los tipos
5. pnpm db:test                         ← guardrails de RLS
6. pnpm db:advisors                     ← revisión de Supabase
```

**Nunca editar un archivo de `supabase/migrations/` a mano.** Son salida
generada. Para cambiar el esquema se edita `supabase/schemas/` y se regenera.

**El motor de diff no versiona `GRANT` ni `REVOKE`**: los descarta al generar
la migración. Un privilegio que dependa de una de esas sentencias hay que
verificarlo con un test de `supabase/tests/`, no darlo por aplicado.

---

## 8. Convenciones

- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`,
  `docs:`, `refactor:`, `test:`). En español, pequeños y descriptivos. El
  cuerpo explica **por qué**, no qué.
- **Ramas**: `feat/…`, `fix/…`, `chore/…`. `main` protegida: nada de push
  directo, todo por PR con los checks en verde.
- **Postgres**: `snake_case` y minúsculas, siempre.
- **TypeScript**: `camelCase` para valores, `PascalCase` para tipos.
- **Nombres de dominio en español**, que es el idioma del negocio: `campos`,
  `socios`, `consultas`. Los términos técnicos quedan en inglés.
- **Comentarios**: explican por qué, y sobre todo qué se rompe si se cambia.
  No repiten lo que el código ya dice.

---

## 9. Comandos

```bash
pnpm install              # instalar
pnpm dev                  # las tres apps
pnpm lint                 # ESLint
pnpm typecheck            # tsc
pnpm test                 # Vitest
pnpm build                # build de producción
pnpm format               # Prettier
pnpm security             # Semgrep: verifica las reglas y escanea

pnpm db:start             # Supabase local (requiere Docker)
pnpm db:reset             # recrea la base aplicando migraciones y seeds
pnpm db:test              # guardrails de RLS en pgTAP
pnpm db:advisors          # advisors de seguridad y rendimiento
pnpm db:types             # regenera los tipos
pnpm db:types:check       # falla si los tipos quedaron desactualizados
```

---

## 10. Definition of Done

Antes de abrir un PR:

- [ ] `pnpm lint typecheck test build` en verde
- [ ] `pnpm db:test` en verde si se tocó la base
- [ ] `pnpm db:advisors` sin hallazgos
- [ ] Tipos regenerados si cambió el esquema
- [ ] `pnpm security` sin hallazgos nuevos
- [ ] Toda tabla nueva con RLS y con políticas que reflejen el acceso real
- [ ] Toda vista nueva con `security_invoker = true`
- [ ] Ningún secreto en el diff
- [ ] Las decisiones técnicas nuevas, en `docs/adr/`

Un guardrail o un test que nunca se vio fallar no está verificado. Al agregar
uno, romperlo a propósito una vez y confirmar que falla.

---

## 11. Decisiones aprobadas

Registro completo en [`docs/adr/`](docs/adr/).

| #    | Decisión                                                   |
| ---- | ---------------------------------------------------------- |
| 0001 | Monorepo con pnpm y Turborepo                              |
| 0002 | El panel administrativo es una app separada                |
| 0003 | Supabase en `sa-east-1` (São Paulo) — irreversible         |
| 0004 | Esquema declarativo estable, no el flujo pg-delta en alpha |
| 0005 | El rol del usuario vive en `app_metadata`                  |
| 0006 | TypeScript 6, no 7: typescript-eslint todavía no soporta 7 |
| 0007 | `minimumReleaseAge` de 7 días                              |
| 0008 | Estilado del móvil con StyleSheet sobre tokens compartidos |

**Regla de mantenimiento de este archivo:** solo decisiones aprobadas y
permanentes. Nada temporal ni específico de una tarea puntual. El contexto de
producto no se duplica acá: vive en `PRODUCT.md`.
