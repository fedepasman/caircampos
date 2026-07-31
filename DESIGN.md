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

Lo que existe hoy, construido en `apps/web/src/app/page.tsx`. No hay
todavía una librería de componentes en `packages/ui` — esta sección se
expande cuando la haya.

### Buttons

- **Shape:** radio 2px (`rounded-sm`).
- **Primary ("Buscar"):** fondo Harvest Gold Light, texto Field Green,
  semibold. Es el único botón dorado de la página — ver The Scarcity Rule.

### Cards (campos destacados)

- **Corner Style:** 4px (`rounded-md`).
- **Background:** blanco (`neutral.50`), borde sutil `neutral.600`.
- **Encabezado sin foto:** mientras `campos` no tenga columna de imagen ni
  haya carga a R2, el lugar de la foto es un degradé sólido
  `brand.700 → brand.900` — nunca una foto de stock haciéndose pasar por el
  campo real.

### Inputs / Fields

- **Style:** borde 1px `neutral.700`, fondo blanco, radio 2px.
- Todavía sin estado de foco ni error diferenciados — el buscador del hero
  no tiene lógica de validación todavía.

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

### Header

- Barra simple arriba de cada página: wordmark "CAIR" a la izquierda, un
  solo link a la derecha ("Ingresar" o "Mi panel", según haya sesión).
  Server-rendered, no superpuesto sobre la foto del hero como en el comp
  original de Stitch — simplificación deliberada de esta pasada.

### Formulario de ingreso

- Misma paleta de inputs que el resto del sitio (borde `neutral.700`, radio
  2px). Un solo mensaje de error genérico si falla el login ("Email o
  contraseña incorrectos"): nunca decir cuál de los dos campos estuvo mal.

### Panel de socios

- Lista de "Mis campos" (con badge Publicado/Borrador en
  `brand.900`/`neutral.600`, cada fila es un link a su edición) y
  "Consultas recibidas" (con nombre, apellido y teléfono del comprador).
- **Alta y edición de campos:** mismo formulario para ambas
  (`apps/web/src/app/panel/formulario-campo.tsx`), con un selector de
  ubicación en mapa en vez de inputs de latitud/longitud — un clic coloca
  un pin arrastrable (`apps/web/src/components/selector-ubicacion.tsx`).
  Pedirle a una inmobiliaria que tipee grados decimales a mano produciría
  datos basura; el mapa es la única fuente de esas dos columnas.

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
