# 0002 — El panel administrativo es una app separada

**Estado:** aceptada · **Fecha:** 2026-07-30

## Contexto

El sitio público es anónimo e indexable. El panel de CAIR es autenticado y da
acceso a la moderación de publicaciones y a las estadísticas.

La alternativa era un route group `(admin)` dentro de `apps/web`.

## Decisión

`apps/admin` como aplicación Next.js independiente, con dominio propio.

## Motivo

El argumento decisivo es la superficie de ataque. Con una sola app, lo único
que separa a un visitante anónimo del panel es una regla de código, y un bug
en esa regla expone el panel en el mismo dominio ya indexado. Con dos apps, el
panel vive en otro dominio, no está enlazado desde ningún lado, y admite un
candado a nivel de plataforma que actúa antes de ejecutar código propio.

El segundo motivo es que un cambio en el panel no republica el sitio público,
que es el que tiene que estar arriba durante una campaña.

**No se decidió por peso de bundle.** Next.js ya divide el código por ruta, así
que un visitante del sitio público no descargaría el código del panel de todos
modos.

## Consecuencias

- Dos proyectos en Vercel. Vercel cobra por usuarios, no por proyectos.
- Los componentes visuales se comparten desde `packages/ui`; no se duplican.
- Reversible en ambos sentidos con un refactor de uno o dos días.
