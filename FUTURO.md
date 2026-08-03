# CAIR — Funcionalidades futuras

Ideas discutidas y ya investigadas, pero no implementadas todavía. El
objetivo de este archivo es no perder el contexto entre sesiones: cada
entrada tiene que traer lo suficiente como para implementarla sin
tener que re-investigar desde cero.

**Regla de mantenimiento:** cuando se implementa algo de acá, se borra
la entrada (no se tacha ni se archiva — la implementación queda en el
código y en el historial de git, no hace falta duplicarla acá).

---

## Migrar los 1220 avisos de campos desde caircampos.org (WordPress viejo)

CAIR tiene 1220 avisos publicados en su sitio actual (WordPress,
`caircampos.org` — más de lo que se estimaba a ojo, "~400"), sin
exportación estructurada disponible. Antes de dar de baja el sitio viejo
hay que migrar todos los avisos —texto, ubicación, hectáreas,
instalaciones, datos del socio responsable y galería de fotos— a la base
nueva. Ya se investigó tanto el sitio viejo como el schema real de destino
lo suficiente como para implementarlo sin tener que re-investigar desde
cero.

Decisiones ya tomadas con el usuario: se migran los 1220 avisos (no sólo
los recientes); la ubicación se geocodifica automático con Mapbox; los
campos importados quedan `publicado = false` para que CAIR los revise
antes de publicarlos. `caircampos.org` es propiedad de CAIR — el
`robots.txt` bloquea bots de IA por nombre (incluido ClaudeBot), casi
seguro una regla genérica de Cloudflare "Block AI bots" y no un impedimento
real para este uso autorizado por el propio dueño del sitio.

### Hallazgos del sitio viejo (verificados con `curl`, no con el fetcher

por defecto — ese da 403 por el WAF de Cloudflare; con un User-Agent de
navegador normal responde 200 sin problema)

- WordPress + Elementor, custom post type `campos`, con REST API
  habilitada: `GET https://caircampos.org/wp-json/wp/v2/campos?page=N&per_page=100`
  da `X-WP-Total: 1220` (13 páginas con `per_page=100`) — sirve para
  **enumerar** todos los avisos (id/slug/link/fecha) sin depender del
  listado público (`/ofertas-de-campos-2/`, que se arma client-side y no
  sirve para esto).
- El REST API **no expone custom fields** (no hay `/wp-json/acf/v3/...`,
  el schema de `OPTIONS` no tiene `meta`). Sólo da `id, slug, link, date,
title, content(HTML), status`. Los campos reales hay que sacarlos del
  HTML renderizado de cada ficha.
- Selectores estables verificados en 3 fichas de muestra (con y sin
  "Partido", con y sin "Instalaciones"):
  - `h1.post-title` → título
  - `p.post-date` → `"Publicado el: DD/MM/YYYY"`
  - `h1.loop-title` → `"Campo {Aptitud} en Venta en {PROVINCIA}"` (aptitud
    en texto libre: `"Ganadero"`, `"Mixto"`, `"Ganadero-Otros"`, etc. — no
    es un enum limpio, hay que mapearlo a mano)
  - 4 cajas `.w-box`: **UBICACION** (`"LOCALIDAD, PARTIDO, PROVINCIA"`),
    **HECTAREAS** (`"38500 Has."`), **APTITUDES** (texto libre),
    **RESPONSABLE** (nombre del socio)
  - Columna derecha `.grid-contacto`: pares `h4.section-title` + `p`/`div`
    para `Localidad`, `Partido / Depto / Pedanía` (falta en algunas),
    `Responsable` (`"NOMBRE - TEL1 / TEL2"`), `Descripción del campo:`
    (uno o más `<h5>`, texto libre — líneas tipo `"Receptividad: ..."` son
    convención informal de algunos socios dentro del texto libre, no
    campos estructurados reales), `Instalaciones:` (opcional)
  - Galería: slider Jssor, `img[data-u="image"]` con URLs absolutas a
    `wp-content/uploads/...`, descargables sin auth
  - Sin precio en ninguna ficha vista — el dato no existe en el sistema
    viejo, `precio_usd` queda `null` en casi todos los registros
  - Sin coordenadas — sólo texto libre de ubicación, de ahí la
    geocodificación con Mapbox
  - El formulario de contacto oculto de cada ficha trae, en inputs
    `hidden`: `email_responsable` (email real del socio), `responsable`
    (ID numérico legado de WordPress, no resoluble por REST público — da
    401), `nombre_responsable`. Permite agrupar avisos por socio real y
    recuperar su email, aunque `socios` no tiene columna de email (ver
    abajo) — va a un reporte aparte para cuando CAIR dé de alta esa cuenta.
  - Algunos campos cruzan provincias en el texto libre (ej. "40000 has en
    Chubut y 32000 has en Río Negro") — quedan con la provincia principal
    (la del título/breadcrumb) y una nota, no se intenta partir en dos
    registros.

### Esquema real de destino (ya en el repo — `supabase/schemas/01_socios.sql`,

`02_campos.sql`, `07_campo_fotos.sql`, `packages/schemas/src/index.ts`)

- **`public.socios`**: `nombre` (obligatorio), `nro_socio` (nullable, sólo
  lo asigna CAIR), `telefono`, `pais`, `provincia`/`localidad`
  (opcionales), `latitud`/`longitud` (opcionales), `usuario_id` (nullable —
  CAIR ya carga socios sin cuenta vinculada todavía, el vínculo se agrega
  después). **No tiene columna de email.**
- **`public.campos`**: `socio_id` (obligatorio — no existe "campo sin
  socio"), `titulo`, `descripcion`, `hectareas` (`numeric > 0`),
  `precio_usd` (nullable), `provincia`/`localidad` (texto libre,
  obligatorios pero sin FK/enum), `modalidad`
  (`'venta'|'arrendamiento'`), `tipo_campo` (**sólo**
  `'agricola'|'ganadero'|'mixto'`, sin "otros"), `latitud`/`longitud`
  (**obligatorios, con `check` de rango** — sin geocodificación exitosa el
  registro no se puede insertar), `publicado` (default `false`, que es
  justo lo que se decidió para la migración).
- **`public.campo_fotos`**: `campo_id`, `object_key` (ruta dentro del
  bucket R2, formato `campos/{campo_id}/{uuid}-{nombre}`, nunca una URL
  completa), `orden`.
- La Edge Function `subir-foto-campo` verifica por JWT que quien sube es
  dueño real del campo — pensada para un socio logueado subiendo su propia
  foto, no sirve para una carga masiva administrativa (la mayoría de los
  socios migrados no van a tener cuenta todavía). Para este import puntual
  conviene subir directo a R2 con las mismas credenciales de servidor que
  usa esa Edge Function (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, en
  `supabase/functions/.env`, nunca commiteadas), con `@aws-sdk/client-s3`
  (ya en el catálogo), respetando la misma convención de `object_key`.
- Ya existe un precedente directo de "generar un lote e insertarlo por
  SQL" en `scripts/generar-lote-demo.mjs` + la sección "Generar un lote de
  datos de demo" de `OPERACIONES.md`: un script Node que emite SQL crudo
  por stdout (con `\gset` de `psql` para encadenar los `id` generados de
  socio → campo → foto dentro de `begin;...commit;`), cargado después con
  `docker exec -i supabase_db_CAIR psql ...` en local. La migración debería
  seguir este mismo patrón en vez de un flujo nuevo con el cliente de
  Supabase.

### Diseño: 4 scripts en `scripts/migracion-caircampos/`

1. **`extraer.mjs`** — enumerar los 1220 posts vía REST (13 requests),
   bajar cada ficha con concurrencia acotada (~5 simultáneos, con delay) y
   parsear con `cheerio` usando los selectores de arriba. Salida:
   `raw/campos.ndjson` + `raw/errores.log`.
2. **`transformar.mjs`** — parsear hectáreas a número; mapear aptitud
   cruda → `tipo_campo` contra una tabla explícita (lo que no matchee va a
   revisión); `modalidad = 'venta'` por default con override si el texto
   menciona alquiler/arrendamiento; limpiar mayúsculas de
   provincia/localidad; geocodificar con Mapbox (lo que no geocodifique
   con confianza razonable va al reporte de pendientes, no se inventa un
   punto aproximado); agrupar por responsable y matchear contra
   `socios.nombre` reales ya cargados, o crear socio nuevo sin
   `usuario_id`; validar cada registro contra `esquemaCampo`/`esquemaSocio`
   de `@cair/schemas` (no reimplementar validación). Salida:
   `transformado/aptos.ndjson`, `transformado/socios-nuevos.ndjson`,
   `reportes/pendientes-revision.csv`,
   `reportes/emails-socios-nuevos.csv`.
3. **`subir-fotos.mjs`** — bajar cada imagen vieja y subirla a R2 con
   `@aws-sdk/client-s3` y las credenciales de servidor, misma convención
   de `object_key` que la Edge Function. Salida:
   `transformado/fotos-por-campo.json`.
4. **`generar-sql.mjs`** (mismo patrón que `generar-lote-demo.mjs`) — emite
   el `.sql` final con los inserts encadenados por `\gset`, `campos` con
   `publicado = false` (así el trigger `antes_de_guardar_campo` ni se
   dispara y queda `revisado_por_cair = 'pendiente'`, que es lo correcto:
   CAIR aprueba desde el admin antes de publicar).

### Verificación al implementar

1. `extraer.mjs` primero contra una muestra chica (10-20 avisos, con
   formatos distintos a propósito) y revisión manual del NDJSON contra las
   fichas reales, antes de correrlo contra las 1220.
2. `transformar.mjs` sobre esa muestra, revisar `pendientes-revision.csv`
   a mano.
3. Las 4 fases sobre la muestra completa, cargar el SQL resultante contra
   la base **local** (mismo comando que el flujo de datos de demo) y
   verificar en `apps/admin` que las fichas se ven bien: galería, ubicación
   en el mapa, datos del socio.
4. Recién después de validar la muestra de punta a punta, correr las 4
   fases sobre el total de 1220 avisos — siempre a local primero.
5. `pnpm db:test` una vez sobre el resultado, para confirmar que nada de
   la migración deja un estado que rompa un guardrail de RLS (por ejemplo,
   un campo `publicado = true` sin querer).
6. La carga contra producción real es manual y con revisión humana
   explícita: el mismo `.sql` generado, corrido a mano por una persona
   después de revisar el reporte de pendientes y la muestra en local — no
   es algo para automatizar de punta a punta.

---

## Transformación de imágenes de Cloudflare (`/cdn-cgi/image/...`) para las fotos de campo

Prioridad baja: con la compresión al subir (`comprimirImagen`,
`apps/web/src/app/panel/subida-fotos.tsx`) ya se logran pesos razonables
(~830KB para una foto de celular de varios MB, redimensionada a 2000px de
lado) sin depender de esto. Se investigó y se dejó preparado el camino,
pero no vale la fricción de habilitarlo todavía.

**Estado a 2026-08-03**: el dominio propio ya está conectado y andando
(`fotos.fedepasman.com`, agregado como Custom Domain en R2 y activo — se
confirmó con un smoke test que sirve el original correctamente:
`200 OK`, `content-length` real, headers de Cloudflare presentes). El
bloqueo real es otro: la transformación de imágenes ya no es la vieja
función standalone "Image Resizing" de Speed → Optimization —Cloudflare la
fusionó con el producto **Cloudflare Images**, y activarla en el
dashboard (`Speed → Settings → Image Optimization → Image Transformations`)
pide comprar/activar ese producto ("Purchase Images Plan"), lo que implica
cargar una tarjeta en la cuenta de Cloudflare. Según la documentación
oficial (`developers.cloudflare.com/images/pricing`) seguiría siendo
gratis dentro de las 5000 transformaciones únicas/mes (no se paga
almacenamiento ni entrega porque los originales quedan en R2, no en
Cloudflare Images) — pero requiere esa activación formal, que el usuario
prefirió no hacer por ahora dado que la compresión al subir ya alcanza.

Con el flag apagado (`CDN_CGI_HABILITADO = false` en
`apps/web/src/lib/url-foto-campo.ts`), un smoke test contra
`fotos.fedepasman.com/cdn-cgi/image/width=640,quality=80,format=auto/<object_key>`
dio `404` — confirma que el dominio sirve bien pero la transformación en sí
no está habilitada en la cuenta.

**Camino para reactivarlo cuando se decida activar Cloudflare Images**:

1. En el dashboard de Cloudflare (nivel cuenta, no el de una zona
   puntual) → **Images → Transformations**, habilitar transformaciones
   para la zona `fedepasman.com` (esto es lo que pide cargar una tarjeta).
2. Repetir el smoke test: `curl -sI` contra la URL original vs.
   `https://fotos.fedepasman.com/cdn-cgi/image/width=640,quality=80,format=auto/<object_key>`
   con un `object_key` real — confirmar `200`, `content-type` distinto
   (`webp`/`avif`) o `content-length` notoriamente menor, y el ancho real
   de píxeles acorde al pedido.
3. Si pasa: en `apps/web/src/lib/url-foto-campo.ts`, cambiar
   `CDN_CGI_HABILITADO` a `true` — no hace falta recablear ninguno de los
   8 lugares que ya usan el helper (panel de subida, ficha de detalle,
   listado de `/campos`, home, popup del mapa).
4. Actualizar `NEXT_PUBLIC_R2_PUBLIC_URL` a `https://fotos.fedepasman.com`
   en `.env.local` y en Vercel (Preview primero, después Production).

---

## Resultados dinámicos según el viewport del mapa (estilo Airbnb) en `/campos`

En `/campos`, el mapa y la grilla de resultados muestran hoy el mismo
conjunto fijo: lo que trajo el filtro del sidebar, calculado una sola
vez en el servidor. Mover o hacer zoom en el mapa no cambia lo que se
ve abajo. La idea es que, como en Airbnb, la grilla se actualice sola
para mostrar solo los campos visibles en el área actual del mapa, sin
recargar la página.

### Por qué es viable sin gran esfuerzo

La escala del dato lo hace simple: ~160-300 campos en total, ya
cargados enteros en el mapa hoy (sin paginar). No hace falta traer
nada nuevo por red — alcanza con filtrar en memoria el array que el
mapa ya tiene, exactamente el mismo patrón que ya usa
`apps/web/src/components/buscador-mapa.tsx` (la búsqueda de la home)
para filtrar por provincia. Ese componente además cita textualmente la
regla de CLAUDE.md que habilita esto ("TanStack Query (o estado local,
como acá) es válido para el filtrado interactivo del mapa, no para el
listado público en sí") — sería la segunda aplicación del mismo patrón
ya aceptado, no una excepción nueva. **No hace falta TanStack Query,
ni un RPC de bounding-box, ni ningún refetch.**

El filtro de zona circular existente (`BuscadorPorRadio`, botón
"Buscar en esta zona") no debería cambiar: que siga siendo una
navegación completa vía `router.push`. El seguimiento de viewport es
un mecanismo aparte, para la navegación libre del mapa (cuando no se
está seleccionando zona ni hay una ya aplicada).

### Diseño

1. **`apps/web/src/lib/campos.ts` (nuevo)** — saca a un solo lugar lo
   que hoy está definido dos veces e incompleto: `SELECCION_CAMPOS`
   (hoy inline en `page.tsx`) y el tipo de fila (`CampoParaMapa` en
   `mapa-campos.tsx`, al que le faltan `provincia`/`localidad`/
   `modalidad`/`tipo_campo`, que la tarjeta sí necesita). Nombrarlo
   `CampoTarjeta`. `created_at` queda solo en el string SQL (hace
   falta para poder ordenar por "Más recientes"), nunca en el tipo:
   no se usa en ninguna tarjeta.

2. **`apps/web/src/components/campo-card.tsx` (nuevo)** — extrae tal
   cual el `<li>` de la tarjeta que hoy vive inline en `page.tsx`
   (foto, título, precio, ubicación, hectáreas/tipo/modalidad, botón
   "Ver Detalles"). Sin `'use client'` — no tiene interactividad
   propia.

3. **`apps/web/src/components/mapa-campos.tsx`**:
   - Reemplaza `CampoParaMapa` por `CampoTarjeta` importado de
     `@/lib/campos`.
   - Nuevo prop `onCambiarBounds?: (bounds: mapboxgl.LngLatBounds) => void`,
     enroscado con el mismo patrón de ref que ya existe para
     `onClicMapaRef` — no debe entrar en las deps del `useEffect` que
     reconstruye el mapa completo (ese sigue disparando solo por
     `[campos]`).
   - En el handler de `mapa.on('moveend', ...)`: agregar, después de
     `actualizarMarcadoresIndividuales()`, un chequeo de
     `evento.originalEvent` antes de llamar a
     `onCambiarBoundsRef.current`. **Es necesario, no cosmético**:
     confirmado leyendo el código fuente de `mapbox-gl` —
     `fitBounds()` (el que ya corre al montar, para encuadrar todos
     los campos) dispara `moveend`/`zoomstart` sin `originalEvent`,
     porque no pasa `eventData`; en cambio arrastrar, hacer
     scroll-zoom, pinch, doble clic o usar el teclado sí lo incluyen,
     porque Mapbox reenvía el evento DOM original como `eventData` en
     esos casos. Sin este chequeo, la grilla se recortaría al
     viewport inicial apenas carga la página, antes de que el usuario
     toque nada:
     ```ts
     mapa.on('moveend', (evento) => {
       actualizarMarcadoresIndividuales();
       if (!evento.originalEvent) return;
       onCambiarBoundsRef.current?.(mapa.getBounds());
     });
     ```
   - El clic en una burbuja de cluster (`mapa.easeTo({ center, zoom })`)
     tampoco pasa `eventData` hoy, así que ese `moveend` tampoco
     llevaría `originalEvent` — y hacer zoom entrando a un cluster es
     justo un gesto de exploración que sí debería refrescar la
     grilla. Arreglarlo pasando el evento como segundo argumento:
     `mapa.easeTo({ center: ..., zoom }, evento)`.

4. **`apps/web/src/components/buscador-por-radio.tsx`**:
   - Nuevo prop `onCambiarBounds?: (bounds: mapboxgl.LngLatBounds) => void`.
   - Ya calcula `zonaActiva` y tiene `modoSeleccion` en estado local —
     es el dueño natural de cuándo el seguimiento de viewport tiene
     sentido. Se lo pasa a `MapaCampos` solo cuando no se está
     seleccionando una zona ni hay una aplicada:
     `onCambiarBounds={modoSeleccion || zonaActiva ? undefined : onCambiarBounds}`.

5. **`apps/web/src/components/resultados-campos.tsx` (nuevo, Client
   Component)** — reemplaza el bloque que hoy vive directo en
   `page.tsx`: el mapa (`BuscadorPorRadio`), el encabezado de
   resultados, y la grilla. Estado `camposEnViewport:
CampoTarjeta[] | null` (`null` = sin recorte, mostrar todo — es lo
   que mantiene el primer render del cliente idéntico al HTML que ya
   mandó el servidor, sin romper SEO ni causar mismatch de
   hidratación). Un `useEffect` que resetea `camposEnViewport` a
   `null` cuando cambia el array `campos` (cualquier navegación:
   filtros nuevos, zona aplicada/quitada) para no dejar pegado un
   recorte de viewport obsoleto. Al mover el mapa, filtra en memoria:

   ```ts
   campos.filter(
     (campo) =>
       campo.latitud >= bounds.getSouth() &&
       campo.latitud <= bounds.getNorth() &&
       campo.longitud >= bounds.getWest() &&
       campo.longitud <= bounds.getEast(),
   );
   ```

   El texto de resultados distingue los dos estados: "N campos
   encontrados" sin recorte, vs. "N de TOTAL campos en esta área del
   mapa" con recorte activo — mismo criterio para el estado vacío
   ("No hay campos en esta área del mapa. Alejá el zoom o movete a
   otra zona." en vez de "No se encontraron campos con estos
   filtros.").

6. **`apps/web/src/app/(sitio)/campos/page.tsx`** — importa
   `SELECCION_CAMPOS`/`CampoTarjeta` desde `@/lib/campos`, reemplaza
   el bloque de `BuscadorPorRadio` + encabezado + `<ul>` por
   `<ResultadosCampos campos={campos ?? []} descripcionFiltros={descripcionFiltros} />`.

### Verificación al implementar

```bash
pnpm --filter @cair/web typecheck
pnpm --filter @cair/web lint
```

A mano en `/campos`:

1. Carga sin filtro de zona: la grilla se ve igual que antes de este
   cambio (mismo conteo, mismo orden).
2. Arrastrar el mapa a una zona con pocos campos: la grilla se
   recorta sola, sin recargar, mostrando "N de TOTAL campos en esta
   área del mapa".
3. Scroll-zoom (no solo arrastrar): confirmar que también dispara el
   recorte — es el caso donde un chequeo de `originalEvent` mal hecho
   fallaría.
4. Clic en una burbuja de cluster para acercar zoom: confirmar que
   también actualiza la grilla (necesita el fix del `easeTo`).
5. Activar "Buscar en una zona" y mover el mapa mientras se elige el
   centro: la grilla NO debe cambiar por eso.
6. Con una zona ya aplicada, mover el mapa: la grilla debe seguir
   mostrando los resultados de la zona, sin recortarse por viewport.
7. Cambiar un filtro del sidebar: confirmar que no queda pegado un
   recorte de viewport de antes.
8. Alejar el zoom hasta 0 campos visibles: confirmar el mensaje
   distinto de vacío.
