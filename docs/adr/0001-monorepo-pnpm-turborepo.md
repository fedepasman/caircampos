# 0001 — Monorepo con pnpm y Turborepo

**Estado:** aceptada · **Fecha:** 2026-07-30

## Contexto

La plataforma tiene tres frontends (sitio público, panel y app móvil) sobre un
backend común. Comparten tipos, validaciones, lógica de dominio y el cliente de
la base.

## Decisión

Un único repositorio con pnpm workspaces y Turborepo.

Las versiones de dependencias se declaran en el catálogo de
`pnpm-workspace.yaml` y las apps las referencian con `catalog:`.

Los paquetes compartidos exponen TypeScript sin compilar y lo transpila el
bundler de cada app (patrón Just-in-Time de Turborepo).

## Consecuencias

- Un cambio en un tipo compartido rompe en compilación en las tres apps a la
  vez, en vez de descubrirse en producción.
- El catálogo evita que web, admin y móvil terminen en versiones distintas de
  la misma librería, que es la causa habitual de los bugs de "dos Reacts".
- Sin paso de build en los paquetes no hay artefactos intermedios que puedan
  quedar desactualizados, pero cada app debe declarar los paquetes en
  `transpilePackages` (Next) o en `metro.config.js` (Expo).
