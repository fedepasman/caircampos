# 0008 — Estilado del móvil con StyleSheet sobre tokens compartidos

**Estado:** aceptada · **Fecha:** 2026-07-30 · **Revisar:** cuando NativeWind v5 sea estable

## Contexto

Web y admin usan Tailwind 4. Faltaba definir el estilado del móvil. Se
evaluaron tres opciones:

| Opción              | Estado real                              |
| ------------------- | ---------------------------------------- |
| NativeWind v5       | `5.0.0-preview.4`. Sin release estable.  |
| NativeWind 4.2.6    | Estable, pero con sintaxis de Tailwind 3 |
| StyleSheet + tokens | Disponible hoy, sin dependencias extra   |

## Decisión

`StyleSheet` de React Native consumiendo `@cair/tokens`.

## Motivo

NativeWind v5 es la única opción con paridad real de sintaxis con la web, pero
sigue en preview y estaría en la ruta crítica de una app que va a las tiendas.
NativeWind 4 daría una paridad aproximada al costo de sostener dos
generaciones de Tailwind conviviendo en el mismo repositorio.

**La elección de estilado no incide en la aprobación de App Store ni de Google
Play.** Las tres opciones compilan al mismo binario nativo y usan las mismas
primitivas de React Native. Descartada esa dimensión, decide la confiabilidad.

## Consecuencias

- Los componentes visuales no se comparten entre web y móvil —regla ya
  establecida—, pero sí los tokens, que es lo que hace que las superficies se
  vean como el mismo producto.
- Más verboso que las clases de utilidad, y sin paridad de sintaxis con la web.
- `packages/ui` sigue prohibido en `apps/mobile`; lo hace cumplir ESLint.
- Revisar cuando NativeWind v5 tenga release estable. La migración es acotada:
  los tokens ya son la fuente única y no cambiarían.
