# 0006 — TypeScript 6, no 7

**Estado:** aceptada · **Fecha:** 2026-07-30 · **Revisar:** cuando typescript-eslint soporte TS 7

## Contexto

TypeScript 7.0.2 —el compilador reescrito en Go— está publicado como `latest`.

## Decisión

Fijar TypeScript en **6.0.3**.

## Motivo

`typescript-eslint` declara `typescript: ">=4.8.4 <6.1.0"`, incluso en su canal
canary. Con TS 7 se desactivan todas las reglas de lint que requieren
información de tipos, que son justamente las que más valen:
`no-floating-promises`, `no-unsafe-assignment`, `no-misused-promises`.

Cambiar el compilador para perder el análisis de tipos en el linter es un mal
negocio.

## Consecuencias

- TS 6.0 cambió el default de `types` a lista vacía: ya no incluye
  automáticamente todo lo que haya en `node_modules/@types`. Cada preset de
  `packages/config/tsconfig/` declara los suyos. Además de necesario, es mejor:
  evita que los tipos del DOM se filtren al paquete de React Native.
- Revisar cuando typescript-eslint publique soporte para TS 7.
