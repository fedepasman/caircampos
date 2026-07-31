# 0007 — minimumReleaseAge de 7 días

**Estado:** aceptada · **Fecha:** 2026-07-30

## Contexto

El vector de ataque más frecuente contra proyectos JavaScript hoy es el
compromiso de una cuenta de npm y la publicación de una versión maliciosa de un
paquete legítimo. La comunidad suele detectarlo en horas.

## Decisión

`minimumReleaseAge: 10080` (7 días) en `pnpm-workspace.yaml`. Ninguna versión
publicada hace menos de una semana entra al lockfile.

Los scripts de instalación siguen bloqueados salvo los declarados en
`allowBuilds`, que hoy es solo `sharp`.

## Consecuencias

- El catálogo nunca apunta a la versión del día. **Al actualizar hay que mirar
  la fecha de la versión concreta, no la del paquete**: `npm view <pkg>
time.modified` devuelve la del paquete y engaña.
- Cuatro paquetes de Expo quedan un patch por detrás de lo que pide
  `expo install --check`. Son diferencias dentro del mismo SDK 57 y se
  resuelven solas esperando. **No resolverlo con `expo install --fix`**: eso
  saltea la política.
- Se evaluó bajar a 3 días. Se mantuvo en 7: la fricción es un desfasaje de
  patch que se resuelve solo, y el beneficio es cubrir toda la ventana de
  detección, no la mitad.
