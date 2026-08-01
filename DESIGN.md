---
name: CAIR
description: Plataforma de búsqueda y comercialización de campos de la Cámara Argentina de Inmobiliarias Rurales
colors:
  field-green: '#18330c'
  field-green-deep: '#2e4a20'
  field-green-tint: '#aed099'
  harvest-gold: '#c8ae44'
  harvest-gold-light: '#fee171'
  surface: '#fcf9f8'
  surface-lowest: '#ffffff'
  on-surface: '#1b1c1c'
  on-surface-variant: '#43483f'
  outline: '#74796e'
  outline-variant: '#c3c8bb'
typography:
  display:
    fontFamily: 'Libre Caslon Text, serif'
    fontSize: '56px'
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: 'Hanken Grotesk, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: '2px'
  md: '4px'
  lg: '8px'
  xl: '12px'
spacing:
  1: '4px'
  2: '8px'
  4: '16px'
  6: '24px'
  8: '32px'
  16: '64px'
components:
  button-primary:
    backgroundColor: '{colors.harvest-gold-light}'
    textColor: '{colors.field-green}'
    rounded: '{rounded.sm}'
    padding: '12px 24px'
  card:
    backgroundColor: '{colors.surface-lowest}'
    rounded: '{rounded.md}'
---

# Design System: CAIR

## Overview

**Creative North Star: "The Land Registry"** — la autoridad institucional de
un archivo catastral centenario, no la energía de un marketplace inmobiliario
genérico.

CAIR administra el mercado de tierras rurales de Argentina: el diseño tiene
que transmitir estabilidad, herencia y crecimiento antes que urgencia
comercial. Tipografía de alto contraste, mucho espacio en blanco, y
fotografía real del paisaje como protagonista — nunca ilustración genérica ni
iconografía "agro" de stock. Esta dirección fue traída por el usuario como
comps ya aprobados (`Base_Stitch/`, generados con Google Stitch); este
archivo documenta lo que efectivamente se construyó a partir de ellos, no una
propuesta nueva.

**Key Characteristics:**

- Serif institucional para títulos, sans-serif de alta legibilidad para todo
  lo demás — nunca la misma fuente para ambos roles.
- El verde (Field Green) es el color de autoridad: navegación, texto sobre
  fondo claro, franjas institucionales. El dorado (Harvest Gold) es escaso a
  propósito: solo para la acción principal y los destacados.
- Radios chicos (2–12px): "prolijo" sin caer en la forma "pill" de una app de
  consumo.
- Sin ilustración ni iconografía genérica de stock: cuando no hay una foto
  real todavía (como las fichas de campos, que aún no tienen carga de
  imágenes), se usa un bloque de color sólido en vez de inventar una imagen.

## Colors

La paleta viene directo de `packages/tokens/src/index.ts` (`colors.brand`,
`colors.accent`, `colors.neutral`) — ese archivo es la fuente de verdad; acá
se documenta el rol de cada uno, no se redefinen los valores.

### Primary

- **Field Green** (`#18330c`, `brand.900`): franjas institucionales de fondo,
  texto de marca, tab activo del buscador. Es el color de autoridad — se usa
  en bloques sólidos, no como acento chico.
- **Field Green Deep** (`#2e4a20`, `brand.700`): un paso más claro, usado en
  degradés (placeholder de imagen de las cards) y estados intermedios.

### Secondary

- **Harvest Gold** (`#c8ae44`, `accent.400`) y **Harvest Gold Light**
  (`#fee171`, `accent.200`): reservado casi exclusivamente para el botón
  "Buscar" y para insignias de "destacado" — es el color que más rápido se
  gasta si se usa de más, así que se raciona.

### Neutral

- **Surface** (`#fcf9f8`, `neutral.100`): fondo por defecto del sitio.
- **Surface Lowest** (`#ffffff`, `neutral.50`): fondo de cards y del panel de
  búsqueda, para que se distingan del fondo general.
- **On Surface** (`#1b1c1c`, `neutral.950`): texto principal.
- **On Surface Variant** (`#43483f`, `neutral.900`) / **Outline**
  (`#74796e`, `neutral.800`): texto secundario y bordes de input.
- **Outline Variant** (`#c3c8bb`, `neutral.700`): bordes sutiles, divisores.

### Named Rules

**The Scarcity Rule.** Harvest Gold aparece en, como mucho, un elemento por
viewport. Si empieza a aparecer en más de un lugar de la misma pantalla, se
volvió decorativo en vez de una señal.

## Typography

**Display Font:** Libre Caslon Text (con `serif` de respaldo)
**Body Font:** Hanken Grotesk (con `sans-serif` de respaldo)

**Character:** una serif editorial de peso alto contra una sans-serif de
interfaz muy legible — la misma lógica que un diario institucional: la firma
va en serif, el cuerpo de la noticia en una tipografía hecha para leerse
rápido.

### Hierarchy

- **Display** (700, 40–56px, line-height 1.1): título del hero. Un solo uso
  por página.
- **Headline** (600, 24–30px, line-height 1.2): títulos de sección
  ("Campos destacados"), título de cada card.
- **Body** (400, 16–18px, line-height 1.5): texto corrido, descripciones.
- **Label** (600, 13–14px, letter-spacing 0.05em, uppercase): el subtítulo
  institucional sobre el título del hero.

### Named Rules

**The One Serif Rule.** Libre Caslon Text solo aparece en títulos. Nunca en
un botón, un input, o una etiqueta — ahí siempre Hanken Grotesk, sin
excepción.

## Layout

Contenedor máximo de 1280px (`max-w-5xl` en las secciones construidas),
centrado, con `padding` horizontal de 24px en mobile. Las secciones se
apilan verticalmente con espaciado generoso entre ellas (64px, `py-16`) — el
"aire" es parte deliberada de la identidad institucional, no un descuido.

En mobile, el buscador del hero pasa de fila a columna (tipo de campo,
ubicación y botón apilados) para mantener los targets de toque grandes.

## Elevation & Depth

Sistema plano con capas tonales, no sombras duras. El panel de búsqueda
sobre la foto del hero es la única superficie "flotante" de la página, y
usa una sombra suave (`shadow-lg`) para separarse de la fotografía, no para
simular altura física.

## Shapes

Radios chicos en toda la interfaz (2–12px, escala `radius` de
`@cair/tokens`): suficiente para sentirse moderno sin caer en la forma
"pill" de una app de consumo. Las cards y el panel de búsqueda usan 4px
(`radius.md`); no hay ningún elemento con esquinas completamente rectas ni
completamente redondeadas salvo excepciones puntuales (badges circulares,
si se agregan más adelante).

## Components

Desde esta pasada, `packages/ui/src/components/` es la librería real
(antes cada pantalla copiaba a mano el mismo patrón de input/botón/tarjeta).
Se comparte entre `apps/web` y `apps/admin` — nunca `apps/mobile`, que
depende de `StyleSheet` (ADR 0008).

### Button (`@cair/ui/Button`)

- **Shape:** radio 2px (`rounded-sm`).
- **`variant="primary"`:** fondo Harvest Gold, texto Field Green, semibold.
  El único botón dorado por vista — ver The Scarcity Rule.
- **`variant="secondary"`:** borde Field Green, transparente.
- `buttonStyles(variant)` exporta las mismas clases como string, para los
  casos donde el elemento visual es un `<Link>` de Next (navegación) y no
  puede pasar por el componente `<button>`.

### FormField / FormTextarea / FormCheckbox (`@cair/ui`)

- **Style:** borde 1px `neutral.700`, fondo blanco, radio 2px, label
  semibold arriba, mensaje de error en `danger` abajo.
- Un solo componente para los cinco formularios del sitio (ingreso,
  registro, alta/edición de campo, consulta) — antes cada uno repetía el
  mismo markup.
- Todavía sin estado de foco diferenciado más allá del que da el navegador.

### Card (`@cair/ui/Card`)

- **Corner Style:** 4px (`rounded-md`).
- **Background:** blanco (`neutral.50`), borde sutil `neutral.600`.
- Base de las tarjetas de "Campos destacados", "Mis campos", las
  estadísticas del panel, la ficha de contacto y "Otros campos publicados".
- **Encabezado sin foto:** mientras `campos` no tenga columna de imagen ni
  haya carga a R2, el lugar de la foto es un degradé sólido
  `brand.700 → brand.900` — nunca una foto de stock haciéndose pasar por el
  campo real.

### Badge (`@cair/ui/Badge`)

- Pill Publicado/Borrador: `tone="brand"` (fondo `brand.900`) o
  `tone="neutral"` (fondo `neutral.600`), siempre texto `neutral.50`.

### Hero search

- Tabs "Comprar"/"Alquilar": el activo lleva un subrayado de 3px en
  `brand.900`. Componente puramente visual hoy — sin filtrado real
  conectado.

### Búsqueda geográfica (mapa)

- **Mapa real**, no un placeholder estático: Mapbox GL con un pin verde
  (`brand.900`) por campo publicado, encuadrado automáticamente
  (`fitBounds`) según las coordenadas reales — a diferencia del comp
  original de Stitch, que usa una captura de pantalla con un pin dibujado
  encima.
- **Contenedor:** tarjeta blanca, borde `neutral.600`, radio 8px
  (`rounded-lg`), sombra (`shadow-lg`), **altura fija** (`420px` / `560px`
  en `md:`) — no `aspect-ratio`: en Safari el contenedor colapsaba a 0px de
  alto con `aspect-video`, así que se usa el mismo patrón de altura
  explícita que ya se había probado antes.
- **Panel "Filtrar área":** superpuesto arriba a la izquierda, con
  checkboxes por macro-región (Pampa Húmeda / Patagonia / NEA-NOA). Igual
  que el buscador del hero, es **puramente visual** — `campos` no tiene
  columna de región todavía, así que no filtra de verdad.

### Header (sitio público)

- Barra simple arriba de las páginas públicas: wordmark "CAIR" a la
  izquierda, un solo link a la derecha ("Ingresar" o "Mi panel", según haya
  sesión). Server-rendered, no superpuesto sobre la foto del hero como en
  el comp original de Stitch — simplificación deliberada de esta pasada.
  Vive en `apps/web/src/app/(sitio)/layout.tsx` — un Route Group separado
  del panel, que tiene su propio chrome (ver abajo). Ninguno de los dos
  Route Groups cambia las URLs.

### Formulario de ingreso

- Misma paleta de inputs que el resto del sitio (borde `neutral.700`, radio
  2px). Un solo mensaje de error genérico si falla el login ("Email o
  contraseña incorrectos"): nunca decir cuál de los dos campos estuvo mal.

### Panel de socios (Operate, con sidebar propio)

- **Chrome:** `apps/web/src/app/panel/layout.tsx` reemplaza el header del
  sitio público por un sidebar (wordmark adentro, no arriba de la
  página) — así lo muestra el comp `cair_panel` de Stitch. Solo enlaza a lo
  que existe de verdad: "Panel", "Mis campos" y "Consultas" son anclas
  dentro de `/panel`, no rutas nuevas. Nada de "Saved Properties" ni
  "Market Reports" del comp: esas funciones no existen.
- **Estadísticas:** dos tarjetas (`Card` + ícono de `lucide-react`) con
  conteos reales — "Campos publicados" y "Consultas recibidas". El comp
  tiene una tercera ("Campos Guardados") y sub-métricas ("+3 este mes", "2
  pendientes"): no hay favoritos ni estado de consulta en el schema, así
  que se omiten en vez de inventarse.
- **Mis campos:** tarjetas con el mismo tratamiento sin foto que "Campos
  destacados" del home, badge `Publicado`/`Borrador`, cada una es un link
  a su edición.
- **Consultas recibidas:** tabla (Campo · Comprador · Teléfono · Fecha) en
  vez de tarjetas sueltas — más escaneable para una superficie _Operate_.
  Sin columna "Estado": no se trackea si una consulta fue respondida.
- **Mis datos:** tarjeta chica con lo único que es real, `socios.nombre` y
  el email de `auth.users` — sin foto, teléfono ni membresía, que el comp
  muestra pero no existen en el schema.
- **Alta y edición de campos:** mismo formulario para ambas
  (`apps/web/src/app/panel/formulario-campo.tsx`), con un selector de
  ubicación en mapa en vez de inputs de latitud/longitud — un clic coloca
  un pin arrastrable (`apps/web/src/components/selector-ubicacion.tsx`).
  Pedirle a una inmobiliaria que tipee grados decimales a mano produciría
  datos basura; el mapa es la única fuente de esas dos columnas. Incluye
  también un campo de descripción libre, opcional.

### Ficha pública de campo

- `apps/web/src/app/(sitio)/campos/[id]/page.tsx`: barra de título
  (nombre, ubicación), dos casilleros de datos reales (Superficie,
  Ubicación) — el comp de Stitch tiene cinco (Aptitud, Mejoras, Riego,
  Infraestructura), pero esas columnas no existen; una sección de
  Descripción **solo si el socio la cargó** (`campos.descripcion`, nunca un
  placeholder inventado); y un mapa de un solo pin (reutiliza
  `MapaCampos`). Sin precio ni fotos — tampoco existen esas columnas.
- **Tarjeta de contacto lateral (`sticky`):** nombre del socio y el
  formulario de consulta — sin matrícula, teléfono ni WhatsApp del socio
  (no hay esas columnas) y sin el sello "Aval de CAIR" del comp: sería una
  afirmación institucional falsa, no hay moderación implementada todavía.
  El bloque de "Consultar" cambia según la sesión: sin cuenta, links a
  Ingresar/Registrarme; con cuenta de comprador, el formulario de una sola
  pregunta ("Mensaje"); ya consultado, un mensaje de confirmación en vez
  del formulario — nunca se puede mandar una segunda consulta duplicada
  desde la misma ficha.
- **Otros campos publicados:** hasta 3 campos reales de la misma
  provincia, excluyendo el actual. Se omite la sección entera si no hay
  ninguno — nunca un estado vacío forzado ni datos de relleno.

### Formulario de registro (compradores)

- Mismos campos y misma paleta que el resto de los formularios del sitio.
  A diferencia de socios (alta manual en Studio), el comprador se registra
  solo: es la única forma viable de que un sitio público reciba consultas
  reales.

## Do's and Don'ts

### Do:

- **Do** usar Libre Caslon Text solo para títulos, nunca para UI.
- **Do** usar Harvest Gold en como mucho un elemento por viewport.
- **Do** preferir un bloque de color sólido sobre una foto inventada cuando
  no hay imagen real disponible.

### Don't:

- **Don't** inventar cifras institucionales ("+150 socios") que no se
  puedan verificar contra la base — el comp original de Stitch las tiene,
  esta implementación las omite a propósito.
- **Don't** agregar navegación a rutas que todavía no existen (Alquilar,
  Entidades Rurales, Noticias, Ingresar) solo porque el comp las muestra.
- **Don't** mezclar Libre Caslon Text con peso liviano (300/400) en
  titulares grandes — el comp usa 600/700 exclusivamente ahí.
