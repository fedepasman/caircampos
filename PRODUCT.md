# CAIR — Verdad de producto

Qué se construye y para quién. Las reglas técnicas están en [CLAUDE.md](CLAUDE.md).

Documento fuente: `Presupuestos/Solicitud_CAIR.docx`.

---

## Qué es

CAIR es la **Cámara Argentina de Inmobiliarias Rurales**. La plataforma es el
espacio donde sus socios publican campos en venta o arrendamiento y donde el
público general los busca y contacta a la inmobiliaria correspondiente.

CAIR no interviene en la operación comercial: administra la plataforma, aprueba
las publicaciones y mira estadísticas de uso.

---

## Los tres públicos

| Público                | Qué hace                                                                                                         | Qué NO puede hacer                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Socios de CAIR**     | Cargan y administran los campos que publican. Reciben los datos de contacto de quienes consultan por sus campos. | Ver publicaciones ni consultas de otros socios. |
| **Público general**    | Busca campos, los explora en el mapa y contacta a la inmobiliaria. Debe registrarse para ver la ficha completa.  | Publicar.                                       |
| **Administrador CAIR** | Aprueba publicaciones y consulta estadísticas de uso.                                                            | Ver datos personales de los compradores.        |

Esa última celda no es un detalle de permisos: es el compromiso central del
producto. Ver más abajo.

---

## Requisitos que condicionan lo técnico

Cada uno viene del pliego y explica por qué la arquitectura es la que es.

### Punto 6 — App nativa obligatoria

La plataforma debe estar disponible en App Store y Google Play. **Las
soluciones que funcionan solo desde el navegador (PWA) están explícitamente
rechazadas.** También debe ser accesible desde escritorio.

→ Expo + EAS Build/Submit produce binarios reales. No hay atajo por PWA.

### Punto 7 — Posicionamiento en Google

La plataforma debe aparecer al buscar "comprar campo en Argentina" y similares.
El pliego pide describir la estrategia concreta, no solo afirmar que se puede.

→ Renderizado en servidor con Next.js, sitemap dinámico con las fichas de
campos, metadata por publicación. Una SPA no lo resolvería.

### Puntos 8 y 9 — Registro y privacidad de los datos del comprador

Quien quiera ver la ficha completa o contactar a una inmobiliaria debe
registrarse con apellido y nombre, correo y teléfono.

**Esos datos de contacto los recibe únicamente el socio que publicó el campo.**
CAIR recibe solo estadísticas agregadas —cantidad de consultas, tipos de campo
consultados, zonas más buscadas, hectáreas— sin ninguna información personal.

El pliego pide describir **cómo se garantiza técnicamente**. La respuesta:

1. La restricción vive en la base de datos, en políticas RLS, no en el código
   de las aplicaciones. Un bug en una pantalla no puede saltearla.
2. Las estadísticas de CAIR salen de vistas agregadas que no exponen columnas
   con datos personales.
3. Hay tests automatizados (`supabase/tests/`) que fallan el build si alguna
   tabla queda sin RLS, si una vista puede evadirla, o si una política intenta
   autorizar leyendo datos que el propio usuario puede editar.

### Punto 10 — Capacidad de tráfico

Hay que especificar cuánto tráfico simultáneo se soporta y cómo escala ante
picos, sobre todo en lanzamientos y campañas.

### Punto 11 — Hosting, residencia y propiedad de los datos

Hay que especificar dónde está alojada la plataforma y quién es titular de los
datos. **El código fuente es propiedad de CAIR**, y ante un cambio de proveedor
CAIR debe poder migrar sin restricciones.

→ Base de datos: São Paulo (`sa-east-1`), la región disponible más cercana a
Argentina. Todo el stack es portable: PostgreSQL estándar, almacenamiento
compatible con S3 y un framework de código abierto. Nada propietario.

### Punto 13 — Tiempos de respuesta y soporte

Hay que comprometer tiempos de respuesta ante problemas técnicos y explicar
cómo se gestiona una caída.

→ Sin observabilidad no se puede sostener ese compromiso. De ahí Sentry.

### Punto 4 — Carga de campos

El formulario distingue campos obligatorios de opcionales, y no permite
finalizar la carga si falta alguno obligatorio.

### Punto 5 — Mapa interactivo

Visualización de todos los campos publicados con filtro por zona geográfica, y
búsqueda directa sobre el mapa.

---

## Requisitos de las tiendas

Condicionan la aprobación de las apps y conviene tenerlos presentes desde el
diseño, porque descubrirlos al momento de publicar cuesta semanas.

- **Eliminación de cuenta dentro de la app.** Apple exige que toda app que
  permita crear una cuenta permita también eliminarla desde la propia app, no
  solo por mail o por la web.
- **Declaración de datos recopilados.** App Privacy en Apple y Data Safety en
  Google. Esta plataforma recolecta nombre, correo y teléfono: hay que
  declararlo con precisión y que coincida con lo que la app hace de verdad.
- **Política de privacidad accesible**, enlazada desde la ficha de la tienda y
  desde la app.
- **Descripciones de uso de permisos.** Si la app pide ubicación para el mapa,
  el texto que ve el usuario debe explicar para qué, en español.
- **Sign in with Apple**, obligatorio en iOS si se ofrece login con otro
  proveedor externo (Google, Facebook).
- **Paridad de funcionalidad.** Una app que sea solo un contenedor del sitio
  web puede rechazarse por la guideline 4.2 de Apple (mínima funcionalidad).

---

## Diseño

El diseño visual todavía no está definido. Lo produce el flujo `new-work` del
skill `impeccable`, que además genera `DESIGN.md`. Los valores actuales de
`packages/tokens` son placeholders neutros que fijan la estructura, no la
identidad de marca.

Modo de cada superficie:

| Superficie    | Modo         | Qué significa                                             |
| ------------- | ------------ | --------------------------------------------------------- |
| `apps/web`    | **Persuade** | El visitante decide y actúa. El diseño es el producto.    |
| `apps/admin`  | **Operate**  | El visitante completa una tarea. Manda la escaneabilidad. |
| `apps/mobile` | **Operate**  | Ídem, con expectativas nativas de cada plataforma.        |

---

## Idioma

Español de Argentina (`es-AR`) en toda la plataforma. Sin multi-idioma por
ahora. La interfaz usa vocabulario del sector: campo, hectárea, partido,
pedanía, arrendamiento.
