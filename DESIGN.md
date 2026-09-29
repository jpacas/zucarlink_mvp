# Sistema de Diseño — Zucarlink

Este documento es la fuente de verdad del sistema de diseño de Zucarlink: colores,
tipografía, espaciado, layout y los patrones de UI ya implementados en
`src/styles/index.css`. Historial completo de cómo se llegó a esta versión en el
"Log de decisiones" al final — dos direcciones más gráficas se probaron y
rechazaron antes de esta.

## Contexto de producto
- **Qué es:** Red profesional para la industria azucarera.
- **Para quién:** Técnicos de campo, ingenios azucareros y proveedores de insumos/servicios.
- **Rubro / referencias:** B2B / red profesional (LinkedIn-style) cruzado con agtech y marketplaces de insumos (ej. Agrofy, Engormix).
- **Tipo de proyecto:** Web app (dashboard + directorio + foro + mensajería), no sitio de marketing.
- **Lo memorable:** Cercanía y comunidad — Zucarlink debe sentirse como una comunidad de colegas del sector, no como un ERP corporativo frío.

## Dirección estética
- **Dirección:** Limpia y sobria, no gráfica-agresiva. Grid-disciplinado en
  dashboard/directorio (previsibilidad de datos); en foro y perfiles, títulos de
  display grandes (Cirka Bold) marcan la jerarquía en vez de tarjetas uniformes.
- **Nivel de decoración:** Mínimo-intencional. El color de rol se nota (tinte
  suave de fondo + acento de borde), pero nunca satura una superficie completa.
  Sin textura, sin ilustración decorativa, sin bloques de color sólido a
  pantalla completa.
- **Mood:** Sobrio y confiable. El mismo azul marino/eléctrico de siempre hace
  el trabajo — no hace falta más color ni más forma para transmitir cercanía.
- **Referencias:** Agrofy, Engormix (comparables directos en agro/Latinoamérica); LinkedIn (estructura de red profesional).
- **Explícitamente evitado (probado y descartado):**
  - Paleta cálida "tierra" inventada (parchment/verde caña/terracota) + serif
    expresiva adicional (Fraunces) — se sentía como el cliché nuevo de
    "diseño hecho por IA", no como diseño real.
  - Tarjetas de color sólido a pantalla completa (`.content-card--block`) y el
    panel diagonal geométrico en el hero de Home — el usuario los revisó en el
    sitio real y no le convencieron: "muy redondos" los botones, "se
    desperdicia espacio" en los lados, y "no me gustan las tarjetas con
    colores sólidos en toda la tarjeta".

## Patrón central: color por rol
Mecanismo principal para lograr "cercanía y comunidad": de un vistazo se identifica quién es quién en la red.

| Rol | Variable | Color | Uso |
|---|---|---|---|
| Ingenio | `--role-ingenio` | `--brand` #0029E2 | Ingenios azucareros |
| Técnico | `--role-tecnico` | `--accent-green` #0DDB89 | Técnicos de campo |
| Proveedor | `--role-proveedor` | `--accent-orange` #FF724B | Proveedores de insumos/servicios |
| Info | `--role-info` | `--accent-cyan` #00C9FF | Contenido general/informativo |

Cada rol tiene variantes `-soft` (fondo de badge/card) e `-ink`/`-strong` (texto legible sobre fondo claro).

### Tarjeta de rol: tinte suave + acento (`.content-card--tecnico/proveedor/ingenio/info`)
Tratamiento único para toda instancia de card con color de rol, sin distinguir
entre "tile corta" y "contenedor grande" — se probó esa distinción con fondo
sólido en las tiles cortas y resultó más ruido que claridad.

- **Fondo:** tinte opaco del rol al 12% sobre blanco (`var(--role-*-card)`,
  vía `color-mix()`), no el `var(--role-*-soft)` semi-transparente que usan los
  badges — ese es un `rgba()` y deja ver los 4 `radial-gradient` del `<body>`
  por detrás (`background-attachment: fixed`), lo que se leía como si la
  tarjeta tuviera un degradado. El tinte de card tiene que ser opaco.
- **Acento:** borde superior de 5px en el color de rol pleno (`::before`).
- **Texto:** hereda `var(--text)` (navy) normal — el tinte es lo bastante suave
  para no necesitar recalcular contraste.
- Aplica igual en tiles cortas (Home, Proveedores, stats del Directorio) y en
  contenedores grandes (wrapper del Foro, post original de un hilo, "Vista
  previa" del Directorio) — un solo comportamiento, sin reglas especiales por
  tamaño de tarjeta.

## Tipografía
- **Display/Hero:** Cirka Bold (`src/assets/fonts/Cirka-Bold.otf`) — títulos, citas destacadas en perfiles.
- **Body/UI:** Neurial Grotesk, pesos Regular/Medium/Bold/Extrabold (`src/assets/fonts/NeurialGrotesk-*.otf`) — todo el resto.
- **Datos/Tablas:** Neurial Grotesk con `font-variant-numeric: tabular-nums` (ya activo en componentes de stats).
- **Código:** No definido — usar monospace del sistema si surge la necesidad (no hay superficies de código en el producto).
- **Carga:** Self-hosted vía `@font-face` en `src/styles/index.css`, archivos OTF locales. No usar Google Fonts ni CDN externo — son fuentes con licencia propia.
- **Escala:** No hay una escala modular formal en el código; usar `clamp()` para hero (36–56px) y bajar por contexto (28px stat destacado, 22px cita, 16px body, 14px UI, 12px labels/eyebrows).
- **Sin serif adicional:** se probó sumar Fraunces como segunda voz editorial (foro/perfiles/citas) y se descartó junto con la paleta tierra — una sola familia de display (Cirka Bold) es la regla.

## Color
- **Enfoque:** Balanceado, cero colores nuevos. Los mismos 5 colores de marca (navy, azul, verde, naranja, cián) cubren badges suaves y tinte de card — no hay paleta secundaria.
- **Primario:** `--brand-primary` #201747 (Pantone 275 C) — texto principal, marca.
- **Acción/CTA:** `--brand` #0029E2, hover `--brand-strong` #001ec0.
- **Neutrales:** `--bg` #f4f4f6, `--bg-accent` #e0e0ea, `--surface` blanco 95%, `--text-muted`/`--text-soft` como alfas de `--text`. Se evaluó y descartó un fondo "parchment" cálido — el fondo neutro se queda como está.
- **Semántico:** éxito → `--accent-green`/`--role-tecnico-ink`, alerta suave → `--accent-orange`/`--role-proveedor-strong`, error → `--danger` #cc3722, info → `--accent-cyan`/`--role-info-ink`.
- **Modo oscuro:** No implementado, y es una decisión deliberada (SAFE), no una omisión — Zucarlink es una herramienta de uso diurno/de campo donde la legibilidad al aire libre en modo claro importa más que un modo oscuro. Revisar si el uso real (horarios, contexto de uso móvil de noche) contradice esta suposición antes de invertir en modo oscuro.
- **Regla de marca:** No alterar los colores del logo (`<ZucarLogo />`) — lo prohíbe el Manual de Marca.

## Fotografía / avatar
- **Principio:** cuando exista fotografía real de un miembro, es el elemento
  dominante de la card (nunca un ícono genérico). Cuando no exista, el fallback
  de iniciales sobre gradiente `--brand-primary` → `--brand` sigue siendo la
  solución — nunca un placeholder de foto de stock ni ilustración genérica.
- **Hero de Home:** sin panel gráfico decorativo — se probó un bloque diagonal
  geométrico y se descartó (ver Log de decisiones). El hero es texto + CTAs
  sobre el fondo neutro de siempre, sin elemento visual a la derecha.

## Espaciado
- **Unidad base:** 4px.
- **Escala:** `--space-1` a `--space-9` = 4/8/12/16/20/24/32/48/64px.
- **Densidad:** Cómoda — ni compacta (el usuario de campo no siempre usa mouse de precisión) ni espaciosa (es una app de datos, no un sitio editorial puro).

## Layout
- **Enfoque:** Híbrido.
  - **Dashboard/admin/directorio:** grid-disciplinado — columnas predecibles, tablas con `tabular-nums`, sidebar fija. La card de miembro (`.directory-card`) tiene una franja lateral izquierda de 5px (en vez del sliver superior de 3px original) y el avatar subió de 48px a 60px (radio 17px) — más presencia sin romper el grid de 2 columnas.
  - **Foro/perfiles:** título/pregunta grande en Cirka Bold (ya activo vía `.content-card h1`), jerarquía tipográfica marcada en vez de tarjetas uniformes. Los títulos de hilo en la lista (`.forum-thread-list .forum-thread-link`) también usan `var(--font-display)`.
- **Ancho de contenido:** `min(1240px, 100%)` (subido desde 1080px) — el usuario marcó que 1080px dejaba demasiado margen vacío en monitores anchos.
- **Radios:** `--radius-xs` 8px, `sm` 12px, `md` 16px, `lg` 22px, `xl` 28px, `pill` 999px. **Botones, nav links, chips y badges usan `--radius-sm` (12px)**, no pill — se probó pill en todo (`.button`, `.nav-link`, `.chip`, `.route-chip`, `.user-badge`, `.price-tab`, `.forum-action`, `.tag-badge`) y el usuario lo encontró "muy redondo" para el mood sobrio que busca. `--radius-pill` (999px) se queda reservado para elementos genuinamente circulares/funcionales: avatares, badges de conteo (`.nav-unread-badge`, `.messages-unread-badge`), toggles, barras de progreso, anillos.
- **Sombras:** `--shadow-sm/md/lg` ya definidas, usar en vez de bordes duros para elevar cards de perfil/foro.

### Responsive
- **Breakpoints:** `max-width: 640px` (mobile), `820px` (tablet/mobile grande), `1024px` — ad-hoc, no hay una escala formal más allá de estos 3 puntos. Reusar estos, no introducir valores nuevos sin necesidad.
- **Padding de cards** (`.hero-card`, `.content-card`, `.auth-card`): `clamp(20px, 5vw, 32px)` — fluido en vez de un salto fijo por breakpoint.
- **Título de hero:** `clamp(2rem, 6vw, 4.2rem)`.
- **CTAs del hero de home:** solo la primaria va a ancho completo en mobile/tablet; las otras dos comparten una fila compacta (`.hero-card--home .actions`). El patrón genérico `.actions .button { width:100% }` sigue aplicando tal cual al resto del sitio — no tocar eso sin revisar los ~65 usos de `.actions` primero.
- **Tarjetas en `.section-grid`:** `align-content: start` en `.content-card` para que el contenido no se estire cuando una tarjeta hermana es más alta.

## Motion
- **Enfoque:** Minimal-funcional. Transiciones de 120–150ms en `ease` sobre bordes/fondos/color, sin coreografía ni scroll-driven animation.
- **Rationale:** Coherente con un producto usado en el campo, potencialmente con conexión más lenta o dispositivos de gama media.
- **Riesgo a futuro (no implementado aún):** Micro-interacción cálida puntual en momentos de comunidad (nueva respuesta de foro, nueva conexión) usando el color de rol correspondiente. Evaluar solo si hay evidencia de que el producto se siente "frío" en uso real — dado que ya se descartaron dos direcciones más gráficas por sentirse excesivas, tratar esto con el mismo criterio conservador antes de implementar.

## Patrones de UX

Relevado directamente de los componentes existentes (`AppHeader`, `Breadcrumbs`,
`AttachmentInput`/`AttachmentPreviewList`/`AttachmentView`, `src/lib/media-storage.ts`).
Documenta lo que ya funciona para que no se reinvente distinto en cada feature nueva.

### Navegación
- **Header fijo** (`AppHeader.tsx`): logo a la izquierda, nav a la derecha. En mobile colapsa a menú hamburguesa con backdrop (`.nav-backdrop`) que cierra al tocar afuera o al navegar.
- **Links contextuales por tipo de cuenta:** el proveedor ve "Panel / Directorio / Perfil comercial / Solicitudes"; el resto ve "Panel / Directorio". Los servicios públicos (Foro, Información, Proveedores) se agregan sin duplicar rutas ya presentes en la cuenta. Mantener esta lógica de deduplicación al agregar nuevos links — no listar la misma ruta dos veces.
- **Estado activo:** `NavLink` con clase `nav-link--active`; usar `end` en rutas raíz (`/app`) para que no quede "activa" en todas las subrutas.
- **Badge de no leídos:** contador visual solo en "Mensajes" (`nav-unread-badge`), condicionado a que la cuenta no sea `provider`. Reutilizar este patrón para cualquier otro contador futuro, no inventar un tratamiento nuevo.
- **Menú de usuario:** trigger circular con avatar (o iniciales de fallback), dropdown con email, links de cuenta, y "Cerrar sesión" separado por un divisor y en rojo (`--danger`) al final. Cierra con click-outside.
- **Breadcrumbs:** componente propio (`Breadcrumbs.tsx`) para rutas profundas — último ítem sin link y con `aria-current="page"`.

### Botones — jerarquía de 4 niveles
1. **Primario** (`.button`): relleno `--brand`, radio `--radius-sm` (12px), `min-height: 46px` — la acción principal de la pantalla, una sola por contexto.
2. **Secundario** (`.button--secondary`): outline azul, fondo transparente — acción alternativa, no destructiva.
3. **Ghost** (`.button--ghost`): fondo sutil gris translúcido, sin borde — acciones terciarias (cancelar, cerrar).
4. **Danger** (`.button--danger`): relleno rojo — solo para acciones destructivas/irreversibles.
- **Tamaño compacto:** `.button--sm` (`min-height: 34px`) para toolbars y contextos densos (ej. `AttachmentInput` variante `button`). **Excepción:** el CTA "Conectar" del directorio (`.directory-card__public-cta .button--sm`) se sube a 44px — es la acción más repetida de la página más densa del sitio y 34px quedaba bajo el mínimo táctil (hallazgo de `/design-review`). No bajar de 44px ahí aunque se reutilice `--sm` en otros lugares.
- **CTAs por rol — ya implementado, extender, no reinventar:** `.button--tecnico` (verde) y `.button--proveedor` (naranja) sobrescriben el color de fondo cuando la acción es específica de ese rol. El azul sigue siendo el primario global cuando la acción no es rol-específica. Combinable con `--secondary` para la variante outline por rol.

### Medios: fotos, videos y archivos
- **Límites de tamaño (`src/types/storage.ts`, `src/lib/media-storage.ts`):** imágenes hasta 10MB (se re-escalan a un máximo de 1600px antes de subir), videos hasta 50MB, documentos (PDF/DOCX/XLSX) hasta 20MB. Máximo 6 adjuntos por mensaje (`MAX_ATTACHMENTS_PER_MESSAGE`).
- **Selector de adjuntos** (`AttachmentInput`): variante `icon` (📎 solo, para composer de mensajes) o `button` (📎 + label, para formularios). Se deshabilita automáticamente al llegar al límite de adjuntos.
- **Preview antes de enviar** (`AttachmentPreviewList`): chips en fila horizontal con scroll (`overflow-x: auto`) — el layout no debe reflowar ni crecer en alto al agregar adjuntos. Thumbnail 28×28px para imágenes, ícono emoji por tipo (🎬 video, 📄 PDF, 📝 Word, 📊 Excel) para el resto. Botón "×" para quitar.
- **Vista de adjuntos ya enviados** (`AttachmentView`): imágenes y videos con `max-height: 320px`, `object-fit: contain`, fondo `--surface-alt` de relleno; documentos como link con ícono + nombre. Siempre mostrar nombre de archivo + tamaño cuando estén disponibles.
- **Avatares — escala jerárquica por contexto**, `border-radius` proporcional al tamaño (más chico = más redondeado relativo):
  | Contexto | Tamaño | Radio |
  |---|---|---|
  | Perfil (`avatar-card`) | 88×88px | 24px |
  | Card de directorio | 60×60px | 17px |
  | Mensajes/compacto (`--sm`) | 36×36px | proporcional |
  | Header (nav-user-trigger) | 40×40px | circular |
  - Fallback: iniciales sobre color plano `--brand-primary` (navy). Antes era
    un degradado navy→azul — se aplanó junto con el resto de gradientes de
    card (ver Log de decisiones, Ronda 5). Mantener este fallback en
    cualquier superficie nueva que muestre avatar — nunca un ícono genérico
    de usuario, y nunca volver a un degradado.

## Riesgos deliberados de esta propuesta
1. **Extender el color por rol a tinte de fondo (no solo badges y botones)** — versión moderada del riesgo original. Se probó la versión extrema (fondo sólido a pantalla completa) y se retrocedió a tinte 10-12%; ese es el punto de equilibrio actual entre "se nota el rol" y "sobrio".
2. **Card de directorio con avatar más grande + franja lateral** en vez de tarjeta uniforme plana — más presencia visual sin llegar a una foto dominante (descartado: con la mayoría de perfiles usando fallback de iniciales, un bloque de color gigante sin foto real se veía más vacío que confiado).
3. **Cero paleta secundaria, una sola familia tipográfica, radios discretos (no pill) en toda la UI interactiva** — la combinación de restricciones que quedó tras dos rondas de rechazo. Cuesta más lograr personalidad con menos herramientas, pero es la que el usuario confirmó como la que sí quiere.

## Log de decisiones
| Fecha | Decisión | Rationale |
|---|---|---|
| 2026-08-29 | Creación inicial de DESIGN.md | Formaliza el Manual de Marca ya implementado (CLAUDE.md) + investigación de comparables (Agrofy, Engormix, B2B/agtech) vía `/design-consultation`. Documenta el patrón de color-por-rol no explicitado antes, y define modo oscuro (no) y motion (minimal-funcional) como decisiones explícitas en vez de omisiones. |
| 2026-08-29 | Agregada sección "Patrones de UX" | A pedido explícito del usuario, se amplió el alcance más allá de lo visual a navegación, jerarquía de botones y manejo de medios. Se descubrió que el patrón color-por-rol ya se extiende a botones (`.button--tecnico`/`.button--proveedor`), no solo a badges. |
| 2026-08-29 | Fix responsive: padding fluido, título de hero más chico en mobile, CTAs de home no apiladas, `align-content:start` en content-card | El usuario reportó que los tamaños se sentían "demasiado grandes". Verificado con `browse` en 375/768/1280px y corregido. |
| 2026-09-29 | `/design-review`: hallazgos de touch target (Conectar 34px en directorio), datos de prueba visibles en directorio público, auth pages con espacio vacío en desktop | Auditoría de análisis solamente (sin fix loop), a pedido explícito. Reporte en `~/.gstack/projects/jpacas-zucarlink_mvp/designs/design-audit-20260929/`. |
| 2026-09-29 | Ronda 1 de rediseño (descartada): "cuaderno de campo" — Fraunces + paleta tierra inventada (parchment/verde caña/terracota) | Pedido explícito de cambio sustancial, "amigable", "que no huela a IA". Investigación de mercado + 2 voces externas (Codex + subagente Claude) convergieron en esta dirección — y resultó ser precisamente el nuevo cliché de IA (serif expresiva + paleta tierra + textura papel). El usuario la rechazó apenas vista en preview HTML, antes de tocar código real. Lección: convergencia entre fuentes no garantiza originalidad. |
| 2026-09-29 | Ronda 2 de rediseño (descartada tras revisión en vivo): bloques de color sólido a pantalla completa, panel diagonal en el hero de Home, ledger de directorio | Segunda propuesta (cero colores nuevos, una sola tipografía) aprobada en preview HTML e implementada en Home/Directorio/Proveedores. El usuario la revisó en el sitio real corriendo (`localhost:5173` vía túnel SSH) y no quedó convencido: botones "muy redondos", espacio "desperdiciado" en los lados (el contenedor de 1080px en monitores anchos), y rechazo explícito a "las tarjetas con colores sólidos en toda la tarjeta". Lección: un preview HTML aislado no sustituye ver el cambio en el sitio real con su propio contenido y viewport. |
| 2026-09-29 | Ronda 3: revertir bloques sólidos y panel diagonal → tinte de rol 10-12% + acento de 5px; radio de botones/chips/badges de pill (999px) a discreto (`--radius-sm`, 12px); ancho de contenido de 1080px a 1240px | Implementa el feedback puntual de la Ronda 2 sin volver a proponer una dirección completa nueva. Se mantienen las mejoras no-estéticas de la Ronda 2: CTA "Conectar" a 44px (touch target), avatar de directorio a 60px, franja lateral en vez de sliver superior, título de hilo de foro en fuente display. |
| 2026-09-29 | Ronda 4: tinte de card de `rgba()` semi-transparente a opaco (`--role-*-card` vía `color-mix()`) | El usuario, revisando el sitio real, reportó "gradientes en algunas tarjetas". Causa: `--role-*-soft` (pensado para badges chicos) usado como fondo de card completa deja ver los 4 `radial-gradient` del `<body>` por detrás. Fix: tokens opacos nuevos solo para fondo de card; `--role-*-soft` sigue igual para badges/chips donde no es un problema. |
| 2026-09-29 | Ronda 5 (vigente): avatar-fallback (iniciales), `.nav-user-trigger` y `.provider-logo--fallback` de degradado navy→azul a `var(--brand-primary)` plano | El usuario seguía viendo "gradientes en las tarjetas del directorio" después de la Ronda 4 — el fondo de card ya estaba arreglado, lo que quedaba era el degradado de los círculos de iniciales (visible en casi todas las cards del directorio que no tienen foto real). Se aplanó en las 3 variantes que compartían el mismo degradado para no dejar una inconsistente. |
