# 0003 — Supabase en sa-east-1 (São Paulo)

**Estado:** aceptada · **Fecha:** 2026-07-30 · **Irreversible**

## Contexto

El punto 11 del pliego exige especificar dónde reside la plataforma y quién es
titular de los datos. Los usuarios están en Argentina.

**La región de un proyecto Supabase no se puede cambiar una vez creado.**

## Decisión

AWS South America (São Paulo), `sa-east-1`. Las funciones de Vercel se
configuran en `gru1` para acompañar.

## Motivo

Es la región disponible más cercana a Argentina: menor latencia y una respuesta
más sólida al pliego sobre residencia de datos que una región en EE.UU.

## Consecuencias

- Unos 120–150 ms menos de latencia que us-east-1 para usuarios argentinos.
- Algunas features de Supabase llegan primero a las regiones de EE.UU.
- Migrar de región implica crear un proyecto nuevo y mover los datos.
