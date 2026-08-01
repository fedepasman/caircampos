# OPERACIONES.md

Manual de operaciones. Para quien administra la infraestructura —
proyectos, despliegues, secretos, incidentes — no necesariamente quien
escribe features.

Qué se construye está en [PRODUCT.md](PRODUCT.md). Cómo se construye el
código está en [CLAUDE.md](CLAUDE.md). Cómo se ve está en [DESIGN.md](DESIGN.md).
Decisiones técnicas permanentes, en [`docs/adr/`](docs/adr/). Este documento
no repite nada de eso — lo enlaza.

---

## 1. Arquitectura en un vistazo

Un monorepo (pnpm + Turborepo), tres proveedores en la nube, cada uno con
una responsabilidad:

```
┌─────────────────────┐     ┌─────────────────────┐
│  Vercel: cair-web    │     │  Vercel: cair-admin  │
│  apps/web            │     │  apps/admin          │
│  Next.js, público    │     │  Next.js, con SSO    │
└──────────┬───────────┘     └──────────┬───────────┘
           │                            │
           │      clave publicable      │
           ▼                            ▼
     ┌─────────────────────────────────────┐
     │  Supabase (sa-east-1)                │
     │  Postgres + Auth + Data API          │
     │  RLS decide qué ve cada quien         │
     └──────────────┬───────────────────────┘
                     │ URL firmada, solo para subir
                     ▼
     ┌─────────────────────────────────────┐
     │  Cloudflare R2                       │
     │  Fotos de campos (lectura pública)   │
     └───────────────────────────────────────┘
```

Ningún proveedor conoce las credenciales de otro. Vercel solo tiene la clave
_publicable_ de Supabase (segura de exponer: RLS filtra igual). Las
credenciales de escritura de R2 viven únicamente en una Edge Function de
Supabase — ni las apps de Vercel ni el navegador las ven nunca.

**Por qué un monorepo:** `apps/web`, `apps/admin` y `apps/mobile` comparten
código real (`packages/ui`, `packages/schemas`, `packages/supabase`,
`packages/shared`, `packages/tokens`) importado como si fuera una librería
de npm, sin compilar. Evita que la misma validación o el mismo componente se
reescriba tres veces. Ver [ADR 0001](docs/adr/0001-monorepo-pnpm-turborepo.md).

**El recorrido de una visita real** (`cair-web.vercel.app/campos/algún-id`):

1. Vercel ejecuta el Server Component de Next.js en su propio servidor.
2. Ese código pide el campo a Supabase con la clave publicable.
3. Postgres aplica la política RLS de `campos` (anónimo → solo si
   `publicado = true and revisado_por_cair = 'aprobado'`) y devuelve la fila
   o nada — la restricción vive en la base, no en el código de la app.
4. Next.js arma el HTML con los datos ya adentro (requisito de SEO, punto 7
   del pliego) y lo manda al navegador.
5. Las fotos se piden aparte, directo del dominio público de R2.

---

## 2. Cuentas y accesos

| Servicio   | Identificador                                                    | Qué vive ahí                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------ |
| GitHub     | `fedepasman/caircampos`                                          | Código fuente, único repo                  |
| Vercel     | Team `fedes-projects-d0abb5ec` (`team_7jOQ6nG8lGGPAhP7zXDOmLhl`) | Proyectos `cair-web` y `cair-admin`        |
| Supabase   | Organización `etaunbjcsxmdbiphcgqw`                              | Proyecto de producción y de staging futuro |
| Supabase   | Proyecto `opzpixpwklaaprzkqzdf`, región `sa-east-1`              | Base de producción, Auth, Edge Functions   |
| Cloudflare | Bucket R2 `cair-campos`                                          | Fotos de campos                            |
| Mapbox     | Cuenta con el token público usado en ambos entornos              | Mapas y geocoding                          |

Para sumar a alguien nuevo: invitarlo al team de Vercel, a la organización
de Supabase, y darle acceso a la cuenta de Cloudflare y al repo de GitHub.
_(Quién concretamente hace esas invitaciones: completar acá.)_

**Límite a tener presente:** el plan free de Supabase permite 2 proyectos
activos por organización. Ya lo topamos una vez al crear el proyecto de
`sa-east-1` — hubo que borrar el proyecto anterior (mal configurado en
`us-east-2`) antes de poder crear el correcto. Si se necesita un tercer
proyecto (por ejemplo, uno de staging), hay que borrar/pausar uno existente
o pasar a un plan pago.

---

## 3. Entornos

|                | Local                          | Producción                                      |
| -------------- | ------------------------------ | ----------------------------------------------- |
| Dónde corre    | Docker, vía `supabase start`   | Supabase Cloud, `sa-east-1`                     |
| Referencia     | —                              | `opzpixpwklaaprzkqzdf`                          |
| Datos          | `supabase/seeds/*.sql`         | Los que carguen socios reales                   |
| Apps           | `pnpm dev` (puertos 3000/3001) | `cair-web.vercel.app` / `cair-admin.vercel.app` |
| Edge Functions | `supabase functions serve`     | `supabase functions deploy`                     |

Los dos entornos nunca se comunican entre sí. Comparten únicamente la
**estructura** de la base (ver sección 4) — nunca los datos.

---

## 4. Base de datos

Flujo declarativo, resumen operativo (las reglas de seguridad detalladas
están en la sección 5 y 7 de [CLAUDE.md](CLAUDE.md)):

```
supabase/schemas/*.sql   (estado deseado, se edita a mano)
        │  pnpm db:sync
        ▼
supabase/migrations/*.sql   (generado — nunca se edita a mano)
        │
        ├─ pnpm db:reset          → aplica todo desde cero, local
        └─ supabase db push       → aplica lo que falte, a producción
```

**Comandos:**

| Comando            | Qué hace                                                          |
| ------------------ | ----------------------------------------------------------------- |
| `pnpm db:start`    | Levanta Supabase local (Docker)                                   |
| `pnpm db:reset`    | Recrea la base local desde cero, aplicando migraciones y seeds    |
| `pnpm db:sync`     | Genera una migración nueva a partir del diff en `schemas/`        |
| `pnpm db:types`    | Regenera `packages/supabase/src/database.types.ts`                |
| `pnpm db:test`     | Corre los guardrails de RLS (pgTAP)                               |
| `pnpm db:advisors` | Corre los advisors de seguridad/rendimiento de Supabase           |
| `supabase db push` | Aplica las migraciones pendientes al proyecto remoto **linkeado** |

**Gap conocido:** el generador de diffs (`db:sync`) descarta las sentencias
`GRANT`/`REVOKE` al crear la migración. Cada vez que un cambio depende de
una de esas sentencias (columnas con permisos acotados, funciones
`SECURITY DEFINER`), hay que agregarlas a mano en el archivo de migración
generado y confirmarlas con un test en `supabase/tests/`. Ya pasó varias
veces — buscar `REVOKE` en los archivos de `supabase/migrations/` para ver
ejemplos reales.

**Antes de pushear a producción:** correr `supabase db push --dry-run`
primero. Es una base compartida — no hay vuelta atrás fácil una vez aplicada
una migración con datos reales adentro.

---

## 5. Despliegue de las apps (Vercel)

### Por qué dos proyectos de un solo repo

`apps/web` y `apps/admin` necesitan dominios, variables de entorno y
protecciones de acceso distintas — por eso son dos proyectos de Vercel
separados (`cair-web`, `cair-admin`), aunque compartan repositorio.

Cada proyecto tiene su **Root Directory** configurado (`apps/web` o
`apps/admin` respectivamente) vía la API de Vercel. Pero el deploy sube el
**repositorio completo**, no solo esa carpeta: si solo subiera la
subcarpeta, `pnpm install` no podría resolver las dependencias
`workspace:*` contra `packages/*`, que quedarían fuera de la subida.

### `.vercelignore`

Existe por un incidente real: sin él, el primer intento de deploy subió
**10GB**, porque el caché local de Turborepo (`.turbo/`) no se excluye por
default. `.vercelignore` en la raíz excluye `node_modules`, `.turbo`,
mockups y material de referencia — nada de eso hace falta para el build,
Vercel corre su propio `pnpm install`.

### Variables de entorno

Todas en `production` únicamente — no hay entorno de preview/staging
configurado todavía.

**`cair-web`:**

| Variable                               | Para qué                                 |
| -------------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto de producción           |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable (segura de exponer)     |
| `NEXT_PUBLIC_SITE_URL`                 | `https://cair-web.vercel.app`            |
| `NEXT_PUBLIC_ADMIN_URL`                | `https://cair-admin.vercel.app`          |
| `NEXT_PUBLIC_MAPBOX_TOKEN`             | Token público de Mapbox                  |
| `NEXT_PUBLIC_R2_PUBLIC_URL`            | Dominio público de lectura del bucket R2 |

**`cair-admin`:**

| Variable                               | Para qué                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Mismo proyecto de producción                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Misma clave publicable — el rol de admin lo decide `app_metadata`, no una clave distinta |
| `NEXT_PUBLIC_ADMIN_URL`                | `https://cair-admin.vercel.app`                                                          |

### Proceso de deploy (manual, hoy)

No está conectado a GitHub — cada deploy es una acción manual desde la
terminal. Desde la raíz del repo:

```bash
# Una vez por proyecto (crea/linkea el proyecto de Vercel):
cd apps/web && vercel link --yes --project cair-web

# El link queda en apps/web/.vercel/project.json — para deployar con el
# contexto completo del monorepo, copiarlo a la raíz antes de cada deploy:
cp apps/web/.vercel/project.json .vercel/project.json
cd .. && vercel deploy --prod --yes
```

Repetir con `cair-admin` cambiando la ruta. **Mejora pendiente:** conectar
ambos proyectos al repo de GitHub para que cada push a `main` dispare el
deploy automáticamente, en vez de este paso manual.

### Protección SSO en `cair-admin`

Activada vía `vercel project protection enable cair-admin --sso`: antes de
llegar al login propio de la app, hay que estar autenticado como
colaborador del proyecto en Vercel. Es una capa extra, independiente del
control de acceso por `app_metadata.rol` que ya hace la propia app.

---

## 6. Edge Functions y Cloudflare R2

### `subir-foto-campo`

Firma una URL de subida a R2. Vive en una Edge Function (Deno, en
`supabase/functions/subir-foto-campo/`) y no en un Route Handler de
`apps/web` porque el móvil también la va a necesitar — es la regla de
CLAUDE.md sobre dónde vive la lógica compartida.

Verifica la identidad de quien llama con su propio JWT (sin necesitar la
`service_role`) y chequea que sea dueño real del campo antes de firmar nada.

**Desplegar:**

```bash
supabase functions deploy subir-foto-campo
```

**Secretos** (nunca en Vercel, nunca en el código de las apps):

| Variable               | Dónde en local                          | Dónde en producción    |
| ---------------------- | --------------------------------------- | ---------------------- |
| `R2_ACCOUNT_ID`        | `supabase/functions/.env` (gitignorado) | `supabase secrets set` |
| `R2_ACCESS_KEY_ID`     | ídem                                    | ídem                   |
| `R2_SECRET_ACCESS_KEY` | ídem                                    | ídem                   |
| `R2_BUCKET_NAME`       | ídem                                    | ídem                   |

```bash
# Local:
supabase functions serve --env-file supabase/functions/.env

# Producción:
supabase secrets set --env-file supabase/functions/.env
```

### CORS del bucket R2

El navegador sube directo a R2 (no pasa por Supabase ni por Vercel), así
que el bucket necesita permitir explícitamente el origen de cada dominio
desde el que se sube. Hoy: `http://localhost:3000` y
`https://cair-web.vercel.app`.

**Para agregar un dominio nuevo** (por ejemplo, al sumar un dominio propio):
Cloudflare → R2 → bucket `cair-campos` → Settings → CORS Policy, agregar el
origen a `AllowedOrigins`:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://cair-web.vercel.app"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 7. Runbook — tareas comunes

### Crear un usuario admin en producción

No hay alta de admin por UI — es intencional (nadie se autoasigna el rol).

1. Supabase Dashboard → Authentication → Users → Add user → Create new
   user. Marcar **Auto Confirm User**.
2. SQL Editor:
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"rol": "admin"}'::jsonb
   where email = 'el-email@correo.com';
   ```

### Crear un socio (inmobiliaria) en producción

El alta de socios también es manual — no hay autoregistro de socios (a
diferencia de los compradores, que sí se autoregistran).

```sql
insert into public.socios (usuario_id, nombre)
select id, 'Nombre de la inmobiliaria'
from auth.users
where email = 'el-email-del-socio@correo.com';
```

(Requiere haber creado antes el usuario en Authentication → Users, igual
que el admin.)

### Rotar un secreto filtrado

Rotar **en el proveedor** (Cloudflare, Mapbox, Supabase) — borrarlo del
repo o del historial de git no alcanza si ya se filtró, porque pudo haber
sido copiado antes del borrado. Después de rotar:

- R2: actualizar `supabase/functions/.env` local y volver a correr
  `supabase secrets set --env-file supabase/functions/.env`.
- Mapbox: actualizar `NEXT_PUBLIC_MAPBOX_TOKEN` en `apps/web/.env.local` y en
  las variables de entorno de Vercel (`vercel env rm` + `vercel env add`),
  y redeployar.

### Rollback de un deploy en Vercel

```bash
vercel rollback [url-o-id-del-deployment-anterior] --yes
```

O desde el dashboard: Deployments → elegir uno anterior → "Promote to
Production".

---

## 8. Troubleshooting conocido

| Síntoma                                                       | Causa                                                                   | Solución                                                                       |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `Runtime Error` / "module factory is not available" en dev    | Caché de Turbopack corrompido en un dev server que lleva rato corriendo | Matar el proceso, borrar `.next`, reiniciar `pnpm dev`                         |
| Deploy de Vercel subiendo varios GB                           | `.turbo/` sin excluir                                                   | Confirmar que `.vercelignore` existe y corre `rm -rf .turbo` antes de deployar |
| Subir fotos falla en producción pero funciona en local        | El dominio de producción no está en el CORS del bucket R2               | Agregar el origen en Cloudflare → R2 → bucket → CORS Policy                    |
| `supabase projects create` falla con "reached maximum limits" | Límite de 2 proyectos free por organización                             | Borrar o pausar un proyecto existente antes de crear uno nuevo                 |

---

## 9. Pendiente de infraestructura

- Dominio propio para `apps/web` y `apps/admin`, en vez de `*.vercel.app`
  (implica también actualizar el CORS de R2 y las `additional_redirect_urls`
  de Supabase Auth).
- Deploy automático conectando los proyectos de Vercel al repo de GitHub.
- Entorno de staging/preview, separado de producción.
- Observabilidad (Sentry) — mencionado en CLAUDE.md, no configurado todavía.
- `apps/mobile` sin desplegar (ni EAS Build ni tiendas).
