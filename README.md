# CAIR

Plataforma de búsqueda y comercialización de campos de la **Cámara Argentina de
Inmobiliarias Rurales**: sitio público, panel administrativo y app nativa para
iOS y Android sobre un backend compartido.

| Documento                | Contenido                                           |
| ------------------------ | --------------------------------------------------- |
| [PRODUCT.md](PRODUCT.md) | Qué se construye, para quién y bajo qué requisitos  |
| [CLAUDE.md](CLAUDE.md)   | Cómo se construye: reglas, seguridad y convenciones |
| [docs/adr/](docs/adr/)   | Decisiones técnicas y su motivo                     |

---

## Requisitos

- **Node.js 24+**
- **pnpm 11+** — `corepack enable` instala la versión exacta del proyecto
- **Docker** — necesario para levantar Supabase local
- **Supabase CLI 2.109+** — `brew install supabase/tap/supabase`

---

## Puesta en marcha

```bash
corepack enable
pnpm install

# Levantar la base local. La primera vez descarga las imágenes de Docker.
pnpm db:start
pnpm db:reset          # aplica migraciones y seeds
pnpm db:types          # genera los tipos desde el esquema
```

`pnpm db:start` imprime las URLs y claves locales. Copiar `.env.example` a
`.env.local` en cada app y completar con esos valores:

```bash
cp .env.example apps/web/.env.local
cp .env.example apps/admin/.env.local
cp .env.example apps/mobile/.env.local
```

Para las apps web alcanza con `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y las URLs del sitio. La móvil usa las
equivalentes con prefijo `EXPO_PUBLIC_`.

> La clave que hay que copiar es **`PUBLISHABLE_KEY`**, no `SECRET_KEY`. La
> secreta evade RLS por completo y no puede salir del servidor.

```bash
pnpm dev               # levanta las tres apps
```

- Sitio público → http://localhost:3000
- Panel → http://localhost:3001
- Móvil → escanear el QR con un dev client de Expo

---

## Comandos

### Desarrollo

```bash
pnpm dev                            # las tres apps
pnpm --filter @cair/web dev         # solo una
pnpm build                          # build de producción
```

### Calidad

```bash
pnpm lint                # ESLint
pnpm typecheck           # tsc
pnpm test                # Vitest
pnpm format              # Prettier
pnpm security            # Semgrep: verifica las reglas propias y escanea
```

### Base de datos

```bash
pnpm db:start            # levantar
pnpm db:stop             # detener
pnpm db:reset            # recrear desde cero
pnpm db:sync <nombre>    # generar una migración desde supabase/schemas/
pnpm db:test             # guardrails de RLS en pgTAP
pnpm db:advisors         # advisors de seguridad y rendimiento
pnpm db:types            # regenerar los tipos
pnpm db:types:check      # falla si quedaron desactualizados
```

Studio local: http://localhost:54323 · Mailpit: http://localhost:54324

---

## Cambiar el esquema

`supabase/migrations/` es **salida generada**. Nunca se edita a mano.

```bash
# 1. Editar el estado deseado
vim supabase/schemas/01_campos.sql

# 2. Generar la migración
pnpm db:sync agregar_tabla_campos

# 3. Aplicarla desde cero y verificar
pnpm db:reset
pnpm db:types
pnpm db:test
pnpm db:advisors
```

Toda tabla nueva necesita RLS habilitada y políticas que reflejen el acceso
real. Los guardrails de `pnpm db:test` fallan si falta.

---

## Estructura

```text
apps/
  web/       Sitio público, indexable
  admin/     Panel de CAIR, noindex
  mobile/    App Expo para iOS y Android
packages/
  tokens/    Design tokens — único puente visual web ↔ móvil
  ui/        Componentes de interfaz — solo web y admin
  shared/    Utilidades puras
  schemas/   Validación con Zod
  supabase/  Tipos generados y clientes
  config/    tsconfig, ESLint, reglas de dependencia
supabase/
  schemas/     Estado declarativo (entrada)
  migrations/  Migraciones generadas (salida)
  functions/   Edge Functions
  tests/       Guardrails de seguridad en pgTAP
```

---

## Seguridad

Tres cosas que conviene saber antes del primer commit. El detalle está en
[CLAUDE.md](CLAUDE.md#5-seguridad).

1. **Nunca commitear un `.env`.** Solo `.env.example`, con las claves vacías.
   CI falla si aparece un secreto, incluso en el historial.
2. **La `service_role` / secret key evade RLS.** Su único lugar es
   `supabase/functions/`. Hay una regla de Semgrep que lo detecta.
3. **El rol del usuario va en `app_metadata`, nunca en `user_metadata`**, que
   el propio usuario puede editar.

Los guardrails de `supabase/tests/` hacen fallar el build si una tabla queda
sin RLS, si una vista puede evadirla, o si una política intenta autorizar
leyendo datos editables por el usuario. Son la comprobación automática del
compromiso de privacidad del punto 9 del pliego.

---

## Contribuir

- Ramas `feat/…`, `fix/…`, `chore/…`. `main` está protegida.
- Commits en español siguiendo Conventional Commits. El cuerpo explica el
  **por qué**.
- Antes del PR, la checklist de
  [Definition of Done](CLAUDE.md#10-definition-of-done).
